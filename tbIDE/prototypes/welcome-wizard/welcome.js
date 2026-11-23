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
      if(preview && !installedThemes().some(theme=>theme.name===preview))preview=null;
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
    function themePalette(item) {
      const palette=item && item.preview;
      if(!isObject(palette))return null;
      const valid=v=>typeof v==='string' && /^(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8})$/.test(v);
      // These palette values come from native theme enumeration, not arbitrary URLs
      // or CSS snippets. No theme is applied during preview.
      if(!valid(palette.background)||!valid(palette.foreground)||!valid(palette.accent)||!valid(palette.surface))return null;
      return palette;
    }
    function previewTile(parent,item) {
      const palette=themePalette(item),mode=themeMode(item);
      const tile=dom('div','welcome-theme-sample'+(mode?' welcome-theme-'+mode:''),undefined,parent);
      if(palette)for(const [property,cssName] of [['background','--welcome-preview-bg'],['foreground','--welcome-preview-text'],['accent','--welcome-preview-accent'],['surface','--welcome-preview-surface']])
        tile.style.setProperty(cssName,palette[property]);
      if(!palette && !mode) {
        dom('span','welcome-preview-empty','Theme palette unavailable',tile);
        return;
      }
      const top=dom('div','welcome-theme-sample-top','twinBASIC IDE',tile);
      const content=dom('div','welcome-theme-sample-body',undefined,tile);
      dom('span','welcome-theme-sample-pane','',content);
      const right=dom('div','welcome-theme-sample-lines',undefined,content);
      dom('span','','',right);dom('span','','',right);dom('span','','',right);
    }
    function chooseTheme(parent) {
      heading(parent,'Choose your appearance','Our WinUI3 themes are featured, and you can preview and select any theme installed in this IDE.');
      const listed=installedThemes();
      const featured=listed.filter(item=>FEATURED_THEMES.includes(item.name));
      const others=listed.filter(item=>!FEATURED_THEMES.includes(item.name));
      const renderGroup=(title,entries,featuredGroup)=>{
        if(!entries.length)return;
        dom('h3','welcome-subheading',title,parent);
        const list=dom('div','welcome-theme-grid'+(featuredGroup?' welcome-theme-featured':''),undefined,parent);
        for(const item of entries) {
          const block=dom('div','welcome-choice welcome-theme-card',undefined,list);
          previewTile(block,item);
          dom('strong','',item.name,block);
          if(item.name===snap.theme)dom('p','welcome-note','Current IDE theme',block);
          const controls=dom('div','welcome-actions',undefined,block);
          const look=button(controls,'Preview',()=>{
            preview=item.name;paint();
          });
          look.setAttribute('aria-pressed',String(preview===item.name));
          const use=button(controls,'Use theme',()=>commit('theme',item.name,'choose-theme','name'),choice('theme')===item.name?'primary':undefined);
          use.setAttribute('aria-label','Use '+item.name+' theme');
          if(waiting.has('choose-theme'))use.setAttribute('disabled','');
        }
      };
      renderGroup('Featured WinUI3 themes',featured,true);
      renderGroup('Other installed themes',others,false);
      if(!listed.length)info(parent,'Theme list unavailable','The native IDE has not supplied its installed theme inventory. No theme change can be made safely.','warning');
      else if(!featured.length)info(parent,'WinUI3 themes not installed','The bundled WinUI3 themes will appear here when installed and reported by the IDE.');
      const selected=listed.find(x=>x.name===preview);
      if(selected){
        dom('h3','welcome-subheading','Selected preview: '+selected.name,parent);
        const panel=dom('div','welcome-preview-panel',undefined,parent);
        previewTile(panel,selected);
        if(!themePalette(selected) && !themeMode(selected))
          info(parent,'Preview details unavailable','This theme is installed, but the IDE has not provided its color palette. Preview is limited until the native bridge exposes its actual colors.');
        dom('p','welcome-note','Preview does not apply or save a theme. Select Use theme to request a native change.',parent);
      } else {
        dom('p','welcome-note','Select Preview to inspect an installed theme, or Use theme to apply it. Your current IDE theme remains unchanged until you choose Use.',parent);
      }
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
      info(parent,'Your approval is required','Automatic checks never authorize downloading or installing an IDE update.');
    }
    function toolbar(parent) {
      heading(parent,'Choose your toolbar','Your choice changes the actual IDE toolbar only after the native service confirms it.');
      const grid=dom('div','welcome-choice-grid',undefined,parent);
      const descriptions={Classic:'The familiar twinBASIC menus and toolbar.',Hybrid:'Traditional menus with modern command surfaces.',Ribbon:'Organized command tabs with Quick Access tools.'};
      for(const name of TOOLBARS){
        const card=dom('div','welcome-choice',undefined,grid);
        dom('strong','',name,card);dom('p','welcome-description',descriptions[name],card);
        const b=button(card,'Use '+name,()=>commit('toolbar',name,'choose-toolbar','name'),choice('toolbar')===name?'primary':undefined);
        if(waiting.has('choose-toolbar'))b.setAttribute('disabled','');
        if(snap.toolbar===name)dom('p','welcome-note','Current toolbar',card);
      }
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
    function finish(parent){
      heading(parent,"You're ready to go",'Your preferences can be changed later. Reopen this tour from IDE Options.');
      const grid=dom('div','welcome-summary',undefined,parent);
      const current=snap.preferences||{};
      for(const [name,value] of [['Theme',snap.theme||'Unchanged'],['Toolbar',snap.toolbar||'Unchanged'],['Automatic checks',current.automatic===false?'Off':'On'],['Update strategy','In place']]){
        const card=dom('winui-summary-card','',undefined,grid);
        card.setAttribute('label',name);card.setAttribute('value',String(value));
      }
      const bootstrap=snap.bootstrap||{};
      dom('h3','welcome-subheading','Installation health',parent);
      info(parent,'Bundled resources',text(bootstrap.message)||'Resource status will be shown when reported by the native host.',bootstrap.status==='error'?'error':'informational');
      for(const resource of Array.isArray(bootstrap.resources)?bootstrap.resources:[]){
        const line=dom('div','welcome-resource',undefined,parent);
        dom('span','',text(resource.id)+': '+text(resource.status)+(resource.message?' | '+text(resource.message):''),line);
        if(resource.repairable){
          const b=button(line,'Repair',()=>{
            if(typeof options.confirmRepair!=='function'){
              message='Repair confirmation is unavailable. Open IDE Options to repair this resource.';paint();return;
            }
            Promise.resolve().then(()=>options.confirmRepair(resource)).then(approved=>{
              if(approved&&!dead)dispatch('repair-resource',{id:resource.id,confirmed:true});
              paint();
            }).catch(error=>{message='Repair confirmation failed: '+(error&&error.message||String(error));paint();});
          });
          if(waiting.has('repair-resource'))b.setAttribute('disabled','');
        }
      }
      const retry=button(parent,'Check bundled resources again',()=>{dispatch('bootstrap-retry');paint();});
      if(waiting.has('bootstrap-retry'))retry.setAttribute('disabled','');
      if(snap.recovery)info(parent,'Update recovery needed','An unfinished native transaction must be recovered separately.','warning');
    }
    function paint(){
      if(dead||!loaded||!app)return;
      // Real IDE theme is the default; preview is local and never dispatched.
      const selectedPreview=installedThemes().find(theme=>theme.name===preview);
      inner.documentElement.setAttribute('data-theme',themeMode(selectedPreview)||snapshotMode(snap));
      app.replaceChildren();
      const head=dom('header','welcome-top',undefined,app);
      dom('span','welcome-brand','tbUI3IDE',head);
      button(head,'Close',()=>dismiss('dismissed'));
      const steps=dom('nav','welcome-steps',undefined,app);steps.setAttribute('aria-label','Wizard progress');
      PAGES.forEach((label,index)=>{
        const s=dom('span','welcome-step'+(index===step?' active':''),label,steps);
        if(index===step)s.setAttribute('aria-current','step');
      });
      const main=dom('main','welcome-page',undefined,app);
      [welcome,updates,chooseTheme,toolbar,features,finish][step](main);
      const footer=dom('footer','welcome-footer',undefined,app);
      button(footer,step===PAGES.length-1?'Close':'Skip tour',()=>dismiss('dismissed'));
      const right=dom('div','welcome-actions',undefined,footer);
      const back=button(right,'Back',()=>move(-1));
      if(step===0)back.setAttribute('disabled','');
      button(right,step===PAGES.length-1?'Finish':'Continue',()=>step===PAGES.length-1?dismiss('completed'):move(1),'primary');
      status=dom('div','welcome-status',message|| (waiting.size?'Waiting for IDE confirmation…':'Step '+(step+1)+' of '+PAGES.length),app);
      status.setAttribute('role','status');status.setAttribute('aria-live','polite');
      inner.defaultView.WinUIControls.initialize(app);
    }
    function move(delta){step=Math.max(0,Math.min(PAGES.length-1,step+delta));paint();const h=app&&app.querySelector('h2');if(h)h.focus();}
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
    function destroy(){
      dead=true;open=false;waiting.clear();changed.clear();
      if(frame)frame.remove();
      if(hostStyles)hostStyles.remove();
      frame=null;hostStyles=null;inner=null;app=null;
    }
    return Object.freeze({
      open:show,setSnapshot:settle,close:()=>dismiss('none'),destroy,
      getState:()=>({page:PAGES[step].toLowerCase(),open,source:instance,pending:[...waiting]})
    });
  }
  global.tbUI3CreateWelcomeWizard=createWelcomeWizard;
})(typeof window!=='undefined'?window:this);
