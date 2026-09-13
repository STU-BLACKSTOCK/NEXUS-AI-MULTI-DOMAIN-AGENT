"""
Healthcare domain assistant.
Transforms health inquiries into a Safety-First Clinical & Wellness Pipeline:
1. Deterministic Safety Gate (Pre-Check): Scans for life-threatening / urgent red flags before LLM.
2. Structured Generation: Emits general guidance, possible causes, timeline_or_schedule (DiagramSpec), precautions.
3. Deterministic Safety Gate (Post-Check): Enforces unoverridable emergency banner gating.
4. Returns validated HealthcareOutput JSON.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.assistants.base_assistant import BaseAssistant
from app.assistants.healthcare.safety_rules import enforce_safety_gate, evaluate_safety_flags
from app.groq.client import GroqClient
from app.intent_router import classify_domain, is_conversational_continuation, looks_like_healthcare_query
from app.llm.schemas import HealthcareOutput, SafetyBanner
from app.llm.structured_output import generate_structured

logger = logging.getLogger(__name__)


def _load_healthcare_prompt() -> str:
    default = (
        "You are the Healthcare and Wellness Assistant. You provide clear, evidence-based, compassionate health information, "
        "symptom progression education, lifestyle wellness, and safety guidance. "
        "You do NOT provide definitive diagnoses or replace a qualified medical professional. "
        "Whenever explaining symptom progressions over days or medication timing schedules, provide a structured `timeline_or_schedule` diagram spec. "
        "Emphasize when a patient must seek urgent in-person medical evaluation."
    )
    path = Path(__file__).resolve().parent.parent / "prompts" / "healthcare_prompt.txt"
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return default


class HealthcareAssistant(BaseAssistant):
    def __init__(self, groq: GroqClient) -> None:
        super().__init__(groq)
        self._prompt = _load_healthcare_prompt()

    @property
    def domain_name(self) -> str:
        return "healthcare"

    @property
    def system_prompt(self) -> str:
        return self._prompt

    def respond(
        self,
        user_message: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        # 1. Domain Isolation Check
        if not is_conversational_continuation(user_message or ""):
            domain = classify_domain(user_message or "")
            if domain != "healthcare" and not looks_like_healthcare_query(user_message or ""):
                refusal_out = HealthcareOutput(
                    safety_banner=SafetyBanner(),
                    topic_or_symptoms="Healthcare Mode Active",
                    general_guidance_markdown="I am currently in Healthcare Assistant mode and can only answer health, wellness, and symptom-related questions.",
                    precautions=["Please switch to Education, Finance, or Cooking mode for non-health inquiries."],
                    when_to_see_doctor=[],
                )
                return json.dumps(refusal_out.model_dump(), ensure_ascii=False)

        # 2. Stage 1: Pre-LLM Deterministic Red-Flag Safety Evaluation
        pre_safety = evaluate_safety_flags(user_message, user_profile)

        # 3. Stage 2: Contextual Prompt Preparation with User Profile
        age_context = ""
        if user_profile and user_profile.get("age"):
            age = user_profile["age"]
            if age <= 2:
                age_context = f"PATIENT CONTEXT: Infant/Toddler (Age {age}). Note pediatric vulnerabilities."
            elif age <= 12:
                age_context = f"PATIENT CONTEXT: Child (Age {age}). Note pediatric dosing/guidelines."
            elif age >= 65:
                age_context = f"PATIENT CONTEXT: Senior/Geriatric (Age {age}). Note interactions and fall/fragility risks."
            else:
                age_context = f"PATIENT CONTEXT: Adult (Age {age})."

        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"{age_context}\n\n"
            "INSTRUCTIONS:\n"
            "1. If this involves symptom progression (e.g. cold/flu days 1-7) or dosage schedules, include a structured `timeline_or_schedule` (DiagramSpec).\n"
            "2. Provide evidence-based precautions and clear criteria for when to see a doctor.\n"
            "3. If any critical symptoms are present, reflect high urgency in the response."
        )

        user_context_block = ""
        if context_messages:
            recent = context_messages[-4:]
            user_context_block = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in recent]) + "\n\n"

        user_prompt = f"{user_context_block}Patient Inquiry: {user_message}"

        # 4. Stage 3: Structured Generation
        try:
            output: HealthcareOutput = generate_structured(
                client=self.groq,
                response_model=HealthcareOutput,
                user_prompt=user_prompt,
                system_prompt=system_instruction,
                temperature=0.2,
            )
        except Exception as e:
            logger.error(f"Healthcare structured generation error: {e}")
            output = HealthcareOutput(
                safety_banner=pre_safety,
                topic_or_symptoms=user_message[:40],
                general_guidance_markdown=f"Regarding **{user_message}**: General supportive care and monitoring are recommended.",
                possible_causes_or_context=["Underlying viral or inflammatory condition", "Environmental or lifestyle factors"],
                precautions=["Stay well-hydrated", "Rest adequately", "Monitor symptoms closely"],
                when_to_see_doctor=["If symptoms worsen, persist beyond a few days, or if high fever/shortness of breath develops."],
            )

        # 5. Stage 4: Post-LLM Hard Safety Gate
        # Unconditionally enforce deterministic rules over LLM output
        final_output = enforce_safety_gate(output, user_message, user_profile)

        return json.dumps(final_output.model_dump(), ensure_ascii=False)


