# YieldFlow demo verification — mock path always; stellar path when configured.

$ErrorActionPreference = "Continue"
. "$PSScriptRoot\YieldFlow.Common.ps1"
$root = Get-YieldFlowRoot
Set-Location $root

Write-Host "YieldFlow verify:demo"
Write-Host "---------------------"

$checks = @()

function Add-Check([string]$name, [bool]$ok, [string]$detail) {
  $script:checks += [pscustomobject]@{ Name = $name; Ok = $ok; Detail = $detail }
  $mark = if ($ok) { "OK" } else { "!!" }
  Write-Host ("[{0}] {1} — {2}" -f $mark, $name, $detail)
}

Add-Check "SDK entry" (Test-Path "sdk\yieldflow-sdk.ts") "sdk/yieldflow-sdk.ts"
Add-Check "Mock SDK" (Test-Path "sdk\mock-sdk.ts") "sdk/mock-sdk.ts"
Add-Check "Stellar SDK" (Test-Path "sdk\stellar-sdk.ts") "sdk/stellar-sdk.ts"
Add-Check "SDK config" (Test-Path "sdk\config.ts") "sdk/config.ts"
Add-Check "UI boundary" (Test-Path "frontend\src\sdk\yieldflow-sdk.ts") "frontend re-exports root SDK"
Add-Check "USDC config" (Test-Path "config\testnet-usdc.json") "config/testnet-usdc.json"
Add-Check "Vault scaffold" (Test-Path "contracts\vault\src\lib.rs") "contracts/vault"
Add-Check "Streaming scaffold" (Test-Path "contracts\streaming\src\lib.rs") "contracts/streaming"
Add-Check "Router scaffold" (Test-Path "contracts\defindex_router\src\lib.rs") "contracts/defindex_router"
Add-Check "Deployments file" (Test-Path "deployments\testnet.json") "deployments/testnet.json"

$pages = @("Dashboard.tsx","Flows.tsx","Activity.tsx")
foreach ($p in $pages) {
  Add-Check "Page $p" (Test-Path "frontend\src\pages\$p") "frontend/src/pages/$p"
}

Write-Host ""
Write-Host "Demo routes (dev server):"
Write-Host "  http://localhost:5173/#/dashboard"
Write-Host "  http://localhost:5173/#/flows"
Write-Host "  http://localhost:5173/#/activity"
Write-Host ""
Write-Host "SDK mode env: VITE_YIELDFLOW_SDK=mock|stellar"
Write-Host "Default: mock (recommended until contracts are deployed)."

$failed = @($checks | Where-Object { -not $_.Ok }).Count
if ($failed -gt 0) {
  Write-Host ""
  Write-Host "FAILED checks: $failed"
  exit 1
}

Write-Host ""
Write-Host "All structural checks passed."
exit 0
