# VisioScan — architecture

## Component diagram

```mermaid
flowchart LR
  UI["Vite SPA<br/>(Light Studio)"]
  subgraph Edge ["Edge box — :8105"]
    API["FastAPI app.main"]
    FS["Reference library<br/>VISIO_REFERENCES_DIR"]
  end
  OL["Ollama<br/>llama3.2-vision (or successor)"]

  UI --> API
  API <--> FS
  API -- base64 images + prompt --> OL
  OL -- JSON discrepancies --> API
```

## Analyze sequence

```mermaid
sequenceDiagram
  participant UI
  participant API as /v1/analyze
  participant FS
  participant OL as Ollama vision

  UI->>API: multipart file + reference_label?
  API->>API: read file, decide image vs non-image
  alt content_type starts with image/
    API->>FS: read reference (basename safe)
    API->>OL: POST /api/generate { images: [field, reference?], prompt }
    OL-->>API: JSON discrepancy array
    API->>API: parse + clamp fields, build summary
  else non-image
    API-->>UI: 200 with metadata-only summary
  end
  API-->>UI: AnalyzeResponse
```

## Library sequence

```mermaid
sequenceDiagram
  participant UI
  participant API
  participant FS

  UI->>API: GET /v1/library
  API->>FS: list image files
  FS-->>API: paths + mtime
  API-->>UI: { items: [...], root }

  UI->>API: POST /v1/index (multipart)
  API->>API: name/extension validation
  API->>FS: write under VISIO_REFERENCES_DIR
  API-->>UI: { name, bytes, path }
```

## Path-safety

Every reference name passes through `_safe_reference_path`:
- rejects `..`, `/`, `\` in label
- coerces to basename only
- resolves against `REFS_ROOT.resolve()` and verifies the result is inside

The upload endpoint applies the same guard via `Path(base).name` + a `relative_to`
check, so a malicious filename cannot escape the references dir.

## Frontend

- **Light Studio** theme: magenta-rose + warm cream, Fraunces editorial,
  JetBrains Mono. Lens flares, aperture motif, polaroid frames for previews.
- Reference picker can use the new `/v1/library` to render a thumbnail strip
  (next iteration — currently the form accepts a `reference_label` typed by the
  technician or selected from presets).
- WCAG: skip-link, reduced-motion (kills polaroid tilt), focus rings, semantic
  landmarks.
