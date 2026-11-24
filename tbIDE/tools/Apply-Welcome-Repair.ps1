# Local development tools only. No runtime installation or administrator rights.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$cache = Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs = Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
$null = New-Item -ItemType Directory -Path $logs -Force
$log = Join-Path $logs ('WelcomeRepair-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.log')
$exitCode = 1
$transcribing = $false
function Invoke-CheckedNative {
    param([string]$Executable, [string[]]$Arguments)
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $Executable @Arguments 2>&1 | ForEach-Object { Write-Host $_.ToString() }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    if ($code -ne 0) { throw "Command failed ($code): $Executable $($Arguments -join ' ')" }
}
try {
    Start-Transcript -Path $log | Out-Null
    $transcribing = $true
    Set-Location -LiteralPath $root
    $apply = Join-Path $root 'tbIDE\tools\pending-welcome-repair\apply.mjs'
    if (-not (Test-Path -LiteralPath $apply -PathType Leaf)) {
        throw 'No pending Welcome repair found. Check your branch and current version.'
    }
    if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
        $desktop = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
        $git = Get-ChildItem -LiteralPath $desktop -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            ForEach-Object { Join-Path $_.FullName 'resources\app\git\cmd\git.exe' } |
            Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
            Select-Object -First 1
        if (-not $git) { throw 'Git was not found on PATH or in GitHub Desktop.' }
        $env:PATH = (Split-Path -Parent $git) + ';' + $env:PATH
    }
    $branch = & git.exe branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'tbui3-dev') { throw 'Switch to tbui3-dev and pull the latest revision in GitHub Desktop first.' }
    $dirty = & git.exe status --porcelain --untracked-files=no
    if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'The tracked checkout must be clean before assembly. Review GitHub Desktop.' }

    # Use an isolated official portable Node.js 22 LTS runtime. No MSI, PATH
    # persistence, registry writes, global npm packages, or changes to the repo.
    $arch = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
    $platform = switch ($arch.ToUpperInvariant()) {
        'AMD64' { 'win-x64' }
        'ARM64' { 'win-arm64' }
        'X86'   { 'win-x86' }
        default { throw "Unsupported Windows architecture: $arch" }
    }
    $nodeCache = Join-Path $cache 'Node22'
    $null = New-Item -ItemType Directory -Path $nodeCache -Force
    $nodeHome = Get-ChildItem -LiteralPath $nodeCache -Directory -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -match ('^node-v22\.\d+\.\d+-' + [regex]::Escape($platform) + '$') -and
            (Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') -PathType Leaf) -and
            (Test-Path -LiteralPath (Join-Path $_.FullName 'node_modules\npm\bin\npm-cli.js') -PathType Leaf)
        } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $nodeHome) {
        Write-Host 'Downloading portable Node.js 22 LTS from nodejs.org...'
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $releases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
        $release = $releases | Where-Object {
            $_.version -match '^v22\.\d+\.\d+$' -and $_.lts -and $_.files -contains ($platform + '-zip')
        } | Select-Object -First 1
        if (-not $release) { throw "No official Node.js 22 LTS ZIP found for $platform." }
        $name = 'node-' + $release.version + '-' + $platform
        $zipName = $name + '.zip'
        $base = 'https://nodejs.org/dist/' + $release.version
        $stage = Join-Path $cache ('download-' + [guid]::NewGuid().ToString('N'))
        $null = New-Item -ItemType Directory -Path $stage
        try {
            $zip = Join-Path $stage $zipName
            $sums = Join-Path $stage 'SHASUMS256.txt'
            Invoke-WebRequest -UseBasicParsing -Uri ($base + '/SHASUMS256.txt') -OutFile $sums
            $pattern = '^([a-fA-F0-9]{64})\s+\*?' + [regex]::Escape($zipName) + '$'
            $matchesForZip = @(Get-Content -LiteralPath $sums | Where-Object { $_ -match $pattern })
            if ($matchesForZip.Count -ne 1) { throw 'Official Node.js checksum entry missing or ambiguous.' }
            $expected = ($matchesForZip[0] -split '\s+')[0]
            Invoke-WebRequest -UseBasicParsing -Uri ($base + '/' + $zipName) -OutFile $zip
            if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $expected) {
                throw 'Portable Node.js download failed SHA-256 verification.'
            }
            Write-Host 'Node.js archive verified. Extracting to the local development cache...'
            Expand-Archive -LiteralPath $zip -DestinationPath $stage
            $extracted = Join-Path $stage $name
            if (-not (Test-Path -LiteralPath (Join-Path $extracted 'node.exe') -PathType Leaf)) { throw 'Node executable missing from verified archive.' }
            $destination = Join-Path $nodeCache $name
            if (Test-Path -LiteralPath $destination) { throw "Incomplete Node.js cache exists: $destination" }
            Move-Item -LiteralPath $extracted -Destination $destination
            $nodeHome = Get-Item -LiteralPath $destination
        } finally {
            Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    $node = Join-Path $nodeHome.FullName 'node.exe'
    $npm = Join-Path $nodeHome.FullName 'node_modules\npm\bin\npm-cli.js'
    $env:PATH = $nodeHome.FullName + ';' + $env:PATH
    Write-Host "Portable Node.js: $node"
    Invoke-CheckedNative -Executable $node -Arguments @('--version')

    # ESM cannot rely on NODE_PATH. Supply the exact cached module as a file URL
    # to the existing TB_JSDOM_MODULE test contract, including child test runs.
    $deps = Join-Path $cache 'jsdom-26.1.0'
    $null = New-Item -ItemType Directory -Path $deps -Force
    $api = Join-Path $deps 'node_modules\jsdom\lib\api.js'
    $manifest = Join-Path $deps 'node_modules\jsdom\package.json'
    $installed = $false
    if ((Test-Path -LiteralPath $api) -and (Test-Path -LiteralPath $manifest)) {
        $installed = ((Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json).version -eq '26.1.0')
    }
    if (-not $installed) {
        Write-Host 'Preparing the local jsdom regression-test dependency...'
        Push-Location -LiteralPath $deps
        try {
            Invoke-CheckedNative -Executable $node -Arguments @($npm, 'install', '--prefix', $deps, '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/', 'jsdom@26.1.0')
        } finally { Pop-Location }
    }
    $env:TB_JSDOM_MODULE = ([uri]::new($api)).AbsoluteUri
    Invoke-CheckedNative -Executable $node -Arguments @('--input-type=module', '-e', 'const m=await import(process.env.TB_JSDOM_MODULE); if(!m.JSDOM)throw new Error()')
    Write-Host 'Applying and validating tbUI3IDE 0.4.0.3...'
    Invoke-CheckedNative -Executable $node -Arguments @($apply, '--commit-push')
    $exitCode = 0
    Write-Host 'SUCCESS: Assembly and automated validation completed.'
    Write-Host 'Open the updated add-in project and build both architectures.'
} catch {
    Write-Host ('FAILED: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Check the log and GitHub Desktop. Do not publish a failed candidate.'
} finally {
    Write-Host "Log: $log"
    if ($transcribing) { Stop-Transcript | Out-Null }
}
exit $exitCode
