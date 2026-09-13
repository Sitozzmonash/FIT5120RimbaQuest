from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class DiscoveryIn(BaseModel):
    verification_id: str = Field(min_length=36, max_length=36)
    location_label: str = Field(min_length=2, max_length=120)
    notes: str | None = None


class IdentificationAnswerIn(BaseModel):
    category: Literal["Mammal", "Bird", "Butterfly", "Reptile"]
    species_id: str = Field(min_length=2, max_length=120)


class BattleOutcomeIn(BaseModel):
    won: bool
    opponent_name: str = "Forest Shadow"
    rounds: int = 1
