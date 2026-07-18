param(
    [string]$Name = "yieldflow-admin",
    [string]$Network = "testnet"
)

$ErrorActionPreference = "Stop"

$existingKeys = & stellar keys ls
if ($LASTEXITCODE -ne 0) {
    throw "Failed to list Stellar identities."
}

if ($existingKeys -match "(^|\s)$([regex]::Escape($Name))(\s|$)") {
    Write-Host "Identity '$Name' already exists."
} else {
    & stellar keys generate $Name --network $Network --fund
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to generate and fund identity '$Name'."
    }
}

$publicKey = (& stellar keys public-key $Name).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Failed to read public key for '$Name'."
}

Write-Host "Identity: $Name"
Write-Host "Network:  $Network"
Write-Host "Address:  $publicKey"
