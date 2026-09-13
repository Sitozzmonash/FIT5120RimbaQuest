from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.core.database import engine
from app.core.auth import AuthenticatedUser, require_child_access
from app.schemas.discovery import BattleOutcomeIn
from app.services.battle_engine import (
    calculate_battle_stats,
    calculate_bot_turn,
    generate_ai_opponent,
    get_unlocked_abilities_for_child,
)

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


@router.get("/api/v1/children/{child_id}/battle/opponent")
def get_battle_opponent(
    child_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
    player_species_id: str | None = None,
):
    opponent = generate_ai_opponent(player_species_id)
    return {"success": True, "opponent": opponent}


@router.get("/api/v1/children/{child_id}/species/{species_id}/battle-card")
def get_child_species_battle_card(
    child_id: int,
    species_id: str,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    with engine.connect() as connection:
        row = connection.execute(text("SELECT id, common_name, category FROM species WHERE id=:id"), {"id": species_id}).mappings().first()
        if not row:
            raise HTTPException(404, "Species not found")
        stats = calculate_battle_stats(row["id"], row["category"])
        unlocked = get_unlocked_abilities_for_child(child_id, species_id, connection)
        stats["unlocked_abilities"] = unlocked
        stats["abilities_locked"] = len(unlocked) == 0
        return {"success": True, "card": stats}


@router.post("/api/v1/battle/bot-turn")
def bot_turn(payload: dict):
    # expects bot_data, bot_current_hp, player_current_hp, round_num
    opponent_data = payload.get("bot_data", {})
    bot_current_hp = payload.get("bot_current_hp", 100)
    player_current_hp = payload.get("player_current_hp", 100)
    round_num = payload.get("round_num", 1)
    action = calculate_bot_turn(opponent_data, bot_current_hp, player_current_hp, round_num)
    return {"success": True, "action": action}

