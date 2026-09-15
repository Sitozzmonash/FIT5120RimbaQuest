from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
from app.main import app


client = TestClient(app)
SPECIES_ID = "sp_asian_elephant"


def test_fun_facts_endpoint_returns_only_audited_child_facing_facts():
    """Draft rows must never leak into the child-facing facts tab."""
    with engine.begin() as connection:
        connection.execute(
            text("DELETE FROM species_fun_facts WHERE species_id=:species_id"),
            {"species_id": SPECIES_ID},
        )
        base_row = {
            "species_id": SPECIES_ID,
            "source_name": "Test wildlife source",
            "source_url": "https://example.org/elephant",
            "source_license": "Test licence",
            "retrieved_at": datetime.now(timezone.utc),
        }
        connection.execute(
            text("""INSERT INTO species_fun_facts
                    (species_id, display_order, fact_text, source_name, source_url,
                     source_license, retrieved_at, verification_status)
                    VALUES (:species_id, 1, 'This draft must stay private.', :source_name,
                            :source_url, :source_license, :retrieved_at, 'source-linked-draft')"""),
            base_row,
        )
        connection.execute(
            text("""INSERT INTO species_fun_facts
                    (species_id, display_order, fact_text, source_name, source_url,
                     source_license, retrieved_at, verification_status, verified_by, verified_at)
                    VALUES (:species_id, 2, 'Asian elephants use their trunks to pick up food.',
                            :source_name, :source_url, :source_license, :retrieved_at,
                            'team-verified', 'test content reviewer', :reviewed_at)"""),
            {**base_row, "reviewed_at": datetime.now(timezone.utc)},
        )

    response = client.get(f"/api/v1/species/{SPECIES_ID}/fun-facts")

    assert response.status_code == 200, response.text
    assert response.json() == {
        "species_id": SPECIES_ID,
        "facts": [
            {
                "display_order": 2,
                "fact_text": "Asian elephants use their trunks to pick up food.",
            }
        ],
    }
