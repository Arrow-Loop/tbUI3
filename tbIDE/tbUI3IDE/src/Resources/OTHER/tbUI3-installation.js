(function createInstallationUI(env) {
 'use strict';
 const d=env.document,w=env.window,queue=[],pending=new Set();
 let state=env.state,settingsDialog,shadow,content,welcomeShell,welcome,confirmation,confirmationContent,disposed=false,serial=0,previousFocus,repairDecision;
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
 function syncTheme(){syncFrame();if(shadow)tokens(shadow.host);if(welcomeShell)tokens(welcomeShell);if(confirmationContent)tokens(confirmationContent.getRootNode().host);}
 function modal(className){const dialog=node('dialog',undefined,d.body,className);dialog.addEventListener('keydown',e=>e.stopPropagation());return dialog;}
 function shadowView(dialog){const host=node('div',undefined,dialog),root=host.attachShadow({mode:'open'}),style=node('style',undefined,root);style.textContent=env.styles.replace(/:root/g,':host');return {root,main:node('main',undefined,root,'installation-content')};}
 function confirmRepair(resource,fromWizard=false){
  if(!['updater','themeDark','themeLight'].includes(resource.id))throw Error('Unsupported resource repair.');
  if(!confirmation){confirmation=modal('tbUI3-installation-dialog');confirmation.setAttribute('aria-label','Confirm resource reset');confirmationContent=shadowView(confirmation).main;confirmation.addEventListener('cancel',()=>{if(repairDecision){repairDecision(false);repairDecision=null;}});}
  confirmationContent.replaceChildren();node('h1','Back up and reset this resource?',confirmationContent);node('p',resource.path||resource.id,confirmationContent,'installation-path');
  node('p','This replaces the customized file with the verified bundled copy after retaining a verified backup. A newer updater will never be downgraded. Your selected IDE theme will stay unchanged.',confirmationContent);
  const row=field('I approve keeping a backup and resetting this file',confirmationContent),approve=node('input',undefined,row);approve.type='checkbox';
  const actions=node('footer',undefined,confirmationContent,'installation-actions');const settle=approved=>{closeDialog(confirmation);welcomeShell?.querySelector('iframe')?.focus();if(repairDecision){repairDecision(approved);repairDecision=null;}else if(approved)request('repair-resource',{id:resource.id,confirmed:true});};
  button('Cancel',()=>settle(false),actions);
  const reset=button('Back up and reset',()=>settle(true),actions,true);reset.disabled=true;approve.onchange=()=>{reset.disabled=!approve.checked;};
  tokens(confirmationContent.getRootNode().host);openDialog(confirmation);approve.focus();if(fromWizard)return new Promise(resolve=>{repairDecision=resolve;});return false;
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
  welcomeShell.addEventListener('cancel',e=>{e.preventDefault();request('welcome-record',{schema:1,disposition:'dismissed'});welcome.close();});
 }
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
    frame.hidden=true;const view=shadowView(welcomeShell);tokens(view.root.host);node('h1','Welcome controls unavailable',view.main);const alert=node('p','The IDE could not initialize the embedded iframe runtime. Close this dialog and inspect the IDE Debug Console.',view.main);alert.setAttribute('role','alert');button('Close',()=>welcome.close(),view.main);return;
   }
   syncFrame();frame.focus();
  },{once:true});
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
 function attach(){
  for(const name of d.querySelectorAll('.tbis-optionName')){
   if(name.textContent.trim()!=='Colour Theme')continue;
   const anchor=name.closest('.tbis-optionRow');if(!anchor||anchor.parentElement.querySelector('.tbUI3InstallationOptions'))continue;
   const row=node('div',undefined,undefined,'tbis-optionRow tbUI3InstallationOptions tbUI3OptionActions');node('div','tbUI3 installations',row,'tbis-optionLabelCol');const col=node('div',undefined,row,'tbis-optionValueCol');button('Check for Updates',()=>request('check'),col);button('Update settings',()=>request('update-settings'),col);button('Resource repair',showSettings,col);button('Welcome to tbUI3IDE',showWelcome,col);anchor.after(row);
  }
 }
 const style=node('style',undefined,d.head);style.textContent=env.dialogStyles;
 attach();const observer=new w.MutationObserver(attach);observer.observe(d.body,{childList:true,subtree:true});
 const themeObserver=new w.MutationObserver(syncTheme);themeObserver.observe(d.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
 if(env.showWelcome&&env.canAutoWelcome?.()&&!disposed)showWelcome();
 return {show:which=>which==='welcome'?showWelcome():showSettings(),hide:()=>{if(welcome)welcome.close();closeDialog(settingsDialog);},
  take:()=>{const next=queue.shift();return next?JSON.stringify(next):'';},
  publish:next=>{state=next;if(next.ack?.id)pending.delete(next.ack.id);renderSettings();syncTheme();if(welcome&&pending.size===0){welcome.setSnapshot(wizardSnapshot(next));syncFrame();if(welcome.getState().open&&!confirmation?.open&&!welcomeShell.contains(d.activeElement))welcomeShell.querySelector('iframe')?.focus();}},
  dispose:()=>{disposed=true;if(repairDecision){repairDecision(false);repairDecision=null;}observer.disconnect();themeObserver.disconnect();if(welcome)welcome.destroy();for(const dialog of[welcomeShell,settingsDialog,confirmation])if(dialog)dialog.remove();style.remove();d.querySelectorAll('.tbUI3InstallationOptions').forEach(n=>n.remove());}
 };
})
