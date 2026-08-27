from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import JWT_ALGORITHM, JWT_EXPIRE_DAYS, JWT_SECRET


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> tuple[bool, bool]:
    """Return (valid, needs_upgrade), accepting legacy SHA-256 hashes once."""
    if stored_hash.startswith("$argon2"):
        try:
            return password_hash.verify(password, stored_hash), False
        except Exception:
            return False, False
    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    valid = hmac.compare_digest(legacy, stored_hash)
    return valid, valid


def create_access_token(user_id: int, child_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "child_id": child_id,
            "iat": now,
            "exp": now + timedelta(days=JWT_EXPIRE_DAYS),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> tuple[int, int]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"]), int(payload["child_id"])
    except (InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise ValueError("Invalid or expired access token") from error
