import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const factory=vm.runInNewContext(fs.readFileSync('tbIDE/tbUI3IDE/js/updater.js','utf8'));
function fixture(){
 const dom=new JSDOM('<!doctype html><html><head></head><body><div class="tbis-optionRow"><div class="tbis-optionName">Colour Theme</div></div></body></html>');
 const {window:w}=dom,d=w.document;w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const ui=factory({document:d,window:w,automatic:false,checkDue:false,closeIde:()=>{}});return{w,d,ui,dispose(){ui.dispose();w.close();}};
}
const catalog={components:[{id:'addin',installed:'0.3.0.20',version:'0.3.0.21',available:true,compatible:true,summary:'Designer tooling',source:'https://github.com/Arrow-Loop/tbUI3/releases/tag/tbUI3IDE-v0.3.0.21'},{id:'library',installed:'2026.10.19.1',version:'2026.10.19.1',available:false,compatible:true,summary:'Icon library',source:'https://github.com/Arrow-Loop/tbUI3-Libraries/releases'}],errors:['One source is offline.']};
function click(f,label){const button=[...f.d.querySelectorAll('button')].find(b=>b.textContent===label);assert(button,label);button.click();}
test('manual check, version notification and safe remote text',()=>{
 const f=fixture();click(f,'Check for Updates');assert.equal(JSON.parse(f.ui.take()).action,'check');
 f.ui.publish({status:'checked',catalog,message:'Release check complete.'});assert(f.d.getElementById('tbUI3UpdateNotice'));
 click(f,'Review updates');assert.match(f.d.querySelector('dialog').textContent,/installed 0.3.0.20; available 0.3.0.21/);
 assert.match(f.d.querySelector('dialog').textContent,/One source is offline/);
 f.ui.publish({status:'error',message:'<img src=x onerror=evil()>',catalog});assert.equal(f.d.querySelector('dialog img'),null);f.dispose();
});
test('component selection, Now/Exit and restart are explicit native requests',()=>{
 for(const action of ['now','exit']){
  const f=fixture();f.ui.publish({status:'checked',catalog,message:'Ready'});f.ui.show();
  assert(f.d.querySelector('[data-component=library]').disabled);
  f.d.querySelector('[data-restart]').checked=true;click(f,action==='now'?'Update Now':'Update on Exit');
  const request=JSON.parse(f.ui.take());assert.equal(request.action,action);assert.deepEqual(request.selected,['addin']);assert.equal(request.restart,true);
  assert(f.d.querySelector('dialog').textContent.includes('Downloading and verifying'));
  f.dispose();
 }
});
test('Later persists a deferral without an install or shutdown request',()=>{
 const f=fixture();f.ui.publish({status:'checked',catalog,message:'Ready'});f.ui.show();click(f,'Remind Me Later');
 const request=JSON.parse(f.ui.take());assert.equal(request.action,'later');assert(request.deferredUntil>Date.now());assert.equal(f.ui.take(),'');
 assert.equal(f.d.querySelector('dialog').open,false);f.dispose();
});
test('opt-out, pending cancel and disposal keep one options entry',async()=>{
 const f=fixture();f.ui.show();f.d.querySelector('dialog input[type=checkbox]').click();assert.equal(JSON.parse(f.ui.take()).action,'preferences');
 f.ui.publish({status:'waiting',message:'Waiting for normal exit'});click(f,'Cancel Pending Update');assert.equal(JSON.parse(f.ui.take()).action,'cancel');
 f.d.body.appendChild(f.d.createElement('span'));await new Promise(r=>setTimeout(r,0));assert.equal(f.d.querySelectorAll('.tbUI3UpdateOptions').length,1);
 f.ui.dispose();assert.equal(f.d.querySelectorAll('.tbUI3UpdateOptions,dialog,#tbUI3UpdaterCss').length,0);f.w.close();
});
test('native exit adapter parks only accepted IDE exit callbacks',()=>{
 const source=fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/UpdaterScript.twin','utf8');
 assert.match(source,/__tbUI3UpdaterOriginalClose/);
 // Execute the same bootstrap code emitted by the builder, decoded from twinBASIC literals.
 const lines=source.split(/\r?\n/),chunks=[];
 for(const line of lines){const m=line.match(/^        js = js & (.*)$/);if(!m)continue;if(m[1]==='vbLf'){chunks.push('\n');continue;}chunks.push(m[1].split(' & Chr(34) & ').map(x=>x.slice(1,-1)).join('"'));}
 const sandbox={window:{},closeProjectSafely:fn=>fn(),hostAppObject:{Exit:()=>{sandbox.exited=true;}}};vm.runInNewContext(chunks.join(''),sandbox);
 sandbox.window.__tbUI3UpdatePending=true;
 vm.runInNewContext('closeProjectSafely(function(){hostAppObject.Exit("ignore");})',sandbox);
 assert.equal(sandbox.exited,undefined);assert.equal(typeof sandbox.window.__tbUI3UpdateExit,'function');
 sandbox.window.__tbUI3UpdateExit();assert.equal(sandbox.exited,true);
 sandbox.projectClosed=false;vm.runInNewContext('closeProjectSafely(function(){projectClosed=true;})',sandbox);assert.equal(sandbox.projectClosed,true);
});


test('automatic opt-out cancels queued startup checks and enabling schedules a guarded check',()=>{
 const f=fixture(),callbacks=[];
 f.w.setTimeout=fn=>{callbacks.push(fn);return callbacks.length;};f.w.clearTimeout=()=>{};
 f.ui.show();const automatic=f.d.querySelector('dialog input[type=checkbox]');
 automatic.click();assert.equal(JSON.parse(f.ui.take()).automatic,true);assert.equal(callbacks.length,1);
 automatic.click();assert.equal(JSON.parse(f.ui.take()).automatic,false);
 callbacks[0]();assert.equal(f.ui.take(),'');assert.equal(callbacks.length,1);
 f.dispose();
});
