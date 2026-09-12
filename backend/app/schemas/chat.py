from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SpeciesChatIn(BaseModel):
    # Keep whitespace valid here so the router can return the child-friendly
    # validation message rather than Pydantic's generic 422 response.
    question: str = Field(max_length=600)


class SpeciesChatOut(BaseModel):
    species_id: str
    answer: str
    source: Literal["deepseek", "mock", "guardrail"]
    fallback: Literal["other_species", "unsupported", "redirect"] | None = None
