"""
Deterministic Healthcare Safety Engine.
Performs hard, rule-based red flag detection on medical queries before and after LLM generation.
This rule engine is non-overridable by the LLM: any detected critical symptoms unconditionally
force an emergency triage banner with urgent care instructions and emergency contacts.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from app.llm.schemas import HealthcareOutput, SafetyBanner

# Curated red-flag emergency symptoms and triggers
RED_FLAG_PATTERNS: List[Tuple[str, str, str]] = [
    # (Regex pattern, Severity, Reason/Message)
    (
        r"\b(chest pain|heart attack|crushing chest|chest pressure|radiating (to |down )?(left arm|jaw)|cardiac arrest)\b",
        "emergency",
        "Possible acute coronary syndrome (heart attack). Immediate emergency medical evaluation required.",
    ),
    (
        r"\b(stroke|facial droop|slurred speech|arm weakness|hemiparesis|sudden numbness|loss of vision)\b",
        "emergency",
        "Possible acute cerebrovascular accident (stroke). Time-critical emergency response (FAST protocol) needed.",
    ),
    (
        r"\b(anaphylaxis|throat (closing|swelling)|severe allergic reaction|tongue swelling|epipen)\b",
        "emergency",
        "Possible life-threatening anaphylactic reaction. Administer epinephrine if available and call emergency services.",
    ),
    (
        r"\b(cannot breathe|can't breathe|suffocating|severe shortness of breath|gasping for air|cyanosis|blue lips)\b",
        "emergency",
        "Severe acute respiratory distress. Immediate airway and oxygen support required.",
    ),
    (
        r"\b(suicid|kill myself|end my life|self harm|want to die|overdose)\b",
        "emergency",
        "Immediate psychiatric crisis support is available 24/7. You are not alone.",
    ),
    (
        r"\b(unresponsive|unconscious|passed out|loss of consciousness|fainted and not waking|seizure lasting|status epilepticus)\b",
        "emergency",
        "Loss of consciousness or prolonged seizure. Immediate emergency care required.",
    ),
    (
        r"\b(coughing up blood|hemoptysis|vomiting blood|severe hemorrhage|uncontrolled bleeding|gushing blood)\b",
        "emergency",
        "Acute internal or severe external hemorrhage.",
    ),
    (
        r"\b(worst headache of (my )?life|thunderclap headache|sudden explosive headache)\b",
        "emergency",
        "Possible subarachnoid hemorrhage. Immediate neurological emergency assessment needed.",
    ),
    (
        r"\b(stiff neck (and|with) (high )?fever|petechial rash with fever)\b",
        "urgent",
        "Possible acute bacterial meningitis. Urgent medical evaluation required.",
    ),
    (
        r"\b(infant|baby|newborn|3[\s-]*months?|weeks? old)\b.*\b(10[1-9]|104|high fever|lethargic|not feeding)\b",
        "emergency",
        "High fever or lethargy in an infant under 3 months is a pediatric medical emergency.",
    ),
]

EMERGENCY_CONTACTS = [
    "US / Canada Emergency: 911",
    "UK Emergency: 999",
    "Europe Emergency: 112",
    "India Emergency: 112 / 108",
    "Suicide & Crisis Lifeline (US/Canada): 988",
    "Crisis Text Line: Text HOME to 741741",
]


def evaluate_safety_flags(
    user_message: str,
    user_profile: Optional[Dict[str, Any]] = None,
) -> SafetyBanner:
    """
    Evaluates natural language query against deterministic safety rules.
    """
    text = (user_message or "").lower()

    # Special check for pediatric fever in profile context
    user_age = user_profile.get("age") if user_profile else None
    if user_age is not None and user_age <= 1:
        if re.search(r"\b(fever|hot|temperature|warm)\b", text):
            return SafetyBanner(
                is_emergency=True,
                severity="emergency",
                banner_message="Pediatric Alert: Any significant fever in an infant requires prompt emergency medical attention.",
                action_required="Contact your pediatrician or visit the nearest pediatric emergency department immediately.",
                emergency_contacts=EMERGENCY_CONTACTS,
            )

    # Check red flag patterns
    for pattern, severity, reason in RED_FLAG_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            is_emerg = severity in {"emergency", "urgent"}
            return SafetyBanner(
                is_emergency=is_emerg,
                severity=severity,  # type: ignore
                banner_message=f"⚠️ URGENT MEDICAL WARNING: {reason}",
                action_required="Seek immediate emergency medical attention or call your local emergency services immediately.",
                emergency_contacts=EMERGENCY_CONTACTS,
            )

    return SafetyBanner(
        is_emergency=False,
        severity="none",
        banner_message=None,
        action_required=None,
        emergency_contacts=[],
    )


def enforce_safety_gate(
    output: HealthcareOutput,
    user_message: str,
    user_profile: Optional[Dict[str, Any]] = None,
) -> HealthcareOutput:
    """
    Post-processing safety gate: ensures deterministic safety rules override LLM output.
    """
    rule_banner = evaluate_safety_flags(user_message, user_profile)

    # If deterministic rule flagged an emergency or urgency, unconditionally enforce it
    if rule_banner.is_emergency or rule_banner.severity in {"emergency", "urgent"}:
        output.safety_banner = rule_banner
        # Ensure 'when_to_see_doctor' contains immediate care callout
        if "Seek immediate emergency medical care" not in output.when_to_see_doctor:
            output.when_to_see_doctor.insert(0, "Seek immediate emergency medical care without delay.")

    return output
