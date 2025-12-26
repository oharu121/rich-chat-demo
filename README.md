# Agent Chat

A chat interface for exploring slash commands that route messages to specialized AI agents.

## Features

- **Slash Commands** - Route messages to different agents with `/code`, `/search`, `/explain`, `/help`
- **Autocomplete** - Command suggestions with keyboard navigation
- **SSE Streaming** - Real-time token streaming like ChatGPT
- **Animated Avatar** - Maya avatar with thinking/speaking/idling states
- **Agent Badges** - Visual indicators showing which agent responded

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 / React 19 / Tailwind CSS 4 |
| Backend | FastAPI / Python 3.12 |
| Streaming | Server-Sent Events (SSE) |

## Project Structure

```
rich-chat-demo/
├── frontend/                 # Next.js frontend
│   ├── app/
│   │   └── components/       # React components
│   ├── hooks/                # Custom hooks (useChat, useSlashCommands)
│   ├── lib/                  # API client, types, constants
│   └── public/avatars/       # Maya avatar GIFs
│
├── backend/                  # Python backend
│   ├── main.py               # FastAPI app
│   ├── agents/               # Agent implementations
│   └── models/               # Pydantic models
│
└── .dev-notes/               # Development notes
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- uv (Python package manager)

### Quick Start

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install

# Install backend dependencies
cd backend && uv sync && cd ..

# Run both frontend and backend
npm run dev
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:7860

### Manual Start

**Backend:**
```bash
cd backend
uv run uvicorn main:app --reload --port 7860
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Slash Commands

| Command | Agent | Description |
|---------|-------|-------------|
| `/code` | Code | Code assistance and generation |
| `/search` | Search | Web search and information lookup |
| `/explain` | Explain | Explain concepts in detail |
| `/help` | Help | Show available commands |

Type `/` in the chat input to see the autocomplete menu.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chat | SSE streaming chat with agent routing |
| GET | /api/health | Health check |
| GET | /api/agents | List available agents |

## Development

### Type Checking

```bash
# Check both frontend and backend
npm run typecheck

# Frontend only
npm run typecheck:frontend

# Backend only
npm run typecheck:backend
```

### Adding New Agents

1. Create a new file in `backend/agents/` (e.g., `my_agent.py`)
2. Extend `BaseAgent` and implement `stream_response()`
3. Register the agent in `backend/main.py`
4. Add the slash command in `frontend/lib/constants.ts`

Example agent:
```python
from .base import BaseAgent

class MyAgent(BaseAgent):
    name = "My Agent"
    description = "Does something cool"
    icon = "star"

    async def stream_response(self, message: str, history: list[dict]):
        yield "Hello "
        yield "from "
        yield "my agent!"
```

## License

MIT
