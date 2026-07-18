$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$streamingWasm = Join-Path $root "contracts\target\wasm32v1-none\release\streaming.wasm"
$vaultWasm = Join-Path $root "contracts\target\wasm32v1-none\release\vault.wasm"

if (-not (Test-Path $streamingWasm) -or -not (Test-Path $vaultWasm)) {
    Push-Location (Join-Path $root "contracts")
    try {
        & stellar contract build
        if ($LASTEXITCODE -ne 0) {
            throw "stellar contract build failed."
        }
    } finally {
        Pop-Location
    }
}

& stellar contract bindings typescript --wasm $streamingWasm --output-dir (Join-Path $root "sdk\generated\streaming") --overwrite
if ($LASTEXITCODE -ne 0) {
    throw "Failed to generate streaming bindings."
}

& stellar contract bindings typescript --wasm $vaultWasm --output-dir (Join-Path $root "sdk\generated\vault") --overwrite
if ($LASTEXITCODE -ne 0) {
    throw "Failed to generate vault bindings."
}
