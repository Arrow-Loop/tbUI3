# Ribbon presentation correction, 2026-11-11

Candidate: tbUI3IDE 1.3.0.1, canonical `tbIDE/tbUI3IDE/tbUI3IDE.twinproj`. Native control package remains 1.0.0.65 and TabView adapter v8 is unchanged.

## Request and references

Shane supplied native BETA 1044 screenshots of File/Home/Insert/Code/Form/View/Project/Debug/Add-ins, plus Office Backstage/Home/View/Developer/Page Layout reference screenshots. The native images demonstrate the prior revision opening, organized commands and File underlay isolation, but also identify the titlebar-colored ribbon, missing glyphs/hover, inconsistent size roles and unthemed grid controls. Requirements: old toolbar surface, Office-function-based size roles with multiple full-size commands per group, an icon on every command button, visible hover, Help under File, and existing dimension limits retained.

The current main of Arrow-Loop/twinBASIC-Knowledge AGENTS/workflow/tooling/UI/packaging standards and project documentation were consulted. Project-specific tbui3-dev restriction remains in force. No architecture or dependency change was made to consumer applications.

## Implemented composition and source evidence

- Surface: the old toolbar's `color-card` (CardBackgroundFillColorDefault), falling back to the selected theme's ToolbarBackground. Matching general/control foreground replaces titlebar foreground on the toolbar. Quick access retains menu/titlebar foreground; popup foreground and surface follow context-menu resources.
- States: SubtleFillColorSecondary and Tertiary from the same pinned `microsoft-ui-xaml` bfb0e2a / WinUI Gallery 05939cc baseline as `css/winui3-ide.css`: light hover #00000009 / pressed #00000006, dark hover #ffffff0f / pressed #ffffff0a. These alpha interaction effects live in essential CSS so they work without optional additional styling. Surface/foreground palette remains theme-owned. Popup hover consumes the native context-menu resource, including a light popup in a dark IDE.
- Sizing: `js/ribbon-presentation.js` assigns roles by native command IDs, source IDs and native localization tokens. No command-index or first-child rule determines size. The exact Office analogies and IDE-specific choices are documented in `tbIDE/RIBBON_LAYOUT.md`. Large dropdown chevrons are positioned within the button box rather than adding a layout row.
- Icons: retain the 19 established Fluent masks, native designer/codicon artwork and contributed images. `icons/ribbon.json` supplies 17 additional MIT Fluent UI System SVGs selected with the Fluent icon catalog and fetched from Microsoft source commit `4bf6b786b16f120595efcee8911c74392fa29c14`; each entry records its exact path/blob hash. Missing/unknown command glyphs receive a masked Fluent fallback, including text-only add-ins and File navigation. Original image and command dispatch are preserved. SVG fill colors are alpha-mask inputs, not a replacement foreground palette. Existing MIT license remains at `icons/fluent/LICENSE`.
- File: all native Help descriptors are under File > Help, including native Help menu opening interception. Other File actions, disabled/context state, underlay restoration and focus behavior remain native-backed.
- Grid: original DOM nodes/events/values are moved and restored, with themed text/number-input surfaces and a consistent two-column, three-row layout.

## Measured checks

- **78 tests passed, zero failures/skips**: 44 existing page/combined-add-in checks and 34 toolbar checks. Run against the actual BETA 1044 main.js helpers, with jsdom for DOM/CSSOM cases.
- Six new regressions verify function-based sizes independent of ordering, Help in File with exact-once native callbacks, icon representations on text-only/synthetic/future/File commands, text-only add-ins and original image preservation, grid node/value/event restoration, and resource-backed surface/foreground/hover/pressed/grid CSS.
- The complete live top-level menu inventory still accounts for **108 descriptors** across semantic tabs, File and quick access. Native context-alternative and lazy/async-menu tests continue to pass; this is not an execution claim for every lazy child in the IDE.
- All **71** configured packed-project mirrors match byte-for-byte: 27 runtime package, 37 consumer project, 7 IDE add-in. Package reference/content, public/form IDs, real page ownership and CRLF checks pass.
- The current official `twinbasic/documentation/scripts/impexp.mjs` blob `73547aba63c230f3ba7dd282d45ee71c03a5fadc` exports all **six** add-in files exactly; metadata is checked separately by the mirror validator because official export omits it.
- Generated embedded JavaScript parses and contains the exact adapter/layout/presentation/CSS inputs plus **36 Fluent SVGs** (19 existing, 17 gap-fill). No loose JavaScript, SVG or JSON runtime installation is needed.

Reproduce from the repository root with jsdom resolvable or TB_JSDOM_MODULE set to its installed api.js, and TB_IDE_MAIN_JS set to BETA 1044 ide/main.js:

```text
node tbIDE/tools/build-ide-toolbar.mjs
node tbIDE/tools/build-tabview-designer.mjs
node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs
node tools/validate-tabview-projects.mjs
```

## Acceptance boundaries

The results above are source, JavaScript/DOM/CSSOM/protocol and packing evidence. CSSOM verifies resource/rule selection, not rendered hover pixels. Shane's supplied native images are from the previous revision, not rendered acceptance of 1.3.0.1. Review the changed surface/foreground, hover/pressed state, large/stacked roles, glyphs, File Help and grid controls in actual light/dark and standard/third-party theme contexts with additional styling on/off. Earlier isolated browser validation was rejected by browser URL policy; that restriction was not bypassed. Automatic group collapse/flyouts and Office keytips remain roadmap work.

## Subsequent native findings

Shane's next BETA 1044 screenshots showed that the light native-context-menu palette and normal z-index dropdown could still conflict with the dark designer, and grid fields still painted white because formDesigner.css uses !important. The previous CSSOM checks did not include that host rule and are not evidence that the field background won the native cascade. The 1.3.0.2 correction and expanded native-rule checks are recorded in [ribbon surfaces/popups](2026-11-11-ribbon-surfaces-popups.md).
