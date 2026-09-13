from __future__ import annotations

from pydantic import BaseModel, Field


class QuizSubmitIn(BaseModel):
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    set_index: int = Field(ge=0, le=2)
    answers: dict[str, str] = Field(default_factory=dict)
