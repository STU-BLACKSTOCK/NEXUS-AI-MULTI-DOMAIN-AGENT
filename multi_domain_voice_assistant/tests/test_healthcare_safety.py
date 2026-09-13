"""Unit tests for the Healthcare deterministic safety rules engine."""

import pytest
from app.llm.schemas import HealthcareOutput, SafetyBanner
from app.assistants.healthcare.safety_rules import evaluate_safety_flags, enforce_safety_gate


def test_cardiac_emergency_detection():
    msg = "I have sudden crushing chest pain radiating to my left arm and jaw."
    banner = evaluate_safety_flags(msg)
    assert banner.is_emergency is True
    assert banner.severity == "emergency"
    assert "heart attack" in banner.banner_message.lower() or "acute coronary" in banner.banner_message.lower()
    assert len(banner.emergency_contacts) > 0


def test_stroke_fast_protocol_detection():
    msg = "My spouse has sudden facial drooping and slurred speech."
    banner = evaluate_safety_flags(msg)
    assert banner.is_emergency is True
    assert "stroke" in banner.banner_message.lower()


def test_pediatric_fever_context_detection():
    msg = "The baby has a high fever of 103 and is very warm."
    banner = evaluate_safety_flags(msg, user_profile={"age": 0})
    assert banner.is_emergency is True
    assert "pediatric" in banner.banner_message.lower() or "infant" in banner.banner_message.lower()


def test_non_emergency_wellness():
    msg = "What are the common symptoms of seasonal allergies and how do I prevent sneezing?"
    banner = evaluate_safety_flags(msg)
    assert banner.is_emergency is False
    assert banner.severity == "none"


def test_unoverridable_safety_gate():
    # Simulate an LLM attempting to produce a non-emergency output for a critical symptom
    fake_llm_output = HealthcareOutput(
        safety_banner=SafetyBanner(is_emergency=False, severity="none"),
        topic_or_symptoms="Chest pain",
        general_guidance_markdown="You might just be stressed, try resting.",
        precautions=["Drink water"],
        when_to_see_doctor=["Next week"],
    )
    user_query = "I have severe crushing chest pain and shortness of breath"

    gated_output = enforce_safety_gate(fake_llm_output, user_query)
    # Verify Python gate overrode the LLM's safety_banner
    assert gated_output.safety_banner.is_emergency is True
    assert gated_output.safety_banner.severity == "emergency"
    assert "immediate emergency medical care" in gated_output.when_to_see_doctor[0].lower()
