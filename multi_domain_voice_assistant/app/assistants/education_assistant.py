"""
Education domain assistant.
Transforms academic queries into a Personalized & Visual Learning Pipeline:
1. Topic Mastery Tracking: Retrieves user's topic progress from MongoDB to adapt pedagogical depth.
2. Structured Diagram Generation: Emits node/edge specifications for client-side rendering (Mermaid/SVG).
3. Formative Assessment: Generates a 2-3 question check-for-understanding quiz with instant feedback.
4. Returns validated EducationOutput JSON.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.assistants.base_assistant import BaseAssistant
from app.assistants.education.mastery_service import get_user_topic_mastery
from app.groq.client import GroqClient
from app.intent_router import classify_domain, is_conversational_continuation
from app.llm.schemas import DiagramNode, DiagramEdge, DiagramSpec, EducationOutput, QuizQuestion
from app.llm.structured_output import generate_structured

logger = logging.getLogger(__name__)


def _load_education_prompt() -> str:
    default = (
        "You are the Master Education Assistant. You provide intuitive, rigorous, and engaging explanations "
        "across computer science, mathematics, natural sciences, history, and engineering. "
        "You tailor your explanation depth strictly to the student's mastery level: "
        "- Beginner: Core concepts, relatable real-world analogies, simplified mechanics. "
        "- Intermediate: Deep dive into mechanisms, trade-offs, and practical implementations. "
        "- Advanced: Rigorous theoretical foundations, mathematical formalisms, edge cases, and architectural nuances.\n\n"
        "Whenever a topic involves a process, cycle, decision flow, algorithm, or comparison, you MUST provide a structured diagram "
        "with well-connected nodes and descriptive edges. Never emit raw mermaid code; emit the structured diagram object."
    )
    path = Path(__file__).resolve().parent.parent / "prompts" / "education_prompt.txt"
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return default


class EducationAssistant(BaseAssistant):
    def __init__(self, groq: GroqClient) -> None:
        super().__init__(groq)
        self._prompt = _load_education_prompt()

    @property
    def domain_name(self) -> str:
        return "education"

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
            if domain not in {"education", "unknown"}:
                refusal_out = EducationOutput(
                    topic="Education Mode Active",
                    difficulty_level="beginner",
                    explanation_markdown="I am currently in Education Assistant mode and specialize in academic subjects (science, math, programming, algorithms, etc.).",
                    key_takeaways=["Please switch to Finance, Healthcare, or Cooking mode for non-academic questions."],
                    diagram=None,
                    quiz=[],
                )
                return json.dumps(refusal_out.model_dump(), ensure_ascii=False)

        user_id = user_profile.get("user_id") if user_profile else None
        
        # 2. Stage 1: Topic Mastery Lookup
        # Extract likely topic or use query
        mastery = get_user_topic_mastery(user_id=user_id, topic=user_message)
        mastery_level = mastery.get("mastery_level", "beginner")

        # 3. Stage 2: Dynamic System Prompt Calibration
        calibrated_system_prompt = (
            f"{self.system_prompt}\n\n"
            f"STUDENT PROFILE:\n"
            f"- Topic History: {mastery.get('correct_count', 0)} correct out of {mastery.get('attempts', 0)} attempts\n"
            f"- Assigned Difficulty Level: {mastery_level.upper()}\n\n"
            "INSTRUCTIONS:\n"
            f"1. Tailor your explanation markdown specifically for a {mastery_level.upper()} learner.\n"
            "2. If the topic involves a sequence, lifecycle, flow, comparison, or algorithm, include a clean `diagram` spec.\n"
            "3. Include a 2-3 question formative assessment `quiz` to test comprehension with unambiguous single correct answers and full explanations."
        )

        user_context_block = ""
        if context_messages:
            recent = context_messages[-4:]
            user_context_block = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in recent]) + "\n\n"

        user_prompt = f"{user_context_block}Question / Topic: {user_message}"

        try:
            output: EducationOutput = generate_structured(
                client=self.groq,
                response_model=EducationOutput,
                user_prompt=user_prompt,
                system_prompt=calibrated_system_prompt,
                temperature=0.2,
            )
        except Exception as e:
            logger.error(f"Education structured generation error: {e}")
            output = EducationOutput(
                topic=user_message[:40],
                difficulty_level=mastery_level,
                explanation_markdown=f"Here is an explanation of **{user_message}** tailored to your learning goals.",
                key_takeaways=["Key concept breakdown", "Core principles and applications"],
                diagram=None,
                quiz=[
                    QuizQuestion(
                        question=f"What is the central concept in {user_message[:30]}?",
                        options=["Core mechanism", "Secondary effect", "Unrelated factor"],
                        correct_index=0,
                        explanation="The central concept forms the foundation of this topic.",
                    )
                ],
            )

        return json.dumps(output.model_dump(), ensure_ascii=False)

