"""
Shared pytest fixtures.

Tests run against in-memory SQLite rather than the Postgres 16 pinned in
CONTRACTS §0, so the suite works on any machine with no Docker daemon or
database server running. That is only possible because the models use
SQLAlchemy's dialect-agnostic `Uuid` type (native UUID on Postgres,
CHAR(32) elsewhere). `alembic upgrade head` against the real `db` service
remains the authoritative schema check.
"""
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  — registers every model on Base.metadata
from app.db.base import Base
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session():
    """A fresh, isolated in-memory schema per test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one shared connection, or ':memory:' vanishes
    )

    # SQLite ignores ON DELETE CASCADE unless FKs are enabled per connection;
    # without this the cascade tests would pass vacuously.
    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_fks(dbapi_conn, _record):  # pragma: no cover - setup
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    """httpx client bound to the app, with get_db pointed at the test DB."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client
    app.dependency_overrides.clear()
