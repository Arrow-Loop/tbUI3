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
    const fileUnderlays=new Map();
    let shell, tabs, content, quick, backstage, fileNav, fileContent, popup, interval;
    let signature='', menuSignature='', fileSection='File', savedFocus, captureSink, refreshAt=0;
    let nativeMenu=api.getShowContextMenu(), wrappedMenu, pendingSubmenu;
    let hydrating=false,layout;
    let fileNavSignature='',fileRenderSignature='';
    const itemKey=i=>[caption(i),i.action&&String(i.action),i.codicon,i.iconClass,i.class,i.comboValue,i._sourceId,i._ribbonIconSource,i._ribbonLarge,checked(i),menuEnabled(i),i._ribbonChildren?.map(itemKey)];
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
    function iconFor(n,descriptor={}) {
        let src=n;
        if(!src&&typeof descriptor.action==='string')
            src=[...sources.values()].find(x=>[].concat(x.boundCommand||[]).includes(descriptor.action));
        const i=el('span','tbui3-ribbon-icon');i.setAttribute('aria-hidden','true');
        const mask=uri=>{i.classList.add('tbui3-ribbon-mask');i.style.setProperty('--tbui3-icon',uri);return i;};
        if(src&&api.icons[src.id])return mask(api.icons[src.id]);
        if(src){
            const cs=w.getComputedStyle(src);let image=cs.backgroundImage;
            if(!image||image==='none')image=w.getComputedStyle(src,'::before').backgroundImage;
            if(image&&image!=='none'){i.style.setProperty('--tbui3-native-image',image);return i;}
            const c=src.matches('.codicon')?src:src.querySelector('.codicon');
            if(c){i.className+=' '+[...c.classList].filter(x=>x==='codicon'||x.startsWith('codicon-')||x==='flipX'||x==='rotate90').join(' ');return i;}
        }
        if(descriptor.codicon){i.className+=' codicon codicon-'+descriptor.codicon;return i;}
        const glyph=api.present?api.present(descriptor,src&&src.id).glyph:'apps_list';
        return mask(api.icons[glyph]||api.icons.apps_list||api.icons.saveIcon);
    }
    function invokeSource(n,event) {
        if(disabled(n))return;
        const init={bubbles:true,cancelable:true,button:0,ctrlKey:event.ctrlKey,shiftKey:event.shiftKey,altKey:event.altKey,metaKey:event.metaKey};
        // Natural mouse sequence covers both native mousedown commands and add-in click handlers.
        for(const type of ['mousedown','mouseup','click'])n.dispatchEvent(new w.MouseEvent(type,init));
    }
    function sourceButton(n,parent,compact=false,large=!!api.present?.({},n.id).large) {
        const b=el('button','tbui3-ribbon-command'+(compact?' tbui3-ribbon-compact':large?' tbui3-ribbon-large':''));b.type='button';
        b.dataset.source=typeof n.id==='string'?n.id:'';b.title=label(n);b.setAttribute('aria-label',label(n));
        b.append(iconFor(n,{name:sourceCaption(n)}),el('span','tbui3-ribbon-label',sourceCaption(n)));
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
            else sourceButton(n,parent,false,!!api.present?.({},id).large);
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
        if(item._sourceId){const n=sources.get(item._sourceId);if(n){if(n.matches('select'))addSources([item._sourceId],parent);else sourceButton(n,parent,false,item._ribbonLarge);}return;}
        if(!item.name){parent.append(el('div','tbui3-ribbon-separator'));return;}
        if(!menuEnabled(item)&&item.superHiddenContext)return;
        const b=el('button','tbui3-ribbon-command'+(item._ribbonLarge?' tbui3-ribbon-large':''));b.type='button';
        const title=caption(item);
        b.title=title+(typeof item.action==='string'?' '+api.shortcut(item.action):'');
        const shown=/^[^a-z]*[A-Z][^a-z]*$/.test(title)?title.charAt(0)+title.slice(1).toLowerCase():title;
        b.append(iconFor(sources.get(item._ribbonIconSource),item),el('span','tbui3-ribbon-label',shown));
        b.addEventListener('mousedown',e=>e.preventDefault());
        bindings.set(b,{item});parent.append(b);
        if(item.comboOptions){
            const select=el('select','tbui3-ribbon-select');select.setAttribute('aria-label',title);
            for(const value of item.comboOptions){const o=el('option','',value);o.value=value;o.selected=value===item.comboValue;select.append(o);}
            select.onchange=()=>{if(menuEnabled(item)&&item.onchange)item.onchange(select.value);};
            b.replaceWith(select);bindings.delete(b);bindings.set(select,{item});return;
        }
        if(item.hoverAction||item._ribbonChildren){b.setAttribute('aria-haspopup','menu');b.append(el('span','tbui3-ribbon-chevron','\u2304'));}
        b.onclick=()=>{
            if(!menuEnabled(item))return;
            if(item.action){
                closeFile(false);closePopup();
                if(typeof item.action==='string')api.execute(item.action);else item.action(item);
                tick();
            }else if(item.hoverAction||item._ribbonChildren)openSubmenu(item,b);
        };
    }
    function openSubmenu(item,anchor) {
        closePopup();popup=el('div','tbui3-toolbar-owned tbui3-ribbon-popup');popup.setAttribute('role','menu');
        const bounds=anchor.getBoundingClientRect();popup.style.setProperty('--tbui3-popup-x',Math.min(bounds.left,w.innerWidth-280)+'px');
        popup.style.setProperty('--tbui3-popup-y',Math.min(bounds.bottom,w.innerHeight-200)+'px');d.body.append(popup);
        const sink=items=>{if(!popup)return;clear(popup);for(const child of menuItems(items))command(child,popup);syncBindings();popup.querySelector('button,select')?.focus();};
        if(item._ribbonChildren){sink(item._ribbonChildren);return;}
        captureSink=sink;pendingSubmenu={sink,until:Date.now()+5000};
        try{item.hoverAction(anchor);}finally{captureSink=null;}
    }
    function closePopup(){pendingSubmenu=null;if(popup){for(const n of popup.querySelectorAll('button,select'))bindings.delete(n);popup.remove();popup=null;}}
    function requestMenu(m) {
        const sink=items=>{m.items=items||[];m.loading=false;m.ready=true;if(state.mode!=='Ribbon'||hydrating)return;
            refreshLayout();
        };
        if(m.loading)return;m.loading=true;
        pendingMenus.set(m.node.id,sink);captureSink=sink;
        try{
            if(m.node.onmousedown)m.node.onmousedown({button:0,preventDefault(){},stopPropagation(){}});
            else if(m.node.onclick)m.node.onclick({button:0,preventDefault(){},stopPropagation(){}});
        }catch(e){m.loading=false;throw e;}finally{captureSink=null;}
    }
    function collectLayout() {
        const records=[];
        for(const m of menus.values())for(const item of menuItems(m.items))records.push({menuId:m.node.id,menuTitle:m.title,item});
        const source=(id,tab,group)=>{if(sources.has(id))records.push({item:{name:sourceCaption(sources.get(id)),_sourceId:id,_ribbonTab:tab,_ribbonGroup:group}});};
        for(const id of ['commentIcon','uncommentIcon'])source(id,'Code','Comments');
        source('buildConfigSelector','Project','Build');source('debugStepOutIcon','Debug','Stepping');
        source('zoomSelect','View','Zoom');source('menuBarPreview','Form','Designer');
        if(!records.some(r=>String(r.item.name).includes('MenuCaptionWindowTheme')))source('menuBarColorMode','View','Appearance');
        const quickActions=new Set();for(const id of quickIds)for(const a of [].concat(sources.get(id)?.boundCommand||[]))quickActions.add(a);
        return api.buildLayout(records,quickActions,api.present);
    }
    function hydrateMenus(refresh=false) {
        hydrating=true;try{for(const m of menus.values())if(!m.ready||refresh&&(m.node.id!=='rootMenuAddins'||backstage&&!backstage.hidden&&fileSection==='Add-ins'))requestMenu(m);}finally{hydrating=false;}
        refreshLayout();
    }
    function refreshLayout() {
        if(state.mode!=='Ribbon'||!tabs)return;
        layout=collectLayout();
        const ids=['File',...layout.tabs.map(t=>t.id)];
        if(!ids.includes('Add-ins'))ids.splice(ids.includes('Help')?ids.indexOf('Help'):ids.length,0,'Add-ins');
        const distinct=[...new Set(ids)];
        if(JSON.stringify([...tabs.children].map(n=>n.dataset.tab))!==JSON.stringify(distinct)){
            clear(tabs);for(const id of distinct)makeTab(id,id,id==='File'?()=>openFile():undefined);
        }
        if(!distinct.includes(state.active)||state.active==='File')state.active='Home';
        if(backstage&&!backstage.hidden){renderFileNav();renderFile();syncBindings();return;}
        renderLayoutTab();
    }
    function renderLayoutTab() {
        const tab=layout.tabs.find(t=>t.id===state.active);
        const sig=JSON.stringify([state.active,tab?.groups.map(g=>[g.title,g.items.map(itemKey)]),!!currentHost()]);
        if(sig===menuSignature)return;menuSignature=sig;clearContent();
        if(state.active==='Add-ins')addins(content,true);
        else if(tab)for(const g of tab.groups){const body=group(g.title);for(const i of g.items)command(i,body);}
        if(state.active==='Form'){addGrid();addMultiPageContext();}
        for(const b of tabs.children){const selected=b.dataset.tab===state.active;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}
        syncBindings();resize();
    }
    function addMultiPageContext(){if(currentHost()){const b=el('button','tbui3-ribbon-tab tbui3-ribbon-context');b.append(iconFor(null,{_ribbonGlyph:'apps_list'}),el('span','','MultiPage'));
        b.onclick=()=>{clearContent();pages();syncBindings();resize();};content.prepend(b);}}
    function tabForNative(m){
        if(m.node.id==='rootMenuFile'||m.node.id==='rootMenuAddins')return 'File';
        return {rootMenuEdit:'Home',rootMenuFormat:'Form',rootMenuView:'View',rootMenuWindows:'View',rootMenuProject:'Project',rootMenuRun:'Debug',rootMenuDebug:'Debug',rootMenuTools:'Project',rootMenuHelp:'File'}[m.node.id]||m.title;
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
            if(known[key]){for(const [name,ids]of known[key])addSources(ids,group(name));if(key==='Form'){addGrid();if(currentHost()){const nested=el('button','tbui3-ribbon-tab tbui3-ribbon-context');nested.append(iconFor(null,{_ribbonGlyph:'apps_list'}),el('span','','MultiPage'));nested.onclick=()=>{clearContent();pages();syncBindings();resize();};content.prepend(nested);}}}
            else addins(content,true);
        }else{menuSignature='';hydrateMenus(true);}
        syncBindings();resize();
    }
    function renderTabs() {
        clear(tabs);
        if(state.mode==='Hybrid')for(const title of ['Home','Code','Form','Add-ins'])makeTab(title,title);
        else {
            if(!menus.has('rootMenuFile'))throw Error('File menu is unavailable; restoring Classic');
            if(typeof api.buildLayout!=='function')throw Error('Ribbon layout adapter is unavailable');
        }
        selectTab(state.active);
    }
    function syncFileUnderlays() {
        const nodes=[shell,d.getElementById('rootTop'),d.getElementById('rootBottom'),d.getElementById('codePanel'),...d.querySelectorAll('.floatingPanel')];
        for(const n of nodes)if(n&&!fileUnderlays.has(n)){
            fileUnderlays.set(n,{inert:n.inert,aria:n.getAttribute('aria-hidden'),hidden:n.classList.contains('tbui3-backstage-underlay')});
            n.classList.add('tbui3-backstage-underlay');n.inert=true;n.setAttribute('aria-hidden','true');
        }
    }
    function restoreFileUnderlays(){for(const [n,old]of fileUnderlays){
        n.classList.toggle('tbui3-backstage-underlay',old.hidden);
        if(old.inert===undefined)delete n.inert;else n.inert=old.inert;
        if(old.aria===null)n.removeAttribute('aria-hidden');else n.setAttribute('aria-hidden',old.aria);
    }fileUnderlays.clear();}
    function activateItem(item,anchor) {
        if(!menuEnabled(item))return;
        if(item.action){closeFile(false);closePopup();if(typeof item.action==='string')api.execute(item.action);else item.action(item);tick();}
        else if(item.hoverAction||item._ribbonChildren)openSubmenu(item,anchor);
    }
    function openFile(section='Info') {
        if(!backstage)return;
        if(backstage.hidden)savedFocus=d.activeElement;
        fileSection=section==='File'?'Info':section==='Addins'?'Add-ins':section;
        backstage.hidden=false;syncFileUnderlays();
        renderFileNav();renderFile();fileNav.querySelector('button')?.focus();
    }
    function renderFileNav() {
        const sig=JSON.stringify([fileSection,[...(layout?.file||[])].map(([name,items])=>[name,items.map(itemKey)])]);
        if(sig===fileNavSignature)return;fileNavSignature=sig;
        for(const [n]of bindings)if(fileNav.contains(n))bindings.delete(n);clear(fileNav);
        const back=el('button','tbui3-backstage-back');back.append(iconFor(null,{_ribbonGlyph:'arrow_left'}),el('span','','Back'));back.setAttribute('aria-label','Back to project');back.onclick=()=>closeFile();fileNav.append(back);
        const main=el('div','tbui3-backstage-nav-group'),footer=el('div','tbui3-backstage-nav-group tbui3-backstage-footer');fileNav.append(main,footer);
        const add=(title,section,parent=main,direct=false)=>{
            const entries=layout?.file.get(section)||[],item=entries.find(menuEnabled)||entries[0];
            if(section!=='Info'&&section!=='Add-ins'&&!entries.length)return;
            const b=el('button','tbui3-backstage-nav');
            const glyph={Info:'info','Add-ins':'puzzle_piece',Preferences:'settings',Options:'settings',Help:'chat_help',More:'apps_list'}[section];
            b.append(iconFor(null,glyph?{_ribbonGlyph:glyph}:item||{}),el('span','',title));b.type='button';b.dataset.fileSection=section;
            if(direct&&item){b.title=caption(item);bindings.set(b,{item});b.onclick=()=>activateItem(item,b);}
            else{b.onclick=()=>{fileSection=section;renderFile();renderFileNav();};
                if(fileSection===section){b.classList.add('tbui3-backstage-selected');b.setAttribute('aria-current','page');}}
            parent.append(b);
        };
        add('Info','Info');add('New','New',main,true);add('Open','Open');add('Save','Save',main,true);add('Save document','Save document',main,true);add('Save as','Save as',main,true);add('Export','Export');add('Close project','Close',main,true);
        if(layout?.file.has('More'))add('More commands','More');
        add('Add-ins','Add-ins',footer);add('Help','Help',footer);add('Preferences','Preferences',footer);add('Options','Options',footer,true);add('Exit','Exit',footer,true);
        syncBindings();
    }
    function renderFile() {
        const items=layout?.file.get(fileSection)||[],projectName=api.projectName&&api.projectName();
        const sig=JSON.stringify([fileSection,projectName,items.map(itemKey),!!menus.get('rootMenuAddins')?.loading]);
        if(sig===fileRenderSignature)return;fileRenderSignature=sig;
        for(const [n]of bindings)if(fileContent.contains(n))bindings.delete(n);clear(fileContent);
        const titles={Info:'Project information',Open:'Open project',Export:'Export project','Add-ins':'Add-ins',Preferences:'Preferences',More:'More file commands',Help:'Help'};
        fileContent.append(el('h1','tbui3-backstage-heading',titles[fileSection]||fileSection));
        const list=items.filter(i=>i.name);
        if(fileSection==='Info'){
            fileContent.append(el('p','tbui3-backstage-project',projectName||'No project open'));
        }
        const unsupported=fileSection==='Add-ins'&&list.some(i=>typeof i.action==='function'&&String(i.action).includes('notSupportedMenuOption'));
        if(unsupported)fileContent.append(el('p','tbui3-backstage-description','This IDE build lists loaded add-ins here. It does not expose enable or disable commands.'));
        const tasks=el('div','tbui3-backstage-tasks');fileContent.append(tasks);
        for(const original of list){const item=fileSection==='Add-ins'?{...original,_ribbonGlyph:'puzzle_piece'}:original;const row=el('div','tbui3-backstage-task');
            command(unsupported&&typeof item.action==='function'&&String(item.action).includes('notSupportedMenuOption')?{...item,isHidden:true,_ribbonLarge:false}:{...item,_ribbonLarge:false},row);tasks.append(row);
        }
        if(!list.length&&fileSection==='Add-ins')fileContent.append(el('p','tbui3-backstage-description',menus.get('rootMenuAddins')?.loading?'Loading add-ins...':'No add-ins are listed by the IDE.'));
        syncBindings();
    }
    function closeFile(restoreFocus=true){if(backstage&&!backstage.hidden){backstage.hidden=true;restoreFileUnderlays();if(restoreFocus&&savedFocus?.isConnected)savedFocus.focus();}}
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
        signature='';menuSignature='';fileNavSignature='';fileRenderSignature='';layout=null;resize();
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
            if(backstage&&!backstage.hidden)syncFileUnderlays();
            if(state.mode==='Ribbon'&&Date.now()>refreshAt){refreshAt=Date.now()+1000;hydrateMenus(true);}
        }catch(e){fail(e);}
    }
    function setMode(mode,dirty=false){
        if(!modes.includes(mode))mode='Classic';
        state.requestedMode=mode;
        if(state.mode!==mode||mode!=='Classic'&&!shell){restore();state.mode=mode;state.active='Home';
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
                if(['rootMenuFile','rootMenuAddins','rootMenuHelp'].includes(anchor.id))openFile(anchor.id==='rootMenuAddins'?'Add-ins':anchor.id==='rootMenuHelp'?'Help':'Info');
                else selectTab(tabForNative(m));return;}
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
