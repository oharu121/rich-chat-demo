## Feature: Blue Citation Styling for RAG Agent

### Description
Added blue text styling for citations in RAG agent responses. Citations in `[filename:line-range]` format are now displayed in blue (`text-blue-600`) with medium font weight, matching the styling from the rag-demo project.

### Status
✅ **Completed**

### Implementation Details

**File Modified:**
- `frontend/app/components/MessageBubble.tsx`

**Changes Made:**

1. **Added `isCitation()` helper function** (lines 8-20)
   - Detects citation patterns in bracket notation
   - Supports standard format: `[file.md:10]` or `[file.md:10-20]`
   - Supports Japanese format: `[出典: file, 121-162行目]`

2. **Updated `renderContent()` function** (lines 22-82)
   - Extended regex to capture `[...]` brackets as the first group
   - Citations matching the pattern are wrapped in `<span className="text-blue-600 font-medium">`
   - Non-citation brackets (e.g., markdown links) are rendered as plain text

### Visual Result

**Before:**
```
The answer can be found in [document.md:45-67] which states...
                           ↑ plain text
```

**After:**
```
The answer can be found in [document.md:45-67] which states...
                           ↑ blue text (#2563eb)
```

### Citation Patterns Supported

| Pattern | Example | Styled? |
|---------|---------|---------|
| Standard | `[file.md:10]` | ✅ |
| Range | `[document.md:45-67]` | ✅ |
| Japanese | `[出典: file, 121-162行目]` | ✅ |
| Plain brackets | `[note]` | ❌ |
| Markdown links | `[text](url)` | ❌ |

### Related

- Reference implementation: `/Volumes/MacUSB/repository/rag-demo/frontend/app/components/MessageBubble.tsx`
- RAG agent backend: `backend/app/agents/rag_agent.py`

---

**Date:** 2026-01-02
**Component:** MessageBubble
