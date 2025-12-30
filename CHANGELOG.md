# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
