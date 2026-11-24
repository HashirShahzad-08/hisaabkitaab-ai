"""Login check. Every AI route needs a valid Firebase ID token in the header:

    Authorization: Bearer <token>

The token is verified with Google's public keys. No service account file and no firebase-admin needed:
we only need to know the project id (FIREBASE_PROJECT_ID). The token itself is never logged.
"""
import threading
import time
from typing import Optional

import google.auth.transport.requests
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.oauth2 import id_token

import config


class Unauthorized(Exception):
    """Turned into HTTP 401 with {"error": "unauthorized"} in main.py."""


class _CachedRequest(google.auth.transport.requests.Request):
    """One shared Request that remembers Google's public keys for an hour.
    Without this, every API call would download the keys again."""

    CACHE_SECONDS = 3600
    FORCE_REFRESH_EVERY = 60  # a bad token can ask for a fresh download at most once a minute

    def __init__(self):
        super().__init__()
        self._lock = threading.Lock()
        self._cached = {}  # url -> (time, response)
        self._last_forced = 0.0

    def force_refresh_allowed(self) -> bool:
        with self._lock:
            now = time.time()
            if now - self._last_forced >= self.FORCE_REFRESH_EVERY:
                self._last_forced = now
                self._cached.clear()
                return True
            return False

    def __call__(self, url, method="GET", body=None, headers=None, timeout=120, **kwargs):
        is_certs = method == "GET" and url == id_token._GOOGLE_APIS_CERTS_URL
        if is_certs:
            with self._lock:
                hit = self._cached.get(url)
                if hit and time.time() - hit[0] < self.CACHE_SECONDS:
                    return hit[1]
        response = super().__call__(url, method=method, body=body, headers=headers, timeout=timeout, **kwargs)
        if is_certs and getattr(response, "status", None) == 200:
            with self._lock:
                self._cached[url] = (time.time(), response)
        return response


_REQUEST = _CachedRequest()  # created once, reused for every call
_bearer = HTTPBearer(auto_error=False)  # we send our own 401 below


def verify_token(token: str) -> str:
    """Returns the Firebase user id (uid) for a valid token. Raises Unauthorized otherwise."""
    project = config.FIREBASE_PROJECT_ID
    try:
        try:
            claims = id_token.verify_firebase_token(token, _REQUEST, audience=project)
        except ValueError:
            # Maybe Google rotated its keys. Download them again (rate limited) and try once more.
            if not _REQUEST.force_refresh_allowed():
                raise
            claims = id_token.verify_firebase_token(token, _REQUEST, audience=project)
    except Exception:  # bad signature, expired, wrong project, not a token, no network ...
        raise Unauthorized()  # nothing about the token is logged

    if claims.get("iss") != f"https://securetoken.google.com/{project}":
        raise Unauthorized()
    uid = claims.get("sub")
    if not uid or not isinstance(uid, str):
        raise Unauthorized()
    return uid


def get_current_uid(credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> str:
    """FastAPI dependency: the uid of the logged-in user, or 401."""
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials.strip():
        raise Unauthorized()
    return verify_token(credentials.credentials.strip())
