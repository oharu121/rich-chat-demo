"""Travel planning tools for CrewAI agents.

This module provides tools that can be attached to CrewAI agents to enable
operations that benefit from external data sources:

- Image lookup: Find verified Wikipedia Commons image URLs
- Currency conversion: Accurate currency math with live or fallback rates
"""

from .currency import convert_currency, get_local_currency
from .image_lookup import lookup_wikipedia_image

__all__ = [
    "lookup_wikipedia_image",
    "convert_currency",
    "get_local_currency",
]
