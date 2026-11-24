param(
    [Parameter(Mandatory=$true)][string]$Win32Dll,
    [Parameter(Mandatory=$true)][string]$Win64Dll,
    [Parameter(Mandatory=$true)][string]$UpdaterExe,
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$MinIdeBuild,
    [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$MaxIdeBuild,
    [ValidateSet('development','stable')][string]$Channel='development',
    [string]$Output
)
$ErrorActionPreference='Stop'
# Development-time release tooling only. The distributed updater is one native EXE.
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
function Hash($Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Binary-Version($Path) {
    $v=[Diagnostics.FileVersionInfo]::GetVersionInfo($Path)
    return ('{0}.{1}.{2}.{3}' -f $v.FileMajorPart,$v.FileMinorPart,$v.FileBuildPart,$v.FilePrivatePart)
}
function Normalize-AddinVersion([string]$Version) {
    if ($Version -match '^1\.([123])\.0\.(\d+)$') {
        $minor=[int]$Matches[1]; $revision=[int]$Matches[2]
        $limit=switch($minor){1{0}2{2}3{20}}
        if ($revision -le $limit) {return ('0.'+$minor+'.0.'+$revision)}
    }
    return $Version
}
function Assert-Target($Id,$Target) {
    $ok=switch($Id){
        'addin' {$Target -cin @('addins/win32/tbUI3IDE.dll','addins/win64/tbUI3IDE.dll')}
        default {$false}
    }
    if (!$ok) {throw "Unsupported packaging destination: $Target"}
}
function Assert-Pe($Path,$Machine) {
    $stream=[IO.File]::OpenRead($Path);$reader=[IO.BinaryReader]::new($stream)
    try {
        if($reader.ReadUInt16() -ne 0x5a4d){throw 'Missing MZ header.'}
        $stream.Position=0x3c;$offset=$reader.ReadInt32();$stream.Position=$offset
        if($reader.ReadUInt32() -ne 0x4550 -or $reader.ReadUInt16() -ne $Machine){throw 'PE architecture mismatch.'}
    }finally{$reader.Dispose()}
}
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$Win32Dll=(Resolve-Path -LiteralPath $Win32Dll).Path
$Win64Dll=(Resolve-Path -LiteralPath $Win64Dll).Path
$UpdaterExe=(Resolve-Path -LiteralPath $UpdaterExe).Path
foreach ($check in @(@($Win32Dll,'tbIDE/tbUI3IDE/tbUI3IDE.twinproj'),@($Win64Dll,'tbIDE/tbUI3IDE/tbUI3IDE.twinproj'))) {
    if ((Get-Item -LiteralPath $check[0]).LastWriteTimeUtc -lt (Get-Item -LiteralPath (Join-Path $repo $check[1])).LastWriteTimeUtc) { throw ('Rebuild this binary after the current canonical project changes: '+$check[0]) }
}

Push-Location -LiteralPath $repo
try {
    & node tbIDE/tools/prepare-phase1-bundle.mjs --updater $UpdaterExe --verify-only
    if ($LASTEXITCODE -ne 0) { throw 'Updater verification failed.' }
} finally { Pop-Location }

if (!$Output) {$Output=Join-Path $repo 'Build/Release'}
[void][IO.Directory]::CreateDirectory($Output)
$Output=$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
if (@(Get-ChildItem -LiteralPath $Output -Force).Count -ne 0) {throw 'Use a fresh, empty release output directory; previous release assets must not be mixed with this package.'}
$addinSettings=Get-Content -LiteralPath (Join-Path $repo 'tbIDE/tbUI3IDE/src/Settings') -Raw | ConvertFrom-Json
$expectedAddin=('{0}.{1}.{2}.{3}' -f $addinSettings.'project.versionMajor',$addinSettings.'project.versionMinor',$addinSettings.'project.versionBuild',$addinSettings.'project.versionRevision')
$updaterSettings=Get-Content -LiteralPath (Join-Path $repo 'tbIDE/Updater/src/Settings') -Raw | ConvertFrom-Json
$expectedUpdater=('{0}.{1}.{2}.{3}' -f $updaterSettings.'project.versionMajor',$updaterSettings.'project.versionMinor',$updaterSettings.'project.versionBuild',$updaterSettings.'project.versionRevision')
$version=Binary-Version $Win32Dll
if ($version -cne $expectedAddin) { throw ('Add-in PE version differs from the canonical project. Expected '+$expectedAddin+', got '+$version+'. Rebuild and verify the compiler version mapping before publishing.') }
if ((Binary-Version $UpdaterExe) -cne $expectedUpdater) { throw 'Updater PE version differs from its canonical project.' }
if ((Binary-Version $Win64Dll) -cne $version) {throw 'Both add-in DLLs must have exactly the same version.'}
if ($version.StartsWith('0.') -ne ($Channel -eq 'development')) {throw 'Major zero requires a development prerelease; stable requires its explicit channel.'}
if ($Channel -eq 'development' -and (Normalize-AddinVersion $version) -cne $version) {throw 'Historical mislabeled development binaries cannot be republished.'}
if ($MinIdeBuild -gt $MaxIdeBuild) {throw 'Invalid IDE compatibility bounds.'}
$phase1Config=Get-Content -LiteralPath (Join-Path $repo 'tbIDE/phase1-config.json') -Raw | ConvertFrom-Json
if ($MinIdeBuild -ne $phase1Config.minIdeBuild -or $MaxIdeBuild -ne $phase1Config.maxIdeBuild) {throw 'Release compatibility must match the compiled Phase1Config bounds. Update configuration, synchronize and rebuild first.'}
Assert-Pe $Win32Dll 0x14c;Assert-Pe $Win64Dll 0x8664;Assert-Pe $UpdaterExe 0x14c
Push-Location -LiteralPath $repo
try {
    & node ./tbIDE/tools/verify-phase1-release.mjs $Win32Dll $Win64Dll $UpdaterExe
    if ($LASTEXITCODE -ne 0) {throw 'Both real DLLs must embed the exact accepted updater and themes before release packaging.'}
} finally {Pop-Location}
$tag='tbUI3IDE-v'+$version
function Pack($Id,$Version,$Name,$InputFiles,$Summary) {
    $zipPath=Join-Path $Output $Name
    if (Test-Path -LiteralPath $zipPath) {throw "Refusing to overwrite release asset: $zipPath"}
    $zip=[IO.Compression.ZipFile]::Open($zipPath,[IO.Compression.ZipArchiveMode]::Create)
    $files=@()
    try {foreach($item in $InputFiles){
        Assert-Target $Id $item.target
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$item.path,$item.target)
        $files += [pscustomobject]@{source=$item.target;target=$item.target;size=(Get-Item -LiteralPath $item.path).Length;sha256=(Hash $item.path)}
    }}finally{$zip.Dispose()}
    $result=[pscustomobject]@{id=$Id;version=$Version;asset=$Name;summary=$Summary;files=@($files)}
    return $result
}
$c=Pack 'addin' $version ('tbUI3IDE-'+$version+'.zip') @(@{path=$Win32Dll;target='addins/win32/tbUI3IDE.dll'},@{path=$Win64Dll;target='addins/win64/tbUI3IDE.dll'}) 'Designer tools, selectable toolbar, styling and update checks; includes verified updater and themes.'
$c | Add-Member NoteProperty minIdeBuild $MinIdeBuild;$c | Add-Member NoteProperty maxIdeBuild $MaxIdeBuild
# The helper and themes remain independently versioned inside the verified DLL bundle.
# Publish only the add-in component; bootstrap provisions/updates the embedded resources.
$manifest=[pscustomobject]@{schema=2;protocolMin=1;protocolMax=1;deployment='perUser';releaseTag=$tag;channel=$Channel;components=@($c)}
$manifestPath=Join-Path $Output 'tbUI3-update.json'
if (Test-Path -LiteralPath $manifestPath) {throw 'Use a fresh release output directory.'}
[IO.File]::WriteAllText($manifestPath,($manifest|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
$hashes=@($c.asset,'tbUI3-update.json') | ForEach-Object { (Hash (Join-Path $Output $_))+'  '+$_ }
[IO.File]::WriteAllLines((Join-Path $Output 'SHA256SUMS.txt'),[string[]]$hashes)
Write-Output "Prepared $tag ($Channel). Upload the add-in ZIP, tbUI3-update.json and SHA256SUMS.txt to that same GitHub release; development releases MUST be marked prerelease. Publishing is a separate action."
