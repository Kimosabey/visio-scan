import base64
import json
import uuid
from pathlib import Path

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

SERVICE_SLUG = "visio-scan"
PORT = int(os.getenv("PORT", "8105"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "").rstrip("/")
VISION_MODEL = os.getenv("VISION_MODEL", "llama3.2-vision")
_refs_env = os.getenv("VISIO_REFERENCES_DIR", "").strip()
REFS_ROOT = Path(_refs_env).expanduser() if _refs_env else (
    Path(__file__).resolve().parent.parent / "references"
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

app = FastAPI(
    title="VisioScan",
    description="Vision compare with optional on-disk reference images.",
    version="0.2.0",
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


def _safe_reference_path(label: str) -> Path | None:
    if not label or ".." in label or "/" in label or "\\" in label:
        return None
    name = Path(label.strip()).name
    if not name:
        return None
    REFS_ROOT.mkdir(parents=True, exist_ok=True)
    p = (REFS_ROOT / name).resolve()
    root = REFS_ROOT.resolve()
    try:
        p.relative_to(root)
    except ValueError:
        return None
    return p if p.is_file() else None


def _parse_discrepancies(raw: str | None) -> list[Discrepancy]:
    if not raw:
        return []
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if "```" in text:
            text = text.rsplit("```", 1)[0]
    text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    out: list[Discrepancy] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        det = str(item.get("detail", "")).strip()
        if not det:
            continue
        out.append(
            Discrepancy(
                code=str(item.get("code", "FIND"))[:64],
                severity=str(item.get("severity", "medium"))[:32],
                field=str(item.get("field", "general"))[:128],
                detail=det[:2000],
            )
        )
    return out


async def _ollama_vision(images_b64: list[str], prompt: str) -> str | None:
    if not OLLAMA_BASE_URL or not images_b64:
        return None
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            r = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": prompt,
                    "images": images_b64,
                    "stream": False,
                },
            )
            r.raise_for_status()
            return str(r.json().get("response", "")).strip() or None
    except httpx.HTTPError:
        return None


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_SLUG, "port": PORT, "references_dir": str(REFS_ROOT)}


@app.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze_v1(
    file: UploadFile = File(...),
    reference_label: str | None = Form(None),
) -> AnalyzeResponse:
    request_id = str(uuid.uuid4())
    raw = await file.read()
    ct = file.content_type
    fname = file.filename or "upload.bin"

    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    discrepancies: list[Discrepancy] = []
    vision_notes: str | None = None

    summary = f"Received `{fname}` ({len(raw)} bytes, {ct or 'unknown type'}). "

    if not ct or not str(ct).lower().startswith("image/"):
        summary += (
            "Non-image uploads are accepted for metadata only — "
            "use an image content-type for multimodal compare."
        )
        return AnalyzeResponse(
            request_id=request_id,
            filename=fname,
            content_type=ct,
            summary=summary,
            discrepancies=[],
            vision_notes=None,
        )

    if not OLLAMA_BASE_URL:
        summary += "OLLAMA_BASE_URL is not set; vision analysis is unavailable."
        return AnalyzeResponse(
            request_id=request_id,
            filename=fname,
            content_type=ct,
            summary=summary,
            discrepancies=[],
            vision_notes=None,
        )

    field_b64 = base64.b64encode(raw).decode("ascii")
    images: list[str] = [field_b64]
    ref_path = _safe_reference_path((reference_label or "").strip())
    if ref_path:
        images.append(base64.b64encode(ref_path.read_bytes()).decode("ascii"))
        ref_note = f" Reference file: `{ref_path.name}`."
    else:
        ref_note = (
            f" No matching file under references/ for label `{reference_label or ''}` "
            f"(place images in `{REFS_ROOT}` and pass basename as reference_label)."
        )

    prompt = (
        "You are a field QA assistant. Compare the FIRST image (field capture) "
        + ("to the SECOND image (golden reference). " if len(images) > 1 else "(single image; note limitations). ")
        + "Output ONLY a JSON array (no markdown) of objects with keys: "
        'code (short string), severity ("low"|"medium"|"high"), field (subsystem), '
        "detail (one sentence). Use an empty array [] if no issues."
        f"\nFilename hint: {fname}."
    )

    vision_notes = await _ollama_vision(images, prompt)
    discrepancies = _parse_discrepancies(vision_notes)

    if vision_notes:
        summary = (
            (vision_notes[:600] + ("…" if len(vision_notes) > 600 else ""))
            + ref_note
        )
    else:
        summary += "Vision model returned no text — check VISION_MODEL and GPU resources." + ref_note

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
