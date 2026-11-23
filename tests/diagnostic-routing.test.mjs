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
 assert(read('tbIDE/Updater/src/Sources/UpdaterEngine.twin').includes('DiagnosticsFile("updater-engine.log")'));
 const self=read('tbIDE/Updater/src/Sources/UpdaterSelfTest.twin');assert(self.includes('DiagnosticsRoot()'));assert(self.includes('DiagnosticsFile("native-updater-latest.json")'));assert(self.includes('\\NativeSelfTests\\'));
 assert(read('tbIDE/Updater/src/Sources/UpdaterHost.twin').includes('DiagnosticsFile("updater-startup-help.html")'));
});
