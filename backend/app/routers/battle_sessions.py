from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets
from typing import Annotated, Any, Callable
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, insert, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.auth import AuthenticatedUser, get_current_user, require_child_access
from app.core.database import engine
from app.core.schema import (
    battle_first_wins, battle_requests, battle_sessions, child_profiles,
    collection_entries, species,
)
from app.schemas.battle import BattleActionIn, BattleMutationIn, BattleRollOut, BattleSessionOut, StartBattleIn
from app.services import battle_rules
from app.services.battle_catalogue import get_battle_definition, get_catalogue
from app.services.battle_engine import get_unlocked_abilities_for_child
from app.services.battle_matching import choose_opponent

router = APIRouter(tags=["Pixel Battle Sessions"])
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _cached(connection, battle_id: str, request_id: str, operation: str, payload: dict) -> dict | None:
    row = connection.execute(select(battle_requests).where(
        battle_requests.c.battle_id == battle_id,
        battle_requests.c.request_id == request_id,
    )).mappings().first()
    if row is None:
        return None
    if row["operation"] != operation or row["payload"] != payload:
        raise HTTPException(409, "This request ID was already used for a different action.")
    return row["response"]


def _save_request(connection, battle_id: str, request_id: str, operation: str, payload: dict, response: dict) -> None:
    connection.execute(insert(battle_requests).values(
        battle_id=battle_id, request_id=request_id, operation=operation,
        payload=payload, response=response,
    ))


def _owned(connection, battle_id: str, child_id: int):
    row = connection.execute(select(battle_sessions).where(battle_sessions.c.id == battle_id)).mappings().first()
    if row is None:
        raise HTTPException(404, "Battle session not found.")
    if row["child_id"] != child_id:
        raise HTTPException(403, "You cannot access another explorer's battle.")
    return row


def _check_expiry(row) -> None:
    expiry = row["expires_at"]
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if _now() >= expiry:
        raise HTTPException(410, "This battle has expired. Start a new encounter.")


def _start_replay(connection, child_id: int, payload: StartBattleIn) -> dict | None:
    row = connection.execute(select(battle_sessions).where(
        battle_sessions.c.child_id == child_id,
        battle_sessions.c.create_request_id == payload.client_request_id,
    )).mappings().first()
    if row is None:
        return None
    if row["player_species_id"] != payload.player_species_id:
        raise HTTPException(409, "This request ID was already used for another species.")
    result = _cached(connection, row["id"], payload.client_request_id, "start", payload.model_dump(mode="json"))
    if result is None:
        raise HTTPException(409, "The initial battle response is unavailable.")
    return result


@router.post("/api/v1/children/{child_id}/battles", response_model=BattleSessionOut)
def start_battle(
    child_id: int,
    payload: StartBattleIn,
    _: Annotated[AuthenticatedUser, Depends(require_child_access)],
):
    try:
        with engine.begin() as connection:
            cached = _start_replay(connection, child_id, payload)
            if cached is not None:
                return cached
            active = connection.execute(select(species.c.id).where(
                species.c.id == payload.player_species_id, species.c.is_active.is_(True),
            )).first()
            if active is None:
                raise HTTPException(404, "This species is not available for battle.")
            collected = connection.execute(select(collection_entries.c.id).where(
                collection_entries.c.child_id == child_id,
                collection_entries.c.species_id == payload.player_species_id,
            )).first()
            if collected is None:
                raise HTTPException(403, "Discover this species before bringing it into battle.")
            try:
                player = get_battle_definition(payload.player_species_id)
            except ValueError as error:
                raise HTTPException(503, "Battle data for this species is not available.") from error
            catalogue = get_catalogue()
            active_ids = set(connection.execute(select(species.c.id).where(species.c.is_active.is_(True))).scalars())
            unlocked = get_unlocked_abilities_for_child(child_id, payload.player_species_id, connection)
            try:
                opponent, opponent_slots, match_info = choose_opponent(
                    catalogue, active_ids, player, unlocked, payload.difficulty, secrets.SystemRandom()
                )
            except ValueError as error:
                raise HTTPException(503, "No battle opponent is available.") from error
            battle_id = str(uuid4())
            initiative = "opponent" if secrets.randbelow(2) == 0 else "player"
            state, events = battle_rules.new_battle(
                player, opponent, unlocked, battle_id,
                opponent_unlocked_slots=opponent_slots,
                initiative=initiative,
                difficulty=payload.difficulty,
            )
            state["power_ratio"] = match_info["power_ratio"]
            state["match_info"] = match_info
            response = {"state": state, "events": events, "xp_awarded": None, "total_xp": None, "first_win": False}
            now = _now()
            connection.execute(insert(battle_sessions).values(
                id=battle_id, child_id=child_id, player_species_id=payload.player_species_id,
                create_request_id=payload.client_request_id, version=0, state=state,
                created_at=now, updated_at=now, expires_at=now + timedelta(hours=2),
                settled=False, first_win=False,
            ))
            _save_request(connection, battle_id, payload.client_request_id, "start", payload.model_dump(mode="json"), response)
            return response
    except IntegrityError:
        with engine.connect() as connection:
            cached = _start_replay(connection, child_id, payload)
            if cached is not None:
                return cached
        raise
    except OperationalError as error:
        if engine.dialect.name == "sqlite" and any(word in str(error).lower() for word in ("locked", "busy")):
            raise HTTPException(409, "The battle is busy. Retry the same request.") from error
        raise


@router.get("/api/v1/battles/{battle_id}", response_model=BattleSessionOut)
def get_battle(battle_id: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    with engine.connect() as connection:
        row = _owned(connection, battle_id, user.child_id)
        _check_expiry(row)
        total = connection.execute(select(child_profiles.c.xp).where(child_profiles.c.id == user.child_id)).scalar_one()
        return {
            "state": row["state"], "events": [], "xp_awarded": row["xp_awarded"],
            "total_xp": total if row["settled"] else None, "first_win": row["first_win"],
        }


def _settle(connection, row, state: dict) -> tuple[int, int, bool]:
    first = False
    if state["outcome"] == "win":
        insert_win = pg_insert if connection.dialect.name == "postgresql" else sqlite_insert
        result = connection.execute(insert_win(battle_first_wins).values(
            child_id=row["child_id"], species_id=row["player_species_id"], battle_id=row["id"],
        ).on_conflict_do_nothing(index_elements=["child_id", "species_id"]))
        first = result.rowcount == 1
        award = 20 if first else 8
    else:
        award = 2 if state["outcome"] in ("lose", "surrender") else 0
    connection.execute(update(child_profiles).where(child_profiles.c.id == row["child_id"]).values(
        xp=func.coalesce(child_profiles.c.xp, 0) + award,
    ))
    total = connection.execute(select(child_profiles.c.xp).where(child_profiles.c.id == row["child_id"])).scalar_one()
    return award, total, first


def _mutate(battle_id: str, payload: BattleMutationIn, user: AuthenticatedUser, operation: str, transition: Callable) -> dict[str, Any]:
    request = payload.model_dump(mode="json")
    try:
        with engine.begin() as connection:
            row = _owned(connection, battle_id, user.child_id)
            cached = _cached(connection, battle_id, payload.client_request_id, operation, request)
            if cached is not None:
                return cached
            _check_expiry(row)
            if row["settled"] or row["state"]["outcome"] is not None:
                raise HTTPException(409, "This battle has already ended.")
            if row["version"] != payload.expected_version:
                raise HTTPException(409, "Battle state has changed. Refresh this encounter.")
            try:
                state, events = transition(row["state"], secrets.SystemRandom())
            except ValueError as error:
                raise HTTPException(400, str(error)) from error
            state["version"] = row["version"] + 1
            terminal = state["outcome"] is not None
            # CAS and reward updates share one transaction, including the first-win claim.
            updated = connection.execute(update(battle_sessions).where(
                battle_sessions.c.id == battle_id,
                battle_sessions.c.version == payload.expected_version,
                battle_sessions.c.settled.is_(False),
            ).values(version=state["version"], state=state, updated_at=_now(), settled=terminal))
            if updated.rowcount != 1:
                raise HTTPException(409, "Another request already updated this battle.")
            award, total, first = _settle(connection, row, state) if terminal else (None, None, False)
            if terminal:
                connection.execute(update(battle_sessions).where(battle_sessions.c.id == battle_id).values(
                    xp_awarded=award, first_win=first,
                ))
            response = {"state": state, "events": events, "xp_awarded": award, "total_xp": total, "first_win": first}
            if operation == "roll":
                response.update(
                    roll=state["current_roll"],
                    lucky=state["lucky"],
                    legal_actions=state["legal_actions"],
                    action_previews=state.get("action_previews", []),
                )
            _save_request(connection, battle_id, payload.client_request_id, operation, request, response)
            return response
    except (HTTPException, IntegrityError, OperationalError) as error:
        conflict = isinstance(error, IntegrityError) or (isinstance(error, HTTPException) and error.status_code == 409)
        busy = isinstance(error, OperationalError) and engine.dialect.name == "sqlite" and any(word in str(error).lower() for word in ("locked", "busy"))
        if conflict or busy:
            with engine.connect() as connection:
                _owned(connection, battle_id, user.child_id)
                cached = _cached(connection, battle_id, payload.client_request_id, operation, request)
                if cached is not None:
                    return cached
            if busy:
                raise HTTPException(409, "The battle is busy. Retry the same request.") from error
        raise


@router.post("/api/v1/battles/{battle_id}/roll", response_model=BattleRollOut)
def roll_dice(battle_id: str, payload: BattleMutationIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    return _mutate(battle_id, payload, user, "roll", battle_rules.roll_player)


@router.post("/api/v1/battles/{battle_id}/action", response_model=BattleSessionOut)
def execute_action(battle_id: str, payload: BattleActionIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    return _mutate(battle_id, payload, user, "action", lambda state, rng: battle_rules.play_action(state, payload.action.value, rng))


@router.post("/api/v1/battles/{battle_id}/surrender", response_model=BattleSessionOut)
def surrender_battle_session(battle_id: str, payload: BattleMutationIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    return _mutate(battle_id, payload, user, "surrender", lambda state, rng: battle_rules.surrender_battle(state))
