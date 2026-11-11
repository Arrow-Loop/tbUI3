import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const source=fs.readFileSync('tbIDE/tbUI3IDE/js/ide-toolbar.js','utf8');
const factory=vm.runInNewContext(source);
const layoutSource=fs.readFileSync('tbIDE/tbUI3IDE/js/ribbon-layout.js','utf8');
const presentationSource=fs.readFileSync('tbIDE/tbUI3IDE/js/ribbon-presentation.js','utf8');
const present=vm.runInNewContext(presentationSource);
const rawBuildLayout=vm.runInNewContext(layoutSource);
const buildLayout=(records,quick)=>rawBuildLayout(records,quick,present);
const establishedIcons=Object.fromEntries([...fs.readFileSync('tbIDE/tbUI3IDE/css/winui3-ide-icons.css','utf8').matchAll(/>\s*#([\w-]+)\s*\{\s*--fluent-icon:\s*(url\('[^']+'\))/g)].map(m=>[m[1],m[2]]));
const extraIcons=JSON.parse(fs.readFileSync('tbIDE/tbUI3IDE/icons/ribbon.json','utf8')).icons;
function fixture() {
    const dom=new JSDOM(`<div id='root'><div id='rootMenu1'><div id='rootMenu1Inner'></div><div id='rootMenuClose'>Close</div></div><div id='rootTop'><input id='editor'></div><div id='rootMenu2'></div></div>
    <div class='tbis-optionRow'><div class='tbis-optionName'>Enable additional IDE theme styling via add-in</div></div>`);
    const w=dom.window,d=w.document,calls=[];w.setInterval=()=>1;w.clearInterval=()=>{};const computed=w.getComputedStyle.bind(w);w.getComputedStyle=n=>computed(n);
    const toolbar=d.getElementById('rootMenu2'),headers=d.getElementById('rootMenu1Inner');
    const api={window:w,buildLayout,present,projectName:()=>'Example project',icons:{...establishedIcons,...Object.fromEntries(Object.keys(extraIcons).map(key=>[key,"url('data:image/svg+xml,"+key+"')"]))},
        localize:s=>s,execute:s=>calls.push(s),commandEnabled:s=>s!=='disabled',testContext:()=>true,
        shortcut:()=>'',realTitlebar:()=>false,formGlobals:()=>null,changedSize:()=>{}};
    let show=(anchor,x,y,items)=>calls.push(['nativeMenu',anchor&&anchor.id,items]);
    api.getShowContextMenu=()=>show;api.setShowContextMenu=fn=>{show=fn;};
    const items={File:[{name:'Save',action:'tbProject_SaveAllChanges'}],Edit:[{name:'Undo',action:'tbEditor_Undo'},{},{name:'Disabled',action:'disabled'}],Format:[{name:'Align',hoverAction:()=>show(undefined,0,0,[{name:'Left',action:'left'}])}],Addins:[{name:'Loaded add-in',action:()=>calls.push('nativeAddin')}],Tools:[{name:'Options',action:'tbIde_ShowIDEOptions'}]};
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
    f.menu('Future');f.adapter.tick();const tab=f.d.querySelector('[data-tab=Future]');assert(tab);tab.click();
    f.d.querySelector('button[title="Future command "]').click();assert(f.calls.includes('future'));
    f.items.Future=[{name:'Added later',action:'new'}];f.d.querySelector('[data-tab=Future]').click();
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
    [...f.d.querySelectorAll('.tbui3-backstage-nav')].find(n=>n.textContent==='Add-ins').click();
    assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Loaded add-in'));
    f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(f.d.querySelector('.tbui3-backstage').hidden);assert.equal(f.d.activeElement,editor);f.dispose();
});
test('native lazy submenus are captured on demand without executing their actions',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();
    f.d.querySelector('button[title="Align"]').click();assert(!f.calls.includes('left'));
    f.d.querySelector('.tbui3-ribbon-popup button').click();assert.deepEqual(f.calls,['left']);assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.dispose();
});
test('asynchronous add-in menu callbacks populate File without opening recursively',async()=>{
    const f=fixture();const n=f.d.getElementById('rootMenuAddins');let requests=0,callback;
    n.onmousedown=()=>{requests++;callback=()=>f.show(n,0,0,f.items.Addins);};
    f.adapter.setMode('Ribbon');f.adapter.openFile('Add-ins');assert.equal(requests,1);callback();
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
    f.d.querySelector('[data-tab=Home]').click();assert.equal(f.d.querySelector('button[title="Toggle "]').getAttribute('aria-pressed'),'false');
    assert.equal(f.d.querySelector('select[aria-label=Choice]').value,'b');f.dispose();
});
test('the toolbar owns no theme-name gate or hard-coded color palette',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');
    // Pinned WinUI subtle-state alpha fills and shadow4 are effects, not a replacement theme palette.
    const paletteCss=css.replace(/--tbui3-toolbar-shadow:[^;]+;|--tbui3-subtle-(?:hover|pressed):[^;]+;/g,'');
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
    assert(f.d.querySelector('[data-file-section=Save]'));
    assert(!f.d.querySelector('.tbui3-backstage-content').textContent.includes('MenuCaptionFileSaveProject'));
    f.adapter.closeFile();f.d.querySelector('[data-tab=Project]').click();assert(f.d.querySelector('.tbui3-ribbon-content').textContent.includes('Restart the compiler'));
    f.d.querySelector('[data-tab=Form]').click();assert(f.d.querySelector('[aria-haspopup=menu]'));
    f.adapter.openFile('Add-ins');await new Promise(r=>setTimeout(r,10));assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Native loaded add-in'));f.dispose();
});

test('embedded toolbar contains the exact adapter, essential CSS, original glyphs and 17 Fluent gap-fill glyphs',()=>{
    const path='tbIDE/tbUI3IDE/src/Sources/IdeToolbarScript.twin',src=fs.readFileSync(path,'utf8');let js='';
    for(const line of src.split(/\r?\n/)){
        if(line.trim()==='js = js & vbLf'){js+='\n';continue;}
        if(!line.trim().startsWith('js = js & '))continue;
        for(const part of line.trim().slice(10).split(' & ')){if(part==='Chr(34)')js+='"';else js+=part.slice(1,-1);}
    }
    new vm.Script(js);assert(js.includes(source.trim()));assert(js.includes(layoutSource.trim()));assert(js.includes(presentationSource.trim()));
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');assert(js.includes(JSON.stringify(css)));
    assert.equal((js.match(/data:image\/svg\+xml/g)||[]).length,36);assert(!/(?<!\r)\n/.test(src));
});

test('Home uses Paste as the lead command and keeps Undo/Redo/Run solely in quick access',()=>{
    const f=fixture();f.items.Edit=[{name:'Undo',action:'tbEditor_Undo'},{name:'Redo',action:'tbEditor_Redo'},
        {name:'Cut',action:'tbEditor_ClipboardCut'},{name:'Copy',action:'tbEditor_ClipboardCopy'},
        {name:'Paste',action:'tbEditor_ClipboardPaste'},{name:'Find',action:'tbEditor_Find'},
        {name:'Format document',action:'tbEditor_FormatDocument'}];
    f.items.Run=[{name:'Run',action:'tbDebug_StartOrContinue'}];f.menu('Run');f.adapter.setMode('Ribbon');
    const body=f.d.querySelector('.tbui3-ribbon-content');assert.deepEqual([...body.querySelectorAll('section')].map(n=>n.getAttribute('aria-label')),['Clipboard','Editing']);
    assert.equal(body.querySelector('.tbui3-ribbon-large').textContent,'Paste');assert(!body.textContent.includes('Undo'));assert(!body.textContent.includes('Redo'));
    body.querySelector('button').click();assert.deepEqual(f.calls,['tbEditor_ClipboardPaste']);
    f.d.querySelector('[data-source=undoIcon]').click();assert.deepEqual(f.calls,['tbEditor_ClipboardPaste','undoIcon']);
    assert(!f.d.querySelector('[data-tab=Edit]'));assert(!f.d.querySelector('[data-tab=Run]'));
    f.d.querySelector('[data-tab=Code]').click();assert(f.d.querySelector('.tbui3-ribbon-content').textContent.includes('Format document'));f.dispose();
});
test('synthetic compact dropdowns keep every child native action',()=>{
    const f=fixture();f.items.Edit=[{name:'Fold',action:'tbEditor_Fold'},{name:'Fold all',action:'tbEditor_FoldAll'},
        {name:'Unfold',action:'tbEditor_Unfold'},{name:'Uppercase',action:'tbEditor_TransformToUppercase'}];
    f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Code]').click();
    const buttons=[...f.d.querySelectorAll('.tbui3-ribbon-content button')];assert.equal(f.d.querySelector('[aria-label=Outlining]').querySelectorAll('button').length,2);assert.equal(f.d.querySelector('[aria-label=Case]').querySelectorAll('button').length,1);
    buttons.find(b=>b.textContent.startsWith('Fold')).click();const children=f.d.querySelectorAll('.tbui3-ribbon-popup button');assert.equal(children.length,2);
    children[1].click();assert.deepEqual(f.calls,['tbEditor_FoldAll']);f.dispose();
});
test('Backstage hides the designer and floating panels and restores their exact accessibility state',()=>{
    const f=fixture(),top=f.d.getElementById('rootTop'),floating=f.d.createElement('div');floating.className='floatingPanel';
    floating.inert=false;floating.setAttribute('aria-hidden','false');f.d.body.append(floating);f.adapter.setMode('Ribbon');f.adapter.openFile();
    for(const n of [top,floating,f.d.querySelector('.tbui3-ribbon')]){assert(n.classList.contains('tbui3-backstage-underlay'));assert.equal(n.inert,true);assert.equal(n.getAttribute('aria-hidden'),'true');}
    const later=floating.cloneNode();later.classList.remove('tbui3-backstage-underlay');later.inert=false;later.removeAttribute('aria-hidden');f.d.body.append(later);f.adapter.tick();assert(later.classList.contains('tbui3-backstage-underlay'));
    f.adapter.closeFile();assert.equal(top.getAttribute('aria-hidden'),null);assert.equal(floating.getAttribute('aria-hidden'),'false');assert.equal(floating.inert,false);assert.equal(later.inert,false);
    f.adapter.openFile();f.adapter.setMode('Classic');assert(!f.d.querySelector('.tbui3-backstage-underlay'));assert.equal(floating.getAttribute('aria-hidden'),'false');f.dispose();
});
test('File uses a stable vertical navigation rail and native Save/Options close it before dispatch',()=>{
    const f=fixture();f.api.execute=a=>{assert(f.d.querySelector('.tbui3-backstage').hidden);assert(!f.d.querySelector('.tbui3-backstage-underlay'));f.calls.push(a);};
    f.adapter.setMode('Ribbon');f.adapter.openFile();const save=f.d.querySelector('[data-file-section=Save]');save.focus();
    f.adapter.tick();assert.equal(f.d.activeElement,save);assert(f.d.querySelector('.tbui3-backstage-project').textContent.includes('Example project'));
    save.click();assert.deepEqual(f.calls,['tbProject_SaveAllChanges']);f.adapter.openFile();f.d.querySelector('[data-file-section=Options]').click();assert.deepEqual(f.calls,['tbProject_SaveAllChanges','tbIde_ShowIDEOptions']);f.dispose();
});
test('unknown future commands survive every semantic fallback with their native identity',()=>{
    const command=(menuId,name)=>({menuId,menuTitle:menuId==='newMenu'?'Future':menuId,item:{name,action:name}});
    const records=[command('rootMenuEdit','new-edit'),command('rootMenuFile','new-file'),command('rootMenuView','new-view'),command('newMenu','new-menu')];
    const result=buildLayout(records),tabs=Object.fromEntries(result.tabs.map(t=>[t.id,t]));
    assert.equal(tabs.Home.groups[0].items[0].action,'new-edit');assert.equal(result.file.get('More')[0].action,'new-file');
    assert.equal(tabs.View.groups[0].items[0].action,'new-view');assert.equal(tabs.Future.groups[0].items[0].action,'new-menu');
});
test('all shipped BETA 1044 menu descriptors remain reachable after semantic organization',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for official IDE menu contract');
    const text=fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),records=[],sandbox={menuRightTriangle:'>',g_TraceMode:false,
        context:{projectLoaded:{value:true}},root:{getAddinsList:cb=>cb([{name:'Native add-in'}])},showContextMenu:()=>{}};
    for(const name of ['File','Edit','View','Project','Format','Debug','Run','Tools','Addins','Windows','Help']){
        const menuId='rootMenu'+name;sandbox[menuId]={offsetLeft:0,offsetTop:0,offsetHeight:0};
        sandbox.showContextMenu=(n,x,y,items)=>{for(const entry of items){const item=Array.isArray(entry)?entry[0]:entry;if(item.name)records.push({menuId,menuTitle:name,item});}};
        vm.runInNewContext('('+installedFunction(text,'show'+name+'Menu')+')',sandbox)();
    }
    const layout=buildLayout(records),flat=items=>items.flatMap(i=>i._ribbonChildren?flat(i._ribbonChildren):[i]);
    const placed=flat([...layout.tabs.flatMap(t=>t.groups.flatMap(g=>g.items)),...[...layout.file.values()].flat(),...layout.suppressed]);
    const identity=i=>typeof i.action==='function'?String(i.action):i.action||i.name;
    for(const r of records)assert(placed.some(i=>identity(i)===identity(r.item)),`Lost ${r.menuId}: ${r.item.name}`);
    const actions=(tab,group)=>flat(layout.tabs.find(t=>t.id===tab).groups.find(g=>g.title===group).items).map(i=>i.action);
    assert(actions('Home','Clipboard').includes('tbEditor_ClipboardPaste'));assert(actions('Home','Editing').includes('tbProject_FindInFiles'));
    assert(actions('Code','Navigation').includes('tbEditor_GoToDefinition'));assert(actions('Form','Position').includes('tbFormDesigner_BringControlToFront'));
    assert(actions('View','Show').includes('tbWatches_ShowPanel'));assert(actions('View','Zoom').includes('tbEditor_IncreaseFontSize'));
    assert(actions('Project','Build').includes('tbBuild_Start'));assert(layout.file.has('Options'));assert(layout.file.has('Save document'));
    assert(!layout.tabs.some(t=>['Edit','Run','Window','Windows','Format'].includes(t.id)));
    t.diagnostic(`${records.length} live native descriptors retained across ${layout.tabs.length} semantic tabs, File and quick access`);
});

test('Office role sizing survives reordering and permits multiple full-size commands in one group',()=>{
    const records=[
        ['rootMenuProject','Settings','tbProject_ShowSettings'],['rootMenuProject','References','tbProject_ShowReferences'],
        ['rootMenuFormat','Bring forward','tbFormDesigner_BringControlToFront'],['rootMenuFormat','Send backward','tbFormDesigner_SendControlToBack'],
        ['rootMenuView','Zoom in','tbEditor_IncreaseFontSize'],['rootMenuView','Zoom out','tbEditor_DecreaseFontSize'],
        ['rootMenuEdit','Paste','tbEditor_ClipboardPaste'],['rootMenuEdit','Copy','tbEditor_ClipboardCopy'],
        ['rootMenuEdit','Format document','tbEditor_FormatDocument'],['rootMenuEdit','Indent','tbEditor_IndentLine']
    ].map(([menuId,name,action])=>({menuId,menuTitle:menuId,item:{name,action}}));
    const sizes=rows=>Object.fromEntries(buildLayout(rows).tabs.flatMap(t=>t.groups.flatMap(g=>g.items.map(i=>[i.action,i._ribbonLarge]))));
    const first=sizes(records);assert.deepEqual(sizes(records.slice().reverse()),first);
    for(const a of ['tbProject_ShowSettings','tbProject_ShowReferences','tbFormDesigner_BringControlToFront','tbFormDesigner_SendControlToBack','tbEditor_IncreaseFontSize','tbEditor_DecreaseFontSize','tbEditor_ClipboardPaste','tbEditor_FormatDocument'])assert.equal(first[a],true,a);
    assert.equal(first.tbEditor_ClipboardCopy,false);assert.equal(first.tbEditor_IndentLine,false);
    assert.equal(present({name:'Fold'}).large,true);assert.equal(present({name:'Unfold'}).large,true);assert.equal(present({name:'Change case'}).large,false);
});
test('Help is available only through File and native Help shortcut interception preserves its actions',()=>{
    const f=fixture();f.items.Help=[{name:'About',action:'tbHelp_ShowAboutWindow'},{name:'Support',action:()=>f.calls.push('support')}];
    const native=f.menu('Help');f.adapter.setMode('Ribbon');assert(!f.d.querySelector('[data-tab=Help]'));
    f.show(native,0,0,f.items.Help);assert(!f.d.querySelector('.tbui3-backstage').hidden);
    assert.equal(f.d.querySelector('.tbui3-backstage-heading').textContent,'Help');
    f.d.querySelector('.tbui3-backstage-tasks button').click();assert.deepEqual(f.calls,['tbHelp_ShowAboutWindow']);assert(f.d.querySelector('.tbui3-backstage').hidden);
    f.adapter.openFile();f.d.querySelector('[data-file-section=Help]').click();[...f.d.querySelectorAll('.tbui3-backstage-tasks button')].find(b=>b.textContent==='Support').click();assert.deepEqual(f.calls,['tbHelp_ShowAboutWindow','support']);f.dispose();
});
function assertButtonIcon(button){
    const icon=button.querySelector('.tbui3-ribbon-icon');assert(icon&&!icon.hidden,'Missing icon: '+button.textContent);
    assert(icon.classList.contains('codicon')||icon.style.getPropertyValue('--tbui3-icon')||icon.style.getPropertyValue('--tbui3-native-image'),'Empty icon: '+button.textContent);
}
test('text-only native, synthetic, File and future commands all receive visible icon representations',()=>{
    const f=fixture();f.items.Edit=[{name:'Cut',action:'tbEditor_ClipboardCut'},{name:'Select all',action:'tbEditor_SelectAll'},
        {name:'Fold',action:'tbEditor_Fold'},{name:'Unfold',action:'tbEditor_Unfold'},
        {name:'Uppercase',action:'tbEditor_TransformToUppercase'},{name:'Future command',action:'new-command'}];
    f.adapter.setMode('Ribbon');for(const tab of ['Home','Code']){f.d.querySelector(`[data-tab=${tab}]`).click();for(const b of f.d.querySelectorAll('.tbui3-ribbon-content button'))assertButtonIcon(b);}
    [...f.d.querySelectorAll('.tbui3-ribbon-content button')].find(b=>b.textContent.startsWith('Fold')).click();for(const b of f.d.querySelectorAll('.tbui3-ribbon-popup button'))assertButtonIcon(b);
    f.adapter.openFile();for(const b of f.d.querySelectorAll('.tbui3-backstage button'))assertButtonIcon(b);
    for(const b of f.d.querySelectorAll('.tbui3-quick button'))assertButtonIcon(b);f.dispose();
});
test('text-only add-ins get a Fluent glyph while contributed images and exact-once handlers remain intact',()=>{
    const f=fixture(),text=f.button('addinButton-global-search','Global Search'),image=f.button('addinButton-imaged','Other add-in');text.classList.add('iconTextOnly');
    text.onmousedown=null;text.onclick=()=>f.calls.push('search addin');image.style.backgroundImage='url(https://example.test/original.svg)';
    f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab="Add-ins"]').click();const proxy=f.d.querySelector('[data-source="addinButton-global-search"]');
    assertButtonIcon(proxy);assert(proxy.classList.contains('tbui3-ribbon-large'));assert.equal(proxy.querySelector('.tbui3-ribbon-icon').style.getPropertyValue('--tbui3-icon'),f.api.icons.searchIcon);
    assert(f.d.querySelector('[data-source="addinButton-imaged"] .tbui3-ribbon-icon').style.getPropertyValue('--tbui3-native-image').includes('original.svg'));
    proxy.click();assert.deepEqual(f.calls,['search addin']);f.dispose();
});
test('moved grid controls retain original nodes and events and restore in original order',()=>{
    const f=fixture(),grid=f.d.createElement('div');grid.id='menuBarGridOptions';grid.innerHTML='<div class="menuBarGridOptionsInner"><div class="menuBarGridOptionRow"><div class="menuBarGridOption">Grid width</div><div class="menuBarGridValue"><input type="number" value="8"></div></div></div>';
    f.toolbar.after(grid);const inner=grid.firstElementChild,input=grid.querySelector('input');let changes=0;input.onchange=()=>changes++;
    f.api.formGlobals=()=>({selectedControls:[]});f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();assert.equal(f.d.querySelector('.tbui3-ribbon-grid input'),input);
    input.value='12';input.dispatchEvent(new f.w.Event('change'));assert.equal(changes,1);f.adapter.setMode('Classic');assert.equal(grid.firstElementChild,inner);assert.equal(input.value,'12');f.dispose();
});
test('toolbar surface, hover, pressed and grid styles consume the old toolbar and active-theme resources',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8'),dom=new JSDOM('<head></head>');const style=dom.window.document.createElement('style');style.textContent=css;dom.window.document.head.append(style);
    const rules=[...style.sheet.cssRules];const token=rules.find(r=>r.selectorText==='.tbui3-toolbar-owned, .tbui3-toolbar-option').style;
    assert(token.getPropertyValue('--tbui3-toolbar-bg').includes('--color-card'));assert(token.getPropertyValue('--tbui3-toolbar-bg').includes('--themeToolbarBackground'));
    assert(token.getPropertyValue('--tbui3-toolbar-fg').replace(/\s/g,'').startsWith('var(--color-text,var(--themeGeneralTextColor'));
    const quick=rules.find(r=>r.selectorText==='.tbui3-quick');assert(quick.style.color.includes('--themeMenuForeColor'));
    const popup=rules.find(r=>r.selectorText==='.tbui3-ribbon-popup');assert(popup.style.color.includes('--themeContextMenuForeColor'));assert(popup.style.background.includes('--themeContextMenuBackground')); 
    assert(token.getPropertyValue('--tbui3-toolbar-hover').includes('--color-neutral-hover'));assert(token.getPropertyValue('--tbui3-toolbar-pressed').includes('--color-neutral-pressed'));
    assert.equal(token.getPropertyValue('--tbui3-subtle-hover'),'#00000009');
    const dark=rules.find(r=>r.selectorText==='.darkMode .tbui3-toolbar-owned, .darkMode .tbui3-toolbar-option');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-hover'),'#ffffff0f');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-pressed'),'#ffffff0a');
    const hover=rules.find(r=>r.selectorText?.includes('.tbui3-ribbon-command:hover:not(:disabled)'));assert.equal(hover.style.background,'var(--tbui3-toolbar-hover)');
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-command:active:not(:disabled)'&&r.style.background==='var(--tbui3-toolbar-pressed)'));
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-content .menuBarGridOptionsInner'&&r.style.color==='var(--tbui3-toolbar-fg)'));
    const numbers=rules.find(r=>r.selectorText===".tbui3-ribbon-content .menuBarGridOptionRow input[type='number']");assert(numbers.style.background.includes('--themeDialogGeneralBackColor'));
    assert(css.includes('--tbui3-command-area-height: 100px'));assert(css.includes('--tbui3-large-button-height: 76px'));assert(css.includes('--tbui3-tab-area-height: 26px'));dom.window.close();
});
