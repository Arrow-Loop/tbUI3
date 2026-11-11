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
const contextSource=fs.readFileSync('tbIDE/tbUI3IDE/js/native-toolbar-context.js','utf8');
const contextFactory=vm.runInNewContext(contextSource);
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

test('embedded toolbar contains the exact adapter, essential CSS, original glyphs and 18 Fluent gap-fill glyphs',()=>{
    const path='tbIDE/tbUI3IDE/src/Sources/IdeToolbarScript.twin',src=fs.readFileSync(path,'utf8');let js='';
    for(const line of src.split(/\r?\n/)){
        if(line.trim()==='js = js & vbLf'){js+='\n';continue;}
        if(!line.trim().startsWith('js = js & '))continue;
        for(const part of line.trim().slice(10).split(' & ')){if(part==='Chr(34)')js+='"';else js+=part.slice(1,-1);}
    }
    new vm.Script(js);assert(js.includes(source.trim()));assert(js.includes(layoutSource.trim()));assert(js.includes(presentationSource.trim()));assert(js.includes(contextSource.trim()));
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');assert(js.includes(JSON.stringify(css)));
    assert.equal((js.match(/data:image\/svg\+xml/g)||[]).length,37);assert(!/(?<!\r)\n/.test(src));
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
    const f=fixture(),grid=f.d.createElement('div');grid.id='menuBarGridOptions';grid.innerHTML='<div class="menuBarGridOptionsInner"><div class="menuBarGridOptionRow"><div class="menuBarGridOption">Grid width</div><div class="menuBarGridValue"><input class="optionGridWidth" type="number" value="8"></div></div></div>';
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
    const popup=rules.find(r=>r.selectorText==='.tbui3-ribbon-popup');assert(popup.style.color.includes('--tbui3-toolbar-fg'));assert(popup.style.background.includes('--color-flyout'));assert(popup.style.background.includes('--themeDialogGeneralBackColor'));assert(!popup.style.background.includes('--themeContextMenuBackColor'));  
    assert(token.getPropertyValue('--tbui3-toolbar-hover').includes('--color-neutral-hover'));assert(token.getPropertyValue('--tbui3-toolbar-pressed').includes('--color-neutral-pressed'));
    assert.equal(token.getPropertyValue('--tbui3-subtle-hover'),'#00000009');
    const dark=rules.find(r=>r.selectorText==='.darkMode .tbui3-toolbar-owned, .darkMode .tbui3-toolbar-option');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-hover'),'#ffffff0f');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-pressed'),'#ffffff0a');
    const hover=rules.find(r=>r.selectorText?.includes('.tbui3-ribbon-command:hover:not(:disabled)'));assert.equal(hover.style.background,'var(--tbui3-toolbar-hover)');
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-command:active:not(:disabled)'&&r.style.background==='var(--tbui3-toolbar-pressed)'));
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-content .menuBarGridOptionsInner'&&r.style.color==='var(--tbui3-toolbar-fg)'));
    const numbers=rules.find(r=>r.selectorText===".tbui3-ribbon-content .menuBarGridOptionRow input[type='number']");assert(numbers.style.getPropertyValue('--tbui3-grid-fill').includes('--themeDialogGeneralBackColor'));assert.equal(numbers.style.getPropertyPriority('background'),'important');
    assert(css.includes('--tbui3-command-area-height: 100px'));assert(css.includes('--tbui3-large-button-height: 76px'));assert(css.includes('--tbui3-tab-area-height: 26px'));dom.window.close();
});

test('dropdowns promote to the browser top layer and clean up on Escape, File and mode changes',()=>{
    const f=fixture();let shown=0,hidden=0;
    f.w.HTMLElement.prototype.showPopover=function(){assert(this.isConnected);assert.equal(this.getAttribute('popover'),'auto');shown++;};
    f.w.HTMLElement.prototype.hidePopover=function(){hidden++;};
    f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();
    const open=()=>{const b=f.d.querySelector('[aria-haspopup=menu]');b.click();assert.equal(b.getAttribute('aria-expanded'),'true');const menu=f.d.querySelector('.tbui3-ribbon-popup');assert.equal(menu.dataset.popupLayer,'top');assert.equal(menu.parentElement,f.d.body);return b;};
    const first=open();f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(hidden,1);assert.equal(first.getAttribute('aria-expanded'),'false');assert(!f.d.querySelector('.tbui3-ribbon-popup'));
    open();f.adapter.openFile();assert.equal(hidden,2);assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.adapter.closeFile();
    open();f.adapter.setMode('Classic');assert.equal(shown,3);assert.equal(hidden,3);assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.dispose();
});
test('popover failure retains a body-level maximum-z fallback and exact-once native action',()=>{
    const f=fixture();f.w.HTMLElement.prototype.showPopover=function(){throw Error('Host does not support promotion');};
    f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();f.d.querySelector('[aria-haspopup=menu]').click();
    const menu=f.d.querySelector('.tbui3-ribbon-popup');assert.equal(menu.dataset.popupLayer,'fallback');assert(!menu.hasAttribute('popover'));assert.equal(f.d.body.lastElementChild,menu);
    menu.querySelector('button').click();assert.deepEqual(f.calls,['left']);assert(!f.d.querySelector('.tbui3-ribbon-popup'));
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');assert(css.includes('z-index: 2147483647'));assert(css.includes('inset: auto; margin: 0;'));f.dispose();
});
test('tab strip and command surface are separate, with indicator-only selected and hover states',()=>{
    const dom=new JSDOM('<head></head>'),style=dom.window.document.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');dom.window.document.head.append(style);
    const rules=[...style.sheet.cssRules],rule=selector=>rules.find(r=>r.selectorText===selector).style;
    assert.equal(rule('.tbui3-ribbon').background,'transparent');assert(rule('.tbui3-ribbon-tabs').background.includes('--themeMenuBackColor'));
    assert(rule('.tbui3-ribbon-tabs').color.includes('--themeMenuForeColor'));assert.equal(rule('.tbui3-ribbon-content').background,'var(--tbui3-toolbar-bg)');assert(rule('.tbui3-ribbon-content').getPropertyValue('box-shadow').includes('--tbui3-toolbar-shadow'));
    assert.equal(rule('.tbui3-ribbon-tab').background,'transparent');assert(!rules.some(r=>r.selectorText===".tbui3-ribbon-tab[aria-selected='true']"&&r.style.background));
    assert.equal(rule(".tbui3-ribbon-tab[aria-selected='true']::after").background,'var(--tbui3-accent)');
    assert.equal(rule(".tbui3-ribbon-tab:hover:not([aria-selected='true'])::after").background,'var(--tbui3-tab-hover-indicator)');
    assert(!rules.some(r=>r.selectorText?.includes('.tbui3-ribbon-tab:hover')&&!r.selectorText.includes('::after')));
    const token=rule('.tbui3-toolbar-owned, .tbui3-toolbar-option');assert(token.getPropertyValue('--tbui3-accent').includes('--themeProblemSelectedBorderColor'));assert(token.getPropertyValue('--tbui3-tab-hover-indicator').includes('GrayText'));dom.window.close();
});
test('large and compact dropdowns use a masked Fluent chevron in their respective layout positions',()=>{
    const f=fixture();f.items.Format[0].name='{%MenuCaptionFormatAlign}';f.items.Edit=[{name:'Other options',hoverAction:()=>f.show(undefined,0,0,[{name:'Child',action:'child'}])}];
    f.adapter.setMode('Ribbon');const compact=f.d.querySelector('.tbui3-ribbon-dropdown');assert(!compact.classList.contains('tbui3-ribbon-large'));assert.equal(compact.querySelector('.tbui3-ribbon-chevron').textContent,'');
    assert(compact.querySelector('.tbui3-ribbon-chevron').style.getPropertyValue('--tbui3-icon').includes('chevron_down'));
    f.d.querySelector('[data-tab=Form]').click();const large=f.d.querySelector('.tbui3-ribbon-dropdown');assert(large.classList.contains('tbui3-ribbon-large'));
    assert.equal(large.lastElementChild,large.querySelector('.tbui3-ribbon-chevron'));assert.equal(large.querySelector('.tbui3-ribbon-chevron').textContent,'');
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);const rules=[...style.sheet.cssRules];
    const grid=rules.find(r=>r.selectorText==='.tbui3-ribbon-content .tbui3-ribbon-large').style;assert.equal(grid.display,'grid');assert(grid.getPropertyValue('grid-template-rows').includes('10px'));
    const big=rules.find(r=>r.selectorText==='.tbui3-ribbon-content .tbui3-ribbon-large > .tbui3-ribbon-chevron').style;assert.equal(big.getPropertyValue('justify-self'),'center');assert.equal(parseFloat(big.margin),0);
    const small=rules.find(r=>r.selectorText==='.tbui3-toolbar-owned .tbui3-ribbon-command > .tbui3-ribbon-chevron').style;assert.equal(small.getPropertyValue('align-self'),'center');assert.equal(small.getPropertyValue('margin-left'),'auto');f.dispose();
});
test('File Back is an accessible icon-only circled arrow and restores the prior focus',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');const editor=f.d.getElementById('editor');editor.focus();f.adapter.openFile();
    const back=f.d.querySelector('.tbui3-backstage-back');assert.equal(back.textContent,'');assert.equal(back.getAttribute('aria-label'),'Back to project');assert.equal(back.title,'Back to project');
    const circle=back.querySelector('.tbui3-backstage-back-circle');assert(circle);assert.equal(circle.getAttribute('aria-hidden'),'true');assert(circle.querySelector('.tbui3-ribbon-mask').style.getPropertyValue('--tbui3-icon').includes('arrow_left'));
    back.click();assert(f.d.querySelector('.tbui3-backstage').hidden);assert.equal(f.d.activeElement,editor);f.dispose();
});
test('grid input background overrides the actual native BETA forced-white important rule',t=>{
    if(!process.env.TB_IDE_DESIGNER_CSS)return t.skip('Set TB_IDE_DESIGNER_CSS to the native formDesigner.css');
    const native=fs.readFileSync(process.env.TB_IDE_DESIGNER_CSS,'utf8'),block=native.match(/input\.optionGridWidth, input\.optionGridHeight\s*\{[^}]*\}/)?.[0];assert(block);assert(/background:\s*white\s*!important/.test(block));
    const f=fixture(),grid=f.d.createElement('div');grid.id='menuBarGridOptions';grid.innerHTML='<div class="menuBarGridOptionsInner"><div class="menuBarGridOptionRow"><input type="number" class="optionGridWidth"><input type="number" class="optionGridHeight"></div></div>';
    f.toolbar.after(grid);f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();const style=f.d.createElement('style');style.textContent=block+'\n'+fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);
    const rules=[...style.sheet.cssRules],ours=rules.find(r=>r.selectorText===".tbui3-ribbon-content .menuBarGridOptionRow input[type='number']");assert.equal(ours.style.getPropertyPriority('background'),'important');assert.equal(ours.style.background,'var(--tbui3-grid-fill)');
    for(const input of grid.querySelectorAll('input'))assert.fail('Native input was not moved into the ribbon');
    assert.equal(f.d.querySelectorAll('.tbui3-ribbon-grid input').length,2);
    for(const input of f.d.querySelectorAll('.tbui3-ribbon-grid input')){assert(input.matches(ours.selectorText));assert(!/white|rgb\(255, 255, 255\)/.test(f.w.getComputedStyle(input).background));}
    const popup=rules.find(r=>r.selectorText==='.tbui3-ribbon-popup');assert(popup.style.background.includes('--color-flyout'));assert(!popup.style.background.includes('--themeContextMenuBackColor'));f.dispose();
});

function nativeFunction(name,sandbox){return vm.runInNewContext('('+installedFunction(fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),name)+')',sandbox);}
function attachNativeBridge(f,sandbox={}){
    const bridge=contextFactory({selectedEditor:()=>sandbox.selectedEditor||null,addComponent:sandbox.addComponent});
    f.api.captureMenu=bridge.captureMenu;f.api.editorState=bridge.editorState;return bridge;
}
test('Form directly exposes the eight classic alignment and size controls using their original native handlers',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native contract');
    const f=fixture(),ids=['menuBarAlignLeft','menuBarAlignTop','menuBarAlignRight','menuBarAlignBottom','menuBarSizeWidest','menuBarSizeTallest','menuBarSizeNarrowest','menuBarSizeShortest'];
    const actions=['AlignSelectedControlsLeft','AlignSelectedControlsTop','AlignSelectedControlsRight','AlignSelectedControlsBottom','ResizeSelectedControlsWidest','ResizeSelectedControlsTallest','ResizeSelectedControlsNarrowest','ResizeSelectedControlsShortest'];
    for(let i=0;i<ids.length;i++){const n=f.button(ids[i]);n.boundCommand='tbFormDesigner_'+actions[i];n.style.backgroundImage='url(https://example.test/'+ids[i]+'.svg)';}
    const sandbox={rootMenuFormat:f.d.getElementById('rootMenuFormat'),menuRightTriangle:'>',showContextMenu:(...args)=>f.show(...args)};
    const show=nativeFunction('showFormatMenu',sandbox);sandbox.rootMenuFormat.onmousedown=()=>show();attachNativeBridge(f);f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();
    assert.deepEqual([...f.d.querySelectorAll('[data-source^=menuBarAlign],[data-source^=menuBarSize]')].map(n=>n.dataset.source),ids);
    for(const id of ids){const button=f.d.querySelector(`[data-source=${id}]`);assert(button.classList.contains('tbui3-ribbon-large'));assert(!button.hasAttribute('aria-haspopup'));assert(button.querySelector('.tbui3-ribbon-icon').style.getPropertyValue('--tbui3-native-image').includes(id));}
    f.d.querySelector('[data-source=menuBarAlignLeft]').click();assert.deepEqual(f.calls,['menuBarAlignLeft']);
    f.d.getElementById('menuBarSizeWidest').classList.add('disabledCommand');f.adapter.tick();assert(f.d.querySelector('[data-source=menuBarSizeWidest]').disabled);f.dispose();
});
test('Insert expands the actual asynchronous native Add producer and keeps dynamic options without opening a native popup',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native contract');
    const f=fixture();let settingsCallback,leaked=0,extra=false;
    const sandbox={getProjectSettings:cb=>{settingsCallback=cb;},getDynamicFormAddMenuOptions:()=>extra?[{name:'New future component',action:'future-component'}]:[],showContextMenu:()=>leaked++,menuRightTriangle:'>',context:{projectLoaded:{value:true}}};
    const project=f.menu('Project');sandbox.rootMenuProject=project;sandbox.showContextMenu=(...args)=>f.show(...args);const show=nativeFunction('showProjectMenu',sandbox);project.onmousedown=()=>show();
    sandbox.showContextMenuAddComponent=nativeFunction('showContextMenuAddComponent',sandbox);sandbox.addComponent=sandbox.showContextMenuAddComponent;
    attachNativeBridge(f,sandbox);f.adapter.setMode('Ribbon');assert.equal(typeof settingsCallback,'function');settingsCallback({});
    f.d.querySelector('[data-tab=Insert]').click();settingsCallback({});
    const content=f.d.querySelector('.tbui3-ribbon-content');assert(content.textContent.includes('Windows form'));assert(content.textContent.includes('Module (.twin)'));assert(content.textContent.includes('String table'));
    assert(!content.querySelector('[aria-haspopup=menu]'));assert(!f.d.querySelector('.tbui3-ribbon-popup'));
    assert.deepEqual([...content.querySelectorAll('section')].map(s=>s.getAttribute('aria-label')),['Forms','Code','Resources','Files']);
    [...content.querySelectorAll('button')].find(b=>b.textContent==='Windows form').click();assert(f.calls.includes('tbFileSystem_AddWindowsForm'));
    extra=true;f.d.querySelector('[data-tab=Insert]').click();settingsCallback({});assert(f.d.querySelector('.tbui3-ribbon-content').textContent.includes('New future component'));assert.equal(leaked,0);
    f.d.querySelector('[data-tab=Insert]').click();const late=settingsCallback;f.adapter.setMode('Classic');late({});assert(!f.d.querySelector('.tbui3-ribbon'));f.dispose();
});
test('outside mouse/pointer clicks, browser light-dismiss and window blur close the popup without consuming the click',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();const anchor=f.d.querySelector('[aria-haspopup=menu]');
    const open=()=>{anchor.click();assert(f.d.querySelector('.tbui3-ribbon-popup'));};open();
    let nativeClicks=0;const block=e=>{nativeClicks++;e.stopImmediatePropagation();};f.d.addEventListener('mousedown',block,true);
    f.d.querySelector('.tbui3-ribbon-content').dispatchEvent(new f.w.MouseEvent('mousedown',{bubbles:true}));assert.equal(nativeClicks,1);assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.d.removeEventListener('mousedown',block,true);
    open();f.d.getElementById('editor').dispatchEvent(new f.w.Event('pointerdown',{bubbles:true}));assert(!f.d.querySelector('.tbui3-ribbon-popup'));
    open();const popup=f.d.querySelector('.tbui3-ribbon-popup'),event=new f.w.Event('toggle');Object.defineProperty(event,'newState',{value:'closed'});popup.dispatchEvent(event);assert(!f.d.querySelector('.tbui3-ribbon-popup'));assert.equal(anchor.getAttribute('aria-expanded'),'false');
    open();f.w.dispatchEvent(new f.w.Event('blur'));assert(!f.d.querySelector('.tbui3-ribbon-popup'));open();anchor.click();assert(!f.d.querySelector('.tbui3-ribbon-popup'));f.dispose();
});
test('all full-size buttons share a fixed top glyph row for one-line, two-line and dropdown captions',()=>{
    const f=fixture();f.items.Edit=[{name:'Paste',action:'tbEditor_ClipboardPaste'},{name:'Find in project with longer label',action:'tbProject_FindInFiles'},{name:'Fold',action:'tbEditor_Fold'}];f.adapter.setMode('Ribbon');
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);const rules=[...style.sheet.cssRules];const large=rules.find(r=>r.selectorText==='.tbui3-ribbon-content .tbui3-ribbon-large').style;
    assert.equal(large.display,'grid');assert.equal(large.getPropertyValue('align-content'),'start');assert.equal(large.getPropertyValue('grid-template-rows'),'28px minmax(0, 28px) 10px');
    for(const button of f.d.querySelectorAll('.tbui3-ribbon-large'))assert(button.firstElementChild.classList.contains('tbui3-ribbon-icon'));
    assert(!rules.some(r=>r.selectorText==='.tbui3-ribbon-content .tbui3-ribbon-large.tbui3-ribbon-dropdown'&&r.style.getPropertyValue('align-content')==='center'));f.dispose();
});
test('File hides quick access immediately and restores its buttons and focus on exit',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');const quick=f.d.querySelector('.tbui3-quick'),save=quick.querySelector('[data-source=saveIcon]');save.focus();f.adapter.openFile();assert(quick.hidden);f.adapter.tick();assert(quick.hidden);
    f.adapter.closeFile();assert(!quick.hidden);assert.equal(f.d.activeElement,save);assert.equal(quick.querySelectorAll('button').length,6);f.adapter.openFile();f.d.querySelector('[data-file-section=Save]').click();assert(!quick.hidden);f.dispose();
});
test('Zoom drops its visible duplicate caption while retaining the exact selector and accessible label',()=>{
    const f=fixture(),zoom=f.d.createElement('select');zoom.id='zoomSelect';zoom.innerHTML='<option>100%</option>';f.toolbar.append(zoom);let changes=0;zoom.onchange=()=>changes++;
    f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=View]').click();const wrapper=zoom.closest('label');assert(wrapper);assert(wrapper.querySelector('.tbui3-ribbon-caption-hidden'));assert.equal(wrapper.querySelector('.tbui3-ribbon-caption-hidden').textContent,'Zoom');assert(![...wrapper.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    zoom.dispatchEvent(new f.w.Event('change'));assert.equal(changes,1);f.adapter.setMode('Classic');assert.equal(zoom.parentElement,f.toolbar);f.dispose();
});
test('editor identity/type changes follow Code/Form without overriding a manual ribbon choice or File',()=>{
    const f=fixture(),native={selectedEditor:{type:'CodeEditor'}};f.items.View=[{name:'Object browser',action:'tbShowObjectBrowser'}];f.menu('View');attachNativeBridge(f,native);f.adapter.setMode('Ribbon');
    f.d.querySelector('[data-tab=View]').click();f.adapter.tick();assert.equal(f.adapter.active,'View');native.selectedEditor={type:'UIDesigner'};f.adapter.tick();assert.equal(f.adapter.active,'Form');
    f.d.querySelector('[data-tab=Home]').click();f.adapter.tick();assert.equal(f.adapter.active,'Home');native.selectedEditor.type='CodeEditor';f.adapter.tick();assert.equal(f.adapter.active,'Code');
    f.adapter.openFile();native.selectedEditor={type:'UIDesigner'};f.adapter.tick();assert(!f.d.querySelector('.tbui3-backstage').hidden);f.adapter.closeFile();f.adapter.tick();assert.equal(f.adapter.active,'Form');
    native.selectedEditor={type:'Preview'};f.adapter.tick();assert.equal(f.adapter.active,'Form');f.adapter.setMode('Hybrid');native.selectedEditor={type:'CodeEditor'};f.adapter.tick();assert.equal(f.adapter.active,'Code');f.dispose();
});
test('native grid toggle replaces the shown checkbox while preserving canonical grid state and Classic restoration',()=>{
    const f=fixture(),grid=f.button('menuBarGrid','Toggle grid'),options=f.d.createElement('div');options.id='menuBarGridOptions';options.innerHTML='<div class="menuBarGridOptionsInner"><div class="menuBarGridOptionRow"><span>Show Grid</span><input type="checkbox" class="optionGridShow"></div><div class="menuBarGridOptionRow"><input type="number" class="optionGridWidth"></div></div>';f.toolbar.after(options);
    const input=options.querySelector('.optionGridShow');grid.onmousedown=()=>{input.checked=!input.checked;grid.classList.toggle('menuBarToggleOn',input.checked);};f.api.formGlobals=()=>({selectedControls:[]});f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();
    const proxy=f.d.querySelector('[data-source=menuBarGrid]');assert(proxy);assert(input.closest('.tbui3-ribbon-grid-toggle-present'));assert(input.closest('.menuBarGridOptionRow').matches('.tbui3-ribbon-grid-toggle-present .menuBarGridOptionRow:has(.optionGridShow)'));
    proxy.click();assert(input.checked);assert.equal(proxy.getAttribute('aria-pressed'),'true');f.adapter.setMode('Classic');assert.equal(options.querySelector('.optionGridShow'),input);assert(input.checked);assert(!input.closest('.tbui3-ribbon-grid-toggle-present'));f.dispose();
});
test('native producer capture rejects bound/private-source incompatibility without dropping its parent command',()=>{
    const f=fixture();attachNativeBridge(f);f.items.Format[0].name='{%MenuCaptionFormatAlign}';f.items.Format[0].hoverAction=f.items.Format[0].hoverAction.bind(null);f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();const b=f.d.querySelector('[aria-haspopup=menu]');assert(b);b.click();assert(f.d.querySelector('.tbui3-ribbon-popup button'));f.dispose();
});
