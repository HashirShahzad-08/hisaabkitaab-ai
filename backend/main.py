"""The web server. Run with: uvicorn main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import pipeline
from ai_client import AIError
from models import QuickEntryResult, SmsResult, TextRequest

app = FastAPI(title="HisaabKitaab AI")

# CORS lets your app (running on another address) call this server.
# Open to everyone for development; restrict this before going live.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AIError)
async def ai_error_handler(request: Request, exc: AIError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message, "code": exc.code})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse-sms", response_model=SmsResult)
def parse_sms(req: TextRequest):
    return pipeline.parse_sms(req.text, req.lang, req.today)


@app.post("/quick-entry", response_model=QuickEntryResult)
def quick_entry(req: TextRequest):
    return pipeline.quick_entry(req.text, req.lang, req.today)
