from __future__ import annotations

import asyncio
import json
from app.utils.clock import utc_now

_subscribers: set[asyncio.Queue] = set()
_last_event: dict = {"type": "hello", "at": utc_now().isoformat()}


def latest_event() -> dict:
    return dict(_last_event)


def publish(event_type: str, payload: dict | None = None) -> None:
    global _last_event
    _last_event = {
        "type": event_type,
        "payload": payload or {},
        "at": utc_now().isoformat(),
    }
    for queue in list(_subscribers):
        try:
            queue.put_nowait(_last_event)
        except Exception:
            _subscribers.discard(queue)


async def subscribe() -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue(maxsize=32)
    _subscribers.add(queue)
    await queue.put(latest_event())
    return queue


def unsubscribe(queue: asyncio.Queue) -> None:
    _subscribers.discard(queue)


def encode_sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"
