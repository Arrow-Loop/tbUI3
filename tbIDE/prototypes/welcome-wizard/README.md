# tbUI3IDE Welcome Wizard (functional, integration-ready module)

**Owner:** Quill. **Date:** 2026-11-23. **Branch:** `tbui3-dev`. **Scope:** this directory only, reserved while Cody owns production sources and canonical projects. **Integration:** Cody owns production source embedding, native adapter, persistence, IDE Options entry points, package/manifest updates, build and acceptance. Do not treat this folder as a finished compiled twinBASIC add-in.

The wizard is implemented as plain modern-browser JavaScript and a scoped WinUI-themed stylesheet. The view has working navigation, choices, status feedback, a native bridge protocol, bootstrap health/repair affordances, first-run completion/dismissal requests, focus trapping, keyboard Escape, responsive layout and an isolated standalone preview. It **does not** simulate an installed updater or silently mutate settings. `index.html` contains a **clearly labeled mock native adapter only for visual/behavioral preview**.

## Source files

- `welcome.js`: small embeddable view factory, no modules, bundler or third-party dependencies.
- `welcome.css`: scoped under `.tbw-root`, uses existing tbUI3IDE `--color-*` and `--theme*` tokens with fallbacks; no global/body overrides.
- `index.html`: run locally in a browser for a development preview; uses fake in-memory native snapshot and explicitly simulated acknowledgements. **Not shipped** with production add-in.
- This README is the **view integration interface contract**. The authoritative product scope remains `tbIDE/INSTALLATION_MANAGER_SPEC.md`; Cody's native intent and state model is `tbIDE/PHASE1_COORDINATION.md`.

## Embedding and mounting

Load `welcome.css` once into the actual IDE document, or pass the CSS text as `cssText`. Load/evaluate `welcome.js` once in the add-in's IDE-hosted DOM context. The factory is exposed as `window.tbUI3CreateWelcomeWizard`.

```js
const welcome = window.tbUI3CreateWelcomeWizard({
  document: ideDocument,
  mount: ideDocument.body,
  // cssText: embeddedWelcomeCss, // if not already injected globally
  send(request) {
    // Native adapter enqueues request, not arbitrary command/file operations.
    // Example: { action: 'choose-theme', name: 'WinUI3 Dark' }
    enqueueValidatedWelcomeNativeRequest(request);
  },
  confirmRepair(resource) {
    // Optional: native-styled, user-approved confirmation.
    // Return true only for an explicit user confirmation.
    return confirmExplicitResourceRepair(resource);
  },
  onClose(disposition) {
    // Optional: release host focus/visibility as needed.
  }
});

welcome.setSnapshot(actualNativeSnapshot); // on every native acknowledgement/result
welcome.open(actualNativeSnapshot);        // only on schema-1 first-run or explicit reopen
welcome.close();                           // programmatic close; does NOT mark completed
welcome.destroy();                         // on add-in unload; removes injected wizard DOM
```

`getState()` returns public view state `{page,open,source,pending}` for debugging. The `source` option (optional) is descriptive, not used as a persistence key. The factory is suitable for the same IDE DOM used by Classic, Hybrid and Ribbon; it does **not** launch a separate WebView2 instance. It doesn't own filesystem/process privileges.

Native adapter **must call** `welcome.setSnapshot(...)` with a new authoritative snapshot after processing each sent action. `send` is an outbound command; no UI change is considered persisted until native state is acknowledged. A native error should be returned in the snapshot's `message`, which the wizard displays in a live status region. In-flight choice controls are disabled until a snapshot arrives. If a bridge returns an asynchronous error without a snapshot, the adapter must synthesize a refreshed snapshot containing the error; do not leave controls perpetually pending.

When completion/dismissal is selected, the wizard queues `welcome-record` and closes. The native layer owns whether the record was actually committed; a failed persistence should be recorded/reported by the host, **not** quietly treated as successfully completed. The wizard never automatically records first-run completion simply because assets already exist.

## Exact native intents

The output `send(request)` receives one of these **allowlisted** objects:

| Action | Example request | Notes |
| --- | --- | --- |
| `choose-theme` | `{action:'choose-theme',name:'WinUI3 Dark'}` | Exact `WinUI3 Dark` or `WinUI3 Light`; only sends after user clicks a theme tile, not a preview |
| `choose-toolbar` | `{action:'choose-toolbar',name:'Ribbon'}` | Exact `Classic`, `Hybrid`, `Ribbon` |
| `installation-preferences` | `{action:'installation-preferences',automatic:false}` | Optional Boolean `automatic`, Boolean `restart` or `channel:'development'/'stable'`, sent individually |
| `welcome-record` | `{action:'welcome-record',schema:1,disposition:'completed'}` | Also `dismissed`; per-user completion, independent of resource provisioning |
| `bootstrap-retry` | `{action:'bootstrap-retry'}` | Offline missing/recognized resource recheck only |
| `repair-resource` | `{action:'repair-resource',id:'themeDark',confirmed:true}` | Only after explicit user confirmation; native bridge retains verified backup, refuses downgrade |

**No generic action, filename, URL, executable path, arbitrary filesystem operation or automatic update approval is passed by the view.** Retain native validation and exact allowed values. Never infer user approval to install/download IDE updates from wizard navigation.

## Snapshot shape (schema 1)

Compatible with Cody's `tbIDE/PHASE1_COORDINATION.md`:

```js
{
  schema: 1,
  root: 'C:\\twinBASIC',                    // native informational only; do not use as command input
  installationId: 'native-generated-id',
  preferences: {
    schema: 1, strategy: 'InPlace',
    automatic: true, restart: false, channel: 'development'
  },
  theme: 'WinUI3 Light',                   // actual host theme, not preview theme
  toolbar: 'Classic',                      // actual host toolbar mode
  bootstrap: {
    status: 'ready', message: 'Bundled resources verified.',
    resources: [
      { id:'updater', path:'...', status:'ready', message:'Verified', repairable:false },
      { id:'themeDark', path:'...', status:'modified', message:'Customized', repairable:true, backup:'...' }
    ]
  },
  message: 'Native action succeeded',     // or useful error; string or {message:'...'}
  recovery: false                         // pending transaction/recovery needs attention
}
```

`theme`, `toolbar`, and `preferences` values displayed on Finish are read from **native snapshot** rather than assumed from button clicks. A pending user choice is marked in the view and reconciled when the native snapshot confirms the new value; on failure, the host must send a meaningful `message` and actual unchanged value. The preview supplies dummy snapshots and in-memory mutations, but production must use native truth.

When several IDE installations are running, each add-in instance creates its own wizard instance and receives only its originating installation snapshot. Do not share update approvals or per-installation preferences. The global Welcome completion record is per-user and checked by the native layer before `open()`; missing files alone do not open the wizard.

## Visual behavior and accessibility

1. Six pages: Welcome, Updates, Themes, Toolbar, Features, Finish. Each is backed by interactive controls or real descriptions; Phase 2/3 strategies are mentioned, **not** offered as nonfunctional choices.
2. `Escape`, Close or Skip tour => `dismissed` record; Finish => `completed`; changing pages or previewing themes never marks completion.
3. Back/Continue navigation and focus management; focus restores to prior active element when closed, keyboard Tab remains within dialog; native status/errors appear via `role=status`, with errors flagged visually. No global keyboard handlers or body-wide CSS rules.
4. Theme tiles always show **preview** art first; the actual IDE theme is changed *only* when the user clicks Use by choosing the tile. Existing theme/toolbar stay unchanged unless chosen.
5. Bootstrap provisioning and online update checks are separate; disabling checks does not disable `bootstrap-retry` or a manual updater check elsewhere.
6. Layout honors IDE theme variables, supports light/dark and accent with fallbacks, small-window widths and reduced-motion preference.

## Cody integration checklist

- Read `PHASE1_COORDINATION.md`; do not edit this reserved directory while integration is pending. Copy/embed stable source from this commit into the normal generated script/CSS pipeline. Use the add-in's actual native bridge, not `index.html`'s simulated adapter.
- Verify `welcome.js` global factory registration and DOM mount on the real IDE page or shadow root's `ownerDocument`; make sure CSS is applied in that document and overlay is above IDE menus/panels.
- Wire **real native snapshot/actions** for all six intents; no browser `localStorage` preference persistence, no direct filesystem/network side effects.
- Implement first-run schema check and explicit reopen entry point in Help or IDE Options. Avoid duplicate welcome views after reload/add-in reinitialization.
- Keep old themes, toolbar modes and auto-check preferences when wizard is dismissed or skipped. Do not silently enable a WinUI3 theme.
- In production supply `confirmRepair` with native WinUI-styled confirmation; the view has a browser `confirm` fallback for non-hosted demos, but **do not ship browser confirm/prompt flows** in the final add-in.
- Synchronize canonical `.twinproj` and source mirrors/line endings; update ROADMAP/CHANGELOG for actual integration; run native and automated checks at the agreed acceptance gate.
- Never use this functional **view** as evidence that native theme APIs, EXE embedding, updater transactions or first install have passed acceptance.

## Known boundaries

This isolated module is **fully functional as a UI component**, not a binary installer. Real theme changes, preferences, bootstrap, repairs and user records require Cody's native adapter. The standalone preview intentionally uses in-memory fake acknowledgements and must not be included in release assets. No Phase 2 archival/reorganization implementation is present.
