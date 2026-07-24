# Create (or show) a dedicated mainnet deployer identity. Does NOT deploy contracts.
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-mainnet-identity.ps1
# Optional:
#   -Name yieldflow-mainnet

param([string]$Name = "yieldflow-mainnet")
$ErrorActionPreference = "Stop"

Write-Host "Setting up mainnet identity: $Name"
$existing = stellar keys ls 2>&1 | Out-String
if ($existing -match [regex]::Escape($Name)) {
  Write-Host "Identity already exists."
} else {
  Write-Host "Generating new identity (will print public address)..."
  stellar keys generate $Name --network mainnet --rpc-url https://mainnet.sorobanrpc.com 2>&1
}

$addr = (stellar keys address $Name).Trim()
Write-Host ""
Write-Host "Mainnet deployer address:"
Write-Host $addr
Write-Host ""
Write-Host "NEXT (manual):"
Write-Host "1) Send ~50 XLM from Freighter to this address (fees + deploy)."
Write-Host "2) Keep a secure offline backup of the secret if you export it."
Write-Host "3) Do NOT run deploy until you say: go mainnet deploy"
Write-Host "4) Recommended USDC SAC: CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
Write-Host "5) Recommended Blend pool (FixedV2): CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD"
