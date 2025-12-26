"""
Code assistance agent for programming help.
"""

import asyncio
from typing import AsyncGenerator

from .base import BaseAgent


class CodeAgent(BaseAgent):
    """Specialized agent for code assistance and generation."""

    name = "Code"
    description = "Code assistance and generation"
    icon = "code"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        """Generate code-focused responses."""
        # Demo response - in production, this would call an LLM API
        response = f"[Code Agent] Analyzing your request: \"{message}\"\n\n"
        response += "Here's a code example:\n\n"
        response += "```python\n"
        response += "def hello_world():\n"
        response += "    print('Hello, World!')\n"
        response += "```\n\n"
        response += "This is a placeholder response. In production, I would generate actual code based on your request."

        # Simulate streaming by yielding characters for code blocks
        for char in response:
            yield char
            await asyncio.sleep(0.01)
