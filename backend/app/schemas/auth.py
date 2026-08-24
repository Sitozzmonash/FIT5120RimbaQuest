from __future__ import annotations

import re
from pydantic import BaseModel, Field, field_validator


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    age: int = Field(ge=5, le=18)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=6, max_length=100)
    avatar: str = Field(default="tapir", max_length=30)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Username cannot contain spaces")
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username can only contain letters, numbers, hyphens and underscores")
        return v

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
    display_name: str | None = Field(default=None, min_length=2, max_length=30)
    avatar: str | None = Field(default=None, max_length=30)
    age: int | None = Field(default=None, ge=5, le=18)
