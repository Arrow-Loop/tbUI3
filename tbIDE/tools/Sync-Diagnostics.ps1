[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$GitPath)
$ErrorActionPreference='Stop'
$folder=Join-Path $env:LOCALAPPDATA 'tbUI3\Diagnostics'
$cache=Join-Path $env:LOCALAPPDATA 'ArrowLoop\tbUI3\DevTools'
# Never discover an enclosing worktree or stage from the application checkout.
if (!(Test-Path -LiteralPath (Join-Path $folder '.git'))) {throw 'Diagnostics is not an existing Git checkout. Keep logs local until the private checkout is configured.'}
function DGit([string[]]$arguments) {
    & $GitPath -C $folder -c core.longpaths=true @arguments
    if ($LASTEXITCODE -ne 0) {throw ('Diagnostics Git operation failed: '+$arguments[0])}
}
function Resolve-PrivateRemote([string]$url) {
    if ($url -match '^(?:https://github\.com/|git@github\.com:|ssh://git@github\.com/)([A-Za-z0-9-]+)/Diagnostics(?:\.git)?/?$') {
        return ($Matches[1]+'/Diagnostics')
    }
    throw 'Diagnostics origin is not a recognized GitHub Diagnostics repository.'
}
$top=DGIt @('rev-parse','--show-toplevel')
if ([IO.Path]::GetFullPath($top) -ine [IO.Path]::GetFullPath($folder)) {throw 'Diagnostics must be its own Git checkout.'}
$target=Resolve-PrivateRemote (DGit @('remote','get-url','origin'))
$pushUrls=@(DGit @('remote','get-url','--push','--all','origin'))
if ($pushUrls.Count -ne 1 -or (Resolve-PrivateRemote $pushUrls[0]) -ine $target) {throw 'Diagnostics fetch and push destinations differ.'}
$branch=DGit @('branch','--show-current')
if (!$branch) {throw 'Diagnostics checkout is detached.'}
foreach ($operation in @('MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply')) {
    $operationPath=DGit @('rev-parse','--path-format=absolute','--git-path',$operation)
    if (Test-Path -LiteralPath $operationPath) {throw 'An unfinished Git operation exists in the Diagnostics checkout.'}
}
if (@(DGit @('ls-files','--unmerged')).Count) {throw 'Diagnostics checkout has unresolved conflicts.'}
$oldPrompt=$env:GIT_TERMINAL_PROMPT
$oldGcm=$env:GCM_INTERACTIVE
$oldGh=$env:GH_PROMPT_DISABLED
try {
    # Failure reporting must never stop for an authentication dialog.
    $env:GIT_TERMINAL_PROMPT='0';$env:GCM_INTERACTIVE='Never';$env:GH_PROMPT_DISABLED='1'
    Write-Host 'Saving diagnostics...'
    DGit @('add','-A','--','.') | Out-Host
    & $GitPath -C $folder -c core.longpaths=true diff --cached --quiet
    $diffCode=$LASTEXITCODE
    if ($diffCode -eq 1) {DGit @('commit','-m',('Diagnostics '+(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))) | Out-Host}
    elseif ($diffCode -ne 0) {throw 'Could not inspect staged diagnostics.'}
    # Check current server-side privacy before sending raw logs, even for an existing clone.
    $cmd=Get-Command gh.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $gh=if ($cmd) {$cmd.Source} else {Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'}
    if (!(Test-Path -LiteralPath $gh -PathType Leaf)) {
        $arch=if ($env:PROCESSOR_ARCHITEW6432) {$env:PROCESSOR_ARCHITEW6432} else {$env:PROCESSOR_ARCHITECTURE}
        $platform=switch ($arch.ToUpperInvariant()) {'AMD64' {'amd64'} 'ARM64' {'arm64'} 'X86' {'386'} default {throw 'Unsupported GitHub CLI architecture.'}}
        $gh=Join-Path $cache ('GitHubCLI\2.105.0\windows_'+$platform+'\gh.exe')
    }
    if (!(Test-Path -LiteralPath $gh -PathType Leaf)) {throw 'Diagnostics saved locally; GitHub CLI is needed to verify the private destination before pushing.'}
    $metadata=& $gh api --hostname github.com "repos/$target" --jq '{private: .private, full_name: .full_name, default_branch: .default_branch}'
    if ($LASTEXITCODE -ne 0) {throw 'Diagnostics saved locally; could not verify the private destination using the current GitHub CLI login.'}
    $info=($metadata -join [Environment]::NewLine) | ConvertFrom-Json
    if ($info.private -ne $true -or $info.full_name -ine $target -or $info.default_branch -cne $branch) {throw 'Diagnostics saved locally; destination is not the verified private repository and its default branch.'}
    DGit @('fetch','--quiet','origin',"refs/heads/$branch") | Out-Host
    # Only diagnostic data is involved. Normal merge retains both histories;
    # overlapping text changes prefer the current machine's copy.
    & $GitPath -C $folder -c core.longpaths=true merge --no-edit --no-autostash --no-overwrite-ignore -X ours FETCH_HEAD | Out-Host
    if ($LASTEXITCODE -ne 0) {
        & $GitPath -C $folder rev-parse --quiet --verify MERGE_HEAD | Out-Null
        if ($LASTEXITCODE -eq 0) {DGit @('merge','--abort') | Out-Host}
        throw 'Diagnostics merge failed. The local diagnostic commit is preserved.'
    }
    $head=DGit @('rev-parse','HEAD')
    # Explicit branch only; never force-push.
    DGit @('push','origin',"HEAD:refs/heads/$branch") | Out-Host
    $remoteLine=DGit @('ls-remote','--exit-code','origin',"refs/heads/$branch")
    if (($remoteLine -split '\s+')[0] -cne $head) {throw 'Diagnostics push could not be verified.'}
    Write-Host 'SUCCESS: Diagnostics synchronized.' -ForegroundColor Green
} finally {
    $env:GIT_TERMINAL_PROMPT=$oldPrompt
    $env:GCM_INTERACTIVE=$oldGcm
    $env:GH_PROMPT_DISABLED=$oldGh
}
