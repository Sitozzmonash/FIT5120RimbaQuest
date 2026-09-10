from __future__ import annotations

import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv


# Keep local paths relative to the backend working directory. This also avoids
# Windows Python path corruption when the checkout directory contains CJK text.
ROOT = Path(".")
BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
# The repository-root file is the local source of truth. A backend/.env file
# remains a fallback for contributors who run this folder independently.
# Neither file is copied into the Render image; production uses Render env vars.
load_dotenv(REPOSITORY_ROOT / ".env")
load_dotenv(BACKEND_ROOT / ".env")
DEFAULT_DB = Path(os.getenv("LOCALAPPDATA", tempfile.gettempdir())) / "RimbaQuest" / "RimbaQuest.db"
SEED_SQL = Path(os.getenv("SEED_SQL_PATH", "./data/seed.sql"))
ITERATION_2_FUN_FACTS_PILOT = Path(
    os.getenv("ITERATION_2_FUN_FACTS_PILOT_PATH", "./data/iteration2_fun_facts_pilot.json")
)


def _database_url() -> str:
    value = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB.as_posix()}").strip()
    if value.startswith("postgres://"):
        value = "postgresql+psycopg://" + value.removeprefix("postgres://")
    elif value.startswith("postgresql://"):
        value = "postgresql+psycopg://" + value.removeprefix("postgresql://")
    return value.replace(r"\@", "@")


DATABASE_URL = _database_url()
IS_POSTGRES = DATABASE_URL.startswith("postgresql+")

STORAGE_ENDPOINT = os.getenv("AWS_ENDPOINT_URL_S3", "").strip().rstrip("/")
STORAGE_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
STORAGE_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
STORAGE_REGION = os.getenv("AWS_REGION", "us-east-2").strip()
STORAGE_BUCKET = os.getenv("DATABASE_STORAGE_BUCKET", "image").strip()
MAX_PHOTO_BYTES = 5 * 1024 * 1024
SIGNED_PHOTO_TTL_SECONDS = 60 * 60

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-rimbaquest-secret-change-before-deploy")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_API_BASE_URL = os.getenv(
    "GEMINI_API_BASE_URL",
    os.getenv("MODEL_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"),
).strip().rstrip("/")
GEMINI_VISION_MODEL = os.getenv(
    "GEMINI_VISION_MODEL",
    os.getenv("MODEL_NAME", "gemini-3.8-flash"),
).strip()
# ``Groq_Qwen3`` is retained as a compatibility alias for the key name used
# by the existing local/Render configuration. New deployments should use the
# conventional all-uppercase ``GROQ_API_KEY`` name.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", os.getenv("Groq_Qwen3", "")).strip()
GROQ_API_BASE_URL = os.getenv(
    "GROQ_API_BASE_URL", "https://api.groq.com/openai/v1"
).strip().rstrip("/")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b").strip()
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "").strip()
ZHIPU_API_URL = os.getenv(
    "ZHIPU_API_URL", "https://open.bigmodel.cn/api/paas/v4/chat/completions"
).strip()
ZHIPU_VISION_MODEL = os.getenv("ZHIPU_VISION_MODEL", "glm-4.6v-flash").strip()
PRIMARY_VISION_MODEL = GEMINI_VISION_MODEL
VISION_PROVIDER_ORDER = "gemini,groq,zhipu"
VISION_MIN_CONFIDENCE = float(os.getenv("VISION_MIN_CONFIDENCE", "0.65"))
VISION_TIMEOUT_SECONDS = float(os.getenv("VISION_TIMEOUT_SECONDS", "45"))
DISCOVERY_VERIFICATION_TTL_MINUTES = int(os.getenv("DISCOVERY_VERIFICATION_TTL_MINUTES", "30"))

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
