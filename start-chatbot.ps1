$ErrorActionPreference = "Stop"
$backend = Join-Path $PSScriptRoot "backend"
$corexPython = "C:\Users\rader\Documents\Codex\2026-06-25\qlord-ops-corex-website-git-https\work\corex-website\backend\.venv-runtime\Scripts\python.exe"
$localPython = Join-Path $backend ".venv\Scripts\python.exe"
$python = if (Test-Path $localPython) {
  $localPython
} elseif (Test-Path $corexPython) {
  $corexPython
} else {
  "python"
}

if (-not (Test-Path (Join-Path $backend ".env"))) {
  Copy-Item (Join-Path $backend ".env.example") (Join-Path $backend ".env")
  Write-Host "Created backend/.env. Add OPENAI_API_KEY and run this file again."
  exit 1
}

Push-Location $backend
try {
  & $python -c "import fastapi, uvicorn, openai, dotenv" 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $python -m venv .venv
    $python = $localPython
    & $python -m pip install -r requirements.txt
  }
} catch {
  & $python -m venv .venv
  $python = $localPython
  & $python -m pip install -r requirements.txt
}
Write-Host ""
Write-Host "AIONEX AI backend: http://127.0.0.1:8000"
Write-Host "Keep this window open while using the chatbot."
Write-Host ""
& $python -m uvicorn server:app --host 127.0.0.1 --port 8000
Pop-Location
