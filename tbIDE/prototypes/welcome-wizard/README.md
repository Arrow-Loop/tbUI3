# tbUI3IDE Welcome Wizard, shared WinUI Toolkit edition

**Status:** Functional isolated source candidate for production embedding. **Branch:** `tbui3-dev`. **Owner:** Quill, restricted to this directory. **Native integration:** Cody maintains the production add-in, project mirror, resources, installer and tests.

This pass replaces the earlier hand-styled dialog/control templates with **actual shared WinUI authoring and rendering**: the full pinned `master.css` design layer and the reusable `controls.js` control runtime, isolated in a same-origin `srcdoc` iframe. Application code declares `winui-button`, `winui-toggle-switch`, `winui-settings-row`, `winui-info-bar` and `winui-summary-card` with application content and native intent handlers; it does **not** create their internal button/switch/info-bar/card presentation. `welcome.css` now owns **only wizard layout/composition**. No global IDE stylesheet, body overrides or feature-specific copies of component appearance.

The control runtime and Master CSS are the preserved complete shared Toolkit code from the selected development checkpoint; do not trim individual component definitions or replace the shared library with handmade approximations. Their existing XAML resource references and token definitions remain unchanged. The wizard-specific layout includes only application-composition geometry (not claims about native XAML control templates). The isolated iframe keeps the Toolkit's `:root`, global selectors and runtime initialization from modifying twinBASIC's original IDE DOM.

## One-click Windows preview (built into Windows)

Double-click **`Preview.bat`** in this folder. It launches **`preview-server.ps1`** using Windows PowerShell 5.1 and .NET, then opens your default browser at `http://127.0.0.1:8765/`. This requires **no Python, Node.js, npm, administrator rights or software installation**. The BAT invokes PowerShell with a one-process execution-policy override; it does not change the machine's execution policy.

The preview server listens on **127.0.0.1 only**, serves a fixed read-only allowlist of wizard assets, and never serves other repository files or accepts uploads. Press Ctrl+C or close the command window to stop it. A port conflict or missing file is shown as an error. The preview simulates native settings/actions: it cannot modify the real twinBASIC IDE or install anything.

An optional Node-based development server (`preview-server.cjs`) also remains available for environments with Node, but it is not required by the BAT.

## Files and packaging

- `controls.js`: the shared WinUI control runtime, without the example application's Gallery-specific handlers.
- `master.css`: the full shared WinUI theme tokens, component CSS, light/dark/high-contrast mappings and shared design system.
- `welcome.js`: application controller and the native adapter-facing view factory.
- `welcome.css`: layout-only CSS loaded inside the isolated document, plus the isolated iframe host sizing class.
- `index.html`: local HTTP-served preview with in-memory **mock** native actions; not a production asset.
- `welcome.test.mjs`: focused static contract checks.

All four production runtime/style assets must be embedded in the DLL as genuine payload resources. The actual EXE and theme binary embedding are separate from these view assets. **Do not load `master.css` or `controls.js` into the IDE's top-level document**: the shared runtime includes document-root CSS, initializers and handlers. **Do not load any Gallery-specific runtime, demo, app state or sample data into production.**

## Integration API (compatible public methods, new required assets)

```js
const welcome = window.tbUI3CreateWelcomeWizard({
  document: ideDocument,
  mount: nativeDialogContainer,     // Cody's already modal native HTML dialog
  assets: {
    masterCss: embeddedMasterCss,
    controlsJs: embeddedControlsJs,
    welcomeCss: embeddedWelcomeCss
  },
  send(request) {
    enqueueValidatedNativeRequest(request);
  },
  async confirmRepair(resource) {
    return await confirmNativeStyledRepairWithBackupCheckbox(resource);
  },
  onClose(disposition) {
    // Optional: close/remove native modal dialog host.
  }
});

welcome.setSnapshot(actualNativeSnapshot);
welcome.open(actualNativeSnapshot);
welcome.close();                    // Programmatic close; no persisted disposition
welcome.destroy();                  // Unload; iframe and listeners removed
welcome.setPreviewMode('dark');      // OPTIONAL local preview appearance override only
```

**Important migration notice:** Cody's earlier integration passed `cssText` and mounted the hand-drawn wizard directly. This revision requires the three string assets under `assets` and now mounts the application inside a same-origin iframe underneath the supplied container. The host MUST pack the full shared runtime and Master CSS. It should NOT create a duplicate modal surface; Cody's native modal dialog remains the actual modality owner.

The iframe and its internal DOM are instantiated only on first open. Code installs shared CSS + scoped layout CSS into the iframe and initializes the real shared `WinUIControls` runtime before initializing wizard controls. If the full runtime cannot load, the host must show a meaningful error instead of substituting custom-looking buttons. For production, verify the native IDE's CSP allows trusted bundled inline script initialization in the `srcdoc` context. Do not fetch runtime/styles from GitHub or any network host, and do not persist preferences in browser storage. The standalone preview needs a local static HTTP server (for example `python -m http.server 8765` from this directory), then open `http://localhost:8765/index.html`. Opening it directly as `file://` will generally fail because the browser disallows `fetch` of adjacent files.

## Wizard UI refinements and preview-only appearance (2026-11-23)

- A fake WinUI desktop titlebar occupies the top of the wizard iframe. Its 46 x 32 caption-close target contains the familiar thin X glyph, shows the Windows-style red Close hover and uses an accessible `Close Welcome Wizard` label. The **native modal host** still owns actual window modality; no minimize/maximize controls are created.
- The Updates page displays the download/install consent explanation as **plain paragraph text** under the two preference switches, not as an InfoBar.
- The entire theme tile is now a single keyboard-accessible button. Clicking the tile immediately previews its palette within the wizard **and requests native selection** through the existing `choose-theme` action. A rejected native choice reverts to the authoritative theme on the settled snapshot. A mere hover does not apply the theme. There are no separate Preview/Use buttons.
- The wizard uses a viewport-height flex layout: titlebar and step headers are fixed, the central page scrolls vertically as needed, and the footer/status remain reachable at the bottom even with numerous installed themes or smaller preview windows.
- The standalone browser `index.html` exposes Light/Dark appearance buttons. They call the new optional `welcome.setPreviewMode('light'|'dark'|null)` method. **This is a preview/debug-only UI appearance override**, never an IDE theme operation, never persisted, and never sent to the native bridge. Production can omit it; all existing factory methods and native actions remain unchanged.
- The selected theme's preview may switch the wizard's internal palette before native acknowledgement; that does not count as an actual IDE change. The native snapshot remains the only source of persisted selected theme. All installed themes still require verified trusted native inventory membership.

**Cody handoff:** production must re-embed the latest `welcome.js` and `welcome.css` into the canonical resource pipeline. There is no change to the six native intent names or `installedThemes` snapshot shape. `master.css` and `controls.js` remain unchanged. Do not change native bridge/settings/bootstrap files in response to these view-only refinements without normal coordination.

## Conditional setup attention before Finish (2026-11-23)

Shane decided that offline bundled resources should be installed or verified at add-in startup, *before* the wizard. The Finish page must never contain a routine installation-health dashboard, resource rows or repair buttons. It only summarizes the user's confirmed choices.

If the authoritative native bootstrap snapshot reports error/warning, update recovery, missing/damaged resources or a resource requiring an explicit repair choice, the wizard inserts a **Setup** step immediately before Finish. This step presents readable status, any appropriate repair action, a manual Check again command and native recovery guidance. For healthy snapshots the step does not exist, preserving the original six-stage onboarding. Once the native snapshot clears the issue, the conditional step disappears; no resource files are ever altered merely by rendering. Users can still continue or dismiss the tour, because provisioning failure must not make onboarding inaccessible. Acknowledging an unresolved issue is not represented as successful repair.

This view-only sequencing change **does not start/bootstrap native provisioning**. Cody still owns silent offline provisioning on each add-in load and publishing accurate bootstrap status before opening the wizard. Actual updater EXE embedding remains a separate Phase 1 acceptance pass.

## Finish-page confirmation and installation-health layout (2026-11-23)

The Finish page now shows user choices in a compact, extensible label/value list instead of four oversized WinUI summary cards. It includes theme, toolbar, automatic update checks, restart preference and update strategy. Adding another confirmed preference simply adds another row; there is no fixed tile count or exaggerated value typography.

Installation health uses readable resource labels (e.g. Update manager, WinUI3 Dark theme, WinUI3 Light theme), individual descriptive messages and separate status indicators (Ready, Customized, Needs attention, Checking or Status unavailable). There are no printed raw IDs, colon-delimited diagnostics or pipe separators. Actual resource IDs are preserved internally for native repair requests and verified-backup confirmation. Retry and recovery behavior are unchanged.

The view owns only presentation. Production bootstrap and resource verification remain under Cody's native authority.

## Compact selector previews and native theme-resolution contract (2026-11-23)

Theme and Toolbar selectors now share an **86px-high miniature IDE silhouette**. They depict just the window chrome, command strip, project panel and editor. They are **not** screenshots, a full IDE recreation or executable toolbar controls. Each whole tile is keyboard-accessible and clickable, preserving the selected native state and compact size.

**Theme previews:** WinUI3 Light/Dark are featured first, followed by other effective installed IDE themes. Each miniature uses the actual resolved color values delivered by the trusted native bridge, not guessed theme-specific colors. Merely viewing a theme never changes the running IDE. Clicking its tile previews locally and requests the existing choose-theme intent; a rejected request reverts on the settled native snapshot.

**Toolbar previews:** Classic, Hybrid and Ribbon share that same miniature composition, with distinct abbreviated command/menu silhouettes. All three are colored from the currently selected theme's resolved palette. A click sends the unchanged choose-toolbar intent. This is an intentionally schematic preview, not a maintained copy of the full toolbar source/commands.

**Required native discovery:** Enumerate effective themes from BOTH the per-user AppData twinBASIC themes directory and the active installation's themes directory, including built-in themes exposed through the IDE. Confirm actual IDE precedence for duplicate names and resolve inheritance through the IDE's verified loader behavior. Only expose a single effective theme by name, matching what choose-theme would actually select. A .theme file contains twinBASIC declarations (e.g. inherits: light; ToolbarBackground: #F3F3F3;), **not browser-ready CSS**. Parse and resolve the theme declarations natively and send validated colors, never raw file text, URLs or arbitrary CSS.

### Native installedThemes[].preview extension

The existing required preview fields remain background, surface, foreground and accent. To improve fidelity, the view also accepts optional hex color fields:

| Field | Theme-derived meaning |
| --- | --- |
| titlebar | effective menu/titlebar background, such as MenuBackColor |
| toolbar | effective ToolbarBackground |
| panel | effective PanelBackground or dock fill |
| editor | effective editor background |
| muted | resolved secondary foreground |
| border | effective divider/border color |

All preview fields must be individually validated single #RRGGBB or #RRGGBBAA values. Optional fields fall back to the valid base paint values when absent. A missing/unresolved base palette is reported as unavailable, not an invented third-party preview. The browser never loads theme files, and the native theme is not temporarily switched to generate previews.

For illustration only, a native snapshot theme may contain:

```js
{ name: 'WinUI3 Dark', mode: 'dark', preview: {
  background:'#202020', surface:'#2c2c2c', foreground:'#ffffff', accent:'#60cdff',
  titlebar:'#202020', toolbar:'#202020', panel:'#282828',
  editor:'#1e1e1e', muted:'#bbbbbb', border:'#444444'
}}
```

**Cody integration:** Native code owns both-directory discovery, duplicate-name loader precedence, inheritance, colors and trusted exact-name selection. Quill owns only the miniature view in this directory. No additional native action name or change to existing snapshot schema is required. This source-only pass does not establish that native enumeration or resolved palette extraction is implemented.

## Native action/snapshot contract and 2026-11-23 changes

The original six **action names are unchanged**:

| action | payload |
| --- | --- |
| `choose-theme` | `name: <exact installed IDE theme name>` |
| `choose-toolbar` | `name: 'Classic'\|'Hybrid'\|'Ribbon'` |
| `installation-preferences` | Optional `automatic` boolean or `restart` boolean; `channel` is no longer offered in onboarding |
| `welcome-record` | `schema:1`, `disposition:'completed'\|'dismissed'` |
| `bootstrap-retry` | none |
| `repair-resource` | `id:'updater'\|'themeDark'\|'themeLight'`, `confirmed:true` only after explicit host confirmation |

**IMPORTANT production adapter update required:** The previous native `choose-theme` service only accepted the literal names `WinUI3 Light` and `WinUI3 Dark`. Shane now requires selection and previews of **all actually installed IDE themes**. Cody must extend the native service to enumerate installed themes using verified IDE APIs, publish that inventory in the snapshot, and validate `choose-theme.name` by exact membership in the *current trusted native inventory*. Do not accept arbitrary theme filenames, paths, URLs or unknown values. The wizard itself never reads theme files. WinUI3 themes remain visually featured, but must be present in the inventory before they can be selected.

### Required native snapshot extension

Preserve all existing schema 1 fields (`root`, `installationId`, `preferences`, actual `theme`, `toolbar`, `bootstrap`, `message`, `recovery`) and add:

```js
installedThemes: [
  {
    name: 'WinUI3 Light',
    mode: 'light',
    preview: {
      background: '#f9f9f9',
      surface: '#f3f3f3',
      foreground: '#202020',
      accent: '#0067c0'
    }
  },
  { name: 'WinUI3 Dark', mode: 'dark', preview: { /* real native colors */ } },
  { name: 'A locally installed theme', mode: 'light', preview: { /* real native colors */ } }
]
```

The `installedThemes` entries must come from the **actual IDE theme enumeration**. The `mode` is optional, but, when supplied, must be `light` or `dark`. The `preview` requires all four safely formatted `#RRGGBB` or `#RRGGBBAA` colors, based on the actual theme values resolved by the host. The wizard treats the palette as data, restricts its CSS values to those formats, and renders only a miniature theme palette preview. It never constructs CSS from arbitrary strings. Viewing the miniature does not call choose-theme. Clicking its whole selection tile does request choose-theme. For installed themes lacking preview colors and a known light/dark mode, the UI says **Theme palette unavailable**, not a misleading generic imitation. For truly accurate previews of third-party themes, Cody must supply the extracted resolved colors. If native support for enumerating the colors is unavailable, that is a clearly surfaced integration gap rather than permission to silently activate each theme for preview.

The WinUI3 Light and Dark previews remain the visual focal point through a featured group. Other installed themes follow in a separate group. When the native inventory is missing/empty, the wizard does not invent selectable options or bypass the native adapter; it shows the unavailable-inventory explanation.

### Removed onboarding material

- **Release channel selection has been removed** because twinBASIC does not currently have a stable IDE release. The wizard no longer emits an `installation-preferences` action containing `channel`; the existing internal setting may remain for compatibility. Restore a stable/development UI choice only when there is an actual stable distribution, as tracked in both tbUI3 IDE and repository ROADMAPs.
- **TabView/TabPage feature marketing has been removed.** Those controls belong to the core tbUI3 toolkit even though tbUI3IDE supports them. The Features page now highlights actual tbUI3IDE functionality: IDE themes/accent, toolbar/layout commands, Classic/Hybrid/Ribbon, and updater/installation settings.

### Existing acknowledgement semantics

`setSnapshot(snapshot)` must receive a *settled native response* with the actual theme/toolbar/settings. It clears pending/optimistic state so rejected choices revert to actual values. Cody's production adapter must filter unrelated background snapshots until outstanding correlated request IDs settle. All native action success/error messages are shown in the wizard status; application code never reads/writes files or launches processes.

**Native bridge inventory update is not yet implemented by this isolated UI pass.** Cody owns that change, canonical resource embedding, and production acceptance.

## Validation and next owner handoff

- The existing source-level tests have been rewritten to check the Toolkit packaging interface; the previous 9 passing test report is **not** evidence that this revised version was validated.
- Cody should update the production embedding/generator, exact project/source mirrors, resource inventory and release packaging to embed all three view assets plus `welcome.js`; keep their actual bytes matched.
- Repeat production JSDOM adapter tests with an iframe-capable environment or a harness that exercises the isolation boundary, including request correlation, rejection, theme preview-only, styled asynchronous repair confirmation, Escape, rerender and disposal.
- Verify runtime initialization under the native IDE HTML dialog and CSP, both WinUI3 themes and a non-WinUI IDE theme, keyboard/focus handling including parent/iframe boundary, and supported modes under actual BETA 1045.
- Do not classify the shared HTML view as native updater acceptance, DLL-only install acceptance, or a completed production build.
- The current updater product scope remains in the authoritative Phase 1 installation specification; this directory does not change native updater transactions, sidecar binary acceptance or future-phase strategy.

**Observed implementation boundary:** This is now a true shared-runtime Toolkit application surface, but a frame-based modal's focus behavior and host CSP require actual integration acceptance. Cody's existing native HTML dialog remains responsible for modality outside the iframe.
