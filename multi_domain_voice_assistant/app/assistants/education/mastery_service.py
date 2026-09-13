"""
Per-user Topic Mastery Service.
Persists topic learning progression, attempts, and correct answers in MongoDB (`education_mastery` collection).
Calculates dynamic difficulty level ('beginner' | 'intermediate' | 'advanced') to tailor explanations.
"""

from __future__ import annotations

from datetime import datetime
import logging
import re
from typing import Any, Dict, Literal, Optional


from app.db.mongo import get_db

logger = logging.getLogger(__name__)

MasteryLevel = Literal["beginner", "intermediate", "advanced"]


def normalize_topic(topic: str) -> str:
    """Normalize topic string for consistent mastery indexing."""
    cleaned = re.sub(r"[^\w\s]", "", (topic or "general").lower()).strip()
    words = cleaned.split()[:4]  # Keep first 4 keywords
    return " ".join(words) if words else "general"


def _get_mastery_collection():
    try:
        db = get_db()
        col = db["education_mastery"]
        col.create_index([("user_id", 1), ("topic", 1)], unique=True)
        return col
    except Exception as e:
        logger.warning(f"MongoDB education_mastery access error: {e}")
        return None


def get_user_topic_mastery(user_id: Optional[str], topic: str) -> Dict[str, Any]:
    """Retrieve user's mastery profile for a given topic."""
    norm_topic = normalize_topic(topic)
    uid = user_id or "anonymous"

    col = _get_mastery_collection()
    if col is not None:
        try:
            doc = col.find_one({"user_id": uid, "topic": norm_topic})
            if doc:
                return {
                    "topic": norm_topic,
                    "correct_count": int(doc.get("correct_count", 0)),
                    "attempts": int(doc.get("attempts", 0)),
                    "last_seen": doc.get("last_seen"),
                    "mastery_level": calculate_level(doc.get("correct_count", 0), doc.get("attempts", 0)),
                }
        except Exception as e:
            logger.warning(f"Failed to fetch mastery for {uid}/{norm_topic}: {e}")

    return {
        "topic": norm_topic,
        "correct_count": 0,
        "attempts": 0,
        "last_seen": None,
        "mastery_level": "beginner",
    }


def calculate_level(correct: int, attempts: int) -> MasteryLevel:
    """Computes mastery level based on quiz history and accuracy."""
    if attempts >= 4 and correct >= 3 and (correct / attempts) >= 0.75:
        return "advanced"
    if attempts >= 2 and correct >= 1:
        return "intermediate"
    return "beginner"


def record_quiz_attempt(user_id: Optional[str], topic: str, correct_answers: int, total_questions: int) -> Dict[str, Any]:
    """Updates mastery statistics in MongoDB after a quiz completion."""
    norm_topic = normalize_topic(topic)
    uid = user_id or "anonymous"
    now = datetime.utcnow()

    col = _get_mastery_collection()
    if col is not None:
        try:
            col.update_one(
                {"user_id": uid, "topic": norm_topic},
                {
                    "$inc": {"correct_count": correct_answers, "attempts": total_questions},
                    "$set": {"last_seen": now, "updated_at": now},
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
            )
        except Exception as e:
            logger.warning(f"Failed to record quiz attempt: {e}")

    return get_user_topic_mastery(user_id, topic)
