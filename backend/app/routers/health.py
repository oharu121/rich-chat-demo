"""Health check router."""

from fastapi import APIRouter

from app.models import HealthResponse
from app.core.registry import get_agent_count

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    agent_count = get_agent_count()
    return HealthResponse(
        status="healthy",
        agents_loaded=agent_count > 0,
        agent_count=agent_count,
    )
