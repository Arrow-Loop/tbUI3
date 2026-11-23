/* Shared by Classic, Hybrid and Ribbon. Native bridge owns all file/process access. */
(function createUpdaterUI(env) {
    'use strict';
    const d = env.document, w = env.window;
    let state = { status: 'idle', message: 'Check published releases for this installation.' };
    let queue = [], busy = false, panel, notice, observer, autoTimer;
    const componentNames={ide:'twinBASIC IDE',addin:'tbUI3IDE add-in',themes:'WinUI3 themes',library:'Icon and resource library',updater:'Updater',controlPackage:'Control package download'};
    const preferences = {
        automatic: env.automatic !== false,
        deferredUntil: Number(env.deferredUntil || 0),
        restart: !!env.restart
    };
    function node(tag, text, parent) {
        const n = d.createElement(tag); if (text !== undefined) n.textContent = text;
        if (parent) parent.appendChild(n); return n;
    }
    function button(label, fn, parent) {
        const b = node('button', label, parent); b.type = 'button'; b.onclick = fn; return b;
    }
    function send(action, data) {
        if (busy && action !== 'cancel' && action !== 'preferences' && action !== 'later') return;
        queue.push({ action, ...(data || {}) });
    }
    function requestCheck() { if (busy) return; busy = true; state = { status: 'checking', message: 'Checking published releases...' }; render(); queue.push({ action: 'check' }); }
    function show() {
        if (!panel) {
            panel = node('dialog'); panel.id = 'tbUI3UpdaterDialog'; panel.setAttribute('aria-labelledby', 'tbUI3UpdaterTitle');
            panel.addEventListener('cancel', () => {});
            d.body.appendChild(panel);
        }
        render();
        if (!panel.open) { if (typeof panel.showModal === 'function') panel.showModal(); else panel.setAttribute('open',''); }
    }
    function scheduleAutomatic(delay) {
        w.clearTimeout(autoTimer);
        if (!preferences.automatic) return;
        autoTimer=w.setTimeout(()=>{
            if(preferences.automatic && !busy) requestCheck();
            scheduleAutomatic(24*60*60*1000);
        },delay);
    }
    function selectedUpdates() {
        return [...panel.querySelectorAll('input[data-component]:checked')].map(n => n.getAttribute('data-component'));
    }
    function stage(choice) {
        const selected = selectedUpdates();
        if (!selected.length) return;
        const restart = panel.querySelector('[data-restart]').checked;
        send(choice, { selected, restart }); busy = true;
        state = { ...state, status:'staging', message:'Downloading and verifying selected updates...' }; render();
    }
    function later() {
        if (['staging','ready','waiting'].includes(state.status)) send('cancel');
        preferences.deferredUntil = Date.now() + 24 * 60 * 60 * 1000;
        send('later', { deferredUntil: preferences.deferredUntil });
        if (notice) notice.remove(); notice = null; if (panel) panel.close();
    }
    function render() {
        if (!panel) return;
        panel.replaceChildren();
        const heading = node('h2','Updates for twinBASIC and tbUI3',panel); heading.id='tbUI3UpdaterTitle';
        node('p',state.message || '',panel).setAttribute('role','status');
        const autoLabel=node('label',undefined,panel), auto=node('input',undefined,autoLabel);
        auto.type='checkbox'; auto.checked=preferences.automatic;
        auto.onchange=() => {preferences.automatic=auto.checked;scheduleAutomatic(10000);send('preferences',{automatic:auto.checked});};
        autoLabel.appendChild(d.createTextNode(' Check automatically once a day'));
        const catalog=state.catalog || {components:[],errors:[]};
        const list=node('div',undefined,panel); list.className='tbUI3UpdateComponents';
        for (const c of catalog.components || []) {
            const row=node('section',undefined,list), label=node('label',undefined,row), input=node('input',undefined,label);
            input.type='checkbox'; input.setAttribute('data-component',c.id);
            input.disabled=!c.available || busy;
            input.checked=!!c.available;
            label.appendChild(d.createTextNode((componentNames[c.id]||c.id)+' — installed '+(c.installed==='0'?'not installed / unversioned':c.installed)+'; available '+c.version));
            node('p',c.summary,row);
            if(c.architectures) node('p','win32 installed '+c.architectures.win32+'; win64 installed '+c.architectures.win64,row);
            if (c.compatible===false) node('p','Compatibility: this add-in supports IDE builds '+c.minIdeBuild+'–'+c.maxIdeBuild+'. Select a compatible IDE/add-in combination.',row);
            const link=node('a','Published release',row); link.href=c.source; link.target='_blank'; link.rel='noopener noreferrer';
        }
        for (const error of catalog.errors || []) node('p',error,panel);
        const restartLabel=node('label',undefined,panel), restart=node('input',undefined,restartLabel);
        restart.type='checkbox'; restart.checked=preferences.restart; restart.setAttribute('data-restart',''); restartLabel.appendChild(d.createTextNode(' Restart this IDE after a successful update'));
        const actions=node('div',undefined,panel); actions.className='tbUI3UpdateActions';
        button('Check for Updates',requestCheck,actions).disabled=busy;
        const available=(catalog.components || []).some(c=>c.available);
        button('Update Now',()=>stage('now'),actions).disabled=busy || !available;
        button('Update on Exit',()=>stage('exit'),actions).disabled=busy || !available;
        button('Remind Me Later',later,actions);
        if (['ready','waiting'].includes(state.status)) button('Cancel Pending Update',()=>send('cancel'),actions);
        if (state.status==='error' && state.recovery) node('p','Recovery journal: '+state.recovery+'. Use Updater.exe -Mode Recover with this session context after closing the IDE.',panel);
        if(env.installationSettings)button('Installation settings and repair',()=>{panel.close();env.installationSettings();},actions);
        button('Close',()=>panel.close(),actions);
    }
    function attachOptions() {
        // Works even when native Options is rebuilt/filtered and in all toolbar modes.
        for (const name of d.querySelectorAll('.tbis-optionName')) {
            if (name.textContent.trim() !== 'Colour Theme') continue;
            const anchor=name.closest('.tbis-optionRow'); if (!anchor || anchor.parentElement.querySelector('.tbUI3UpdateOptions')) continue;
            const row=node('div'); row.className='tbis-optionRow tbUI3UpdateOptions tbUI3OptionActions';
            const label=node('div','tbUI3 updates',row); label.className='tbis-optionLabelCol';
            const value=node('div',undefined,row); value.className='tbis-optionValueCol';
            button('Check for Updates',()=>{show();if(!busy)requestCheck();},value); anchor.after(row);
        }
    }
    function publish(result) {
        if (!result || typeof result.status !== 'string') return;
        const oldCatalog=state.catalog;
        state={...result,catalog:result.catalog || oldCatalog};
        busy=['checking','staging','ready','waiting','installing','rollingBack'].includes(state.status);
        render();
        if (state.status==='checked' && (state.catalog.components || []).some(c=>c.available) && Date.now()>=preferences.deferredUntil) {
            if (!notice) {
                notice=node('aside'); notice.id='tbUI3UpdateNotice'; notice.setAttribute('role','status');
                node('span','Updates are available for twinBASIC / tbUI3. ',notice);
                button('Review updates',show,notice); button('Remind Me Later',later,notice); d.body.appendChild(notice);
            }
        }
    }
    const style=node('style'); style.id='tbUI3UpdaterCss';
    style.textContent='#tbUI3UpdaterDialog{color:var(--themeGeneralTextColor,CanvasText);background:var(--themeGeneralBackColor,Canvas);border:1px solid GrayText;border-radius:8px;padding:24px;max-width:700px;width:calc(100% - 80px);max-height:80vh;overflow:auto;font:14px Segoe UI,sans-serif}#tbUI3UpdaterDialog,#tbUI3UpdateNotice{color-scheme:light}.darkMode #tbUI3UpdaterDialog,.darkMode #tbUI3UpdateNotice{color-scheme:dark}#tbUI3UpdaterDialog h2{font-size:20px}#tbUI3UpdaterDialog p{white-space:pre-wrap;overflow-wrap:anywhere}#tbUI3UpdaterDialog button,#tbUI3UpdateNotice button,.tbUI3OptionActions button{font:inherit;padding:6px 12px;margin:4px;border-radius:4px}#tbUI3UpdaterDialog section{border-bottom:1px solid GrayText;padding:12px 0}.tbUI3UpdateActions{margin-top:16px}#tbUI3UpdateNotice{position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:12px;background:var(--themeGeneralBackColor,Canvas);color:var(--themeGeneralTextColor,CanvasText);border:1px solid GrayText;border-radius:8px}';
    d.head.appendChild(style); attachOptions();
    observer=new w.MutationObserver(attachOptions); observer.observe(d.body,{childList:true,subtree:true});
    scheduleAutomatic(env.checkDue===false?24*60*60*1000:10000);
    return {
        show, publish,
        setPreferences:next=>{const changed=preferences.automatic!==next.automatic;preferences.automatic=next.automatic;preferences.deferredUntil=next.deferredUntil;preferences.restart=next.restart;if(changed)scheduleAutomatic(10000);render();},
        take:()=>{const q=queue.shift();return q?JSON.stringify(q):'';},
        // Normal native IDE command runs its save/unsaved-document close path.
        closeIde:()=>env.closeIde(),
        dispose:()=>{observer.disconnect();w.clearTimeout(autoTimer);if(panel)panel.remove();if(notice)notice.remove();style.remove();d.querySelectorAll('.tbUI3UpdateOptions').forEach(n=>n.remove());}
    };
})
