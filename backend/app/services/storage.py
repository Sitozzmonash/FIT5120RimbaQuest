from __future__ import annotations

from pathlib import PurePosixPath
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

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
