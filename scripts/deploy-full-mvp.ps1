# One-shot: deploy FULL working frontend+API to production URL
# https://yieldflow-frontend.vercel.app/
#
# First time only if CLI session expired:
#   npx vercel login
#
# Then:
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-full-mvp.ps1

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Host "== YieldFlow full MVP deploy =="

if (-not $env:YIELDFLOW_SIGNER_SECRET) {
  try {
    $env:YIELDFLOW_SIGNER_SECRET = (stellar keys secret yieldflow-deployer).Trim()
    Write-Host "Loaded YIELDFLOW_SIGNER_SECRET from stellar identity yieldflow-deployer"
  } catch {
    Write-Host "WARN: could not load signer secret. Deposit/withdraw will 503 until set."
  }
}

Set-Location (Join-Path $root "frontend")
Write-Host "npm install..."
npm.cmd install
Write-Host "build..."
npm.cmd run build

$vercel = "npx.cmd"
function VercelArgs([string[]]$args) { return @("--yes","vercel") + $args }

Write-Host "Checking Vercel auth..."
& $vercel @(VercelArgs @("whoami"))
if ($LASTEXITCODE -ne 0) {
  throw "Vercel not logged in. Run: npx vercel login   then re-run this script."
}

if (-not (Test-Path ".\.vercel\project.json")) {
  & $vercel @(VercelArgs @("link","--yes","--project","yieldflow-frontend"))
}

$envPairs = [ordered]@{
  "YIELDFLOW_ALLOWED_ORIGIN" = "https://yieldflow-frontend.vercel.app"
  "YIELDFLOW_RPC_URL" = "https://soroban-testnet.stellar.org"
  "YIELDFLOW_NETWORK_PASSPHRASE" = "Test SDF Network ; September 2015"
  "YIELDFLOW_PUBLIC_KEY" = "GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM"
  "YIELDFLOW_VAULT_CONTRACT_ID" = "CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B"
  "YIELDFLOW_STREAMING_CONTRACT_ID" = "CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU"
  "YIELDFLOW_EMPLOYEE_ADDRESS" = "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4"
}

foreach ($key in $envPairs.Keys) {
  Write-Host "env $key"
  $envPairs[$key] | & $vercel @(VercelArgs @("env","add",$key,"production","--force")) 2>$null
  $envPairs[$key] | & $vercel @(VercelArgs @("env","add",$key,"preview","--force")) 2>$null
}

if ($env:YIELDFLOW_SIGNER_SECRET -and $env:YIELDFLOW_SIGNER_SECRET -notmatch "^SBX") {
  Write-Host "env YIELDFLOW_SIGNER_SECRET"
  $env:YIELDFLOW_SIGNER_SECRET | & $vercel @(VercelArgs @("env","add","YIELDFLOW_SIGNER_SECRET","production","--force")) 2>$null
  $env:YIELDFLOW_SIGNER_SECRET | & $vercel @(VercelArgs @("env","add","YIELDFLOW_SIGNER_SECRET","preview","--force")) 2>$null
}

Write-Host "Deploying production..."
& $vercel @(VercelArgs @("deploy","--prod","--yes"))
if ($LASTEXITCODE -ne 0) { throw "vercel deploy failed" }

Write-Host ""
Write-Host "Smoke checks:"
Write-Host "  https://yieldflow-frontend.vercel.app/"
Write-Host "  https://yieldflow-frontend.vercel.app/api/health"
Write-Host "  https://yieldflow-frontend.vercel.app/api/stats"
Write-Host "  https://yieldflow-frontend.vercel.app/api/employer"
Write-Host "  POST login: /api/employee/login"
Write-Host "DONE"