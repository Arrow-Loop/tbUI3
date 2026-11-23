(function createInstallationUI(env) {
 'use strict';
 const d=env.document,w=env.window,queue=[],pending=new Set();
 let state=env.state,settingsDialog,shadow,content,welcomeShell,welcome,confirmation,confirmationContent,disposed=false,serial=0,previousFocus,welcomeTimer,repairDecision;
 const wizardActions=new Set(['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']);
 function node(tag,text,parent,className){const n=d.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;if(parent)parent.append(n);return n;}
 function button(text,action,parent,accent=false){const n=node('button',text,parent,'button'+(accent?' button--accent':''));n.type='button';n.onclick=action;return n;}
 function request(action,data={}){const requestId='installation-'+(++serial);pending.add(requestId);queue.push({action,...data,requestId});return requestId;}
 function status(text,parent){const n=node('p',text,parent,'installation-status');n.setAttribute('role','status');return n;}
 function field(label,parent){const row=node('label',undefined,parent,'settings-row');node('span','\uE713',row,'settings-row__glyph').setAttribute('aria-hidden','true');node('span',label,row,'settings-row__title');return row;}
 function closeDialog(dialog){if(!dialog)return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
 function openDialog(dialog){if(dialog.open)return;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
 function themeMode(){return env.themeMode&&String(env.themeMode()).toLowerCase()==='dark'?'dark':'light';}
 function tokens(element){
  element.setAttribute('data-theme',themeMode());
  const keys=['light3','light2','light1','','dark1','dark2','dark3'];
  if(Array.isArray(state.accent)&&state.accent.length===7)state.accent.forEach((color,i)=>{if(/^#[0-9a-f]{6}$/i.test(color))element.style.setProperty('--win-accent'+(keys[i]?'-'+keys[i]:''),color);});
 }
 function syncTheme(){if(shadow)tokens(shadow.host);if(welcomeShell)tokens(welcomeShell);if(confirmationContent)tokens(confirmationContent.getRootNode().host);}
 function modal(className){const dialog=node('dialog',undefined,d.body,className);dialog.addEventListener('keydown',e=>e.stopPropagation());return dialog;}
 function shadowView(dialog){const host=node('div',undefined,dialog),root=host.attachShadow({mode:'open'}),style=node('style',undefined,root);style.textContent=env.styles.replace(/:root/g,':host');return {root,main:node('main',undefined,root,'installation-content')};}
 function confirmRepair(resource,fromWizard=false){
  if(!['updater','themeDark','themeLight'].includes(resource.id))throw Error('Unsupported resource repair.');
  if(!confirmation){confirmation=modal('tbUI3-installation-dialog');confirmation.setAttribute('aria-label','Confirm resource reset');confirmationContent=shadowView(confirmation).main;confirmation.addEventListener('cancel',()=>{if(repairDecision){repairDecision(false);repairDecision=null;}});}
  confirmationContent.replaceChildren();node('h1','Back up and reset this resource?',confirmationContent);node('p',resource.path||resource.id,confirmationContent,'installation-path');
  node('p','This replaces the customized file with the verified bundled copy after retaining a verified backup. A newer updater will never be downgraded. Your selected IDE theme will stay unchanged.',confirmationContent);
  const row=field('I approve keeping a backup and resetting this file',confirmationContent),approve=node('input',undefined,row);approve.type='checkbox';
  const actions=node('footer',undefined,confirmationContent,'installation-actions');const settle=approved=>{closeDialog(confirmation);if(repairDecision){repairDecision(approved);repairDecision=null;}else if(approved)request('repair-resource',{id:resource.id,confirmed:true});};
  button('Cancel',()=>settle(false),actions);
  const reset=button('Back up and reset',()=>settle(true),actions,true);reset.disabled=true;approve.onchange=()=>{reset.disabled=!approve.checked;};
  tokens(confirmationContent.getRootNode().host);openDialog(confirmation);approve.focus();if(fromWizard)return new Promise(resolve=>{repairDecision=resolve;});return false;
 }
 function ensureWelcome(){
  if(welcome)return;
  if(typeof w.tbUI3CreateWelcomeWizard!=='function')throw Error('The embedded Welcome Wizard is unavailable.');
  welcomeShell=modal('tbUI3-welcome-shell');welcomeShell.setAttribute('aria-label','Welcome to tbUI3IDE');
  const tokenStyle=node('style',undefined,welcomeShell);tokenStyle.textContent=env.welcomeTokens;
  welcome=w.tbUI3CreateWelcomeWizard({document:d,mount:welcomeShell,cssText:env.welcomeStyles,source:'native-addin',
   send:message=>{if(!message||!wizardActions.has(message.action))throw Error('Unsupported wizard operation.');const {action,...data}=message;request(action,data);},
   confirmRepair:resource=>confirmRepair(resource,true),
   onClose:()=>{closeDialog(welcomeShell);if(previousFocus&&previousFocus.isConnected)previousFocus.focus();}
  });
  welcomeShell.addEventListener('cancel',e=>{e.preventDefault();request('welcome-record',{schema:1,disposition:'dismissed'});welcome.close();});
 }
 function showWelcome(){
  if(settingsDialog)closeDialog(settingsDialog);
  ensureWelcome();previousFocus=d.activeElement;tokens(welcomeShell);openDialog(welcomeShell);welcome.open(state);
 }
 function preferences(parent){
  if(state.settingsError){
   status('Stored settings are unavailable and were preserved: '+state.settingsError,parent);
   const row=field('Back up and reset these installation preferences',parent),approve=node('input',undefined,row);approve.type='checkbox';
   const reset=button('Back up and reset preferences',()=>request('reset-installation-settings',{confirmed:true}),parent);reset.disabled=true;approve.onchange=()=>{reset.disabled=!approve.checked;};return;
  }
  const autoRow=field('Check for updates once a day for this IDE',parent),auto=node('input',undefined,autoRow);auto.type='checkbox';auto.checked=state.preferences.automatic;auto.dataset.focusKey='automatic';auto.onchange=()=>request('installation-preferences',{automatic:auto.checked});
  const channelRow=field('tbUI3 release channel',parent),channel=node('select',undefined,channelRow,'settings-row__control');channel.setAttribute('aria-label','tbUI3 release channel');channel.dataset.focusKey='channel';
  for(const [value,label]of[['development','Development prereleases'],['stable','Stable releases only']]){const option=node('option',label,channel);option.value=value;}
  channel.value=state.preferences.channel;channel.onchange=()=>request('installation-preferences',{channel:channel.value});
  const restartRow=field('Restart this IDE after a successful update',parent),restart=node('input',undefined,restartRow);restart.type='checkbox';restart.checked=state.preferences.restart;restart.dataset.focusKey='restart';restart.onchange=()=>request('installation-preferences',{restart:restart.checked});
 }
 function renderSettings(){
  if(!content)return;
  const active=shadow.activeElement,key=active?.dataset.focusKey;
  content.replaceChildren();const title=node('h1','tbUI3 installations',content);title.tabIndex=-1;
  node('p','Preferences, approvals and recovery below belong only to this IDE. The per-user add-in, updater and themes are shared.',content);
  node('p',state.root,content,'installation-path');node('p','Installation ID: '+state.installationId,content,'installation-path');
  node('p','IDE update strategy: In-place (recommended)',content);preferences(content);
  node('p','Downloads and installation require approval. Update Now follows normal save prompts; Update on Exit waits for an accepted shutdown.',content);
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
  button('Recheck and repair missing resources',()=>request('bootstrap-retry'),content);
  if(state.recovery){status('An unfinished transaction needs recovery. It will wait for IDE processes to close normally.',content);button('Open recovery',()=>request('open-recovery'),content);}
  if(state.message)status(state.message,content);
  const footer=node('footer',undefined,content,'installation-actions');button('Welcome to tbUI3IDE',showWelcome,footer);button('Close',()=>closeDialog(settingsDialog),footer);
  if(key){const next=shadow.querySelector('[data-focus-key='+JSON.stringify(key)+']');if(next)next.focus();}
 }
 function showSettings(){
  if(welcome)welcome.close();
  if(!settingsDialog){settingsDialog=modal('tbUI3-installation-dialog');settingsDialog.setAttribute('aria-label','tbUI3 installation settings and repair');const view=shadowView(settingsDialog);shadow=view.root;content=view.main;}
  renderSettings();syncTheme();openDialog(settingsDialog);shadow.querySelector('h1').focus();
 }
 function attach(){
  for(const name of d.querySelectorAll('.tbis-optionName')){
   if(name.textContent.trim()!=='Colour Theme')continue;
   const anchor=name.closest('.tbis-optionRow');if(!anchor||anchor.parentElement.querySelector('.tbUI3InstallationOptions'))continue;
   const row=node('div',undefined,undefined,'tbis-optionRow tbUI3InstallationOptions tbUI3OptionActions');node('div','tbUI3 installations',row,'tbis-optionLabelCol');const col=node('div',undefined,row,'tbis-optionValueCol');button('Settings and repair',showSettings,col);button('Welcome to tbUI3IDE',showWelcome,col);anchor.after(row);
  }
 }
 const style=node('style',undefined,d.head);style.textContent=env.dialogStyles;
 attach();const observer=new w.MutationObserver(attach);observer.observe(d.body,{childList:true,subtree:true});
 const themeObserver=new w.MutationObserver(syncTheme);themeObserver.observe(d.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
 if(env.showWelcome)welcomeTimer=w.setTimeout(()=>{if(!disposed)showWelcome();},1000);
 return {show:which=>which==='welcome'?showWelcome():showSettings(),hide:()=>{if(welcome)welcome.close();closeDialog(settingsDialog);},
  take:()=>{const next=queue.shift();return next?JSON.stringify(next):'';},
  publish:next=>{state=next;if(next.ack?.id)pending.delete(next.ack.id);renderSettings();syncTheme();if(welcome&&pending.size===0){welcome.setSnapshot(next);if(welcome.getState().open&&!welcomeShell.contains(d.activeElement))welcomeShell.querySelector('button')?.focus();}},
  dispose:()=>{disposed=true;if(repairDecision){repairDecision(false);repairDecision=null;}w.clearTimeout(welcomeTimer);observer.disconnect();themeObserver.disconnect();if(welcome)welcome.destroy();for(const dialog of[welcomeShell,settingsDialog,confirmation])if(dialog)dialog.remove();style.remove();d.querySelectorAll('.tbUI3InstallationOptions').forEach(n=>n.remove());}
 };
})
