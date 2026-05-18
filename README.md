# VisioScan

Multimodal RAG — drawings and field photos via vision-language model (Ollama).

**GitHub:** [Kimosabey/visio-scan](https://github.com/Kimosabey/visio-scan)

`git clone git@github.com:Kimosabey/visio-scan.git` (uses your existing `~/.ssh/config` for GitHub)

**API port:** `8105`

## Run

**Docker:** `docker compose up --build` → [http://localhost:8105/health](http://localhost:8105/health)

**Local:** `pip install -r requirements.txt` → `uvicorn app.main:app --reload --host 0.0.0.0 --port 8105`

OpenAPI: [http://localhost:8105/docs](http://localhost:8105/docs)
