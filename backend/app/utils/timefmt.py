from __future__ import annotations

from datetime import datetime
from app.utils.clock import utc_now


def relative_time(value: datetime | None, now: datetime | None = None) -> str:
    if value is None:
        return "Unknown"
    current = now or utc_now()
    seconds = max(0, int((current - value).total_seconds()))
    if seconds < 45:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour ago" if hours == 1 else f"{hours} hours ago"
    days = hours // 24
    return f"{days} day ago" if days == 1 else f"{days} days ago"


def clock_time(value: datetime | None) -> str:
    if value is None:
        return "--:--"
    return value.strftime("%H:%M")
