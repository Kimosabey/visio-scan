# VisioScan — smoke tests

**Prerequisites:** Ollama vision model; optional file in `references/` matching `reference_label` basename.

| Step | Expected |
|------|----------|
| `GET /health` | `references_dir` path |
| `POST /v1/analyze` multipart image | No hard-coded `GAP-01`; discrepancies from parsed JSON or `[]` |
| Non-image upload | `200`; `discrepancies: []` |
| No `OLLAMA_BASE_URL` | Summary states vision unavailable |
