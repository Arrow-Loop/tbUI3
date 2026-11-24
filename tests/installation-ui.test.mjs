import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const {JSDOM,VirtualConsole}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const factory=vm.runInNewContext(fs.readFileSync('tbIDE/tbUI3IDE/js/installation-ui.js','utf8'));
const asset=name=>fs.readFileSync('tbIDE/prototypes/welcome-wizard/'+name,'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function fixture(options={}){
 const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>{if(!/Could not parse CSS stylesheet/.test(e.message))errors.push(e);});
 const dom=new JSDOM('<!doctype html><html><head></head><body><button id="before">Before</button><input class="tbis-settingsSearch" value=""><div class="tbis-settingsNavList"><div class="tbis-navItem tbis-navItemSelected"><span class="tbis-navItemText">All</span></div><div class="tbis-navItem"><span class="tbis-navItemText">Appearance</span></div></div><div class="tbis-settingsPane"><div class="tbis-groupSection" data-group-id="appearance"><div class="tbis-optionRow"><div class="tbis-optionName">Colour Theme</div></div></div></div></body></html>',{runScripts:'dangerously',virtualConsole});
 const w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 // JSDOM lacks browser media APIs. Shared runtime is real, not stubbed or replaced.
 d.addEventListener('load',e=>{if(e.target.localName==='iframe'){const child=e.target.contentWindow;child.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}},true);
 const frames=[]; if(options.paintControl)w.requestAnimationFrame=callback=>frames.push(callback);
 w.eval(fs.readFileSync('tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-welcome.js','utf8'));
 const palette={background:'#111111',surface:'#222222',foreground:'#eeeeee',accent:'#123456',toolbar:'#333333',editor:'#444444'};
 let state={schema:1,root:'C:\\IDE <img src=x>',installationId:'v1-test',theme:'WinUI3 Light',toolbar:'Classic',preferences:{automatic:true,restart:false,channel:'development',strategy:'InPlace'},bootstrap:{status:'ready',message:'Resources verified.',resources:[]},installedThemes:[{name:'WinUI3 Light',mode:'light',preview:palette},{name:'WinUI3 Dark',mode:'dark',preview:palette},{name:'Ocean',mode:'dark',preview:palette}],accent:['#010101','#020202','#030303','#040404','#050505','#060606','#070707']};
 if(options.startup)state.startup=options.startup;
 const ui=factory({document:d,window:w,state,styles:options.styles??':root{--test:1}',dialogStyles:'.tbUI3-installation-dialog{margin:auto}',welcomeStyles:asset('welcome.css'),welcomeMaster:asset('master.css'),welcomeControls:options.controls??asset('controls.js'),themeMode:()=>'Dark',showWelcome:!!options.auto,canAutoWelcome:options.canAutoWelcome});
 const shadow=()=>d.querySelector('.tbUI3-installation-dialog[open] div')?.shadowRoot;
 const inner=()=>d.querySelector('iframe')?.contentDocument;
 function click(text,root=inner()||d){const n=[...root.querySelectorAll('button')].find(n=>n.textContent.trim()===text||n.getAttribute('aria-label')===text);assert(n,'button '+text);n.click();return n;}
 function publish(patch,ack){state={...state,...patch,...(ack?{ack:{id:ack.requestId,ok:!patch.message?.startsWith('Error')}}:{})};ui.publish(state);}
 async function open(){ui.show('welcome');for(let i=0;i<10&&!inner()?.querySelector('.welcome-app');i++)await tick();assert(inner()?.querySelector('.welcome-app'),'real shared Toolkit initialized inside iframe');assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));}
 return {w,d,ui,frames,click,shadow,inner,open,publish,take:()=>JSON.parse(ui.take()||'null'),dispose(){ui.dispose();w.close();}};
}
test('offline resource repair styles are scoped and escape paths',()=>{const f=fixture();try{f.ui.show('repair');const s=f.shadow();assert.match(s.textContent,/Bundled updater and themes/);assert.equal(s.querySelector('img'),null);assert.equal(s.querySelector('select'),null);assert.match(s.querySelector('style').textContent,/:host/);assert.equal(f.d.documentElement.style.getPropertyValue('--win-accent'),'');assert.equal(s.host.style.getPropertyValue('--win-accent'),'#040404');}finally{f.dispose();}});
test('IDE entry points request standalone review and settings',()=>{const f=fixture();try{f.click('Check now');assert.equal(f.take().action,'check');f.click('Open preferences');assert.equal(f.take().action,'update-settings');assert.equal(f.d.querySelector('dialog'),null);}finally{f.dispose();}});
test('real Toolkit stays inside iframe; healthy wizard has six steps and explicit Finish',async()=>{const f=fixture();try{await f.open();assert(f.inner().defaultView.WinUIControls);assert.equal(f.w.WinUIControls,undefined);assert.equal(f.d.querySelector('winui-button'),null);assert.equal(f.inner().documentElement.style.getPropertyValue('--win-accent'),'#040404');for(const title of ['Make twinBASIC your own','Updates on your terms','Choose your appearance','Choose your toolbar','Explore your new tools',"You're ready"]){assert(f.inner().querySelector('h2').textContent.includes(title),f.inner().querySelector('h2').textContent);assert.equal(f.take(),null);if(title!=="You're ready")f.click('Continue');}f.click('Finish');assert.equal(f.take().disposition,'completed');assert.equal(f.d.querySelector('.tbUI3-welcome-shell').open,false);}finally{f.dispose();}});
test('installed theme tile selection and native rejection reconcile with actual state',async()=>{const f=fixture();try{await f.open();f.click('Continue');f.click('Continue');assert.equal(f.take(),null);const ocean=f.click('Select Ocean theme');assert.equal(ocean.style.getPropertyValue('--mini-bg'),'');assert.equal(ocean.querySelector('.welcome-mini-ide').style.getPropertyValue('--mini-bg'),'#111111');const r=f.take();assert.equal(r.name,'Ocean');assert.equal(r.action,'choose-theme');assert(f.inner().querySelector('[aria-label="Select Ocean theme"]').disabled);f.publish({theme:'WinUI3 Light',message:'Error: rejected'},r);assert.equal(f.inner().querySelector('[aria-label="Select WinUI3 Light theme"]').getAttribute('aria-pressed'),'true');assert.equal(f.inner().querySelector('[aria-label="Select Ocean theme"]').getAttribute('aria-pressed'),'false');}finally{f.dispose();}});
test('unrelated snapshots do not settle pending wizard settings',async()=>{const f=fixture();try{await f.open();f.click('Continue');const toggle=f.inner().querySelector('winui-toggle-switch');toggle.dispatchEvent(new (f.inner().defaultView.CustomEvent)('toggled',{detail:{isOn:false}}));const r=f.take();assert.equal(r.automatic,false);f.publish({message:'background'});assert(f.inner().querySelector('winui-toggle-switch').hasAttribute('disabled'));f.publish({preferences:{automatic:false,restart:false}},r);assert(!f.inner().querySelector('winui-toggle-switch').hasAttribute('disabled'));}finally{f.dispose();}});
test('Setup exists only for actual attention and clears into Updates',async()=>{const f=fixture();try{f.publish({bootstrap:{status:'error',message:'Helper unavailable',resources:[]}});await f.open();f.click('Continue');assert.match(f.inner().querySelector('h2').textContent,/Installation needs attention/);f.click('Check again');const r=f.take();assert.equal(r.action,'bootstrap-retry');f.publish({bootstrap:{status:'ready',message:'Verified',resources:[]}},r);assert.match(f.inner().querySelector('h2').textContent,/Updates/);assert(!f.inner().querySelector('nav').textContent.includes('Setup'));}finally{f.dispose();}});
async function repairFixture(){const f=fixture();f.publish({bootstrap:{status:'attention',message:'Customized',resources:[{id:'themeDark',path:'C:\\Theme',status:'customized-preserved',repairable:true}]}});await f.open();f.click('Continue');return f;}
test('iframe repair awaits outer styled confirmation and checked approval',async()=>{const f=await repairFixture();try{f.click('Repair');await tick();assert.equal(f.take(),null);const s=f.shadow();assert(s);const reset=[...s.querySelectorAll('button')].find(n=>n.textContent==='Back up and reset');assert(reset.disabled);s.querySelector('input').click();reset.click();await tick();const r=f.take();assert.equal(r.action,'repair-resource');assert.equal(r.id,'themeDark');assert(r.confirmed);assert.equal(f.take(),null);}finally{f.dispose();}});
test('cancelled repair issues no native request',async()=>{const f=await repairFixture();try{f.click('Repair');await tick();f.click('Cancel',f.shadow());await tick();assert.equal(f.take(),null);}finally{f.dispose();}});
test('Escape inside iframe dismisses; reopen and disposal keep one options entry',async()=>{const f=fixture();try{await f.open();f.inner().dispatchEvent(new (f.inner().defaultView.KeyboardEvent)('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(f.take().disposition,'dismissed');assert.equal(f.d.querySelector('.tbUI3-welcome-shell').open,false);await f.open();assert.equal(f.d.querySelectorAll('iframe').length,1);f.d.body.append(f.d.createElement('span'));await tick();assert.equal(f.d.querySelectorAll('.tbUI3InstallationOptions').length,1);f.ui.dispose();assert.equal(f.d.querySelectorAll('iframe,dialog,style,.tbUI3InstallationOptions').length,0);}finally{f.dispose();}});

test('theme discovery errors have a recoverable conditional Setup step',async()=>{const f=fixture();try{f.publish({themeDiscovery:{pending:false,error:'Theme reload failed'}});await f.open();f.click('Continue');assert.match(f.inner().querySelector('h2').textContent,/Installation needs attention/);assert.match(f.inner().body.textContent,/Theme reload failed/);f.click('Check again');assert.equal(f.take().action,'bootstrap-retry');}finally{f.dispose();}});
test('blocked iframe runtime surfaces a visible scoped error with Close',async()=>{const f=fixture({controls:'/* deliberately unavailable runtime for failure-path test */'});try{f.ui.show('welcome');await tick();await tick();const shell=f.d.querySelector('.tbUI3-welcome-shell'),root=shell.querySelector('div')?.shadowRoot;assert(root);assert.match(root.textContent,/Welcome controls unavailable/);assert(shell.querySelector('iframe').hidden);f.click('Close',root);assert.equal(shell.open,false);}finally{f.dispose();}});

test('late startup does not take focus or persist Welcome completion',()=>{const f=fixture({auto:true,canAutoWelcome:()=>false});try{assert.equal(f.d.querySelector('.tbUI3-welcome-shell'),null);assert.equal(f.take(),null);}finally{f.dispose();}});
test('lowercase native theme acknowledgement retains the selected tile and toolbar palette',async()=>{const f=fixture();try{await f.open();f.click('Continue');f.click('Continue');f.click('Select Ocean theme');const r=f.take();f.publish({theme:'ocean',themeMode:'dark',message:'IDE theme saved.'},r);const selected=f.inner().querySelector('[aria-label="Select Ocean theme"]');assert.equal(selected.getAttribute('aria-pressed'),'true');assert.equal(selected.querySelector('.welcome-mini-ide').style.getPropertyValue('--mini-bg'),'#111111');f.click('Continue');assert.equal(f.inner().querySelectorAll('.welcome-mini-ide').length,3);assert.equal(f.inner().querySelectorAll('.welcome-preview-empty').length,0);}finally{f.dispose();}});
test('all miniature paint remains fixed when the active theme changes',async()=>{const f=fixture();try{await f.open();f.click('Continue');f.click('Continue');const read=()=>[...f.inner().querySelectorAll('.welcome-mini-ide')].map(e=>e.getAttribute('style'));const before=read();f.publish({theme:'ocean',themeMode:'dark'});assert.deepEqual(read(),before);}finally{f.dispose();}});

test('automatic Welcome waits for the native modal and two frames before setup can begin',async()=>{
 let allowed=false;
 const f=fixture({auto:true,paintControl:true,canAutoWelcome:()=>allowed});
 try{
  assert(!f.ui.startupReady());assert(f.ui.welcomeOpen());assert.equal(f.inner(),undefined);
  f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'A'}));
  allowed=true;assert(!f.ui.startupReady());
  for(let i=0;i<10&&!f.frames.length;i++)await tick();
  assert(f.inner().querySelector('.welcome-app'));
  assert(!f.ui.startupReady());
  f.frames.shift()();assert(!f.ui.startupReady());
  f.frames.shift()();assert(f.ui.startupReady());assert(f.ui.welcomeOpen());
  f.click('Skip tour');assert(!f.ui.welcomeOpen());assert.equal(f.take().disposition,'dismissed');
 }finally{f.dispose();}
});

test('Setup tracks real pending tasks and permits Updates as soon as the required services settle',async()=>{
 const startup={pending:true,tasks:[{id:'registration',status:'ready'},{id:'updater',status:'running'}]};
 const f=fixture({startup});
 try{
  await f.open();f.click('Continue');
  assert.match(f.inner().querySelector('h2').textContent,/Setting up/);
  assert.match(f.inner().querySelector('main').textContent,/Updater verification and provisioningIn progress/);
  assert(f.click('Continue with current setup').disabled);
  f.publish({startup:{pending:false,tasks:[{id:'updater',status:'ready'}]}});
  assert.match(f.inner().querySelector('h2').textContent,/Updates on your terms/);
  assert.equal(f.take(),null);
 }finally{f.dispose();}
});

test('failed setup can continue without operating unavailable settings, themes or toolbar services',async()=>{
 const startup={pending:false,preferencesReady:false,themeReady:false,toolbarReady:false,tasks:[{id:'preferences',status:'error',message:'Settings unreadable'}]};
 const f=fixture({startup});
 try{
  await f.open();f.click('Continue');
  assert.match(f.inner().querySelector('main').textContent,/Settings unreadable/);
  f.click('Continue with current setup');
  assert(f.inner().querySelector('winui-toggle-switch').hasAttribute('disabled'));
  f.click('Continue');assert(f.click('Select Ocean theme').disabled);
  f.click('Continue');assert(f.click('Select Hybrid toolbar').disabled);
  assert.equal(f.take(),null);
 }finally{f.dispose();}
});
test('update toast lists components, Review opens the updater and Dismiss removes it',async()=>{const f=fixture();const gone=()=>new Promise(r=>setTimeout(r,220));try{f.ui.toast(['twinBASIC BETA 1046','tbUI3IDE 0.4.0.12']);const host=f.d.querySelector('.tbUI3-update-toast');assert(host);const s=host.shadowRoot;assert.match(s.textContent,/Updates available/);assert.match(s.textContent,/twinBASIC BETA 1046 and tbUI3IDE 0\.4\.0\.12 are ready to install/);assert.equal(f.take(),null);f.click('Review',s);assert.equal(f.take().action,'check');await gone();assert.equal(f.d.querySelector('.tbUI3-update-toast'),null);f.ui.toast(['the icon library']);f.click('Dismiss',f.d.querySelector('.tbUI3-update-toast').shadowRoot);await gone();assert.equal(f.d.querySelector('.tbUI3-update-toast'),null);assert.equal(f.take(),null);}finally{f.dispose();}});
test('IDE Options gains its own tbUI3 Updates category that follows native navigation',async()=>{const f=fixture();try{const nav=f.d.querySelector('.tbUI3InstallationNav'),section=f.d.querySelector('.tbUI3InstallationOptions');assert(nav&&section);assert.match(nav.textContent,/tbUI3 Updates/);assert.equal(section.querySelectorAll('.tbis-optionRow').length,4);assert(!section.classList.contains('tbis-groupSectionHidden'),'shown under All');nav.click();assert(nav.classList.contains('tbis-navItemSelected'));assert(f.d.querySelector('[data-group-id=appearance]').classList.contains('tbis-groupSectionHidden'));assert(!section.classList.contains('tbis-groupSectionHidden'));f.click('Open repair',f.d);assert(f.shadow());}finally{f.dispose();}});
test('shadow views translate document theme selectors so dark mode applies',()=>{const f=fixture({styles:':root{--c:light}:root[data-theme="dark"]{--c:dark}html:root[data-theme]{color-scheme:x}'});try{f.ui.show('repair');const css=f.shadow().querySelector('style').textContent;assert.match(css,/:host\(\[data-theme="dark"\]\)\{--c:dark\}/);assert.match(css,/:host\(\[data-theme\]\)\{color-scheme/);assert.doesNotMatch(css,/:root|:host\[/);assert.equal(f.d.querySelector('dialog.tbUI3-installation-dialog').getAttribute('data-theme'),'dark');}finally{f.dispose();}});
