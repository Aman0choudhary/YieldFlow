function Get-YieldFlowRoot {
    return Split-Path -Parent $PSScriptRoot
}

function Get-YieldFlowDeployment {
    param([string]$Network = "testnet")

    $root = Get-YieldFlowRoot
    $path = Join-Path $root "deployments\$Network.json"
    if (-not (Test-Path $path)) {
        throw "Deployment file not found: $path. Run scripts/deploy-testnet.ps1 first."
    }

    return Get-Content -Raw -Path $path | ConvertFrom-Json
}

function ConvertTo-TokenUnits {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Amount,
        [int]$Decimals = 7
    )

    $value = $Amount.Trim()
    if ($value -notmatch '^\d+(\.\d+)?$') {
        throw "Amount must be a positive decimal number."
    }

    $parts = $value.Split(".")
    $whole = [System.Numerics.BigInteger]::Parse($parts[0])
    $fraction = ""
    if ($parts.Length -gt 1) {
        $fraction = $parts[1]
    }

    if ($fraction.Length -gt $Decimals) {
        $fraction = $fraction.Substring(0, $Decimals)
    }
    $fraction = $fraction.PadRight($Decimals, "0")

    $scale = [System.Numerics.BigInteger]::Pow(10, $Decimals)
    $fractionUnits = [System.Numerics.BigInteger]::Parse("0$fraction")

    return ($whole * $scale + $fractionUnits).ToString()
}

function Get-UnixSeconds {
    return [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
}

function Invoke-StellarChecked {
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
