"""
Centralized Groq API client.

Responsibilities:
- Single place for Groq calls (generation + basic retries).
- Error handling for API failures, rate limits, and empty responses.
"""

from __future__ import annotations

import time
from typing import Any, Optional

import requests

from app.config import GROQ_API_KEY, GROQ_MODEL


class GroqError(RuntimeError):
    pass


class GroqClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        key = api_key if api_key is not None else GROQ_API_KEY
        if not key:
            raise GroqError("GROQ_API_KEY is not set")
        self.api_key = key
        self.model_name = model or GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def generate_text(
        self,
        prompt: str | None = None,
        *,
        messages: list[dict[str, str]] | None = None,
        system_prompt: str | None = None,
        response_format: dict[str, str] | None = None,
        temperature: float = 0.2,
        max_retries: int = 3,
    ) -> str:
        last_err: Optional[Exception] = None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Build message list
        chat_messages: list[dict[str, str]] = []
        if messages:
            chat_messages = list(messages)
        else:
            if system_prompt:
                chat_messages.append({"role": "system", "content": system_prompt})
            if prompt:
                chat_messages.append({"role": "user", "content": prompt})

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": chat_messages,
            "temperature": temperature,
        }
        if response_format:
            payload["response_format"] = response_format

        for attempt in range(max_retries):
            try:
                resp = requests.post(self.base_url, headers=headers, json=payload, timeout=60)
                if resp.status_code >= 400:
                    raise GroqError(f"Groq API error {resp.status_code}: {resp.text}")

                data = resp.json()
                choices = data.get("choices") or []
                if not choices:
                    raise GroqError("Empty response from Groq")
                msg = choices[0].get("message") or {}
                text = (msg.get("content") or "").strip()
                if not text:
                    raise GroqError("Empty response text from Groq")
                return text
            except Exception as e:
                last_err = e
                sleep_s = min(8, 2**attempt)
                time.sleep(sleep_s)

        raise GroqError(f"Groq API failed after retries: {last_err}")


