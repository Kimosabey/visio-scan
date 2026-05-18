# VisioScan — API reference

Base URL — `http://127.0.0.1:8105` (or `http://<LAN_IP>:8105`). OpenAPI at `/docs`.

## Endpoint summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | service liveness + references dir |
| `POST` | `/v1/analyze` | multipart field-image analyze (vision when Ollama set) |
| `GET`  | `/v1/library` | **NEW** — list reference images on disk |
| `GET`  | `/v1/library/file/{name}` | **NEW** — serve a single reference image |
| `POST` | `/v1/index` | **NEW** — upload a new reference image |

Allowed reference extensions: `.png .jpg .jpeg .webp .gif .bmp .tiff`.
References live under `VISIO_REFERENCES_DIR` (defaults to `./references`).

## POST /v1/analyze

`multipart/form-data`:

- `file` — field capture (image/* recommended)
- `reference_label` (optional) — basename in the references dir

```bash
curl -X POST $BASE/v1/analyze \
  -F 'file=@./field.jpg' \
  -F 'reference_label=panel-nameplate.png'
```

Response shape (truncated):

```json
{
  "request_id": "uuid",
  "filename": "field.jpg",
  "content_type": "image/jpeg",
  "summary": "…",
  "vision_notes": "…",
  "discrepancies": [
    {"code":"FIND-01","severity":"medium","field":"electrical","detail":"…"}
  ],
  "disclaimer": "Vision output is indicative …"
}
```

Failure modes:

- Non-image upload → 200 with metadata only (no vision)
- `OLLAMA_BASE_URL` unset → 200 with metadata + "vision unavailable" summary
- `reference_label` containing `..`, `/`, `\` → rejected silently (note in
  summary)

## GET /v1/library  (new)

Query string: `?limit=100` (1..1000, default 100).

```json
{
  "count": 3,
  "root": "/.../references",
  "items": [
    { "name":"panel-nameplate.png", "size":312540, "mtime":1736400000.0,
      "ext":".png", "url":"/v1/library/file/panel-nameplate.png" }
  ]
}
```

## GET /v1/library/file/{name}  (new)

Serves the file via `FileResponse`. Path traversal is rejected (`..`, slashes
filtered to basename). Returns `404` when missing.

## POST /v1/index  (new)

`multipart/form-data`:
- `file` — image
- `name` (optional) — target filename. Defaults to the upload's filename.

Extension must be in the allow-list, or `Content-Type: image/*` (we add `.png`).

```bash
curl -X POST $BASE/v1/index -F 'file=@./golden.png' -F 'name=panel-nameplate.png'
```

Response: `{ "name": "panel-nameplate.png", "bytes": 312540, "path": "/.../references/panel-nameplate.png" }`.
