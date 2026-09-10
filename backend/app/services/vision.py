from __future__ import annotations

import base64
import json
import logging
from typing import Any

import httpx

from app.core.config import (
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
    """Raised when the provider cannot complete a trustworthy response."""


def _json_object(content: Any) -> dict[str, Any]:
    if isinstance(content, list):
        content = "".join(
            str(item.get("text", "")) if isinstance(item, dict) else str(item)
            for item in content
        )
    if not isinstance(content, str):
        raise VisionServiceUnavailable("The wildlife verification service returned an invalid response")

    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```")
        cleaned = cleaned.removesuffix("```").strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end < start:
        raise VisionServiceUnavailable("The wildlife verification service returned an invalid response")
    try:
        parsed = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError as error:
        raise VisionServiceUnavailable("The wildlife verification service returned an invalid response") from error
    if not isinstance(parsed, dict):
        raise VisionServiceUnavailable("The wildlife verification service returned an invalid response")
    return parsed


def identify_supported_species(
    image_bytes: bytes,
    content_type: str,
    catalogue: list[dict[str, Any]],
    *,
    trace_id: str = "-",
) -> dict[str, Any] | None:
    """Return one catalogue species selected by GLM, or ``None`` when uncertain.

    The provider must choose an exact server-supplied ID. Any unsupported ID,
    malformed response, or low self-reported confidence is rejected rather
    than coerced into a discovery.
    """
    if not ZHIPU_API_KEY:
        logger.error(
            "vision_not_configured trace_id=%s model=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
        )
        raise VisionServiceUnavailable("vision_not_configured")

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
    payload = {
        "model": ZHIPU_VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": base64.b64encode(image_bytes).decode("ascii")},
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        "thinking": {"type": "disabled"},
        "temperature": 0,
    }
    try:
        response = httpx.post(
            ZHIPU_API_URL,
            headers={
                "Authorization": f"Bearer {ZHIPU_API_KEY}",
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
            "vision_timeout trace_id=%s model=%s timeout_seconds=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
            VISION_TIMEOUT_SECONDS,
        )
        raise VisionServiceUnavailable("vision_timeout") from error
    except httpx.HTTPStatusError as error:
        provider_request_id = (
            error.response.headers.get("x-request-id")
            or error.response.headers.get("x-b3-traceid")
            or "-"
        )
        provider_code = "-"
        try:
            error_body = error.response.json()
            if isinstance(error_body, dict):
                nested_error = error_body.get("error")
                if isinstance(nested_error, dict):
                    provider_code = str(nested_error.get("code") or nested_error.get("type") or "-")
                else:
                    provider_code = str(error_body.get("code") or "-")
        except ValueError:
            pass
        logger.warning(
            "vision_http_error trace_id=%s model=%s status=%s provider_code=%s provider_request_id=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
            error.response.status_code,
            provider_code[:80],
            provider_request_id[:120],
        )
        raise VisionServiceUnavailable(f"vision_http_{error.response.status_code}") from error
    except httpx.RequestError as error:
        logger.warning(
            "vision_network_error trace_id=%s model=%s error_type=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
            type(error).__name__,
        )
        raise VisionServiceUnavailable("vision_network_error") from error
    except (KeyError, IndexError, TypeError, ValueError) as error:
        logger.warning(
            "vision_invalid_provider_envelope trace_id=%s model=%s error_type=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
            type(error).__name__,
        )
        raise VisionServiceUnavailable("vision_invalid_provider_envelope") from error

    try:
        result = _json_object(content)
    except VisionServiceUnavailable as error:
        logger.warning(
            "vision_invalid_model_response trace_id=%s model=%s content_type=%s",
            trace_id,
            ZHIPU_VISION_MODEL,
            type(content).__name__,
        )
        raise VisionServiceUnavailable("vision_invalid_model_response") from error
    if result.get("supported") is not True:
        logger.info(
            "vision_unverified trace_id=%s model=%s reason=unsupported_or_unclear",
            trace_id,
            ZHIPU_VISION_MODEL,
        )
        return None
    species_id = result.get("species_id")
    try:
        confidence = float(result.get("confidence", 0))
    except (TypeError, ValueError):
        logger.info(
            "vision_unverified trace_id=%s model=%s reason=invalid_confidence",
            trace_id,
            ZHIPU_VISION_MODEL,
        )
        return None
    if species_id not in allowed:
        logger.info(
            "vision_unverified trace_id=%s model=%s reason=species_outside_catalogue",
            trace_id,
            ZHIPU_VISION_MODEL,
        )
        return None
    if not 0 <= confidence <= 1:
        logger.info(
            "vision_unverified trace_id=%s model=%s reason=confidence_out_of_range",
            trace_id,
            ZHIPU_VISION_MODEL,
        )
        return None
    if confidence < VISION_MIN_CONFIDENCE:
        logger.info(
            "vision_unverified trace_id=%s model=%s reason=low_confidence confidence=%.3f threshold=%.3f",
            trace_id,
            ZHIPU_VISION_MODEL,
            confidence,
            VISION_MIN_CONFIDENCE,
        )
        return None
    return {"species_id": species_id, "confidence": confidence}
