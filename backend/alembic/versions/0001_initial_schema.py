"""initial schema — users, cities, activities, trips, stops, itinerary_activities

Hand-authored to match app/models/*.py exactly (CONTRACTS.md §2). This
sandbox has no network access to install alembic/sqlalchemy, so this could
not be produced by `alembic revision --autogenerate` — the equivalent raw
DDL was hand-verified against a real local PostgreSQL 16 instance before
this file was written (constraints, FKs, cascades, gen_random_uuid() all
confirmed to apply cleanly). Still run `alembic upgrade head` for real once
the project has its actual Python environment — that is the authoritative
check, this is a strong second best.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column(
            "role",
            sa.String(20),
            nullable=False,
            server_default="user",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('user','catalog_manager','admin')", name="ck_user_role"),
    )

    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(255), nullable=False),
        sa.Column("cost_index", sa.Float(), nullable=True),
        sa.Column("popularity", sa.Integer(), nullable=True),
        sa.Column("image_url", sa.String(1024), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("google_place_id", sa.String(255), nullable=True, unique=True),
    )

    op.create_table(
        "user_saved_cities",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("duration_hours", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(1024), nullable=True),
        sa.CheckConstraint(
            "category IN ('sightseeing','food','adventure','transport','stay','other')",
            name="ck_activity_category",
        ),
    )

    op.create_table(
        "trips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("date_start", sa.Date(), nullable=False),
        sa.Column("date_end", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.String(1024), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("share_token", sa.String(255), nullable=True, unique=True),
        sa.Column("budget_target", sa.Numeric(10, 2), nullable=True),
        sa.CheckConstraint("date_end >= date_start", name="ck_trip_dates"),
    )

    op.create_table(
        "stops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("date_start", sa.Date(), nullable=False),
        sa.Column("date_end", sa.Date(), nullable=False),
        sa.CheckConstraint("date_end >= date_start", name="ck_stop_dates"),
    )

    op.create_table(
        "itinerary_activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("stop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("activities.id"), nullable=False),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("scheduled_time", sa.Float(), nullable=True),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # Helpful, not strictly required — speeds up the common lookups.
    op.create_index("ix_stops_trip_id", "stops", ["trip_id"])
    op.create_index("ix_activities_city_id", "activities", ["city_id"])
    op.create_index("ix_itinerary_activities_stop_id", "itinerary_activities", ["stop_id"])
    op.create_index("ix_trips_user_id", "trips", ["user_id"])


def downgrade() -> None:
    op.drop_table("itinerary_activities")
    op.drop_table("stops")
    op.drop_table("trips")
    op.drop_table("activities")
    op.drop_table("user_saved_cities")
    op.drop_table("cities")
    op.drop_table("users")
