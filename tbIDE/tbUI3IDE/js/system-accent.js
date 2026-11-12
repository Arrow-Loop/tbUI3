// Windows.UI.ViewManagement.UISettings colors arrive from the native add-in.
// Resource mapping: microsoft-ui-xaml Common_themeresources_any.xaml.
(function createSystemAccent(api) {
    const d=api.document;
    let palette=null,style=null;
    function sync(){
        const name=String(api.themeName()||'').toLowerCase();
        if(!api.enabled()||!['winui3 dark','winui3 light'].includes(name)||!palette){
            style?.remove();style=null;return;
        }
        const dark=name==='winui3 dark',fill=palette[dark?1:4],link=palette[dark?0:5],base=palette[3];
        const tint=(hex,alpha)=>hex+alpha;
        const vars={
            '--color-accent':fill,'--color-accent-link':link,
            '--color-accent-hover':tint(fill,'e6'),'--color-accent-pressed':tint(fill,'cc'),
            '--themeFindResultColor':fill,'--themeProblemSelectedBorderColor':fill,
            '--themeDebugIntellisensePartialMatchColor':fill,'--themeSignatureHelpHeaderColor':fill,
            '--themeDesignerRulerMarkerColor':fill,'--themeFrontPageIconColor':fill,
            '--themeDesignerToolboxItemSelectedOutline':`1.5px solid ${fill}`,
            '--themeDialogTabBarBorderTop':`2px solid ${fill}`,
            '--themeToolbarPreviewButtonColor':tint(fill,dark?'4d':'33'),
            '--themeSelectedTextBackColor':tint(base,dark?'66':'40')
        };
        // The light theme's modal caption has white native text; keep its accent fill.
        if(!dark)vars['--themeDialogHeaderBackColor']=fill;
        const css='body.darkMode,body:not(.darkMode){'+Object.entries(vars).map(([k,v])=>k+':'+v+';').join('')+'}';
        if(!style){style=d.createElement('style');style.id='tbUI3SystemAccentCss';}
        if(style.textContent!==css)style.textContent=css;
        if(d.head.lastElementChild!==style)d.head.append(style);
    }
    return {
        setPalette(value){palette=Array.isArray(value)&&value.length===7&&value.every(c=>/^#[0-9a-f]{6}$/i.test(c))?value.map(c=>c.toLowerCase()):null;sync();},
        sync,
        dispose(){style?.remove();style=null;palette=null;}
    };
})
