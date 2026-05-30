$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "Web UI: http://localhost:5173 (API: VITE_API_URL from .env)"
npm run dev
