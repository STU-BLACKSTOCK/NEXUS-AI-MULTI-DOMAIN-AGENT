"""
Finance domain assistant.
Transforms financial inquiries into an analysis engine pipeline:
1. Extraction Pass: Extract raw monetary figures, income, timeframe, and goals into Pydantic model.
2. Deterministic Arithmetic: Pure Python math for savings rates, compound growth, runway, and debt amortization.
3. Qualitative Generation: Groq generates strategic recommendations and risk analysis based on computed numbers.
4. Returns validated structured JSON (FinanceOutput).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.assistants.base_assistant import BaseAssistant
from app.assistants.finance.finance_engine import calculate_finance_metrics
from app.groq.client import GroqClient
from app.intent_router import (
    classify_domain,
    is_conversational_continuation,
    looks_like_finance_query,
)
from app.llm.schemas import (
    FinanceExtraction,
    FinanceOutput,
    FinanceQualitative,
)
from app.llm.structured_output import generate_structured

logger = logging.getLogger(__name__)


def _load_finance_prompt() -> str:
    default = (
        "You are the Finance Assistant. You provide clear, actionable personal finance analysis and education. "
        "You ONLY provide general educational information and analysis regarding budgeting, savings, debt payoff, "
        "interest calculation, and financial planning. You do NOT give personalized legal or tax advice."
    )
    path = Path(__file__).resolve().parent.parent / "prompts" / "finance_prompt.txt"
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return default


class FinanceAssistant(BaseAssistant):
    """
    Finance Analysis Engine Assistant.
    Decouples financial arithmetic from LLM generation.
    """

    def __init__(self, groq: GroqClient) -> None:
        super().__init__(groq)
        self._prompt = _load_finance_prompt()

    @property
    def domain_name(self) -> str:
        return "finance"

    @property
    def system_prompt(self) -> str:
        return self._prompt

    def respond(
        self,
        user_message: str,
        context_messages: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Executes the multi-stage analysis engine pipeline.
        """
        # 1. Domain Guard Check
        if not is_conversational_continuation(user_message or ""):
            domain = classify_domain(user_message or "")
            if domain not in {"finance", "unknown"} and not looks_like_finance_query(user_message or ""):
                # Return standard formatted refusal
                refusal_out = FinanceOutput(
                    summary="I am currently in Finance Assistant mode and can only assist with personal finance topics (budgeting, savings, debt, investments).",
                    metrics=calculate_finance_metrics(FinanceExtraction()),
                    recommendations=["Please switch to Education, Healthcare, or Cooking mode for non-financial questions."],
                    risks=["Cannot answer questions outside personal finance."],
                )
                return json.dumps(refusal_out.model_dump(), ensure_ascii=False)

        # 2. Stage 1: Extraction Pass
        extraction_system_prompt = (
            "You are a financial entity extractor. Extract all numerical and financial parameters from the user's message "
            "(monthly income, savings, interest rates, debt, timeframe, and itemized expenses with amounts and categories). "
            "If a field is not mentioned, leave it as null or default."
        )
        try:
            extracted: FinanceExtraction = generate_structured(
                client=self.groq,
                response_model=FinanceExtraction,
                user_prompt=user_message,
                system_prompt=extraction_system_prompt,
                temperature=0.0,
            )
        except Exception as e:
            logger.warning(f"Finance extraction pass error: {e}. Using empty extraction.")
            extracted = FinanceExtraction()

        # 3. Stage 2: Pure Python Arithmetic Engine
        computed_metrics = calculate_finance_metrics(extracted)

        # 4. Stage 3: Qualitative Generation Pass
        # Pass computed numbers to Groq strictly for strategic synthesis
        metrics_summary_str = json.dumps(computed_metrics.model_dump(exclude_none=True), indent=2)
        qualitative_system_prompt = (
            f"{self.system_prompt}\n\n"
            "Below are the verified mathematical calculations computed deterministically in Python for this user's situation:\n"
            f"```json\n{metrics_summary_str}\n```\n\n"
            "CRITICAL RULES:\n"
            "1. Do NOT recalculate or contradict these numbers.\n"
            "2. Provide an insightful executive summary, actionable recommendations (3-4 points), and risk factors to watch out for."
        )

        user_context_block = ""
        if context_messages:
            recent = context_messages[-4:]
            user_context_block = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in recent]) + "\n\n"

        qualitative_user_prompt = f"{user_context_block}User Query: {user_message}"

        try:
            qualitative: FinanceQualitative = generate_structured(
                client=self.groq,
                response_model=FinanceQualitative,
                user_prompt=qualitative_user_prompt,
                system_prompt=qualitative_system_prompt,
                temperature=0.2,
            )
        except Exception as e:
            logger.error(f"Finance qualitative generation error: {e}")
            qualitative = FinanceQualitative(
                summary="Here is the breakdown of your financial analysis based on the numbers provided.",
                recommendations=["Review your monthly expenses to optimize your savings rate.", "Build an emergency fund of 3-6 months of expenses."],
                risks=["Inflation and unexpected expenses can impact long-term projections."],
            )

        # 5. Assemble Final Structured Output
        final_output = FinanceOutput(
            summary=qualitative.summary,
            metrics=computed_metrics,
            recommendations=qualitative.recommendations,
            risks=qualitative.risks,
        )

        return json.dumps(final_output.model_dump(), ensure_ascii=False)


