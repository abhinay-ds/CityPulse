import asyncio

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.realtime import encode_sse, subscribe, unsubscribe

router = APIRouter(tags=["Realtime"])


@router.get("/api/stream")
async def civic_event_stream():
    async def generate():
        queue = await subscribe()
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20)
                    yield encode_sse(event)
                except TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
        finally:
            unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
