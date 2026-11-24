/* Shared by Classic, Hybrid and Ribbon. Native bridge owns all file/process access.
 * The pinned Welcome Master CSS owns control paint and interaction states. Only
 * dialog geometry and application composition are defined here; no IDE-root CSS. */
(function createUpdaterUI(env) {
    'use strict';
    const d=env.document,w=env.window;
    let state={status:'idle',message:'Check published releases for this installation.'};
    let queue=[],busy=false,panel,panelHost,panelBody,notice,noticeHost,observer,autoTimer;
    let appearance={themeMode:env.themeMode?.(),accent:env.accent};
    const selected=new Map();
    const componentNames={ide:'twinBASIC IDE',addin:'tbUI3IDE add-in',themes:'WinUI3 themes',library:'Icon and resource library',updater:'Updater',controlPackage:'Control package download'};
    const preferences={automatic:env.automatic!==false,deferredUntil:Number(env.deferredUntil||0),restart:!!env.restart};
    function node(tag,text,parent,cls){
        const n=d.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;
    }
    function button(label,fn,parent,kind=''){
        const b=node('button',label,parent,'button'+(kind?' button--'+kind:''));b.type='button';b.onclick=fn;return b;
    }
    function applyTokens(host){
        if(!host)return;
        const mode=String(appearance.themeMode||env.themeMode?.()||'light').toLowerCase();
        host.setAttribute('data-theme',mode==='dark'?'dark':'light');
        const names=['light3','light2','light1','','dark1','dark2','dark3'];
        if(Array.isArray(appearance.accent)&&appearance.accent.length===7)appearance.accent.forEach((c,i)=>{
            if(/^#[0-9a-f]{6}$/i.test(c))host.style.setProperty('--win-accent'+(names[i]?'-'+names[i]:''),c);
        });
    }
    function toolkitSurface(parent,cls){
        const host=node('div',undefined,parent),root=host.attachShadow({mode:'open'});
        const css=node('style',undefined,root);
        css.textContent=String(env.masterCss||'').replace(/(?:html)?:root(\[[^\]]+\])?/g,(_,selector)=>selector?':host('+selector+')':':host');
        const layout=node('style',undefined,root);
        layout.textContent='@layer layout{.update-view{display:flex;flex-direction:column;gap:var(--space-3);font:var(--font-size-body,14px) var(--font-family);color:var(--color-text);background:var(--color-flyout);padding:var(--space-6);max-height:78vh;overflow:auto;box-sizing:border-box}.update-view h2,.update-view p{margin:0}.update-view h2{font-size:var(--font-size-page-title,20px);font-weight:600}.update-list{display:flex;flex-direction:column;gap:var(--space-2)}.update-row{display:flex;flex-direction:column;gap:var(--space-2);padding:var(--space-3);overflow-wrap:anywhere}.update-actions,.update-links{display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-2)}.update-actions{justify-content:flex-end;padding-top:var(--space-3);border-top:1px solid var(--color-divider)}.update-meta{color:var(--color-text-muted);font-size:var(--font-size-caption,12px)}.update-notice{font:var(--font-size-body,14px) var(--font-family);color:var(--color-text)}.update-notice .update-actions{border:0;padding-top:var(--space-2);justify-content:flex-start}.update-view a{color:var(--color-accent-link)}}';
        applyTokens(host);return{host,body:node('div',undefined,root,cls)};
    }
    function closePanel(){if(!panel)return;if(typeof panel.close==='function')panel.close();else panel.removeAttribute('open');}
    function removeNotice(){notice?.remove();notice=null;noticeHost=null;}
    function send(action,data){
        if(busy&&action!=='cancel'&&action!=='preferences'&&action!=='later')return;
        queue.push({action,...(data||{})});
    }
    function requestCheck(){
        if(busy)return;busy=true;state={...state,status:'checking',message:'Checking published releases...'};
        render();queue.push({action:'check'});
    }
    function show(){
        if(!panel){
            panel=node('dialog');panel.id='tbUI3UpdaterDialog';panel.setAttribute('aria-label','Updates for twinBASIC and tbUI3');
            panel.addEventListener('keydown',e=>e.stopPropagation());
            d.body.appendChild(panel);
            const view=toolkitSurface(panel,'update-view');panelHost=view.host;panelBody=view.body;
        }
        render();removeNotice();
        if(!panel.open){if(typeof panel.showModal==='function')panel.showModal();else panel.setAttribute('open','');}
    }
    function scheduleAutomatic(delay){
        w.clearTimeout(autoTimer);
        if(!preferences.automatic)return;
        autoTimer=w.setTimeout(()=>{
            if(preferences.automatic&&!busy)requestCheck();
            if(preferences.automatic)scheduleAutomatic(24*60*60*1000);
        },delay);
    }
    function selectedUpdates(){
        return [...panelBody.querySelectorAll('input[data-component]:checked:not(:disabled)')].map(n=>n.getAttribute('data-component'));
    }
    function stage(choice){
        if(busy)return;
        const selection=selectedUpdates();if(!selection.length)return;
        const restart=panelBody.querySelector('[data-restart]').checked;
        send(choice,{selected:selection,restart});busy=true;
        state={...state,status:'staging',message:'Downloading and verifying selected updates...'};render();
    }
    function later(){
        if(['staging','ready','waiting'].includes(state.status))send('cancel');
        preferences.deferredUntil=Date.now()+24*60*60*1000;
        send('later',{deferredUntil:preferences.deferredUntil});removeNotice();closePanel();
    }
    function choice(label,parent,checked,onchange){
        const row=node('label',undefined,parent,'choice'),input=node('input',undefined,row);
        input.type='checkbox';input.checked=checked;node('span',label,row);
        input.onchange=()=>onchange(input);return input;
    }
    function info(parent,title,message,kind='info'){
        const box=node('div',undefined,parent,'info-bar info-bar--'+kind);
        node('span',undefined,box,'info-bar__icon').setAttribute('aria-hidden','true');
        const copy=node('div',undefined,box);node('div',title,copy,'info-bar__title');
        if(message)node('div',message,copy,'info-bar__message');return copy;
    }
    function render(){
        if(!panelBody)return;
        applyTokens(panelHost);panelBody.replaceChildren();
        node('h2','Updates for twinBASIC and tbUI3',panelBody);
        const message=state.message||'';
        if(message){if(state.status==='error')info(panelBody,'Update check needs attention',message,'warning');else node('p',message,panelBody).setAttribute('role','status');}
        const links=node('div',undefined,panelBody,'update-links');
        button('Check for Updates',requestCheck,links,'subtle').disabled=busy;
        if(env.installationSettings)button('Settings and repair',()=>{closePanel();env.installationSettings();},links,'subtle');
        const automatic=choice('Check automatically once a day',panelBody,preferences.automatic,input=>{
            preferences.automatic=input.checked;scheduleAutomatic(10000);send('preferences',{automatic:input.checked});
        });automatic.dataset.automatic='';
        const catalog=state.catalog||{components:[],errors:[]};
        const list=node('div',undefined,panelBody,'update-list');
        for(const c of catalog.components||[]){
            const row=node('section',undefined,list,'card update-row');
            const input=choice(componentNames[c.id]||c.id,row,!!c.available&&(selected.get(c.id)??true),control=>{
                selected.set(c.id,control.checked);updateActions();
            });
            input.setAttribute('data-component',c.id);input.disabled=!c.available||busy;
            node('p','Installed: '+(c.installed==='0'?'Not installed / unversioned':c.installed)+'; Available: '+c.version,row,'update-meta');
            if(c.summary)node('p',c.summary,row);
            if(c.architectures)node('p','Win32 installed '+c.architectures.win32+'; Win64 installed '+c.architectures.win64,row,'update-meta');
            if(c.compatible===false)info(row,'Compatibility','This add-in supports IDE builds '+c.minIdeBuild+' to '+c.maxIdeBuild+'. Select a compatible IDE/add-in combination.','warning');
            if(typeof c.source==='string'&&/^https:\/\/github\.com\//i.test(c.source)){
                const link=node('a','Published release',row);link.href=c.source;link.target='_blank';link.rel='noopener noreferrer';
            }
        }
        for(const error of catalog.errors||[]){
            if(/icon library:\s*missing icon library version\.?/i.test(String(error))){
                info(panelBody,'Optional icon library','Its version could not be determined. IDE and add-in updates remain available. Manage the icon library from the icon picker Setup controls.','info');
            }else info(panelBody,'Release source unavailable',String(error),'warning');
        }
        const restart=choice('Restart this IDE after a successful update',panelBody,preferences.restart,input=>{preferences.restart=input.checked;});
        restart.setAttribute('data-restart','');
        if(!busy&&(catalog.components||[]).some(c=>c.available))button('Remind Me Later',later,panelBody,'subtle');
        if(state.status==='error'&&state.recovery)node('p','Recovery journal: '+state.recovery+'. Open installation settings and repair for recovery.',panelBody,'update-meta');
        const actions=node('footer',undefined,panelBody,'update-actions');let now,exit;
        function updateActions(){const disabled=busy||selectedUpdates().length===0;if(now)now.disabled=disabled;if(exit)exit.disabled=disabled;}
        if(['staging','ready','waiting'].includes(state.status))button('Cancel Pending Update',()=>send('cancel'),actions,'primary');
        else if((catalog.components||[]).some(c=>c.available)){
            now=button('Update Now',()=>stage('now'),actions,'primary');
            exit=button('Update on Exit',()=>stage('exit'),actions);updateActions();
        }
        button('Close',closePanel,actions);
    }
    function attachOptions(){
        for(const name of d.querySelectorAll('.tbis-optionName')){
            if(name.textContent.trim()!=='Colour Theme')continue;
            const anchor=name.closest('.tbis-optionRow');if(!anchor||anchor.parentElement.querySelector('.tbUI3UpdateOptions'))continue;
            const row=node('div');row.className='tbis-optionRow tbUI3UpdateOptions tbUI3OptionActions';
            node('div','tbUI3 updates',row,'tbis-optionLabelCol');const value=node('div',undefined,row,'tbis-optionValueCol');
            button('Check for Updates',()=>{show();if(!busy)requestCheck();},value);anchor.after(row);
        }
    }
    function publish(result){
        if(!result||typeof result.status!=='string')return;
        const oldCatalog=state.catalog;
        if(result.catalog&&result.catalog!==oldCatalog&&result.status==='checked')selected.clear();
        state={...result,catalog:result.catalog||oldCatalog};
        busy=['checking','staging','ready','waiting','installing','rollingBack'].includes(state.status);
        render();
        const available=(state.catalog?.components||[]).some(c=>c.available);
        if(state.status==='checked'&&available&&Date.now()>=preferences.deferredUntil&&!panel?.open&&!notice){
            notice=node('aside');notice.id='tbUI3UpdateNotice';notice.setAttribute('role','status');d.body.appendChild(notice);
            const view=toolkitSurface(notice,'update-notice');noticeHost=view.host;
            const copy=info(view.body,'Updates are available','New versions are available for twinBASIC or tbUI3.');
            const actions=node('div',undefined,copy,'update-actions');
            button('Review updates',show,actions,'primary');button('Remind Me Later',later,actions,'subtle');
        }else if(state.status==='checked'&&!available)removeNotice();
    }
    const style=node('style');style.id='tbUI3UpdaterCss';
    // Outer placement and native top-layer modality only. Toolkit tokens style the content.
    style.textContent='#tbUI3UpdaterDialog{box-sizing:border-box;border:0;border-radius:8px;padding:0;margin:auto;width:min(700px,calc(100vw - 48px));max-height:86vh;overflow:hidden;background:Canvas;color:CanvasText}#tbUI3UpdaterDialog::backdrop{background:rgba(0,0,0,.40)}#tbUI3UpdateNotice{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:min(440px,calc(100vw - 32px))}.tbUI3OptionActions button{font:inherit;padding:6px 12px;margin:4px;border-radius:4px}';
    d.head.appendChild(style);attachOptions();
    observer=new w.MutationObserver(attachOptions);observer.observe(d.body,{childList:true,subtree:true});
    scheduleAutomatic(env.checkDue===false?24*60*60*1000:10000);
    return{
        show,publish,
        setAppearance:next=>{appearance={themeMode:next.themeMode,accent:next.accent};applyTokens(panelHost);applyTokens(noticeHost);},
        setPreferences:next=>{const changed=preferences.automatic!==next.automatic;preferences.automatic=next.automatic;preferences.deferredUntil=next.deferredUntil;preferences.restart=next.restart;if(changed)scheduleAutomatic(10000);render();},
        take:()=>{const q=queue.shift();return q?JSON.stringify(q):'';},
        closeIde:()=>env.closeIde(),
        dispose:()=>{observer.disconnect();w.clearTimeout(autoTimer);panel?.remove();removeNotice();style.remove();d.querySelectorAll('.tbUI3UpdateOptions').forEach(n=>n.remove());}
    };
})
