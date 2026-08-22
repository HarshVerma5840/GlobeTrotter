"""Declarative base every SQLAlchemy model (backend/app/models/*.py) inherits from."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
