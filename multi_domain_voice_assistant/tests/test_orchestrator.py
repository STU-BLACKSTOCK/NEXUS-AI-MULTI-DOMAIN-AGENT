"""
Basic tests for the orchestrator: intent routing, context, and chat response structure.
Does not require Ollama to be running; can mock LLM for unit tests.
"""

import pytest

from app.intent_router import IntentRouter, classify_domain
from app.context_manager import ContextManager
from app.config import DEFAULT_DOMAIN, SUPPORTED_DOMAINS


class TestIntentRouter:
    """Test intent routing to domains."""

    def test_route_education_keywords(self) -> None:
        router = IntentRouter()
        assert router.route("Explain how photosynthesis works") == "education"
        assert router.route("I want to learn algebra") == "education"
        assert router.route("What is the definition of force?") == "education"

    def test_route_finance_keywords(self) -> None:
        router = IntentRouter()
        assert router.route("How do I make a monthly budget?") == "finance"
        assert router.route("Explain compound interest on a loan") == "finance"
        assert router.route("What is a SIP in mutual funds?") == "finance"

    def test_route_empty_falls_back_to_default(self) -> None:
        router = IntentRouter()
        assert router.route("") == DEFAULT_DOMAIN
        assert router.route("   ") == DEFAULT_DOMAIN

    def test_route_unknown_intent_returns_default_domain(self) -> None:
        router = IntentRouter()
        # Query with no matching keywords should still return a supported domain
        domain = router.route("xyz random query")
        assert domain in SUPPORTED_DOMAINS


class TestDomainClassifier:
    def test_classify_domain_education(self) -> None:
        assert classify_domain("What is photosynthesis?") == "education"
        assert classify_domain("Explain recursion with an example") == "education"

    def test_classify_domain_finance(self) -> None:
        assert classify_domain("What is compound interest?") == "finance"
        assert classify_domain("How to plan a budget?") == "finance"

    def test_classify_domain_healthcare(self) -> None:
        assert classify_domain("I have fever and cough, what should I do?") == "healthcare"
        assert classify_domain("What are symptoms of allergy?") == "healthcare"

    def test_classify_domain_cooking(self) -> None:
        assert classify_domain("Give me a recipe for pasta") == "cooking"
        assert classify_domain("How to bake a cake?") == "cooking"

    def test_classify_domain_unknown(self) -> None:
        assert classify_domain("xyz random query") == "unknown"


class TestContextManager:
    """Test conversation context storage and retrieval."""

    def test_add_and_get_messages(self) -> None:
        ctx = ContextManager(max_messages=10)
        ctx.clear("s_add")
        ctx.add_user_message("s_add", "Hello")
        ctx.add_assistant_message("s_add", "Hi there")
        messages = ctx.get_messages("s_add")
        assert len(messages) == 2
        assert messages[0]["role"] == "user" and messages[0]["content"] == "Hello"
        assert messages[1]["role"] == "assistant" and messages[1]["content"] == "Hi there"

    def test_clear_session(self) -> None:
        ctx = ContextManager()
        ctx.clear("s_clear")
        ctx.add_user_message("s_clear", "Hi")
        ctx.clear("s_clear")
        assert ctx.get_messages("s_clear") == []

    def test_max_messages_cap(self) -> None:
        ctx = ContextManager(max_messages=2)
        ctx.clear("s_cap")
        ctx.add_user_message("s_cap", "1")
        ctx.add_assistant_message("s_cap", "2")
        ctx.add_user_message("s_cap", "3")
        messages = ctx.get_messages("s_cap")
        assert len(messages) == 2
        assert messages[0]["content"] == "2"
        assert messages[1]["content"] == "3"

