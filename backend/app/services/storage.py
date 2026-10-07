from __future__ import annotations

import io
from pathlib import PurePosixPath
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()  # iPhone HEIC/HEIF uploads
except ImportError:
    pass

from app.core.config import (
    SIGNED_PHOTO_TTL_SECONDS,
    STORAGE_ACCESS_KEY,
    STORAGE_BUCKET,
    STORAGE_ENDPOINT,
    STORAGE_REGION,
    STORAGE_SECRET_KEY,
)


CONTENT_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
# Accepted for upload but converted to JPEG before storage and vision AI.
CONVERTED_CONTENT_TYPES = {"image/heic", "image/heif"}
UPLOAD_CONTENT_TYPES = set(CONTENT_EXTENSIONS) | CONVERTED_CONTENT_TYPES
# Vision providers receive the photo base64-encoded (Groq caps that at 4 MB),
# so originals are shrunk to this long side first.
PROCESSED_PHOTO_LONG_SIDE = 2560


class StorageUnavailable(RuntimeError):
    pass


def storage_configured() -> bool:
    return bool(
        STORAGE_ENDPOINT and STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY and STORAGE_BUCKET
    )


def _client():
    return boto3.client(
        "s3",
        endpoint_url=STORAGE_ENDPOINT,
        region_name=STORAGE_REGION,
        aws_access_key_id=STORAGE_ACCESS_KEY,
        aws_secret_access_key=STORAGE_SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )


def prepare_discovery_photo(content: bytes, content_type: str) -> tuple[bytes, str]:
    """Re-encode the original as a metadata-free JPEG for storage and vision AI.

    Must run after the authenticity check, which needs the original pixels and
    EXIF. Every photo is re-encoded so no EXIF (including precise GPS) reaches
    external AI services or storage; large photos and HEIC
    are also shrunk/converted. Orientation is applied to the pixels first.
    """
    with Image.open(io.BytesIO(content)) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((PROCESSED_PHOTO_LONG_SIDE, PROCESSED_PHOTO_LONG_SIDE), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        image.save(output, "JPEG", quality=85)
    return output.getvalue(), "image/jpeg"


def upload_discovery_photo(child_id: int, content: bytes, content_type: str) -> str:
    if not storage_configured():
        raise StorageUnavailable("Private photo storage is not configured")
    extension = CONTENT_EXTENSIONS[content_type]
    object_path = PurePosixPath("children", str(child_id), "discoveries", f"{uuid4()}{extension}").as_posix()
    try:
        _client().put_object(
            Bucket=STORAGE_BUCKET,
            Key=object_path,
            Body=content,
            ContentType=content_type,
        )
    except (BotoCoreError, ClientError) as error:
        raise StorageUnavailable("The private photo could not be stored") from error
    return object_path


def signed_photo_url(object_path: str | None) -> str | None:
    if not object_path or not storage_configured():
        return None
    try:
        return _client().generate_presigned_url(
            "get_object",
            Params={"Bucket": STORAGE_BUCKET, "Key": object_path},
            ExpiresIn=SIGNED_PHOTO_TTL_SECONDS,
        )
    except (BotoCoreError, ClientError):
        return None
