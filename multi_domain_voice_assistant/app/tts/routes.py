"""
TTS HTTP API — optional layer for voice mode (Edge TTS → MP3).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.tts.edge_service import text_to_speech_mp3

router = APIRouter(tags=["tts"])


class TtsRequest(BaseModel):
    """Body for POST /tts."""

    text: str = Field(..., min_length=1, max_length=8000)


@router.post("/tts")
async def synthesize_speech(req: TtsRequest) -> Response:
    """
    Convert assistant text to MP3 using Microsoft Edge TTS (Jenny neural voice).

    Returns raw MP3 bytes (audio/mpeg). Same logical file reused client-side as a blob.
    """
    try:
        audio = await text_to_speech_mp3(req.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS generation failed: {e}") from e

    if not audio:
        raise HTTPException(status_code=502, detail="TTS returned empty audio")

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="response.mp3"',
            "Cache-Control": "no-store",
        },
    )
