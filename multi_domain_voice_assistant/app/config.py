"""
Application configuration for the Multi-Domain Voice Assistant.

This project uses:
- Groq API for LLM responses.
- MongoDB for user accounts and profiles.
"""

from __future__ import annotations

import os
from typing import List

# Groq settings
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# MongoDB settings
MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "nexusai")

# Auth settings
JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRES_SECONDS: int = int(os.getenv("JWT_EXPIRES_SECONDS", "604800"))  # 7 days

# API settings
API_HOST: str = "0.0.0.0"
API_PORT: int = 8000

# Supported domains (extensible for future assistants)
SUPPORTED_DOMAINS: List[str] = ["education", "finance", "healthcare", "cooking"]

# Default domain when intent cannot be determined
DEFAULT_DOMAIN: str = "education"

# Context settings (fewer messages = faster)
MAX_CONTEXT_MESSAGES: int = 6
