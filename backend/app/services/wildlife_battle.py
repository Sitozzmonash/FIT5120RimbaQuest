"""Pure, dice-free Wildlife Card Battle rules from the mechanism summary.

The catalogue predates this mode: its ``heal`` restores the old battle health
bar (previously called Energy), which is HP in this mode, and
``reroll`` needs a dice-free meaning. Active rerolls become one-hit 20% guards.
Passive slot 3 becomes a paid, stronger attack based on the basic stat plus
its characteristic effect: reroll -> 40% guard, opening shield -> shield,
incoming damage reduction -> one-hit block, and HP recovery/extra damage
retain their meaning. No passive fires automatically in this battle mode.
"""

from __future__ import annotations

import copy
import math
import re
from typing import Any

HABITATS: tuple[str, ...] = (
    "Rainforest",
    "Mangrove",
    "Wetland",
    "Grassland",
    "Coastal",
)

_HABITAT_WORDS = {
    "Rainforest": r"\brain\s*forests?\b|\bjungles?\b|\bforests?\b|\bwoodlands?\b",
    "Mangrove": r"\bmangroves?\b",
    "Wetland": r"\bwetlands?\b|\bswamps?\b|\bmarsh(?:es)?\b|\brivers?\b|\briverine\b|\blakes?\b|\bstreams?\b|\bponds?\b|\bfreshwater\b|\bestuar(?:y|ies)\b",
    "Grassland": r"\bgrasslands?\b|\bgrasses\b|\bgrass\b|\bsavannas?\b|\bscrublands?\b|\bscrub\b|\bmeadows?\b",
    "Coastal": r"\bcoasts?\b|\bcoastal\b|\bbeaches?\b|\bseas?\b|\boceans?\b|\bmarine\b|\bcorals?\b|\bseagrass\b|\bestuar(?:y|ies)\b",
}
_COSTS = {1: 1, 2: 2, 3: 4}
_SHIELD_CAP = 25
_MAX_ENERGY = 8


def habitat_matches(habitat_text: str | None, habitat: str) -> bool:
    """Classify a species' free-text habitat; unknown data grants no bonus."""
    if not isinstance(habitat_text, str) or habitat not in HABITATS:
        return False
    text = habitat_text.casefold()
    if habitat == "Rainforest" and "mangrove" in text:
        # A mangrove forest alone is not necessarily a tropical rainforest.
        text = re.sub(r"\bmangrove\s+forests?\b", "mangrove", text)
    return re.search(_HABITAT_WORDS[habitat], text) is not None


def _other(side: str) -> str:
    if side == "player":
        return "opponent"
    if side == "opponent":
        return "player"
    raise ValueError(f"Unknown battle side: {side}")


def _normalise_effect(effect: dict[str, Any]) -> dict[str, Any]:
    kind = effect.get("type")
    value = max(0, int(effect.get("value", 0)))
    target = effect.get("target", "self")
    if kind == "heal":
        kind = "heal_hp"
    elif kind == "reroll":
        kind, value = "guard", 20
    elif kind == "reduce_damage":
        kind = "block"
    if kind not in {"damage", "heal_hp", "shield", "guard", "boost", "weaken", "block"}:
        raise ValueError(f"Unknown battle effect: {kind}")
    if target not in {"self", "opponent"}:
        raise ValueError(f"Unknown effect target: {target}")
    return {"type": kind, "value": value, "target": target}


def _describe_effects(effects: list[dict[str, Any]]) -> str:
    phrases: list[str] = []
    for effect in effects:
        kind, value = effect["type"], effect["value"]
        if kind == "damage":
            phrases.append(f"Deal {value} damage")
        elif kind == "heal_hp":
            phrases.append(f"Restore {value} HP")
        elif kind == "shield":
            phrases.append(f"Gain {value} Shield")
        elif kind == "guard":
            phrases.append(f"Reduce the next hit by {value}%")
        elif kind == "block":
            phrases.append(f"Block {value} damage from the next hit")
        elif kind == "boost":
            phrases.append(f"Next attack gains {value} damage")
        elif kind == "weaken":
            phrases.append(f"Opponent's next attack loses {value} damage")
    return "; ".join(phrases) + "."


def _third_ability(definition: dict[str, Any], attack: int) -> dict[str, Any]:
    passive = definition.get("passive") or {}
    characteristic: list[dict[str, Any]] = []
    for original in passive.get("effects", []):
        kind = original.get("type")
        if kind == "reroll":
            characteristic.append({"type": "guard", "value": 40, "target": "self"})
        else:
            converted = _normalise_effect(original)
            characteristic.append(converted)
    # The former passive is now the sole action for this turn. Five extra
    # damage makes the hard-quiz unlock worth its 4-Energy cost while retaining
    # the individual species' basic attack as the damage baseline.
    bonus_damage = sum(effect["value"] for effect in characteristic if effect["type"] == "damage")
    effects = [
        {"type": "damage", "value": attack + 5 + bonus_damage, "target": "opponent"},
        *(effect for effect in characteristic if effect["type"] != "damage"),
    ]
    return {
        "slot": 3,
        "kind": "active",
        "name": passive.get("name") or "Wild Instinct",
        "description": _describe_effects(effects),
        "cost": _COSTS[3],
        "effects": effects,
        "animation": "lunge",
        "vfx": "stars",
    }


def _combatant(
    definition: dict[str, Any], habitat: str, natural_habitat: str | None,
    unlocked: list[int],
) -> dict[str, Any]:
    hp = int(definition["hp"])
    attack = int(definition["base_attack"])
    if hp <= 0 or attack <= 0:
        raise ValueError("Wildlife HP and base attack must be positive")
    unlocked_set = set(unlocked)
    if any(slot not in _COSTS for slot in unlocked_set):
        raise ValueError("Only ability slots 1, 2 and 3 can be unlocked")
    abilities = []
    for raw in definition.get("abilities", []):
        slot = int(raw["slot"])
        if slot not in (1, 2):
            raise ValueError("Catalogue active abilities must occupy slots 1 or 2")
        effects = [_normalise_effect(effect) for effect in raw["effects"]]
        abilities.append({
            "slot": slot,
            "kind": "active",
            "name": raw["name"],
            "description": _describe_effects(effects),
            "cost": _COSTS[slot],
            "effects": effects,
            "animation": raw.get("animation", "lunge"),
            "vfx": raw.get("vfx", "stars"),
        })
    abilities.append(_third_ability(definition, attack))
    if {ability["slot"] for ability in abilities} != {1, 2, 3}:
        raise ValueError("Each wildlife card needs three distinct abilities")
    for ability in abilities:
        ability["unlocked"] = ability["slot"] in unlocked_set
    return {
        "species_id": definition["species_id"],
        "name": definition["name"],
        "category": definition.get("category", ""),
        "role": definition.get("role", ""),
        "hp": hp,
        "max_hp": hp,
        "attack": attack,
        "base_attack": attack,
        "energy": 5,
        "max_energy": _MAX_ENERGY,
        "habitat_advantage": habitat_matches(natural_habitat, habitat),
        "shield": 0,
        "guard": 0,
        "block": 0,
        "boost": 0,
        "weaken": 0,
        "unlocked_abilities": sorted(unlocked_set),
        "abilities": sorted(abilities, key=lambda item: item["slot"]),
    }


def new_match(
    player_def: dict[str, Any], opponent_def: dict[str, Any], *,
    habitat: str, player_habitat: str | None, opponent_habitat: str | None,
    player_unlocked: list[int], opponent_unlocked: list[int], mode: str,
    initiative: str,
) -> dict[str, Any]:
    """Create a JSON-serialisable match after habitat/card selection."""
    if habitat not in HABITATS:
        raise ValueError(f"Unknown habitat: {habitat}")
    if initiative not in {"player", "opponent"}:
        raise ValueError("Initiative must be player or opponent")
    return {
        "rules_version": "wildlife-1",
        "mode": mode,
        "habitat": habitat,
        "status": "active",
        "turn": initiative,
        "winner": None,
        "turn_count": 0,
        "event_seq": 0,
        "events": [],
        "player": _combatant(player_def, habitat, player_habitat, player_unlocked),
        "opponent": _combatant(opponent_def, habitat, opponent_habitat, opponent_unlocked),
    }


def legal_actions(state: dict[str, Any], side: str) -> list[str]:
    _other(side)
    if state.get("status") != "active" or state.get("turn") != side:
        return []
    actor = state[side]
    actions = ["basic"]
    for ability in actor["abilities"]:
        if ability["unlocked"] and actor["energy"] >= ability["cost"]:
            actions.append(f"ability_{ability['slot']}")
    return actions


def _emit(state: dict[str, Any], events: list[dict[str, Any]], kind: str,
          message: str, **details: Any) -> None:
    state["event_seq"] += 1
    event = {"id": state["event_seq"], "type": kind, "message": message, **details}
    events.append(event)
    state["events"].append(event)


def _damage(state: dict[str, Any], events: list[dict[str, Any]],
            side: str, base: int, action: str) -> None:
    actor, defender = state[side], state[_other(side)]
    attack = max(0, base + actor["boost"] - actor["weaken"])
    actor["boost"] = actor["weaken"] = 0
    if actor["habitat_advantage"]:
        attack = math.floor(attack * 1.2)
    after_block = max(0, attack - defender["block"])
    defender["block"] = 0
    after_guard = math.floor(after_block * (100 - min(defender["guard"], 80)) / 100)
    defender["guard"] = 0
    if defender["habitat_advantage"]:
        after_guard = math.floor(after_guard * 0.8)
    absorbed = min(defender["shield"], after_guard)
    defender["shield"] -= absorbed
    hp_damage = min(defender["hp"], after_guard - absorbed)
    defender["hp"] -= hp_damage
    _emit(state, events, "damage", f"{actor['name']} dealt {hp_damage} damage to {defender['name']}.",
          side=side, target=_other(side), action=action, value=hp_damage,
          raw_damage=attack, shield_absorbed=absorbed)


def _utility(state: dict[str, Any], events: list[dict[str, Any]],
             side: str, effect: dict[str, Any]) -> None:
    kind, value = effect["type"], int(effect["value"])
    target_side = side if effect["target"] == "self" else _other(side)
    target = state[target_side]
    if kind == "heal_hp":
        gained = min(target["max_hp"] - target["hp"], value)
        target["hp"] += gained
        _emit(state, events, "heal", f"{target['name']} restored {gained} HP.",
              side=side, target=target_side, value=gained)
    elif kind == "shield":
        gained = min(_SHIELD_CAP - target["shield"], value)
        target["shield"] += gained
        _emit(state, events, "shield", f"{target['name']} gained {gained} Shield.",
              side=side, target=target_side, value=gained)
    elif kind in {"guard", "block", "boost", "weaken"}:
        # One-hit statuses replace weaker versions; recasting cannot stack a
        # permanent barrier or multiply the next attack indefinitely.
        target[kind] = max(target[kind], value)
        _emit(state, events, kind, f"{target['name']} gained {kind} {value}.",
              side=side, target=target_side, value=value)


def perform_action(state: dict[str, Any], side: str, action: str
                   ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Resolve exactly one legal action, returning a new state and new events."""
    if action not in legal_actions(state, side):
        raise ValueError(f"Illegal action {action!r} for {side}")
    result = copy.deepcopy(state)
    actor = result[side]
    events: list[dict[str, Any]] = []
    if action == "basic":
        name, cost = "Basic Attack", 0
        effects = [{"type": "damage", "value": actor["attack"], "target": "opponent"}]
    else:
        slot = int(action.removeprefix("ability_"))
        ability = next(a for a in actor["abilities"] if a["slot"] == slot)
        name, cost, effects = ability["name"], ability["cost"], ability["effects"]
    actor["energy"] -= cost
    _emit(result, events, "action", f"{actor['name']} used {name}.",
          side=side, action=action, cost=cost)
    # Multiple damage clauses describe one attack, so one-hit defenses apply
    # to their total once (not once per clause).
    attack_damage = sum(int(effect["value"]) for effect in effects if effect["type"] == "damage")
    if attack_damage:
        _damage(result, events, side, attack_damage, action)
    for effect in effects:
        if effect["type"] != "damage":
            _utility(result, events, side, effect)
    old_energy = actor["energy"]
    actor["energy"] = min(actor["max_energy"], old_energy + 2)
    _emit(result, events, "recharge", f"{actor['name']} gained {actor['energy'] - old_energy} Energy.",
          side=side, target=side, value=actor["energy"] - old_energy)
    result["turn_count"] += 1
    if result[_other(side)]["hp"] <= 0:
        result["status"] = "completed"
        result["winner"] = side
        result["turn"] = None
        _emit(result, events, "result", f"{actor['name']} won the battle.",
              side=side, winner=side)
    else:
        result["turn"] = _other(side)
    return result, events


def skip_turn(state: dict[str, Any], side: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Timeout transition: no action, damage, or Energy recharge."""
    if state.get("status") != "active" or state.get("turn") != side:
        raise ValueError("Only the active side can skip its turn")
    result = copy.deepcopy(state)
    events: list[dict[str, Any]] = []
    result["turn_count"] += 1
    result["turn"] = _other(side)
    _emit(result, events, "timeout", f"{result[side]['name']} ran out of time and skipped a turn. No Energy was recharged.",
          side=side)
    return result, events


def forfeit(state: dict[str, Any], side: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Finish an abandoned match without awarding Energy or another action."""
    winner = _other(side)
    if state.get("status") != "active":
        raise ValueError("Only an active match can be forfeited")
    result = copy.deepcopy(state)
    events: list[dict[str, Any]] = []
    result["status"] = "completed"
    result["winner"] = winner
    result["turn"] = None
    _emit(result, events, "forfeit", f"{result[side]['name']} forfeited the battle.",
          side=side, winner=winner)
    return result, events


def choose_ai_action(state: dict[str, Any], rng: Any = None) -> str:
    """Use the trained standard-difficulty policy, with a legal heuristic fallback."""
    from app.services.wildlife_ai import choose_ai_action as choose

    return choose(state, rng=rng)
