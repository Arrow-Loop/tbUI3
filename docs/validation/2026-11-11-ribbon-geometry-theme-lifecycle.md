# Ribbon geometry, theme lifecycle and menu elevation, 2026-11-11

Candidate: tbUI3IDE 1.3.0.4 on tbui3-dev. Runtime package 1.0.0.65, page adapter v8 and consumer project are unchanged.

## Implementation and authority

Current knowledge main AGENTS and the linked workflow/tooling/UI/CSS/packaging standards were rechecked. The project-specific tbui3-dev rule remains authoritative. Shane's supplied screenshots establish the preceding candidate's off-center Paste/Grid glyphs, oversized full-size columns, separate Grid groups, File rail gap, mixed Native Dark/WinUI3 styling and black File text on a dark background. His revised pixel measurements are the composition authority; no official WinUI Ribbon geometry is asserted.

Both Hybrid and Ribbon consume the same essential CSS. A large button now has a stretched one-column grid rather than the compact command's inherited left justification. Width is minimum-content with 50px minimum and 86px maximum. Word-boundary wrapping avoids filling the maximum width unnecessarily, while long words retain a bounded overflow fallback. The 100px command card includes 4px top padding; tabs remain separate at 26px. Divider pseudo-elements are exactly 89px rather than full group-height borders.

A 76px large button budgets 32px centered glyph canvas, 4px gap, 28px two-line caption box, 2px gap, 8px chevron and 2px borders. Existing 28px artwork is centered in the 32px canvas; smaller command canvases are 16px. The caption tracks are fixed across one-/two-line labels and dropdowns. Pixel declarations and CSS grid placement are checked through CSSOM; font ink bounds and rendered layout remain native acceptance observations.

Grid toggle and the original reparented options now share one Grid group in both replacement modes. The redundant Show Grid checkbox row remains hidden only when the real toggle is present. Zoom and Configuration retain accessible hidden captions and the same native select nodes/events. The File rail's negative 32px top margin and corresponding padding extend its surface to the top without covering the title controls or moving Back/content. File foreground uses the application text resource rather than DialogGeneralForeColor: the actual native Dark theme intentionally has light dialogs with black text.

## Theme transition cause and correction

Inspected the actual BETA 1044 main.js functions:

- Menu theme actions invoke changedIdeOptions followed by root.notifyChangedTheme.
- The original showIDEOptions save callback and current tips_showIDEOptions save path invoke changedIdeOptions without that notification.
- buildThemeData writes the next activeThemeData CSS variables but does not remove prior keys omitted by the next theme.

The missed notification explains why optional WinUI3 CSS could remain active after the native palette had already changed. The screenshot's mixed white dialog surfaces and WinUI foregrounds are consistent with that lifecycle failure.

MainModule's existing options timer now compares the actual Host.Themes.ActiveThemeName each second, regardless of preference dirtiness. The page-side root style/body class observer checks native getThemeName, immediately removes optional CSS when leaving WinUI3 and restores original panel titles. It records properties from native activeThemeData, removing an old omitted property only if its value and priority still match the prior record. Current native values and independently changed properties are retained. Both observers disconnect on unload.

InstallOption initializes saved Enabled/dirty only for a new page state. Reconciliation therefore preserves a newer unsaved toggle selection instead of replacing it with the previous registry value. ApplyStyle assigns media before attaching the sheet, using that page state or the saved initial value. ClearStyle consults the DOM rather than trusting a stale native boolean.

The actual emitted options expression is tested switching optional CSS off/on and restoring saved Off while TabView insertion still works. Reinitialization with stale saved On preserves pending Off/dirty and does not duplicate the settings row. Essential toolbar presentation and mode persistence remain separate from optional styling.

## Menu shadows

The shared light/dark optional stylesheet defines color-menu-shadow with the existing Fluent shadow4 composition: 0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14). Native menu/submenu surfaces and replacement dropdowns consume it. The requested subtle separation applies to both included WinUI3 themes; turning additional styling off removes that token/effect. This is a requested composition effect, not a claim of native MenuFlyout ThemeShadow equivalence. Existing .theme files need no changes.

## Measured evidence

- 99 JavaScript/DOM/CSSOM/native-protocol checks pass, with zero failures/skips: 53 toolbar and 46 page/combined-add-in cases.
- Six new regressions cover shared Hybrid/Ribbon centering/canvas/width/padding/divider rules and one Grid group; accessible hidden Configuration/Zoom captions; full-height rail/application foreground; native theme functions plus actual emitted page observer without host notification; unsaved toggle preservation/reconciliation wiring; and matching light/dark native/replacement shadows.
- The native theme test executes extracted BETA 1044 applyThemeData/buildThemeData/getThemeName functions with a declared two-palette fixture. It verifies optional sheet removal, native title restoration, stale-key removal and preservation of the next palette's light dialog values. It does not simulate a compiled host event/timer.
- Existing tests retain the actual BETA 1044 menu producers, 108 top-level descriptor inventory, asynchronous/lazy native command capture, forced-white grid field conflict, popup dismissal and page/selection protocols. Popover promotion remains a mocked browser lifecycle, not rendered acceptance.
- All 71 project mirrors match byte-for-byte: 27 runtime package, 37 consumer and 7 IDE add-in. Stable project/control/form IDs, full package/reference contents, page ownership and CRLF checks pass.
- Current official impexp.mjs blob 73547aba63c230f3ba7dd282d45ee71c03a5fadc exports all six IDE add-in files byte-for-byte; .meta is checked separately by the mirror validator. Generated CSS has 288 rules; generated toolbar embeds all 37 Fluent SVGs. No runtime package/consumer changes are included.

Reproduce with jsdom resolvable or TB_JSDOM_MODULE set, TB_IDE_MAIN_JS pointing to BETA 1044 main.js, and TB_IDE_DESIGNER_CSS pointing to formDesigner.css:

```text
node tbIDE/tools/build-addin-css.mjs
node tbIDE/tools/build-ide-toolbar.mjs
node tbIDE/tools/build-tabview-designer.mjs
node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs
node tools/validate-tabview-projects.mjs
```

Native visual acceptance of compact label widths/ink spacing, 89px dividers, rail/title geometry, shadows, rapid Options/menu theme transitions and saved preferences remains in ROADMAP.md. The prior browser URL-policy rejection was not bypassed. Existing automatic group collapse and Office keytips remain separate future work.
