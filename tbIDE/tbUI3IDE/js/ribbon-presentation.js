/* Command-specific presentation derived from Shane's Office Home/View/Developer/
 * Page Layout references. No group-position rule decides a command's size.
 * This is IDE presentation metadata, not command execution or an availability list. */
(function ribbonPresentation(item={},sourceId='') {
    const a=typeof item.action==='string'?item.action:'',n=String(item.name||'');
    const has=s=>n.includes(s),source=sourceId||item._sourceId||'';
    const largeActions=new Set([
        'tbEditor_ClipboardPaste','tbFormDesigner_ClipboardPaste','tbEditor_Find','tbProject_FindInFiles',
        'tbEditor_FormatSelection','tbEditor_FormatDocument','tbEditor_GoToDefinition','tbEditor_LastPosition','tbEditor_GotoLineColumn',
        'tbEditor_SwitchToCode','tbEditor_SwitchToFormDesign','tbShowObjectBrowser',
        'tbEditor_IncreaseFontSize','tbEditor_DecreaseFontSize','tbFormDesigner_ZoomIncrease','tbFormDesigner_ZoomDecrease',
        'tbFormDesigner_BringControlToFront','tbFormDesigner_SendControlToBack','tbFormDesigner_ToggleLockSelectedControls',
        'tbProject_ShowReferences','tbProject_ShowSettings','tbBuild_Start','tbBuild_Clean',
        'tbCompiler_Restart','tbCompiler_RestartAndFlushLlvmCache','tbProject_OpenProjectFolder','tbProject_OpenBuildFolder',
        'tbDebug_ToggleBreakpoint','tbDebug_SetNextExecutionStatement',
        'tbFormDesigner_AlignSelectedControlsLeft','tbFormDesigner_AlignSelectedControlsTop','tbFormDesigner_AlignSelectedControlsRight','tbFormDesigner_AlignSelectedControlsBottom',
        'tbFormDesigner_ResizeSelectedControlsWidest','tbFormDesigner_ResizeSelectedControlsTallest','tbFormDesigner_ResizeSelectedControlsNarrowest','tbFormDesigner_ResizeSelectedControlsShortest'
    ]);
    const largeSources=new Set(['saveIcon','searchIcon','designSwitchIcon','playIcon','buildIcon','trashIcon','restartIcon',
        'commentIcon','uncommentIcon','menuBarAlignLeft','menuBarAlignTop','menuBarAlignRight','menuBarAlignBottom',
        'menuBarSizeWidest','menuBarSizeTallest','menuBarSizeNarrowest','menuBarSizeShortest',
        'menuBarBringToFront','menuBarSendToBack','menuBarPreview','menuBarColorMode','menuBarGrid']);
    const largeNames=['MenuCaptionProjectAdd','MenuCaptionFormatAlign','MenuCaptionFormatMakeSameSize',
        'MenuCaptionFormatHorizontalSpacing','MenuCaptionFormatVerticalSpacing','MenuCaptionWindowPanelLayouts',
        'MenuCaptionWindowPanelFeatures','MenuCaptionWindowTheme'];
    const large=item._ribbonTab==='Insert'||largeActions.has(a)||largeSources.has(source)||source.startsWith('addinButton-')||
        largeNames.some(has)||['Fold','Unfold','Find options','More panels','Debugger Options'].includes(n);
    const captions={tbFileSystem_AddFolder:'Folder',tbFileSystem_AddWindowsForm:'Windows form',tbFileSystem_AddWindowsMDIForm:'MDI form',tbFileSystem_AddWindowsUserControl:'UserControl',tbFileSystem_AddWindowsPropertyPage:'Property page',tbFileSystem_AddWindowsReport:'Report',tbFileSystem_AddCustomControlsForm:'Custom form',tbFileSystem_AddModuleTWIN:'Module (.twin)',tbFileSystem_AddClassTWIN:'Class (.twin)',tbFileSystem_AddModuleBAS:'Module (.bas)',tbFileSystem_AddClassCLS:'Class (.cls)',tbFileSystem_AddOtherFile:'Other file',tbFileSystem_ImportFile:'Import',tbFileSystem_AddResourceVisualStylesManifest:'Visual styles',tbFileSystem_AddResourceStringTable:'String table',tbFileSystem_AddResourceMessageTable:'Message table'};
    let glyph='apps_list';
    if(/^tbFileSystem_Add(?:Module|Class)/.test(a))glyph='code';
    if(/Find|Search/i.test(n)||/Find/.test(a))glyph='searchIcon';
    if(/ClipboardCut$/.test(a))glyph='cut';
    else if(/SelectAll|SelectAllMatches/.test(a))glyph='select_all_on';
    else if(/Delete|Clear$|BreakpointsClear/.test(a))glyph='delete';
    else if(/FormatSelection|FormatDocument/.test(a))glyph='code';
    else if(/Unfold/.test(a)||n==='Unfold')glyph='arrow_expand';
    else if(/Fold/.test(a)||n==='Fold')glyph='arrow_collapse_all';
    else if(/TransformTo/.test(a)||n==='Change case')glyph='text_change_case';
    else if(/GotoLineColumn|GoToDefinition|LastPosition/.test(a))glyph='text_bullet_list_square';
    else if(/Breakpoint/.test(a))glyph='circle';
    else if(/SetNextExecutionStatement/.test(a))glyph='playIcon';
    else if(/HorizontalSpacing/.test(n)||/SpacingHorizontal/.test(a))glyph='align_space_evenly_horizontal';
    else if(/VerticalSpacing/.test(n)||/SpacingVertical/.test(a))glyph='align_space_evenly_vertical';
    else if(/Settings|Options|PanelFeatures|KeyboardShortcuts|Language/.test(n)||/ShowSettings|ShowIDEOptions/.test(a))glyph='settings';
    else if(/^tbHelp_|Help/.test(n))glyph='chat_help';
    else if(source.startsWith('addinButton-')||has('Add-ins'))glyph=/Search|Find/i.test(n)?'searchIcon':'puzzle_piece';
    // Explicit selections from Shane's 2026-11-12 icon specification. These
    // override native toolbar backgrounds/codicons; unlisted commands retain them.
    const actionIcons={
        tbProject_FindInFiles:'fluent/calendar_search',
        tbFileSystem_AddWindowsForm:'segoe/EB3B',tbFileSystem_AddWindowsMDIForm:'fluent/window_multiple',
        tbFileSystem_AddWindowsUserControl:'fluent/button',tbFileSystem_AddWindowsPropertyPage:'fluent/tab_desktop',
        tbFileSystem_AddWindowsReport:'fluent/calendar_data_bar',tbFileSystem_AddCustomControlsForm:'fluent/window_toolbox',
        tbFileSystem_AddModuleTWIN:'fluent/code_block',tbFileSystem_AddClassTWIN:'fluent/code_block_edit',
        tbFileSystem_AddModuleBAS:'fluent/code_block',tbFileSystem_AddClassCLS:'fluent/code_block_edit',
        tbFileSystem_AddResourceVisualStylesManifest:'fluent/apps_list_detail',tbFileSystem_AddResourceMessageTable:'fluent/group_list',
        tbFileSystem_AddFolder:'segoe/E8F4',tbFileSystem_AddOtherFile:'fluent/document_add',tbFileSystem_ImportFile:'fluent/add_square_multiple',
        tbEditor_FormatSelection:'fluent/rename',tbEditor_FormatDocument:'fluent/document_margins',
        tbEditor_GotoLineColumn:'segoe/E8D1',tbEditor_GoToDefinition:'segoe/E82D',tbEditor_LastPosition:'fluent/arrow_step_back',
        tbFormDesigner_ToggleLockSelectedControls:'segoe/E72E',tbFormDesigner_ToggleLockAllControls:'segoe/E72E',tbEditor_SwitchToCode:'fluent/code',tbEditor_ShowPanel:'fluent/code',
        tbEditor_SwitchToFormDesign:'fluent/design_ideas',tbShowObjectBrowser:'segoe/EC50',
        tbProjectExplorer_ShowPanel:'fluent/code_circle',tbToolbox_ShowPanel:'fluent/toolbox',tbProperties_ShowPanel:'fluent/slide_settings',
        tbEditor_IncreaseFontSize:'segoe/E8A3',tbFormDesigner_ZoomIncrease:'segoe/E8A3',
        tbEditor_DecreaseFontSize:'segoe/E71F',tbFormDesigner_ZoomDecrease:'segoe/E71F',
        tbProject_ShowReferences:'fluent/library',tbProject_ShowSettings:'fluent/apps_settings',
        tbBuild_Start:'fluent/cube_tree',tbBuild_Clean:'fluent/broom',tbCompiler_Restart:'fluent/arrow_reset',
        tbCompiler_RestartAndFlushLlvmCache:'segoe/EBC4',tbProject_OpenProjectFolder:'fluent/folder_open',tbProject_OpenBuildFolder:'fluent/folder_arrow_right',
        tbDebug_SetNextExecutionStatement:'fluent/skip_forward_tab',
        tbProject_New:'segoe/ECC8',tbProject_Open:'segoe/E838',tbProject_OpenRecent:'segoe/E838',
        tbProject_SaveAllChanges:'segoe/E74E',tbProject_SaveAs:'segoe/E792',tbEditor_Save:'fluent/document_save',
        tbProject_Export:'segoe/EDE1',tbProject_Close:'fluent/share_screen_stop',
        tbHelp_ShowAboutWindow:'fluent/chat_help',tbHelp_ShowLicenceAgreement:'segoe/EF3F',
        tbHelp_PurchaseALicence:'fluent/wallet_credit_card',tbHelp_EnterLicenceKey:'segoe/E8D7',
        tbHelp_OpenKofiWebsite:'fluent/drink_coffee',tbHelp_ToggleCompilerTraceMode:'fluent/table_settings',
        tbIde_ShowIDEOptions:'fluent/content_settings',tbIdeWindow_Close:'fluent/arrow_exit'
    };
    const sourceIcons={saveIcon:'segoe/E74E',searchIcon:'fluent/calendar_search',buildIcon:'fluent/cube_tree',trashIcon:'fluent/broom',restartIcon:'fluent/arrow_reset',menuBarColorMode:'fluent/dark_theme',
        'addinButton-tbUI3TabNew':'fluent/document_one_page_add','addinButton-tbUI3TabDelete':'fluent/document_header_dismiss',
        'addinButton-tbUI3TabLeft':'fluent/tab_desktop_arrow_left','addinButton-tbUI3TabRight':'fluent/tab_desktop_arrow_right_composite',
        'addinButton-tbUI3TabRefresh':'fluent/tab_desktop_arrow_clockwise','addinButton-tbUI3TabDiagnostics':'fluent/stethoscope'};
    const nameIcons={
        'Find options':'fluent/slide_search',Fold:'fluent/text_collapse',Unfold:'fluent/text_expand','More panels':'fluent/panel_right_cursor','Debugger Options':'segoe/EBE8',
        MenuCaptionWindowPanelLayouts:'fluent/layout_infographic',MenuCaptionWindowPanelFeatures:'fluent/content_settings',MenuCaptionWindowTheme:'fluent/dark_theme',
        MenuCaptionWindowKeyboardShortcuts:'fluent/keyboard',MenuCaptionWindowLanguage:'fluent/local_language_globe',MenuCaptionViewObjectBrowser:'segoe/EC50',
        'Restart the compiler':'fluent/arrow_reset','Flush the LLVM compiler cache':'segoe/EBC4'
    };
    let icon=item._ribbonIcon||sourceIcons[source]||actionIcons[a];
    if(!icon){
        const key=Object.keys(nameIcons).find(k=>n===k||n.includes('{%'+k+'}'));if(key)icon=nameIcons[key];
        else if(/_ClipboardPaste$/.test(a))icon='segoe/E77F';
        else if(/_ClipboardCut$/.test(a))icon='segoe/E8C6';
        else if(/_ClipboardCopy$/.test(a))icon='segoe/E8C8';
        else if(/_Find$/.test(a))icon='segoe/E721';
        else if(/_Delete(?:Right|SelectedControls)$/.test(a))icon='segoe/E74D';
        else if(/_SelectAll(?:Controls|Matches)?$/.test(a))icon='segoe/E8B3';
        else if(source.startsWith('addinButton-')&&/global[\s_-]*search/i.test(source+' '+n))icon='fluent/globe_search';
    }
    const sourceCaptions={restartIcon:'Restart Compiler','addinButton-tbUI3TabNew':'New Page','addinButton-tbUI3TabDelete':'Delete Page',
        'addinButton-tbUI3TabLeft':'Page Left','addinButton-tbUI3TabRight':'Page Right','addinButton-tbUI3TabRefresh':'TabView Refresh','addinButton-tbUI3TabDiagnostics':'TabView Diagnostics'};
    Object.assign(captions,{tbCompiler_Restart:'Restart Compiler',tbCompiler_RestartAndFlushLlvmCache:'Flush LLVM Cache',tbEditor_Save:'Save Document',tbIde_ShowIDEOptions:'IDE Options'});
    const iconOnly=/^tbFormDesigner_(?:AlignSelectedControls(?:Left|Top|Right|Bottom|CenterHorizontal|CenterVertical)|ResizeSelectedControls(?:Widest|Tallest|Narrowest|Shortest)|CenterSelectedGroupInContainer(?:Horizontal|Vertical)|ToggleLock(?:Selected|All)Controls)$/.test(a)||
        /^menuBar(?:Align(?:Left|Top|Right|Bottom)|Size(?:Widest|Tallest|Narrowest|Shortest)|Preview|Grid)$/.test(source)||
        ['tbFileSystem_AddFolder','tbFileSystem_AddOtherFile','tbFileSystem_ImportFile'].includes(a)||
        /^addinButton-tbUI3Tab(?:Left|Right|Refresh|Diagnostics)$/.test(source);
    const renamed=n==='Restart the compiler'?'Restart Compiler':n==='Flush the LLVM compiler cache'?'Flush LLVM Cache':undefined;
    return {large:(large||a==='tbEditor_Save')&&!iconOnly,iconOnly,icon,glyph:item._ribbonGlyph||glyph,caption:sourceCaptions[source]||captions[a]||renamed};
})
