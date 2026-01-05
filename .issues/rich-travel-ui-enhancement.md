# Rich Travel UI Enhancement

**Status: Planning**

## Overview

Currently, the travel agent outputs all three sections (Destination Highlights, Sample Itinerary, Budget Estimate) in a single chat bubble with basic markdown formatting. This proposal enhances the UI with:

1. **Separate bubbles** for each section (streams progressively)
2. **Rich components** tailored to each content type
3. **Image support** using URL references (no downloading)

## Current State

```
┌─────────────────────────────────────────┐
│ ## Destination Highlights               │
│ 1. Christ the Redeemer...               │
│ 2. Iguazu Falls...                      │
│                                         │
│ ## Sample Itinerary                     │
│ Day 1: Morning - X, Afternoon - Y       │
│ Day 2: ...                              │
│                                         │
│ ## Budget Estimate                      │
│ Flights: $800-1200                      │
│ Hotels: $100-150/night                  │
└─────────────────────────────────────────┘
```

## Proposed Design

### 1. Destination Highlights (Carousel/Slider with Images)

```
┌─────────────────────────────────────────┐
│ 🗺️ Destination Highlights               │
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │  📷     │ │  📷     │ │  📷     │ ←→ │
│ │         │ │         │ │         │    │
│ │ Christ  │ │ Iguazu  │ │ Amazon  │    │
│ │ Redeemer│ │ Falls   │ │Rainfor..│    │
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ Best Time: May-September                │
│                                         │
│ 💡 Tips:                                │
│ • Learn basic Portuguese phrases        │
│ • Carry cash for street vendors         │
└─────────────────────────────────────────┘
```

**Image Strategy:**
- Backend instructs LLM to include image URLs (Unsplash, Wikimedia Commons, or Google Places)
- Frontend renders `<img src={url} />` directly
- Fallback placeholder on `onError`
- No server-side downloading required

**Component Features:**
- Horizontal scroll or carousel navigation (← →)
- Each card: image, name, short description
- "Best Time to Visit" as a highlighted callout
- "Tips" in a collapsible or styled list

### 2. Sample Itinerary (Timeline/Accordion)

```
┌─────────────────────────────────────────┐
│ 📅 Sample Itinerary                     │
├─────────────────────────────────────────┤
│ ▼ Day 1 - Rio de Janeiro                │
│   ┌─────────────────────────────────┐   │
│   │ 🌅 Morning                      │   │
│   │ Visit Christ the Redeemer       │   │
│   │                                 │   │
│   │ 🌆 Afternoon                    │   │
│   │ Explore Copacabana Beach        │   │
│   └─────────────────────────────────┘   │
│                                         │
│ ▶ Day 2 - Rio de Janeiro (collapsed)    │
│ ▶ Day 3 - Iguazu Falls (collapsed)      │
│ ▶ Day 4 - Amazon (collapsed)            │
└─────────────────────────────────────────┘
```

**Why Timeline over Table:**
- Mobile-friendly (no horizontal scroll)
- Expandable for variable-length content
- Visual hierarchy with day headers
- Icons for time-of-day context (🌅🌆🌙)

### 3. Budget Estimate (Summary Card)

```
┌─────────────────────────────────────────┐
│ 💰 Budget Estimate                      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  Estimated Total: $2,500 - $3,500  │ │
│ │  (for 5 days, mid-range budget)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Breakdown:                              │
│ ├── ✈️ Flights      $800 - $1,200      │
│ ├── 🏨 Hotels       $500 - $750        │
│ ├── 🍽️ Food         $300 - $450        │
│ ├── 🚕 Transport    $150 - $250        │
│ └── 🎟️ Activities   $200 - $350        │
│                                         │
│ 💡 Pro Tip: Book flights 2-3 months    │
│    in advance for best prices          │
└─────────────────────────────────────────┘
```

**Features:**
- Prominent total estimate at top
- Visual breakdown with icons per category
- Pro tip callout box at bottom

## Implementation Plan

### Phase 1: Backend Changes

**File: `backend/app/agents/travel_agent.py`**

1. Emit 3 separate SSE events instead of one combined response:
   - `travel_highlights` event with structured data
   - `travel_itinerary` event with structured data
   - `travel_budget` event with structured data

2. Modify CrewAI task outputs to return structured JSON:
   ```python
   # Research task output
   {
     "attractions": [
       {"name": "Christ the Redeemer", "description": "...", "image_url": "..."},
       ...
     ],
     "best_time": "May to September",
     "tips": ["Learn basic Portuguese", "Carry cash"]
   }
   ```

3. Add image URL generation:
   - Option A: Instruct LLM to include Wikimedia/Unsplash URLs
   - Option B: Use Unsplash Source API: `https://source.unsplash.com/featured/?{attraction_name}`

### Phase 2: Frontend Components

**New Components:**

1. `frontend/app/components/travel/DestinationHighlights.tsx`
   - Horizontal carousel with attraction cards
   - Image with fallback
   - Best time callout
   - Tips list

2. `frontend/app/components/travel/ItineraryTimeline.tsx`
   - Accordion-style day expansion
   - Morning/Afternoon/Evening sections
   - Icons for activities

3. `frontend/app/components/travel/BudgetSummary.tsx`
   - Total estimate header
   - Category breakdown list
   - Pro tip callout

**Updated Files:**

- `frontend/lib/types.ts` - New SSE event types
- `frontend/hooks/useChat.ts` - Handle new events
- `frontend/app/components/MessageBubble.tsx` - Render new components

### Phase 3: SSE Protocol Changes

New event types:
```typescript
interface SSETravelHighlightsEvent {
  type: "travel_highlights";
  data: {
    destination: string;
    attractions: Array<{
      name: string;
      description: string;
      image_url?: string;
      category?: "landmark" | "nature" | "beach" | "culture";
    }>;
    best_time: string;
    tips: string[];
  };
}

interface SSETravelItineraryEvent {
  type: "travel_itinerary";
  data: {
    days: Array<{
      day: number;
      location: string;
      activities: Array<{
        time: "morning" | "afternoon" | "evening";
        activity: string;
        description?: string;
      }>;
    }>;
  };
}

interface SSETravelBudgetEvent {
  type: "travel_budget";
  data: {
    total_min: number;
    total_max: number;
    currency: string;
    breakdown: Array<{
      category: string;
      icon: string;
      min: number;
      max: number;
    }>;
    tip?: string;
  };
}
```

## Image URL Sources

| Source | Pros | Cons |
|--------|------|------|
| **Unsplash Source** | Free, no API key, simple URL pattern | Less specific results |
| **Wikimedia Commons** | Authoritative, stable URLs | Harder to find programmatically |
| **LLM-generated** | Context-aware | May hallucinate URLs |
| **Google Places** | Accurate, high quality | Requires API key + billing |

**Recommended approach:** Use Unsplash Source as primary with fallback placeholder.

```typescript
const getImageUrl = (name: string) =>
  `https://source.unsplash.com/400x300/?${encodeURIComponent(name)}`;

<img
  src={attraction.image_url || getImageUrl(attraction.name)}
  onError={(e) => e.currentTarget.src = "/placeholder-attraction.jpg"}
/>
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `backend/app/agents/travel_agent.py` | Modify | Emit structured events |
| `frontend/app/components/travel/DestinationHighlights.tsx` | Create | Carousel component |
| `frontend/app/components/travel/ItineraryTimeline.tsx` | Create | Accordion timeline |
| `frontend/app/components/travel/BudgetSummary.tsx` | Create | Budget card |
| `frontend/lib/types.ts` | Modify | Add new event types |
| `frontend/hooks/useChat.ts` | Modify | Handle new events |
| `frontend/app/components/MessageBubble.tsx` | Modify | Render new components |
| `backend/app/routers/chat.py` | Modify | Forward new event types |

## Open Questions

1. **Image reliability**: Should we validate URLs server-side before sending?
2. **Carousel library**: Use native CSS scroll-snap or a library like Swiper?
3. **Accordion state**: Expand first day by default or all collapsed?
4. **Currency formatting**: Use Intl.NumberFormat or simple string?

## Success Metrics

- Each section renders in its own bubble
- Images load successfully (with fallback)
- Timeline expands/collapses smoothly
- Mobile-responsive layout
- No increase in perceived latency (streaming still works)
