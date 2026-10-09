from __future__ import annotations

from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field


class BattleActionType(str, Enum):
    BASIC = "basic"
    BRACE = "brace"
    ACTIVE_1 = "active_1"
    ACTIVE_2 = "active_2"


class StartBattleIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    player_species_id: str = Field(..., min_length=1, max_length=100)
    client_request_id: str = Field(..., min_length=1, max_length=100)
    difficulty: Literal["standard", "practice"] = "standard"


class BattleMutationIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    client_request_id: str = Field(..., min_length=1, max_length=100)
    expected_version: int = Field(..., ge=0, strict=True)


class BattleActionIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    client_request_id: str = Field(..., min_length=1, max_length=100)
    expected_version: int = Field(..., ge=0, strict=True)
    action: BattleActionType


class ActionPreviewOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: Literal["basic", "brace", "active_1", "active_2"]
    name: str
    effects: list[dict[str, Any]] = Field(default_factory=list)
    damage: int | float = 0
    shield_absorbed: int | float = 0
    healing: int | float = 0
    shield_gain: int | float = 0
    statuses: list[dict[str, Any]] = Field(default_factory=list)
    wasted_healing: int | float = 0
    wasted_shield: int | float = 0
    lucky_bonus_damage: int | float = 0
    will_end_battle: bool = False
    summary: str = ""
    lucky_summary: str = ""


class BattleSessionOut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    state: dict[str, Any]
    events: list[dict[str, Any]]
    xp_awarded: int | None = None
    total_xp: int | None = None
    first_win: bool = False


class BattleRollOut(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    state: dict[str, Any]
    events: list[dict[str, Any]]
    xp_awarded: int | None = None
    total_xp: int | None = None
    first_win: bool = False
    roll: int | None = None
    lucky: bool = False
    legal_actions: list[str] = Field(default_factory=list)
    action_previews: list[ActionPreviewOut] = Field(default_factory=list)
