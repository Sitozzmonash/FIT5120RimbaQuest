from __future__ import annotations

import json

from sqlalchemy import create_engine, select

from app.core import seed
from app.core.schema import metadata, species_chat_evidence, species_fun_facts


def test_removed_seeded_chat_evidence_and_fun_fact_are_revoked(tmp_path, monkeypatch):
    """A removed reviewed item must not stay child-answerable after deploy."""
    evidence_path = tmp_path / "chat_evidence.json"
    facts_path = tmp_path / "fun_facts.json"
    evidence_path.write_text(
        json.dumps(
            [
                {
                    "species_id": "sp_asian_elephant",
                    "source_id": "mybis",
                    "source_url": "https://www.mybis.gov.my/species/elephant",
                    "topic": "social behaviour",
                    "excerpt": "Asian elephants live in social family groups.",
                    "verification_status": "team-verified",
                    "verified_by": "content team",
                    "verified_at": "2026-09-15T00:00:00Z",
                    "retrieved_at": "2026-09-15T00:00:00Z",
                }
            ]
        ),
        encoding="utf-8",
    )
    facts_path.write_text(
        json.dumps(
            [
                {
                    "species_id": "sp_asian_elephant",
                    "display_order": 99,
                    "fact_text": "A test-only reviewed fact.",
                    "source_name": "RimbaQuest content team",
                    "source_url": "https://www.mybis.gov.my/species/elephant",
                    "source_license": "reviewed excerpt",
                    "retrieved_at": "2026-09-15T00:00:00Z",
                    "verification_status": "team-verified",
                    "verified_by": "RimbaQuest content team",
                    "verified_at": None,
                }
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(seed, "ITERATION_2_CHAT_EVIDENCE", evidence_path)
    monkeypatch.setattr(seed, "ITERATION_2_FUN_FACTS_PILOT", facts_path)
    database = create_engine("sqlite://")
    metadata.create_all(database)

    with database.begin() as connection:
        seed.seed_iteration_one(connection)
        seed.seed_iteration_two_fun_facts_pilot(connection)
        seed.seed_iteration_two_chat_evidence(connection)

    evidence_path.write_text("[]", encoding="utf-8")
    facts_path.write_text("[]", encoding="utf-8")
    with database.begin() as connection:
        seed.seed_iteration_two_fun_facts_pilot(connection)
        seed.seed_iteration_two_chat_evidence(connection)
        evidence_status = connection.execute(
            select(species_chat_evidence.c.verification_status).where(
                species_chat_evidence.c.species_id == "sp_asian_elephant"
            )
        ).scalar_one()
        fact_status = connection.execute(
            select(species_fun_facts.c.verification_status).where(
                (species_fun_facts.c.species_id == "sp_asian_elephant")
                & (species_fun_facts.c.display_order == 99)
            )
        ).scalar_one()

    assert evidence_status == "revoked"
    assert fact_status == "revoked"
