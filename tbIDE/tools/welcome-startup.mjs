/* Startup-only production adaptation of the approved Wizard view. */
export function addWelcomeStartup(source) {
    function insert(before, after) {
        if (!source.includes(before)) throw Error('Welcome startup anchor changed: ' + before);
        source = source.replace(before, after);
    }
    insert("return bootstrap.status==='error'", "return snap.startup?.pending || snap.startup?.tasks?.some(task=>task.status==='error') || bootstrap.status==='error'");
    insert("      heading(parent,'Installation needs attention','Review any outstanding setup issues before finishing. Your existing files and customizations are preserved.');", `      const running=snap.startup?.pending;
      heading(parent,running?'Setting up tbUI3IDE':'Installation needs attention',
        running?'These checks run while you are here.':'Review any outstanding setup issues before finishing. Your existing files and customizations are preserved.');
      if(snap.startup?.tasks?.length){
        const labels={registration:'Installation registration',preferences:'Installation preferences',updater:'Updater verification and provisioning',
          themeLight:'WinUI3 Light verification and provisioning',themeDark:'WinUI3 Dark verification and provisioning',themes:'Installed theme discovery',toolbar:'Toolbar initialization'};
        const statuses={pending:'Waiting',running:'In progress',ready:'Ready',error:'Needs attention'};
        const list=dom('ul','welcome-health-list',undefined,parent);
        for(const task of snap.startup.tasks){
          const label=labels[task.id];
          if(!label)continue;
          const row=dom('li','welcome-health-row',undefined,list);
          const text=dom('div','welcome-health-details',undefined,row);
          dom('strong','welcome-health-name',label,text);
          if(task.message)dom('p','welcome-health-description',task.message,text);
          dom('span','welcome-health-status',statuses[task.status]||'Unavailable',row);
        }
      }
      if(running)return;`);
    insert("if(pages[step]==='Setup' && (waiting.has('bootstrap-retry') || waiting.has('repair-resource')))","if(pages[step]==='Setup' && (snap.startup?.pending || waiting.has('bootstrap-retry') || waiting.has('repair-resource')))");
    insert("if(waiting.has('installation-preferences'))sw.setAttribute", "if(snap.startup?.preferencesReady===false || waiting.has('installation-preferences'))sw.setAttribute");
    insert("if(waiting.has('installation-preferences'))return;", "if(snap.startup?.preferencesReady===false || waiting.has('installation-preferences'))return;");
    insert("      const rows=dom('div','settings-list',undefined,parent);", "      if(snap.startup?.preferencesReady===false)info(parent,'Preferences unavailable','Recheck setup or configure preferences later in IDE Options.','warning');\n      const rows=dom('div','settings-list',undefined,parent);");
    insert("if(waiting.has('choose-theme'))block.disabled=true;", "if(snap.startup?.themeReady===false || waiting.has('choose-theme'))block.disabled=true;");
    insert("if(waiting.has('choose-toolbar'))card.disabled=true;", "if(snap.startup?.toolbarReady===false || waiting.has('choose-toolbar'))card.disabled=true;");
    insert("      const descriptions={", "      if(snap.startup?.toolbarReady===false)info(parent,'Toolbar selection unavailable','You can choose a toolbar later in IDE Options.','warning');\n      const descriptions={");
    return source;
}
