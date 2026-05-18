# VisioScan

Multimodal RAG — field images (and PDF exports) vs reference workflow; optional **Ollama vision** when `OLLAMA_BASE_URL` is set.

**GitHub:** [Kimosabey/visio-scan](https://github.com/Kimosabey/visio-scan)

```bash
git clone git@github.com:Kimosabey/visio-scan.git
```

Uses your existing `~/.ssh/config` for GitHub.

| | |
|--|--|
| **API port** | `8105` (override with `PORT`) |
| **OpenAPI** | `/docs` |
| **Roadmap** | [docs/PLAN.md](docs/PLAN.md) |
| **UI rules** | [docs/UI.md](docs/UI.md) |

## API

- `GET /health`
- `POST /v1/analyze` — `multipart/form-data`: `file` (required), optional `reference_label`; returns summary, discrepancy list, optional `vision_notes`

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Default `8105` |
| `OLLAMA_BASE_URL` | Optional vision + generate |
| `VISION_MODEL` | e.g. `llama3.2-vision` |
| `CORS_ORIGINS` | Comma-separated allowed origins |

See [.env.example](.env.example).

### Local (API only)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8105
```

## Web UI (`web/`)

Upload, reference vs field compare layout, analysis + discrepancies. Dev proxy → **8105**.

```bash
cd web
npm install
npm run dev
```

[web/README.md](web/README.md)

## Docker

```bash
docker compose up --build
```

- [http://localhost:8105](http://localhost:8105), [http://localhost:8105/health](http://localhost:8105/health), [http://localhost:8105/docs](http://localhost:8105/docs)
