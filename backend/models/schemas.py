"""
Pydantic models for the chat API.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AgentType(str, Enum):
    """Available agent types for routing."""
    DEFAULT = "default"
    CODE = "code"
    SEARCH = "search"
    EXPLAIN = "explain"
    HELP = "help"


class MessageRole(str, Enum):
    """Message role in conversation."""
    USER = "user"
    ASSISTANT = "assistant"


class Message(BaseModel):
    """A single message in the conversation."""
    role: MessageRole
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    history: list[Message] = []
    agent: AgentType = AgentType.DEFAULT


class AgentInfo(BaseModel):
    """Information about an available agent."""
    id: str
    name: str
    description: str
    icon: str


class AgentsResponse(BaseModel):
    """Response for listing available agents."""
    agents: list[AgentInfo]


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str
    agents_loaded: bool
    agent_count: int
