# tbUI3IDE Welcome Wizard

**Current status:** Approved view, integrated into the canonical add-in. Production integration and native acceptance are owned by the active production agent; Quill owns this isolated view. [Installation contracts](../../INSTALLATION_CONTRACTS.md) define the native bridge, [approved product requirements](../../INSTALLATION_MANAGER_SPEC.md) define behavior, and [Phase 1 handoff](../../PHASE1_HANDOFF.md) tracks evidence and remaining tests.

## Rendering and isolation

The application uses the complete pinned `master.css` and shared `controls.js` runtime inside **one same-origin srcdoc iframe for the entire Wizard**. The native HTML dialog owns actual modality. The view uses shared WinUI controls and application-owned layout CSS; it does not import Gallery-specific handlers, inject Toolkit CSS into the IDE root, or create another runtime/iframe per preview. No arbitrary CSS from theme files, browser persistence, network assets or direct file/process actions.

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

## Integration API

```js
const welcome = window.tbUI3CreateWelcomeWizard({
  document: ideDocument,
  mount: nativeDialogContainer,     // native modal HTML dialog
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

The factory creates its iframe on first open, installs the embedded shared CSS and layout CSS, and initializes the real WinUIControls runtime once. The native modal remains the only modality owner. Missing assets/runtime must produce a meaningful error, not a replacement homemade control set. Verify the trusted bundled inline scripts initialize under the native CSP and focus crosses the parent/iframe boundary. The optional `getState()` reports current page, open state, source and pending actions. `setPreviewMode('light'|'dark'|null)` is a browser-preview-only appearance override; it never writes IDE preferences or sends native actions. Direct `file://` opening is not supported; use Preview.bat.

## Approved pages and behavior

Normal flow: Welcome, Updates, Themes, Toolbar, Features, Finish. Insert **Setup** only when native status requires attention, immediately after Welcome and before Updates. Offline provisioning is a native startup responsibility; the Wizard remains available if provisioning fails.

- The 46 x 32 caption-close target uses the thin Windows X glyph and red hover, without minimize/maximize buttons. Page content scrolls while the header, footer and navigation remain available.
- Setup shows only actionable resource/recovery issues with readable labels and separate status, native-confirmed Repair and a spaced Check again action. Clear issues remove the optional step; a pending repair blocks continuing from Setup. Explicit continuation with unresolved setup does not claim successful repair.
- Updates explains that automatic checks do not authorize downloads or installation. Release channel selection has been removed until a genuine stable IDE channel exists; internal compatibility remains.
- Themes and Toolbar use clickable, keyboard-accessible whole tiles with selected border and aria-pressed state; no redundant Current labels or separate Preview/Use buttons. Selection requests the real native action, and failed choices revert on settled snapshots.
- Features describes actual IDE styling, toolbar/layout and installation settings. TabView/TabPage feature marketing has been removed because the controls belong to the core library.
- Finish is a compact extensible preference list only (theme, toolbar, automatic checks, restart, strategy); no installation-health dashboard or fixed four-card layout. Back/skip/finish/reopen retain existing semantics.

## Compact selector preview contract

Theme and Toolbar use the same **86px-high miniature IDE silhouette**: small titlebar, abbreviated command strip, project panel and editor. These are not screenshots or full executable toolbars. Classic, Hybrid and Ribbon vary geometry, while all three use the selected theme's resolved palette. WinUI3 Light/Dark are featured first, followed by the other effective installed themes.

Native code enumerates both the per-user AppData twinBASIC themes directory and the active installation's themes directory, including built-in themes exposed through the IDE, using verified loader behavior for duplicate-name precedence and inheritance. The implemented native InstalledThemeCatalog supplies effective paint values; selection requires exact membership in the current trusted native inventory. Theme files are twinBASIC declarations, not browser-ready CSS. Only validated colors and exact names cross the bridge. Rendering never temporarily activates a theme; a click requests selection. Unresolvable third-party base colors display Theme palette unavailable, rather than an invented palette. The two featured WinUI themes may use their known fallback palette while the native data is unavailable.

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

## Native action and snapshot contract

The original six **action names are unchanged**:

| action | payload |
| --- | --- |
| `choose-theme` | `name: <exact installed IDE theme name>` |
| `choose-toolbar` | `name: 'Classic'\|'Hybrid'\|'Ribbon'` |
| `installation-preferences` | Optional `automatic` boolean or `restart` boolean; `channel` is no longer offered in onboarding |
| `welcome-record` | `schema:1`, `disposition:'completed'\|'dismissed'` |
| `bootstrap-retry` | none |
| `repair-resource` | `id:'updater'\|'themeDark'\|'themeLight'`, `confirmed:true` only after explicit host confirmation |

Preserve the native schema 1 fields: root, installationId, preferences, actual theme/toolbar, bootstrap, message and recovery. Supply `installedThemes` with exact name, optional light/dark mode, and validated preview fields above; report discovery state/errors through the adapter. Do not invent selectable entries if the inventory is empty. See [native services and snapshot](../../INSTALLATION_CONTRACTS.md#native-services-and-snapshot) for the full trusted native contract.

`setSnapshot(snapshot)` receives settled authoritative state. The native adapter correlates request IDs and filters unrelated background refreshes until pending choices settle; rejects restore actual values and report errors. Repair requires the host's styled asynchronous confirmation and verified backup approval before dispatching the exact resource ID. The view never accesses files directly or launches processes. Dismissal/completion is per user, independent of resource provisioning and per-installation preferences.

## Validation and maintenance

Production embeds the four approved assets unchanged and verifies hashes through WELCOME_REFERENCE.json. Browser preview/server files are development-only. On intentional view changes, coordinate re-embedding and canonical mirror regeneration with the production agent. Run the focused Wizard contract checks and production adapter tests; verify native modal/CSP, focus, theme selection and rollback, conditional Setup, repair confirmation, narrow layout, reopen/disposal and real settings persistence. Use [ROADMAP.md](ROADMAP.md) and the Phase 1 handoff for remaining acceptance; do not equate source/DOM checks with native UI or update acceptance. Historical view revisions are in [CHANGELOG.md](CHANGELOG.md).
