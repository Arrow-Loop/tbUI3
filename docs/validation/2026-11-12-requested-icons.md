# Requested icons and document commands, 2026-11-12

Candidate: tbUI3IDE 1.3.0.8. Implements Shane's explicit icon/label/divider list for Home, Insert, Code, Form, MultiPage, View, Project, Debug, Add-ins and File.

## Sources and reproduction

The accessible Arrow-Loop/twinBASIC-Knowledge reference branch (`20b438ad242355e38f5c65ce04ad25960fe25a06`) states that its WinUI HTML package excludes the broad icon archive. Requested Fluent assets were retrieved from Microsoft's official `@fluentui/svg-icons` package, version 1.1.341, instead. Every named asset is available; 24px regular artwork is preferred, with 20px/16px variants where 24px is not published. The one filled selection is the right-arrow badge used in the composite.

`tbIDE/tbUI3IDE/icons/requested.json` contains 55 assets with SVG text, filenames, source URLs and SHA-256. Run `node tbIDE/tools/import-ribbon-icons.mjs <path-to-@fluentui/svg-icons-1.1.341>` to reproduce it. The existing MIT license is retained. Segoe uses the requested code points through installed Windows fonts, with Segoe MDL2 fallback; fonts are not bundled.

Page Right masks out the old circular badge in tab_desktop_arrow_left_20_regular and overlays arrow_circle_right_20_filled, centered at (5.5,14.5) with radius 4.5. Source component metadata and the derivative hash are recorded in the catalog. This is the explicitly requested custom composite; it is not presented as an official standalone Microsoft glyph.

## Implementation

- `ribbon-presentation.js` declares explicit source/action/name icon assignments and the requested caption overrides. `iconFor` honors those before native backgrounds/codicons. Unlisted actions retain existing artwork and native state/dispatch. All requested references are checked by tests.
- Segoe characters have aria-hidden icon spans and a scoped system-icon font. Fluent SVGs remain foreground-colored masks. The generated add-in contains 92 SVG entries (19 established, 18 earlier gap-fill, 55 requested) plus the original titlebar PNG.
- MultiPage uses the requested six captions with unchanged original help/accessible names, native events/state and two vertical pair separators. No control or native command identity changes.
- Save Document uses native tbEditor_Save in an isolated leading Document section on Code/Form. Ribbon uses the original discovered descriptor in both locations and removes it from File. Hybrid invokes the same native command with normal native enabled-state evaluation, keeps its native menus and gains no quick access or Backstage.
- File navigation gains the horizontal Open/Save separator and explicit rail icons. Each loaded add-in row uses puzzle_piece. IDE Options, language and keyboard shortcuts remain together on the existing Options page.

## Checks and limits

- Node v22.21.1, jsdom 26.1.0 and installed IDE main.js/formDesigner.css fixtures: `node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs`: **111 passed, zero failed/skipped**.
- Added exact requested-assignment coverage; explicit-over-native icon precedence; Segoe code points and aria-hidden representation; unchanged dispatch/disabled behavior; Save Document routing/order/state in both layouts; MultiPage captions/tooltips/separators/composite provenance; File rail assignments/divider; catalog hashes and XML parsing. Existing native descriptor reachability and actual native producer tests still pass.
- `node tools/validate-tabview-projects.mjs`: **71 exact mirrors**, package/embedded references, stable control/form IDs, real page ownership and CRLF checks pass. Regenerated IdeToolbarScript.twin and add-in Settings are patched into the canonical project.
- Browser plugin not available; used installed Edge through Playwright against a temporary localhost fixture at 1280×720. Verified expected page identity/nonblank content, no page/console errors, all 55 SVGs decoding, all populated Ribbon tabs/File Help rendering, native dispatch and contextual MultiPage selection in Ribbon/Hybrid, persistent Form content, logo conditions and Options dispatch. Screenshots reviewed for Home, Insert, Project, Form/MultiPage and File Help. Fixture runner/screenshots remain outside the repository.
- Source/renderer evidence does not establish a compiled twinBASIC result. Native build/reload, exact target-font rendering, high contrast and native visual acceptance remain pending. No Windows API/COM declarations or pointer-width-sensitive code changed. Existing adaptive Ribbon/keytip and broader TabView authoring gates remain open. No mobile viewport was tested for this desktop IDE pass.

## Native follow-up

Build/reload tbUI3IDE 1.3.0.8, review the icons across all tabs/File pages, and verify Save Document availability/actions from Code and Form. Check both replacement layouts, MultiPage pair separators and left/right directions, unchanged tooltips, compiler captions, File divider and loaded-add-in icons. Keep recording native results separately from fixture checks.
