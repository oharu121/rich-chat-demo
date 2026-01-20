# Slash Command Routing Implementation Guide

A comprehensive guide for implementing slash command functionality that routes chat messages to different system prompts/agents. This pattern enables users to select specialized AI behaviors using `/command` syntax.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Implementation](#frontend-implementation)
3. [Backend Implementation](#backend-implementation)
4. [Adding New Commands](#adding-new-commands)
5. [Best Practices](#best-practices)

---

## Architecture Overview

### Data Flow

```
User types "/code explain this function"
        ↓
Frontend parses → command: "/code", message: "explain this function", agent: "code"
        ↓
API Request: POST /api/chat { message, agent: "code", history, context }
        ↓
Backend routes to CodeAgent via Registry
        ↓
Agent uses specialized system prompt
        ↓
SSE stream response back to frontend
```

### Key Components

| Layer | Component | Purpose |
|-------|-----------|---------|
| Frontend | `constants.ts` | Define available commands |
| Frontend | `types.ts` | TypeScript types for commands/agents |
| Frontend | `useSlashCommands.ts` | Parse input, manage menu state |
| Frontend | `ChatInput.tsx` | UI for input + command menu |
| Frontend | `SlashCommandMenu.tsx` | Dropdown menu component |
| Backend | `schemas.py` | AgentType enum, request models |
| Backend | `registry.py` | Agent registration & lookup |
| Backend | `base.py` | BaseAgent abstract class |
| Backend | `chat.py` | SSE streaming endpoint |
| Backend | `*_agent.py` | Individual agent implementations |

---

## Frontend Implementation

### Step 1: Define Types

**File: `lib/types.ts`**

```typescript
// Agent types - must match backend AgentType enum
export type AgentType = "default" | "code" | "search" | "explain" | "help";

// Slash command definition
export interface SlashCommand {
  command: string;      // "/code"
  agent: AgentType;     // "code"
  description: string;  // "Code assistance and generation"
  icon: string;         // Icon identifier for UI
}

// Parsed input result
export interface ParsedInput {
  command: SlashCommand | null;
  message: string;
  agent: AgentType;
}
```

### Step 2: Define Commands

**File: `lib/constants.ts`**

```typescript
import type { SlashCommand, AgentType } from "./types";

// Define available slash commands
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/code",
    agent: "code",
    description: "Code assistance and generation",
    icon: "code",
  },
  {
    command: "/search",
    agent: "search",
    description: "Web search and information lookup",
    icon: "search",
  },
  {
    command: "/explain",
    agent: "explain",
    description: "Explain concepts in detail",
    icon: "book",
  },
  {
    command: "/help",
    agent: "help",
    description: "Show available commands",
    icon: "help",
  },
];

// Agent display configuration (colors, labels for UI badges)
export const AGENT_CONFIG: Record<
  AgentType,
  { label: string; bgColor: string; textColor: string; borderColor: string; icon: string }
> = {
  default: {
    label: "Assistant",
    bgColor: "bg-gray-200",
    textColor: "text-gray-600",
    borderColor: "border-gray-600",
    icon: "chat",
  },
  code: {
    label: "Code",
    bgColor: "bg-purple-200",
    textColor: "text-purple-600",
    borderColor: "border-purple-600",
    icon: "code",
  },
  // ... add more agents
};
```

### Step 3: Create Slash Commands Hook

**File: `hooks/useSlashCommands.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import type { SlashCommand, AgentType } from "@/lib/types";
import { SLASH_COMMANDS } from "@/lib/constants";

export interface ParsedInput {
  command: SlashCommand | null;
  message: string;
  agent: AgentType;
}

export function useSlashCommands() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Parse input to extract command and message
  const parseInput = useCallback((input: string): ParsedInput => {
    // No slash = default agent
    if (!input.startsWith("/")) {
      return { command: null, message: input, agent: "default" };
    }

    // Find space to separate command from message
    const spaceIndex = input.indexOf(" ");
    const commandStr = spaceIndex === -1 ? input : input.slice(0, spaceIndex);
    const message = spaceIndex === -1 ? "" : input.slice(spaceIndex + 1).trim();

    // Look up command
    const command = SLASH_COMMANDS.find((c) => c.command === commandStr);

    if (command) {
      return { command, message, agent: command.agent };
    }

    // Unknown command - treat as regular message
    return { command: null, message: input, agent: "default" };
  }, []);

  // Filter commands as user types
  const getFilteredCommands = useCallback((filter: string): SlashCommand[] => {
    if (!filter || !filter.startsWith("/")) {
      return SLASH_COMMANDS;
    }

    const searchTerm = filter.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter(
      (c) =>
        c.command.slice(1).toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm)
    );
  }, []);

  // Check if in command mode (typing "/" without space)
  const isCommandMode = useCallback((input: string): boolean => {
    return input.startsWith("/") && !input.includes(" ");
  }, []);

  // Handle input changes - show/hide menu
  const handleInputChange = useCallback(
    (input: string) => {
      const inCommandMode = isCommandMode(input);
      setShowMenu(inCommandMode);

      if (inCommandMode) {
        setMenuFilter(input);
        const filtered = getFilteredCommands(input);
        setSelectedIndex((prev) => Math.min(prev, filtered.length - 1));
      } else {
        setMenuFilter("");
        setSelectedIndex(0);
      }
    },
    [isCommandMode, getFilteredCommands]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      filteredCommands: SlashCommand[],
      onSelect: (command: SlashCommand) => void
    ): boolean => {
      if (!showMenu || filteredCommands.length === 0) {
        return false;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          return true;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return true;
        case "Tab":
        case "Enter":
          if (filteredCommands[selectedIndex]) {
            e.preventDefault();
            onSelect(filteredCommands[selectedIndex]);
            return true;
          }
          return false;
        case "Escape":
          e.preventDefault();
          setShowMenu(false);
          return true;
        default:
          return false;
      }
    },
    [showMenu, selectedIndex]
  );

  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuFilter("");
    setSelectedIndex(0);
  }, []);

  return {
    showMenu,
    setShowMenu,
    menuFilter,
    selectedIndex,
    setSelectedIndex,
    parseInput,
    getFilteredCommands,
    isCommandMode,
    handleInputChange,
    handleKeyDown,
    closeMenu,
  };
}
```

### Step 4: Create Command Menu Component

**File: `components/SlashCommandMenu.tsx`**

```typescript
"use client";

import type { SlashCommand } from "@/lib/types";

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  isVisible: boolean;
}

export function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  isVisible,
}: SlashCommandMenuProps) {
  if (!isVisible || commands.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="p-2 max-h-[240px] overflow-y-auto">
        {commands.map((cmd, index) => (
          <button
            key={cmd.command}
            onClick={() => onSelect(cmd)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              index === selectedIndex
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            {/* Icon */}
            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              {/* Render icon based on cmd.icon */}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{cmd.command}</div>
              <div className="text-sm text-gray-500 truncate">{cmd.description}</div>
            </div>
            {index === selectedIndex && (
              <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Tab</kbd>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Step 5: Integrate into Chat Input

**File: `components/ChatInput.tsx`**

```typescript
"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { AGENT_CONFIG } from "@/lib/constants";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { SlashCommandMenu } from "./SlashCommandMenu";
import type { AgentType, SlashCommand } from "@/lib/types";

interface ChatInputProps {
  onSend: (message: string, agent: AgentType) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    showMenu,
    selectedIndex,
    getFilteredCommands,
    handleInputChange,
    handleKeyDown: handleSlashKeyDown,
    closeMenu,
  } = useSlashCommands();

  const filteredCommands = getFilteredCommands(input);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;

    // Use selected command's agent or default
    const agent = selectedCommand?.agent || "default";

    onSend(input.trim(), agent);
    setInput("");
    closeMenu();
  };

  const handleCommandSelect = (command: SlashCommand) => {
    setSelectedCommand(command);
    setInput(""); // Clear "/" input
    closeMenu();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Clear command on Escape
    if (e.key === "Escape" && selectedCommand) {
      e.preventDefault();
      setSelectedCommand(null);
      return;
    }

    // Handle slash command navigation first
    if (handleSlashKeyDown(e, filteredCommands, handleCommandSelect)) {
      return;
    }

    // Enter to submit (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (value: string) => {
    setInput(value);

    // If typing "/" with command selected, clear command
    if (value === "/" && selectedCommand) {
      setSelectedCommand(null);
    }

    handleInputChange(value);
  };

  return (
    <div className="relative">
      {/* Command menu dropdown */}
      <SlashCommandMenu
        commands={filteredCommands}
        selectedIndex={selectedIndex}
        onSelect={handleCommandSelect}
        isVisible={showMenu}
      />

      {/* Selected command badge */}
      {selectedCommand && (
        <div className="px-3 pt-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${AGENT_CONFIG[selectedCommand.agent].bgColor} ${AGENT_CONFIG[selectedCommand.agent].textColor}`}>
            {selectedCommand.command.slice(1)}
            <button onClick={() => setSelectedCommand(null)}>×</button>
          </span>
        </div>
      )}

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or /command..."
        disabled={disabled}
        rows={1}
      />

      <button onClick={handleSubmit} disabled={!input.trim() || disabled}>
        Send
      </button>
    </div>
  );
}
```

### Step 6: API Layer

**File: `lib/api.ts`**

```typescript
import type { AgentType, SSEEvent } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export async function* streamChat(
  message: string,
  history: Array<{ role: string; content: string }>,
  agent: AgentType = "default",
  context?: Record<string, unknown>
): AsyncGenerator<SSEEvent, void, unknown> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      agent,  // <-- Agent type sent to backend
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Parse SSE stream
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        const eventType = line.slice(7);
        // Next line should be data
        continue;
      }
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        yield { type: eventType, data } as SSEEvent;
      }
    }
  }
}
```

---

## Backend Implementation

### Step 1: Define Agent Types

**File: `app/models/schemas.py`**

```python
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AgentType(str, Enum):
    """Available agent types - must match frontend."""
    DEFAULT = "default"
    CODE = "code"
    SEARCH = "search"
    EXPLAIN = "explain"
    HELP = "help"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Message(BaseModel):
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    history: list[Message] = []
    agent: AgentType = AgentType.DEFAULT  # <-- Agent selection
    context: Optional[dict] = None  # Optional agent-specific context
```

### Step 2: Create Base Agent

**File: `app/agents/base.py`**

```python
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

# Response can be string token or tuple of (event_type, content)
StreamItem = str | tuple[str, str | dict | list[dict]]


class BaseAgent(ABC):
    """Abstract base class for all chat agents."""

    name: str           # Display name
    description: str    # Short description
    icon: str          # Icon identifier

    @abstractmethod
    def stream_response(
        self,
        message: str,
        history: list[dict],
        context: dict | None = None,
    ) -> AsyncIterator[StreamItem]:
        """
        Generate streaming response.

        Args:
            message: User's message
            history: Conversation history
            context: Optional agent-specific context

        Yields:
            String tokens or tuples of (event_type, content)
            event_type can be: "token", "status", "error", "sources"
        """
        ...
```

### Step 3: Implement Agents

**File: `app/agents/default_agent.py`**

```python
from collections.abc import AsyncIterator
from app.agents.base import BaseAgent, StreamItem
from app.core.llm import GeminiClient


class DefaultAgent(BaseAgent):
    """General-purpose assistant agent."""

    name = "Assistant"
    description = "General-purpose AI assistant"
    icon = "chat"

    def __init__(self):
        self.client = GeminiClient()

    async def stream_response(
        self,
        message: str,
        history: list[dict],
        context: dict | None = None,
    ) -> AsyncIterator[StreamItem]:
        """Stream response using default system prompt."""

        system_prompt = """You are a helpful AI assistant.
Today is {date}.

Guidelines:
- Be helpful, accurate, and concise
- Use markdown formatting for better readability
"""

        yield ("status", "thinking")

        async for token in self.client.stream_chat(
            message=message,
            history=history,
            system_prompt=system_prompt,
        ):
            yield ("token", token)
```

**File: `app/agents/code_agent.py`**

```python
from collections.abc import AsyncIterator
from app.agents.base import BaseAgent, StreamItem
from app.core.llm import GeminiClient


class CodeAgent(BaseAgent):
    """Specialized agent for code assistance."""

    name = "Code"
    description = "Code assistance and generation"
    icon = "code"

    def __init__(self):
        self.client = GeminiClient()

    async def stream_response(
        self,
        message: str,
        history: list[dict],
        context: dict | None = None,
    ) -> AsyncIterator[StreamItem]:
        """Stream response with code-focused system prompt."""

        # CODE-SPECIALIZED SYSTEM PROMPT
        system_prompt = """You are an expert software engineer and coding assistant.

Your capabilities:
- Write clean, efficient, well-documented code
- Debug issues and explain error messages
- Refactor and optimize existing code
- Explain complex algorithms and data structures

Guidelines:
- Always include code examples with proper syntax highlighting
- Use appropriate language-specific best practices
- Consider edge cases and error handling
- Provide clear explanations alongside code
"""

        yield ("status", "thinking")

        async for token in self.client.stream_chat(
            message=message,
            history=history,
            system_prompt=system_prompt,
        ):
            yield ("token", token)
```

### Step 4: Create Agent Registry

**File: `app/core/registry.py`**

```python
from app.models import AgentType
from app.agents import (
    BaseAgent,
    DefaultAgent,
    CodeAgent,
    SearchAgent,
    ExplainAgent,
)

# Global agent registry
_AGENTS: dict[AgentType, BaseAgent] = {}


def init_agents() -> None:
    """Initialize all agents on app startup."""
    _AGENTS[AgentType.DEFAULT] = DefaultAgent()
    _AGENTS[AgentType.CODE] = CodeAgent()
    _AGENTS[AgentType.SEARCH] = SearchAgent()
    _AGENTS[AgentType.EXPLAIN] = ExplainAgent()
    _AGENTS[AgentType.HELP] = DefaultAgent()  # Reuse default


def clear_agents() -> None:
    """Clear all agents on app shutdown."""
    _AGENTS.clear()


def get_agent(agent_type: AgentType) -> BaseAgent | None:
    """Get agent by type."""
    return _AGENTS.get(agent_type)


def get_all_agents() -> dict[AgentType, BaseAgent]:
    """Get all registered agents."""
    return _AGENTS
```

### Step 5: Create Chat Router

**File: `app/routers/chat.py`**

```python
import json
import time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models import ChatRequest
from app.core.registry import get_agent

router = APIRouter(prefix="/api", tags=["chat"])


def format_sse(event: str, data: dict) -> str:
    """Format server-sent event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def stream_chat_response(request: ChatRequest):
    """Generate SSE stream for chat response."""
    start_time = time.time()

    # ROUTING: Get agent by type from request
    agent = get_agent(request.agent)
    if not agent:
        yield format_sse("error", {
            "message": f"Unknown agent: {request.agent}",
            "code": "UNKNOWN_AGENT"
        })
        return

    # Send agent info
    yield format_sse("agent", {
        "agent": request.agent.value,
        "name": agent.name,
        "description": agent.description,
    })

    # Convert history
    history = [{"role": m.role.value, "content": m.content} for m in request.history]

    # Stream response from agent
    try:
        async for item in agent.stream_response(request.message, history, request.context):
            if isinstance(item, tuple) and len(item) == 2:
                event_type, content = item
                if event_type == "status":
                    yield format_sse("status", {"status": content})
                elif event_type == "token":
                    yield format_sse("token", {"token": content})
                elif event_type == "error":
                    yield format_sse("error", {"message": content})
                    return
                elif event_type == "sources":
                    yield format_sse("sources", {"sources": content})
            else:
                # Legacy: plain string token
                yield format_sse("token", {"token": item})
    except Exception as e:
        yield format_sse("error", {"message": str(e), "code": "STREAM_ERROR"})
        return

    # Done event with timing
    processing_time_ms = int((time.time() - start_time) * 1000)
    yield format_sse("done", {"processing_time_ms": processing_time_ms})


@router.post("/chat")
async def chat(request: ChatRequest):
    """SSE streaming chat endpoint."""
    return StreamingResponse(
        stream_chat_response(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
```

### Step 6: Initialize on App Startup

**File: `app/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.registry import init_agents, clear_agents
from app.routers import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize agents
    init_agents()
    yield
    # Shutdown: Cleanup
    clear_agents()


app = FastAPI(lifespan=lifespan)
app.include_router(chat.router)
```

---

## Adding New Commands

### Checklist for Adding a New Slash Command

1. **Frontend: Add to `SLASH_COMMANDS` array** (`lib/constants.ts`)
   ```typescript
   {
     command: "/analyze",
     agent: "analyze",
     description: "Analyze data and provide insights",
     icon: "chart",
   }
   ```

2. **Frontend: Add AgentType** (`lib/types.ts`)
   ```typescript
   export type AgentType = "default" | "code" | "search" | "explain" | "help" | "analyze";
   ```

3. **Frontend: Add AGENT_CONFIG** (`lib/constants.ts`)
   ```typescript
   analyze: {
     label: "Analyze",
     bgColor: "bg-cyan-200",
     textColor: "text-cyan-600",
     borderColor: "border-cyan-600",
     icon: "chart",
   }
   ```

4. **Backend: Add to AgentType enum** (`models/schemas.py`)
   ```python
   class AgentType(str, Enum):
       # ...existing...
       ANALYZE = "analyze"
   ```

5. **Backend: Create Agent class** (`agents/analyze_agent.py`)
   ```python
   class AnalyzeAgent(BaseAgent):
       name = "Analyze"
       description = "Data analysis and insights"
       icon = "chart"

       async def stream_response(self, message, history, context):
           system_prompt = """You are a data analysis expert..."""
           # Implementation
   ```

6. **Backend: Register in `init_agents()`** (`core/registry.py`)
   ```python
   from app.agents import AnalyzeAgent

   def init_agents():
       # ...existing...
       _AGENTS[AgentType.ANALYZE] = AnalyzeAgent()
   ```

---

## Best Practices

### System Prompt Design

1. **Be specific** - Define clear capabilities and constraints
2. **Include context** - Add current date, user preferences if available
3. **Set output format** - Specify markdown, JSON, or other expected formats
4. **Add guardrails** - Include safety guidelines relevant to the agent's domain

### Agent Architecture

1. **Single responsibility** - Each agent should excel at one thing
2. **Composable** - Agents can delegate to other agents or tools
3. **Stateless** - Don't store conversation state in agents; pass via `context`
4. **Graceful degradation** - Handle errors and fall back appropriately

### Performance

1. **Lazy loading** - Initialize agents on first use if they have heavy dependencies
2. **Connection pooling** - Share LLM clients across agent instances
3. **Streaming** - Always stream responses for better UX

### Testing

1. **Unit test agents** - Test each agent's response generation
2. **Integration test routing** - Verify commands route to correct agents
3. **E2E test** - Verify full flow from UI input to streamed response

---

## File Structure Summary

```
frontend/
├── lib/
│   ├── types.ts           # AgentType, SlashCommand interfaces
│   ├── constants.ts       # SLASH_COMMANDS, AGENT_CONFIG
│   └── api.ts            # streamChat() with agent parameter
├── hooks/
│   └── useSlashCommands.ts  # Command parsing, menu state
└── app/components/
    ├── ChatInput.tsx        # Input with command integration
    └── SlashCommandMenu.tsx # Dropdown menu component

backend/
├── app/
│   ├── main.py             # FastAPI app with lifespan
│   ├── models/
│   │   └── schemas.py      # AgentType enum, ChatRequest
│   ├── core/
│   │   ├── registry.py     # Agent registration
│   │   └── llm.py          # LLM client wrapper
│   ├── agents/
│   │   ├── __init__.py     # Export all agents
│   │   ├── base.py         # BaseAgent abstract class
│   │   ├── default_agent.py
│   │   ├── code_agent.py
│   │   └── ...             # More specialized agents
│   └── routers/
│       └── chat.py         # /api/chat SSE endpoint
```

---

## Key Takeaways

1. **Frontend defines UX** - Slash commands, autocomplete, badges
2. **Backend defines behavior** - Each agent has a unique system prompt
3. **`agent` field in request** - The bridge between frontend command selection and backend routing
4. **Registry pattern** - Clean way to manage and lookup agents
5. **SSE streaming** - Real-time response delivery with status updates

This architecture is highly extensible - adding new commands/agents only requires changes in the defined checklist locations.

---

## Reference: Source Files from rich-chat-demo

The patterns documented above are extracted from these actual implementation files:

| File | Purpose |
|------|---------|
| [frontend/lib/types.ts](frontend/lib/types.ts) | TypeScript type definitions |
| [frontend/lib/constants.ts](frontend/lib/constants.ts) | Command and agent config |
| [frontend/hooks/useSlashCommands.ts](frontend/hooks/useSlashCommands.ts) | Command parsing hook |
| [frontend/app/components/ChatInput.tsx](frontend/app/components/ChatInput.tsx) | Input UI component |
| [frontend/app/components/SlashCommandMenu.tsx](frontend/app/components/SlashCommandMenu.tsx) | Menu component |
| [backend/app/models/schemas.py](backend/app/models/schemas.py) | Pydantic models |
| [backend/app/core/registry.py](backend/app/core/registry.py) | Agent registry |
| [backend/app/agents/base.py](backend/app/agents/base.py) | Base agent class |
| [backend/app/routers/chat.py](backend/app/routers/chat.py) | Chat SSE endpoint |
