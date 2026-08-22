import uuid
from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Numeric, String, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Trip(Base):
    """
    Budget totals (amount_by_category/amount_total/amount_per_day) are
    deliberately NOT columns here — ARCHITECTURE.md §5 computes them at
    request time via GET /trips/{id}/budget. Do not add stored budget
    columns without updating CONTRACTS.md first.

    trip_collaborators / is-public-only-owner-can-edit enforcement is
    Backend Wave 3 (B12, §7.3 bonus) — not part of this pass.
    """

    __tablename__ = "trips"
    __table_args__ = (CheckConstraint("date_end >= date_start", name="ck_trip_dates"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    share_token: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    budget_target: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="trips", foreign_keys=[user_id])
    stops: Mapped[list["Stop"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="Stop.sequence"
    )
