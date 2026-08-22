"""B3 — auth routes per CONTRACTS §3."""
from sqlalchemy import select

from app.models import User

SIGNUP = {"email": "ada@example.com", "password": "hunter2hunter2", "name": "Ada"}


async def signup(client, **overrides):
    return await client.post("/auth/signup", json={**SIGNUP, **overrides})


async def login(client, email=SIGNUP["email"], password=SIGNUP["password"]):
    # OAuth2 password flow: the form field is `username` and carries the email.
    return await client.post("/auth/login", data={"username": email, "password": password})


async def auth_header(client):
    await signup(client)
    token = (await login(client)).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --- signup ---

async def test_signup_returns_201_and_a_bearer_token(client):
    resp = await signup(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


async def test_signup_never_echoes_the_password(client):
    assert SIGNUP["password"] not in (await signup(client)).text


async def test_duplicate_email_is_409_not_500(client):
    await signup(client)
    assert (await signup(client)).status_code == 409


async def test_signup_rejects_bad_email(client):
    assert (await signup(client, email="not-an-email")).status_code == 422


async def test_signup_rejects_short_password(client):
    assert (await signup(client, password="short")).status_code == 422


async def test_signup_rejects_password_over_bcrypt_limit(client):
    # >72 bytes would otherwise be silently truncated by bcrypt.
    assert (await signup(client, password="a" * 73)).status_code == 422


async def test_password_is_stored_only_as_a_bcrypt_hash(client, db_session):
    await signup(client)
    user = (await db_session.execute(select(User))).scalars().one()
    assert user.hashed_password != SIGNUP["password"]
    assert user.hashed_password.startswith("$2b$")


# --- login ---

async def test_login_round_trips_a_token(client):
    await signup(client)
    resp = await login(client)
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"
    assert resp.json()["access_token"]


async def test_login_with_wrong_password_is_401(client):
    await signup(client)
    assert (await login(client, password="wrongwrongwrong")).status_code == 401


async def test_login_with_unknown_email_is_401(client):
    assert (await login(client, email="nobody@example.com")).status_code == 401


async def test_login_failure_does_not_reveal_whether_email_exists(client):
    """Both failure modes must return the identical message (no user enumeration)."""
    await signup(client)
    wrong_pw = await login(client, password="wrongwrongwrong")
    unknown = await login(client, email="nobody@example.com")
    assert wrong_pw.json()["detail"] == unknown.json()["detail"]


# --- /users/me ---

async def test_users_me_requires_a_token(client):
    assert (await client.get("/users/me")).status_code == 401


async def test_users_me_rejects_a_garbage_token(client):
    resp = await client.get("/users/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert resp.status_code == 401


async def test_users_me_returns_the_current_user(client):
    resp = await client.get("/users/me", headers=await auth_header(client))
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == SIGNUP["email"]
    assert body["name"] == "Ada"
    assert body["role"] == "user"      # CONTRACTS §2 default
    assert body["language"] == "en"    # CONTRACTS §2 default
    assert body["saved_cities"] == []


async def test_users_me_never_exposes_the_password_hash(client):
    resp = await client.get("/users/me", headers=await auth_header(client))
    assert "hashed_password" not in resp.json()
    assert SIGNUP["password"] not in resp.text


async def test_signup_login_me_is_one_continuous_round_trip(client):
    """The Wave 0 acceptance check: signup -> login -> authenticated call."""
    assert (await signup(client)).status_code == 201
    token = (await login(client)).json()["access_token"]
    me = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == SIGNUP["email"]


# --- PATCH /users/me ---

async def test_patch_me_updates_name_and_language(client):
    resp = await client.patch(
        "/users/me", json={"name": "Ada L.", "language": "fr"}, headers=await auth_header(client)
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Ada L."
    assert resp.json()["language"] == "fr"


async def test_patch_me_sets_saved_cities(client, db_session):
    from app.models import City

    city = City(name="Lisbon", country="Portugal", latitude=38.72, longitude=-9.14)
    db_session.add(city)
    await db_session.commit()

    headers = await auth_header(client)
    resp = await client.patch("/users/me", json={"saved_city_ids": [str(city.id)]}, headers=headers)
    assert resp.status_code == 200
    assert [c["name"] for c in resp.json()["saved_cities"]] == ["Lisbon"]


async def test_patch_me_requires_auth(client):
    assert (await client.patch("/users/me", json={"name": "X"})).status_code == 401
