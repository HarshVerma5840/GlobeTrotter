"""GET /health — CONTRACTS §4: plain {"status": "ok"} once the DB connects."""
from fastapi.testclient import TestClient

from app.main import app


def test_health_route_registered():
    # Read from the OpenAPI schema, not app.routes: newer Starlette wraps
    # include_router() results in _IncludedRouter, which has no .path.
    assert "/health" in app.openapi()["paths"]


def test_app_starts():
    with TestClient(app):
        pass


async def test_health_returns_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_health_requires_no_auth(client):
    # CONTRACTS §4 lists /health with auth "none" — must not 401.
    assert (await client.get("/health")).status_code == 200
