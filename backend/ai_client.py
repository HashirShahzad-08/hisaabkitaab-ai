"""Talks to the AI. Everything about providers and models lives here.

Both Groq and Z.ai speak the "OpenAI-compatible" API, so we use the openai library for both.

Order of attempts for every request:
  1. Groq (primary)            try, and if it fails try once more
  2. Z.ai GLM (optional backup) only if ZAI_API_KEY is set; same: try, then try once more
If everything fails we raise AIError, and main.py turns it into a clear JSON error.

Settings come from backend/.env (see .env.example):
  GROQ_API_KEY, GROQ_MODEL, ZAI_API_KEY, ZAI_MODEL
"""
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import List, Optional, Type, TypeVar

import openai
from dotenv import load_dotenv

import config
import rate_limit
from openai import OpenAI
from pydantic import BaseModel, ValidationError

load_dotenv()

# Shows in the same terminal as uvicorn
log = logging.getLogger("uvicorn.error")


def _safe(error: Exception) -> str:
    """Error text for the logs. In production only the kind of error and its HTTP status,
    because provider messages can contain account details and our own replies can contain user text."""
    if config.PRODUCTION:
        return f"{type(error).__name__} status={getattr(error, 'status_code', None)}"
    return repr(error)

T = TypeVar("T", bound=BaseModel)

TOTAL_BUDGET_SECONDS = 20  # for one answer, across all retries and providers
REQUEST_TIMEOUT_SECONDS = 12  # one attempt, so a stuck provider leaves time for the backup
MIN_ATTEMPT_SECONDS = 1.0
TEMPERATURE = 0  # 0 = the same answer every time for the same message
RETRY_PAUSE_SECONDS = 1.0

SYSTEM_MESSAGE = "You reply with one JSON object only. Do not use emojis."


class AIError(Exception):
    """Raised when no provider could give us a usable answer."""

    # code is a short label the app can use:
    #   ai_key (no key set), ai_permission (bad key / not allowed), ai_quota (rate limit),
    #   ai_failed (server or network problem), bad_json, bad_shape
    def __init__(self, message: str, status_code: int = 502, code: str = "ai_failed"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


@dataclass
class Provider:
    name: str
    api_key: str
    base_url: str
    model: str
    json_mode: bool = True  # switched off automatically if the provider rejects it
    extra_body: dict = field(default_factory=dict)
    _client: Optional[OpenAI] = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            # max_retries=0: we do our own retrying so we can log every attempt
            self._client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=REQUEST_TIMEOUT_SECONDS,
                max_retries=0,
            )
        return self._client


_providers: Optional[List[Provider]] = None


def get_providers() -> List[Provider]:
    """Builds the provider list from .env (once). The fallback is skipped if it has no key."""
    global _providers
    if _providers is not None:
        return _providers

    result: List[Provider] = []

    groq_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if groq_key:
        model = (os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b").strip()
        extra = {}
        if "gpt-oss" in model:
            # gpt-oss thinks before answering. "low" keeps it fast and cheap for simple extraction.
            extra = {"reasoning_effort": "low"}
        result.append(
            Provider(
                name="groq",
                api_key=groq_key,
                base_url=(os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").strip(),
                model=model,
                extra_body=extra,
            )
        )

    zai_key = (os.getenv("ZAI_API_KEY") or "").strip()
    if zai_key and not config.looks_like_real_key(zai_key):
        log.warning("ZAI_API_KEY looks like placeholder text, so the Z.ai backup is switched off.")
        zai_key = ""
    if zai_key:
        result.append(
            Provider(
                name="zai",
                api_key=zai_key,
                base_url=(os.getenv("ZAI_BASE_URL") or "https://api.z.ai/api/paas/v4").strip(),
                model=(os.getenv("ZAI_MODEL") or "glm-4.5-flash").strip(),
                # GLM thinks by default. Turn that off so answers are quick and clean.
                extra_body={"thinking": {"type": "disabled"}},
            )
        )

    _providers = result
    return result


def extract_json(raw: str) -> dict:
    """Finds the JSON object in the model's reply, even if it added code fences or extra words."""
    text = (raw or "").strip()
    if not text:
        raise ValueError("empty reply")

    # Remove ```json ... ``` fences
    fence = re.match(r"^```[a-zA-Z]*\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Take the first complete {...} block
        start = text.find("{")
        if start == -1:
            raise ValueError("no JSON object found")
        data, _ = json.JSONDecoder().raw_decode(text[start:])

    if not isinstance(data, dict):
        raise ValueError("JSON is not an object")
    return data


def _chat(provider: Provider, prompt: str, deadline: float) -> str:
    """One request to one provider. Returns the text of the reply."""

    def client():
        left = max(MIN_ATTEMPT_SECONDS, deadline - time.time())
        return provider.client.with_options(timeout=min(REQUEST_TIMEOUT_SECONDS, left))

    kwargs = dict(
        model=provider.model,
        messages=[
            {"role": "system", "content": SYSTEM_MESSAGE},
            {"role": "user", "content": prompt},
        ],
        temperature=TEMPERATURE,
        max_tokens=4000,  # room for the answer (reasoning models also count their thinking here)
    )
    if provider.extra_body:
        kwargs["extra_body"] = provider.extra_body

    if provider.json_mode:
        try:
            response = client().chat.completions.create(
                response_format={"type": "json_object"}, **kwargs
            )
            return response.choices[0].message.content or ""
        except openai.BadRequestError as e:
            # The provider or model does not accept JSON mode: remember, and parse tolerantly instead.
            log.warning(
                "%s/%s rejected JSON mode, switching to tolerant parsing: %s",
                provider.name, provider.model, _safe(e),
            )
            provider.json_mode = False

    response = client().chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def _retry_after_seconds(error: Exception) -> float:
    """How long Groq says to wait after a rate limit (from the header or the message)."""
    try:
        header = error.response.headers.get("retry-after")
        if header:
            return min(float(header) + 0.5, 15.0)
    except Exception:  # noqa: BLE001
        pass
    m = re.search(r"try again in ([\d.]+)\s*(ms|s)", str(error))
    if m:
        seconds = float(m.group(1)) / (1000 if m.group(2) == "ms" else 1)
        return min(seconds + 0.5, 15.0)
    return 3.0


def _classify(error: Exception) -> tuple:
    """Returns (code, retry_is_useful) for an error."""
    if isinstance(error, (openai.AuthenticationError, openai.PermissionDeniedError)):
        return "ai_permission", False  # wrong key or not allowed: trying again will not help
    if isinstance(error, openai.RateLimitError):
        return "ai_quota", True
    if isinstance(error, (openai.APITimeoutError, openai.APIConnectionError, openai.InternalServerError)):
        return "ai_failed", True
    if isinstance(error, openai.APIStatusError):
        return "ai_failed", False  # other 4xx: our request is the problem
    if isinstance(error, ValidationError):
        return "bad_shape", True
    if isinstance(error, ValueError):  # from extract_json
        return "bad_json", True
    return "ai_failed", True


def ask_ai(prompt: str, schema: Type[T]) -> T:
    """Sends the prompt, reads the JSON reply, and validates it with Pydantic."""
    providers = get_providers()
    if not providers:
        log.error("No AI provider is configured. Set GROQ_API_KEY in backend/.env")
        raise AIError("No AI key is set. Add GROQ_API_KEY to backend/.env", 500, "ai_key")

    rate_limit.use_global_call()  # raises RateLimited (HTTP 429) when today's total is used up
    deadline = time.time() + TOTAL_BUDGET_SECONDS

    last_code = "ai_failed"
    last_message = "The AI request failed."
    first_failure = None  # (code, message) of the first provider that failed: the one the user cares about

    for provider in providers:
        for attempt in (1, 2):  # try, then one retry
            started = time.time()
            if deadline - started < MIN_ATTEMPT_SECONDS:
                log.error("AI time budget of %ss used up", TOTAL_BUDGET_SECONDS)
                break
            try:
                raw = _chat(provider, prompt, deadline)
                data = extract_json(raw)
                result = schema.model_validate(data)
                log.info(
                    "AI answered: provider=%s model=%s attempt=%d time=%.1fs",
                    provider.name, provider.model, attempt, time.time() - started,
                )
                return result
            except Exception as e:  # noqa: BLE001 - we log everything and decide below
                code, can_retry = _classify(e)
                last_code, last_message = code, f"{provider.name} ({provider.model}): {_safe(e) if config.PRODUCTION else e}"
                if first_failure is None:
                    first_failure = (last_code, last_message)
                log.error(
                    "AI FAILED: provider=%s model=%s attempt=%d code=%s error=%r",
                    provider.name, provider.model, attempt, code, _safe(e),
                )
                if attempt == 1 and can_retry:
                    pause = _retry_after_seconds(e) if code == "ai_quota" else RETRY_PAUSE_SECONDS
                    if time.time() + pause + MIN_ATTEMPT_SECONDS >= deadline:
                        break  # no time to wait: try the next provider with what is left
                    log.info("retrying %s in %.1fs", provider.name, pause)
                    time.sleep(pause)
                    continue
                break  # next provider (if any)

    if first_failure:  # e.g. Groq is out of quota but the backup key is wrong: say "busy", not "not set up"
        last_code, last_message = first_failure
    http_status = 503 if last_code in ("ai_permission", "ai_quota") else 502
    raise AIError("AI request failed" if config.PRODUCTION else f"AI request failed: {last_message}", http_status, last_code)
