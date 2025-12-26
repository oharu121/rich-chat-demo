"""
FastAPI backend for the slash command chat interface.
"""

import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models import (
    AgentType,
    ChatRequest,
    AgentInfo,
    AgentsResponse,
    HealthResponse,
)
from agents import (
    BaseAgent,
    DefaultAgent,
    CodeAgent,
    SearchAgent,
    ExplainAgent,
)


# Agent registry
AGENTS: dict[AgentType, BaseAgent] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize agents on startup."""
    AGENTS[AgentType.DEFAULT] = DefaultAgent()
    AGENTS[AgentType.CODE] = CodeAgent()
    AGENTS[AgentType.SEARCH] = SearchAgent()
    AGENTS[AgentType.EXPLAIN] = ExplainAgent()
    # Help agent uses default for now
    AGENTS[AgentType.HELP] = DefaultAgent()
    yield
    AGENTS.clear()


app = FastAPI(
    title="Agent Chat API",
    description="SSE streaming chat API with slash command agent routing",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_sse(event: str, data: dict) -> str:
    """Format a server-sent event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def stream_chat_response(request: ChatRequest):
    """Generate SSE stream for chat response."""
    start_time = time.time()

    # Get the appropriate agent
    agent = AGENTS.get(request.agent)
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


@app.post("/api/chat")
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


@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        agents_loaded=len(AGENTS) > 0,
        agent_count=len(AGENTS),
    )


@app.get("/api/agents", response_model=AgentsResponse)
async def list_agents():
    """List available agents."""
    agents = []
    for agent_type, agent in AGENTS.items():
        if agent_type != AgentType.HELP:  # Don't list help separately
            agents.append(AgentInfo(
                id=agent_type.value,
                name=agent.name,
                description=agent.description,
                icon=agent.icon,
            ))
    return AgentsResponse(agents=agents)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
