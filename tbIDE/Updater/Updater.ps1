param(
    [ValidateSet('Check','Stage','Apply','Recover','Cancel','Functions')][string]$Mode = 'Check',
    [string]$Context
)
# Windows PowerShell 5.1 engine for the native twinBASIC Updater.exe launcher.
# All network work is out of the IDE process. No credentials or branch binaries are used.
Set-StrictMode -Version 2
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$script:Agent = 'tbUI3-Updater/0.1'
$script:Api = 'https://api.github.com/repos/'

function Write-Json($Path, $Value) {
    $temp=$Path+'.'+[Guid]::NewGuid().ToString('N')+'.new'
    try {
        $bytes=[Text.Encoding]::Unicode.GetPreamble()+[Text.Encoding]::Unicode.GetBytes(($Value | ConvertTo-Json -Depth 40))
        $stream=[IO.File]::Create($temp)
        try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
        # Readers may briefly hold a share that excludes rename. Retry the atomic swap;
        # never truncate the live state/journal and never share a temp name across workers.
        for ($attempt=0; $attempt -lt 10; $attempt++) {
            try {
                if ([IO.File]::Exists($Path)) { [IO.File]::Replace($temp,$Path,[NullString]::Value) }
                else { [IO.File]::Move($temp,$Path) }
                return
            } catch [IO.IOException] {
                if ($attempt -eq 9) { throw }
                Start-Sleep -Milliseconds 50
            }
        }
    } finally { if ([IO.File]::Exists($temp)) { [IO.File]::Delete($temp) } }
}
function Read-Json($Path) { Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json }
function Property($Object, $Name, $Default = $null) {
    if ($null -ne $Object -and $Object.PSObject.Properties[$Name]) { return $Object.$Name }
    return $Default
}
function Hash($Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Assert-Hash($Value) { if ($Value -cnotmatch '^[a-f0-9]{64}$') { throw 'Invalid SHA-256 metadata.' } }
function Assert-Relative($Path) {
    if (!$Path -or $Path -match '[\\:]|^/|//|[\x00-\x1f]' -or $Path -match '(^|/)(\.|\.\.)(/|$)') { throw "Unsafe relative path: $Path" }
    foreach ($part in $Path.Split('/')) {
        if ($part -match '[. ]$|[<>"|?*]' -or $part -match '^(?i:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.|$)') { throw "Unsafe Windows path: $Path" }
    }
}
function Safe-Path($Root, $Relative) {
    Assert-Relative $Relative
    $base = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    $path = [IO.Path]::GetFullPath((Join-Path $base $Relative))
    if (!$path.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes installation root.' }
    # Check every existing ancestor, including the root; never follow junctions/symlinks.
    $cursor = $path
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point: $cursor" }
        }
        $parent = [IO.Path]::GetDirectoryName($cursor)
        if ($parent -eq $cursor) { break }; $cursor = $parent
    }
    return $path
}
function Compare-Version([string]$A, [string]$B) {
    if ($A -notmatch '^\d+(\.\d+){0,3}$' -or $B -notmatch '^\d+(\.\d+){0,3}$') { throw 'Versions must contain one to four numeric parts.' }
    $aa = @($A.Split('.') | ForEach-Object { [uint32]$_ }); $bb = @($B.Split('.') | ForEach-Object { [uint32]$_ })
    for ($i = 0; $i -lt 4; $i++) {
        $av = if ($i -lt $aa.Count) { $aa[$i] } else { 0 }; $bv = if ($i -lt $bb.Count) { $bb[$i] } else { 0 }
        if ($av -lt $bv) { return -1 }; if ($av -gt $bv) { return 1 }
    }; return 0
}
# Alias only the documented, mislabeled historical add-in binaries. Never alias remote
# releases or versions of the IDE, control package, library, or future stable add-ins.
function Normalize-AddinVersion([string]$Version, [bool]$PublishedStable = $false) {
    [void](Compare-Version $Version '0')
    if (!$PublishedStable -and $Version -match '^1\.([123])\.0\.(\d+)$') {
        $minor=[int]$Matches[1]; $revision=[int]$Matches[2]
        $limit=switch($minor){1{0}2{2}3{20}}
        if ($revision -le $limit) { return ('0.'+$minor+'.0.'+$revision) }
    }
    return $Version
}
function Assert-Url($Url, $Repository, $Tag = '') {
    $prefix = 'https://github.com/' + $Repository + '/releases/download/'
    if ($Tag) { $prefix += [Uri]::EscapeDataString($Tag) + '/' }
    $u = [Uri]$Url
    if ($u.AbsolutePath -match '(?i)%2e|%2f|%5c|%25' -or !($u.GetLeftPart([UriPartial]::Path)).StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Release URL contains a non-canonical path.' }
    if (!$Url.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) -or $u.UserInfo -or $u.Query -or $u.Fragment -or !$u.IsDefaultPort) { throw 'Release URL is outside its approved repository/tag.' }
}
function Download($Url, $Path, [long]$Size, $Sha) {
    Assert-Hash $Sha
    if ($Size -le 0 -or $Size -gt 536870912) { throw 'Unsupported download size.' }
    # Explicit redirect policy. GitHub's release CDN is the only allowed redirect target.
    $deadline=[DateTime]::UtcNow.AddMinutes(15)
    $current = $Url
    for ($redirect = 0; $redirect -le 5; $redirect++) {
        $u = [Uri]$current
        if ($u.Scheme -ne 'https' -or !$u.IsDefaultPort -or $u.UserInfo -or $u.Host -notin @('github.com','release-assets.githubusercontent.com','objects.githubusercontent.com')) { throw 'Unapproved download redirect.' }
        $req = [Net.HttpWebRequest]::Create($current); $req.UserAgent = $script:Agent
        $req.AllowAutoRedirect = $false; $req.Timeout = 30000; $req.ReadWriteTimeout = 30000
        $res = $req.GetResponse()
        try {
            if ([int]$res.StatusCode -in @(301,302,303,307,308)) {
                $current = ([Uri]::new($u, $res.Headers['Location'])).AbsoluteUri; continue
            }
            if ([int]$res.StatusCode -ne 200 -or ($res.ContentLength -ge 0 -and $res.ContentLength -ne $Size)) { throw 'Unexpected HTTP status or content length.' }
            $downloadStream = $res.GetResponseStream(); $output = [IO.File]::Create($Path)
            try {
                $buffer = New-Object byte[] 65536; [long]$total = 0
                while (($n = $downloadStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                    if ([DateTime]::UtcNow -gt $deadline) { throw 'Download timed out after 15 minutes.' }
                    $total += $n; if ($total -gt $Size) { throw 'Download exceeds declared size.' }; $output.Write($buffer, 0, $n)
                }
            } finally { $output.Dispose(); $downloadStream.Dispose() }
            if ($total -ne $Size -or (Hash $Path) -ne $Sha) { throw 'Downloaded file failed size/SHA-256 validation.' }
            return
        } finally { $res.Dispose() }
    }; throw 'Too many release redirects.'
}
function Get-Releases($Repository) {
    foreach ($release in (Invoke-RestMethod ($script:Api + $Repository + '/releases?per_page=100') -Headers @{ 'User-Agent'=$script:Agent; Accept='application/vnd.github+json' } -TimeoutSec 30)) { $release }
}
function Asset($Release, $Name, $Repository) {
    $found = @($Release.assets | Where-Object { $_.name -ceq $Name -and $_.state -eq 'uploaded' })
    if ($found.Count -ne 1) { throw "Published asset missing or ambiguous: $Name" }
    $a = $found[0]; Assert-Url $a.browser_download_url $Repository $Release.tag_name
    $digest = [string](Property $a 'digest' '')
    if ($digest -cnotmatch '^sha256:[a-f0-9]{64}$') { throw "No authenticated GitHub SHA-256 digest for $Name" }
    return [pscustomobject]@{ name=$a.name; url=$a.browser_download_url; size=[long]$a.size; sha256=$digest.Substring(7) }
}
function Binary-Version($Path) {
    $v=[Diagnostics.FileVersionInfo]::GetVersionInfo((Resolve-Path -LiteralPath $Path).Path)
    return ('{0}.{1}.{2}.{3}' -f $v.FileMajorPart,$v.FileMinorPart,$v.FileBuildPart,$v.FilePrivatePart)
}
function Installed-Ide($Root) {
    $build = Get-Content -LiteralPath (Join-Path $Root 'ide/build.js') -Raw
    if ($build -match 'twinBASIC IDE BETA (\d+)') { return $Matches[1] }
    throw 'Unrecognized installed IDE build/channel; automatic IDE update disabled.'
}
function Installed-Addin($Root, $Architecture) {
    $dll=Safe-Path $Root ('addins/'+$Architecture+'/tbUI3IDE.dll')
    if (!(Test-Path -LiteralPath $dll)) { return '0' }
    $version=Binary-Version $dll; $stable=$false
    $receipt=Safe-Path $Root 'tbUI3-addin.json'
    if (Test-Path -LiteralPath $receipt) {
        $r=Read-Json $receipt
        if ((Property $r 'channel' '') -eq 'stable' -and $r.version -ceq $version -and @($r.files).Count -eq 2) {
            $stable=$true; $seen=@{}
            foreach ($f in $r.files) {
                Assert-Target 'addin' $f.target
                if ($seen.ContainsKey($f.target)) { $stable=$false; break }; $seen[$f.target]=$true
                $file=Safe-Path $Root $f.target
                if (!(Test-Path -LiteralPath $file) -or (Hash $file) -ne $f.sha256) { $stable=$false; break }
            }
        }
    }
    return Normalize-AddinVersion $version $stable
}
function Assert-NoDowngrade($Plan, $Ctx) {
    foreach ($c in $Plan.components) {
        $versions=@()
        switch ($c.id) {
            'ide' { $versions=@(Installed-Ide $Ctx.installRoot) }
            'addin' { $versions=@((Installed-Addin $Ctx.installRoot 'win32'),(Installed-Addin $Ctx.installRoot 'win64')) }
            'library' { $versions=@(Installed-Library) }
            'updater' { $exe=Safe-Path $Ctx.installRoot 'Updater.exe'; if (Test-Path -LiteralPath $exe) { $versions=@(Binary-Version $exe) } }
            default {
                $receipt=Safe-Path (Root-For $c.id $Ctx.installRoot) ('tbUI3-'+$c.id+'.json')
                if (Test-Path -LiteralPath $receipt) { $versions=@((Read-Json $receipt).version) }
            }
        }
        foreach ($v in $versions) { if ((Compare-Version $v $c.version) -gt 0) { throw ('A newer '+$c.id+' version is already installed. Check updates again before retrying.') } }
    }
}
function Installed-Library([string]$path = (Join-Path $env:LOCALAPPDATA 'tbUI3/tbUI3-Icons.dat')) {
    if (!(Test-Path -LiteralPath $path)) { return '0' }
    $stream = [IO.File]::OpenRead($path)
    try {
        $header = New-Object byte[] 32
        if ($stream.Read($header,0,32) -ne 32 -or [Text.Encoding]::ASCII.GetString($header,0,8) -ne 'tbUI3LIB' -or [BitConverter]::ToInt32($header,8) -ne 1) { throw 'Invalid installed icon library.' }
        $offset = [BitConverter]::ToInt32($header,16); $length = [BitConverter]::ToInt32($header,20)
        if ($offset -lt 32 -or $length -le 0 -or ([long]$offset + $length) -gt $stream.Length) { throw 'Invalid icon library index.' }
        $stream.Position = $offset; $bytes = New-Object byte[] ([Math]::Min(256,$length)); [void]$stream.Read($bytes,0,$bytes.Length)
        if ([Text.Encoding]::ASCII.GetString($bytes) -match '^#tbUI3-Icons\|([\d.]+)\|') { return $Matches[1] }
        throw 'Missing icon library version.'
    } finally { $stream.Dispose() }
}
function Root-For($Id, $InstallRoot) {
    switch ($Id) {
        'themes' { return (Join-Path $env:APPDATA 'twinBASIC/themes') }
        'library' { return (Join-Path $env:LOCALAPPDATA 'tbUI3') }
        'controlPackage' { return (Join-Path $env:LOCALAPPDATA 'tbUI3/Downloads') }
        default { return $InstallRoot }
    }
}
function Assert-Target($Id, $Path) {
    Assert-Relative $Path
    $ok = switch ($Id) {
        'ide' { $Path -cmatch '^(twinBASIC\.exe|(?:bin|ide|locale|packages)/.+)$' }
        'addin' { $Path -cmatch '^addins/(win32|win64)/tbUI3IDE\.dll$' }
        'themes' { $Path -cin @('WinUI3 Dark.theme','WinUI3 Light.theme') }
        'library' { $Path -cin @('tbUI3-Icons.dat','NOTICE.txt') }
        'updater' { $Path -cin @('Updater.exe','Updater.ps1') }
        'controlPackage' { $Path -cmatch '^tbUI3-[0-9.]+\.twinpack$' }
        default { $false }
    }
    if (!$ok) { throw "Unmanaged destination for ${Id}: $Path" }
}
function Validate-Component($Component) {
    $id = $Component.id
    if ($id -notin @('addin','themes','updater','controlPackage','library','ide')) { throw 'Unknown component.' }
    [void](Compare-Version $Component.version '0')
    Assert-Hash $Component.asset.sha256
    if ($Component.asset.size -le 0 -or $Component.asset.size -gt 536870912) { throw 'Invalid asset size.' }
    $repository = switch ($id) { 'ide' {'twinbasic/twinbasic'} 'library' {'Arrow-Loop/tbUI3-Libraries'} default {'Arrow-Loop/tbUI3'} }
    Assert-Url $Component.asset.url $repository
    $seen = @{}; $destinations = @{}
    foreach ($f in $Component.files) {
        Assert-Relative $f.source; Assert-Target $id $f.target; Assert-Hash $f.sha256
        if ($f.size -le 0 -or $f.size -gt 536870912 -or $seen.ContainsKey($f.source) -or $destinations.ContainsKey($f.target)) { throw 'Invalid or duplicate file metadata.' }
        $seen[$f.source]=$true; $destinations[$f.target]=$true
    }
    if ($id -notin @('ide','library') -and @($Component.files).Count -eq 0) { throw 'Empty component.' }
    if ($id -eq 'addin' -and (@($Component.files).Count -ne 2 -or !$destinations.ContainsKey('addins/win32/tbUI3IDE.dll') -or !$destinations.ContainsKey('addins/win64/tbUI3IDE.dll'))) { throw 'Both add-in architectures are required.' }
    if ($id -eq 'updater' -and (@($Component.files).Count -ne 2 -or !$destinations.ContainsKey('Updater.exe') -or !$destinations.ContainsKey('Updater.ps1'))) { throw 'Updater launcher and engine must ship together.' }
}
function Component($Id, $Version, $Installed, $Asset, $Files, $Source, $Summary) {
    [pscustomobject]@{ id=$Id; version=$Version; installed=$Installed; available=((Compare-Version $Installed $Version) -lt 0); asset=$Asset; files=@($Files); source=$Source; summary=$Summary; compatible=$true }
}
function Discover($Ctx, $Session) {
    $components = @(); $errors = @(); $ideVersion = $null
    try {
        $ideVersion = Installed-Ide $Ctx.installRoot
        $releases = @(Get-Releases 'twinbasic/twinbasic' | Where-Object { !$_.draft -and $_.tag_name -cmatch '^beta-x-\d+$' } | Sort-Object { [int]($_.tag_name -replace '^beta-x-','') } -Descending)
        if (!$releases.Count) { throw 'No official beta release found.' }
        $r = $releases[0]; $v = ([uint32]$r.tag_name.Substring(7)).ToString(); $a = Asset $r "twinBASIC_IDE_BETA_$v.zip" 'twinbasic/twinbasic'
        $entry=Component 'ide' $v $ideVersion $a @() $r.html_url 'Official beta portable distribution. Verifies existing vendor files before replacing them; preserves projects, add-ins, themes and preferences.'
        $baseline=$null
        if ($entry.available) {
            $old=@($releases | Where-Object { [uint32]$_.tag_name.Substring(7) -eq [uint32]$ideVersion })
            if ($old.Count -eq 1) { $baseline=Asset $old[0] ('twinBASIC_IDE_BETA_'+$ideVersion+'.zip') 'twinbasic/twinbasic' }
        }
        $entry | Add-Member NoteProperty baselineAsset $baseline
        $components += $entry
    } catch { $errors += 'twinBASIC: ' + $_.Exception.Message }
    try {
        $releases = @(Get-Releases 'Arrow-Loop/tbUI3' | Where-Object { !$_.draft -and $_.tag_name -cmatch '^tbUI3IDE-v\d+\.\d+\.\d+\.\d+$' -and @($_.assets | Where-Object name -CEQ 'tbUI3-update.json').Count -eq 1 } | Sort-Object { [version]($_.tag_name.Substring(10)) } -Descending)
        if (!$releases.Count) { throw 'No published tbUI3IDE release with tbUI3-update.json yet.' }
        $r = $releases[0]; $a = Asset $r 'tbUI3-update.json' 'Arrow-Loop/tbUI3'
        if ($a.size -gt 1048576) { throw 'Release manifest is too large.' }
        $manifestPath = Join-Path $Session 'release.json'; Download $a.url $manifestPath $a.size $a.sha256
        $m = Read-Json $manifestPath
        $releaseVersion=$r.tag_name.Substring(10)
        $development=$releaseVersion.StartsWith('0.')
        if (($development -and (!$r.prerelease -or $m.channel -ne 'development')) -or (!$development -and ($r.prerelease -or $m.channel -ne 'stable'))) { throw 'Release channel does not match its version designation.' }
        if ($m.schema -ne 1 -or $m.releaseTag -cne $r.tag_name) { throw 'Manifest schema or release identity mismatch.' }
        $ids = @{}
        foreach ($c in $m.components) {
            if ($c.id -notin @('addin','themes','updater','controlPackage') -or $ids.ContainsKey($c.id)) { throw 'Duplicate/unsupported release component.' }; $ids[$c.id]=$true
            $asset = Asset $r $c.asset 'Arrow-Loop/tbUI3'
            $installed = '0'
            if ($c.id -eq 'addin') {
                $versions=@((Installed-Addin $Ctx.installRoot 'win32'),(Installed-Addin $Ctx.installRoot 'win64'))
                $installed=$versions[0]; if ((Compare-Version $versions[1] $installed) -lt 0) { $installed=$versions[1] }
            } else {
                $receipt = Join-Path (Root-For $c.id $Ctx.installRoot) ('tbUI3-' + $c.id + '.json')
                if (Test-Path -LiteralPath $receipt) {
                    $saved = Read-Json $receipt
                    # A receipt is authoritative only while every managed file still matches it.
                    $valid = $true
                    foreach ($f in $saved.files) { $p = Safe-Path (Root-For $c.id $Ctx.installRoot) $f.target; if (!(Test-Path -LiteralPath $p) -or (Hash $p) -ne $f.sha256) { $valid=$false } }
                    if ($valid) { $installed=$saved.version }
                }
            }
            if ($c.id -eq 'addin' -and ($c.version -cne $releaseVersion -or $c.asset -cne ('tbUI3IDE-'+$releaseVersion+'.zip'))) { throw 'Add-in tag/version/asset identity mismatch.' }
            $entry = Component $c.id $c.version $installed $asset $c.files $r.html_url ([string]$c.summary)
            $entry | Add-Member NoteProperty channel $m.channel
            Validate-Component $entry
            if ($c.id -eq 'addin') {
                $entry | Add-Member NoteProperty architectures ([pscustomobject]@{win32=$versions[0];win64=$versions[1]})
                $min = [int]$c.minIdeBuild; $max = [int]$c.maxIdeBuild
                $entry | Add-Member NoteProperty minIdeBuild $min; $entry | Add-Member NoteProperty maxIdeBuild $max
                $entry.compatible = ($null -ne $ideVersion -and [int]$ideVersion -ge $min -and [int]$ideVersion -le $max)
            }
            $components += $entry
        }
    } catch { $errors += 'tbUI3: ' + $_.Exception.Message }
    try {
        $text = Invoke-RestMethod 'https://raw.githubusercontent.com/Arrow-Loop/tbUI3-Libraries/main/icons/manifest.txt' -Headers @{'User-Agent'=$script:Agent} -TimeoutSec 30
        $fields = @{}; foreach ($line in ([string]$text -split '\r?\n')) { if ($line -match '^([^=]+)=(.*)$') { $fields[$Matches[1].Trim().ToLowerInvariant()]=$Matches[2].Trim() } }
        if ($fields.format -ne '1' -or $fields.file -match '[/\\]' -or !$fields.file) { throw 'Unsupported library manifest.' }
        Assert-Hash $fields.datsha256
        $a = [pscustomobject]@{ name=$fields.file; url=$fields.url; size=[long]$fields.size; sha256=$fields.sha256 }
        $entry = Component 'library' $fields.version (Installed-Library) $a @() 'https://github.com/Arrow-Loop/tbUI3-Libraries/releases' 'Developer icon/resource library; uses the icon picker Setup format and installed header version.'
        $entry | Add-Member NoteProperty datsha256 $fields.datsha256
        Validate-Component $entry; $components += $entry
    } catch { $errors += 'Icon library: ' + $_.Exception.Message }
    return [pscustomobject]@{ components=@($components); errors=@($errors) }
}
function Extract-Component($C, $ZipPath, $Directory) {
    Validate-Component $C
    [void][IO.Directory]::CreateDirectory($Directory)
    $zip = [IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entries = @{}; [long]$expanded = 0
        foreach ($e in $zip.Entries) {
            $name=$e.FullName.TrimEnd('/'); Assert-Relative $name
            if ($entries.ContainsKey($name)) { throw 'Duplicate archive destination.' }; $entries[$name]=$e
            if ((($e.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000 -or ($e.ExternalAttributes -band 0x400)) { throw 'Archive links are forbidden.' }
            $expanded += $e.Length; if ($expanded -gt 2147483648) { throw 'Archive expands beyond the supported limit.' }
        }
        $files = @($C.files)
        if ($C.id -eq 'ide') {
            $files=@(); foreach ($e in $zip.Entries) {
                if ($e.FullName.EndsWith('/')) { continue }
                # Deliberately excludes addins, projects, themes and configuration files.
                if ($e.FullName -cmatch '^(twinBASIC\.exe|(?:bin|ide|locale|packages)/.+)$') { $files += [pscustomobject]@{source=$e.FullName; target=$e.FullName; size=$e.Length; sha256='' } }
            }
            if (!@($files | Where-Object target -CEQ 'twinBASIC.exe').Count -or !@($files | Where-Object target -CEQ 'ide/build.js').Count) { throw 'Unexpected official portable ZIP layout.' }
        } elseif ($C.id -eq 'library') {
            if (!$entries.ContainsKey('tbUI3-Icons.dat') -or !$entries.ContainsKey('NOTICE.txt')) { throw 'Library files missing.' }
            $files=@([pscustomobject]@{source='tbUI3-Icons.dat';target='tbUI3-Icons.dat';size=$entries['tbUI3-Icons.dat'].Length;sha256=$C.datsha256},[pscustomobject]@{source='NOTICE.txt';target='NOTICE.txt';size=$entries['NOTICE.txt'].Length;sha256=''})
        }
        foreach ($f in $files) {
            Assert-Target $C.id $f.target
            if (!$entries.ContainsKey($f.source) -or $entries[$f.source].Length -ne $f.size) { throw "Missing or wrong size: $($f.source)" }
            $dst = Safe-Path $Directory $f.source
            [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dst))
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entries[$f.source], $dst, $false)
            $sha = Hash $dst
            if ($f.sha256 -and $sha -ne $f.sha256) { throw "Extracted hash mismatch: $($f.source)" }; $f.sha256=$sha
            Assert-CodeSignature $dst
            if ($C.id -eq 'ide' -and $f.target -ceq 'twinBASIC.exe') { Assert-Pe $dst 0 }
            if ($C.id -eq 'addin') { Assert-Pe $dst $(if ($f.target -like '*win64*') {0x8664} else {0x14c}); if ((Compare-Version (Binary-Version $dst) $C.version) -ne 0) { throw 'Add-in binary version differs from its release manifest.' } }
            if ($C.id -eq 'updater' -and $f.target -eq 'Updater.exe') { Assert-Pe $dst 0x14c; if ((Compare-Version (Binary-Version $dst) $C.version) -ne 0) { throw 'Updater binary version differs from its release manifest.' } }
        }
        if ($C.id -eq 'library' -and (Installed-Library (Join-Path $Directory 'tbUI3-Icons.dat')) -ne $C.version) { throw 'Icon library header version does not match its manifest.' }
        if ($C.id -eq 'ide' -and (Installed-Ide $Directory) -ne $C.version) { throw 'Official archive build does not match its release.' }
        return ,$files
    } finally { $zip.Dispose() }
}
function Assert-CodeSignature($Path) {
    if ([IO.Path]::GetExtension($Path) -notin @('.exe','.dll','.ps1')) { return }
    $signature=Get-AuthenticodeSignature -LiteralPath $Path
    # Unsigned first-party twinBASIC binaries use the authenticated release digest.
    # A supplied signature must validate; never waive a broken publisher signature.
    if ($signature.SignerCertificate -and $signature.Status -ne 'Valid') { throw ('Invalid publisher signature: '+[IO.Path]::GetFileName($Path)) }
}
function Assert-Pe($Path, $Machine) {
    $s=[IO.File]::OpenRead($Path); $r=[IO.BinaryReader]::new($s)
    try { if ($r.ReadUInt16() -ne 0x5A4D) { throw 'Missing MZ header.' }; $s.Position=0x3c; $pos=$r.ReadInt32(); $s.Position=$pos; if ($r.ReadUInt32() -ne 0x4550) { throw 'Missing PE header.' }; $actual=$r.ReadUInt16(); if (($Machine -ne 0 -and $actual -ne $Machine) -or ($Machine -eq 0 -and $actual -notin @(0x14c,0x8664))) { throw 'PE architecture mismatch.' } } finally { $r.Dispose() }
}
function Validate-Context($Ctx) {
    $root=[IO.Path]::GetFullPath($Ctx.installRoot).TrimEnd('\')
    $ide=Safe-Path $root 'twinBASIC.exe'
    if (!(Test-Path -LiteralPath $ide) -or $Ctx.ideExe -ine $ide) { throw 'Context does not identify an existing twinBASIC installation.' }
    return $root
}
function Capture-Identity($Ctx) {
    $p=Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$Ctx.compilerPid)"
    if (!$p -or !$p.ExecutablePath.StartsWith($Ctx.installRoot+'\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Compiler process is outside the selected installation.' }
    for ($i=0; $i -lt 8 -and $p; $i++) {
        if ($p.ExecutablePath -ieq $Ctx.ideExe) {
            return [pscustomobject]@{pid=[int]$p.ProcessId; startTime=([Diagnostics.Process]::GetProcessById($p.ProcessId)).StartTime.ToUniversalTime().Ticks}
        }
        $p=Get-CimInstance Win32_Process -Filter "ProcessId = $([int]$p.ParentProcessId)"
    }; throw 'Could not identify the owning IDE process. Open the add-in inside the IDE.'
}
function Wait-Installation($Ctx, $Identity, [int]$TimeoutSeconds = 120) {
    $deadline=[DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    do {
        $owner=Get-Process -Id $Identity.pid -ErrorAction SilentlyContinue
        $ownerAlive=$owner -and $owner.StartTime.ToUniversalTime().Ticks -eq $Identity.startTime
        $others=@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and ($_.ExecutablePath -ieq $Ctx.ideExe -or $_.ExecutablePath.StartsWith($Ctx.installRoot+'\bin\',[StringComparison]::OrdinalIgnoreCase)) })
        if (!$ownerAlive -and !$others.Count) { return }
        Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)
    throw 'IDE shutdown was cancelled, another session is open, or compiler/cache processes still hold the installation. Close them normally and retry.'
}
function Assert-Unlocked($Path) {
    if (Test-Path -LiteralPath $Path) { $s=[IO.File]::Open($Path,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None); $s.Dispose() }
}
function Flush-Path($Path) {
    $stream=[IO.File]::Open($Path,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::Read)
    try { $stream.Flush($true) } finally { $stream.Dispose() }
}
function Assert-Approval($Session) {
    $path=Join-Path $Session 'approved.json'
    if (!(Test-Path -LiteralPath $path) -or !(Read-Json $path).normalShutdown) {
        throw 'No normal-shutdown approval was received. A cancelled save prompt or abnormal exit cannot install updates. Retry from the IDE.'
    }
}
function Replace-File($Source, $Destination) {
    $parent=[IO.Path]::GetDirectoryName($Destination); [void][IO.Directory]::CreateDirectory($parent)
    $temp=Join-Path $parent ('.tbUI3-'+[Guid]::NewGuid().ToString('N')+'.tmp')
    try {
        [IO.File]::Copy($Source,$temp,$false); Flush-Path $temp
        if ([IO.File]::Exists($Destination)) { [IO.File]::Replace($temp,$Destination,[NullString]::Value) } else { [IO.File]::Move($temp,$Destination) }
    } finally { if ([IO.File]::Exists($temp)) { [IO.File]::Delete($temp) } }
}
function Validate-Journal($Journal, $Plan, $Session) {
    if ($Journal.schema -ne 1 -or $Journal.status -notin @('preparing','applying','rollingBack','rolledBack','complete')) { throw 'Unsupported recovery journal.' }
    $expected=@{}; foreach ($o in $Plan.operations) { $expected[([IO.Path]::GetFullPath($o.root)+'|'+$o.target)]=$o }
    foreach ($o in $Journal.operations) {
        $key=[IO.Path]::GetFullPath($o.root)+'|'+$o.target
        if (!$expected.ContainsKey($key) -or $o.sha256 -cne $expected[$key].sha256 -or $o.state -notin @('prepared','intent','applied','reverted')) { throw 'Journal differs from the approved plan.' }
        $backupRoot=Join-Path $Session 'backup'
        if ([IO.Path]::GetDirectoryName($o.backup) -ine $backupRoot -or [IO.Path]::GetFileName($o.backup) -notmatch '^\d+$') { throw 'Recovery backup escapes session.' }
        if ($o.existed) { Assert-Hash $o.originalSha256 }
    }
}
function Clean-CompletedSessions($CurrentSession) {
    $root=[IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'tbUI3/Updater')).TrimEnd('\')+'\'
    if (!(Test-Path -LiteralPath $root)) { return }
    foreach ($dir in Get-ChildItem -LiteralPath $root -Directory) {
        if ($dir.FullName -ieq $CurrentSession -or $dir.LastWriteTimeUtc -gt [DateTime]::UtcNow.AddDays(-7)) { continue }
        $journal=Join-Path $dir.FullName 'journal.json'
        if (!(Test-Path -LiteralPath $journal)) { continue }
        try {
            if ((Read-Json $journal).status -notin @('complete','rolledBack')) { continue }
            $resolved=[IO.Path]::GetFullPath($dir.FullName)
            if (!$resolved.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)) { continue }
            # Only explicitly completed updater sessions, under this exact user staging root.
            # Inspect every descendant before recursive deletion; never follow a reparse point.
            $items=@($dir)+@(Get-ChildItem -LiteralPath $resolved -Recurse -Force)
            if (@($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { continue }
            [IO.Directory]::Delete($resolved,$true)
        } catch { # A locked diagnostic/session is retained and reconsidered next check.
        }
    }
}
function Rollback($Journal, $JournalPath) {
    $Journal.status='rollingBack'; Write-Json $JournalPath $Journal
    $ops=@($Journal.operations)
    for ($i=$ops.Count-1; $i -ge 0; $i--) {
        $o=$ops[$i]
        if ($o.state -notin @('intent','applied')) { continue }
        $target=Safe-Path $o.root $o.target; Assert-Unlocked $target
        if (Test-Path -LiteralPath $target) {
            $current=Hash $target
            if ($current -ne $o.sha256 -and (!$o.existed -or $current -ne $o.originalSha256)) { throw "Rollback stopped to preserve an unexpected local modification: $target" }
        }
        if ($o.existed) {
            if (!(Test-Path -LiteralPath $o.backup) -or (Hash $o.backup) -ne $o.originalSha256) { throw 'Rollback backup is missing/corrupt.' }
            Replace-File $o.backup $target
            if ((Hash $target) -ne $o.originalSha256) { throw 'Restored backup failed verification.' }
        } elseif (Test-Path -LiteralPath $target) { [IO.File]::Delete($target) }
        $o.state='reverted'; Write-Json $JournalPath $Journal
    }
    $Journal.status='rolledBack'; Write-Json $JournalPath $Journal
}
function Install-Transaction($Plan, $JournalPath, [string]$StatePath = '') {
    if (Test-Path -LiteralPath $JournalPath) {
        $old=Read-Json $JournalPath
        Validate-Journal $old $Plan ([IO.Path]::GetDirectoryName($JournalPath))
        if ($old.status -eq 'complete') {
            foreach ($o in $old.operations) {
                $target=Safe-Path $o.root $o.target
                if (!(Test-Path -LiteralPath $target) -or (Hash $target) -ne $o.sha256) { throw 'A completed update has since changed locally. It was preserved; check updates again.' }
            }
            return
        }
        if ($old.status -ne 'rolledBack') { Rollback $old $JournalPath }
    }
    $journal=[pscustomobject]@{schema=1;status='preparing';operations=@()}
    $backupDir=Join-Path ([IO.Path]::GetDirectoryName($JournalPath)) 'backup'; [void][IO.Directory]::CreateDirectory($backupDir)
    $seen=@{}
    # Preflight the entire transaction before its first destination write.
    foreach ($o in $Plan.operations) {
        $target=Safe-Path $o.root $o.target
        if ($seen.ContainsKey($target)) { throw 'Two components target the same file.' }; $seen[$target]=$true
        if ((Hash $o.staged) -ne $o.sha256) { throw 'Staging has changed since approval.' }
        Assert-Unlocked $target
        $existed=[IO.File]::Exists($target); $backup=Join-Path $backupDir ([string]$journal.operations.Count)
        $original=''
        $expected=Property $o 'expectedOriginal' ''
        if ((Property $o 'expectAbsent' $false) -and $existed) { throw 'A vendor destination appeared after staging; it was preserved.' }
        if ($expected -and (!$existed -or (Hash $target) -ne $expected)) { throw 'A vendor file changed after staging; it was preserved.' }
        if ($existed) { $original=Hash $target; [IO.File]::Copy($target,$backup,$true); Flush-Path $backup; if ((Hash $backup) -ne $original) { throw 'Backup validation failed.' } }
        $journal.operations += [pscustomobject]@{root=$o.root;target=$o.target;staged=$o.staged;sha256=$o.sha256;existed=$existed;backup=$backup;originalSha256=$original;state='prepared'}
    }
    $journal.status='applying'; Write-Json $JournalPath $journal
    try {
        foreach ($o in $journal.operations) {
            $target=Safe-Path $o.root $o.target; Assert-Unlocked $target
            if ($o.existed -and (Hash $target) -ne $o.originalSha256) { throw 'Destination changed after backup.' }
            if (!$o.existed -and (Test-Path -LiteralPath $target)) { throw 'A destination appeared after preflight.' }
            $o.state='intent'; Write-Json $JournalPath $journal
            Replace-File $o.staged $target
            if ((Hash $target) -ne $o.sha256) { throw 'Installed file failed verification.' }
            $o.state='applied'; Write-Json $JournalPath $journal
            if ($StatePath) { Write-Json $StatePath @{status='installing';message='Installing and verifying selected updates...';completed=@($journal.operations | Where-Object state -EQ 'applied').Count;total=$journal.operations.Count} }
        }
        $journal.status='complete'; Write-Json $JournalPath $journal
    } catch {
        $failure=$_.Exception.Message
        try { Rollback $journal $JournalPath } catch { throw "Update failed: $failure. Recovery needs attention: $($_.Exception.Message). Keep $JournalPath and its backups." }
        throw "Update failed and was rolled back: $failure"
    }
}
function Ide-Baseline($Ctx, $C, $Session) {
    $version=Installed-Ide $Ctx.installRoot
    if ($version -ne $C.installed) { throw 'The installed IDE changed after discovery. Check updates again.' }
    $receipt=Safe-Path $Ctx.installRoot 'tbUI3-ide.json'; $records=@()
    if (Test-Path -LiteralPath $receipt) {
        $r=Read-Json $receipt
        if ($r.version -ceq $version) { $records=@($r.files) }
    }
    if (!$records.Count) {
        $asset=Property $C 'baselineAsset'
        if (!$asset) { throw 'The current vendor build has no authenticated baseline in the supported release window. Update the IDE manually; other components remain available.' }
        $zip=Join-Path $Session 'ide-baseline.zip'; Download $asset.url $zip $asset.size $asset.sha256
        $baseline=Component 'ide' $version $version $asset @() '' ''
        $directory=Join-Path $Session ('baseline-'+[Guid]::NewGuid().ToString('N'))
        $records=Extract-Component $baseline $zip $directory
    }
    $map=@{}
    foreach ($f in $records) {
        Assert-Target 'ide' $f.target; Assert-Hash $f.sha256
        if ($map.ContainsKey($f.target)) { throw 'Duplicate vendor baseline destination.' }
        $map[$f.target]=$f.sha256
    }
    if (!$map.ContainsKey('twinBASIC.exe') -or !$map.ContainsKey('ide/build.js')) { throw 'Incomplete vendor baseline.' }
    return $map
}
function Protect-VendorFile($Operation, $Baseline) {
    $target=Safe-Path $Operation.root $Operation.target
    $Operation | Add-Member NoteProperty expectedOriginal ''
    $Operation | Add-Member NoteProperty expectAbsent $true
    if (Test-Path -LiteralPath $target) {
        if (!$Baseline.ContainsKey($Operation.target) -or (Hash $target) -ne $Baseline[$Operation.target]) {
            throw ('A vendor destination contains a local modification or user file: '+$target+'. It was preserved. Restore the original vendor file or update manually.')
        }
        $Operation.expectedOriginal=$Baseline[$Operation.target]; $Operation.expectAbsent=$false
    }
}
function Make-Plan($Ctx, $Catalog, $Selected, $Session) {
    $ops=@(); $ids=@{}; $chosen=@()
    foreach ($id in $Selected) {
        if ($ids.ContainsKey($id)) { throw 'Duplicate selected component.' }; $ids[$id]=$true
        $match=@($Catalog.components | Where-Object id -CEQ $id)
        if ($match.Count -ne 1 -or !$match[0].available) { throw 'Selected update is no longer available.' }; $chosen += $match[0]
    }
    if (!$chosen.Count) { throw 'Select at least one update.' }
    $ide=Installed-Ide $Ctx.installRoot
    foreach ($c in $chosen) { if ($c.id -eq 'ide') { $ide=$c.version } }
    foreach ($c in $chosen) {
        if ($c.id -eq 'addin' -and ([int]$ide -lt $c.minIdeBuild -or [int]$ide -gt $c.maxIdeBuild)) { throw 'Selected add-in does not support the resulting IDE build.' }
        $zip=Join-Path $Session ($c.id+'.zip'); Download $c.asset.url $zip $c.asset.size $c.asset.sha256
        $dir=Join-Path $Session ('staged-'+$c.id+'-'+[Guid]::NewGuid().ToString('N')); $files=Extract-Component $c $zip $dir
        $root=Root-For $c.id $Ctx.installRoot
        $baseline=$null
        if ($c.id -eq 'ide') { $baseline=Ide-Baseline $Ctx $c $Session }
        foreach ($f in $files) {
            $op=[pscustomobject]@{root=$root;target=$f.target;staged=(Safe-Path $dir $f.source);sha256=$f.sha256}
            if ($c.id -eq 'ide') { Protect-VendorFile $op $baseline }
            $ops += $op
        }
        if ($c.id -notin @('library')) {
            $receipt=Join-Path $Session ($c.id+'-receipt.json'); Write-Json $receipt ([pscustomobject]@{version=$c.version;channel=(Property $c 'channel' 'development');files=@($files)})
            $ops += [pscustomobject]@{root=$root;target=('tbUI3-'+$c.id+'.json');staged=$receipt;sha256=(Hash $receipt)}
        }
    }
    return [pscustomobject]@{schema=1;operations=@($ops);components=@($chosen);identity=$Catalog.identity}
}
function Validate-Plan($Plan, $Ctx, $Session) {
    if ($Plan.schema -ne 1 -or !$Plan.operations.Count) { throw 'Invalid staged plan.' }
    foreach ($o in $Plan.operations) {
        $valid=$false
        foreach ($c in $Plan.components) {
            Validate-Component $c
            if ($o.root -ine (Root-For $c.id $Ctx.installRoot)) { continue }
            if ($o.target -ceq ('tbUI3-'+$c.id+'.json') -and $c.id -notin @('library')) { $valid=$true; break }
            try { Assert-Target $c.id $o.target; $valid=$true; break } catch {}
        }
        if (!$valid) { throw 'Plan destination is not an approved component path.' }
        $base=[IO.Path]::GetFullPath($Session).TrimEnd('\')+'\'
        if (!$o.staged.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)) { throw 'Staged file escapes session.' }
        [void](Safe-Path $Session $o.staged.Substring($base.Length).Replace('\','/')); Assert-Hash $o.sha256
    }
}
function Start-DetachedEngine($Ctx, $Session) {
    # A verified local copy owns the visible WebView2 window. Both installed sidecar
    # files are free for replacement; the engine starts only after UI bootstrap.
    $runner=Safe-Path $Session ('runner-'+[Guid]::NewGuid().ToString('N')); [void][IO.Directory]::CreateDirectory($runner)
    $engine=Join-Path $runner 'Updater.ps1'; [IO.File]::Copy($PSCommandPath,$engine,$true)
    if ((Hash $engine) -ne (Hash $PSCommandPath)) { throw 'Detached engine copy failed verification.' }
    $source=Safe-Path $Ctx.installRoot 'Updater.exe'; $exe=Join-Path $runner 'Updater.exe'
    Assert-Pe $source 0x14c; [IO.File]::Copy($source,$exe,$true)
    if ((Hash $exe) -ne (Hash $source)) { throw 'Detached launcher copy failed verification.' }
     $launchArguments='-Mode Apply -Context "'+$Context+'"'
    Start-Process -FilePath $exe -ArgumentList $launchArguments -WindowStyle Normal | Out-Null
}
function Run-Updater {
    if (!$Context) { throw 'A context file is required.' }
    $ctx=Read-Json $Context; $ctx.installRoot=Validate-Context $ctx
    $session=[IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Context))
    $state=Join-Path $session 'state.json'; $catalogPath=Join-Path $session 'catalog.json'; $planPath=Join-Path $session 'plan.json'; $journalPath=Join-Path $session 'journal.json'
    try {
        switch ($Mode) {
            'Check' {
                Clean-CompletedSessions $session
                Write-Json $state @{status='checking';message='Checking published releases...'}
                $catalog=Discover $ctx $session
                $catalog | Add-Member NoteProperty identity (Capture-Identity $ctx)
                Write-Json $catalogPath $catalog
                Write-Json $state @{status='checked';catalog=$catalog;message='Release check complete.'}
            }
            'Stage' {
                Write-Json $state @{status='staging';message='Downloading and verifying selected updates...'}
                $catalog=Read-Json $catalogPath
                $plan=Make-Plan $ctx $catalog @($ctx.selected) $session; Validate-Plan $plan $ctx $session
                if (Test-Path -LiteralPath (Join-Path $session 'cancel.json')) { Write-Json $state @{status='cancelled';message='Pending update cancelled.'}; return }
                Write-Json $planPath $plan
                Write-Json $state @{status='ready';message='Verified and ready. Installation waits for normal IDE shutdown.';choice=$ctx.choice}
                Start-DetachedEngine $ctx $session
            }
            'Cancel' { Write-Json (Join-Path $session 'cancel.json') @{cancel=$true}; Write-Json $state @{status='cancelled';message='Pending update cancelled.'} }
            {$_ -in @('Apply','Recover')} {
                $plan=Read-Json $planPath; Validate-Plan $plan $ctx $session
                # One transaction per installation. Never kill any IDE/cache process.
                $rootHash=[BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($ctx.installRoot.ToLowerInvariant()))).Replace('-','')
                $mutex=[Threading.Mutex]::new($false,('Local\tbUI3Updater-'+$rootHash)); $held=$false
                try {
                    try { $held=$mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $held=$true }
                    if (!$held) { throw 'Another updater is using this installation.' }
                    # On Exit has a bounded 12-hour wait. Now gives cancelled save prompts a two-minute grace period.
                    Write-Json $state @{status='waiting';choice=$ctx.choice;message='Waiting for the normal IDE save and shutdown process. Close any other sessions for this installation.'}
                    $timeout=if ($ctx.choice -eq 'exit') {43200} else {120}
                    $deadline=[DateTime]::UtcNow.AddSeconds($timeout)
                    do {
                        if ($Mode -eq 'Apply' -and (Test-Path -LiteralPath (Join-Path $session 'cancel.json'))) { Write-Json $state @{status='cancelled';message='Update cancelled. Your installation was not changed.'}; return }
                        $p=Get-Process -Id $plan.identity.pid -ErrorAction SilentlyContinue
                        if (!$p -or $p.StartTime.ToUniversalTime().Ticks -ne $plan.identity.startTime) { break }
                        Start-Sleep -Milliseconds 500
                    } while ([DateTime]::UtcNow -lt $deadline)
                    if ($Mode -eq 'Apply') { Assert-Approval $session }
                    Wait-Installation $ctx $plan.identity 120
                    if ($Mode -eq 'Apply' -and (Test-Path -LiteralPath (Join-Path $session 'cancel.json'))) { Write-Json $state @{status='cancelled';message='Update cancelled. Your installation was not changed.'}; return }
                    Write-Json $state @{status='installing';message='Installing verified updates...'}
                    if ($Mode -eq 'Recover') { $recovery=Read-Json $journalPath; Validate-Journal $recovery $plan $session; Rollback $recovery $journalPath; Write-Json $state @{status='rolledBack';message='Previous installation restored.'}; return }
                    $active=Join-Path (Join-Path $env:LOCALAPPDATA 'tbUI3/Updater') ('active-'+$rootHash+'.json')
                    if (Test-Path -LiteralPath $active) {
                        $previous=Read-Json $active
                        if ($previous.journal -ine $journalPath -and (Test-Path -LiteralPath $previous.journal)) {
                            $old=Read-Json $previous.journal
                            if ($old.status -notin @('complete','rolledBack')) { throw ('An interrupted transaction needs recovery first: '+$previous.context) }
                        }
                    }
                    Assert-NoDowngrade $plan $ctx
                    Write-Json $active @{journal=$journalPath;context=$Context}
                    Install-Transaction $plan $journalPath $state
                    Write-Json $state @{status='complete';message='Selected updates installed and verified.'}
                    if (Property $ctx 'restart' $false) { Start-Process -FilePath $ctx.ideExe -WorkingDirectory $ctx.installRoot | Out-Null }
                } finally { if ($held) { $mutex.ReleaseMutex() }; $mutex.Dispose() }
            }
        }
    } catch {
        $message=$_.Exception.Message
        Write-Json $state @{status='error';message=$message;recovery=$journalPath}
        [IO.File]::AppendAllText((Join-Path $session 'updater.log'),([DateTime]::UtcNow.ToString('o')+' '+$Mode+': '+$message+[Environment]::NewLine))
        throw
    }
}
if ($Mode -ne 'Functions') {
    [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
    try { Run-Updater } catch { exit 1 }
}
