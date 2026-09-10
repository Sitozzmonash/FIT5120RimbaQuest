from __future__ import annotations

import base64
import json
from typing import Any

import httpx

from app.core.config import (
    VISION_MIN_CONFIDENCE,
    VISION_TIMEOUT_SECONDS,
    ZHIPU_API_KEY,
    ZHIPU_API_URL,
    ZHIPU_VISION_MODEL,
)


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
) -> dict[str, Any] | None:
    """Return one catalogue species selected by GLM, or ``None`` when uncertain.

    The provider must choose an exact server-supplied ID. Any unsupported ID,
    malformed response, or low self-reported confidence is rejected rather
    than coerced into a discovery.
    """
    if not ZHIPU_API_KEY:
        raise VisionServiceUnavailable("Wildlife verification is not configured")

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
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise VisionServiceUnavailable("The wildlife verification service is unavailable") from error

    result = _json_object(content)
    if result.get("supported") is not True:
        return None
    species_id = result.get("species_id")
    try:
        confidence = float(result.get("confidence", 0))
    except (TypeError, ValueError):
        return None
    if species_id not in allowed or not 0 <= confidence <= 1 or confidence < VISION_MIN_CONFIDENCE:
        return None
    return {"species_id": species_id, "confidence": confidence}
