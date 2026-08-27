from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text

from app.core.database import engine
from app.core.security import decode_access_token


bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: int
    child_id: int


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> AuthenticatedUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    try:
        user_id, child_id = decode_access_token(credentials.credentials)
    except ValueError as error:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(error)) from error

    with engine.connect() as connection:
        owned = connection.execute(
            text("SELECT 1 FROM child_profiles WHERE id=:child AND parent_user_id=:user"),
            {"child": child_id, "user": user_id},
        ).first()
    if not owned:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is no longer available")
    return AuthenticatedUser(user_id=user_id, child_id=child_id)


def require_child_access(
    child_id: int,
    current: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    if current.child_id != child_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot access another explorer's data")
    return current
