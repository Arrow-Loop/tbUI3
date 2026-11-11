/* Office-style organization for the IDE's live descriptors. This is presentation
 * metadata only: all actions, contexts and lazy submenus remain native. Unknown
 * commands/menus are deliberately retained rather than filtered by this map. */
(function buildRibbonLayout(records, quickActions=new Set(),present=()=>({large:false})) {
    const tabs=new Map(), file=new Map(), suppressed=[];
    tabs.set('Home',new Map());
    const order=['Home','Insert','Code','Form','View','Project','Debug','Tools','Add-ins','Help'];
    const groups={Home:['Clipboard','Editing'],Insert:['Components'],Code:['Comments','Formatting','Navigation','Outlining','Case'],
        Form:['Arrange','Size','Spacing','Position','Protection','Designer'],View:['Views','Show','Zoom','Window','Appearance'],
        Project:['Project','Build','Compiler','Folders'],Debug:['Stepping','Breakpoints','Watches','Execution','Options']};
    const get=(map,key,make)=>{if(!map.has(key))map.set(key,make());return map.get(key);};
    const add=(tab,group,item)=>get(get(tabs,tab,()=>new Map()),group,()=>[]).push(item);
    const addFile=(key,item)=>get(file,key,()=>[]).push(item);
    const token=(i,name)=>String(i.name||'').includes(name);
    const quick=a=>quickActions.has(a)||/^tb(?:Editor|FormDesigner)_(Undo|Redo)$/.test(a)||/^tbDebug_(StartOrContinue|BreakInto|Stop)$/.test(a);
    for(const r of records){const i=r.item,a=typeof i.action==='string'?i.action:'',m=r.menuId;
        if(!i.name)continue;
        if(i._ribbonTab){add(i._ribbonTab,i._ribbonGroup,i);continue;}
        if(m==='rootMenuFile'){
            const section={tbProject_New:'New',tbProject_Open:'Open',tbProject_OpenRecent:'Open',tbProject_Close:'Close',
                tbProject_SaveAllChanges:'Save',tbProject_SaveAs:'Save as',tbProject_Export:'Export',tbEditor_Save:'Save document',tbIdeWindow_Close:'Exit'}[a];
            if(section){addFile(section,i);continue;}
            if(a==='tbBuild_Start'||a==='tbBuild_Clean'){add('Project','Build',i);continue;}
            addFile('More',i);continue;
        }
        if(m==='rootMenuAddins'){addFile('Add-ins',i);continue;}
        if(m==='rootMenuHelp'){addFile('Help',i);continue;}
        if(a==='tbIde_ShowIDEOptions'){addFile('Options',i);continue;}
        if(token(i,'MenuCaptionWindowLanguage')||token(i,'MenuCaptionWindowKeyboardShortcuts')){addFile('Preferences',i);continue;}
        if(quick(a)){suppressed.push(i);continue;}
        if(/_Clipboard(?:Cut|Copy|Paste|PasteAsComment)$/.test(a)){add('Home','Clipboard',i);continue;}
        if(/_SelectAll(?:Controls|Matches)?$|_Delete(?:Right|SelectedControls)$|_Find(?:Replace)?$/.test(a)||
            a==='tbProject_FindInFiles'||/^tbFindWidget_Show(?:Find|Replace)$/.test(a)||a==='tbEditor_FindWidget_SelectAllMatches'){
            add('Home','Editing',i);continue;
        }
        if(/^tbEditor_(IndentLine|OutdentLine|FormatSelection|FormatDocument)$/.test(a)){add('Code','Formatting',i);continue;}
        if(/^tbEditor_(GoToDefinition|LastPosition|GotoLineColumn)$/.test(a)){add('Code','Navigation',i);continue;}
        if(/^tbEditor_(?:Unfold|Fold)/.test(a)){add('Code','Outlining',i);continue;}
        if(/^tbEditor_TransformTo/.test(a)){add('Code','Case',i);continue;}
        if(/^tbEditor_(SwitchToCode|SwitchToFormDesign)$/.test(a)||a==='tbShowObjectBrowser'){add('View','Views',i);continue;}
        if(/_ShowPanel$/.test(a)||m==='rootMenuView'&&typeof i.action==='function'){add('View','Show',i);continue;}
        if(/^tb(?:Editor_(?:Increase|Decrease)FontSize|FormDesigner_Zoom)/.test(a)){add('View','Zoom',i);continue;}
        if(m==='rootMenuFormat'){
            const g=token(i,'MakeSameSize')?'Size':token(i,'Spacing')?'Spacing':
                token(i,'LockControls')?'Protection':/CenterInContainer|BringToFront|SendToBack/.test(i.name)?'Position':'Arrange';
            const icon=token(i,'MakeSameSize')?'menuBarSizeWidest':token(i,'FormatAlign')?'menuBarAlignLeft':undefined;
            add('Form',g,icon?{...i,_ribbonIconSource:icon}:i);continue;
        }
        if(m==='rootMenuProject'){
            if(token(i,'MenuCaptionProjectAdd'))add('Insert','Components',i);
            else {add('Project',/_Open(?:Project|Build)Folder$/.test(a)?'Folders':'Project',i);
                if(a==='tbProject_ShowSettings'||a==='tbProject_ShowReferences')addFile('Info',i);}
            continue;
        }
        if(/^tbCompiler_/.test(a)){add('Project','Compiler',i);continue;}
        if(m==='rootMenuDebug'||m==='rootMenuRun'){
            add('Debug',/Step/.test(a)?'Stepping':/Breakpoint/.test(a)?'Breakpoints':/^tbWatches_/.test(a)?'Watches':i.hoverAction?'Options':'Execution',i);continue;
        }
        if(m==='rootMenuWindows'){
            add('View',token(i,'WindowTheme')?'Appearance':'Window',token(i,'WindowTheme')?{...i,_ribbonIconSource:'menuBarColorMode'}:i);continue;
        }
        const fallback={rootMenuEdit:['Home','More editing'],rootMenuView:['View','More views'],rootMenuTools:['Tools','Tools']}[m];
        add(...(fallback||[r.menuTitle||m,'Commands']),i);
    }
    const action=i=>typeof i.action==='string'?i.action:'';
    const dropdown=(name,items,icon)=>({name,codicon:icon||items.find(i=>i.codicon)?.codicon,_ribbonChildren:items});
    for(const [tab,gs]of tabs)for(const [name,items]of gs){
        if(tab==='Home'&&name==='Clipboard')items.sort((a,b)=>{
            const rank=i=>/_ClipboardPaste$/.test(action(i))?0:/_ClipboardCut$/.test(action(i))?1:/_ClipboardCopy$/.test(action(i))?2:3;
            return rank(a)-rank(b);});
        if(tab==='Home'&&name==='Editing'){
            const advanced=items.filter(i=>/^tbFindWidget_|FindWidget_/.test(action(i)));
            const primary=items.filter(i=>!advanced.includes(i));
            primary.sort((a,b)=>(/_Find$/.test(action(a))?0:1)-(/_Find$/.test(action(b))?0:1));
            if(advanced.length)primary.push(dropdown('Find options',advanced,'search'));gs.set(name,primary);
        }
        if(tab==='Code'&&name==='Outlining'){
            const folds=items.filter(i=>/^tbEditor_Fold/.test(action(i))),unfolds=items.filter(i=>/^tbEditor_Unfold/.test(action(i)));
            gs.set(name,[...(folds.length?[dropdown('Fold',folds)]:[]),...(unfolds.length?[dropdown('Unfold',unfolds)]:[])]);
        }
        if(tab==='Code'&&name==='Case')gs.set(name,[dropdown('Change case',items)]);
        if(tab==='View'&&name==='Show'){
            const common=new Set(['tbProjectExplorer_ShowPanel','tbToolbox_ShowPanel','tbProperties_ShowPanel']);
            const more=items.filter(i=>!common.has(action(i))),primary=items.filter(i=>common.has(action(i)));
            gs.set(name,[...(more.length?[dropdown('More panels',more,'browser')]:[]),...primary]);
        }
    }
    const result=[...tabs].map(([id,gs])=>({id,title:id,groups:[...gs].map(([title,items])=>({title,items}))}));
    for(const tab of result){const preferred=groups[tab.id]||[];tab.groups.sort((a,b)=>{
        const rank=g=>preferred.includes(g.title)?preferred.indexOf(g.title):preferred.length;return rank(a)-rank(b);
    });}
    for(const tab of result)for(const group of tab.groups)group.items=group.items.map(item=>
        ({...item,_ribbonLarge:present(item).large}));
    result.sort((a,b)=>{const rank=x=>order.includes(x)?order.indexOf(x):order.indexOf('Add-ins')-.5;return rank(a.id)-rank(b.id);});
    return {tabs:result,file,suppressed};
})
