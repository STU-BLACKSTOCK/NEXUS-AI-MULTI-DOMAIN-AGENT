"""
Intent routing and domain classification utilities.

This module provides:
- classify_domain(query): returns "education", "finance", or "unknown"
- IntentRouter: thin wrapper around the classifier for legacy use

The classifier is reusable across assistants and the orchestrator.
"""

from __future__ import annotations

import re
from typing import List, Literal

import requests

from app.config import SUPPORTED_DOMAINS, DEFAULT_DOMAIN, GROQ_API_KEY, GROQ_MODEL

Domain = Literal["education", "finance", "healthcare", "cooking", "unknown"]


EDUCATION_KEYWORDS: List[str] = [
    "photosynthesis",
    "biology",
    "respiration",
    "cellular respiration",
    "aerobic respiration",
    "anaerobic respiration",
    "mitochondria",
    "chlorophyll",
    "ecosystem",
    "physics",
    "science",
    "math",
    "mathematics",
    "algebra",
    "calculus",
    "geometry",
    "chemistry",
    "algorithm",
    "data structure",
    "recursion",
    "programming",
    "code",
    "computer science",
    "cs",
    "exam",
    "homework",
    "lecture",
    "university",
    "college",
    "subject",
    "topic",
]

FINANCE_KEYWORDS: List[str] = [
    "investment",
    "invest",
    "investing",
    "portfolio",
    "sip",
    "systematic investment plan",
    "mutual fund",
    "mutual funds",
    "loan",
    "home loan",
    "personal loan",
    "emi",
    "equated monthly instalment",
    "budget",
    "budgeting",
    "expense",
    "spending",
    "saving",
    "savings",
    "interest",
    "simple interest",
    "compound interest",
    "tax",
    "income tax",
    "gst",
    "credit card",
    "debit card",
    "bank",
    "banking",
    "account",
    "insurance",
    "life insurance",
    "health insurance",
    "pf",
    "pension",
    "retirement",
    "net worth",
]

HEALTHCARE_KEYWORDS: List[str] = [
    "symptom",
    "symptoms",
    "fever",
    "cough",
    "cold",
    "headache",
    "pain",
    "medicine",
    "medication",
    "tablet",
    "dose",
    "doctor",
    "clinic",
    "hospital",
    "diagnosis",
    "treatment",
    "health",
    "healthcare",
    "infection",
    "allergy",
    "bp",
    "blood pressure",
    "sugar",
    "diabetes",
]

COOKING_KEYWORDS: List[str] = [
    "recipe",
    "cook",
    "cooking",
    "bake",
    "baking",
    "ingredients",
    "kitchen",
    "oven",
    "pan",
    "boil",
    "fry",
    "grill",
    "roast",
    "saute",
    "marinate",
    "spices",
    "salt",
    "sugar",
    "flour",
]

# Short same-session replies (guided recipe / tutoring flow) — not new topics.
_CONTINUATION_TOKENS = frozenset(
    {
        "yes",
        "yeah",
        "yep",
        "yup",
        "no",
        "nah",
        "nope",
        "ok",
        "okay",
        "sure",
        "ready",
        "next",
        "continue",
        "continued",
        "go",
        "start",
        "begin",
        "done",
        "finished",
        "stop",
        "wait",
        "hold",
        "mm",
        "mhm",
        "hmm",
        "please",
        "thanks",
        "thank",
        "cheers",
        "what",
        "then",
        "now",
        "more",
        "and",
        "so",
        "well",
        "right",
        "correct",
        "exactly",
        "proceed",
        "skip",
        "back",
        "again",
        "repeat",
        "slow",
        "slower",
        "great",
        "nice",
        "good",
        "cool",
        "perfect",
        "awesome",
        "ahead",
        "yess",
    }
)

_FILLER_TOKENS = frozenset(
    {
        "the",
        "a",
        "an",
        "to",
        "for",
        "it",
        "is",
        "im",
        "i",
        "we",
        "you",
        "step",
        "me",
        "do",
        "did",
        "am",
        "are",
        "was",
        "were",
        "be",
        "been",
        "on",
        "in",
        "at",
        "of",
        "or",
        "if",
        "up",
        "out",
        "my",
        "your",
        "there",
        "lets",
        "dont",
    }
)


def is_conversational_continuation(text: str) -> bool:
    """
    True when the message is almost certainly a follow-up in the same conversation
    (e.g. recipe steps: "yes", "ready", "done next"), not a new cross-domain question.

    Skips strict domain guards so classifiers/LLM cannot mislabel short replies.
    """
    raw = (text or "").strip().lower()
    if not raw or len(raw) > 48:
        return False
    raw = raw.strip(" \t\n\r.,!?;:'\"")
    words: List[str] = []
    for token in raw.split():
        w = re.sub(r"[^a-z0-9]", "", token)
        if w:
            words.append(w)
    if not words or len(words) > 8:
        return False
    if not all(w in _CONTINUATION_TOKENS | _FILLER_TOKENS for w in words):
        return False
    return any(w in _CONTINUATION_TOKENS for w in words)


def _score_keywords(text: str, keywords: List[str]) -> int:
    """Simple keyword count scoring."""
    score = 0
    for kw in keywords:
        # For single-word keywords, use word boundaries to avoid false positives
        # such as "emi" matching inside "anemia".
        if " " in kw:
            if kw in text:
                score += 1
        else:
            if re.search(rf"\b{re.escape(kw)}\b", text):
                score += 1
    return score


def _classify_with_llm(query: str) -> Domain:
    """
    LLM fallback classifier (Groq), used only when keyword classifier returns unknown.

    Constraints:
    - Very small output budget (max_tokens=5)
    - Deterministic sampling (temperature=0)
    - No context/profile, only the raw query
    """
    if not GROQ_API_KEY:
        return "unknown"

    prompt = (
        "Classify the following query into ONE word only from:\n"
        "education, finance, healthcare, cooking.\n\n"
        "Rules:\n"
        "- education -> science, academic concepts, explanations, engineering topics\n"
        "- finance -> money, banking, investment, tax\n"
        "- healthcare -> health, disease, symptoms, medicine\n"
        "- cooking -> food, recipes, preparation\n\n"
        f"Query: {query}\n\n"
        "Answer ONLY one word."
    )

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
                "max_tokens": 5,
            },
            timeout=20,
        )
        if resp.status_code >= 400:
            return "unknown"

        data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            return "unknown"

        content = ((choices[0].get("message") or {}).get("content") or "").strip().lower()
        token = content.split()[0] if content else ""
        token = token.strip(".,:;!?'\"")
        if token in {"education", "finance", "healthcare", "cooking"}:
            return token  # type: ignore[return-value]
        return "unknown"
    except Exception:
        return "unknown"


_ACADEMIC_INTENT_HINTS = (
    "what is",
    "what are",
    "explain",
    "define",
    "meaning of",
    "difference between",
    "how does",
    "how do",
)


_FINANCE_CONCEPT_HINTS = (
    "inflation",
    "cagr",
    "apr",
    "roi",
    "fd",
    "rd",
    "credit score",
    "debt",
    "asset",
    "liability",
    "cash flow",
    "expense ratio",
    "stock market",
)

_HEALTHCARE_CONCEPT_HINTS = (
    "disease",
    "condition",
    "disorder",
    "syndrome",
    "vitamin",
    "deficiency",
    "immunity",
    "metabolism",
    "nutrition",
    "bmi",
    "cholesterol",
    "hemoglobin",
    "anemia",
)


def looks_like_finance_query(query: str) -> bool:
    """
    Soft finance detector for strict Finance mode guards.

    Used when classify_domain mislabels short/ambiguous finance-learning queries.
    """
    text = (query or "").strip().lower()
    if not text:
        return False
    if _score_keywords(text, FINANCE_KEYWORDS) > 0:
        return True
    if any(h in text for h in _ACADEMIC_INTENT_HINTS) and any(
        h in text for h in _FINANCE_CONCEPT_HINTS
    ):
        # Ensure there is no stronger cross-domain signal.
        if _score_keywords(text, EDUCATION_KEYWORDS) == 0 and _score_keywords(
            text, HEALTHCARE_KEYWORDS
        ) == 0 and _score_keywords(text, COOKING_KEYWORDS) == 0:
            return True
    return False


def looks_like_healthcare_query(query: str) -> bool:
    """
    Soft healthcare detector for strict Healthcare mode guards.

    Used when classify_domain mislabels short/ambiguous health-learning queries.
    """
    text = (query or "").strip().lower()
    if not text:
        return False
    if _score_keywords(text, HEALTHCARE_KEYWORDS) > 0:
        return True
    if any(h in text for h in _ACADEMIC_INTENT_HINTS) and any(
        h in text for h in _HEALTHCARE_CONCEPT_HINTS
    ):
        # Ensure there is no stronger cross-domain signal.
        if _score_keywords(text, EDUCATION_KEYWORDS) == 0 and _score_keywords(
            text, FINANCE_KEYWORDS
        ) == 0 and _score_keywords(text, COOKING_KEYWORDS) == 0:
            return True
    return False


def _academic_fallback_guard(query: str, llm_domain: Domain) -> Domain:
    """
    Prevent false cross-domain refusals for academic-style queries.

    When keyword scoring is empty and LLM predicts a non-education domain,
    keep it as unknown if the phrasing looks like concept-learning and there
    are no strong competing domain keywords.
    """
    text = (query or "").strip().lower()
    if llm_domain in {"unknown", "education"}:
        return llm_domain

    if any(h in text for h in _ACADEMIC_INTENT_HINTS):
        fin_score = _score_keywords(text, FINANCE_KEYWORDS)
        health_score = _score_keywords(text, HEALTHCARE_KEYWORDS)
        cook_score = _score_keywords(text, COOKING_KEYWORDS)
        # No clear non-education evidence -> avoid hard cross-domain label.
        if fin_score == 0 and health_score == 0 and cook_score == 0:
            return "unknown"
    return llm_domain


def classify_domain(query: str) -> Domain:
    """
    Classify a query into a domain.

    Returns:
        "education" | "finance" | "unknown"

    Uses simple keyword-based scoring for now.
    """
    if not query or not query.strip():
        return "unknown"

    text = query.lower().strip()

    edu_score = _score_keywords(text, EDUCATION_KEYWORDS)
    fin_score = _score_keywords(text, FINANCE_KEYWORDS)
    health_score = _score_keywords(text, HEALTHCARE_KEYWORDS)
    cook_score = _score_keywords(text, COOKING_KEYWORDS)

    if edu_score == 0 and fin_score == 0 and health_score == 0 and cook_score == 0:
        llm_domain = _classify_with_llm(query)
        return _academic_fallback_guard(query, llm_domain)

    scores = {
        "education": edu_score,
        "finance": fin_score,
        "healthcare": health_score,
        "cooking": cook_score,
    }
    best = max(scores, key=scores.get)  # type: ignore[arg-type]
    if scores[best] <= 0:
        return _classify_with_llm(query)

    # Tie-breaker: prefer DEFAULT_DOMAIN if supported
    # If DEFAULT_DOMAIN is among tied best, return it; else return best.
    tied = [d for d, s in scores.items() if s == scores[best]]
    if len(tied) > 1 and DEFAULT_DOMAIN in tied:
        return DEFAULT_DOMAIN  # type: ignore[return-value]
    return best  # type: ignore[return-value]


class IntentRouter:
    """
    Legacy intent router wrapper.

    For new code, prefer using classify_domain() directly.
    """

    def __init__(self, supported_domains: List[str] | None = None) -> None:
        self.supported = supported_domains or SUPPORTED_DOMAINS

    def route(self, query: str) -> str:
        """
        Determine the best domain for the given user query.

        Returns a domain string that exists in supported_domains; falls back to DEFAULT_DOMAIN.
        """
        domain: Domain = classify_domain(query)
        if domain in self.supported:
            return domain  # type: ignore[return-value]
        return DEFAULT_DOMAIN
