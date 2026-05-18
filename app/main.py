import base64
import os
import uuid
from pathlib import Path

import httpx
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

SERVICE_SLUG = "visio-scan"
PORT = int(os.getenv("PORT", "8105"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "").rstrip("/")
VISION_MODEL = os.getenv("VISION_MODEL", "llama3.2-vision")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

app = FastAPI(
    title="VisioScan",
    description="Multimodal / vision RAG (scaffold).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Discrepancy(BaseModel):
    code: str
    severity: str
    field: str
    detail: str


class AnalyzeResponse(BaseModel):
    request_id: str
    filename: str
    content_type: str | None
    summary: str
    discrepancies: list[Discrepancy]
    vision_notes: str | None = None
    disclaimer: str = (
        "Vision output is indicative; verify against calibrated references and procedures."
    )


async def _ollama_vision(prompt: str, b64_png: str) -> str | None:
    if not OLLAMA_BASE_URL:
        return None
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            r = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": prompt,
                    "images": [b64_png],
                    "stream": False,
                },
            )
            r.raise_for_status()
            return str(r.json().get("response", "")).strip() or None
    except httpx.HTTPError:
        return None


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_SLUG, "port": PORT}


@app.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze_v1(
    file: UploadFile = File(...),
    reference_label: str | None = Form(None),
) -> AnalyzeResponse:
    request_id = str(uuid.uuid4())
    raw = await file.read()
    ct = file.content_type
    fname = file.filename or "upload.bin"

    summary = (
        f"Received `{fname}` ({len(raw)} bytes, {ct or 'unknown type'}). "
        "Stub compare against reference vault — wire your golden templates here."
    )
    discrepancies = [
        Discrepancy(
            code="GAP-01",
            severity="medium",
            field="nameplate",
            detail="OCR confidence borderline vs expected model string (stub).",
        ),
        Discrepancy(
            code="GAP-02",
            severity="low",
            field="cable dressing",
            detail="Deviation from reference photo angle; manual confirm.",
        ),
    ]
    vision_notes: str | None = None

    if OLLAMA_BASE_URL and ct and ct.startswith("image/"):
        b64 = base64.b64encode(raw).decode("ascii")
        pref = (reference_label or "reference SOP figure A-12").strip()
        prompt = (
            "You compare a field photo to a stated reference. "
            "List up to 3 short discrepancy bullets as plain lines. "
            f"Reference label: {pref}."
        )
        vision_notes = await _ollama_vision(prompt, b64)
        if vision_notes:
            summary = vision_notes[:500] + ("…" if len(vision_notes) > 500 else "")

    return AnalyzeResponse(
        request_id=request_id,
        filename=fname,
        content_type=ct,
        summary=summary,
        discrepancies=discrepancies,
        vision_notes=vision_notes,
    )


if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="spa")
else:

    @app.get("/")
    def root() -> dict:
        return {
            "service": SERVICE_SLUG,
            "docs": "/docs",
            "health": "/health",
            "ui": "(dev: Vite :5173 → proxy :8105)",
        }
