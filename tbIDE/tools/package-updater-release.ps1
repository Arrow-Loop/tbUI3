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
. (Join-Path $PSScriptRoot '../Updater/Updater.ps1') -Mode Functions
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$Win32Dll=(Resolve-Path -LiteralPath $Win32Dll).Path
$Win64Dll=(Resolve-Path -LiteralPath $Win64Dll).Path
$UpdaterExe=(Resolve-Path -LiteralPath $UpdaterExe).Path
foreach ($check in @(@($Win32Dll,'tbIDE/tbUI3IDE/tbUI3IDE.twinproj'),@($Win64Dll,'tbIDE/tbUI3IDE/tbUI3IDE.twinproj'),@($UpdaterExe,'tbIDE/Updater/Updater.twinproj'))) {
    if ((Get-Item -LiteralPath $check[0]).LastWriteTimeUtc -lt (Get-Item -LiteralPath (Join-Path $repo $check[1])).LastWriteTimeUtc) { throw ('Rebuild this binary after the current canonical project changes: '+$check[0]) }
}

if (!$Output) {$Output=Join-Path $repo 'Build/Release'}
[void][IO.Directory]::CreateDirectory($Output)
$Output=$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
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
Assert-Pe $Win32Dll 0x14c;Assert-Pe $Win64Dll 0x8664;Assert-Pe $UpdaterExe 0x14c
$tag='tbUI3IDE-v'+$version
$components=@()
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
$c=Pack 'addin' $version ('tbUI3IDE-'+$version+'.zip') @(@{path=$Win32Dll;target='addins/win32/tbUI3IDE.dll'},@{path=$Win64Dll;target='addins/win64/tbUI3IDE.dll'}) 'Designer tools, selectable toolbar, styling and update checks.'
$c | Add-Member NoteProperty minIdeBuild $MinIdeBuild;$c | Add-Member NoteProperty maxIdeBuild $MaxIdeBuild;$components += $c
$components += Pack 'themes' $version ('WinUI3-Themes-'+$version+'.zip') @(@{path=(Join-Path $repo 'tbIDE/themes/WinUI3 Dark.theme');target='WinUI3 Dark.theme'},@{path=(Join-Path $repo 'tbIDE/themes/WinUI3 Light.theme');target='WinUI3 Light.theme'}) 'WinUI3 Light and Dark theme files; selected theme and preferences are preserved.'
$updaterVersion=Binary-Version $UpdaterExe
$components += Pack 'updater' $updaterVersion ('tbUI3-Updater-'+$updaterVersion+'.zip') @(@{path=$UpdaterExe;target='Updater.exe'},@{path=(Join-Path $repo 'tbIDE/Updater/Updater.ps1');target='Updater.ps1'}) 'Native launcher and Windows PowerShell update/recovery engine.'
$manifest=[pscustomobject]@{schema=1;releaseTag=$tag;channel=$Channel;components=@($components)}
$manifestPath=Join-Path $Output 'tbUI3-update.json'
if (Test-Path -LiteralPath $manifestPath) {throw 'Use a fresh release output directory.'}
[IO.File]::WriteAllText($manifestPath,($manifest|ConvertTo-Json -Depth 20),[Text.UTF8Encoding]::new($false))
$hashes=Get-ChildItem -LiteralPath $Output -File | ForEach-Object { (Hash $_.FullName)+'  '+$_.Name }
[IO.File]::WriteAllLines((Join-Path $Output 'SHA256SUMS.txt'),[string[]]$hashes)
Write-Output "Prepared $tag ($Channel). Upload ZIPs and tbUI3-update.json to that same GitHub release; development releases MUST be marked prerelease. Publishing is a separate action."

