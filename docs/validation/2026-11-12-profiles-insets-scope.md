# Profile parity, insets and presentation scope — 2026-11-12

Candidate: tbUI3IDE 1.3.0.12 on tbui3-dev. Package 1.0.0.65, adapter v8 and stable identities unchanged.

- Added Switch Between Form and Code immediately after Save Document in the Code/Form Document group for Ribbon and Hybrid, reusing the native action and tooltip.
- Hybrid now supports full/simplified presentation and Ctrl+F1 while keeping its smaller tab/command inventory, native menus and no quick access or Backstage.
- Corrected 1.3.0.11's scope: only Simplified removes the additional Center in Container, Lock Controls, Preview, Grid, four secondary MultiPage and Insert file-command labels and uses the Grid options flyout. Full layouts restore labels and inline Grid options. The original ten alignment/size icon-only commands remain in both. The chevron stays inside both layouts and has a transparent background at rest, with hover fill and a visible glyph in both WinUI3 themes.
- Classic retains its native controls, order and handlers, using the same icon resolver as Ribbon. Toolbar/add-in buttons have glyphs and tooltips without visible labels; native selectors remain unchanged. Late contributions and teardown are handled reversibly.
- Additional styling enables 8px left/right main-window insets without a bottom inset. Custom-titlebar mode also adds 8px above Quick Access, preserving its existing 16px left padding and the caption-button rectangles. Real OS titlebar mode gets no top inset; the caption/Quick Access row is excluded from side insets.
- 126 automated tests and 71 exact project mirrors pass. Edge checks cover native BETA 1044 toolbar/header/Grid markup, both replacement profiles and presentations, 38 Classic buttons, theme states and inset geometry. Native compiled build/reload and restart acceptance remain pending. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md.

## Validation performed

- Regenerated IdeToolbarScript.twin and patched the canonical project, including revision 12 Settings.
- `node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs`: 126 passed, zero skipped or failed, with installed native IDE fixtures supplied by workspace.ps1.
- `node tools/validate-tabview-projects.mjs`: 27 package, 37 test-project and 7 add-in exact mirrors; CRLF, embedded package, identities and real page ownership verified.
- Playwright with installed Edge, external workspace QA runners: full/simplified transitions retain the same command/input nodes and values; full labels/inline Grid return; Simplified alone has the new icon-only list/flyout. Tabs, native callbacks, keyboard scrolling at 640px and logo/titlebar conditions pass without page/console errors.
- Actual BETA 1044 native header/toolbar/Grid markup and relevant installed CSS were used. The toolbar fixture allocates a native dock/header row before inspecting geometry. All 38 Classic controls retain node identity, order and callbacks; no visible button labels; late contributed labels reconcile and teardown restores native text.
- Code/Form Document groups dispatch the native switch once in Ribbon/Hybrid, full/simplified. Hybrid retains four tabs and native menus. Chevron glyph is visible with a transparent resting background and a hover fill in both WinUI3 themes.
- Additional-styling geometry: left/right surfaces move inward 8px and narrow by 16px, status-bar bottom stays unchanged. With custom titlebar, Quick Access moves down 8px with unchanged x, and native minimize/maximize/close rectangles are unchanged. Real-titlebar mode has no added top inset. Disabling/disposing restores geometry.

## Native follow-up

This is source, DOM and Edge renderer validation, not a compiled twinBASIC add-in acceptance run. Rebuild/reload the canonical add-in in both target architectures; confirm actual docked/undocked host layout, settings restart persistence, native Form/Code navigation, Grid editing and late add-in contributions. Confirm the two WinUI3 themes and real-titlebar switch visually. Adaptive overflow menus/keytips and earlier TabView acceptance gates remain open.

Screenshots and local QA runners are outside the repository in .workspace-tools; no generated browser fixtures or dependencies ship with the add-in.
