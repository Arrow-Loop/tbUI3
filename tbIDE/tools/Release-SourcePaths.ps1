# Local diagnostic output is not a compiled release input.
# Keep these exclusions narrow: never exclude files inside source/resource trees.
$script:releaseSourcePaths=@(
    '.',
    ':(exclude,glob,icase)Diagnostics/**',
    ':(exclude,glob,icase)*.log',
    ':(exclude,glob,icase)ProbeTest/*.log',
    ':(exclude,glob,icase)ProbeTest/Diagnostics/**',
    ':(exclude,glob,icase)tbIDE/*.log',
    ':(exclude,glob,icase)tbIDE/Diagnostics/**',
    ':(exclude,glob,icase)tbIDE/TabViewDesigner/*.log',
    ':(exclude,glob,icase)tbIDE/tbUI3IDE/*.log',
    ':(exclude,glob,icase)tbIDE/tbUI3IDE/Diagnostics/**',
    ':(exclude,glob,icase)tbIDE/Updater/*.log',
    ':(exclude,glob,icase)tbIDE/Updater/Diagnostics/**',
    ':(exclude,glob,icase)tbUI3/*.log',
    ':(exclude,glob,icase)tbUI3/Diagnostics/**',
    ':(exclude,glob,icase)tbUI3Test/*.log',
    ':(exclude,glob,icase)tbUI3Test/Diagnostics/**'
)
# These paths can advance without changing an already built release.
$script:releaseNonBuildPaths=@('tbIDE/tools/Publish-IDE-Release.ps1','tbIDE/tools/Release-SourcePaths.ps1','tbIDE/Publish-Release.bat','tbIDE/README.md','tbIDE/CHANGELOG.md','tbIDE/ROADMAP.md','tbIDE/PHASE1_HANDOFF.md','docs/DIAGNOSTICS.md','README.md','CHANGELOG.md','ROADMAP.md')
function Get-ReleaseBuildChanges([string[]]$paths) {
    $paths | Where-Object {$_ -cnotin $script:releaseNonBuildPaths -and $_ -cnotmatch '^tbIDE/release-notes/\d+\.\d+\.\d+\.\d+\.md$'}
}
