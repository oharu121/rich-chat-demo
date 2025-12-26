"""
Default general-purpose chat agent.
"""

import asyncio
from typing import AsyncGenerator

from .base import BaseAgent


class DefaultAgent(BaseAgent):
    """General-purpose chat agent for everyday conversations."""

    name = "Default"
    description = "General chat assistant"
    icon = "chat"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        """Generate a helpful response to the user's message."""
        # Demo response - in production, this would call an LLM API
        response = f"I received your message: \"{message}\". "
        response += "I'm the default assistant, ready to help with general questions. "
        response += "Try using /code for programming help, /search for lookups, or /explain for detailed explanations."

        # Simulate streaming by yielding words
        words = response.split(" ")
        for i, word in enumerate(words):
            if i > 0:
                yield " "
            yield word
            await asyncio.sleep(0.03)  # Simulate LLM token generation delay
