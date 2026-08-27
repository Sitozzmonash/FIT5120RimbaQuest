from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.core.database import engine
from app.core.auth import AuthenticatedUser, require_child_access
from app.schemas.discovery import BattleOutcomeIn

router = APIRouter(tags=["Battles"])


@router.post("/api/v1/children/{child_id}/battle/record")
def record_battle_outcome(
    child_id: int,
    payload: BattleOutcomeIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    xp_reward = 50 if payload.won else 10
    with engine.begin() as connection:
        child = connection.execute(
            text("SELECT id, xp FROM child_profiles WHERE id=:id"),
            {"id": child_id}
        ).mappings().first()

        if not child:
            raise HTTPException(404, "Child profile not found")

        connection.execute(
            text("UPDATE child_profiles SET xp = coalesce(xp, 0) + :xp WHERE id=:id"),
            {"xp": xp_reward, "id": child_id}
        )

        updated_xp = (child["xp"] or 0) + xp_reward

    return {
        "success": True,
        "won": payload.won,
        "xp_awarded": xp_reward,
        "total_xp": updated_xp,
        "message": f"Battle finished! +{xp_reward} Explorer XP awarded!"
    }
