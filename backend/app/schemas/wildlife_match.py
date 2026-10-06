from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class _Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CreateMatchIn(_Input):
    mode: Literal["bot", "friend"]
    # Friend matches started from the Friend List are reserved for this friend.
    friend_child_id: int | None = Field(default=None, ge=1)
    client_request_id: str | None = Field(default=None, min_length=1, max_length=100)


class AddFriendIn(_Input):
    code: str = Field(min_length=1, max_length=32)


class SelectCardIn(_Input):
    species_id: str = Field(min_length=1, max_length=100)
    client_request_id: str | None = Field(default=None, min_length=1, max_length=100)


class ActionIn(_Input):
    action: Literal["basic", "ability_1", "ability_2", "ability_3"]
    expected_version: int = Field(ge=0, strict=True)
    client_request_id: str = Field(min_length=1, max_length=100)


class ForfeitIn(_Input):
    expected_version: int = Field(ge=0, strict=True)
    client_request_id: str = Field(min_length=1, max_length=100)


class CancelIn(ForfeitIn):
    pass
