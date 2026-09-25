from __future__ import annotations

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return naive UTC for SQLite persistence (timezone-aware generation)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
