from __future__ import annotations

import base64
import json
import logging
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import (
    GEMINI_API_BASE_URL,
    GEMINI_API_KEY,
    GEMINI_VISION_MODEL,
    GROQ_API_BASE_URL,
    GROQ_API_KEY,
    GROQ_VISION_MODEL,
    VISION_MIN_CONFIDENCE,
    VISION_TIMEOUT_SECONDS,
    ZHIPU_API_KEY,
    ZHIPU_API_URL,
    ZHIPU_VISION_MODEL,
)


# Uvicorn owns the production console handlers on Render. Using its error
# logger ensures these diagnostics reach the service log at INFO/WARNING level.
logger = logging.getLogger("uvicorn.error")


class VisionServiceUnavailable(RuntimeError):
    """Raised when no configured provider can complete a trustworthy response."""


class _ProviderFailure(RuntimeError):
    """Internal, sanitized reason for moving to the next vision provider."""


@dataclass(frozen=True)
class VisionProvider:
    name: str
    api_key: str
    model: str
    url: str
    use_data_uri: bool


def _chat_completions_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"


def _providers() -> tuple[VisionProvider, ...]:
    """Return the fixed failover order: Groq, then Zhipu, then Gemini."""
    return (
        VisionProvider(
            name="groq",
            api_key=GROQ_API_KEY,
            model=GROQ_VISION_MODEL,
            url=_chat_completions_url(GROQ_API_BASE_URL),
            use_data_uri=True,
        ),
        VisionProvider(
            name="zhipu",
            api_key=ZHIPU_API_KEY,
            model=ZHIPU_VISION_MODEL,
            url=ZHIPU_API_URL,
            use_data_uri=False,
        ),
        VisionProvider(
            name="gemini",
            api_key=GEMINI_API_KEY,
            model=GEMINI_VISION_MODEL,
            url=_chat_completions_url(GEMINI_API_BASE_URL),
            use_data_uri=True,
        ),
    )


def _json_object(content: Any) -> dict[str, Any]:
    if isinstance(content, list):
        content = "".join(
            str(item.get("text", "")) if isinstance(item, dict) else str(item)
            for item in content
        )
    if not isinstance(content, str):
        raise _ProviderFailure("invalid_model_response")

    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```")
        cleaned = cleaned.removesuffix("```").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end < start:
        raise _ProviderFailure("invalid_model_response")
    try:
        parsed = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError as error:
        raise _ProviderFailure("invalid_model_response") from error
    if not isinstance(parsed, dict):
        raise _ProviderFailure("invalid_model_response")
    return parsed


def _provider_error_metadata(response: httpx.Response) -> tuple[str, str]:
    provider_request_id = (
        response.headers.get("x-request-id")
        or response.headers.get("x-b3-traceid")
        or response.headers.get("request-id")
        or "-"
    )
    provider_code = "-"
    try:
        error_body = response.json()
        if isinstance(error_body, dict):
            nested_error = error_body.get("error")
            if isinstance(nested_error, dict):
                provider_code = str(
                    nested_error.get("code") or nested_error.get("type") or "-"
                )
            else:
                provider_code = str(error_body.get("code") or "-")
    except ValueError:
        pass
    return provider_code[:80], provider_request_id[:120]


def _request_provider(
    provider: VisionProvider,
    image_bytes: bytes,
    content_type: str,
    prompt: str,
    trace_id: str,
) -> dict[str, Any]:
    encoded_image = base64.b64encode(image_bytes).decode("ascii")
    image_url = (
        f"data:{content_type};base64,{encoded_image}"
        if provider.use_data_uri
        else encoded_image
    )
    payload: dict[str, Any] = {
        "model": provider.model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        "temperature": 0,
    }
    if provider.name == "groq":
        payload["response_format"] = {"type": "json_object"}
        payload["reasoning_effort"] = "none"
    elif provider.name == "zhipu":
        payload["thinking"] = {"type": "disabled"}

    try:
        response = httpx.post(
            provider.url,
            headers={
                "Authorization": f"Bearer {provider.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=VISION_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
    except httpx.TimeoutException as error:
        logger.warning(
            "vision_timeout trace_id=%s provider=%s model=%s timeout_seconds=%s",
            trace_id,
            provider.name,
            provider.model,
            VISION_TIMEOUT_SECONDS,
        )
        raise _ProviderFailure("timeout") from error
    except httpx.HTTPStatusError as error:
        provider_code, provider_request_id = _provider_error_metadata(error.response)
        logger.warning(
            "vision_http_error trace_id=%s provider=%s model=%s status=%s provider_code=%s provider_request_id=%s",
            trace_id,
            provider.name,
            provider.model,
            error.response.status_code,
            provider_code,
            provider_request_id,
        )
        raise _ProviderFailure(f"http_{error.response.status_code}") from error
    except httpx.RequestError as error:
        logger.warning(
            "vision_network_error trace_id=%s provider=%s model=%s error_type=%s",
            trace_id,
            provider.name,
            provider.model,
            type(error).__name__,
        )
        raise _ProviderFailure("network_error") from error
    except (KeyError, IndexError, TypeError, ValueError) as error:
        logger.warning(
            "vision_invalid_provider_envelope trace_id=%s provider=%s model=%s error_type=%s",
            trace_id,
            provider.name,
            provider.model,
            type(error).__name__,
        )
        raise _ProviderFailure("invalid_provider_envelope") from error

    try:
        return _json_object(content)
    except _ProviderFailure as error:
        logger.warning(
            "vision_invalid_model_response trace_id=%s provider=%s model=%s content_type=%s",
            trace_id,
            provider.name,
            provider.model,
            type(content).__name__,
        )
        raise error


def identify_supported_species(
    image_bytes: bytes,
    content_type: str,
    catalogue: list[dict[str, Any]],
    *,
    trace_id: str = "-",
) -> dict[str, Any] | None:
    """Select one supported species using Groq, then Zhipu, then Gemini.

    Provider failures fall through to the next configured provider. A valid
    provider response that says the photo is unsupported, unclear, or below
    the confidence threshold is authoritative and does not trigger another
    model to guess.
    """
    allowed = {str(item["id"]): item for item in catalogue}
    catalogue_prompt = [
        {
            "id": item["id"],
            "common_name": item["common_name"],
            "scientific_name": item.get("scientific_name") or "",
            "category": item.get("category") or "",
            "distinctive_features": item.get("distinctive_features") or "",
        }
        for item in catalogue
    ]
    prompt = (
        "You are the wildlife verification component for a children's Malaysian wildlife app. "
        "Inspect the photo and match the main animal only to the supported catalogue below. "
        "Do not guess. If the animal is absent, unclear, not wildlife, or cannot be confidently "
        "matched, return supported=false. Return JSON only in this exact shape: "
        '{"supported":true,"species_id":"exact catalogue id","confidence":0.0}. '
        "Confidence must be between 0 and 1. Supported catalogue: "
        + json.dumps(catalogue_prompt, ensure_ascii=False, separators=(",", ":"))
    )

    configured_count = 0
    attempted: list[str] = []
    failures: list[str] = []
    for provider in _providers():
        if not provider.api_key:
            logger.info(
                "vision_provider_skipped trace_id=%s provider=%s model=%s reason=missing_api_key",
                trace_id,
                provider.name,
                provider.model,
            )
            continue
        configured_count += 1
        attempted.append(provider.name)
        logger.info(
            "vision_provider_attempt trace_id=%s provider=%s model=%s attempt=%s",
            trace_id,
            provider.name,
            provider.model,
            len(attempted),
        )
        try:
            result = _request_provider(
                provider,
                image_bytes,
                content_type,
                prompt,
                trace_id,
            )
        except _ProviderFailure as error:
            failures.append(f"{provider.name}:{error}")
            logger.info(
                "vision_provider_fallback trace_id=%s failed_provider=%s reason=%s",
                trace_id,
                provider.name,
                error,
            )
            continue

        if result.get("supported") is False:
            logger.info(
                "vision_unverified trace_id=%s provider=%s model=%s reason=unsupported_or_unclear",
                trace_id,
                provider.name,
                provider.model,
            )
            return None
        if result.get("supported") is not True:
            failures.append(f"{provider.name}:invalid_supported_flag")
            logger.warning(
                "vision_invalid_model_response trace_id=%s provider=%s model=%s reason=invalid_supported_flag",
                trace_id,
                provider.name,
                provider.model,
            )
            continue

        species_id = result.get("species_id")
        if species_id not in allowed:
            failures.append(f"{provider.name}:species_outside_catalogue")
            logger.warning(
                "vision_invalid_model_response trace_id=%s provider=%s model=%s reason=species_outside_catalogue",
                trace_id,
                provider.name,
                provider.model,
            )
            continue
        try:
            confidence = float(result["confidence"])
        except (KeyError, TypeError, ValueError):
            failures.append(f"{provider.name}:invalid_confidence")
            logger.warning(
                "vision_invalid_model_response trace_id=%s provider=%s model=%s reason=invalid_confidence",
                trace_id,
                provider.name,
                provider.model,
            )
            continue
        if not 0 <= confidence <= 1:
            failures.append(f"{provider.name}:confidence_out_of_range")
            logger.warning(
                "vision_invalid_model_response trace_id=%s provider=%s model=%s reason=confidence_out_of_range",
                trace_id,
                provider.name,
                provider.model,
            )
            continue
        if confidence < VISION_MIN_CONFIDENCE:
            logger.info(
                "vision_unverified trace_id=%s provider=%s model=%s reason=low_confidence confidence=%.3f threshold=%.3f",
                trace_id,
                provider.name,
                provider.model,
                confidence,
                VISION_MIN_CONFIDENCE,
            )
            return None

        logger.info(
            "vision_provider_succeeded trace_id=%s provider=%s model=%s confidence=%.3f",
            trace_id,
            provider.name,
            provider.model,
            confidence,
        )
        return {
            "species_id": species_id,
            "confidence": confidence,
            "provider": provider.name,
            "model": provider.model,
        }

    if configured_count == 0:
        logger.error("vision_not_configured trace_id=%s", trace_id)
        raise VisionServiceUnavailable("vision_not_configured")

    logger.error(
        "vision_all_providers_failed trace_id=%s attempted=%s failures=%s",
        trace_id,
        ",".join(attempted),
        ",".join(failures),
    )
    raise VisionServiceUnavailable("vision_all_providers_failed")
