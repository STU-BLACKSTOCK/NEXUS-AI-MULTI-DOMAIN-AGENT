"""
Edge TTS (Microsoft) — natural voice output for voice mode.

Does not touch LLM or chat logic; only converts plain text to MP3 bytes.

`edge_tts.Communicate` always XML-escapes its input and wraps it in SSML internally.
Do NOT pass pre-built SSML as `text` — tags would be double-escaped and the service fails (502).
"""

from __future__ import annotations

import re

import edge_tts

VOICE = "en-US-JennyNeural"
RATE = "+5%"
PITCH = "+2Hz"


def _normalize_for_tts(text: str) -> str:
    """Normalize assistant text for speech (no markdown noise)."""
    t = text.strip()
    t = re.sub(r"#{1,6}\s*", "", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"\*([^*]+)\*", r"\1", t)
    t = re.sub(r"\n{2,}", ". ", t)
    t = re.sub(r"\n", " ", t)
    return t.strip()


async def text_to_speech_mp3(text: str) -> bytes:
    """
    Generate MP3 audio bytes via Edge TTS (async).

    Plain text + voice/rate/pitch; edge_tts builds SSML internally.
    """
    if not text or not text.strip():
        return b""

    plain = _normalize_for_tts(text)
    if not plain:
        return b""

    communicate = edge_tts.Communicate(plain, voice=VOICE, rate=RATE, pitch=PITCH)
    out = bytearray()
    async for chunk in communicate.stream():
        if chunk.get("type") == "audio":
            out.extend(chunk["data"])
    return bytes(out)
