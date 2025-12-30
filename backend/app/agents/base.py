"""
Base agent class for all chat agents.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

# Response can be either a plain string token or a tuple of (event_type, content)
# Content can be a string or list of dicts (for sources)
StreamItem = str | tuple[str, str | list[dict]]


class BaseAgent(ABC):
    """Abstract base class for chat agents."""

    name: str
    description: str
    icon: str

    @abstractmethod
    def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncIterator[StreamItem]:
        """
        Generate a streaming response to the user message.

        Args:
            message: The user's message
            history: List of previous messages in the conversation

        Yields:
            Either plain string tokens or tuples of (event_type, content)
            where event_type is "token", "status", or "error"
        """
        ...
