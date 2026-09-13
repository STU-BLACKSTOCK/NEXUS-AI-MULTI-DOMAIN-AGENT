"""
Prompt builder utilities.

Builds a structured prompt that includes:
- assistant role & domain restriction
- user profile context (age/education/etc.)
- user query
"""

from __future__ import annotations

from typing import Any, Dict, Optional


def _learning_style_from_profile(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return "Use a clear, neutral explanation appropriate for a general audience."

    age = profile.get("age")
    education = (profile.get("education") or "").lower()

    if isinstance(age, int) and age <= 10:
        return "Use very simple words, short sentences, and a friendly tone. Use tiny examples."
    if "school" in education:
        return "Use simple explanations with relatable examples. Avoid heavy jargon."
    if "college" in education or "university" in education:
        return "Use moderate technical depth. Include definitions and step-by-step reasoning."
    if "professional" in education or "working" in education:
        return "Use detailed, technical answers with practical framing and edge cases."
    return "Use a clear explanation with examples and reasonable technical depth."


def build_prompt(
    *,
    assistant_name: str,
    assistant_domain: str,
    domain_rules: str,
    user_query: str,
    user_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Build a single prompt string for Gemini.
    """
    style = _learning_style_from_profile(user_profile)
    profile_block = "Anonymous user (no profile)." if not user_profile else (
        f"name: {user_profile.get('name')}\n"
        f"age: {user_profile.get('age')}\n"
        f"education: {user_profile.get('education')}\n"
        f"email: {user_profile.get('email')}\n"
    )

    return (
        "You are a domain-specific assistant in a multi-assistant system.\n\n"
        f"## Assistant\n"
        f"- name: {assistant_name}\n"
        f"- domain: {assistant_domain}\n\n"
        f"## Domain Rules (MUST FOLLOW)\n"
        f"{domain_rules}\n\n"
        f"## User Profile\n{profile_block}\n\n"
        f"## Response Style\n{style}\n\n"
        f"## User Query\n{user_query}\n\n"
        "## Output Requirements\n"
        "- Be accurate and concise.\n"
        "- If information is uncertain, say so.\n"
        "- Use markdown with headings/bullets when helpful.\n"
    )

