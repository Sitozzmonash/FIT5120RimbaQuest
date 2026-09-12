from __future__ import annotations

import os
import tempfile
from pathlib import Path


# Set a disposable database before any test imports the FastAPI app. Individual
# legacy tests may still set the environment themselves; the imported engine
# remains safely isolated for the whole pytest process.
temp_dir = tempfile.mkdtemp()
os.environ.setdefault(
    "DATABASE_URL",
    f"sqlite:///{(Path(temp_dir) / 'test.db').as_posix()}",
)
os.environ.setdefault("JWT_SECRET", "test-only-secret-at-least-32-bytes-long")
