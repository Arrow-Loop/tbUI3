# Development-only publishing tool; never distributed with the updater.
[CmdletBinding()]
param([string]$PackageDirectory,[string]$ResultPath)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
. (Join-Path $PSScriptRoot 'Release-SourcePaths.ps1')
$repository='Arrow-Loop/tbUI3'
$branch='tbui3-dev'
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$logs=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
. (Join-Path $PSScriptRoot 'Diagnostics-Switch.ps1')
$storeLogs=Test-StoreLogs
$log=''
if ($storeLogs) {
    $null=New-Item -ItemType Directory -Path $logs -Force
    $log=Join-Path $logs ('Publish-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'.log')
}
$work=$null
$exitCode=1
$resultMessage=''
$resultState='failed'
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
        throw "Wrong GitHub account: $($account.login). Run & '$script:gh' auth switch --hostname github.com --user Arrow-Loop, or sign in with & '$script:gh' auth login --hostname github.com --web."
    }
    $remoteRepo=Api "repos/$repository"
    if ($remoteRepo.full_name -ine $repository -or $remoteRepo.permissions.push -ne $true) {throw 'Required repository write permission was not verified.'}
}
function Assert-Synchronized([string]$ExpectedCommit='') {
    $origin=Git @('remote','get-url','origin')
    if ($origin -notmatch '^(https://github\.com/Arrow-Loop/tbUI3(?:\.git)?/?|git@github\.com:Arrow-Loop/tbUI3(?:\.git)?|ssh://git@github\.com/Arrow-Loop/tbUI3(?:\.git)?)$') {throw 'Origin must be Arrow-Loop/tbUI3 on github.com.'}
    if ((Git @('branch','--show-current')) -cne $branch) {throw "Switch GitHub Desktop to $branch first."}
    $sourceStatus=@(Git (@('status','--porcelain=v1','--untracked-files=all','--no-renames','--')+$script:releaseSourcePaths))
    if ($sourceStatus.Count -ne 0) {throw ('Uncommitted release source changes: '+($sourceStatus -join '; '))}
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
function Open-DraftReview($Release) {
    $url=[string]$Release.html_url
    # Only open the release page returned for this exact repository.
    if ($url -notmatch '^https://github\.com/Arrow-Loop/tbUI3/releases/tag/[A-Za-z0-9._%-]+$') {
        throw 'GitHub did not return a recognized release page. No draft was modified.'
    }
    Write-Host "Review draft: $url"
    try {Start-Process $url}
    catch {Write-Warning 'Could not open the browser automatically. Open the URL above manually.'}
}
function Assert-ExistingDraftCompatible($Release,[string]$Tag,[string]$Commit,$Expected) {
    $target=[string]$Release.target_commitish
    Assert-Draft $Release $Tag $target
    if ($target -cne $Commit) {
        # Require a real ancestor SHA and an exact allowlist of non-build inputs.
        if ($target -notmatch '^[0-9a-f]{40}$') {throw 'Draft does not target a concrete commit.'}
        $base=Git @('merge-base',$target,$Commit)
        if ($base -cne $target) {throw 'Existing draft targets a different source history.'}
        $changes=@(Git (@('diff','--no-renames','--name-only',$target,$Commit,'--')+$script:releaseSourcePaths))
        $buildChanges=@(Get-ReleaseBuildChanges $changes)
        if ($buildChanges.Count -gt 0) {
            $buildChanges | ForEach-Object {Write-Host "Changed build input or unapproved path: $_"}
            throw 'Existing draft targets different build inputs.'
        }
    }
    return (Assert-Assets $Release $Expected -AllowMissing)
}
function Show-ExistingPublication($Release,[string]$Tag,[string]$Commit,$Expected) {
    # A manual publication consumes the version even when it is not our current package.
    # Never modify the release/tag or claim that the pending package was published.
    Write-Host "GitHub already has a published release for $Tag."
    Write-Host "Release: $($Release.html_url)"
    try {
        if ($Release.draft -ne $false -or $Release.prerelease -ne $true -or $Release.tag_name -cne $Tag -or $Release.target_commitish -cne $Commit) {
            throw 'Published release metadata or source commit differs from this package.'
        }
        $null=Assert-Assets $Release $Expected
        $tagRef=Api "repos/$repository/git/ref/tags/$Tag"
        if ($tagRef.object.type -cne 'commit' -or $tagRef.object.sha -cne $Commit) {throw 'Published tag does not match the current source commit.'}
        Write-Host 'The existing publication matches the verified local package and exact commit.' -ForegroundColor Green
        return 'already-published'
    } catch {
        Write-Warning $_.Exception.Message
        Write-Warning 'Existing publication left unchanged. This pending package was NOT published. Use a new version if you want to publish it separately.'
        return 'different-publication'
    }
}
try {
    if ($storeLogs) {
        Start-Transcript -Path $log | Out-Null
        $transcribing=$true
    } else {Write-Host 'Store logs and diagnostics is off in IDE Options (tbUI3): no transcript is kept.'}
    Set-Location -LiteralPath $root
    $work=Join-Path $cache ('PublishWork-'+[guid]::NewGuid().ToString('N'))
    $null=New-Item -ItemType Directory -Path $work
    $ghCommand=Get-Command gh.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ghCommand) {$script:gh=$ghCommand.Source}
    else {
        $ghPath=Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'
        if (Test-Path -LiteralPath $ghPath -PathType Leaf) {$script:gh=$ghPath}
        else {
            # Official cli/cli release v2.105.0, architecture-specific ZIP digests
            # pinned from GitHub's release asset metadata. No MSI or global PATH changes.
            $ghVersion='2.105.0'
            $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
            $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'amd64'} 'ARM64' {'arm64'} 'X86' {'386'} default {throw "Unsupported architecture: $arch"}}
            $digests=@{
                amd64='8813a72c899900afaa10e3fec8fbc64b908c89dbfe837e95ed2fa500fc140627'
                arm64='5282a09c7757210c6e2dfb11a56b11e14e646df9b3b6a49f155465f5f881c3b7'
                '386'='df02ca46a6655ffa0dd6d2f6d1387d1ebff63ab05272ff76301246925f67b8c7'
            }
            $ghHome=Join-Path $cache ('GitHubCLI\'+$ghVersion+'\windows_'+$platform)
            $ghPath=Join-Path $ghHome 'gh.exe'
            if (-not (Test-Path -LiteralPath $ghPath -PathType Leaf)) {
                Write-Host "Downloading official portable GitHub CLI $ghVersion..."
                [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
                $zipName='gh_'+$ghVersion+'_windows_'+$platform+'.zip'
                $zip=Join-Path $work $zipName
                $uri='https://github.com/cli/cli/releases/download/v'+$ghVersion+'/'+$zipName
                Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $zip
                if ((File-Hash $zip) -cne $digests[$platform]) {throw 'Portable GitHub CLI archive failed SHA-256 verification.'}
                $extract=Join-Path $work 'gh-extracted'
                Expand-Archive -LiteralPath $zip -DestinationPath $extract
                $executables=@(Get-ChildItem -LiteralPath $extract -Recurse -File -Filter 'gh.exe')
                if ($executables.Count -ne 1) {throw 'Verified GitHub CLI archive did not contain exactly one gh.exe.'}
                $null=New-Item -ItemType Directory -Path $ghHome -Force
                Copy-Item -LiteralPath $executables[0].FullName -Destination $ghPath
                Write-Host 'Portable GitHub CLI verified and cached.'
            }
            $script:gh=$ghPath
        }
    }
    Write-Host "Using GitHub CLI: $script:gh"
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
    # Probe the actual active credential without displaying tokens or auth status.
    $env:GH_PROMPT_DISABLED='1'
    $oldPreference=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $activeLogin=(& $script:gh api --hostname github.com user --jq '.login' 2>$null)
        $authCode=$LASTEXITCODE
    } finally {$ErrorActionPreference=$oldPreference}
    if ($authCode -ne 0) {
        if ($env:GH_TOKEN -or $env:GITHUB_TOKEN) {throw 'GitHub token environment authentication failed. Review the credential in your environment before publishing.'}
        Write-Host 'GitHub CLI needs a one-time sign-in. Use the Arrow-Loop account in your browser. If asked to configure Git credentials, choose No.'
        # Device login codes should not be captured in diagnostic transcripts.
        Stop-Transcript | Out-Null
        $transcribing=$false
        try {
            Remove-Item Env:GH_PROMPT_DISABLED -ErrorAction SilentlyContinue
            & $script:gh auth login --hostname github.com --web --git-protocol https
            $loginCode=$LASTEXITCODE
        } finally {
            $env:GH_PROMPT_DISABLED='1'
            if ($storeLogs) {
                Start-Transcript -Path $log -Append | Out-Null
                $transcribing=$true
            }
        }
        if ($loginCode -ne 0) {throw 'GitHub CLI sign-in did not complete. No release was created.'}
    } elseif ($activeLogin -cne 'Arrow-Loop') {
        Write-Host "Active GitHub account is $activeLogin; release publishing requires Arrow-Loop."
        Write-Host "To select the correct saved account: & '$script:gh' auth switch --hostname github.com --user Arrow-Loop"
        Write-Host "To sign in to that account if not already saved: & '$script:gh' auth login --hostname github.com --web"
        throw 'Wrong GitHub account. No release was created.'
    }
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
    # Public notes are maintained independently of historical engineering logs.
    # Use the same current version-specific notes when resuming an unpublished draft.
    $notesPath=Join-Path $work 'ReleaseNotes.md'
    $publicNotes=Join-Path $root ('tbIDE\release-notes\'+$version+'.md')
    $notes="Development prerelease of tbUI3IDE $version. Configured IDE build range: $($config.minIdeBuild) through $($config.maxIdeBuild). Embedded updater: $($config.updaterVersion)."
    if ((Test-Path -LiteralPath $publicNotes -PathType Leaf) -and -not [string]::IsNullOrWhiteSpace((Get-Content -LiteralPath $publicNotes -Raw))) {
        $notes=(Get-Content -LiteralPath $publicNotes -Raw).Trim()
    } else {
        # Do not copy arbitrary changelog text, invent features, or claim acceptance.
        Write-Warning "No version-specific public release notes found for $version. Using a minimal development-testing notice."
        $notes += [Environment]::NewLine+[Environment]::NewLine+"Development testing only. Native acceptance has not been established by release packaging. See the [known issues and acceptance roadmap](https://github.com/$repository/blob/$commit/tbIDE/ROADMAP.md) for outstanding limitations."
    }
    [IO.File]::WriteAllText($notesPath,$notes,[Text.UTF8Encoding]::new($false))
    # Existing conflicting drafts are resolved by the owner in the browser, never
    # by deleting assets, moving tags, or publishing an older draft automatically.
    $draftReady=$false
    $reviewOpenedFor=''
    while ($true) {
        Assert-Account
        $null=Assert-Synchronized $commit
        # The review may have taken some time. Recheck the original package,
        # frozen upload bytes, native DLLs and current embedded payloads before
        # resuming. Never silently publish against changed local artifacts.
        if ($reviewOpenedFor) {
            foreach ($name in $names) {
                if ((File-Hash (Join-Path $PackageDirectory $name)) -cne $expected[$name].hash -or (File-Hash $expected[$name].path) -cne $expected[$name].hash) {
                    throw 'Local package changed while reviewing the draft. Package again.'
                }
            }
            foreach ($target in $dlls.Keys) {
                $record=@($component.files | Where-Object {$_.source -ceq $target -and $_.target -ceq $target})
                if ($record.Count -ne 1 -or (File-Hash $dlls[$target]) -cne $record[0].sha256) {throw 'Native DLL changed during draft review. Rebuild/package again.'}
            }
            Run-Checked $nodePath @('tbIDE/tools/verify-phase1-release.mjs',$dlls['addins/win32/tbUI3IDE.dll'],$dlls['addins/win64/tbUI3IDE.dll'],$updater) | ForEach-Object {Write-Host $_}
            Assert-Account
            $null=Assert-Synchronized $commit
        }
        $releaseId=Find-ReleaseId $tag
        if ($releaseId) {
            $release=Api "repos/$repository/releases/$releaseId"
            $draftUrl=[string]$release.html_url
            if ($release.draft -eq $false) {
                $resultState=Show-ExistingPublication $release $tag $commit $expected
                $resultMessage=if ($resultState -eq 'already-published') {'Existing publication verified against this package.'} else {'Existing publication differs; this package was not published.'}
                $exitCode=0
                break
            }
            Assert-NoTag $tag
            $conflict=''
            try {$uploaded=Assert-ExistingDraftCompatible $release $tag $commit $expected}
            catch {$conflict=$_.Exception.Message}
            if ($conflict) {
                Write-Warning "Existing draft needs your review: $conflict"
                if ($reviewOpenedFor -cne $releaseId) {
                    Open-DraftReview $release
                    $reviewOpenedFor=$releaseId
                }
                Write-Host 'In GitHub, discard the conflicting draft to continue with this package, or publish that draft to finish this version.'
                Write-Host 'The tool will not delete a draft, replace assets, or publish on your behalf during this review.'
                $choice=(Read-Host 'Press Enter after resolving the draft to recheck GitHub, or Q to cancel').Trim()
                if ($choice -ieq 'Q') {
                    Write-Host 'Publication canceled. Existing draft and local package retained.'
                    $resultState='canceled';$resultMessage='Publication canceled; draft and package retained.'
                    $exitCode=0
                    break
                }
                # Re-read the live release list, not the old release ID. An API
                # error is not evidence that a draft was discarded.
                continue
            }
            $draftCommit=[string]$release.target_commitish
            if ($draftCommit -cne $commit) {Write-Host 'Resuming existing draft: only allowlisted non-build files changed. The verified release will target the current commit.'}
        } else {
            Assert-NoTag $tag
            if ($reviewOpenedFor) {Write-Host 'Conflicting draft discarded. Continuing with the verified local package.'}
            Write-Host "Creating unpublished draft $tag at $commit..."
            $release=((Gh @('api','--hostname','github.com','--method','POST',"repos/$repository/releases",'-f',"tag_name=$tag",'-f',"target_commitish=$commit",'-f',"name=tbUI3IDE v$version",'-F',"body=@$notesPath",'-F','draft=true','-F','prerelease=true','-f','make_latest=false')) -join [Environment]::NewLine) | ConvertFrom-Json
            $releaseId=[string]$release.id
            if ($releaseId -notmatch '^\d+$') {throw 'Draft creation could not be confirmed.'}
            $release=Api "repos/$repository/releases/$releaseId"
            $draftUrl=[string]$release.html_url
            $draftCommit=$commit
            Assert-Draft $release $tag $draftCommit
            $uploaded=Assert-Assets $release $expected -AllowMissing
        }
        $draftReady=$true
        break
    }
    if ($draftReady) {
        foreach ($name in $names) {
            if (-not $uploaded.ContainsKey($name)) {
                Assert-Draft (Api "repos/$repository/releases/$releaseId") $tag $draftCommit
                Write-Host "Uploading $name..."
                Gh @('release','upload',$tag,$expected[$name].path,'--repo',"github.com/$repository") | ForEach-Object {Write-Host $_}
            }
        }
        $release=Api "repos/$repository/releases/$releaseId"
        Assert-Draft $release $tag $draftCommit
        $assetIds=Assert-Assets $release $expected
        Write-Host 'All three GitHub asset SHA-256 digests and sizes verified.'
        Write-Host "Draft: $draftUrl"
        Write-Host 'Review the draft and native acceptance evidence before publishing.'
        Write-Host "Tag: $tag | Target: $commit | Development prerelease (not Latest)"
        $confirmation=Read-Host "Publish $tag now? [y/N]"
        if ($confirmation.Trim() -ine 'Y') {
            Write-Host 'Draft retained. Nothing published.'
            $resultState='draft-retained';$resultMessage='Draft retained; nothing published.'
            $exitCode=0
        } else {
            Assert-Account
            $null=Assert-Synchronized $commit
            Assert-NoTag $tag
            $release=Api "repos/$repository/releases/$releaseId"
            Assert-Draft $release $tag $draftCommit
            $finalIds=Assert-Assets $release $expected
            foreach ($name in $names) {if ($finalIds[$name] -cne $assetIds[$name]) {throw 'Draft assets changed during confirmation.'}}
            $publishAttempted=$true
            $published=((Gh @('api','--hostname','github.com','--method','PATCH',"repos/$repository/releases/$releaseId",'-f',"tag_name=$tag",'-f',"target_commitish=$commit",'-F',"body=@$notesPath",'-F','draft=false','-F','prerelease=true','-f','make_latest=false')) -join [Environment]::NewLine) | ConvertFrom-Json
            if ($published.draft -ne $false -or $published.prerelease -ne $true -or $published.tag_name -cne $tag -or $published.target_commitish -cne $commit) {throw 'GitHub did not confirm the expected published prerelease.'}
            $null=Assert-Assets $published $expected
            $tagRef=Api "repos/$repository/git/ref/tags/$tag"
            if ($tagRef.object.type -cne 'commit' -or $tagRef.object.sha -cne $commit) {throw 'Published tag does not match the expected source commit. Inspect GitHub immediately.'}
            Write-Host "SUCCESS: $($published.html_url)" -ForegroundColor Green
            $resultState='published';$resultMessage="Published and verified: $($published.html_url)"
            $exitCode=0
            try {Start-Process $published.html_url} catch {Write-Warning 'Release is published; could not open the browser.'}
        }
    }
} catch {
    $resultState='failed'
    $resultMessage=$_.Exception.Message
    Write-Host ('FAILED: '+$resultMessage) -ForegroundColor Red
    if ($_.InvocationInfo.PositionMessage) {Write-Host $_.InvocationInfo.PositionMessage}
    if ($_.ScriptStackTrace) {Write-Host $_.ScriptStackTrace}
    if ($publishAttempted) {Write-Host 'Publication was attempted. Check the GitHub release status before retrying.'}
    else {Write-Host 'No publication requested. Any partially uploaded draft is retained for inspection.'}
    if ($draftUrl) {Write-Host "Draft/release: $draftUrl"}
} finally {
    if ($work -and (Test-Path -LiteralPath $work)) {Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue}
    if ($log) {Write-Host "Log: $log"}
    if ($transcribing) {Stop-Transcript | Out-Null}
    if ($ResultPath) {
        try {
            @{schema=1;exitCode=$exitCode;state=$resultState;message=$resultMessage;log=$log} |
                ConvertTo-Json -Compress | Set-Content -LiteralPath $ResultPath -Encoding UTF8
        } catch {Write-Warning 'Could not write the operation result; see the transcript.'}
    }
}
exit $exitCode
