"""
Central orchestrator: mode-aware routing, context handling, and integrated collaboration.

Modes:
- education: only EducationAssistant answers; finance questions are rejected by domain guard.
- finance: only FinanceAssistant answers; education questions are rejected by domain guard.
- integrated: orchestrator uses classify_domain to choose between assistants and can chain assistants.
"""

from __future__ import annotations

from typing import Any, Dict, Generator, Optional, Literal

from app.assistants.base_assistant import BaseAssistant
from app.assistants.education_assistant import EducationAssistant
from app.assistants.finance_assistant import FinanceAssistant
from app.assistants.healthcare_assistant import HealthcareAssistant
from app.assistants.cooking_assistant import CookingAssistant
from app.config import DEFAULT_DOMAIN
from app.context_manager import ContextManager
from app.intent_router import classify_domain
from app.groq.client import GroqClient

AssistantMode = Literal["education", "finance", "healthcare", "cooking", "integrated"]


class Orchestrator:
    """
    Orchestrates user queries:
    - Mode-based routing (education / finance / integrated)
    - Domain classification
    - Context handling
    - Optional cross-assistant collaboration in integrated mode
    """

    def __init__(
        self,
        groq: Optional[GroqClient] = None,
        context_manager: Optional[ContextManager] = None,
    ) -> None:
        self.groq = groq or GroqClient()
        self.context = context_manager or ContextManager()
        self._assistants: Dict[str, BaseAssistant] = {
            "education": EducationAssistant(self.groq),
            "finance": FinanceAssistant(self.groq),
            "healthcare": HealthcareAssistant(self.groq),
            "cooking": CookingAssistant(self.groq),
        }

    def _get_assistant(self, domain: str) -> BaseAssistant:
        """Resolve domain to assistant; fallback to default domain if unknown."""
        if domain in self._assistants:
            return self._assistants[domain]
        return self._assistants.get(DEFAULT_DOMAIN) or self._assistants["education"]

    def handle_query(
        self,
        user_message: str,
        mode: AssistantMode,
        session_id: str = "default",
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Mode-aware query handler (non-streaming).
        """
        user_message = (user_message or "").strip()
        if not user_message:
            return {
                "response": "",
                "domain": DEFAULT_DOMAIN,
                "assistant": "System",
                "error": "Empty message",
            }

        user_id = user_profile.get("user_id") if user_profile else None
        context_messages = self.context.get_messages(session_id=session_id, user_id=user_id)

        if mode == "education":
            assistant = self._get_assistant("education")
            response_text = assistant.respond(
                user_message=user_message,
                context_messages=context_messages or None,
                user_profile=user_profile,
            )
            domain = "education"
            assistant_name = "Education Assistant"

        elif mode == "finance":
            assistant = self._get_assistant("finance")
            response_text = assistant.respond(
                user_message=user_message,
                context_messages=context_messages or None,
                user_profile=user_profile,
            )
            domain = "finance"
            assistant_name = "Finance Assistant"

        elif mode == "healthcare":
            assistant = self._get_assistant("healthcare")
            response_text = assistant.respond(
                user_message=user_message,
                context_messages=context_messages or None,
                user_profile=user_profile,
            )
            domain = "healthcare"
            assistant_name = "Healthcare Assistant"

        elif mode == "cooking":
            assistant = self._get_assistant("cooking")
            response_text = assistant.respond(
                user_message=user_message,
                context_messages=context_messages or None,
                user_profile=user_profile,
            )
            domain = "cooking"
            assistant_name = "Cooking Assistant"

        else:  # integrated
            domain = classify_domain(user_message)
            if domain == "unknown":
                # Fallback to default domain when classifier remains uncertain.
                domain = DEFAULT_DOMAIN
                default_assistant = self._get_assistant(domain)
                response_text = default_assistant.respond(
                    user_message=user_message,
                    context_messages=context_messages or None,
                    user_profile=user_profile,
                )
                assistant_name = "Education Assistant" if domain == "education" else f"{domain.capitalize()} Assistant"
            elif domain == "education":
                edu = self._get_assistant("education")
                response_text = edu.respond(
                    user_message=user_message,
                    context_messages=context_messages or None,
                    user_profile=user_profile,
                )
                assistant_name = "Education Assistant"
            elif domain == "finance":
                fin = self._get_assistant("finance")
                finance_response = fin.respond(
                    user_message=user_message,
                    context_messages=context_messages or None,
                    user_profile=user_profile,
                )

                lowered = user_message.lower()
                if "don't understand" in lowered or "do not understand" in lowered:
                    edu = self._get_assistant("education")
                    edu_response = edu.respond(
                        user_message=f"Explain the concept needed for: {user_message}",
                        context_messages=context_messages or None,
                        user_profile=user_profile,
                    )
                    response_text = f"{edu_response}\n\nNow applying it to finance:\n\n{finance_response}"
                    assistant_name = "Integrated (Education + Finance)"
                else:
                    response_text = finance_response
                    assistant_name = "Finance Assistant"
            elif domain == "healthcare":
                hc = self._get_assistant("healthcare")
                response_text = hc.respond(
                    user_message=user_message,
                    context_messages=context_messages or None,
                    user_profile=user_profile,
                )
                assistant_name = "Healthcare Assistant"
            else:  # cooking
                ck = self._get_assistant("cooking")
                response_text = ck.respond(
                    user_message=user_message,
                    context_messages=context_messages or None,
                    user_profile=user_profile,
                )
                assistant_name = "Cooking Assistant"

        self.context.add_user_message(session_id=session_id, content=user_message, user_id=user_id)
        self.context.add_assistant_message(session_id=session_id, content=response_text, user_id=user_id, domain=domain)

        return {
            "response": response_text,
            "domain": domain,
            "assistant": assistant_name,
        }

    def chat(
        self,
        user_message: str,
        mode: AssistantMode,
        session_id: str = "default",
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Non-streaming chat."""
        return self.handle_query(user_message=user_message, mode=mode, session_id=session_id, user_profile=user_profile)

    def chat_stream(
        self,
        user_message: str,
        mode: AssistantMode,
        session_id: str = "default",
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Streaming response. For maintainability, we stream the selected assistant's tokens.
        For integrated chaining (combined response), we fall back to a single final payload.
        """
        user_id = user_profile.get("user_id") if user_profile else None
        # Chaining case: produce a non-streamed combined response.
        if mode == "integrated":
            lowered = (user_message or "").lower()
            if "don't understand" in lowered or "do not understand" in lowered:
                result = self.handle_query(user_message=user_message, mode=mode, session_id=session_id, user_profile=user_profile)
                yield {"done": True, "response": result["response"], "domain": result["domain"], "assistant": result["assistant"]}
                return

        # Otherwise stream the chosen assistant.
        if mode == "education":
            domain = "education"
        elif mode == "finance":
            domain = "finance"
        elif mode == "healthcare":
            domain = "healthcare"
        elif mode == "cooking":
            domain = "cooking"
        else:
            domain = classify_domain(user_message)
            if domain == "unknown":
                domain = DEFAULT_DOMAIN

        assistant = self._get_assistant(domain)
        context_messages = self.context.get_messages(session_id=session_id, user_id=user_id)

        try:
            full_response: list[str] = []
            for token in assistant.respond_stream(
                user_message=user_message,
                context_messages=context_messages or None,
                user_profile=user_profile,
            ):
                full_response.append(token)
                yield {"token": token}
            response_text = "".join(full_response)
        except Exception as e:
            yield {"error": str(e), "domain": domain, "assistant": assistant.domain_name}
            return

        self.context.add_user_message(session_id=session_id, content=(user_message or "").strip(), user_id=user_id)
        self.context.add_assistant_message(session_id=session_id, content=response_text, user_id=user_id, domain=domain)
        assistant_label = (
            "Education Assistant"
            if domain == "education"
            else "Finance Assistant"
            if domain == "finance"
            else "Healthcare Assistant"
            if domain == "healthcare"
            else "Cooking Assistant"
        )
        yield {
            "done": True,
            "response": response_text,
            "domain": domain,
            "assistant": assistant_label,
        }

    def clear_session(self, session_id: str = "default", user_id: Optional[str] = None) -> None:
        """Clear conversation context for the given session."""
        self.context.clear(session_id=session_id, user_id=user_id)

