import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Stop(Base):
    """
    One city leg of a trip (CONTRACTS.md §2). This model only enforces
    the stop's OWN date validity (date_end >= date_start) — the two
    cross-row checks CONTRACTS.md calls out (a stop's dates must fall
    within its parent trip's range; stops on the same trip must not
    overlap) are cross-row/cross-table, so they are NOT raw SQL
    constraints here — they belong in the service layer at write time
    (Backend Wave 1, B6's stop-create/update routes). Don't add them as
    DB constraints without updating CONTRACTS.md first.

    distance_from_previous_km / travel_gap_days / is_feasible (§7.2) are
    computed at request time, not columns — see services/feasibility.py
    (Backend Wave 1, B11).
    """

    __tablename__ = "stops"
    __table_args__ = (CheckConstraint("date_end >= date_start", name="ck_stop_dates"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    city_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("cities.id"), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[date] = mapped_column(Date, nullable=False)

    trip: Mapped["Trip"] = relationship(back_populates="stops")
    city: Mapped["City"] = relationship(back_populates="stops")
    itinerary_activities: Mapped[list["ItineraryActivity"]] = relationship(
        back_populates="stop", cascade="all, delete-orphan", order_by="ItineraryActivity.scheduled_time"
    )
