import os
import tempfile
from pathlib import Path

# Set an isolated test database before any test imports the FastAPI app.
temp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(temp_dir) / 'test.db').as_posix()}"
os.environ["JWT_SECRET"] = "test-only-secret-at-least-32-bytes-long"

# Force password-reset email into dev-simulation mode: tests must never send real
# mail and must not depend on a populated local .env. Empty strings (rather than
# removing the keys) survive config.load_dotenv(override=False), which would
# otherwise repopulate them from the repo-root .env, and read as unconfigured.
for _email_key in ("BREVO_API_KEY", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"):
    os.environ[_email_key] = ""
