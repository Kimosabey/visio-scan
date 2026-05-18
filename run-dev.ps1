$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path ".\app\main.py")) { Write-Error "Run from visio-scan repo root." }
$port = if ($env:PORT) { $env:PORT } else { "8105" }
Write-Host "VisioScan on port $port" -ForegroundColor Cyan
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $port
