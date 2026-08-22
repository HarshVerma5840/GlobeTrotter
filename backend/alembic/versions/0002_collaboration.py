"""collaboration — trip_collaborators, itinerary_votes, trip_comments (B12)

Adds the three tables CONTRACTS §7.3 specifies. Purely additive: no
existing table or column is altered, so this migration cannot disturb data
already planned against 0001.

Unlike 0001 this one WAS verified by running it against the real local
PostgreSQL instance and following it with `alembic check`, which reported
no drift between these tables and app/models/collaboration.py.

Revision ID: 0002_collaboration
Revises: 0001_initial_schema
Create Date: 2026-08-22
"""
import sqlalchemy as sa
from alembic import op

revision = "0002_collaboration"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trip_collaborators",
        sa.Column(
            "trip_id",
            sa.Uuid(),
            sa.ForeignKey("trips.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "itinerary_votes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "itinerary_activity_id",
            sa.Uuid(),
            sa.ForeignKey("itinerary_activities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("value", sa.String(10), nullable=False),
        # One vote per user per activity: changing your mind updates the
        # row, it never inserts a second (CONTRACTS §2).
        sa.UniqueConstraint("itinerary_activity_id", "user_id", name="uq_vote_activity_user"),
        sa.CheckConstraint("value IN ('up','down')", name="ck_vote_value"),
    )
    op.create_index("ix_itinerary_votes_itinerary_activity_id", "itinerary_votes", ["itinerary_activity_id"])

    op.create_table(
        "trip_comments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "trip_id",
            sa.Uuid(),
            sa.ForeignKey("trips.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body", sa.Text(), nullable=False),
        # nullable=False to match `Mapped[datetime]` on the model — a bare
        # sa.Column defaults to nullable, which `alembic check` flags as
        # drift even though a server_default means it is never actually null.
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_trip_comments_trip_id", "trip_comments", ["trip_id"])


def downgrade() -> None:
    op.drop_table("trip_comments")
    op.drop_table("itinerary_votes")
    op.drop_table("trip_collaborators")
