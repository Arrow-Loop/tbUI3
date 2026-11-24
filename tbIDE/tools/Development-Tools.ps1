[CmdletBinding()]
param([string]$IdePath)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $root
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
$null=New-Item -ItemType Directory -Path $cache,$logs -Force
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$sessionLog=Join-Path $logs "Development-$stamp.log"
$prep=Join-Path $PSScriptRoot 'Prepare-IDE-Release.ps1'
$publisher=Join-Path $PSScriptRoot 'Publish-IDE-Release.ps1'
$upProject='tbIDE/Updater/Updater.twinproj'
$upExe='tbIDE/Updater/Build/Updater.exe'
$addinProject='tbIDE/tbUI3IDE/tbUI3IDE.twinproj'
$branch='tbui3-dev'
$harnessCommit='d7a800dc341f2ba74724bae10148f956d1efbf2b'
$generated=@($upExe,$addinProject,'tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-updater.payload','tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-dark.theme','tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-light.theme','tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-bundle.json','tbIDE/tools/pending-addin-sync.json')
$sha=[Security.Cryptography.SHA256]::Create()
try {$key=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($root.ToLowerInvariant())))).Replace('-','').ToLowerInvariant()} finally {$sha.Dispose()}
$receipt=Join-Path $cache "generated-$key.json"
$packageReceipt=Join-Path $cache "package-$key.json"
function Say([string]$message,[string]$color='Gray') {
    Write-Host $message -ForegroundColor $color
    if (!(Test-Path -LiteralPath $logs)) {$null=New-Item -ItemType Directory -Path $logs -Force}
    Add-Content -LiteralPath $sessionLog -Value ((Get-Date -Format 'HH:mm:ss.fff')+' '+$message)
}
function Run-Child([string]$file,[string[]]$arguments) {
    & $file @arguments | Out-Host
    if ($LASTEXITCODE -ne 0) {throw "$([IO.Path]::GetFileName($file)) failed ($LASTEXITCODE). See Diagnostics."}
}
function Run-Prep([string[]]$arguments) {
    Run-Child 'powershell.exe' (@('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',$prep)+$arguments)
}
function Find-Git {
    $cmd=Get-Command git.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) {return $cmd.Source}
    $desktop=Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
    $candidate=Get-ChildItem -LiteralPath $desktop -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | ForEach-Object {Join-Path $_.FullName 'resources\app\git\cmd\git.exe'} |
        Where-Object {Test-Path -LiteralPath $_ -PathType Leaf} | Select-Object -First 1
    if (!$candidate) {throw 'Git was not found. Install GitHub Desktop or Git.'}
    return $candidate
}
function Git-Output([string[]]$arguments) {
    $lines=@(& $script:git @arguments)
    if ($LASTEXITCODE -ne 0) {throw "Git command failed: $($arguments -join ' ')"}
    return $lines
}
function Find-Node {
    $cmd=Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) {
        $v=& $cmd.Source --version
        if ($LASTEXITCODE -eq 0 -and $v -match '^v(2[2-9]|[3-9][0-9])\.') {return $cmd.Source}
    }
    $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
    $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'win-x64'} 'ARM64' {'win-arm64'} 'X86' {'win-x86'} default {throw 'Unsupported Windows architecture.'}}
    $nodeHome=Get-ChildItem -LiteralPath (Join-Path $cache 'Node22') -Directory -ErrorAction SilentlyContinue |
        Where-Object {$_.Name -match ('^node-v22\.\d+\.\d+-'+[regex]::Escape($platform)+'$') -and (Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') -PathType Leaf)} |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$nodeHome) {throw 'Node 22 bootstrap did not produce the expected executable.'}
    return (Join-Path $nodeHome.FullName 'node.exe')
}
function Assert-Closed {
    $running=@(Get-Process | Where-Object {$_.ProcessName -match '^(twinBASIC|tbcompiler)(?:$|[_-])'})
    if ($running.Count) {throw 'Close twinBASIC and its compiler processes before an unattended build. No processes were terminated.'}
}
function Resolve-Ide([int]$build) {
    $pathFile=Join-Path $cache 'build-ide.txt'
    $candidates=@($IdePath,$env:TB_IDE)
    if (Test-Path -LiteralPath $pathFile) {$candidates+=Get-Content -LiteralPath $pathFile -TotalCount 1}
    foreach ($base in @((Split-Path -Parent $root),[Environment]::GetFolderPath('Desktop'),(Join-Path $env:SystemDrive 'twinBasic'))) {
        if (!$base) {continue}
        foreach ($folder in @("tb$build","twinBASIC_IDE_BETA_$build")) {$candidates+=Join-Path $base "$folder\twinBASIC.exe"}
    }
    $command=Get-Command twinBASIC.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) {$candidates+=$command.Source}
    foreach ($candidate in $candidates) {
        if (!$candidate) {continue}
        if (Test-Path -LiteralPath $candidate -PathType Container) {$candidate=Join-Path $candidate 'twinBASIC.exe'}
        if (!(Test-Path -LiteralPath $candidate -PathType Leaf)) {continue}
        $info=Join-Path (Split-Path -Parent $candidate) 'ide\build.js'
        if ((Test-Path -LiteralPath $info -PathType Leaf) -and ((Get-Content -LiteralPath $info -Raw) -match ("twinBASIC IDE BETA "+$build+"\b"))) {
            $candidate=(Resolve-Path -LiteralPath $candidate).Path
            Set-Content -LiteralPath $pathFile -Value $candidate -Encoding UTF8
            return $candidate
        }
    }
    Write-Host "Locate the installed BETA $build twinBASIC.exe once."
    Add-Type -AssemblyName System.Windows.Forms
    $picker=New-Object Windows.Forms.OpenFileDialog
    $picker.Title="Select twinBASIC BETA $build"
    $picker.Filter='twinBASIC IDE (twinBASIC.exe)|twinBASIC.exe'
    try {
        if ($picker.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) {throw 'No build IDE selected.'}
        $candidate=$picker.FileName
    } finally {$picker.Dispose()}
    $info=Join-Path (Split-Path -Parent $candidate) 'ide\build.js'
    if (!(Test-Path -LiteralPath $info -PathType Leaf) -or (Get-Content -LiteralPath $info -Raw) -notmatch ("twinBASIC IDE BETA "+$build+"\b")) {throw "Selected IDE is not BETA $build."}
    Set-Content -LiteralPath $pathFile -Value $candidate -Encoding UTF8
    return $candidate
}
function Initialize-Harness {
    $harnessHome=Join-Path $cache ("CDP-"+$harnessCommit)
    if (!(Test-Path -LiteralPath (Join-Path $harnessHome '.git'))) {
        Say 'Caching the pinned twinBASIC CDP build harness...'
        $stage=Join-Path $cache ('cdp-download-'+[guid]::NewGuid().ToString('N'))
        $null=New-Item -ItemType Directory -Path $stage
        try {
            Run-Child $script:git @('-C',$stage,'init','--quiet')
            Run-Child $script:git @('-C',$stage,'config','core.autocrlf','false')
            Run-Child $script:git @('-C',$stage,'remote','add','origin','https://github.com/twinbasic/documentation.git')
            Run-Child $script:git @('-C',$stage,'fetch','--quiet','--depth=1','origin',$harnessCommit)
            Run-Child $script:git @('-C',$stage,'sparse-checkout','set','--no-cone','/scripts/','/lib/','/test/harness.json','/LICENSE','/package.json')
            Run-Child $script:git @('-C',$stage,'checkout','--quiet','--detach',$harnessCommit)
            if (Test-Path -LiteralPath $harnessHome) {throw 'Incomplete CDP cache exists; inspect the cache.'}
            Move-Item -LiteralPath $stage -Destination $harnessHome
        } finally {if (Test-Path -LiteralPath $stage) {Remove-Item -LiteralPath $stage -Recurse -Force}}
    }
    if ((Git-Output @('-C',$harnessHome,'rev-parse','HEAD')) -cne $harnessCommit -or @(Git-Output @('-C',$harnessHome,'status','--porcelain','--untracked-files=all')).Count) {throw 'Cached CDP harness differs from its pinned upstream commit.'}
    if (!(Test-Path -LiteralPath (Join-Path $harnessHome 'scripts\lib\tb-build.mjs') -PathType Leaf)) {throw 'CDP harness cache is incomplete.'}
    return $harnessHome
}
function Changed-Paths {
    @( @(Git-Output @('diff','--no-renames','--name-only','HEAD','--')) + @(Git-Output @('diff','--cached','--no-renames','--name-only','--')) + @(Git-Output @('ls-files','--others','--exclude-standard')) | Sort-Object -Unique )
}
function Fingerprint([string[]]$paths) {
    foreach ($p in ($paths | Sort-Object)) {
        if ($p -cnotin $generated) {throw "Source change outside generated release inputs: $p"}
        $hash=if (Test-Path -LiteralPath $p -PathType Leaf) {(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash} else {'DELETED'}
        "$p=$hash"
    }
}
function Assert-Checkout {
    $origin=Git-Output @('remote','get-url','origin')
    if ($origin -notmatch '^(https://github\.com/Arrow-Loop/tbUI3(?:\.git)?/?|git@github\.com:Arrow-Loop/tbUI3(?:\.git)?|ssh://git@github\.com/Arrow-Loop/tbUI3(?:\.git)?)$' -or (Git-Output @('branch','--show-current')) -cne $branch) {throw "Use the Arrow-Loop/tbUI3 $branch checkout."}
    $head=Git-Output @('rev-parse','HEAD')
    $paths=@(Changed-Paths)
    if ($paths.Count) {
        $current=@(Fingerprint $paths)
        if (!(Test-Path -LiteralPath $receipt -PathType Leaf)) {throw 'Uncommitted source changes exist. Review them in GitHub Desktop first.'}
        $prior=Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json
        if ($prior.head -cne $head -or ($current -join '|') -cne (@($prior.files) -join '|')) {throw 'Uncommitted changes do not match the previous tool-generated checkpoint. Review them in GitHub Desktop.'}
    }
    return $head
}
function Save-Generated([string]$head) {
    if ((Git-Output @('rev-parse','HEAD')) -cne $head) {throw 'Source commit changed while building.'}
    $paths=@(Changed-Paths)
    if (!$paths.Count) {if (Test-Path -LiteralPath $receipt) {Remove-Item -LiteralPath $receipt};return}
    $files=@(Fingerprint $paths)
    @{head=$head;files=$files} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $receipt -Encoding UTF8
}
function Package-Fingerprint([string]$package) {
    $config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $names=@("tbUI3IDE-$($config.addinVersion).zip",'tbUI3-update.json','SHA256SUMS.txt')
    $paths=@($upProject,$addinProject,$upExe,'tbIDE/tbUI3IDE/Build/win32/tbUI3IDE.dll','tbIDE/tbUI3IDE/Build/win64/tbUI3IDE.dll')
    foreach ($name in $names) {$paths+=Join-Path $package $name}
    foreach ($p in $paths) {
        if (!(Test-Path -LiteralPath $p -PathType Leaf)) {throw "Verified package input is missing: $p"}
        "$p=$((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash)"
    }
}
function Save-Package([string]$package,[string]$head) {
    Save-Generated $head
    @{head=$head;package=$package;files=@(Package-Fingerprint $package)} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $packageReceipt -Encoding UTF8
}
function Package-Existing {
    $head=Assert-Checkout
    $config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $output=Join-Path $root ("Build\Release-"+$config.addinVersion+"-"+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    Run-Prep @('-Action','Package','-OutputDirectory',$output,'-NoExplorer')
    Save-Package $output $head
    Say "SUCCESS: $output" Green
    return $output
}
function Sync-ForPublication {
    $head=Assert-Checkout
    Run-Child $script:git @('fetch','--quiet','origin',$branch)
    & $script:git merge-base --is-ancestor FETCH_HEAD HEAD
    if ($LASTEXITCODE -ne 0) {throw 'Remote source advanced. Pull/reconcile in GitHub Desktop before publishing.'}
    if ((Git-Output @('rev-parse','HEAD')) -cne $head) {throw 'Local source advanced while preparing publication.'}
    $paths=@(Changed-Paths)
    if ($paths.Count) {
        Run-Child $script:git (@('add','-A','--')+$paths)
        Run-Child $script:git (@('commit','-m','Prepare verified native release payloads','--')+$paths)
        if (Test-Path -LiteralPath $receipt) {Remove-Item -LiteralPath $receipt}
    }
    Run-Child $script:git @('push','origin',"HEAD:refs/heads/$branch")
}
function Build-One([string]$project,[string]$arch,[string]$destination) {
    $report=Join-Path $logs ("CDP-"+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+"-"+[IO.Path]::GetFileNameWithoutExtension($project)+"-$arch.json")
    Say "Building $([IO.Path]::GetFileName($project)) $arch via CDP..."
    & $script:node (Join-Path $PSScriptRoot 'build-with-cdp.mjs') $script:harness $script:ide $project $arch $destination $report ([string]$script:config.maxIdeBuild) | Out-Host
    if ($LASTEXITCODE -ne 0) {throw "Native build failed. See $report"}
    Say "Built $arch : $destination" Green
}
function Build-Package {
    Assert-Closed
    $head=Assert-Checkout
    $script:config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $script:ide=Resolve-Ide ([int]$script:config.maxIdeBuild)
    Say "Using BETA $($script:config.maxIdeBuild): $script:ide"
    Run-Prep @('-Action','Bootstrap')
    $script:node=Find-Node
    $env:PATH=(Split-Path -Parent $script:node)+';'+$env:PATH
    $script:harness=Initialize-Harness
    $manifestPath='tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-bundle.json'
    $reuse=$false
    if ((Test-Path -LiteralPath $upExe -PathType Leaf) -and (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        $payload=@($manifest.resources | Where-Object {$_.id -ceq 'updater'})
        if ($payload.Count -eq 1 -and $manifest.updaterProjectSha256 -ieq (Get-FileHash -LiteralPath $upProject -Algorithm SHA256).Hash -and $payload[0].sha256 -ieq (Get-FileHash -LiteralPath $upExe -Algorithm SHA256).Hash -and $payload[0].version -ceq $script:config.updaterVersion) {
            & $script:node 'tbIDE/tools/prepare-phase1-bundle.mjs' --updater $upExe --verify-only | Out-Host
            $reuse=$LASTEXITCODE -eq 0
        }
    }
    if ($reuse) {Say 'Updater unchanged; reusing the verified native helper.' Green}
    else {Build-One $upProject 'win32' $upExe;Save-Generated $head}
    Say 'Preparing and verifying embedded resources...'
    Run-Prep @('-Action','Embed')
    Save-Generated $head
    Build-One $addinProject 'win32' 'tbIDE/tbUI3IDE/Build/win32/tbUI3IDE.dll'
    Build-One $addinProject 'win64' 'tbIDE/tbUI3IDE/Build/win64/tbUI3IDE.dll'
    $output=Join-Path $root ("Build\Release-"+$script:config.addinVersion+"-"+(Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    Run-Prep @('-Action','Package','-OutputDirectory',$output,'-NoExplorer')
    Save-Package $output $head
    Say "SUCCESS: $output" Green
    return $output
}
function Publish([string]$package='') {
    $head=Assert-Checkout
    if (@(Changed-Paths).Count) {
        if (!(Test-Path -LiteralPath $packageReceipt -PathType Leaf)) {throw 'Package the current native builds before synchronizing generated source.'}
        $proof=Get-Content -LiteralPath $packageReceipt -Raw | ConvertFrom-Json
        if (!$package) {$package=[string]$proof.package}
        if ($proof.head -cne $head -or $proof.package -cne $package -or (@(Package-Fingerprint $package) -join '|') -cne (@($proof.files) -join '|')) {throw 'Generated source or package changed since verified packaging. Package the current native builds again.'}
    }
    Sync-ForPublication
    $arguments=@('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',$publisher)
    if ($package) {$arguments+=@('-PackageDirectory',$package)}
    # Do not capture device login codes in an outer transcript.
    & 'powershell.exe' @arguments
    if ($LASTEXITCODE -ne 0) {throw 'Publication stopped. See the Publish diagnostic log.'}
}
$mutex=[Threading.Mutex]::new($false,("Local\tbUI3-Development-"+$key))
$locked=$false
try {
    try {$locked=$mutex.WaitOne(0)} catch [Threading.AbandonedMutexException] {$locked=$true}
    if (!$locked) {throw 'Development Tools is already running for this checkout.'}
    while ($true) {
        Write-Host ''
        Write-Host 'tbUI3IDE DEVELOPMENT TOOLS' -ForegroundColor Cyan
        Write-Host '  1  Build, package and offer publication (sync generated inputs)'
        Write-Host '  2  Build and package only'
        Write-Host '  3  Publish existing package (sync generated inputs)'
        Write-Host '  4  Reset test state'
        Write-Host '  5  Prepare add-in only'
        Write-Host '  6  Package existing native builds'
        Write-Host '  L  Open Diagnostics'
        Write-Host '  Q  Quit'
        $choice=(Read-Host 'Choose an option').Trim().ToUpperInvariant()
        if ($choice -eq 'Q') {break}
        try {
            if ($choice -eq 'L') {Invoke-Item -LiteralPath $logs;continue}
            if ($choice -eq '4') {& (Join-Path $root 'tbIDE\Reset-TestState.bat');continue}
            if ($choice -notin @('1','2','3','5','6')) {continue}
            $script:git=Find-Git
            $env:PATH=(Split-Path -Parent $script:git)+';'+$env:PATH
            switch ($choice) {
                '1' {$package=Build-Package;Publish $package}
                '2' {$package=Build-Package;Invoke-Item -LiteralPath $package}
                '3' {Publish}
                '5' {Assert-Closed; $head=Assert-Checkout;Run-Prep @('-Action','Embed');Save-Generated $head}
                '6' {$package=Package-Existing;Invoke-Item -LiteralPath $package}
            }
        } catch {Say ("FAILED: "+$_.Exception.Message) Red; if ($_.ScriptStackTrace) {Add-Content -LiteralPath $sessionLog -Value $_.ScriptStackTrace}}
        Write-Host "Diagnostics: $logs"
    }
} finally {if ($locked) {$mutex.ReleaseMutex()};$mutex.Dispose()}
