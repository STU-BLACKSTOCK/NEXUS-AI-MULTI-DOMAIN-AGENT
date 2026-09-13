"""
FastAPI application entry point.

Supports explicit assistant modes:
- education
- finance
- integrated

The backend enforces the requested mode and does not override it.
"""

from __future__ import annotations

import json
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.orchestrator import Orchestrator, AssistantMode
from app.auth.routes import router as auth_router, require_current_user_profile, get_current_user_profile
from app.tts.routes import router as tts_router


app = FastAPI(
    title="Multi-Domain Voice Assistant API",
    description="Specialized conversational AI network with central orchestrator and domain assistants.",
    version="1.1.0",
)

# Allow frontend (different port) to call this API (CORS preflight OPTIONS + POST)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",  # Vite default port when 8080 is in use
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Single orchestrator instance (stateless except in-memory context)
_orchestrator: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """Lazy-initialize and return the orchestrator."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator


# --- Request/Response models ---


class ChatRequest(BaseModel):
    """Request body for /chat."""
    message: str
    session_id: Optional[str] = "default"
    mode: AssistantMode = Field(default="education")


class ChatResponse(BaseModel):
    """Response body for /chat."""
    response: str
    domain: str
    assistant: str
    error: Optional[str] = None


class ClearRequest(BaseModel):
    """Request body for /clear (optional)."""
    session_id: Optional[str] = "default"


# --- Endpoints ---


@app.get("/")
def root() -> dict:
    """Health and info."""
    return {
        "service": "NexusAI Multi-Domain Voice Assistant API",
        "status": "running",
        "endpoints": ["/chat", "/chat/stream", "/tts", "/health", "/clear", "/education/quiz-submit", "/education/mastery", "/auth/register", "/auth/login", "/auth/me"],
        "modes": ["education", "finance", "healthcare", "cooking", "integrated"],
    }


@app.get("/health")
def health() -> dict:
    """Health check; reports Groq availability."""
    try:
        _ = get_orchestrator()
        return {"status": "ok", "groq_configured": True}
    except Exception:
        return {"status": "ok", "groq_configured": False}


app.include_router(auth_router)
app.include_router(tts_router)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, profile=Depends(require_current_user_profile)) -> ChatResponse:
    """
    Send a user message; orchestrator routes to the appropriate domain assistant
    and returns the response with domain and assistant name.
    """
    if not (req.message or "").strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    orch = get_orchestrator()
    result = orch.chat(
        user_message=req.message.strip(),
        mode=req.mode,
        session_id=req.session_id or "default",
        user_profile=profile.model_dump() if profile else None,
    )

    if result.get("error"):
        raise HTTPException(status_code=502, detail=result["error"])

    return ChatResponse(
        response=result["response"],
        domain=result["domain"],
        assistant=result["assistant"],
    )


@app.post("/chat/stream")
def chat_stream(req: ChatRequest, profile=Depends(require_current_user_profile)) -> StreamingResponse:
    """
    Stream chat response token-by-token (NDJSON: one JSON object per line).
    Lines: {"token": "..."} then {"done": true, "response": "...", "domain": "...", "assistant": "..."}.
    On error: {"error": "..."}.
    """

    if not (req.message or "").strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    def generate() -> str:
        orch = get_orchestrator()
        for chunk in orch.chat_stream(
            user_message=req.message.strip(),
            mode=req.mode,
            session_id=req.session_id or "default",
            user_profile=profile.model_dump() if profile else None,
        ):
            yield json.dumps(chunk, ensure_ascii=False) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/clear")

def clear_session(req: ClearRequest, profile=Depends(get_current_user_profile)) -> dict:
    """Clear conversation context for the given session."""
    user_id = profile.user_id if profile else None
    get_orchestrator().clear_session(session_id=req.session_id or "default", user_id=user_id)
    return {"status": "cleared", "session_id": req.session_id or "default"}


from app.assistants.education.mastery_service import record_quiz_attempt, get_user_topic_mastery


class QuizSubmitRequest(BaseModel):
    topic: str
    correct_count: int
    total_questions: int


@app.post("/education/quiz-submit")
def submit_quiz(req: QuizSubmitRequest, profile=Depends(get_current_user_profile)) -> dict:
    """Submit quiz results to update per-user mastery statistics."""
    user_id = profile.user_id if profile else None
    updated_mastery = record_quiz_attempt(
        user_id=user_id,
        topic=req.topic,
        correct_answers=req.correct_count,
        total_questions=req.total_questions,
    )
    return {"status": "recorded", "mastery": updated_mastery}


@app.get("/education/mastery")
def get_mastery(topic: str, profile=Depends(get_current_user_profile)) -> dict:
    """Fetch user's current mastery level on a topic."""
    user_id = profile.user_id if profile else None
    return get_user_topic_mastery(user_id=user_id, topic=topic)


