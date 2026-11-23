/* tbUI3IDE Welcome view. All controls are authored with the shared WinUI runtime
 * and Master CSS in an isolated iframe document; native host retains all authority.
 * Full shared control implementation is in controls.js, not duplicated here.
 */
(function (global) {
  'use strict';
  const PAGES = ['Welcome', 'Updates', 'Themes', 'Toolbar', 'Features', 'Finish'];
  const FEATURED_THEMES = ['WinUI3 Light','WinUI3 Dark'];
  const TOOLBARS = ['Classic','Hybrid','Ribbon'];
  const ALLOW = new Set(['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']);
  const isObject = x => x !== null && typeof x === 'object';
  const text = x => typeof x === 'string' ? x : '';
  const snapshotMode = x => text(x && x.theme).toLowerCase().includes('dark') ? 'dark' : 'light';

  function createWelcomeWizard(options) {
    if (!options || !options.document || !options.mount || typeof options.send !== 'function')
      throw new TypeError('Welcome Wizard requires document, mount and send(action) adapter.');
    if (!options.assets || !options.assets.masterCss || !options.assets.controlsJs || !options.assets.welcomeCss)
      throw new TypeError('Welcome Wizard requires embedded Master CSS, shared controls JS and Welcome layout CSS.');
    const doc = options.document, host=options.mount, assets=options.assets;
    let frame=null, hostStyles=null, inner=null, app=null, status=null, snap={}, step=0, open=false, dead=false;
    let waiting=new Set(), changed=new Map(), message='', priorFocus=null, preview=null, loaded=false;
    // Preview-only appearance, never sent to native services or persisted.
    let previewAppearance=null;
    const instance = options.source || 'manual';
    function dom(tag, cls, label, parent) {
      const e=inner.createElement(tag);
      if(cls)e.className=cls;
      if(label!==undefined)e.textContent=label;
      if(parent)parent.appendChild(e);
      return e;
    }
    function button(parent,title,run,appearance,extra) {
      const item=dom('winui-button',extra||'',title,parent);
      if(appearance)item.setAttribute('appearance',appearance);
      item.addEventListener('click',run);
      return item;
    }
    function info(parent,title,detail,kind) {
      const e=dom('winui-info-bar','',undefined,parent);
      e.setAttribute('open','');e.setAttribute('title',title);e.setAttribute('message',detail);
      e.setAttribute('severity',kind||'informational');e.setAttribute('not-closable','');
      return e;
    }
    function heading(parent,title,desc) {
      const h=dom('h2','welcome-heading',title,parent);h.tabIndex=-1;
      dom('p','welcome-description',desc,parent);return h;
    }
    function actual(name) { const p=snap.preferences||{};return name==='theme'?snap.theme:name==='toolbar'?snap.toolbar:p[name]; }
    function choice(name,value) {return changed.has(name)?changed.get(name):actual(name);}
    function dispatch(action,params) {
      if(dead || !ALLOW.has(action) || waiting.has(action))return false;
      waiting.add(action);
      try { options.send(Object.assign({action},params||{}));return true; }
      catch(error) {
        waiting.delete(action);changed.clear();
        message='Could not send request: '+(error && error.message || String(error));
        paint();return false;
      }
    }
    function commit(name,value,action,param) {
      changed.set(name,value);
      if(!dispatch(action,{[param]:value}))changed.delete(name);
      paint();
    }
    function settle(value) {
      if(dead || !isObject(value))return;
      snap=value;waiting.clear();changed.clear();
      if(value.message!==undefined)message=typeof value.message==='string'?value.message:text(value.message && (value.message.message||value.message.text));
      if(preview && (!installedThemes().some(theme=>theme.name===preview) || (value.theme!==preview && !changed.has('theme'))))preview=null;
      paint();
    }
    function style(container,css) {
      const e=inner.createElement('style');e.textContent=css;container.appendChild(e);
    }
    function installToolkit() {
      inner=frame.contentDocument;
      if(!inner)throw new Error('Welcome iframe document is unavailable');
      // Full Toolkit CSS owns all component visuals. Welcome CSS defines layout only.
      style(inner.head,assets.masterCss);
      style(inner.head,assets.welcomeCss);
      inner.documentElement.setAttribute('data-theme',snapshotMode(snap));
      const script=inner.createElement('script');script.textContent=assets.controlsJs;inner.head.appendChild(script);
      if(!inner.defaultView || !inner.defaultView.WinUIControls)
        throw new Error('Shared WinUI controls failed to initialize in the isolated document.');
      app=dom('div','welcome-app',undefined,inner.body);
      loaded=true;
      inner.addEventListener('keydown',event=>{if(open&&event.key==='Escape'){event.preventDefault();dismiss('dismissed');}});
    }
    function setup() {
      // Layout CSS is scoped by class; its frame sizing rule must also reach
      // the native dialog document. The complete Master CSS never enters it.
      hostStyles=doc.createElement('style');
      hostStyles.textContent=assets.welcomeCss;
      host.appendChild(hostStyles);
      frame=doc.createElement('iframe');
      frame.className='tbw-isolated-frame';frame.title='Welcome to tbUI3IDE';
      frame.setAttribute('aria-label','Welcome to tbUI3IDE');
      frame.setAttribute('referrerpolicy','no-referrer');
      frame.setAttribute('scrolling','no');
      frame.srcdoc='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>';
      frame.addEventListener('load',()=>{
        if(dead)return;
        try {installToolkit();paint();}
        catch(error){loaded=false;message='Welcome controls are unavailable: '+(error&&error.message||String(error));frame.title=message;}
      },{once:true});
      host.appendChild(frame);
    }
    function installedThemes() {
      // A theme is selectable only if enumerated by the authoritative IDE snapshot.
      // Legacy native snapshots contain only the two bundled themes, if present.
      const list=Array.isArray(snap.installedThemes)?snap.installedThemes:[];
      const byName=new Map();
      for(const item of list) {
        const name=typeof item==='string'?item:text(item && item.name);
        if(!name || byName.has(name) || name.length>160)continue;
        byName.set(name,typeof item==='string'?{name}:item);
      }
      // Current native theme remains discoverable even before enumeration completes,
      // but it is never added to the change-menu unless the host lists it.
      return [...byName.values()].sort((a,b)=>{
        const first=FEATURED_THEMES.indexOf(a.name),second=FEATURED_THEMES.indexOf(b.name);
        return (first<0?2:first)-(second<0?2:second) || a.name.localeCompare(b.name);
      });
    }
    function themeMode(item) {
      if(item && (item.mode==='dark' || item.mode==='light'))return item.mode;
      if(item && FEATURED_THEMES.includes(item.name))return item.name==='WinUI3 Dark'?'dark':'light';
      return null;
    }
    // The host resolves the .theme inheritance chain and precedence before
    // providing sanitized paint values. Raw .theme CSS is never evaluated here.
    const COLOR_FIELDS = ['background','surface','foreground','accent','titlebar','toolbar','panel','editor','muted','border'];
    function themePalette(item) {
      const raw=item && item.preview;
      if(!isObject(raw))return null;
      const color=v=>typeof v==='string' && /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(v);
      const base=['background','surface','foreground','accent'];
      if(!base.every(key=>color(raw[key])))return null;
      const palette={};
      for(const key of COLOR_FIELDS)if(color(raw[key]))palette[key]=raw[key];
      return palette;
    }
    function paletteTheme() {
      const selected=installedThemes().find(item=>item.name===choice('theme')) ||
        installedThemes().find(item=>item.name===snap.theme);
      return selected || null;
    }
    function miniIde(parent,item,mode) {
      const palette=themePalette(item);
      const kind=themeMode(item);
      const outer=dom('div','welcome-mini-ide'+(kind?' welcome-theme-'+kind:''),undefined,parent);
      outer.setAttribute('aria-hidden','true');
      if(!palette && (!item || !FEATURED_THEMES.includes(item.name))) {
        dom('span','welcome-preview-empty','Theme palette unavailable',outer);
        return outer;
      }
      if(palette){
        const cssMap={background:'--mini-bg',surface:'--mini-surface',foreground:'--mini-text',
          accent:'--mini-accent',titlebar:'--mini-title',toolbar:'--mini-toolbar',
          panel:'--mini-panel',editor:'--mini-editor',muted:'--mini-muted',border:'--mini-border'};
        for(const key of Object.keys(cssMap))if(palette[key])outer.style.setProperty(cssMap[key],palette[key]);
      }
      const head=dom('div','welcome-mini-title',undefined,outer);
      dom('span','welcome-mini-title-name','twinBASIC',head);
      dom('span','welcome-mini-caption','×',head);
      const command=dom('div','welcome-mini-command welcome-mini-'+(mode||'Classic').toLowerCase(),undefined,outer);
      if(mode==='Hybrid'||mode==='Ribbon'){
        const tabs=dom('div','welcome-mini-tabs',undefined,command);
        for(const name of mode==='Ribbon'?['Home','Code','Forms']:['File','Edit','View']){
          dom('span','welcome-mini-tab',name,tabs);
        }
      }
      if(mode==='Classic'){
        const menus=dom('div','welcome-mini-tabs',undefined,command);
        for(const name of ['File','Edit','View'])dom('span','welcome-mini-tab',name,menus);
      }
      const tools=dom('div','welcome-mini-tools',undefined,command);
      const count=mode==='Ribbon'?4:mode==='Hybrid'?5:6;
      for(let i=0;i<count;i++){
        const tool=dom('span','welcome-mini-tool'+(i===0?' primary':''),undefined,tools);
        if(mode==='Ribbon' && i<2)dom('i','welcome-mini-tool-label',undefined,tool);
      }
      const area=dom('div','welcome-mini-work',undefined,outer);
      dom('span','welcome-mini-explorer',undefined,area);
      const editor=dom('div','welcome-mini-editor',undefined,area);
      for(const width of ['72%','56%','78%']){
        const line=dom('span','welcome-mini-code',undefined,editor);
        line.style.width=width;
      }
      return outer;
    }
    function previewTile(parent,item) {
      return miniIde(parent,item,'Classic');
    }
    function chooseTheme(parent) {
      heading(parent,'Choose your appearance','Select a theme to preview its palette and apply it to twinBASIC. The IDE confirms the change.');
      const listed=installedThemes();
      const renderGroup=(title,entries,featuredGroup)=>{
        if(!entries.length)return;
        dom('h3','welcome-subheading',title,parent);
        const list=dom('div','welcome-theme-grid'+(featuredGroup?' welcome-theme-featured':''),undefined,parent);
        for(const item of entries) {
          // A single accessible tile both previews and requests the native selection.
          const block=dom('button','welcome-choice welcome-theme-card'+(choice('theme')===item.name?' welcome-theme-selected':''),undefined,list);
          block.type='button';
          block.setAttribute('aria-label','Select '+item.name+' theme');
          block.setAttribute('aria-pressed',String(choice('theme')===item.name));
          if(waiting.has('choose-theme'))block.disabled=true;
          previewTile(block,item);
          dom('strong','welcome-theme-name',item.name,block);
          if(item.name===snap.theme)dom('span','welcome-theme-current','Current theme',block);
          block.addEventListener('click',()=>{
            preview=item.name;
            commit('theme',item.name,'choose-theme','name');
          });
        }
      };
      renderGroup('Featured WinUI3 themes',listed.filter(item=>FEATURED_THEMES.includes(item.name)),true);
      renderGroup('Other installed themes',listed.filter(item=>!FEATURED_THEMES.includes(item.name)),false);
      if(!listed.length)info(parent,'Theme list unavailable','The native IDE has not supplied its installed theme inventory. No theme can be selected safely.','warning');
      else if(!listed.some(item=>FEATURED_THEMES.includes(item.name)))info(parent,'WinUI3 themes not installed','These themes will appear when installed and reported by the IDE.');
      dom('p','welcome-note','Click any tile to select it. Its preview is local; the actual IDE theme changes only after native confirmation.',parent);
    }
    function setPreference(parent,name,title,desc) {
      const row=dom('winui-settings-row','',undefined,parent);
      row.setAttribute('header',title);row.setAttribute('description',desc);
      const sw=dom('winui-toggle-switch','',undefined,row);
      sw.setAttribute('aria-label',title);
      if(choice(name)===true)sw.setAttribute('is-on','');
      if(waiting.has('installation-preferences'))sw.setAttribute('disabled','');
      // The shared runtime generates the actual ToggleSwitch control and events.
      sw.addEventListener('toggled',event=>{
        if(waiting.has('installation-preferences'))return;
        commit(name,Boolean(event.detail && event.detail.isOn),'installation-preferences',name);
      });
    }
    function updates(parent) {
      heading(parent,'Updates on your terms','Let the updater check published releases while you decide when to install.');
      const rows=dom('div','settings-list',undefined,parent);
      setPreference(rows,'automatic','Check automatically','Manual checks stay available even when automatic checks are off.');
      setPreference(rows,'restart','Restart after approved update','Restart this IDE after a successful update, when appropriate.');
      dom('p','welcome-note','Automatic checks never authorize downloading or installing an IDE update. Your approval is always required.',parent);
    }
    function toolbar(parent) {
      heading(parent,'Choose your toolbar','Select a layout. These compact previews use the currently selected IDE theme.');
      const grid=dom('div','welcome-choice-grid welcome-toolbar-grid',undefined,parent);
      const descriptions={
        Classic:'Original menus and compact toolbar.',
        Hybrid:'Menus with modern command groups.',
        Ribbon:'Tabbed commands and Quick Access.'
      };
      const selectedTheme=paletteTheme();
      for(const name of TOOLBARS){
        const card=dom('button','welcome-choice welcome-toolbar-card'+(choice('toolbar')===name?' welcome-theme-selected':''),undefined,grid);
        card.type='button';
        card.setAttribute('aria-label','Select '+name+' toolbar');
        card.setAttribute('aria-pressed',String(choice('toolbar')===name));
        if(waiting.has('choose-toolbar'))card.disabled=true;
        miniIde(card,selectedTheme,name);
        dom('strong','',name,card);
        dom('span','welcome-toolbar-caption',descriptions[name],card);
        if(snap.toolbar===name)dom('span','welcome-theme-current','Current toolbar',card);
        card.addEventListener('click',()=>commit('toolbar',name,'choose-toolbar','name'));
      }
      if(!selectedTheme)dom('p','welcome-note','Toolbar previews use a neutral appearance until the IDE supplies its theme inventory.',parent);
    }
    function features(parent) {
      heading(parent,'Explore your new tools','The IDE enhancements are available whenever you need them.');
      const cards=dom('div','welcome-choice-grid',undefined,parent);
      for(const [name,desc] of [
        ['IDE themes and accent','Choose WinUI3 Light, WinUI3 Dark or another installed IDE theme.'],
        ['Form alignment tools','Access layout and arrangement commands through the tbUI3IDE toolbar.'],
        ['Classic, Hybrid and Ribbon','Switch your preferred command layout through IDE Options.'],
        ['Updater and installation settings','Manage update preferences independently for each IDE installation.']
      ]) {
        const card=dom('div','welcome-choice',undefined,cards);
        dom('strong','',name,card);dom('p','welcome-description',desc,card);
      }
      dom('p','welcome-note','Alongside and archive update strategies will arrive in later phases.',parent);
    }
    function welcome(parent){
      heading(parent,'Make twinBASIC your own','A more modern IDE without giving up familiar tools.');
      const grid=dom('div','welcome-choice-grid',undefined,parent);
      for(const [name,desc] of [
        ['WinUI3 Light and Dark','Choose the appearance that fits your workspace.'],
        ['Classic, Hybrid and Ribbon','Put the IDE commands where they work best for you.'],
        ['Safe updates','Check for updates without installing them without consent.'],
        ['IDE productivity','Customize toolbar commands, appearance and update preferences.']
      ]) {
        const block=dom('div','welcome-choice',undefined,grid);
        dom('strong','',name,block);dom('p','welcome-description',desc,block);
      }
      dom('p','welcome-note','Nothing changes until you choose an option.',parent);
    }
    const RESOURCE_NAMES={
      updater:'Update manager',
      themeDark:'WinUI3 Dark theme',
      themeLight:'WinUI3 Light theme'
    };
    function resourceLabel(id){
      if(Object.prototype.hasOwnProperty.call(RESOURCE_NAMES,id))return RESOURCE_NAMES[id];
      // Unknown future resource names must be presented as readable text,
      // never as raw camelCase IDs or filename/path markup.
      const cleaned=text(id).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').trim();
      return cleaned ? cleaned.charAt(0).toUpperCase()+cleaned.slice(1) : 'Bundled component';
    }
    function resourceState(resource){
      const raw=text(resource && resource.status).toLowerCase();
      if(['ready','ok','healthy','verified','installed'].includes(raw))return {label:'Ready',tone:'success',symbol:'✓'};
      if(['modified','customized','customised'].includes(raw))return {label:'Customized',tone:'attention',symbol:'!'};
      if(['missing','error','failed','corrupt','damaged'].includes(raw))return {label:'Needs attention',tone:'error',symbol:'!'};
      if(['checking','pending','verifying'].includes(raw))return {label:'Checking',tone:'neutral',symbol:'…'};
      return {label:'Status unavailable',tone:'neutral',symbol:'?'};
    }
    function setupNeedsAttention(){
      const bootstrap=snap.bootstrap||{};
      const resources=Array.isArray(bootstrap.resources)?bootstrap.resources:[];
      const critical=new Set(['missing','error','failed','corrupt','damaged']);
      return bootstrap.status==='error' || bootstrap.status==='warning' || snap.recovery===true ||
        resources.some(resource=>critical.has(text(resource&&resource.status).toLowerCase()) || resource.repairable===true);
    }
    function pageNames(){
      const names=PAGES.slice();
      if(setupNeedsAttention())names.splice(names.length-1,0,'Setup');
      return names;
    }
    function setupAttention(parent){
      heading(parent,'Installation needs attention','Review any outstanding setup issues before finishing. Your existing files and customizations are preserved.');
      const bootstrap=snap.bootstrap||{};
      const resources=Array.isArray(bootstrap.resources)?bootstrap.resources:[];
      const relevant=resources.filter(resource=>{
        const state=resourceState(resource);
        return state.tone==='error' || resource.repairable===true;
      });
      const list=dom('div','welcome-health-list',undefined,parent);
      for(const resource of relevant){
        const state=resourceState(resource);
        const line=dom('div','welcome-health-row',undefined,list);
        const details=dom('div','welcome-health-details',undefined,line);
        dom('strong','welcome-health-name',resourceLabel(resource.id),details);
        if(text(resource.message))dom('p','welcome-health-description',resource.message,details);
        const actions=dom('div','welcome-health-actions',undefined,line);
        const badge=dom('span','welcome-health-status welcome-health-'+state.tone,undefined,actions);
        badge.setAttribute('aria-label','Status: '+state.label);
        dom('span','welcome-health-status-icon',state.symbol,badge).setAttribute('aria-hidden','true');
        dom('span','',state.label,badge);
        if(resource.repairable){
          const b=button(actions,'Repair',()=>{
            if(typeof options.confirmRepair!=='function'){
              message='Repair confirmation is unavailable. Open IDE Options to repair this resource.';paint();return;
            }
            Promise.resolve().then(()=>options.confirmRepair(resource)).then(approved=>{
              if(approved&&!dead)dispatch('repair-resource',{id:resource.id,confirmed:true});
              paint();
            }).catch(error=>{message='Repair confirmation failed: '+(error&&error.message||String(error));paint();});
          });
          b.setAttribute('aria-label','Repair '+resourceLabel(resource.id));
          if(waiting.has('repair-resource'))b.setAttribute('disabled','');
        }
      }
      if(!relevant.length)dom('p','welcome-health-description','The add-in reported an installation issue. You can check resources again or review the details in IDE Options.',list);
      if(bootstrap.status==='error')
        info(parent,'Installation check needs attention',text(bootstrap.message)||'Some bundled resources could not be verified.','error');
      else if(bootstrap.status==='warning')
        info(parent,'Review installation resources',text(bootstrap.message)||'One or more components may need attention.','warning');
      if(snap.recovery)info(parent,'Update recovery needed','An unfinished native transaction must be recovered separately.','warning');
      const retry=button(parent,'Check again',()=>{dispatch('bootstrap-retry');paint();});
      if(waiting.has('bootstrap-retry'))retry.setAttribute('disabled','');
      dom('p','welcome-note','You can continue after reviewing these issues, or close the tour and return through IDE Options. Repairs are never performed without approval.',parent);
    }
    function finish(parent){
      heading(parent,"You're ready to go",'Your preferences can be changed later. Reopen this tour from IDE Options.');
      dom('h3','welcome-subheading','Your preferences',parent);
      const summary=dom('dl','welcome-summary-list',undefined,parent);
      const current=snap.preferences||{};
      // Data-driven rows: future confirmed preferences can be added without
      // introducing an additional fixed tile or changing the grid geometry.
      const entries=[
        ['IDE theme',snap.theme||'Unchanged'],
        ['Toolbar layout',snap.toolbar||'Unchanged'],
        ['Check for updates',current.automatic===false?'Off':'On'],
        ['Restart after update',current.restart===true?'On':'Off'],
        ['Update strategy','In place']
      ];
      for(const [name,value] of entries){
        const row=dom('div','welcome-summary-row',undefined,summary);
        dom('dt','welcome-summary-label',name,row);
        dom('dd','welcome-summary-value',value,row);
      }

    }
    function paint(){
      if(dead||!loaded||!app)return;
      // Real IDE theme is the default; preview is local and never dispatched.
      const selectedPreview=installedThemes().find(theme=>theme.name===preview);
      inner.documentElement.setAttribute('data-theme',previewAppearance||themeMode(selectedPreview)||snapshotMode(snap));
      app.replaceChildren();
      const head=dom('header','welcome-top',undefined,app);
      head.setAttribute('role','toolbar');head.setAttribute('aria-label','Welcome Wizard titlebar');
      dom('span','welcome-brand','tbUI3IDE',head);
      const close=dom('button','welcome-caption-close',undefined,head);
      close.type='button';
      close.setAttribute('aria-label','Close Welcome Wizard');
      close.setAttribute('title','Close');
      const cross=inner.createElementNS('http://www.w3.org/2000/svg','svg');
      cross.setAttribute('class','welcome-caption-cross');
      close.appendChild(cross);
      cross.setAttribute('viewBox','0 0 12 12');
      cross.setAttribute('width','12');cross.setAttribute('height','12');
      cross.setAttribute('aria-hidden','true');
      const strokes=inner.createElementNS('http://www.w3.org/2000/svg','path');
      cross.appendChild(strokes);
      strokes.setAttribute('d','M1 1L11 11M11 1L1 11');
      strokes.setAttribute('fill','none');
      strokes.setAttribute('stroke','currentColor');
      strokes.setAttribute('stroke-width','1');
      close.addEventListener('click',()=>dismiss('dismissed'));
      const steps=dom('nav','welcome-steps',undefined,app);steps.setAttribute('aria-label','Wizard progress');
      const pages=pageNames();
      if(step>=pages.length)step=pages.length-1;
      pages.forEach((label,index)=>{
        const s=dom('span','welcome-step'+(index===step?' active':''),label,steps);
        if(index===step)s.setAttribute('aria-current','step');
      });
      const main=dom('main','welcome-page',undefined,app);
      ({Welcome:welcome,Updates:updates,Themes:chooseTheme,Toolbar:toolbar,Features:features,Setup:setupAttention,Finish:finish})[pages[step]](main);
      const footer=dom('footer','welcome-footer',undefined,app);
      button(footer,step===pages.length-1?'Close':'Skip tour',()=>dismiss('dismissed'));
      const right=dom('div','welcome-actions',undefined,footer);
      const back=button(right,'Back',()=>move(-1));
      if(step===0)back.setAttribute('disabled','');
      const nextLabel=step===pages.length-1?'Finish':pages[step]==='Setup'?'Continue with current setup':'Continue';
      const next=button(right,nextLabel,()=>step===pages.length-1?dismiss('completed'):move(1),'primary');
      if(pages[step]==='Setup' && (waiting.has('bootstrap-retry') || waiting.has('repair-resource')))next.setAttribute('disabled','');
      status=dom('div','welcome-status',message|| (waiting.size?'Waiting for IDE confirmation…':'Step '+(step+1)+' of '+pages.length),app);
      status.setAttribute('role','status');status.setAttribute('aria-live','polite');
      inner.defaultView.WinUIControls.initialize(app);
    }
    function move(delta){step=Math.max(0,Math.min(pageNames().length-1,step+delta));paint();const h=app&&app.querySelector('h2');if(h)h.focus();}
    function dismiss(disposition){
      if(!open)return;
      if(disposition!=='none')dispatch('welcome-record',{schema:1,disposition});
      open=false;frame.hidden=true;
      if(priorFocus&&typeof priorFocus.focus==='function')priorFocus.focus();
      if(typeof options.onClose==='function')options.onClose(disposition);
    }
    function show(value){
      if(dead)return;
      if(isObject(value))snap=value;
      waiting.clear();changed.clear();preview=null;
      step=0;
      if(!frame)setup();
      priorFocus=doc.activeElement;open=true;frame.hidden=false;
      if(loaded){paint();frame.focus();}
    }
    function setPreviewMode(mode) {
      // Used by the local browser preview only. Never changes native theme/settings.
      if(mode!==null && mode!=='light' && mode!=='dark')throw new TypeError('Preview mode must be light, dark or null');
      previewAppearance=mode;
      paint();
    }
    function destroy(){
      dead=true;open=false;waiting.clear();changed.clear();
      if(frame)frame.remove();
      if(hostStyles)hostStyles.remove();
      frame=null;hostStyles=null;inner=null;app=null;
    }
    return Object.freeze({
      open:show,setSnapshot:settle,setPreviewMode,close:()=>dismiss('none'),destroy,
      getState:()=>({page:pageNames()[Math.min(step,pageNames().length-1)].toLowerCase(),open,source:instance,pending:[...waiting]})
    });
  }
  global.tbUI3CreateWelcomeWizard=createWelcomeWizard;
})(typeof window!=='undefined'?window:this);
