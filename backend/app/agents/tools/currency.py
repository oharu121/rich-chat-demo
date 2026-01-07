"""Currency conversion tools for CrewAI agents."""

import logging

import requests
from crewai.tools import tool

logger = logging.getLogger(__name__)

# Fallback exchange rates (USD base) - used when API is unavailable
FALLBACK_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 149.5,
    "AUD": 1.53,
    "CAD": 1.36,
    "CHF": 0.88,
    "CNY": 7.24,
    "INR": 83.12,
    "MXN": 17.15,
    "BRL": 4.97,
    "THB": 35.5,
    "VND": 24500.0,
    "KRW": 1320.0,
    "SGD": 1.34,
    "NZD": 1.63,
    "ZAR": 18.80,
}

# Country to currency mapping
COUNTRY_CURRENCIES = {
    "usa": ("USD", "US Dollar"),
    "united states": ("USD", "US Dollar"),
    "uk": ("GBP", "British Pound"),
    "united kingdom": ("GBP", "British Pound"),
    "england": ("GBP", "British Pound"),
    "japan": ("JPY", "Japanese Yen"),
    "france": ("EUR", "Euro"),
    "germany": ("EUR", "Euro"),
    "italy": ("EUR", "Euro"),
    "spain": ("EUR", "Euro"),
    "netherlands": ("EUR", "Euro"),
    "portugal": ("EUR", "Euro"),
    "greece": ("EUR", "Euro"),
    "china": ("CNY", "Chinese Yuan"),
    "india": ("INR", "Indian Rupee"),
    "brazil": ("BRL", "Brazilian Real"),
    "mexico": ("MXN", "Mexican Peso"),
    "australia": ("AUD", "Australian Dollar"),
    "canada": ("CAD", "Canadian Dollar"),
    "switzerland": ("CHF", "Swiss Franc"),
    "thailand": ("THB", "Thai Baht"),
    "vietnam": ("VND", "Vietnamese Dong"),
    "south korea": ("KRW", "South Korean Won"),
    "korea": ("KRW", "South Korean Won"),
    "singapore": ("SGD", "Singapore Dollar"),
    "new zealand": ("NZD", "New Zealand Dollar"),
    "south africa": ("ZAR", "South African Rand"),
}


@tool
def convert_currency(amount: float, from_currency: str, to_currency: str) -> str:
    """
    Convert an amount between currencies for budget planning.

    Use this tool when creating budget estimates to show costs in the
    traveler's home currency or the destination's local currency.

    Args:
        amount: The amount to convert
        from_currency: Source currency code (e.g., "USD", "EUR", "JPY")
        to_currency: Target currency code (e.g., "USD", "EUR", "JPY")

    Returns:
        A string with the converted amount and exchange rate used.
    """
    from_curr = from_currency.upper().strip()
    to_curr = to_currency.upper().strip()

    try:
        # Try to get live rates from a free API
        resp = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{from_curr}",
            timeout=5,
        )

        if resp.status_code == 200:
            data = resp.json()
            rates = data.get("rates", {})

            if to_curr in rates:
                rate = rates[to_curr]
                converted = amount * rate
                return (
                    f"{amount:.2f} {from_curr} = {converted:.2f} {to_curr} "
                    f"(rate: 1 {from_curr} = {rate:.4f} {to_curr}, live)"
                )

        # Fall back to cached rates
        return _convert_with_fallback(amount, from_curr, to_curr)

    except requests.Timeout:
        logger.warning(f"Currency API timeout for {from_curr} to {to_curr}")
        return _convert_with_fallback(amount, from_curr, to_curr)
    except Exception as e:
        logger.warning(f"Currency API error: {e}, using fallback rates")
        return _convert_with_fallback(amount, from_curr, to_curr)


def _convert_with_fallback(amount: float, from_curr: str, to_curr: str) -> str:
    """Convert using fallback rates when API is unavailable."""
    if from_curr not in FALLBACK_RATES:
        return f"Unknown currency: {from_curr}. Common codes: USD, EUR, GBP, JPY"

    if to_curr not in FALLBACK_RATES:
        return f"Unknown currency: {to_curr}. Common codes: USD, EUR, GBP, JPY"

    # Convert through USD as base
    usd_amount = amount / FALLBACK_RATES[from_curr]
    converted = usd_amount * FALLBACK_RATES[to_curr]
    rate = FALLBACK_RATES[to_curr] / FALLBACK_RATES[from_curr]

    return (
        f"{amount:.2f} {from_curr} = {converted:.2f} {to_curr} "
        f"(rate: 1 {from_curr} = {rate:.4f} {to_curr}, estimated)"
    )


@tool
def get_local_currency(country: str) -> str:
    """
    Get the local currency for a country.

    Use this to determine what currency to use for budget estimates
    in a specific destination.

    Args:
        country: Country name (e.g., "Japan", "France", "Brazil")

    Returns:
        The currency code and name for the country.
    """
    country_lower = country.lower().strip()

    # Direct match
    if country_lower in COUNTRY_CURRENCIES:
        code, name = COUNTRY_CURRENCIES[country_lower]
        return f"The local currency in {country} is {code} ({name})"

    # Partial match
    for key, (code, name) in COUNTRY_CURRENCIES.items():
        if key in country_lower or country_lower in key:
            return f"The local currency in {country} is {code} ({name})"

    return f"Currency for {country} not found. Common currencies: USD, EUR, GBP, JPY"
