"""
Password hashing and JWT encode/decode (CONTRACTS §1, §3).

A plaintext password is never stored, never logged, and never returned in
any response — it exists only as the `password` field of an inbound
request model and is turned into a bcrypt digest here immediately.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt hashes at most 72 bytes; anything longer is silently truncated by
# the algorithm, so the request schemas reject it up front instead.
BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Never raises on a malformed stored hash — just fails the check."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Signed JWT carrying `sub` (the user id) and `exp`, per CONTRACTS §1:
    JWT_SECRET_KEY / JWT_ALGORITHM / ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Optional[str]:
    """Return the `sub` claim, or None if invalid/expired/malformed."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    subject = payload.get("sub")
    return str(subject) if subject is not None else None
