param(
    [string]$SourceAccount = "yieldflow-admin",
    [string]$TokenContractId = "",
    [string]$Network = "testnet",
    [uint32]$BufferBps = 1500,
    [uint32]$YieldBps = 8500
)

$ErrorActionPreference = "Stop"

function Invoke-Stellar {
    param([string[]]$StellarArgs)

    $stderrFile = New-TemporaryFile
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & stellar @StellarArgs 2> $stderrFile
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $stderr = Get-Content -Path $stderrFile -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stderrFile -Force -ErrorAction SilentlyContinue

    if ($exitCode -ne 0) {
        $output | ForEach-Object { Write-Host $_ }
        $stderr | ForEach-Object { Write-Host $_ }
        throw "stellar $($StellarArgs -join ' ') failed."
    }

    return @($output) + @($stderr)
}

function Get-ContractId {
    param($Output)

    $matches = $Output | Select-String -Pattern "C[A-Z0-9]{55}" -AllMatches
    $ids = $matches | ForEach-Object { $_.Matches.Value }
    if (-not $ids) {
        $Output | ForEach-Object { Write-Host $_ }
        throw "Could not find a contract id in Stellar CLI output."
    }

    return $ids[-1]
}

$root = Split-Path -Parent $PSScriptRoot
$contractsDir = Join-Path $root "contracts"
$releaseDir = Join-Path $contractsDir "target\wasm32v1-none\release"
$streamingWasm = Join-Path $releaseDir "streaming.wasm"
$vaultWasm = Join-Path $releaseDir "vault.wasm"
$deploymentsDir = Join-Path $root "deployments"
$deploymentFile = Join-Path $deploymentsDir "$Network.json"
$usdcConfigFile = Join-Path $root "config\testnet-usdc.json"

if (($BufferBps + $YieldBps) -ne 10000) {
    throw "BufferBps + YieldBps must equal 10000."
}

if (-not $TokenContractId) {
    if (-not (Test-Path $usdcConfigFile)) {
        throw "TokenContractId was not provided and config/testnet-usdc.json was not found."
    }

    $TokenContractId = (Get-Content -Raw -Path $usdcConfigFile | ConvertFrom-Json).token_contract_id
}

Push-Location $contractsDir
try {
    Invoke-Stellar @("contract", "build") | ForEach-Object { Write-Host $_ }
} finally {
    Pop-Location
}

$employerAddress = (Invoke-Stellar @("keys", "public-key", $SourceAccount))[0].Trim()

$streamingOutput = Invoke-Stellar @(
    "contract", "deploy",
    "--network", $Network,
    "--source-account", $SourceAccount,
    "--wasm", $streamingWasm,
    "--alias", "yieldflow-streaming"
)
$streamingId = Get-ContractId $streamingOutput

$vaultOutput = Invoke-Stellar @(
    "contract", "deploy",
    "--network", $Network,
    "--source-account", $SourceAccount,
    "--wasm", $vaultWasm,
    "--alias", "yieldflow-vault"
)
$vaultId = Get-ContractId $vaultOutput

Invoke-Stellar @(
    "contract", "invoke",
    "--network", $Network,
    "--source-account", $SourceAccount,
    "--id", $streamingId,
    "--",
    "init",
    "--employer", $employerAddress,
    "--withdrawal_controller", $vaultId
) | ForEach-Object { Write-Host $_ }

Invoke-Stellar @(
    "contract", "invoke",
    "--network", $Network,
    "--source-account", $SourceAccount,
    "--id", $vaultId,
    "--",
    "init",
    "--employer", $employerAddress,
    "--withdrawal_controller", $employerAddress,
    "--streaming_contract", $streamingId,
    "--token", $TokenContractId,
    "--buffer_bps", "$BufferBps",
    "--yield_bps", "$YieldBps"
) | ForEach-Object { Write-Host $_ }

New-Item -ItemType Directory -Force -Path $deploymentsDir | Out-Null

$deployment = [ordered]@{
    network = $Network
    source_account = $SourceAccount
    employer_address = $employerAddress
    token_contract_id = $TokenContractId
    streaming_contract_id = $streamingId
    vault_contract_id = $vaultId
    buffer_bps = $BufferBps
    yield_bps = $YieldBps
    streaming_wasm_sha256 = (Get-FileHash -Algorithm SHA256 $streamingWasm).Hash.ToLowerInvariant()
    vault_wasm_sha256 = (Get-FileHash -Algorithm SHA256 $vaultWasm).Hash.ToLowerInvariant()
    deployed_at = (Get-Date).ToUniversalTime().ToString("o")
}

$deployment | ConvertTo-Json | Set-Content -Path $deploymentFile -Encoding utf8

Write-Host "Streaming: $streamingId"
Write-Host "Vault:     $vaultId"
Write-Host "Saved:     $deploymentFile"
