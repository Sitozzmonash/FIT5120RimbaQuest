"""Tests for battle catalogue structure, DB synchronization, and validation."""
from __future__ import annotations

import copy
import json
import pytest
from sqlalchemy import select

from app.core.database import engine, initialise_database
from app.core.schema import species
from app.services.battle_catalogue import (
    CATALOGUE_PATH, RULES, get_battle_definition, get_catalogue, validate_catalogue,
)


@pytest.fixture(scope="module")
def seed_active_species_ids() -> set[str]:
    initialise_database()
    with engine.connect() as conn:
        return set(conn.execute(select(species.c.id).where(species.c.is_active.is_(True))).scalars())


def test_catalogue_species_match_seed_db_active_ids(seed_active_species_ids: set[str]) -> None:
    catalogue = get_catalogue()
    assert len(catalogue) == 152 and set(catalogue.keys()) == seed_active_species_ids
    assert get_battle_definition("sp_malayan_tiger")["species_id"] == "sp_malayan_tiger"
    with pytest.raises(ValueError, match="not found"):
        get_battle_definition("sp_nonexistent")


def test_catalogue_structure_and_deterministic_rows() -> None:
    catalogue = get_catalogue()
    source_rows = set()
    for sid, entry in catalogue.items():
        assert entry["species_id"] == sid and isinstance(entry["role"], str) and entry["role"].strip()
        assert 90 <= entry["hp"] <= 128 and 9 <= entry["base_attack"] <= 14
        abilities = entry.get("abilities", [])
        assert len(abilities) == 2 and {a["slot"] for a in abilities} == {1, 2} and all(a["kind"] == "active" for a in abilities)
        passive = entry.get("passive")
        assert isinstance(passive, dict) and passive["slot"] == 3 and passive["kind"] == "passive" and passive.get("max_triggers", 0) >= 1
        row = entry.get("source_row")
        assert isinstance(row, int) and row > 0
        source_rows.add(row)
    assert len(source_rows) == 152


def test_catalogue_deepcopies_immutability() -> None:
    cat1 = get_catalogue()
    cat1["sp_malayan_tiger"]["hp"] = 999
    assert get_catalogue()["sp_malayan_tiger"]["hp"] != 999
    def1 = get_battle_definition("sp_malayan_tiger")
    def1["hp"] = 999
    assert get_battle_definition("sp_malayan_tiger")["hp"] != 999


def test_catalogue_validation_rejects_invalid_definitions() -> None:
    with CATALOGUE_PATH.open("r", encoding="utf-8") as handle:
        base = json.load(handle)

    # 1. Duplicate active slots
    b1 = copy.deepcopy(base); b1["species"]["sp_common_mormon"]["abilities"][1]["slot"] = 1
    with pytest.raises(ValueError, match="slots 1 and 2"):
        validate_catalogue(b1)

    # 2. Unknown effect type
    b2 = copy.deepcopy(base); b2["species"]["sp_common_mormon"]["abilities"][0]["effects"][0]["type"] = "unknown_fx"
    with pytest.raises(ValueError, match="unknown effect type"):
        validate_catalogue(b2)

    # 3. Too many triggers on periodic passive
    b3 = copy.deepcopy(base); b3["species"]["sp_reticulated_python"]["passive"]["max_triggers"] = 99
    with pytest.raises(ValueError, match="at most ten triggers"):
        validate_catalogue(b3)

    # 4. Negative effect value
    b4 = copy.deepcopy(base); b4["species"]["sp_common_mormon"]["abilities"][0]["effects"][0]["value"] = -1
    with pytest.raises(ValueError, match="non-negative"):
        validate_catalogue(b4)


def test_catalogue_validation_rejects_nonfinite_values() -> None:
    """Nonfinite floating point values (NaN / Inf) must be rejected by catalogue validation."""
    with CATALOGUE_PATH.open("r", encoding="utf-8") as handle:
        base = json.load(handle)

    bad_nan = copy.deepcopy(base)
    bad_nan["species"]["sp_common_mormon"]["abilities"][0]["effects"][0]["value"] = float("nan")
    with pytest.raises(ValueError, match="effect value"):
        validate_catalogue(bad_nan)
