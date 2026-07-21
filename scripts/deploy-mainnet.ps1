# Deploy YieldFlow contracts to Stellar MAINNET when funded with XLM.
# Usage:
#   .\scripts\deploy-mainnet.ps1 -SourceAccount yieldflow-mainnet -TokenContractId C...USDC_SAC...
# Prerequisites:
#   1) stellar keys generate yieldflow-mainnet --network mainnet  (or add existing)
#   2) Fund that account with enough XLM for deploy + init
#   3) Pass mainnet USDC Stellar Asset Contract id

param(
  [string]$SourceAccount = "yieldflow-mainnet",
  [Parameter(Mandatory = $true)][string]$TokenContractId,
  [string]$Network = "mainnet",
  [string]$RpcUrl = "https://mainnet.sorobanrpc.com",
  [string]$NetworkPassphrase = "Public Global Stellar Network ; September 2015",
  [int]$BufferBps = 1500,
  [int]$YieldBps = 8500
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

Write-Host "Building optimized contracts..."
Set-Location contracts
stellar contract build --optimize
Set-Location $root

$streamingWasm = "contracts/target/wasm32v1-none/release/streaming.optimized.wasm"
$vaultWasm = "contracts/target/wasm32v1-none/release/vault.optimized.wasm"
if (-not (Test-Path $streamingWasm)) { $streamingWasm = "contracts/target/wasm32v1-none/release/streaming.wasm" }
if (-not (Test-Path $vaultWasm)) { $vaultWasm = "contracts/target/wasm32v1-none/release/vault.wasm" }

Write-Host "Deploying streaming..."
$streamingOut = stellar contract deploy --wasm $streamingWasm --source-account $SourceAccount --network $Network --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase 2>&1 | Out-String
Write-Host $streamingOut
$streamingId = ($streamingOut | Select-String -Pattern "C[A-Z0-9]{55}" -AllMatches).Matches | Select-Object -Last 1 -ExpandProperty Value
if (-not $streamingId) { throw "Could not parse streaming contract id" }

Write-Host "Deploying vault..."
$vaultOut = stellar contract deploy --wasm $vaultWasm --source-account $SourceAccount --network $Network --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase 2>&1 | Out-String
Write-Host $vaultOut
$vaultId = ($vaultOut | Select-String -Pattern "C[A-Z0-9]{55}" -AllMatches).Matches | Select-Object -Last 1 -ExpandProperty Value
if (-not $vaultId) { throw "Could not parse vault contract id" }

$employer = stellar keys address $SourceAccount
Write-Host "Employer/admin: $employer"

Write-Host "Initializing streaming (withdrawal controller = vault)..."
stellar contract invoke --id $streamingId --source-account $SourceAccount --network $Network --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --admin $employer --withdrawal_controller $vaultId

Write-Host "Initializing vault..."
stellar contract invoke --id $vaultId --source-account $SourceAccount --network $Network --rpc-url $RpcUrl --network-passphrase $NetworkPassphrase -- initialize --employer $employer --streaming $streamingId --token $TokenContractId --buffer_bps $BufferBps --yield_bps $YieldBps

$outDir = Join-Path $root "deployments"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$payload = [ordered]@{
  network = $Network
  rpcUrl = $RpcUrl
  networkPassphrase = $NetworkPassphrase
  employer = $employer
  tokenContractId = $TokenContractId
  streamingContractId = $streamingId
  vaultContractId = $vaultId
  bufferBps = $BufferBps
  yieldBps = $YieldBps
  deployedAt = (Get-Date).ToString("o")
}
$payload | ConvertTo-Json | Set-Content (Join-Path $outDir "mainnet.json")
Write-Host "Wrote deployments/mainnet.json"
Write-Host "DONE. Update Vercel env with these contract IDs and mainnet RPC/passphrase."