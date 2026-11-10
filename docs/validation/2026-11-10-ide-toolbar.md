# tbUI3IDE 1.2.0.0 implementation evidence, 2026-11-10

## Scope

First implementation of Classic / Hybrid / Ribbon, independent of the optional theme switch. Canonical project/output renamed to tbUI3IDE. The established project ID and previous Enabled preference are preserved. Package 1.0.0.65, TabView adapter v8 and all 288 optional-theme rules are unchanged. The source inputs are js/ide-toolbar.js, css/ide-toolbar.css and the existing 19-glyph Fluent toolbar map. Large lead icons are 28px; stacked commands are 18px.

## Evidence

- Current Arrow Loop knowledge main/AGENTS.md and relevant workflow, tooling, packaging, CSS and UI standards consulted for this pass. Project-specific tbui3-dev work branch retained.
- Official BETA 1044 main.htm/styles.css and main.js inspected. Native menu producers, showContextMenu, executeIdeCommand, bindIconToIdeCommand, registerContextBindings, _Toolbar, grid handlers and showRealTitlebar state are the implementation evidence. New menus are discovered from the live header list and their actual descriptors; no list of future command IDs is required.
- 62 tests passed, no skips: 44 existing page/combined-add-in checks plus 18 toolbar/packing/contract checks. Actual shipped helpers verify command alternatives, enabled-state changes, exact-once execution, menu descriptor capture, lazy submenus and async Add-ins. DOM cases cover mode/selector restoration, late third-party controls, contextual selection, File focus return, checked state and native docked toolbar visibility.
- All 71 project mirror files byte-match their packed entries: package 27, consumer 37, IDE add-in 7. Package/test sources, package reference/version and public control/form identities remain unchanged. .twin sources remain CRLF.
- Current official twinbasic/documentation scripts/impexp.mjs blob 73547aba63c230f3ba7dd282d45ee71c03a5fadc exports the add-in and all six exported files match; .meta is compared separately because the official exporter omits it.
- Browser visual validation was attempted through the connected browser. The URL policy rejected the isolated validation fixture's data protocol. No workaround or alternate browser surface was used. No rendered screenshot, native first-open/startup or visual-conformance result is claimed.

Reproduce from the repository root with jsdom resolvable (or TB_JSDOM_MODULE set to its installed api.js) and TB_IDE_MAIN_JS pointing to official BETA 1044 ide/main.js:

```text
node tbIDE/tools/build-ide-toolbar.mjs
node tbIDE/tools/build-tabview-designer.mjs
node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs
node tools/validate-tabview-projects.mjs
```

## Acceptance still open

Native settings persistence, title-bar modes, every real menu family/lazy submenu, actual ribbon/glyph appearance and layout remain observation gates. The current implementation retains menu categories/separators with grouped large/small commands and horizontal overflow. Full Office semantic regrouping, automatic collapsed groups/flyouts, keytips and complete keyboard/focus parity remain follow-ups in tbIDE/ROADMAP.md.

BETA 1044 showAddinsMenu returns loaded names with action callbacks to notSupportedMenuOption; _RootConnection has getAddinsList but no inspected enable/disable operation. File > Add-ins therefore presents that native list with unsupported actions disabled and an explanation. Real enable/disable management is not implemented and must use a validated IDE capability or an explicitly designed restart-safe mechanism.

## Design references

- Microsoft Office ribbon: https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/overview-of-the-office-fluent-ribbon
- Office File/Backstage: https://support.microsoft.com/en-us/office/collab-files/start-backstage-with-the-file-tab
- Quick Access Toolbar: https://learn.microsoft.com/en-us/windows/desktop/windowsribbon/windowsribbon-controls-quickaccesstoolbar
- Fluent UI: https://developer.microsoft.com/en-us/fluentui
- Existing Microsoft Fluent System Icons and their MIT licence remain in tbIDE/tbUI3IDE/icons/fluent. Office is the layout reference, not the icon source.
