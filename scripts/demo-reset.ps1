# YieldFlow demo reset helper
# Clears local mock state keys and prints refresh guidance.

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\YieldFlow.Common.ps1"
$root = Get-YieldFlowRoot

Write-Host "YieldFlow demo:reset"
Write-Host "---------------------"
Write-Host "Preferred: in-app Settings → Reset demo (calls SDK resetDemo())."
Write-Host ""
Write-Host "Manual browser console:"
Write-Host "  localStorage.removeItem('yieldflow.employeeId')"
Write-Host "  localStorage.removeItem('yieldflow.depositCount')"
Write-Host "  localStorage.removeItem('yieldflow.totalPool')"
Write-Host "  localStorage.removeItem('yieldflow.activityLog')"
Write-Host "  location.reload()"
Write-Host ""
Write-Host "Or from Node when a DOM is available (Playwright/tests)."
Write-Host "Root: $root"
exit 0
