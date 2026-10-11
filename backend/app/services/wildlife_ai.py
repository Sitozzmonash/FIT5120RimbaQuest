"""Standard-difficulty decision policy for dice-free Wildlife Card Battles.

The policy file is learned offline from simulated wins (+1) and losses (-1).
It adjusts, rather than replaces, transparent tactical scoring. This module
only chooses a legal action; wildlife_battle resolves every game effect.
"""

from __future__ import annotations

from functools import lru_cache
import copy
import json
from pathlib import Path
import secrets
from typing import Any

from app.services.wildlife_battle import legal_actions, perform_action

POLICY_PATH = Path(__file__).resolve().parents[2] / "data" / "wildlife_ai_policy.json"


@lru_cache(maxsize=1)
def _load_policy() -> dict[str, float]:
    try:
        with POLICY_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if data.get("version") != 2:
            return {}
        return {str(key): float(value) for key, value in data.get("q_values", {}).items()}
    except (OSError, ValueError, TypeError):
        return {}


def _bucket(value: int, maximum: int) -> int:
    ratio = value / max(1, maximum)
    if ratio <= 0.33:
        return 0
    if ratio <= 0.66:
        return 1
    return 2


def state_action_key(state: dict[str, Any], side: str, action: str) -> str:
    """Compact public-state features used by the offline learner."""
    other = "opponent" if side == "player" else "player"
    actor, target = state[side], state[other]
    energy_bucket = 0 if actor["energy"] < 4 else (1 if actor["energy"] < 6 else 2)
    target_energy_bucket = 0 if target["energy"] < 4 else (1 if target["energy"] < 6 else 2)
    actor_unlock_mask = sum(1 << (slot - 1) for slot in actor["unlocked_abilities"])
    target_unlock_mask = sum(1 << (slot - 1) for slot in target["unlocked_abilities"])
    return "|".join(map(str, (
        _bucket(actor["hp"], actor["max_hp"]),
        _bucket(target["hp"], target["max_hp"]),
        energy_bucket,
        target_energy_bucket,
        int(actor["habitat_advantage"]),
        actor_unlock_mask,
        target_unlock_mask,
        action,
    )))


def _incoming_threat(state: dict[str, Any], side: str) -> tuple[int, bool]:
    """Return the strongest legal next-action damage and whether it is lethal.

    The probe uses the shared battle engine on copies, so unlocked abilities,
    Energy costs, effects, shields and Habitat Advantage are all evaluated
    without mutating the live match.
    """
    other = "opponent" if side == "player" else "player"
    probe = copy.deepcopy(state)
    probe["turn"] = other
    actions = legal_actions(probe, other)
    current_hp = probe[side]["hp"]
    current_shield = probe[side]["shield"]
    strongest = 0
    lethal = False
    for action in actions:
        outcome, _ = perform_action(probe, other, action)
        hp_damage = current_hp - outcome[side]["hp"]
        shield_damage = current_shield - outcome[side]["shield"]
        strongest = max(strongest, hp_damage + max(0, shield_damage))
        lethal = lethal or outcome.get("winner") == other
    return strongest, lethal


def _score_action(state: dict[str, Any], side: str, action: str,
                  policy: dict[str, float]) -> float:
    other = "opponent" if side == "player" else "player"
    actor, target = state[side], state[other]
    next_state, _ = perform_action(state, side, action)
    next_actor, next_target = next_state[side], next_state[other]
    hp_damage = target["hp"] - next_target["hp"]
    hp_healed = next_actor["hp"] - actor["hp"]
    shield_damage = target["shield"] - next_target["shield"]
    shield_gain = next_actor["shield"] - actor["shield"]
    energy_gain = next_actor["energy"] - actor["energy"]
    incoming_damage, incoming_lethal = _incoming_threat(state, side)
    threatened = incoming_lethal or actor["hp"] <= max(target["attack"] * 2, incoming_damage * 2)
    defence_weight = 1.2 if threatened else 0.7
    score = (
        hp_damage
        + (1.2 if threatened else 0.85) * max(0, hp_healed)
        + 0.75 * max(0, shield_damage)
        + defence_weight * max(0, shield_gain)
        + defence_weight * max(0, next_actor["block"] - actor["block"])
        + defence_weight * target["attack"] * max(0, next_actor["guard"] - actor["guard"]) / 100
        + 0.65 * max(0, next_actor["boost"] - actor["boost"])
        + 0.65 * max(0, next_target["weaken"] - target["weaken"])
        + 0.85 * energy_gain
    )
    # Defensive effects gain value in proportion to the strongest legal
    # response available to the child, not only the Basic Attack stat.
    score += 0.08 * incoming_damage * (
        max(0, shield_gain)
        + max(0, next_actor["block"] - actor["block"])
        + max(0, next_actor["guard"] - actor["guard"]) / 10
    )
    if 3 in actor["unlocked_abilities"] and actor["energy"] < 4 <= next_actor["energy"]:
        score += 1.4
    if next_state["winner"] == side:
        score += 100
    score += 2.0 * max(-1.0, min(1.0, policy.get(state_action_key(state, side, action), 0.0)))
    return score


def choose_for_side(state: dict[str, Any], side: str, *, rng: Any = None,
                    policy: dict[str, float] | None = None,
                    exploration: float = 0.08) -> str:
    """Choose a legal move with bounded variation for balanced practice play."""
    actions = legal_actions(state, side)
    if not actions:
        raise ValueError(f"No legal action available for {side}")
    if len(actions) == 1:
        return actions[0]
    generator = rng if rng is not None else secrets.SystemRandom()
    learned = _load_policy() if policy is None else policy
    scores = {action: _score_action(state, side, action, learned) for action in actions}
    # An available finishing move is never sacrificed to exploration.
    winning = [action for action in actions if scores[action] >= 100]
    if winning:
        return max(winning, key=lambda action: scores[action])
    if generator.random() < exploration:
        return generator.choice(actions)
    return max(actions, key=lambda action: scores[action] + generator.uniform(-1.2, 1.2))


def choose_ai_action(state: dict[str, Any], rng: Any = None) -> str:
    return choose_for_side(state, "opponent", rng=rng)
