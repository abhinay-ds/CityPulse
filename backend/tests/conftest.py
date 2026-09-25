import os
import tempfile
from pathlib import Path

# Isolate tests from the developer SQLite file before any app import.
_fd, _db_path = tempfile.mkstemp(prefix="citypulse_pytest_", suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = "sqlite:///" + Path(_db_path).as_posix()
os.environ["CITYPULSE_TESTING"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from seed import seed_data  # noqa: E402

seed_data()
client = TestClient(app)
