# tbUI3IDE Welcome Wizard, shared WinUI Toolkit edition

**Status:** Functional isolated source candidate for production embedding. **Branch:** `tbui3-dev`. **Owner:** Quill, restricted to this directory. **Native integration:** Cody maintains the production add-in, project mirror, resources, installer and tests.

This pass replaces the earlier hand-styled dialog/control templates with **actual shared WinUI authoring and rendering**: the full pinned `master.css` design layer and the reusable `controls.js` control runtime, isolated in a same-origin `srcdoc` iframe. Application code declares `winui-button`, `winui-toggle-switch`, `winui-settings-row`, `winui-info-bar` and `winui-summary-card` with application content and native intent handlers; it does **not** create their internal button/switch/info-bar/card presentation. `welcome.css` now owns **only wizard layout/composition**. No global IDE stylesheet, body overrides or feature-specific copies of component appearance.

The control runtime and Master CSS are the preserved complete shared Toolkit code from the selected development checkpoint; do not trim individual component definitions or replace the shared library with handmade approximations. Their existing XAML resource references and token definitions remain unchanged. The wizard-specific layout includes only application-composition geometry (not claims about native XAML control templates). The isolated iframe keeps the Toolkit's `:root`, global selectors and runtime initialization from modifying twinBASIC's original IDE DOM.

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
```

**Important migration notice:** Cody's earlier integration passed `cssText` and mounted the hand-drawn wizard directly. This revision requires the three string assets under `assets` and now mounts the application inside a same-origin iframe underneath the supplied container. The host MUST pack the full shared runtime and Master CSS. It should NOT create a duplicate modal surface; Cody's native modal dialog remains the actual modality owner.

The iframe and its internal DOM are instantiated only on first open. Code installs shared CSS + scoped layout CSS into the iframe and initializes the real shared `WinUIControls` runtime before initializing wizard controls. If the full runtime cannot load, the host must show a meaningful error instead of substituting custom-looking buttons. For production, verify the native IDE's CSP allows trusted bundled inline script initialization in the `srcdoc` context. Do not fetch runtime/styles from GitHub or any network host, and do not persist preferences in browser storage. The standalone preview needs a local static HTTP server (for example `python -m http.server 8765` from this directory), then open `http://localhost:8765/index.html`. Opening it directly as `file://` will generally fail because the browser disallows `fetch` of adjacent files.

## Native action/snapshot contract (unchanged)

The view sends only these allowlisted native objects:

| action | payload |
| --- | --- |
| `choose-theme` | `name: 'WinUI3 Light'\|'WinUI3 Dark'` |
| `choose-toolbar` | `name: 'Classic'\|'Hybrid'\|'Ribbon'` |
| `installation-preferences` | Optional `automatic` boolean, `restart` boolean or `channel:'development'\|'stable'` |
| `welcome-record` | `schema:1`, `disposition:'completed'\|'dismissed'` |
| `bootstrap-retry` | none |
| `repair-resource` | `id:'updater'\|'themeDark'\|'themeLight'`, `confirmed:true` only after explicit host confirmation |

`setSnapshot(snapshot)` accepts Cody's schema 1 authoritative snapshot containing `root`, `installationId`, `preferences`, actual `theme`/`toolbar`, `bootstrap` (including resource status/messages), `message` and `recovery`. On each **settled native acknowledgement**, pending/optimistic selection state is cleared, so rejected choices revert to actual values. Cody must filter unrelated background snapshots until outstanding correlated request IDs settle, as his production adapter already does. Native action success/errors are displayed in the wizard status; application code never reads/writes files, launches processes or approves a software update.

The six pages remain Welcome, Updates, Themes, Toolbar, Features and Finish. **Theme preview** sets only the isolated iframe's Toolkit `data-theme` selector; only clicking **Use** dispatches a native theme action. Actual native theme selection remains authoritative. Skip/Escape/Close record `dismissed`; Finish records `completed`; the wizard does not open merely because a managed file is missing. First-run completion is per user; update settings/consent are per installation. The native layer owns durable persistence and repair safety. `confirmRepair(resource)` returns `Promise<Boolean>` and must be a styled, explicit host confirmation with backup/reset choice.

## Validation and next owner handoff

- The existing source-level tests have been rewritten to check the Toolkit packaging interface; the previous 9 passing test report is **not** evidence that this revised version was validated.
- Cody should update the production embedding/generator, exact project/source mirrors, resource inventory and release packaging to embed all three view assets plus `welcome.js`; keep their actual bytes matched.
- Repeat production JSDOM adapter tests with an iframe-capable environment or a harness that exercises the isolation boundary, including request correlation, rejection, theme preview-only, styled asynchronous repair confirmation, Escape, rerender and disposal.
- Verify runtime initialization under the native IDE HTML dialog and CSP, both WinUI3 themes and a non-WinUI IDE theme, keyboard/focus handling including parent/iframe boundary, and supported modes under actual BETA 1045.
- Do not classify the shared HTML view as native updater acceptance, DLL-only install acceptance, or a completed production build.
- The current updater product scope remains in the authoritative Phase 1 installation specification; this directory does not change native updater transactions, sidecar binary acceptance or future-phase strategy.

**Observed implementation boundary:** This is now a true shared-runtime Toolkit application surface, but a frame-based modal's focus behavior and host CSP require actual integration acceptance. Cody's existing native HTML dialog remains responsible for modality outside the iframe.
