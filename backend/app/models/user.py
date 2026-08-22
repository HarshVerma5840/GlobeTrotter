import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Table, Column, func
from sqlalchemy import Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    user = "user"
    catalog_manager = "catalog_manager"
    admin = "admin"


# Plain many-to-many join table (no extra columns) — CONTRACTS.md §2
# "user_saved_cities join table: user_id, city_id".
user_saved_cities = Table(
    "user_saved_cities",
    Base.metadata,
    Column("user_id", Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("city_id", Uuid(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", server_default="en")
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False, length=20),
        nullable=False,
        default=UserRole.user,
        server_default=UserRole.user.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trips: Mapped[list["Trip"]] = relationship(
        back_populates="owner", foreign_keys="Trip.user_id"
    )
    saved_cities: Mapped[list["City"]] = relationship(
        secondary=user_saved_cities, back_populates="saved_by_users"
    )
    # Trips this user was invited to edit — distinct from `trips`, which is
    # the ones they own (B12, CONTRACTS §7.3).
    collaborating_trips: Mapped[list["Trip"]] = relationship(
        secondary="trip_collaborators", back_populates="collaborators"
    )
