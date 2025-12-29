"""
Default general-purpose chat agent with Gemini integration.
"""

from collections.abc import AsyncIterator

from app.core.llm import get_gemini_client

from .base import BaseAgent


class DefaultAgent(BaseAgent):
    """General-purpose chat agent with web search and code execution capabilities."""

    name = "Default"
    description = "General chat assistant with web search and code execution"
    icon = "chat"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncIterator[tuple[str, str]]:
        """
        Generate a streaming response using Gemini.

        Yields tuples of (event_type, content):
        - ("status", "thinking") - Model is processing
        - ("status", "searching") - Model is using web search
        - ("status", "executing") - Model is executing code
        - ("token", "text") - Response text token
        - ("error", "message") - Error occurred
        """
        client = get_gemini_client()
        async for event_type, content in client.stream_response(message, history):
            yield (event_type, content)
