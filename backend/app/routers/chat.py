"""Chat router with SSE streaming."""

import json
import logging
import time

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models import ChatRequest
from app.core.registry import get_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


# Status messages for display
STATUS_MESSAGES = {
    "thinking": "Thinking...",
    "searching": "Searching the web...",
    "executing": "Running code...",
    "reading": "Reading results...",
}


def format_sse(event: str, data: dict) -> str:
    """Format a server-sent event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def stream_chat_response(request: ChatRequest):
    """Generate SSE stream for chat response."""
    start_time = time.time()
    logger.info(f"Chat request: agent={request.agent}, message_length={len(request.message)}")

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

    # Stream response - handle both tuple format (new) and string format (legacy)
    try:
        async for item in agent.stream_response(request.message, history):
            # New format: tuple of (event_type, content)
            if isinstance(item, tuple) and len(item) == 2:
                event_type, content = item
                if event_type == "status" and isinstance(content, str):
                    message = STATUS_MESSAGES.get(content, content)
                    yield format_sse("status", {"status": content, "message": message})
                elif event_type == "token" and isinstance(content, str):
                    yield format_sse("token", {"token": content})
                elif event_type == "error" and isinstance(content, str):
                    yield format_sse("error", {"message": content, "code": "AGENT_ERROR"})
                    return
                elif event_type == "sources" and isinstance(content, list):
                    yield format_sse("sources", {"sources": content})
            # Legacy format: plain string token
            else:
                yield format_sse("token", {"token": item})
    except Exception as e:
        logger.error(f"STREAM_ERROR: {type(e).__name__}: {e}", exc_info=True)
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
