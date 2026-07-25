# =============================================================================
# LEAN MAINNET DEPLOY — optimized for ~50 XLM budgets
# DO NOT RUN until user says: go mainnet deploy
#
# Fixes:
# - Correct entrypoints: init (not initialize)
# - Always prefer *.optimized.wasm
# - Sets Blend FixedV2 USDC pool
# - Preflight XLM balance check
# - Per-step balance logging to avoid blind retries
# =============================================================================
# Usage:
#   .\scripts\deploy-mainnet.ps1
#   .\scripts\deploy-mainnet.ps1 -SourceAccount yieldflow-mainnet -SkipBuild
# =============================================================================

param(
  [string]$SourceAccount = "yieldflow-mainnet",
  [string]$TokenContractId = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  [string]$BlendPoolId = "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
  [string]$Network = "mainnet",
  [string]$RpcUrl = "https://mainnet.sorobanrpc.com",
  [string]$NetworkPassphrase = "Public Global Stellar Network ; September 2015",
  [int]$BufferBps = 1500,
  [int]$YieldBps = 8500,
  [switch]$SkipBuild,
  [double]$MinXlm = 35
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

function Invoke-Stellar {
  param([string[]]$StellarArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $out = & stellar @StellarArgs 2>&1
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  $text = ($out | Out-String)
  if ($code -ne 0) {
    Write-Host $text
    throw "stellar failed (exit $code): $($StellarArgs -join ' ')"
  }
  return $text
}

function Get-ContractId([string]$Text) {
  $m = [regex]::Matches($Text, "C[A-Z0-9]{55}")
  if ($m.Count -eq 0) { throw "No contract id found in CLI output" }
  return $m[$m.Count - 1].Value
}

function Get-XlmBalance([string]$Address) {
  try {
    $json = Invoke-RestMethod -Uri "https://horizon.stellar.org/accounts/$Address" -TimeoutSec 30
    $native = $json.balances | Where-Object { $_.asset_type -eq "native" } | Select-Object -First 1
    if ($native) { return [double]$native.balance }
  } catch {}
  return -1
}

Write-Host "=== YieldFlow LEAN mainnet deploy ===" -ForegroundColor Cyan
Write-Host "Source:  $SourceAccount"
Write-Host "Token:   $TokenContractId"
Write-Host "Blend:   $BlendPoolId (FixedV2)"
Write-Host "Network: $Network"
Write-Host ""

if (($BufferBps + $YieldBps) -ne 10000) {
  throw "BufferBps + YieldBps must equal 10000"
}

$employer = (stellar keys address $SourceAccount).Trim()
Write-Host "Deployer/employer: $employer"

$bal = Get-XlmBalance $employer
if ($bal -lt 0) {
  Write-Host "WARN: could not read Horizon balance" -ForegroundColor Yellow
} else {
  Write-Host ("XLM balance: {0:N4}" -f $bal)
  if ($bal -lt $MinXlm) {
    throw "Balance $bal XLM < MinXlm $MinXlm. Fund deployer first."
  }
  if ($bal -lt 50) {
    Write-Host "WARN: under 50 XLM — lean path, avoid retries" -ForegroundColor Yellow
  }
}

if (-not $SkipBuild) {
  Write-Host "`n[1/6] Building optimized wasm..." -ForegroundColor Cyan
  Push-Location contracts
  try {
    Invoke-Stellar @("contract", "build", "--optimize") | ForEach-Object { Write-Host $_ }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "`n[1/6] SkipBuild — using existing optimized wasm" -ForegroundColor Yellow
}

$streamingWasm = Join-Path $root "contracts\target\wasm32v1-none\release\streaming.optimized.wasm"
$vaultWasm = Join-Path $root "contracts\target\wasm32v1-none\release\vault.optimized.wasm"
if (-not (Test-Path $streamingWasm)) { throw "Missing streaming.optimized.wasm" }
if (-not (Test-Path $vaultWasm)) { throw "Missing vault.optimized.wasm" }

Write-Host ("streaming.optimized.wasm = {0:N1} KB" -f ((Get-Item $streamingWasm).Length / 1KB))
Write-Host ("vault.optimized.wasm     = {0:N1} KB" -f ((Get-Item $vaultWasm).Length / 1KB))

$common = @(
  "--network", $Network,
  "--rpc-url", $RpcUrl,
  "--network-passphrase", $NetworkPassphrase,
  "--source-account", $SourceAccount
)

Write-Host "`n[2/6] Deploy streaming..." -ForegroundColor Cyan
$streamingOut = Invoke-Stellar (@("contract", "deploy", "--wasm", $streamingWasm) + $common)
Write-Host $streamingOut
$streamingId = Get-ContractId $streamingOut
Write-Host "Streaming: $streamingId" -ForegroundColor Green
Write-Host ("XLM now: {0:N4}" -f (Get-XlmBalance $employer))

Write-Host "`n[3/6] Deploy vault..." -ForegroundColor Cyan
$vaultOut = Invoke-Stellar (@("contract", "deploy", "--wasm", $vaultWasm) + $common)
Write-Host $vaultOut
$vaultId = Get-ContractId $vaultOut
Write-Host "Vault: $vaultId" -ForegroundColor Green
Write-Host ("XLM now: {0:N4}" -f (Get-XlmBalance $employer))

Write-Host "`n[4/6] Init streaming..." -ForegroundColor Cyan
Invoke-Stellar (@("contract", "invoke", "--id", $streamingId) + $common + @(
  "--", "init",
  "--employer", $employer,
  "--withdrawal_controller", $vaultId
)) | ForEach-Object { Write-Host $_ }

Write-Host "`n[5/6] Init vault..." -ForegroundColor Cyan
Invoke-Stellar (@("contract", "invoke", "--id", $vaultId) + $common + @(
  "--", "init",
  "--employer", $employer,
  "--withdrawal_controller", $employer,
  "--streaming_contract", $streamingId,
  "--token", $TokenContractId,
  "--buffer_bps", "$BufferBps",
  "--yield_bps", "$YieldBps"
)) | ForEach-Object { Write-Host $_ }

Write-Host "`n[6/6] set_blend_pool..." -ForegroundColor Cyan
$blendArg = '"' + $BlendPoolId + '"'
Invoke-Stellar (@("contract", "invoke", "--id", $vaultId) + $common + @(
  "--", "set_blend_pool",
  "--blend_pool", $blendArg
)) | ForEach-Object { Write-Host $_ }

$finalBal = Get-XlmBalance $employer
Write-Host ("XLM remaining: {0:N4}" -f $finalBal)

$payload = [ordered]@{
  network = $Network
  rpcUrl = $RpcUrl
  networkPassphrase = $NetworkPassphrase
  source_account = $SourceAccount
  employer_address = $employer
  token_contract_id = $TokenContractId
  streaming_contract_id = $streamingId
  vault_contract_id = $vaultId
  blend_pool_id = $BlendPoolId
  blend_pool_name = "FixedV2"
  buffer_bps = $BufferBps
  yield_bps = $YieldBps
  lean_deploy = $true
  xlm_remaining = $finalBal
  deployed_at = (Get-Date).ToUniversalTime().ToString("o")
  status = "DEPLOYED"
}

$outDir = Join-Path $root "deployments"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$payload | ConvertTo-Json | Set-Content (Join-Path $outDir "mainnet.json") -Encoding utf8

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Streaming: $streamingId"
Write-Host "Vault:     $vaultId"
Write-Host "Blend:     $BlendPoolId"
Write-Host "Saved:     deployments/mainnet.json"
Write-Host "NEXT: update Vercel env + tiny USDC smoke only."
