"""Agent registry for managing agent instances."""

from app.models import AgentType
from app.agents import (
    BaseAgent,
    DefaultAgent,
    CodeAgent,
    SearchAgent,
    ExplainAgent,
    RAGAgent,
    TravelAgent,
)

# Agent registry
_AGENTS: dict[AgentType, BaseAgent] = {}


def init_agents() -> None:
    """Initialize all agents."""
    _AGENTS[AgentType.DEFAULT] = DefaultAgent()
    _AGENTS[AgentType.CODE] = CodeAgent()
    _AGENTS[AgentType.SEARCH] = SearchAgent()
    _AGENTS[AgentType.EXPLAIN] = ExplainAgent()
    _AGENTS[AgentType.RAG] = RAGAgent()
    _AGENTS[AgentType.TRAVEL] = TravelAgent()
    # Help agent uses default for now
    _AGENTS[AgentType.HELP] = DefaultAgent()


def clear_agents() -> None:
    """Clear all agents."""
    _AGENTS.clear()


def get_agent(agent_type: AgentType) -> BaseAgent | None:
    """Get an agent by type."""
    return _AGENTS.get(agent_type)


def get_all_agents() -> dict[AgentType, BaseAgent]:
    """Get all registered agents."""
    return _AGENTS


def get_agent_count() -> int:
    """Get the number of registered agents."""
    return len(_AGENTS)
