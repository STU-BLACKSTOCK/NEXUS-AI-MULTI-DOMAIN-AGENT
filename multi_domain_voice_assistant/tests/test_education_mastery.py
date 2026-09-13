"""Unit tests for the Education topic mastery service."""

import pytest
from app.assistants.education.mastery_service import (
    calculate_level,
    normalize_topic,
    get_user_topic_mastery,
    record_quiz_attempt,
)


def test_topic_normalization():
    assert normalize_topic("How does photosynthesis work in plants?") == "how does photosynthesis work"
    assert normalize_topic("Binary Search Algorithm!!!") == "binary search algorithm"
    assert normalize_topic("") == "general"


def test_mastery_level_progression():
    # 0 attempts -> beginner
    assert calculate_level(0, 0) == "beginner"
    # 2 attempts, 1 correct -> intermediate
    assert calculate_level(1, 2) == "intermediate"
    # 5 attempts, 4 correct (80%) -> advanced
    assert calculate_level(4, 5) == "advanced"
    # 5 attempts, 2 correct (40%) -> intermediate
    assert calculate_level(2, 5) == "intermediate"


def test_mastery_persistence():
    mastery = get_user_topic_mastery("test_user_edu", "Quantum Physics")
    assert mastery["topic"] == "quantum physics"
    assert mastery["mastery_level"] in {"beginner", "intermediate", "advanced"}
