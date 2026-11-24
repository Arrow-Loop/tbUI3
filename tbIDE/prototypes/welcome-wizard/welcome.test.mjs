/* Isolated Welcome Wizard source-contract checks.
 * Run: node --test tbIDE/prototypes/welcome-wizard/welcome.test.mjs
 * Native iframe behavior still requires integration/browser acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {Script,createContext} from 'node:vm';
const root=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(join(root,name),'utf8');
const js=read('welcome.js'),css=read('welcome.css'),shared=read('controls.js'),master=read('master.css'),html=read('index.html'),readme=read('README.md');

test('wizard script parses and exports original public factory',()=>{
  const context=createContext({});
  new Script(js,{filename:'welcome.js'}).runInContext(context);
  assert.equal(typeof context.tbUI3CreateWelcomeWizard,'function');
  assert.throws(()=>context.tbUI3CreateWelcomeWizard(),/document, mount and send/);
  assert.throws(()=>context.tbUI3CreateWelcomeWizard({document:{},mount:{},send(){}}),/embedded Master CSS/);
});
test('full shared runtime and Master CSS present, without Gallery startup',()=>{
  new Script(shared,{filename:'controls.js'});
  assert.match(shared,/window\.WinUIControls = Object\.freeze/);
  assert.match(master,/@layer tokens, base, layout, components, utilities/);
  assert.match(master,/--ControlCornerRadius|ControlCornerRadius/);
  assert.doesNotMatch(shared,/function initializeCatalog\(/);
});
test('wizard authors shared WinUI declarations instead of presentation templates',()=>{
  for(const name of ['winui-button','winui-toggle-switch','winui-settings-row','winui-info-bar'])
    assert.ok(js.includes("'"+name+"'"),name);
  assert.match(js,/WinUIControls\.initialize\(app\)/);
  assert.match(js,/frame\.srcdoc/);
  assert.match(js,/inner\.head\.appendChild\(script\)/);
});
test('native bridge contract survives the rebuild',()=>{
  for(const action of ['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']) {
    assert.ok(js.includes("'"+action+"'"),action);
    assert.ok(readme.includes(action),action);
  }
  for(const name of ['open:show','setSnapshot:settle','close:','destroy','getState:'])assert.ok(js.includes(name),name);
  assert.match(js,/waiting\.clear\(\);changed\.clear\(\)/);
});
test('all installed native themes render as single-click selection and local palette previews',()=>{
  assert.match(js,/Array\.isArray\(snap\.installedThemes\)/);
  assert.match(js,/FEATURED_THEMES\.indexOf/);
  assert.match(js,/renderGroup\('Featured WinUI3 themes'/);
  assert.match(js,/renderGroup\('Other installed themes'/);
  assert.match(js,/dom\('button','welcome-choice welcome-theme-card'/);
  assert.match(js,/preview=item\.name;/);
  assert.match(js,/commit\('theme',item\.name,'choose-theme','name'\)/);
  assert.match(js,/themePalette\(item\)/);
  assert.match(js,/Theme palette unavailable/);
  assert.match(js,/inner\.documentElement\.setAttribute\('data-theme',previewAppearance\|\|themeMode\(selectedPreview\)\|\|snapshotMode\(snap\)\)/);
  assert.match(readme,/current trusted native inventory/);
});
test('WinUI caption button replaces Close text in header',()=>{
  assert.match(js,/welcome-caption-close/);
  assert.match(js,/Close Welcome Wizard/);
  assert.match(js,/M1 1L11 11M11 1L1 11/);
  assert.match(js,/createElementNS\('http:\/\/www\.w3\.org\/2000\/svg','svg'\)/);
  assert.doesNotMatch(js,/button\(head,'Close'/);
  assert.match(css,/\.welcome-caption-close:hover \{ background: #c42b1c; color: #ffffff; \}/);
});
test('updates explanation is plain text, not an info bar',()=>{
  assert.match(js,/Automatic checks never authorize downloading or installing an IDE update/);
  assert.doesNotMatch(js,/info\(parent,'Your approval is required'/);
});
test('compact page scroll and pinned footer remain available',()=>{
  assert.match(css,/height: 100dvh/);
  assert.match(css,/overflow-y: auto/);
  assert.match(css,/\.welcome-footer \{[^}]*flex: 0 0 auto/s);
});
test('browser preview can toggle light and dark without native theme writes',()=>{
  assert.match(html,/id="preview-light"/);
  assert.match(html,/id="preview-dark"/);
  assert.match(html,/wizard\.setPreviewMode\(mode\)/);
  assert.match(js,/function setPreviewMode\(mode\)/);
  assert.match(js,/setPreviewMode,close:/);
});
test('release channel hidden and core tbUI3 controls not advertised as IDE features',()=>{
  assert.doesNotMatch(js,/Release channel|commit\('channel'/);
  assert.doesNotMatch(js,/TabView and TabPage|Access TabView design/);
  assert.match(js,/IDE themes and accent/);
  assert.match(readme,/Release channel selection has been removed/);
  assert.match(readme,/TabView\/TabPage feature marketing/);
});
test('repair requires asynchronous host approval',()=>{
  assert.match(js,/Promise\.resolve\(\)\.then\(\(\)=>options\.confirmRepair\(resource\)\)/);
  assert.match(js,/if\(approved&&!dead\)dispatch\('repair-resource'/);
  assert.doesNotMatch(js,/\b(?:alert|confirm|prompt)\(/);
});
test('CSS is a layout composition only and shared Master CSS never styles IDE root',()=>{
  assert.match(css,/\.tbw-isolated-frame/);
  assert.match(css,/\.welcome-page/);
  assert.doesNotMatch(css,/\.tbw-primary|\.tbw-toggle|\.tbw-theme-tile/);
  assert.doesNotMatch(css,/(^|\n)\s*(?:body|html|:root)\s*\{/);
  assert.match(js,/hostStyles\.textContent=assets\.welcomeCss/);
  assert.match(js,/style\(inner\.head,assets\.masterCss\)/);
});
test('local development preview uses explicit simulated native adapter',()=>{
  assert.match(html,/simulated/i);
  assert.match(html,/read\('master\.css'\)/);
  assert.match(html,/read\('controls\.js'\)/);
});
test('view has no filesystem, network or browser persistence side effects',()=>{
  assert.doesNotMatch(js,/\b(?:localStorage|sessionStorage|XMLHttpRequest|fetch|ActiveXObject|eval)\s*\(/);
  assert.doesNotMatch(js,/\binnerHTML\s*=/);
});

test('theme and toolbar selector previews share compact miniature renderer',()=>{
  assert.match(js,/function miniIde\(parent,item,mode,toolbarPreview=false\)/);
  assert.match(js,/return miniIde\(parent,item,'Classic'\)/);
  assert.match(js,/miniIde\(card,selectedTheme,name,true\)/);
  assert.match(js,/welcome-toolbar-card/);
  assert.match(css,/\.welcome-mini-ide \{/);
  assert.match(css,/height: 86px/);
  assert.match(css,/\.welcome-mini-classic|\.welcome-mini-hybrid|\.welcome-mini-ribbon/);
  assert.match(css,/\.welcome-toolbar-grid \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test('resolved theme paint is validated and not interpreted as raw CSS',()=>{
  assert.match(js,/COLOR_FIELDS = \['background','surface','foreground','accent','titlebar','toolbar','panel','editor','muted','border'\]/);
  assert.match(js,/\^#\[0-9a-fA-F\]/);
  assert.match(js,/outer\.style\.setProperty\(cssMap\[key\],fixed\[key\]\)/);
  assert.match(js,/!palette && \(!item \|\| !FEATURED_THEMES\.includes\(item\.name\)\)/);
  assert.match(readme,/per-user AppData twinBASIC themes directory/);
  assert.match(readme,/active installation's themes directory/);
});
test('whole-toolbar selection uses existing action and theme palette',()=>{
  assert.match(js,/dom\('button','welcome-choice welcome-toolbar-card'/);
  assert.match(js,/commit\('toolbar',name,'choose-toolbar','name'\)/);
  assert.match(js,/function paletteTheme\(\)/);
  assert.doesNotMatch(js,/dom\('winui-button'.*'Use '\+name/);
});

test('conditional setup attention presents friendly resource labels and statuses before Finish',()=>{
  assert.match(js,/updater:'Update manager'/);
  assert.match(js,/themeDark:'WinUI3 Dark theme'/);
  assert.match(js,/themeLight:'WinUI3 Light theme'/);
  assert.match(js,/function resourceState\(resource\)/);
  assert.match(js,/function setupNeedsAttention\(\)/);
  assert.match(js,/function setupAttention\(parent\)/);
  assert.match(js,/names\.splice\(1,0,'Setup'\)/);
  assert.match(js,/Setup:setupAttention,Finish:finish/);
  const finishBody=js.slice(js.indexOf('    function finish(parent){'),js.indexOf('    function paint(){'));
  assert.doesNotMatch(finishBody,/Installation health|welcome-health-list|bootstrap-retry|repair-resource|Update recovery needed/);

  assert.match(js,/welcome-health-row/);
  assert.match(js,/welcome-health-status/);
  assert.match(js,/welcome-health-description/);
  assert.doesNotMatch(js,/text\(resource.id\)\+': '\+text\(resource.status\)/);
  assert.doesNotMatch(js,/resource.message\?' \| '/);
  assert.match(css,/\.welcome-health-list/);
  assert.match(css,/\.welcome-health-actions/);
  assert.match(js,/dispatch\('repair-resource',\{id:resource.id,confirmed:true\}\)/);
  assert.match(js,/dispatch\('bootstrap-retry'\)/);
});

test('finish summary uses extensible compact rows instead of oversized fixed cards',()=>{
  assert.match(js,/dom\('dl','welcome-summary-list'/);
  assert.match(js,/const entries=\[/);
  assert.match(js,/dom\('dt','welcome-summary-label'/);
  assert.match(js,/dom\('dd','welcome-summary-value'/);
  assert.match(js,/Restart after update/);
  assert.doesNotMatch(js,/dom\('winui-summary-card'/);
  assert.match(css,/\.welcome-summary-row/);
  assert.match(css,/\.welcome-summary-value/);
  assert.doesNotMatch(css,/\.welcome-summary \{ display: grid/);
});

test('healthy setup skips optional attention page and keeps six-step finish',()=>{
  assert.match(js,/const PAGES = \['Welcome', 'Updates', 'Themes', 'Toolbar', 'Features', 'Finish'\]/);
  assert.match(js,/if\(setupNeedsAttention\(\)\)names\.splice\(1,0,'Setup'\)/);
  assert.match(js,/bootstrap\.status==='error' \|\| bootstrap\.status==='warning' \|\| snap\.recovery===true/);
  assert.match(js,/resource\.repairable===true/);
  assert.match(js,/function pageNames\(\)/);
  assert.match(js,/const pages=pageNames\(\)/);
  assert.match(js,/pageNames\(\)\.length-1/);
});

test('unresolved setup requires explicit acknowledgment and awaits native repair completion',()=>{
  assert.match(js,/Continue with current setup/);
  assert.match(js,/pages\[step\]==='Setup' && \(waiting\.has\('bootstrap-retry'\) \|\| waiting\.has\('repair-resource'\)\)/);
});

test('Setup inserts immediately after Welcome and preserves logical page on refreshed status',()=>{
  assert.match(js,/if\(setupNeedsAttention\(\)\)names\.splice\(1,0,'Setup'\)/);
  assert.match(js,/const previousPage=pageNames\(\)\[step\]/);
  assert.match(js,/const refreshedIndex=refreshedPages\.indexOf\(previousPage\)/);
  assert.match(js,/step=refreshedIndex>=0\?refreshedIndex:Math\.min\(1,refreshedPages\.length-1\)/);
});

test('Setup recheck action has separation from resources and warnings',()=>{
  assert.match(js,/dom\('div','welcome-setup-retry',undefined,parent\)/);
  assert.match(js,/button\(retryArea,'Check again'/);
  assert.match(css,/\.welcome-setup-retry \{/);
  assert.match(css,/margin-top:var\(--space-5\)/);
});

test('theme and toolbar selected styling does not add redundant current labels',()=>{
  assert.doesNotMatch(js,/['"]Current theme['"]|['"]Current toolbar['"]/);
  assert.doesNotMatch(css,/\.welcome-theme-current/);
  assert.match(js,/aria-pressed/);
  assert.match(js,/welcome-theme-selected/);
});
