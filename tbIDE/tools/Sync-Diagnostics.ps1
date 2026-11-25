[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$GitPath,[switch]$Configure)
$ErrorActionPreference='Stop'
$folder=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
$configPath=Join-Path $cache 'diagnostics-sync.json'
$null=New-Item -ItemType Directory -Path $cache,$folder -Force

function DGit([string[]]$arguments) {
    & $GitPath -C $folder -c core.longpaths=true @arguments
    if ($LASTEXITCODE -ne 0) {throw ('Diagnostics Git operation failed: '+$arguments[0])}
}
function Find-DiagnosticGh {
    $cmd=Get-Command gh.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd) {return $cmd.Source}
    $installed=Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'
    if (Test-Path -LiteralPath $installed -PathType Leaf) {return $installed}
    $version='2.105.0'
    $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
    $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'amd64'} 'ARM64' {'arm64'} 'X86' {'386'} default {throw 'Unsupported GitHub CLI architecture.'}}
    $ghHome=Join-Path $cache ('GitHubCLI\'+$version+'\windows_'+$platform)
    $ghPath=Join-Path $ghHome 'gh.exe'
    if (Test-Path -LiteralPath $ghPath -PathType Leaf) {return $ghPath}
    if (!$Configure) {throw 'GitHub CLI is not available. Choose C to configure diagnostics sync.'}
    # Same pinned official archive and SHA-256 checks as the release publisher.
    $digests=@{
        amd64='8813a72c899900afaa10e3fec8fbc64b908c89dbfe837e95ed2fa500fc140627'
        arm64='5282a09c7757210c6e2dfb11a56b11e14e646df9b3b6a49f155465f5f881c3b7'
        '386'='df02ca46a6655ffa0dd6d2f6d1387d1ebff63ab05272ff76301246925f67b8c7'
    }
    $work=Join-Path $cache ('DiagnosticsGh-'+[guid]::NewGuid().ToString('N'))
    $null=New-Item -ItemType Directory -Path $work
    try {
        Write-Host "Downloading official portable GitHub CLI $version..."
        [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
        $zipName='gh_'+$version+'_windows_'+$platform+'.zip'
        $zip=Join-Path $work $zipName
        Invoke-WebRequest -UseBasicParsing -Uri ('https://github.com/cli/cli/releases/download/v'+$version+'/'+$zipName) -OutFile $zip
        if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -cne $digests[$platform]) {throw 'Portable GitHub CLI archive failed SHA-256 verification.'}
        $extract=Join-Path $work 'extracted'
        Expand-Archive -LiteralPath $zip -DestinationPath $extract
        $executables=@(Get-ChildItem -LiteralPath $extract -Recurse -File -Filter 'gh.exe')
        if ($executables.Count -ne 1) {throw 'Verified GitHub CLI archive did not contain exactly one gh.exe.'}
        $null=New-Item -ItemType Directory -Path $ghHome -Force
        Copy-Item -LiteralPath $executables[0].FullName -Destination $ghPath
    } finally {Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue}
    return $ghPath
}
function Get-NamedToken([string]$owner) {
    # Capture, never display or persist tokens. Ignore environment token overrides.
    $oldPreference=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $token=(& $script:gh auth token --hostname github.com --user $owner 2>$null)
        $code=$LASTEXITCODE
    } finally {$ErrorActionPreference=$oldPreference}
    if ($code -ne 0 -or @($token).Count -ne 1 -or [string]$token -notmatch '^\S{20,}$') {
        throw 'The selected GitHub account needs authentication. Choose C to configure diagnostics sync.'
    }
    return [string]$token
}
function Get-VerifiedTarget([string]$owner,[string]$expectedId='') {
    if ($owner -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$') {throw 'Invalid GitHub account name.'}
    $token=Get-NamedToken $owner
    $env:GH_TOKEN=$token
    try {
        $login=& $script:gh api --hostname github.com user --jq '.login'
        if ($LASTEXITCODE -ne 0 -or $login -ine $owner) {throw 'Diagnostic GitHub account verification failed.'}
        $target=$owner+'/Diagnostics'
        $metadata=& $script:gh api --hostname github.com "repos/$target" --jq '{id: (.id|tostring), private: .private, full_name: .full_name, default_branch: .default_branch, push: .permissions.push}'
        if ($LASTEXITCODE -ne 0) {throw 'Could not verify the private diagnostics destination.'}
        $info=($metadata -join [Environment]::NewLine) | ConvertFrom-Json
        if ($info.private -ne $true -or $info.push -ne $true -or $info.full_name -ine $target -or $info.default_branch -cne 'main' -or [string]$info.id -notmatch '^\d+$' -or ($expectedId -and [string]$info.id -cne $expectedId)) {
            throw 'Diagnostics destination must be the configured private, writable Diagnostics repository on main.'
        }
        return [pscustomobject]@{owner=$owner;id=[string]$info.id;url=('https://github.com/'+$target+'.git');token=$token}
    } finally {Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue}
}
function Read-Owner([string]$label,[string]$default='') {
    $prompt=$label+' GitHub username (owns a private Diagnostics repository)'
    if ($default) {$prompt+=' ['+$default+']'}
    $name=(Read-Host $prompt).Trim()
    if (!$name) {$name=$default}
    if ($name -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$') {throw 'Enter a valid GitHub username.'}
    return $name
}
function Get-SetupTarget([string]$owner) {
    try {return Get-VerifiedTarget $owner}
    catch {
        Write-Host "Sign in as $owner in the browser. If asked to configure Git credentials, choose No."
        Remove-Item Env:GH_PROMPT_DISABLED -ErrorAction SilentlyContinue
        try {
            & $script:gh auth login --hostname github.com --web --git-protocol https | Out-Host
            if ($LASTEXITCODE -ne 0) {throw 'GitHub CLI sign-in did not complete.'}
        } finally {$env:GH_PROMPT_DISABLED='1'}
        return Get-VerifiedTarget $owner
    }
}
function Configure-Targets {
    $previous=''
    $oldPreference=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $previous=(& $script:gh api --hostname github.com user --jq '.login' 2>$null)
        if ($LASTEXITCODE -ne 0) {$previous=''}
    } finally {$ErrorActionPreference=$oldPreference}
    $firstDefault=''
    $secondDefault=''
    if (Test-Path -LiteralPath $configPath -PathType Leaf) {
        $existing=Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
        if (@($existing.targets).Count -eq 2) {$firstDefault=[string]$existing.targets[0].owner;$secondDefault=[string]$existing.targets[1].owner}
    }
    if (!$firstDefault -and (Test-Path -LiteralPath (Join-Path $folder '.git'))) {
        $oldPreference=$ErrorActionPreference
        try {
            $ErrorActionPreference='Continue'
            $origin=(& $GitPath -C $folder remote get-url origin 2>$null)
            if ($LASTEXITCODE -eq 0 -and $origin -match '^(?:https://github\.com/|git@github\.com:|ssh://git@github\.com/)([A-Za-z0-9-]+)/Diagnostics(?:\.git)?/?$') {$firstDefault=$Matches[1]}
        } finally {$ErrorActionPreference=$oldPreference}
    }
    if (!$firstDefault) {$firstDefault=[string]$previous}
    Write-Host 'Configure both private repositories. Their entire diagnostic history and current files will be shared.'
    $first=Read-Owner 'First' $firstDefault
    $second=Read-Owner 'Second' $secondDefault
    if ($first -ieq $second) {throw 'Choose two different GitHub accounts.'}
    $restore=if ($previous) {[string]$previous} else {$first}
    try {
        $a=Get-SetupTarget $first
        $b=Get-SetupTarget $second
        if ($a.id -eq $b.id) {throw 'The two diagnostic destinations must be distinct.'}
        $config=[ordered]@{schema=1;targets=@(@{owner=$a.owner;id=$a.id},@{owner=$b.owner;id=$b.id})}
        $temp=$configPath+'.'+[guid]::NewGuid().ToString('N')+'.tmp'
        try {
            $config | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $temp -Encoding UTF8
            Move-Item -LiteralPath $temp -Destination $configPath -Force
        } finally {Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue}
        Write-Host 'Both private diagnostics destinations configured. Credentials remain in GitHub CLI.'
    } finally {
        # Do not leave release publication using the second account.
        & $script:gh auth switch --hostname github.com --user $restore | Out-Host
        if ($LASTEXITCODE -ne 0) {Write-Warning 'Could not restore the previous active GitHub CLI account. Check the active account before publishing.'}
    }
}
function Assert-DiagnosticCheckout {
    if (!(Test-Path -LiteralPath (Join-Path $folder '.git'))) {
        # This directory is dedicated to tbUI3 logs. Do not clone over existing files.
        DGit @('init','-b','main') | Out-Host
    }
    $top=DGit @('rev-parse','--show-toplevel')
    if ([IO.Path]::GetFullPath($top) -ine [IO.Path]::GetFullPath($folder)) {throw 'Diagnostics must be its own Git checkout.'}
    $branch=DGit @('branch','--show-current')
    if ($branch -cne 'main') {throw 'Diagnostics checkout must be on main. No branch was changed.'}
    foreach ($operation in @('MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply')) {
        $operationPath=DGit @('rev-parse','--path-format=absolute','--git-path',$operation)
        if (Test-Path -LiteralPath $operationPath) {throw 'An unfinished Git operation exists in the Diagnostics checkout.'}
    }
    if (@(DGit @('ls-files','--unmerged')).Count) {throw 'Diagnostics checkout has unresolved conflicts.'}
}
function Save-Diagnostics {
    # Preserve existing author identity. Use a tool-local identity only when Git has none.
    & $GitPath -C $folder var GIT_AUTHOR_IDENT 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        DGit @('config','--local','user.name','tbUI3 Diagnostics') | Out-Host
        DGit @('config','--local','user.email','diagnostics@localhost') | Out-Host
    }
    DGit @('add','-A','--','.') | Out-Host
    & $GitPath -C $folder diff --cached --quiet
    $diffCode=$LASTEXITCODE
    if ($diffCode -eq 1) {DGit @('commit','-m',('Diagnostics '+(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))) | Out-Host}
    elseif ($diffCode -ne 0) {throw 'Could not inspect staged diagnostics.'}
    else {
        & $GitPath -C $folder rev-parse --quiet --verify HEAD | Out-Null
        if ($LASTEXITCODE -ne 0) {DGit @('commit','--allow-empty','-m','Initialize diagnostics history') | Out-Host}
    }
}
function DGitNetwork($target,[string[]]$arguments) {
    # Explicit HTTPS URL, no account switching or credential-helper fallback.
    # --config-env keeps the credential out of the command line and Git config.
    $resolved=DGit @('ls-remote','--get-url',$target.url)
    if ($resolved -cne $target.url) {throw 'Git URL rewriting would change the verified diagnostics destination.'}
    $headerKey='http.'+$target.url+'.extraHeader'
    $oldHeader=$env:TBUI3_DIAGNOSTIC_AUTH
    try {
        $env:TBUI3_DIAGNOSTIC_AUTH='Authorization: Basic '+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('x-access-token:'+$target.token))
        & $GitPath -C $folder -c core.longpaths=true -c credential.helper= -c http.extraHeader= -c http.followRedirects=false -c http.sslVerify=true "--config-env=$headerKey=TBUI3_DIAGNOSTIC_AUTH" @arguments
        if ($LASTEXITCODE -ne 0) {throw ('Diagnostics network operation failed: '+$arguments[0])}
    } finally {[Environment]::SetEnvironmentVariable('TBUI3_DIAGNOSTIC_AUTH',$oldHeader,'Process')}
}
function Merge-DiagnosticTip([string]$tip) {
    # Both independent initial histories are retained; overlapping text favors this checkout.
    & $GitPath -C $folder -c core.longpaths=true merge --no-edit --no-autostash --no-overwrite-ignore --allow-unrelated-histories -X ours $tip | Out-Host
    if ($LASTEXITCODE -ne 0) {
        & $GitPath -C $folder rev-parse --quiet --verify MERGE_HEAD | Out-Null
        if ($LASTEXITCODE -eq 0) {DGit @('merge','--abort') | Out-Host}
        throw 'Diagnostics merge failed. Local diagnostic commits are preserved.'
    }
}

$mutex=[Threading.Mutex]::new($false,'Local\tbUI3-Diagnostics-Sync')
$locked=$false
# No interactive credential prompts in automatic sync and no trace that could expose a header.
$envNames=@('GH_TOKEN','GITHUB_TOKEN','GH_DEBUG','GH_PROMPT_DISABLED','GIT_TERMINAL_PROMPT','GCM_INTERACTIVE','GIT_TRACE','GIT_TRACE_PACKET','GIT_TRACE_CURL','GIT_CURL_VERBOSE','GIT_TRACE2','GIT_TRACE2_EVENT','GIT_TRACE2_PERF','GIT_TRACE_REDACT','GIT_SSL_NO_VERIFY')
$saved=@{}
foreach ($name in $envNames) {$saved[$name]=[Environment]::GetEnvironmentVariable($name,'Process')}
try {
    try {$locked=$mutex.WaitOne(0)} catch [Threading.AbandonedMutexException] {$locked=$true}
    if (!$locked) {throw 'Another diagnostics synchronization is already running.'}
    foreach ($name in $envNames) {[Environment]::SetEnvironmentVariable($name,$null,'Process')}
    $env:GH_PROMPT_DISABLED='1';$env:GIT_TERMINAL_PROMPT='0';$env:GCM_INTERACTIVE='Never';$env:GIT_TRACE_REDACT='1'
    if (!$Configure -and !(Test-Path -LiteralPath $configPath -PathType Leaf)) {throw 'Dual diagnostics sync is not configured. Choose C once on this PC; logs remain local.'}
    $script:gh=Find-DiagnosticGh
    if ($Configure) {Configure-Targets}
    $config=Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($config.schema -ne 1 -or @($config.targets).Count -ne 2 -or $config.targets[0].owner -ieq $config.targets[1].owner -or $config.targets[0].id -eq $config.targets[1].id) {throw 'Invalid diagnostics configuration. Choose C to configure it again.'}
    foreach ($entry in $config.targets) {if ([string]$entry.id -notmatch '^\d+$' -or [string]$entry.owner -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$') {throw 'Invalid diagnostics destination. Choose C again.'}}
    Assert-DiagnosticCheckout
    Write-Host 'Saving local diagnostics...'
    Save-Diagnostics
    # Verify BOTH destinations with their own named accounts before any network Git transfer.
    $targets=@(foreach ($entry in $config.targets) {Get-VerifiedTarget ([string]$entry.owner) ([string]$entry.id)})
    $tips=@()
    foreach ($target in $targets) {
        DGitNetwork $target @('fetch','--quiet','--no-tags',$target.url,'refs/heads/main') | Out-Host
        $tip=DGit @('rev-parse','FETCH_HEAD')
        if ($tip -notmatch '^[0-9a-f]{40}$') {throw 'Could not resolve the fetched diagnostics commit.'}
        $tips+= $tip
    }
    foreach ($tip in $tips) {Merge-DiagnosticTip $tip}
    $head=DGit @('rev-parse','HEAD')
    $failed=@()
    foreach ($target in $targets) {
        try {DGitNetwork $target @('push',$target.url,'HEAD:refs/heads/main') | Out-Host}
        catch {$failed+= $target.owner;Write-Warning 'A diagnostics push failed; local commits remain available.'}
    }
    if ($failed.Count) {throw 'Diagnostics mirror incomplete. Retry D or the next automatic sync; no force-push was used.'}
    foreach ($target in $targets) {
        $remoteLine=DGitNetwork $target @('ls-remote','--exit-code',$target.url,'refs/heads/main')
        if (($remoteLine -split '\s+')[0] -cne $head) {throw 'Diagnostics mirror verification failed. A remote may have advanced; retry synchronization.'}
    }
    Write-Host "Diagnostics synchronized: both private repositories at $($head.Substring(0,12))." -ForegroundColor Gray
} finally {
    foreach ($name in $envNames) {[Environment]::SetEnvironmentVariable($name,$saved[$name],'Process')}
    if ($locked) {$mutex.ReleaseMutex()}
    $mutex.Dispose()
}
