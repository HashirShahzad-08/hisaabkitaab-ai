"""Settings read from the environment (backend/.env). Nothing secret is printed here.

  ENV               "production" (default). Only ENV=development switches on development mode
  FIREBASE_PROJECT_ID   your Firebase project id, used to check login tokens
  ALLOWED_ORIGINS   comma-separated list of websites allowed to call the API from a browser.
                    Empty is fine: the Android app does not need CORS.
  GROQ_API_KEY      the AI key (read in ai_client.py)
"""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

# Safe by default: anything other than "development" (including nothing) is production
ENV = "development" if (os.getenv("ENV") or "").strip().lower() == "development" else "production"
PRODUCTION = ENV == "production"

FIREBASE_PROJECT_ID = (os.getenv("FIREBASE_PROJECT_ID") or "").strip()

ALLOWED_ORIGINS = [o.strip() for o in (os.getenv("ALLOWED_ORIGINS") or "").split(",") if o.strip()]


def looks_like_real_key(value: str) -> bool:
    """False for placeholder text such as "paste your key here". Real keys are one long word."""
    value = (value or "").strip()
    return len(value) >= 20 and " " not in value


def check_startup() -> None:
    """Stops the server at startup, with one clear message, if a required setting is missing."""
    for name in ("GROQ_API_KEY", "FIREBASE_PROJECT_ID"):
        if not (os.getenv(name) or "").strip():
            sys.exit(f"STARTUP ERROR: {name} is missing. Add it to backend/.env and start the server again.")
    if not looks_like_real_key(os.getenv("GROQ_API_KEY")):  # the key itself is never printed
        sys.exit("STARTUP ERROR: GROQ_API_KEY looks like placeholder text, not a real key "
                 "(real keys have no spaces and start with gsk_). Paste your key from "
                 "console.groq.com/keys into backend/.env, then restart the server.")
