import os
import shutil
import tempfile
from pathlib import Path

os.environ["DATABASE_URL"] = f"sqlite:///{Path(tempfile.mkdtemp()) / 'test.db'}"

from fastapi.testclient import TestClient
from app.main import app


def test_confirmed_discovery_unlocks_once():
    client = TestClient(app)
    species = client.get("/api/v1/species?category=Mammal").json()[0]
    before = client.get("/api/v1/children/1/progress").json()["found"]
    first = client.post("/api/v1/children/1/discoveries", json={"species_id": species["id"], "location_label": "Kuala Lumpur, Malaysia"})
    second = client.post("/api/v1/children/1/discoveries", json={"species_id": species["id"], "location_label": "Kuala Lumpur, Malaysia"})
    assert first.status_code == 200 and first.json()["first_discovery"] is True
    assert second.status_code == 200 and second.json()["first_discovery"] is False
    assert client.get("/api/v1/children/1/progress").json()["found"] == before + 1
    recent = client.get("/api/v1/children/1/recent-captures")
    assert recent.status_code == 200
    assert recent.json()["items"][0]["species_id"] == species["id"]
    quiz = client.get(f"/api/v1/species/{species['id']}/quiz")
    assert quiz.status_code == 200 and quiz.json()["questions"]
    assert client.get("/health").json()["status"] == "ok"
