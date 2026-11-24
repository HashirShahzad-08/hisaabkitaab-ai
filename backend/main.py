"""The web server. Run with: uvicorn main:app --reload"""
import logging

import config

config.check_startup()  # stops here with a clear message if GROQ_API_KEY or FIREBASE_PROJECT_ID is missing

from fastapi import Depends, FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

import pipeline  # noqa: E402
from ai_client import AIError  # noqa: E402
from auth import Unauthorized  # noqa: E402
from models import AffordRequest, AffordResult, BillRequest, BillResult, QuickEntryResult, SmsResult, TextRequest  # noqa: E402
from rate_limit import RateLimited, limit_ai_requests  # noqa: E402

log = logging.getLogger("uvicorn.error")

# In production the API documentation pages are switched off.
docs = {"docs_url": None, "redoc_url": None, "openapi_url": None} if config.PRODUCTION else {}
app = FastAPI(title="HisaabKitaab AI", **docs)

# CORS only matters for browsers. The Android app does not need it.
# Development: open to everyone. Production: only the websites listed in ALLOWED_ORIGINS (none is fine).
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS if config.PRODUCTION else ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Unauthorized)
async def unauthorized_handler(request: Request, exc: Unauthorized):
    return JSONResponse(status_code=401, content={"error": "unauthorized"}, headers={"WWW-Authenticate": "Bearer"})


@app.exception_handler(RateLimited)
async def rate_limited_handler(request: Request, exc: RateLimited):
    return JSONResponse(status_code=429, content={"error": "rate_limited"}, headers={"Retry-After": str(exc.retry_after)})


@app.exception_handler(AIError)
async def ai_error_handler(request: Request, exc: AIError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message, "code": exc.code})


@app.get("/health")
def health():
    return {"status": "ok"}  # public: no login needed


@app.post("/parse-sms", response_model=SmsResult)
def parse_sms(req: TextRequest, uid: str = Depends(limit_ai_requests)):
    log.info("route=/parse-sms text_length=%d", len(req.text))  # never the text itself
    return pipeline.parse_sms(req.text, req.lang, req.today)


@app.post("/quick-entry", response_model=QuickEntryResult)
def quick_entry(req: TextRequest, uid: str = Depends(limit_ai_requests)):
    log.info("route=/quick-entry text_length=%d", len(req.text))
    return pipeline.quick_entry(req.text, req.lang, req.today)


@app.post("/analyze-bill", response_model=BillResult)
def analyze_bill(req: BillRequest, uid: str = Depends(limit_ai_requests)):
    log.info("route=/analyze-bill")  # no bill details in the logs
    return pipeline.analyze_bill(req)


@app.post("/afford", response_model=AffordResult)
def afford(req: AffordRequest, uid: str = Depends(limit_ai_requests)):
    log.info("route=/afford")  # the item name and the money details are never logged
    return pipeline.afford(req)
