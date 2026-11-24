# Development-only convenience entry point; never installed with the add-in.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidateSet('Embed','Package')][string]$Action)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs=Join-Path $cache 'Logs'
$null=New-Item -ItemType Directory -Path $logs -Force
$log=Join-Path $logs ($Action+'-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'.log')
$exitCode=1
$transcribing=$false
function Invoke-NodeChecked {
    param([string[]]$Arguments)
    $old=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        & $script:node @Arguments 2>&1 | ForEach-Object { Write-Host $_.ToString() }
        $code=$LASTEXITCODE
    } finally { $ErrorActionPreference=$old }
    if ($code -ne 0) { throw "Node command failed ($code): $($Arguments -join ' ')" }
}
try {
    Start-Transcript -Path $log | Out-Null
    $transcribing=$true
    Set-Location -LiteralPath $root
    if (Test-Path -LiteralPath 'tbIDE\tools\pending-welcome-repair\apply.mjs') {
        throw 'Complete the pending Welcome repair assembly first; do not package the old project.'
    }
    $installed=Get-Command node.exe -ErrorAction SilentlyContinue
    if ($installed) { $script:node=$installed.Source }
    else {
        $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
        $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'win-x64'} 'ARM64' {'win-arm64'} 'X86' {'win-x86'} default {throw "Unsupported architecture: $arch"}}
        $portableNodeDirectory=Get-ChildItem -LiteralPath (Join-Path $cache 'Node22') -Directory -ErrorAction SilentlyContinue |
            Where-Object {$_.Name -match ('^node-v22\.\d+\.\d+-'+[regex]::Escape($platform)+'$') -and (Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') -PathType Leaf)} |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $portableNodeDirectory) {throw 'No Node runtime found. Complete the portable development runtime setup through Apply-Welcome-Repair.bat or install Node.js.'}
        $script:node=Join-Path $portableNodeDirectory.FullName 'node.exe'
    }
    $env:PATH=(Split-Path -Parent $script:node)+';'+$env:PATH
    Write-Host "Using Node: $script:node"
    $config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $updater=Join-Path $root 'tbIDE\Updater\Build\Updater.exe'
    $project=Join-Path $root 'tbIDE\Updater\Updater.twinproj'
    if (-not (Test-Path -LiteralPath $updater -PathType Leaf)) {throw 'Build the Win32 Updater project first.'}
    if ((Get-Item -LiteralPath $updater).LastWriteTimeUtc -lt (Get-Item -LiteralPath $project).LastWriteTimeUtc) {throw 'Updater.exe is older than its canonical project. Build it again.'}
    if ($Action -eq 'Embed') {
        Write-Host "Preparing add-in $($config.addinVersion) with updater $($config.updaterVersion)."
        $before=(Get-FileHash -LiteralPath $updater -Algorithm SHA256).Hash
        $pointer=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics\native-updater-latest.json'
        $start=[DateTime]::UtcNow
        Write-Host 'Running native updater self-tests...'
        $process=Start-Process -FilePath $updater -ArgumentList '-SelfTest' -Wait -PassThru
        if ($process.ExitCode -ne 0) {throw "Updater self-test returned $($process.ExitCode). Check native diagnostics."}
        if (-not (Test-Path -LiteralPath $pointer -PathType Leaf) -or (Get-Item -LiteralPath $pointer).LastWriteTimeUtc -lt $start.AddSeconds(-2)) {throw 'Fresh native self-test report pointer was not found.'}
        $p=Get-Content -LiteralPath $pointer -Raw | ConvertFrom-Json
        $report=Get-Content -LiteralPath $p.results -Raw | ConvertFrom-Json
        $count=@($report.results).Count
        if ($p.failed -ne 0 -or $report.failed -ne 0 -or $report.total -ne $count -or $count -lt 58 -or @($report.results | Where-Object {$_.passed -ne $true}).Count -ne 0) {throw 'Native report is incomplete or contains a failing case.'}
        Write-Host "Native self-tests: $count/$count passed."
        if ((Get-FileHash -LiteralPath $updater -Algorithm SHA256).Hash -ne $before) {throw 'Updater changed during self-tests.'}
        Invoke-NodeChecked -Arguments @('tbIDE/tools/prepare-phase1-bundle.mjs','--updater',$updater)
        Invoke-NodeChecked -Arguments @('tools/validate-tabview-projects.mjs')
        Invoke-NodeChecked -Arguments @('--test','tests/phase1-bundle.test.mjs','tests/phase1-contracts.test.mjs')
        Write-Host 'SUCCESS: Verified updater and themes embedded in canonical add-in.'
        Write-Host 'Reopen tbIDE\tbUI3IDE\tbUI3IDE.twinproj and build BOTH architectures.'
        Write-Host 'Review and commit the changed project, mirrors and helper through GitHub Desktop.'
        Write-Host 'No native no-context startup or live installation acceptance is claimed.'
    } else {
        $dll32=Join-Path $root 'tbIDE\tbUI3IDE\Build\win32\tbUI3IDE.dll'
        $dll64=Join-Path $root 'tbIDE\tbUI3IDE\Build\win64\tbUI3IDE.dll'
        foreach ($dll in @($dll32,$dll64)) {if (-not (Test-Path -LiteralPath $dll -PathType Leaf)) {throw "Build both add-in architectures first. Missing: $dll"}}
        $version=[string]$config.addinVersion
        if ($version -notmatch '^0\.\d+\.\d+\.\d+$') {throw 'This convenience launcher is for development prereleases only.'}
        $output=Join-Path $root ('Build\Release-'+$version)
        if (Test-Path -LiteralPath $output) {$output+='-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')}
        & (Join-Path $PSScriptRoot 'package-updater-release.ps1') -Win32Dll $dll32 -Win64Dll $dll64 -UpdaterExe $updater -MinIdeBuild ([int]$config.minIdeBuild) -MaxIdeBuild ([int]$config.maxIdeBuild) -Channel development -Output $output
        foreach ($name in @("tbUI3IDE-$version.zip",'tbUI3-update.json','SHA256SUMS.txt')) {
            if (-not (Test-Path -LiteralPath (Join-Path $output $name) -PathType Leaf)) {throw "Expected asset missing: $name"}
        }
        Write-Host "SUCCESS: Verified development release assets: $output"
        Write-Host "Tag: tbUI3IDE-v$version (development prerelease). Nothing published."
        Start-Process explorer.exe -ArgumentList ('"'+$output+'"')
    }
    $exitCode=0
} catch {
    Write-Host ('FAILED: '+$_.Exception.Message) -ForegroundColor Red
    if ($_.InvocationInfo.PositionMessage) {Write-Host $_.InvocationInfo.PositionMessage}
    if ($_.ScriptStackTrace) {Write-Host $_.ScriptStackTrace}
    Write-Host 'Inspect the log before continuing. No release was published.'
} finally {
    Write-Host "Log: $log"
    if ($transcribing) {Stop-Transcript | Out-Null}
}
exit $exitCode
