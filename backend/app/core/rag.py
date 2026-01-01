"""RAG (Retrieval-Augmented Generation) API client."""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)


class RAGClient:
    """Client for querying the RAG backend API."""

    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")

    async def query(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[tuple[str, list[dict] | str | None], None]:
        """
        Query the RAG API with streaming response.

        Args:
            message: The user's question
            history: Optional conversation history

        Yields:
            Tuples of (event_type, data):
            - ("chunks", list[dict]) - Retrieved document chunks
            - ("token", str) - Single token of the response
            - ("done", None) - Stream complete
            - ("error", str) - Error message
        """
        request_data = {
            "message": message,
            "history": history or [],
            "document_set": "original",
            "strategy": "standard",
            "use_reranking": False,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/api/chat",
                    json=request_data,
                    headers={"Accept": "text/event-stream"},
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"RAG API error: {response.status} - {error_text}")
                        yield ("error", f"RAG API returned {response.status}")
                        return

                    current_event = ""
                    async for line in response.content:
                        line_str = line.decode("utf-8").strip()

                        if not line_str:
                            continue

                        if line_str.startswith("event: "):
                            current_event = line_str[7:]
                        elif line_str.startswith("data: "):
                            data_str = line_str[6:]
                            try:
                                data = json.loads(data_str)
                            except json.JSONDecodeError:
                                continue

                            if current_event == "chunks":
                                yield ("chunks", data.get("chunks", []))
                            elif current_event == "token":
                                yield ("token", data.get("token", ""))
                            elif current_event == "done":
                                yield ("done", None)
                            elif current_event == "error":
                                yield ("error", data.get("message", "Unknown error"))

        except aiohttp.ClientError as e:
            logger.error(f"RAG API connection error: {e}")
            yield ("error", f"Connection error: {e}")
        except Exception as e:
            logger.error(f"RAG API unexpected error: {e}")
            yield ("error", f"Unexpected error: {e}")


def format_sources(chunks: list[dict[str, Any]]) -> list[dict[str, str]]:
    """
    Format retrieved chunks into source citations.

    Args:
        chunks: List of retrieved document chunks

    Returns:
        List of source dictionaries with title and url fields
    """
    if not chunks:
        return []

    sources: list[dict[str, str]] = []
    seen: set[str] = set()

    for chunk in chunks[:3]:  # Top 3 sources
        filename = chunk.get("filename", "unknown")
        start_line = chunk.get("start_line", 0)
        end_line = chunk.get("end_line", 0)
        key = f"{filename}:{start_line}-{end_line}"

        if key not in seen:
            sources.append({
                "title": key,
                "url": "",  # RAG sources don't have URLs
            })
            seen.add(key)

    return sources
