# Changelog

All notable changes to tbUI3. Dates are when the change was made, not released. Nothing has been released yet.

## Unreleased

### 2026-11-17 - TabView hover repaint and separators (package 1.0.0.69)

Shane confirms package 68 resolves the form-load failure. This pass removes the unwanted horizontal stroke above page content in both Edge and Explorer. Native tab separators now disappear on both sides of a hovered tab; the divider is owned by its left neighbor, so its condition also checks the next tab's hover state. Runtime hover/press/focus/header-scroll changes invalidate only the DPI-scaled header without requesting background erase. The host subclass handles WM_ERASEBKGND without forwarding to the light system brush; opaque Direct2D paint supplies the background. Mouse moves rearm leave tracking without reinstalling the subclass. Design-time edits retain synchronous Refresh for native snapshots.

The large runtime page is explained by the test form's existing Form_Resize handler, which stretches UI3TabView1 to the form's client area minus 240 twips on each side. That code and saved form sizes were retained; a newly drawn control does not automatically fill its form. Package/reference and full embedded copy are 69; add-in 1.3.0.17 / adapter v10 is unchanged. All 148 tests and 71 mirrors pass; the new separator regression failed before the fix and passes across all selected/hovered combinations. Equivalent offscreen Win32 probes pass in x86/x64 for 500 no-erase header invalidations at five DPIs and erase-message handling. These are not compiled-control tests. Reopen the embedded test project/rebuild package 69 and verify hover/leave/capture/focus, resize, both styles and Light/Dark in BETA 1044. Evidence: docs/validation/2026-11-17-tabview-hover-repaint.md.

### 2026-11-17 - TabStyle designer JSON repair (package 1.0.0.68)

The uploaded adapter v10 log in a2fe3a0 identifies the exact failure: BETA 1044 serializes UI3TabView2.TabStyle as `"Description("Edge Style")"` and includes both Description annotations as enum entries. Those unescaped quotes break the full native form response at position 16525. Removed the two enum-member attributes, retaining the enum-level/property descriptions, identifiers, values and Edge default. Friendly style names are documented in comments/property help; the native picker uses ui3TabEdge/ui3TabExplorer. This corrects the annotations introduced in package 66, not damaged saved form data.

Updated the canonical package and full embedded test package/reference to 68. All nine non-package consumer entries other than Settings, including both forms and saved control state, are byte-identical to Shane's upload. Add-in 1.3.0.17 / adapter v10 remains unchanged. Regression failed on the old attributes and passes after removal; all 147 tests and 71 mirrors/stored-JSON checks pass. Native BETA 1044 reopening is still pending: pull and reopen the test project with its updated embedded package. Rebuild tbUI3 68 before importing a separately built twinpack. Evidence: docs/validation/2026-11-17-project-load-json.md.

### 2026-11-17 - Native designer response capture (add-in 1.3.0.17 / adapter v10)

Shane's screenshot establishes that the project opens but frmMultiPage remains at 20% with the JSON error. Installed IDE source sets 20% after receiving the saved form data and starts native control synchronization next. Added a reversible observer around gotNewFormSnapshotsResponse. Only when that native handler throws and its response JSON fails parsing, it records the form, payload length, parser position, nearest preceding control name, 420-character context and bounded original stack. The existing controller writes it automatically to tbUI3-tabview.log beside the project and in TEMP. The native exception is rethrown unchanged; no recovery, global JSON.parse override or form/persistence edits are attempted. Corrected the stale log prefix to adapter v10.

Validation: 146 tests pass, including malformed JSON through the actual installed snapshot parser, successful delegation, original failure preservation, invalid transport handling and reversible hook ownership. All 71 mirrors and stored JSON checks pass. Package remains 1.0.0.67. The BETA 1044 failure is not repaired or natively reproduced locally. Rebuild/reload tbUI3IDE 1.3.0.17, reopen the failing form, wait two seconds for the log timer and supply the new Native designer JSON failure line to identify the failing native value. No package rebuild or test-project edit is needed for this diagnostic pass.

### 2026-11-17 - Test-project JSON load investigation (unresolved)

Preserved Shane's uploaded 75b7598 project. All 37 stored files match c109d62 by content; all 11 stored JSON documents parse. Entry order/revision metadata differ. All 71 project mirrors and existing identity/ownership checks pass. Added stored-JSON parsing to the project validator. Local IDE launch identifies BETA 904 and fails at startup with a different error, so BETA 1044 reproduction is still required. Do not discard form persistence or claim this is repaired. Need failure stage and full stack/generated JSON response. Package 67/add-in 16 unchanged. Evidence: docs/validation/2026-11-17-project-load-json.md.

### 2026-11-17 — Explicit Long glyph literals (package 1.0.0.67)

Changed the Add, Previous and Next glyph literals in UI3TabView to explicit Long values (&HE710&, &HE76B&, &HE76C&), addressing the three BETA 1044 TB0012 warnings Shane reported. Package revision is 1.0.0.67; tbUI3IDE remains 1.3.0.16 / adapter v9. Updated the canonical package, complete embedded test package and version reference. Existing 142 tests and 71 mirror checks pass; warning-free native recompilation remains to be confirmed. No IDs or interaction behavior changed.


### 2026-11-17 — TabView shape profiles and header interaction (package 1.0.0.66, add-in 1.3.0.16)

- Added persisted UI3TabView.TabStyle with UI3TabStyle choices ui3TabEdge (Edge Style, default) and ui3TabExplorer (Explorer Style). Edge follows Shane's customized Toolkit at Smith-Debnam/twinBASIC-Knowledge commit 85432018090efc339d21ae7c47fd0e45ac8dea6b: 36-DIP tabs, 4-DIP top inset and 8-DIP concave feet. Explorer uses the prior WinUI 32/8/4 profile. Both retain a 40-DIP page origin; style changes do not alter page ownership or child coordinates.
- Added native vector tab outlines, selected/page seams, neighbor separators, left-aligned ellipsized captions, theme hover/pressed/disabled states, keyboard-only focus indication, centered add/scroll glyphs, pointer capture/cancel and hover-leave cleanup. Selected tabs paint last so their joins remain intact. Explorer's unselected hover uses the rounded WinUI container; Edge hover uses the Toolkit outline.
- Added overflow arrows that scroll the header viewport without selecting/moving pages, automatic reveal on selection, wrapping Left/Right and Ctrl+Tab navigation, Home/End and Ctrl+T add requests. Very narrow hosts retain a clipped selected tab and keyboard access instead of overlapping arrows. Transient FirstVisibleTabIndex is not written to PropertyBag. Pointer tracking uses pointer-width-safe comctl32 subclass APIs with no retained control reference or timer.
- Adapter v9 mirrors both profiles, reserved feet, add-button position and overflow hit testing. Native viewport changes request header snapshots without structural edits or undo checkpoints. Existing designer page containers, names, locks, selection and insertion paths are retained. Updated canonical package/test/add-in projects and the full embedded package; existing control/project IDs and public-member order are preserved.
- Validation: 142 tests and 71 exact project mirrors pass; x86/x64 Direct2D arc/point ABI and DirectWrite ellipsis probes pass. Edge source-derived curve coordinates match the live verified Toolkit SVG with zero point mismatches in Light/Dark; preview checks cover 1200px/720px widths without console/page errors. Native IDE automation was attempted but could not launch twinBASIC: GetCursorPos returned Access denied (0x80070005). This is not a compiled control acceptance run. Evidence: docs/validation/2026-11-17-tabview-profiles.md.


### 2026-11-17 — Save Document and Form/Code availability (tbUI3IDE 1.3.0.15)

- Save Document now enables for a dirty, writable selected CodeEditor/UIDesigner and saves through the IDE's per-editor openEditors.save(node) route. It no longer invokes BETA 1044's deliberately disabled tbEditor_Save placeholder. Other dirty documents remain unsaved; native writers retain failure/dirty handling. Unsaved projects use native Save As, retaining the originally clicked document across tab changes and skipping it if closed before the callback.
- Form / Code now requires an existing counterpart in the native file tree, using the native handler identity and lookup order for .tbform, .tbcontrol, .tbppage and .tbreport. Standalone modules and unrelated editors disable the replacement button. The same predicate guards dispatch; native global command definitions and Classic toolbar handlers are untouched.
- Both corrections apply to Code/Form in Ribbon and Hybrid, full/simplified. 135 automated tests, 71 exact project mirrors and eight Edge document-command flows pass. Checks exercise actual installed native code/form writers, switch helpers and the generated add-in script; failed/successful writes and Save As targeting are covered. Native compiled-host disk/save/reopen confirmation remains pending. Evidence: docs/validation/2026-11-17-document-commands.md.


### 2026-11-17 — Flat ribbon in non-WinUI themes (tbUI3IDE 1.3.0.14)

The ribbon command card now has no drop shadow or bottom border in standard and third-party themes. Its existing raised treatment is enabled only for WinUI3 Dark and WinUI3 Light, with case-normalized theme names. This applies to Ribbon and Hybrid in both full and simplified presentation, independently of the additional-styling switch. Theme changes toggle a presentation class without replacing command/control nodes. Command behavior, group dividers, dimensions, corner radius and popup styling are retained.

Validation: 130 tests, 71 exact project mirrors and Edge renderer checks pass. Edge covers 32 theme/profile/presentation states, including live transitions through native Dark/Light/Classic, custom names and both WinUI themes, with no page/console errors. Native add-in build/reload acceptance remains pending. Package 65, adapter v8 and stable identities are unchanged.


### 2026-11-12 — Neutral Light chrome and Windows accent colors (tbUI3IDE 1.3.0.13)

- WinUI3 Light now uses neutral #F3F3F3 title/menu chrome and dark foregrounds. Optional styling corrects native hard-coded white caption text/PNG icons and also neutralizes an older installed Light theme. The generated Light.theme has the same neutral palette.
- Restricted the 8px window side/top insets to the exact WinUI3 Dark and WinUI3 Light themes with additional styling enabled. Other themes, including other names starting with WinUI3, receive no insets. Existing caption/Quick Access exemptions, real-titlebar top condition and no-bottom-inset behavior remain.
- Added live Windows accent integration for both WinUI3 themes while additional styling is enabled. The private UISettings bridge reads all seven system accent shades on the existing one-second options timer. WinUI resource mapping uses Light2/Dark1 for dark/light fill and Light3/Dark2 for links, including hover/pressed opacity, native UI accents and progress bars. Theme changes, styling Off and unload remove the owned override stylesheet; unavailable Windows colors fall back to the static theme.
- Validation: 129 tests and 71 project mirrors pass. Equivalent documented UISettings ABI probes succeeded in both 32-bit and 64-bit Windows processes. Edge checks cover neutral/old-installed Light chrome, readable caption controls, blue/purple palette refresh, both themes, styling Off and non-WinUI cleanup. Native twinBASIC compile/reload and live Windows-settings change acceptance remain pending. Evidence: docs/validation/2026-11-12-neutral-light-system-accent.md.


### 2026-11-12 — Profile parity, window insets and simplified-only refinements (tbUI3IDE 1.3.0.12)

- Added Switch Between Form and Code immediately after Save Document in the Code/Form Document group for Ribbon and Hybrid, reusing the native action and tooltip.
- Hybrid now supports full/simplified presentation and Ctrl+F1 while keeping its smaller tab/command inventory, native menus and no quick access or Backstage.
- Corrected 1.3.0.11's scope: only Simplified removes the additional Center in Container, Lock Controls, Preview, Grid, four secondary MultiPage and Insert file-command labels and uses the Grid options flyout. Full layouts restore labels and inline Grid options. The original ten alignment/size icon-only commands remain in both. The chevron stays inside both layouts and has a transparent background at rest, with hover fill and a visible glyph in both WinUI3 themes.
- Classic retains its native controls, order and handlers, using the same icon resolver as Ribbon. Toolbar/add-in buttons have glyphs and tooltips without visible labels; native selectors remain unchanged. Late contributions and teardown are handled reversibly.
- Additional styling enables 8px left/right main-window insets without a bottom inset. Custom-titlebar mode also adds 8px above Quick Access, preserving its existing 16px left padding and the caption-button rectangles. Real OS titlebar mode gets no top inset; the caption/Quick Access row is excluded from side insets.
- 126 automated tests and 71 exact project mirrors pass. Edge checks cover native BETA 1044 toolbar/header/Grid markup, both replacement profiles and presentations, 38 Classic buttons, theme states and inset geometry. Native compiled build/reload and restart acceptance remain pending. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md.


### 2026-11-12 — Compact Form/Grid refinements (tbUI3IDE 1.3.0.11)

- Moved the Ribbon chevron inside the existing card instead of reserving an external strip. Vertically centered the 32px simplified command row within its 48px area. Added 16px left padding to Quick Access.
- Made Center in Container, Lock Controls, Preview, Grid, Page Left/Right, TabView Refresh/Diagnostics, and Insert Folder/Other file/Import icon-only. Original help, accessible names, native actions and state remain intact; New Page/Delete Page retain captions.
- Grid now combines the native toggle and a separate options arrow. The arrow opens the original native controls in a flyout; edits and handlers survive closing, layout/tab changes and Classic restoration. Routine menu polling defers rebuilding during Grid edits.
- 119 tests, 71 project mirrors and Edge checks pass. The tested Form layout fits at 1920px, with an inset chevron, centered compact controls and no horizontal overflow. Native build/reload acceptance remains pending. Evidence: docs/validation/2026-11-12-grid-split-compact.md.

### 2026-11-12 — Full/Simplified Ribbon toggle (tbUI3IDE 1.3.0.10)

- Added a fixed bottom-right down chevron in Ribbon mode. Clicking switches to a 48px single-row Simplified Ribbon and an up chevron; clicking again restores the 100px full command area. Tabs, commands, native controls, state, tooltips and the selected tab are retained.
- Compact groups use 20px icons and single-line captions. Long rows remain accessible through horizontal scrolling, mouse wheel and keyboard focus; native input/select wheel behavior is preserved. This is a presentation toggle inside Ribbon mode, not a new toolbar mode. Hybrid/Classic retain their existing structures.
- Saved the preference independently as SimplifiedRibbon alongside ToolbarMode and optional styling. Ctrl+F1 switches full/simplified in Ribbon; Hybrid keeps its existing hide/show shortcut.
- 116 automated checks, 71 mirrors and Edge fixtures at 1280px/640px pass. Native build/reload and persistence/visual acceptance remain pending. Evidence: docs/validation/2026-11-12-simplified-ribbon.md.

### 2026-11-12 — Replacement quick-access logo (tbUI3IDE 1.3.0.9)

- Replaced the earlier logo with Shane's supplied twinBASIC_WinUI3_16px.png, preserving its exact PNG bytes under the existing bundled filename. Display it at its native 15×16px size. Existing theme/titlebar visibility rules are unchanged.
- Regenerated/repacked the add-in. 111 tests, 71 mirrors and Edge fixture checks pass; native rebuild/reload confirmation remains pending.

### 2026-11-12 — Requested icon set and document commands (tbUI3IDE 1.3.0.8)

- Applied Shane's explicit Segoe code points and Microsoft Fluent icon choices across Home, Insert, Code, Form, View, Project, Debug, Add-ins and File. Explicit selections override native backgrounds/codicons; unlisted commands retain their native presentation. Renamed Restart Compiler and Flush LLVM Cache.
- MultiPage uses New Page, Delete Page | Page Left, Page Right | TabView Refresh, TabView Diagnostics, preserving original help text. Page Right combines the requested tab icon and filled right-arrow badge; the original badge is erased before overlay. Added the File divider between Open and Save.
- Save Document is removed from Ribbon File and placed in a separate leading Document group on Code and Form in both Ribbon and Hybrid. Hybrid retains native menus and no quick-access toolbar, as requested.
- Imported 55 Fluent SVG assets from Microsoft's pinned @fluentui/svg-icons 1.1.341, with hashes/provenance and the existing MIT notice. The Knowledge repo's reference explicitly excludes the broad icon archive; the official Microsoft package supplies these assets. Windows Segoe fonts are used without redistribution.
- 111 automated checks, 71 exact project mirrors and Edge renderer-fixture checks pass. All 55 requested SVGs decode. Native build/acceptance remains pending. Evidence: docs/validation/2026-11-12-requested-icons.md.

### 2026-11-12 — Hybrid parity audit

- Verified the shared large-button sizing/font updates, Grid geometry, compact native alignment/size commands and inline contextual MultiPage behavior in Hybrid. Added a Hybrid-specific measured-width/font-change regression and expanded native alignment/size dispatch/state coverage to both layouts. All 105 tests pass without skips.
- No add-in code/version changes in this audit. Shane confirmed Hybrid should keep its current structure: native menus, no quick-access toolbar and no File Backstage. The logo and Backstage-specific Options consolidation remain Ribbon-only.

### 2026-11-12 — Quick-access logo theme-name fix (tbUI3IDE 1.3.0.7)

- Fixed the hidden logo in the real IDE: its getThemeName() returns lowercase names, while the initial comparison expected title case. Normalize the name before checking the two WinUI3 themes. The original titlebar/theme restrictions remain intact.
- 104 automated checks pass without skips, including the actual installed getThemeName() contract; 71 project mirrors match. Edge verifies the original embedded PNG loads visibly with the native lowercase name and follows theme/titlebar changes. Native rebuilt-host acceptance remains pending.

### 2026-11-12 — Inline MultiPage commands (tbUI3IDE 1.3.0.6)

- Replaced the Form tab's nested MultiPage launcher with an inline MultiPage section immediately to the right of Grid in both Ribbon and Hybrid layouts. Existing host/page/child selection detection, native commands, disabled state and tooltips are retained.
- 103 automated checks pass with no skips; all 71 project/source mirrors match. Edge fixture checks verify placement, contextual show/hide and command dispatch without leaving the Form ribbon. Native build/rendered acceptance remains pending; see docs/validation/2026-11-12-inline-multipage.md.

- 2026-11-12: Recorded Shane's standing instruction to commit and push every development pass to `origin/tbui3-dev` and verify success. Main/PR decisions remain Shane's.

### 2026-11-12 — Ribbon refinements (tbUI3IDE 1.3.0.5)

- Reconstructed the five requested changes: font-measured 50–86px large-button widths for up to two whole-word lines; Grid option spacing matching the divider inset; ten compact alignment/size commands with accessible names and native dispatch; one File > Options page containing IDE Options, language and shortcuts; the supplied original PNG before Save only for WinUI3 Light/Dark with the real OS titlebar disabled.
- PNG bytes are preserved and embedded in the generated add-in script, so no separate image installation is required. Only the add-in revision changes; package 65 and control/consumer identities remain unchanged.
- 103 JavaScript/DOM/CSSOM/native-protocol checks pass with no skips using the locally installed IDE files and jsdom 26.1.0. Browser-fixture interactions pass in Edge at 1280×720; native compiled build and visual acceptance remain pending. Detailed evidence: docs/validation/2026-11-12-ribbon-refinements.md.

### 2026-11-11, compact glyph canvases and theme reconciliation (tbUI3IDE 1.3.0.4)

- Corrected large-button horizontal alignment by replacing the inherited left-justified grid with a stretched single column. Large buttons now size to minimum content between 50px and 86px rather than starting from maximum content. Labels wrap at word boundaries with a bounded long-word fallback. Paste, Grid and all other large commands share this layout in Hybrid and Ribbon.
- The 100px command card now has 4px top padding and 89px section dividers. Each 76px large button budgets 32px glyph canvas, 4px caption gap, 28px two-line caption, 2px chevron gap, 8px chevron and 2px borders. Artwork is centered in the canvas; small command canvases are 16px. Group gaps remain compact.
- Combined the original Grid toggle and its live native options into one Grid group. Configuration joins Zoom as a visually hidden accessible selector caption. File's rail extends through the former quick-access row, while the title controls remain uncovered. File now pairs the general surface with the application foreground, correcting black text on Native Dark.
- Fixed missing theme-event coverage: BETA 1044's IDE Options save path calls changedIdeOptions without notifyChangedTheme. The shared options timer now reconciles the actual theme name. A page-side theme-property observer removes optional CSS immediately when leaving WinUI3, restores native panel titles and removes only previously recorded theme variables omitted by the next palette whose value/priority remain unchanged. Native palette values are retained.
- Verified the additional-styling toggle's actual emitted JavaScript still switches optional CSS off/on and restores saved Off independently of page management and toolbar mode. Reinitialization no longer overwrites a newer, unsaved page preference; stylesheet insertion sets its media before attaching it, preserving Off during theme reapplication. Both observers disconnect on unload.
- Added a subtle menu shadow in WinUI3 Light and Dark using the existing Fluent shadow4 composition. Native menus/submenus and replacement dropdowns share the token. This remains optional additional styling and disappears with that stylesheet; other themes retain their own palette.
- All 99 JavaScript/DOM/CSSOM/native-protocol checks pass without skips, all 71 project mirrors match, and all six current official-export files match. Runtime package 1.0.0.65, adapter v8, consumer project and stable IDs remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md.

### 2026-11-11, direct Form/Insert commands and editor-aware ribbon (tbUI3IDE 1.3.0.3)

- Form now expands the live native Align and Make Same Size descriptors directly into its groups. The four alignment and four size commands use their existing toolbar nodes/handlers/glyphs in classic order; additional native alignment options remain directly available. Context/disabled state and future child descriptors are retained.
- Insert now expands the actual asynchronous native Add component producer into Forms, Code, Resources, Files and fallback Components groups, with concise labels/full native tooltips. New dynamic options are retained. An isolated descriptor-capture bridge shadows only showContextMenu in the producer's own JavaScript realm, so asynchronous captures do not temporarily replace the IDE's global menu function or open an unrequested popup. Unsupported producer/private-closure changes retain the native parent as a compatibility fallback.
- Dropdowns use browser auto-popover light-dismiss plus window-capture pointer/mouse outside-click handling. Clicking empty ribbon surfaces now dismisses them too; browser close events, window blur and clicking the same dropdown button also clean up state. The original outside click is not consumed.
- All full-size buttons share the same fixed top glyph/caption/chevron grid, independent of caption length or dropdown role; the 76px height and existing size caps remain unchanged.
- File immediately hides quick access, restoring the same six buttons and focus on exit. The visible Zoom caption above its native selector is removed while retaining an accessible hidden label and the original selector/events.
- Native editor identity/type changes switch the ribbon to Code for CodeEditor or Form for UIDesigner. Stable editor state leaves a manual ribbon choice intact; File defers editor-following until exit. Both Hybrid and Ribbon use the same bounded native-state observation.
- Restored the classic Grid toggle on Form using its original native handler, checked state and canonical Show Grid checkbox state. The redundant checkbox row is hidden only inside the replacement grid fieldset when that toggle exists; Classic restoration retains the original node and value.
- All 93 JavaScript/DOM/CSSOM/protocol checks pass without skips, including nine new regressions and actual BETA 1044 native producers. All 71 project mirrors and six official-export files match. Native package 1.0.0.65, adapter v8, consumer project and identities remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-direct-commands.md.

### 2026-11-11, separate ribbon surfaces and correct dropdown layering (tbUI3IDE 1.3.0.2)

- Separated the title/menu-colored tab strip from the toolbar-colored command card. Only the command card carries the existing Fluent shadow/corners. Tabs stay transparent: selected tabs show an active-theme accent underline, and unselected hover shows a grey underline without a hover plate. Keyboard focus remains visible.
- Dropdowns now use the application flyout/general surface and matching toolbar foreground instead of the IDE's deliberately light native context-menu surface. Standard selects receive the active light/dark color-scheme. Menus use manual browser popover promotion when available, escaping native designer stacking/overflow. Older hosts retain a body-level maximum-z fallback. Escape, File opening/closing, command dispatch, mode changes and unload remove the owned popup and clear its expanded state.
- Corrected the grid number-field background conflict: BETA 1044 formDesigner.css hard-codes white !important for input.optionGridWidth/Height. One scoped background !important declaration now consumes a themed fill token; hover/focus vary that token. Original native nodes/classes/values/events are retained, and unrelated designer controls are untouched.
- Replaced the U+2304 text marker with a masked Fluent Chevron Down from the existing pinned Microsoft icon source. Full-size dropdowns center it below the caption in a 76px layout; compact/popup commands center it at the right. The combined map contains 37 SVGs: 19 established and 18 gap-fill.
- File Back is now an icon-only left arrow in a circular outline, with an accessible label/tooltip and existing Escape/back focus restoration.
- All 84 JavaScript/DOM/CSSOM/protocol checks pass without skips, including six new regressions for the reported surfaces, layering, native style conflict and glyphs. All 108 native top-level menu descriptors remain accounted for; all 71 packed mirrors and six official-export files match. Package 1.0.0.65, adapter v8, consumer project and stable identities remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-surfaces-popups.md.

### 2026-11-11, ribbon surface, command sizing, icons and File Help (tbUI3IDE 1.3.0.1)

- Reconnected the replacement ribbon to the old toolbar surface resource: the existing CardBackgroundFillColorDefault token when available, otherwise the selected theme's ToolbarBackground. Toolbar text uses the corresponding general/control foreground rather than the titlebar foreground; quick access retains the titlebar foreground, and popups use their native menu surface/foreground pair.
- Restored the established WinUI SubtleFillColorSecondary/Tertiary hover/pressed fills in essential CSS for light/dark, including when optional additional styling is off. These are the same pinned alpha effects as the existing stylesheet; they do not replace the selected theme's surface/foreground palette. Popup hover follows the native context-menu resource.
- Replaced the remaining first-command sizing rules with an explicit function-based presentation map, derived from Shane's Office Home/View/Developer/Page Layout screenshots. Related view controls, Project Settings/References, Bring Forward/Send Backward, formatting and other primary actions can all be full-size within one group. Clipboard Cut/Copy, indent/outdent, stepping and similar auxiliary commands stay stacked. Retained the 100px command area, 26px tabs and 50px standard / 86px maximum by 76px full-size limits; dropdown arrows do not add a vertical layout row.
- Filled missing command icons across ribbon groups, synthetic/lazy dropdowns, File navigation, contextual MultiPage and text-only add-in buttons. Existing 19 Fluent glyphs, native designer glyphs and contributed images remain intact. Added 17 MIT Fluent UI System Icons from pinned Microsoft source for gaps; future text-only commands receive a generic Fluent fallback without filtering the native action.
- Moved every native Help command into File > Help and intercepted the native Help menu opening to that section. No separate Help ribbon tab remains. Native command/callback dispatch and dynamically added Help entries remain available.
- The moved grid controls now inherit the toolbar foreground and themed number-input fill/border, with consistent three-row placement. Their original nodes, values and handlers restore intact in Classic.
- Validation: 78 JavaScript/DOM/CSSOM/protocol tests pass with no skips; all 108 shipped BETA 1044 top-level menu descriptors remain accounted for. All 71 project mirrors and six official-export files match. Native package 1.0.0.65, TabView adapter v8, consumer project and stable identities are unchanged. Detailed evidence: docs/validation/2026-11-11-ribbon-presentation.md.

### 2026-11-10, task-based Ribbon and vertical Backstage (tbUI3IDE 1.3.0.0)

- Replaced literal native-menu tabs/separator captions with semantic task groups: Home Clipboard/Editing; Insert Components; Code formatting/navigation/outlining/case; Form designer arrangement; View views/panels/zoom/window/appearance; Project build/compiler/folders; Debug and Help. Undo/Redo and Start/Break/Stop remain in quick access without duplicate ribbon entries. Paste/Find and other explicit roles determine large buttons instead of making each separator's first command large.
- Added compact native-action dropdowns for Fold/Unfold, Change case, Find options and More panels. Native command IDs, context alternatives, lazy submenus, enabled/checked state and original actions remain authoritative. New native commands and menus retain fallback destinations. Existing Fluent/native glyphs, theme-independent styling choice, geometry caps and elevation are preserved.
- Rebuilt File with a vertical navigation rail, project information and vertical tasks. Save, Save document, Options and Exit dispatch native actions; Open/recent, Export, Preferences and loaded Add-ins have task sections. Build/Clean move to Project. The designer/workspace and floating panels are hidden/inert only while File is open, then their prior visibility/accessibility state is restored before commands, on close, mode change and unload. Stable rendering retains focused rail controls across refreshes.
- Documented the command mapping and future-command fallback contract in tbIDE/RIBBON_LAYOUT.md. The existing BETA 1044 add-in enablement limitation is unchanged.
- All 72 JS/DOM/protocol checks pass with no skips, including coverage of all 108 shipped top-level native menu descriptors; all 71 mirrors and six official-export files match. Detailed evidence: docs/validation/2026-11-10-ide-toolbar.md. Runtime package 1.0.0.65, TabView adapter v8, stable project IDs and consumer project contents are unchanged.

### 2026-11-10, collapse the empty toolbar slot and restore compact presentation (tbUI3IDE 1.2.0.2)

- Shane's BETA 1044 screenshot shows a blank rounded strip under Hybrid, missing toolbar elevation and oversized/overlapping command captions. The native stylesheet gives dockElementContainer a 30px minimum height; hiding only the toolbar header/body leaves that slot visible. The adapter now hides the nearest dock/floating slot only when its sole sectionHeader is the TOOLBAR header. Shared panels stay visible; redocking releases the previous slot, and Classic/unload restores all owned visibility classes without changing saved dimensions or docking configuration.
- Restored the existing simplified-toolbar Fluent shadow4 (0 0 2px at .12 alpha plus 0 2px 4px at .14 alpha) and 8px card corners on the replacement ribbon. The selected IDE theme still supplies palette/state colors. These are the already established elevation values, not Office iconography or a new palette.
- Separated concise captions from native tooltip/help text. Known commands now use Save, Form / code, Restart compiler, Configuration and similar compact labels; the original help, ALT-key explanation and shortcuts remain in tooltips. Unknown/contributed commands are still discovered and routed normally. Stacked labels stay on one line with ellipsis; full-size labels retain two lines.
- Reduced group horizontal padding from 8px to 4px, command-column/group gaps to 2px, and selector caption width to 120px. Preserved the 100px command-area cap, 26px tab-strip cap, 50px standard / 86px maximum full-size widths, fixed 76px full-size height and all existing glyphs.
- All 66 JS/DOM/protocol checks pass, including four new regressions for dedicated-slot cleanup, shared-slot safety, redocking and caption/tooltip separation. The 71 configured project mirrors and current official add-in export match. The reported screenshot is the before-state evidence; the corrected native appearance remains the next observation. Package 1.0.0.65, adapter v8 and the saved consumer project are unchanged.

### 2026-11-10, compact ribbon sizing (tbUI3IDE 1.2.0.1)

- Applied Shane's requested geometry to Hybrid/Ribbon: command area capped at 100px, with a separate tab strip capped at 26px. Full-size commands use a 50px standard minimum width, expand for their label up to 86px, and remain exactly 76px high. The supplied Office screenshot confirms the separate command/tab areas.
- Centralized the dimensions in ribbon CSS variables and applied border-box sizing so padding and borders count toward those limits. Reduced stacked rows to 24px, retained 76px for the three-row span, tightened group captions and limited large labels to two lines with the original tooltip retained. Kept quick access, Backstage and submenu button sizing separate.
- Regenerated the embedded stylesheet/script and packed add-in as 1.2.0.1. Existing 62 JS/DOM/protocol checks, source/mirror checks and official-export comparison pass. Geometry was inspected statically; this entry does not claim a new rendered IDE observation. Package 1.0.0.65, adapter v8, glyphs and command behavior are unchanged.

### 2026-11-10, reconcile development and main documentation

- Reconciled accumulated tbui3-dev work with main while preserving the earlier MultiPage research, notes and probe projects. Kept both histories in the changelogs and marked superseded research questions as historical in the roadmaps. Package/add-in code and validation status are unchanged by this reconciliation.

### 2026-11-10, first selectable-toolbar implementation (tbUI3IDE 1.2.0.0)

- Renamed the canonical IDE add-in project, container root, output, metadata and active tooling to tbIDE/tbUI3IDE/tbUI3IDE.twinproj / tbUI3IDE.dll, preserving project ID {15AA6303-46EB-4D7C-B378-F0564F750D0C}, the legacy Enabled preference, package 1.0.0.65 and TabView adapter v8. Added independently persisted ToolbarMode, with Classic as the compatibility default.
- Added IDE Toolbar below the additional-styling switch for every IDE theme. Classic preserves native UI; Hybrid provides Home, Code, Form, nested contextual MultiPage and Add-ins; Ribbon discovers native menu headers/descriptors, presents their commands in groups, opens fullscreen File/Backstage and routes loaded-add-in information to File. Save/Undo/Redo/Play/Pause/Stop occupy the upper quick-access area. Third-party toolbar buttons remain in Add-ins.
- Reused all 19 established Fluent SVG glyphs, scaling lead commands to 28px and stacked commands to 18px. Existing native designer glyphs and third-party images are retained. Essential toolbar CSS uses active IDE theme variables and is independent of optional WinUI3 restyling. No Office icon assets were introduced.
- Retained native command/context authority and live build/zoom/grid controls. Added menu alternatives, checked/disabled state, lazy submenus, asynchronous Add-ins population, late contribution discovery, native menu shortcut interception, tab keyboard navigation, File Escape/focus return, Ctrl+F1 collapse and horizontal overflow. Mode changes/unload restore original nodes and the native docked toolbar header without editing the saved panel layout. Unsupported structure falls back to Classic while retaining the requested preference and reporting the reason.
- BETA 1044's native Add-Ins menu lists loaded add-ins, but its action calls notSupportedMenuOption and no enable/disable bridge is exposed. Backstage displays that limitation and disables those stub actions; enable/disable management remains open rather than inventing a toggle.
- All 62 JS/DOM/protocol checks pass against official BETA 1044 helpers (44 existing and 18 toolbar checks), including native menu builders and native command/context bindings. All 71 configured project mirrors match; the latest official impexp export matches the six add-in export files, with .meta checked separately. Browser visual checking was blocked by the browser URL policy; no rendered appearance or native IDE startup result is claimed. Detailed evidence and remaining acceptance work: docs/validation/2026-11-10-ide-toolbar.md.

### 2026-11-10, document three toolbar modes and active-theme behavior

- Revised the agreed IDE plan to an independently saved IDE Toolbar choice: Classic, Hybrid (the earlier tabbed-toolbar proposal) and full Office-style Ribbon. Recorded fullscreen File/Backstage, add-in enablement, contributed buttons, quick-access placement and automatic discovery of future native menus/options in tbIDE/ROADMAP.md.
- Recorded that toolbar UI follows any selected IDE theme, including standard/third-party themes, independently of additional styling. Updated both roadmaps, the IDE architecture and current handoff. Documentation only; the existing add-in/package versions, runtime, settings and project/output names are unchanged.

### 2026-11-10, document the next ribbon layout and project rename

- Recorded Shane's command-by-command Home, Code, Form, contextual nested MultiPage and Add-ins layout in tbIDE/ROADMAP.md, including an always-visible Home tab and third-party button routing.
- Documented the future tbUI3IDE project/output rename, identity/preference migration and scoped use of Fluent UI Web as the ribbon-pattern basis with WinUI 3 visuals. Updated handoff/architecture requirements. This is a documentation revision; runtime, project name and ribbon implementation are unchanged.


### 2026-11-10, consolidate IDE styling and TabView management into one add-in (1.1.0.0)

- Shane chose one distributed IDE add-in with independently optional theme styling. The existing WinUI3IdeStyle project now contains the theme implementation and TabView adapter v8. It exposes one add-in entry point, reports tbUI3 IDE as its display name and retains the WinUI3IdeStyle.dll output/project ID so existing styling installations and per-user preferences carry forward.
- Moved the readable adapter and embedded script into the unified project. A private TabViewDesignerController owns its existing toolbar commands, hidden page bridge, retry timer and disposal. The single add-in starts it independently of theme selection/settings and forwards project load. Theme changes and the saved styling switch affect only theme presentation; tab commands, page protection and toolbox hiding remain active.
- Preserved all 288 generated theme rules and both CSS inputs byte-for-byte. Preserved the WinUI3IdeStyle/Options/Enabled setting. Unload stops both feature timers, disposes tab behavior, removes theme CSS and disconnects the theme option observer/removes its row. Retired the standalone TabViewDesigner project, entry point and export tree; its README now directs users to the unified add-in. Existing installations must remove TabViewDesigner.dll from both architecture folders to prevent duplicate loaded components.
- Updated the script builder and validator for the single canonical project. The initial project bootstrap refuses to overwrite the established project. All 44 JS/contract checks pass against official BETA 1044 helpers, including the actual theme-switch script with styling on/off, saved disabled state, page insertion after theme removal and one entry point. All 70 project mirrors and 5 official add-in export contents match. These are source, packing and JS checks; the unified native load/unload outcome is a separate gate.
- Recorded the Microsoft Office-style tabbed ribbon as the next agreed pass, with TabView commands in their own group/tab rather than the general toolbar. No ribbon layout is implemented in this consolidation. Package 1.0.0.65 and the saved consumer project are unchanged.


### 2026-11-10, hide the page toolbox entry while the designer add-in is active (adapter v8)

- Shane requested hiding UI3TabPage from the toolbox because pages are created through their TabView. Adapter v8/add-in 1.0.0.7 hides only the exact tbUI3/UI3TabPage class's native toolbox button. It retains the registered class and native toolbox array for insertion, saved-form loading and Properties. UI3TabView and unrelated entries remain visible.
- Uses an add-in-owned display class, reapplied when the IDE rebuilds the toolbox. If the page drawing tool was selected, the adapter returns to the native pointer when editing is ready. Unload/error cleanup removes its hiding class. No public metadata, runtime code, page creation/ownership or package version changed.
- All 41 JS adapter/contract checks pass with official BETA 1044 helpers, including toolbox refresh/cleanup, pointer reset, unchanged registration and page creation. All 68 project mirrors match, and official add-in export matches all 3 files. The native toolbox result remains a separate observation.
- Shane reports package 65 appears to resolve delete/readd. His new native log provides direct confirmation of the guarded failure: 10:05:41 skips three stale entries with last failure stage=Name, error &H5B; 10:05:43 accepts replacement UI3TabView2_Page8 despite those same skipped entries. This confirms continued discovery past stale names, without claiming persistence/undo coverage. Refreshed the test form mirror from his latest saved project; its canonical binary is preserved.


### 2026-11-10, continue native discovery past invalid deleted entries (1.0.0.65)

- Shane's new adapter v7/native 64 log still shows delete/readd failure. At 09:25:13 UI3TabView2 has one survivor; subsequent discovery reports raw=5 then raw=7 but still unique=1, while newly created Page3/Page4 paint only at their default 480x200. The add-in creates replacements, but native discovery does not admit them for arrangement.
- Source inspection found one error boundary around the entire contained-control loop. A failure retrieving a deleted entry or reading its page properties ended enumeration and published a partial list. Collection now isolates each entry's retrieval, property probes, deduplication and sorted insertion; a failed entry is skipped and later entries are still visited. No geometry, ownership, public ID or selection contract was changed.
- Temporary native discovery diagnostics include skipped count and last failed index/stage/HRESULT. The old log does not expose an HRESULT or prove which property failed; the new instrumentation distinguishes those cases.
- Updated the canonical package and full embedded consumer package to 1.0.0.65, preserving Shane's latest saved form descriptors. Adapter v7/add-in 1.0.0.6 is unchanged. All 68 mirrors, embedded package equality, IDs/ownership/CRLF checks and official package/test exports match. All 40 existing JS adapter/contract checks pass against official BETA 1044 helpers; those checks do not execute the native collector. Native collection behavior is source-inspected; the next native outcome remains open.


### 2026-11-10, finish structural deletion and scope new page names to their host (adapter v7)

- Shane confirms adding child controls still works with page locking, then reports add-after-delete failure, replacement-page sizing/positioning problems after deletion, and deleted pages remaining in Properties. His BETA 1044 screenshot also shows form-global UI3TabPage numbering across multiple hosts.
- Corrected the missing native onSignificantChange notification after toolbar deletion, matching the IDE's own Delete command sequence. Removing the live control and requesting an undo checkpoint alone did not notify the project model that form structure changed. The new source-contract check failed before this change and passes after it.
- New generated names include the owning host, e.g. UI3TabView2_Page1, with host-local default captions. Allocation remains form-wide collision-safe and retains issued names across adapter refreshes during the same editing session. Existing pages/custom names and captions are not automatically renamed, preserving code references. Actual containment remains the ownership authority.
- Pending initialization can reacquire a uniquely allocated page under its original host after native DOM resync; initialization errors are reported instead of leaving an indefinite pending operation. Insertion bounds continue to come from the selected host. Added deletion/replacement checks across differently sized hosts, last-page deletion, allocation collisions and resync.
- Rechecked the adapter's private functions against the official BETA 1044 release; inspected dependencies/edit/deletion paths are unchanged from 1043. All 40 adapter/contract checks pass independently against each version's actual helper functions. The complete native IDE delete/readd outcome remains the next gate.
- Refreshed the stale frmMultiPage export from Shane's latest canonical test project in a separate synchronization commit. Package 1.0.0.64 and the current canonical test binary remain unchanged by the fix. Add-in version is 1.0.0.6 (adapter v7); its project/export and all 68 mirrors match.

### 2026-11-09, protect page geometry in the designer (adapter v6)

- Shane reports the duplicate-header correction appears to work, then identifies accidental movement of a UI3TabPage independently from its host. That is the new authoring issue; no broader editing-loop pass is implied.
- Adapter v6 (add-in 1.0.0.5) applies the IDE's native per-control lock to direct UI3TabPage children. Native mouse drag, keyboard movement and resize handlers honor that lock; the host and page contents are not automatically locked. New pages are protected immediately, and protection follows native rename/resync and is released when a page is removed or reparented.
- Tracks pre-existing locks and releases only session-owned locks on unload or timer-error cleanup. Uses the native silent lock/unlock path without adding geometry edits or undo checkpoints. Normal IDE Options serialization can save current locks; already saved locks count as pre-existing on the next session. Diagnostics include layoutLocked state.
- All 34 adapter/contract checks pass, including actual shipped drag/move/resize handlers, child/host editing, new-page protection, rename/node replacement, reparent/delete and cleanup. Add-in project/export match. Package 1.0.0.64 and the canonical test project are unchanged; actual native page selection/child editing remains the next gate for this new protection.

### 2026-11-09, unique native page discovery and toolbar help (1.0.0.64, adapter v5)

- Shane reports improved behavior with v4, but a newly drawn empty TabView appears to gain two pages after + and the second header is inaccessible. The enlarged screenshot shows two headers both captioned Page 2. That supports a repeated-page discovery hypothesis; it does not prove that two native page objects were created. The previously pushed logs predate this screenshot.
- Native page discovery now builds a temporary collection, rejects repeated object identities or nonempty control names and publishes the distinct list after enumeration. Header drawing, PageCount, sizing and keyboard navigation share that list. Caption is never used for identity, so different pages may display identical captions. Existing public IDs and saved form data are preserved.
- Added temporary native discovery traces with raw/unique counts, duplicate count and accepted page names/object addresses. Adapter v5 diagnostics report actual designer page counts/names plus native PageCount when included by the IDE. These distinguish a phantom painted header from two real controls on the next native capture.
- Added explanatory hover titles to the six existing add-in toolbar buttons, including deletion of page contents and the diagnostic log location. Original titles are restored when the adapter unloads. Empty hosts still start with zero pages; + creates the first page on demand.
- Package is 1.0.0.64; separate add-in is 1.0.0.4 (adapter v5). All 30 adapter/contract checks pass, including an empty-host + gesture, identical captions on distinct pages, page-count diagnostics and toolbar help. These JS checks do not execute native ContainedControls enumeration. All 68 project mirrors, embedded package/version, stable identities, ownership and CRLF checks pass; all three official exports match their mirrors. The observed duplicate-header outcome remains the next native gate.

### 2026-11-09, live designer header refresh and page activation (adapter v4)

- Shane reports 1.0.0.63 renders without the purple tabs in the working session and + creates a page, but the new page cannot be selected. Reference unload/reload sometimes triggers the earlier deserialization failure and sometimes succeeds with identical code; that remains a separate intermittent loading issue.
- The pushed log confirms adapter v3 and native 1.0.0.63, accepted consumer Form/IDs, consumed fixture marker, native General/Details/Finish captions/order and successful draw results for newly created UI3TabPage1. Captured diagnostics contain the original three pages, so they do not establish the failed new page's complete DOM state. One host Paint exception (&H80020009 at 16:48:01) remains unexplained.
- Corrected a source-confirmed protocol defect: BETA 1043 getImageFromServer returns immediately in full-form mode. Adapter v4 queues the parent TabView ID via queueMultipleSnapshot inside the native edit batch after child initialization, ordering, selection and deletion. Its refresh command also uses that protocol. New-page activation now follows compiler-assigned ID acknowledgement and caption/order setup, then refreshes the parent headers in that batch.
- Diagnostics now read full-form PNG data from backgroundImage when imageData is absent, validating the PNG header before reporting dimensions. No image data is logged. The standalone add-in is version 1.0.0.3; package 1.0.0.63 is unchanged.
- Added three protocol checks using actual shipped live batch/changeProperty/snapshot functions with delayed property acknowledgement, plus one bitmap-state check. The previous code failed the missing-parent-snapshot and premature-activation checks; all 26 checks now pass. Re-exported Shane's latest test project into its stale form mirrors without changing the canonical test binary.

### 2026-11-09, 1.0.0.63 control-loading failure recorded

- Shane's BETA 1043 win32 report contains TB5079 for the existing frmMain buttons and frmMultiPage controls, with secondary TB5125 Len errors. The screenshot confirms the embedded tbUI3 1.0.0.63 reference is enabled and shows "failed to deserialize JSON [1]" for UI3TabView1. Stable loading/compilation is not established.
- Rechecked the current branch's packed package/test blobs against the delivered revision, public identities, package reference and form/control JSON syntax. No missing reference or JSON syntax defect was identified. This does not establish native deserializer acceptance.
- Recorded the diagnostic dependency: fresh-session result and diagnostics from the canonical package project are needed to distinguish stale compiler state from a package/control initialization failure. No code correction or root cause is claimed for this report.

### 2026-11-09, designer paint lifecycle correction and diagnostics (1.0.0.63)

- Shane's BETA 1043 win32 screenshots show a dark header initially, then a purple strip and missing labels after interaction. Default Page/Button captions remain visible; one-time fixture initialization is not yet established by live evidence.
- Separated page discovery from arrangement. Paint and public property getters no longer move pages, assign ScaleMode or change page BackColor. ScaleMode synchronization skips identical assignments. Paint caches its DC once, tracks the active draw scope and records errors before discarding a failed target.
- Inspected the shipped UserControl snapshot path: it temporarily resizes the native HWND, sends WM_PRINTCLIENT and restores the old rectangle. This makes layout/property mutation during Paint unsafe; it does not alone prove the screenshot's final cause.
- Added temporary native paint-state logs and adapter v3's read-only TabView diagnostics toolbar command. Logs contain native dimensions/DPI/pixel samples/EndDraw status and adapter IDs, ownership, initialization marker, pending work, computed canvas state and bitmap dimensions/checksums. No raw bitmap or textbox content is logged.
- Twenty-two adapter/contract checks pass. All 68 packed-project mirrors, embedded package equality, identities and CRLF checks pass. The purple-strip symptom remains an open IDE gate; no corrected live outcome is claimed.

### 2026-11-09, readable designer and native property initialization (1.0.0.62)

- Shane's BETA 1043 win32 screenshot shows the designer controls and add-in toolbar present, but dark-theme text on a light ambient surface and custom captions at their Page/Button defaults. The older selection-rejection lines in that screenshot do not establish a current selection failure.
- TabView now draws its header over a matching WinUI solid base surface rather than clearing it to the form's unrelated ambient color. UI3FormTheme applies its managed form background in design mode without installing runtime subclasses. The multipage fixture now includes that helper.
- The add-in now applies a new page's Caption and PageOrder through native setters after a compiler-assigned ID exists, before the final undo checkpoint. This fixes reliance on initial JSON values becoming UserControl PropertyBag state. The explicitly marked fixture initializes native captions/order once, clears its form-level marker, and preserves subsequent edits. Ordinary user forms are not initialized by this fixture path.
- The harness sets its intended labels/order/selection explicitly at runtime as well; its launcher receives its intended caption. Selection-rejection diagnostics include the current selected control name and class.
- Expanded adapter coverage to 20 passing checks, including compiler-default replacement after acknowledgement, one-time fixture setup and exclusion of other forms. Packed projects, full embedded package and 66 mirrors are synchronized; real IDE results for these changes remain a separate gate.

### 2026-11-09, integrated MultiPage candidate (1.0.0.61)

- Added native UI3TabView and UI3TabPage ControlContainer controls with new recorded stable IDs, saved captions/order/selection, automatic sizing, per-window DPI conversion, actual page ownership, runtime visibility switching, and basic mouse/keyboard selection. No negative-position parking or Tag-based membership.
- Added the separate TabViewDesigner add-in, derived from the existing Sample 11-based probe; WinUI3IdeStyle is unchanged. The embedded adapter inserts direct host children through the native paste path, switches designer pages, reveals Properties-selected children, deletes page subtrees, reorders pages and requests undo checkpoints. Pending compiler work blocks edits; unload or timer failure restores ordinary visibility.
- Inspected official BETA 1043 designer and VB/tbIDE sources. Added indexed ContainedControls discovery with raw-object/extender handling, explicit paste-parent targeting, zero paste displacement and protection against replaying old verb requests after refresh.
- Added frmMultiPage and its entry button to the existing tbUI3Test icon harness. Refreshed the full embedded package, including the existing IconList L3 code, from the canonical package.
- Added regression and optional native paste-contract checks, source/fidelity documentation, and synchronized packed projects/mirrors. Exact evidence is in docs/validation/2026-11-09-tabview-candidate.md. The full IDE editing loop remains a gate, not a claimed result.
- Recovery note: the earlier chat reported a 1.0.0.61 candidate but left no recoverable implementation commit. This pass establishes the actual candidate and does not inherit that chat's unverified test claims.
### 2026-11-01, MultiPage-style containers in the designer: investigation (research, no package change, Claude)

- Record: `docs/research/2026-11-01-multipage-designer.md`, with the working notes, the twinBASIC feature request draft and the throwaway probe projects under `docs/research/2026-11-01-multipage-designer/`.
- Validated by Shane on BETA 1033 with the TabProbe test projects:
  - A second click on a selected ControlContainer UserControl reaches its MouseDown and Click at design time (`UserMode = False`).
  - The designer follows when the control moves its ContainedControls.
  - A container whose ScaleMode differs from the form's (pixels on a twips form) makes newly drawn children jump to its top-left. With matching twips they stay put.
- Failed: `UserControl.Parent.Controls.Add` at design time. A CommandButton is created and draws, but the designer can't select it, doesn't list it and doesn't save it. A project UserControl fails with -2147467259. Wayne (Discord) confirmed there's currently no supported way to create a designer control from code, and pointed out that `UserControl.Verbs` and `VerbInvoked` exist (confirmed in the VB package).
- Validated by Shane with the DesignerBridgeProbe add-in: an add-in can run JavaScript in the IDE page (`ownerDocument.defaultView.eval`, synchronous). Through the designer's own insert steps, with no clipboard, it created a real page control inside a selected container: named, selectable, draggable, undone with one Ctrl+Z (once `undoPoint` was added), and still there after save and reopen.
- Decisions (Shane): shipped containers must feel like VBA's MultiPage and never use SSTab-style negative Left. The model is a host plus real page containers (UI3TabView with UI3TabPage). Public posts don't mention tbUI3. Still open: whether the add-in is required, what triggers "New Page", and the per-beta breakage policy.

### 2026-11-01, UI3IconList L3: the list in code (1.0.0.60, Claude)

- New public control `UI3IconList` (stable IDs in `tbUI3/UI3IconList-ids.json`): a nonvisual box like UI3FormTheme (`InvisibleAtRuntime`), with its own toolbox bitmap. Members: `Add(Key, Data, Source)` for SVG or image bytes, `AddIcon(Key, Icon)` for a Segoe Fluent glyph, `Remove(Key)` (no error for a missing key), `Clear`, `Count`, `Exists(Key)`, `Key(Index)` (1-based, as in VB6's ImageList), `IconData(Key)`, `IconSource(Key)`, and two additions to the plan's table: `Icon(Key)`, so a glyph entry can be copied out too, and a hidden read-only `Revision` that changes on every edit. Keys are case-insensitive, not empty (error 5), and adding an existing key replaces it; data that isn't a recognised image raises 380. Entries are saved with the form (`Count`, then `Key<n>`, `Kind<n>`, and `Glyph<n>` or `Data<n>`/`Source<n>`).
- UI3Button gets `IconKey` and `IconList`. `IconList` is a Variant: a list name typed in the pane, or `Set x.IconList = list` in code (not saved); empty means the form's only list. Setting `IconKey` clears `Icon`, `IconGlyph` and a stored image; setting any of those clears `IconKey`. A missing list or key draws no icon, with no error. The button finds its list on each paint (`Parent.Controls(name)`, or `For Each` over `Parent.Controls` for the only-list default) and fetches the entry again only when the list's `Revision` or the key changes. Controls showing a list icon register their window in a new module, `UI3IconListRegistry`, which repaints them when any list changes. Each new lookup outcome is written once to the property page log (`BUTTON <name> <run|design> IconList: ...`).
- Written in the cloud and not yet built. Not yet known: whether the Properties pane shows and edits a Variant property (`IconList`), whether `For Each` over `Parent.Controls` and `TypeOf ... Is UI3IconList` work in twinBASIC, and the page-less test can't exercise saving list entries (that waits for L4's page).
- tbUI3Test: frmMain's `TestIconList` finds `UI3IconList1` late bound (so the form compiles without one), fills it with a glyph, mono.svg and sample.png, points buttons 1 and 3 at it, and clicking button 3 removes its entry. The stale `tbUI3Test/src` export was refreshed from Shane's saved project.

### 2026-11-01, UI3IconList L2 spike result; spike removed (1.0.0.59, Claude)

- Shane's 1.0.0.58 log (`tbUI3Test/tbUI3-propertypage.log`, 2774b89), with `UI3Button2.SpikeFind = "UI3FormTheme1"`: `UserControl.Parent.Controls(name)` returned the sibling as `UI3FormTheme` at every moment tested: the Let, ReadProperties on reopening the form, the first Paint, and at run time both ReadProperties and the first Paint. Its own member read worked late bound (`ThemeMode`) and held typed (`Dim theme As UI3FormTheme: Set theme = found`). `UserControl.ParentControls` fails in twinBASIC (0 items, -2147467262 No such interface supported), so tbUI3 must not use it. Caveat: the buttons' ReadProperties ran in reverse file order (UI3Button4 first), and UI3FormTheme1 is last in the form file, so it probably loaded before UI3Button2. The ReadProperties success does not prove that a sibling loaded later is visible yet, so L3 looks the list up when it is first needed (paint), and never caches a failed lookup. Not tested: `For Each` over `Parent.Controls` (needed for "the form's only list"), and a dropdown of names in the Properties pane (left for later, as planned).
- 1.0.0.59 removes `SpikeFind` from UI3Button (reverting it to 1.0.0.57's source). tbUI3Test's saved frmMain still holds a `SpikeFind` value on UI3Button2; it is ignored on load and dropped at the next save. Not yet built; no behaviour change intended.

### 2026-11-01, UI3IconList L1 done; L2 spike (1.0.0.58, Claude)

- Shane, 1.0.0.57: the grid opens correctly, scrolls smoothly, and picking and Apply work. L1 is done.
- L2 spike in 1.0.0.58, not yet built. Instead of a throwaway control, UI3Button gets a temporary `SpikeFind` property (saved with the form). Set to another control's name, it logs (`SPIKE` lines) at the Let, at ReadProperties and at the first Paint, at design time and at run time: (1) `UserControl.Parent.Controls(name)`, (2) walking `UserControl.ParentControls` by Name, (3) reading the found control's own member late bound (ThemeMode or Caption), and (4) holding it as its tbUI3 class (`Dim theme As UI3FormTheme: Set theme = found`). ReadProperties runs before the form's other controls may exist, so its result shows whether a lookup there is safe. The property-pane dropdown of names is not part of this spike; typed names come first, as the plan proposes.

### 2026-11-01, grid grey on open fixed (1.0.0.57, Claude)

- Shane, 1.0.0.56: the grid opens with the right colours. The log (`tbUI3Test/tbUI3-propertypage.log`, d407b4e) confirms it: after the `#32770` and `ThunderPropertyPageDC` erases turn the area 240,240,240, `SEARCH REPAINT 1` restores the search box and `GRID REPAINT 1` repaints the grid straight after, all six ticks paint with hr 0, and no errors appear. Later paints (switching to the Segoe tab, scrolling) are ordinary surface paints with no erase.
- 1.0.0.57 removes the 1.0.0.55 grid paint diagnostic (`GridLog`). The rest of the property page log, including `GRID REPAINT n`, stays on until the property page work is done. Not yet built; no behaviour change intended.

### 2026-11-01, grid grey on open: cause found (1.0.0.56, Claude)

- Shane's 1.0.0.55 log (`tbUI3Test/tbUI3-propertypage.log`, pushed in 735c22f; App.Path in the designer is the host project's folder, so the log copy lands beside tbUI3Test.twinproj): the grid paints successfully twice on open (hr 0, Fluent tab, 199 icons), the second time after 1.0.0.54's invalidate. Straight after, the page's inner `#32770` container erases (search box pixel 51,31,31 to 240,240,240), then the `ThunderPropertyPageDC` erases. Neither has WS_CLIPCHILDREN, so both paint classic grey over the grid. The search box survives because its repaint timer (1.0.0.36) repaints it after those erases; nothing repainted the grid any more, since 1.0.0.53 stopped it repainting through its own erase.
- 1.0.0.56: the page registers its grid with UI3Window (`UI3SetIconPageGrid`), and each search-box repaint tick also redraws the grid without an erase (`GRID REPAINT n` in the log). 1.0.0.54's one-off invalidate is removed. The grid paint log stays for this check. Not yet built.

### 2026-11-01, grid still grey on open: paint log (1.0.0.55 diagnostic, Claude)

- Shane, 1.0.0.54: the grid still opens classic grey (light #F0F0F0, no icons, on the Fluent tab in dark mode) until the page is touched, so the container-erase guess was wrong or incomplete.
- 1.0.0.55 logs (`GRID` lines in `%TEMP%\tbUI3-propertypage.log`) the first 40 grid events after the page opens: subclass attach, swallowed WM_ERASEBKGND, each surface paint and its result, the PictureBox Paint event if it still fires, PaintGrid errors, the tab controls being shown, and the end of SelectionChanged, each with the grid's hwnd, visibility, client size, tab and whether a render target exists. No behaviour change.
- Shane asked for the log beside the project: `ProbeLog` now also appends to `App.Path\tbUI3-propertypage.log` (in the designer this is expected to be the host project's folder; unverified, so the SelectionChanged line logs App.Path).

### 2026-11-01, grid opens grey (1.0.0.54, Claude)

- Shane, 1.0.0.53: scrolling is now smooth, but the grid opens classic grey until anything on the page is touched.
- Likely cause (inferred, not logged): the same first erase by the page's inner #32770 container that left the search box grey until 1.0.0.38. The grid used to repaint itself through `picGrid.Refresh` with an erase; since 1.0.0.53 nothing repaints it after that container erase.
- 1.0.0.54: on the chrome's first surface paint, the page invalidates the grid once (`m_GridRepainted`), next to the existing search-box repaint. Not yet built.

### 2026-11-01, L1 result and grid flicker fix (1.0.0.53, Claude)

- Shane built 1.0.0.52: the picker looks right and works. The only complaint: scrolling the icon grids flickers (possibly before 1.0.0.52 too; Shane hadn't noticed).
- Cause (from the code, not measured): every grid repaint went through `picGrid.Refresh`, which erases the PictureBox to its BackColor before the Direct2D paint, the same flash the chrome had in 1.0.0.30 to 1.0.0.32. The wheel also repainted twice (the scrollbar's Change event, then an explicit Refresh). 1.0.0.52 likely made it more visible, because each newly shown icon now builds a `UI3IconImage`, which scanned its bytes with a `Mid$` per byte compared.
- 1.0.0.53: `UI3PageSurface` subclasses picGrid as it does picChrome (WM_ERASEBKGND swallowed, WM_PAINT painted with the BeginPaint DC through `PaintGridSurface`), only when the page hooks are on. Grid repaints go through `RepaintGrid` (invalidate without erase, then update). The wheel and thumb drag repaint once, through the scrollbar's Change event. `UI3IconImage`'s byte search precomputes the pattern. Not yet built.

### 2026-10-20, UI3IconList L1: the picker draws with UI3IconImage (1.0.0.52, Claude)

- Shane approved `docs/2026-10-20-ui3iconlist-plan.md`. L1 is in 1.0.0.52, not yet built.
- UI3IconPage's library grid, style cards and Gallery preview now draw through `UI3IconImage`, one per library entry and per render target (grid and chrome), capped at 800 per target as before. The page's own SVG and bitmap caches, `RecolorSvg`, `SvgHex`, `LibrarySvg` and `GalleryBitmap` are gone. Gallery images are still never enlarged; their pixel size is still read from the PNG header for the details card.
- One deliberate difference: the picker used to recolour by style (every style but Color). It now uses UI3IconImage's rule, recolouring any SVG containing #212121 or currentColor, which is what the button already does. If a Color-style SVG contains #212121, the picker now shows it as the button would.
- UI3IconImage reads an SVG's size from its root start tag only, instead of building a string from its first 2 KB, so the grid can create hundreds quickly.

### 2026-10-20, pass 5 closed (Claude)

- Shane chose UI3IconList as the next work. Draft plan written: `docs/2026-10-20-ui3iconlist-plan.md` (awaiting approval).
- Shane's win64 built EXE (before the IconFolder fix) drew the three designer-picked icons (Fluent color, Fluent regular, Additional Icons) after the test-code error. `%LOCALAPPDATA%\tbUI3` was renamed (to `tbUI3-bak`) for that run, as it was for the win32 check (1.0.0.45). Shane agreed pass 5 is done: designer picks are compiled into the form, so a built app needs no icon folder. The tbUI3Test IconFolder fix (6cd52b8) is not yet rebuilt.

### 2026-10-20, built tbUI3Test EXE error 80004005 at startup (Claude)

- Shane's win64 EXE check: the built tbUI3Test showed "Run-time error -2147467259 Unspecified error" at startup, then ran (win32 too). No error when run from the IDE in either.
- A step-logging Form_Load (Shane pasted it, then pushed tbUI3Test) showed it stops at button 2's icon load, with App.Path = `...\tbUI3Test\Build`. Button 2 holds a Segoe icon, so Form_Load loads `color.svg` from `IconFolder`. From Build, `IconFolder` missed `test-icons` (one folder up) and fell back to a hard-coded `E:\` path that isn't Shane's current checkout. Likely cause: a test-code bug loading a missing file; not yet confirmed by a rebuild.
- tbUI3Test: `IconFolder` now looks in `App.Path\test-icons` and `App.Path\..\test-icons`, with no hard-coded path, and Form_Load says so if neither exists. The step-logging handler stays, since a built EXE gives no line number. `tbUI3Test/src` regenerated from Shane's push.

### 2026-10-20, repro result: win64 Apply works in twinBASIC; likely cause found (1.0.0.51, Claude)

- Shane ran the repro in win64: the page set Value to 43 and it stuck. twinBASIC's win64 property page Apply works, so the tbUI3 failure is ours, not a twinBASIC bug. Nothing goes to Wayne.
- The repro also showed (error 9, call stack `Class_Terminate` → `SetObjects` → `SelectionChanged`) that twinBASIC's PropertyPage raises SelectionChanged with an empty selection while the page is torn down, on OK, Cancel or Apply-then-close alike. UI3IconPage's SelectionChanged ignored the count and went on to lay out, re-theme and refill the page, touching windows that are being destroyed. That fits every win64 symptom: it runs on Cancel too, and the "SelectionChanged after Apply" in the 1.0.0.46 log is likely this one. The working theory is that this crashes the 64-bit designer host, and x86 survives it.
- Agreed with Shane: win32 testing for each build, plus an x64 review and a short win64 smoke test at the end of each pass (see HANDOFF's working agreements).
- 1.0.0.51: SelectionChanged logs the selected-control count and returns at once when it is 0. Shane built 1.0.0.51 and reported win64 Apply "works" (2026-10-20), so the empty teardown SelectionChanged was the cause. Fluent and Additional Icons picks also apply in win64 (Shane, 2026-10-20).

### 2026-10-20, win64 property page repro project (Claude)

- `tbUI3-Repro/NewProject.twinproj` (Shane's new Standard EXE) is a twinBASIC-only repro for the win64 Apply failure. It has no tbUI3 code: ReproControl has one Long property, `Value`, linked to ReproPage, a page with one TextBox that sets it. Its code had been pasted outside the class blocks; it now sits inside them, and `tbUI3-Repro/src` is its export. Test: drop a ReproControl on Form1, set Value to 42 from the page, reopen, in win32 then win64. Not yet run.
- The first run in win32 hit Automation error 80004005 in `LiveSite.OnStatusChange`. The page's `Text1_Change` set `Me.Changed` while `SelectionChanged` was filling the box, which twinBASIC rejects. ReproPage now ignores `Text1_Change` while loading (`m_Loading`). The second run hit error 9 (Subscript out of range) in `SelectionChanged` called from the page's `Class_Terminate`: twinBASIC fires SelectionChanged with an empty selection when the page closes. ReproPage now exits when `SelectedControls.Count = 0`. The win32 and win64 runs are still to be done.

### 2026-10-20, BETA 999 result and a correction (1.0.0.50, Claude)

- Shane: the same win64 failure happens in BETA 999. It is not a recent twinBASIC regression.
- Correction: earlier entries today said Segoe Apply "passed in win64 on 2026-10-14 (1.0.0.24, BETA 999)". The record doesn't support that. The 1.0.0.24 entry says only that "the dialog checks pass in win64", and Shane doesn't recall testing Apply in win64 since the project's early days. As far as anyone knows, applying a value from a property page has never been shown to work in win64.
- 1.0.0.50 turns `WIN64_PAGE_HOOKS` back on, since 1.0.0.49 showed the hooks aren't the cause. The page logging stays.

### 2026-10-20, win64 hooks-off result

- Shane, 1.0.0.49 in win64: still resyncs with every page window hook off. tbUI3's dialog skin, search-box hooks and chrome subclass are cleared as the cause. The win64 designer process dying after the property dialog closes looks like twinBASIC's (BETA 1012). Shane is checking an older BETA next. `WIN64_PAGE_HOOKS` goes back to True once this is settled.

### 2026-10-20, win64: the designer process dies when the property dialog closes (1.0.0.49 diagnostic, Claude)

- Shane, 1.0.0.48 in win64:
  - The Apply ran cleanly: Let Icon, PropertyChanged and Refresh all completed, with no error 438 this time.
  - The button on the form didn't change, even with the dialog still open after Apply.
  - Unlike win32, the IDE never asked the button to save. The next log lines come from a new designer process.
- Shane also found that pressing Cancel, OK or Apply makes no difference: the RESYNC always appears the next time the property page is opened. So in win64 the designer host process dies when (or after) the property dialog closes, and the IDE only notices on the next open. Whatever the page applied is lost with it, including the bridge's pending values.
- 1.0.0.49 adds `WIN64_PAGE_HOOKS` in UI3IconPage, set False for this test. In win64 it leaves the dialog unskinned and installs none of the page's window hooks: the PropertySheet skin, the search-box colour hooks and timers, and the chrome surface subclass. The page looks classic there, and win32 is unchanged. If win64 then applies and saves, one of those hooks crashes the 64-bit host and gets bisected next. If it still fails, it is a twinBASIC win64 designer bug to report to Wayne.

### 2026-10-20, win64 trace 2 result and trace 3 (1.0.0.48 diagnostic, Claude)

- Shane, 1.0.0.47 in win64: Apply reaches the button. `Let Icon` runs on the live button with the new value ("from page"), then the page's `CallByName ... Icon` returns error 438 ("Object doesn't support this property or method"). The next log lines come from a new process id each time (45004, then 50968, then 41168): the win64 designer host process is replaced after the error, which is the RESYNC, so the pending icon recorded in the old process is lost and the buttons reload from the saved form.
- In win32 the same Apply raises no error (1.0.0.45 and later), and the 1.0.0.44 win32 error 438 on LoadIcon did not stop the apply there.
- So the failure starts inside or right after the button's Let Icon in win64: at `PropertyChanged "Icon"`, at `UserControl.Refresh`, or in the extender after the Let returns. 1.0.0.48 logs after each of those two calls and the type of object the page is setting. If the error is in PropertyChanged or after the Let, it is likely a twinBASIC win64 designer bug to report to Wayne, with a small repro.

### 2026-10-20, win64 trace 1 result and trace 2 (1.0.0.47 diagnostic, Claude)

- Shane, 1.0.0.46: in win64 even a Segoe icon doesn't apply; win32 still works (checked by switching the IDE back and forth). The log:
  - win32: after Apply the live button saves the new Icon (WriteProperties, 59446) and nothing is rebuilt.
  - win64: after Apply the page gets SelectionChanged, then every button is rebuilt from the saved form (the RESYNC) with its old Icon. No live save with the new value happens first, and no pending icon is taken. So the value never reaches the button, or the IDE throws away its state before saving.
  - Segoe icons applied in win64 passed on 2026-10-14 (1.0.0.24, BETA 999). What changed since includes BETA 1008-1012 and opening the page from Icon's own "...".
- 1.0.0.47 logs ApplyChanges (start, end, and any error setting Icon, which is now caught and logged) and the button's Let Icon, and stamps page and button lines with time, process id and x86/x64, to see whether the page and the controls run in the same process in win64.

### 2026-10-20, win64: library Apply doesn't stick (1.0.0.46 diagnostic, Claude)

- Shane, BETA 1012 win64: applying a library icon makes the IDE flicker and show RESYNC, and the button keeps its old icon. The log shows the page's Apply and the button's LoadIcon both complete and record the pending icon, but after the designer rebuild the page still reads the old Icon and an empty IconSource. In win32 the rebuilt control had the new icon. So the rebuilt control in win64 doesn't end up with the image: either its ReadProperties doesn't take the pending icon, or writing the image to the form fails and the IDE resyncs to the saved copy.
- 1.0.0.46 logs, at design time, every UI3Button ReadProperties and WriteProperties (Icon, IconSource, byte count), each pending icon taken, and any error writing the image to the PropertyBag (now caught and logged instead of raised). No other change.

### 2026-10-20, pass 5d result (1.0.0.45)

- Shane built tbUI3Test to an EXE and ran it with `%LOCALAPPDATA%\tbUI3` renamed: every icon picked in the designer still draws, so a built app needs no icon library. Win32; win64 not yet reported.
- The 1.0.0.45 log shows every library Apply running LoadIcon to the end (`BUTTON LoadIcon done`) with no error. The error 438 seen in 1.0.0.44 did not recur; its cause is unknown (possibly a stale embedded package at the time). The log keeps the step lines in case it returns.
- Closest-size choice checked: at IconSize 48 a Fluent Color pick stored `ic_fluent_alert_48_color`, and at 20 `ic_fluent_alert_20_color`. A Light pick stored `_32_light` (Light icons don't come in 20).

### 2026-10-20, pass 5c result and a LoadIcon diagnostic (1.0.0.45, Claude)

- Shane's 1.0.0.44 test (BETA 1012): "It all appears to work correctly." Fluent and Additional Icons picks apply, survive the designer rebuild, and the page reopens on the current pick (the log shows `IconSource = ic_fluent_accessibility_checkmark_20_filled, tab 1`). The Properties pane fixes were part of the test steps.
- The log also shows `PAGE LoadIcon failed: Object doesn't support this property or method` after every library Apply, although the icon is applied. The picker's `CallByName ... LoadIcon` raises error 438 somewhere after the call reaches the button. 1.0.0.45 logs each step inside UI3Button's LoadIcon while the page applies, and the error's number and source, to find where. No behaviour change.
- The log has no Apply at an IconSize other than 20, so picking the file size closest to IconSize is still unchecked.

### 2026-10-19, pass 5c: Apply from the library tabs (1.0.0.44, Claude)

- The icon picker's Fluent UI System and Additional Icons tabs now apply. Clicking an icon on any tab enables Apply, and Apply writes the tab clicked last.
  - A Fluent pick stores the file whose size is closest to each control's IconSize (a tie goes to the larger file). Its IconSource is Microsoft's file name, such as `ic_fluent_arrow_down_20_regular`.
  - An Additional Icons pick stores the PNG as `gallery_<name>`.
  - Switching the style card of the picked Fluent icon also enables Apply.
- The picker writes through the control's `LoadIcon`, which now takes a Variant holding a Byte array (as `LoadResData` returns), so `CallByName` can pass the bytes.
- Designer bridge: new `SetPendingLibraryIcon`, `TakePendingLibraryIcon` and `ClearPendingLibraryIcon` in UI3Icons, a second slot beside the existing members, which are unchanged. UI3Button records a library pick while the page applies and takes it back in its next design-time ReadProperties. Applying a Segoe icon clears any pending library pick.
- The page opens on the tab of the control's current icon with it selected: a Segoe icon opens the Segoe tab; a Fluent or Additional icon opens its tab, style and icon (when the library is installed). The log records the current Icon and IconSource, and each library Apply.
- Library: `IconLibraryFluentEntryNear`, `IconLibraryFluentFind`, `IconLibraryGalleryFind` and `IconLibraryStyleFromName`.
- Properties pane: `IconData` is `[NonBrowsable]` (still usable in code); `IconSource` has a Let that raises error 383, so the pane lists it read-only.
- tbUI3Test: Form_Load leaves a button's stored icon alone, so icons applied in the designer show at run time.
- Not yet built.

### 2026-10-19, pass 5b result

- Shane's 1.0.0.43 test in tbUI3Test (BETA 1012):
  - The mono SVG, the colour SVG and the PNG all draw from files. Copying `IconData` to another button works, and IconSize 20, 32 and 48 scale every kind.
  - Setting `Icon` replaces an image.
  - The mono SVG follows the text colour in dark and light, including on Accent (dark ink in dark mode, white in light, as WinUI's TextOnAccentFillColorPrimary).
  - The three copied designer entries load fine.
- Properties pane: `IconData` shows as a blank row and `IconSource` is not listed, because the pane leaves out a property with no Let, as VB6 did. Fixed in 5c by hiding IconData and giving IconSource a Let that raises error 383.
- Save and reopen of an image is not testable until 5c, since nothing sets one at design time yet.

### 2026-10-19, pass 5b: stored SVG and image icons (1.0.0.43, Claude)

- New private `UI3IconImage` class: holds an icon file's own bytes (SVG, or PNG, JPEG, GIF, BMP, ICO or TIFF, recognised by their first bytes) and draws it to fill a square with Direct2D. An SVG that uses the Fluent ink `#212121` or `currentColor` is drawn in the control's text colour; other SVGs and all bitmaps keep their own colours. This replaces the plan's `Recolor` parameter with detection. Bitmaps are scaled with high-quality cubic sampling where available.
- UI3Button: new `IconData` (the file bytes, as a Byte array in a Variant, so `Button1.IconData = Button2.IconData` copies an icon and `Empty` removes it), read-only `IconSource` (`file:<name>`, the name given to `LoadIcon`, or `(SVG)`/`(image)` after a copy), `LoadIcon(Data, Optional Name)` and `LoadIconFile(Path)`. Unrecognised data raises error 380. The last icon set wins: storing an image clears `Icon` and `IconGlyph`, and setting either (or a picker Apply) clears the image. `IconData` and `IconSource` are saved with the form only when there is an image.
- `DrawButtonContent` takes an optional image and ink colour. An image fills the IconSize square and sits beside or above the caption as a glyph does. Segoe glyphs keep their own text-box measurement, so existing buttons don't move.
- UI3Direct2D: `ComposeArgb`; `CreateSvgFromBytes` takes a height for non-square SVGs; `CreateBitmapFromImageBytes` returns the pixel size.
- Not yet built.

### 2026-10-19, pass 5b test form (tbUI3Test, Claude)

- At Shane's request the test files live in the repo: `tbUI3Test/test-icons/` holds `mono.svg` (#212121, should take the text colour), `color.svg` (keeps its colours) and `sample.png` (64 px with soft edges), all made for this test.
- `frmMain` now has four UI3Buttons (2 to 4 are copies of button 1's saved entry, restyled in `Form_Load`): a monochrome SVG on Accent, a colour SVG (click: switches to a Segoe icon), a PNG, and a copy of button 1's `IconData` (click: cycles IconSize 20, 32, 48 on all four). Button 1's click shows every `IconSource`. The icons load from `App.Path\test-icons`, else `E:\Code Projects\tbUI3\tbUI3Test\test-icons`. The earlier `Form_Activate` MDL2 glyph test is removed.
- The form edit was made on the saved project's own copy of `frmMain.tbform` and the export now matches it. The test project's `Settings` and `tBUI3Spike.txt` exports were already out of step with the saved project and are left as they were.
- Not yet run.

### 2026-10-19, pass 5a result

- Shane's 1.0.0.42 test: IconSize works (sizes, save and reopen) and looks right to Shane. The log shows `PAGE EditProperty Icon` each time the page was opened from Icon's own "...". So twinBASIC raises `PropertyPage_EditProperty` with the property's name, as VB6 did, and a control with two icon properties can share the picker. The log also shows the known hidden second page instance (a TextBox at the designer position, never visible).

### 2026-10-19, pass 5a: IconSize (1.0.0.42, Claude)

- Shane approved the pass 5 plan (`docs/2026-10-19-pass5-icon-system-plan.md`) and set the Windows version policy: the minimum rises to whatever a feature needs. It is recorded in ROADMAP.
- New `UI3Button.IconSize`: the size in DIPs of the icon, default 20 (WinUI's SymbolIcon size), saved with the form. For now it sets the Segoe glyph's font size; library icons follow in 5b and 5c. Values of 0 or less are rejected (error 380). The glyph is still placed by its own text box; the IconSize square layout comes with 5b.
- The icon picker writes `PAGE SelectionChanged` and `PAGE EditProperty <name>` to the property page log. This shows whether twinBASIC raises `PropertyPage_EditProperty` when Icon's own "..." opens the page, as VB6 did. New `UI3PropertyPageLog` (UI3Window) for page code to write to that log.
- Not yet built.

### 2026-10-19, 1.0.0.41 results and the Icon "..." button

- Shane's 1.0.0.41 test: the disabled Segoe MDL2 preview works, and the Additional Icons tab fits the strip. Picks on the library tabs don't enable Apply, as designed (preview only until pass 5).
- The `[PropertyPage("UI3IconPage")]` link on UI3Button.Icon now works: Icon shows its own "..." that opens the picker (BETA 1012, Shane). Wayne fixed the bug in BETA 1008 after our report. The guide and the code comments now say so; comment-only source change, no version bump.

### 2026-10-19, Additional Icons tab and MDL2 preview (1.0.0.41, Claude)

- Shane's requests on 1.0.0.39:
  - The Gallery tab is renamed Additional Icons.
  - Its images now sit in the same 44 DIP cells as the other tabs, shrunk to 24 DIPs. Where Direct2D offers it (a device context, Windows 8.1 and later), they are shrunk with high-quality cubic sampling. The details card still shows the image at its own size.
  - On the Segoe Fluent tab, the Segoe MDL2 preview card is disabled ("Not in font") for a glyph that only Segoe Fluent Icons has. This uses the catalog's FluentOnly flag, the same one behind "(not in MDL2)". The card no longer draws the font's missing-character box.
- Not yet built.

### 2026-10-19, Fluent icons scaled to their slot (1.0.0.40, Claude)

- Shane's 1.0.0.39 screenshots: both library tabs work. Install from the Fluent tab switches it to the grid; search, selection, the style cards and Color icons (gradients included) all draw, and the Gallery tab shows its images with name and 72 x 72 px size. One fault: an icon whose chosen file isn't 24 px drew at its own size from the slot's corner. Example: the Light arrow_down, which comes only in larger sizes, drew bigger than its neighbours.
- 1.0.0.40 makes each SVG at its own design size and scales it to the 24 DIP slot. `IconLibraryEntrySize` is new, and `DrawSvgAt` takes an optional scale. Not yet built.

### 2026-10-19, Fluent UI System and Gallery grids (1.0.0.39, Claude)

- The Fluent UI System and Gallery tabs now browse the installed icon library in the same grid as the Segoe Fluent tab, with their own search box text and hint. Fluent icons are drawn from their SVG files with Direct2D (`ID2D1DeviceContext5`, Windows 10 1703 or later), at the 24 px size where there is one; the monochrome styles are recoloured to the theme's text colour by swapping their `#212121` fill, and the color style keeps its own colours. Gallery images are decoded with WIC and fitted into 64 DIPs in larger cells.
- The Fluent tab's details show the icon's name, id, style and sizes, with four style cards (Regular, Filled, Color, Light). Clicking a card switches the grid to that style; styles the selected icon doesn't come in are disabled. Search matches the icon's name, id and tags. The Gallery tab's details show the image's name, pixel size and source, with a card at its own size.
- Picks on these two tabs are a preview only: Apply still writes only the Segoe icon, until copy-on-pick (pass 5) exists. If the library is installed but can't be read, the tab says why.
- New `UI3IconLibrary` index reader (`IconLibraryLoadIndex` and accessors) and new Direct2D helpers (`CreateSvgFromBytes`, `DrawSvgAt`, `CreateBitmapFromImageBytes`, `DrawBitmapIn`). The diagnostic log is still on.
- New `docs/PROPERTY_PAGE_GUIDE.md`: how the icon picker page was built and the mistakes made on the way, with a checklist for the next property page.
- Not yet built. Unverified: whether Direct2D draws every color SVG (they use gradients), and how the grid performs while scrolling, since each SVG is read from the library file the first time it is shown.

### 2026-10-19, search box confirmed fixed (1.0.0.38 result)

- Shane's 1.0.0.38 test: no grey flash; Shane called it fixed. The log names the cause: the box paints dark (rgb 31), then the inner #32770 container that holds the page erases its whole client in button-face grey and the box reads rgb 240 afterwards (container ERASE before 31, after 240). Windows does not repaint the box after that, so it stayed grey until something invalidated it; the 1 ms repaint now lands straight after this erase. The page's own erase (clipped in 1.0.0.37) was not the cause.
- Possible clean-up, not done: clip the box out of the container's erase as well, which might let the timed repaints go. The diagnostic log is still on.

### 2026-10-19, immediate search box repaint (1.0.0.38, Claude)

- Shane's 1.0.0.37 test: the grey flash remains. Correction to the 1.0.0.37 entry: the log's pixel was read before the page's erase ran, and it was already grey, so the page erase was not shown to be the cause; the screen pixel also lags behind painting, because Windows composes the screen later. What paints the grey is still unknown.
- 1.0.0.38 repaints the search box 1 ms after the hooks arm or the sheet is skinned. Windows delivers a timer only when no paint is pending, so this repaint lands straight after whatever painted over the box; five more repaints follow at 15, 50, 120, 250 and 500 ms. The log now reads the box's own window surface (not the screen) before and after each erase and paint of the box, the page and the page's container window, so it can show which paint turns the box grey. The page-erase clipping from 1.0.0.37 stays. Not yet built.

### 2026-10-19, page erase skips the search box (1.0.0.37, Claude)

- Shane's 1.0.0.36 test: the search box now ends up dark, with a brief grey flash on open. The log shows the cause: after the search box has painted dark, the page (ThunderPropertyPageDC) erases its whole client, clip (0,0)-(461,457), and the box reads rgb(240,240,240) afterwards; nothing repaints it until the first timed repaint, which turns it rgb(31,31,31). WM_CTLCOLORSTATIC never arrived, so that theory is ruled out.
- 1.0.0.37 removes the search box's rectangle from the page's DC (ExcludeClipRect) when the page erases, as WS_CLIPCHILDREN would, so the grey never reaches the box. The timed repaints and the log stay for now (Shane: keep the log on until everything is confirmed fixed). Not yet built.

### 2026-10-19, search box repaint and pixel log (1.0.0.36, Claude)

- Shane's 1.0.0.35 test: the search box still opens light with the caret blinking, so the hidden second page was not the cause (the 1.0.0.35 guard stays, as it is harmless). Measured on Shane's 1.0.0.33 screenshot: the box is rgb(240,240,240), which is the classic button-face grey, not the Edit's native white (255) and not any colour tbUI3 sets. The page, picChrome, picGrid and txtSearch all have dark designer colours, so the grey comes from a window or message tbUI3 does not colour. Candidates, unproven: the inner #32770 container around the page (its class background is button face) erasing over the box, or the Edit painting through WM_CTLCOLORSTATIC (used while an Edit is disabled or read-only), whose default is button face.
- 1.0.0.36: the search box's parent now also answers WM_CTLCOLORSTATIC for the search box with the dark brush. After the hooks arm and again after the sheet is skinned, a timer repaints the search box four times, 250 ms apart. The log is on again: each repaint records the screen pixel at the box's centre before and after, whether the box is visible and enabled, and every erase of the page and its container with its clip box and the box's pixel. Not yet built.

### 2026-10-19, search box keeps its hooks (1.0.0.35, Claude)

- Shane's 1.0.0.34 log: every paint of the visible search box erased dark and its WM_CTLCOLOREDIT was answered, so the hooks themselves worked. The last log line shows a second, never-shown UI3IconPage (its TextBox still at the designer position) arming the hooks for its own TextBox after the real page had painted. From then on the real search box painted classic light until a click made the real page repaint and re-arm them. The new chrome paint changed the timing so the stray page now runs last.
- `AttachPropertyPageHooks` (UI3Window) now keeps the hooks on a TextBox that is already inside the property sheet when the new TextBox is not inside one. A page that has been moved into the sheet can still take them over.
- The diagnostic log is off again, and the per-paint log line added in 1.0.0.34 is removed. Not yet built.

### 2026-10-19, search box diagnostic build (1.0.0.34, Claude)

- Shane's 1.0.0.33 test: no flicker on the tab strip or any tab's content (owner-drawn chrome works). The search box still opens classic light; the one-off repaint after the chrome's first paint did not fix it.
- 1.0.0.34 turns on `PROPERTY_PAGE_LOG_ENABLED` and adds two log points to the search box hook: every Edit WM_PAINT (with its current and hooked parent) and whether WM_ERASEBKGND painted the dark background. The log must be switched off again before release. Not yet built.

### 2026-10-19, owner-drawn picker chrome (1.0.0.33, Claude)

- Shane's 1.0.0.32 test: the chrome paints again, but hovering the tab strip or the Setup and library tab content still flickers, while the icon grid, the selected-icon details and OK/Cancel/Apply never do. The search box still opens classic light and turns dark on the first interaction. Shane pointed at the difference: the property sheet's buttons are painted by tbUI3 itself.
- New private module `UI3PageSurface` subclasses picChrome exactly as UI3Window subclasses the sheet's buttons: WM_ERASEBKGND returns 1, WM_PAINT is handled with BeginPaint/EndPaint and the page draws into that DC (`UI3IconPage.PaintChromeSurface`, a Friend method), and TrackMouseEvent's WM_MOUSELEAVE clears hover (`ChromeMouseLeave`). `PaintChrome` takes the DC to draw into; picChrome's own Paint event remains only as the fallback before the subclass is attached.
- After the first owner-drawn chrome paint, the search box is invalidated once so it repaints with its colour hooks armed. This addresses the symptom; why the Edit's first paint misses the hooks is still not proven. Not yet built.

### 2026-10-19, undo sibling clipping, keep the Segoe path as in 1.0.0.29 (1.0.0.32, Claude)

- Shane's 1.0.0.31 test: the whole chrome stayed classic light (no tab strip, search box frame or details) while the grid drew normally. The WS_CLIPSIBLINGS style added to picChrome in 1.0.0.31 is the only change that affects all chrome painting, so it is removed. Inferred, not proven: picChrome draws through its own persistent `hDC`, and changing the style after creation likely left that DC's visible region out of step with the window.
- `ApplyPageTheme` and `SetInfoDetails` use `picChrome.Refresh` again, as they did in 1.0.0.29; only the new hover, tab and status repaints use `RepaintChrome` (no erase).
- `PropertyPage_SelectionChanged` no longer calls `ShowTabControls` while the Segoe tab is showing and nothing has hidden its controls, so opening the page touches the search box exactly as 1.0.0.29 did. This targets the light search box seen on first open in 1.0.0.30; its cause is still unproven. Not yet built.

### 2026-10-19, picker flicker and search box fix (1.0.0.31, Claude)

- Shane's 1.0.0.30 test (BETA 1012): the tab strip, Setup and the Fluent tab work; Install from the published release and Uninstall both worked. Two regressions: the picker flickered as the mouse moved over it, and the search box was classic light on first open (the chrome around it stayed dark).
- Flicker: hover changes called `picChrome.Refresh`, which erases the whole chrome before Direct2D redraws it, and the chrome had no WS_CLIPSIBLINGS, so each repaint also painted over the search box and grid. 1.0.0.31 repaints with `InvalidateRect(..., bErase = 0)` and `UpdateWindow`, and sets WS_CLIPSIBLINGS on picChrome.
- Search box: the light colour is the native Edit painting without tbUI3's WM_CTLCOLOREDIT hook. The cause is not proven; the likeliest new factor in 1.0.0.30 is `ShowTabControls` assigning `Visible` on every selection change. 1.0.0.31 only assigns `Visible` when it changes and re-arms the hooks (and invalidates the Edit) whenever the search box is shown. Not yet built.

### 2026-10-19, icon picker tab strip and Setup tab (1.0.0.30, Claude)

- The icon picker gets a tab strip across the top: Segoe Fluent (the existing grid), Fluent UI System, Gallery and Setup. It follows WinUI's SelectorBar (`controls/dev/SelectorBar/SelectorBar_themeresources.xaml` at microsoft-ui-xaml 8318c5bf): item padding 12,10,12,7, bar padding 0,4, primary text with secondary on hover and tertiary while pressed, and a 16 by 3 accent pill under the selected item. The 4 DIP gap below the strip is a tbUI3 layout choice.
- Setup (new `UI3IconLibrary` module) shows the installed and latest library versions, size and folder, with Install, Update, Reinstall, Uninstall and Check for updates. Opening Setup checks the manifest once. Install reads `icons/manifest.txt` from tbUI3-Libraries main (only download URLs under that repository's releases are accepted), downloads the zip with `URLDownloadToFileW`, checks its size and SHA-256 (BCrypt), unpacks it with `%SystemRoot%\System32\tar.exe`, checks the .dat's SHA-256 and moves it to `%LOCALAPPDATA%\tbUI3\tbUI3-Icons.dat`. Uninstall asks first, then removes the library, its NOTICE.txt and the folder if empty.
- The Fluent UI System and Gallery tabs say whether the library is installed and offer a one-click "Install icon library"; browsing those icons is a later pass.
- `DrawStandardButton` (UI3Direct2D) now draws a WinUI Button anywhere on a Direct2D target. The property dialog's OK/Cancel/Apply skin calls it, with identical drawing (the code moved; offsets were added).
- New theme tokens: TextFillColorTertiary and SystemFillColorCritical (light and dark), from Common_themeresources_any.xaml.
- Not yet built. Known limits: the tab strip and buttons are mouse-only (no keyboard focus yet); hover can stay lit if the pointer leaves the page straight from the strip; downloads block the dialog until they finish; Install cannot succeed until the `icons-2026.10.19.1` release exists.

### 2026-10-19, icon library builder (Claude)

- New `tools/build-icon-library.mjs` builds the per-PC icon library from checkouts of microsoft/fluentui-system-icons (commit cd332ec1) and microsoft/WinUI-Gallery (commit 05939cc7). It writes `tbUI3-Icons.dat` (a 32-byte header, an ASCII index with one `set|id|name|style|size|variant|tags|offset|length` line per icon, then the unchanged SVG and PNG bytes), `tbUI3-Icons-<version>.zip` (the .dat plus NOTICE.txt with both MIT licences) and `manifest.txt` (version, size and SHA-256 for update checks). The format is documented at the top of the script.
- Checked in the cloud: 21,876 entries (Fluent 21,764: regular 10,267, filled 10,393, color 890, light 214; Gallery 112). Every file in Shane's WinUIElementToolbox library is present with identical bytes. The .dat is 31.2 MB and the zip 7.1 MB; `unzip -t` passes and two builds give byte-identical zips. Shane extracted it with Windows `tar -xf` on 2026-10-19 (works). Nothing in tbUI3 reads it yet.
- The manifest now carries the zip's download `url` (`--repo`, default Arrow-Loop/tbUI3-Libraries). Published `icons/manifest.txt`, a README and the .dat format description to tbUI3-Libraries main (1d914b3); the release itself is for Shane to create, because cloud sessions are not allowed to create releases.
- Upstream quirk: two Fluent folders (Chart Person, Person Support) hold a second icon id, so each index line carries the file's own id.

### 2026-10-19, spike removed (1.0.0.29, Claude)

- Shane chose a per-PC icon library (option A): the Fluent UI System SVGs and Gallery PNGs will live in one data file under `%LOCALAPPDATA%\tbUI3`, installed, updated, reinstalled or uninstalled from a new Setup tab in the icon picker. Built apps will carry only the icons picked, copied into the control's saved properties.
- Removed the spike: `UI3Spike.twin`, `Resources/OTHER` (`tbUI3Spike.txt` and the 1.6 MB `tbUI3SpikeBig.bin`), and the spike calls in `UI3Button` and `UI3IconPage`. The project file drops from 1.9 MB to 339 KB. Not yet built.
- `tools/twinproj-src.mjs remove` (with `twinproj-edit.mjs`) drops files or whole folders from a `.twinproj`.

### 2026-10-19, spike results and Const resource test (1.0.0.28, Claude)

- 1.0.0.27 on BETA 999 win32: `LoadResDataInternal` and `LoadResData` called at run time from package code both returned tbUI3Test's own `tbUI3Spike.txt` ("TEst"), not the package's. A 256-byte array written by `UI3Button.WriteProperties` survived Save, close and reopen intact; the form stores it base64-encoded inside `_IPersistStreamData`. Copy-on-pick is therefore viable.
- 1.0.0.28 tests the VB package's own pattern, `Const X As Variant = LoadResDataInternal(...)`, which the compiler resolves from the package's resources. A 1.6 MB random resource (`tbUI3SpikeBig.bin`) is read the same way so an EXE size check shows whether the constant ships in built apps.
- Result (Shane, BETA 1012, win32): the `Const` form returned the package's own files (30-byte text and all 1,600,000 bytes); run-time `LoadResDataInternal`/`LoadResData` still returned tbUI3Test's file. tbUI3Test.exe grew from about 0.99 MB to 2.52 MB (2,650,112 bytes), so `Const` resource data is compiled into every app that uses the package. The byte-array PropertyBag test passed again.

### 2026-10-14, spike retry with LoadResDataInternal (1.0.0.27, Claude)

- Shane suspected a pathing issue rather than a hard limit. The twinBASIC VB package reads its own images with the hidden runtime function `LoadResDataInternal` (for example `DirListBox.InitImages`, where it is assigned to a `Const` with the comment that the resource then does not exist as an ordinary resource in the output PE), and IDE add-ins call it at run time (`Dim data() As Byte = LoadResDataInternal("symbols.json", "SYMBOLS")`). `UI3Spike` now reports both `LoadResDataInternal` and `LoadResData`. Not yet compiled.

### 2026-10-14, icon gallery spike (1.0.0.26, Claude)

- Shane validated 1.0.0.25 (full Segoe Fluent set, tag search) and asked for the Fluent UI System and Gallery image tabs, placed below the property sheet's Icon tab and above the search box.
- Before building them, 1.0.0.26 is a spike for the two unproven points in ROADMAP: whether package code can read the package's own embedded resource (`LoadResData` on `Resources/OTHER/tbUI3Spike.txt`) at design time and in a built app, and whether a 256-byte array written by `UI3Button.WriteProperties` (`SpikeBytes`) survives Save, close and reopen. New module `UI3Spike` (gated by `SPIKE_ENABLED`) shows each result in a message box and appends it to `%TEMP%\tbUI3-spike.log`. All spike code and the resource are to be removed once answered.
- `tools/twinproj-src.mjs add` (with `twinproj-edit.mjs`) can now add new files and missing folders to a `.twinproj`; used to add `UI3Spike.twin` and `Resources/OTHER/tbUI3Spike.txt`.
- Package revision is now 1.0.0.26. Built by Shane on BETA 999 win32. Result: `LoadResData` from package code reads the host project's resources, not the package's; see ROADMAP.

### 2026-10-14, full Segoe Fluent icon set (1.0.0.25, Claude)

- Shane asked for one icon route covering the whole font. `UI3Icon` is now generated from the WinUI Gallery's Iconography data (1,533 glyphs, `docs/research/data/segoe-fluent-icons.json`, MIT) by the new `tools/gen-icons.mjs`, which rewrites only the marked regions of `UI3Enums.twin` and `UI3Icons.twin`. Values are glyph code points; names are the Gallery's.
- Breaking: the Symbol-value enum and icon.cpp conversion table are removed. 26 old names differ (for example `Find` is `Search`); `Placeholder`, `StopSlideShow` and `Target` have no Gallery glyph and are gone. tbUI3Test's form saves the icon by enum name (`ui3IconUnFavorite`), which may still resolve case-insensitively to `ui3IconUnfavorite`; otherwise re-pick it.
- Picker: search covers Gallery tags; the details row reads Value; Fluent-only glyphs are marked "(not in MDL2)" and hidden when Segoe Fluent Icons is not installed. A few single-symbol tags with non-ASCII characters or separators are dropped by the generator.
- The icon designer bridge in `UI3Icons` is unchanged.
- Package revision is now 1.0.0.25. Not yet compiled.

### 2026-10-14, icon library research (Claude)

- Shane measured that package resources do not ship in built apps: a 1.6 MB dummy resource made `tbUI3_win32.twinpack` 1.80 MB, while `tbUI3Test.exe` built against it was 0.99 MB (BETA 999, win32). Recorded in ROADMAP.
- Checked the 1,533 Segoe Fluent glyphs in Shane's WebView2 toolbox against tbUI3's 197 Symbol icons. The toolbox data records its source (WinUI Gallery `IconsData.json` at a pinned commit, MIT). Findings and the agreed direction are in `docs/research/2026-10-14-icon-library.md`; the extracted list is `docs/research/data/segoe-fluent-icons.json`. No code changed.

### 2026-10-07, Properties dialog centred on open (1.0.0.24, Claude)

- Shane validated 1.0.0.22 on BETA 999 win32: the whole Properties dialog is dark and WinUI-styled, hover works, the disabled Apply has no stray underline, and picking, Apply, OK, Cancel and reopening all behave as expected.
- Shane's 1.0.0.23 changed the package project settings so tbUI3 sorts where it is easy to find in the IDE's package picker.
- The dialog opened at the top-left of the screen. `UI3SkinPropertySheetHost` now centres the sheet once, when it is first skinned, in the work area of the monitor showing its owner window (the IDE), clamped to the work area's top-left. `CenterPropertySheet` in `UI3Window`.
- Package revision is now 1.0.0.24. Shane reported on 2026-10-14 that 1.0.0.24 builds and opens centred, and that the dialog checks pass in win64.

### 2026-10-07, disabled Apply underline fix (1.0.0.22, Claude)

- Shane built 1.0.0.21 on BETA 999 win32. The whole Properties dialog opened dark and WinUI-styled (title bar, tab, search box, page, OK/Cancel/Apply), and hover worked. Interaction checks past hover were still in progress.
- Shane saw a stray underline under the `A` of the disabled Apply button that went away once Apply was enabled. Cause (inferred, not traced): the native button draws its caption and mnemonic underline directly to a DC on `WM_UPDATEUISTATE` (and `BM_SETSTYLE`/`WM_SETTEXT`) without a `WM_PAINT`, and a disabled button gets no mouse messages to trigger our repaint. The sheet subclass now invalidates the skinned buttons after those three messages.
- Shane also saw that `Target` shows a missing-glyph box. Not changed: the table maps it to U+F5F0 exactly as WinUI's `icon.cpp` does, and that code point is not in the installed Segoe Fluent Icons or Segoe MDL2 Assets. See ROADMAP.
- Package revision is now 1.0.0.22. Not yet compiled.

### 2026-10-07, PropertySheet skin attach fix (1.0.0.21, Claude review)

- Shane asked Claude to review the 1.0.0.6 to 1.0.0.20 PropertyPage passes. Root cause of the regression from 1.0.0.17 on, found by reading the code (not yet confirmed on the PC): `picChrome_Paint` called `ApplyHostTitleBar` on every paint, which resolved the host with `GetAncestor(GA_ROOTOWNER)`. The 1.0.0.15 and 1.0.0.17 logs show that returns the page's own `ThunderPropertyPageDC`. `UI3SkinPropertySheetHost` then saw a different host from the promoted `#32770` and called `DetachPropertySheetSkin`, re-attaching to the page. So the 1.0.0.18 structural promotion worked, and the next page paint undid it: title bar and page dark (those don't depend on the subclass), tab and buttons light. That matches the 1.0.0.18 screenshot.
- `UI3SkinPropertySheetHost` now refuses any window without a direct `SysTabControl32` child and does nothing when the same sheet is already skinned. The page calls a new `UI3SkinPropertySheetForPage`, which finds the sheet structurally (the 1.0.0.18 lookup) and does nothing until BETA 997 has inserted the page. The deferred `WM_WINDOWPOSCHANGED` promotion (1.0.0.19/1.0.0.20) stays as the main trigger.
- The confirmed search-box hooks (`WM_CTLCOLOREDIT` on `ThunderPropertyPageDC`, `WM_ERASEBKGND` and focus repaint on `ThunderTextBox`) are now armed on their own, as soon as the page exists, instead of only as a side effect of skinning a host. The rest of the probe (whole-ancestry subclassing, Apply/size snapshots) no longer runs.
- Kept unchanged: the 1.0.0.10 sheet paint, the native tab metrics from 1.0.0.15, the resized native action buttons, the picker grid/details, and the icon designer bridge.
- The `%TEMP%\tbUI3-propertypage.log` diagnostic is off (`PROPERTY_PAGE_LOG_ENABLED = False` in `UI3Window`).
- First build attempt failed to compile: the inserted `UI3Window.twin` block had LF-only line endings, so twinBASIC could not read its line continuations (TB5184/TB5182 from line 391, and a knock-on TB5103 in `UI3IconPage`). The file is CRLF throughout again.
- Package revision is now 1.0.0.21. Built and opened on BETA 999 win32: fully dark on first open, hover works.

### 2026-10-07, WM_APP literal-width correction (1.0.0.20)

- Shane's 1.0.0.19 build produced TB0012 on `WM_APP = &H8000`: BETA 997 interpreted the literal as the 16-bit Integer value -32768 before widening it to Long.
- The constant is now `&H8000&`, forcing the intended 32-bit Long value and keeping the deferred promotion message in the `WM_APP` range.
- This is intentionally the only code change in 1.0.0.20 so the deferred host-promotion path can be retested cleanly.
- Package revision is now 1.0.0.20. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, deferred PropertySheet skin activation (1.0.0.19)

- Shane built/opened 1.0.0.18 in win32. Structural promotion succeeded: the log found the outer `#32770`, real `SysTabControl32`, inner dialog and `ThunderPropertyPageDC`. The screenshot showed the title bar and page body dark, the Icon tab fully visible and the search TextBox fixed, but the tab strip and action buttons still used native light painting.
- Because 1.0.0.18 attached the PropertySheet/tab/button subclasses while still inside the page's `WM_WINDOWPOSCHANGED` subclass callback, 1.0.0.19 removes that re-entrant attachment path. The page now posts a private message to itself, lets the native callback unwind, and performs structural host promotion from that later message.
- The diagnostic log now records every promoted host/tab/button `SetWindowSubclass` return value so a remaining native-paint failure can be distinguished from a paint-routine failure.
- Native tab metrics, ThunderTextBox color/erase handling and the designer persistence bridge are unchanged.
- Package revision is now 1.0.0.19. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, structural PropertySheet promotion (1.0.0.18)

- Shane built/opened 1.0.0.17 in win32. The search TextBox remained correctly dark and the native Icon tab remained fully visible, but the outer PropertySheet still stayed classic/light. The 1.0.0.17 log showed that repaint-time `GA_ROOTOWNER` still returned only the top-level `ThunderPropertyPageDC`.
- The same log also showed the decisive lifecycle event: BETA 997 later moves `ThunderPropertyPageDC` from `(0,0)-(461,457)` to its hosted `(21,63)-(482,520)` position. Host discovery therefore now runs directly from that page's `WM_WINDOWPOSCHANGED`, after `DefSubclassProc` completes the native move.
- 1.0.0.18 walks the page's live `GetParent` chain and identifies the real PropertySheet structurally as the first ancestor with a direct `SysTabControl32` child. When found, tbUI3 promotes the existing skin to that ancestor and logs the resulting host/tab snapshot.
- No new tab/page coordinate manipulation is included. ThunderTextBox painting and the designer persistence bridge remain unchanged.
- Package revision is now 1.0.0.18. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, late PropertySheet host acquisition (1.0.0.17)

- Shane built/opened 1.0.0.16 in win32. The Icon tab became fully visible and the search field stayed dark, but the outer tab/button strip was classic/light because the custom PropertySheet skin still did not attach.
- The 1.0.0.16 log showed why: the initial host discovery still occurred while the page was a top-level `ThunderPropertyPageDC` with no tab HWND. Later in the same run, BETA 997 moved that page into the real PropertySheet, but tbUI3 never retried host discovery after the move.
- 1.0.0.17 re-runs `ApplyHostTitleBar` from `picChrome_Paint`. The existing `GA_ROOTOWNER` lookup therefore gets another chance after native insertion, allowing the skin to switch from the early page HWND to the actual owning `#32770` PropertySheet.
- The confirmed ThunderTextBox erase/colour fix remains unchanged, and no new tab/page geometry or persistence changes are included.
- Package revision is now 1.0.0.17. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, PropertySheet owner-chain host fix (1.0.0.16)

- Shane's 1.0.0.15 diagnostic log exposed the actual failure: the skin host was `ThunderPropertyPageDC` itself, with `Tab: HWND=0` and `PageDialog: HWND=0`. tbUI3 therefore had no handle to the outer PropertySheet and could not possibly fix the clipped Icon tab in that build.
- `UI3IconPage.ApplyHostTitleBar` now resolves the host with `GA_ROOTOWNER` instead of `GA_ROOT`, so the owned top-level PropertyPage can walk to the real PropertySheet window and recover its `SysTabControl32` and action buttons.
- This is a host-discovery correction only. The 1.0.0.15 native-tab-metrics strategy and ThunderTextBox erase handling remain in place, and the icon persistence bridge is unchanged.
- Package revision is now 1.0.0.16. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, PropertyPage host-metrics + ThunderTextBox erase pass (1.0.0.15)

- Shane built/opened 1.0.0.14 in win32. The screenshot showed the two target defects were still present: the native search edit remained white and the Icon tab was still clipped. The rest of the 1.0.0.10-derived picker layout, including the smaller dual-font preview cards, remained visually sound.
- The 1.0.0.15 candidate stops resizing the real `SysTabControl32` item. BETA 997 reserves the page from its original tab metrics; enlarging that native item after layout is what creates the observed overlap until the PropertySheet later relayouts. tbUI3 now leaves the native hit/layout rectangle intact and skins exactly the item rectangle the host reserved.
- On the confirmed `ThunderTextBox` HWND, the diagnostic subclass now owns `WM_ERASEBKGND` using the same theme brush already returned from `ThunderPropertyPageDC` on `WM_CTLCOLOREDIT`. Focus transitions explicitly invalidate the edit so active/rest fill changes cannot leave stale classic white pixels.
- The 1.0.0.14 probe remains active and is relabeled 1.0.0.15. No manual page-dialog movement, `TCM_ADJUSTRECT`, or designer-persistence bridge changes are part of this pass.
- Package revision is now 1.0.0.15. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, confirmed TextBox brush route + Apply-layout trace (1.0.0.14)

- The 1.0.0.13 probe was run in win32. It confirmed that `txtSearch.hWnd` is itself `ThunderTextBox` (control ID 258), directly parented by `ThunderPropertyPageDC`, and that `ThunderPropertyPageDC` receives `WM_CTLCOLOREDIT` with that exact textbox HWND as the child.
- 1.0.0.14 therefore stops guessing about wrappers/nested EDIT windows. The existing diagnostic subclass on the confirmed `ThunderPropertyPageDC` receiver now intercepts **only** `WM_CTLCOLOREDIT` for the confirmed `ThunderTextBox`, applies the existing WinUI TextBox light/dark foreground/background resources through a persistent GDI brush, and returns that brush to the native control.
- No new tab/page geometry manipulation is included in this pass.
- Shane also observed a repeatable native layout clue in 1.0.0.13: after clicking **Apply**, the whole PropertyPage shifts downward and the full enlarged Icon tab becomes visible.
- To capture that transition rather than reproduce it by guesswork, the probe now logs the host/tab/inner-page-dialog/`ThunderPropertyPageDC`/textbox rectangles plus tab item 0 before and after the Apply `WM_COMMAND`, and after relevant `WM_SIZE` / `WM_WINDOWPOSCHANGED` messages.
- Repeated theme refreshes no longer reset the probe/log while the same PropertySheet is open.
- Package revision is now 1.0.0.14. Source/project candidate only: **not yet compiled or run in BETA 997**.


### 2026-10-07, diagnostic rollback to last good PropertySheet geometry (1.0.0.13)

- Shane's 1.0.0.12 screenshot showed that the corrective overlap calculation still did not materially improve the tab or search Edit, and the large blank/white region introduced during the 1.0.0.11 experiment remained. Continuing to guess at parent HWNDs/geometry was no longer justified.
- `UI3Window.twin` is therefore rolled back to the **1.0.0.10 PropertySheet host-skin baseline** for painting, tab sizing and action-button layout. The successful 1.0.0.10 icon-grid/details work and the later smaller Fluent/MDL2 preview cards are retained.
- 1.0.0.13 adds a temporary diagnostic probe instead of another visual hack. On opening the picker it writes `%TEMP%\tbUI3-propertypage.log` containing the real PropertySheet HWND tree (class, control ID, screen rect, caption), the ancestry of the HWND exposed by `txtSearch.hWnd`, and any `WM_CTLCOLOREDIT` messages seen on that ancestry including the actual child HWND that requested a brush.
- The diagnostic ancestors are subclassed only to observe `WM_CTLCOLOREDIT`; they do not alter painting or geometry. Each probe subclass removes itself on `WM_NCDESTROY`.
- Goal: identify the exact Win32 EDIT HWND/parent and the exact tab/page rectangles before making the next fix.
- Package revision 1.0.0.13 was built/run in win32 by Shane. Its probe successfully identified the exact TextBox color-message route and exposed the post-Apply native page shift; visual defects themselves remained intentionally unfixed in that diagnostic build.

### 2026-10-07, corrective PropertyPage geometry/Edit pass (1.0.0.12)

- Shane's 1.0.0.11 runtime screenshot showed a clear regression: a large white band appeared between the tab strip and the actual page content, while the search Edit still painted white. The tab itself also remained imperfect.
- Root cause of the geometry regression is the 1.0.0.11 use of `TCM_ADJUSTRECT` as a replacement page rectangle. In this BETA 997 PropertySheet hierarchy that moved the real page much farther down than intended.
- 1.0.0.12 removes that strategy. After enlarging the real first tab item, tbUI3 now compares the real tab-item bottom and the real PropertyPage top in the same host coordinate space, then moves the page down **only by the measured overlap**. The existing width/bottom edge are otherwise preserved.
- The search TextBox path is also corrected. `txtSearch.hWnd` may be a wrapper rather than the actual Win32 EDIT that sends `WM_CTLCOLOREDIT`. tbUI3 now resolves a nested `Edit` child when present, subclasses the resolved EDIT's actual parent, and matches the color request against the actual EDIT HWND.
- The 1.0.0.11 preview-card size reduction remains: 96x88-DIP cards with a 26-DIP glyph.
- Package revision is now 1.0.0.12. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, native Edit brush + tab display-area fix + preview spacing (1.0.0.11)

- Shane's 1.0.0.10 screenshot confirmed the centered glyph matrix and dual-font **Selected icon** panel are a strong direction. Remaining visual defects were: the native search Edit turns white again whenever selection/focus activity causes Windows to repaint it; the enlarged **Icon** tab is still clipped; and the two preview cards feel too dominant / too close to the bottom action row.
- The active PropertyPage HWND is now subclassed **only** for native Edit-color handling. On `WM_CTLCOLOREDIT`, tbUI3 supplies the correct light/dark text color and a persistent theme brush composited from the WinUI TextBox resources. This keeps the real Edit control (caret, selection, clipboard, IME, tab order) while preventing Windows from reasserting the classic white fill after a grid click or focus transition.
- The PropertySheet tab layout now uses `TCM_ADJUSTRECT` after requesting the WinUI TabViewItem 100x32-DIP size. The real PropertyPage HWND is moved/resized into the tab control's resulting display rectangle instead of remaining at the old classic-tab offset. `UI3IconPage` handles PropertyPage resize by re-running its layout, so the larger header should no longer be overpainted by the page.
- The Fluent and MDL2 preview cards are reduced to **96x88 DIPs** with a **26-DIP** preview glyph and centered as a pair inside their details-column region, creating more whitespace around the cards and above the native action buttons.
- Package revision is now 1.0.0.11. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, centered icon grid and dual-font details (1.0.0.10)

- At Shane's request, the icon picker now centers the actual 44-DIP cell matrix inside the usable grid width rather than merely centering the surrounding PictureBox. The painted scrollbar keeps its own right-side lane, and mouse hit testing uses the same centered origin.
- The PropertyPage height grows from 400 to 456 DIPs so the picker can keep six icon rows while gaining a 108-DIP details region.
- The old debug-like two-line selection readout is replaced with a labeled **Selected icon** area: Name, Enum, Symbol (decimal + WinUI Symbol hex) and Glyph (modern U+ code point).
- The same modern glyph is rendered side by side at 28 DIPs in **Segoe Fluent Icons** and **Segoe MDL2 Assets** so a control designer can see the Windows 11 appearance and the Windows 10 fallback appearance directly. Each preview reports Active, Fallback, or Unavailable based on the fonts actually installed.
- The preview cards and metadata layout are a tbUI3 picker convenience; the glyph mapping itself still comes from Microsoft SymbolIcon conversion behavior.
- Package revision is now 1.0.0.10. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, PropertySheet paint/layout follow-up (1.0.0.9)

- Shane built and opened the 1.0.0.8 PropertySheet skin in win32. The overall dark shell worked: title bar, page background, painted tab and painted bottom buttons all appeared in the live property sheet.
- Three problems were observed: the search Edit initially showed a white native fill until interaction forced a repaint; the tab and bottom buttons visibly flickered while the pointer moved around them; and the disabled Apply caption was clipped in the original small Win32 button rectangle.
- 1.0.0.9 changes the skin from “default paint, then cover it” to owning WM_PAINT for the root/tab/buttons. The native control window procedures still receive input/state messages, but their classic paint is no longer allowed to flash first.
- The original IDOK/IDCANCEL/ID_APPLY_NOW HWNDs are now physically resized and repositioned instead of leaving their hit targets behind. This preserves their native PropertySheet commands automatically: the real buttons move with the WinUI-looking paint. The action row uses 8-DIP spacing; widths are equalized from measured captions plus exact WinUI Button padding, with a documented tbUI3 80x32-DIP convenience floor because WinUI has no PropertySheet layout contract.
- The native SysTabControl32 item is now asked for WinUI TabViewItem's exact 100-DIP minimum width, 32-DIP minimum height and 8,3,8,3 no-close header padding. Its selected paint uses the source-backed selected background, 8-DIP OverlayCornerRadius and 12-DIP semibold header typography. If this PropertySheet style ignores TCM_SETITEMSIZE, the next fallback is custom hit testing/forwarding rather than leaving paint and hit testing misaligned.
- The search TextBox is explicitly refreshed immediately after its theme colors are applied.
- The selected-icon name/detail text that disappeared in 1.0.0.8 is no longer left to a classic transparent Label at runtime. Its two lines are now painted directly by Direct2D into the page chrome, while the Label remains only as a designer placeholder.
- Package revision is now 1.0.0.9. Source/project candidate only: **not yet compiled or run in BETA 997**.

### 2026-10-07, native PropertySheet skin spike (1.0.0.8)

- Restored the original `UI3IconPage.tbppage` sibling order from 1.0.0.6. Shane's comparison showed that the earlier canvas was actually the more faithful representation: the search TextBox was visible, while the blank Direct2D grid and hidden scrollbar only appeared absent because they contain no design-time drawing.
- Extended the existing pointer-safe `SetWindowSubclass` pattern to the native Win32 PropertySheet host and its tab/OK/Cancel/Apply child HWNDs.
- The host window remains the real PropertySheet. tbUI3 now paints over its visible shell instead of replacing its behavior: the root client background is painted with the WinUI window surface, the native tab is repainted as a dark/light tbUI3 tab surface, and the original OK/Cancel/Apply HWNDs are repainted in place.
- OK uses the WinUI AccentButton resource chain; Cancel/Apply use DefaultButton resources. Rest, pointer-over, pressed and disabled fills/foregrounds follow the corresponding microsoft-ui-xaml Button/Common theme resources. The native buttons continue to own enabled state, focus, keyboard and clicks.
- The host title bar continues to use the existing DWM dark/light treatment. Theme/accent notifications invalidate the host skin live.
- This PropertySheet/tab arrangement is explicitly a **tbUI3 convenience skin**, not a claim that WinUI defines a PropertySheet control. Where the skin uses Button visuals, those values remain source-backed WinUI Button values.
- Package revision is now 1.0.0.8. Source/project candidate only: **not yet compiled or run in BETA 997**.


### 2026-10-07, theme-aware PropertyPage chrome candidate (1.0.0.6)

- Reworked `UI3IconPage.tbppage` so the designer canvas is now the baseline layout instead of a collection of arbitrarily placed controls that only become correct in code.
- Added a full-page `picChrome` Direct2D surface behind the native controls. Runtime layout now adapts that designer-authored baseline to the host size rather than inventing the composition from scratch.
- The page now follows tbUI3 light/dark state: WinUI window background, primary/secondary text, theme-aware search surface, theme-aware icon grid, and dark/light selected-icon treatment.
- The classic TextBox remains as the real Edit control for caret, selection, clipboard and IME behavior, but its border is removed and tbUI3 draws the visible 4-DIP rounded TextBox chrome around it. Focus adds the WinUI-style 2-DIP accent bottom edge.
- The classic VScrollBar is now hidden and retained only as the range/value model. A source-backed WinUI-style scrollbar thumb is painted directly into `picGrid`; wheel, track click and thumb dragging update the hidden scrollbar state.
- Added source-backed TextBox/ScrollBar theme tokens to `UI3Theme` from microsoft-ui-xaml's Common, TextBox and ScrollBar resources.
- The page applies the existing DWM dark/light title-bar treatment to the root PropertyPage host window when it can resolve the host HWND.
- The existing icon-picker designer bridge/logging code was intentionally left untouched.
- Package revision is now 1.0.0.6. This is a source/project candidate only: **not yet built or run in BETA 997**. The outer host-owned OK/Cancel/Apply strip is not overpainted in this first chrome pass; that remains the next escalation if the page-body/host-titlebar spike is stable.


### 2026-10-07, handoff for ChatGPT's next passes

- HANDOFF.md now has an ordered work queue (finish picker validation, tidy tbUI3Test, design-time form canvas theme, designer accent refresh, S2 BackColor check, then spike A in ROADMAP order), how a pass works with Shane, and new gotchas (PropertyPage behaviour in BETA 997, PropertyBag defaults, CLI export paths). AGENTS.md mentions `tools/twinproj-src.mjs`. Docs only.

### 2026-10-07, icon picker search hint and info line (1.0.0.5 candidate)

- At Shane's request, the search box shows a grey hint, "Search by name, number, &HE174 or U+E8CB", while it is empty (Windows `EM_SETCUEBANNER`, a private `SendMessageW` declaration; needs Common Controls 6, otherwise nothing shows).
- The info line under the grid is now two lines: the icon's name, then `ui3IconName · value · &Hhex · U+glyph`, in the same order as the hint. `lblInfo.UseMnemonic` is off so "&H" is shown literally.
- Checked on Shane's PC (win32): he reported the picker "looks great" and pushed tbUI3Test with the updated package (91fef79). `tbUI3Test/src` was regenerated from it.

### 2026-10-07, icon picker saves the chosen icon (1.0.0.5 candidate)

- Shane asked for a workaround rather than parking the picker. Reading the IDE's `main.js` showed the form designer keeps each control's properties itself and replaces them with the serialization the backend returns with each control image.
- `UI3Icons` gained a small designer bridge: while `UI3IconPage.ApplyChanges` runs, `UI3Button.Icon` records the value under the control's design-time name (`Ambient.DisplayName`), and a later design-time `ReadProperties` for that name re-applies it once and calls `PropertyChanged "Icon"`.
- `DesignLog` writes designer events to `%TEMP%\tbUI3-design.log`. It is now off (`DESIGN_LOG_ENABLED = False` in `UI3Icons`), but the calls stay in place.
- **Validated on Shane's PC (win32, 537850e):** he picked a new icon (57677) and clicked OK. The button redrew with it, and closing the designer prompted to save the form. After saving and reopening, the icon was kept.
- **Not understood:** the log shows the save came from the live button's `WriteProperties` right after Apply (Icon = 57677), not from the bridge, whose pending value was never used. Earlier builds lost the value, and the only code change on that path is that `Icon`'s `Property Let` now reads `Ambient.DisplayName` (through the bridge and the log call). Until the cause is known, the bridge and the log calls stay unchanged, because removing them might bring the bug back.
- Turning the log off (537850e plus this change) has not been rebuilt yet.

### 2026-10-06, UI3IconPage first build on Shane's PC (1.0.0.5 candidate)

- Shane added `txtSearch`, `picGrid` and `vsbGrid` in the page designer and built it (commit 2e022ed). `tbUI3/src` was regenerated from his project.
- **Fixed:** opening the picker raised "Automation error" (80004005). `PropertyPage_SelectionChanged` set `Me.Changed = False` while the IDE was still handing the page its controls (`SetObjects`), and the property frame refused the status change. The line was removed, because a page starts unchanged. After the fix, Shane saw the picker open on the button's current icon (Sort, &HE174, drawn as U+E8CB).
- **Blocked on twinBASIC:** picking another icon and clicking OK or Apply does not stick. A temporary diagnostic (now removed) showed on Shane's PC that `ApplyChanges` ran, set `Icon` on the button (it read back as Stop, 57691), and saw error -2147352570 "Unknown name". After closing and reopening the form designer, Icon was back to Sort (57716). Inferred from the VB package source: `UserControl.PropertyChanged` looks the property up by name on the outer class to notify the IDE, that lookup fails, the error is swallowed, and the IDE never records the change, so the designer reloads the old value. The picker is parked until twinBASIC fixes it; `ApplyChanges` is a plain loop again.
- Added mouse-wheel scrolling to the grid (`picGrid_MouseWheel`, a twinBASIC PictureBox event; one notch moves one row). Not built yet.
- Added `tools/twinproj-src.mjs` (compare, extract, patch between a `.twinproj` and its `src/`), the scripts the cloud sessions had been using from a temp folder. Checked: compare reports all 15 entries the same, and a no-op patch leaves the project byte-identical.
- HANDOFF.md now holds the next steps for the session after this one, including what to do if the Apply test fails.

### 2026-10-06, UI3IconPage icon picker (1.0.0.5 candidate, not built)

- Started from Shane's spike page (commit a5af8a4). `tbUI3/src` was regenerated from his project, because the CLI export needs absolute paths and failed.
- `UI3IconPage` is a PropertyPage, captioned "Icon", that opens from `(Custom)` → `...` on a UI3Button:
  - a search box matches a name, a UI3Icon value in decimal or hex, or the drawn glyph code (`&H`, `0x` and `U+` prefixes are accepted);
  - a scrolling grid draws every icon with the same Direct2D/DirectWrite code as UI3Button, and selecting a cell uses the light Accent button colours;
  - an info line shows the name, the value and the glyph drawn;
  - it opens on the selected button's current icon, and OK or Apply sets `Icon` on every selected button.
- `UI3Icons` gained a catalog (`IconCatalogCount`, `IconCatalogName`, `IconCatalogValue`), because enum names are not available at runtime.
- `[PropertyPage("UI3IconPage")]` moved from the spike's `IconSpacing` back to `Icon`, with a comment explaining why it stays although BETA 997 ignores it.
- The page designer was resized to 460 × 400, and its spike label became `lblInfo`. Shane still has to add `txtSearch` (TextBox), `picGrid` (PictureBox) and `vsbGrid` (VScrollBar) in the designer. Code positions them, so their placement does not matter.
- Package version 1.0.0.5. Patched into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`; every entry matches `tbUI3/src` byte for byte. Not compiled.


### 2026-10-06, property-page picker spike

- Ran on Shane's PC in BETA 997. No code was committed.
- A tbUI3 PropertyPage attached through UserControl `PropertyPages` appears as `(Custom)` → `...` in the Properties pane and opens as a dialog with OK, Cancel and Apply. This works.
- Per-property `[PropertyPage("...")]` links show no `...`, whether the property is an enum (`Icon`) or a Single (`IconSpacing`). The IDE does not honour them yet.
- Details are in `docs/research/2026-10-06-property-page-picker.md`. ROADMAP.md is updated with the chosen route.


### 2026-10-06, tbUI3Test synced

- Shane committed his local tbUI3Test (dropped UI3FormTheme, tbUI3 1.0.0.4) as commit 7c20660.
- The CLI export in that step did not refresh `tbUI3Test/src`, so the mirror was regenerated from the committed `.twinproj`. Every entry matches byte for byte, and the embedded tbUI3 package matches `tbUI3/src`.
- frmMain still contains the two MDL2 test lines in `Form_Activate`.


### 2026-10-06, S3 icons validated; 1.0.0.4 Caption fix

- Shane built 1.0.0.3 in twinBASIC BETA 997 with 0 errors and 0 warnings, then imported it into his local tbUI3Test.
- Validated on his PC (Windows 11, dark mode), by screenshot:
  - semantic icons render at design time and at runtime, on the Standard and Accent styles (tested with `ui3IconSort`, saved as 57716 = `&HE174`, WinUI's Sort value, which drew the Sort glyph);
  - icon left and icon top, with an enlarged button;
  - icon-only, which centres in the button;
  - the MDL2 check: `IconGlyph = ChrW(&HE8FB&)` with `IconFontName = "Segoe MDL2 Assets"` draws a modern check mark, which confirms that the single-table decision was right;
  - win64: the app runs under the Win64 compiler and the icon draws.
- Found and fixed (1.0.0.4; Shane built it and confirmed the fix in win32 and win64 the same evening):
  - Caption could not be cleared in the designer. It reverted to "Button" because "Button" was also the saved default, so an empty caption was not kept.
  - The saved default is now an empty string, and a newly dropped button still starts as "Button".
  - Side effect: a form saved before this change with the untouched caption "Button" will now load with an empty caption. No known form is affected.
- Found, not fixed: the designer keeps the old accent colour after a Windows accent change until the IDE restarts. Runtime updates live.
- Package version 1.0.0.4. Patched `UI3Button.twin`, `Settings` and the package CHANGELOG into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`. Every entry matches `tbUI3/src` byte for byte.
- Recorded Shane's designer requests in ROADMAP.md: a themed form canvas at design time, a designer accent refresh, and `...` visual catalog pickers. Added research notes for the picker in `docs/research/2026-10-06-property-page-picker.md`.


### 2026-10-06, S3 icons use WinUI's Symbol values and one glyph table

- Shane approved both points from the S3 source review.
- `UI3Icon` values are now WinUI's own Symbol enum values (`ui3IconAccept = &HE10B&` and so on), with `ui3IconNone = 0`. Microsoft never renumbers these, so a form that saves an icon stays correct when new symbols are added. The old alphabetical 1 to 197 numbering is gone. No saved forms used it, because 1.0.0.3 was never built.
- `UI3Icons.SemanticIconGlyph` now holds a single table copied from WinUI's `CSymbolIcon::ConvertSymbolValueToGlyph` (microsoft-ui-xaml `cd7c7c41`, `dxaml/xcp/core/core/elements/icon.cpp`). The second "legacy" table is removed. A value outside the table is drawn as itself, as WinUI does. The function no longer takes a font name.
- Font selection is unchanged: Segoe Fluent Icons when installed, otherwise Segoe MDL2 Assets.
- Checked by script: all 197 enum values and glyphs match WinUI's table, and the enum values are unique. Patched the three sources and the package CHANGELOG into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`; every entry in the project matches `tbUI3/src` byte for byte.
- Not compiled or run. Package 1.0.0.3 still needs its first IDE build. That build should include the MDL2 check from the review, which confirms that the Windows 10 font has the modern code points.
- Marked the S3 spec's "dual mapping" rule as superseded, and updated HANDOFF.md, ROADMAP.md and `docs/controls/UI3Button.md` to match.


### 2026-10-06, S3 source review and handoff tidy-up (no code changes)

- Reviewed the 1.0.0.3 S3 icon code against microsoft-ui-xaml `main` (`cd7c7c41`, `dxaml/xcp/core/core/elements/icon.cpp`) and dwrite.h. Notes are in `docs/reviews/2026-10-06-s3-source-review.md`. Nothing was compiled or run; 1.0.0.3 remains untested.
- Checked by script: all 197 Fluent code points in `UI3Icons.twin` match WinUI's `CSymbolIcon::ConvertSymbolValueToGlyph`, with none missing or extra. The 20-DIP icon size matches `g_ClientCoreFontSize`.
- Checked by reading: the new `IDWriteTextFormat`, `IDWriteTextLayout` and `IDWriteFactory.CreateTextLayout` vtable slots and `DWRITE_TEXT_METRICS` match dwrite.h and WinDevLib.
- Raised two points to settle before 1.0.0.3 ships: the second "legacy" glyph table is probably unnecessary (inferred, one PC check settles it), and the `UI3Icon` numbers should become WinUI's fixed Symbol values so saved forms stay correct.
- Updated the UI3Button fidelity matrix: it now cites the glyph mapping source and labels the MDL2 fallback as a tbUI3 convenience.
- Made HANDOFF.md and ROADMAP.md agree on the next step (build and test 1.0.0.3), and added syncing Shane's local tbUI3Test and deciding where `reference-packages/` lives to the roadmap.
- Removed `tbUI3Test/tbUI3Test.twinproj.bak-20261006-000844`. It was byte-identical to the project at commit c6ba137, so git history already keeps it. `.gitignore` now ignores `*.bak-*`.


### 2026-10-06, control fidelity policy

- Added `docs/CONTROL_FIDELITY_POLICY.md` as the authoritative rule that tbUI3 reproduces control-specific WinUI XAML/resources/behavior rather than generic Fluent approximations.
- Defined source priority: control-specific microsoft-ui-xaml theme resources/templates first, then implementation source, WinUI Gallery, official API documentation, and only then general Fluent guidance for explicitly labeled convenience behavior.
- Required per-control source matrices covering padding, dimensions, typography, brushes/resource chains, visual states, transitions, focus, compact sizing, high contrast, orientation and interaction behavior.
- Clarified that collapsing hundreds of WinUI variants into a smaller toolbox does not relax fidelity; every mapped variant still follows its own WinUI control/style definition.
- Reclassified UI3Button's S3 `Icon`, `IconGlyph`, `IconFontName`, `IconPosition`, and `IconSpacing` as tbUI3 convenience abstractions over WinUI Button.Content rather than native WinUI Button properties.
- Corrected the documentation for the 8-DIP `IconSpacing` default: it comes from general WinUI Gallery spacing guidance and is not a Button-specific XAML value.
- Added a Button fidelity/source matrix and moved S3's next gate from immediate compiler validation to a source-matrix review before validation.


### 2026-10-06, S3 icon implementation candidate

- Bumped the package source to 1.0.0.3 and added the first S3 implementation candidate.
- Generated a 197-entry `UI3Icon` semantic enum from Microsoft's current Symbol table and a private dual-code-point mapping for Segoe Fluent Icons and legacy Segoe MDL2 Assets.
- Added `UI3IconPosition` (Left/Top/Right/Bottom) and UI3Button properties `Icon`, `IconGlyph`, `IconFontName`, `IconPosition`, and `IconSpacing`.
- Added installed-font selection: semantic icons prefer Segoe Fluent Icons and fall back to Segoe MDL2 Assets. Raw `IconGlyph` can optionally specify a custom `IconFontName`.
- Extended the private DirectWrite layer with the minimum `IDWriteTextLayout` / metrics surface needed to measure caption and glyph runs, then center icon+text as one content block instead of using guessed offsets.
- UI3Button now supports text-only, icon-only, and icon+Caption composition in Left/Top/Right/Bottom positions while preserving the existing Standard/Accent S2 chrome.
- Icon size is 20 DIPs, matching WinUI's SymbolIcon/IconElement core default. Default icon-caption spacing is 8 DIPs, matching WinUI Gallery's documented spacing between adjacent controls / control and label.
- The S3 candidate is packed into the canonical `tbUI3/tbUI3.twinproj`, but has **not** yet been compiled or run in BETA 997.
- tbUI3Test was intentionally not repacked in this pass because Shane's local designer copy now contains the validated drop-on UI3FormTheme placement. Sync that local form before replacing the repository test harness.


### 2026-10-06, UI3FormTheme milestone complete

- Shane removed the manual `UI3Window.Attach/Detach` calls from tbUI3Test, dropped `UI3FormTheme` from the toolbox onto frmMain, and repeated the same runtime validation set successfully.
- The drop-on nonvisual component path therefore matches the code-based Attach/Detach behavior for the tested harness: normal startup, UI3Button Click, live Windows accent updates, live light/dark switching, and clean debugger-stop teardown all pass.
- This completes the current form-theme baseline milestone. `UI3FormTheme`, cached theme/accent state, live notifications, rounded corners, form background management and child redraw are now validated as a usable package feature.
- The next implementation milestone is S3 icon support as specified in `docs/2026-10-06-s3-icon-spec.md`.


### 2026-10-06, win64 live-engine validation

- Shane repeated the full 1.0.0.2 live-engine test set in win64.
- The win64 harness runs normally, UI3Button Click remains functional, live Windows accent changes repaint correctly, live light-to-dark switching updates correctly, and debugger-stop teardown returns cleanly to the IDE.
- The code-based `UI3Window.Attach/Detach` path is now validated in both win32 and win64 for the current form-theme milestone.
- Remaining validation for the milestone: the drop-on nonvisual `UI3FormTheme` component path.


### 2026-10-06, debugger-stop teardown validation

- Shane stopped the running win32 tbUI3Test session from inside the twinBASIC IDE while the subclassed form was still open.
- twinBASIC returned normally to the debugger, reported that it was waiting for remaining forms to close, completed teardown, and cleared global variables.
- No IDE crash or hang occurred. This validates the tested win32 subclass/window-destruction cleanup path, including the current `WM_NCDESTROY` removal behavior.
- Remaining form-theme validation: win64 live-engine run/stop and the drop-on UI3FormTheme path.


### 2026-10-06, live accent and theme switching validation

- Shane confirmed that changing the Windows accent colour while tbUI3Test is already running updates the Accent UI3Button immediately and correctly; no app restart or manual re-attachment is required.
- Shane also confirmed live Windows light-to-dark theme switching works correctly while tbUI3Test is running.
- This validates the live `WM_SETTINGCHANGE` / DWM/theme refresh path at runtime for the tested win32 harness, including theme-cache refresh and child redraw behavior.
- Light mode is now runtime-observed as part of the successful live light-to-dark transition; a separate exhaustive light-theme visual pass is no longer required for the current milestone.
- Remaining form-theme validation: debugger-stop safety, win64 live-engine run/stop, and the drop-on UI3FormTheme path.


### 2026-10-06, 1.0.0.2 runtime baseline

- Shane confirmed that the 1.0.0.2 tbUI3 package builds cleanly in twinBASIC BETA 997 and imports into tbUI3Test without issues.
- Shane then ran the updated tbUI3Test harness successfully with the new `UI3Window.Attach Me` path active.
- UI3Button Click still raises the Hello World message box under the new live-theme attachment path.
- This validates the normal runtime baseline for the new form-theme engine. Live accent/theme message handling, debugger-stop safety, the drop-on UI3FormTheme path and light mode remain separate checks.


### 2026-10-06, repository handoff cleanup

- Updated the README with the actual 1.0.0.2 development state, authoritative full-control inventory and prepared S3 icon specification.
- Generalized the immutable COM/designer ID rule now that a second public control exists; both UI3Button and UI3FormTheme have checked-in ID records.
- Updated the handoff's button-family example to include the newly confirmed WinUI Subtle variant and linked the prepared S3 spec.


### 2026-10-06, S3 icon specification

- Added `docs/2026-10-06-s3-icon-spec.md` so icon work can start immediately after the form-theme compile checkpoint without reopening API/design questions.
- Verified from Microsoft's current Symbol specification that many semantic icons use different code points in Segoe Fluent Icons versus legacy Segoe MDL2 Assets. S3 therefore requires dual glyph mappings rather than merely swapping font names.
- Specified installed-font-only fallback: Segoe Fluent Icons → Segoe MDL2 Assets for icons and Segoe UI Variable Text → Segoe UI for normal text.
- Specified a shared semantic icon property plus a raw-glyph escape hatch, and DirectWrite measurement for centered icon+text composition.
- Corrected the full control inventory to include WinUI's current SubtleButtonStyle as a UI3Button family variant alongside Standard and Accent.
- Kept S3 implementation behind the 1.0.0.2 form-theme compile/runtime checkpoint to avoid stacking unvalidated native code.


### 2026-10-06, UI3FormTheme implementation candidate

- Shane confirmed the existing UI3Window dark-mode harness looks identical at runtime in win64 and that UI3Button Click still raises the Hello World message box. The win64 runtime/Click check is passed.
- Light mode remains intentionally untested for now at Shane's request; it is deferred rather than marked validated.
- Added cached theme/accent state to UI3Theme and package-wide `UI3ThemeMode` System/Light/Dark override support.
- Added `UI3Window.Attach` / `Detach`, pointer-width-safe comctl32 subclassing, live `WM_SETTINGCHANGE` / `WM_DWMCOLORIZATIONCOLORCHANGED` / `WM_THEMECHANGED` refresh, `WM_NCDESTROY` cleanup, rounded-window-corner application and forced child redraw after form-theme changes.
- Added the nonvisual drop-on `UI3FormTheme` control with `ThemeMode` and `ManageBackColor` property persistence.
- Updated tbUI3Test source to use `UI3Window.Attach Me` and detach on Form_Unload so the next run exercises the live engine rather than activation-time one-shot refresh.
- Bumped the package source version to 1.0.0.2.
- Added `THIRD-PARTY-NOTICES.md` documenting microsoft-ui-xaml, WinDevLib, WinRT and VBCCR18 provenance used by the current implementation.
- Static-audited the candidate against the current official twinBASIC documentation: `Form_Unload(Cancel As Integer)` is a documented form signature; `InvisibleAtRuntime` is explicitly supported for host-side service controls; and `UserControl_Show` is the documented run-view lifecycle event. UI3FormTheme now retries attachment on Show/UserMode changes instead of attempting it from Initialize.
- Hardened `UI3Window.Attach` so it retains a Form reference only after `SetWindowSubclass` succeeds; if subclass installation fails, the theme is applied once without leaving an attachment that has no destruction callback.
- Byte-verified the final 1.0.0.2 packed package against its loose mirror: all 8 source/control-descriptor files plus Settings match exactly.
- Byte-verified tbUI3Test: its packed frmMain and Settings match the loose mirrors, and all 12 files in its embedded tbUI3 package match the canonical tbUI3 package exactly.
- This is structural/source synchronization evidence only; the new 1.0.0.2 form-theme code still needs IDE compiler/runtime validation.


### 2026-10-06, full control inventory

- Added `docs/CONTROL_INVENTORY.md` as the authoritative coverage plan for the complete practical WinUI 3 control surface.
- Reconciled the plan against WinUI Gallery `main` commit `b927a6253d6b183be55b90287b8a04fde14d31a3`: 125 catalog pages total, 110 normal pages, 15 fundamentals/design/accessibility pages, and 86 directly control-like pages by current metadata.
- Made Claude's D6 family rule explicit: related WinUI classes and documented variants are exposed through one coherent VB-style toolbox control with `Style`, `Mode`, `Presentation` or focused properties rather than hundreds of toolbox entries.
- Added a complete Gallery coverage ledger mapping every current non-special Gallery page to a tbUI3 toolbox family, code-created surface, shared engine, platform adapter or deliberately non-control helper category.
- Recorded the package-wide rule that the hundreds of state/style/sample variants are coverage requirements even though the public toolbox remains much smaller.


### 2026-10-06, UI3Window win32 dark-mode visual validation

- Shane ran the current tbUI3Test harness in twinBASIC BETA 997, win32, with Windows in dark mode.
- Runtime screenshot confirms the native title bar is dark and the form client background is exactly #202020.
- The Accent UI3Button remains readable and renders with #FF8279 fill, matching the expected Accent Light2 shade for Shane's current Windows accent palette.
- The screenshot also shows the Windows 11 rounded outer window corners.
- This visual run validates the dark-mode UI3Window baseline in win32. It does not by itself revalidate Click behavior, live theme switching, light mode, or the running win64 window.


### 2026-10-06, reference package source audit conclusions

- Audited the loose sources from the validated BETA 997 reference package laboratory and recycled the reusable findings into `Arrow-Loop/twinBASIC-Knowledge` commit `8c54824`.
- Corrected the earlier WinRT assumption: WinRT 1.7.0.159 defines `UIColorType` accent values but does not expose `UISettings`, `IUISettings`, `GetColorValue`, or `ColorValuesChanged`. tbUI3 therefore keeps its current registry/DWM accent path for now; any future supported UISettings path will require a minimal locally adapted and validated declaration set or a later package version that actually implements it.
- Selected the pointer-width-safe comctl32 `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` pattern independently present in WinRT and VBCCR18 as the implementation reference for UI3FormTheme live notifications. TBMANLIB 1.0.29.0's current subclass helper uses legacy `GetWindowLongW` / `SetWindowLongW` with `Long` pointers and will not be used as the win64-capable model.
- Identified VBCCR18 as strong prior art for later UserControl lifecycle, focus/keyboard, Default/Cancel, ambient-property, and persistence work; TwinTimerLib for later timer/animation plumbing; AutoCompleteLib for a future native-Edit-backed text control; and WinDevLib/WinDevLibImpl/OLEGuids as declaration/COM donors.
- Confirmed GdiPlus remains reference-only. Direct2D/DirectWrite remains tbUI3's rendering architecture.


### 2026-10-06, reference package laboratory

- Added `reference-packages/ReferencePackages.twinproj`, a dedicated package-archeology project containing the selected TWINSERV packages used to study implementation patterns without making them tbUI3 dependencies.
- Repaired WinDevLibImpl's missing embedded WinDevLib dependency by placing the exact WinDevLib 9.5.742 payload under `Packages/WinDevLibImpl/Packages/WinDevLib`, matching WinDevLibImpl's own local-package reference.
- Shane confirmed the repaired reference project runs in twinBASIC BETA 997.
- The validated snapshot contains WinRT 1.7.0.159, WinDevLib 9.5.742.0, WinDevLibImpl 1.4.41.742, TBMANLIB and selected TBMAN companions, TwinTimerLib 1.0.0.7, VBCCR18 1.8.0.125, AutoCompleteLib 1.0.0.3, OLEGuids 1.0.0.10, and GdiPlus 0.9.0.45.
- Documented the architectural rule that these packages are reference/source donors only. tbUI3 stays self-contained; permissively licensed implementation fragments may be selectively adapted and attributed rather than introducing package dependencies.

### 2026-10-06, form theme baseline (built, not yet run)

- Added `docs/2026-10-06-form-theme-spec.md`. It specifies a dark or light title bar that follows Windows, the WinUI window background, live theme switching, a drop-on `UI3FormTheme` control, and `UI3Window.Attach`.
- Added the public module `UI3Window` (commit f660d83), adapted from the Knowledge repo's `native-theme-reference.twin`:
  - `UI3ApplyWindowTheme` sets the form's title bar to match Windows dark or light mode, without forcing caption colours, and sets the form background to #202020 (dark) or #F3F3F3 (light).
  - Helpers `UI3IsDarkMode`, `UI3AccentColor` and `UI3WindowBackColor`, and a new `UI3AccentShade` enum.
  - The package version is now 1.0.0.1. The package builds in the IDE. It has not been run.
- Not yet built from the spec: the drop-on `UI3FormTheme` control, live switching through subclassing, and the cached theme.
- UI3Button's AmbientChanged check is now case-insensitive for "BackColor". Whether this fixes the repaint bug from the S2 checks is untested.
- Commit 94b621b repaired tbUI3Test's imported tbUI3 1.0.0.1 reference, refreshed its embedded package, and added `UI3ApplyWindowTheme Me` in Form_Load and Form_Activate. That repaired harness has not yet been visually/runtime validated by Shane, so UI3Window remains recorded as built but not run.

### 2026-10-06, spike S2 remaining checks

- Checked on Shane's PC (dark mode), with a temporary second UI3Button and a temporary form BackColor of #202020. Both were discarded afterwards and not saved.
- Resizing: a 260 x 80 px button keeps its 4 px corners, its border and a centred caption, at design time and at runtime.
- Standard style on the dark #202020 backdrop: a subtle lighter fill with white caption text, as in WinUI DefaultButtonStyle. Judged by eye; pixel colours were not measured.
- Standard style on the default light-grey form: the white caption is nearly invisible. This is expected: the dark-theme fills assume a dark backdrop, which is why S5 makes the test form dark.
- win64: after switching the IDE target to win64, the designer (now hosted by the 64-bit compiler) draws both buttons correctly, and a 64-bit run starts with no errors in the debug console. The running 64-bit window itself was not inspected.
- Bug found: after the form's BackColor changed, the win32 designer kept painting the controls over the old light-grey background until the compiler restarted. (Correction: UI3Button does handle `UserControl_AmbientChanged`, so the cause is still open.)
- Not checked: light mode (that needs Shane's Windows theme to be switched).

### 2026-10-06, spike S2 first run (win32)

- Built tbUI3 in the IDE (BETA 997, win32) and re-imported the package into tbUI3Test. The saved test project and its `src/` export are committed.
- Validated on Shane's PC (dark mode, accent #FF4343), win32 only:
  - Design time: UI3Button1 draws with rounded corners and the accent fill, with black caption text, instead of the S1 grey placeholder.
  - Runtime: the same rendering, and clicking the button still raises Click (the "Hello World" message box appeared).
- Not yet checked: 64-bit, resizing the control, Standard style, and light mode.
- Re-importing a package with the same name fails with "'tbUI3' conflicts with an existing imported package". Remove the old `[IMPORTED] tbUI3` reference first.

### 2026-10-06, repository set up

- The project moved to its own private repository, Arrow-Loop/tbUI3. Shane's PC created it with the S1 projects and plain-text exports in `src/`.
- Added the design notes in `docs/`, the `.twinproj` tools in `tools/`, `AGENTS.md`, and this CHANGELOG and ROADMAP.
- Arrow-Loop/WinUI3-twinBASIC is unchanged. It remains the archive of the June 2026 attempt.

### 2026-10-06, spike S2 (written, not yet built or run)

- UI3Button now draws through Direct2D and DirectWrite instead of GDI. It binds an `ID2D1DCRenderTarget` to the paint DC on every `UserControl_Paint`.
- It draws the rest state of WinUI's DefaultButtonStyle and AccentButtonStyle:
  - a 4 px rounded shape;
  - the 1 px elevation border gradient;
  - the WinUI fill and text colours for light and dark;
  - the caption in Segoe UI Variable Text 14 px (falls back to Segoe UI), with ButtonPadding 11,5,11,6.
- Values are taken from microsoft-ui-xaml at commit 8318c5bf (2026-10-05).
- New private module `UI3Direct2D.twin` holds:
  - the minimum Direct2D and DirectWrite interface declarations, adapted from fafalone's WinDevLib (CC0), with placeholder slots for unused vtable entries;
  - the shared factories;
  - small drawing helpers.
- New private module `UI3Theme.twin`:
  - Reads dark mode from `AppsUseLightTheme`.
  - Reads the accent palette from the `AccentPalette` registry value, then falls back to `DwmGetColorizationColor`, then to the default blue.
  - Holds the WinUI colour, radius, border and padding tokens, each with its source.
- If Direct2D fails, the button prints `D2D error &H...` instead of drawing, so a failed spike run shows the code.
- Tool: `tools/build-sources.mjs` replaces a project's Sources folder and leaves every other entry byte-identical.

### 2026-10-06, spike S1 (passed)

- Created the tbUI3 package project from the IDE's "Sample 7. Package" template.
- Added a placeholder UI3Button UserControl with Caption, Style and Click, and the UI3ButtonStyle enum.
- Created tbUI3Test from the twinBASIC-Knowledge seed.
- Shane checked all of this in the BETA 997 IDE:
  - the package built;
  - UI3Button appeared in the toolbox of tbUI3Test and dropped onto the form as UI3Button1;
  - Caption and Style persisted through a save;
  - Click ran at runtime.
