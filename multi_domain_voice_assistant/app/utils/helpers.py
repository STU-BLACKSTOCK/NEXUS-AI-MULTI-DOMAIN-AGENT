"""Helper utilities for the application."""


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to max_length, appending ellipsis if needed."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
