# The one tbUI3 "Store logs and diagnostics" switch (AGENTS.md hard requirement), shared by the development tools.
# The add-in saves it from IDE Options; a missing value means on (the default until tbUI3 1.0).
function Test-StoreLogs {
    try {$value=(Get-ItemProperty -LiteralPath 'HKCU:\Software\VB and VBA Program Settings\tbUI3\Diagnostics' -Name 'StoreLogs' -ErrorAction Stop).StoreLogs} catch {return $true}
    return ([string]$value -ne '0')
}
