import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "data" / "RimbaQuest.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB.as_posix()}")
SEED_SQL = ROOT / "data" / "seed.sql"

IMAGE_METADATA_START = "-- BEGIN bundled species image metadata"
IMAGE_METADATA_END = "-- END bundled species image metadata"
LEARNING_DATA_START = "-- BEGIN complete Iteration 1 learning data"
LEARNING_DATA_END = "-- END complete Iteration 1 learning data"

DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006"
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if origin.strip()]
