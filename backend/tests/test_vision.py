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


@pytest.fixture(autouse=True)
def clear_provider_keys(monkeypatch):
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "")


def test_vision_uses_groq_as_primary_provider(monkeypatch):
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    requests: list[tuple[str, dict]] = []

    def fake_post(url, **kwargs):
        requests.append((url, kwargs["json"]))
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.93,
        }))

    monkeypatch.setattr(vision.httpx, "post", fake_post)
    result = vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE)

    assert result == {
        "species_id": "sp_common_marmoset",
        "confidence": 0.93,
        "provider": "groq",
        "model": "qwen/qwen3.8-27b",
    }
    assert len(requests) == 1
    assert requests[0][0].endswith("/openai/v1/chat/completions")
    assert requests[0][1]["model"] == "qwen/qwen3.8-27b"
    assert requests[0][1]["response_format"] == {"type": "json_object"}
    assert requests[0][1]["reasoning_effort"] == "none"
    image_url = requests[0][1]["messages"][0]["content"][0]["image_url"]["url"]
    assert image_url.startswith("data:image/jpeg;base64,")


def test_vision_falls_back_from_groq_to_zhipu(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "zhipu-test-key")
    requested_models: list[str] = []

    def fake_post(url, **kwargs):
        payload = kwargs["json"]
        requested_models.append(payload["model"])
        if "api.groq.com" in url:
            request = httpx.Request("POST", url)
            return httpx.Response(
                429,
                request=request,
                json={"error": {"code": "RESOURCE_EXHAUSTED"}},
            )
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.88,
        }))

    monkeypatch.setattr(vision.httpx, "post", fake_post)
    result = vision.identify_supported_species(
        b"image",
        "image/png",
        CATALOGUE,
        trace_id="trace-fallback",
    )

    assert result == {
        "species_id": "sp_common_marmoset",
        "confidence": 0.88,
        "provider": "zhipu",
        "model": "glm-4.6v-flash",
    }
    assert requested_models == ["qwen/qwen3.8-27b", "glm-4.6v-flash"]
    assert "failed_provider=groq reason=http_429" in caplog.text
    assert "provider=zhipu model=glm-4.6v-flash" in caplog.text


def test_valid_unverified_result_does_not_ask_backup_models(monkeypatch):
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    calls = 0

    def fake_post(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        return FakeResponse(json.dumps({
            "supported": False,
            "species_id": None,
            "confidence": 0.2,
        }))

    monkeypatch.setattr(vision.httpx, "post", fake_post)
    assert vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE) is None
    assert calls == 1


def test_vision_uses_zhipu_as_second_provider(monkeypatch):
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "zhipu-test-key")
    requested_models: list[str] = []
    zhipu_payload: dict = {}

    def fake_post(url, **kwargs):
        nonlocal zhipu_payload
        payload = kwargs["json"]
        requested_models.append(payload["model"])
        if len(requested_models) < 2:
            request = httpx.Request("POST", url)
            return httpx.Response(503, request=request, json={"error": {"code": "busy"}})
        zhipu_payload = payload
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.9,
        }))

    monkeypatch.setattr(vision.httpx, "post", fake_post)
    result = vision.identify_supported_species(b"image", "image/webp", CATALOGUE)

    assert result is not None
    assert result["provider"] == "zhipu"
    assert requested_models == [
        "qwen/qwen3.8-27b",
        "glm-4.6v-flash",
    ]
    assert zhipu_payload["thinking"] == {"type": "disabled"}
    zhipu_image = zhipu_payload["messages"][0]["content"][0]["image_url"]["url"]
    assert not zhipu_image.startswith("data:")
    assert zhipu_payload["thinking"] == {"type": "disabled"}
    zhipu_image = zhipu_payload["messages"][0]["content"][0]["image_url"]["url"]
    assert not zhipu_image.startswith("data:")


@pytest.mark.parametrize(
    "provider_result",
    [
        {"supported": True, "species_id": "sp_common_marmoset", "confidence": 0.3},
        {"supported": False, "species_id": None, "confidence": 0.2},
    ],
)
def test_vision_rejects_uncertain_or_unsupported_results(monkeypatch, provider_result):
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(
        vision.httpx,
        "post",
        lambda *_args, **_kwargs: FakeResponse(
            f"```json\n{json.dumps(provider_result)}\n```"
        ),
    )
    assert vision.identify_supported_species(b"image", "image/jpeg", CATALOGUE) is None


def test_invalid_primary_response_falls_back_to_next_provider(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    responses = iter([
        FakeResponse("not-json"),
        FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.91,
        })),
    ])
    monkeypatch.setattr(vision.httpx, "post", lambda *_args, **_kwargs: next(responses))

    result = vision.identify_supported_species(
        b"image",
        "image/jpeg",
        CATALOGUE,
        trace_id="trace-invalid",
    )

    assert result is not None
    assert result["provider"] == "gemini"
    assert "vision_invalid_model_response trace_id=trace-invalid provider=groq" in caplog.text


def test_vision_logs_provider_status_without_credentials_or_response_message(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "test-key-must-not-be-logged")
    request = httpx.Request(
        "POST",
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    )
    response = httpx.Response(
        429,
        request=request,
        headers={"x-request-id": "provider-request-123"},
        json={"error": {"code": "rate_limit", "message": "private-provider-message"}},
    )
    monkeypatch.setattr(vision.httpx, "post", lambda *_args, **_kwargs: response)

    with pytest.raises(
        vision.VisionServiceUnavailable,
        match="vision_all_providers_failed",
    ):
        vision.identify_supported_species(
            b"image",
            "image/jpeg",
            CATALOGUE,
            trace_id="trace-rate-limit",
        )

    assert "vision_http_error trace_id=trace-rate-limit provider=gemini" in caplog.text
    assert "status=429" in caplog.text
    assert "provider_code=rate_limit" in caplog.text
    assert "provider_request_id=provider-request-123" in caplog.text
    assert "test-key-must-not-be-logged" not in caplog.text
    assert "private-provider-message" not in caplog.text


def test_vision_reports_not_configured_when_all_keys_are_missing(caplog):
    caplog.set_level(logging.INFO)
    with pytest.raises(vision.VisionServiceUnavailable, match="vision_not_configured"):
        vision.identify_supported_species(
            b"image",
            "image/jpeg",
            CATALOGUE,
            trace_id="trace-no-keys",
        )
    assert "vision_not_configured trace_id=trace-no-keys" in caplog.text
