"""
Tests for agent classes and registry.
"""

import pytest

from app.models.schemas import AgentType
from app.core.registry import (
    get_agent,
    get_all_agents,
    get_agent_count,
)
from app.agents import (
    BaseAgent,
    DefaultAgent,
    CodeAgent,
    SearchAgent,
    ExplainAgent,
    RAGAgent,
    TravelAgent,
)


class TestAgentRegistry:
    """Tests for agent registry functions."""

    def test_get_agent_default(self):
        """Test getting default agent."""
        agent = get_agent(AgentType.DEFAULT)
        assert agent is not None
        assert isinstance(agent, DefaultAgent)

    def test_get_agent_code(self):
        """Test getting code agent."""
        agent = get_agent(AgentType.CODE)
        assert agent is not None
        assert isinstance(agent, CodeAgent)

    def test_get_agent_search(self):
        """Test getting search agent."""
        agent = get_agent(AgentType.SEARCH)
        assert agent is not None
        assert isinstance(agent, SearchAgent)

    def test_get_agent_explain(self):
        """Test getting explain agent."""
        agent = get_agent(AgentType.EXPLAIN)
        assert agent is not None
        assert isinstance(agent, ExplainAgent)

    def test_get_agent_rag(self):
        """Test getting RAG agent."""
        agent = get_agent(AgentType.RAG)
        assert agent is not None
        assert isinstance(agent, RAGAgent)

    def test_get_agent_travel(self):
        """Test getting travel agent."""
        agent = get_agent(AgentType.TRAVEL)
        assert agent is not None
        assert isinstance(agent, TravelAgent)

    def test_get_agent_help_uses_default(self):
        """Test that help agent uses default agent."""
        agent = get_agent(AgentType.HELP)
        assert agent is not None
        assert isinstance(agent, DefaultAgent)

    def test_get_all_agents(self):
        """Test getting all agents."""
        agents = get_all_agents()
        assert len(agents) >= 6
        assert AgentType.DEFAULT in agents
        assert AgentType.CODE in agents
        assert AgentType.TRAVEL in agents

    def test_get_agent_count(self):
        """Test getting agent count."""
        count = get_agent_count()
        assert count >= 6


class TestAgentAttributes:
    """Tests for agent class attributes."""

    def test_default_agent_attributes(self):
        """Test DefaultAgent has required attributes."""
        agent = DefaultAgent()
        assert agent.name == "Default"
        assert agent.description is not None
        assert agent.icon == "chat"

    def test_code_agent_attributes(self):
        """Test CodeAgent has required attributes."""
        agent = CodeAgent()
        assert agent.name == "Code"
        assert agent.icon == "code"

    def test_search_agent_attributes(self):
        """Test SearchAgent has required attributes."""
        agent = SearchAgent()
        assert agent.name == "Search"
        assert agent.icon == "search"

    def test_explain_agent_attributes(self):
        """Test ExplainAgent has required attributes."""
        agent = ExplainAgent()
        assert agent.name == "Explain"
        assert agent.icon == "book"

    def test_rag_agent_attributes(self):
        """Test RAGAgent has required attributes."""
        agent = RAGAgent()
        assert agent.name == "RAG"
        assert agent.icon == "database"

    def test_travel_agent_attributes(self):
        """Test TravelAgent has required attributes."""
        agent = TravelAgent()
        assert agent.name == "Travel Planner"
        assert agent.icon == "plane"


class TestAgentStreamResponse:
    """Tests for agent stream_response method signature."""

    @pytest.mark.asyncio
    async def test_code_agent_stream_response(self):
        """Test CodeAgent stream_response returns async generator."""
        agent = CodeAgent()
        results = []
        async for item in agent.stream_response("Write hello world", [], None):
            results.append(item)
        # Should yield string tokens (code agent yields characters)
        assert len(results) > 0
        # Join all tokens should contain the message
        full_response = "".join(results)
        assert "hello" in full_response.lower()

    @pytest.mark.asyncio
    async def test_search_agent_stream_response(self):
        """Test SearchAgent stream_response returns async generator."""
        agent = SearchAgent()
        results = []
        async for item in agent.stream_response("Search for Python", [], None):
            results.append(item)
        assert len(results) > 0
        full_response = "".join(results)
        assert "Search Agent" in full_response

    @pytest.mark.asyncio
    async def test_explain_agent_stream_response(self):
        """Test ExplainAgent stream_response returns async generator."""
        agent = ExplainAgent()
        results = []
        async for item in agent.stream_response("Explain Python", [], None):
            results.append(item)
        assert len(results) > 0
        full_response = "".join(results)
        assert "Explain Agent" in full_response

    @pytest.mark.asyncio
    async def test_agent_accepts_context_parameter(self):
        """Test that agents accept context parameter."""
        agent = CodeAgent()
        context = {"some": "context"}
        # Should not raise error
        results = []
        async for item in agent.stream_response("Test", [], context):
            results.append(item)
        assert len(results) > 0

    @pytest.mark.asyncio
    async def test_agent_accepts_history_parameter(self):
        """Test that agents accept history parameter."""
        agent = ExplainAgent()
        history = [
            {"role": "user", "content": "Previous message"},
            {"role": "assistant", "content": "Previous response"},
        ]
        # Should not raise error
        results = []
        async for item in agent.stream_response("New message", history, None):
            results.append(item)
        assert len(results) > 0
