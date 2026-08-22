import uuid

from sqlalchemy import Float, Integer, String
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import user_saved_cities


class City(Base):
    """
    Shared catalog data (CONTRACTS.md §2) — not owned by a single user.
    latitude/longitude are required, not optional: the route map (§7.2)
    and the Haversine fallback are silently useless without them, so seed
    data (B5) must never leave these null.
    """

    __tablename__ = "cities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(255), nullable=False)
    cost_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    popularity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    # Set only for cities created via Places search (§7.4); seed-data
    # cities may leave this null — never generate a fake one.
    google_place_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    activities: Mapped[list["Activity"]] = relationship(back_populates="city")
    stops: Mapped[list["Stop"]] = relationship(back_populates="city")
    saved_by_users: Mapped[list["User"]] = relationship(
        secondary=user_saved_cities, back_populates="saved_cities"
    )
