"""Deterministic opponent matching for the server-authoritative battle mode."""
from __future__ import annotations

import copy
from typing import Any, Protocol


class ChoiceRng(Protocol):
    def choice(self, values: list[Any]) -> Any: ...


_COSTS = {1: 1, 2: 2, 3: 4}
_HARD_SKILL_DAMAGE_BONUS = 10
_OPENING_SHIELD_BY_MAX_SLOT = {0: 3, 1: 7, 2: 8, 3: 10}


def _utility_value(effect: dict[str, Any], base_attack: float = 10.0) -> float:
    kind = effect.get("type")
    value = float(effect.get("value", 0) or 0)
    if kind in ("shield", "heal"):
        return value * 0.85
    elif kind == "heal_hp":
        return value * 0.85
    elif kind == "guard":
        return (value / 100.0) * base_attack
    elif kind in ("weaken", "boost"):
        return value * 0.85
    elif kind == "reroll":
        return 2.0
    elif kind == "reduce_damage":
        return value * 0.8
    return 0.0


def _runtime_effect(effect: dict[str, Any]) -> dict[str, Any]:
    kind = effect.get("type")
    value = max(0.0, float(effect.get("value", 0) or 0))
    if kind == "heal":
        kind = "heal_hp"
    elif kind == "reroll":
        kind, value = "guard", 20.0
    elif kind == "reduce_damage":
        kind = "block"
    return {"type": kind, "value": value, "target": effect.get("target", "self")}


def _move_score(effects: list[dict[str, Any]], base_attack: float) -> float:
    damage = sum(float(e.get("value", 0) or 0) for e in effects if e.get("type") == "damage")
    utility = sum(_utility_value(e, base_attack) for e in effects if e.get("type") != "damage")
    return damage + utility


def _opening_shield_value(unlocked_slots: list[int]) -> float:
    highest = max((slot for slot in unlocked_slots if slot in _COSTS), default=0)
    return float(_OPENING_SHIELD_BY_MAX_SLOT[highest])


def _third_ability_score(definition: dict[str, Any], base_attack: float) -> float:
    passive = definition.get("passive") or {}
    characteristic = []
    for effect in passive.get("effects", []):
        if effect.get("type") == "reroll":
            characteristic.append({"type": "guard", "value": 40.0, "target": "self"})
        else:
            characteristic.append(_runtime_effect(effect))
    bonus_damage = sum(e["value"] for e in characteristic if e["type"] == "damage")
    runtime_effects = [
        {"type": "damage", "value": base_attack + _HARD_SKILL_DAMAGE_BONUS + bonus_damage, "target": "opponent"},
        *(e for e in characteristic if e["type"] != "damage"),
    ]
    # High-cost hard skills are strong but appear less often than basic or
    # low-cost moves because the energy cap is 8 and recharge is +2 per turn.
    return _move_score(runtime_effects, base_attack) * 0.75


def compute_effective_rating(definition: dict[str, Any], unlocked_slots: list[int]) -> float:
    """Estimate energy-mode power from HP, moves, unlock tier, and opening shield."""
    hp = float(definition.get("hp", 100) or 100)
    base_attack = float(definition.get("base_attack", 10) or 10)
    unlocked = set(unlocked_slots)

    move_scores = [base_attack]
    for ability in definition.get("abilities", []):
        if ability.get("slot") in unlocked:
            move_scores.append(_move_score([_runtime_effect(e) for e in ability.get("effects", [])], base_attack))
    if 3 in unlocked and definition.get("passive"):
        move_scores.append(_third_ability_score(definition, base_attack))

    expected_move = sum(move_scores) / len(move_scores)
    opening_shield_ev = _opening_shield_value(list(unlocked))
    return round(hp + (expected_move * 4.2) + opening_shield_ev, 2)


# Alias for backwards compatibility if needed
power_rating = compute_effective_rating


def choose_opponent(
    catalogue: dict[str, dict[str, Any]],
    active_ids: set[str] | list[str] | Any,
    player_definition: dict[str, Any],
    player_slots: list[int],
    difficulty: str = "standard",
    rng: Any = None,
) -> tuple[dict[str, Any], list[int], dict[str, Any]]:
    """Select the nearest rating candidate from active species excluding the player.

    Matches nearest rating candidate, using role diversity within tied nearest candidates,
    and assigns opponent slots based on difficulty (standard: mirrors player slots, practice: []).
    """
    active_set = set(active_ids)
    player_id = player_definition.get("species_id")
    player_role = player_definition.get("role")

    if difficulty == "practice":
        opponent_slots: list[int] = []
    else:
        opponent_slots = sorted(list(set(player_slots).intersection({1, 2, 3})))

    candidate_sids = [sid for sid in catalogue if sid in active_set and sid != player_id]
    if not candidate_sids:
        raise ValueError("No active opponent species available")

    player_rating = compute_effective_rating(player_definition, player_slots)

    scored: list[dict[str, Any]] = []
    for species_id in candidate_sids:
        cand_def = catalogue[species_id]
        rating = compute_effective_rating(cand_def, opponent_slots)
        ratio = round(rating / player_rating, 2) if player_rating > 0 else 1.0
        scored.append({
            "species_id": species_id,
            "definition": cand_def,
            "role": cand_def.get("role"),
            "rating": rating,
            "ratio": ratio,
            "diff": abs(rating - player_rating),
        })

    min_diff = min(c["diff"] for c in scored)
    tied = [c for c in scored if c["diff"] <= min_diff + 0.15]

    different_role = [c for c in tied if c["role"] != player_role]
    pool = different_role if different_role else tied

    if rng is not None and hasattr(rng, "choice"):
        selected = rng.choice(pool)
    elif rng is not None and hasattr(rng, "randint") and len(pool) > 1:
        idx = rng.randint(0, len(pool) - 1)
        selected = pool[idx]
    else:
        selected = sorted(pool, key=lambda item: (item["diff"], item["species_id"]))[0]

    chosen_def = copy.deepcopy(selected["definition"])
    opponent_rating = selected["rating"]
    power_ratio = round(opponent_rating / player_rating, 2) if player_rating > 0 else 1.0

    match_info: dict[str, Any] = {
        "difficulty": difficulty,
        "player_rating": player_rating,
        "opponent_rating": opponent_rating,
        "power_ratio": power_ratio,
        "ratio": power_ratio,
        "selected_id": selected["species_id"],
        "opponent_slots": list(opponent_slots),
        "pool_size": len(pool),
    }

    return chosen_def, opponent_slots, match_info
