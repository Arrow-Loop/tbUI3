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
        'tbDebug_ToggleBreakpoint','tbDebug_SetNextExecutionStatement'
    ]);
    const largeSources=new Set(['saveIcon','searchIcon','designSwitchIcon','playIcon','buildIcon','trashIcon','restartIcon',
        'commentIcon','uncommentIcon','menuBarAlignLeft','menuBarAlignTop','menuBarAlignRight','menuBarAlignBottom',
        'menuBarSizeWidest','menuBarSizeTallest','menuBarSizeNarrowest','menuBarSizeShortest',
        'menuBarBringToFront','menuBarSendToBack','menuBarPreview','menuBarColorMode']);
    const largeNames=['MenuCaptionProjectAdd','MenuCaptionFormatAlign','MenuCaptionFormatMakeSameSize',
        'MenuCaptionFormatHorizontalSpacing','MenuCaptionFormatVerticalSpacing','MenuCaptionWindowPanelLayouts',
        'MenuCaptionWindowPanelFeatures','MenuCaptionWindowTheme'];
    const large=largeActions.has(a)||largeSources.has(source)||source.startsWith('addinButton-')||
        largeNames.some(has)||['Fold','Unfold','Find options','More panels','Debugger Options'].includes(n);
    let glyph='apps_list';
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
    return {large,glyph:item._ribbonGlyph||glyph};
})
