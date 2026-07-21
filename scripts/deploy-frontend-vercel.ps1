# Deploy YieldFlow frontend + API to the existing Vercel project
# URL: https://yieldflow-frontend.vercel.app
#
# Prerequisites:
#   1) npm i -g vercel   OR use npx vercel
#   2) vercel login
#   3) Optional for deposit/withdraw: set env YIELDFLOW_SIGNER_SECRET
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-frontend-vercel.ps1

$ErrorActionPreference = "Stop"
$frontend = Join-Path $PSScriptRoot "..\frontend" | Resolve-Path

Write-Host "Frontend dir: $frontend"

Push-Location $frontend
try {
  Write-Host "Installing dependencies..."
  npm.cmd install

  Write-Host "Building locally (sanity check)..."
  npm.cmd run build

  $vercel = "npx.cmd"
  $vercelArgs = @("--yes", "vercel")

  Write-Host "Ensuring project link (.vercel)..."
  if (-not (Test-Path ".\.vercel\project.json")) {
    & $vercel @($vercelArgs + @("link", "--yes", "--project", "yieldflow-frontend"))
  }

  # Public / non-secret env (production + preview)
  $envPairs = @{
    "YIELDFLOW_ALLOWED_ORIGIN" = "https://yieldflow-frontend.vercel.app"
    "YIELDFLOW_RPC_URL" = "https://soroban-testnet.stellar.org"
    "YIELDFLOW_NETWORK_PASSPHRASE" = "Test SDF Network ; September 2015"
    "YIELDFLOW_PUBLIC_KEY" = "GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM"
    "YIELDFLOW_VAULT_CONTRACT_ID" = "CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B"
    "YIELDFLOW_STREAMING_CONTRACT_ID" = "CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU"
    "YIELDFLOW_EMPLOYEE_ADDRESS" = "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4"
  }

  foreach ($key in $envPairs.Keys) {
    $val = $envPairs[$key]
    Write-Host "Setting $key"
    # vercel env add is interactive; use env pull/update via --force where possible
    $val | & $vercel @($vercelArgs + @("env", "add", $key, "production", "--force")) 2>$null
    $val | & $vercel @($vercelArgs + @("env", "add", $key, "preview", "--force")) 2>$null
  }

  if ($env:YIELDFLOW_SIGNER_SECRET -and $env:YIELDFLOW_SIGNER_SECRET -notmatch "SBX") {
    Write-Host "Setting YIELDFLOW_SIGNER_SECRET from environment"
    $env:YIELDFLOW_SIGNER_SECRET | & $vercel @($vercelArgs + @("env", "add", "YIELDFLOW_SIGNER_SECRET", "production", "--force")) 2>$null
    $env:YIELDFLOW_SIGNER_SECRET | & $vercel @($vercelArgs + @("env", "add", "YIELDFLOW_SIGNER_SECRET", "preview", "--force")) 2>$null
  } else {
    Write-Host "NOTE: YIELDFLOW_SIGNER_SECRET not set. Reads work; deposit/withdraw will return 503 until you add it in Vercel env."
  }

  # Same-origin API: leave VITE_API_URL unset/empty
  Write-Host "Deploying production..."
  & $vercel @($vercelArgs + @("deploy", "--prod", "--yes"))
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Done. Verify:"
Write-Host "  https://yieldflow-frontend.vercel.app/"
Write-Host "  https://yieldflow-frontend.vercel.app/api/health"
Write-Host "  https://yieldflow-frontend.vercel.app/api/stats"
