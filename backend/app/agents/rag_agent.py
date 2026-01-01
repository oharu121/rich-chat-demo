"""
RAG (Retrieval-Augmented Generation) agent for knowledge base queries.
"""

from collections.abc import AsyncIterator

from app.core.config import settings
from app.core.rag import RAGClient, format_sources

from .base import BaseAgent


class RAGAgent(BaseAgent):
    """Agent that queries an external RAG endpoint for knowledge base searches."""

    name = "RAG"
    description = "Query the knowledge base"
    icon = "database"

    def __init__(self):
        self._client: RAGClient | None = None

    @property
    def client(self) -> RAGClient:
        """Lazy initialization of RAG client."""
        if self._client is None:
            if not settings.RAG_API_URL:
                raise ValueError("RAG_API_URL environment variable is required for RAG agent")
            self._client = RAGClient(settings.RAG_API_URL)
        return self._client

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncIterator[tuple[str, str | list[dict]]]:
        """
        Generate a streaming response by querying the RAG API.

        Yields tuples of (event_type, content):
        - ("status", "querying knowledge base") - Querying RAG API
        - ("token", "text") - Response text token
        - ("sources", [...]) - List of source dicts from retrieved chunks
        - ("error", "message") - Error occurred
        """
        yield ("status", "querying knowledge base")

        chunks: list[dict] = []

        # Convert history to the format expected by RAG API
        rag_history = [
            {"role": msg.get("role", "user"), "content": msg.get("content", "")}
            for msg in history
        ]

        try:
            async for event_type, data in self.client.query(message, rag_history):
                if event_type == "chunks":
                    chunks = data if isinstance(data, list) else []
                elif event_type == "token":
                    yield ("token", str(data) if data else "")
                elif event_type == "error":
                    yield ("error", str(data) if data else "Unknown error")
                    return
                elif event_type == "done":
                    break

            # Yield sources at the end if we have any
            if chunks:
                sources = format_sources(chunks)
                if sources:
                    yield ("sources", sources)

        except ValueError as e:
            # RAG_API_URL not configured
            yield ("error", str(e))
        except Exception as e:
            yield ("error", f"RAG query failed: {e}")
