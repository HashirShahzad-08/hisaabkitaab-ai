"""The web server. Run with: uvicorn main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from gemini_client import GeminiError, ask_gemini
from models import QuickEntryResult, SmsResult, TextRequest
from prompts import quick_entry_prompt, sms_prompt

app = FastAPI(title="HisaabKitaab AI")

# CORS lets your app (running on another address) call this server.
# Open to everyone for development; restrict this before going live.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(GeminiError)
async def gemini_error_handler(request: Request, exc: GeminiError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse-sms", response_model=SmsResult)
def parse_sms(req: TextRequest):
    return ask_gemini(sms_prompt(req.text, req.lang, req.today), SmsResult)


@app.post("/quick-entry", response_model=QuickEntryResult)
def quick_entry(req: TextRequest):
    return ask_gemini(quick_entry_prompt(req.text, req.lang, req.today), QuickEntryResult)
