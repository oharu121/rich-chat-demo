"""
Search agent for information lookup.
"""

import asyncio
from typing import AsyncGenerator

from .base import BaseAgent


class SearchAgent(BaseAgent):
    """Agent for searching and retrieving information."""

    name = "Search"
    description = "Web search and information lookup"
    icon = "search"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        """Generate search-focused responses."""
        # Demo response - in production, this would integrate with search APIs
        response = f"[Search Agent] Searching for: \"{message}\"\n\n"
        response += "Here are the top results:\n\n"
        response += "1. **Result One** - A relevant finding about your query\n"
        response += "2. **Result Two** - Additional information discovered\n"
        response += "3. **Result Three** - More context and details\n\n"
        response += "This is a placeholder. In production, I would search the web and return real results."

        # Simulate streaming
        words = response.split(" ")
        for i, word in enumerate(words):
            if i > 0:
                yield " "
            yield word
            await asyncio.sleep(0.02)
