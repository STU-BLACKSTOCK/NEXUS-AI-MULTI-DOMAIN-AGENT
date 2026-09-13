"""
Structured output module: enforces strict Pydantic validation on Groq LLM responses
with an automated parse-validate-retry loop.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

from app.groq.client import GroqClient, GroqError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def clean_json_string(text: str) -> str:
    """Extract raw JSON text even if wrapped in markdown fences or commentary."""
    text = (text or "").strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    
    # Fallback: find first '{' and last '}'
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1].strip()

    return text


def generate_structured(
    client: GroqClient,
    response_model: Type[T],
    user_prompt: str,
    system_prompt: Optional[str] = None,
    max_validation_retries: int = 2,
    temperature: float = 0.1,
) -> T:
    """
    Generate a validated Pydantic model instance from Groq using JSON mode,
    schema prompting, and a parse-validate-retry loop (re-prompting on failure).
    """
    schema_json = json.dumps(response_model.model_json_schema(), indent=2)
    
    schema_instruction = (
        f"\n\nCRITICAL INSTRUCTION: You MUST return a valid JSON object strictly matching this JSON Schema:\n"
        f"```json\n{schema_json}\n```\n"
        f"Do NOT include explanations outside of the JSON object. Output ONLY valid parseable JSON."
    )

    combined_system_prompt = (system_prompt or "") + schema_instruction

    current_prompt = user_prompt
    last_error: Optional[str] = None

    for attempt in range(max_validation_retries + 1):
        try:
            raw_response = client.generate_text(
                prompt=current_prompt,
                system_prompt=combined_system_prompt,
                response_format={"type": "json_object"},
                temperature=temperature,
            )
            cleaned_json = clean_json_string(raw_response)
            parsed_data = json.loads(cleaned_json)
            validated_model = response_model.model_validate(parsed_data)
            return validated_model

        except (json.JSONDecodeError, ValidationError, GroqError, Exception) as err:
            last_error = str(err)
            logger.warning(
                f"[StructuredOutput] Attempt {attempt + 1}/{max_validation_retries + 1} failed: {last_error}"
            )

            if attempt < max_validation_retries:
                # Re-prompt specifically asking to correct the validation/JSON error
                current_prompt = (
                    f"Original User Request:\n{user_prompt}\n\n"
                    f"Your previous attempt produced an invalid response that failed with this error:\n"
                    f"{last_error}\n\n"
                    f"Please fix the error and output ONLY the corrected JSON object matching the required schema."
                )

    raise ValueError(
        f"Failed to obtain valid structured output for {response_model.__name__} after "
        f"{max_validation_retries + 1} attempts. Last error: {last_error}"
    )
