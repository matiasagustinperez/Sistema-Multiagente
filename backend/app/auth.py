"""
Authentication utilities: password hashing + JWT.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

# ── Config ───────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_in_production_TesisMCD_2026")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 10  # hours


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────
def create_access_token(data: dict, expire_hours: int = TOKEN_EXPIRE_HOURS) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=expire_hours)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
