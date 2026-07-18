param(
    [Parameter(Mandatory = $true)]
    [string]$Employee,
    [Parameter(Mandatory = $true)]
    [string]$Amount,
    [string]$Network = "testnet",
    [string]$SourceAccount = "",
    [int]$TokenDecimals = 7
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "YieldFlow.Common.ps1")

$deployment = Get-YieldFlowDeployment -Network $Network
$source = if ($SourceAccount) { $SourceAccount } else { $deployment.source_account }
$amountUnits = ConvertTo-TokenUnits -Amount $Amount -Decimals $TokenDecimals

Invoke-StellarChecked @(
    "contract", "invoke",
    "--network", $deployment.network,
    "--source-account", $source,
    "--id", $deployment.vault_contract_id,
    "--",
    "release_buffer",
    "--recipient", $Employee,
    "--amount", $amountUnits
) | ForEach-Object { Write-Host $_ }
