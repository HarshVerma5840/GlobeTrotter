"""
Skeleton-phase test: confirms the app imports and the /health route is
registered. This intentionally does NOT hit a real database — Backend
Wave 0 (B1) owns turning this into a real integration test once a test DB
fixture exists.
"""
from fastapi.testclient import TestClient

from app.main import app


def test_health_route_registered():
    paths = [route.path for route in app.routes]
    assert "/health" in paths


def test_app_starts():
    # TestClient construction alone exercises app startup/middleware wiring
    with TestClient(app):
        pass
