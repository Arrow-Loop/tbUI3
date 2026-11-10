import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const source=fs.readFileSync('tbIDE/tbUI3IDE/js/ide-toolbar.js','utf8');
const factory=vm.runInNewContext(source);
function fixture() {
    const dom=new JSDOM(`<div id='root'><div id='rootMenu1'><div id='rootMenu1Inner'></div><div id='rootMenuClose'>Close</div></div><div id='rootTop'><input id='editor'></div><div id='rootMenu2'></div></div>
    <div class='tbis-optionRow'><div class='tbis-optionName'>Enable additional IDE theme styling via add-in</div></div>`);
    const w=dom.window,d=w.document,calls=[];w.setInterval=()=>1;w.clearInterval=()=>{};const computed=w.getComputedStyle.bind(w);w.getComputedStyle=n=>computed(n);
    const toolbar=d.getElementById('rootMenu2'),headers=d.getElementById('rootMenu1Inner');
    const api={window:w,icons:{saveIcon:"url('data:image/svg+xml,save')"},
        localize:s=>s,execute:s=>calls.push(s),commandEnabled:s=>s!=='disabled',testContext:()=>true,
        shortcut:()=>'',realTitlebar:()=>false,formGlobals:()=>null,changedSize:()=>{}};
    let show=(anchor,x,y,items)=>calls.push(['nativeMenu',anchor&&anchor.id,items]);
    api.getShowContextMenu=()=>show;api.setShowContextMenu=fn=>{show=fn;};
    const items={File:[{name:'Save',action:'save'}],Edit:[{name:'Undo',action:'undo'},{},{name:'Disabled',action:'disabled'}],Format:[{name:'Align',hoverAction:()=>show(undefined,0,0,[{name:'Left',action:'left'}])}],Addins:[{name:'Loaded add-in',action:()=>calls.push('nativeAddin')}],Tools:[{name:'Options',action:'options'}]};
    function menu(name){const n=d.createElement('div');n.id='rootMenu'+name;n.className='menuItem';n.textContent=name;
        n.onmousedown=()=>show(n,0,0,items[name]||[{name:'Future command',action:'future'}]);headers.append(n);return n;}
    for(const name of Object.keys(items))menu(name);
    function button(id,title=id){const n=d.createElement('div');n.id=id;n.className='icon';n.title=title;n.boundCommand=id;
        n.onmousedown=()=>calls.push(id);toolbar.append(n);return n;}
    for(const id of ['saveIcon','undoIcon','redoIcon','playIcon','pauseIcon','stopIcon','commentIcon','menuBarColorMode'])button(id);
    const build=d.createElement('select');build.id='buildConfigSelector';build.title='Build configuration';build.innerHTML='<option>win64</option>';toolbar.append(build);
    const original=[...toolbar.childNodes],adapter=factory(api);adapter.install();
    return {w,d,adapter,api,calls,button,menu,items,toolbar,original,show:(...args)=>show(...args),dispose(){adapter.dispose();w.close();}};
}
test('Classic preserves the original toolbar and creates the independent three-mode option',()=>{
    const f=fixture();assert.equal(f.adapter.mode,'Classic');assert(!f.d.querySelector('.tbui3-ribbon'));
    assert.deepEqual([...f.d.querySelector('select[aria-label="IDE Toolbar"]').options].map(x=>x.value),['Classic','Hybrid','Ribbon']);
    assert.deepEqual([...f.toolbar.childNodes],f.original);f.dispose();
});
test('Hybrid reuses the selected native command exactly once and keeps native menus',()=>{
    const f=fixture();f.adapter.setMode('Hybrid',true);
    assert.deepEqual([...f.d.querySelectorAll('[role=tab]')].map(n=>n.textContent),['Home','Code','Form','Add-ins']);
    f.d.querySelector('[data-source=saveIcon]').click();assert.deepEqual(f.calls,['saveIcon']);
    assert(!f.d.getElementById('rootMenuFile').classList.contains('tbui3-menu-source'));assert(f.adapter.dirty);f.dispose();
});
test('changing modes restores the same native selectors and their original order',()=>{
    const f=fixture(),select=f.d.getElementById('buildConfigSelector');let changes=0;select.onchange=()=>changes++;
    f.adapter.setMode('Hybrid');assert(f.d.querySelector('.tbui3-ribbon').contains(select));
    f.adapter.setMode('Ribbon');f.adapter.setMode('Classic');assert.deepEqual([...f.toolbar.childNodes],f.original);
    select.dispatchEvent(new f.w.Event('change'));assert.equal(changes,1);f.dispose();
});
test('Ribbon discovers new top-level menus/options and retains disabled state',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');
    assert(f.d.querySelector('.tbui3-menu-source'));assert(f.d.querySelector('button[title="Disabled "]').disabled);
    f.menu('Future');f.adapter.tick();const tab=f.d.querySelector('[data-tab=rootMenuFuture]');assert(tab);tab.click();
    f.d.querySelector('button[title="Future command "]').click();assert(f.calls.includes('future'));
    f.items.Future=[{name:'Added later',action:'new'}];f.d.querySelector('[data-tab=rootMenuFuture]').click();
    assert(f.d.querySelector('button[title="Added later "]'));f.dispose();
});
test('late third-party buttons stay in Add-ins and preserve their own click handler',()=>{
    const f=fixture();f.adapter.setMode('Hybrid');const n=f.button('addinButton-other','Other add-in');n.onmousedown=null;n.onclick=()=>f.calls.push('thirdparty');
    f.adapter.tick();f.d.querySelector('[data-tab="Add-ins"]').click();f.d.querySelector('[data-source="addinButton-other"]').click();
    assert.deepEqual(f.calls,['thirdparty']);n.remove();f.adapter.tick();assert(!f.d.querySelector('[data-source="addinButton-other"]'));f.dispose();
});
test('fullscreen File exposes native file/add-in sections and Escape restores focus',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');const editor=f.d.getElementById('editor');editor.focus();
    f.adapter.openFile();assert(!f.d.querySelector('.tbui3-backstage').hidden);
    [...f.d.querySelectorAll('.tbui3-backstage-nav')].find(n=>n.textContent==='Addins').click();
    assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Loaded add-in'));
    f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(f.d.querySelector('.tbui3-backstage').hidden);assert.equal(f.d.activeElement,editor);f.dispose();
});
test('native lazy submenus are captured on demand without executing their actions',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=rootMenuFormat]').click();
    f.d.querySelector('button[title="Align"]').click();assert(!f.calls.includes('left'));
    f.d.querySelector('.tbui3-ribbon-popup button').click();assert.deepEqual(f.calls,['left']);assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.dispose();
});
test('asynchronous add-in menu callbacks populate File without opening recursively',async()=>{
    const f=fixture();const n=f.d.getElementById('rootMenuAddins');let requests=0,callback;
    n.onmousedown=()=>{requests++;callback=()=>f.show(n,0,0,f.items.Addins);};
    f.adapter.setMode('Ribbon');f.adapter.openFile('Addins');assert.equal(requests,1);callback();
    assert.equal(requests,1);assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Loaded add-in'));f.dispose();
});
test('contextual MultiPage is only nested under Form when a host or child is selected',()=>{
    const f=fixture();f.adapter.setMode('Hybrid');f.d.querySelector('[data-tab=Form]').click();assert(!f.d.querySelector('.tbui3-ribbon-context'));
    const host=f.d.createElement('div');host.properties={_className:'tbUI3.UI3TabView'};const child=host.appendChild(f.d.createElement('div'));
    f.api.formGlobals=()=>({selectedControls:[child]});f.adapter.tick();assert(f.d.querySelector('.tbui3-ribbon-context'));f.dispose();
});
test('quick access stays above the ribbon and follows the titlebar option',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');const q=f.d.querySelector('.tbui3-quick');assert.equal(q.parentElement.id,'rootMenu1Inner');
    assert.equal(q.querySelectorAll('button').length,6);f.api.realTitlebar=()=>true;f.adapter.tick();assert(q.classList.contains('tbui3-quick-real-titlebar'));f.dispose();
});
test('unload restores native menus, controls, handlers and removes owned UI',()=>{
    const f=fixture(),original=f.api.getShowContextMenu();f.adapter.setMode('Ribbon');f.adapter.dispose();
    assert(!f.d.querySelector('.tbui3-toolbar-owned'));assert(!f.d.querySelector('.tbui3-toolbar-option'));assert(!f.d.querySelector('.tbui3-menu-source'));
    assert(!f.toolbar.classList.contains('tbui3-toolbar-native-hidden'));assert.notEqual(f.api.getShowContextMenu(),original);f.w.close();
});
test('an unsupported IDE layout falls back to Classic without leaving native UI hidden',()=>{
    const f=fixture();f.d.getElementById('rootMenuFile').remove();f.adapter.setMode('Ribbon');
    assert.equal(f.adapter.mode,'Classic');assert.equal(f.adapter.requestedMode,'Ribbon');assert.match(f.adapter.lastError,/File menu/);assert(!f.toolbar.classList.contains('tbui3-toolbar-native-hidden'));f.dispose();
});
test('the native docked toolbar header is hidden without changing its saved panel layout',()=>{
    const f=fixture(),header=f.d.createElement('div'),body=f.d.createElement('div');header.panelId='TOOLBAR';header.sectionRoot=body;
    f.toolbar.before(header,body);header.append(f.toolbar);f.adapter.setMode('Hybrid');
    assert(header.classList.contains('tbui3-toolbar-native-hidden'));assert(body.classList.contains('tbui3-toolbar-native-hidden'));
    f.adapter.setMode('Classic');assert(!header.classList.contains('tbui3-toolbar-native-hidden'));assert(!body.classList.contains('tbui3-toolbar-native-hidden'));assert.equal(f.toolbar.parentElement,header);f.dispose();
});
test('checked menu state and dynamically changed selector values stay synchronized',()=>{
    const f=fixture();f.items.Edit=[{name:'Toggle',action:'toggle',iconClass:'tickIcon'},{name:'Choice',comboOptions:['a','b'],comboValue:'a',onchange:()=>{}}];
    f.adapter.setMode('Ribbon');assert.equal(f.d.querySelector('button[title="Toggle "]').getAttribute('aria-pressed'),'true');
    assert.equal(f.d.querySelector('select[aria-label=Choice]').value,'a');f.items.Edit[0].iconClass='';f.items.Edit[1].comboValue='b';
    f.d.querySelector('[data-tab=rootMenuEdit]').click();assert.equal(f.d.querySelector('button[title="Toggle "]').getAttribute('aria-pressed'),'false');
    assert.equal(f.d.querySelector('select[aria-label=Choice]').value,'b');f.dispose();
});
test('the toolbar owns no theme-name gate or hard-coded color palette',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');
    // The established Fluent shadow4 alpha values are an elevation effect, not an application palette.
    const paletteCss=css.replace(/--tbui3-toolbar-shadow:[^;]+;/g,'');
    assert(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(paletteCss));assert(css.includes('--themeMenuBackColor'));assert(css.includes('--themeDialogGeneralForeColor'));
    assert(!/ThemePrefix|WinUI3 Dark|WinUI3 Light|__winui3IdeStyle/.test(source));
    const main=fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/MainModule.twin','utf8');assert(main.includes("return 'toolbar:'+t.requestedMode"));
});
test('the empty 30px native dock slot collapses and returns intact in Classic',()=>{
    const f=fixture(),slot=f.d.createElement('div'),panel=f.d.createElement('div'),header=f.d.createElement('div'),body=f.d.createElement('div');
    slot.className='dockElementContainer';slot.style.minHeight='30px';header.className='sectionHeader';header.panelId='TOOLBAR';header.sectionRoot=body;
    f.toolbar.before(slot);slot.append(panel);panel.append(header,body);header.append(f.toolbar);
    f.adapter.setMode('Hybrid');assert(slot.classList.contains('tbui3-toolbar-native-hidden'));
    assert.equal(slot.style.minHeight,'30px');f.adapter.setMode('Classic');assert(!slot.classList.contains('tbui3-toolbar-native-hidden'));
    assert.equal(f.toolbar.parentElement,header);assert.equal(slot.style.minHeight,'30px');f.dispose();
});
test('a dock slot shared with another native panel stays visible',()=>{
    const f=fixture(),slot=f.d.createElement('div'),header=f.d.createElement('div'),other=f.d.createElement('div');
    slot.className='dockElementContainer';header.className=other.className='sectionHeader';header.panelId='TOOLBAR';other.panelId='EDITOR';
    f.toolbar.before(slot);slot.append(header,other);header.append(f.toolbar);f.adapter.setMode('Hybrid');
    assert(!slot.classList.contains('tbui3-toolbar-native-hidden'));assert(header.classList.contains('tbui3-toolbar-native-hidden'));assert(!other.classList.contains('tbui3-toolbar-native-hidden'));f.dispose();
});
test('toolbar redocking releases the former slot and collapses only its new slot',()=>{
    const f=fixture(),slots=[f.d.createElement('div'),f.d.createElement('div')],header=f.d.createElement('div');
    for(const n of slots)n.className='dockElementContainer';header.className='sectionHeader';header.panelId='TOOLBAR';
    f.toolbar.before(...slots);slots[0].append(header);header.append(f.toolbar);f.adapter.setMode('Hybrid');
    assert(slots[0].classList.contains('tbui3-toolbar-native-hidden'));slots[1].append(header);f.adapter.tick();
    assert(!slots[0].classList.contains('tbui3-toolbar-native-hidden'));assert(slots[1].classList.contains('tbui3-toolbar-native-hidden'));f.dispose();
    assert(!slots[1].classList.contains('tbui3-toolbar-native-hidden'));
});
test('ribbon captions are short while original help and shortcuts remain in tooltips',()=>{
    const f=fixture(),restart=f.button('restartIcon','Restart the compiler. Hold ALT key to additionally restart the LLVM cache process.');
    f.adapter.setMode('Hybrid');const b=f.d.querySelector('[data-source=restartIcon]');
    assert.equal(b.querySelector('.tbui3-ribbon-label').textContent,'Restart compiler');assert(b.title.includes('Hold ALT key'));
    assert.equal(f.d.querySelector('[data-source=saveIcon] .tbui3-ribbon-label').textContent,'Save');
    assert(f.d.querySelector('.tbui3-ribbon-selector').textContent.startsWith('Configuration'));
    b.click();assert.deepEqual(f.calls,['restartIcon']);assert.equal(restart.title,b.title);f.dispose();
});

function installedFunction(text,name) {
    const start=text.indexOf('function '+name+'(');assert(start>=0,'Missing IDE helper '+name);
    let end=start;while((end=text.indexOf('}',end+1))>=0){try{const fn=text.slice(start,end+1);new vm.Script('('+fn+')');return fn;}catch{}}
    throw Error('Cannot read '+name);
}
test('shipped BETA native binding and context alternatives still execute exactly once',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for official IDE command contract');
    const text=fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),f=fixture(),registered=[];
    const flags={code:true,form:false},expr=key=>({getBoundSymbolNames(names){names.push(key);},key});
    const sandbox={boundCommandIcons:[],statusHoveringCommand:{},context:{code:{registerForContext:n=>registered.push(n)},form:{registerForContext:n=>registered.push(n)}},
        GetIdeCommandShortcutDescription:()=>'',evaluateExpression:expr=>flags[expr.key],
        ideCommands:{code:{defaultContext:expr('code'),internalAction:()=>f.calls.push('native code')},form:{defaultContext:expr('form'),internalAction:()=>f.calls.push('native form')}}};
    for(const name of ['registerContextBindings','executeIdeCommand','bindIconToIdeCommand'])sandbox[name]=vm.runInNewContext('('+installedFunction(text,name)+')',sandbox);
    const save=f.d.getElementById('saveIcon');delete save.boundCommand;sandbox.bindIconToIdeCommand(save,['code','form']);
    f.adapter.setMode('Hybrid');f.d.querySelector('[data-source=saveIcon]').click();assert.deepEqual(f.calls,['native code']);
    flags.code=false;flags.form=true;save.onContextChange();f.adapter.tick();f.d.querySelector('[data-source=saveIcon]').click();assert.deepEqual(f.calls,['native code','native form']);
    flags.form=false;save.onContextChange();f.adapter.tick();assert(f.d.querySelector('[data-source=saveIcon]').disabled);assert(registered.length===2);f.dispose();
});
test('shipped native File/Edit/Format/Tools and async Add-ins descriptors populate the replacement',async t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for official IDE menu contract');
    const text=fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),f=fixture();
    const sandbox={showContextMenu:(...args)=>f.show(...args),menuRightTriangle:'>',
        root:{getAddinsList:cb=>setTimeout(()=>cb([{name:'Native loaded add-in'}]),0)},notSupportedMenuOption:()=>{}};
    for(const name of ['File','Edit','Format','Tools','Addins']){
        const n=f.d.getElementById('rootMenu'+name);sandbox['rootMenu'+name]=n;
        const fn=vm.runInNewContext('('+installedFunction(text,'show'+name+'Menu')+')',sandbox);n.onmousedown=()=>fn();
    }
    f.adapter.setMode('Ribbon');f.adapter.openFile();
    assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('MenuCaptionFileSaveProject'));
    f.adapter.closeFile();f.d.querySelector('[data-tab=rootMenuTools]').click();assert(f.d.querySelector('.tbui3-ribbon-content').textContent.includes('Restart the compiler'));
    f.d.querySelector('[data-tab=rootMenuFormat]').click();assert(f.d.querySelector('[aria-haspopup=menu]'));
    f.adapter.openFile('Addins');await new Promise(r=>setTimeout(r,10));assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Native loaded add-in'));f.dispose();
});

test('embedded toolbar contains the exact adapter, essential CSS and the existing 19 Fluent glyphs',()=>{
    const path='tbIDE/tbUI3IDE/src/Sources/IdeToolbarScript.twin',src=fs.readFileSync(path,'utf8');let js='';
    for(const line of src.split(/\r?\n/)){
        if(line.trim()==='js = js & vbLf'){js+='\n';continue;}
        if(!line.trim().startsWith('js = js & '))continue;
        for(const part of line.trim().slice(10).split(' & ')){if(part==='Chr(34)')js+='"';else js+=part.slice(1,-1);}
    }
    new vm.Script(js);assert(js.includes(source.trim()));
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');assert(js.includes(JSON.stringify(css)));
    assert.equal((js.match(/data:image\/svg\+xml/g)||[]).length,19);assert(!/(?<!\r)\n/.test(src));
});
