"""
Tests for API endpoints.
"""

import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """Test /api/health endpoint."""
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["agents_loaded"] is True
        assert data["agent_count"] >= 6

    @pytest.mark.asyncio
    async def test_healthz_endpoint(self, client: AsyncClient):
        """Test /healthz liveness probe."""
        response = await client.get("/healthz")
        assert response.status_code == 200
        assert response.text == "ok"


class TestAgentsEndpoint:
    """Tests for agents listing endpoint."""

    @pytest.mark.asyncio
    async def test_list_agents(self, client: AsyncClient):
        """Test /api/agents endpoint."""
        response = await client.get("/api/agents")
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        agents = data["agents"]
        assert len(agents) >= 5  # At least 5 agents (excluding help)

    @pytest.mark.asyncio
    async def test_agents_have_required_fields(self, client: AsyncClient):
        """Test that each agent has required fields."""
        response = await client.get("/api/agents")
        data = response.json()
        for agent in data["agents"]:
            assert "id" in agent
            assert "name" in agent
            assert "description" in agent
            assert "icon" in agent

    @pytest.mark.asyncio
    async def test_agents_include_expected_types(self, client: AsyncClient):
        """Test that expected agent types are included."""
        response = await client.get("/api/agents")
        data = response.json()
        agent_ids = [a["id"] for a in data["agents"]]
        assert "default" in agent_ids
        assert "code" in agent_ids
        assert "search" in agent_ids
        assert "travel" in agent_ids

    @pytest.mark.asyncio
    async def test_help_agent_not_listed(self, client: AsyncClient):
        """Test that help agent is not listed separately."""
        response = await client.get("/api/agents")
        data = response.json()
        agent_ids = [a["id"] for a in data["agents"]]
        assert "help" not in agent_ids


class TestChatEndpoint:
    """Tests for chat endpoint."""

    @pytest.mark.asyncio
    async def test_chat_endpoint_returns_sse(self, client: AsyncClient):
        """Test /api/chat returns SSE stream."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Hello",
                "history": [],
                "agent": "code",
            },
        )
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

    @pytest.mark.asyncio
    async def test_chat_with_history(self, client: AsyncClient):
        """Test chat with conversation history."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Continue",
                "history": [
                    {"role": "user", "content": "Previous message"},
                    {"role": "assistant", "content": "Previous response"},
                ],
                "agent": "explain",
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_with_context(self, client: AsyncClient):
        """Test chat with context parameter."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Plan my trip",
                "history": [],
                "agent": "travel",
                "context": {"destination": "Japan", "duration": "5 days"},
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_default_agent(self, client: AsyncClient):
        """Test chat defaults to default agent."""
        response = await client.post(
            "/api/chat",
            json={"message": "Hello"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_chat_invalid_agent(self, client: AsyncClient):
        """Test chat with invalid agent type."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Hello",
                "agent": "invalid_agent",
            },
        )
        # Should return 422 validation error
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_chat_missing_message(self, client: AsyncClient):
        """Test chat without message."""
        response = await client.post(
            "/api/chat",
            json={},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_chat_sse_contains_agent_info(self, client: AsyncClient):
        """Test that SSE stream contains agent info event."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Test",
                "agent": "code",
            },
        )
        assert response.status_code == 200
        # Check response contains agent event
        content = response.text
        assert "event: agent" in content

    @pytest.mark.asyncio
    async def test_chat_sse_contains_tokens(self, client: AsyncClient):
        """Test that SSE stream contains token events."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Test",
                "agent": "code",
            },
        )
        assert response.status_code == 200
        content = response.text
        # Code agent should stream tokens
        assert "event: token" in content

    @pytest.mark.asyncio
    async def test_chat_sse_contains_done(self, client: AsyncClient):
        """Test that SSE stream ends with done event."""
        response = await client.post(
            "/api/chat",
            json={
                "message": "Test",
                "agent": "code",
            },
        )
        assert response.status_code == 200
        content = response.text
        assert "event: done" in content


class TestRootEndpoint:
    """Tests for root endpoint."""

    @pytest.mark.asyncio
    async def test_root_redirects_to_docs(self, client: AsyncClient):
        """Test / redirects to /docs."""
        response = await client.get("/", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "/docs"
