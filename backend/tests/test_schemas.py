"""
Tests for Pydantic schemas and models.
"""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AgentType,
    MessageRole,
    Message,
    ChatRequest,
    AgentInfo,
    AgentsResponse,
    HealthResponse,
)
from app.agents.travel_context import TravelContext


class TestAgentType:
    """Tests for AgentType enum."""

    def test_agent_type_values(self):
        """Test that all expected agent types exist."""
        assert AgentType.DEFAULT.value == "default"
        assert AgentType.CODE.value == "code"
        assert AgentType.SEARCH.value == "search"
        assert AgentType.EXPLAIN.value == "explain"
        assert AgentType.HELP.value == "help"
        assert AgentType.RAG.value == "rag"
        assert AgentType.TRAVEL.value == "travel"

    def test_agent_type_from_string(self):
        """Test creating AgentType from string."""
        assert AgentType("default") == AgentType.DEFAULT
        assert AgentType("code") == AgentType.CODE

    def test_invalid_agent_type(self):
        """Test that invalid agent type raises error."""
        with pytest.raises(ValueError):
            AgentType("invalid")


class TestMessage:
    """Tests for Message model."""

    def test_message_creation(self):
        """Test creating a message."""
        msg = Message(role=MessageRole.USER, content="Hello")
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"

    def test_message_with_string_role(self):
        """Test creating message with string role."""
        msg = Message(role=MessageRole.USER, content="Hello")
        assert msg.role == MessageRole.USER

    def test_message_empty_content(self):
        """Test message with empty content."""
        msg = Message(role=MessageRole.USER, content="")
        assert msg.content == ""


class TestChatRequest:
    """Tests for ChatRequest model."""

    def test_minimal_request(self):
        """Test creating minimal chat request."""
        req = ChatRequest(message="Hello")
        assert req.message == "Hello"
        assert req.history == []
        assert req.agent == AgentType.DEFAULT
        assert req.context is None

    def test_request_with_history(self):
        """Test chat request with history."""
        history = [
            Message(role=MessageRole.USER, content="Hi"),
            Message(role=MessageRole.ASSISTANT, content="Hello!"),
        ]
        req = ChatRequest(message="How are you?", history=history)
        assert len(req.history) == 2

    def test_request_with_agent(self):
        """Test chat request with specific agent."""
        req = ChatRequest(message="Write code", agent=AgentType.CODE)
        assert req.agent == AgentType.CODE

    def test_request_with_context(self):
        """Test chat request with context."""
        context = {"destination": "Japan", "duration": "5 days"}
        req = ChatRequest(message="Plan trip", agent=AgentType.TRAVEL, context=context)
        assert req.context == context
        assert req.context is not None and req.context["destination"] == "Japan"


class TestTravelContext:
    """Tests for TravelContext model."""

    def test_empty_context(self):
        """Test empty travel context."""
        ctx = TravelContext()
        assert ctx.destination is None
        assert ctx.duration is None
        assert ctx.budget is None
        assert ctx.interests is None

    def test_partial_context(self):
        """Test partially filled context."""
        ctx = TravelContext(destination="Japan", duration="5 days")
        assert ctx.destination == "Japan"
        assert ctx.duration == "5 days"
        assert ctx.budget is None

    def test_full_context(self):
        """Test fully filled context."""
        ctx = TravelContext(
            destination="Japan",
            duration="2 weeks",
            budget="mid-range",
            interests=["culture", "food"],
            travel_dates="December 2026",
            group_size="2 people",
            special_requirements="Vegetarian meals",
        )
        assert ctx.destination == "Japan"
        assert ctx.interests is not None and len(ctx.interests) == 2

    def test_get_missing_required_all_missing(self):
        """Test get_missing_required with empty context."""
        ctx = TravelContext()
        missing = ctx.get_missing_required()
        assert set(missing) == {"destination", "duration", "budget"}

    def test_get_missing_required_partial(self):
        """Test get_missing_required with partial context."""
        ctx = TravelContext(destination="Japan")
        missing = ctx.get_missing_required()
        assert set(missing) == {"duration", "budget"}

    def test_get_missing_required_complete(self):
        """Test get_missing_required with complete context."""
        ctx = TravelContext(destination="Japan", duration="5 days", budget="budget")
        missing = ctx.get_missing_required()
        assert missing == []

    def test_is_complete(self):
        """Test is_complete method."""
        incomplete = TravelContext(destination="Japan")
        complete = TravelContext(destination="Japan", duration="5 days", budget="budget")

        assert incomplete.is_complete() is False
        assert complete.is_complete() is True

    def test_to_context_string_empty(self):
        """Test to_context_string with empty context."""
        ctx = TravelContext()
        assert ctx.to_context_string() == "No context available"

    def test_to_context_string_filled(self):
        """Test to_context_string with filled context."""
        ctx = TravelContext(
            destination="Japan",
            duration="5 days",
            interests=["culture", "food"],
        )
        result = ctx.to_context_string()
        assert "Destination: Japan" in result
        assert "Duration: 5 days" in result
        assert "Interests: culture, food" in result

    def test_get_missing_optional(self):
        """Test get_missing_optional method."""
        ctx = TravelContext(destination="Japan", interests=["nature"])
        missing = ctx.get_missing_optional()
        assert "travel_dates" in missing
        assert "group_size" in missing
        assert "interests" not in missing


class TestHealthResponse:
    """Tests for HealthResponse model."""

    def test_health_response(self):
        """Test creating health response."""
        resp = HealthResponse(status="healthy", agents_loaded=True, agent_count=6)
        assert resp.status == "healthy"
        assert resp.agents_loaded is True
        assert resp.agent_count == 6


class TestAgentInfo:
    """Tests for AgentInfo model."""

    def test_agent_info(self):
        """Test creating agent info."""
        info = AgentInfo(
            id="code",
            name="Code",
            description="Code assistance",
            icon="code",
        )
        assert info.id == "code"
        assert info.name == "Code"
