"""
Base agent class for all chat agents.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


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
    ) -> AsyncIterator[str]:
        """
        Generate a streaming response to the user message.

        Args:
            message: The user's message
            history: List of previous messages in the conversation

        Yields:
            Response tokens one at a time
        """
        ...
