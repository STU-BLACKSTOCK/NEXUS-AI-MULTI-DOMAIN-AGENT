"""
Base class for all domain assistants.
Ensures a consistent interface for the orchestrator; new domains implement this.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, List, Optional

from app.groq.client import GroqClient
from app.prompting.prompt_builder import build_prompt


class BaseAssistant(ABC):
    """
    Abstract base for domain-specific assistants.
    Each assistant has a domain name and a system prompt, and responds via the LLM engine.
    """

    def __init__(self, groq: GroqClient) -> None:
        self.groq = groq

    @property
    @abstractmethod
    def domain_name(self) -> str:
        """Human-readable domain name, e.g. 'education'."""
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Domain-specific system prompt loaded from file or defined in subclass."""
        pass

    def respond(
        self,
        user_message: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Produce a response for the user message, optionally using conversation context.
        Default: build a structured prompt and call Groq.
        Subclasses may override for custom behavior (but should preserve domain rules).
        """
        # Convert context into a compact text block (kept small intentionally)
        context_block = ""
        if context_messages:
            # Keep only last few turns; context_manager already caps globally
            recent = context_messages[-6:]
            lines = [f"{m.get('role')}: {m.get('content')}" for m in recent]
            context_block = "\n".join(lines).strip()

        prompt = build_prompt(
            assistant_name=f"{self.domain_name.capitalize()} Assistant",
            assistant_domain=self.domain_name,
            domain_rules=self.system_prompt,
            user_query=(f"Context:\n{context_block}\n\nUser:\n{user_message}".strip() if context_block else user_message),
            user_profile=user_profile,
        )
        return self.groq.generate_text(prompt)

    def respond_stream(
        self,
        user_message: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Generator[str, None, None]:
        """
        Stream response tokens.

        Groq SDK/HTTP streaming is optional; to avoid breaking the existing frontend
        streaming UI, we generate a full response then yield it in small chunks.
        """
        text = self.respond(user_message=user_message, context_messages=context_messages, user_profile=user_profile)
        chunk_size = 32
        for i in range(0, len(text), chunk_size):
            yield text[i : i + chunk_size]
