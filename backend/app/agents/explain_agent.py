"""
Explain agent for detailed explanations.
"""

import asyncio
from typing import AsyncGenerator

from .base import BaseAgent


class ExplainAgent(BaseAgent):
    """Agent for providing detailed explanations of concepts."""

    name = "Explain"
    description = "Explain concepts in detail"
    icon = "book"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        """Generate detailed explanatory responses."""
        # Demo response - in production, this would call an LLM API
        response = f"[Explain Agent] Let me explain: \"{message}\"\n\n"
        response += "## Overview\n\n"
        response += "This is an important topic that deserves a thorough explanation. "
        response += "Let me break it down for you:\n\n"
        response += "### Key Points\n\n"
        response += "1. **First concept** - The foundational idea\n"
        response += "2. **Second concept** - Building on the first\n"
        response += "3. **Third concept** - Advanced understanding\n\n"
        response += "### Summary\n\n"
        response += "This is a placeholder explanation. In production, I would provide a comprehensive breakdown of your topic."

        # Simulate streaming
        words = response.split(" ")
        for i, word in enumerate(words):
            if i > 0:
                yield " "
            yield word
            await asyncio.sleep(0.025)
