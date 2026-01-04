# Markdown Headers Not Rendering in Chat Bubbles

**Status: Fixed**

## Problem

Markdown headers (e.g., `## Destination Highlights`) appeared as raw text in chat bubbles instead of being rendered as styled headers.

## Solution

Updated `renderContent()` in `MessageBubble.tsx` to:
1. Process content line by line
2. Detect and style headers (`#`, `##`, `###`)
3. Detect and style bullet points (`-` or `*`)
4. Apply inline formatting (bold, code, citations) within each element

### Header Styles
- `#` → `text-xl font-bold` (large heading)
- `##` → `text-lg font-semibold` (section heading)
- `###` → `text-base font-semibold` (subsection)

### Bullet Points
- Rendered with styled bullet character
- Supports indentation

## Files Changed

- `frontend/app/components/MessageBubble.tsx`
  - Refactored `renderContent()` to handle block-level formatting
  - Extracted `renderInlineFormatting()` for citations, bold, and code
