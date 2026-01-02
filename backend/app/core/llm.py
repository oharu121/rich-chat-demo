"""Gemini LLM client wrapper with streaming and tool support."""

import asyncio
import logging
from datetime import datetime
from typing import AsyncIterator

from google import genai
from google.genai import types

from .config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper for Google Gemini API with streaming support."""

    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        self.model = model
        logger.info(f"GeminiClient initialized with model: {model}")

    def get_system_prompt(self) -> str:
        """Generate system prompt with current date and time."""
        now = datetime.now()
        return f"""You are a helpful AI assistant.
Today is {now.strftime('%A, %B %d, %Y')} at {now.strftime('%I:%M %p')}.

Guidelines:
- Use markdown formatting for better readability (headers, lists, code blocks, bold/italic)
- Use emojis sparingly where they add clarity or warmth
- When mentioning temperatures, prefer Celsius over Fahrenheit
- Be helpful, accurate, and concise."""

    def _build_contents(
        self, message: str, history: list[dict], max_history: int
    ) -> list[types.Content]:
        """Build contents list from history and current message."""
        contents: list[types.Content] = []

        # Add limited history (most recent messages)
        limited_history = history[-max_history:] if len(history) > max_history else history

        for msg in limited_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            # Map roles: "assistant" -> "model" for Gemini
            gemini_role = "model" if role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=content)],
                )
            )

        # Add current user message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)],
            )
        )

        return contents

    async def stream_response(
        self,
        message: str,
        history: list[dict],
        max_history: int | None = None,
    ) -> AsyncIterator[tuple[str, str | list[dict]]]:
        """
        Stream response from Gemini with status updates.

        Yields tuples of (event_type, content):
        - ("status", "thinking") - Model is processing
        - ("status", "searching") - Model is using web search
        - ("status", "executing") - Model is executing code
        - ("token", "text") - Response text token
        - ("sources", [...]) - List of source dicts with title/url from web search
        """
        if max_history is None:
            max_history = settings.MAX_HISTORY_MESSAGES

        # Build generation config with system instruction and tools
        gen_config = types.GenerateContentConfig(
            system_instruction=self.get_system_prompt(),
            tools=[
                types.Tool(google_search=types.GoogleSearch()),
                types.Tool(code_execution=types.ToolCodeExecution()),
            ],
        )

        # Build contents from history and current message
        contents = self._build_contents(message, history, max_history)

        # Emit initial thinking status
        yield ("status", "thinking")

        logger.info(f"Sending request to Gemini model: {self.model}")
        logger.debug(f"Contents: {len(contents)} messages, Tools: google_search, code_execution")

        try:
            # Run streaming in thread to avoid blocking
            response = await asyncio.to_thread(
                self.client.models.generate_content_stream,
                model=self.model,
                contents=contents,  # type: ignore[arg-type]
                config=gen_config,
            )
            logger.info("Gemini stream started successfully")

            # Track if we've emitted any status for tool use
            emitted_search_status = False
            emitted_code_status = False
            collected_sources: list[dict] = []

            for chunk in response:
                if not chunk.candidates:
                    continue

                candidate = chunk.candidates[0]
                if not candidate.content or not candidate.content.parts:
                    continue

                for part in candidate.content.parts:
                    # Check for executable code (code execution tool)
                    if hasattr(part, "executable_code") and part.executable_code:
                        if not emitted_code_status:
                            yield ("status", "executing")
                            emitted_code_status = True

                    # Check for code execution result
                    elif hasattr(part, "code_execution_result") and part.code_execution_result:
                        # Code finished executing, result coming
                        pass

                    # Check for text content
                    elif hasattr(part, "text") and part.text:
                        yield ("token", part.text)

                # Check grounding metadata for search usage and sources
                if hasattr(candidate, "grounding_metadata") and candidate.grounding_metadata:
                    grounding = candidate.grounding_metadata
                    if hasattr(grounding, "search_entry_point") and grounding.search_entry_point:
                        if not emitted_search_status:
                            yield ("status", "searching")
                            emitted_search_status = True

                    # Collect sources from grounding chunks
                    if hasattr(grounding, "grounding_chunks") and grounding.grounding_chunks:
                        for chunk in grounding.grounding_chunks:
                            if hasattr(chunk, "web") and chunk.web:
                                source = {
                                    "title": chunk.web.title,
                                    "url": chunk.web.uri,
                                }
                                # Avoid duplicates
                                if source not in collected_sources:
                                    collected_sources.append(source)

            # Yield collected sources at the end
            if collected_sources:
                yield ("sources", collected_sources)

        except Exception as e:
            logger.error(f"Gemini API error: {type(e).__name__}: {e}", exc_info=True)
            yield ("error", str(e))


# Global client instance (initialized lazily)
_gemini_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Get or create the Gemini client instance."""
    global _gemini_client
    if _gemini_client is None:
        settings.validate()
        _gemini_client = GeminiClient(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
        )
    return _gemini_client
