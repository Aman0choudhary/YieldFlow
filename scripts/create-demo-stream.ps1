param(
    [Parameter(Mandatory = $true)]
    [string]$Employee,
    [Parameter(Mandatory = $true)]
    [string]$TotalAmount,
    [string]$Network = "testnet",
    [string]$SourceAccount = "",
    [long]$StartTime = 0,
    [int]$DurationDays = 30,
    [int]$TokenDecimals = 7
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "YieldFlow.Common.ps1")

if ($DurationDays -le 0) {
    throw "DurationDays must be positive."
}

$deployment = Get-YieldFlowDeployment -Network $Network
$source = if ($SourceAccount) { $SourceAccount } else { $deployment.source_account }
$start = if ($StartTime -gt 0) { $StartTime } else { Get-UnixSeconds }
$end = $start + ($DurationDays * 24 * 60 * 60)
$amountUnits = ConvertTo-TokenUnits -Amount $TotalAmount -Decimals $TokenDecimals

Invoke-StellarChecked @(
    "contract", "invoke",
    "--network", $deployment.network,
    "--source-account", $source,
    "--id", $deployment.streaming_contract_id,
    "--",
    "create_stream",
    "--employee", $Employee,
    "--total_amount", $amountUnits,
    "--start_time", "$start",
    "--end_time", "$end"
) | ForEach-Object { Write-Host $_ }

Write-Host "Stream start: $start"
Write-Host "Stream end:   $end"
