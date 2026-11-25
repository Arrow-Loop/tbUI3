import fs from'node:fs';import test from'node:test';import assert from'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
test('one identical private diagnostic-path module serves all active projects',()=>{
 const canonical=fs.readFileSync('tbUI3/src/Sources/DiagnosticPaths.twin');
 for(const folder of ['tbIDE/Updater/src/Sources','tbIDE/tbUI3IDE/src/Sources','tbUI3Test/src/Packages/tbUI3/Sources'])assert(canonical.equals(fs.readFileSync(folder+'/DiagnosticPaths.twin')),folder);
 assert.match(canonical.toString(),/Environ\$\("LOCALAPPDATA"\)/);assert.match(canonical.toString(),/\\Diagnostics/);
});
test('active first-party diagnostics never route to TEMP or beside an application',()=>{
 for(const folder of ['tbUI3/src/Sources','tbIDE/tbUI3IDE/src/Sources','tbIDE/Updater/src/Sources'])for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.twin'))){const source=read(folder+'/'+file);assert.doesNotMatch(source,/Environ\$?\("(?:TEMP|TMP)"\)/i,file);assert.doesNotMatch(source,/App\.Path[^\r\n]*\.log"/i,file);}
});
test('core and designer diagnostic basenames resolve through the shared folder',()=>{
 for(const [file,name]of [['UI3Icons','tbUI3-design.log'],['UI3Window','tbUI3-propertypage.log'],['UI3Surface','tbUI3-paint.log'],['UI3TabDiagnostics','tbUI3-tabview.log']])assert(read('tbUI3/src/Sources/'+file+'.twin').includes('DiagnosticsFile("'+name+'")'));
 assert(read('tbIDE/tbUI3IDE/src/Sources/TabViewDesignerController.twin').includes('DiagnosticsFile("tbUI3-tabview.log")'));
 assert(read('tbIDE/tbUI3IDE/js/tabview-designer.js').includes('%LOCALAPPDATA%/tbUI3/Diagnostics/tbUI3-tabview.log'));
});
test('updater startup, worker and native tests use the common diagnostics root',()=>{
 assert(read('tbIDE/Updater/src/Sources/modWinUIHost.twin').includes('DiagnosticsFile("updater-startup.log")'));
 assert(read('tbIDE/Updater/src/Sources/ShutdownBridge.twin').includes('DiagnosticsFile("updater-engine.log")'));
 assert(read('tbIDE/Updater/src/Sources/UpdaterEngine.twin').includes('BLog context'));
 const self=read('tbIDE/Updater/src/Sources/UpdaterSelfTest.twin');assert(self.includes('DiagnosticsRoot()'));assert(self.includes('DiagnosticsFile("native-updater-latest.json")'));assert(self.includes('\\NativeSelfTests\\'));
 assert(read('tbIDE/Updater/src/Sources/UpdaterHost.twin').includes('DiagnosticsFile("updater-startup-help.html")'));
});
// HARD REQUIREMENT (AGENTS.md, 2026-11-25): one "Store logs and diagnostics" switch gates every stored log.
test('the shared diagnostic path returns nothing while Store logs and diagnostics is off',()=>{
 const source=read('tbUI3/src/Sources/DiagnosticPaths.twin');
 assert.match(source,/Const DiagnosticsSettingsApp As String = "tbUI3"/);assert.match(source,/Const DiagnosticsSettingsSection As String = "Diagnostics"/);assert.match(source,/Const DiagnosticsSettingName As String = "StoreLogs"/);
 assert.match(source,/GetSetting\(DiagnosticsSettingsApp, DiagnosticsSettingsSection, DiagnosticsSettingName, "1"\) <> "0"/,'missing value means on until 1.0');
 const root=source.slice(source.indexOf('Public Function DiagnosticsRoot'));assert.match(root.split('\n')[2],/If Not DiagnosticsEnabled\(\) Then Return ""/,'switch checked before any folder is created');
 assert.match(source,/Private Const CompiledAppsStoreLogs As Boolean = True/);
 assert.match(read('tbIDE/Updater/src/Sources/MainModule.twin'),/Public Sub Main\(\)\r?\n\s+UseLiveDiagnosticsSwitch/,'the updater follows the live switch');
});
test('every first-party log write goes through the gated helper and drops the entry when it is off',()=>{
 const folders=['tbUI3/src/Sources','tbIDE/tbUI3IDE/src/Sources','tbIDE/Updater/src/Sources'];
 for(const folder of folders)for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.twin')&&f!=='DiagnosticPaths.twin')){
  const source=read(folder+'/'+file);
  for(const name of source.match(/"[^"\r\n]*\.log"/g)||[])assert(source.includes('DiagnosticsFile('+name+')'),file+' writes '+name+' outside DiagnosticsFile');
  const appends=source.match(/For Append|OpenTextFile\([^,\r\n]+, 8,/g)||[];
  if(appends.length){assert.match(source,/Diagnostics(File|Root)\(/,file+' appends without the shared helper');assert.match(source,/If Len\((?:FilePath|Path|path|base)\) = 0/,file+' must drop the entry when the switch is off');}
 }
});
test('IDE Options offers the switch and the add-in saves it where every logger reads it',()=>{
 const ui=read('tbIDE/tbUI3IDE/js/installation-ui.js'),controller=read('tbIDE/tbUI3IDE/src/Sources/UpdaterController.twin');
 assert(ui.includes("'Store logs and diagnostics'"));assert(ui.includes("request('diagnostics-switch',{enabled:on})"));
 assert.match(controller,/Case "diagnostics-switch"\r?\n(?:.*\r?\n)?\s+SaveSetting DiagnosticsSettingsApp, DiagnosticsSettingsSection, DiagnosticsSettingName/);
 assert.match(controller,/state\.Assign "storeDiagnostics"/);
 assert(read('tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-installation.js')===ui,'packed resource matches the source');
});
test('development tools keep transcripts and session logs only while the switch is on',()=>{
 const shared=read('tbIDE/tools/Diagnostics-Switch.ps1');assert.match(shared,/VB and VBA Program Settings\\tbUI3\\Diagnostics/);assert.match(shared,/'StoreLogs'/);assert.match(shared,/catch \{return \$true\}/);
 for(const file of ['Development-Tools.ps1','Prepare-IDE-Release.ps1','Publish-IDE-Release.ps1']){
  const lines=read('tbIDE/tools/'+file).split(/\r?\n/);assert(lines.some(l=>l.includes("'Diagnostics-Switch.ps1'")),file);
  lines.forEach((line,i)=>{if(/Start-Transcript/.test(line))assert.match(lines[i-1],/if \(\$storeLogs\)/,file+':'+(i+1));});
 }
 const dev=read('tbIDE/tools/Development-Tools.ps1');assert.equal(dev.match(/Add-Content -LiteralPath \$sessionLog/g).length,1,'session log has one gated writer');
 assert.match(dev,/function Write-SessionLog[^\n]*\n\s+if \(!\(Test-StoreLogs\)\) \{return\}/);
 assert.match(read('tbIDE/tools/build-with-cdp.mjs'),/if\(reportArg&&reportArg!=='-'\)/);
});
