(function createInstallationUI(env) {
 'use strict';
 const d=env.document,w=env.window,queue=[],pending=new Set();
 let state=env.state,toastHost,settingsDialog,shadow,content,welcomeShell,welcome,confirmation,confirmationContent,disposed=false,serial=0,previousFocus,repairDecision;
 let autoPending=!!env.showWelcome,painted=!autoPending,optionSheet;
 const wizardActions=new Set(['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']);
 function node(tag,text,parent,className){const n=d.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;if(parent)parent.append(n);return n;}
 function button(text,action,parent,accent=false){const n=node('button',text,parent,'button'+(accent?' button--accent':''));n.type='button';n.onclick=action;return n;}
 function request(action,data={}){const requestId='installation-'+(++serial);pending.add(requestId);queue.push({action,...data,requestId});return requestId;}
 function status(text,parent){const n=node('p',text,parent,'installation-status');n.setAttribute('role','status');return n;}
 function field(label,parent){const row=node('label',undefined,parent,'settings-row');node('span','\uE713',row,'settings-row__glyph').setAttribute('aria-hidden','true');node('span',label,row,'settings-row__title');return row;}
 function closeDialog(dialog){if(!dialog)return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
 function openDialog(dialog){if(dialog.open)return;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
 function themeMode(){return env.themeMode&&String(env.themeMode()).toLowerCase()==='dark'?'dark':'light';}
 function tokens(element,applyMode=true){
  if(applyMode)element.setAttribute('data-theme',themeMode());
  const keys=['light3','light2','light1','','dark1','dark2','dark3'];
  if(Array.isArray(state.accent)&&state.accent.length===7)state.accent.forEach((color,i)=>{if(/^#[0-9a-f]{6}$/i.test(color))element.style.setProperty('--win-accent'+(keys[i]?'-'+keys[i]:''),color);});
 }
 function syncTheme(){syncFrame();if(toastHost)tokens(toastHost);if(shadow)tokens(shadow.host);if(welcomeShell)tokens(welcomeShell);if(confirmationContent){tokens(confirmation);tokens(confirmationContent.getRootNode().host);}if(settingsDialog)tokens(settingsDialog);for(const host of d.querySelectorAll('.tbUI3OptionButtonHost'))tokens(host);}
 // :root[data-theme=...] must become :host([data-theme=...]); a bare :host[...] never matches, which left these views light.
 function hostCss(css){return css.replace(/(?:html)?:root(\[[^\]]*\])/g,':host($1)').replace(/(?:html)?:root/g,':host');}
 function modal(className){const dialog=node('dialog',undefined,d.body,className);dialog.addEventListener('keydown',e=>e.stopPropagation());return dialog;}
 function shadowView(dialog){const host=node('div',undefined,dialog),root=host.attachShadow({mode:'open'}),style=node('style',undefined,root);style.textContent=hostCss(env.styles);return {root,main:node('main',undefined,root,'installation-content')};}
 function confirmRepair(resource,fromWizard=false){
  if(!['updater','themeDark','themeLight'].includes(resource.id))throw Error('Unsupported resource repair.');
  if(!confirmation){confirmation=modal('tbUI3-installation-dialog tbUI3-installation-dialog--confirm');confirmation.setAttribute('aria-label','Confirm resource reset');confirmationContent=shadowView(confirmation).main;confirmation.addEventListener('cancel',()=>{if(repairDecision){repairDecision(false);repairDecision=null;}});}
  confirmationContent.replaceChildren();node('h1','Back up and reset this resource?',confirmationContent);node('p',resource.path||resource.id,confirmationContent,'installation-path');
  node('p','This replaces the customized file with the verified bundled copy after retaining a verified backup. A newer updater will never be downgraded. Your selected IDE theme will stay unchanged.',confirmationContent);
  const row=field('I approve keeping a backup and resetting this file',confirmationContent),approve=node('input',undefined,row);approve.type='checkbox';
  const actions=node('footer',undefined,confirmationContent,'installation-actions');const settle=approved=>{closeDialog(confirmation);welcomeShell?.querySelector('iframe')?.focus();if(repairDecision){repairDecision(approved);repairDecision=null;}else if(approved)request('repair-resource',{id:resource.id,confirmed:true});};
  button('Cancel',()=>settle(false),actions);
  const reset=button('Back up and reset',()=>settle(true),actions,true);reset.disabled=true;approve.onchange=()=>{reset.disabled=!approve.checked;};
  tokens(confirmation);tokens(confirmationContent.getRootNode().host);openDialog(confirmation);approve.focus();if(fromWizard)return new Promise(resolve=>{repairDecision=resolve;});return false;
 }
 function wizardSnapshot(next){
  const original=next.bootstrap||{},statuses={'provisioned':'installed','customized-preserved':'modified','blocked':'error','newer-preserved':'installed'};
  const bootstrap={...original,status:['attention','busy'].includes(original.status)?'warning':original.status,
   resources:(original.resources||[]).map(resource=>({...resource,status:statuses[resource.status]||resource.status}))};
  if(next.themeDiscovery?.error){
   if(bootstrap.status!=='error')bootstrap.status='warning';
   bootstrap.message=(bootstrap.message||'')+' Theme discovery needs attention: '+next.themeDiscovery.error+' Use Check again to retry.';
  }
  return {...next,bootstrap};
 }
 function ensureWelcome(){
  if(welcome)return;
  if(typeof w.tbUI3CreateWelcomeWizard!=='function')throw Error('The embedded Welcome Wizard is unavailable.');
  welcomeShell=modal('tbUI3-welcome-shell');welcomeShell.setAttribute('aria-label','Welcome to tbUI3IDE');
  welcome=w.tbUI3CreateWelcomeWizard({document:d,mount:welcomeShell,assets:{masterCss:env.welcomeMaster,controlsJs:env.welcomeControls,welcomeCss:env.welcomeStyles},source:'native-addin',
   send:message=>{if(!message||!wizardActions.has(message.action))throw Error('Unsupported wizard operation.');const {action,...data}=message;if(action==='choose-theme')welcome.setPreviewMode(null);request(action,data);},
   confirmRepair:resource=>confirmRepair(resource,true),
   onClose:()=>{closeDialog(welcomeShell);if(previousFocus&&previousFocus.isConnected)previousFocus.focus();}
  });
  welcomeShell.addEventListener('cancel',e=>{e.preventDefault();dismissWelcome();});
 }
 function dismissWelcome(){request('welcome-record',{schema:1,disposition:'dismissed'});welcome.close();}
 function showWelcome(){
  if(settingsDialog)closeDialog(settingsDialog);
  ensureWelcome();previousFocus=d.activeElement;tokens(welcomeShell);openDialog(welcomeShell);welcome.open(wizardSnapshot(state));watchFrame();
 }
 function syncFrame(){
  const frame=welcomeShell?.querySelector('iframe'),inner=frame?.contentDocument;if(!inner)return;
  // The Wizard owns its preview mode; apply only the system accent here.
  tokens(inner.documentElement,false);
 }
 function watchFrame(){
  const frame=welcomeShell.querySelector('iframe');if(!frame||frame.dataset.nativeWatched)return;
  frame.dataset.nativeWatched='true';frame.addEventListener('load',()=>{
   if(disposed)return;
   if(!frame.contentWindow?.WinUIControls){
    frame.hidden=true;const view=shadowView(welcomeShell);tokens(view.root.host);node('h1','Welcome controls unavailable',view.main);const alert=node('p','The IDE could not initialize the embedded iframe runtime. Close this dialog and inspect the IDE Debug Console.',view.main);alert.setAttribute('role','alert');button('Close',dismissWelcome,view.main);markPaint();return;
   }
   syncFrame();frame.focus();markPaint();
  },{once:true});
 }
 function markPaint(){
  // The first callback precedes a paint. Yield through it before admitting work.
  const frame=w.requestAnimationFrame?.bind(w)||(callback=>w.setTimeout(callback,0));
  frame(()=>frame(()=>{if(!disposed)painted=true;}));
 }
 function startupReady(){
  if(disposed)return false;
  if(autoPending && env.canAutoWelcome?.()!==false){
   showWelcome();
   autoPending=false;
  }
  return !autoPending&&painted;
 }
 function renderSettings(){
  if(!content)return;
  const active=shadow.activeElement,key=active?.dataset.focusKey;
  content.replaceChildren();const title=node('h1','tbUI3 installations',content);title.tabIndex=-1;
  node('p','The per-user updater and themes are shared across IDE installations.',content);
  node('p',state.root,content,'installation-path');node('p','Installation ID: '+state.installationId,content,'installation-path');
  node('h2','Bundled updater and themes',content);status(state.bootstrap?.message||'No provisioning status is available.',content);
  if(state.bootstrap?.ledgerError){
   status('The resource registry was preserved: '+state.bootstrap.ledgerError,content);
   const row=field('Back up and reset the shared resource registry; preserve customized files',content),approve=node('input',undefined,row);approve.type='checkbox';
   const reset=button('Back up and reset resource registry',()=>request('reset-shared-resource-ledger',{confirmed:true}),content);reset.disabled=true;approve.onchange=()=>{reset.disabled=!approve.checked;};
  }
  if(state.bootstrap?.ledgerBackup)node('p','Resource registry backup: '+state.bootstrap.ledgerBackup,content,'installation-path');
  for(const resource of state.bootstrap?.resources||[]){
   const row=node('section',undefined,content,'card');node('h3',({updater:'Updater',themeDark:'WinUI3 Dark',themeLight:'WinUI3 Light'})[resource.id]||resource.id,row);node('p',resource.message||resource.status,row);node('p',resource.path,row,'installation-path');
   if(resource.backup)node('p','Backup: '+resource.backup,row,'installation-path');
   if(resource.repairable)button('Review reset and backup',()=>confirmRepair(resource),row);
  }
  if(state.themeDiscovery?.error)status('Theme discovery: '+state.themeDiscovery.error,content);
  button('Recheck and repair missing resources',()=>request('bootstrap-retry'),content);
  if(state.message)status(state.message,content);
  const footer=node('footer',undefined,content,'installation-actions');button('Welcome to tbUI3IDE',showWelcome,footer);button('Close',()=>closeDialog(settingsDialog),footer);
  if(key){const next=shadow.querySelector('[data-focus-key='+JSON.stringify(key)+']');if(next)next.focus();}
 }
 function showSettings(){
  if(welcome)welcome.close();
  if(!settingsDialog){settingsDialog=modal('tbUI3-installation-dialog');settingsDialog.setAttribute('aria-label','tbUI3 resource repair');const view=shadowView(settingsDialog);shadow=view.root;content=view.main;}
  renderSettings();syncTheme();openDialog(settingsDialog);shadow.querySelector('h1').focus();
 }
 // In-IDE update notification styled as a Windows 11 toast (not routed through the notification center).
 const toastCss=`
  :host{all:initial}
  .toast{position:fixed;right:16px;bottom:40px;z-index:2147483000;box-sizing:border-box;width:364px;padding:12px 16px 16px;border-radius:8px;
   font-family:"Segoe UI Variable Text","Segoe UI",var(--font-family),sans-serif;font-size:14px;line-height:20px;color:var(--color-text);
   background:var(--toast-bg);border:1px solid var(--toast-border);box-shadow:var(--toast-shadow);
   -webkit-backdrop-filter:blur(30px) saturate(125%);backdrop-filter:blur(30px) saturate(125%);
   animation:toast-in 367ms cubic-bezier(.1,.9,.2,1) both}
  :host([data-theme="dark"]){--toast-bg:rgba(44,44,44,.96);--toast-border:rgba(0,0,0,.4);--toast-shadow:0 8px 16px rgba(0,0,0,.26),0 0 0 1px rgba(255,255,255,.06) inset}
  :host([data-theme="light"]){--toast-bg:rgba(252,252,252,.96);--toast-border:rgba(0,0,0,.06);--toast-shadow:0 8px 16px rgba(0,0,0,.14)}
  .toast.leaving{animation:toast-out 167ms cubic-bezier(1,0,1,1) both}
  @keyframes toast-in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
  @keyframes toast-out{from{opacity:1}to{opacity:0;transform:translateX(40px)}}
  .head{display:flex;align-items:center;gap:8px;height:20px;margin-bottom:12px}
  .icon{font-family:var(--font-family-glyph),"Segoe Fluent Icons","Segoe MDL2 Assets";font-size:16px;line-height:16px;color:var(--color-accent)}
  .app{flex:1;font-size:12px;line-height:16px;color:var(--color-text-muted)}
  .close{display:grid;place-items:center;width:32px;height:28px;margin:-4px -8px -4px 0;padding:0;border:0;border-radius:4px;background:transparent;
   color:var(--color-text-muted);font-family:var(--font-family-glyph),"Segoe Fluent Icons","Segoe MDL2 Assets";font-size:10px;cursor:default}
  .close:hover{background:var(--color-subtle-hover,rgba(128,128,128,.12))}
  .title{margin:0;font-weight:600}
  .body{margin:0;color:var(--color-text-muted)}
  .actions{display:flex;gap:8px;margin-top:16px}
  .actions .button{flex:1 1 0;min-width:0}`;
 function closeToast(){
  const card=toastHost?.shadowRoot.querySelector('.toast');if(!card){toastHost?.remove();toastHost=null;return;}
  card.classList.add('leaving');const host=toastHost;toastHost=null;w.setTimeout(()=>host.remove(),180);
 }
 function showToast(names){
  if(!Array.isArray(names)||!names.length)return;
  if(toastHost)toastHost.remove();
  toastHost=node('div',undefined,d.body,'tbUI3-update-toast');const root=toastHost.attachShadow({mode:'open'});
  const style=node('style',undefined,root);style.textContent=hostCss(env.styles)+toastCss;
  const card=node('section',undefined,root,'toast');card.setAttribute('role','alert');card.setAttribute('aria-label','tbUI3 Updater notification');
  const head=node('div',undefined,card,'head');node('span','\uE896',head,'icon').setAttribute('aria-hidden','true');node('span','tbUI3 Updater',head,'app');
  const x=node('button','\uE8BB',head,'close');x.type='button';x.title='Dismiss';x.setAttribute('aria-label','Dismiss');x.onclick=closeToast;
  node('p','Updates available',card,'title');
  const list=names.map(String),text=list.length===1?list[0]:list.slice(0,-1).join(', ')+' and '+list[list.length-1];
  node('p',text+(list.length===1?' is':' are')+' ready to install.',card,'body');
  const actions=node('div',undefined,card,'actions');
  button('Review',()=>{closeToast();request('check');},actions,true);button('Dismiss',closeToast,actions);
  card.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeToast();}});
  tokens(toastHost);
 }
 // IDE Options gets its own "tbUI3 Updates" category beside the native ones. tips_initUI rebuilds the nav
 // list and pane on every native click or filter, so the observer re-adds both pieces after each rebuild.
 const optionRows=[
  ['Check for updates','Look for new twinBASIC, tbUI3IDE and icon library releases.','Check now',()=>request('check')],
  ['Update preferences','Automatic daily checks and restarting twinBASIC after an update.','Open preferences',()=>request('update-settings')],
  ['Resource repair','Verify or restore the bundled updater and WinUI3 themes.','Open repair',()=>showSettings()],
  ['Welcome to tbUI3IDE','Revisit theme, toolbar and update choices.','Open Welcome',()=>showWelcome()]];
 // The native IDE owns the settings layout, not our action button presentation.
 function optionButton(label,action,parent){
  const host=node('div',undefined,parent,'tbUI3OptionButtonHost'),root=host.attachShadow({mode:'open'});
  let adopted=false;
  if('adoptedStyleSheets' in root&&typeof w.CSSStyleSheet==='function'&&typeof w.CSSStyleSheet.prototype.replaceSync==='function'){
   try{if(!optionSheet){const sheet=new w.CSSStyleSheet();sheet.replaceSync(hostCss(env.styles));optionSheet=sheet;}root.adoptedStyleSheets=[optionSheet];adopted=true;}catch{}
  }
  if(!adopted){const style=node('style',undefined,root);style.textContent=hostCss(env.styles);}
  tokens(host);
  button(label,action,root).classList.add('tbUI3OptionButton');
 }
 function attach(){
  const nav=d.querySelector('.tbis-settingsNavList'),pane=d.querySelector('.tbis-settingsPane');
  if(!nav||!pane)return;
  const filtered=!!d.querySelector('.tbis-settingsSearch')?.value;
  let item=nav.querySelector('.tbUI3InstallationNav'),section=pane.querySelector('.tbUI3InstallationOptions');
  if(!item&&!filtered){
   item=node('div',undefined,nav,'tbis-navItem tbUI3InstallationNav');node('span','tbUI3 Updates',item,'tbis-navItemText');node('span',String(optionRows.length),item,'tbis-navItemCount');
   item.onclick=()=>{for(const n of nav.querySelectorAll('.tbis-navItem'))n.classList.toggle('tbis-navItemSelected',n===item);for(const n of pane.querySelectorAll('.tbis-groupSection'))n.classList.toggle('tbis-groupSectionHidden',n!==section);pane.scrollTop=0;};
  }
  if(!section){
   section=node('div',undefined,pane,'tbis-groupSection tbUI3InstallationOptions');section.dataset.groupId='tbUI3Updates';node('h2','tbUI3 Updates',section,'tbis-groupTitle');
   const rows=node('div',undefined,section,'tbis-groupRows');
   for(const [name,description,label,action]of optionRows){const row=node('div',undefined,rows,'tbis-optionRow tbUI3OptionActions'),labels=node('div',undefined,row,'tbis-optionLabelCol');node('div',name,labels,'tbis-optionName');node('div',description,labels,'tbis-optionDesc');const value=node('div',undefined,row,'tbis-optionValueCol');optionButton(label,action,value);}
  }
  // Visible with All (no filter) or when its own category is selected; a filter never matches it.
  const selected=item?.classList.contains('tbis-navItemSelected'),all=!filtered&&nav.querySelector('.tbis-navItemSelected')?.textContent.startsWith('All');
  section.classList.toggle('tbis-groupSectionHidden',!(selected||all));
 }
 const style=node('style',undefined,d.head);style.textContent=env.dialogStyles;
 attach();const observer=new w.MutationObserver(attach);observer.observe(d.body,{childList:true,subtree:true});
 const themeObserver=new w.MutationObserver(syncTheme);themeObserver.observe(d.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
 startupReady();
 return {startupReady,welcomeOpen:()=>autoPending||!!welcomeShell?.open,show:which=>which==='welcome'?showWelcome():showSettings(),toast:showToast,hide:()=>{if(welcome)welcome.close();closeDialog(settingsDialog);},
  checkForUpdates:()=>{if(!disposed)return request('check');},
  take:()=>{const next=queue.shift();return next?JSON.stringify(next):'';},
  publish:next=>{state=next;if(next.ack?.id)pending.delete(next.ack.id);renderSettings();syncTheme();if(welcome&&pending.size===0){welcome.setSnapshot(wizardSnapshot(next));syncFrame();if(welcome.getState().open&&!confirmation?.open&&!welcomeShell.contains(d.activeElement))welcomeShell.querySelector('iframe')?.focus();}},
  dispose:()=>{disposed=true;if(repairDecision){repairDecision(false);repairDecision=null;}observer.disconnect();themeObserver.disconnect();if(welcome)welcome.destroy();for(const dialog of[welcomeShell,settingsDialog,confirmation,toastHost])if(dialog)dialog.remove();style.remove();d.querySelectorAll('.tbUI3InstallationOptions,.tbUI3InstallationNav').forEach(n=>n.remove());}
 };
})
