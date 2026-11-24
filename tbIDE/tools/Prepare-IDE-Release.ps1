# Development-only convenience entry point; never installed with the add-in.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidateSet('Embed','Package')][string]$Action)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
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
    $installed=Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $cachedJsdomApi=Join-Path $cache 'jsdom-26.1.0\node_modules\jsdom\lib\api.js'
    $npm=$null
    if ($installed) {
        $script:node=$installed.Source
        $npm=Join-Path (Split-Path -Parent $script:node) 'node_modules\npm\bin\npm-cli.js'
    }
    if (-not $installed -or ($Action -eq 'Embed' -and -not (Test-Path -LiteralPath $cachedJsdomApi -PathType Leaf) -and -not (Test-Path -LiteralPath $npm -PathType Leaf))) {
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
        $script:node=Join-Path $nodeHome.FullName 'node.exe'
        $npm=Join-Path $nodeHome.FullName 'node_modules\npm\bin\npm-cli.js'
    }
    $env:PATH=(Split-Path -Parent $script:node)+';'+$env:PATH
    Write-Host "Using Node: $script:node"
    $config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $updater=Join-Path $root 'tbIDE\Updater\Build\Updater.exe'
    if (-not (Test-Path -LiteralPath $updater -PathType Leaf)) {throw 'Build the Win32 Updater project first.'}
    Invoke-NodeChecked -Arguments @('tbIDE/tools/prepare-phase1-bundle.mjs','--updater',$updater,'--verify-only')
    $pendingSync='tbIDE\tools\pending-addin-sync.json'
    if ((Test-Path -LiteralPath $pendingSync) -and $Action -ne 'Embed') {throw 'Run Prepare-Addin.bat to assemble the pending add-in source before building or packaging.'}
    if ($Action -eq 'Embed') {
        # Reuse the existing pinned, per-user test dependency; install it only if absent.
        if (Test-Path -LiteralPath $cachedJsdomApi -PathType Leaf) {
            $env:TB_JSDOM_MODULE=([uri]::new($cachedJsdomApi)).AbsoluteUri
        } else {
            $deps=Join-Path $cache 'jsdom-26.1.0'
            $null=New-Item -ItemType Directory -Path $deps -Force
            Write-Host 'Preparing the local jsdom regression-test dependency...'
            Invoke-NodeChecked -Arguments @($npm,'install','--prefix',$deps,'--save-exact','--ignore-scripts','--no-audit','--no-fund','--registry=https://registry.npmjs.org/','jsdom@26.1.0')
            if (-not (Test-Path -LiteralPath $cachedJsdomApi -PathType Leaf)) {throw 'Local jsdom installation did not produce the expected module.'}
            $env:TB_JSDOM_MODULE=([uri]::new($cachedJsdomApi)).AbsoluteUri
        }
        Write-Host 'Checking regression-test runtime before changing the project...'
        Invoke-NodeChecked -Arguments @('--input-type=module','-e','const m=await import(process.env.TB_JSDOM_MODULE||String.fromCharCode(106,115,100,111,109)); if(!m.JSDOM)throw new Error()')
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
        if (Test-Path -LiteralPath $pendingSync) {
            $request=Get-Content -LiteralPath $pendingSync -Raw | ConvertFrom-Json
            if ($request.schema -ne 1 -or $request.addinVersion -ne $config.addinVersion -or $request.updaterVersion -ne $config.updaterVersion -or $request.expectedProjectBlob -notmatch '^[0-9a-f]{40}$') {throw 'Invalid pending add-in assembly request.'}
            $packed='tbIDE/tbUI3IDE/tbUI3IDE.twinproj'
            $actual=(& git hash-object -- $packed).Trim()
            if ($LASTEXITCODE -ne 0 -or $actual -ne $request.expectedProjectBlob) {throw 'Canonical add-in changed since the pending assembly request. Do not overwrite it; reconcile the source first.'}
            Write-Host 'Embedding the verified helper before assembling pending add-in source...'
            Invoke-NodeChecked -Arguments @('tbIDE/tools/prepare-phase1-bundle.mjs','--updater',$updater)
            Invoke-NodeChecked -Arguments @('tbIDE/tools/sync-phase1-projects.mjs','--addin-only')
            Remove-Item -LiteralPath $pendingSync
        } else {
            Invoke-NodeChecked -Arguments @('tbIDE/tools/prepare-phase1-bundle.mjs','--updater',$updater)
        }
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
