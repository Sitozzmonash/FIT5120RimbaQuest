"""Deterministic opponent matching for the server-authoritative battle mode."""
from __future__ import annotations

import copy
from typing import Any, Protocol


class ChoiceRng(Protocol):
    def choice(self, values: list[Any]) -> Any: ...


def _utility_value(effect: dict[str, Any], base_attack: float = 10.0) -> float:
    kind = effect.get("type")
    value = float(effect.get("value", 0) or 0)
    if kind in ("shield", "heal"):
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


def compute_effective_rating(definition: dict[str, Any], unlocked_slots: list[int]) -> float:
    """Estimate combat power using HP, base attack, unlocked abilities, passive EV, and opening shield."""
    hp = float(definition.get("hp", 100) or 100)
    base_attack = float(definition.get("base_attack", 10) or 10)
    unlocked = set(unlocked_slots)

    active_abilities = [a for a in definition.get("abilities", []) if a.get("slot") in unlocked]
    if active_abilities:
        move_scores: list[float] = []
        for ab in active_abilities:
            effects = ab.get("effects", [])
            dmg = sum(float(e.get("value", 0) or 0) for e in effects if e.get("type") == "damage")
            util = sum(_utility_value(e, base_attack) for e in effects if e.get("type") != "damage")
            move_scores.append(dmg + util)
        expected_move = sum(move_scores) / len(move_scores)
    else:
        expected_move = base_attack

    passive_value = 0.0
    if 3 in unlocked and definition.get("passive"):
        passive = definition["passive"]
        trigger = passive.get("trigger")
        effects = passive.get("effects", [])
        for e in effects:
            val = float(e.get("value", 0) or 0)
            if trigger == "battle_start":
                passive_value += val * 0.9
            elif trigger == "first_active":
                passive_value += val * (0.9 if active_abilities else 0.0)
            elif trigger in ("first_incoming_active", "first_incoming_basic"):
                passive_value += val * 0.8
            elif trigger == "every_third_action_damage":
                passive_value += val * 2.2
            elif trigger == "every_third_action_heal":
                passive_value += val * 1.8
            elif trigger == "low_energy":
                passive_value += val * 0.85
            elif trigger == "first_lucky":
                passive_value += val * 0.75
            elif trigger == "low_roll_reroll":
                max_trig = float(passive.get("max_triggers", 2) or 2)
                passive_value += max_trig * 1.8

    opening_shield_ev = 3.75
    return round(hp + (expected_move * 4.2) + passive_value + opening_shield_ev, 2)


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
