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
  for(const name of ['winui-button','winui-toggle-switch','winui-settings-row','winui-info-bar','winui-summary-card'])
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
