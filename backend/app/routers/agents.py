"""Agents router."""

from fastapi import APIRouter

from app.models import AgentType, AgentInfo, AgentsResponse
from app.core.registry import get_all_agents

router = APIRouter(prefix="/api", tags=["agents"])


@router.get("/agents", response_model=AgentsResponse)
async def list_agents():
    """List available agents."""
    agents = []
    for agent_type, agent in get_all_agents().items():
        if agent_type != AgentType.HELP:  # Don't list help separately
            agents.append(AgentInfo(
                id=agent_type.value,
                name=agent.name,
                description=agent.description,
                icon=agent.icon,
            ))
    return AgentsResponse(agents=agents)
