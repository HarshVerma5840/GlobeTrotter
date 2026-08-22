"""
Import every model module here so Base.metadata is fully populated
before Alembic (or anything else) inspects it. Add the import the same
turn you add a new model file — a model that isn't imported here is
invisible to migrations.
"""
from app.models.user import User, UserRole, user_saved_cities  # noqa: F401
from app.models.city import City  # noqa: F401
from app.models.activity import Activity, ActivityCategory  # noqa: F401
from app.models.trip import Trip  # noqa: F401
from app.models.stop import Stop  # noqa: F401
from app.models.itinerary_activity import ItineraryActivity  # noqa: F401

__all__ = [
    "User",
    "UserRole",
    "user_saved_cities",
    "City",
    "Activity",
    "ActivityCategory",
    "Trip",
    "Stop",
    "ItineraryActivity",
]
