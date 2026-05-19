# VisioScan — smoke tests

**Prerequisites:** Ollama vision model; optional file in `references/` matching `reference_label` basename.

| Step | Expected |
|------|----------|
| `GET /health` | `references_dir` path |
| `POST /v1/analyze` multipart image | No hard-coded `GAP-01`; discrepancies from parsed JSON or `[]` |
| Non-image upload | `200`; `discrepancies: []` |
| No `OLLAMA_BASE_URL` | Summary states vision unavailable |
| **Library list (new)** `GET $BASE/v1/library` | `200`; `items` lists images in `VISIO_REFERENCES_DIR` |
| Library limit clamp | `?limit=99999` | `200`; effective `limit=1000` |
| **Index upload (new)** `POST $BASE/v1/index` with `file=@./golden.png` | `200`; returns `{ name, bytes, path }`; file appears in `/v1/library` |
| Index bad ext | upload `file=@./report.pdf` | `400 Only image files: …` |
| Index path-escape | `name=../evil.png` | `400` (rejected — basename only) |
| **Library file (new)** `GET $BASE/v1/library/file/<name>` | `200`; correct content-type; missing → `404` |

```bash
BASE=http://127.0.0.1:8105
curl -sS "$BASE/v1/library" | jq '.count, .items[0].name'
curl -X POST "$BASE/v1/index" -F 'file=@./golden.png' -F 'name=panel-nameplate.png'
curl -X POST "$BASE/v1/analyze" -F 'file=@./field.jpg' -F 'reference_label=panel-nameplate.png'
```

---

## Unicharm E2E scenario (vision model)

> Suite-level guide: [docs/E2E_TESTING.md](../../docs/E2E_TESTING.md)

```bash
BASE=http://127.0.0.1:8105
```

**Vision model:** `llama3.2-vision` on `http://100.125.103.28:11434`

### Step 1 — Index a reference image

Pick any clear PNG or JPEG from your PC (nameplate photo, wiring diagram, panel view).

```bash
curl -X POST $BASE/v1/index \
  -F "file=@./your-reference.png" \
  -F "name=ch-nameplate.png"
# → {"name":"ch-nameplate.png","bytes":...,"path":"...references/ch-nameplate.png"}
```

Suggested reference names matching the UI presets:
- `ch-nameplate.png` → "Chiller nameplate" preset
- `condenser-pump-seal.png` → "Condenser pump seal" preset
- `ct-basin.png` → "Cooling tower basin" preset
- `em-wiring.png` → "Energy meter wiring" preset
- `btm-panel.png` → "BTM panel layout" preset
- `pv-coupling.png` → "Primary pump coupling" preset

### Step 2 — Verify library

```bash
curl $BASE/v1/library
# {"count":1,"items":[{"name":"ch-nameplate.png","size":...,"url":"/v1/library/file/ch-nameplate.png"}]}
```

```bash
curl -o /tmp/fetched.png $BASE/v1/library/file/ch-nameplate.png
# file download succeeds
```

### Step 3 — Analyze a field capture

| ID | Test | Expected |
|----|------|----------|
| E2E-VS1 | Upload field photo + reference | `discrepancies` array from vision model; `vision_notes` field populated |
| E2E-VS2 | Upload field photo only (no reference label) | Analysis runs on single image; note in narrative |
| E2E-VS3 | Non-image upload (PDF, .txt) | `200`; `discrepancies: []`; summary says "Non-image" |
| E2E-VS4 | Path-traversal in name | `name=../escape.png` → stored safely as `escape.png` inside references/ |

```bash
# Full vision compare
curl -X POST $BASE/v1/analyze \
  -F "file=@./field-photo.jpg" \
  -F "reference_label=ch-nameplate.png"
```

Expected response shape:
```json
{
  "request_id": "...",
  "summary": "...",
  "vision_notes": "[{\"code\":\"FIND-01\",\"severity\":\"medium\",...}]",
  "discrepancies": [{"code":"FIND-01","severity":"medium","field":"electrical","detail":"..."}],
  "disclaimer": "Vision output is indicative..."
}
```

### Ollama vision model
`llama3.2-vision` (10.7B, Q4_K_M) on `http://100.125.103.28:11434`.  
If vision unavailable → summary says "vision analysis unavailable" — check OLLAMA_BASE_URL in `.env`.
