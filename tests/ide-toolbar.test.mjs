import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
const requestedIcons=JSON.parse(fs.readFileSync('tbIDE/tbUI3IDE/icons/requested.json','utf8')).icons;
test('full layouts restore labels and inline Grid while simplified-only compaction preserves the same controls',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture(),sourceIds=['menuBarGrid','menuBarPreview','addinButton-tbUI3TabLeft','addinButton-tbUI3TabRight','addinButton-tbUI3TabRefresh','addinButton-tbUI3TabDiagnostics'];for(const id of sourceIds)f.button(id,'Native tooltip '+id);f.button('addinButton-tbUI3TabNew','New Page');f.button('addinButton-tbUI3TabDelete','Delete Page');
        const host=f.d.createElement('div');host.properties={_className:'tbUI3.UI3TabView'};f.api.formGlobals=()=>({selectedControls:[host]});const native=f.d.createElement('div');native.id='menuBarGridOptions';native.innerHTML='<div class="menuBarGridOptionsInner"><label class="menuBarGridOptionRow">Width<input class="optionGridWidth" type="number" value="10"></label></div>';f.toolbar.after(native);const width=native.querySelector('input');
        f.items.Format.push({name:'Center Horizontal',action:'tbFormDesigner_CenterSelectedGroupInContainerHorizontal'},{name:'Lock Controls',action:'tbFormDesigner_ToggleLockSelectedControls'});
        const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();
        const buttons=sourceIds.map(id=>f.d.querySelector(`[data-source="${id}"]`));if(mode==='Ribbon')buttons.push(...[...f.d.querySelectorAll('.tbui3-ribbon-content button')].filter(b=>b.title==='Center Horizontal '||b.title==='Lock Controls '));
        const labelShown=b=>f.w.getComputedStyle(b.querySelector('.tbui3-ribbon-label')).display!=='none';assert(buttons.every(labelShown));assert(width.closest('.tbui3-grid-inline'));assert(!width.closest('[hidden]'));assert.equal(f.w.getComputedStyle(f.d.querySelector('.tbui3-grid-split')).display,'none');
        const controls=[...f.d.querySelectorAll('.tbui3-ribbon-content button,.tbui3-ribbon-content input')];f.adapter.setSimplified(true);assert(buttons.every(b=>!labelShown(b)));assert(width.closest('[hidden]'));assert(!width.closest('.tbui3-grid-inline'));assert.equal(f.w.getComputedStyle(f.d.querySelector('.tbui3-grid-split')).display,'flex');assert.deepEqual([...f.d.querySelectorAll('.tbui3-ribbon-content button,.tbui3-ribbon-content input')],controls);
        width.value='14';f.adapter.setSimplified(false);assert(buttons.every(labelShown));assert(!width.closest('[hidden]'));assert(width.closest('.tbui3-grid-inline'));assert.equal(width.value,'14');assert.deepEqual([...f.d.querySelectorAll('.tbui3-ribbon-content button,.tbui3-ribbon-content input')],controls);f.dispose();
    }
});

test('Insert file commands retain labels in full Ribbon and lose only their labels in Simplified Ribbon',()=>{
    const f=fixture();f.items.Project=[{name:'{%MenuCaptionProjectAdd}',hoverAction:()=>{}}];f.menu('Project');const records=[['Folder','tbFileSystem_AddFolder'],['Other file','tbFileSystem_AddOtherFile'],['Import','tbFileSystem_ImportFile']].map(([name,action])=>({name,action}));f.api.captureMenu=(item,anchor,sink)=>{sink(records);return true;};
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Insert]').click();const buttons=[...f.d.querySelectorAll('.tbui3-ribbon-content button')];assert.equal(buttons.length,3);
    for(const simple of [false,true,false]){f.adapter.setSimplified(simple);for(const b of buttons){assert.equal(f.w.getComputedStyle(b.querySelector('.tbui3-ribbon-label')).display==='none',simple);assert(b.title);assert(b.querySelector('.tbui3-ribbon-icon'));}}
    buttons.forEach(b=>b.click());assert.deepEqual(f.calls,records.map(i=>i.action));f.dispose();
});
test('Form/Code switch follows Save Document in both tabs, profiles and presentation styles',()=>{
    for(const mode of ['Ribbon','Hybrid'])for(const simplified of [false,true]){
        const f=fixture(),source=f.button('designSwitchIcon','Switch Between Form And Code');f.items.File.push({name:'Save Document',action:'tbEditor_Save'});f.adapter.setMode(mode);f.adapter.setSimplified(simplified);
        for(const tab of ['Code','Form']){
            f.d.querySelector(`[data-tab=${tab}]`).click();const group=f.d.querySelector('.tbui3-ribbon-content > section');assert.equal(group.getAttribute('aria-label'),'Document');
            const buttons=[...group.querySelectorAll('button')];assert.equal(buttons.length,2);assert.equal(buttons[0].querySelector('.tbui3-ribbon-label').textContent,'Save Document');assert.equal(buttons[1].dataset.source,'designSwitchIcon');assert.equal(buttons[1].title,source.title);
            assert.equal(buttons[1].querySelector('.tbui3-ribbon-icon').style.getPropertyValue('--tbui3-icon'),f.api.icons.designSwitchIcon);buttons[1].click();assert.equal(f.calls.at(-1),'designSwitchIcon');
            source.classList.add('disabledCommand');f.adapter.tick();assert(buttons[1].disabled);source.classList.remove('disabledCommand');f.adapter.tick();assert(!buttons[1].disabled);
        }assert.deepEqual(f.calls,['designSwitchIcon','designSwitchIcon']);f.dispose();
    }
});

test('Simplified Hybrid keeps its four native-menu tabs and smaller command set through toggles and context updates',()=>{
    const f=fixture();f.button('designSwitchIcon','Switch Between Form And Code');f.adapter.setMode('Hybrid');const tabs=[...f.d.querySelectorAll('[role=tab]')].map(n=>n.dataset.tab);assert.deepEqual(tabs,['Home','Code','Form','Add-ins']);
    for(const tab of tabs){f.d.querySelector(`[data-tab="${tab}"]`).click();const commands=[...f.d.querySelectorAll('.tbui3-ribbon-content button, .tbui3-ribbon-content select')];f.d.querySelector('.tbui3-ribbon-toggle').click();assert(f.adapter.simplified);assert(!f.d.querySelector('.tbui3-ribbon-content').hidden);assert.deepEqual([...f.d.querySelectorAll('.tbui3-ribbon-content button, .tbui3-ribbon-content select')],commands);assert(!f.d.querySelector('.tbui3-quick'));assert(!f.d.querySelector('.tbui3-backstage'));assert(!f.d.getElementById('rootMenuFile').classList.contains('tbui3-menu-source'));f.d.querySelector('.tbui3-ribbon-toggle').click();}
    f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'F1',ctrlKey:true,bubbles:true,cancelable:true}));assert(f.adapter.simplified);f.adapter.setMode('Ribbon');assert(f.adapter.simplified);f.adapter.setMode('Hybrid');assert(f.adapter.simplified);assert.deepEqual([...f.d.querySelectorAll('[role=tab]')].map(n=>n.dataset.tab),tabs);f.dispose();
});

test('Classic decorates the original controls with matching glyphs, hides labels and restores original content/handlers',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');
    const source=f.button('addinButton-global-search','Global Search'),text=f.d.createTextNode('Global Search');source.append(text);source.classList.add('iconTextOnly');source.onmousedown=null;let calls=0;const handler=()=>calls++;source.onclick=handler;
    const image=f.button('addinButton-image','Image add-in');image.style.backgroundImage='url(https://example.test/native.svg)';const original=[...f.toolbar.childNodes],select=f.d.getElementById('buildConfigSelector');f.adapter.setMode('Classic');
    assert.deepEqual([...f.toolbar.childNodes],original);assert.equal(source.onclick,handler);assert.equal(source.querySelector('.tbui3-classic-original').firstChild,text);assert.equal(source.querySelector('.tbui3-classic-icon').dataset.iconRef,'fluent/globe_search');assert.equal(source.title,'Global Search');assert.equal(select.parentElement,f.toolbar);assert(!select.querySelector('.tbui3-classic-icon'));
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);assert.equal(f.w.getComputedStyle(source.querySelector('.tbui3-classic-original')).display,'none');
    source.click();assert.equal(calls,1);source.classList.add('disabledCommand');f.adapter.tick();assert(source.classList.contains('disabledCommand'));assert.equal(source.onclick,handler);assert(image.querySelector('.tbui3-classic-icon').style.getPropertyValue('--tbui3-native-image').includes('native.svg'));assert.equal(image.style.backgroundImage,'url("https://example.test/native.svg")');
    const classicIcon=f.d.getElementById('saveIcon').querySelector('.tbui3-classic-icon');assert.equal(classicIcon.dataset.iconRef,'segoe/E74E');f.adapter.setMode('Ribbon');assert(!source.querySelector('.tbui3-classic-original'));assert.equal(source.firstChild,text);assert.equal(source.onclick,handler);assert.deepEqual([...f.toolbar.childNodes],original);f.dispose();
});

test('Classic handles late add-ins and caption replacement without resurrecting stale labels on unload',()=>{
    const f=fixture(),late=f.button('addinButton-late');late.removeAttribute('title');late.textContent='First label';f.adapter.tick();assert.equal(late.title,'First label');assert(late.querySelector('.tbui3-classic-icon'));
    late.textContent='Updated label';f.adapter.tick();assert.equal(late.title,'Updated label');assert.equal(late.querySelector('.tbui3-classic-original').textContent,'Updated label');
    const icon=late.querySelector('.tbui3-classic-icon');f.adapter.tick();assert.equal(late.querySelector('.tbui3-classic-icon'),icon);f.adapter.dispose();assert.equal(late.textContent,'Updated label');assert(!late.hasAttribute('title'));assert(!late.classList.contains('tbui3-classic-glyph'));f.w.close();
});

test('window insets follow WinUI themes and optional styling/titlebar state, preserve Quick Access and clean up owned state',()=>{
    const f=fixture(),root=f.d.getElementById('root');let enabled=false,real=false,theme='WinUI3 Dark';f.api.themeName=()=>theme;f.api.stylingEnabled=()=>enabled;f.api.realTitlebar=()=>real;f.adapter.setMode('Ribbon');assert(!root.classList.contains('tbui3-window-insets'));
    const quick=f.d.querySelector('.tbui3-quick'),close=f.d.getElementById('rootMenuClose'),parent=close.parentElement;
    enabled=true;f.adapter.tick();assert(root.classList.contains('tbui3-window-insets'));assert(root.classList.contains('tbui3-window-top-inset'));assert.equal(close.parentElement,parent);assert.equal(f.d.querySelector('.tbui3-quick'),quick);assert(root.style.getPropertyValue('--tbui3-caption-row-height'));
    real=true;f.adapter.tick();assert(root.classList.contains('tbui3-window-insets'));assert(!root.classList.contains('tbui3-window-top-inset'));enabled=false;f.adapter.tick();assert(!root.classList.contains('tbui3-window-insets'));assert(!root.classList.contains('tbui3-window-top-inset'));
    enabled=true;real=false;for(const name of ['Dark','Light','Classic','Third-party','WinUI3 Custom','winui3 light','WINUI3 DARK']){theme=name;f.adapter.tick();const expected=['winui3 dark','winui3 light'].includes(name.toLowerCase());assert.equal(root.classList.contains('tbui3-window-insets'),expected,name);assert.equal(root.classList.contains('tbui3-window-top-inset'),expected,name);}
    f.adapter.dispose();assert(!root.classList.contains('tbui3-window-insets'));assert(!root.classList.contains('tbui3-window-top-inset'));assert.equal(root.style.getPropertyValue('--tbui3-caption-row-height'),'');assert.equal(root.style.getPropertyValue('--tbui3-caption-inner-offset'),'');f.w.close();
});
test('requested compact controls are simplified-only while full labels and native actions are preserved',()=>{
    const actions=['tbFormDesigner_CenterSelectedGroupInContainerHorizontal','tbFormDesigner_CenterSelectedGroupInContainerVertical','tbFormDesigner_ToggleLockSelectedControls','tbFileSystem_AddFolder','tbFileSystem_AddOtherFile','tbFileSystem_ImportFile'];
    for(const action of actions){assert(!present({action}).iconOnly,action);assert(present({action}).simplifiedIconOnly,action);}
    const sources=['menuBarPreview','menuBarGrid','addinButton-tbUI3TabLeft','addinButton-tbUI3TabRight','addinButton-tbUI3TabRefresh','addinButton-tbUI3TabDiagnostics'];for(const id of sources){assert(!present({},id).iconOnly,id);assert(present({},id).simplifiedIconOnly,id);}
    assert(!present({},'addinButton-tbUI3TabNew').iconOnly);assert(!present({},'addinButton-tbUI3TabDelete').iconOnly);
    const f=fixture();f.items.Future=actions.map(action=>({name:'Native help '+action,action}));f.menu('Future');f.adapter.setMode('Ribbon');f.adapter.setSimplified(true);
    for(const tab of [...f.d.querySelectorAll('[role=tab]')].map(t=>t.dataset.tab).filter(t=>t!=='File')){
        f.d.querySelector(`[data-tab="${tab}"]`).click();for(const b of f.d.querySelectorAll('button[title^="Native help "]')){assert(b.classList.contains('tbui3-ribbon-compact'));assert(b.title);assert(b.querySelector('.tbui3-ribbon-icon'));b.click();}
    }assert.deepEqual(f.calls.slice().sort(),actions.slice().sort());f.dispose();
});

test('Grid toggle and options arrow act independently, retaining native controls through all flyout lifecycles',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture(),source=f.button('menuBarGrid','Native Grid help'),native=f.d.createElement('div');native.id='menuBarGridOptions';native.innerHTML='<div class="menuBarGridOptionsInner"><label class="menuBarGridOptionRow">Show Grid<input type="checkbox" class="optionGridShow"></label><label class="menuBarGridOptionRow">Snap<input type="checkbox" class="optionGridSnap"></label><label class="menuBarGridOptionRow">Width<input type="number" class="optionGridWidth" value="10"></label></div>';f.toolbar.after(native);
        const body=native.firstElementChild,show=body.querySelector('.optionGridShow'),snap=body.querySelector('.optionGridSnap'),width=body.querySelector('.optionGridWidth');let toggles=0,changes=0,active=true;
        source.onmousedown=()=>{toggles++;show.checked=!show.checked;source.classList.toggle('menuBarToggleOn',show.checked);};width.onchange=()=>changes++;snap.onchange=()=>changes++;
        f.api.formGlobals=()=>active?{selectedControls:[]}:null;f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();assert(width.closest('.tbui3-grid-inline'));assert(!width.closest('[hidden]'));f.adapter.setSimplified(true);
        const arrow=f.d.querySelector('.tbui3-grid-dropdown'),main=f.d.querySelector('[data-source=menuBarGrid]');assert(main.classList.contains('tbui3-ribbon-compact'));assert.equal(main.title,'Native Grid help');assert.equal(main.parentElement,arrow.parentElement);assert.equal(arrow.getAttribute('aria-haspopup'),'dialog');assert(width.closest('[hidden]'));
        main.click();assert.equal(toggles,1);assert(show.checked);assert.equal(main.getAttribute('aria-pressed'),'true');assert(!f.d.querySelector('.tbui3-grid-flyout'));
        arrow.click();assert.equal(toggles,1);assert.equal(arrow.getAttribute('aria-expanded'),'true');assert.equal(f.d.querySelector('.tbui3-grid-flyout').getAttribute('role'),'dialog');assert.equal(f.d.querySelector('.tbui3-grid-flyout .menuBarGridOptionsInner'),body);
        width.value='14';width.dispatchEvent(new f.w.Event('change'));snap.click();assert.equal(changes,2);assert(snap.checked);
        f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert(!f.d.querySelector('.tbui3-grid-flyout'));assert.equal(f.d.activeElement,arrow);assert(width.closest('[hidden]'));assert.equal(arrow.getAttribute('aria-expanded'),'false');
        main.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowDown',altKey:true,bubbles:true,cancelable:true}));assert(f.d.querySelector('.tbui3-grid-flyout'));assert.equal(toggles,1);arrow.click();assert(!f.d.querySelector('.tbui3-grid-flyout'));
        arrow.click();f.adapter.setSimplified(false);assert(!f.d.querySelector('.tbui3-grid-flyout'));assert(width.closest('.tbui3-grid-inline'));assert(!width.closest('[hidden]'));assert(main.classList.contains('tbui3-ribbon-large'));assert.equal(width.value,'14');f.adapter.setSimplified(true);
        arrow.click();active=false;f.adapter.tick();assert(!f.d.querySelector('.tbui3-grid-flyout'));assert(arrow.disabled);assert(main.disabled);active=true;f.adapter.tick();assert(!arrow.disabled);
        arrow.click();f.d.querySelector('[data-tab=Code]').click();assert(!f.d.querySelector('.tbui3-grid-flyout'));assert.equal(native.querySelector('.menuBarGridOptionsInner'),body);f.d.querySelector('[data-tab=Form]').click();assert.equal(f.d.querySelector('.tbui3-ribbon-grid input.optionGridWidth'),width);
        f.d.querySelector('.tbui3-grid-dropdown').click();f.adapter.setMode('Classic');assert.equal(native.firstElementChild,body);assert.equal(width.value,'14');assert(snap.checked);assert(show.checked);assert.equal(changes,2);f.dispose();
    }
});

test('Grid flyout accepts the actual installed IDE markup and closes on outside pointer input',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for actual native Grid markup');
    const path=process.env.TB_IDE_MAIN_JS.replace(/main\.js$/i,'main.htm');if(!fs.existsSync(path))return t.skip('Native main.htm unavailable');
    const f=fixture(),template=f.d.createElement('template');template.innerHTML=fs.readFileSync(path,'utf8');const native=template.content.querySelector('#menuBarGridOptions');assert(native);f.toolbar.after(native);f.button('menuBarGrid','Grid');f.api.formGlobals=()=>({selectedControls:[]});
    const original=[...native.querySelectorAll('input')];assert.equal(original.length,6);f.adapter.setMode('Ribbon');f.adapter.setSimplified(true);f.d.querySelector('[data-tab=Form]').click();f.d.querySelector('.tbui3-grid-dropdown').click();assert.deepEqual([...f.d.querySelectorAll('.tbui3-grid-flyout input')],original);
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);const show=f.d.querySelector('.tbui3-grid-flyout .optionGridShow').closest('.menuBarGridOptionRow');assert.equal(f.w.getComputedStyle(show).display,'none');
    f.d.getElementById('editor').dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true}));assert(!f.d.querySelector('.tbui3-grid-flyout'));assert(original.every(n=>n.closest('.tbui3-grid-options-store')));f.adapter.setMode('Classic');assert.deepEqual([...native.querySelectorAll('input')],original);f.dispose();
});
test('corner chevron switches Full/Simplified Ribbon without replacing tabs, commands or native selectors',()=>{
    const f=fixture();assert(!f.d.querySelector('.tbui3-ribbon-toggle'));f.adapter.setMode('Hybrid');assert(f.d.querySelector('.tbui3-ribbon-toggle'));f.adapter.setMode('Ribbon');
    f.items.File.push({name:'Save Document',action:'tbEditor_Save'});f.d.querySelector('[data-tab=Project]').click();
    const tabs=[...f.d.querySelectorAll('[role=tab]')],content=f.d.querySelector('.tbui3-ribbon-content'),commands=[...content.querySelectorAll('button,select')],select=f.d.getElementById('buildConfigSelector'),toggle=f.d.querySelector('.tbui3-ribbon-toggle');
    assert.equal(toggle.getAttribute('aria-controls'),content.id);assert.equal(toggle.getAttribute('aria-pressed'),'false');assert.equal(toggle.title,'Switch to Simplified Ribbon');
    toggle.click();assert(f.adapter.simplified);assert(f.adapter.simplifiedDirty);assert.equal(toggle.getAttribute('aria-pressed'),'true');assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(toggle.title,'Switch to Full Ribbon');assert.equal(f.adapter.active,'Project');assert(!content.hidden);
    assert.deepEqual([...f.d.querySelectorAll('[role=tab]')],tabs);assert.deepEqual([...content.querySelectorAll('button,select')],commands);assert.equal(f.d.getElementById('buildConfigSelector'),select);
    f.adapter.tick();assert(f.d.querySelector('.tbui3-ribbon-simplified'));toggle.click();assert(!f.adapter.simplified);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert(!content.hidden);assert.deepEqual([...content.querySelectorAll('button,select')],commands);f.dispose();
});

test('simplification retains native Grid nodes/events, lazy dropdown dispatch and dynamic/contextual commands',()=>{
    const f=fixture(),native=f.d.createElement('div');native.id='menuBarGridOptions';native.innerHTML='<div class="menuBarGridOptionsInner"><label class="menuBarGridOptionRow">Width<input class="optionGridWidth" type="number" value="8"></label></div>';f.toolbar.after(native);
    const input=native.querySelector('input');let changes=0;input.onchange=()=>changes++;
    const host=f.d.createElement('div');host.properties={_className:'tbUI3.UI3TabView'};let selected=[host];f.api.formGlobals=()=>({selectedControls:selected});f.button('menuBarGrid','Grid');f.button('addinButton-tbUI3TabNew','New page');
    f.adapter.setMode('Ribbon');f.adapter.setSimplified(true,true);f.d.querySelector('[data-tab=Form]').click();
    assert.equal(f.d.querySelector('.tbui3-ribbon-grid input'),input);input.value='12';input.dispatchEvent(new f.w.Event('change'));assert.equal(changes,1);
    f.d.querySelector('[aria-haspopup=menu]').click();const popup=f.d.querySelector('.tbui3-ribbon-popup');assert(popup);popup.querySelector('button').click();assert.deepEqual(f.calls,['left']);
    selected=[];f.adapter.tick();assert(!f.d.querySelector('section[aria-label=MultiPage]'));assert(f.d.querySelector('.tbui3-ribbon-simplified'));selected=[host];f.adapter.tick();assert(f.d.querySelector('section[aria-label=MultiPage]'));
    const future=f.button('addinButton-future','Future add-in');f.adapter.tick();f.d.querySelector('[data-tab="Add-ins"]').click();f.d.querySelector('[data-source=addinButton-future]').click();assert.equal(f.calls.at(-1),'addinButton-future');future.classList.add('disabledCommand');f.adapter.tick();assert(f.d.querySelector('[data-source=addinButton-future]').disabled);
    f.adapter.setMode('Classic');assert.equal(native.querySelector('input'),input);assert.equal(input.value,'12');assert(!f.d.querySelector('.tbui3-ribbon-toggle'));f.dispose();
});

test('Ctrl+F1 toggles simplified presentation in Ribbon and mode switching preserves the independent preference',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'F1',ctrlKey:true,bubbles:true,cancelable:true}));assert(f.adapter.simplified);assert(!f.d.querySelector('.tbui3-ribbon-content').hidden);
    f.adapter.setMode('Hybrid');assert(f.d.querySelector('.tbui3-ribbon-simplified'));assert(f.d.querySelector('.tbui3-ribbon-toggle'));f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'F1',ctrlKey:true,bubbles:true,cancelable:true}));assert(!f.adapter.simplified);assert(!f.d.querySelector('.tbui3-ribbon-content').hidden);
    f.adapter.setMode('Ribbon');assert(!f.d.querySelector('.tbui3-ribbon-simplified'));assert(!f.d.querySelector('.tbui3-ribbon-content').hidden);f.d.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'F1',ctrlKey:true,bubbles:true,cancelable:true}));assert(f.adapter.simplified);f.dispose();
});

test('simplified horizontal mouse scrolling leaves native inputs/selectors in control of their wheel events',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.adapter.setSimplified(true);const content=f.d.querySelector('.tbui3-ribbon-content');Object.defineProperties(content,{scrollWidth:{value:1500},clientWidth:{value:400}});
    const wheel=new f.w.WheelEvent('wheel',{deltaY:90,bubbles:true,cancelable:true});content.dispatchEvent(wheel);assert.equal(content.scrollLeft,90);assert(wheel.defaultPrevented);
    f.d.querySelector('[data-tab=Project]').click();const select=f.d.getElementById('buildConfigSelector'),overSelect=new f.w.WheelEvent('wheel',{deltaY:90,bubbles:true,cancelable:true});select.dispatchEvent(overSelect);assert.equal(content.scrollLeft,90);assert(!overSelect.defaultPrevented);f.dispose();
});

test('native settings queue independently persists toolbar mode, simplified choice and optional styling',()=>{
    const main=fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/MainModule.twin','utf8');
    const poll=main.slice(main.indexOf('Dim changed As String = RunJs('),main.indexOf('If Len(changed) = 0'));
    const js=[...poll.matchAll(/"((?:[^"]|"")*)"/g)].map(m=>m[1].replace(/""/g,'"')).join('');
    const toolbar={dirty:true,requestedMode:'Ribbon',simplifiedDirty:true,simplified:true},theme={dirty:true,enabled:false},window={__tbUI3Toolbar:toolbar,__winui3IdeStyle:theme};
    assert.deepEqual([0,1,2,3].map(()=>vm.runInNewContext(js,{window})),['toolbar:Ribbon','simple:1','theme:0','']);
    toolbar.simplified=false;toolbar.simplifiedDirty=true;assert.equal(vm.runInNewContext(js,{window}),'simple:0');
    assert(main.includes('SettingSimplified As String = "SimplifiedRibbon"'));assert(main.includes('SaveSetting SettingsApp, SettingsSection, SettingSimplified, Mid$(changed, 8)'));
    const teardown=main.slice(main.indexOf('Private Sub Class_Terminate()'),main.indexOf('Private Sub Class_Terminate()')+250);assert.equal((teardown.match(/OptionTimer_Timer/g)||[]).length,3);
    const f=fixture();f.adapter.setSimplified(true,false);f.adapter.setMode('Ribbon');assert(f.d.querySelector('.tbui3-ribbon-simplified'));assert(!f.adapter.simplifiedDirty);assert(!f.adapter.dirty);f.dispose();
});
test('explicit icon selections match the requested Home, Insert, Code, Form, View, Project, Debug and File commands',()=>{
    const rows=[
        ['tbEditor_ClipboardPaste','segoe/E77F'],['tbEditor_ClipboardCut','segoe/E8C6'],['tbEditor_ClipboardCopy','segoe/E8C8'],['tbEditor_Find','segoe/E721'],['tbEditor_DeleteRight','segoe/E74D'],['tbEditor_SelectAll','segoe/E8B3'],['tbProject_FindInFiles','fluent/calendar_search'],
        ['tbFileSystem_AddWindowsForm','segoe/EB3B'],['tbFileSystem_AddWindowsMDIForm','fluent/window_multiple'],['tbFileSystem_AddWindowsUserControl','fluent/button'],['tbFileSystem_AddWindowsPropertyPage','fluent/tab_desktop'],['tbFileSystem_AddWindowsReport','fluent/calendar_data_bar'],['tbFileSystem_AddCustomControlsForm','fluent/window_toolbox'],['tbFileSystem_AddModuleTWIN','fluent/code_block'],['tbFileSystem_AddClassTWIN','fluent/code_block_edit'],['tbFileSystem_AddModuleBAS','fluent/code_block'],['tbFileSystem_AddClassCLS','fluent/code_block_edit'],['tbFileSystem_AddResourceVisualStylesManifest','fluent/apps_list_detail'],['tbFileSystem_AddResourceMessageTable','fluent/group_list'],['tbFileSystem_AddFolder','segoe/E8F4'],['tbFileSystem_AddOtherFile','fluent/document_add'],['tbFileSystem_ImportFile','fluent/add_square_multiple'],
        ['tbEditor_FormatSelection','fluent/rename'],['tbEditor_FormatDocument','fluent/document_margins'],['tbEditor_GotoLineColumn','segoe/E8D1'],['tbEditor_GoToDefinition','segoe/E82D'],['tbEditor_LastPosition','fluent/arrow_step_back'],['tbFormDesigner_ToggleLockSelectedControls','segoe/E72E'],
        ['tbEditor_SwitchToCode','fluent/code'],['tbEditor_SwitchToFormDesign','fluent/design_ideas'],['tbShowObjectBrowser','segoe/EC50'],['tbProjectExplorer_ShowPanel','fluent/code_circle'],['tbToolbox_ShowPanel','fluent/toolbox'],['tbProperties_ShowPanel','fluent/slide_settings'],['tbEditor_IncreaseFontSize','segoe/E8A3'],['tbEditor_DecreaseFontSize','segoe/E71F'],
        ['tbProject_ShowReferences','fluent/library'],['tbProject_ShowSettings','fluent/apps_settings'],['tbBuild_Start','fluent/cube_tree'],['tbBuild_Clean','fluent/broom'],['tbCompiler_Restart','fluent/arrow_reset'],['tbCompiler_RestartAndFlushLlvmCache','segoe/EBC4'],['tbProject_OpenProjectFolder','fluent/folder_open'],['tbProject_OpenBuildFolder','fluent/folder_arrow_right'],['tbDebug_SetNextExecutionStatement','fluent/skip_forward_tab'],
        ['tbProject_New','segoe/ECC8'],['tbProject_Open','segoe/E838'],['tbProject_SaveAllChanges','segoe/E74E'],['tbProject_SaveAs','segoe/E792'],['tbEditor_Save','fluent/document_save'],['tbProject_Export','segoe/EDE1'],['tbProject_Close','fluent/share_screen_stop'],['tbHelp_ShowAboutWindow','fluent/chat_help'],['tbHelp_ShowLicenceAgreement','segoe/EF3F'],['tbHelp_PurchaseALicence','fluent/wallet_credit_card'],['tbHelp_EnterLicenceKey','segoe/E8D7'],['tbHelp_OpenKofiWebsite','fluent/drink_coffee'],['tbHelp_ToggleCompilerTraceMode','fluent/table_settings'],['tbIde_ShowIDEOptions','fluent/content_settings'],['tbIdeWindow_Close','fluent/arrow_exit']
    ];
    for(const [action,icon]of rows){assert.equal(present({action}).icon,icon,action);if(icon.startsWith('fluent/'))assert(requestedIcons[icon],icon);}
    for(const [name,icon]of [['Find options','fluent/slide_search'],['Fold','fluent/text_collapse'],['Unfold','fluent/text_expand'],['More panels','fluent/panel_right_cursor'],['Debugger Options','segoe/EBE8'],['{%MenuCaptionWindowPanelLayouts}','fluent/layout_infographic'],['{%MenuCaptionWindowPanelFeatures}','fluent/content_settings'],['{%MenuCaptionWindowTheme}','fluent/dark_theme'],['{%MenuCaptionWindowKeyboardShortcuts}','fluent/keyboard'],['{%MenuCaptionWindowLanguage}','fluent/local_language_globe']])assert.equal(present({name}).icon,icon,name);
    assert.equal(present({action:'tbCompiler_Restart'}).caption,'Restart Compiler');assert.equal(present({action:'tbCompiler_RestartAndFlushLlvmCache'}).caption,'Flush LLVM Cache');
});

test('requested icons override native backgrounds and codicons without changing execution or disabled state',()=>{
    const f=fixture(),search=f.button('searchIcon','Find in project');search.boundCommand='tbProject_FindInFiles';search.style.backgroundImage='url(https://example.test/wrong.svg)';
    f.items.Edit=[{name:'Find in project',action:'tbProject_FindInFiles',codicon:'wrong'},{name:'Paste',action:'tbEditor_ClipboardPaste',codicon:'wrong'}];f.adapter.setMode('Ribbon');
    const find=f.d.querySelector('button[title="Find in project "]'),paste=f.d.querySelector('button[title="Paste "]');
    assert.equal(find.querySelector('.tbui3-ribbon-icon').dataset.iconRef,'fluent/calendar_search');assert(!find.querySelector('.codicon'));
    const glyph=paste.querySelector('.tbui3-ribbon-icon');assert.equal(glyph.dataset.iconRef,'segoe/E77F');assert.equal(glyph.textContent.codePointAt(0),0xE77F);assert(glyph.classList.contains('tbui3-ribbon-segoe'));assert.equal(glyph.getAttribute('aria-hidden'),'true');
    paste.click();assert.deepEqual(f.calls,['tbEditor_ClipboardPaste']);f.api.commandEnabled=a=>a!=='tbEditor_ClipboardPaste';f.adapter.tick();assert(paste.disabled);paste.click();assert.deepEqual(f.calls,['tbEditor_ClipboardPaste']);f.dispose();
});

test('Save Document leads Code and Form in its own group, leaves Ribbon File and preserves native dispatch in both modes',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture();f.items.File.push({name:'Save current document',action:'tbEditor_Save'});f.adapter.setMode(mode);
        for(const tab of ['Code','Form']){
            f.d.querySelector(`[data-tab=${tab}]`).click();const first=f.d.querySelector('.tbui3-ribbon-content > section');assert.equal(first.getAttribute('aria-label'),'Document');assert.equal(first.querySelectorAll('button').length,1);
            const b=first.querySelector('button');assert.equal(b.querySelector('.tbui3-ribbon-label').textContent,'Save Document');assert.equal(b.querySelector('.tbui3-ribbon-icon').dataset.iconRef,'fluent/document_save');b.click();assert.equal(f.calls.at(-1),'tbEditor_Save');
            f.api.commandEnabled=a=>a!=='tbEditor_Save';f.adapter.tick();assert(b.disabled);f.api.commandEnabled=()=>true;
        }
        if(mode==='Ribbon'){f.adapter.openFile();assert(!f.d.querySelector('[data-file-section="Save document"]'));}
        else assert(!f.d.getElementById('rootMenuFile').classList.contains('tbui3-menu-source'));
        f.dispose();
    }
});

test('MultiPage uses renamed labels, original tooltips and two vertical separators with the requested composite',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture(),ids=['tbUI3TabNew','tbUI3TabDelete','tbUI3TabLeft','tbUI3TabRight','tbUI3TabRefresh','tbUI3TabDiagnostics'];
        const labels=['New Page','Delete Page','Page Left','Page Right','TabView Refresh','TabView Diagnostics'];
        const icons=['document_one_page_add','document_header_dismiss','tab_desktop_arrow_left','tab_desktop_arrow_right_composite','tab_desktop_arrow_clockwise','stethoscope'];
        for(const id of ids)f.button('addinButton-'+id,'Original help '+id);const host=f.d.createElement('div');host.properties={_className:'tbUI3.UI3TabView'};f.api.formGlobals=()=>({selectedControls:[host]});
        f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();const group=f.d.querySelector('section[aria-label=MultiPage]');assert.equal(group.querySelectorAll('[role=separator]').length,2);
        const children=[...group.querySelector('.tbui3-ribbon-group-body').children];assert.deepEqual(children.map(n=>n.getAttribute('role')==='separator'?'|':n.querySelector('.tbui3-ribbon-label').textContent),[labels[0],labels[1],'|',labels[2],labels[3],'|',labels[4],labels[5]]);
        for(const [index,b]of [...group.querySelectorAll('button')].entries()){assert.equal(b.title,'Original help '+ids[index]);assert.equal(b.querySelector('.tbui3-ribbon-icon').dataset.iconRef,'fluent/'+icons[index]);b.click();}
        assert.deepEqual(f.calls,ids.map(id=>'addinButton-'+id));f.dispose();
    }
    const composite=requestedIcons['fluent/tab_desktop_arrow_right_composite'];assert(composite.derived);assert.equal(composite.components[1].file,'arrow_circle_right_20_filled.svg');assert(composite.svg.includes('<mask'));assert(composite.svg.includes('fill="black"'));
});

test('File rail uses requested icons and a horizontal divider between Open and Save',()=>{
    const f=fixture();for(const [action,name]of [['tbProject_New','New'],['tbProject_Open','Open'],['tbProject_SaveAs','Save as'],['tbProject_Export','Export'],['tbProject_Close','Close'],['tbIdeWindow_Close','Exit']])f.items.File.push({name,action});
    f.items.Help=[{name:'About',action:'tbHelp_ShowAboutWindow'}];f.menu('Help');f.adapter.setMode('Ribbon');f.adapter.openFile();
    for(const [section,icon]of [['Info','segoe/E946'],['New','segoe/ECC8'],['Open','segoe/E838'],['Save','segoe/E74E'],['Save as','segoe/E792'],['Export','segoe/EDE1'],['Close','fluent/share_screen_stop'],['Add-ins','fluent/text_bullet_list_square_settings'],['Help','fluent/question_circle'],['Options','fluent/options'],['Exit','fluent/arrow_exit']])assert.equal(f.d.querySelector(`[data-file-section="${section}"] .tbui3-ribbon-icon`).dataset.iconRef,icon,section);
    const divider=f.d.querySelector('.tbui3-backstage-divider');assert.equal(divider.previousElementSibling.dataset.fileSection,'Open');assert.equal(divider.nextElementSibling.dataset.fileSection,'Save');f.d.querySelector('[data-file-section="Add-ins"]').click();assert.equal(f.d.querySelector('.tbui3-backstage-tasks .tbui3-ribbon-icon').dataset.iconRef,'fluent/puzzle_piece');f.dispose();
});

test('requested Fluent assets retain pinned provenance, hashes and well-formed self-contained SVG',()=>{
    const catalog=JSON.parse(fs.readFileSync('tbIDE/tbUI3IDE/icons/requested.json','utf8'));assert.equal(catalog.package,'@fluentui/svg-icons');assert.equal(catalog.version,'1.1.341');
    const dom=new JSDOM(''),parser=new dom.window.DOMParser();
    for(const [ref,asset]of Object.entries(catalog.icons)){
        assert.equal(createHash('sha256').update(asset.svg).digest('hex'),asset.sha256,ref);
        const svg=parser.parseFromString(asset.svg,'image/svg+xml');assert(!svg.querySelector('parsererror'),ref);assert.equal(svg.documentElement.localName,'svg');assert(svg.documentElement.getAttribute('viewBox'));assert(!svg.querySelector('script,image,foreignObject'));
        if(!asset.derived)assert(asset.source.includes('@1.1.341/icons/'+asset.file));
    }dom.window.close();
});
test('large captions choose the smallest two-line whole-word width and remeasure after font changes',()=>{
    const f=fixture();let scale=6;
    const original=f.w.HTMLElement.prototype.getBoundingClientRect;
    f.w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.tagName==='SPAN'?this.textContent.length*scale:0};};
    f.items.Edit=[{name:'Paste',action:'tbEditor_ClipboardPaste'},{name:'Find in project',action:'tbProject_FindInFiles'},{name:'UnbreakablyLongCaption',action:'tbEditor_Find'}];
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);
    f.adapter.setMode('Ribbon');
    const width=title=>parseFloat(f.d.querySelector(`.tbui3-ribbon-content button[title="${title} "]`).style.width);
    assert.equal(width('Paste'),50);assert.equal(width('Find in project'),52);assert.equal(width('UnbreakablyLongCaption'),86);
    scale=8;for(const label of f.d.querySelectorAll('.tbui3-ribbon-label'))label.style.fontSize='16px';f.adapter.tick();assert.equal(width('Find in project'),66);
    f.w.HTMLElement.prototype.getBoundingClientRect=original;f.dispose();
});

test('Hybrid measures large source captions with the same width and font rules as Ribbon',()=>{
    const f=fixture();let scale=6;
    f.w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.tagName==='SPAN'?this.textContent.length*scale:0};};
    f.button('restartIcon','Restart the compiler');
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);
    f.adapter.setMode('Hybrid');const button=f.d.querySelector('[data-source=restartIcon]');
    assert.equal(parseFloat(button.style.width),58);assert(button.classList.contains('tbui3-ribbon-large'));
    scale=8;button.querySelector('.tbui3-ribbon-label').style.fontSize='16px';f.adapter.tick();assert.equal(parseFloat(button.style.width),74);
    button.click();assert.deepEqual(f.calls,['restartIcon']);f.dispose();
});

test('all ten alignment and sizing actions are icon-only and dispatch their native command once',()=>{
    const f=fixture(),actions=['AlignSelectedControlsLeft','AlignSelectedControlsTop','AlignSelectedControlsRight','AlignSelectedControlsBottom','AlignSelectedControlsCenterHorizontal','AlignSelectedControlsCenterVertical','ResizeSelectedControlsWidest','ResizeSelectedControlsTallest','ResizeSelectedControlsNarrowest','ResizeSelectedControlsShortest'];
    f.items.Format=actions.map(name=>({name,action:'tbFormDesigner_'+name}));f.adapter.setMode('Ribbon');f.d.querySelector('[data-tab=Form]').click();
    for(const name of actions){const b=f.d.querySelector(`button[title="${name} "]`);assert(b.classList.contains('tbui3-ribbon-compact'));assert(!b.classList.contains('tbui3-ribbon-large'));assert.equal(b.getAttribute('aria-label'),name);b.click();}
    assert.deepEqual(f.calls,actions.map(a=>'tbFormDesigner_'+a));f.dispose();
});

test('one Options page contains IDE Options, language and keyboard shortcuts',()=>{
    const f=fixture();f.items.Windows=[{name:'{%MenuCaptionWindowLanguage}',action:'language'},{name:'{%MenuCaptionWindowKeyboardShortcuts}',action:'shortcuts'}];f.menu('Windows');
    f.adapter.setMode('Ribbon');f.adapter.openFile();assert.equal(f.d.querySelectorAll('[data-file-section=Options]').length,1);assert(!f.d.querySelector('[data-file-section=Preferences]'));
    f.d.querySelector('[data-file-section=Options]').click();const tasks=f.d.querySelectorAll('.tbui3-backstage-content button');assert.equal(tasks.length,3);assert.equal(f.calls.length,0);assert(!f.d.querySelector('.tbui3-backstage').hidden);
    tasks[0].click();assert.deepEqual(f.calls,['tbIde_ShowIDEOptions']);assert(f.d.querySelector('.tbui3-backstage').hidden);f.dispose();
});

test('original logo precedes Save only for the two WinUI3 themes with the real titlebar disabled',()=>{
    const f=fixture();let theme='WinUI3 Dark',real=false;f.api.themeName=()=>theme;f.api.realTitlebar=()=>real;f.api.brandImage='data:image/png;base64,AA==';f.adapter.setMode('Ribbon');
    for(const [name,titlebar,shown]of [['WinUI3 Dark',false,true],['WinUI3 Light',false,true],['winui3 dark',false,true],['winui3 light',false,true],['WINUI3 DARK',false,true],['Dark',false,false],['WinUI3 Custom',false,false],['WinUI3 Dark',true,false],['WinUI3 Light',false,true]]){
        theme=name;real=titlebar;f.adapter.tick();const logo=f.d.querySelector('.tbui3-quick-logo');assert.equal(!logo.hidden,shown);assert.equal(logo.nextElementSibling.dataset.source,'saveIcon');assert.equal(f.d.querySelectorAll('.tbui3-quick-logo').length,1);
    }
    f.adapter.setMode('Hybrid');assert(!f.d.querySelector('.tbui3-quick-logo'));f.adapter.setMode('Classic');assert(!f.d.querySelector('.tbui3-quick-logo'));f.dispose();
});
test('logo accepts the lowercase names returned by the actual installed IDE getThemeName function',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native theme-name contract');
    const f=fixture(),native={activeThemeInfo:{name:'WinUI3 Dark'},liveIDEOptions:{colorTheme:'WinUI3 Dark'}};
    f.api.themeName=nativeFunction('getThemeName',native);f.api.brandImage='data:image/png;base64,AA==';let real=false;f.api.realTitlebar=()=>real;f.adapter.setMode('Ribbon');
    for(const [name,visible]of [['WinUI3 Dark',true],['WinUI3 Light',true],['Dark',false],['Light',false],['WinUI3 Custom',false]]){
        native.activeThemeInfo.name=name;f.adapter.tick();assert.equal(f.api.themeName(),name.toLowerCase());assert.equal(!f.d.querySelector('.tbui3-quick-logo').hidden,visible);
    }
    native.activeThemeInfo.name='WinUI3 Dark';real=true;f.adapter.tick();assert(f.d.querySelector('.tbui3-quick-logo').hidden);
    f.dispose();
});
function fixture() {
    const dom=new JSDOM(`<div id='root'><div id='rootMenu1'><div id='rootMenu1Inner'></div><div id='rootMenuClose'>Close</div></div><div id='rootTop'><input id='editor'></div><div id='rootMenu2'></div></div>
    <div class='tbis-optionRow'><div class='tbis-optionName'>Enable additional IDE theme styling via add-in</div></div>`);
    const w=dom.window,d=w.document,calls=[];w.setInterval=()=>1;w.clearInterval=()=>{};const computed=w.getComputedStyle.bind(w);w.getComputedStyle=n=>computed(n);
    const toolbar=d.getElementById('rootMenu2'),headers=d.getElementById('rootMenu1Inner');
    const api={window:w,buildLayout,present,projectName:()=>'Example project',icons:{...establishedIcons,...Object.fromEntries([...Object.keys(extraIcons),...Object.keys(requestedIcons)].map(key=>[key,"url('data:image/svg+xml,"+key+"')"]))},
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
test('MultiPage commands appear directly after Grid only with host or child selection in Ribbon and Hybrid',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture(),ids=['tbUI3TabNew','tbUI3TabDelete','tbUI3TabLeft','tbUI3TabRight','tbUI3TabRefresh','tbUI3TabDiagnostics'];
        for(const id of ids){const n=f.button('addinButton-'+id,id);n.onmousedown=null;n.onclick=()=>f.calls.push(id);}
        f.button('menuBarGrid','Grid');
        let selected=[];f.api.formGlobals=()=>({selectedControls:selected});f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();
        const section=()=>f.d.querySelector('.tbui3-ribbon-group[aria-label="MultiPage"]');assert(!section());
        const host=f.d.createElement('div');host.properties={_className:'tbUI3.UI3TabView'};const page=host.appendChild(f.d.createElement('div'));page.properties={_className:'tbUI3.UI3TabPage'};const child=page.appendChild(f.d.createElement('div'));
        for(const control of [host,page,child]){
            selected=[control];f.adapter.tick();assert(section());assert.equal(section().previousElementSibling.getAttribute('aria-label'),'Grid');
            assert.deepEqual([...section().querySelectorAll('button')].map(b=>b.dataset.source),ids.map(id=>'addinButton-'+id));
            assert(!f.d.querySelector('.tbui3-ribbon-context'));assert(f.d.querySelector('[data-source=menuBarGrid]'));assert.equal(f.adapter.active,'Form');
        }
        section().querySelector('button').click();assert.deepEqual(f.calls,['tbUI3TabNew']);assert(section());assert(f.d.querySelector('[data-source=menuBarGrid]'));
        f.d.getElementById('addinButton-tbUI3TabDelete').classList.add('disabledCommand');f.adapter.tick();assert(section().querySelector('[data-source=addinButton-tbUI3TabDelete]').disabled);
        f.d.querySelector('[data-tab=Home]').click();assert(!section());f.d.querySelector('[data-tab=Form]').click();assert(section());
        selected=[f.d.createElement('div')];f.adapter.tick();assert(!section());assert(f.d.querySelector('[data-source=menuBarGrid]'));
        selected=[];f.adapter.tick();assert(!section());selected=[host];f.adapter.tick();assert(section());
        f.adapter.setMode('Classic');assert(!section());assert.equal(f.d.getElementById('addinButton-tbUI3TabNew').parentElement,f.toolbar);f.dispose();
    }
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
test('toolbar commands remain theme-independent while WinUI chrome effects are theme-specific',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');
    // Pinned WinUI subtle-state alpha fills and shadow4 are effects, not a replacement theme palette.
    const paletteCss=css.replace(/--tbui3-toolbar-shadow:[^;]+;|--tbui3-subtle-(?:hover|pressed):[^;]+;/g,'');
    assert(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(paletteCss));assert(css.includes('--themeMenuBackColor'));assert(css.includes('--themeDialogGeneralForeColor'));
    assert(!/ThemePrefix|__winui3IdeStyle/.test(source));
    assert(source.includes("['winui3 dark','winui3 light'].includes(themeName)"));
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
    assert.equal(b.querySelector('.tbui3-ribbon-label').textContent,'Restart Compiler');assert(b.title.includes('Hold ALT key'));
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
    f.adapter.openFile('Options');assert(f.d.querySelector('.tbui3-backstage-content button[title*="MenuCaptionToolsIDEOptions"]'));f.adapter.closeFile();
    f.d.querySelector('[data-tab=Form]').click();assert(f.d.querySelector('[aria-haspopup=menu]'));
    f.adapter.openFile('Add-ins');await new Promise(r=>setTimeout(r,10));assert(f.d.querySelector('.tbui3-backstage-content').textContent.includes('Native loaded add-in'));f.dispose();
});

test('embedded toolbar contains the exact adapter, essential CSS, PNG and all cataloged SVG glyphs',()=>{
    const path='tbIDE/tbUI3IDE/src/Sources/IdeToolbarScript.twin',src=fs.readFileSync(path,'utf8');let js='';
    for(const line of src.split(/\r?\n/)){
        if(line.trim()==='js = js & vbLf'){js+='\n';continue;}
        if(!line.trim().startsWith('js = js & '))continue;
        for(const part of line.trim().slice(10).split(' & ')){if(part==='Chr(34)')js+='"';else js+=part.slice(1,-1);}
    }
    new vm.Script(js);assert(js.includes(source.trim()));assert(js.includes(layoutSource.trim()));assert(js.includes(presentationSource.trim()));assert(js.includes(contextSource.trim()));
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');assert(js.includes(JSON.stringify(css)));
    assert.equal((js.match(/data:image\/svg\+xml/g)||[]).length,37+Object.keys(requestedIcons).length);assert(!/(?<!\r)\n/.test(src));
    const png=js.match(/brandImage:"data:image\/png;base64,([A-Za-z0-9+/=]+)"/);assert(png);
    assert.deepEqual(Buffer.from(png[1],'base64'),fs.readFileSync('tbIDE/tbUI3IDE/images/twinBASIC_WinUI3.png'));
});

test('Home uses Paste as the lead command and keeps Undo/Redo/Run solely in quick access',()=>{
    const f=fixture();f.items.Edit=[{name:'Undo',action:'tbEditor_Undo'},{name:'Redo',action:'tbEditor_Redo'},
        {name:'Cut',action:'tbEditor_ClipboardCut'},{name:'Copy',action:'tbEditor_ClipboardCopy'},
        {name:'Paste',action:'tbEditor_ClipboardPaste'},{name:'Find',action:'tbEditor_Find'},
        {name:'Format document',action:'tbEditor_FormatDocument'}];
    f.items.Run=[{name:'Run',action:'tbDebug_StartOrContinue'}];f.menu('Run');f.adapter.setMode('Ribbon');
    const body=f.d.querySelector('.tbui3-ribbon-content');assert.deepEqual([...body.querySelectorAll('section')].map(n=>n.getAttribute('aria-label')),['Clipboard','Editing']);
    assert.equal(body.querySelector('.tbui3-ribbon-large .tbui3-ribbon-label').textContent,'Paste');assert(!body.textContent.includes('Undo'));assert(!body.textContent.includes('Redo'));
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
    save.click();assert.deepEqual(f.calls,['tbProject_SaveAllChanges']);f.adapter.openFile();f.d.querySelector('[data-file-section=Options]').click();assert(!f.d.querySelector('.tbui3-backstage').hidden);f.d.querySelector('.tbui3-backstage-content button[title^=Options]').click();assert.deepEqual(f.calls,['tbProject_SaveAllChanges','tbIde_ShowIDEOptions']);f.dispose();
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
    assert(actions('Project','Build').includes('tbBuild_Start'));assert(layout.file.has('Options'));assert(!layout.file.has('Save document'));assert(actions('Code','Document').includes('tbEditor_Save'));assert(actions('Form','Document').includes('tbEditor_Save'));
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
    assert(icon.classList.contains('codicon')||icon.classList.contains('tbui3-ribbon-segoe')&&icon.textContent||icon.style.getPropertyValue('--tbui3-icon')||icon.style.getPropertyValue('--tbui3-native-image'),'Empty icon: '+button.textContent);
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
    assertButtonIcon(proxy);assert(proxy.classList.contains('tbui3-ribbon-large'));assert.equal(proxy.querySelector('.tbui3-ribbon-icon').style.getPropertyValue('--tbui3-icon'),f.api.icons['fluent/globe_search']);
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
    const rules=[...style.sheet.cssRules];const token=rules.find(r=>r.selectorText==='.tbui3-toolbar-owned, .tbui3-toolbar-option, .tbui3-classic-toolbar').style;
    assert(token.getPropertyValue('--tbui3-toolbar-bg').includes('--color-card'));assert(token.getPropertyValue('--tbui3-toolbar-bg').includes('--themeToolbarBackground'));
    assert(token.getPropertyValue('--tbui3-toolbar-fg').replace(/\s/g,'').startsWith('var(--color-text,var(--themeGeneralTextColor'));
    const quick=rules.find(r=>r.selectorText==='.tbui3-quick');assert(quick.style.color.includes('--themeMenuForeColor'));
    const popup=rules.find(r=>r.selectorText==='.tbui3-ribbon-popup');assert(popup.style.color.includes('--tbui3-toolbar-fg'));assert(popup.style.background.includes('--color-flyout'));assert(popup.style.background.includes('--themeDialogGeneralBackColor'));assert(!popup.style.background.includes('--themeContextMenuBackColor'));  
    assert(token.getPropertyValue('--tbui3-toolbar-hover').includes('--color-neutral-hover'));assert(token.getPropertyValue('--tbui3-toolbar-pressed').includes('--color-neutral-pressed'));
    assert.equal(token.getPropertyValue('--tbui3-subtle-hover'),'#00000009');
    const dark=rules.find(r=>r.selectorText==='.darkMode .tbui3-toolbar-owned, .darkMode .tbui3-toolbar-option, .darkMode .tbui3-classic-toolbar');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-hover'),'#ffffff0f');assert.equal(dark.style.getPropertyValue('--tbui3-subtle-pressed'),'#ffffff0a');
    const hover=rules.find(r=>r.selectorText?.includes('.tbui3-ribbon-command:hover:not(:disabled)'));assert.equal(hover.style.background,'var(--tbui3-toolbar-hover)');
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-command:active:not(:disabled)'&&r.style.background==='var(--tbui3-toolbar-pressed)'));
    assert(rules.some(r=>r.selectorText==='.tbui3-ribbon-grid .menuBarGridOptionsInner'&&r.style.color==='var(--tbui3-toolbar-fg)'));
    const numbers=rules.find(r=>r.selectorText===".tbui3-ribbon-grid .menuBarGridOptionRow input[type='number']");assert(numbers.style.getPropertyValue('--tbui3-grid-fill').includes('--themeDialogGeneralBackColor'));assert.equal(numbers.style.getPropertyPriority('background'),'important');
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
    assert(rule('.tbui3-ribbon-tabs').color.includes('--themeMenuForeColor'));assert.equal(rule('.tbui3-ribbon-content').background,'var(--tbui3-toolbar-bg)');assert.equal(rule('.tbui3-ribbon-content').getPropertyValue('box-shadow'),'none');assert.equal(rule('.tbui3-ribbon-content').getPropertyValue('border-bottom'),'0');assert(rule('.tbui3-ribbon-winui > .tbui3-ribbon-content').getPropertyValue('box-shadow').includes('--tbui3-toolbar-shadow'));
    assert.equal(rule('.tbui3-ribbon-tab').background,'transparent');assert(!rules.some(r=>r.selectorText===".tbui3-ribbon-tab[aria-selected='true']"&&r.style.background));
    assert.equal(rule(".tbui3-ribbon-tab[aria-selected='true']::after").background,'var(--tbui3-accent)');
    assert.equal(rule(".tbui3-ribbon-tab:hover:not([aria-selected='true'])::after").background,'var(--tbui3-tab-hover-indicator)');
    assert(!rules.some(r=>r.selectorText?.includes('.tbui3-ribbon-tab:hover')&&!r.selectorText.includes('::after')));
    const token=rule('.tbui3-toolbar-owned, .tbui3-toolbar-option, .tbui3-classic-toolbar');assert(token.getPropertyValue('--tbui3-accent').includes('--themeProblemSelectedBorderColor'));assert(token.getPropertyValue('--tbui3-tab-hover-indicator').includes('GrayText'));dom.window.close();
});
test('large and compact dropdowns use a masked Fluent chevron in their respective layout positions',()=>{
    const f=fixture();f.items.Format[0].name='{%MenuCaptionFormatAlign}';f.items.Edit=[{name:'Other options',hoverAction:()=>f.show(undefined,0,0,[{name:'Child',action:'child'}])}];
    f.adapter.setMode('Ribbon');const compact=f.d.querySelector('.tbui3-ribbon-dropdown');assert(!compact.classList.contains('tbui3-ribbon-large'));assert.equal(compact.querySelector('.tbui3-ribbon-chevron').textContent,'');
    assert(compact.querySelector('.tbui3-ribbon-chevron').style.getPropertyValue('--tbui3-icon').includes('chevron_down'));
    f.d.querySelector('[data-tab=Form]').click();const large=f.d.querySelector('.tbui3-ribbon-dropdown');assert(large.classList.contains('tbui3-ribbon-large'));
    assert.equal(large.lastElementChild,large.querySelector('.tbui3-ribbon-chevron'));assert.equal(large.querySelector('.tbui3-ribbon-chevron').textContent,'');
    const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);const rules=[...style.sheet.cssRules];
    const grid=rules.find(r=>r.selectorText==='.tbui3-ribbon-content .tbui3-ribbon-large').style;assert.equal(grid.display,'grid');assert(grid.getPropertyValue('grid-template-rows').includes('8px'));
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
    const rules=[...style.sheet.cssRules],ours=rules.find(r=>r.selectorText===".tbui3-ribbon-grid .menuBarGridOptionRow input[type='number']");assert.equal(ours.style.getPropertyPriority('background'),'important');assert.equal(ours.style.background,'var(--tbui3-grid-fill)');
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
test('Ribbon and Hybrid expose compact alignment and size controls using their original native handlers',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native contract');
    for(const mode of ['Ribbon','Hybrid']){
    const f=fixture(),ids=['menuBarAlignLeft','menuBarAlignTop','menuBarAlignRight','menuBarAlignBottom','menuBarSizeWidest','menuBarSizeTallest','menuBarSizeNarrowest','menuBarSizeShortest'];
    const actions=['AlignSelectedControlsLeft','AlignSelectedControlsTop','AlignSelectedControlsRight','AlignSelectedControlsBottom','ResizeSelectedControlsWidest','ResizeSelectedControlsTallest','ResizeSelectedControlsNarrowest','ResizeSelectedControlsShortest'];
    for(let i=0;i<ids.length;i++){const n=f.button(ids[i]);n.boundCommand='tbFormDesigner_'+actions[i];n.style.backgroundImage='url(https://example.test/'+ids[i]+'.svg)';}
    const sandbox={rootMenuFormat:f.d.getElementById('rootMenuFormat'),menuRightTriangle:'>',showContextMenu:(...args)=>f.show(...args)};
    const show=nativeFunction('showFormatMenu',sandbox);sandbox.rootMenuFormat.onmousedown=()=>show();attachNativeBridge(f);f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();
    assert.deepEqual([...f.d.querySelectorAll('[data-source^=menuBarAlign],[data-source^=menuBarSize]')].map(n=>n.dataset.source),ids);
    for(const id of ids){const button=f.d.querySelector(`[data-source=${id}]`);assert(button.classList.contains('tbui3-ribbon-compact'));assert(!button.classList.contains('tbui3-ribbon-large'));assert(button.title);assert(button.getAttribute('aria-label'));assert(!button.hasAttribute('aria-haspopup'));assert(button.querySelector('.tbui3-ribbon-icon').style.getPropertyValue('--tbui3-native-image').includes(id));}
    f.d.querySelector('[data-source=menuBarAlignLeft]').click();assert.deepEqual(f.calls,['menuBarAlignLeft']);
    f.d.getElementById('menuBarSizeWidest').classList.add('disabledCommand');f.adapter.tick();assert(f.d.querySelector('[data-source=menuBarSizeWidest]').disabled);f.dispose();
    }
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
    [...content.querySelectorAll('button')].find(b=>b.querySelector('.tbui3-ribbon-label').textContent==='Windows form').click();assert(f.calls.includes('tbFileSystem_AddWindowsForm'));
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
    assert.equal(large.display,'grid');assert.equal(large.getPropertyValue('align-content'),'start');assert.equal(large.getPropertyValue('grid-template-rows'),'32px 4px 28px 2px 8px');
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

test('Ribbon and Hybrid share centered glyph canvases, intrinsic widths, fixed padding and 89px dividers',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture();f.button('menuBarGrid','Show grid');f.button('pasteIcon','Paste');
        const native=f.d.createElement('div');native.id='menuBarGridOptions';native.innerHTML='<div class="menuBarGridOptionsInner"><div class="menuBarGridOptionRow"><input class="optionGridWidth" type="number" value="10"></div></div>';f.toolbar.after(native);
        f.adapter.setMode(mode);f.d.querySelector('[data-tab=Form]').click();
        const groups=[...f.d.querySelectorAll('.tbui3-ribbon-group')].filter(n=>n.getAttribute('aria-label')==='Grid');
        assert.equal(groups.length,1);assert(groups[0].querySelector('[data-source=menuBarGrid]'));assert(groups[0].querySelector('.tbui3-ribbon-grid input'));assert.equal(f.d.querySelectorAll('.tbui3-grid-dropdown[aria-label="Grid options"]').length,1);
        const style=f.d.createElement('style');style.textContent=css;f.d.head.append(style);const rules=[...style.sheet.cssRules],rule=selector=>rules.find(r=>r.selectorText===selector).style;
        const large=rule('.tbui3-ribbon-content .tbui3-ribbon-large');assert.equal(large.width,'min-content');assert.equal(large.getPropertyValue('justify-content'),'stretch');assert.equal(large.getPropertyValue('grid-template-columns'),'1fr');assert.equal(large.getPropertyValue('align-items'),'start');
        assert.deepEqual(large.padding.split(/\s+/).map(parseFloat),[0,4]);assert.equal(large.getPropertyValue('grid-template-rows'),'32px 4px 28px 2px 8px');
        const area=rule('.tbui3-ribbon-content');assert.deepEqual(area.padding.split(/\s+/).map(parseFloat),[4,4,0]);assert.equal(area.height,'var(--tbui3-command-area-height)');
        const divider=rule('.tbui3-ribbon-group:not(:last-child)::after');assert.equal(divider.height,'89px');assert.equal(parseFloat(divider.top),0);
        const big=rule('.tbui3-ribbon-content .tbui3-ribbon-large .tbui3-ribbon-icon');assert.equal(big.width,'32px');assert.equal(big.height,'32px');assert.equal(big.getPropertyValue('grid-row'),'1');
        const small=rule('.tbui3-ribbon-icon');assert.equal(small.width,'16px');assert.equal(small.height,'16px');assert.equal(small.getPropertyValue('place-items'),'center');
        const caption=rule('.tbui3-ribbon-content .tbui3-ribbon-large .tbui3-ribbon-label');assert.equal(caption.getPropertyValue('grid-row'),'3');assert.equal(caption.getPropertyValue('justify-self'),'stretch');assert.equal(caption.getPropertyValue('overflow-wrap'),'normal');
        f.adapter.setMode('Classic');assert.equal(native.querySelector('input').value,'10');f.dispose();
    }
});
test('Configuration and Zoom keep hidden accessible captions in both replacement modes',()=>{
    for(const mode of ['Ribbon','Hybrid']){
        const f=fixture(),zoom=f.d.createElement('select');zoom.id='zoomSelect';zoom.innerHTML='<option>100%</option>';f.toolbar.append(zoom);f.adapter.setMode(mode);
        for(const [id,tab]of [['buildConfigSelector',mode==='Ribbon'?'Project':'Home'],['zoomSelect',mode==='Ribbon'?'View':'Form']]){
            f.d.querySelector(`[data-tab=${tab}]`).click();const node=f.d.getElementById(id);assert(node.closest('.tbui3-ribbon-selector'));assert(node.previousElementSibling.classList.contains('tbui3-ribbon-caption-hidden'));assert(node.previousElementSibling.textContent);
        }f.dispose();
    }
});
test('File rail reaches the top while title controls remain uncovered and Native Dark uses application foreground',()=>{
    const f=fixture();f.adapter.setMode('Ribbon');f.adapter.openFile();const style=f.d.createElement('style');style.textContent=fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');f.d.head.append(style);const rules=[...style.sheet.cssRules];
    const file=rules.find(r=>r.selectorText==='.tbui3-backstage').style,rail=rules.find(r=>r.selectorText==='.tbui3-backstage-rail').style;
    assert.equal(file.inset,'32px 0 0');assert.equal(rail.getPropertyValue('margin-top'),'-32px');assert.equal(rail.padding,'44px 8px 16px');assert.equal(file.color,'var(--tbui3-toolbar-fg)');assert(!file.color.includes('DialogGeneralForeColor'));assert(fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8').includes('-webkit-app-region: no-drag'));
    assert(!f.d.getElementById('rootMenuClose').closest('.tbui3-backstage-underlay'));f.dispose();
});

test('WinUI3 Light and Dark share subtle menu elevation with native and replacement dropdowns',()=>{
    const css=fs.readFileSync('tbIDE/tbUI3IDE/css/winui3-ide.css','utf8'),dom=new JSDOM('<head></head>'),d=dom.window.document,style=d.createElement('style');style.textContent=css+'\n'+fs.readFileSync('tbIDE/tbUI3IDE/css/ide-toolbar.css','utf8');d.head.append(style);const rules=[...style.sheet.cssRules];
    for(const selector of ['body.darkMode','body:not(.darkMode)']){const token=rules.find(r=>r.selectorText===selector).style.getPropertyValue('--color-menu-shadow');assert.equal(token.replace(/\s/g,''),'002pxrgba(0,0,0,0.12),02px4pxrgba(0,0,0,0.14)');}
    const native=rules.find(r=>r.selectorText==='body #contextMenu, body .contextMenu, body .contextMenu2, body #contextMenuSUB');assert.equal(native.style.getPropertyValue('box-shadow'),'var(--color-menu-shadow)');
    const popup=rules.find(r=>r.selectorText==='.tbui3-ribbon-popup');assert.equal(popup.style.getPropertyValue('box-shadow'),'var(--color-menu-shadow, none)');dom.window.close();
});

const accentFactory=vm.runInNewContext(fs.readFileSync('tbIDE/tbUI3IDE/js/system-accent.js','utf8'));
test('system accent maps actual Windows shades by WinUI theme and removes all overrides on off/theme/dispose',()=>{
    const dom=new JSDOM('<head></head><body></body>'),d=dom.window.document;
    let name='WinUI3 Light',enabled=true;const palette=['#F6CCFF','#E694F7','#CB65E0','#B345C9','#8E2FA8','#702082','#501260'];
    const api=accentFactory({document:d,themeName:()=>name,enabled:()=>enabled});
    const vars=()=>d.getElementById('tbUI3SystemAccentCss')?.sheet.cssRules[0].style;
    api.setPalette(palette);assert.equal(vars().getPropertyValue('--color-accent'),'#8e2fa8');assert.equal(vars().getPropertyValue('--color-accent-link'),'#702082');assert.equal(vars().getPropertyValue('--themeSelectedTextBackColor'),'#b345c940');
    const sheet=d.getElementById('tbUI3SystemAccentCss');api.sync();assert.equal(d.getElementById('tbUI3SystemAccentCss'),sheet);
    name='winui3 dark';api.sync();assert.equal(vars().getPropertyValue('--color-accent'),'#e694f7');assert.equal(vars().getPropertyValue('--color-accent-link'),'#f6ccff');assert.equal(vars().getPropertyValue('--color-accent-hover'),'#e694f7e6');assert.equal(vars().getPropertyValue('--color-accent-pressed'),'#e694f7cc');assert.equal(vars().getPropertyValue('--themeDialogHeaderBackColor'),'');
    for(const theme of ['Dark','Light','WinUI3 Custom','Third party']){name=theme;api.sync();assert.equal(d.getElementById('tbUI3SystemAccentCss'),null,theme);}
    name='WinUI3 Light';api.sync();assert(vars());enabled=false;api.sync();assert.equal(d.getElementById('tbUI3SystemAccentCss'),null);enabled=true;api.sync();assert(vars());api.dispose();assert.equal(d.getElementById('tbUI3SystemAccentCss'),null);dom.window.close();
});
test('system accent refreshes without changing native palette variables and invalid or failed reads fall back',()=>{
    const dom=new JSDOM('<html style="--themeProblemSelectedBorderColor:#005fb8"><head></head><body></body></html>'),d=dom.window.document;
    const api=accentFactory({document:d,themeName:()=> 'WinUI3 Light',enabled:()=>true});
    api.setPalette(Array(7).fill('#123456'));assert(d.getElementById('tbUI3SystemAccentCss').textContent.includes('#123456'));api.setPalette(Array(7).fill('#abcdef'));assert(!d.getElementById('tbUI3SystemAccentCss').textContent.includes('#123456'));assert.equal(d.documentElement.style.getPropertyValue('--themeProblemSelectedBorderColor'),'#005fb8');
    for(const invalid of [null,[],Array(7).fill('red'),Array(7).fill('#123456;display:none')]){api.setPalette(invalid);assert.equal(d.getElementById('tbUI3SystemAccentCss'),null);}
    api.dispose();dom.window.close();
});
test('WinUI Light ships neutral window chrome and native bridge polls documented UISettings with balanced cleanup',()=>{
    const theme=fs.readFileSync('tbIDE/themes/WinUI3 Light.theme','utf8');assert.match(theme,/MenuBackColor:\s*#F3F3F3;/);assert.match(theme,/MenuForeColor:\s*#1A1A1A;/);
    const main=fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/MainModule.twin','utf8');assert(main.includes('03021BE4-5254-4781-8194-5168F7D06D7B'));assert(main.includes('Windows.UI.ViewManagement.UISettings'));assert(main.includes('For desired = 8 To 2 Step -1'));assert(main.includes('If classId <> 0 Then WindowsDeleteString classId'));assert(main.includes('If initialized Then RoUninitialize'));assert(main.includes('window.__tbUI3Appearance.dispose()'));assert(main.includes("enabled)?'on':'off'"));
    const builder=fs.readFileSync('tbIDE/tools/build-ide-toolbar.mjs','utf8');assert(builder.includes('system-accent.js'));assert(builder.includes('syncAppearance:function()'));
});

test('ribbon elevation follows only WinUI3 Dark/Light across live theme transitions in both profiles and presentations',()=>{
    for(const mode of ['Ribbon','Hybrid'])for(const simplified of [false,true]){
        const f=fixture();let theme='Dark';f.api.themeName=()=>theme;f.api.stylingEnabled=()=>false;f.adapter.setMode(mode);f.adapter.setSimplified(simplified);
        const shell=f.d.querySelector('.tbui3-ribbon'),controls=[...shell.querySelectorAll('button,input,select')];
        for(const name of ['Dark','WinUI3 Dark','Light','winui3 light','Aurora','WinUI3 Custom','WINUI3 DARK','Third-party','WinUI3 Light','Dark']){
            theme=name;f.adapter.tick();assert.equal(shell.classList.contains('tbui3-ribbon-winui'),['winui3 dark','winui3 light'].includes(name.toLowerCase()),mode+' '+name);assert.deepEqual([...shell.querySelectorAll('button,input,select')],controls);
        }
        f.dispose();
    }
});

// Read the installed native objects/classes without redistributing the IDE source.
function installedValue(prefix,sandbox){
    const text=fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),start=text.indexOf(prefix);assert(start>=0,prefix);
    const valueStart=prefix.startsWith('class ')?start:start+prefix.length;
    for(let end=text.indexOf('}',valueStart);end>=0;end=text.indexOf('}',end+1)){
        const value=text.slice(valueStart,end+1);try{new vm.Script('('+value+')');}catch{continue;}
        return vm.runInNewContext('('+value+')',sandbox);
    }throw Error('Cannot extract '+prefix);
}
function documentNativeFixture(){
    const writes=[],dialogs=[],opened=[],sandbox={TextEncoder,JSONstringifyOrdered:JSON.stringify},files=new Map();
    sandbox.fs={writeFile:(file,data,version,ansi,done)=>writes.push({file,data,version,ansi,done}),tree:{resolvePath:path=>files.get(path)}};
    const Editors=installedValue('class openEditorsCollection',sandbox),editors={selectedEditorNode:null,updateDirtyState:n=>{n.updated=true;}};sandbox.openEditors=editors;
    editors.isDirtyEditor=Editors.prototype.isDirtyEditor;editors.save=Editors.prototype.save;editors.openFile=file=>opened.push(file);
    sandbox.fileHandler_twin=installedValue('fileHandler_twin=',sandbox);sandbox.fileHandler_tbform=installedValue('fileHandler_tbform=',sandbox);sandbox.liveIDEOptions={previewDocs:false};sandbox.msgBox=message=>dialogs.push(message);
    for(const name of ['switchToFormPart','switchToCodePart','toggleFormDesign'])sandbox[name]=nativeFunction(name,sandbox);
    let projectPath='C:/project.twinproj',loaded=true,saveAs;
    const native={selectedEditor:()=>editors.selectedEditorNode,projectLoaded:()=>loaded,projectPath:()=>projectPath,isDirtyEditor:n=>editors.isDirtyEditor(n),saveEditor:n=>editors.save(n),saveProjectAs:callback=>{saveAs=callback;},findFile:path=>files.get(path),formCodeHandler:()=>sandbox.fileHandler_twin,formDesignerHandler:()=>sandbox.fileHandler_tbform};
    function doc(kind,path){
        let version=2;const n={type:kind,fileNode:{getFullPath:()=>path,ideVersionId:3},domObject_CloseButton:{className:''},fileHandler:kind==='UIDesigner'?sandbox.fileHandler_tbform:sandbox.fileHandler_twin};n.fileNode.openEditorNode=n;
        if(kind==='CodeEditor'){n.openingAltVersionId=1;n.monacoModelInstance={getAlternativeVersionId:()=>version,getValue:()=> 'unsaved code'};n.edit=()=>version++;}
        else{n.domContainer={globalVars:{isDirty:true,state:{item:{form:[{Name:'Form1',Caption:'Unsaved form'}]}}}};n.edit=()=>n.domContainer.globalVars.isDirty=true;}
        return n;
    }
    return {native,bridge:contextFactory(native),sandbox,editors,writes,dialogs,opened,files,doc,select:n=>editors.selectedEditorNode=n,setProject:value=>projectPath=value,setLoaded:value=>loaded=value,completeSaveAs:()=>{projectPath='C:/new.twinproj';saveAs();}};
}
test('Save Document uses the real native editor writer for code/forms and only clears dirty state after successful completion',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native document save contract');
    for(const kind of ['CodeEditor','UIDesigner']){
        const f=documentNativeFixture(),selected=f.doc(kind,'/Project/Selected.'+(kind==='CodeEditor'?'twin':'tbform')),other=f.doc('CodeEditor','/Project/Other.twin');f.select(selected);
        assert(f.bridge.canSaveDocument());f.bridge.saveDocument();assert.equal(f.writes.length,1);assert.equal(f.writes[0].file,selected.fileNode);assert(f.editors.isDirtyEditor(selected));assert(f.editors.isDirtyEditor(other));
        f.writes[0].done(-1);assert(f.editors.isDirtyEditor(selected));assert(f.bridge.canSaveDocument());f.bridge.saveDocument();f.writes[1].done(0);assert(!f.editors.isDirtyEditor(selected));assert(!f.bridge.canSaveDocument());assert(f.editors.isDirtyEditor(other));assert(selected.updated);assert.equal(f.writes[1].version,3);assert.equal(f.dialogs.length,0);
        selected.edit();assert(f.bridge.canSaveDocument());selected.fileNode.readOnly=true;assert(!f.bridge.canSaveDocument());f.bridge.saveDocument();assert.equal(f.writes.length,2);selected.fileNode.readOnly=false;f.setLoaded(false);assert(!f.bridge.canSaveDocument());f.select(null);assert(!f.bridge.canSaveDocument());
    }
});
test('Save As keeps the clicked document target across tab changes and skips a document closed during the prompt',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native document save contract');
    for(const close of [false,true]){
        const f=documentNativeFixture(),original=f.doc('CodeEditor','/Original.twin'),other=f.doc('CodeEditor','/Other.twin');f.select(original);f.setProject('');f.bridge.saveDocument();assert.equal(f.writes.length,0);f.select(other);if(close)delete original.fileNode.openEditorNode;f.completeSaveAs();assert.equal(f.writes.length,close?0:1);if(!close)assert.equal(f.writes[0].file,original.fileNode);assert(f.editors.isDirtyEditor(other));
    }
});
test('Form/Code availability matches the real native switch lookup for form, usercontrol, property page and report',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native document switch contract');
    const f=documentNativeFixture();
    for(const ext of ['.tbform','.tbcontrol','.tbppage','.tbreport'])for(const type of ['CodeEditor','UIDesigner']){
        f.files.clear();const source='/Project/Design'+(type==='CodeEditor'?'.twin':ext),target='twinbasic:/Project/Design'+(type==='CodeEditor'?ext:'.twin'),file={target};f.select(f.doc(type,source));assert(!f.bridge.canSwitchFormCode());f.files.set(target,file);assert(f.bridge.canSwitchFormCode());f.sandbox.toggleFormDesign();assert.equal(f.opened.at(-1),file);assert.equal(f.dialogs.length,0);
    }
    f.files.clear();f.select(f.doc('CodeEditor','/Project/Module.twin'));assert(!f.bridge.canSwitchFormCode());f.select(null);assert(!f.bridge.canSwitchFormCode());
});
test('document buttons follow dirty state and real counterpart availability across both tabs/profiles/presentations',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for native document UI contract');
    for(const mode of ['Ribbon','Hybrid'])for(const simplified of [false,true])for(const tab of ['Code','Form']){
        const f=fixture(),n=documentNativeFixture(),doc=n.doc(tab==='Code'?'CodeEditor':'UIDesigner','/Design'+(tab==='Code'?'.twin':'.tbform'));n.select(doc);
        const source=f.button('designSwitchIcon','Switch Between Form And Code');source.onmousedown=()=>n.sandbox.toggleFormDesign();f.items.File.push({name:'Save Document',action:'tbEditor_Save'});
        f.api.canSwitchFormCode=n.bridge.canSwitchFormCode;f.api.commandEnabled=action=>action==='tbEditor_Save'?n.bridge.canSaveDocument():true;f.api.execute=action=>{if(action==='tbEditor_Save')n.bridge.saveDocument();else f.calls.push(action);};f.adapter.setMode(mode);f.adapter.setSimplified(simplified);f.d.querySelector('[data-tab='+tab+']').click();
        const buttons=f.d.querySelector('.tbui3-ribbon-content > section').querySelectorAll('button'),save=buttons[0],toggle=buttons[1];assert(!save.disabled);assert(toggle.disabled);toggle.click();assert.equal(n.dialogs.length,0);
        n.files.set('twinbasic:/Design'+(tab==='Code'?'.tbform':'.twin'),{});f.adapter.tick();assert(!toggle.disabled);toggle.click();assert.equal(n.opened.length,1);
        save.click();assert.equal(n.writes.length,1);assert(!save.disabled);n.writes[0].done(0);f.adapter.tick();assert(save.disabled);doc.edit();f.adapter.tick();assert(!save.disabled);
        n.select(n.doc('CodeEditor','/Module.twin'));f.adapter.tick();assert(toggle.disabled);toggle.click();assert.equal(n.opened.length,1);f.dispose();
    }
});

test('the actual generated toolbar routes Save Document around the installed disabled placeholder while leaving other commands native',t=>{
    if(!process.env.TB_IDE_MAIN_JS)return t.skip('Set TB_IDE_MAIN_JS for generated document bridge contract');
    const f=documentNativeFixture(),selected=f.doc('CodeEditor','/Selected.twin'),dom=new JSDOM('<head></head><body></body>');f.select(selected);
    const generated=fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/IdeToolbarScript.twin','utf8');let script='';
    for(const line of generated.split(/\r?\n/)){const m=/^\s*js = js & (.*)$/.exec(line);if(m)for(const token of m[1].match(/"[^"]*"|Chr\(34\)|vbLf/g)||[])script+=token==='Chr(34)'?'"':token==='vbLf'?'\n':token.slice(1,-1);}
    const adapterSource=source.trim().replace(/\r\n/g,'\n');assert(script.includes(adapterSource));script=script.replace(adapterSource,'(function(api){capturedApi=api;return {install:function(){}};})');
    const sandbox={...f.sandbox,document:dom.window.document,window:{},capturedApi:null,projectFilePath:'C:/Project.twinproj',getThemeName:()=> 'Dark',parseExpression:s=>s,parseAndEvaluateExpression:()=>true,evaluateExpression:()=>false,executeIdeCommand:action=>f.opened.push(action)};
    const stub=installedValue('tbEditor_Save:',sandbox);assert(stub.defaultContext.includes('0 &'));sandbox.ideCommands={tbEditor_Save:stub};vm.runInNewContext(script,sandbox);
    assert.equal(sandbox.capturedApi.commandEnabled('tbEditor_Save'),true);sandbox.capturedApi.execute('tbEditor_Save');assert.equal(f.writes.length,1);assert.equal(f.writes[0].file,selected.fileNode);assert.equal(f.dialogs.length,0);f.writes[0].done(0);assert.equal(sandbox.capturedApi.commandEnabled('tbEditor_Save'),false);sandbox.capturedApi.execute('tbProject_SaveAllChanges');assert.equal(f.opened.at(-1),'tbProject_SaveAllChanges');dom.window.close();
});
