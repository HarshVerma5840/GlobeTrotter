"""
Domain-level validation errors.

Services raise these instead of HTTPException so business rules stay
testable without an HTTP layer; main.py registers one handler that turns
them into a 422 with FastAPI's standard {"detail": ...} shape.
"""


class DomainValidationError(ValueError):
    """A business rule in services/ was violated (CONTRACTS §2 cross-row rules)."""
