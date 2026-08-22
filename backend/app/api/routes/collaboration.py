"""
Collaborative co-planning routes (B12, CONTRACTS §7.3).

The access split enforced here, restated because it is the whole point:

  * Managing the collaborator list  -> OWNER only  (assert_trip_owner)
  * Voting and commenting           -> owner OR collaborator (get_owned_trip)

A collaborator can shape the itinerary but can never publish the trip or
invite further people (CONTRACTS §5).
"""
from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import (
    assert_trip_owner,
    get_current_user,
    get_owned_itinerary_activity,
    get_owned_trip,
)
from app.core.errors import DomainValidationError
from app.db.session import get_db
from app.models.collaboration import Comment, ItineraryVote, VoteValue, trip_collaborators
from app.models.itinerary_activity import ItineraryActivity
from app.models.trip import Trip
from app.models.user import User
from app.schemas.collaboration import (
    CollaboratorAdd,
    CollaboratorRead,
    CommentCreate,
    CommentRead,
    VoteRead,
    VoteWrite,
)

router = APIRouter(tags=["collaboration"])


# --------------------------------------------------------------------------
# Collaborators — owner only
# --------------------------------------------------------------------------


@router.get("/trips/{trip_id}/collaborators", response_model=List[CollaboratorRead])
async def list_collaborators(
    trip: Trip = Depends(get_owned_trip),
) -> List[User]:
    """Readable by any collaborator — you can see who else is on the trip."""
    return list(trip.collaborators)


@router.post(
    "/trips/{trip_id}/collaborators",
    response_model=List[CollaboratorRead],
    status_code=status.HTTP_201_CREATED,
)
async def add_collaborator(
    payload: CollaboratorAdd,
    trip: Trip = Depends(get_owned_trip),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[User]:
    """Invite an existing user by email. Owner only (CONTRACTS §5)."""
    assert_trip_owner(trip, current_user)

    result = await db.execute(select(User).where(User.email == payload.email))
    invitee = result.scalar_one_or_none()
    if invitee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account with that email address.",
        )
    if invitee.id == trip.user_id:
        raise DomainValidationError("The trip owner is already on the trip.")
    if any(c.id == invitee.id for c in trip.collaborators):
        # Idempotent rather than an error — re-inviting is harmless.
        return list(trip.collaborators)

    trip.collaborators.append(invitee)
    await db.commit()
    await db.refresh(trip, attribute_names=["collaborators"])
    return list(trip.collaborators)


@router.delete(
    "/trips/{trip_id}/collaborators/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
async def remove_collaborator(
    user_id: uuid.UUID,
    trip: Trip = Depends(get_owned_trip),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Owner only (CONTRACTS §5) — a collaborator cannot remove anyone."""
    assert_trip_owner(trip, current_user)
    await db.execute(
        delete(trip_collaborators).where(
            trip_collaborators.c.trip_id == trip.id,
            trip_collaborators.c.user_id == user_id,
        )
    )
    await db.commit()


# --------------------------------------------------------------------------
# Votes — owner or collaborator
# --------------------------------------------------------------------------


async def _vote_summary(
    db: AsyncSession, itinerary_activity_id: uuid.UUID, user_id: uuid.UUID
) -> VoteRead:
    rows = await db.execute(
        select(ItineraryVote).where(ItineraryVote.itinerary_activity_id == itinerary_activity_id)
    )
    votes = list(rows.scalars().all())
    mine = next((v for v in votes if v.user_id == user_id), None)
    return VoteRead(
        itinerary_activity_id=itinerary_activity_id,
        vote_score=sum(v.value.score for v in votes),
        my_vote=mine.value.value if mine else None,
    )


@router.post("/itinerary-activities/{itinerary_activity_id}/vote", response_model=VoteRead)
async def cast_vote(
    payload: VoteWrite,
    item: ItineraryActivity = Depends(get_owned_itinerary_activity),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoteRead:
    """
    Up/down vote on a proposed activity.

    Upserts on the unique (itinerary_activity_id, user_id) constraint —
    changing your mind UPDATES your row, it never inserts a second
    (CONTRACTS §2).
    """
    existing = await db.execute(
        select(ItineraryVote).where(
            ItineraryVote.itinerary_activity_id == item.id,
            ItineraryVote.user_id == current_user.id,
        )
    )
    vote = existing.scalar_one_or_none()
    if vote is None:
        db.add(
            ItineraryVote(
                itinerary_activity_id=item.id,
                user_id=current_user.id,
                value=VoteValue(payload.value),
            )
        )
    else:
        vote.value = VoteValue(payload.value)

    await db.commit()
    return await _vote_summary(db, item.id, current_user.id)


@router.delete("/itinerary-activities/{itinerary_activity_id}/vote", response_model=VoteRead)
async def clear_vote(
    item: ItineraryActivity = Depends(get_owned_itinerary_activity),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoteRead:
    """Withdraw your vote. Absent row is the neutral state — there is no `none` value."""
    await db.execute(
        delete(ItineraryVote).where(
            ItineraryVote.itinerary_activity_id == item.id,
            ItineraryVote.user_id == current_user.id,
        )
    )
    await db.commit()
    return await _vote_summary(db, item.id, current_user.id)


@router.get("/itinerary-activities/{itinerary_activity_id}/vote", response_model=VoteRead)
async def read_vote(
    item: ItineraryActivity = Depends(get_owned_itinerary_activity),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VoteRead:
    return await _vote_summary(db, item.id, current_user.id)


# --------------------------------------------------------------------------
# Comments — owner or collaborator
# --------------------------------------------------------------------------


def _to_comment_read(comment: Comment) -> CommentRead:
    return CommentRead(
        id=comment.id,
        trip_id=comment.trip_id,
        user_id=comment.user_id,
        body=comment.body,
        created_at=comment.created_at,
        author_name=comment.author.name if comment.author else "Unknown",
    )


@router.get("/trips/{trip_id}/comments", response_model=List[CommentRead])
async def list_comments(
    trip: Trip = Depends(get_owned_trip),
    db: AsyncSession = Depends(get_db),
) -> List[CommentRead]:
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.trip_id == trip.id)
        .order_by(Comment.created_at)
    )
    return [_to_comment_read(c) for c in result.scalars().all()]


@router.post(
    "/trips/{trip_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    payload: CommentCreate,
    trip: Trip = Depends(get_owned_trip),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CommentRead:
    comment = Comment(trip_id=trip.id, user_id=current_user.id, body=payload.body)
    db.add(comment)
    await db.commit()
    await db.refresh(comment, attribute_names=["author", "created_at"])
    return _to_comment_read(comment)
