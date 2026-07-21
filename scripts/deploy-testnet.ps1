# YieldFlow testnet deploy for Soroban scaffolds.
# Requires: stellar CLI, funded testnet identity, Rust toolchain + soroban-sdk.

param(
  [string]$Source = "yieldflow-deployer",
  [string]$Network = "testnet"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\YieldFlow.Common.ps1"
$root = Get-YieldFlowRoot
Set-Location $root

Write-Host "YieldFlow deploy:testnet"
Write-Host "------------------------"
Write-Host "Root: $root"
Write-Host "Network: $Network"
Write-Host "Source identity: $Source"
Write-Host ""

$stellar = Get-Command stellar -ErrorAction SilentlyContinue
if (-not $stellar) {
  Write-Host "stellar CLI not found on PATH."
  Write-Host "Install: https://developers.stellar.org/docs/tools/cli/install-cli"
  Write-Host "Until then, UI runs on mock SDK (VITE_YIELDFLOW_SDK=mock)."
  Write-Host ""
  Write-Host "Contracts staged for deploy:"
  Write-Host "  - contracts/streaming"
  Write-Host "  - contracts/vault"
  Write-Host "  - contracts/defindex_router"
  Write-Host ""
  Write-Host "After install, re-run: npm run deploy:testnet"
  exit 0
}

$deploymentsDir = Join-Path $root "deployments"
New-Item -ItemType Directory -Force -Path $deploymentsDir | Out-Null
$outPath = Join-Path $deploymentsDir "$Network.json"

Write-Host "Building contracts (if Cargo workspace is configured)..."
$crates = @("vault", "streaming", "defindex_router")
$wasm = @{}
foreach ($crate in $crates) {
  $cratePath = Join-Path $root "contracts\$crate"
  if (-not (Test-Path $cratePath)) {
    Write-Warning "Missing crate path: $cratePath"
    continue
  }
  Write-Host "  build $crate ..."
  try {
    # Preferred modern CLI
    Invoke-StellarChecked @("contract", "build", "--package", $crate) | Out-Null
  } catch {
    Write-Host "  build skipped/failed for $crate : $_"
  }
}

Write-Host ""
Write-Host "Deploy step is interactive with funded identity."
Write-Host "Example:"
Write-Host "  stellar contract deploy --wasm target/wasm32-unknown-unknown/release/vault.wasm --source $Source --network $Network"
Write-Host ""
Write-Host "Record IDs into:"
Write-Host "  $outPath"
Write-Host "  config/testnet-usdc.json -> contracts"
Write-Host "  sdk/config.ts -> TESTNET_CONFIG.contracts"
Write-Host ""
Write-Host "Then set VITE_YIELDFLOW_SDK=stellar and rebuild."

if (-not (Test-Path $outPath)) {
  @{
    network = $Network
    updatedAt = $null
    contracts = @{ vault = $null; streaming = $null; defindex_router = $null }
    wasm = @{ vault = $null; streaming = $null; defindex_router = $null }
    notes = "Awaiting successful stellar contract deploy"
  } | ConvertTo-Json -Depth 6 | Set-Content -Path $outPath -Encoding utf8
}

Write-Host "Done (scaffold path). Current UI mode remains MOCK until contract IDs are set."
exit 0
