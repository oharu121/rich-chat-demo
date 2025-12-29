# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
