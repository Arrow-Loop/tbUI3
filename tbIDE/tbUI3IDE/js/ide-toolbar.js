/* tbUI3IDE toolbar presentation. Native nodes/commands remain the execution authority.
 * Factory arguments isolate version-specific IDE hooks from the renderer and tests.
 * Icons are supplied from the existing Fluent toolbar map by the embedding tool.
 */
(function createIdeToolbar(api) {
    'use strict';
    const w=api.window, d=w.document, modes=['Classic','Hybrid','Ribbon'];
    const state={mode:'Classic',requestedMode:'Classic',dirty:false,lastError:'',active:'Home',disposed:false};
    const sources=new Map(), menus=new Map(), bindings=new Map(), placements=new Map(), pendingMenus=new Map();
    const hiddenNative=new Set();
    let shell, tabs, content, quick, backstage, fileNav, fileContent, popup, interval;
    let signature='', menuSignature='', fileSection='File', savedFocus, captureSink, refreshAt=0;
    let nativeMenu=api.getShowContextMenu(), wrappedMenu, pendingSubmenu;
    const own=n=>!!(n&&n.closest&&n.closest('.tbui3-toolbar-owned'));
    const el=(tag,cls,text)=>{const n=d.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
    const clear=n=>{while(n.firstChild)n.firstChild.remove();};
    const label=n=>(n.unalteredTitle||n.title||n.textContent||n.id).trim();
    const localize=s=>api.localize?api.localize(s||''):s||'';
    const caption=item=>{let text=localize(item.name).replace(/&(?=\w)/g,'');if(item.isHtmlName){const t=d.createElement('template');t.innerHTML=text;text=t.content.textContent;}return text;};
    const checked=item=>item.checked===true||/(?:^|\s)(?:tickIcon|checked)(?:\s|$)/.test(item.iconClass||item.class||'');
    const visible=n=>!n.classList.contains('hide')&&!n.classList.contains('hiddenTitlebar')&&n.style.display!=='none';
    const disabled=n=>n.hasAttribute('disabled')||n.classList.contains('disabledCommand')||n.classList.contains('contextMenuItemDisabled');
    const fail=e=>{state.lastError=String(e&&e.message||e);restore();state.mode='Classic';syncOptions();};
    const known={
        Home:[['File',['saveIcon','searchIcon','designSwitchIcon']],['History',['undoIcon','redoIcon']],
            ['Debug',['playIcon','pauseIcon','stopIcon','debugStepOverIcon','debugStepIntoIcon','debugStepOutIcon']],
            ['Build',['buildConfigSelector','restartIcon','trashIcon','buildIcon']],['Appearance',['menuBarColorMode']]],
        Code:[['Editing',['commentIcon','uncommentIcon','indentIcon','unindentIcon']]],
        Form:[['Align',['menuBarAlignLeft','menuBarAlignTop','menuBarAlignRight','menuBarAlignBottom']],
            ['Size',['menuBarSizeWidest','menuBarSizeTallest','menuBarSizeNarrowest','menuBarSizeShortest']],
            ['Grid',['menuBarGrid']],['Arrange',['menuBarBringToFront','menuBarSendToBack']],['View',['zoomSelect','menuBarPreview']]]
    };
    const quickIds=['saveIcon','undoIcon','redoIcon','playIcon','pauseIcon','stopIcon'];
    // Presentation captions are deliberately shorter than the native help/shortcut tooltip.
    // This table never decides whether a command exists or how it is executed.
    const sourceLabels={saveIcon:'Save',searchIcon:'Find in project',designSwitchIcon:'Form / code',
        undoIcon:'Undo',redoIcon:'Redo',playIcon:'Start / Continue',pauseIcon:'Break',stopIcon:'Stop',
        debugStepOverIcon:'Step over',debugStepIntoIcon:'Step into',debugStepOutIcon:'Step out',
        restartIcon:'Restart compiler',trashIcon:'Clean',buildIcon:'Build',menuBarColorMode:'Theme',
        buildConfigSelector:'Configuration',zoomSelect:'Zoom',menuBarPreview:'Preview',
        commentIcon:'Comment',uncommentIcon:'Uncomment',indentIcon:'Indent',unindentIcon:'Outdent',
        menuBarAlignLeft:'Align left',menuBarAlignTop:'Align top',menuBarAlignRight:'Align right',menuBarAlignBottom:'Align bottom',
        menuBarSizeWidest:'Widest',menuBarSizeTallest:'Tallest',menuBarSizeNarrowest:'Narrowest',menuBarSizeShortest:'Shortest',
        menuBarGrid:'Show grid',menuBarBringToFront:'Bring to front',menuBarSendToBack:'Send to back'};
    const sourceCaption=n=>sourceLabels[n.id]||label(n).replace(/\s*\([^)]*\)\s*$/,'');
    const pageIds=['tbUI3TabNew','tbUI3TabDelete','tbUI3TabLeft','tbUI3TabRight','tbUI3TabRefresh','tbUI3TabDiagnostics'];
    const pageSource=n=>pageIds.some(id=>n.id==='addinButton-'+id);
    function currentHost() {
        const g=api.formGlobals&&api.formGlobals();
        if(!g||!g.selectedControls)return null;
        for(let n of g.selectedControls)for(;n&&n!==g.designer;n=n.parentElement)
            if(n.properties&&/^(tbUI3\.)?UI3TabView$/i.test(n.properties._className||''))return n;
        return null;
    }
    function discover() {
        const toolbar=d.getElementById('rootMenu2'), headers=d.getElementById('rootMenu1Inner');
        if(!toolbar||!headers)throw Error('Native toolbar/menu structure is unavailable');
        for(const n of [...toolbar.children])if(!n.classList.contains('toolbarSplitter')&&
            (n.id||n.matches('select,button,.icon'))&&!/^testArea/.test(n.id))sources.set(n.id||n,n);
        for(const [id,n] of sources)if(!n.isConnected)sources.delete(id);
        const found=new Set();
        for(const n of [...headers.children])if(n.classList.contains('menuItem')&&
            (n.onmousedown||n.onclick)&&!/^rootMenu(?:Admin|DevTools)$/.test(n.id)&&visible(n)) {
            const id=n.id||n;found.add(id);const m=menus.get(id)||{node:n,items:[]};
            m.node=n;m.title=label(n);menus.set(id,m);
            n.classList.toggle('tbui3-menu-source',state.mode==='Ribbon');
        }
        for(const [id,m] of menus)if(!found.has(id)){m.node.classList.remove('tbui3-menu-source');menus.delete(id);}
        if(state.mode!=='Classic')syncNativeToolbarVisibility(toolbar);
        return toolbar;
    }
    function syncNativeToolbarVisibility(toolbar) {
        const wanted=new Set([toolbar]),header=toolbar.parentElement;
        if(header&&header.panelId==='TOOLBAR'){
            wanted.add(header);if(header.sectionRoot)wanted.add(header.sectionRoot);
            // BETA 1044 leaves a 30px minimum-height dock slot after its header/body are hidden.
            // Collapse only the nearest slot whose panel headers all belong to this toolbar.
            const slot=header.closest('.dockElementContainer, .floatingPanel');
            const headers=slot&&[...slot.querySelectorAll('.sectionHeader')];
            if(headers&&headers.length===1&&headers[0]===header)wanted.add(slot);
        }
        let changed=false;
        for(const n of hiddenNative)if(!wanted.has(n)){n.classList.remove('tbui3-toolbar-native-hidden');hiddenNative.delete(n);changed=true;}
        for(const n of wanted)if(!hiddenNative.has(n)){n.classList.add('tbui3-toolbar-native-hidden');hiddenNative.add(n);changed=true;}
        if(changed)resize();
    }
    function group(name,parent=content) {
        const n=el('section','tbui3-ribbon-group'),body=el('div','tbui3-ribbon-group-body');
        n.setAttribute('aria-label',name);n.append(body,el('div','tbui3-ribbon-group-title',name));parent.append(n);return body;
    }
    function iconFor(n,descriptor) {
        let src=n;
        if(!src&&descriptor&&typeof descriptor.action==='string')
            src=[...sources.values()].find(x=>[].concat(x.boundCommand||[]).includes(descriptor.action));
        const i=el('span','tbui3-ribbon-icon');i.setAttribute('aria-hidden','true');
        const uri=src&&api.icons[src.id];
        if(uri){i.classList.add('tbui3-ribbon-mask');i.style.setProperty('--tbui3-icon',uri);}
        else if(src){
            const cs=w.getComputedStyle(src);let image=cs.backgroundImage;
            if(!image||image==='none')image=w.getComputedStyle(src,'::before').backgroundImage;
            if(image&&image!=='none')i.style.setProperty('--tbui3-native-image',image);
            else if(src.classList.contains('iconTextOnly'))i.hidden=true;
            else {const c=src.querySelector('.codicon');if(c)i.className+=' '+c.className;}
        }else if(descriptor&&descriptor.codicon)i.className+=' codicon codicon-'+descriptor.codicon;
        else if(descriptor&&descriptor.iconClass)i.className+=' '+descriptor.iconClass;
        return i;
    }
    function invokeSource(n,event) {
        if(disabled(n))return;
        const init={bubbles:true,cancelable:true,button:0,ctrlKey:event.ctrlKey,shiftKey:event.shiftKey,altKey:event.altKey,metaKey:event.metaKey};
        // Natural mouse sequence covers both native mousedown commands and add-in click handlers.
        for(const type of ['mousedown','mouseup','click'])n.dispatchEvent(new w.MouseEvent(type,init));
    }
    function sourceButton(n,parent,compact=false) {
        const b=el('button','tbui3-ribbon-command'+(compact?' tbui3-ribbon-compact':''));b.type='button';
        b.dataset.source=typeof n.id==='string'?n.id:'';b.title=label(n);b.setAttribute('aria-label',label(n));
        b.append(iconFor(n),el('span','tbui3-ribbon-label',sourceCaption(n)));
        b.addEventListener('mousedown',e=>e.preventDefault());
        b.onclick=e=>{invokeSource(n,e);tick();};parent.append(b);bindings.set(b,{source:n});return b;
    }
    function park(n,parent) {
        if(!placements.has(n)){const marker=d.createComment('tbUI3IDE restore '+n.id);n.before(marker);placements.set(n,marker);}
        parent.append(n);
    }
    function returnNodes() {for(const [n,marker]of placements){if(marker.isConnected)marker.replaceWith(n);}placements.clear();}
    function addSources(ids,parent) {
        for(const id of ids){const n=sources.get(id);if(!n)continue;
            if(n.matches('select')){const l=el('label','tbui3-ribbon-selector',sourceCaption(n));l.title=label(n);park(n,l);parent.append(l);}
            else sourceButton(n,parent);
        }
    }
    function addGrid() {
        const n=d.getElementById('menuBarGridOptions');if(!n)return;
        const body=n.querySelector('.menuBarGridOptionsInner');if(body){const box=el('fieldset','tbui3-ribbon-grid');
            box.disabled=!(api.formGlobals&&api.formGlobals());park(body,box);group('Grid options').append(box);}
    }
    function pages(parent=content) {const body=group('MultiPage',parent);for(const n of sources.values())if(pageSource(n))sourceButton(n,body);}
    function addins(parent=content,includeUnknown=false) {
        const used=new Set(Object.values(known).flatMap(gs=>gs.flatMap(g=>g[1])));
        const entries=[...sources.values()].filter(n=>!pageSource(n)&&n.id.startsWith('addinButton-'));
        if(entries.length){const body=group('Add-ins',parent);for(const n of entries)sourceButton(n,body);}
        if(includeUnknown){const extra=[...sources.values()].filter(n=>!n.id.startsWith('addinButton-')&&!used.has(n.id));
            if(extra.length){const body=group('Additional commands',parent);for(const n of extra)sourceButton(n,body);}}
    }
    function menuEnabled(item) {
        if(item.isHidden)return false;
        try{
            if(item.context&&!api.testContext(item.context))return false;
            if(typeof item.action==='string'&&!api.commandEnabled(item.action))return false;
        }catch(e){return false;}
        return true;
    }
    function menuItems(items) {
        const result=[];
        for(const entry of items||[]){
            if(!Array.isArray(entry)){if(entry)result.push(entry);continue;}
            // Match the native context-dependent alternatives, including superHiddenContext.
            for(const item of entry){if(!item)continue;if(!menuEnabled(item)&&item.superHiddenContext)continue;result.push(item);break;}
        }
        return result;
    }
    function command(item,parent) {
        if(!item.name){parent.append(el('div','tbui3-ribbon-separator'));return;}
        if(!menuEnabled(item)&&item.superHiddenContext)return;
        const b=el('button','tbui3-ribbon-command');b.type='button';
        const title=caption(item);
        b.title=title+(typeof item.action==='string'?' '+api.shortcut(item.action):'');
        b.append(iconFor(null,item),el('span','tbui3-ribbon-label',title));
        b.addEventListener('mousedown',e=>e.preventDefault());
        bindings.set(b,{item});parent.append(b);
        if(item.comboOptions){
            const select=el('select','tbui3-ribbon-select');select.setAttribute('aria-label',title);
            for(const value of item.comboOptions){const o=el('option','',value);o.value=value;o.selected=value===item.comboValue;select.append(o);}
            select.onchange=()=>{if(menuEnabled(item)&&item.onchange)item.onchange(select.value);};
            b.replaceWith(select);bindings.delete(b);bindings.set(select,{item});return;
        }
        if(item.hoverAction){b.setAttribute('aria-haspopup','menu');b.append(el('span','tbui3-ribbon-chevron','\u2304'));}
        b.onclick=()=>{
            if(!menuEnabled(item))return;
            if(item.action){
                closeFile(false);closePopup();
                if(typeof item.action==='string')api.execute(item.action);else item.action(item);
                tick();
            }else if(item.hoverAction)openSubmenu(item,b);
        };
    }
    function openSubmenu(item,anchor) {
        closePopup();popup=el('div','tbui3-toolbar-owned tbui3-ribbon-popup');popup.setAttribute('role','menu');
        const bounds=anchor.getBoundingClientRect();popup.style.setProperty('--tbui3-popup-x',Math.min(bounds.left,w.innerWidth-280)+'px');
        popup.style.setProperty('--tbui3-popup-y',Math.min(bounds.bottom,w.innerHeight-200)+'px');d.body.append(popup);
        const sink=items=>{if(!popup)return;clear(popup);for(const child of menuItems(items))command(child,popup);syncBindings();popup.querySelector('button,select')?.focus();};
        captureSink=sink;pendingSubmenu={sink,until:Date.now()+5000};
        try{item.hoverAction(anchor);}finally{captureSink=null;}
    }
    function closePopup(){pendingSubmenu=null;if(popup){for(const n of popup.querySelectorAll('button,select'))bindings.delete(n);popup.remove();popup=null;}}
    function requestMenu(m) {
        const sink=items=>{m.items=items||[];if(state.mode!=='Ribbon')return;
            if(backstage&&!backstage.hidden&&fileSection===m.title)renderFile(m);
            else if(state.active===m.node.id)renderMenu(m);
        };
        pendingMenus.set(m.node.id,sink);captureSink=sink;
        try{
            if(m.node.onmousedown)m.node.onmousedown({button:0,preventDefault(){},stopPropagation(){}});
            else if(m.node.onclick)m.node.onclick({button:0,preventDefault(){},stopPropagation(){}});
        }finally{captureSink=null;}
    }
    function renderMenu(m) {
        const items=menuItems(m.items);
        const sig=JSON.stringify([m.node.id,items.map(i=>[caption(i),i.action&&String(i.action),i.codicon,i.iconClass,i.class,i.comboOptions,i.comboValue,checked(i),menuEnabled(i)])]);
        if(sig===menuSignature)return;menuSignature=sig;clearContent();
        let body=group(m.title),has=false;
        for(const item of items){if(!item.name){if(has){body=group(localize(items[items.indexOf(item)+1]?.name)||m.title);has=false;}continue;}
            command(item,body);has=true;}
        if(m.node.id==='rootMenuFormat'){addSources(['zoomSelect','menuBarPreview'],group('Designer'));addGrid();if(currentHost())pages();}
        if(m.node.id==='rootMenuProject')addSources(['buildConfigSelector','restartIcon','trashIcon','buildIcon'],group('Build'));
        if(m.node.id==='rootMenuTools')addSources(['menuBarColorMode'],group('Appearance'));
        syncBindings();resize();
    }
    function clearContent(){returnNodes();for(const [n]of bindings)if(content.contains(n))bindings.delete(n);clear(content);}
    function makeTab(key,title,action) {
        const b=el('button','tbui3-ribbon-tab',title);b.type='button';b.dataset.tab=key;
        b.addEventListener('mousedown',e=>e.preventDefault());
        b.setAttribute('role','tab');b.setAttribute('aria-selected',String(state.active===key));b.tabIndex=state.active===key?0:-1;
        b.onclick=action||(()=>selectTab(key));tabs.append(b);return b;
    }
    function selectTab(key,focus=false) {
        state.active=key;menuSignature='';closeFile(false);closePopup();clearContent();
        for(const b of tabs.children){const selected=b.dataset.tab===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected&&focus)b.focus();}
        if(state.mode==='Hybrid'){
            if(known[key]){for(const [name,ids]of known[key])addSources(ids,group(name));if(key==='Form'){addGrid();if(currentHost()){const nested=el('button','tbui3-ribbon-tab tbui3-ribbon-context','MultiPage');nested.onclick=()=>{clearContent();pages();syncBindings();resize();};content.prepend(nested);}}}
            else addins(content,true);
        }else{const m=menus.get(key);if(m)requestMenu(m);else if(key==='Add-ins')addins(content,true);}
        syncBindings();resize();
    }
    function renderTabs() {
        clear(tabs);
        if(state.mode==='Hybrid')for(const title of ['Home','Code','Form','Add-ins'])makeTab(title,title);
        else {
            const file=[...menus.values()].find(m=>m.node.id==='rootMenuFile');
            if(!file)throw Error('File menu is unavailable; restoring Classic');
            makeTab('File',file.title,()=>openFile(file.title));
            for(const m of menus.values())if(m.node.id!=='rootMenuFile'&&m.node.id!=='rootMenuAddins')makeTab(m.node.id,m.title);
            makeTab('Add-ins','Add-ins');
            if(![...tabs.children].some(b=>b.dataset.tab===state.active))state.active=[...menus.keys()].find(id=>id!=='rootMenuFile'&&id!=='rootMenuAddins');
        }
        selectTab(state.active);
    }
    function openFile(section='File') {
        if(backstage.hidden)savedFocus=d.activeElement;
        fileSection=section;backstage.hidden=false;clear(fileNav);
        const back=el('button','tbui3-backstage-back','\u2190 Back');back.onclick=()=>closeFile();fileNav.append(back);
        for(const m of menus.values())if(m.node.id==='rootMenuFile'||m.node.id==='rootMenuAddins'||m.node.id==='rootMenuTools'){
            const b=el('button','tbui3-backstage-nav',m.title);b.onclick=()=>{fileSection=m.title;requestMenu(m);};fileNav.append(b);
        }
        const selected=[...menus.values()].find(m=>m.title===section)||menus.get('rootMenuFile');
        if(selected){fileSection=selected.title;renderFile(selected);requestMenu(selected);}back.focus();
    }
    function renderFile(m) {
        for(const [n]of bindings)if(fileContent.contains(n))bindings.delete(n);clear(fileContent);
        fileContent.append(el('h1','tbui3-backstage-heading',m.title));
        const list=menuItems(m.items),unsupported=m.node.id==='rootMenuAddins'&&list.some(i=>typeof i.action==='function'&&String(i.action).includes('notSupportedMenuOption'));
        if(unsupported)fileContent.append(el('p','','This IDE build lists loaded add-ins here. It does not expose enable or disable commands.'));
        const body=group(m.title,fileContent);for(const item of list){
            if(unsupported&&typeof item.action==='function'&&String(item.action).includes('notSupportedMenuOption'))command({...item,isHidden:true},body);
            else command(item,body);
        }
        syncBindings();
    }
    function closeFile(restoreFocus=true){if(backstage&&!backstage.hidden){backstage.hidden=true;if(restoreFocus&&savedFocus?.isConnected)savedFocus.focus();}}
    function syncBindings(){for(const box of d.querySelectorAll('.tbui3-ribbon-grid'))box.disabled=!(api.formGlobals&&api.formGlobals());for(const [b,entry]of bindings){
        const on=entry.source?!disabled(entry.source):menuEnabled(entry.item);b.disabled=!on;b.setAttribute('aria-disabled',String(!on));
            const isChecked=entry.source?entry.source.classList.contains('menuBarToggleOn'):checked(entry.item);
            b.classList.toggle('tbui3-ribbon-checked',isChecked);b.setAttribute('aria-pressed',String(isChecked));
            if(entry.source){b.title=label(entry.source);b.hidden=!visible(entry.source);}
    }}
    function syncQuick(){
        if(!quick)return;const parent=d.getElementById('rootMenu1Inner');
        if(parent&&quick.parentElement!==parent)parent.prepend(quick);
        quick.classList.toggle('tbui3-quick-real-titlebar',!!api.realTitlebar());
    }
    function syncOptions() {
        for(const name of d.getElementsByClassName('tbis-optionName'))if(name.textContent.trim()==='Enable additional IDE theme styling via add-in'){
            const row=name.closest('.tbis-optionRow');if(!row)continue;
            let next=row.nextElementSibling;
            if(!next||!next.classList.contains('tbui3-toolbar-option')){
                next=el('div','tbis-optionRow tbui3-toolbar-option');const left=el('div','tbis-optionLabelCol');
                const text=el('label','tbis-optionName','IDE Toolbar'),right=el('div','tbis-optionValueCol'),select=el('select','tbui3-toolbar-select');
                select.setAttribute('aria-label','IDE Toolbar');
                for(const mode of modes){const o=el('option','',mode);o.value=mode;select.append(o);}
                select.onchange=()=>setMode(select.value,true);left.append(text,el('div','tbis-optionDesc','Choose the IDE command layout. Uses your selected IDE theme.'));
                right.append(select);next.append(left,right);row.after(next);
            }
            next.querySelector('select').value=state.requestedMode;
        }
    }
    function resize(){if(api.changedSize)api.changedSize();}
    function restore() {
        closePopup();closeFile(false);returnNodes();bindings.clear();
        for(const m of menus.values())m.node.classList.remove('tbui3-menu-source');
        for(const n of hiddenNative)n.classList.remove('tbui3-toolbar-native-hidden');hiddenNative.clear();pendingMenus.clear();
        if(shell)shell.remove();if(quick)quick.remove();if(backstage)backstage.remove();
        shell=tabs=content=quick=backstage=fileNav=fileContent=null;
        signature='';menuSignature='';resize();
    }
    function build() {
        const toolbar=discover(),root=d.getElementById('root'),top=d.getElementById('rootTop');
        if(!root||!top)throw Error('IDE root layout is unavailable');
        shell=el('div','tbui3-toolbar-owned tbui3-ribbon');shell.setAttribute('aria-label','IDE ribbon');
        tabs=el('div','tbui3-ribbon-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','IDE tools');
        content=el('div','tbui3-ribbon-content');content.setAttribute('role','tabpanel');shell.append(tabs,content);top.before(shell);
        toolbar.classList.add('tbui3-toolbar-native-hidden');
        if(state.mode==='Ribbon'){
            quick=el('div','tbui3-toolbar-owned tbui3-quick');quick.setAttribute('role','toolbar');quick.setAttribute('aria-label','Quick access');
            for(const id of quickIds)if(sources.has(id))sourceButton(sources.get(id),quick,true);syncQuick();
            backstage=el('div','tbui3-toolbar-owned tbui3-backstage');backstage.hidden=true;backstage.setAttribute('role','dialog');
            backstage.setAttribute('aria-modal','true');backstage.setAttribute('aria-label','File');
            fileNav=el('nav','tbui3-backstage-rail');fileContent=el('div','tbui3-backstage-content');backstage.append(fileNav,fileContent);root.append(backstage);
        }
        signature=currentSignature();renderTabs();
    }
    function currentSignature(){return JSON.stringify([state.mode,[...sources.values()].map(n=>[n.id,n.title,n.style.backgroundImage]),[...menus.values()].map(m=>[m.node.id,m.title]),!!currentHost()]);}
    function tick(){
        if(state.disposed)return;
        try{
            syncOptions();if(state.mode==='Classic')return;
            discover();const next=currentSignature();if(next!==signature){signature=next;menuSignature='';renderTabs();}
            syncBindings();syncQuick();
            if(state.mode==='Ribbon'&&Date.now()>refreshAt){refreshAt=Date.now()+1000;const m=menus.get(state.active);if(m&&backstage.hidden)requestMenu(m);}
        }catch(e){fail(e);}
    }
    function setMode(mode,dirty=false){
        if(!modes.includes(mode))mode='Classic';
        state.requestedMode=mode;
        if(state.mode!==mode||mode!=='Classic'&&!shell){restore();state.mode=mode;state.active=mode==='Hybrid'?'Home':'rootMenuEdit';
            try{if(mode!=='Classic')build();}catch(e){fail(e);}}
        if(dirty)state.dirty=true;syncOptions();return state.mode;
    }
    function keydown(e){
        if(state.mode==='Classic')return;
        if(e.key==='Escape'&&popup){e.preventDefault();e.stopImmediatePropagation();closePopup();return;}
        if(backstage&&!backstage.hidden){
            if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeFile();}
            else if(e.key==='Tab'){const nodes=[...backstage.querySelectorAll('button:not(:disabled),select:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);
                if(e.shiftKey&&d.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first?.focus();}}
            return;
        }
        if(e.ctrlKey&&e.key==='F1'){e.preventDefault();content.hidden=!content.hidden;resize();return;}
        const b=e.target.closest&&e.target.closest('.tbui3-ribbon-tab');if(!b||!tabs.contains(b))return;
        const items=[...tabs.children];let i=items.indexOf(b);
        if(e.key==='ArrowRight')i=(i+1)%items.length;else if(e.key==='ArrowLeft')i=(i+items.length-1)%items.length;
        else if(e.key==='Home')i=0;else if(e.key==='End')i=items.length-1;else return;
        e.preventDefault();e.stopImmediatePropagation();items[i].focus();items[i].click();
    }
    function pointerdown(e){if(popup&&!popup.contains(e.target)&&!own(e.target))closePopup();}
    function install(mode='Classic') {
        if(typeof nativeMenu!=='function')throw Error('Native showContextMenu is unavailable');
        wrappedMenu=function(anchor,x,y,items,...rest){
            if(state.disposed)return nativeMenu.call(this,anchor,x,y,items,...rest);
            const requested=anchor&&pendingMenus.get(anchor.id);
            if(requested){pendingMenus.delete(anchor.id);requested(items);return;}
            if(captureSink){if(pendingSubmenu&&pendingSubmenu.sink===captureSink)pendingSubmenu=null;captureSink(items);return;}
            if(!anchor&&pendingSubmenu&&pendingSubmenu.until>Date.now()){const s=pendingSubmenu.sink;pendingSubmenu=null;s(items);return;}
            const m=anchor&&menus.get(anchor.id);
            if(state.mode==='Ribbon'&&m){m.items=items;
                if(anchor.id==='rootMenuFile'||anchor.id==='rootMenuAddins'){fileSection=m.title;openFile(m.title);}
                else{state.active=anchor.id;selectTab(anchor.id);}return;}
            return nativeMenu.call(this,anchor,x,y,items,...rest);
        };
        api.setShowContextMenu(wrappedMenu);d.addEventListener('keydown',keydown,true);d.addEventListener('pointerdown',pointerdown,true);
        interval=w.setInterval(tick,400);setMode(mode);return state;
    }
    function dispose(){state.disposed=true;w.clearInterval(interval);restore();
        if(api.getShowContextMenu()===wrappedMenu)api.setShowContextMenu(nativeMenu);
        d.removeEventListener('keydown',keydown,true);d.removeEventListener('pointerdown',pointerdown,true);
        for(const n of d.querySelectorAll('.tbui3-toolbar-option'))n.remove();
    }
    return Object.assign(state,{install,setMode,tick,dispose,openFile,closeFile,discover});
})
