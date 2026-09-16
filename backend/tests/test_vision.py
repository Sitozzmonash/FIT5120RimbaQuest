from __future__ import annotations

import asyncio
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


def _identify(*args, **kwargs):
    return asyncio.run(vision.identify_supported_species(*args, **kwargs))


def _mock_provider_requests(monkeypatch, fake_post):
    async def fake_send(provider, payload):
        return fake_post(provider.url, json=payload)

    monkeypatch.setattr(vision, "_send_provider_request", fake_send)


@pytest.fixture(autouse=True)
def clear_provider_keys(monkeypatch):
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "")
    monkeypatch.setattr(vision, "GROQ_API_KEY", "")
    monkeypatch.setattr(vision, "PIC_DEEPSEEK_API_KEY", "")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "")
    monkeypatch.setattr(vision, "VISION_PROVIDER_SEQUENCE", "groq,zhipu,gemini")


def test_vision_uses_deepseek_when_first_in_configured_sequence(monkeypatch):
    monkeypatch.setattr(vision, "PIC_DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setattr(vision, "VISION_PROVIDER_SEQUENCE", "deepseek,groq,zhipu")
    requests: list[tuple[str, dict]] = []

    def fake_post(url, **kwargs):
        requests.append((url, kwargs["json"]))
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.94,
        }))

    _mock_provider_requests(monkeypatch, fake_post)
    result = _identify(b"image", "image/jpeg", CATALOGUE)

    assert result == vision.IdentificationOutcome(
        matched=True,
        species_id="sp_common_marmoset",
        confidence=0.94,
        provider="deepseek",
        model="deepseek-flash",
    )
    assert len(requests) == 1
    assert requests[0][0] == "https://api.deepseek.com/chat/completions"
    assert requests[0][1]["model"] == "deepseek-flash"
    assert requests[0][1]["response_format"] == {"type": "json_object"}
    image_url = requests[0][1]["messages"][0]["content"][0]["image_url"]["url"]
    assert image_url.startswith("data:image/jpeg;base64,")


def test_vision_falls_back_in_configured_sequence_order(monkeypatch):
    monkeypatch.setattr(vision, "PIC_DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    monkeypatch.setattr(vision, "VISION_PROVIDER_SEQUENCE", "deepseek,gemini,zhipu")
    requested_models: list[str] = []

    def fake_post(url, **kwargs):
        requested_models.append(kwargs["json"]["model"])
        if "api.deepseek.com" in url:
            request = httpx.Request("POST", url)
            return httpx.Response(503, request=request, json={"error": {"code": "busy"}})
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.91,
        }))

    _mock_provider_requests(monkeypatch, fake_post)
    result = _identify(b"image", "image/jpeg", CATALOGUE)

    assert result.matched is True
    assert result.provider == "gemini"
    assert requested_models == ["deepseek-flash", "gemini-3.8-flash"]


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

    _mock_provider_requests(monkeypatch, fake_post)
    result = _identify(b"image", "image/jpeg", CATALOGUE)

    assert result.matched is True
    assert result.provider == "groq"
    assert requests[0][0].endswith("/openai/v1/chat/completions")
    assert requests[0][1]["reasoning_effort"] == "none"


def test_vision_falls_back_from_groq_to_zhipu(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "zhipu-test-key")
    requested_models: list[str] = []
    zhipu_payload: dict = {}

    def fake_post(url, **kwargs):
        nonlocal zhipu_payload
        payload = kwargs["json"]
        requested_models.append(payload["model"])
        if "api.groq.com" in url:
            request = httpx.Request("POST", url)
            return httpx.Response(429, request=request, json={"error": {"code": "RESOURCE_EXHAUSTED"}})
        zhipu_payload = payload
        return FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.88,
        }))

    _mock_provider_requests(monkeypatch, fake_post)
    result = _identify(b"image", "image/png", CATALOGUE, trace_id="trace-fallback")

    assert result.matched is True
    assert result.provider == "zhipu"
    assert requested_models == ["qwen/qwen3.8-27b", "glm-4.6v-flash"]
    assert zhipu_payload["thinking"] == {"type": "disabled"}
    assert "failed_provider=groq reason=http_429" in caplog.text


@pytest.mark.parametrize(
    "provider_result,expected_reason",
    [
        (
            {"supported": True, "species_id": "sp_common_marmoset", "confidence": 0.3},
            "low_confidence",
        ),
        (
            {"supported": False, "species_id": None, "confidence": 0.2},
            "no_animal_detected",
        ),
    ],
)
def test_vision_rejects_uncertain_or_unsupported_results(
    monkeypatch, provider_result, expected_reason
):
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    _mock_provider_requests(
        monkeypatch,
        lambda *_args, **_kwargs: FakeResponse(f"```json\n{json.dumps(provider_result)}\n```"),
    )
    result = _identify(b"image", "image/jpeg", CATALOGUE)
    assert result.matched is False
    assert result.reason == expected_reason


def test_vision_reports_species_not_in_catalog_when_every_provider_agrees(monkeypatch):
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "zhipu-test-key")
    _mock_provider_requests(
        monkeypatch,
        lambda *_args, **_kwargs: FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_not_in_catalogue",
            "confidence": 0.9,
        })),
    )

    result = _identify(b"image", "image/jpeg", CATALOGUE)

    assert result.matched is False
    assert result.reason == "species_not_in_catalog"


def test_vision_still_fails_generically_when_catalog_gap_is_not_unanimous(monkeypatch):
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "ZHIPU_API_KEY", "zhipu-test-key")
    responses = iter([
        FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_not_in_catalogue",
            "confidence": 0.9,
        })),
        FakeResponse("not-json"),
    ])
    _mock_provider_requests(monkeypatch, lambda *_args, **_kwargs: next(responses))

    with pytest.raises(vision.VisionServiceUnavailable, match="vision_all_providers_failed"):
        _identify(b"image", "image/jpeg", CATALOGUE)


def test_invalid_primary_response_falls_back_to_next_provider(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GROQ_API_KEY", "groq-test-key")
    monkeypatch.setattr(vision, "GEMINI_API_KEY", "gemini-test-key")
    responses = iter([
        FakeResponse("not-json"),
        FakeResponse(json.dumps({
            "supported": True,
            "species_id": "sp_common_marmoset",
            "confidence": 0.91,
        })),
    ])
    _mock_provider_requests(monkeypatch, lambda *_args, **_kwargs: next(responses))

    result = _identify(b"image", "image/jpeg", CATALOGUE, trace_id="trace-invalid")

    assert result.matched is True
    assert result.provider == "gemini"
    assert "vision_invalid_model_response trace_id=trace-invalid provider=groq" in caplog.text


def test_vision_cancellation_cancels_the_active_provider_request(monkeypatch):
    monkeypatch.setattr(vision, "PIC_DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setattr(vision, "VISION_PROVIDER_SEQUENCE", "deepseek,groq,zhipu")
    provider_task_cancelled = False
    cancellation_checks = 0

    async def slow_provider(*_args, **_kwargs):
        nonlocal provider_task_cancelled
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            provider_task_cancelled = True
            raise

    async def client_disconnected():
        nonlocal cancellation_checks
        cancellation_checks += 1
        return cancellation_checks >= 3

    monkeypatch.setattr(vision, "_send_provider_request", slow_provider)
    with pytest.raises(vision.VisionRequestCancelled, match="vision_request_cancelled"):
        _identify(
            b"image",
            "image/jpeg",
            CATALOGUE,
            cancellation_check=client_disconnected,
        )
    assert provider_task_cancelled is True


def test_vision_logs_provider_status_without_credentials_or_response_message(monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(vision, "GROQ_API_KEY", "test-key-must-not-be-logged")
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    response = httpx.Response(
        429,
        request=request,
        headers={"x-request-id": "provider-request-123"},
        json={"error": {"code": "rate_limit", "message": "private-provider-message"}},
    )
    _mock_provider_requests(monkeypatch, lambda *_args, **_kwargs: response)

    with pytest.raises(vision.VisionServiceUnavailable, match="vision_all_providers_failed"):
        _identify(b"image", "image/jpeg", CATALOGUE, trace_id="trace-rate-limit")

    assert "vision_http_error trace_id=trace-rate-limit provider=groq" in caplog.text
    assert "status=429" in caplog.text
    assert "test-key-must-not-be-logged" not in caplog.text
    assert "private-provider-message" not in caplog.text


def test_vision_reports_not_configured_when_all_keys_are_missing(caplog):
    caplog.set_level(logging.INFO)
    with pytest.raises(vision.VisionServiceUnavailable, match="vision_not_configured"):
        _identify(b"image", "image/jpeg", CATALOGUE, trace_id="trace-no-keys")
    assert "vision_not_configured trace_id=trace-no-keys" in caplog.text
