"""Friend codes, the Friend List, and battle invitations between friends."""
from __future__ import annotations

from datetime import datetime, timezone
import re
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func, insert, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import engine
from app.core.schema import (
    child_profiles, wildlife_friend_codes, wildlife_friendships, wildlife_leaderboard,
    wildlife_match_invites, wildlife_matches,
)
from app.schemas.wildlife_match import AddFriendIn


router = APIRouter(prefix="/api/v1/friends", tags=["Friends"])
# No 0/O or 1/I, so a code read aloud or copied by hand stays unambiguous.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def normalise_code(raw: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", raw.upper())


def ensure_friend_code(child_id: int) -> str:
    """Return the explorer's permanent friend code, creating it on first use."""
    for _attempt in range(5):
        with engine.connect() as connection:
            code = connection.execute(select(wildlife_friend_codes.c.code).where(
                wildlife_friend_codes.c.child_id == child_id,
            )).scalar_one_or_none()
        if code is not None:
            return code
        candidate = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        try:
            with engine.begin() as connection:
                connection.execute(insert(wildlife_friend_codes).values(child_id=child_id, code=candidate))
            return candidate
        except IntegrityError:
            # A concurrent request created this explorer's code, or the random
            # code collided with another explorer's. Re-read, then retry.
            continue
    raise HTTPException(503, "Could not create a friend code. Please try again.")


def are_friends(connection, child_id: int, friend_child_id: int) -> bool:
    return connection.execute(select(wildlife_friendships.c.child_id).where(
        wildlife_friendships.c.child_id == child_id,
        wildlife_friendships.c.friend_child_id == friend_child_id,
    )).first() is not None


def _floored_points():
    points = func.coalesce(wildlife_leaderboard.c.points, 0)
    return case((points < 0, 0), else_=points)


def _friend_rows(connection, child_id: int, *, only: int | None = None):
    statement = select(
        child_profiles.c.id, child_profiles.c.display_name, child_profiles.c.avatar, _floored_points(),
    ).select_from(
        wildlife_friendships
        .join(child_profiles, child_profiles.c.id == wildlife_friendships.c.friend_child_id)
        .outerjoin(wildlife_leaderboard, wildlife_leaderboard.c.child_id == child_profiles.c.id)
    ).where(wildlife_friendships.c.child_id == child_id)
    if only is not None:
        statement = statement.where(child_profiles.c.id == only)
    statement = statement.order_by(func.lower(child_profiles.c.display_name), child_profiles.c.id)
    return [
        {"child_id": friend_id, "display_name": name, "avatar": avatar, "points": points}
        for friend_id, name, avatar, points in connection.execute(statement).all()
    ]


def _invites(connection, child_id: int) -> tuple[list[dict], list[dict]]:
    now = datetime.now(timezone.utc)
    host = child_profiles.alias("host")
    invitee = child_profiles.alias("invitee")
    rows = connection.execute(select(
        wildlife_matches.c.id, wildlife_matches.c.status, wildlife_matches.c.invite_code,
        wildlife_matches.c.habitat, wildlife_matches.c.owner_child_id, host.c.display_name,
        wildlife_match_invites.c.invitee_child_id, invitee.c.display_name, wildlife_matches.c.expires_at,
    ).select_from(
        wildlife_match_invites
        .join(wildlife_matches, wildlife_matches.c.id == wildlife_match_invites.c.match_id)
        .join(host, host.c.id == wildlife_matches.c.owner_child_id)
        .join(invitee, invitee.c.id == wildlife_match_invites.c.invitee_child_id)
    ).where(
        wildlife_matches.c.status.in_(("setup", "waiting")),
        wildlife_matches.c.expires_at > now,
        (wildlife_matches.c.owner_child_id == child_id) | (wildlife_match_invites.c.invitee_child_id == child_id),
    ).order_by(wildlife_matches.c.created_at.desc())).all()
    incoming, outgoing = [], []
    for match_id, status, code, habitat, host_id, host_name, invitee_id, invitee_name, expires_at in rows:
        expires = (expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)).isoformat()
        if host_id == child_id:
            outgoing.append({
                "match_id": match_id, "status": status, "expires_at": expires,
                "friend_child_id": invitee_id, "friend_display_name": invitee_name,
            })
        elif status == "waiting":
            # The host has not picked a card yet while the match is in setup.
            incoming.append({
                "match_id": match_id, "invite_code": code, "habitat": habitat, "expires_at": expires,
                "friend_child_id": host_id, "friend_display_name": host_name,
            })
    return incoming, outgoing


@router.get("")
def list_friends(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    code = ensure_friend_code(user.child_id)
    with engine.connect() as connection:
        friends = _friend_rows(connection, user.child_id)
        incoming, outgoing = _invites(connection, user.child_id)
    return {
        "friend_code": code, "friends": friends,
        "incoming_invites": incoming, "outgoing_invites": outgoing,
    }


@router.post("")
def add_friend(payload: AddFriendIn, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    code = normalise_code(payload.code)
    if not code:
        raise HTTPException(400, "Enter your friend's code first.")
    with engine.begin() as connection:
        friend_id = connection.execute(select(wildlife_friend_codes.c.child_id).where(
            wildlife_friend_codes.c.code == code,
        )).scalar_one_or_none()
        if friend_id is None:
            raise HTTPException(404, "No explorer has that friend code. Check it and try again.")
        if friend_id == user.child_id:
            raise HTTPException(400, "That is your own friend code. Share it with a friend instead.")
        already = are_friends(connection, user.child_id, friend_id)
        insert_for = pg_insert if connection.dialect.name == "postgresql" else sqlite_insert
        now = datetime.now(timezone.utc)
        # Friendship is mutual: adding a code puts each explorer in the other's list.
        for child_id, other_id in ((user.child_id, friend_id), (friend_id, user.child_id)):
            connection.execute(insert_for(wildlife_friendships).values(
                child_id=child_id, friend_child_id=other_id, created_at=now,
            ).on_conflict_do_nothing(index_elements=["child_id", "friend_child_id"]))
        friend = _friend_rows(connection, user.child_id, only=friend_id)[0]
    return {"friend": friend, "already_friends": already}


@router.post("/invites/{match_id}/decline")
def decline_invite(match_id: str, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    """The invited friend says no: the match is canceled, so the host's waiting screen ends."""
    with engine.begin() as connection:
        row = connection.execute(select(wildlife_matches.c.status, wildlife_matches.c.version).select_from(
            wildlife_match_invites.join(wildlife_matches, wildlife_matches.c.id == wildlife_match_invites.c.match_id)
        ).where(
            wildlife_match_invites.c.match_id == match_id,
            wildlife_match_invites.c.invitee_child_id == user.child_id,
        )).first()
        if row is None:
            raise HTTPException(404, "That battle invitation was not found.")
        if row.status not in ("setup", "waiting"):
            # Already started, finished, canceled or expired: nothing left to decline.
            return {"declined": False}
        changed = connection.execute(update(wildlife_matches).where(
            wildlife_matches.c.id == match_id,
            wildlife_matches.c.version == row.version,
            wildlife_matches.c.status == row.status,
        ).values(status="canceled", version=row.version + 1, updated_at=datetime.now(timezone.utc)))
        if changed.rowcount != 1:
            raise HTTPException(409, "The invitation changed. Refresh and try again.")
    return {"declined": True}
