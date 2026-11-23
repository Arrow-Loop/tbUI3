/* tbUI3IDE Welcome Wizard, v1. Functional view: native adapter owns all persistent changes.
 * Shared with IDE DOM; no injected script may read/write local files or execute arbitrary commands.
 */
(function (global) {
  'use strict';
  const PAGE_IDS = ['welcome', 'updates', 'themes', 'toolbar', 'features', 'finish'];
  const NAMES = ['Welcome', 'Updates', 'Themes', 'Toolbar', 'Features', 'Finish'];
  const ACTIONS = new Set(['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']);
  const THEMES = ['WinUI3 Light', 'WinUI3 Dark'], TOOLBARS = ['Classic','Hybrid','Ribbon'];
  const own = (v, k) => Object.prototype.hasOwnProperty.call(v || {}, k);
  const str = v => typeof v === 'string' ? v : '';
  const element = (doc, tag, klass, content) => {
    const e=doc.createElement(tag);
    if (klass) e.className=klass;
    if (content !== undefined) e.textContent=content;
    return e;
  };
  function createWelcomeWizard(options) {
    if (!options || !options.document || !options.mount || typeof options.send !== 'function') throw new Error('Welcome Wizard requires document, mount and send(action) adapter.');
    const doc=options.document, win=doc.defaultView || global;
    const host=options.mount, sendNative=options.send;
    let snapshot={}, page=0, pending=new Set(), isOpen=false, disposed=false, root, sheet, dialog, content, steps, status, back, next, skip, closeButton, initialFocus=null, lastMessage='';
    const source=options.source || 'manual';
    const themePreview = [{name:'WinUI3 Light',mode:'light'},{name:'WinUI3 Dark',mode:'dark'}];
    const state = { selectedTheme:null, selectedToolbar:null, automatic:null, restart:null, channel:null, changed:new Set() };
    function make(tag, klass, text, parent) { const e=element(doc,tag,klass,text); if(parent)parent.appendChild(e); return e; }
    function labelFor(name) { return name.replace('WinUI3 ', ''); }
    function disabledBy(action) { return pending.has(action); }
    function send(action, details) {
      if (disposed || !ACTIONS.has(action) || pending.has(action)) return false;
      const request=Object.assign({action},details || {});
      pending.add(action);
      try {
        sendNative(request);
        return true;
      } catch (e) {
        pending.delete(action);
        lastMessage='Could not send request: '+(e && e.message || String(e));
        draw();
        return false;
      }
    }
    function prefs() { return snapshot.preferences || {}; }
    function hydrateSelections() {
      const p=prefs();
      if (!state.changed.has('automatic')) state.automatic=typeof p.automatic==='boolean'?p.automatic:true;
      if (!state.changed.has('restart')) state.restart=typeof p.restart==='boolean'?p.restart:false;
      if (!state.changed.has('channel')) state.channel=p.channel==='stable'?'stable':'development';
      if (!state.changed.has('theme')) state.selectedTheme=THEMES.includes(snapshot.theme)?snapshot.theme:null;
      if (!state.changed.has('toolbar')) state.selectedToolbar=TOOLBARS.includes(snapshot.toolbar)?snapshot.toolbar:null;
    }
    function setSnapshot(value) {
      if (disposed) return;
      if (!value || typeof value!=='object') return;
      snapshot=value; pending.clear();
      // Acknowledged values are authoritative. Do not pretend requested values have been applied.
      if (value.message!==undefined) lastMessage=typeof value.message==='string'?value.message:(value.message && (value.message.text || value.message.message)) || '';
      // Native can return updates unrelated to a setting. Clear only selections reflected in it.
      if (state.changed.has('theme') && value.theme===state.selectedTheme) state.changed.delete('theme');
      if (state.changed.has('toolbar') && value.toolbar===state.selectedToolbar) state.changed.delete('toolbar');
      for (const k of ['automatic','restart','channel']) if (state.changed.has(k) && prefs()[k]===state[k]) state.changed.delete(k);
      hydrateSelections(); draw();
    }
    function announce(text) { if(status) status.textContent=String(text || ''); }
    function dismiss(disposition) {
      if (!isOpen) return;
      if (disposition && disposition!=='none') send('welcome-record',{schema:1,disposition});
      isOpen=false;
      if (dialog) {dialog.hidden=true;dialog.setAttribute('aria-hidden','true');}
      if (root) root.classList.remove('tbw-visible');
      if (initialFocus && typeof initialFocus.focus==='function') {try{initialFocus.focus();}catch(_e){}}
      if(typeof options.onClose==='function') options.onClose(disposition||'none');
    }
    function open(newSnapshot) {
      if (disposed) return;
      if (newSnapshot) snapshot=newSnapshot;
      hydrateSelections();
      if (!root) build();
      initialFocus=doc.activeElement;
      page=0; isOpen=true;
      root.classList.add('tbw-visible');
      dialog.hidden=false; dialog.removeAttribute('aria-hidden');
      draw();
      if(closeButton) closeButton.focus();
    }
    function move(delta) {
      page=Math.max(0,Math.min(PAGE_IDS.length-1,page+delta));
      draw(); if(content) {const heading=content.querySelector('h2'); if(heading) heading.focus();}
    }
    function choice(parent, group, value, title, description, onClick, selected, disabled) {
      const b=make('button','tbw-choice'+(selected?' tbw-selected':''),undefined,parent);
      b.type='button';b.disabled=!!disabled;b.setAttribute('aria-pressed',String(!!selected));b.dataset.choice=group+':'+value;
      make('span','tbw-choice-title',title,b);
      if(description) make('span','tbw-choice-desc',description,b);
      b.addEventListener('click',onClick);
      return b;
    }
    function heading(parent, title, description) {
      const h=make('h2','tbw-page-title',title,parent);h.tabIndex=-1;
      if(description) make('p','tbw-page-description',description,parent);
    }
    function callout(parent, text, kind) {
      const p=make('div','tbw-callout tbw-'+(kind||'note'),text,parent);p.setAttribute('role',kind==='error'?'alert':'note');return p;
    }
    function fieldRow(parent,key,title,desc,checked,change) {
      const wrap=make('label','tbw-toggle',undefined,parent);
      const words=make('span','tbw-toggle-copy',undefined,wrap);
      make('strong','',title,words);if(desc)make('small','',desc,words);
      const input=make('input','',undefined,wrap);input.type='checkbox';input.checked=!!checked;
      input.disabled=disabledBy('installation-preferences');input.dataset.pref=key;input.addEventListener('change',()=>change(input.checked));
    }
    function drawPage() {
      content.replaceChildren();
      if(page===0) {
        heading(content,'Welcome to tbUI3IDE','Make twinBASIC your own, with a familiar IDE and more capable tools.');
        const grid=make('div','tbw-feature-grid',undefined,content);
        [['◫','Modern IDE themes','WinUI3 Light and Dark styles with your Windows accent.'],['▤','Your toolbar, your way','Classic, Hybrid or Ribbon, without changing how your projects work.'],['↻','Safe, informed updates','Automatic checks, explicit install approval and recoverable changes.'],['▣','Better designer tools','TabView and TabPage design-time management.']].forEach(([symbol,title,desc])=>{
          const item=make('div','tbw-feature',undefined,grid);make('span','tbw-feature-symbol',symbol,item);make('strong','',title,item);make('p','',desc,item);
        });
        make('p','tbw-muted','Your existing IDE preferences stay unchanged unless you choose new settings.',content);
      } else if(page===1) {
        heading(content,'Updates on your terms','tbUI3IDE checks for published versions; downloaded updates install only after you approve them.');
        fieldRow(content,'automatic','Check automatically','Check for available updates in the background. Manual checks always remain available.',state.automatic,val=>{
          state.automatic=val;state.changed.add('automatic');send('installation-preferences',{automatic:val});draw();
        });
        fieldRow(content,'restart','Restart after update','Restart the current IDE when a completed update permits it.',state.restart,val=>{
          state.restart=val;state.changed.add('restart');send('installation-preferences',{restart:val});draw();
        });
        make('div','tbw-section-title','Release channel',content);
        const chans=make('div','tbw-choice-row',undefined,content);
        [['development','Development','Early beta releases'],['stable','Stable','Stable releases when available']].forEach(([value,name,desc])=>choice(chans,'channel',value,name,desc,()=>{
          state.channel=value;state.changed.add('channel');send('installation-preferences',{channel:value});draw();
        },state.channel===value,disabledBy('installation-preferences')));
        callout(content,'Automatic update checks are different from automatic installation. Installing an update always requires your consent.','note');
      } else if(page===2) {
        heading(content,'Choose your appearance','Preview the two WinUI3 themes. Selecting a theme requests a real IDE change.');
        const group=make('div','tbw-theme-grid',undefined,content);
        themePreview.forEach(t=>{
          const tile=make('button','tbw-theme-tile '+t.mode+(state.selectedTheme===t.name?' tbw-selected':''),undefined,group);
          tile.type='button';tile.disabled=disabledBy('choose-theme');tile.setAttribute('aria-pressed',String(snapshot.theme===t.name));tile.setAttribute('aria-label','Use '+t.name+' theme');
          const preview=make('div','tbw-theme-preview',undefined,tile);
          make('div','tbw-preview-bar','twinBASIC',preview);
          const stripe=make('div','tbw-preview-stripe',undefined,preview);
          make('span','','File',stripe);make('span','','Edit',stripe);make('span','','View',stripe);
          const body=make('div','tbw-preview-body',undefined,preview);
          make('div','tbw-preview-rail','',body);const lines=make('div','tbw-preview-lines',undefined,body);
          for(let i=0;i<4;i++)make('div','tbw-preview-line',undefined,lines);
          make('strong','tbw-theme-label',t.name,tile);
          if(snapshot.theme===t.name)make('span','tbw-current','Current theme',tile);
          tile.addEventListener('click',()=>{state.selectedTheme=t.name;state.changed.add('theme');send('choose-theme',{name:t.name});draw();});
        });
        make('p','tbw-muted','A preview never changes your IDE. You can keep your current theme and continue.',content);
      } else if(page===3) {
        heading(content,'Choose your toolbar','Switch anytime from IDE Options. Your selected toolbar mode applies to the actual IDE.');
        const grid=make('div','tbw-toolbar-grid',undefined,content);
        [['Classic','The original twinBASIC menus and toolbar.','classic'],['Hybrid','Modern commands alongside familiar IDE navigation.','hybrid'],['Ribbon','Organized command tabs with Quick Access tools.','ribbon']].forEach(([name,desc,mode])=>{
          const tile=choice(grid,'toolbar',name,name,desc,()=>{state.selectedToolbar=name;state.changed.add('toolbar');send('choose-toolbar',{name});draw();},state.selectedToolbar===name,disabledBy('choose-toolbar'));
          const sample=make('div','tbw-toolbar-preview '+mode,undefined,tile);
          for (let i=0;i<(mode==='ribbon'?3:5);i++) make('span','',undefined,sample);
          if(snapshot.toolbar===name)make('span','tbw-current','Current',tile);
        });
      } else if(page===4) {
        heading(content,'More power in the designer','Meet the improvements included with tbUI3IDE.');
        [['TabView and TabPage','Create, rename, reorder and manage tabs at design time.'],['Form tools','Access layout and alignment commands through the familiar IDE workflow.'],['Ribbon and Quick Access','Choose Classic, Hybrid or Ribbon to suit your work.'],['IDE Options','Manage themes, update checks and installation preferences in one place.']].forEach(([title,desc])=>{
          const row=make('div','tbw-learning-row',undefined,content);make('strong','',title,row);make('p','',desc,row);
        });
        make('p','tbw-muted','Later installation-manager phases will add archived-version and multiple-installation strategies. The initial release updates in place.',content);
      } else {
        heading(content,"You're ready to go","Everything can be changed later in IDE Options. You can reopen this tour whenever you like.");
        const summary=make('div','tbw-summary',undefined,content);
        [['Theme',str(snapshot.theme)||'Unchanged'],['Toolbar',str(snapshot.toolbar)||'Unchanged'],['Automatic checks',prefs().automatic===false?'Off':'On'],['Update strategy','In place (recommended)']].forEach(([k,v])=>{
          const row=make('div','tbw-summary-row',undefined,summary);make('span','',k,row);make('strong','',v,row);
        });
        const bootstrap=snapshot.bootstrap||{},resources=Array.isArray(bootstrap.resources)?bootstrap.resources:[];
        make('h3','tbw-section-title','Installation health',content);
        callout(content,str(bootstrap.message)||'Resource status will appear when the IDE reports it.',bootstrap.status==='error'?'error':'note');
        resources.forEach(r=>{
          const row=make('div','tbw-resource-row',undefined,content);
          make('strong','',str(r.id),row);make('span','',str(r.status)+(r.message?' · '+r.message:''),row);
          if(r.repairable) {
            const repair=make('button','tbw-small-button','Repair',row);repair.type='button';repair.disabled=disabledBy('repair-resource');
            repair.onclick=()=>{if(typeof options.confirmRepair==='function' && !options.confirmRepair(r))return;
              if(typeof options.confirmRepair!=='function' && !win.confirm('Restore a managed copy of '+r.id+'? A verified backup will be retained.'))return;
              send('repair-resource',{id:r.id,confirmed:true});draw();
            };
          }
        });
        const retry=make('button','tbw-secondary','Check bundled resources again',content);retry.type='button';retry.disabled=disabledBy('bootstrap-retry');retry.onclick=()=>{send('bootstrap-retry');draw();};
        if(snapshot.recovery)callout(content,'An unfinished update transaction needs attention in the updater. The Welcome Wizard will not clear recovery state.','error');
      }
    }
    function draw() {
      if(!root||disposed)return;
      steps.replaceChildren();
      PAGE_IDS.forEach((id,i)=>{
        const mark=make('span','tbw-step'+(i===page?' active':i<page?' visited':''),undefined,steps);
        mark.setAttribute('aria-label',NAMES[i]+(i===page?' current step':''));if(i===page)mark.setAttribute('aria-current','step');
        make('span','',NAMES[i],mark);
      });
      drawPage();
      back.disabled=page===0;next.textContent=page===5?'Finish':'Continue';
      skip.textContent=page===5?'Close':'Skip tour';
      announce(lastMessage || (pending.size?'Waiting for IDE confirmation…':'Step '+(page+1)+' of '+PAGE_IDS.length));
      const hasError=typeof lastMessage==='string' && /error|fail|denied/i.test(lastMessage);
      status.classList.toggle('tbw-error',hasError);
    }
    function build() {
      root=make('div','tbw-root',undefined,host);root.setAttribute('data-tbw-schema','1');
      sheet=make('div','tbw-backdrop',undefined,root);
      dialog=make('section','tbw-dialog',undefined,root);dialog.hidden=true;
      dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
      dialog.setAttribute('aria-labelledby','tbw-title');
      const header=make('header','tbw-header',undefined,dialog);
      const branding=make('div','tbw-brand',undefined,header);
      make('span','tbw-logo','◈',branding);make('h1','', 'Welcome to tbUI3IDE',branding).id='tbw-title';
      closeButton=make('button','tbw-close','×',header);closeButton.type='button';closeButton.setAttribute('aria-label','Close welcome wizard');closeButton.addEventListener('click',()=>dismiss('dismissed'));
      steps=make('nav','tbw-progress',undefined,dialog);steps.setAttribute('aria-label','Welcome tour progress');
      content=make('main','tbw-content',undefined,dialog);
      status=make('div','tbw-status','',dialog);status.setAttribute('role','status');status.setAttribute('aria-live','polite');
      const footer=make('footer','tbw-footer',undefined,dialog);
      skip=make('button','tbw-quiet','Skip tour',footer);skip.type='button';skip.onclick=()=>dismiss('dismissed');
      const right=make('div','tbw-footer-right',undefined,footer);
      back=make('button','tbw-secondary','Back',right);back.type='button';back.onclick=()=>move(-1);
      next=make('button','tbw-primary','Continue',right);next.type='button';next.onclick=()=>{if(page===5)dismiss('completed');else move(1);};
      root.addEventListener('keydown',event=>{
        if(!isOpen)return;
        if(event.key==='Escape'){event.preventDefault();dismiss('dismissed');return;}
        if(event.key==='Tab') {
          const all=[...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(e=>e.getClientRects().length || e===closeButton);
          if(!all.length)return;const first=all[0],last=all[all.length-1];
          if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
        }
      });
      if(options.cssText) { const style=make('style','',options.cssText,root);root.insertBefore(style,root.firstChild); }
    }
    function destroy() {disposed=true;isOpen=false;if(root)root.remove();root=null;pending.clear();}
    return Object.freeze({open,setSnapshot,close:()=>dismiss('none'),destroy,getState:()=>({page:PAGE_IDS[page],open:isOpen,source,pending:[...pending]})});
  }
  global.tbUI3CreateWelcomeWizard=createWelcomeWizard;
})(typeof window!=='undefined'?window:this);
