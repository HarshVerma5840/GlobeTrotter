"""
Collaboration tests (B12, CONTRACTS §7.3) + admin analytics (B13).

The security half matters more than the feature half. B12 is the only
change in this project that WIDENS trip access, so these tests pin the
boundary CONTRACTS §5 draws: a collaborator may edit the itinerary, but
may never publish the trip or manage the collaborator list.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models.activity import Activity, ActivityCategory
from app.models.city import City
from app.models.user import User, UserRole

pytestmark = pytest.mark.asyncio


async def signup(client, email, name="Test User"):
    await client.post(
        "/auth/signup", json={"email": email, "password": "hunter2hunter2", "name": name}
    )
    resp = await client.post(
        "/auth/login", data={"username": email, "password": "hunter2hunter2"}
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest_asyncio.fixture
async def catalog(db_session):
    city = City(name="Porto", country="Portugal", latitude=41.15, longitude=-8.61, popularity=70)
    db_session.add(city)
    await db_session.flush()
    act = Activity(
        name="Port cellar tour",
        city_id=city.id,
        category=ActivityCategory.food,
        cost=Decimal("25.00"),
    )
    db_session.add(act)
    await db_session.commit()
    return {"city": city, "activity": act}


@pytest_asyncio.fixture
async def shared_trip(client, catalog):
    """A trip owned by `owner@x`, with `mate@x` added as a collaborator."""
    owner = await signup(client, "owner@x.com", "Olive Owner")
    mate = await signup(client, "mate@x.com", "Mo Mate")

    trip = (
        await client.post(
            "/trips",
            json={"name": "Douro", "date_start": "2026-07-01", "date_end": "2026-07-08"},
            headers=owner,
        )
    ).json()

    stop = (
        await client.post(
            f"/trips/{trip['id']}/stops",
            json={
                "city_id": str(catalog["city"].id),
                "date_start": "2026-07-01",
                "date_end": "2026-07-04",
            },
            headers=owner,
        )
    ).json()

    item = (
        await client.post(
            f"/stops/{stop['id']}/activities",
            json={"activity_id": str(catalog["activity"].id), "scheduled_date": "2026-07-02"},
            headers=owner,
        )
    ).json()

    resp = await client.post(
        f"/trips/{trip['id']}/collaborators", json={"email": "mate@x.com"}, headers=owner
    )
    assert resp.status_code == 201
    return {"owner": owner, "mate": mate, "trip": trip, "stop": stop, "item": item}


# --- collaborator management (owner only) --------------------------------


async def test_owner_can_add_and_list_collaborators(client, shared_trip):
    resp = await client.get(
        f"/trips/{shared_trip['trip']['id']}/collaborators", headers=shared_trip["owner"]
    )
    assert [c["email"] for c in resp.json()] == ["mate@x.com"]


async def test_adding_the_same_collaborator_twice_is_idempotent(client, shared_trip):
    resp = await client.post(
        f"/trips/{shared_trip['trip']['id']}/collaborators",
        json={"email": "mate@x.com"},
        headers=shared_trip["owner"],
    )
    assert resp.status_code == 201
    assert len(resp.json()) == 1


async def test_inviting_an_unknown_email_is_404(client, shared_trip):
    resp = await client.post(
        f"/trips/{shared_trip['trip']['id']}/collaborators",
        json={"email": "ghost@x.com"},
        headers=shared_trip["owner"],
    )
    assert resp.status_code == 404


async def test_owner_cannot_be_added_as_their_own_collaborator(client, shared_trip):
    resp = await client.post(
        f"/trips/{shared_trip['trip']['id']}/collaborators",
        json={"email": "owner@x.com"},
        headers=shared_trip["owner"],
    )
    assert resp.status_code == 422


async def test_owner_can_remove_a_collaborator(client, shared_trip):
    trip_id = shared_trip["trip"]["id"]
    mate_id = (
        await client.get(f"/trips/{trip_id}/collaborators", headers=shared_trip["owner"])
    ).json()[0]["id"]

    resp = await client.delete(
        f"/trips/{trip_id}/collaborators/{mate_id}", headers=shared_trip["owner"]
    )
    assert resp.status_code == 204
    # Access is revoked immediately.
    assert (await client.get(f"/trips/{trip_id}", headers=shared_trip["mate"])).status_code == 403


# --- what a collaborator MAY do ------------------------------------------


async def test_collaborator_can_read_and_edit_the_itinerary(client, shared_trip):
    trip_id, mate = shared_trip["trip"]["id"], shared_trip["mate"]

    assert (await client.get(f"/trips/{trip_id}", headers=mate)).status_code == 200

    added = await client.post(
        f"/trips/{trip_id}/stops",
        json={
            "city_id": shared_trip["stop"]["city_id"],
            "date_start": "2026-07-06",
            "date_end": "2026-07-07",
        },
        headers=mate,
    )
    assert added.status_code == 201

    patched = await client.patch(
        f"/stops/{shared_trip['stop']['id']}", json={"date_end": "2026-07-03"}, headers=mate
    )
    assert patched.status_code == 200


async def test_shared_trip_appears_in_the_collaborators_trip_list(client, shared_trip):
    """CONTRACTS §4: GET /trips returns trips owned by OR shared with you."""
    listed = await client.get("/trips", headers=shared_trip["mate"])
    assert [t["id"] for t in listed.json()] == [shared_trip["trip"]["id"]]


async def test_trip_list_does_not_duplicate_with_several_collaborators(client, shared_trip):
    await signup(client, "third@x.com", "Thea Third")
    await client.post(
        f"/trips/{shared_trip['trip']['id']}/collaborators",
        json={"email": "third@x.com"},
        headers=shared_trip["owner"],
    )
    listed = await client.get("/trips", headers=shared_trip["owner"])
    assert len(listed.json()) == 1  # one row, not one per collaborator


# --- what a collaborator MAY NOT do (the security boundary) --------------


async def test_collaborator_cannot_publish_the_trip(client, shared_trip):
    """CONTRACTS §5: is_public/share_token are owner-only."""
    resp = await client.patch(
        f"/trips/{shared_trip['trip']['id']}",
        json={"is_public": True},
        headers=shared_trip["mate"],
    )
    assert resp.status_code == 403


async def test_collaborator_can_still_edit_other_trip_fields(client, shared_trip):
    """The owner-only gate must cover sharing, not lock editing entirely."""
    resp = await client.patch(
        f"/trips/{shared_trip['trip']['id']}",
        json={"description": "adding notes"},
        headers=shared_trip["mate"],
    )
    assert resp.status_code == 200
    assert resp.json()["description"] == "adding notes"


async def test_collaborator_cannot_manage_the_collaborator_list(client, shared_trip):
    trip_id, mate = shared_trip["trip"]["id"], shared_trip["mate"]
    await signup(client, "fourth@x.com")

    added = await client.post(
        f"/trips/{trip_id}/collaborators", json={"email": "fourth@x.com"}, headers=mate
    )
    assert added.status_code == 403

    mate_id = (
        await client.get(f"/trips/{trip_id}/collaborators", headers=shared_trip["owner"])
    ).json()[0]["id"]
    removed = await client.delete(f"/trips/{trip_id}/collaborators/{mate_id}", headers=mate)
    assert removed.status_code == 403


async def test_a_stranger_still_gets_403(client, shared_trip):
    stranger = await signup(client, "stranger@x.com")
    trip_id = shared_trip["trip"]["id"]
    assert (await client.get(f"/trips/{trip_id}", headers=stranger)).status_code == 403
    assert (
        await client.post(
            f"/itinerary-activities/{shared_trip['item']['id']}/vote",
            json={"value": "up"},
            headers=stranger,
        )
    ).status_code == 403


# --- votes ----------------------------------------------------------------


async def test_vote_upserts_rather_than_stacking(client, shared_trip):
    item_id, mate = shared_trip["item"]["id"], shared_trip["mate"]

    up = await client.post(
        f"/itinerary-activities/{item_id}/vote", json={"value": "up"}, headers=mate
    )
    assert up.json()["vote_score"] == 1
    assert up.json()["my_vote"] == "up"

    # Changing your mind updates the row — it must not add a second vote.
    down = await client.post(
        f"/itinerary-activities/{item_id}/vote", json={"value": "down"}, headers=mate
    )
    assert down.json()["vote_score"] == -1
    assert down.json()["my_vote"] == "down"


async def test_votes_from_two_users_sum(client, shared_trip):
    item_id = shared_trip["item"]["id"]
    await client.post(
        f"/itinerary-activities/{item_id}/vote", json={"value": "up"}, headers=shared_trip["owner"]
    )
    resp = await client.post(
        f"/itinerary-activities/{item_id}/vote", json={"value": "up"}, headers=shared_trip["mate"]
    )
    assert resp.json()["vote_score"] == 2


async def test_clearing_a_vote_returns_to_neutral(client, shared_trip):
    item_id, mate = shared_trip["item"]["id"], shared_trip["mate"]
    await client.post(f"/itinerary-activities/{item_id}/vote", json={"value": "up"}, headers=mate)
    cleared = await client.delete(f"/itinerary-activities/{item_id}/vote", headers=mate)
    assert cleared.json()["vote_score"] == 0
    assert cleared.json()["my_vote"] is None


async def test_invalid_vote_value_is_422(client, shared_trip):
    resp = await client.post(
        f"/itinerary-activities/{shared_trip['item']['id']}/vote",
        json={"value": "sideways"},
        headers=shared_trip["mate"],
    )
    assert resp.status_code == 422


# --- comments -------------------------------------------------------------


async def test_comments_round_trip_between_owner_and_collaborator(client, shared_trip):
    trip_id = shared_trip["trip"]["id"]

    posted = await client.post(
        f"/trips/{trip_id}/comments",
        json={"body": "Can we add a river cruise?"},
        headers=shared_trip["mate"],
    )
    assert posted.status_code == 201
    assert posted.json()["author_name"] == "Mo Mate"

    await client.post(
        f"/trips/{trip_id}/comments", json={"body": "Good idea"}, headers=shared_trip["owner"]
    )

    listed = await client.get(f"/trips/{trip_id}/comments", headers=shared_trip["owner"])
    assert [c["body"] for c in listed.json()] == ["Can we add a river cruise?", "Good idea"]


async def test_empty_comment_is_rejected(client, shared_trip):
    resp = await client.post(
        f"/trips/{shared_trip['trip']['id']}/comments",
        json={"body": ""},
        headers=shared_trip["mate"],
    )
    assert resp.status_code == 422


async def test_stranger_cannot_read_or_post_comments(client, shared_trip):
    stranger = await signup(client, "nosy@x.com")
    trip_id = shared_trip["trip"]["id"]
    assert (await client.get(f"/trips/{trip_id}/comments", headers=stranger)).status_code == 403
    assert (
        await client.post(f"/trips/{trip_id}/comments", json={"body": "hi"}, headers=stranger)
    ).status_code == 403


# --- admin analytics (B13) -----------------------------------------------


async def test_analytics_requires_admin_role(client, shared_trip):
    assert (await client.get("/admin/analytics", headers=shared_trip["owner"])).status_code == 403


async def test_catalog_manager_is_not_enough_for_analytics(client, db_session):
    """Editing the catalog and reading everyone's data are different powers."""
    headers = await signup(client, "cm@x.com")
    user = (await db_session.execute(select(User).where(User.email == "cm@x.com"))).scalar_one()
    user.role = UserRole.catalog_manager
    await db_session.commit()
    assert (await client.get("/admin/analytics", headers=headers)).status_code == 403


async def test_admin_sees_aggregates(client, shared_trip, db_session):
    owner = (await db_session.execute(select(User).where(User.email == "owner@x.com"))).scalar_one()
    owner.role = UserRole.admin
    await db_session.commit()

    body = (await client.get("/admin/analytics", headers=shared_trip["owner"])).json()
    assert body["total_trips"] == 1
    assert body["total_stops"] == 1
    assert body["catalog_cities"] == 1
    assert body["public_trips"] == 0
    assert Decimal(body["total_planned_spend"]) == Decimal("25.00")
    assert Decimal(body["spend_by_category"]["food"]) == Decimal("25.00")
    # All six categories present so a chart has stable slices.
    assert len(body["spend_by_category"]) == 6
    assert body["most_popular_cities"][0]["name"] == "Porto"


async def test_analytics_survives_an_empty_platform(client, db_session):
    """average_stops_per_trip must not divide by zero on a fresh install."""
    headers = await signup(client, "admin@x.com")
    user = (await db_session.execute(select(User).where(User.email == "admin@x.com"))).scalar_one()
    user.role = UserRole.admin
    await db_session.commit()

    body = (await client.get("/admin/analytics", headers=headers)).json()
    assert body["total_trips"] == 0
    assert body["average_stops_per_trip"] == 0.0
