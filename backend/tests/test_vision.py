from __future__ import annotations

import json

import pytest

from app.services import vision


CATALOGUE = [
    {
        "id": "sp_common_marmoset",
        "common_name": "Common Marmoset",
        "scientific_name": "Callithrix jacchus",
        "category": "Mammal",
        "distinctive_features": "Small monkey with white ear tufts.",
    }
]


class FakeResponse:
    def __init__(self, content: str):
        self.content = content

    def raise_for_status(self):
        return None

    def json(self):
        return {"choices": [{"message": {"content": self.content}}]}


def test_vision_accepts_only_confident_catalogue_match(monkeypatch):
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "test-key")
    monkeypatch.setattr(
        vision.httpx,
        "post",
        lambda *_args, **_kwargs: FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.93,
        })),
    )
    result = vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE)
    assert result == {"species_id": "sp_common_marmoset", "confidence": 0.93}


@pytest.mark.parametrize(
    "provider_result",
    [
        {"supported": False, "species_id": None, "confidence": 0.2},
        {"supported": True, "species_id": "sp_not_in_catalogue", "confidence": 0.99},
        {"supported": True, "species_id": "sp_common_marmoset", "confidence": 0.3},
    ],
)
def test_vision_rejects_uncertain_or_unsupported_results(monkeypatch, provider_result):
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "test-key")
    monkeypatch.setattr(
        vision.httpx,
        "post",
        lambda *_args, **_kwargs: FakeResponse(f"```json\n{json.dumps(provider_result)}\n```"),
    )
    assert vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE) is None


def test_vision_rejects_invalid_provider_response(monkeypatch):
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "test-key")
    monkeypatch.setattr(vision.httpx, "post", lambda *_args, **_kwargs: FakeResponse("not-json"))
    with pytest.raises(vision.VisionServiceUnavailable):
        vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE)
