# VisioScan — implementation plan

**Repo:** [Kimosabey/visio-scan](https://github.com/Kimosabey/visio-scan) · **API:** port `8105`

## Product goal

**Multimodal RAG:** **vision-language** pipeline for drawings / panels / field photos — compare as-built vs references; explicit **unknowns** in copy.

## Suite UI standards

**Vite + React + TS**, **Tailwind (light-only)**, **Framer Motion** + **Aceternity-style** (e.g. spotlight on upload hero), **Lucide**, **TanStack Query**, **RHF + Zod**, **React Router**. Heavy use of **image** + **comparison** layout (side-by-side desktop, stacked mobile).

## Milestones

| Phase | Backend | Web UI |
|-------|---------|--------|
| **M1** | `POST /v1/analyze` stub (multipart optional); mock discrepancy list | Scaffold `web/`; **upload** + **analysis** view with animated cards |
| **M2** | Ollama vision model (`llama3.2-vision` or successor) | Live analysis + loading states |
| **M3** | `POST /v1/index` batch ingest stub | **Library** grid stub |
| **M4** | Object storage for originals | Progress + retry UI |

## Current status

- FastAPI scaffold + `/health` live.
- **`web/`** and vision API **not started**.

## Ops

Ollama base URL via env (same pattern as other suite services on GLSERVERLLM).
