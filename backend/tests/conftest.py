import os
import tempfile
from pathlib import Path

# Set an isolated test database before any test imports the FastAPI app.
temp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(temp_dir) / 'test.db').as_posix()}"
os.environ["JWT_SECRET"] = "test-only-secret-at-least-32-bytes-long"
