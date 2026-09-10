from __future__ import annotations

import json
import logging

import httpx
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


def test_vision_rejects_invalid_provider_response(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "test-key")
    monkeypatch.setattr(vision.httpx, "post", lambda *_args, **_kwargs: FakeResponse("not-json"))
    with pytest.raises(vision.VisionServiceUnavailable):
        vision.identify_supported_species(
            b"image",
            "image/jpeg",
            CATALOGUE,
            trace_id="trace-invalid",
        )
    assert "vision_invalid_model_response trace_id=trace-invalid" in caplog.text


def test_vision_logs_provider_status_without_credentials_or_response_message(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "test-key-must-not-be-logged")
    request = httpx.Request("POST", "https://open.bigmodel.cn/api/paas/v4/chat/completions")
    response = httpx.Response(
        429,
        request=request,
        headers={"x-request-id": "provider-request-123"},
        json={"error": {"code": "rate_limit", "message": "private-provider-message"}},
    )
    monkeypatch.setattr(vision.httpx, "post", lambda *_args, **_kwargs: response)

    with pytest.raises(vision.VisionServiceUnavailable, match="vision_http_429"):
        vision.identify_supported_species(
            b"image",
            "image/jpeg",
            CATALOGUE,
            trace_id="trace-rate-limit",
        )

    assert "vision_http_error trace_id=trace-rate-limit" in caplog.text
    assert "status=429" in caplog.text
    assert "provider_code=rate_limit" in caplog.text
    assert "provider_request_id=provider-request-123" in caplog.text
    assert "test-key-must-not-be-logged" not in caplog.text
    assert "private-provider-message" not in caplog.text
