from __future__ import annotations

from pathlib import PurePosixPath
from urllib.parse import quote
from uuid import uuid4

import httpx

from app.core.config import (
    SIGNED_PHOTO_TTL_SECONDS,
    SUPABASE_SECRET_KEY,
    SUPABASE_STORAGE_BUCKET,
    SUPABASE_URL,
)


CONTENT_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class StorageUnavailable(RuntimeError):
    pass


def storage_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY and SUPABASE_STORAGE_BUCKET)


def _headers(content_type: str | None = None) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "apikey": SUPABASE_SECRET_KEY,
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def upload_discovery_photo(child_id: int, content: bytes, content_type: str) -> str:
    if not storage_configured():
        raise StorageUnavailable("Private photo storage is not configured")
    extension = CONTENT_EXTENSIONS[content_type]
    object_path = PurePosixPath("children", str(child_id), "discoveries", f"{uuid4()}{extension}").as_posix()
    endpoint = (
        f"{SUPABASE_URL}/storage/v1/object/{quote(SUPABASE_STORAGE_BUCKET, safe='')}/"
        f"{quote(object_path, safe='/')}"
    )
    try:
        response = httpx.post(
            endpoint,
            headers={**_headers(content_type), "x-upsert": "false"},
            content=content,
            timeout=20,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise StorageUnavailable("The private photo could not be stored") from error
    return object_path


def signed_photo_url(object_path: str | None) -> str | None:
    if not object_path or not storage_configured():
        return None
    endpoint = (
        f"{SUPABASE_URL}/storage/v1/object/sign/{quote(SUPABASE_STORAGE_BUCKET, safe='')}/"
        f"{quote(object_path, safe='/')}"
    )
    try:
        response = httpx.post(
            endpoint,
            headers=_headers("application/json"),
            json={"expiresIn": SIGNED_PHOTO_TTL_SECONDS},
            timeout=10,
        )
        response.raise_for_status()
        signed = response.json().get("signedURL")
        if not signed:
            return None
        if signed.startswith("http"):
            return signed
        if not signed.startswith("/storage/v1"):
            signed = f"/storage/v1{signed}"
        return f"{SUPABASE_URL}{signed}"
    except (httpx.HTTPError, ValueError):
        return None
