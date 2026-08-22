"""
Collaborative co-planning models (B12, CONTRACTS §7.3).

Three things live here because they only make sense together: who may edit
a trip (`trip_collaborators`), what they think of a proposed activity
(`ItineraryVote`), and what they said about it (`Comment`).

Security note, and it is the important one: adding collaborators is the
only change in this project that WIDENS trip access. CONTRACTS §5 keeps
`is_public`, `share_token`, and the collaborator list itself owner-only —
a collaborator may edit the itinerary but may never reshare the trip or
invite further people. That split is enforced by two separate helpers in
api/deps.py (`assert_trip_access` vs `assert_trip_owner`), never by one
widened check.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Table, Text, UniqueConstraint, Uuid, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Plain many-to-many join table (no extra columns) — CONTRACTS §2:
# "trip_collaborators join table: trip_id, user_id".
trip_collaborators = Table(
    "trip_collaborators",
    Base.metadata,
    Column("trip_id", Uuid(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class VoteValue(str, enum.Enum):
    """CONTRACTS §2: `up` (+1) / `down` (-1). No neutral — that's an absent row."""

    up = "up"
    down = "down"

    @property
    def score(self) -> int:
        return 1 if self is VoteValue.up else -1


class ItineraryVote(Base):
    """
    One user's up/down vote on one proposed itinerary activity.

    The unique constraint on (itinerary_activity_id, user_id) is what makes
    "changing your mind" an UPDATE rather than a second row (CONTRACTS §2) —
    without it a user could stuff the ballot by voting repeatedly.
    """

    __tablename__ = "itinerary_votes"
    __table_args__ = (
        UniqueConstraint("itinerary_activity_id", "user_id", name="uq_vote_activity_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    itinerary_activity_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("itinerary_activities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    value: Mapped[VoteValue] = mapped_column(
        SAEnum(VoteValue, name="vote_value", native_enum=False, length=10), nullable=False
    )

    itinerary_activity: Mapped["ItineraryActivity"] = relationship(back_populates="votes")
    user: Mapped["User"] = relationship()


class Comment(Base):
    """A message on a trip's discussion thread (CONTRACTS §2, §7.3)."""

    __tablename__ = "trip_comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trip: Mapped["Trip"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship()
