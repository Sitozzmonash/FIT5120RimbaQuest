from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.core.database import engine
from app.main import app


client = TestClient(app)
SPECIES_ID = "sp_asian_elephant"


def test_fun_facts_endpoint_returns_source_linked_but_not_rejected_facts():
    """Source-linked facts show; records rejected by the content policy do not."""
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
                    VALUES (:species_id, 1, 'Asian elephants use their trunks to pick up food.', :source_name,
                            :source_url, :source_license, :retrieved_at, 'source-linked-draft')"""),
            base_row,
        )
        connection.execute(
            text("""INSERT INTO species_fun_facts
                    (species_id, display_order, fact_text, source_name, source_url,
                     source_license, retrieved_at, verification_status)
                    VALUES (:species_id, 2, 'This rejected record must stay private.',
                            :source_name, :source_url, :source_license, :retrieved_at,
                            'rejected')"""),
            base_row,
        )

    response = client.get(f"/api/v1/species/{SPECIES_ID}/fun-facts")

    assert response.status_code == 200, response.text
    facts = response.json()["facts"]
    assert response.json()["species_id"] == SPECIES_ID
    assert facts[0] == {
        "display_order": 1,
        "fact_text": "Asian elephants use their trunks to pick up food.",
    }
    assert all(fact["fact_text"] != "This rejected record must stay private." for fact in facts)
    assert len(facts) <= 10
