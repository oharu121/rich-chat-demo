---
title: Rich Chat Backend API
emoji: 🪄
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---

# Rich Chat Backend

FastAPI backend for the Agent Chat interface with SSE streaming and agent routing.

## Features

- **SSE Streaming** - Real-time token streaming via Server-Sent Events
- **Agent Routing** - Route messages to specialized agents based on slash commands
- **Extensible** - Easy to add new agents by extending BaseAgent

## Project Structure

```
backend/
├── main.py              # FastAPI app with SSE endpoints
├── agents/
│   ├── base.py          # Abstract BaseAgent class
│   ├── default_agent.py # General chat agent
│   ├── code_agent.py    # Code assistance agent
│   ├── search_agent.py  # Search/lookup agent
│   └── explain_agent.py # Explanation agent
└── models/
    └── schemas.py       # Pydantic models
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat | SSE streaming chat with agent routing |
| GET | /api/health | Health check |
| GET | /api/agents | List available agents |

## Getting Started

### Prerequisites

- Python 3.12+
- uv (Python package manager)

### Installation

```bash
cd backend
uv sync
```

### Running

```bash
uv run uvicorn main:app --reload --port 7860
```

The API will be available at http://localhost:7860

## API Usage

### POST /api/chat

Send a chat message and receive SSE streaming response.

**Request:**
```json
{
  "message": "Write a hello world function",
  "history": [],
  "agent": "code"
}
```

**Response (SSE):**
```
event: agent
data: {"agent": "code", "name": "Code Agent", "description": "Code assistance and generation"}

event: token
data: {"token": "Here's"}

event: token
data: {"token": " a"}

event: done
data: {"processing_time_ms": 150}
```

### GET /api/agents

List all available agents.

**Response:**
```json
{
  "agents": [
    {"id": "default", "name": "Default Agent", "description": "General chat assistant"},
    {"id": "code", "name": "Code Agent", "description": "Code assistance and generation"},
    {"id": "search", "name": "Search Agent", "description": "Web search and information lookup"},
    {"id": "explain", "name": "Explain Agent", "description": "Explain concepts in detail"}
  ]
}
```

## Adding New Agents

1. Create a new file in `agents/` (e.g., `my_agent.py`)
2. Extend `BaseAgent` and implement `stream_response()`
3. Register the agent in `main.py`

```python
from .base import BaseAgent
from collections.abc import AsyncIterator
import asyncio

class MyAgent(BaseAgent):
    name = "My Agent"
    description = "Does something cool"
    icon = "star"

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncIterator[str]:
        yield "Hello "
        await asyncio.sleep(0.05)
        yield "from "
        await asyncio.sleep(0.05)
        yield "my agent!"
```

Then register in `main.py`:
```python
from agents.my_agent import MyAgent

AGENTS["my_agent"] = MyAgent()
```

## Type Checking

```bash
uv run pyright
```

## License

MIT