/* tbUI3IDE Welcome view. All controls are authored with the shared WinUI runtime
 * and Master CSS in an isolated iframe document; native host retains all authority.
 * Full shared control implementation is in controls.js, not duplicated here.
 */
(function (global) {
  'use strict';
  const PAGES = ['Welcome', 'Updates', 'Themes', 'Toolbar', 'Features', 'Finish'];
  const THEMES = ['WinUI3 Light','WinUI3 Dark'];
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
    let frame=null, inner=null, app=null, status=null, snap={}, step=0, open=false, dead=false;
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
      if(preview===null)preview=snapshotMode(snap);
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
    function chooseTheme(parent) {
      heading(parent,'Choose your appearance','Preview the complete WinUI Light or Dark appearance before applying it to the IDE.');
      const previewRow=dom('div','welcome-actions',undefined,parent);
      for(const mode of ['light','dark']) {
        const b=button(previewRow,'Preview '+(mode==='light'?'Light':'Dark'),()=>{
          preview=mode;paint();
        });
        b.setAttribute('aria-pressed',String(preview===mode));
      }
      info(parent,preview==='dark'?'Dark preview':'Light preview','This preview changes only the Welcome window, not your IDE.');
      const list=dom('div','welcome-choice-grid',undefined,parent);
      for(const name of THEMES) {
        const block=dom('div','welcome-choice',undefined,list);
        dom('strong','',name,block);
        dom('p','welcome-description',name===snap.theme?'Current IDE theme':'Available theme',block);
        const b=button(block,'Use '+name,()=>commit('theme',name,'choose-theme','name'),choice('theme')===name?'primary':undefined);
        if(waiting.has('choose-theme'))b.setAttribute('disabled','');
      }
      dom('p','welcome-note','Your current IDE theme stays unchanged unless you select Use.',parent);
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
      dom('h3','welcome-subheading','Release channel',parent);
      const group=dom('div','welcome-actions',undefined,parent);
      for(const name of ['development','stable']){
        const b=button(group,name==='stable'?'Stable':'Development',()=>commit('channel',name,'installation-preferences','channel'),choice('channel')===name?'primary':undefined);
        b.setAttribute('aria-pressed',String(choice('channel')===name));
        if(waiting.has('installation-preferences'))b.setAttribute('disabled','');
      }
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
        ['TabView and TabPage','Create, rename and manage pages directly in the designer.'],
        ['Form alignment tools','Find arrangement and layout commands alongside your form workflow.'],
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
        ['Better designer workflows','Access TabView design and layout commands.']
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
      inner.documentElement.setAttribute('data-theme',preview||snapshotMode(snap));
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
      waiting.clear();changed.clear();preview=snapshotMode(snap);
      step=0;
      if(!frame)setup();
      priorFocus=doc.activeElement;open=true;frame.hidden=false;
      if(loaded){paint();frame.focus();}
    }
    function destroy(){
      dead=true;open=false;waiting.clear();changed.clear();
      if(frame)frame.remove();
      frame=null;inner=null;app=null;
    }
    return Object.freeze({
      open:show,setSnapshot:settle,close:()=>dismiss('none'),destroy,
      getState:()=>({page:PAGES[step].toLowerCase(),open,source:instance,pending:[...waiting]})
    });
  }
  global.tbUI3CreateWelcomeWizard=createWelcomeWizard;
})(typeof window!=='undefined'?window:this);
