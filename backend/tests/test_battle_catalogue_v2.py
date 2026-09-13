"""Tests for battle catalogue v2 runtime balancing and source provenance."""
from __future__ import annotations

import copy
import json
import math
import pytest

from app.services.battle_catalogue import (
    CATALOGUE_PATH,
    RULES,
    get_battle_definition,
    get_catalogue,
    get_source_catalogue,
    validate_catalogue,
)


def test_catalogue_v2_has_all_152_species_bounded():
    catalogue = get_catalogue()
    assert len(catalogue) == 152

    for sid, entry in catalogue.items():
        assert entry["species_id"] == sid
        assert isinstance(entry["source_row"], int) and entry["source_row"] > 0

        # HP roughly 100-118
        hp = entry["hp"]
        assert isinstance(hp, int) and 100 <= hp <= 118, f"{sid} hp {hp} out of bounds"

        # ATK roughly 10-13
        atk = entry["base_attack"]
        assert isinstance(atk, int) and 10 <= atk <= 13, f"{sid} atk {atk} out of bounds"

        # Active abilities
        abilities = entry.get("abilities", [])
        assert len(abilities) == 2
        assert {a["slot"] for a in abilities} == {1, 2}

        for ability in abilities:
            assert ability["kind"] == "active"
            assert ability["name"].strip()
            assert ability["description"].strip()
            effects = ability.get("effects", [])
            assert len(effects) > 0
            for eff in effects:
                val = eff.get("value")
                assert math.isfinite(val), f"{sid} non-finite effect value {val}"
                t = eff.get("type")
                if t == "damage":
                    assert 12 <= val <= 20, f"{sid} active damage {val} out of 12-20"
                elif t == "shield":
                    assert val <= 10, f"{sid} shield {val} > 10"
                elif t == "heal":
                    assert val <= 8, f"{sid} heal {val} > 8"
                elif t == "guard":
                    assert val <= 40, f"{sid} guard {val} > 40"
                elif t in ("weaken", "boost"):
                    assert val <= 4, f"{sid} {t} {val} > 4"

        # Passive
        p = entry.get("passive")
        assert isinstance(p, dict)
        assert p["slot"] == 3
        assert p["kind"] == "passive"
        trig = p["trigger"]

        for eff in p.get("effects", []):
            val = eff.get("value")
            assert math.isfinite(val)
            if trig in ("first_active", "every_third_action_damage"):
                assert val <= 4, f"{sid} passive damage {val} > 4"
            elif trig in ("low_energy", "first_lucky"):
                assert val <= 16, f"{sid} low-energy heal {val} > 16"
            elif trig == "battle_start":
                assert val <= 8, f"{sid} start shield {val} > 8"

        # Lucky bonus
        lucky = entry.get("lucky_bonus", [])
        assert len(lucky) > 0
        for lb in lucky:
            val = lb.get("value")
            assert math.isfinite(val)
            if lb.get("type") == "damage":
                assert val <= 2, f"{sid} lucky damage {val} > 2"


def test_catalogue_v2_preserves_source_provenance():
    catalogue = get_catalogue()
    source_cat = get_source_catalogue()
    assert len(source_cat) == 152

    for sid, entry in catalogue.items():
        assert "source_name" in entry
        assert "source_role" in entry
        assert "source_hp" in entry
        assert "source_base_attack" in entry
        assert "source_effects" in entry
        assert "source_passive" in entry
        assert "source_row" in entry

        src_entry = source_cat[sid]
        assert src_entry["species_id"] == sid
        assert src_entry["name"] == entry["source_name"]
        assert src_entry["role"] == entry["source_role"]
        assert src_entry["hp"] == entry["source_hp"]
        assert src_entry["base_attack"] == entry["source_base_attack"]
        assert src_entry["source_row"] == entry["source_row"]


def test_validate_catalogue_rejects_nonfinite_and_invalid():
    with CATALOGUE_PATH.open("r", encoding="utf-8") as f:
        base = json.load(f)

    # Reject NaN in hp
    bad_hp = copy.deepcopy(base)
    bad_hp["species"]["sp_common_mormon"]["hp"] = float("nan")
    with pytest.raises(ValueError):
        validate_catalogue(bad_hp)

    # Reject Inf in effect value
    bad_eff = copy.deepcopy(base)
    bad_eff["species"]["sp_common_mormon"]["abilities"][0]["effects"][0]["value"] = float("inf")
    with pytest.raises(ValueError):
        validate_catalogue(bad_eff)

    # Reject slots not {1, 2}
    bad_slots = copy.deepcopy(base)
    bad_slots["species"]["sp_common_mormon"]["abilities"][0]["slot"] = 3
    with pytest.raises(ValueError, match="slots 1 and 2"):
        validate_catalogue(bad_slots)


def test_catalogue_rules_and_immutability():
    rules = RULES
    assert rules["shield_cap"] == 25
    assert rules["lucky_basic_bonus"] == 3
    assert rules["max_rounds"] == 30
    assert rules.get("brace_shield") == 6

    # Test deepcopy immutability
    c1 = get_catalogue()
    c1["sp_common_mormon"]["hp"] = 999
    c2 = get_catalogue()
    assert c2["sp_common_mormon"]["hp"] != 999
