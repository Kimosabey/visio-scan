# Changelog — VisioScan

## [Unreleased]

### Fixed
- `app/main.py` was using `os.getenv` without `import os` — added the import so
  the service starts.

### Added
- `GET /v1/library?limit=` — list reference images with size + mtime + URL.
- `GET /v1/library/file/{name}` — serve a reference (path-traversal guarded).
- `POST /v1/index` — multipart upload to persist a new reference image into
  the library; extension + content-type allow-list; path-traversal guard.
- Light Studio UI theme — magenta-rose + warm cream + Fraunces editorial +
  JetBrains Mono. Lens flares, aperture motif, polaroid frame primitive with
  subtle tilt + aperture-pulse animation.
- WCAG primitives: skip-link, reduced-motion (kills polaroid tilt), focus rings.
- LAN-IP CORS via `CORS_ORIGIN_REGEX`; suite share-URL script in `run-dev`.
- Docs: `API.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `SCREENSHOTS.md`, banner SVG.

### Changed
- README: banner header, URL grid (localhost + LAN), doc index, new endpoints.

## [0.2.0]

- `POST /v1/analyze` with Ollama vision when `OLLAMA_BASE_URL` set.
- Initial Vite + React UI with upload form, preview, discrepancy cards.
