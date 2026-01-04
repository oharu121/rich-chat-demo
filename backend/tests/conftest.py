"""
Pytest configuration and fixtures for backend tests.
"""

import os
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="session", autouse=True)
def setup_env():
    """Set up mock environment variables for testing."""
    # Set mock API keys for testing (agents will still work for basic tests)
    os.environ.setdefault("GEMINI_API_KEY", "test-api-key-for-testing")
    os.environ.setdefault("OPENAI_API_KEY", "test-openai-key-for-testing")


@pytest.fixture(scope="session", autouse=True)
def setup_agents(setup_env):
    """Initialize agents once for all tests."""
    # Import here to ensure env vars are set first
    from app.core.registry import init_agents, clear_agents

    init_agents()
    yield
    clear_agents()


@pytest.fixture
async def client(setup_agents):
    """Create an async test client for API testing."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
