# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2026-01-04

### Fixed

- **Questionnaire Option Cards UI**: Changed from pill buttons with hover tooltips to full-width card-style options
  - Descriptions now always visible below the label (not hidden in tooltips)
  - Larger touch targets for better mobile UX
  - Matches Claude Code's AskUserQuestion design pattern
  - Vertical stack layout instead of horizontal flex wrap

### Technical

- Updated `TravelQuestionnaire.tsx` option rendering:
  - Layout: `flex flex-wrap` → `space-y-2` (vertical stack)
  - Width: Auto → Full width (`w-full`)
  - Shape: `rounded-full` (pill) → `rounded-lg` (card)
  - Description: Tooltip on hover → Always visible `text-xs` below label

## [0.7.0] - 2026-01-04

### Added

- **LLM-Powered Dynamic Question Generation**: Travel agent now uses Gemini to intelligently gather trip details
  - Semantic context extraction replaces brittle regex/keyword matching
  - Only asks questions for missing information (e.g., won't ask duration if user said "5 days")
  - Destination-aware options (Brazil gets "Amazon Rainforest", "Rio Carnival" instead of generic "Nature")
  - Real-time status feedback: "Analyzing your request...", "Preparing questions..."

- **Claude Code Style Multi-Step Questionnaire**: New wizard UI for travel intake
  - Progress bar showing current step (e.g., "1 of 2")
  - Auto-advance on single-select questions
  - "Continue" button for multi-select questions
  - Back navigation between steps
  - "Other" text input for custom answers
  - Header labels for each question category

### Changed

- **Travel Agent Architecture**: Complete rewrite with LLM-powered intake
  - New `TravelContext` Pydantic model for structured context extraction
  - Gemini JSON mode (`response_mime_type="application/json"`) for reliable extraction
  - Fallback to static questions if LLM generation fails

### Technical

- New `backend/app/agents/travel_context.py` - Pydantic model with `get_missing_required()` method
- Rewritten `backend/app/agents/travel_agent.py`:
  - `_extract_context()` - LLM extracts travel info from conversation
  - `_generate_questions()` - LLM generates contextual questions
  - `_call_gemini_json()` - Helper for JSON-mode API calls
  - Removed: `TRAVEL_QUESTIONS`, `_extract_destination()`, `_has_travel_details()`, `_find_destination_in_history()`
- New `frontend/app/components/TravelQuestionnaire.tsx` - Multi-step wizard component
- New TypeScript types: `QuestionStep`, `Questionnaire`, `SSEQuestionnaireEvent`
- Updated `useChat.ts` to handle `questionnaire` SSE event
- Updated `chat.py` router to forward `questionnaire` event
- Documentation updated in `.dev-notes/2026-01-03.md`

## [0.6.2] - 2026-01-03

### Fixed

- **Destination Context Preserved**: Travel agent now remembers destination after question form submission
  - Previously, submitting preferences via the form would cause agent to ask "where would you like to go?" again
  - New `_find_destination_in_history()` method searches conversation history for the destination
  - Checks both user messages and assistant responses for destination patterns

### Technical

- Added `_find_destination_in_history()` method to `travel_agent.py`
- Updated `stream_response()` to search history when current message lacks destination but has preferences
- Comprehensive documentation added to `.dev-notes/2026-01-03.md`:
  - Travel agent flow diagram showing where CrewAI is/isn't involved
  - Analysis of why CrewAI memory is not needed for this use case
  - Guide on when to use CrewAI memory (short-term, long-term, entity)
  - Vector database comparison (Pinecone, Qdrant, Weaviate, Chroma, pgvector, Supabase)

## [0.6.1] - 2026-01-02

### Fixed

- **Travel Agent Interactive Questions**: Added clickable question form UI for gathering trip preferences
  - Duration, budget, and interests selection with pill buttons
  - Multi-select support for interests
  - Custom text input option for flexible answers

- **Real-time Status Updates**: Fixed fake status messages
  - Now shows actual agent progress via CrewAI `task_callback`
  - Status updates: "Research complete", "Itinerary complete", "Budget complete"

- **Response Streaming**: Fixed truncated responses and long wait times
  - Each agent's output streams immediately after completion
  - Added `max_tokens=800` limit per agent for concise responses

- **Circular Import**: Fixed import error in backend core module

- **Dependencies**: Added explicit `urllib3` and `requests` versions for CrewAI compatibility

### Technical

- New `TravelQuestion` and `SSEQuestionsEvent` types in frontend
- New `TravelQuestionForm.tsx` component for interactive question UI
- Updated `MessageBubble.tsx` to render question forms
- Updated `useChat.ts` hook to handle questions SSE event
- Updated `chat.py` router to forward questions event
- Updated `StreamItem` type in base.py to support dict payload

## [0.6.0] - 2026-01-02

### Added

- **Travel Planning Slash Command**: New `/travel` command for AI-powered trip planning
  - Multi-agent system using CrewAI framework with 4 specialized agents:
    - Research Agent: Destinations, attractions, weather, local culture
    - Itinerary Planner: Day-by-day scheduling and activities
    - Budget Analyst: Cost estimation and money-saving tips
    - Logistics Coordinator: Transportation and accommodation recommendations
  - Sequential execution: research → plan → budget → logistics
  - Real-time status updates showing which agent is working
  - Rose color theme for travel command chip

### Technical

- Added `crewai>=0.86.0` dependency for multi-agent orchestration
- New files: `backend/app/agents/travel_agent.py`
- `AgentType` enum extended with `TRAVEL` value
- Frontend types updated with new status types for travel planning phases
- Frontend constants updated for `/travel` command with rose styling

## [0.5.0] - 2026-01-01

### Added

- **RAG Slash Command**: New `/rag` command for querying external knowledge bases
  - Streams responses in real-time from RAG API
  - Displays source citations (filename:line-range) after answers
  - Status bubble shows "Querying knowledge base..." during processing
  - Teal color theme for RAG command chip

### Technical

- New `RAG_API_URL` environment variable for RAG endpoint configuration
- New files: `backend/app/core/rag.py` (RAG client), `backend/app/agents/rag_agent.py`
- `AgentType` enum extended with `RAG` value
- Frontend types and constants updated for `/rag` command
- Added `aiohttp` dependency for async HTTP requests to RAG API

## [0.4.0] - 2025-12-31

### Added

- **Citation Support**: Web search responses now display source links
  - Sources shown as clickable badges below message content
  - External link icon for visual clarity
- **Improved System Prompt**: Enhanced AI response formatting
  - Markdown formatting for better readability
  - Appropriate emoji usage for clarity and warmth
  - Celsius temperature preference

### Changed

- Default Gemini model changed from `gemini-2.0-flash-exp` to `gemini-2.0-flash` (stable)

### Technical

- New `SSESourcesEvent` type for source citation data
- `Message` interface extended with optional `sources` field
- `useChat` hook handles new `sources` SSE event
- `MessageBubble` component renders source links
- Backend extracts sources from Gemini's `grounding_metadata`
- Added type guards in chat router for proper type narrowing

## [0.3.0] - 2025-12-29

### Added

- **Gemini Integration**: Default agent now uses Google Gemini API for real AI responses
- **Google Search Grounding**: Built-in web search capability (enabled by default) for real-time information
- **Code Execution**: Built-in code execution tool for calculations and runnable code demonstrations
- **Status Bubbles**: Real-time status indicators showing model activity:
  - "Thinking..." when processing
  - "Searching the web..." when using Google Search
  - "Running code..." when executing code
- **System Prompt**: Dynamic system prompt with current date and time
- **Environment Configuration**: New configuration system via `.env` file
  - `GEMINI_API_KEY` (required)
  - `GEMINI_MODEL` (default: `gemini-2.0-flash`)
  - `MAX_HISTORY_MESSAGES` (default: 20)

### Changed

- Default agent now streams real responses from Gemini instead of mock text
- SSE protocol extended with new `status` event type for tool usage visibility
- Backend dependencies updated: added `google-genai`, `python-dotenv`

### Technical

- New files: `backend/app/core/config.py`, `backend/app/core/llm.py`, `backend/.env.example`
- Frontend types extended with `SSEStatusEvent` interface
- `useChat` hook now exposes `currentStatus` for UI display
- `MessageBubble` component updated to show status messages during streaming
- Chat router handles both tuple format (new agents) and string format (legacy agents)

## [0.2.1] - 2025-12-29

### Fixed

- Slash command suggestion buttons on the welcome screen now properly select the command and display the corresponding chip
- Clicking a suggestion button (e.g., `/code`) now focuses the input and shows the command chip ready for user input

### Technical

- Exposed `selectCommand` method via `ChatInputRef` interface
- Updated `ChatInterface.tsx` to call `selectCommand` when clicking suggestion buttons

## [0.2.0] - 2025-12-29

### Added

- Command chip now displays with color themes unique to each agent type:
  - `/code` - Purple theme
  - `/search` - Blue theme
  - `/explain` - Amber theme
  - `/help` - Green theme
- Dismiss button (×) on command chip to clear selected command
- Escape key support to clear selected command
- `borderColor` property added to `AGENT_CONFIG` for consistent chip styling

### Changed

- **Breaking UX Change**: Slash command selection now clears input text instead of keeping `/command ` visible
- Command chip repositioned from border overlay to inside the input box (above the text input line)
- Chip styling updated to soft badge style: light background fill with darker border and text
- Chip shape changed to fully rounded (pill style)

### Fixed

- `/code` text no longer remains visible in input after selecting from command menu
- Command chip no longer overlaps with placeholder text
- Typing `/` while a command is selected now properly clears the command and reopens the menu

### Technical

- Added `selectedCommand` state to track command selection separately from input text
- Removed dependency on `parseInput` for active command detection in favor of explicit state
- Updated `AGENT_CONFIG` with `borderColor` field and adjusted color values for chip styling

## [0.1.0] - 2025-12-29

### Added

- Initial release
- Chat interface with specialized AI agents
- Slash command system (`/code`, `/search`, `/explain`, `/help`)
- Streaming message responses
- Auto-resizing textarea input
- Keyboard navigation for command menu (Arrow keys, Tab, Enter, Escape)
