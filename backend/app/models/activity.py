import enum
import uuid

from sqlalchemy import Float, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ActivityCategory(str, enum.Enum):
    """
    The ONLY valid category values anywhere in the system (CONTRACTS.md
    §2, §8) — budget-breakdown grouping, seed data, and frontend filters
    all depend on this exact set. Add a value here first if it's ever
    needed, never ad hoc in one layer.
    """

    sightseeing = "sightseeing"
    food = "food"
    adventure = "adventure"
    transport = "transport"
    stay = "stay"
    other = "other"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("cities.id"), nullable=False, index=True
    )
    category: Mapped[ActivityCategory] = mapped_column(
        SAEnum(ActivityCategory, name="activity_category", native_enum=False, length=20),
        nullable=False,
    )
    cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    duration_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    city: Mapped["City"] = relationship(back_populates="activities")
    itinerary_activities: Mapped[list["ItineraryActivity"]] = relationship(back_populates="activity")
