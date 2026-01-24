# Plan: Switch to dark theme glass morphism

**Status:** Completed
**Date:** 2026-01-24

## Goal

Switch the application from light theme to dark theme with enhanced glass morphism effects, matching the "magical design system" from the provided guide. This makes glass effects significantly more visible and creates a premium dark UI aesthetic.

## Summary of Changes

- Changed background from light (#fafbfc) to dark (#0a0a0f)
- Updated glass morphism CSS variables for dark mode (5-12% opacity instead of 60-85%)
- Enhanced radial gradient background with blue/purple/pink colors
- Increased floating orb opacity from 15% to 35% for visibility
- Updated all text colors to light variants (white, gray-100 to gray-500)
- Applied glass styling to chat input area
- Updated header, command buttons, and badges for dark theme

## Files Modified

- [globals.css](frontend/app/globals.css) - Dark theme colors, glass variables (--glass-bg-*), radial gradients with purple/pink accents
- [ChatInterface.tsx](frontend/app/components/ChatInterface.tsx) - Dark mode text colors, removed light background class
- [MessageBubble.tsx](frontend/app/components/MessageBubble.tsx) - Light text colors for agent bubbles (text-gray-100/200), updated header/code/bullet styles
- [ChatInput.tsx](frontend/app/components/ChatInput.tsx) - Glass bubble styling for input, dark mode colors for textarea/buttons/kbd elements

## Visual Changes

| Element | Before (Light) | After (Dark) |
|---------|----------------|--------------|
| Background | #fafbfc (off-white) | #0a0a0f (near-black) |
| Glass opacity | 60-85% | 5-12% |
| Text colors | gray-700 to gray-900 | gray-100 to white |
| Floating orbs | 15% opacity | 35% opacity |
| Radial gradients | 8-20% blue | 8-15% blue/purple/pink |

## Breaking Changes

- Theme switched from light to dark - this is a visual breaking change
- Users with light mode preference will now see dark UI

## Deprecations

None
