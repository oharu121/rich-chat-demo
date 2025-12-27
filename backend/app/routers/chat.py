"""Chat router with SSE streaming."""

import json
import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models import ChatRequest
from app.core.registry import get_agent

router = APIRouter(prefix="/api", tags=["chat"])


def format_sse(event: str, data: dict) -> str:
    """Format a server-sent event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def stream_chat_response(request: ChatRequest):
    """Generate SSE stream for chat response."""
    start_time = time.time()

    # Get the appropriate agent
    agent = get_agent(request.agent)
    if not agent:
        yield format_sse("error", {"message": f"Unknown agent: {request.agent}", "code": "UNKNOWN_AGENT"})
        return

    # Send agent info event
    yield format_sse("agent", {
        "agent": request.agent.value,
        "name": agent.name,
        "description": agent.description,
    })

    # Convert history to list of dicts
    history = [{"role": m.role.value, "content": m.content} for m in request.history]

    # Stream response tokens
    try:
        async for token in agent.stream_response(request.message, history):
            yield format_sse("token", {"token": token})
    except Exception as e:
        yield format_sse("error", {"message": str(e), "code": "STREAM_ERROR"})
        return

    # Send done event
    processing_time_ms = int((time.time() - start_time) * 1000)
    yield format_sse("done", {"processing_time_ms": processing_time_ms})


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    SSE streaming chat endpoint.

    Streams response tokens from the selected agent.
    """
    return StreamingResponse(
        stream_chat_response(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
