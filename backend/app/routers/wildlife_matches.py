"""Authenticated, persistent Wildlife Card Battle matches."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import secrets
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, case, func, insert, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import engine
from app.core.schema import (
    child_profiles, collection_entries, species, wildlife_card_rest,
    wildlife_friendships, wildlife_leaderboard, wildlife_match_invites, wildlife_matches,
    wildlife_requests,
)
from app.routers.friends import are_friends, _floored_points
from app.schemas.wildlife_match import ActionIn, CancelIn, CreateMatchIn, ForfeitIn, SelectCardIn
from app.services.battle_catalogue import get_battle_definition, get_catalogue
from app.services.battle_engine import get_unlocked_abilities_for_child
from app.services.battle_matching import choose_opponent
from app.services import wildlife_battle


router = APIRouter(prefix="/api/v1/wildlife-battles", tags=["Wildlife Card Battle"])
TURN_SECONDS = 30
MATCH_HOURS = 2
CARD_REST_HOURS = 2
# The bot's opening move waits for the client's next poll, so the explorer
# first sees both cards at their starting Energy instead of after a recharge.
BOT_OPENING_DELAY = timedelta(seconds=2)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _busy(error: OperationalError) -> bool:
    return engine.dialect.name == "sqlite" and any(
        word in str(error).lower() for word in ("locked", "busy")
    )


def _insert_for(connection, table):
    return (pg_insert if connection.dialect.name == "postgresql" else sqlite_insert)(table)


def _match(connection, match_id: str):
    row = connection.execute(select(wildlife_matches).where(wildlife_matches.c.id == match_id)).mappings().first()
    if row is None:
        raise HTTPException(404, "Wildlife match not found.")
    return row


def _participant(connection, match_id: str, child_id: int):
    row = _match(connection, match_id)
    if child_id not in (row["owner_child_id"], row["guest_child_id"]):
        raise HTTPException(403, "You are not a participant in this match.")
    return row


def _lock_children(connection, *child_ids: int) -> None:
    # PostgreSQL serializes create/join decisions with row locks. SQLite
    # ignores FOR UPDATE, so a no-op UPDATE obtains its real single-writer lock
    # before the open-match query. A competing request then sees the committed
    # match or receives a retryable busy error instead of creating a second one.
    for child_id in sorted(set(child_ids)):
        if connection.dialect.name == "sqlite":
            changed = connection.execute(update(child_profiles).where(
                child_profiles.c.id == child_id,
            ).values(id=child_profiles.c.id))
            if changed.rowcount != 1:
                raise HTTPException(401, "Account is no longer available.")
        else:
            connection.execute(select(child_profiles.c.id).where(
                child_profiles.c.id == child_id,
            ).with_for_update()).scalar_one()


def _open_match(connection, child_id: int, *, excluding: str | None = None):
    statement = select(wildlife_matches).where(
        wildlife_matches.c.status.in_(("setup", "waiting", "active")),
        wildlife_matches.c.expires_at > _now(),
        or_(
            wildlife_matches.c.owner_child_id == child_id,
            wildlife_matches.c.guest_child_id == child_id,
        ),
    )
    if excluding is not None:
        statement = statement.where(wildlife_matches.c.id != excluding)
    statement = statement.order_by(
        case(
            (wildlife_matches.c.status == "active", 0),
            (wildlife_matches.c.status == "waiting", 1),
            else_=2,
        ),
        wildlife_matches.c.created_at.desc(),
    )
    return connection.execute(statement.limit(1)).mappings().first()


def _require_no_other_open_match(connection, child_id: int, *, excluding: str | None = None) -> None:
    existing = _open_match(connection, child_id, excluding=excluding)
    if existing is not None:
        raise HTTPException(409, {
            "message": "Finish or cancel your current wildlife match first.",
            "match_id": existing["id"],
        })


def _require_invitee(connection, row, child_id: int) -> None:
    invitee = connection.execute(select(wildlife_match_invites.c.invitee_child_id).where(
        wildlife_match_invites.c.match_id == row["id"],
    )).scalar_one_or_none()
    if invitee is not None and invitee != child_id and child_id != row["owner_child_id"]:
        raise HTTPException(403, "This battle invitation is for another explorer.")


def _side(row, child_id: int) -> str:
    return "player" if child_id == row["owner_child_id"] else "opponent"


def _response(row, child_id: int, events: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    side = _side(row, child_id)
    delta = row["owner_leaderboard_delta"] if side == "player" else row["guest_leaderboard_delta"]
    # Polling spectators need to see actions taken by the other child. Events
    # carry monotonically increasing IDs, so clients can deduplicate polls.
    state = dict(row["state"]) if row["state"] else None
    history = (state or {}).get("events", [])
    recent_events = history[-12:] if history else (events[-12:] if events else [])
    if state is not None:
        state["events"] = recent_events
    match = {
        "id": row["id"],
        "mode": row["mode"],
        "habitat": row["habitat"],
        "habitat_bonus": wildlife_battle.HABITAT_BONUSES.get(row["habitat"]),
        "status": row["status"],
        "version": row["version"],
        "viewer_side": side,
        "my_species_id": row["owner_species_id"] if side == "player" else row["guest_species_id"],
        "opponent_child_id": None if row["mode"] != "friend" else (row["guest_child_id"] if side == "player" else row["owner_child_id"]),
        "invite_code": row["invite_code"] if row["status"] in ("waiting", "active", "completed") else None,
        "deadline_at": _aware(row["deadline_at"]).isoformat() if row["deadline_at"] else None,
        "server_now": _now().isoformat(),
        "expires_at": _aware(row["expires_at"]).isoformat(),
        "state": state,
        "events": recent_events,
        "move_count": sum(1 for event in history if event.get("type") == "action"),
        "leaderboard_delta": delta,
    }
    return {"match": match}


def _cached(connection, match_id: str, child_id: int, request_id: str | None, operation: str, payload: dict) -> dict | None:
    if request_id is None:
        return None
    row = connection.execute(select(wildlife_requests).where(
        wildlife_requests.c.match_id == match_id,
        wildlife_requests.c.child_id == child_id,
        wildlife_requests.c.request_id == request_id,
    )).mappings().first()
    if row is None:
        return None
    if row["operation"] != operation or row["payload"] != payload:
        raise HTTPException(409, "This request ID was already used for a different operation.")
    return row["response"]


def _save_request(connection, match_id: str, child_id: int, request_id: str | None, operation: str, payload: dict, response: dict) -> None:
    if request_id is not None:
        connection.execute(insert(wildlife_requests).values(
            match_id=match_id, child_id=child_id, request_id=request_id,
            operation=operation, payload=payload, response=response,
        ))


def _require_live(row) -> None:
    if row["status"] == "expired" or (
        row["status"] != "completed" and _now() >= _aware(row["expires_at"])
    ):
        raise HTTPException(410, "This wildlife match has expired.")


def _rest_status(connection, child_id: int) -> tuple[list[tuple[str, str, datetime | None]], set[str]]:
    """Return owned active cards and cards whose two-hour rest has expired."""
    now = _now()
    rows = connection.execute(select(
        species.c.id, wildlife_card_rest.c.rest_until,
    ).select_from(
        collection_entries.join(species, collection_entries.c.species_id == species.c.id)
        .outerjoin(wildlife_card_rest, and_(
            wildlife_card_rest.c.child_id == collection_entries.c.child_id,
            wildlife_card_rest.c.species_id == species.c.id,
        ))
    ).where(
        collection_entries.c.child_id == child_id,
        species.c.is_active.is_(True),
    ).order_by(species.c.id)).all()
    cards = [(
        species_id, wildlife_battle.species_habitat_group(species_id),
        _aware(rest_until) if rest_until else None,
    ) for species_id, rest_until in rows]
    return cards, {species_id for species_id, _, rest_until in cards
                   if rest_until is None or rest_until <= now}


def _owned_card(connection, child_id: int, species_id: str) -> tuple[dict, str]:
    cards, selectable = _rest_status(connection, child_id)
    card = next((card for card in cards if card[0] == species_id), None)
    if card is None:
        raise HTTPException(403, "Discover this active species before selecting its card.")
    if species_id not in selectable:
        raise HTTPException(409, "This card is resting. Try again after its two-hour rest ends.")
    try:
        definition = get_battle_definition(species_id)
    except ValueError as error:
        raise HTTPException(503, "Battle data for this species is unavailable.") from error
    return definition, card[1]


def _cards(connection, child_id: int, habitat: str) -> dict:
    cards, selectable = _rest_status(connection, child_id)
    return {"habitat": habitat, "habitat_bonus": wildlife_battle.HABITAT_BONUSES.get(habitat), "cards": [
        {
            "species_id": species_id,
            "habitat_match": wildlife_battle.habitat_matches(raw_habitat, habitat),
            "rest_until": rest_until.isoformat() if rest_until and rest_until > _now() else None,
            "selectable": species_id in selectable,
        }
        for species_id, raw_habitat, rest_until in cards
    ]}


def _settle(connection, row, state: dict) -> tuple[int, int | None]:
    """Call only after winning the match CAS in the same transaction."""
    winner = state.get("winner")
    players = [(row["owner_child_id"], row["owner_species_id"], "player")]
    if row["guest_child_id"] is not None:
        players.append((row["guest_child_id"], row["guest_species_id"], "opponent"))
    deltas: dict[str, int] = {}
    for child_id, used_species, side in players:
        rest_until = _now() + timedelta(hours=CARD_REST_HOURS)
        stmt = _insert_for(connection, wildlife_card_rest).values(
            child_id=child_id, species_id=used_species, remaining=0, rest_until=rest_until,
        ).on_conflict_do_update(
            index_elements=["child_id", "species_id"], set_={"remaining": 0, "rest_until": rest_until},
        )
        connection.execute(stmt)
        delta = (5 if side == winner else -3) if row["mode"] == "friend" and winner else 0
        if delta < 0:
            current = connection.execute(select(wildlife_leaderboard.c.points).where(
                wildlife_leaderboard.c.child_id == child_id,
            )).scalar() or 0
            delta = -min(-delta, max(current, 0))
        deltas[side] = delta
        if delta:
            stmt = _insert_for(connection, wildlife_leaderboard).values(
                child_id=child_id, points=delta,
            ).on_conflict_do_update(
                index_elements=["child_id"],
                set_={"points": wildlife_leaderboard.c.points + delta},
            )
            connection.execute(stmt)
    return deltas.get("player", 0), deltas.get("opponent")


def _update_state(connection, row, state: dict, events: list[dict], *, deadline_at: datetime | None) -> None:
    terminal = state["status"] == "completed"
    values: dict[str, Any] = {
        "state": state, "status": state["status"], "version": row["version"] + 1,
        "deadline_at": None if terminal else deadline_at,
        "updated_at": _now(), "settled": terminal,
    }
    updated = connection.execute(update(wildlife_matches).where(
        wildlife_matches.c.id == row["id"], wildlife_matches.c.version == row["version"],
        wildlife_matches.c.settled.is_(False),
    ).values(**values))
    if updated.rowcount != 1:
        raise HTTPException(409, "The match changed. Refresh and retry.")
    if terminal:
        owner_delta, guest_delta = _settle(connection, row, state)
        connection.execute(update(wildlife_matches).where(wildlife_matches.c.id == row["id"]).values(
            owner_leaderboard_delta=owner_delta,
            guest_leaderboard_delta=guest_delta,
        ))


def _bot_turn(state: dict) -> tuple[dict, list[dict]]:
    if state["status"] == "active" and state["turn"] == "opponent":
        action = wildlife_battle.choose_ai_action(state)
        return wildlife_battle.perform_action(state, "opponent", action)
    return state, []


def _refresh_timers(match_id: str, child_id: int) -> list[dict]:
    """Advance elapsed friend turns (no Energy for skipping) and a due bot opening move."""
    for _attempt in range(2):
        try:
            with engine.begin() as connection:
                row = _participant(connection, match_id, child_id)
                if row["status"] in ("completed", "expired", "canceled"):
                    return []
                now = _now()
                if now >= _aware(row["expires_at"]):
                    changed = connection.execute(update(wildlife_matches).where(
                        wildlife_matches.c.id == match_id,
                        wildlife_matches.c.version == row["version"],
                    ).values(status="expired", version=row["version"] + 1, deadline_at=None, updated_at=now))
                    if changed.rowcount != 1:
                        continue
                    return []
                if row["mode"] == "bot":
                    # Only the bot's opening move is deferred; later bot moves
                    # resolve in the same request as the explorer's action.
                    if (
                        row["status"] != "active" or row["state"]["turn"] != "opponent"
                        or now < _aware(row["updated_at"]) + BOT_OPENING_DELAY
                    ):
                        return []
                    state, events = _bot_turn(row["state"])
                    _update_state(connection, row, state, events, deadline_at=None)
                    return events
                if row["status"] != "active" or row["deadline_at"] is None:
                    return []
                deadline = _aware(row["deadline_at"])
                if now < deadline:
                    return []
                state = row["state"]
                events: list[dict] = []
                while state["status"] == "active" and now >= deadline:
                    state, skipped = wildlife_battle.skip_turn(state, state["turn"])
                    events.extend(skipped)
                    deadline += timedelta(seconds=TURN_SECONDS)
                _update_state(connection, row, state, events, deadline_at=deadline)
                return events
        except OperationalError as error:
            if not _busy(error):
                raise
        except HTTPException as error:
            if error.status_code != 409:
                raise
    raise HTTPException(409, "The match is busy. Retry shortly.")


def _mutation_error(error: Exception, match_id: str, child_id: int, request_id: str, operation: str, payload: dict):
    if isinstance(error, (IntegrityError, OperationalError)) or (isinstance(error, HTTPException) and error.status_code == 409):
        with engine.connect() as connection:
            _participant(connection, match_id, child_id)
            cached = _cached(connection, match_id, child_id, request_id, operation, payload)
            if cached is not None:
                return cached
        if isinstance(error, OperationalError) and _busy(error):
            raise HTTPException(409, "The match is busy. Retry the same request.") from error
    raise error


@router.post("")
def create_match(payload: CreateMatchIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    request = payload.model_dump(mode="json")
    try:
        with engine.begin() as connection:
            _lock_children(connection, user.child_id)
            if payload.client_request_id:
                existing = connection.execute(select(wildlife_matches).where(
                    wildlife_matches.c.owner_child_id == user.child_id,
                    wildlife_matches.c.create_request_id == payload.client_request_id,
                )).mappings().first()
                if existing is not None:
                    cached = _cached(connection, existing["id"], user.child_id, payload.client_request_id, "create", request)
                    if cached is not None:
                        return cached
                    raise HTTPException(409, "This request ID was already used.")
            _require_no_other_open_match(connection, user.child_id)
            if payload.friend_child_id is not None:
                if payload.mode != "friend":
                    raise HTTPException(400, "Only friend matches can invite a friend.")
                if not are_friends(connection, user.child_id, payload.friend_child_id):
                    raise HTTPException(403, "Add this explorer as a friend before inviting them.")
            cards, selectable = _rest_status(connection, user.child_id)
            habitat = wildlife_battle.choose_habitat(
                [raw_habitat for species_id, raw_habitat, _ in cards if species_id in selectable],
                secrets.SystemRandom(),
            )
            now = _now()
            match_id = str(uuid4())
            connection.execute(insert(wildlife_matches).values(
                id=match_id, mode=payload.mode,
                habitat=habitat,
                owner_child_id=user.child_id,
                invite_code=secrets.token_hex(6).upper() if payload.mode == "friend" else None,
                create_request_id=payload.client_request_id,
                status="setup", state=None, version=0,
                expires_at=now + timedelta(hours=MATCH_HOURS),
                created_at=now, updated_at=now, settled=False,
            ))
            if payload.friend_child_id is not None:
                connection.execute(insert(wildlife_match_invites).values(
                    match_id=match_id, invitee_child_id=payload.friend_child_id,
                ))
            row = _match(connection, match_id)
            response = _response(row, user.child_id)
            _save_request(connection, match_id, user.child_id, payload.client_request_id, "create", request, response)
            return response
    except IntegrityError as error:
        if payload.client_request_id:
            with engine.connect() as connection:
                existing = connection.execute(select(wildlife_matches.c.id).where(
                    wildlife_matches.c.owner_child_id == user.child_id,
                    wildlife_matches.c.create_request_id == payload.client_request_id,
                )).scalar_one_or_none()
                if existing:
                    cached = _cached(connection, existing, user.child_id, payload.client_request_id, "create", request)
                    if cached is not None:
                        return cached
        raise HTTPException(409, "The match could not be created. Retry with the same request ID.") from error
    except OperationalError as error:
        if _busy(error):
            raise HTTPException(409, "The match is busy. Retry the same request.") from error
        raise


@router.get("/me/rest")
def my_rest(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    with engine.connect() as connection:
        cards = _cards(connection, user.child_id, "")
    return {"cards": [
        {"species_id": card["species_id"], "rest_until": card["rest_until"], "selectable": card["selectable"]}
        for card in cards["cards"]
    ]}


@router.get("/me/current")
def current_match(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    # This route is before /{match_id}, and is the recovery path after a reload.
    for _ in range(3):
        with engine.connect() as connection:
            row = _open_match(connection, user.child_id)
        if row is None:
            return {"match": None}
        _refresh_timers(row["id"], user.child_id)
        with engine.connect() as connection:
            refreshed = _open_match(connection, user.child_id)
            if refreshed is None:
                return {"match": None}
            if refreshed["id"] == row["id"]:
                return _response(refreshed, user.child_id)
    raise HTTPException(409, "The current match changed. Retry.")


@router.get("/leaderboard")
def leaderboard(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    # The friend leaderboard ranks the explorer and their friends; anyone
    # without a ranked friend battle yet appears with 0 points.
    points = _floored_points()
    friend_ids = select(wildlife_friendships.c.friend_child_id).where(
        wildlife_friendships.c.child_id == user.child_id,
    )
    with engine.connect() as connection:
        rows = connection.execute(select(
            child_profiles.c.id, child_profiles.c.display_name, points,
        ).select_from(child_profiles.outerjoin(
            wildlife_leaderboard, wildlife_leaderboard.c.child_id == child_profiles.c.id,
        )).where(or_(
            child_profiles.c.id == user.child_id, child_profiles.c.id.in_(friend_ids),
        )).order_by(points.desc(), child_profiles.c.display_name, child_profiles.c.id)).all()
    entries = [
        {"rank": rank, "child_id": child_id, "display_name": name, "points": score}
        for rank, (child_id, name, score) in enumerate(rows, start=1)
    ]
    own = next(entry for entry in entries if entry["child_id"] == user.child_id)
    return {"entries": entries, "viewer": own}


@router.get("/invites/{code}")
def invite_preview(code: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    with engine.connect() as connection:
        row = connection.execute(select(wildlife_matches).where(
            wildlife_matches.c.invite_code == code, wildlife_matches.c.mode == "friend",
        )).mappings().first()
        if row is None:
            raise HTTPException(404, "Invite not found.")
        _require_live(row)
        if row["status"] != "waiting":
            raise HTTPException(409, "This invite is no longer open.")
        _require_invitee(connection, row, user.child_id)
        host_name = connection.execute(select(child_profiles.c.display_name).where(
            child_profiles.c.id == row["owner_child_id"],
        )).scalar_one()
        return {"invite": {
            "code": code, "match_id": row["id"], "habitat": row["habitat"],
            "status": row["status"], "host_display_name": host_name,
            "can_join": user.child_id != row["owner_child_id"],
        }}


@router.get("/invites/{code}/cards-preview")
def invite_cards_preview(code: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    with engine.connect() as connection:
        row = connection.execute(select(wildlife_matches).where(
            wildlife_matches.c.invite_code == code, wildlife_matches.c.mode == "friend",
        )).mappings().first()
        if row is None:
            raise HTTPException(404, "Invite not found.")
        _require_live(row)
        if row["status"] != "waiting":
            raise HTTPException(409, "This invite is no longer open.")
        if user.child_id == row["owner_child_id"]:
            raise HTTPException(403, "You cannot join your own match.")
        _require_invitee(connection, row, user.child_id)
        return _cards(connection, user.child_id, row["habitat"])


@router.post("/invites/{code}/join")
def join_match(code: str, payload: SelectCardIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    request = payload.model_dump(mode="json")
    try:
        with engine.begin() as connection:
            row = connection.execute(select(wildlife_matches).where(
                wildlife_matches.c.invite_code == code, wildlife_matches.c.mode == "friend",
            )).mappings().first()
            if row is None:
                raise HTTPException(404, "Invite not found.")
            if user.child_id == row["owner_child_id"]:
                raise HTTPException(403, "You cannot join your own match.")
            _require_invitee(connection, row, user.child_id)
            cached = _cached(connection, row["id"], user.child_id, payload.client_request_id, "join", request)
            if cached is not None:
                return cached
            _require_live(row)
            if row["status"] != "waiting" or row["guest_child_id"] is not None:
                raise HTTPException(409, "This invite is no longer open.")
            _lock_children(connection, row["owner_child_id"], user.child_id)
            _require_no_other_open_match(connection, row["owner_child_id"], excluding=row["id"])
            _require_no_other_open_match(connection, user.child_id, excluding=row["id"])
            guest_def, guest_habitat = _owned_card(connection, user.child_id, payload.species_id)
            _, owner_selectable = _rest_status(connection, row["owner_child_id"])
            if row["owner_species_id"] not in owner_selectable:
                raise HTTPException(409, "The host's card is resting. Ask the host to select another card.")
            owner_def = get_battle_definition(row["owner_species_id"])
            owner_habitat = wildlife_battle.species_habitat_group(row["owner_species_id"])
            state = wildlife_battle.new_match(
                owner_def, guest_def, habitat=row["habitat"],
                player_habitat=owner_habitat, opponent_habitat=guest_habitat,
                player_unlocked=get_unlocked_abilities_for_child(row["owner_child_id"], row["owner_species_id"], connection),
                opponent_unlocked=get_unlocked_abilities_for_child(user.child_id, payload.species_id, connection),
                mode="friend", initiative=secrets.choice(("player", "opponent")),
            )
            now = _now()
            updated = connection.execute(update(wildlife_matches).where(
                wildlife_matches.c.id == row["id"], wildlife_matches.c.version == row["version"],
                wildlife_matches.c.status == "waiting", wildlife_matches.c.guest_child_id.is_(None),
            ).values(
                guest_child_id=user.child_id, guest_species_id=payload.species_id,
                status="active", state=state, version=row["version"] + 1,
                deadline_at=now + timedelta(seconds=TURN_SECONDS), updated_at=now,
            ))
            if updated.rowcount != 1:
                raise HTTPException(409, "Another explorer joined this match.")
            current = _match(connection, row["id"])
            response = _response(current, user.child_id)
            _save_request(connection, row["id"], user.child_id, payload.client_request_id, "join", request, response)
            return response
    except (IntegrityError, OperationalError, HTTPException) as error:
        if isinstance(error, (IntegrityError, OperationalError)) or (isinstance(error, HTTPException) and error.status_code == 409):
            with engine.connect() as connection:
                row = connection.execute(select(wildlife_matches.c.id).where(
                    wildlife_matches.c.invite_code == code,
                )).scalar_one_or_none()
                if row:
                    cached = _cached(connection, row, user.child_id, payload.client_request_id, "join", request)
                    if cached is not None:
                        return cached
            if isinstance(error, OperationalError) and _busy(error):
                raise HTTPException(409, "The match is busy. Retry the same request.") from error
        raise


@router.get("/{match_id}/cards-preview")
def match_cards_preview(match_id: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    with engine.connect() as connection:
        row = _participant(connection, match_id, user.child_id)
        _require_live(row)
        return _cards(connection, user.child_id, row["habitat"])


@router.post("/{match_id}/select")
def select_card(match_id: str, payload: SelectCardIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    request = payload.model_dump(mode="json")
    try:
        with engine.begin() as connection:
            row = _participant(connection, match_id, user.child_id)
            if user.child_id != row["owner_child_id"]:
                raise HTTPException(403, "Only the match creator can select this card.")
            cached = _cached(connection, match_id, user.child_id, payload.client_request_id, "select", request)
            if cached is not None:
                return cached
            _require_live(row)
            if row["status"] not in ("setup", "waiting"):
                raise HTTPException(409, "Card selection is closed for this match.")
            player_def, player_habitat = _owned_card(connection, user.child_id, payload.species_id)
            values: dict[str, Any] = {"owner_species_id": payload.species_id, "updated_at": _now()}
            if row["mode"] == "friend":
                values["status"] = "waiting"
            else:
                active_ids = set(connection.execute(select(species.c.id).where(
                    species.c.is_active.is_(True),
                )).scalars())
                unlocked = get_unlocked_abilities_for_child(user.child_id, payload.species_id, connection)
                try:
                    opponent_def, opponent_unlocked, _ = choose_opponent(
                        get_catalogue(), active_ids, player_def, unlocked, "standard", secrets.SystemRandom(),
                    )
                except ValueError as error:
                    raise HTTPException(503, "No bot opponent is available.") from error
                opponent_habitat = wildlife_battle.species_habitat_group(opponent_def["species_id"])
                state = wildlife_battle.new_match(
                    player_def, opponent_def, habitat=row["habitat"],
                    player_habitat=player_habitat, opponent_habitat=opponent_habitat,
                    player_unlocked=unlocked, opponent_unlocked=opponent_unlocked,
                    mode="bot", initiative=secrets.choice(("player", "opponent")),
                )
                # A bot with initiative moves on a later poll (BOT_OPENING_DELAY).
                values.update(guest_species_id=opponent_def["species_id"], status="active", state=state)
            updated = connection.execute(update(wildlife_matches).where(
                wildlife_matches.c.id == match_id, wildlife_matches.c.version == row["version"],
                wildlife_matches.c.status == row["status"],
            ).values(**values, version=row["version"] + 1))
            if updated.rowcount != 1:
                raise HTTPException(409, "The match changed. Refresh and retry.")
            current = _match(connection, match_id)
            response = _response(current, user.child_id)
            _save_request(connection, match_id, user.child_id, payload.client_request_id, "select", request, response)
            return response
    except (IntegrityError, OperationalError, HTTPException) as error:
        return _mutation_error(error, match_id, user.child_id, payload.client_request_id, "select", request)


@router.get("/{match_id}")
def get_match(match_id: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    events = _refresh_timers(match_id, user.child_id)
    with engine.connect() as connection:
        row = _participant(connection, match_id, user.child_id)
        _require_live(row)
        return _response(row, user.child_id, events)


@router.post("/{match_id}/cancel")
def cancel_match(match_id: str, payload: CancelIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    request = payload.model_dump(mode="json")
    try:
        with engine.begin() as connection:
            row = _participant(connection, match_id, user.child_id)
            if user.child_id != row["owner_child_id"]:
                raise HTTPException(403, "Only the host can cancel this match.")
            cached = _cached(connection, match_id, user.child_id, payload.client_request_id, "cancel", request)
            if cached is not None:
                return cached
            _require_live(row)
            if row["status"] not in ("setup", "waiting"):
                raise HTTPException(409, "Only an unstarted match can be canceled.")
            if row["version"] != payload.expected_version:
                raise HTTPException(409, "The match changed. Refresh and retry.")
            changed = connection.execute(update(wildlife_matches).where(
                wildlife_matches.c.id == match_id,
                wildlife_matches.c.version == row["version"],
                wildlife_matches.c.status == row["status"],
            ).values(status="canceled", version=row["version"] + 1, updated_at=_now()))
            if changed.rowcount != 1:
                raise HTTPException(409, "The match changed. Refresh and retry.")
            response = _response(_match(connection, match_id), user.child_id)
            _save_request(connection, match_id, user.child_id, payload.client_request_id, "cancel", request, response)
            return response
    except (IntegrityError, OperationalError, HTTPException) as error:
        return _mutation_error(error, match_id, user.child_id, payload.client_request_id, "cancel", request)


def _act(match_id: str, payload: ActionIn | ForfeitIn, user: AuthenticatedUser, operation: str):
    request = payload.model_dump(mode="json")
    # Timer processing commits separately, so a stale-version rejection cannot undo a skip.
    _refresh_timers(match_id, user.child_id)
    try:
        with engine.begin() as connection:
            row = _participant(connection, match_id, user.child_id)
            cached = _cached(connection, match_id, user.child_id, payload.client_request_id, operation, request)
            if cached is not None:
                return cached
            _require_live(row)
            if row["status"] != "active" or row["settled"]:
                raise HTTPException(409, "This match is not active.")
            if row["version"] != payload.expected_version:
                raise HTTPException(409, "The match changed. Refresh and retry.")
            if row["mode"] == "friend" and row["deadline_at"] and _now() >= _aware(row["deadline_at"]):
                raise HTTPException(409, "The turn deadline passed. Refresh the match.")
            side = _side(row, user.child_id)
            try:
                if operation == "forfeit":
                    state, events = wildlife_battle.forfeit(row["state"], side)
                else:
                    state, events = wildlife_battle.perform_action(row["state"], side, payload.action)
                    if row["mode"] == "bot":
                        state, bot_events = _bot_turn(state)
                        events.extend(bot_events)
            except ValueError as error:
                raise HTTPException(400, str(error)) from error
            deadline = _now() + timedelta(seconds=TURN_SECONDS) if row["mode"] == "friend" else None
            _update_state(connection, row, state, events, deadline_at=deadline)
            current = _match(connection, match_id)
            response = _response(current, user.child_id, events)
            _save_request(connection, match_id, user.child_id, payload.client_request_id, operation, request, response)
            return response
    except (IntegrityError, OperationalError, HTTPException) as error:
        return _mutation_error(error, match_id, user.child_id, payload.client_request_id, operation, request)


@router.post("/{match_id}/action")
def play_action(match_id: str, payload: ActionIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    return _act(match_id, payload, user, "action")


@router.post("/{match_id}/forfeit")
def forfeit_match(match_id: str, payload: ForfeitIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    return _act(match_id, payload, user, "forfeit")
