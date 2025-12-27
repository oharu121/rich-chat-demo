"""
FastAPI backend for the slash command chat interface.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.registry import init_agents, clear_agents
from app.routers import chat_router, health_router, agents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize agents on startup."""
    init_agents()
    yield
    clear_agents()


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

# Include routers
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(agents_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
