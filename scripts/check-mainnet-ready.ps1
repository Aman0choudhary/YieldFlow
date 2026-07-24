# YieldFlow mainnet readiness checker (does NOT deploy)
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\check-mainnet-ready.ps1

$ErrorActionPreference = "Continue"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

$pass = 0
$fail = 0
$warn = 0

function Ok($m) { Write-Host "[OK]  $m" -ForegroundColor Green; $script:pass++ }
function Bad($m) { Write-Host "[NO]  $m" -ForegroundColor Red; $script:fail++ }
function Warn($m) { Write-Host "[!!]  $m" -ForegroundColor Yellow; $script:warn++ }

Write-Host "== YieldFlow mainnet readiness (pre-deploy) ==" -ForegroundColor Cyan

# Config files
$cfgPath = "config\mainnet-usdc.json"
if (Test-Path $cfgPath) {
  $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
  if ($cfg.usdcTokenContractId -match '^C[A-Z0-9]{55}$') { Ok "USDC SAC configured: $($cfg.usdcTokenContractId)" } else { Bad "USDC SAC missing/invalid" }
  if ($cfg.blend.recommendedPoolId -match '^C[A-Z0-9]{55}$') { Ok "Blend pool recommended: $($cfg.blend.recommendedPoolId) ($($cfg.blend.recommendedPoolName))" } else { Bad "Blend pool not set" }
  if ($cfg.defindex.factory) { Ok "DeFindex factory catalogued" } else { Warn "DeFindex factory missing" }
} else { Bad "config/mainnet-usdc.json missing" }

if (Test-Path "deployments\mainnet.template.json") { Ok "mainnet.template.json present" } else { Bad "mainnet template missing" }
if (Test-Path "deployments\mainnet.json") { Warn "deployments/mainnet.json exists (deploy may already have run)" } else { Ok "No mainnet.json yet (expected pre-deploy)" }

if (Test-Path "docs\MAINNET_READINESS.md") { Ok "MAINNET_READINESS.md present" } else { Bad "readiness doc missing" }
if (Test-Path "frontend\vercel.json") {
  $vj = Get-Content "frontend\vercel.json" -Raw
  if ($vj -match "Content-Security-Policy") { Ok "CSP headers configured in vercel.json" } else { Warn "CSP headers not found" }
}

# Contracts build artifacts / source
if (Test-Path "contracts\contracts\vault\src\lib.rs") { Ok "Vault contract source present" } else { Bad "vault source missing" }
if (Test-Path "contracts\contracts\streaming\src\lib.rs") { Ok "Streaming contract source present" } else { Bad "streaming source missing" }

# Stellar CLI
try {
  $v = stellar --version 2>&1 | Out-String
  if ($v -match "stellar") { Ok "stellar CLI available" } else { Warn "stellar CLI version unknown" }
} catch { Bad "stellar CLI not found" }

# Mainnet identity
$ids = stellar keys ls 2>&1 | Out-String
if ($ids -match "mainnet|yieldflow-mainnet") { Ok "Possible mainnet identity listed in stellar keys" } else { Warn "No yieldflow-mainnet identity yet — create before deploy" }

# API security (testnet production)
try {
  $h = Invoke-RestMethod "https://yieldflow-frontend.vercel.app/api/health" -TimeoutSec 30
  if ($h.security.corsLocked) { Ok "Prod CORS locked" } else { Bad "Prod CORS not locked" }
  if ($h.security.sessionSecretConfigured) { Ok "Prod session secret configured" } else { Bad "Prod session secret weak/missing" }
  if ($h.security.adminKeyConfigured) { Ok "Prod admin key configured" } else { Bad "Prod admin key missing" }
  if ($h.security.withdrawRequiresSession) { Ok "Prod withdraw requires session" } else { Bad "Prod withdraw session gate missing" }
  if ($h.security.aiGuideConfigured) { Ok "AI guide configured" } else { Warn "AI guide not configured" }
  if ($h.network -match "testnet") { Ok "Prod still on testnet (expected until cutover)" } else { Warn "Prod network label: $($h.network)" }
} catch {
  Warn "Could not reach production health: $($_.Exception.Message)"
}

# Local secret file
if (Test-Path ".local-mainnet-prep-secrets.env") {
  Ok "Local rotated secrets file present (.gitignored)"
} else {
  Warn "No .local-mainnet-prep-secrets.env — rotate admin/session before mainnet"
}

Write-Host ""
Write-Host "Summary: $pass OK · $warn WARN · $fail FAIL" -ForegroundColor Cyan
if ($fail -gt 0) {
  Write-Host "Not ready to deploy mainnet until FAIL items are fixed." -ForegroundColor Red
  exit 1
} else {
  Write-Host "Pre-deploy checklist looks good enough to run deploy when you say: go mainnet deploy" -ForegroundColor Green
  Write-Host "Still required at deploy time: fund XLM, confirm Freighter account, tiny USDC smoke, rotate any chat-leaked keys (Groq)."
  exit 0
}
