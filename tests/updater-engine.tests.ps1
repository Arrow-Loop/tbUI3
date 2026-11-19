# Actual filesystem/ZIP/recovery behavior; run with Windows PowerShell 5.1.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../tbIDE/Updater/Updater.ps1') -Mode Functions
$base=Join-Path ([IO.Path]::GetTempPath()) ('tbUI3-updater-tests-'+[Guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($base)
$script:passed=0
function Check($Name,[scriptblock]$Test) { & $Test; $script:passed++; Write-Output "PASS $Name" }
function Equal($A,$B) { if ($A -cne $B) { throw "Expected '$B', got '$A'." } }
function Reject([scriptblock]$Test) { $failed=$false;try { & $Test } catch { $failed=$true };if (!$failed) { throw 'Expected rejection.' } }
function Put($Path,$Text) { [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path));[IO.File]::WriteAllText($Path,$Text) }
function Fixture($Name) {
    $dir=Join-Path $base $Name;[void][IO.Directory]::CreateDirectory($dir)
    $root=Join-Path $dir 'install';[void][IO.Directory]::CreateDirectory($root)
    $staged=Join-Path $dir 'staged';[void][IO.Directory]::CreateDirectory($staged)
    Put (Join-Path $root 'existing') 'before'; Put (Join-Path $root 'user-owned') 'preserve'
    Put (Join-Path $staged 'a') 'after';Put (Join-Path $staged 'b') 'new'
    $ops=@([pscustomobject]@{root=$root;target='existing';staged=(Join-Path $staged 'a');sha256=(Hash (Join-Path $staged 'a'))},[pscustomobject]@{root=$root;target='new';staged=(Join-Path $staged 'b');sha256=(Hash (Join-Path $staged 'b'))})
    return @{root=$root;dir=$dir;plan=[pscustomobject]@{operations=$ops};journal=(Join-Path $dir 'journal.json')}
}
function Zip($Path,$Names) {
    $zip=[IO.Compression.ZipFile]::Open($Path,[IO.Compression.ZipArchiveMode]::Create)
    try {foreach ($n in $Names) {$e=$zip.CreateEntry($n);$writer=[IO.StreamWriter]::new($e.Open());$writer.Write('payload');$writer.Dispose()}}finally{$zip.Dispose()}
}
function Test-Component($Files) {
    [pscustomobject]@{id='themes';version='1.0';asset=[pscustomobject]@{url='https://github.com/Arrow-Loop/tbUI3/releases/download/v1/themes.zip';sha256=('a'*64);size=1};files=@($Files)}
}
Check 'numeric versions and downgrade comparison' {
    Equal (Compare-Version '1044' '997') 1; Equal (Compare-Version '1.3' '1.3.0.0') 0
    Equal (Compare-Version '2026.10.19.1' '2026.9.20.1') 1;Reject {Compare-Version 'beta-4' '3'}
}
Check 'add-in correction is bounded and stable transition remains numeric' {
    Equal (Normalize-AddinVersion '1.1.0.0') '0.1.0.0'
    Equal (Normalize-AddinVersion '1.2.0.2') '0.2.0.2'
    Equal (Normalize-AddinVersion '1.3.0.20') '0.3.0.20'
    Equal (Compare-Version (Normalize-AddinVersion '1.3.0.20') '0.3.0.20') 0
    Equal (Compare-Version (Normalize-AddinVersion '1.3.0.20') '0.3.0.21') -1
    Equal (Compare-Version '0.3.0.20' '1.0.0.0') -1
    Equal (Normalize-AddinVersion '1.3.0.20' $true) '1.3.0.20'
    Equal (Normalize-AddinVersion '1.2.0.1' $true) '1.2.0.1'
    Equal (Normalize-AddinVersion '1.0.0.0') '1.0.0.0'
    Equal (Normalize-AddinVersion '1.3.0.21') '1.3.0.21'
    Equal (Normalize-AddinVersion '1.3.5.2') '1.3.5.2'
    Equal (Compare-Version '1.0.0.75' '0.0.0.75') 1
}
Check 'traversal, Windows devices, ADS and source policy' {
    foreach($bad in @('../escape','/absolute','C:/drive','safe/../escape','safe\\escape','NUL.txt','x:y','name.','space /x','x//y')) {Reject {Assert-Relative $bad}}
    Reject {Assert-Url 'https://github.com/Arrow-Loop/tbUI3/releases/download/../outside.zip' 'Arrow-Loop/tbUI3'}
    Reject {Assert-Url 'https://github.com/Arrow-Loop/tbUI3/releases/download/v1/%252e%252e.zip' 'Arrow-Loop/tbUI3'}
    Reject {Assert-Url 'https://github.com/other/repo/releases/download/v1/a.zip' 'Arrow-Loop/tbUI3'}
    Reject {Assert-Url 'https://github.com/Arrow-Loop/tbUI3/releases/download/v2/a.zip' 'Arrow-Loop/tbUI3' 'v1'}
    Assert-Url 'https://github.com/Arrow-Loop/tbUI3/releases/download/v1/a.zip' 'Arrow-Loop/tbUI3' 'v1'
}
Check 'component allowlists protect projects, preferences and unrelated add-ins' {
    foreach($bad in @('projects/User.twinproj','settings.json','addins/win32/another.dll')) {Reject {Assert-Target 'ide' $bad}}
    Reject {Assert-Target 'addin' 'addins/win32/WinUI3IdeStyle.dll'}
    Reject {Assert-Target 'themes' 'Other.theme'}
    Reject {Assert-Target 'controlPackage' 'project.twinproj'}
}
Check 'atomic transaction preserves user files and repeat is idempotent' {
    $f=Fixture 'success';Install-Transaction $f.plan $f.journal
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'after'
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'new'))) 'new'
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'user-owned'))) 'preserve'
    Equal (Read-Json $f.journal).status 'complete';Install-Transaction $f.plan $f.journal
}
Check 'tampered staging stops before any replacement' {
    $f=Fixture 'tamper';Put $f.plan.operations[1].staged 'corrupt'
    Reject {Install-Transaction $f.plan $f.journal}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'before'
}
Check 'locked destination stops all selected components' {
    $f=Fixture 'locked';$lock=[IO.File]::Open((Join-Path $f.root 'existing'),[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
    try {Reject {Install-Transaction $f.plan $f.journal}}finally{$lock.Dispose()}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'before'
}
Check 'injected second-copy failure restores replaced and removes new files' {
    $f=Fixture 'failure';$saved=${function:Replace-File};$script:copies=0
    try {
        function Replace-File($Source,$Destination) { $script:copies++;if($script:copies -eq 2){throw 'Injected disk/copy failure'};& $saved $Source $Destination }
        Reject {Install-Transaction $f.plan $f.journal}
    } finally {Set-Item Function:Replace-File $saved}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'before'
    Equal (Test-Path -LiteralPath (Join-Path $f.root 'new')) $false
    Equal (Read-Json $f.journal).status 'rolledBack'
}
Check 'interrupted intent journal rolls back after replacement but before commit' {
    $f=Fixture 'interrupted';Install-Transaction $f.plan $f.journal
    $j=Read-Json $f.journal;$j.status='applying';$j.operations[1].state='intent';Write-Json $f.journal $j
    Rollback (Read-Json $f.journal) $f.journal
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'before'
    Equal (Test-Path -LiteralPath (Join-Path $f.root 'new')) $false
}
Check 'rollback refuses to destroy an unexpected local modification' {
    $f=Fixture 'modified';Install-Transaction $f.plan $f.journal
    Put (Join-Path $f.root 'existing') 'changed by user'
    Reject {Rollback (Read-Json $f.journal) $f.journal}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'changed by user'
}
Check 'archive traversal and case-colliding destinations are rejected before extraction' {
    $zip=Join-Path $base 'traversal.zip';Zip $zip @('safe','../escape')
    $c=Test-Component @([pscustomobject]@{source='safe';target='WinUI3 Dark.theme';size=7;sha256=('a'*64)})
    Reject {Extract-Component $c $zip (Join-Path $base 'extract1')}
    Equal (Test-Path -LiteralPath (Join-Path $base 'extract1/safe')) $false
    $zip=Join-Path $base 'duplicate.zip';Zip $zip @('same','SAME')
    Reject {Extract-Component $c $zip (Join-Path $base 'extract2')}
}
Check 'corrupt extracted payload is rejected' {
    $zip=Join-Path $base 'corrupt.zip';Zip $zip @('theme')
    $c=Test-Component @([pscustomobject]@{source='theme';target='WinUI3 Dark.theme';size=7;sha256=('a'*64)})
    Reject {Extract-Component $c $zip (Join-Path $base 'extract3')}
}
Check 'both add-in architectures are mandatory' {
    $c=Test-Component @([pscustomobject]@{source='a';target='addins/win32/tbUI3IDE.dll';size=1;sha256=('a'*64)})
    $c.id='addin';Reject {Validate-Component $c}
}
Check 'normal-shutdown approval is required; missing/corrupt approval fails closed' {
    $dir=Join-Path $base 'approval';[void][IO.Directory]::CreateDirectory($dir)
    Reject { Assert-Approval $dir }
    Write-Json (Join-Path $dir 'approved.json') @{normalShutdown=$false};Reject {Assert-Approval $dir}
    Write-Json (Join-Path $dir 'approved.json') @{normalShutdown=$true};Assert-Approval $dir
}
Check 'recovery journal cannot redirect backups or destinations' {
    $f=Fixture 'bad-journal';Install-Transaction $f.plan $f.journal
    $j=Read-Json $f.journal;Validate-Journal $j $f.plan $f.dir
    $j.operations[0].backup=Join-Path $base 'outside';Reject {Validate-Journal $j $f.plan $f.dir}
}
Check 'two selected components cannot overwrite the same destination' {
    $f=Fixture 'collision';$f.plan.operations[1].target='existing'
    Reject {Install-Transaction $f.plan $f.journal}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'before'
}
Check 'a staged plan cannot downgrade a newer IDE on later retry' {
    $f=Fixture 'downgrade';Put (Join-Path $f.root 'ide/build.js') "var tbVersionInfo = 'twinBASIC IDE BETA 1045';"
    $plan=[pscustomobject]@{components=@([pscustomobject]@{id='ide';version='1044'})}
    Reject {Assert-NoDowngrade $plan ([pscustomobject]@{installRoot=$f.root})}
}
Check 'library versions come from the established DAT header, without renumbering' {
    $path=Join-Path $base 'library.dat'
    $index=[Text.Encoding]::ASCII.GetBytes("#tbUI3-Icons|2026.10.19.1|0
")
    $bytes=New-Object byte[] (32+$index.Length)
    [Array]::Copy([Text.Encoding]::ASCII.GetBytes('tbUI3LIB'),0,$bytes,0,8)
    [Array]::Copy([BitConverter]::GetBytes([int]1),0,$bytes,8,4)
    [Array]::Copy([BitConverter]::GetBytes([int]32),0,$bytes,16,4)
    [Array]::Copy([BitConverter]::GetBytes([int]$index.Length),0,$bytes,20,4)
    [Array]::Copy($index,0,$bytes,32,$index.Length)
    [IO.File]::WriteAllBytes($path,$bytes)
    Equal (Installed-Library $path) '2026.10.19.1'
}
Check 'existing junctions cannot redirect installation writes' {
    $f=Fixture 'junction';$outside=Join-Path $f.dir 'outside';[void][IO.Directory]::CreateDirectory($outside)
    [void](New-Item -ItemType Junction -Path (Join-Path $f.root 'link') -Target $outside)
    Reject {Safe-Path $f.root 'link/escape'}
}
Check 'archive symbolic links are rejected' {
    $path=Join-Path $base 'symlink.zip'
    $zip=[IO.Compression.ZipFile]::Open($path,[IO.Compression.ZipArchiveMode]::Create)
    try{$entry=$zip.CreateEntry('link');$entry.ExternalAttributes=0xA1FF0000}finally{$zip.Dispose()}
    $c=Test-Component @([pscustomobject]@{source='link';target='WinUI3 Dark.theme';size=1;sha256=('a'*64)})
    Reject {Extract-Component $c $path (Join-Path $base 'extract-link')}
}
Check 'modified or colliding vendor files are preserved before planning replacement' {
    $f=Fixture 'vendor'
    $op=[pscustomobject]@{root=$f.root;target='existing';staged=$f.plan.operations[0].staged;sha256=$f.plan.operations[0].sha256}
    Reject {Protect-VendorFile $op @{}}
    $op=[pscustomobject]@{root=$f.root;target='existing';staged=$f.plan.operations[0].staged;sha256=$f.plan.operations[0].sha256}
    Protect-VendorFile $op @{existing=(Hash (Join-Path $f.root 'existing'))}
    Equal $op.expectAbsent $false
    Put (Join-Path $f.root 'existing') 'local patch after staging'
    Reject {Install-Transaction ([pscustomobject]@{operations=@($op)}) $f.journal}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'local patch after staging'
}
Check 'vendor baseline extraction preserves a multi-file array and verifies its build' {
    $f=Fixture 'baseline';Put (Join-Path $f.root 'ide/build.js') "var tbVersionInfo = 'twinBASIC IDE BETA 997';"
    $script:baselineFixture=Join-Path $f.dir 'vendor.zip'
    $pe=New-Object byte[] 134;$pe[0]=77;$pe[1]=90;$pe[60]=128;$pe[128]=80;$pe[129]=69;$pe[132]=76;$pe[133]=1
    $header=[Text.Encoding]::UTF8.GetBytes("var tbVersionInfo = 'twinBASIC IDE BETA 997';")
    $zip=[IO.Compression.ZipFile]::Open($script:baselineFixture,[IO.Compression.ZipArchiveMode]::Create)
    try {foreach($record in @(@{name='twinBASIC.exe';bytes=$pe},@{name='ide/build.js';bytes=$header})){
        $entry=$zip.CreateEntry($record.name);$stream=$entry.Open();try{$stream.Write($record.bytes,0,$record.bytes.Length)}finally{$stream.Dispose()}
    }}finally{$zip.Dispose()}
    $asset=[pscustomobject]@{url='https://github.com/twinbasic/twinbasic/releases/download/beta-x-0997/twinBASIC_IDE_BETA_997.zip';size=(Get-Item $script:baselineFixture).Length;sha256=(Hash $script:baselineFixture)}
    $component=[pscustomobject]@{installed='997';baselineAsset=$asset}
    $savedDownload=(Get-Item Function:Download).ScriptBlock
    try {
        function Download($Url,$Path,$Size,$Sha) {[IO.File]::Copy($script:baselineFixture,$Path,$true)}
        $baseline=Ide-Baseline ([pscustomobject]@{installRoot=$f.root}) $component $f.dir
    } finally {Set-Item Function:Download $savedDownload}
    Equal $baseline.Count 2;Equal $baseline.ContainsKey('twinBASIC.exe') $true;Equal $baseline.ContainsKey('ide/build.js') $true
}
Check 'repeating a completed transaction rechecks files and preserves later user changes' {
    $f=Fixture 'repeat-modified';Install-Transaction $f.plan $f.journal
    Put (Join-Path $f.root 'existing') 'user changed after success'
    Reject {Install-Transaction $f.plan $f.journal}
    Equal ([IO.File]::ReadAllText((Join-Path $f.root 'existing'))) 'user changed after success'
}
Write-Output "Passed $script:passed updater engine tests. Fixtures: $base"

