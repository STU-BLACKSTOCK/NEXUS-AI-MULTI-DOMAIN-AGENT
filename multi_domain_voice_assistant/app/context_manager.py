"""
Context manager: maintains conversation history per user and session for LLM context.
Persists conversation history in MongoDB (`chats` collection) and caps messages to the
last N (default 6) messages to preserve tokens while keeping rich context.
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

from app.config import MAX_CONTEXT_MESSAGES
from app.db.mongo import get_db

logger = logging.getLogger(__name__)


class ContextManager:
    """
    MongoDB-backed conversation context per user and session.
    Stores messages as {"role": "user"|"assistant", "content": "...", "timestamp": "..."}.
    Falls back gracefully to in-memory store if MongoDB is unavailable.
    """

    def __init__(self, max_messages: int = MAX_CONTEXT_MESSAGES) -> None:
        self.max_messages = max_messages
        # In-memory fallback: (user_id, session_id) -> list of message dicts
        self._memory_store: Dict[str, List[Dict[str, Any]]] = {}

    def _get_key(self, user_id: Optional[str], session_id: str) -> str:
        uid = user_id or "anonymous"
        sid = session_id or "default"
        return f"{uid}:{sid}"

    def _get_collection(self):
        try:
            db = get_db()
            col = db["chats"]
            col.create_index([("user_id", 1), ("session_id", 1)], unique=True)
            return col
        except Exception as e:
            logger.warning(f"Failed to access MongoDB chats collection: {e}. Using in-memory fallback.")
            return None

    def get_messages(self, session_id: str = "default", user_id: Optional[str] = None) -> List[Dict[str, str]]:
        """Return the last max_messages for this user session (oldest to newest)."""
        key = self._get_key(user_id, session_id)
        col = self._get_collection()

        if col is not None:
            try:
                uid = user_id or "anonymous"
                sid = session_id or "default"
                doc = col.find_one({"user_id": uid, "session_id": sid})
                if doc and "messages" in doc:
                    all_messages = doc["messages"]
                    recent = all_messages[-self.max_messages :] if len(all_messages) > self.max_messages else all_messages
                    # Return list of {role, content}
                    return [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in recent]
            except Exception as e:
                logger.warning(f"Error reading chat history from Mongo for {key}: {e}")

        # In-memory fallback
        messages = self._memory_store.get(key, [])
        recent = messages[-self.max_messages :] if len(messages) > self.max_messages else messages
        return [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in recent]

    def add_user_message(self, session_id: str, content: str, user_id: Optional[str] = None) -> None:
        """Append a user message to the session in Mongo and memory."""
        key = self._get_key(user_id, session_id)
        uid = user_id or "anonymous"
        sid = session_id or "default"
        msg_obj = {
            "role": "user",
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Update in-memory
        if key not in self._memory_store:
            self._memory_store[key] = []
        self._memory_store[key].append(msg_obj)

        # Update MongoDB
        col = self._get_collection()
        if col is not None:
            try:
                now = datetime.utcnow()
                col.update_one(
                    {"user_id": uid, "session_id": sid},
                    {
                        "$push": {"messages": msg_obj},
                        "$set": {"updated_at": now},
                        "$setOnInsert": {"created_at": now},
                    },
                    upsert=True,
                )
            except Exception as e:
                logger.warning(f"Error persisting user message to Mongo: {e}")

    def add_assistant_message(
        self,
        session_id: str,
        content: str,
        user_id: Optional[str] = None,
        domain: Optional[str] = None,
        structured_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Append an assistant response to the session in Mongo and memory."""
        key = self._get_key(user_id, session_id)
        uid = user_id or "anonymous"
        sid = session_id or "default"
        msg_obj: Dict[str, Any] = {
            "role": "assistant",
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if domain:
            msg_obj["domain"] = domain
        if structured_data:
            msg_obj["structured_data"] = structured_data

        # Update in-memory
        if key not in self._memory_store:
            self._memory_store[key] = []
        self._memory_store[key].append(msg_obj)

        # Update MongoDB
        col = self._get_collection()
        if col is not None:
            try:
                now = datetime.utcnow()
                col.update_one(
                    {"user_id": uid, "session_id": sid},
                    {
                        "$push": {"messages": msg_obj},
                        "$set": {"updated_at": now},
                        "$setOnInsert": {"created_at": now},
                    },
                    upsert=True,
                )
            except Exception as e:
                logger.warning(f"Error persisting assistant message to Mongo: {e}")

    def clear(self, session_id: str = "default", user_id: Optional[str] = None) -> None:
        """Clear conversation history for this session."""
        key = self._get_key(user_id, session_id)
        uid = user_id or "anonymous"
        sid = session_id or "default"
        self._memory_store[key] = []

        col = self._get_collection()
        if col is not None:
            try:
                col.delete_one({"user_id": uid, "session_id": sid})
            except Exception as e:
                logger.warning(f"Error clearing chat history in Mongo: {e}")

