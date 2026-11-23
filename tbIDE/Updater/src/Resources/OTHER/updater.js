/* Application actions only. Shared WinUI controls and theme behavior remain in their
 * pinned toolkit modules. Native code accepts only these fixed operation messages. */
(function () {
  'use strict';
  let state={status:'idle',message:'Choose updates from the tbUI3IDE add-in to start.'}, running=false, canRecover=false;
  const names={ide:'twinBASIC IDE',addin:'tbUI3IDE add-in',themes:'WinUI3 themes',library:'Icon and resource library',updater:'Updater',controlPackage:'Control package download'};
  const glyphs={ide:'\uE70F',addin:'\uE74C',themes:'\uE790',library:'\uE8A5',updater:'\uE895',controlPackage:'\uE7B8'};
  const port=window.chrome?.webview;
  function send(message){port?.postMessage(message);}
  function text(id,value){document.getElementById(id).textContent=String(value||'');}
  function show(id,visible,enabled=true){const n=document.getElementById(id);n.hidden=!visible;WinUIControls.setEnabled(n,enabled);}
  function render(){
    const status=document.getElementById('status');
    const failed=state.status==='error', complete=state.status==='complete', recovered=state.status==='rolledBack';
    const active=running||['waiting','installing','rollingBack'].includes(state.status);
    const titles={idle:'Ready when you are',ready:'Waiting for twinBASIC',waiting:'Waiting for twinBASIC',elevationRequired:'Administrator approval required',installing:'Installing updates',rollingBack:'Restoring your installation',error:'The update needs attention',complete:'You are up to date',rolledBack:'Backup restored',cancelled:'Update cancelled'};
    status.setAttribute('title',titles[state.status]||'Preparing updates');
    status.setAttribute('severity',failed?'error':complete||recovered?'success':'informational');
    status.setAttribute('message',state.message||'');
    const progress=WinUIControls.getProgressBar(document.getElementById('progress'));
    const total=Number(state.total)||0, completed=Number(state.completed)||0;
    progress.setIndeterminate(active&&!total);
    if(total)progress.setValue(100*Math.min(completed,total)/total);else if(complete)progress.setValue(100);else if(!active)progress.setValue(0);
    progress.setError(failed);
    text('progress-value',total?completed+' of '+total+' files verified':complete?'Verified':active?'Working...':'Not running');
    text('message',state.message||'Your projects and embedded control packages stay unchanged.');
    show('retry',failed,!running);
    show('elevate',state.status==='elevationRequired'||failed&&state.canElevate===true,!running);
    show('recover',failed&&canRecover,!running);
    show('cancel',running&&['ready','waiting','staging'].includes(state.status));
    show('close',true,!running);
    WinUIControls.initialize(status);
  }
  function planSnapshot(plan){
    text('scope','In-place target: '+(plan.installRoot||'selected IDE')+'. Per-user add-in, updater and themes are shared; projects remain unchanged.');
    const container=document.getElementById('components');container.replaceChildren();
    for(const c of plan.components||[]){
      const row=document.createElement('div');row.className='settings-row';
      const glyph=document.createElement('span');glyph.className='settings-row__glyph';glyph.textContent=glyphs[c.id]||'\uE895';glyph.setAttribute('aria-hidden','true');
      const label=document.createElement('div'),title=document.createElement('div'),description=document.createElement('div');
      title.className='settings-row__title';title.textContent=names[c.id]||c.id;
      description.className='settings-row__description';description.textContent=(c.installed==='0'?'Not installed / unversioned':c.installed)+' \u2192 '+c.version;
      label.append(title,description);const selected=document.createElement('span');selected.className='text-muted';selected.textContent='Selected';
      row.append(glyph,label,selected);container.append(row);
    }
  }
  function receive(event){
    let msg=event.data;if(typeof msg==='string'){try{msg=JSON.parse(msg);}catch{return;}}
    if(!msg||typeof msg!=='object')return;
    if(msg.type==='planSnapshot'){planSnapshot(msg.plan||{});return;}
    if(msg.type==='hostError'){state={status:'error',message:String(msg.message||'The updater could not complete this request.')};render();return;}
    if(msg.type!=='updateState'||!msg.state||typeof msg.state.status!=='string')return;
    state=msg.state;running=msg.running===true;canRecover=msg.canRecover===true;
    if(!running&&msg.exitCode&& !['error','complete','rolledBack','cancelled'].includes(state.status)) state={status:'error',message:'The updater engine stopped before reporting completion. Check updater-engine.log in your tbUI3 Diagnostics folder, then retry.'};
    text('recovery-path',msg.context?'Session: '+msg.context:'No update session is open.');render();
  }
  function start(){
    WinUIControls.initialize(document);
    port?.addEventListener('message',receive);
    document.getElementById('elevate').addEventListener('click',()=>send('updater:elevate'));
    document.getElementById('retry').addEventListener('click',()=>send('updater:retry'));
    document.getElementById('recover').addEventListener('click',()=>send('updater:recover'));
    document.getElementById('cancel').addEventListener('click',()=>send('updater:cancel'));
    document.getElementById('close').addEventListener('click',()=>send('updater:close'));
    render();requestHostTheme();send('updater:ready');
    window.setInterval(()=>send('updater:poll'),750);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
