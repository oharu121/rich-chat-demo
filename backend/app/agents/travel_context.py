"""
Travel context model for storing extracted travel planning information.

This Pydantic model is used by the LLM to extract structured information
from user conversations and track what information is still missing.
"""

from pydantic import BaseModel, Field


class TravelContext(BaseModel):
    """Structured context for travel planning extracted from conversation."""

    destination: str | None = Field(
        default=None,
        description="The destination country, city, or region",
    )
    duration: str | None = Field(
        default=None,
        description="Trip duration (e.g., '5 days', '2 weeks')",
    )
    budget: str | None = Field(
        default=None,
        description="Budget level (e.g., 'budget', 'mid-range', 'luxury') or specific amount",
    )
    interests: list[str] | None = Field(
        default=None,
        description="List of interests (e.g., ['nature', 'culture', 'adventure'])",
    )
    travel_dates: str | None = Field(
        default=None,
        description="When they plan to travel (e.g., 'next month', 'December 2026')",
    )
    group_size: str | None = Field(
        default=None,
        description="Number of travelers (e.g., 'solo', '2 people', 'family of 4')",
    )
    special_requirements: str | None = Field(
        default=None,
        description="Special needs like accessibility, dietary restrictions, etc.",
    )

    def get_missing_required(self) -> list[str]:
        """Return list of required fields that are still None.

        Required fields for basic trip planning:
        - destination: We need to know where they're going
        - duration: Affects itinerary planning
        - budget: Affects recommendations

        Optional fields (interests, travel_dates, group_size, special_requirements)
        are nice-to-have but not blocking.
        """
        required = ["destination", "duration", "budget"]
        return [f for f in required if getattr(self, f) is None]

    def get_missing_optional(self) -> list[str]:
        """Return list of optional fields that are still None."""
        optional = ["interests", "travel_dates", "group_size"]
        return [f for f in optional if getattr(self, f) is None]

    def is_complete(self) -> bool:
        """Check if all required fields are filled."""
        return len(self.get_missing_required()) == 0

    def to_context_string(self) -> str:
        """Convert to a human-readable context string for LLM prompts."""
        parts = []
        if self.destination:
            parts.append(f"Destination: {self.destination}")
        if self.duration:
            parts.append(f"Duration: {self.duration}")
        if self.budget:
            parts.append(f"Budget: {self.budget}")
        if self.interests:
            parts.append(f"Interests: {', '.join(self.interests)}")
        if self.travel_dates:
            parts.append(f"Travel dates: {self.travel_dates}")
        if self.group_size:
            parts.append(f"Group size: {self.group_size}")
        if self.special_requirements:
            parts.append(f"Special requirements: {self.special_requirements}")
        return "\n".join(parts) if parts else "No context available"
