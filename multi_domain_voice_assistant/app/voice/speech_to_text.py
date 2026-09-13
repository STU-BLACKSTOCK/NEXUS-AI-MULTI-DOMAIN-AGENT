"""
Speech-to-text module (optional).
Stub implementation: in a full voice pipeline, this would call a local STT engine (e.g. Vosk, Whisper).
"""

from pathlib import Path
from typing import Optional


def transcribe(audio_path: Optional[str] = None, audio_bytes: Optional[bytes] = None) -> str:
    """
    Transcribe audio to text. Stub: returns placeholder.
    For production: integrate Vosk/Whisper or similar; accept file path or raw bytes.
    """
    if audio_path and Path(audio_path).exists():
        # Placeholder: real impl would load and run STT
        return "[STT not configured: install and configure a local STT engine]"
    if audio_bytes:
        return "[STT not configured: install and configure a local STT engine]"
    return ""
