/* tbUI3IDE toolbar presentation. Native nodes/commands remain the execution authority.
 * Factory arguments isolate version-specific IDE hooks from the renderer and tests.
 * Icons are supplied from the existing Fluent toolbar map by the embedding tool.
 */
(function createIdeToolbar(api) {
    'use strict';
    const w=api.window, d=w.document, modes=['Classic','Hybrid','Ribbon'];
    const state={mode:'Classic',requestedMode:'Classic',dirty:false,simplified:false,simplifiedDirty:false,lastError:'',active:'Home',disposed:false};
    const sources=new Map(), menus=new Map(), bindings=new Map(), placements=new Map(), pendingMenus=new Map();
    const hiddenNative=new Set();
    const expandedMenus=new Map();
    let menuEpoch=0,collectingLayout=false,lastEditorNode,lastEditorKind,editorBaseline=false;
    const fileUnderlays=new Map();
    let shell, tabs, content, quick, backstage, fileNav, fileContent, popup, popupAnchor, interval, ribbonToggle;
    let signature='', menuSignature='', fileSection='File', savedFocus, captureSink, refreshAt=0;
    let nativeMenu=api.getShowContextMenu(), wrappedMenu, pendingSubmenu;
    let hydrating=false,layout;
    let gridFlyout,gridParts;
    let fileNavSignature='',fileRenderSignature='';
    const labelWidths=new Map();
    const classicNodes=new Map();
    let classicToolbar,insetRoot,insetOriginal,insetSignature='';
    function fontsChanged(){labelWidths.clear();}
    // Measure whole words with the rendered label's font. The best single split
    // gives the narrowest button that can show the caption on at most two lines.
    function sizeLabels(){
        if(!content||content.hidden||state.mode!=='Classic'&&state.simplified)return;
        let probe;
        for(const button of content.querySelectorAll('.tbui3-ribbon-large')){
            const text=button.querySelector('.tbui3-ribbon-label');if(!text)continue;
            const style=w.getComputedStyle(text),box=w.getComputedStyle(button),limits=w.getComputedStyle(shell);
            const min=parseFloat(limits.getPropertyValue('--tbui3-large-button-width'))||50,max=parseFloat(limits.getPropertyValue('--tbui3-large-button-max-width'))||86;
            const font=['fontFamily','fontSize','fontWeight','fontStyle','fontStretch','letterSpacing','wordSpacing','textTransform'];
            const key=JSON.stringify([text.textContent,min,max,...font.map(p=>style[p]),box.paddingLeft,box.paddingRight,box.borderLeftWidth,box.borderRightWidth]);
            let width=labelWidths.get(key);
            if(width===undefined){
                if(!probe){probe=el('span','');probe.style.cssText='position:fixed;visibility:hidden;white-space:pre;pointer-events:none;';probe.setAttribute('aria-hidden','true');d.body.append(probe);}
                for(const p of font)probe.style[p]=style[p];
                const measure=s=>{probe.textContent=s;return probe.getBoundingClientRect().width;},words=text.textContent.trim().split(/\s+/);
                let best=measure(words.join(' '));
                if(!best)continue; // Layout-free DOM tests retain CSS sizing.
                for(let i=1;i<words.length;i++)best=Math.min(best,Math.max(measure(words.slice(0,i).join(' ')),measure(words.slice(i).join(' '))));
                const edges=['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,p)=>sum+(parseFloat(box[p])||0),0);
                width=Math.min(max,Math.max(min,Math.ceil(best+edges)));labelWidths.set(key,width);
            }
            button.style.width=width+'px';
        }
        probe?.remove();
    }
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
    const quickIds=['saveIcon','undoIcon','redoIcon','buildIcon','playIcon','pauseIcon','stopIcon'];
    // Presentation captions are deliberately shorter than the native help/shortcut tooltip.
    // This table never decides whether a command exists or how it is executed.
    const sourceLabels={saveIcon:'Save',searchIcon:'Find in project',designSwitchIcon:'Form / Code',
        undoIcon:'Undo',redoIcon:'Redo',playIcon:'Start / Continue',pauseIcon:'Break',stopIcon:'Stop',
        debugStepOverIcon:'Step over',debugStepIntoIcon:'Step into',debugStepOutIcon:'Step out',
        restartIcon:'Restart compiler',trashIcon:'Clean',buildIcon:'Build',menuBarColorMode:'Theme',
        buildConfigSelector:'Configuration',zoomSelect:'Zoom',menuBarPreview:'Preview',
        commentIcon:'Comment',uncommentIcon:'Uncomment',indentIcon:'Indent',unindentIcon:'Outdent',
        menuBarAlignLeft:'Align left',menuBarAlignTop:'Align top',menuBarAlignRight:'Align right',menuBarAlignBottom:'Align bottom',
        menuBarSizeWidest:'Widest',menuBarSizeTallest:'Tallest',menuBarSizeNarrowest:'Narrowest',menuBarSizeShortest:'Shortest',
        menuBarGrid:'Grid',menuBarBringToFront:'Bring to front',menuBarSendToBack:'Send to back'};
    const sourceCaption=n=>api.present?.({},n.id).caption||sourceLabels[n.id]||label(n).replace(/\s*\([^)]*\)\s*$/,'');
    const pageIds=['tbUI3TabNew','tbUI3TabDelete','tbUI3TabLeft','tbUI3TabRight','tbUI3TabRefresh','tbUI3TabDiagnostics'];
    const pageSource=n=>pageIds.some(id=>n.id==='addinButton-'+id);
    const currentHost = () => api.tabViewHost?.() || null;
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
        const explicit=api.present?.(descriptor,src&&src.id).icon;
        if(explicit){
            i.dataset.iconRef=explicit;
            if(/^segoe\/[0-9a-f]{4,6}$/i.test(explicit)){i.classList.add('tbui3-ribbon-segoe');i.textContent=String.fromCodePoint(parseInt(explicit.split('/')[1],16));return i;}
            if(!api.icons[explicit])throw Error('Missing requested icon: '+explicit);
            return mask(api.icons[explicit]);
        }
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
    function sourceEnabled(n){
        if(disabled(n)||pageSource(n)&&!currentHost())return false;
        if(n.id==='designSwitchIcon'&&api.canSwitchFormCode){try{return !!api.canSwitchFormCode();}catch(e){return false;}}
        return true;
    }
    function invokeSource(n,event) {
        if(!sourceEnabled(n))return;
        const init={bubbles:true,cancelable:true,button:0,ctrlKey:event.ctrlKey,shiftKey:event.shiftKey,altKey:event.altKey,metaKey:event.metaKey};
        // Natural mouse sequence covers both native mousedown commands and add-in click handlers.
        for(const type of ['mousedown','mouseup','click'])n.dispatchEvent(new w.MouseEvent(type,init));
    }
    // Decorate the existing Classic controls; never replace nodes or handlers.
    function restoreClassicNode(n,record){
        record.icon.remove();
        if(record.original.parentNode===n){while(record.original.firstChild)n.insertBefore(record.original.firstChild,record.original);record.original.remove();}
        n.classList.remove('tbui3-classic-glyph');
        if(record.addedTitle&&n.title===record.title)n.removeAttribute('title');
        if(n.getAttribute('aria-label')===record.aria){if(record.oldAria===null)n.removeAttribute('aria-label');else n.setAttribute('aria-label',record.oldAria);}
    }
    function clearClassic(){
        for(const [n,record]of classicNodes)restoreClassicNode(n,record);classicNodes.clear();
        classicToolbar?.classList.remove('tbui3-classic-toolbar');classicToolbar=null;
    }
    function syncClassic(){
        const toolbar=d.getElementById('rootMenu2');if(!toolbar)return;
        if(classicToolbar&&classicToolbar!==toolbar)clearClassic();classicToolbar=toolbar;toolbar.classList.add('tbui3-classic-toolbar');
        const wanted=new Set([...toolbar.children].filter(n=>!n.matches('select,.toolbarSplitter')&&!/^testArea/.test(n.id)&&
            (n.matches('button,.icon,.codicon')||n.id.startsWith('addinButton-'))&&!n.querySelector('input,select,textarea')));
        for(const [n,record]of classicNodes)if(!wanted.has(n)){restoreClassicNode(n,record);classicNodes.delete(n);}
        for(const n of wanted){
            let record=classicNodes.get(n);
            const key=JSON.stringify([n.title,n.unalteredTitle,n.style.backgroundImage,[...n.classList].filter(c=>c!=='tbui3-classic-glyph'),n.boundCommand]);
            if(record&&record.original.parentNode===n&&record.icon.parentNode===n&&record.key===key)continue;
            if(record){restoreClassicNode(n,record);classicNodes.delete(n);}
            const text=label(n),addedTitle=!n.hasAttribute('title'),oldAria=n.getAttribute('aria-label');
            const icon=iconFor(n,{name:sourceCaption(n),action:typeof n.boundCommand==='string'?n.boundCommand:undefined});icon.classList.add('tbui3-classic-icon');
            const original=el('span','tbui3-classic-original');original.setAttribute('aria-hidden','true');while(n.firstChild)original.append(n.firstChild);n.append(original,icon);
            if(addedTitle)n.title=text;n.setAttribute('aria-label',text);n.classList.add('tbui3-classic-glyph');
            record={original,icon,addedTitle,title:n.title,oldAria,aria:text};
            record.key=JSON.stringify([n.title,n.unalteredTitle,n.style.backgroundImage,[...n.classList].filter(c=>c!=='tbui3-classic-glyph'),n.boundCommand]);classicNodes.set(n,record);
        }
    }
    function clearWindowInsets(){
        if(!insetRoot)return;
        insetRoot.classList.toggle('tbui3-window-insets',insetOriginal.sides);insetRoot.classList.toggle('tbui3-window-top-inset',insetOriginal.top);
        if(insetOriginal.height)insetRoot.style.setProperty('--tbui3-caption-row-height',insetOriginal.height,insetOriginal.priority);else insetRoot.style.removeProperty('--tbui3-caption-row-height');
        if(insetOriginal.offset)insetRoot.style.setProperty('--tbui3-caption-inner-offset',insetOriginal.offset,insetOriginal.offsetPriority);else insetRoot.style.removeProperty('--tbui3-caption-inner-offset');
        insetRoot=null;insetOriginal=null;insetSignature='';
    }
    function syncWindowInsets(){
        const root=d.getElementById('root');if(!root)return;
        if(insetRoot!==root){clearWindowInsets();insetRoot=root;insetOriginal={sides:root.classList.contains('tbui3-window-insets'),top:root.classList.contains('tbui3-window-top-inset'),height:root.style.getPropertyValue('--tbui3-caption-row-height'),priority:root.style.getPropertyPriority('--tbui3-caption-row-height'),offset:root.style.getPropertyValue('--tbui3-caption-inner-offset'),offsetPriority:root.style.getPropertyPriority('--tbui3-caption-inner-offset')};}
        const eligible=['winui3 dark','winui3 light'].includes(String(api.themeName?.()||'').toLowerCase());
        const enabled=eligible&&!!api.stylingEnabled?.(),top=enabled&&!api.realTitlebar(),header=d.getElementById('rootMenu1'),inner=d.getElementById('rootMenu1Inner');
        const natural=inner?Math.max(0,inner.getBoundingClientRect().height-(root.classList.contains('tbui3-window-top-inset')?8:0)):0;
        const next=JSON.stringify([enabled,top,state.mode,api.themeName?.(),natural]);if(next===insetSignature)return;insetSignature=next;
        root.classList.remove('tbui3-window-top-inset');root.classList.toggle('tbui3-window-insets',enabled);
        if(top){
            const bounds=header?.getBoundingClientRect(),height=bounds?.height||natural||32,style=header&&w.getComputedStyle(header);
            const offset=header&&inner?inner.getBoundingClientRect().top-bounds.top-(parseFloat(style.paddingTop)||0)-(parseFloat(style.borderTopWidth)||0):0;
            root.style.setProperty('--tbui3-caption-row-height',height+'px');root.style.setProperty('--tbui3-caption-inner-offset',offset+'px');root.classList.add('tbui3-window-top-inset');
        }else{
            if(insetOriginal.height)root.style.setProperty('--tbui3-caption-row-height',insetOriginal.height,insetOriginal.priority);else root.style.removeProperty('--tbui3-caption-row-height');
            if(insetOriginal.offset)root.style.setProperty('--tbui3-caption-inner-offset',insetOriginal.offset,insetOriginal.offsetPriority);else root.style.removeProperty('--tbui3-caption-inner-offset');
        }
        resize();
    }
    function sourceButton(n,parent,compact=false,large=!!api.present?.({},n.id).large) {
        const meta=api.present?.({},n.id),baseCompact=compact||!!meta?.iconOnly;
        compact=baseCompact||state.simplified&&!!meta?.simplifiedIconOnly;
        const b=el('button','tbui3-ribbon-command'+(compact?' tbui3-ribbon-compact':large?' tbui3-ribbon-large':''));b.type='button';
        b.dataset.source=typeof n.id==='string'?n.id:'';b.title=label(n);b.setAttribute('aria-label',label(n));
        b.append(iconFor(n,{name:sourceCaption(n)}),el('span','tbui3-ribbon-label',sourceCaption(n)));
        b.addEventListener('mousedown',e=>e.preventDefault());
        b.onclick=e=>{invokeSource(n,e);tick();};parent.append(b);bindings.set(b,{source:n,large,compact:baseCompact});return b;
    }
    function park(n,parent) {
        if(!placements.has(n)){const marker=d.createComment('tbUI3IDE restore '+n.id);n.before(marker);placements.set(n,marker);}
        parent.append(n);
    }
    function returnNodes() {for(const [n,marker]of placements){if(marker.isConnected)marker.replaceWith(n);}placements.clear();}
    function addSources(ids,parent) {
        for(const id of ids){const n=sources.get(id);if(!n)continue;
            if(n.matches('select')){const l=el('label','tbui3-ribbon-selector');l.title=label(n);l.append(el('span',['zoomSelect','buildConfigSelector'].includes(id)?'tbui3-ribbon-caption-hidden':'',sourceCaption(n)));park(n,l);parent.append(l);}
            else sourceButton(n,parent,false,!!api.present?.({},id).large);
        }
    }
    function addGrid() {
        const n=d.getElementById('menuBarGridOptions');if(!n)return;
        const body=n.querySelector('.menuBarGridOptionsInner');if(body){const box=el('fieldset','tbui3-ribbon-grid'+(sources.has('menuBarGrid')?' tbui3-ribbon-grid-toggle-present':''));
            box.disabled=!(api.formGlobals&&api.formGlobals());park(body,box);const target=content.querySelector('.tbui3-ribbon-group[aria-label="Grid"] .tbui3-ribbon-group-body')||group('Grid');
            const holder=el('div','tbui3-grid-options-store');holder.hidden=true;holder.append(box);target.append(holder);
            const main=target.querySelector('[data-source="menuBarGrid"]'),source=sources.get('menuBarGrid');
            const split=el('div','tbui3-grid-split');split.setAttribute('role','group');split.setAttribute('aria-label','Grid');
            if(main){main.before(split);split.append(main);}else target.prepend(split);
            const arrow=el('button','tbui3-ribbon-command tbui3-grid-dropdown');arrow.type='button';arrow.title='Grid options';arrow.setAttribute('aria-label','Grid options');arrow.setAttribute('aria-haspopup','dialog');arrow.setAttribute('aria-expanded','false');arrow.append(iconFor(null,{_ribbonGlyph:'chevron_down'}));split.append(arrow);
            arrow.addEventListener('mousedown',e=>e.preventDefault());arrow.onclick=()=>{if(arrow.disabled||!state.simplified)return;if(popupAnchor===arrow)closePopup();else openGridOptions(arrow,box,holder);};
            const openWithKey=e=>{if(state.simplified&&e.key==='ArrowDown'&&(e.currentTarget===arrow||e.altKey)){e.preventDefault();if(!arrow.disabled)openGridOptions(arrow,box,holder);}};
            arrow.addEventListener('keydown',openWithKey);main?.addEventListener('keydown',openWithKey);bindings.set(arrow,{gridOptions:true,source});
            gridParts={box,holder,target,split,main};syncGridPresentation();
        }
    }
    function syncGridPresentation(){
        if(!gridParts)return;const {box,holder,target,split,main}=gridParts,simple=state.simplified;
        split.hidden=!simple;box.classList.toggle('tbui3-grid-inline',!simple);
        if(simple){if(main)split.prepend(main);holder.append(box);}
        else{if(main)split.before(main);target.append(box);}
    }
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
        const meta=api.present?.(item),baseCompact=!!meta?.iconOnly,iconOnly=baseCompact||state.simplified&&!!meta?.simplifiedIconOnly;
        const b=el('button','tbui3-ribbon-command'+(iconOnly?' tbui3-ribbon-compact':item._ribbonLarge?' tbui3-ribbon-large':''));b.type='button';
        const title=caption(item);
        b.setAttribute('aria-label',title);
        b.title=title+(typeof item.action==='string'?' '+api.shortcut(item.action):'');
        const shown=api.present?.(item).caption||(/^[^a-z]*[A-Z][^a-z]*$/.test(title)?title.charAt(0)+title.slice(1).toLowerCase():title);
        b.append(iconFor(sources.get(item._ribbonIconSource),item),el('span','tbui3-ribbon-label',shown));
        b.addEventListener('mousedown',e=>e.preventDefault());
        bindings.set(b,{item,large:!!item._ribbonLarge,compact:baseCompact});parent.append(b);
        if(item.comboOptions){
            const select=el('select','tbui3-ribbon-select');select.setAttribute('aria-label',title);
            for(const value of item.comboOptions){const o=el('option','',value);o.value=value;o.selected=value===item.comboValue;select.append(o);}
            select.onchange=()=>{if(menuEnabled(item)&&item.onchange)item.onchange(select.value);};
            b.replaceWith(select);bindings.delete(b);bindings.set(select,{item});return;
        }
        if(item.hoverAction||item._ribbonChildren){b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.classList.add('tbui3-ribbon-dropdown');const chevron=iconFor(null,{_ribbonGlyph:'chevron_down'});chevron.classList.add('tbui3-ribbon-chevron');b.append(chevron);}
        b.onclick=()=>{
            if(!menuEnabled(item))return;
            if(item.action){
                closeFile(false);closePopup();
                if(typeof item.action==='string')api.execute(item.action);else item.action(item);
                tick();
            }else if(item.hoverAction||item._ribbonChildren){if(popupAnchor===b)closePopup();else openSubmenu(item,b);}
        };
    }
    function createPopup(anchor,extraClass='',role='menu') {
        closePopup();popupAnchor=anchor;anchor.setAttribute('aria-expanded','true');popup=el('div','tbui3-toolbar-owned tbui3-ribbon-popup'+(extraClass?' '+extraClass:''));popup.setAttribute('role',role);
        const bounds=anchor.getBoundingClientRect();popup.style.setProperty('--tbui3-popup-x',Math.min(bounds.left,w.innerWidth-280)+'px');
        popup.style.setProperty('--tbui3-popup-y',Math.min(bounds.bottom,w.innerHeight-200)+'px');d.body.append(popup);
        const surface=popup;surface.addEventListener('toggle',event=>{if(event.newState==='closed'&&popup===surface)closePopup();});
        // Top-layer promotion escapes the IDE designer's million-level controls
        // and 99,999,999 grabbers without hiding or reparenting the designer.
        if(typeof popup.showPopover==='function'){
            popup.setAttribute('popover','auto');
            try{popup.showPopover();popup.dataset.popupLayer='top';}
            catch(e){popup.removeAttribute('popover');popup.dataset.popupLayer='fallback';}
        }else popup.dataset.popupLayer='fallback';
        return popup;
    }
    function openGridOptions(anchor,box,holder){
        const surface=createPopup(anchor,'tbui3-grid-flyout','dialog');surface.setAttribute('aria-label','Grid options');
        gridFlyout={box,holder};surface.append(box);syncBindings();
        box.querySelector('input:not(.optionGridShow):not(:disabled),select:not(:disabled),button:not(:disabled)')?.focus();
    }
    function openSubmenu(item,anchor) {
        const surface=createPopup(anchor);
        const sink=items=>{if(popup!==surface)return;clear(popup);for(const child of menuItems(items))command(child,popup);syncBindings();popup.querySelector('button,select')?.focus();};
        if(item._ribbonChildren){sink(item._ribbonChildren);return;}
        captureSink=sink;pendingSubmenu={sink,until:Date.now()+5000};
        try{item.hoverAction(anchor);}finally{captureSink=null;}
    }
    function closePopup(){pendingSubmenu=null;if(gridFlyout){const {box,holder}=gridFlyout;gridFlyout=null;holder.append(box);}if(popup){for(const n of popup.querySelectorAll('button,select'))bindings.delete(n);if(popup.dataset.popupLayer==='top'&&typeof popup.hidePopover==='function'){try{popup.hidePopover();}catch(e){}}popup.remove();popup=null;}if(popupAnchor?.isConnected)popupAnchor.setAttribute('aria-expanded','false');popupAnchor=null;}
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
    function expandedItems(m,item,kind){
        if(!api.captureMenu||!item.hoverAction)return null;
        const key=m.node.id+'|'+item.name;
        let entry=expandedMenus.get(key);
        if(!entry){entry={items:[],ready:false,epoch:-1};expandedMenus.set(key,entry);}
        if(entry.loading&&Date.now()-entry.started>5000){entry.loading=false;entry.failed=true;}
        const active=state.active===(kind==='Insert'?'Insert':'Form');
        if(!entry.loading&&(!entry.ready||active)&&entry.epoch!==menuEpoch&&!item.isHidden){
            entry.loading=true;entry.started=Date.now();entry.epoch=menuEpoch;entry.failed=false;
            const accepted=api.captureMenu(item,m.node,items=>{
                if(state.mode!=='Ribbon'||expandedMenus.get(key)!==entry)return;
                entry.items=items;entry.ready=true;entry.loading=false;
                if(!collectingLayout&&!hydrating)refreshLayout();
            },kind);
            if(!accepted){entry.loading=false;entry.failed=true;}
        }
        if(!entry.ready)return null;
        return menuItems(entry.items).filter(i=>i.name).map(child=>({...child,
            isHidden:!!(item.isHidden||child.isHidden),
            context:item.context&&child.context?'('+item.context+') && ('+child.context+')':child.context||item.context}));
    }
    function collectLayout() {
        const records=[];collectingLayout=true;
        try{for(const m of menus.values())for(const item of menuItems(m.items)){
            const name=String(item.name||''),kind=m.node.id==='rootMenuProject'&&name.includes('MenuCaptionProjectAdd')?'Insert':
                m.node.id==='rootMenuFormat'&&/MenuCaptionFormat(?:Align|MakeSameSize)/.test(name)?'Form':null;
            const expanded=kind&&expandedItems(m,item,kind);
            if(expanded){for(const child of expanded){
                if(kind==='Insert'){const a=typeof child.action==='string'?child.action:'';
                    const group=/Resource/.test(a)?'Resources':/AddModule|AddClass/.test(a)?'Code':/AddFolder|OtherFile|ImportFile/.test(a)?'Files':a&&/Form|Control|Report|PropertyPage/.test(a)||typeof child.action==='function'?'Forms':'Components';
                    records.push({item:{...child,_ribbonTab:'Insert',_ribbonGroup:group}});
                }else{const source=[...sources.values()].find(n=>[].concat(n.boundCommand||[]).includes(child.action));
                    records.push({menuId:m.node.id,menuTitle:m.title,item:{...child,...(source?{_sourceId:source.id}:{})}});}
            }}else records.push({menuId:m.node.id,menuTitle:m.title,item});
        }}finally{collectingLayout=false;}
        const source=(id,tab,group)=>{if(sources.has(id))records.push({item:{name:sourceCaption(sources.get(id)),_sourceId:id,_ribbonTab:tab,_ribbonGroup:group}});};
        for(const id of ['commentIcon','uncommentIcon'])source(id,'Code','Comments');
        source('designSwitchIcon','Code','Document');source('designSwitchIcon','Form','Document');
        source('buildConfigSelector','Project','Build');source('debugStepOutIcon','Debug','Stepping');
        source('zoomSelect','View','Zoom');source('menuBarPreview','Form','Designer');source('menuBarGrid','Form','Grid');
        if(!records.some(r=>String(r.item.name).includes('MenuCaptionWindowTheme')))source('menuBarColorMode','View','Appearance');
        const quickActions=new Set();for(const id of quickIds)for(const a of [].concat(sources.get(id)?.boundCommand||[]))if(a!=='tbBuild_Start')quickActions.add(a);
        return api.buildLayout(records,quickActions,api.present);
    }
    function hydrateMenus(refresh=false) {
        if(refresh)menuEpoch++;hydrating=true;try{for(const m of menus.values())if(!m.ready||refresh&&(m.node.id!=='rootMenuAddins'||backstage&&!backstage.hidden&&fileSection==='Add-ins'))requestMenu(m);}finally{hydrating=false;}
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
        // Menu-state polling must not tear native inputs out from under an edit.
        // Selection/mode/tab changes close the flyout through their normal paths.
        if(gridFlyout)return;
        const tab=layout.tabs.find(t=>t.id===state.active);
        const sig=JSON.stringify([state.active,tab?.groups.map(g=>[g.title,g.items.map(itemKey)]),!!currentHost()]);
        if(sig===menuSignature)return;menuSignature=sig;clearContent();
        if(state.active==='Add-ins')addins(content,true);
        else if(tab)for(const g of tab.groups){const body=group(g.title);for(const i of g.items)command(i,body);}
        if(state.active==='Form'){addGrid();addMultiPageContext();}
        for(const b of tabs.children){const selected=b.dataset.tab===state.active;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}
        syncBindings();resize();
    }
    function addMultiPageContext(){
        if(!currentHost()||!pageIds.some(id=>sources.has('addinButton-'+id)))return;
        const body=group('MultiPage');
        for(const ids of [pageIds.slice(0,2),pageIds.slice(2,4),pageIds.slice(4)]){
            const nodes=ids.map(id=>sources.get('addinButton-'+id)).filter(Boolean);if(!nodes.length)continue;
            if(body.children.length){const divider=el('div','tbui3-ribbon-group-divider');divider.setAttribute('role','separator');divider.setAttribute('aria-orientation','vertical');body.append(divider);}
            for(const n of nodes)sourceButton(n,body);
        }
        const grid=content.querySelector('.tbui3-ribbon-group[aria-label="Grid"]');
        if(grid)grid.after(body.parentElement);
    }
    function tabForNative(m){
        if(m.node.id==='rootMenuFile'||m.node.id==='rootMenuAddins')return 'File';
        return {rootMenuEdit:'Home',rootMenuFormat:'Form',rootMenuView:'View',rootMenuWindows:'View',rootMenuProject:'Project',rootMenuRun:'Debug',rootMenuDebug:'Debug',rootMenuTools:'Project',rootMenuHelp:'File'}[m.node.id]||m.title;
    }
    function clearContent(){closePopup();returnNodes();gridParts=null;for(const [n]of bindings)if(content.contains(n))bindings.delete(n);clear(content);}
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
            if(['Code','Form'].includes(key)){const body=group('Document');command({name:'Save Document',action:'tbEditor_Save',_ribbonLarge:true},body);addSources(['designSwitchIcon'],body);}
            if(known[key]){for(const [name,ids]of known[key])addSources(ids,group(name));if(key==='Form'){addGrid();addMultiPageContext();}}
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
        if(!backstage)return;closePopup();
        if(backstage.hidden)savedFocus=d.activeElement;
        fileSection=section==='File'?'Info':section==='Addins'?'Add-ins':section;
        backstage.hidden=false;syncQuick();syncFileUnderlays();
        renderFileNav();renderFile();fileNav.querySelector('button')?.focus();
    }
    function renderFileNav() {
        const sig=JSON.stringify([fileSection,[...(layout?.file||[])].map(([name,items])=>[name,items.map(itemKey)])]);
        if(sig===fileNavSignature)return;fileNavSignature=sig;
        for(const [n]of bindings)if(fileNav.contains(n))bindings.delete(n);clear(fileNav);
        const back=el('button','tbui3-backstage-back');const circle=el('span','tbui3-backstage-back-circle');circle.setAttribute('aria-hidden','true');circle.append(iconFor(null,{_ribbonGlyph:'arrow_left'}));back.append(circle);back.title='Back to project';back.setAttribute('aria-label','Back to project');back.onclick=()=>closeFile();fileNav.append(back);
        const main=el('div','tbui3-backstage-nav-group'),footer=el('div','tbui3-backstage-nav-group tbui3-backstage-footer');fileNav.append(main,footer);
        const add=(title,section,parent=main,direct=false)=>{
            const entries=layout?.file.get(section)||[],item=entries.find(menuEnabled)||entries[0];
            if(section!=='Info'&&section!=='Add-ins'&&!entries.length)return;
            const b=el('button','tbui3-backstage-nav');
            const icon={Info:'segoe/E946',New:'segoe/ECC8',Open:'segoe/E838',Save:'segoe/E74E','Save as':'segoe/E792',Export:'segoe/EDE1',Close:'fluent/share_screen_stop',
                'Add-ins':'fluent/text_bullet_list_square_settings',Help:'fluent/question_circle',Options:'fluent/options',Exit:'fluent/arrow_exit'}[section];
            b.append(iconFor(null,icon?{_ribbonIcon:icon}:item||{}),el('span','',title));b.type='button';b.dataset.fileSection=section;
            if(direct&&item){b.title=caption(item);bindings.set(b,{item});b.onclick=()=>activateItem(item,b);}
            else{b.onclick=()=>{fileSection=section;renderFile();renderFileNav();};
                if(fileSection===section){b.classList.add('tbui3-backstage-selected');b.setAttribute('aria-current','page');}}
            parent.append(b);
        };
        add('Info','Info');add('New','New',main,true);add('Open','Open');
        const divider=el('hr','tbui3-backstage-divider');divider.setAttribute('role','separator');main.append(divider);
        add('Save','Save',main,true);add('Save as','Save as',main,true);add('Export','Export');add('Close project','Close',main,true);
        if(layout?.file.has('More'))add('More commands','More');
        add('Add-ins','Add-ins',footer);add('Help','Help',footer);add('Options','Options',footer);add('Exit','Exit',footer,true);
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
        for(const original of list){const item=fileSection==='Add-ins'?{...original,_ribbonIcon:'fluent/puzzle_piece'}:original;const row=el('div','tbui3-backstage-task');
            command(unsupported&&typeof item.action==='function'&&String(item.action).includes('notSupportedMenuOption')?{...item,isHidden:true,_ribbonLarge:false}:{...item,_ribbonLarge:false},row);tasks.append(row);
        }
        if(!list.length&&fileSection==='Add-ins')fileContent.append(el('p','tbui3-backstage-description',menus.get('rootMenuAddins')?.loading?'Loading add-ins...':'No add-ins are listed by the IDE.'));
        syncBindings();
    }
    function closeFile(restoreFocus=true){if(backstage&&!backstage.hidden){closePopup();backstage.hidden=true;syncQuick();restoreFileUnderlays();if(restoreFocus&&savedFocus?.isConnected)savedFocus.focus();}}
    function syncBindings(){sizeLabels();for(const box of d.querySelectorAll('.tbui3-ribbon-grid'))box.disabled=!(api.formGlobals&&api.formGlobals());for(const [b,entry]of bindings){
        const grid=entry.gridOptions||entry.source?.id==='menuBarGrid';
        const on=grid?!!(api.formGlobals&&api.formGlobals())&&(!entry.source||!disabled(entry.source)):entry.source?sourceEnabled(entry.source):menuEnabled(entry.item);b.disabled=!on;b.setAttribute('aria-disabled',String(!on));
            if(entry.gridOptions){b.hidden=!!entry.source&&!visible(entry.source);if((!on||b.hidden)&&popupAnchor===b)closePopup();continue;}
            const isChecked=entry.source?entry.source.classList.contains('menuBarToggleOn'):checked(entry.item);
            b.classList.toggle('tbui3-ribbon-checked',isChecked);b.setAttribute('aria-pressed',String(isChecked));
            if(entry.source){b.title=label(entry.source);b.hidden=!visible(entry.source);}
    }}
    function syncQuick(){
        if(!quick)return;quick.hidden=!!(backstage&&!backstage.hidden);const parent=d.getElementById('rootMenu1Inner');
        if(parent&&quick.parentElement!==parent)parent.prepend(quick);
        quick.classList.toggle('tbui3-quick-real-titlebar',!!api.realTitlebar());
        const themeName=String(api.themeName?.()||'').trim().toLowerCase();
        const showLogo=!api.realTitlebar()&&['winui3 dark','winui3 light'].includes(themeName)&&!!api.brandImage;
        let logo=quick.querySelector('.tbui3-quick-logo');
        if(showLogo&&!logo){logo=el('img','tbui3-quick-logo');logo.src=api.brandImage;logo.alt='twinBASIC WinUI3';logo.draggable=false;quick.prepend(logo);}
        if(logo)logo.hidden=!showLogo;
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
    function syncRibbonTheme(){
        const name=String(api.themeName?.()||'').trim().toLowerCase();
        shell?.classList.toggle('tbui3-ribbon-winui',['winui3 dark','winui3 light'].includes(name));
    }
    function syncRibbonStyle(){
        if(!shell)return;
        syncRibbonTheme();
        const simple=state.mode!=='Classic'&&state.simplified;
        shell.classList.toggle('tbui3-ribbon-simplified',simple);
        for(const [b,entry]of bindings)if(content.contains(b)&&b.tagName==='BUTTON'&&!entry.gridOptions){
            const meta=entry.source?api.present?.({},entry.source.id):api.present?.(entry.item),compact=entry.compact||simple&&meta?.simplifiedIconOnly;
            b.classList.toggle('tbui3-ribbon-compact',!!compact);b.classList.toggle('tbui3-ribbon-large',!!entry.large&&!compact);
        }
        syncGridPresentation();
        if(ribbonToggle){
            ribbonToggle.title=simple?'Switch to Full Ribbon':'Switch to Simplified Ribbon';
            ribbonToggle.setAttribute('aria-label',ribbonToggle.title);
            ribbonToggle.setAttribute('aria-pressed',String(simple));
            ribbonToggle.setAttribute('aria-expanded',String(!simple));
        }
    }
    function setSimplified(value,dirty=false){
        value=!!value;const changed=state.simplified!==value;state.simplified=value;
        if(changed&&dirty)state.simplifiedDirty=true;
        if(state.mode!=='Classic'&&content){
            closePopup();content.hidden=false;
            for(const b of content.querySelectorAll('.tbui3-ribbon-large'))b.style.removeProperty('width');
            syncRibbonStyle();sizeLabels();resize();
        }
        return state.simplified;
    }
    function scrollSimplified(e){
        if(state.mode==='Classic'||!state.simplified||content.scrollWidth<=content.clientWidth||
            e.target.closest('input,select')||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
        const before=content.scrollLeft;content.scrollLeft+=e.deltaY;
        if(content.scrollLeft!==before){e.preventDefault();closePopup();}
    }
    function restore() {
        clearClassic();
        closePopup();closeFile(false);returnNodes();gridParts=null;bindings.clear();
        for(const m of menus.values())m.node.classList.remove('tbui3-menu-source');
        for(const n of hiddenNative)n.classList.remove('tbui3-toolbar-native-hidden');hiddenNative.clear();pendingMenus.clear();
        if(shell)shell.remove();if(quick)quick.remove();if(backstage)backstage.remove();
        shell=tabs=content=quick=backstage=fileNav=fileContent=ribbonToggle=null;
        signature='';menuSignature='';fileNavSignature='';fileRenderSignature='';layout=null;expandedMenus.clear();editorBaseline=false;lastEditorNode=lastEditorKind=undefined;resize();
    }
    function build() {
        const toolbar=discover(),root=d.getElementById('root'),top=d.getElementById('rootTop');
        if(!root||!top)throw Error('IDE root layout is unavailable');
        shell=el('div','tbui3-toolbar-owned tbui3-ribbon');shell.setAttribute('aria-label','IDE ribbon');
        tabs=el('div','tbui3-ribbon-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','IDE tools');
        content=el('div','tbui3-ribbon-content');content.setAttribute('role','tabpanel');shell.append(tabs,content);top.before(shell);
        toolbar.classList.add('tbui3-toolbar-native-hidden');
        shell.classList.add('tbui3-ribbon-has-toggle');content.id='tbUI3RibbonCommands';
        ribbonToggle=el('button','tbui3-ribbon-toggle');ribbonToggle.type='button';
        ribbonToggle.setAttribute('aria-controls',content.id);ribbonToggle.append(iconFor(null,{_ribbonGlyph:'chevron_down'}));
        ribbonToggle.onclick=()=>setSimplified(!state.simplified,true);shell.append(ribbonToggle);
        content.addEventListener('wheel',scrollSimplified,{passive:false});
        content.addEventListener('focusin',e=>{if(state.simplified)e.target.scrollIntoView?.({block:'nearest',inline:'nearest'});});
        if(state.mode==='Ribbon'){
            quick=el('div','tbui3-toolbar-owned tbui3-quick');quick.setAttribute('role','toolbar');quick.setAttribute('aria-label','Quick access');
            for(const id of quickIds)if(sources.has(id))sourceButton(sources.get(id),quick,true);syncQuick();
            backstage=el('div','tbui3-toolbar-owned tbui3-backstage');backstage.hidden=true;backstage.setAttribute('role','dialog');
            backstage.setAttribute('aria-modal','true');backstage.setAttribute('aria-label','File');
            fileNav=el('nav','tbui3-backstage-rail');fileContent=el('div','tbui3-backstage-content');backstage.append(fileNav,fileContent);root.append(backstage);
        }
        syncRibbonStyle();signature=currentSignature();renderTabs();syncEditorTab(true);
    }
    function currentSignature(){return JSON.stringify([state.mode,[...sources.values()].map(n=>[n.id,n.title,n.style.backgroundImage]),[...menus.values()].map(m=>[m.node.id,m.title]),!!currentHost()]);}
    function syncEditorTab(initial=false){
        if(!api.editorState||backstage&&!backstage.hidden)return;
        const current=api.editorState(),node=current&&current.node,kind=current&&current.kind;
        const changed=editorBaseline&&(node!==lastEditorNode||kind!==lastEditorKind);
        lastEditorNode=node;lastEditorKind=kind;editorBaseline=true;
        if(!initial&&changed&&['Code','Form'].includes(kind)&&[...tabs.children].some(t=>t.dataset.tab===kind))selectTab(kind);
    }
    function tick(){
        if(state.disposed)return;
        try{
            syncOptions();api.syncAppearance?.();syncWindowInsets();syncRibbonTheme();if(state.mode==='Classic'){syncClassic();return;}
            discover();const next=currentSignature();if(next!==signature){signature=next;menuSignature='';renderTabs();}
            syncEditorTab();syncBindings();syncQuick();
            if(backstage&&!backstage.hidden)syncFileUnderlays();
            if(state.mode==='Ribbon'&&Date.now()>refreshAt){refreshAt=Date.now()+1000;hydrateMenus(true);}
        }catch(e){fail(e);}
    }
    function setMode(mode,dirty=false){
        if(!modes.includes(mode))mode='Classic';
        state.requestedMode=mode;
        if(state.mode!==mode||mode!=='Classic'&&!shell){restore();state.mode=mode;state.active='Home';
            try{if(mode!=='Classic')build();}catch(e){fail(e);}}
        if(mode==='Classic')syncClassic();syncWindowInsets();if(dirty)state.dirty=true;syncOptions();return state.mode;
    }
    function keydown(e){
        if(state.mode==='Classic')return;
        if(e.key==='Escape'&&popup){e.preventDefault();e.stopImmediatePropagation();const anchor=popupAnchor;closePopup();anchor?.focus();return;}
        if(backstage&&!backstage.hidden){
            if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeFile();}
            else if(e.key==='Tab'){const nodes=[...backstage.querySelectorAll('button:not(:disabled),select:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);
                if(e.shiftKey&&d.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first?.focus();}}
            return;
        }
        if(e.ctrlKey&&e.key==='F1'){e.preventDefault();setSimplified(!state.simplified,true);return;}
        const b=e.target.closest&&e.target.closest('.tbui3-ribbon-tab');if(!b||!tabs.contains(b))return;
        const items=[...tabs.children];let i=items.indexOf(b);
        if(e.key==='ArrowRight')i=(i+1)%items.length;else if(e.key==='ArrowLeft')i=(i+items.length-1)%items.length;
        else if(e.key==='Home')i=0;else if(e.key==='End')i=items.length-1;else return;
        e.preventDefault();e.stopImmediatePropagation();items[i].focus();items[i].click();
    }
    function pointerdown(e){if(popup&&!popup.contains(e.target)&&!popupAnchor?.contains(e.target))closePopup();}
    function blur(){closePopup();}
    function install(mode='Classic') {
        d.fonts?.addEventListener('loadingdone',fontsChanged);
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
        api.setShowContextMenu(wrappedMenu);d.addEventListener('keydown',keydown,true);w.addEventListener('pointerdown',pointerdown,true);w.addEventListener('mousedown',pointerdown,true);w.addEventListener('blur',blur);
        interval=w.setInterval(tick,400);setMode(mode);return state;
    }
    function dispose(){state.disposed=true;w.clearInterval(interval);restore();clearWindowInsets();resize();
        d.fonts?.removeEventListener('loadingdone',fontsChanged);labelWidths.clear();
        if(api.getShowContextMenu()===wrappedMenu)api.setShowContextMenu(nativeMenu);
        d.removeEventListener('keydown',keydown,true);w.removeEventListener('pointerdown',pointerdown,true);w.removeEventListener('mousedown',pointerdown,true);w.removeEventListener('blur',blur);
        for(const n of d.querySelectorAll('.tbui3-toolbar-option'))n.remove();
    }
    return Object.assign(state,{install,setMode,setSimplified,tick,dispose,openFile,closeFile,discover});
})
