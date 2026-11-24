# Development-only publishing tool; never distributed with the updater.
[CmdletBinding()]
param([string]$PackageDirectory)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$repository='Arrow-Loop/tbUI3'
$branch='tbui3-dev'
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs=Join-Path $cache 'Logs'
$null=New-Item -ItemType Directory -Path $logs -Force
$log=Join-Path $logs ('Publish-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'.log')
$work=$null
$exitCode=1
$transcribing=$false
$publishAttempted=$false
$draftUrl=''
function Run-Checked([string]$Executable,[string[]]$Arguments) {
    $old=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $lines=@(& $Executable @Arguments 2>&1)
        $code=$LASTEXITCODE
    } finally {$ErrorActionPreference=$old}
    if ($code -ne 0) {
        $lines | ForEach-Object {Write-Host $_.ToString()}
        throw "External command failed ($code): $($Arguments -join ' ')"
    }
    foreach ($line in $lines) {
        if ($line -is [System.Management.Automation.ErrorRecord]) {Write-Host $line.ToString()}
        else {Write-Output $line.ToString()}
    }
}
function Gh([string[]]$Arguments) {Run-Checked $script:gh $Arguments}
function Git([string[]]$Arguments) {Run-Checked $script:git $Arguments}
function Api([string]$Endpoint) {((Gh @('api','--hostname','github.com',$Endpoint)) -join [Environment]::NewLine) | ConvertFrom-Json}
function File-Hash([string]$Path) {(Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()}
function Assert-Account {
    $account=Api 'user'
    if ($account.login -ne 'Arrow-Loop' -or $account.id -ne 5251546) {
        throw "Wrong GitHub account: $($account.login). Run gh auth switch --hostname github.com --user Arrow-Loop, or gh auth login --hostname github.com --web."
    }
    $remoteRepo=Api "repos/$repository"
    if ($remoteRepo.full_name -ine $repository -or $remoteRepo.permissions.push -ne $true) {throw 'Required repository write permission was not verified.'}
}
function Assert-Synchronized([string]$ExpectedCommit='') {
    $origin=Git @('remote','get-url','origin')
    if ($origin -notmatch '^(https://github\.com/Arrow-Loop/tbUI3(?:\.git)?/?|git@github\.com:Arrow-Loop/tbUI3(?:\.git)?|ssh://git@github\.com/Arrow-Loop/tbUI3(?:\.git)?)$') {throw 'Origin must be Arrow-Loop/tbUI3 on github.com.'}
    if ((Git @('branch','--show-current')) -cne $branch) {throw "Switch GitHub Desktop to $branch first."}
    if (@(Git @('status','--porcelain=v1','--untracked-files=normal')).Count -ne 0) {throw 'Commit and push all source changes with GitHub Desktop first.'}
    $localCommit=Git @('rev-parse','HEAD')
    $remoteCommit=(Api "repos/$repository/git/ref/heads/$branch").object.sha
    if ($localCommit -notmatch '^[0-9a-f]{40}$' -or $localCommit -cne $remoteCommit) {throw 'Local HEAD differs from the live GitHub branch. Synchronize first.'}
    if ($ExpectedCommit -and $localCommit -cne $ExpectedCommit) {throw 'Source changed during publication. Review and package again.'}
    return $localCommit
}
function Find-ReleaseId([string]$Tag) {
    $rows=@(Gh @('api','--hostname','github.com','--paginate',"repos/$repository/releases?per_page=100",'--jq','.[] | [.tag_name, .id] | @tsv'))
    $hits=@($rows | Where-Object {($_ -split '\t',2)[0] -ceq $Tag})
    if ($hits.Count -gt 1) {throw 'Multiple releases match the tag.'}
    if ($hits.Count -eq 1) {
        $releaseId=($hits[0] -split '\t',2)[1]
        if ($releaseId -notmatch '^\d+$') {throw 'Invalid release ID.'}
        return $releaseId
    }
}
function Assert-NoTag([string]$Tag) {
    $refs=@(Gh @('api','--hostname','github.com',"repos/$repository/git/matching-refs/tags/$Tag",'--jq','.[].ref'))
    if ($refs -ccontains "refs/tags/$Tag") {throw "Tag $Tag already exists. Refusing to move or reuse it."}
}
function Assert-Draft($Release,[string]$Tag,[string]$Commit) {
    if ($Release.tag_name -cne $Tag -or $Release.target_commitish -cne $Commit -or $Release.draft -ne $true -or $Release.prerelease -ne $true) {throw 'Release is published, targets another commit or is not a development draft. Refusing changes.'}
}
function Assert-Assets($Release,$Expected,[switch]$AllowMissing) {
    $seen=@{}
    foreach ($asset in @($Release.assets)) {
        if ($null -eq $asset) {continue}
        $name=[string]$asset.name
        if (-not $Expected.ContainsKey($name) -or $seen.ContainsKey($name) -or $asset.state -cne 'uploaded' -or [long]$asset.size -ne $Expected[$name].size) {throw "Unexpected, duplicate, incomplete or wrong-size asset: $name"}
        if ($asset.digest -cne ('sha256:'+$Expected[$name].hash)) {throw "Missing or mismatched GitHub SHA-256 digest: $name. No asset will be overwritten."}
        $seen[$name]=[string]$asset.id
    }
    if (-not $AllowMissing -and $seen.Count -ne $Expected.Count) {throw 'Release is missing required assets.'}
    return $seen
}
try {
    Start-Transcript -Path $log | Out-Null
    $transcribing=$true
    Set-Location -LiteralPath $root
    $work=Join-Path $cache ('PublishWork-'+[guid]::NewGuid().ToString('N'))
    $null=New-Item -ItemType Directory -Path $work
    $ghCommand=Get-Command gh.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ghCommand) {$script:gh=$ghCommand.Source}
    else {
        $ghPath=Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'
        if (Test-Path -LiteralPath $ghPath -PathType Leaf) {$script:gh=$ghPath}
        else {throw 'GitHub CLI is required. Install with winget install --id GitHub.cli --exact, then gh auth login --hostname github.com --web as Arrow-Loop.'}
    }
    $gitCommand=Get-Command git.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gitCommand) {$script:git=$gitCommand.Source}
    else {
        $desktopGit=Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'GitHubDesktop') -Directory -ErrorAction SilentlyContinue |
            Where-Object {$_.Name -like 'app-*'} | Sort-Object LastWriteTime -Descending |
            ForEach-Object {Join-Path $_.FullName 'resources\app\git\cmd\git.exe'} |
            Where-Object {Test-Path -LiteralPath $_ -PathType Leaf} | Select-Object -First 1
        if (-not $desktopGit) {throw 'Git not found. Install Git or GitHub Desktop.'}
        $script:git=$desktopGit
    }
    $env:GH_PROMPT_DISABLED='1'
    Assert-Account
    $commit=Assert-Synchronized
    $config=Get-Content -LiteralPath 'tbIDE\phase1-config.json' -Raw | ConvertFrom-Json
    $version=[string]$config.addinVersion
    if ($version -notmatch '^0\.\d+\.\d+\.\d+$') {throw 'Development prereleases only.'}
    $tag="tbUI3IDE-v$version"
    $zipName="tbUI3IDE-$version.zip"
    $names=@($zipName,'tbUI3-update.json','SHA256SUMS.txt')
    if (-not $PackageDirectory) {
        $candidate=Get-ChildItem -LiteralPath (Join-Path $root 'Build') -Directory -ErrorAction SilentlyContinue |
            Where-Object {$_.Name -eq "Release-$version" -or $_.Name -match ('^Release-'+[regex]::Escape($version)+'-\d{8}-\d{6}-\d{3}$')} |
            Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
        if (-not $candidate) {throw "No package for $version. Run Package-Release.bat first."}
        $PackageDirectory=$candidate.FullName
    }
    $PackageDirectory=(Resolve-Path -LiteralPath $PackageDirectory).Path
    Write-Host "Repository: $repository | Account: Arrow-Loop | Commit: $commit"
    Write-Host "Package: $PackageDirectory"
    $all=@(Get-ChildItem -LiteralPath $PackageDirectory -Force)
    if ($all.Count -ne 3 -or @($all | Where-Object {$_.PSIsContainer -or $_.Name -cnotin $names}).Count -ne 0) {throw 'Package must contain exactly the three expected assets.'}
    $frozen=Join-Path $work 'assets'
    $null=New-Item -ItemType Directory -Path $frozen
    $expected=@{}
    foreach ($name in $names) {
        $source=Join-Path $PackageDirectory $name
        $dest=Join-Path $frozen $name
        Copy-Item -LiteralPath $source -Destination $dest
        $expected[$name]=@{hash=(File-Hash $dest);size=(Get-Item -LiteralPath $dest).Length;path=$dest}
        if ($expected[$name].size -le 0 -or (File-Hash $source) -cne $expected[$name].hash) {throw "Package changed or is empty: $name"}
    }
    $checks=@{}
    foreach ($line in @(Get-Content -LiteralPath $expected['SHA256SUMS.txt'].path)) {
        if ($line -notmatch '^([a-fA-F0-9]{64})  (.+)$') {throw 'Malformed SHA256SUMS.txt.'}
        $hash=$Matches[1].ToLowerInvariant(); $name=$Matches[2]
        if ($name -cnotin @($zipName,'tbUI3-update.json') -or $checks.ContainsKey($name) -or $hash -cne $expected[$name].hash) {throw "Invalid checksum entry: $name"}
        $checks[$name]=$hash
    }
    if ($checks.Count -ne 2) {throw 'Checksums must cover exactly the ZIP and manifest.'}
    $manifest=Get-Content -LiteralPath $expected['tbUI3-update.json'].path -Raw | ConvertFrom-Json
    if ($manifest.schema -ne 2 -or $manifest.releaseTag -cne $tag -or $manifest.channel -cne 'development' -or $manifest.deployment -cne 'perUser' -or $manifest.protocolMin -gt $config.protocol -or $manifest.protocolMax -lt $config.protocol -or @($manifest.components).Count -ne 1) {throw 'Manifest identity or protocol mismatch.'}
    $component=$manifest.components[0]
    if ($component.id -cne 'addin' -or $component.version -cne $version -or $component.asset -cne $zipName -or $component.minIdeBuild -ne $config.minIdeBuild -or $component.maxIdeBuild -ne $config.maxIdeBuild -or @($component.files).Count -ne 2) {throw 'Manifest differs from current build configuration.'}
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    Add-Type -AssemblyName System.IO.Compression
    $dlls=@{'addins/win32/tbUI3IDE.dll'=(Join-Path $root 'tbIDE\tbUI3IDE\Build\win32\tbUI3IDE.dll');'addins/win64/tbUI3IDE.dll'=(Join-Path $root 'tbIDE\tbUI3IDE\Build\win64\tbUI3IDE.dll')}
    $project=Get-Item -LiteralPath (Join-Path $root 'tbIDE\tbUI3IDE\tbUI3IDE.twinproj')
    $archive=[IO.Compression.ZipFile]::OpenRead($expected[$zipName].path)
    try {
        if ($archive.Entries.Count -ne 2) {throw 'ZIP must contain exactly the two DLLs.'}
        foreach ($target in $dlls.Keys) {
            $entries=@($archive.Entries | Where-Object {$_.FullName -ceq $target})
            $records=@($component.files | Where-Object {$_.source -ceq $target -and $_.target -ceq $target})
            if ($entries.Count -ne 1 -or $records.Count -ne 1) {throw "Missing or duplicate ZIP/manifest entry: $target"}
            $entry=$entries[0]; $record=$records[0]
            $stream=$entry.Open()
            try {$entryHash=(Get-FileHash -InputStream $stream -Algorithm SHA256).Hash.ToLowerInvariant()}
            finally {$stream.Dispose()}
            $dll=Get-Item -LiteralPath $dlls[$target]
            if ($dll.LastWriteTimeUtc -lt $project.LastWriteTimeUtc -or $entry.Length -ne $record.size -or $entry.Length -ne $dll.Length -or $entryHash -cne $record.sha256 -or $entryHash -cne (File-Hash $dll.FullName)) {throw "Package does not match the current compiled DLL: $target. Rebuild/package again."}
        }
    } finally {$archive.Dispose()}
    $nodeCommand=Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($nodeCommand) {$nodePath=$nodeCommand.Source}
    else {
        $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
        $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'win-x64'} 'ARM64' {'win-arm64'} 'X86' {'win-x86'} default {throw "Unsupported architecture: $arch"}}
        $portableNodeDirectory=Get-ChildItem -LiteralPath (Join-Path $cache 'Node22') -Directory -ErrorAction SilentlyContinue |
            Where-Object {$_.Name -match ('^node-v22\.\d+\.\d+-'+[regex]::Escape($platform)+'$') -and (Test-Path -LiteralPath (Join-Path $_.FullName 'node.exe') -PathType Leaf)} |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $portableNodeDirectory) {throw 'Node runtime not found. Set up the development runtime as for Package-Release.bat.'}
        $nodePath=Join-Path $portableNodeDirectory.FullName 'node.exe'
    }
    $updater=Join-Path $root 'tbIDE\Updater\Build\Updater.exe'
    Run-Checked $nodePath @('tbIDE/tools/verify-phase1-release.mjs',$dlls['addins/win32/tbUI3IDE.dll'],$dlls['addins/win64/tbUI3IDE.dll'],$updater) | ForEach-Object {Write-Host $_}
    Write-Host 'Local package, DLLs, checksums and embedded payloads verified.'
    Assert-NoTag $tag
    $releaseId=Find-ReleaseId $tag
    if (-not $releaseId) {
        $notesPath=Join-Path $work 'ReleaseNotes.md'
        $changelog=Get-Content -LiteralPath 'tbIDE\CHANGELOG.md' -Raw
        $sections=@([regex]::Split($changelog,'(?m)(?=^## )') | Where-Object {($_ -split '\r?\n',2)[0] -match ('(?<![\d.])'+[regex]::Escape($version)+'(?![\d.])')})
        $notes="Development prerelease of tbUI3IDE $version. Supported IDE builds: $($config.minIdeBuild) through $($config.maxIdeBuild). Embedded updater: $($config.updaterVersion)."+[Environment]::NewLine+[Environment]::NewLine
        if ($sections.Count -gt 0) {$notes+=($sections -join [Environment]::NewLine).Trim()}
        else {$notes+='See the source changelog for this development checkpoint.'}
        [IO.File]::WriteAllText($notesPath,$notes,[Text.UTF8Encoding]::new($false))
        Write-Host "Creating unpublished draft $tag at $commit..."
        $release=((Gh @('api','--hostname','github.com','--method','POST',"repos/$repository/releases",'-f',"tag_name=$tag",'-f',"target_commitish=$commit",'-f',"name=tbUI3IDE v$version",'-F',"body=@$notesPath",'-F','draft=true','-F','prerelease=true','-f','make_latest=false')) -join [Environment]::NewLine) | ConvertFrom-Json
        $releaseId=[string]$release.id
        if ($releaseId -notmatch '^\d+$') {throw 'Draft creation could not be confirmed.'}
    }
    $release=Api "repos/$repository/releases/$releaseId"
    Assert-Draft $release $tag $commit
    $draftUrl=[string]$release.html_url
    $uploaded=Assert-Assets $release $expected -AllowMissing
    foreach ($name in $names) {
        if (-not $uploaded.ContainsKey($name)) {
            Assert-Draft (Api "repos/$repository/releases/$releaseId") $tag $commit
            Write-Host "Uploading $name..."
            Gh @('release','upload',$tag,$expected[$name].path,'--repo',"github.com/$repository") | ForEach-Object {Write-Host $_}
        }
    }
    $release=Api "repos/$repository/releases/$releaseId"
    Assert-Draft $release $tag $commit
    $assetIds=Assert-Assets $release $expected
    Write-Host 'All three GitHub asset SHA-256 digests and sizes verified.'
    Write-Host "Draft: $draftUrl"
    Write-Host 'Review the draft and native acceptance evidence before publishing.'
    Write-Host "Tag: $tag | Target: $commit | Development prerelease (not Latest)"
    $confirmation=Read-Host "Type $tag to publish, or press Enter to leave the verified draft unpublished"
    if ($confirmation -cne $tag) {
        Write-Host 'Draft retained. Nothing published.'
        $exitCode=0
    } else {
        Assert-Account
        $null=Assert-Synchronized $commit
        Assert-NoTag $tag
        $release=Api "repos/$repository/releases/$releaseId"
        Assert-Draft $release $tag $commit
        $finalIds=Assert-Assets $release $expected
        foreach ($name in $names) {if ($finalIds[$name] -cne $assetIds[$name]) {throw 'Draft assets changed during confirmation.'}}
        $publishAttempted=$true
        $published=((Gh @('api','--hostname','github.com','--method','PATCH',"repos/$repository/releases/$releaseId",'-F','draft=false','-F','prerelease=true','-f','make_latest=false')) -join [Environment]::NewLine) | ConvertFrom-Json
        if ($published.draft -ne $false -or $published.prerelease -ne $true -or $published.tag_name -cne $tag) {throw 'GitHub did not confirm the expected published prerelease.'}
        $null=Assert-Assets $published $expected
        $tagRef=Api "repos/$repository/git/ref/tags/$tag"
        if ($tagRef.object.type -cne 'commit' -or $tagRef.object.sha -cne $commit) {throw 'Published tag does not match the expected source commit. Inspect GitHub immediately.'}
        Write-Host "SUCCESS: $($published.html_url)" -ForegroundColor Green
        Start-Process $published.html_url
        $exitCode=0
    }
} catch {
    Write-Host ('FAILED: '+$_.Exception.Message) -ForegroundColor Red
    if ($_.InvocationInfo.PositionMessage) {Write-Host $_.InvocationInfo.PositionMessage}
    if ($_.ScriptStackTrace) {Write-Host $_.ScriptStackTrace}
    if ($publishAttempted) {Write-Host 'Publication was attempted. Check the GitHub release status before retrying.'}
    else {Write-Host 'No publication requested. Any partially uploaded draft is retained for inspection.'}
    if ($draftUrl) {Write-Host "Draft/release: $draftUrl"}
} finally {
    if ($work -and (Test-Path -LiteralPath $work)) {Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue}
    Write-Host "Log: $log"
    if ($transcribing) {Stop-Transcript | Out-Null}
}
exit $exitCode
