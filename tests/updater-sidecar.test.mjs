import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {scan} from '../tools/twinproj-edit.mjs';
const dir='tbIDE/Updater',src=dir+'/src';
function files(){const b=fs.readFileSync(dir+'/Updater.twinproj');return new Map(Object.entries(scan(b)).filter(([,e])=>e.type==='file').map(([p,e])=>[p,b.subarray(e.cStart+4,e.cEnd)]));}
test('sidecar contains the complete embedded WebView2 resource set and canonical identities',()=>{
 const packed=files();
 for(const name of ['updater.html','updater.js','updater.css','winui.css','winui-controls.js','theme-bridge.js','runtime-help.html'])assert(packed.get('Resources/OTHER/'+name).equals(fs.readFileSync(src+'/Resources/OTHER/'+name)),name);
 for(const name of ['MainModule.twin','UpdaterHost.twin','frmMain.twin','modWinUIHost.twin','modWebViewRuntime.twin'])assert(packed.get('Sources/'+name).equals(fs.readFileSync(src+'/Sources/'+name)),name);
 const settings=JSON.parse(packed.get('Settings'));assert.equal(settings['project.id'],'{BB6C26BA-C79E-4E1D-88DB-B82095C4909A}');
 assert(settings['project.references'].some(r=>r.id==='{5D19653F-F49E-41F2-ABF8-16E473A89A7C}'&&r.versionRevision===3));
 const form=JSON.parse(packed.get('Sources/frmMain.tbform'))[0];assert.equal(form.FormDesignerId,'{AA6A1949-4A01-4574-A9E6-665A3A5D05BB}');
 assert.equal(form._children.length,1);assert.equal(form._children[0]._className,'WebView2');
 assert.equal(form._children[0].AreHostObjectsAllowed,false);assert.equal(form._children[0].AreDefaultScriptDialogsEnabled,false);
});
test('shared toolkit assets retain the pinned implementation',()=>{
 const reference=JSON.parse(fs.readFileSync(dir+'/REFERENCE.json'));
 assert.equal(reference.commit,'0babc88f55f4077df7d309826734240cc63796e5');
 for(const [name,entry]of Object.entries(reference.assets))assert.equal(createHash('sha256').update(fs.readFileSync(src+'/Resources/OTHER/'+name)).digest('hex'),entry.sha256,name);
});
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
async function fixture(){
 const listeners=[],messages=[];
 let html=fs.readFileSync(src+'/Resources/OTHER/updater.html','utf8').replace(/<meta http-equiv="Content-Security-Policy"[^>]+>/,'').replace('{{STYLE_BLOCK}}','');
 for(const [token,file]of [['THEME_SCRIPT','theme-bridge.js'],['CONTROLS_SCRIPT','winui-controls.js'],['APP_SCRIPT','updater.js']])html=html.replace('{{'+token+'}}','<script>'+fs.readFileSync(src+'/Resources/OTHER/'+file,'utf8')+'</script>');
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.CSS={escape:value=>String(value).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
  w.chrome={webview:{postMessage:m=>messages.push(m),addEventListener:(t,fn)=>{if(t==='message')listeners.push(fn);}}};
 }});
 await new Promise(resolve=>dom.window.addEventListener('DOMContentLoaded',resolve,{once:true}));
 return {w:dom.window,d:dom.window.document,messages,send:data=>listeners.forEach(fn=>fn({data})),close:()=>dom.window.close()};
}
const catalog={components:[{id:'addin',installed:'0.4.0.4',version:'0.4.0.5',available:true},{id:'library',installed:'1',version:'1',available:false}],errors:[]};
const settings={automatic:false,restart:false};
test('sidecar boots, presents available versions, and sends selection without arbitrary paths',async()=>{
 const f=await fixture();try{
 assert(f.messages.includes('updater:ready'));
 f.send({type:'preferences',settings,toast:false});
 f.send({type:'updateState',state:{status:'checked',catalog},running:false});
 assert.match(f.d.getElementById('components').textContent,/0\.4\.0\.4.*0\.4\.0\.5/);
 assert.equal(f.d.querySelector('input[value=library]').disabled,true);
 f.d.getElementById('exit').click();
 assert.deepEqual(JSON.parse(f.messages.at(-1)),{action:'select',choice:'exit',selected:['addin'],restart:false});
 assert.equal(f.d.getElementById('progress-panel').hidden,false);
 f.send({type:'updateState',state:{status:'error',message:'Close the remaining compiler.'},running:false,canRecover:true});
 f.d.getElementById('retry').click();assert.equal(f.messages.at(-1),'updater:retry');
 f.d.getElementById('recover').click();assert.equal(f.messages.at(-1),'updater:recover');
 f.send({type:'updateState',state:{status:'waiting',message:'Waiting for normal shutdown.'},running:true});
 f.d.getElementById('cancel').click();assert.equal(f.messages.at(-1),'updater:cancel');
 assert(f.d.getElementById('close').querySelector('button').disabled);
 }finally{f.close();}
});
test('quiet results start with a toast and can open review or defer',async()=>{
 const f=await fixture();try{
 f.send({type:'preferences',settings,toast:true});
 f.send({type:'updateState',state:{status:'checked',catalog},running:false});
 assert.equal(f.d.getElementById('review').hidden,true);
 f.d.getElementById('review-updates').click();
 assert.equal(f.messages.at(-1),'updater:review');
 f.d.getElementById('later').click();
 assert.equal(f.messages.at(-1),'updater:later');
 f.send({type:'preferences',settings,toast:false});
 assert.equal(f.d.getElementById('review').hidden,false);
 }finally{f.close();}
});
test('incompatible preferences require explicit consent to back up and reset',async()=>{
 const f=await fixture();try{
 f.send({type:'preferences',settingsError:'Unsupported settings schema'});
 f.send({type:'updateState',state:{status:'settings'},running:false});
 assert.equal(f.d.getElementById('automatic').disabled,true);
 assert.equal(f.d.getElementById('reset').querySelector('button').disabled,true);
 f.d.getElementById('reset-approval').click();
 f.d.getElementById('reset').click();
 assert.deepEqual(JSON.parse(f.messages.at(-1)),{action:'reset',confirmed:true});
 }finally{f.close();}
});
test('sidecar validates native theme snapshots, reports actual progress and escapes failures',async()=>{
 const f=await fixture();try{
 const theme={mode:'dark',accentLight3:'#C2E4FF',accentLight2:'#60CDFF',accentLight1:'#429CE3',accent:'#0078D4',accentDark1:'#005FB8',accentDark2:'#004578',accentDark3:'#00264B'};
 f.send({type:'themeSnapshotResult',schemaVersion:2,theme});assert.equal(f.d.documentElement.dataset.theme,'dark');
 f.send({type:'themeSnapshotResult',schemaVersion:2,theme:{mode:'light',accent:'bad'}});assert.equal(f.d.documentElement.dataset.theme,'dark');
 f.send({type:'updateState',state:{status:'installing',message:'Verifying files',completed:34,total:200},running:true});assert.equal(f.d.querySelector('progress').value,17);
 f.send({type:'hostError',message:'<img src=x onerror=evil()>'});assert.equal(f.d.querySelector('img'),null);
 f.send({type:'updateState',state:{status:'complete',message:'Installed and verified.'},running:false});assert.equal(f.d.querySelector('progress').value,100);
 assert.equal(f.d.getElementById('close').querySelector('button').disabled,false);
 }finally{f.close();}
});


test('native host retains Toolkit form defaults and application-owned startup boundary',()=>{
 const packed=files(),form=JSON.parse(packed.get('Sources/frmMain.tbform'))[0],source=packed.get('Sources/frmMain.twin').toString();
 assert.equal(form.Visible,true);assert.equal(form.Opacity,100);assert.equal(form.WindowState,'vbNormal');assert.equal(form.FontName,'Segoe UI');assert(form.ScaleWidth>0&&form.ScaleHeight>0);
 assert.match(source,/Sub New\(\)[\s\S]*?WinUI_InitializeDpiAwareness/);assert.match(source,/Me.BackColor = vbBlack/);
 const event=source.slice(source.indexOf('Private Sub wvMain_NavigationComplete'),source.indexOf('Private Sub wvMain_JsMessage'));
 assert.doesNotMatch(event,/StartUpdateEngine|StartElevatedEngine/);
});
