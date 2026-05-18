# VisioScan

**Vision / multimodal** — upload an **image** (or exported **PDF** page as an image workflow) via **multipart** `POST /v1/analyze`. The API returns a **summary**, **discrepancy** rows (stub), and optional **`vision_notes`** when **`OLLAMA_BASE_URL`** is set and `content-type` is `image/*` (calls Ollama **`/api/generate`** with **base64 image** and `VISION_MODEL`). The **web** UI shows **reference** placeholder panel, **field** preview, and analysis + discrepancy list.

| | |
|--|--|
| **GitHub** | [Kimosabey/visio-scan](https://github.com/Kimosabey/visio-scan) |
| **Clone** | `git clone git@github.com:Kimosabey/visio-scan.git` |
| **Default API port** | `8105` |
| **Stack** | FastAPI · **python-multipart** · httpx · **web:** Vite · React 19 · TS · Tailwind 4 · TanStack Query · RHF · Zod · Sonner · Lucide |
| **Roadmap** | [docs/PLAN.md](docs/PLAN.md) |
| **UI / UX** | [docs/UI.md](docs/UI.md) |

---

## Repository layout

```
visio-scan/
├── app/main.py              # multipart /v1/analyze, optional vision LLM
├── web/
│   ├── src/pages/UploadPage.tsx
│   └── README.md
├── docs/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Features

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `POST` | `/v1/analyze` | `multipart/form-data`: **`file`** (required), **`reference_label`** (optional). Returns `request_id`, `filename`, `content_type`, `summary`, `discrepancies[]` (`code`, `severity`, `field`, `detail`), optional `vision_notes`, `disclaimer` |

Non-image uploads still return stub structured output; vision path is for `image/*`.

### Web UI

- File picker (`accept` includes images + `.pdf` — PDF analysis may require server-side rasterization in a later phase).
- Optional reference label for the vision prompt.
- Side-by-side **reference stub** vs **field preview** (object URL).
- Results: summary, vision panel, discrepancies.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Default `8105` |
| `OLLAMA_BASE_URL` | Optional Ollama |
| `VISION_MODEL` | Default e.g. `llama3.2-vision` |
| `CORS_ORIGINS` | Comma-separated allowed origins |

**Web:** `VITE_API_BASE` — optional.

See [.env.example](.env.example).

---

## Run locally

From the **repository root** (folder that contains `app/`), not inside `app/`.

**Windows:** `.\run-dev.ps1` or `run-dev.bat`.

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8105

cd web && npm install && npm run dev
```

Vite proxies to **8105**.

---

## Docker

```bash
docker compose up --build
```

---

## `web/` scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + bundle |
| `npm run preview` | Preview |
| `npm run lint` | ESLint |

---

## Ollama vision

Ensure your model is pulled on the Ollama host (e.g. `llama3.2-vision`). The API sends JSON `{ "model", "prompt", "images": [base64], "stream": false }` to `/api/generate`.

---

## License

Proprietary — Graylinx / SelfAware® unless otherwise stated.
