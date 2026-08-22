import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Numeric, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ItineraryActivity(Base):
    """
    Join row between a Stop and an Activity (CONTRACTS.md §2). `cost` is
    copied from Activity.cost at insert time and is then independent —
    never re-derive it from the catalog activity after creation, so
    editing a catalog activity's reference price never silently changes
    a past trip's numbers.

    The cross-table check that scheduled_date must fall within the
    parent stop's date range is service-layer validation (Backend
    Wave 1, B6), not a DB constraint here — same reasoning as Stop.
    """

    __tablename__ = "itinerary_activities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stop_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stops.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activity_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("activities.id"), nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    scheduled_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    stop: Mapped["Stop"] = relationship(back_populates="itinerary_activities")
    activity: Mapped["Activity"] = relationship(back_populates="itinerary_activities")
