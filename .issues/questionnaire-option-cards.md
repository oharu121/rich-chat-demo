# Questionnaire Option Cards UI Improvement

## Status: Fixed (v0.7.0 - 2026-01-04)

## Problem

The multi-step questionnaire was using small pill buttons with tooltip descriptions that only appeared on hover. This was poor UX:

1. **Tooltips are hidden** - Users can't see option descriptions without hovering
2. **Small touch targets** - Pill buttons are harder to tap on mobile
3. **Not matching Claude Code style** - Claude Code's AskUserQuestion uses full-width cards with visible descriptions

## Screenshot Reference

Claude Code's AskUserQuestion UI shows:
- Full-width option cards stacked vertically
- Label text in bold
- Description text visible below the label (not hidden in tooltip)
- Clear visual hierarchy

## Solution

Changed `TravelQuestionnaire.tsx` from pill buttons to card-style options:

### Before (Pill buttons with tooltips)
```tsx
<div className="flex flex-wrap gap-2 mb-3">
  {options.map((opt) => (
    <button className="px-3 py-1.5 rounded-full text-sm border">
      <span>{opt.label}</span>
      {/* Description only visible on hover */}
      {opt.description && (
        <span className="absolute ... opacity-0 group-hover:opacity-100">
          {opt.description}
        </span>
      )}
    </button>
  ))}
</div>
```

### After (Card-style with visible descriptions)
```tsx
<div className="space-y-2 mb-3">
  {options.map((opt) => (
    <button className="w-full text-left px-4 py-3 rounded-lg border">
      <div className="font-medium text-sm">{opt.label}</div>
      {opt.description && (
        <div className="text-xs mt-0.5 text-gray-500">
          {opt.description}
        </div>
      )}
    </button>
  ))}
</div>
```

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Layout | Horizontal flex wrap | Vertical stack |
| Width | Auto (content-based) | Full width |
| Padding | `px-3 py-1.5` | `px-4 py-3` |
| Shape | `rounded-full` (pill) | `rounded-lg` (card) |
| Description | Tooltip on hover | Always visible below label |
| Touch target | Small | Large |

## Files Modified

- `frontend/app/components/TravelQuestionnaire.tsx`

## Related

- Part of v0.7.0 Claude Code style multi-step questionnaire feature
