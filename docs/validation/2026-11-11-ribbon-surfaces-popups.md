# Ribbon surface and popup correction, 2026-11-11

Candidate: tbUI3IDE 1.3.0.2. Native control package remains 1.0.0.65 and page adapter remains v8.

## Native report and source findings

Shane's screenshots of the previous revision show a light Add component dropdown painted under UserForm controls/grabbers, one undifferentiated tab/command surface, tab background plates, white grid fields and text-like dropdown markers. Requested changes also include an Office-style circled File Back arrow.

BETA 1044 main.js sets WINDOWED_CONTROLS_ZINDEX_OFFSET=1e6 and selected-control grabbers to 99,999,999. The old dropdown's z-index was 100,001, so those designer layers could cover it. Native formDesigner.css contains `input.optionGridWidth, input.optionGridHeight { background: white !important; ... }`; earlier scoped rules without important could not win. The exact stylesheet was extracted from the already inspected official BETA 1044 archive; SHA-256: db4f5c24e227d8390cb907cf2aa5c418cf378a005e772875c71a1a46c3a2a663. No proprietary native stylesheet is distributed with this change.

Current Arrow Loop knowledge main AGENTS/workflow/tooling/UI/packaging standards and project records were rechecked; the project branch restriction remains tbui3-dev. The existing order-preserving project packer and official exporter comparison are retained.

## Implemented behavior

- Separate tab strip and command card. The strip follows title/menu background/foreground resources. Only the card uses the old toolbar surface, shadow and rounded corners. Tab backgrounds remain transparent in normal/selected/hover states. Selected underline uses the theme accent chain; hover on an unselected tab uses the grey secondary/system-text resource. Selection stays accent while hovered, and keyboard focus remains visible.
- Dropdown fill/foreground now follow the application's flyout/general surface, not the native context-menu palette which is deliberately light in the supplied dark theme. Native selects also consume active light/dark color-scheme.
- Body-owned dropdowns request `popover=manual` and `showPopover()` when supported. The browser top layer escapes ordinary stacking contexts/overflow without hiding or reparenting the designer. CSS resets user-agent popover inset/margins. Missing/failed promotion retains an end-of-body max-z fallback. Teardown calls hidePopover on promoted menus, removes bindings/content and clears anchor aria-expanded. Escape, commands, File navigation, Classic/mode switches and unload use that cleanup.
- Grid field backgrounds consume a themed fill token through one scoped important declaration, with token changes for hover/focus. This is a documented native-host override exception, not a new generic important/override layer. Original inputs/classes/values/events remain intact; unrelated UserForm controls are outside the selector.
- A pinned MIT Fluent Chevron Down SVG replaces U+2304. Large dropdowns use 28px icon, 28px caption, 10px chevron, two 2px gaps, 2px vertical padding and 1px borders, totaling 76px. Their chevron is centered below the caption; compact/popup chevrons sit centered at the right. Full-size width constraints and the 100px/26px command/tab caps remain unchanged.
- File Back is an icon-only circled left arrow, with Back to project as its accessible name/tooltip and prior focus restoration retained.

Popover references: [HTML standard](https://html.spec.whatwg.org/multipage/popover.html), [Chrome API overview](https://developer.chrome.com/blog/introducing-popover-api/). Chevron provenance is in tbIDE/tbUI3IDE/icons/ribbon.json, pinned to Microsoft source commit 4bf6b786b16f120595efcee8911c74392fa29c14 under the existing MIT license. The combined embedded map now has 37 SVGs: 19 established and 18 gap-fill.

## Measured checks

- **84 tests pass, no failures/skips**: 44 page/combined-add-in and 40 toolbar cases.
- Six new regressions cover top-layer promotion/cleanup, failed-promotion fallback and exact-once action, separate tab/card resources and indicator-only states, real chevron glyph/layout positions, accessible circled Back/focus return, and the actual BETA 1044 forced-white grid rule. The popover methods are mocked for lifecycle verification in jsdom; this does not claim rendered top-layer acceptance.
- The full shipped menu inventory still accounts for all **108** top-level descriptors, with native context alternatives, lazy/async menu and command tests retained.
- All **71** project mirrors match packed entries (27 package, 37 consumer, 7 IDE add-in). Package/reference contents, stable IDs, page ownership and CRLF checks pass. The current official impexp.mjs blob 73547aba63c230f3ba7dd282d45ee71c03a5fadc reproduces all **six** add-in export files; metadata is checked separately by the mirror validator.
- Embedded JavaScript parses and contains the exact readable adapter, layout/presentation inputs, CSS and glyph map.

Reproduce with jsdom resolvable or TB_JSDOM_MODULE set to its api.js, TB_IDE_MAIN_JS set to BETA 1044 main.js, and TB_IDE_DESIGNER_CSS set to the same build's formDesigner.css:

```text
node tbIDE/tools/build-ide-toolbar.mjs
node tbIDE/tools/build-tabview-designer.mjs
node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs
node tools/validate-tabview-projects.mjs
```

## Acceptance boundaries

These are source, DOM/CSSOM/protocol and packing checks. The supplied screenshots document the previous revision and identified failures. Actual popup painting over designer controls, light/dark/third-party theme contrast, grid normal/hover/focus appearance, titlebar modes and the corrected glyph positions remain native rendered-acceptance items in tbIDE/ROADMAP.md. Previous isolated browser checking was rejected by URL policy; that restriction was not bypassed. Automatic group collapse and Office keytips remain future work.
