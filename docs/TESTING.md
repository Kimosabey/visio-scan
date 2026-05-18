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
