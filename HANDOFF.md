# Handoff: tbUI3

## Current TabView pass, 2026-11-17: package 1.0.0.66 / add-in 1.3.0.16

- Added persisted UI3TabView.TabStyle with UI3TabStyle choices ui3TabEdge (Edge Style, default) and ui3TabExplorer (Explorer Style). Edge follows Shane's customized Toolkit at Smith-Debnam/twinBASIC-Knowledge commit 85432018090efc339d21ae7c47fd0e45ac8dea6b: 36-DIP tabs, 4-DIP top inset and 8-DIP concave feet. Explorer uses the prior WinUI 32/8/4 profile. Both retain a 40-DIP page origin; style changes do not alter page ownership or child coordinates.
- Added native vector tab outlines, selected/page seams, neighbor separators, left-aligned ellipsized captions, theme hover/pressed/disabled states, keyboard-only focus indication, centered add/scroll glyphs, pointer capture/cancel and hover-leave cleanup. Selected tabs paint last so their joins remain intact. Explorer's unselected hover uses the rounded WinUI container; Edge hover uses the Toolkit outline.
- Added overflow arrows that scroll the header viewport without selecting/moving pages, automatic reveal on selection, wrapping Left/Right and Ctrl+Tab navigation, Home/End and Ctrl+T add requests. Very narrow hosts retain a clipped selected tab and keyboard access instead of overlapping arrows. Transient FirstVisibleTabIndex is not written to PropertyBag. Pointer tracking uses pointer-width-safe comctl32 subclass APIs with no retained control reference or timer.
- Adapter v9 mirrors both profiles, reserved feet, add-button position and overflow hit testing. Native viewport changes request header snapshots without structural edits or undo checkpoints. Existing designer page containers, names, locks, selection and insertion paths are retained. Updated canonical package/test/add-in projects and the full embedded package; existing control/project IDs and public-member order are preserved.
- Validation: 142 tests and 71 exact project mirrors pass; x86/x64 Direct2D arc/point ABI and DirectWrite ellipsis probes pass. Edge source-derived curve coordinates match the live verified Toolkit SVG with zero point mismatches in Light/Dark; preview checks cover 1200px/720px widths without console/page errors. Native IDE automation was attempted but could not launch twinBASIC: GetCursorPos returned Access denied (0x80070005). This is not a compiled control acceptance run. Evidence: docs/validation/2026-11-17-tabview-profiles.md.

Shane confirmed the designer workflow works and requested appearance/interactions next. He explicitly requires the customized Toolkit shapes, two TabStyle choices and Edge as the default. The correct read-only reference clone is ../twinBASIC-Knowledge relative to this workspace's parent Projects folder; verify its remote is Smith-Debnam, not the older Arrow-Loop fork. Its canonical WinUIElementToolbox project and 23 mirrors validated before inspection. Reference files were not modified.

Next required external check: build package 66, re-import into the test project, rebuild/reload tbUI3IDE 1.3.0.16 and test both styles at design time/runtime in both architectures. Check hover/pressed/leave/focus, scroll/reselect, narrow hosts, persistence and child ownership. Close controls/events, tab icons, drag/reorder gestures, animation, accessibility/high contrast and exact remaining selected-stroke details are still incomplete; do not describe TabView as finished. Commit and verify the push every development pass.

## Current implementation, 2026-11-17: tbUI3IDE 1.3.0.15

- Save Document now enables for a dirty, writable selected CodeEditor/UIDesigner and saves through the IDE's per-editor openEditors.save(node) route. It no longer invokes BETA 1044's deliberately disabled tbEditor_Save placeholder. Other dirty documents remain unsaved; native writers retain failure/dirty handling. Unsaved projects use native Save As, retaining the originally clicked document across tab changes and skipping it if closed before the callback.
- Form / Code now requires an existing counterpart in the native file tree, using the native handler identity and lookup order for .tbform, .tbcontrol, .tbppage and .tbreport. Standalone modules and unrelated editors disable the replacement button. The same predicate guards dispatch; native global command definitions and Classic toolbar handlers are untouched.
- Both corrections apply to Code/Form in Ribbon and Hybrid, full/simplified. 135 automated tests, 71 exact project mirrors and eight Edge document-command flows pass. Checks exercise actual installed native code/form writers, switch helpers and the generated add-in script; failed/successful writes and Save As targeting are covered. Native compiled-host disk/save/reopen confirmation remains pending. Evidence: docs/validation/2026-11-17-document-commands.md.

This supersedes earlier claims that tbEditor_Save was a functioning native command. The earlier mocked availability tests did not expose its disabled placeholder. Package 65, adapter v8 and stable identities remain unchanged. Rebuild/reload and verify selected-document saving without saving other dirty tabs, file reopen, Save As cancel/complete and paired/unpaired editor switching. Commit and verify the push every pass.

## Current implementation, 2026-11-17: tbUI3IDE 1.3.0.14

The ribbon command card now has no drop shadow or bottom border in standard and third-party themes. Its existing raised treatment is enabled only for WinUI3 Dark and WinUI3 Light, with case-normalized theme names. This applies to Ribbon and Hybrid in both full and simplified presentation, independently of the additional-styling switch. Theme changes toggle a presentation class without replacing command/control nodes. Command behavior, group dividers, dimensions, corner radius and popup styling are retained.

Validation: 130 tests, 71 exact project mirrors and Edge renderer checks pass. Edge covers 32 theme/profile/presentation states, including live transitions through native Dark/Light/Classic, custom names and both WinUI themes, with no page/console errors. Native add-in build/reload acceptance remains pending. Package 65, adapter v8 and stable identities are unchanged.

Rebuild/reload and compare both WinUI themes with standard/third-party themes. Commit and verify the push after every pass. Evidence: docs/validation/2026-11-17-ribbon-elevation.md.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.13

- WinUI3 Light now uses neutral #F3F3F3 title/menu chrome and dark foregrounds. Optional styling corrects native hard-coded white caption text/PNG icons and also neutralizes an older installed Light theme. The generated Light.theme has the same neutral palette.
- Restricted the 8px window side/top insets to the exact WinUI3 Dark and WinUI3 Light themes with additional styling enabled. Other themes, including other names starting with WinUI3, receive no insets. Existing caption/Quick Access exemptions, real-titlebar top condition and no-bottom-inset behavior remain.
- Added live Windows accent integration for both WinUI3 themes while additional styling is enabled. The private UISettings bridge reads all seven system accent shades on the existing one-second options timer. WinUI resource mapping uses Light2/Dark1 for dark/light fill and Light3/Dark2 for links, including hover/pressed opacity, native UI accents and progress bars. Theme changes, styling Off and unload remove the owned override stylesheet; unavailable Windows colors fall back to the static theme.
- Validation: 129 tests and 71 project mirrors pass. Equivalent documented UISettings ABI probes succeeded in both 32-bit and 64-bit Windows processes. Edge checks cover neutral/old-installed Light chrome, readable caption controls, blue/purple palette refresh, both themes, styling Off and non-WinUI cleanup. Native twinBASIC compile/reload and live Windows-settings change acceptance remain pending. Evidence: docs/validation/2026-11-12-neutral-light-system-accent.md.

This supersedes 1.3.0.12's all-theme inset scope. Theme files remain usable without the add-in, with static fallback accent colors. Rebuild/reload the add-in and copy the regenerated Light.theme to the IDE themes folder to update the standalone palette. Package 65, adapter v8 and stable identities remain unchanged. Commit and verify the push every pass.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.12

- Added Switch Between Form and Code immediately after Save Document in the Code/Form Document group for Ribbon and Hybrid, reusing the native action and tooltip.
- Hybrid now supports full/simplified presentation and Ctrl+F1 while keeping its smaller tab/command inventory, native menus and no quick access or Backstage.
- Corrected 1.3.0.11's scope: only Simplified removes the additional Center in Container, Lock Controls, Preview, Grid, four secondary MultiPage and Insert file-command labels and uses the Grid options flyout. Full layouts restore labels and inline Grid options. The original ten alignment/size icon-only commands remain in both. The chevron stays inside both layouts and has a transparent background at rest, with hover fill and a visible glyph in both WinUI3 themes.
- Classic retains its native controls, order and handlers, using the same icon resolver as Ribbon. Toolbar/add-in buttons have glyphs and tooltips without visible labels; native selectors remain unchanged. Late contributions and teardown are handled reversibly.
- Additional styling enables 8px left/right main-window insets without a bottom inset. Custom-titlebar mode also adds 8px above Quick Access, preserving its existing 16px left padding and the caption-button rectangles. Real OS titlebar mode gets no top inset; the caption/Quick Access row is excluded from side insets.
- 126 automated tests and 71 exact project mirrors pass. Edge checks cover native BETA 1044 toolbar/header/Grid markup, both replacement profiles and presentations, 38 Classic buttons, theme states and inset geometry. Native compiled build/reload and restart acceptance remain pending. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md.

Package 1.0.0.65, adapter v8 and existing project/control identities are unchanged. Commit and verify the push after every development pass. Earlier entries below are historical; this pass supersedes the 1.3.0.11 full-layout scope and the earlier Hybrid shortcut behavior.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.11

Shane's screenshots prompted an inset chevron (no external strip), centered simplified row, more icon-only controls and a Grid toggle/options split. Shared metadata hides the specified labels while preserving help/accessible names. Grid's primary proxy keeps the native action/pressed state; its arrow opens the original options fieldset in the existing top-layer popup lifecycle. The fieldset returns to hidden storage on close and its body returns to the native container during tab/mode/unload cleanup. Routine menu refresh does not tear down inputs during editing. Escape returns focus, and native disabled/form context closes/disables the flyout. Added Shane's follow-up 16px Quick Access left padding. 119 tests/71 mirrors pass; Edge uses the actual BETA 1044 Grid markup/CSS and validates values/events, compact centering, inset chevron and Form fit at 1920px. Native rebuilt-host acceptance remains pending. Evidence: docs/validation/2026-11-12-grid-split-compact.md. Settings/persistence from 1.3.0.10, package 65 and adapter v8 are unchanged. Commit and push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.10

Shane requested a bottom-right down-chevron toggle to an Outlook-like Simplified Ribbon with all existing tabs/options. Ribbon now toggles 100px full / 48px single-row command areas; the chevron points up when simplified. Same command/control nodes, selected tab, state and callbacks are retained. Long rows scroll horizontally by scrollbar, mouse wheel or keyboard focus; inputs/selectors retain wheel behavior. An independent SimplifiedRibbon preference is restored/saved through MainModule and all three preference kinds drain on teardown. Ctrl+F1 toggles full/simplified only in Ribbon; Hybrid/Classic keep their structures. Tests: 116 pass without skips; 71 mirrors match; Edge validates 1280px/640px, node/tab retention, popup dispatch, Grid persistence, File and narrow reachability. Native build/restart/visual acceptance remains pending. Evidence: docs/validation/2026-11-12-simplified-ribbon.md. Automatic group-overflow menus/adaptive collapse/keytips remain separate future work. Commit/push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.9

Shane supplied a replacement quick-access logo, twinBASIC_WinUI3_16px.png. Its actual dimensions are 15×16px; it is copied byte-for-byte to the existing images/twinBASIC_WinUI3.png path and displayed at native size. SHA-256: 2b6f1817a8da030d4644d83f1af8a3dd25865f499b63a1c643830e6ad1b6a92d. Existing logo conditions, Hybrid structure and all 1.3.0.8 icon/command behavior remain unchanged. Regenerated/repacked add-in; 111 tests, 71 mirrors and Edge fixture checks pass. Native rebuild/reload confirmation remains pending. Commit and push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.8

Implemented Shane's requested command icons, MultiPage labels/dividers, File icons/Open-Save separator and Save Document relocation. Explicit metadata in ribbon-presentation.js overrides native codicons/images; unlisted commands remain native. Segoe uses system fonts; 55 pinned Fluent SVGs are embedded from icons/requested.json (importer: tbIDE/tools/import-ribbon-icons.mjs). Page Right is the authorized left-tab plus filled right-arrow composite with the old badge masked out. Save Document leads Code and Form in an isolated Document group in Ribbon and Hybrid; it is removed only from Ribbon File, with native Hybrid menus preserved. 111 tests, 71 mirrors and Edge fixture checks pass; all SVGs decode. Native build/acceptance remains pending. Detailed evidence: docs/validation/2026-11-12-requested-icons.md. Package/control identities and adapter v8 are unchanged. Commit and push every pass to origin/tbui3-dev.

## Hybrid audit, 2026-11-12 (current add-in remains 1.3.0.7)

Shane asked that Hybrid receive the Ribbon fixes too. Audit confirms shared label sizing/font refresh, Grid geometry, compact alignment/size buttons and inline MultiPage code already serves both. Added explicit Hybrid width/font and both-mode native command-state/dispatch coverage; 105 tests pass without skips. Shane explicitly chose to keep Hybrid's current structure: native menus without quick access or File Backstage. The logo and Backstage-specific Options consolidation remain Ribbon-only. This pass changes tests/docs only; no version bump or native build is needed.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.7

Shane reported the quick-access PNG was absent in his IDE. Root cause: native getThemeName() lowercases activeThemeInfo.name; the initial logo gate compared title-case names, and its mock repeated that assumption. The renderer now normalizes theme names. A regression executes the installed native function; the Edge fixture also uses it and verifies the original image actually decodes and is visible. All 104 tests and 71 mirrors pass; native rebuilt-host confirmation remains pending. Inline MultiPage from 1.3.0.6 remains intact. Commit and push this pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.6

Shane requested MultiPage directly in Form rather than a nested sub-ribbon. Both Ribbon and Hybrid now insert its six existing native buttons in a normal MultiPage group immediately after Grid, preserving host/page/child context detection and native state/dispatch. Selection changes remove/restore the group; commands retain the surrounding Form UI. 103 automated checks and 71 mirrors pass; Edge fixture selection/placement/dispatch checks pass in both layouts with no errors. Native build/rendered acceptance remains pending. Evidence: docs/validation/2026-11-12-inline-multipage.md. Commit and push each development pass to origin/tbui3-dev per Shane's standing authorization.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.5

Reconstructed Shane's five Ribbon refinements from his prompt and progress screenshots, using the supplied original PNG. Large captions measure their actual font for the narrowest two-line whole-word fit within 50–86px; Grid spacing matches the divider inset; ten alignment/size commands are icon-only with native state/dispatch; File > Options contains IDE Options and former Preferences entries; the embedded logo precedes Save only on WinUI3 Dark/Light with real OS titlebar off. Package 65, adapter v8 and control/consumer identities are unchanged. 103 automated checks pass without skips against installed IDE fixtures; Edge browser-fixture checks pass. Native compiled build and rendered acceptance remain open. See docs/validation/2026-11-12-ribbon-refinements.md. Work is in the local tbui3-dev worktree; no GitHub push is implied by this entry.

## Current implementation, 2026-11-11: tbUI3IDE 1.3.0.4

The 1.3.0.4 pass corrects shared Hybrid/Ribbon geometry: stretched single-column centering, 32px full-size and 16px small glyph canvases, a 4px caption gap, minimum-content widths within the existing 50px/86px caps, 4px card top padding within 100px and 89px dividers. Grid is one group; Configuration is visually hidden; the File rail reaches the top and uses application foreground. Native BETA 1044 Options saves omit notifyChangedTheme, leaving the old optional stylesheet active: page observation now removes it immediately on departure and the options timer reconciles the actual theme name. Previous palette-only variables are removed only when still unchanged; current native values are retained. Reinstalling options preserves unsaved Off, and new CSS attaches with its correct media from the outset. WinUI3 Light/Dark optional CSS adds subtle native/replacement menu shadows. All 99 JS/DOM/CSSOM/native-protocol checks pass without skips, 71 mirrors and six official exports match. Evidence: docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md. Native rendered acceptance remains open; package 65, adapter v8 and consumer identities are unchanged.

The 1.3.0.3 pass responds to Shane's marked-improvement feedback: Form's eight classic align/size controls are direct native proxies; Insert expands the actual async Add producer; dropdowns use auto-popover light-dismiss plus early window-level pointer/mouse capture; large glyphs share a fixed top row; File hides quick access; Zoom has no duplicate visible label; native editor identity/type changes follow Code/Form without overriding a stable manual choice; the native Grid toggle replaces the visible Show Grid checkbox. js/native-toolbar-context.js captures trusted producer descriptors in their original JavaScript realm with a private showContextMenu sink and reads native CodeEditor/UIDesigner state. Unsupported capture retains the native parent fallback. All 93 JS/DOM/CSSOM/protocol checks pass without skips; all 71 mirrors and six official-export files match. Evidence: docs/validation/2026-11-11-ribbon-direct-commands.md. Package 65, adapter v8, consumer project and identities remain unchanged. Native rendered acceptance of this revision is open.

The 1.3.0.2 pass addresses Shane's subsequent native screenshots: separate titlebar/tab and toolbar surfaces; transparent selected/hover tabs with accent/grey indicators; app-themed dropdowns promoted to the browser top layer (legacy max-z fallback); the real native white !important grid-field conflict; masked, size-aligned chevrons; accessible circled File Back. Native source confirms windowed controls at an offset of 1e6 and grabbers at 99,999,999, above the prior dropdown layer. The prior CSSOM checks missed the host's forced-white rule; the new suite loads it. All 84 JS/DOM/CSSOM/protocol checks pass with no skips; all 108 descriptors, 71 mirrors and six official-export matches remain intact. Current evidence: docs/validation/2026-11-11-ribbon-surfaces-popups.md. The icon map now has 37 SVGs (19 established, 18 gap-fill). Package 65, adapter v8, consumer project and identities remain unchanged. Rendered acceptance of this revision is still open.

The 1.3.0.1 pass follows Shane's 2026-11-11 Office/native screenshots: old toolbar surface and compatible foregrounds; sourced light/dark hover/pressed fills independent of optional styling; command-specific full-size/stacked roles with multiple large buttons per group; icons on all command/navigation surfaces; Help moved under File; themed live grid controls. New metadata: tbIDE/tbUI3IDE/js/ribbon-presentation.js; 17 pinned MIT Fluent gap-fill SVGs: icons/ribbon.json. All 78 JS/DOM/CSSOM/protocol checks pass, all 108 live menu descriptors remain reachable, all 71 mirrors and six official-export files match. Evidence: docs/validation/2026-11-11-ribbon-presentation.md. Native rendered acceptance of this revision remains open; do not infer it from the supplied 1.3.0.0 screenshots. Package 65, adapter v8 and the consumer project are unchanged.

The 1.3.0.0 revision replaces literal menu tabs with Home Clipboard/Editing, task-based Code/Form, View groups and Project build/compiler commands. Undo/Redo and main execution controls are quick-access only. File now has a vertical rail/task surface and explicitly hides/inerts the live designer/workspace and floating panels until close or native dispatch. Future commands keep dynamic fallback destinations. All 72 JS/DOM/protocol checks pass, including all 108 live top-level menu descriptors; all 71 mirrors and six official-export files match. Exact command map: tbIDE/RIBBON_LAYOUT.md. Package/consumer project and adapter v8 are unchanged. This is source/DOM/packing evidence; rendered acceptance and adaptive group behavior remain open.

The canonical IDE add-in is now tbIDE/tbUI3IDE/tbUI3IDE.twinproj, output tbUI3IDE.dll. Remove both legacy WinUI3IdeStyle.dll and TabViewDesigner.dll from both architecture folders. Project ID and the WinUI3IdeStyle/Options/Enabled preference remain unchanged; ToolbarMode is saved independently. Package 1.0.0.65 and adapter v8 are unchanged.

The current implementation includes the three-mode selector, active-theme toolbar CSS, enlarged existing Fluent glyphs, native command/menu discovery, Hybrid context, full-menu Ribbon, File/Backstage and quick access. The current validation results below supersede the initial 62-check baseline;  all 71 project mirrors and the current official add-in export match. Evidence: docs/validation/2026-11-10-ide-toolbar.md. Native/visual acceptance and Office adaptive collapse/keytips remain open. BETA 1044's Add-Ins menu only lists loaded add-ins with unsupported action stubs, so real enable/disable is still future work. Do not claim those gates passed. Current architecture and detailed remaining work: tbIDE/ARCHITECTURE.md and tbIDE/ROADMAP.md.

Sizing update in 1.2.0.1: the command area is capped at 100px, separate from the 26px tab strip. Full-size buttons are 76px high and 50px standard/minimum width, growing for labels up to 86px. The supplied Office screenshot confirms the spacing model. Validate the compact geometry along with the existing native acceptance gates.

Spacing correction in 1.2.0.2: the adapter now collapses the toolbar-only native dock slot (BETA 1044 reserves a 30px minimum height), restores the established Fluent shadow/card corners, and uses concise captions rather than help paragraphs, with tighter group spacing. All 66 JS/DOM/protocol checks pass, including the dedicated/shared-slot and redocking regressions. The native screenshot supplied by Shane is the before-state; corrected native appearance remains open. Package/test contents are unchanged.

## Earlier consolidation/planning update, 2026-11-10

Current control package remains 1.0.0.65. One IDE add-in, version 1.1.0.0, now combines theme styling and TabView adapter v8. Canonical project: tbIDE/WinUI3IdeStyle/WinUI3IdeStyle.twinproj. Display name: tbUI3 IDE. Output remains WinUI3IdeStyle.dll; remove legacy TabViewDesigner.dll from both addins architecture directories when migrating. The standalone TabViewDesigner project/src has been retired, and its old README redirects to current instructions.

The existing theme setting and all 288 CSS rules are preserved. MainModule owns the only exported AddIn entry point and the styling lifecycle; private TabViewDesignerController owns functional page behavior. It starts independently of the theme setting and remains available when styling is off or a standard theme is selected. Both features clean up on unload. Readable adapter/script generation now targets the unified project's js/src directories. All 44 JS/contract checks pass with actual BETA 1044 helpers, all 70 mirrors match and official export matches all 5 add-in files. The actual combined native load/unload is the next observation.

Shane revised the next pass: rename the project/output to tbUI3IDE and add IDE Toolbar directly below the additional-styling option, with Classic, Hybrid and Ribbon choices saved independently. Classic retains the existing menu/toolbar; Hybrid is the earlier Home/Code/Form/contextual MultiPage/Add-ins plan, retaining native menus. Ribbon migrates all native menus to an Office-style ribbon, with fullscreen File/Backstage, add-in enablement under File and contributed toolbar commands in Add-ins. Save/Undo/Redo/Play/Pause/Stop go above the ribbon in the former menu area, or the custom title bar when Show real OS titlebar is off. All toolbar UI follows whatever IDE theme the user selects, including standard/third-party themes, even when additional styling is off. Dynamic discovery must expose future menus/options without an add-in update while preserving native command/state authority. Fluent UI Web remains the authorized ribbon-pattern basis with WinUI 3 visuals. Exact groups, migration, discovery and validation requirements are authoritative in tbIDE/ROADMAP.md. These are recorded future requirements; version 1.1.0.0 still uses WinUI3IdeStyle and its existing toolbar. Package 65 delete/readd progress remains supported by the stale Name &H5B trace and replacement Page8 discovery; broader persistence/undo gates remain open.

## Earlier milestone context

This is written for the next developer or AI session; ChatGPT is expected to run the next several passes. Read `AGENTS.md`, then this file, then `CHANGELOG.md` and `ROADMAP.md`. State at the time of writing: `tbui3-dev`, package version 1.0.0.58, twinBASIC BETA 1012.

## What tbUI3 is

tbUI3 is a twinBASIC package (TWINPACK) of WinUI 3 / Windows 11 style UserControls. You draw them from the toolbox onto ordinary twinBASIC forms.

The decisions are in `docs/2026-10-06-first-pass-report.md` and `docs/2026-10-06-spike-spec.md`:
- UserControls, not CustomControls, because CustomControls only work on a WaynesForm.
- All drawing in Direct2D and DirectWrite, with no GDI+.
- Private declarations only.
- Every visual value cites microsoft-ui-xaml.
- The `UI3` prefix and VB-style property names.

## Where things are

- **Repo:** Arrow-Loop/tbUI3 (private). The work branch is `tbui3-dev`. `main` holds only the S1 commit. PR #1 (`tbui3-dev` into `main`) is still open; it was opened without Shane asking, and he decides whether to merge or close it.
- **Shane's PC:** the clone is `E:\Code Projects\tbUI3`, and twinBASIC BETA 997 is in `D:\twinBASIC`. The CLI (`bin\twinBASIC_win64.exe`) can only `export` and `import`; it has no build command, so builds happen in the IDE.
- **Stale folder:** `E:\Code Projects\WinUI 3` is an old duplicate. Ignore it.
- **Shane's machine:** dark mode, accent #FF4343.

## Verified vs not

| Item | State |
| --- | --- |
| S1: the package's control appears in the toolbox, drops onto a form, its properties persist, Click works | Passed (win32) |
| S2: Direct2D button, accent and Standard styles, 4 px corners, gradient border, Segoe UI Variable text | Passed in win32, at design time and runtime |
| S2: resizing | Passed |
| S2: win64 | Passed at runtime by eye; looks identical to win32, and Click raises the Hello World message box |
| S2: light mode | Deferred by Shane; not validated |
| S2: repaint when the form's BackColor changes | Probably fixed by UI3Window's redraw of all child controls, but never checked on its own (see ROADMAP) |
| UI3Window (dark/light title bar, #202020/#F3F3F3 background) | dark mode passed in win32 and win64; light mode deferred |
| Form theme spec: drop-on control, live switching, theme cache | Passed. UI3FormTheme is in the toolbox, drops onto frmMain, replaces manual Attach/Detach, and passes the same runtime behavior tests |
| S3 icons (1.0.0.3): build, designer and runtime rendering, icon left and top, enlarged button, icon-only, MDL2 font check, win64 | Passed on Shane's PC, 2026-10-06 |
| 1.0.0.4: Caption can be cleared in the designer | Passed on Shane's PC in win32 and win64, 2026-10-06 |
| Property page from `(Custom)` → `...` | Works (spike, 2026-10-06); the per-property `[PropertyPage]` link did not work in BETA 997 but works from BETA 1008 (Icon's own "...", confirmed in 1012) |
| 1.0.0.5: UI3IconPage searchable icon picker | Opens, shows the search hint and two-line info, and the picked icon is saved with the form (win32, 2026-10-07). The designer bridge in `UI3Icons` must stay until the cause is understood |
| 1.0.0.6: theme-aware PropertyPage chrome | Designer check passed the dark-canvas part but `picChrome` covered the child controls because its designer z-order was wrong. Runtime win32 was also opened by Shane and the themed picker still worked, so the observed stacking issue is designer-only. |
| 1.0.0.7: PropertyPage designer z-order experiment | Superseded. Shane's side-by-side check showed 1.0.0.6's original sibling order was actually the more accurate designer representation. |
| 1.0.0.8: native PropertySheet skin | Core visual proof passed in win32: dark host/title/tab/button shell appeared and the picker still worked. Issues found: initial white search Edit until interaction, tab/button hover flicker, clipped Apply text. |
| 1.0.0.9: PropertySheet paint/layout follow-up | Superseded by 1.0.0.10 before build. Owns WM_PAINT, refreshes the search Edit, resizes/repositions the real button HWNDs, and requests source-backed WinUI TabViewItem dimensions/typography. |
| 1.0.0.10: centered grid + dual-font details | Visually reviewed in win32 by Shane: centered matrix and dual-font Selected icon area look good. Remaining issues: native Edit repaints white, Icon tab still clipped, preview cards too dominant/too near action row. |
| 1.0.0.11: Edit/tab/preview follow-up | Runtime regression in win32: introduced a large white band above the page and did not fix the white Edit; tab still imperfect. Preview cards were reduced as intended. |
| 1.0.0.12: corrective Edit/tab geometry pass | Runtime screenshot still showed the same core defects; the page geometry experiment did not solve the problem. |
| 1.0.0.13: diagnostic rollback | Built/run win32. Probe confirmed `ThunderTextBox` is the exposed txtSearch HWND, parented by `ThunderPropertyPageDC`, and that parent receives `WM_CTLCOLOREDIT` for it. Clicking Apply also caused the page to shift down and reveal the full Icon tab. |
| 1.0.0.14: confirmed TextBox brush + Apply-layout trace | Built/opened in win32. Screenshot showed the native search edit still white and the Icon tab still clipped, so the confirmed WM_CTLCOLOREDIT route alone was not enough to fix the edit and the forced 32-DIP native tab item remained incompatible with BETA 997's reserved page geometry. |
| 1.0.0.15: native tab metrics + ThunderTextBox erase pass | Built/opened in win32. The Icon tab was still clipped; the diagnostic log then showed tbUI3 had attached to ThunderPropertyPageDC itself and had no tab HWND.  Leaves the real tab item at the host's native metrics and paints inside that rectangle; the confirmed ThunderTextBox subclass now fills WM_ERASEBKGND from the same themed brush and invalidates on focus changes. Not built/run. |
| 1.0.0.16: PropertySheet owner-chain host fix | Built/opened in win32. Search TextBox stayed dark and the Icon tab was fully visible, but the outer PropertySheet remained classic/light because host discovery still happened before BETA 997 inserted the top-level page into its owner. |
| 1.0.0.17: late PropertySheet host acquisition | Built/opened in win32. TextBox stayed dark and native Icon tab stayed fully visible, but the outer shell remained classic/light; repaint-time GA_ROOTOWNER still resolved only to ThunderPropertyPageDC. |
| 1.0.0.18: structural PropertySheet promotion | Built/opened in win32. Correctly found the outer #32770 and SysTabControl32; titlebar/page/TextBox were dark and tab geometry was correct, but tab strip and action buttons still showed native light paint. |
| 1.0.0.19: deferred PropertySheet skin activation | Built in win32 with TB0012 on `WM_APP = &H8000`; visual result still showed native light tab/button chrome. |
| 1.0.0.20: WM_APP literal-width correction | Candidate only. Uses `&H8000&` so the deferred promotion message is a proper 32-bit Long. No other behavior change. |
| 1.0.0.21: PropertySheet skin attach fix (Claude review) | Built on BETA 999 win32: fully dark on open, hover works. Skin attaches only to the real sheet and is never swapped back to the page; search-box hooks armed separately; log off. See CHANGELOG. |
| 1.0.0.22: disabled Apply underline fix | Validated on BETA 999 win32 with Apply, OK, Cancel and reopen. Skinned buttons repaint after WM_UPDATEUISTATE, BM_SETSTYLE and WM_SETTEXT. |
| 1.0.0.23: package settings (Shane) | Package sorts where it is easy to find in the IDE picker. |
| 1.0.0.24: dialog centred on open | Validated by Shane (win32 and win64 checks). Centred once on the IDE's monitor work area. |
| 1.0.0.25: full Segoe Fluent icon set | Validated by Shane (search, pick, Apply, reopen). UI3Icon = 1,533 Gallery glyphs by code point, generated by tools/gen-icons.mjs; breaking for saved icons. |
| 1.0.0.26 to 1.0.0.28: icon gallery spike | Answered and removed in 1.0.0.29. Package resources read from the host or bloat EXEs; PropertyBag byte arrays persist. |
| 1.0.0.29: spike removed | Not yet built. Next: per-PC icon library (ROADMAP). |
| Icon library builder | `tools/build-icon-library.mjs` (zip checked in the cloud and with Windows `tar` by Shane; not yet used by tbUI3). Host: Arrow-Loop/tbUI3-Libraries. |
| 1.0.0.30: picker tab strip and Setup tab | Built by Shane: install/uninstall work; flicker and a light search box on first open. Installs the library to %LOCALAPPDATA%\tbUI3 (UI3IconLibrary); Fluent and Gallery tabs only report state. |
| 1.0.0.31: flicker and search box fix | Built by Shane: worse, the chrome stopped painting (WS_CLIPSIBLINGS). |
| 1.0.0.32: clipping removed | Built by Shane: chrome paints; tab/Setup hover still flickers; search box opens light until first interaction. |
| 1.0.0.33: owner-drawn picker chrome | Built by Shane: flicker gone; search box still opens light. UI3PageSurface owns picChrome WM_PAINT like the sheet buttons; search box repainted once after first paint. |
| 1.0.0.34: search box log build | Built by Shane: log showed a hidden second icon page taking over the search-box hooks. |
| 1.0.0.35: search box keeps its hooks | Built by Shane: still light on open. Hooks stay on the TextBox inside the sheet. |
| 1.0.0.36: search box repaint and pixel log | Built by Shane: box ends dark after a brief grey flash; log shows the page erase covering it. |
| 1.0.0.37: page erase skips the search box | Built by Shane: grey flash remains. |
| 1.0.0.38: immediate search box repaint | Built by Shane: no grey flash, confirmed fixed. Cause: the inner #32770 container's erase. Diagnostic log still on. |
| 1.0.0.39: Fluent UI System and Gallery grids | Built by Shane: both tabs work, Color SVGs draw; non-24 px icons drew unscaled. Passes 3 and 4: SVG grid with style cards, PNG grid; picks preview only. How the page was built: `docs/PROPERTY_PAGE_GUIDE.md`. |
| 1.0.0.40: Fluent icons scaled to their slot | Not yet built. |
| 1.0.0.40 and 1.0.0.41: icon scaling, Additional Icons tab, MDL2 preview disabled when the glyph is missing | Built by Shane: all work. Icon's own "..." works from BETA 1008 (confirmed in 1012). |
| 1.0.0.42: pass 5a, IconSize and the EditProperty log | Built by Shane: IconSize works; `PropertyPage_EditProperty` is raised with "Icon". Pass 5 plan: `docs/2026-10-19-pass5-icon-system-plan.md`. |
| 1.0.0.43: pass 5b, stored SVG and image icons | Built by Shane: images load, copy, scale and recolour in dark and light. The pane hides IconSource and shows a blank IconData (fixed in 5c). |
| 1.0.0.44: pass 5c, Apply from the library tabs | Built by Shane: works. Log shows a spurious error 438 from `CallByName ... LoadIcon` after each Apply. |
| 1.0.0.45: LoadIcon step logging, for 5d | Built by Shane: EXE draws all picked icons without the library (win32). No error 438. win64: library Apply resyncs and is lost. |
| 1.0.0.46: design-time load/save tracing for the win64 failure | Built by Shane: win64 rebuilds the buttons from the saved form; Segoe Apply fails too. |
| 1.0.0.47: ApplyChanges, Let Icon and process tracing | Built by Shane: win64 Let Icon runs, then error 438 and the designer host process restarts. |
| 1.0.0.48: locate the win64 error inside Let Icon | Built by Shane: Let Icon completes; the win64 designer process dies when the dialog closes (even Cancel). |
| 1.0.0.49: win64 page window hooks off | Built by Shane: still resyncs; tbUI3's hooks are not the cause. BETA 999 fails too. |
| 1.0.0.50: hooks back on in win64 | Superseded by 1.0.0.51. |
| Repro (`tbUI3-Repro`) | win64 Apply works in plain twinBASIC; the fault is tbUI3's. |
| 1.0.0.51: page ignores the teardown SelectionChanged | Built by Shane: win64 Apply works for Segoe, Fluent and Additional Icons, and a win64 EXE draws the picked icons. Pass 5 closed (2026-10-20). |
| 1.0.0.52: UI3IconList L1, picker draws with UI3IconImage | Built by Shane: looks right and works; the grid flickered on scroll (2026-11-01). |
| 1.0.0.53: grid paints without erase | Built by Shane: smooth scrolling, but the grid opened classic grey (2026-11-01). |
| 1.0.0.54: grid repainted once on open | Built by Shane: still grey on open (2026-11-01). |
| 1.0.0.55: grid paint log | Built by Shane: the container erase paints over the grid after it draws (2026-11-01). |
| 1.0.0.56: grid repainted on the search box's repaint ticks | Built by Shane: grid opens correctly (2026-11-01). |
| 1.0.0.57: grid paint diagnostic removed | Built by Shane: all good; UI3IconList L1 done (2026-11-01). |
| 1.0.0.58: L2 spike (UI3Button.SpikeFind, temporary) | Built by Shane: `Parent.Controls(name)` finds a sibling at design and run time; `ParentControls` fails (2026-11-01). |
| 1.0.0.59: L2 spike removed | Not built on its own (folded into 1.0.0.60's test). |
| 1.0.0.60: UI3IconList L3, the list in code plus IconKey/IconList | Not yet built. |

## Work queue for the next passes (updated 2026-10-07)

Do these in order, one pass each unless they are trivially small. Each pass ends with Shane building and testing in the IDE, then CHANGELOG.md and ROADMAP.md (and this file's table) recording only what he actually saw.

1. **Build/test 1.0.0.25 in win32 (full icon set), then win64.** Open `(Custom)` → `...` and check that the title bar, tab strip, page and OK/Cancel/Apply are all dark, the Icon tab is fully visible, and the search box is dark. Then hover the buttons, type in the search box, pick an icon, click Apply, and close with OK; the dark skin must stay on throughout. If anything is light, set `PROPERTY_PAGE_LOG_ENABLED = True` in `UI3Window.twin`, rebuild, and read `%TEMP%\tbUI3-propertypage.log`.
   - **Do not touch the designer bridge.** Keep `IconPageApplying`, `SetPendingIcon`/`TakePendingIcon`, `DesignName()` and the `DesignLog` calls exactly as they are.
2. **Finish validating the picker behavior after the chrome pass is visually stable.** In win32 and then win64: pick + Apply; pick + OK; reopen; search `save`, `57716`, `E8CB`, `&HE174`; pick then Cancel; wheel over both the grid and search box; drag/click the new painted scrollbar. Then switch Windows light/dark while the property page is open and note whether the page/titlebar repaint immediately.
3. **If the first chrome pass is stable, spike the host button strip.** Inspect the property-sheet HWND hierarchy and test a reversible overlay for host-owned OK/Cancel/Apply while leaving their native behavior underneath. Do not ship a host-window subclass/overlay unless teardown and keyboard behavior are proven.
4. **Tidy tbUI3Test.** Remove the two MDL2 test lines (`IconFontName`/`IconGlyph`) from frmMain's `Form_Activate`.
5. **Themed form canvas at design time** (ROADMAP, designer experience). UI3FormTheme themes the form only at runtime, so in the designer UI3 controls draw dark on a light form. First check that the designer lets a component set its parent form's BackColor at design time (`Ambient.UserMode = False`), then apply the WinUI window background when `ManageBackColor` is True. Cite the microsoft-ui-xaml source for the colours.
6. **Designer accent refresh** (ROADMAP). The designer reads the accent once at IDE start; refresh the theme cache at design time cheaply.
7. **S2 BackColor repaint check** (ROADMAP, spike A). Change a form's BackColor at runtime without UI3FormTheme and confirm the button repaints.
8. Then continue spike A in ROADMAP order (S4 windowless/transparent, S5 Mica, S6 per-monitor DPI, S7 visual states, S8 keyboard/focus, S9 coexistence). Each needs a short spec and Shane's go-ahead before code.

Things that need Shane's decision, not a pass of their own: a dark icon-picker page (exploratory; the Windows-drawn dialog frame stays light), picker extras (arrow keys, hover), what to do with PR #1 and `main`, and where `reference-packages/` lives.

## How a pass works with Shane

- Shane builds, tests and saves in the IDE himself. Give him one step at a time with the exact command to type or thing to click, and ask for a screenshot when the result is visual.
- Version: bump `project.versionRevision` in `tbUI3/src/Settings` (LF line endings) when the package changes, and add a line to `tbUI3/src/CHANGELOG.md`, which ships inside the package.
- Typical test loop: close the projects in the IDE, `git pull --no-edit`, reopen tbUI3, build, update the tbUI3 package inside tbUI3Test, test, then Shane commits and pushes (`git commit -am "..." && git push`).
- If `git pull` refuses because tbUI3Test.twinproj has local changes (usually from updating the package), use `git stash && git pull --no-edit`; the package is re-imported anyway.
- After Shane pushes, regenerate src from his projects (`node tools/twinproj-src.mjs extract tbUI3Test/tbUI3Test.twinproj tbUI3Test/src`, and the same for tbUI3) and check with `compare`.

### Syncing the project and src

- `tools/twinproj-src.mjs` replaces the twinBASIC CLI for this: `extract` regenerates `src/` from a project Shane pushed, `patch` copies edited src files into the project, `compare` checks they match. The CLI export also works but needs absolute paths.
- Never push a `.twinproj` while Shane has uncommitted IDE changes to the same file: it is binary and cannot be merged. Ask him to commit and push first (`git commit -am "..." && git push`), then pull and work.

## Reference package laboratory

- `reference-packages/ReferencePackages.twinproj` is the validated package-archeology project. Shane confirmed the repaired project runs in BETA 997.
- It intentionally enables many packages so their actual source/API patterns can be inspected in one place. That does **not** authorize adding those packages as tbUI3 dependencies.
- The loose `reference-packages/src/` mirror should be used for searches and diffs; the `.twinproj` remains the canonical snapshot.
- The original diagnostic avalanche was caused by WinDevLibImpl's embedded `Packages/WinDevLib` folder being empty even though its Settings declared that local dependency. The repaired snapshot embeds the same WinDevLib 9.5.742 payload there. Do not “fix” those interfaces by duplicating hundreds of missing declarations.
- Priority donors/references: WinRT (runtime activation, HSTRING, Composition, and its modern subclass helper), WinDevLib/WinDevLibImpl (Windows/COM declarations), VBCCR18 (modern subclassing and mature control behavior), TwinTimerLib, AutoCompleteLib, and OLEGuids. The audited WinRT 1.7.0.159 source does not contain UISettings/GetColorValue, and TBMANLIB 1.0.29.0's subclass helper is legacy 32-bit code, so neither should be assumed to solve those jobs. GdiPlus is comparison/reference only; tbUI3 remains Direct2D/DirectWrite-first.
- For any adapted third-party code, verify the licence and record provenance. Minimize the copied surface and keep helpers private where practical.

## Control fidelity rule

- Read `docs/CONTROL_FIDELITY_POLICY.md` before control work.
- This project is recreating WinUI 3 controls, not generic Fluent-looking controls.
- Control-specific microsoft-ui-xaml templates/theme resources outrank Gallery/general Fluent guidance.
- Follow exact resource chains and visual states where Microsoft defines them.
- Any property/value that exists only for twinBASIC/VB convenience must be explicitly labeled as such and must never be presented as “the WinUI value.”
- The S3 8-DIP `IconSpacing` default is currently one such convenience value; WinUI Button has arbitrary Content and defines no Button-specific icon-spacing property/resource.

## Full control-surface target

- `docs/CONTROL_INVENTORY.md` is the authoritative control/variant coverage map.
- The package goal is broad practical WinUI 3 coverage, including the hundreds of documented Gallery/style/behavior variants, **not** hundreds of toolbox entries.
- Preserve Claude decision D6: one coherent `UI3...` control family exposes related Microsoft controls through `Style`, `Mode`, `Presentation` or other focused properties. Example: `UI3Button` covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit and command-bar button variants.
- Current Microsoft Gallery snapshot used for the inventory: 2026-10-05 main commit `b927a6253d6b183be55b90287b8a04fde14d31a3`, 125 catalog pages.
- Fundamentals/design/accessibility pages become package-wide requirements, while platform/service pages such as Clipboard, shell notifications or AppWindow are not misrepresented as draggable controls.
- Do not add package dependencies merely to cover a Gallery host/service. Use private native implementations, optional adapters/companions or documented existing platform facilities as appropriate.

## Prepared next milestone

- `docs/2026-10-06-s3-icon-spec.md` is the S3 specification. S3 is now implemented and validated.
- Icon code points: a WinUI Symbol value (for example Accept = E10B) is the old Segoe UI Symbol code point. WinUI converts it to a modern code point (Accept = E8FB) before drawing. Segoe Fluent Icons and Segoe MDL2 Assets both use the modern code points, so tbUI3 keeps one table copied from WinUI's `icon.cpp`. This supersedes the S3 spec's original "dual mapping" rule.
- Ordinary text remains Segoe UI Variable Text with Segoe UI fallback; system icons use Segoe Fluent Icons with Segoe MDL2 Assets fallback.
- Current Gallery also exposes SubtleButtonStyle, now recorded as part of the UI3Button family target.

## Gotchas

- **Re-importing the package into tbUI3Test.**
  - The IDE's "Import from file" refuses a package whose name is already embedded ("'tbUI3' conflicts with an existing imported package").
  - Removing the reference in the IDE doesn't remove the embedded copy.
  - Instead, update the embedded copy (Shane does this from the IDE as part of each test loop). The embedded copy is just the package's own source export.
  - In the IDE's dialog, the imported package also has to be ticked by hand. GUI automation struggled with that.
- **`.twinproj` files are binary.**
  - Edit them by exporting to `src/`, editing, and importing with the twinBASIC CLI, or patch them with `tools/*.mjs`.
  - The documentation repo's `impexp.mjs` import re-sorts entries and its export drops `.meta`. Don't round-trip through it.
  - Keep `.twin` files CRLF. Keep each `Settings` file's existing line endings: the package's uses LF.
- **IDs.** Never change UI3Button's class, interface or event IDs (`tbUI3/UI3Button-ids.json`).
- **WinUI colours.** WinUI's dark fills are translucent, so test on a dark form (#202020). On the default light grey form the Standard button's text is nearly invisible.
- **Declarations.** The Direct2D/DirectWrite interfaces in `UI3Direct2D.twin` declare only the vtable slots that are used; the rest are numbered placeholders. When you call a new method, replace its placeholder in the same slot. Never insert or reorder slots.
- **PropertyPages (BETA 997).** Setting `Me.Changed` inside `PropertyPage_SelectionChanged` raises "Automation error" 80004005 (the frame is still in `SetObjects`); start pages unchanged instead. The per-property `[PropertyPage("...")]` link is ignored, so pages open only from `(Custom)` → `...`. `UserControl.PropertyChanged` can leave a swallowed DISP_E_UNKNOWNNAME in `Err` after it returns, so don't treat `Err` after a property Let as proof the Let failed. Shane has reported both issues to twinBASIC.
- **PropertyBag defaults.** A value equal to the `WriteProperty` default is not saved. If a new control starts with a different value (InitProperties), clearing it back to the default must still work (the 1.0.0.4 Caption fix used `NEW_CONTROL_CAPTION` vs `DEFAULT_CAPTION`).
- **CLI export** needs absolute paths; with relative paths it says the input twinproj does not exist. `tools/twinproj-src.mjs` avoids the CLI entirely.
- **Reading the accent.** It is read from the undocumented `AccentPalette` registry value. Entry 1 is Light2, which is the accent button fill in dark mode (so the button shows #FF8279 on Shane's PC).

## Working agreements with Shane

- Push only to `tbui3-dev`. Don't open PRs or merge without Shane asking.
- Update CHANGELOG.md and ROADMAP.md in every pass. Record only what was actually run as verified.
- Keep instructions to Shane short and one step at a time, with the exact thing to click or type.
- win32 and win64 (Shane, 2026-10-20): Shane tests each build in win32 only. At the end of each pass, first review that pass's changes for x64 traps (Long vs LongPtr in declares, struct sizes, COM interface layouts, subclassing), then Shane runs one short win64 smoke test: open a form, open the picker, apply, reopen, run the app.

