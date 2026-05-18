@echo off
cd /d "%~dp0"
if not exist "app\main.py" (
  echo ERROR: Run from repo root (folder with app\).
  exit /b 1
)
set PORT=8105
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port %PORT%
