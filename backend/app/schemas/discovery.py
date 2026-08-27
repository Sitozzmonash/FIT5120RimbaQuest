from __future__ import annotations

from pydantic import BaseModel, Field


class DiscoveryIn(BaseModel):
    species_id: str
    location_label: str = Field(min_length=2, max_length=120)
    photo_path: str | None = Field(default=None, max_length=500)
    notes: str | None = None


class BattleOutcomeIn(BaseModel):
    won: bool
    opponent_name: str = "Forest Shadow"
    rounds: int = 1
