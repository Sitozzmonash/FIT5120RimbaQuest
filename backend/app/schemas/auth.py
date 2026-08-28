from __future__ import annotations

import re
from pydantic import BaseModel, Field, field_validator


ALLOWED_AVATARS = frozenset({"hornbill", "tiger", "panda"})


def _validate_username_value(value: str) -> str:
    if len(value) < 3 or len(value) > 20:
        raise ValueError("Username must be between 3 and 20 characters.")
    if " " in value:
        raise ValueError("Username cannot contain spaces")
    if not re.match(r"^[a-zA-Z0-9_-]+$", value):
        raise ValueError("Username can only contain letters, numbers, hyphens and underscores")
    return value


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    age: int = Field(ge=5, le=18)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=100)
    avatar: str = Field(default="hornbill", max_length=30)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        return _validate_username_value(v)

    @field_validator("avatar")
    @classmethod
    def validate_avatar(cls, v: str) -> str:
        avatar = v.strip().lower()
        if avatar not in ALLOWED_AVATARS:
            raise ValueError("Choose one of the available avatars.")
        return avatar

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Please enter a valid email address")
        return v.lower().strip()


class LoginIn(BaseModel):
    username_or_email: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=100)


class ForgotPasswordIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)


class ResetPasswordIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    recovery_token: str = Field(min_length=4, max_length=50)
    new_password: str = Field(min_length=6, max_length=100)


class ProfileUpdateIn(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=20)
    avatar: str | None = Field(default=None, max_length=30)
    age: int | None = Field(default=None, ge=5, le=18)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        return _validate_username_value(v) if v is not None else v

    @field_validator("avatar")
    @classmethod
    def validate_avatar(cls, v: str | None) -> str | None:
        if v is None:
            return None
        avatar = v.strip().lower()
        if avatar not in ALLOWED_AVATARS:
            raise ValueError("Choose one of the available avatars.")
        return avatar
