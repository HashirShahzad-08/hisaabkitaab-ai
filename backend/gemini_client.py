"""Talks to Gemini. Everything about the model lives here."""
import json
import os
from typing import Type, TypeVar

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, ValidationError

load_dotenv()

# Change the model in .env (GEMINI_MODEL) or edit the default below.
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

T = TypeVar("T", bound=BaseModel)

_client = None


class GeminiError(Exception):
    """Raised when Gemini fails or returns something we can't use."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        key = os.getenv("GEMINI_API_KEY")
        if not key or key == "your_key_here":
            raise GeminiError("GEMINI_API_KEY is missing. Add it to backend/.env", 500)
        _client = genai.Client(api_key=key)
    return _client


def ask_gemini(prompt: str, schema: Type[T]) -> T:
    """Send the prompt, get JSON back, validate it with Pydantic."""
    client = _get_client()
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
    except Exception as e:  # network, quota, bad key, etc.
        raise GeminiError(f"Gemini request failed: {e}", 502)

    raw = (response.text or "").strip()
    if not raw:
        raise GeminiError("Gemini returned an empty reply.", 502)

    # Remove ``` fences in case the model adds them anyway.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise GeminiError("Gemini did not return valid JSON.", 502)

    try:
        return schema.model_validate(data)
    except ValidationError as e:
        raise GeminiError(f"Gemini JSON had the wrong shape: {e.errors()}", 502)
