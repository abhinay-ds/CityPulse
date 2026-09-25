from __future__ import annotations

from app.utils.clock import utc_now
import uuid


def make_id(prefix: str) -> str:
    stamp = int(utc_now().timestamp())
    suffix = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{stamp}-{suffix}"
