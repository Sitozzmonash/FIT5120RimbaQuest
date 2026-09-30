"""Validated, immutable-at-the-call-boundary battle catalogue access."""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path
from typing import Any

CATALOGUE_PATH = Path(__file__).resolve().parents[2] / "data" / "battle_catalogue.json"
_REQUIRED_EFFECTS = {"damage", "heal", "shield", "guard", "boost", "weaken", "reroll", "reduce_damage"}
_REQUIRED_TRIGGERS = {
    "battle_start", "low_energy", "first_active", "first_incoming_active",
    "first_incoming_basic", "every_third_action_damage", "every_third_action_heal",
    "low_roll_reroll", "first_lucky",
}

_cache: dict[str, Any] | None = None


def _validate_effect(effect: Any, *, context: str) -> None:
    if not isinstance(effect, dict):
        raise ValueError(f"{context}: effect must be an object")
    if effect.get("type") not in _REQUIRED_EFFECTS:
        raise ValueError(f"{context}: unknown effect type")
    val = effect.get("value")
    if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(val) or val < 0:
        raise ValueError(f"{context}: effect value must be a finite non-negative number")
    if effect.get("target") not in {"self", "opponent"}:
        raise ValueError(f"{context}: invalid effect target")
    if "requires_effect" in effect and effect["requires_effect"] not in {"shield", "heal", "guard", "weaken", "boost"}:
        raise ValueError(f"{context}: invalid requires_effect")


def _validate_ability(ability: Any, *, context: str) -> None:
    if not isinstance(ability, dict) or ability.get("slot") not in {1, 2} or ability.get("kind") != "active":
        raise ValueError(f"{context}: invalid active ability")
    if not isinstance(ability.get("name"), str) or not ability["name"].strip():
        raise ValueError(f"{context}: active ability needs a name")
    if not isinstance(ability.get("description"), str) or not ability["description"].strip():
        raise ValueError(f"{context}: active ability needs a description")
    if not isinstance(ability.get("animation"), str) or not ability["animation"].strip():
        raise ValueError(f"{context}: active ability needs an animation")
    if not isinstance(ability.get("vfx"), str) or not ability["vfx"].strip():
        raise ValueError(f"{context}: active ability needs a vfx key")
    effects = ability.get("effects")
    if not isinstance(effects, list) or not effects:
        raise ValueError(f"{context}: active ability needs effects")
    for index, effect in enumerate(effects):
        _validate_effect(effect, context=f"{context}.effects[{index}]")
        val = effect.get("value")
        t = effect.get("type")
        if t == "damage" and not (12 <= val <= 20):
            raise ValueError(f"{context}: active damage must be between 12 and 20")
        elif t == "shield" and val > 10:
            raise ValueError(f"{context}: active shield must be <= 10")
        elif t == "heal" and val > 8:
            raise ValueError(f"{context}: active heal must be <= 8")
        elif t == "guard" and val > 40:
            raise ValueError(f"{context}: active guard must be <= 40")
        elif t in ("weaken", "boost") and val > 4:
            raise ValueError(f"{context}: active {t} must be <= 4")


def _validate_passive(passive: Any, *, context: str) -> None:
    if not isinstance(passive, dict) or passive.get("slot") != 3 or passive.get("kind") != "passive":
        raise ValueError(f"{context}: invalid passive")
    if not isinstance(passive.get("name"), str) or not passive["name"].strip():
        raise ValueError(f"{context}: passive needs a name")
    if not isinstance(passive.get("description"), str) or not passive["description"].strip():
        raise ValueError(f"{context}: passive needs a description")
    if passive.get("trigger") not in _REQUIRED_TRIGGERS:
        raise ValueError(f"{context}: invalid passive trigger")
    if not isinstance(passive.get("max_triggers"), int) or passive["max_triggers"] < 1:
        raise ValueError(f"{context}: passive needs finite max_triggers")
    if passive["trigger"].startswith("every_third") and passive["max_triggers"] != 10:
        raise ValueError(f"{context}: every-third passive must allow at most ten triggers")
    if passive["trigger"].startswith("every_third") and passive.get("every") != 3:
        raise ValueError(f"{context}: every-third passive needs every=3")
    if passive["trigger"] == "low_energy" and not 0 < passive.get("threshold", 0) <= 0.35:
        raise ValueError(f"{context}: low-energy passive needs a valid threshold")
    effects = passive.get("effects")
    if not isinstance(effects, list) or not effects:
        raise ValueError(f"{context}: passive needs effects")
    for index, effect in enumerate(effects):
        _validate_effect(effect, context=f"{context}.effects[{index}]")
        val = effect.get("value")
        trig = passive.get("trigger")
        if trig in ("first_active", "every_third_action_damage") and val > 4:
            raise ValueError(f"{context}: passive damage must be <= 4")
        elif trig in ("low_energy", "first_lucky") and val > 16:
            raise ValueError(f"{context}: passive heal must be <= 16")
        elif trig == "battle_start" and val > 8:
            raise ValueError(f"{context}: passive shield must be <= 8")


def validate_catalogue(data: Any) -> None:
    if not isinstance(data, dict) or data.get("version") not in {"1.0", "2.0"}:
        raise ValueError("Battle catalogue version must be 1.0 or 2.0")
    rules = data.get("rules")
    if not isinstance(rules, dict) or rules.get("shield_cap") != 25 or rules.get("lucky_basic_bonus") != 3 or rules.get("max_rounds") != 30:
        raise ValueError("Battle catalogue rules do not match frozen contract")
    species = data.get("species")
    if not isinstance(species, dict) or len(species) != 152:
        raise ValueError("Battle catalogue must contain exactly 152 species")
    for species_id, entry in species.items():
        context = f"species[{species_id}]"
        if not isinstance(species_id, str) or not species_id.startswith("sp_"):
            raise ValueError(f"{context}: invalid species id")
        if not isinstance(entry, dict) or entry.get("species_id") != species_id:
            raise ValueError(f"{context}: species_id mismatch")
        for key in ("name", "category", "role", "biological_basis"):
            if not isinstance(entry.get(key), str) or not entry[key].strip():
                raise ValueError(f"{context}: missing {key}")
        hp = entry.get("hp")
        if not isinstance(hp, int) or isinstance(hp, bool) or not math.isfinite(hp) or not 90 <= hp <= 128:
            raise ValueError(f"{context}: hp outside 90-128")
        base_attack = entry.get("base_attack")
        if not isinstance(base_attack, int) or isinstance(base_attack, bool) or not math.isfinite(base_attack) or not 9 <= base_attack <= 14:
            raise ValueError(f"{context}: base_attack outside 9-14")
        source_row = entry.get("source_row")
        if not isinstance(source_row, int) or isinstance(source_row, bool) or source_row <= 0:
            raise ValueError(f"{context}: source_row must be a positive integer")
        abilities = entry.get("abilities")
        if not isinstance(abilities, list) or len(abilities) != 2 or {a.get("slot") for a in abilities if isinstance(a, dict)} != {1, 2}:
            raise ValueError(f"{context}: must have active slots 1 and 2 exactly")
        for ability in abilities:
            _validate_ability(ability, context=f"{context}.ability")
        lucky = entry.get("lucky_bonus")
        if not isinstance(lucky, list) or not lucky:
            raise ValueError(f"{context}: lucky_bonus must be non-empty")
        for index, effect in enumerate(lucky):
            _validate_effect(effect, context=f"{context}.lucky_bonus[{index}]")
            if effect.get("type") == "damage" and effect.get("value", 0) > 2:
                raise ValueError(f"{context}: lucky damage must be <= 2")
        _validate_passive(entry.get("passive"), context=f"{context}.passive")


def _load() -> dict[str, Any]:
    global _cache
    if _cache is None:
        with CATALOGUE_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        validate_catalogue(data)
        _cache = data
    return _cache


def get_catalogue() -> dict[str, dict[str, Any]]:
    return copy.deepcopy(_load()["species"])


def get_source_catalogue() -> dict[str, dict[str, Any]]:
    species = _load()["species"]
    result = {}
    for sid, entry in species.items():
        result[sid] = {
            "species_id": sid,
            "name": entry.get("source_name", entry["name"]),
            "role": entry.get("source_role", entry["role"]),
            "hp": entry.get("source_hp", entry["hp"]),
            "base_attack": entry.get("source_base_attack", entry["base_attack"]),
            "effects": copy.deepcopy(entry.get("source_effects", [])),
            "passive": copy.deepcopy(entry.get("source_passive", entry.get("passive"))),
            "source_row": entry.get("source_row"),
        }
    return result


def get_battle_definition(species_id: str) -> dict[str, Any]:
    definition = _load()["species"].get(species_id)
    if definition is None:
        raise ValueError(f"Battle definition not found for species '{species_id}'")
    return copy.deepcopy(definition)


def get_rules() -> dict[str, int]:
    return copy.deepcopy(_load()["rules"])


RULES = get_rules()
