import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const factory=vm.runInNewContext(fs.readFileSync('tbIDE/tbUI3IDE/js/installation-ui.js','utf8'));
const wizard=fs.readFileSync('tbIDE/prototypes/welcome-wizard/welcome.js','utf8');
function fixture(){
 const dom=new JSDOM('<!doctype html><html><head></head><body><button id="before">Before</button><div class="tbis-optionRow"><div class="tbis-optionName">Colour Theme</div></div></body></html>',{runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 w.eval(wizard);
 let state={schema:1,root:'C:\\IDE <img src=x>',installationId:'v1-test',theme:'WinUI3 Light',toolbar:'Classic',preferences:{automatic:true,restart:false,channel:'development',strategy:'InPlace'},bootstrap:{status:'attention',message:'Resources preserved.',resources:[{id:'themeDark',status:'customized',path:'C:\\Theme',repairable:true}]},accent:['#010101','#020202','#030303','#040404','#050505','#060606','#070707']};
 const ui=factory({document:d,window:w,state,styles:':root{--test:1}',dialogStyles:'.tbUI3-installation-dialog{margin:auto}',welcomeStyles:fs.readFileSync('tbIDE/prototypes/welcome-wizard/welcome.css','utf8'),welcomeTokens:'',themeMode:()=>'Dark'});
 const shadow=()=>d.querySelector('.tbUI3-installation-dialog div')?.shadowRoot;
 function click(text,root=d){const n=[...root.querySelectorAll('button')].find(n=>n.textContent===text||n.getAttribute('aria-label')===text);assert(n,'button '+text);n.click();return n;}
 function publish(patch,ack){state={...state,...patch,...(ack?{ack:{id:ack.requestId,ok:!patch.message?.startsWith('Error')}}:{})};ui.publish(state);}
 return {w,d,ui,click,shadow,publish,take:()=>JSON.parse(ui.take()||'null'),dispose(){ui.dispose();w.close();}};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('installation settings scope styles and safely render native paths',()=>{
 const f=fixture();try{f.ui.show('settings');const s=f.shadow();assert.match(s.textContent,/In-place \(recommended\)/);assert.equal(s.querySelector('img'),null);assert.match(s.querySelector('style').textContent,/:host/);assert.equal(f.d.documentElement.style.getPropertyValue('--win-accent'),'');assert.equal(s.host.style.getPropertyValue('--win-accent'),'#040404');assert.equal(s.host.dataset.theme,'dark');assert.equal(f.d.querySelector('.tbUI3-installation-dialog').open,true);}finally{f.dispose();}
});
test('preferences emit correlated native requests without locally persisting changes',()=>{
 const f=fixture();try{f.ui.show('settings');const input=f.shadow().querySelector('input');input.click();const r=f.take();assert.equal(r.action,'installation-preferences');assert.equal(r.automatic,false);assert(r.requestId);f.publish({preferences:{automatic:true,channel:'development',restart:false},message:'Error: settings refused'},r);assert.equal(f.shadow().querySelector('input').checked,true);}finally{f.dispose();}
});
test('wizard walks all six pages and completion records only explicit finish',()=>{
 const f=fixture();try{f.ui.show('welcome');for(const text of ['Welcome to tbUI3IDE','Updates on your terms','Choose your appearance','Choose your toolbar','More power in the designer',"You're ready to go"]){assert.match(f.d.querySelector('.tbw-content').textContent,new RegExp(text));assert.equal(f.take(),null);if(text!=="You're ready to go")f.click('Continue');}f.click('Finish');const r=f.take();assert.equal(r.action,'welcome-record');assert.equal(r.disposition,'completed');assert.equal(f.d.querySelector('.tbUI3-welcome-shell').open,false);}finally{f.dispose();}
});
test('theme preview and native rejection reconcile to actual theme',()=>{
 const f=fixture();try{f.ui.show('welcome');f.click('Continue');f.click('Continue');assert.equal(f.take(),null);f.click('Use WinUI3 Dark theme');const r=f.take();assert.equal(r.action,'choose-theme');assert.equal(r.name,'WinUI3 Dark');assert(f.d.querySelector('[aria-label="Use WinUI3 Dark theme"]').disabled);
 f.publish({theme:'WinUI3 Light',message:'Error: theme was unavailable'},r);const light=f.d.querySelector('[aria-label="Use WinUI3 Light theme"]');assert.equal(light.getAttribute('aria-pressed'),'true');assert(!f.d.querySelector('[aria-label="Use WinUI3 Dark theme"]').classList.contains('tbw-selected'));assert.match(f.d.querySelector('.tbw-root').textContent,/theme was unavailable/);}finally{f.dispose();}
});
test('intermediate snapshots do not acknowledge an unsettled native request',()=>{
 const f=fixture();try{f.ui.show('welcome');f.click('Continue');f.d.querySelector('[data-pref=automatic]').click();const r=f.take();f.publish({message:'Background bootstrap changed'});assert(f.d.querySelector('[data-pref=automatic]').disabled);f.publish({preferences:{automatic:false,restart:false,channel:'development'}},r);assert.equal(f.d.querySelector('[data-pref=automatic]').checked,false);assert(!f.d.querySelector('[data-pref=automatic]').disabled);}finally{f.dispose();}
});
test('wizard repair waits for styled confirmation and explicit checked approval',async()=>{
 const f=fixture();try{f.ui.show('welcome');for(let i=0;i<5;i++)f.click('Continue');f.click('Repair');await tick();assert.equal(f.take(),null);const s=f.shadow();assert(s);const reset=[...s.querySelectorAll('button')].find(n=>n.textContent==='Back up and reset');assert(reset.disabled);s.querySelector('input').click();reset.click();await tick();const r=f.take();assert.equal(r.action,'repair-resource');assert.equal(r.id,'themeDark');assert.equal(r.confirmed,true);assert.equal(f.take(),null);}finally{f.dispose();}
});
test('cancelled repair leaves native state untouched',async()=>{
 const f=fixture();try{f.ui.show('welcome');for(let i=0;i<5;i++)f.click('Continue');f.click('Repair');await tick();f.click('Cancel',f.shadow());await tick();assert.equal(f.take(),null);}finally{f.dispose();}
});
test('Escape dismisses onboarding without completing it; entry points survive DOM refresh',async()=>{
 const f=fixture();try{f.ui.show('welcome');const shell=f.d.querySelector('.tbUI3-welcome-shell');shell.dispatchEvent(new f.w.Event('cancel',{cancelable:true}));const r=f.take();assert.equal(r.disposition,'dismissed');assert.equal(shell.open,false);f.d.body.append(f.d.createElement('span'));await tick();assert.equal(f.d.querySelectorAll('.tbUI3InstallationOptions').length,1);f.ui.show('welcome');assert.equal(shell.open,true);}finally{f.dispose();}
});
test('future settings faults expose only explicit backed-up reset',()=>{
 const f=fixture();try{f.ui.show('settings');f.publish({settingsError:'Future schema 99'});assert.equal(f.shadow().querySelector('select'),null);const reset=[...f.shadow().querySelectorAll('button')].find(n=>n.textContent==='Back up and reset preferences');assert(reset.disabled);f.shadow().querySelector('input').click();reset.click();assert.equal(f.take().action,'reset-installation-settings');}finally{f.dispose();}
});
test('unload removes modal dialogs, observers, injected styles and options entry',()=>{
 const f=fixture();f.ui.show('settings');f.ui.show('welcome');f.ui.dispose();assert.equal(f.d.querySelectorAll('dialog,.tbUI3InstallationOptions,style').length,0);f.w.close();
});
