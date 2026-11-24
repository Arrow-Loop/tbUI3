@echo off
setlocal DisableDelayedExpansion
title twinBASIC / tbUI3IDE Test Reset
set "TB_RESET_SCRIPT=%~f0"
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference='Stop'; $s=[IO.File]::ReadAllText($env:TB_RESET_SCRIPT); $m='### POWERSHELL PAYLOAD ###'; $i=$s.LastIndexOf($m); if($i -lt 0){throw 'Missing reset script payload'}; & ([scriptblock]::Create($s.Substring($i+$m.Length)))"
set "TB_RESET_EXIT=%errorlevel%"
if not "%TB_RESET_EXIT%"=="0" pause
exit /b %TB_RESET_EXIT%
### POWERSHELL PAYLOAD ###
$ErrorActionPreference = 'Stop'
$local = [Environment]::GetFolderPath('LocalApplicationData')
$roam = [Environment]::GetFolderPath('ApplicationData')
if (!$local -or !$roam) { throw 'Cannot locate the current user profile.' }
$tb = Join-Path $roam 'twinBASIC'
$base = Join-Path $local 'tbUI3'
$up = Join-Path $base 'Updater'
$inst = Join-Path $up 'Installations'
$backupRoot = Join-Path $base 'ResetBackups'
$reg = 'Software\VB and VBA Program Settings\'
$native = $reg + 'twinBASIC_IDE\IDESettings'
$appearance = $reg + 'WinUI3IdeStyle\Options'
$legacy = $reg + 'tbUI3Updater\Options'
$nativeNames = @('GENERAL','GENERAL2','LAYOUTv2','ACTIVE_PANEL_LAYOUT_NAME','CUSTOM_PANEL_LAYOUTS','CUSTOM_KEYBOARD_SHORTCUT_GROUPS','ACTIVE_KEYBOARD_SHORTCUT_GROUPS','NEWFRONTPAGE','OBJECT_BROWSER')
$themes = @('WinUI3 Dark.theme','WinUI3 Light.theme')
$cacheNames = @('twinBASIC','twinBASIC_Admin','twinBASIC_WebPanel','twinBASIC_WebPanel_Admin')
$backup = $null

function Assert-Closed {
    $running = @(Get-Process | Where-Object {
        if ($_.ProcessName -match '^(twinBASIC|tbcompiler)(?:$|[_-])') { return $true }
        if ($_.ProcessName -ieq 'Updater') {
            try { $p = $_.Path } catch { $p = $null }
            return (!$p -or $p.StartsWith($up + '\', [StringComparison]::OrdinalIgnoreCase))
        }
        return $false
    })
    if ($running.Count) {
        throw ('Close all twinBASIC and tbUI3 updater processes first: ' + (($running | ForEach-Object { $_.ProcessName + ' (' + $_.Id + ')' }) -join ', '))
    }
}

# Refuse links rather than following them during a reset.
function Assert-NoLinks([string]$path, [switch]$Tree) {
    if (!(Test-Path -LiteralPath $path)) { return }
    $item = Get-Item -LiteralPath $path -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point refused: $path" }
    if ($Tree -and $item.PSIsContainer) {
        foreach ($child in Get-ChildItem -LiteralPath $path -Force) {
            Assert-NoLinks $child.FullName -Tree
        }
    }
}

function Assert-RecoverySafe {
    if (!(Test-Path -LiteralPath $inst)) { return }
    Assert-NoLinks $inst -Tree
    foreach ($installation in Get-ChildItem -LiteralPath $inst -Directory -Force) {
        $sessions = Join-Path $installation.FullName 'Sessions'
        $marker = Join-Path $installation.FullName 'active.json'
        if (Test-Path -LiteralPath $marker) {
            $active = Get-Content -LiteralPath $marker -Raw | ConvertFrom-Json
            if (!$active.journal -or !$active.context) { throw "Unreadable active marker: $marker. Recover before resetting." }
            $journal = [IO.Path]::GetFullPath([string]$active.journal)
            $prefix = [IO.Path]::GetFullPath($sessions).TrimEnd('\') + '\'
            if (!$journal.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($journal) -ne 'journal.json') { throw "Unexpected recovery path: $marker" }
            if (!(Test-Path -LiteralPath $journal -PathType Leaf)) {
                # A normal pre-write cancellation can leave an active marker but no journal.
                $statePath = Join-Path ([IO.Path]::GetDirectoryName($journal)) 'state.json'
                if (!(Test-Path -LiteralPath $statePath -PathType Leaf)) { throw "Missing recovery journal: $marker" }
                $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
                if ($state.status -ne 'cancelled') { throw "Missing recovery journal: $marker" }
            }
        }
        if (Test-Path -LiteralPath $sessions) {
            foreach ($j in Get-ChildItem -LiteralPath $sessions -Filter 'journal.json' -File -Recurse -Force) {
                $record = Get-Content -LiteralPath $j.FullName -Raw | ConvertFrom-Json
                if ($record.status -notin @('complete','rolledBack')) {
                    throw "Unfinished transaction ($($record.status)): $($j.FullName). Use updater recovery before resetting."
                }
            }
        }
    }
}

function Start-Backup {
    Assert-NoLinks $base
    Assert-NoLinks $backupRoot
    $path = Join-Path $backupRoot ((Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8))
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    return $path
}

function Archive-Path([string]$source, [string]$relative) {
    if (!(Test-Path -LiteralPath $source)) { Write-Host "  Not present: $source"; return }
    Assert-Closed
    $parent = Split-Path -Parent $source
    while ($parent -and $parent -ne $local -and $parent -ne $roam) {
        Assert-NoLinks $parent
        $next = Split-Path -Parent $parent
        if ($next -eq $parent) { break }
        $parent = $next
    }
    Assert-NoLinks $source -Tree
    $dest = Join-Path $backup $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
    Move-Item -LiteralPath $source -Destination $dest
    Add-Content -LiteralPath (Join-Path $backup 'archived-paths.txt') -Value ("$dest -> $source") -Encoding UTF8
    Write-Host "  Archived: $source"
}

# Back up only the selected registry values, not the entire native IDE key
# (which contains licence and package-publishing credentials).
function Reset-Reg([string]$subkey, [string[]]$names, [string]$label) {
    Assert-Closed
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($subkey,$true)
    if (!$key) { Write-Host "  Not present: HKCU\$subkey"; return }
    try {
        $existing = @($key.GetValueNames())
        if ($names.Count -eq 1 -and $names[0] -eq '*') { $names = $existing }
        $values = @($names | Where-Object { $existing -contains $_ } | ForEach-Object {
            [pscustomobject]@{Name=$_; Kind=$key.GetValueKind($_).ToString(); Value=$key.GetValue($_,$null,[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)}
        })
        if (!$values.Count) { Write-Host "  No selected values: HKCU\$subkey"; return }
        [pscustomobject]@{Subkey=$subkey; Values=$values} | Export-Clixml -LiteralPath (Join-Path $backup ($label + '.clixml'))
        foreach ($v in $values) { $key.DeleteValue($v.Name,$false); Write-Host "  Reset: $($v.Name)" }
    } finally { $key.Dispose() }
}

function Reset-Native {
    Reset-Reg $native $nativeNames 'native-options'
    Reset-Reg ($reg + 'twinBASIC_IDE\Window') @('*') 'native-window'
}
function Reset-Welcome { Archive-Path (Join-Path $up 'Shared\welcome.json') 'Updater\Shared\welcome.json' }
function Reset-Addin { Reset-Reg $appearance @('*') 'addin-options'; Reset-Welcome }
function Reset-Updater {
    Reset-Reg $legacy @('*') 'legacy-updater-options'
    Archive-Path $inst 'Updater\Installations'
}
function Reset-Themes {
    foreach ($name in $themes) { Archive-Path (Join-Path $tb ('themes\' + $name)) ('Roaming\themes\' + $name) }
}
function Reset-Caches {
    foreach ($name in $cacheNames) { Archive-Path (Join-Path $local $name) ('Local\' + $name) }
}
function Remove-Addins {
    foreach ($arch in @('win32','win64')) {
        foreach ($name in @('tbUI3IDE.dll','WinUI3IdeStyle.dll','TabViewDesigner.dll')) {
            $relative = 'addins\' + $arch + '\' + $name
            Archive-Path (Join-Path $tb $relative) ('Roaming\' + $relative)
        }
    }
}

while ($true) {
    Clear-Host
    Write-Host 'twinBASIC / tbUI3IDE TEST RESET' -ForegroundColor Cyan
    Write-Host "User: $env:USERNAME | All installed IDE roots share some settings."
    Write-Host 'Close all IDEs and updater windows before resetting. Changes are backed up.'
    Write-Host ''
    Write-Host '  1  Reset native IDE options, layouts, shortcuts and window'
    Write-Host '  2  Reset tbUI3IDE appearance preferences and Welcome Wizard'
    Write-Host '  3  Reset updater preferences, sessions and installation state (all roots)'
    Write-Host '  4  Reset Welcome Wizard only'
    Write-Host '  5  Remove our WinUI3 Light and Dark themes (shared copies)'
    Write-Host '  6  FULL test reset (keep add-in DLLs; remove helper, themes and caches)'
    Write-Host '  7  Remove shared tbUI3IDE and legacy add-in DLLs'
    Write-Host '  8  Clear native IDE WebView2 caches only'
    Write-Host '  9  Archive tbUI3 diagnostic logs'
    Write-Host '  B  Open backup folder'
    Write-Host '  Q  Quit'
    $choice = (Read-Host 'Choose an option').Trim().ToUpperInvariant()
    if ($choice -eq 'Q') { break }
    if ($choice -eq 'B') {
        if (Test-Path -LiteralPath $backupRoot) { Invoke-Item -LiteralPath $backupRoot }
        else { Write-Host 'No backups yet.'; [void](Read-Host 'Press Enter') }
        continue
    }
    if ($choice -notin @('1','2','3','4','5','6','7','8','9')) { continue }
    Write-Host 'Projects, licence, publishing credentials, installed packages and unrelated themes are preserved.'
    if ($choice -eq '6') { Write-Host 'FULL: Shared DLLs remain installed so bootstrap can recreate the helper and themes. All updater state is archived.' -ForegroundColor Yellow }
    if ($choice -in @('3','6')) { Write-Host 'All registered IDE roots are affected. Incomplete recovery journals block this reset.' -ForegroundColor Yellow }
    if ($choice -eq '7') { Write-Host 'Only the shared per-user DLLs are removed; portable IDE-local copies are untouched.' -ForegroundColor Yellow }
    $backup = $null
    try {
        Assert-Closed
        Assert-NoLinks $base; Assert-NoLinks $up; Assert-NoLinks $tb
        if ($choice -in @('3','6')) { Assert-RecoverySafe }
        if ($choice -eq '6') { Assert-NoLinks $up -Tree }
        $backup = Start-Backup
        switch ($choice) {
            '1' { Reset-Native }
            '2' { Reset-Addin }
            '3' { Reset-Updater }
            '4' { Reset-Welcome }
            '5' { Reset-Themes }
            '6' { Reset-Native; Reset-Reg $appearance @('*') 'addin-options'; Reset-Reg $legacy @('*') 'legacy-updater-options'; Archive-Path $up 'Updater'; Reset-Themes; Reset-Caches }
            '7' { Remove-Addins }
            '8' { Reset-Caches }
            '9' { Archive-Path (Join-Path $base 'Diagnostics') 'Diagnostics' }
        }
        Write-Host "Reset complete. Backup: $backup" -ForegroundColor Green
    } catch {
        Write-Host "RESET STOPPED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.InvocationInfo.PositionMessage) { Write-Host $_.InvocationInfo.PositionMessage }
        if ($_.ScriptStackTrace) { Write-Host $_.ScriptStackTrace }
        if ($backup) { Write-Host "Any completed changes are preserved in: $backup" }
        Write-Host 'Do not proceed with a fresh-install test until the issue is resolved.'
    }
    [void](Read-Host 'Press Enter to return to the menu')
}
