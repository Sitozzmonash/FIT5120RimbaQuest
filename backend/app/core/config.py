from __future__ import annotations

import os
import tempfile
from pathlib import Path


# Keep local paths relative to the backend working directory. This also avoids
# Windows Python path corruption when the checkout directory contains CJK text.
ROOT = Path(".")
DEFAULT_DB = Path(os.getenv("LOCALAPPDATA", tempfile.gettempdir())) / "RimbaQuest" / "RimbaQuest.db"
SEED_SQL = Path(os.getenv("SEED_SQL_PATH", "./data/seed.sql"))


def _database_url() -> str:
    value = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB.as_posix()}").strip()
    if value.startswith("postgres://"):
        value = "postgresql+psycopg://" + value.removeprefix("postgres://")
    elif value.startswith("postgresql://"):
        value = "postgresql+psycopg://" + value.removeprefix("postgresql://")
    return value.replace(r"\@", "@")


DATABASE_URL = _database_url()
IS_POSTGRES = DATABASE_URL.startswith("postgresql+")

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://ekwbvjikckuvvfkakhff.supabase.co",
).rstrip("/")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "").strip()
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "discovery-photos").strip()
MAX_PHOTO_BYTES = 5 * 1024 * 1024
SIGNED_PHOTO_TTL_SECONDS = 60 * 60

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-rimbaquest-secret-change-before-deploy")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

DEFAULT_ORIGINS = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:8081,http://127.0.0.1:8081,"
    "http://localhost:8082,http://127.0.0.1:8082,"
    "http://localhost:19006,http://127.0.0.1:19006"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]
