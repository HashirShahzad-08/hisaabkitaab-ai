"""Simple limits on AI use, kept in memory:
  per user: 8 requests per rolling minute and 20 per rolling day
  everyone together: 150 AI calls per rolling day
(In memory means it resets when the server restarts, and each server instance counts on its own.)
"""
import threading
import time
from collections import deque
from typing import Deque, Dict

from fastapi import Depends

from auth import get_current_uid

PER_MINUTE = 8
PER_DAY = 20
GLOBAL_PER_DAY = 150  # real AI calls, all users together
MINUTE = 60.0
DAY = 24 * 60 * 60.0


class RateLimited(Exception):
    """Turned into HTTP 429 with {"error": "rate_limited"} in main.py."""

    def __init__(self, retry_after: int):
        super().__init__("rate_limited")
        self.retry_after = max(1, int(retry_after))


_lock = threading.Lock()
_calls: Dict[str, Deque[float]] = {}  # uid -> times of that user's recent requests (oldest first)


def check(uid: str, now: float = None) -> None:
    """Counts one request for this user, or raises RateLimited."""
    now = time.time() if now is None else now
    with _lock:
        calls = _calls.setdefault(uid, deque())
        while calls and now - calls[0] >= DAY:  # forget anything older than a day
            calls.popleft()

        if len(calls) >= PER_DAY:
            raise RateLimited(DAY - (now - calls[0]))
        in_last_minute = [t for t in calls if now - t < MINUTE]
        if len(in_last_minute) >= PER_MINUTE:
            raise RateLimited(MINUTE - (now - in_last_minute[0]))

        calls.append(now)

        # Tidy up users who have been quiet for a day so the dictionary does not grow forever.
        if len(_calls) > 5000:
            for key in [k for k, v in _calls.items() if not v or now - v[-1] >= DAY]:
                del _calls[key]


_global_calls: Deque[float] = deque()  # times of recent AI calls, all users


def use_global_call(now: float = None) -> None:
    """Counts one real AI call against the daily total, or raises RateLimited. Called by ai_client,
    so answers made by the rules alone (like the scam fast path) cost nothing."""
    now = time.time() if now is None else now
    with _lock:
        while _global_calls and now - _global_calls[0] >= DAY:
            _global_calls.popleft()
        if len(_global_calls) >= GLOBAL_PER_DAY:
            raise RateLimited(DAY - (now - _global_calls[0]))
        _global_calls.append(now)


def reset() -> None:
    """For tests."""
    with _lock:
        _calls.clear()
        _global_calls.clear()


def limit_ai_requests(uid: str = Depends(get_current_uid)) -> str:
    """FastAPI dependency for the AI routes: checks the login, then the limit. Returns the uid."""
    check(uid)
    return uid
