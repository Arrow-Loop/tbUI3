import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = 'tbIDE/tbUI3IDE/';
const bridge = fs.readFileSync(root + 'js/shutdown-bridge.js', 'utf8');
function host() {
 const sandbox = vm.createContext({window:{}, calls:{accepted:0, exits:0, project:0}, dialog:null});
 vm.runInContext(`
   const hostAppObject = { Exit(){ calls.exits++; } };
   let showModalDialog = (_, buttons) => { dialog = buttons; };
   let closeProjectNow = callback => { callback(); };
   let closeProjectSafely = callback => {
     calls.accepted++;
     showModalDialog(null, [
       {onclick:()=>closeProjectNow(callback)},
       {onclick(){}, isDefaultCancelAction:true}
     ]);
   };
 `, sandbox);
 vm.runInContext(bridge, sandbox);
 return sandbox;
}
test('Update Now bypasses the wrapper and resumes the original accepted exit once', () => {
 const s = host();
 vm.runInContext("window.__tbUI3Shutdown.arm('a'); window.__tbUI3Shutdown.request('a'); dialog[0].onclick()", s);
 assert.deepEqual(JSON.parse(s.window.__tbUI3Shutdown.take()), {request:'a', status:'shutdown'});
 assert.deepEqual(s.calls, {accepted:1, exits:0, project:0});
 s.window.__tbUI3Shutdown.resume();
 s.window.__tbUI3Shutdown.resume();
 assert.deepEqual(s.calls, {accepted:1, exits:1, project:0});
});
test('native project close, cancelled exit and closure before arming cannot acknowledge shutdown', () => {
 const s = host();
 vm.runInContext("closeProjectSafely(()=>{hostAppObject.Exit('ignore')});dialog[0].onclick()", s);
 assert.equal(s.calls.exits, 1);
 assert.equal(s.window.__tbUI3Shutdown.take(), '');
 vm.runInContext("window.__tbUI3Shutdown.arm('a');closeProjectSafely(()=>{calls.project++});dialog[0].onclick()", s);
 assert.equal(s.calls.project, 1);
 assert.equal(s.window.__tbUI3Shutdown.take(), '');
 vm.runInContext('closeProjectSafely(()=>{hostAppObject.Exit("ignore")});dialog[1].onclick()', s);
 assert.deepEqual(JSON.parse(s.window.__tbUI3Shutdown.take()), {request:'a', status:'cancelled'});
 assert.equal(s.calls.exits, 1);
});
test('normal frame close is acknowledged while the armed updater is staging', () => {
 const s = host();
 vm.runInContext('window.__tbUI3Shutdown.arm("a");closeProjectSafely(()=>{hostAppObject.Exit("ignore")});dialog[0].onclick()', s);
 assert.deepEqual(JSON.parse(s.window.__tbUI3Shutdown.take()), {request:'a', status:'shutdown'});
 s.window.__tbUI3Shutdown.disarm();
 assert.equal(s.calls.exits, 1);
});
test('the IDE surface owns only update entry points and offline provisioning views', () => {
 const ui = fs.readFileSync(root + 'js/installation-ui.js', 'utf8');
 const native = fs.readFileSync(root + 'src/Sources/UpdaterController.twin', 'utf8');
 assert.match(ui, /Check for Updates/);
 assert.match(ui, /Update settings/);
 assert.match(ui, /Resource repair/);
 assert.doesNotMatch(ui+native, /tbUI3UpdateNotice|tbUI3UpdaterDialog|RunNativeEngine|catalog\.json|plan\.json|pending\.json/);
});
