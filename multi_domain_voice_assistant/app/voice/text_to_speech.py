"""
Text-to-speech module (optional).
Stub implementation: in a full voice pipeline, this would call a local TTS engine (e.g. pyttsx3, Piper).
"""

from typing import Optional


def synthesize(text: str, output_path: Optional[str] = None) -> Optional[bytes]:
    """
    Convert text to speech. Stub: returns None.
    For production: integrate pyttsx3/Piper/etc.; optionally write to output_path or return audio bytes.
    """
    if not text or not text.strip():
        return None
    # Placeholder: real impl would run TTS and return bytes or write to file
    return None
