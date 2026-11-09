# Changelog: tbIDE (WinUI 3 look for the twinBASIC IDE)

## 2026-11-09: TabView Designer rendering diagnostics

- Adapter v3 adds a read-only TabView diagnostics toolbar command that bypasses normal selection/edit gates, reporting supported API state, root/selected controls, real IDs and parents, fixture marker, pending work, computed canvas state and bitmap dimensions/checksums.
- Adapter reports append to tbUI3-tabview.log beside the consumer project and under TEMP; package 1.0.0.63 adds corresponding native paint-state/error lines. No raw bitmap or textbox contents are recorded.
- Twenty-two adapter/contract checks pass; packed add-in and source mirror match. Shane's purple-strip screenshot remains an open native IDE result. Styling sources are unchanged by this pass.

## 2026-11-09: TabView Designer initialization follow-up

- Adapter v2 waits for new control IDs, then sets Caption/PageOrder through native changeProperty before its final undo checkpoint. Initial insertion JSON alone is not treated as saved UserControl state.
- Added one-time initialization for the explicitly marked frmMultiPage fixture, with exact form-ID scoping and marker consumption. Later edits and other forms remain untouched. Selection diagnostics include selected name/class.
- Regenerated the embedded script and canonical add-in project. Twenty adapter/contract checks pass; the screenshot-driven correction's native IDE outcome remains to be observed.

## 2026-11-09: panel headers and Project Explorer TreeView

Next roadmap items, agreed with Shane: panel headers and the Project Explorer as a WinUI TreeView.

Changed (themes)
- PanelHeaderFontSize 14px (BodyStrong) and PanelHeaderPadding 4px 4px 4px 0 in both WinUI3 themes.

Changed (add-in)
- Panel headers are at least 40px tall. Their command buttons (search, settings, add, clear, close and the rest) are 28px subtle buttons in the secondary text colour with a 4px-corner hover fill, instead of faded 16px glyphs with a white outline on hover.
- Tree panels (Project Explorer and the other trees) follow the reference TreeView: rows inset 4px with 4px corners and at least 28px tall, a pressed fill, chevrons instead of plus / minus boxes, and text that keeps its colour on hover (the IDE turned it white, which disappeared in WinUI3 Light). The IDE's per-level indents, folder icons and file icons are unchanged. Trees with grid lines (call stack) keep full-width rows.

Validated: Chromium mock with the 1043 styles.css, codicons and both themes (288 of 288 rules parsed; previews panels-dark.png, panels-light.png, panels-before-dark.png). Not yet checked in the real IDE.

## 2026-11-09: on/off switch for the add-in in IDE Options

Shane asked for a toggle under Colour Theme that turns the add-in's extra styling on or off, on by default.

Added (add-in)
- "Enable additional IDE theme styling via add-in" under Colour Theme in IDE Options. A MutationObserver adds the row whenever the IDE builds the list (opening the dialog, filtering) and a WinUI3 theme is active. It reuses the dialog's own row and Yes / No classes, so it is a ToggleSwitch like the others.
- Switching it disables or re-enables the stylesheet at once through the style element's media attribute, without the dialog's Save Changes (as a WinUI ToggleSwitch does). A 1-second timer reads the change back and saves it with SaveSetting (HKCU, WinUI3IdeStyle\Options\Enabled); start-up reads it, defaulting to on.

Validated: the page script, extracted from MainModule.twin, parses and in a Chromium mock of IDE Options adds one row under Colour Theme, adds it again after the list is rebuilt, never twice, and switches the stylesheet off and on (media 'not all' / 'all'). Not yet compiled or run in the IDE: the twinBASIC side (SaveSetting, the timer) is untested.

## 2026-11-09: references tables, Shane's first look in 1043

Shane in 1043: "almost perfect". Left over: the Use ActiveX Controls tick boxes were still the IDE's, the ActiveX Fusion Mode drop-down ran into the Fusion: Async Events column, and the Available lists' unloaded symbols showed as bold blue "...".

Fixed (add-in)
- Every tick box in a references row (not only the Enabled column) is the WinUI CheckBox.
- The Fusion Mode drop-down is a 144px ComboBox centred in its 160px column, and the Async Events check box and its header share a 160px column.
- The click-to-load "..." symbol is an accent HyperlinkButton (the IDE's generic .clickable is bold blue).

Validated: Chromium mock with the fusion columns and an Available row (271 of 271 rules parsed). Not yet checked in the real IDE.

## 2026-11-09: Library References tables and Compiler Warnings list

Shane's screenshots of Project Settings: the references tables still had the IDE's grey grid look, and the Compiler Warnings drop-downs ran into the descriptions.

Fixed (add-in)
- Compiler Warnings: the combo box rule gave each warning's drop-down a 200px minimum inside the IDE's 110px column, so it spilled over the description. The drop-down now fills a 136px column, rows are a ListView (centred, divider between rows, neutral hover) in a bordered list, and the filter box is a TextBox.

Changed (add-in)
- Library References (Enabled Libraries, Available COM References, Available Packages) as a ListView in a bordered card with a column header: semibold 12px header with subtle column dividers, 36px rows with a divider and neutral hover, no grey grid lines, "in order of priority" no longer italic.
- The tick boxes (PNG divs, not inputs) drawn as the WinUI CheckBox; the drag grip uses the muted text colour.
- The symbol edit pencil and AUTO-FIX as HyperlinkButtons (new token --color-accent-link, AccentTextFillColorPrimary); a reference load error as a critical InfoBar instead of red on yellow.
- Import from file..., and the package and reference-type buttons, use the reference button; the available-list search box is a TextBox.
- The list colours themselves still come from the theme (DialogList* keys); only what the theme cannot reach is in the add-in.

Validated: Chromium mock with the IDE's 1043 styles.css, configEditor.css and injected tbps CSS plus both WinUI3 themes (266 of 266 rules parsed; previews settings-tables-dark/light.png and settings-tables-before-dark.png). Not yet checked in the real IDE.

## 2026-11-09: TextBox and ComboBox edges match the Gallery; menus clear the menu bar

Shane compared 1043 with the compiled WinUI Gallery (screenshots): text box and combo box borders showed as grey outlines, and the long Edit menu scrolled but covered the menu bar.

Fixed (add-in)
- TextBoxes, ComboBoxes and the settings filter boxes clip their fill to the padding box (WinUI's BackgroundSizing=InnerBorderEdge). The translucent 1px edge was painted over the fill, so it doubled up: 79 on a 66 fill in Shane's screenshot, where the Gallery draws 47 on a 45 fill over a 32 background. Measured after the fix in Chromium: edge 68 on a 65 fill over 54, top edge 72, text box bottom line 163, the same proportions as the Gallery.
- Menus are capped at the window height less 44px instead of 10px, so when the IDE moves a long menu up to fit it stops below the menu bar, as a WinUI MenuBar flyout does.

## 2026-11-09: settings dialogs, Shane's review fixes

Shane's comments on the previews: dark combo boxes not quite right, the toggle a little wonky, the restart notice should sit left of the switch, and the three-state Segmented control did not look right.

Changed (add-in)
- ComboBoxes everywhere: 6px top and bottom padding instead of WinUI's 5/7. Chromium centres the 18px line box differently from XAML, so the text sat 1px high.
- ToggleSwitch knob 10px from either outer edge (it was 9.5px off, 10.5px on, from the reference's 8.5px origin).
- IDE Options: "FULL IDE RESTART REQUIRED" sits left of the switch on the same line.
- Project Settings' No / Yes / Default: a horizontal RadioButtons group (reference radio) instead of a Segmented control.
- Project ID's refresh button now uses the same reference `.button` rules as the dialog buttons (masked elevation edge, hover and pressed fills); it had its own flat look.
- 233 rules, 51,577 characters.

Validated
- Chromium mocks of both dialogs, both themes: 233 of 233 rules parsed; switch clicks still toggle. Not yet checked in the real IDE.

## 2026-11-09: Options and Project Settings as WinUI settings pages

Shane (1043 screenshots of both dialogs): the dialogs should use NavigationView, ToggleSwitch instead of the `No | Yes` element, a correct ComboBox, and the reference's settings rows.

Added (add-in; 1043 builds both dialogs in script with their own injected stylesheets, `tips-style` with `tbis-*` classes for IDE Options and `tbps-style` with `tbps-*` for Project Settings, so no theme property reaches them)
- Left list as NavigationView items (as in the New / Open dialog): 36px, 4px corners, subtle hover, selected fill and accent indicator, muted counts. Filter box as a TextBox. The nav's grey edge is a divider.
- Groups as the reference's settings list: a 14px semibold header over one card (`CardBackgroundFillColorDefault`, `CardStrokeColorDefault`, 4px corners) of 64px rows, 600 titles, 12px muted descriptions, control on the right. The row divider stays the themes' `DialogConfigRowBorderBottom`.
- IDE Options' No / Yes as a ToggleSwitch (reference `.toggle`): 40x20 track, knob 12px (14px on hover, 17px wide pressed), accent when on, Off / On text to its left as in Windows Settings. The IDE's two segments stay as invisible click targets over the switch and its text; the selected one ignores the pointer, so a click always selects the other.
- Project Settings' No / Yes / Default as a Segmented control: its third state is "use the default", whose value only the script knows, so a two-state switch would lose it.
- ComboBoxes in both dialogs: the dialogs' `padding: 4px 6px !important` pushed the text under the chevron; WinUI padding now wins. Number fields as a NumberBox with inline chevron spin buttons. Refresh button as a Button, references tabs as a SelectorBar, the edition banner and "FULL IDE RESTART REQUIRED" as caution InfoBar colours, option errors as critical.
- New tokens `SystemFillColorCautionBackground` and `SystemFillColorCriticalBackground`. 229 rules, 50,898 characters.

Validated
- Chromium mocks of both dialogs built from the 1043 builder functions' class names, with each dialog's injected CSS (extracted from main.js), `configEditor.css` and both theme variable sets: 229 of 229 rules parsed. Clicking an off switch turns it on, clicking again turns it off, clicking its Off / On text toggles it. `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: separate TabView Designer candidate

- Added the separately installed TabViewDesigner add-in for tbUI3 1.0.0.61. WinUI3IdeStyle, its CSS and themes are unchanged.
- Implemented direct-parent insertion through the native BETA 1043 paste path, header hit-testing, designer-only page hiding, Properties reveal, delete/reorder commands, pending-work guards, undo requests and cleanup/recovery. Script generation embeds the adapter in the canonical project with Chr(34) quoting.
- Added regression checks, an optional actual-IDE paste-contract check, and TabViewDesigner/README.md. Full IDE-loop validation remains pending; evidence is in ../docs/validation/2026-11-09-tabview-candidate.md.

## 2026-11-09: disabled Preview button greys out

Shane's 1043 screenshot with the add-in loaded showed the toolbar, menus and New / Open dialog working (`163 of 163 rules parsed`), with Preview in red text while disabled in code view.

Fixed (add-in)
- A disabled Preview button now uses `TextFillColorDisabled` like every other disabled toolbar button. The IDE marks it disabled with a red background, which earlier passes turned into red text.

## 2026-11-09: long menus no longer run off the window

Shane: large menus (the Edit menu) were cut off by the window.

Fixed (add-in)
- Menus and context menus are capped at the window height less 10px and scroll, as WinUI's MenuFlyout does (it moves the flyout to fit and scrolls what is still too tall). The IDE already moves a menu up to fit, but a menu taller than the window ended up above the top edge, and its own max-height fallback is set without a unit, so it never applied. WinUI's 32px items made the IDE's longer menus taller than many windows.

Validated
- Chromium, 600px window, 30-item menu opened under the menu bar with the IDE's own positioning code: the menu sits at 7px to 597px and scrolls (before the fix it started above the window). 163 of 163 rules; `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: original glyphs for comment, indent, align and size

Shane: these buttons "need to probably stick with the original glyphs that tB used because they relay more information visually as to their function than the Fluent ones" (with a screenshot of comment, uncomment, indent, outdent, the four align and the four size buttons).

Changed (add-in)
- Those 12 buttons keep the IDE's own images and colour filters (16px, 19px for align and size, as the IDE draws them) inside the CommandBar button shape and hover states. Their Fluent SVGs are removed; 19 toolbar buttons still use Fluent icons.
- The exclusions use attribute selectors, not ids, so the rule's specificity stays below the IDE's `#menuBarPreview` width (an id-based first try made Preview and the theme button overlap in the mock).
- 163 rules, 40,478 characters.

Validated
- Chromium mock, both themes: 163 of 163 rules parsed; the 12 buttons show the IDE's glyphs; `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: toolbar card like the new Outlook's simplified ribbon

Shane pointed at the new Outlook's ribbon. That ribbon is web Fluent UI (Outlook runs in WebView2), not a WinUI 3 control, so its look carries over to the IDE's HTML directly. Shane agreed to the CSS-only version now and a tabbed ribbon as a roadmap idea.

Changed (add-in)
- The toolbar is a card floating on the window background: `CardBackgroundFillColorDefault` fill, `CardStrokeColorDefault` border, 8px corners and Fluent's shadow4, inset 4px from the edges. Group separators have 6px gaps either side. Buttons, icons and states are unchanged.
- 173 rules, 46,238 characters. The bar now needs about 1610px for one row.

Validated
- Same Chromium mock as the CommandBar entry, both themes: 173 of 173 rules parsed, `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: toolbar as a WinUI CommandBar with Fluent icons

Shane: the toolbar "needs to be restyled to look like whatever WinUI3's version of a Ribbon is and replace all the icons with their Fluent equivalents where possible." WinUI 3 has no Ribbon control (the Community Toolkit Labs Ribbon is experimental); its command surface is CommandBar, so the toolbar follows CommandBar, AppBarButton, AppBarToggleButton and AppBarSeparator (`CommandBar_themeresources.xaml`, `AppBarButton_themeresources.xaml`, reference `.command-bar`, `.appbar-button`, `.appbar-separator`).

Added (add-in; the toolbar's icon images and filters are hard-coded in `styles.css`, so no theme property reaches them)
- Every built-in toolbar button is an AppBarButton with collapsed label: 40px tall, 36px wide, 16px icon, a 4px-corner hover plate inset 6px 2px (`AppBarButtonInnerBorderMargin`), `SubtleFillColorSecondary` hover, `SubtleFillColorTertiary` press, `TextFillColorDisabled` when disabled. The IDE's image and colour filters are cleared.
- 31 icons replaced with Fluent UI System Icons (MIT, Microsoft), drawn as masks in the text colour. Run is `SystemFillColorSuccess` green and Stop `SystemFillColorCritical` red while enabled.
- The grid toggle is an AppBarToggleButton: accent fill with on-accent icon when on, instead of a white outline.
- Separators are 1px `DividerStrokeColorDefault` lines with 8px vertical margins. The two drop-downs are 32px ComboBoxes. Preview is a labelled AppBarButton.
- Buttons that other add-ins put on the toolbar (`addinButton-*`) keep their own image or caption and get only the shape, size and hover states.
- The toolbar panel's header padding is removed so the bar is 40px tall.
- New `tools/build-toolbar-icons.mjs` maps toolbar ids to Fluent icons and writes `css/winui3-ide-icons.css`; the 31 SVGs and Microsoft's MIT licence are in `WinUI3IdeStyle/icons/fluent/`. `build-addin-css.mjs` now reads both .css files.
- 173 rules, 45,911 characters.

Validated
- Chromium with 1043's `styles.css`, `formDesigner.css`, `codicon.css`, the toolbar markup from `main.htm` inside a panel header, both theme variable sets and a text-only add-in button: 173 of 173 rules parsed, every icon's mask resolves, the bar is 40px tall and one row at 1640px wide (it needs about 1530px; the IDE's own icons needed about 1160px, and narrower windows wrap to a second row as before). `twinproj-src.mjs compare` reports every entry the same. Not yet checked in the real IDE.

## 2026-11-09: New / Open Project dialog as a NavigationView

Shane: the New / Open dialog "needs to look like a NavigationView".

Changed (themes)
- `DialogNavButtonBackColorSelected` is `SubtleFillColorSecondary` (rgba(255,255,255,0.0588) dark, rgba(0,0,0,0.0353) light), the reference's `--color-neutral-selected` and NavigationView's selected item fill.

Added (add-in)
- The dialog (`#fp2root`, 1043) injects its own stylesheet with fixed colours, so the add-in's rules are prefixed `body #fp2root` and win whichever loads last.
- Left rail as NavigationView (reference `.nav-item`, `.nav-indicator`): 36px items with 4px corners inset 2px 4px, 16px icon in a 40px column, 14px regular label, subtle hover, selected fill and the 3x16 accent selection indicator; icons in the text colour; counts as muted caption text; divider instead of the fixed grey border.
- Search box as AutoSuggestBox: TextBox shape and states with the query glyph on the right.
- Version badge as a quiet caption tag instead of a white pill with black text.
- Template tiles as GridView items on cards: no blue hover border, shadow or brightening; `ControlFillColorSecondary` hover, `ControlFillColorTertiary` press, 2px accent border when selected. Card fill, border and radius still come from the themes.
- Recent rows as ListView items with the accent selection indicator and a subtle 24px remove button; search group titles as 14px semibold sentence case.
- 114 rules.

Validated
- Chromium with 1043's `styles.css`, `codicon.css`, the dialog's own injected CSS (extracted from main.js) and both theme variable sets, with the add-in's style element placed before the dialog's to prove order independence: 114 of 114 rules parsed; rail items 36px with the selected fill from the theme and the accent indicator; search box 32px; hovered card rgba(255,255,255,0.082) with no filter and its theme border; screenshots checked. Not yet run in the IDE.

## 2026-11-09: glyph colours

Shane spotted wrong-coloured glyphs on 1043 with the add-in loaded: the info icon in message boxes and the Theme icon in the Window menu.

Fixed (themes)
- `InfoBoxIconFilter`: the info icon is a white PNG that the inherited IDE Dark theme inverts to black. WinUI3 Dark now shows it at `TextFillColorSecondary` (`opacity(0.7725)`), WinUI3 Light inverts it to black at `TextFillColorSecondary` (`invert(1) opacity(0.6196)`).

Fixed (add-in, no theme property)
- The Theme menu glyph (`.codicon-symbol-color`) is hard-coded black with `!important`; it now takes the menu text colour.
- Panel header buttons (the `...` and close glyphs) turned black on a translucent white square when hovered; they now use WinUI's subtle button hover (`SubtleFillColorSecondary`, `TextFillColorPrimary`, 4px corners). 77 rules.

Validated
- Chromium with 1043's CSS: info icon filter as above in each theme; Theme glyph white (dark) and rgba(0,0,0,0.894) (light), matching its menu item; hovered panel button white on rgba(255,255,255,0.06) in dark with no outline.

## 2026-11-09: New Project Options dialog

Shane asked whether the themes can fix the New Project Options dialog (white Project Name box, native blue check boxes, grey-bordered drop-down) before the add-in loads.

Finding
- No. In 1043 that dialog's controls use no theme variables: the Project Name box is an `<input>` with no `type` attribute (so the IDE's `input[type="text"]` rules, and the add-in's, never matched it), the check boxes are native `.IDEoptionCheckbox` scaled to 1.2, and `.IDEoptionDropdown` has a hard-coded grey border. A theme value becomes a CSS variable inside the IDE's own declarations, so it cannot add rules. Only the add-in can reach them.

Fixed (add-in)
- `.IDEoptionValue input:not([type])` is now styled as a TextBox (rest fill from the add-in, since no theme property reaches it), and `input.IDEoptionCheckbox` as a CheckBox (the 1.2 scale removed). `select.IDEoptionDropdown` was already covered. 75 rules.

Validated
- Chromium with 1043's CSS on a mock of the dialog's markup (taken from `showNewProjectOptions` in main.js): Project Name 32px, rgba(255,255,255,0.06) with white text in dark and rgba(255,255,255,0.7) in light, 4px corners; check box 20px accent with no scale; drop-down styled.

## 2026-11-09: theme first, and theme colours aligned with the reference tokens

Shane's rule: anything a theme property can do belongs in the theme; the add-in only covers what the themes cannot. Every add-in rule was checked against the 1043 theme properties.

Changed (themes)
- Text boxes in Options and dialogs rest on `ControlFillColorDefault` (rgba(255,255,255,0.0588) dark, rgba(255,255,255,0.702) light) instead of `ControlFillColorInputActive`, matching the reference's `.text-field` rest state.
- Scroll bar thumbs use the reference's thumb colours: `TextFillColorTertiary` (0.5294 dark, 0.4471 light), and `TextFillColorSecondary` for the dialog thumb hover.
- Light tab hover is `LayerOnMicaBaseAltFillColorSecondary` #0A000000, the reference's `--color-tab-hover`.

Changed (add-in)
- The text box rule no longer sets the rest fill and text colour, and the tooltip rule no longer sets its fill and text colour; both now come from the themes. The simple input box (no theme property) keeps an add-in rest fill. 75 rules.

What stays in the add-in, because 1043 has no theme property for it: shapes, sizes, padding and fonts of every control; the dark menu (item text is hard-coded black); menu bar hover; progress bar; dialog button hover, pressed and accent default button (one text colour is shared by all buttons); the code navigation drop-downs' text (hard-coded #202020); text box hover, focus and bottom edge; check boxes and radio buttons; scroll bar width, arrows and hover for the main scroll bars; tooltip shape.

Validated
- Chromium with 1043's CSS: 75 of 75 rules parsed; text boxes rgba(255,255,255,0.06) dark and rgba(255,255,255,0.7) light at rest from the theme, focus unchanged; tooltip #2C2C2C and #F9F9F9 from the theme.

## 2026-11-09: themes: dialog button hover no longer turns white without the add-in

Shane noticed that before the add-in loads, hovering a dialog button in WinUI3 Dark turned it near-white with unreadable text.

Fixed
- The IDE hard-codes `.msgBoxButton:hover { background-color: #ebeff5 }`, which beats the theme's flat `DialogButtonsBackColor`. Aurora avoids it by using a gradient, which paints over the background colour. `DialogButtonsBackColor` and `DialogButtonFocusBackColor` are now single-colour gradients (#2D2D2D dark, #FBFBFB light), so the hover keeps the button's fill with the IDE's `brightness(1.3)` hover filter (#3A3A3A in dark). The add-in's own button rules still replace this when it is loaded.

Validated
- Chromium with 1043's `styles.css` and the theme variables only (no add-in): hovered buttons keep the gradient over the #EBEFF5 colour, with white text in dark and #1A1A1A in light.

## 2026-11-09: drop-downs, check boxes, scroll bars and tooltips from the reference

Shane confirmed the reference-based buttons are right on 1043 and asked to bring the rest of the UI in line.

Added (all from winui-baseline.css, commit 20b438a, mapped onto the IDE's own elements)
- Drop-downs as `.select-field` (ComboBox): padding 5px 32px 7px 12px, 32px, 4px corners, token fills for rest, hover and pressed, a 12px chevron 12px from the right in `TextFillColorSecondary` (an SVG, since a `select` cannot carry the reference's `::after` glyph), and `color-scheme` so the open list follows the theme. A `select` cannot carry the edge ring either, so the elevation border is a solid border with `ControlStrokeColorSecondary` on the top (dark) or bottom (light). Covers Options, the find panel, the web page zoom, the toolbar and the code navigation drop-downs; the last two stay compact. The code navigation drop-downs' hard-coded #202020 text is overridden, so they are dark in WinUI3 Dark.
- Check boxes and radio buttons as `.choice input` (CheckBox, RadioButton): 20px, 4px corners or round, `ControlAltFillColor` fills, accent when checked, a 12px tick drawn as an SVG mask in the shape of the CheckMark glyph (no dependency on the Segoe Fluent Icons font), radio dot 12px, 14px on hover, 10px pressed. Covers Options, project settings and the find panel's scope options.
- Scroll bars as the reference's `*::-webkit-scrollbar`: 8px, transparent track, no arrow buttons, pill thumb inset 3px that widens to 1px under the pointer. The thumb stays visible at rest (the reference hides it until its container is hovered, which in the IDE's nested panels would show every scroll bar at once). Monaco's own scroll bars are not affected.
- Tooltips (`#hoverTooltip`) as `.tool-tip`: padding 6px 9px 8px, 12px, 4px corners, flyout fill and border, max width 320px, no shadow.
- Tokens: `ControlAltFillColor` Secondary, Tertiary and Quarternary, `ControlStrongStrokeColorDisabled`, accent disabled colours, and the chevron image per theme.
- 74 rules.

Validated
- Chromium with 1043's `styles.css`, `configEditor.css` and both theme variable sets, with the CSS passed through the add-in's JavaScript string escaping and `window.eval` exactly as the add-in does: 74 of 74 rules parsed. Toolbar and code navigation drop-downs rgba(255,255,255,0.06) with white text and `color-scheme: dark` in WinUI3 Dark; Options drop-down 32px; checked box #60CDFF (dark) and #005FB8 (light) with the tick visible; tooltip #2C2C2C and #F9F9F9, 12px; scroll bars 8px. Screenshots checked. Not yet run in the IDE.

## 2026-11-09: dialog buttons from the reference's .button

Shane's first run of the menus, tabs and text boxes (`check: 49 of 49 rules parsed`) showed the dialog buttons were still the hand-built ones, not his reference library's.

Changed
- Dialog buttons now use the reference's `.button` and `.button--primary` rules (winui-baseline.css, commit 20b438a) instead of hand-composited colours. The fill is the translucent `ControlFillColorDefault`/`Secondary`/`Tertiary` tokens. The border is the reference's masked edge ring: the real border is transparent and a `::before` ring paints `ControlElevationBorderBrush` as a 3px gradient (lighter top in dark, darker bottom in light), keeping the 4px corners. Pressed flattens it to `ControlStrokeColorDefault`. The default button (`.buttonFocused`) is `.button--primary`: accent fill, `AccentControlElevationBorderBrush` ring, no ring when pressed.
- Added the tokens these rules need: `--color-control-active`, `--color-control-border-bottom`, the accent hover, pressed, text and border colours, `--brush-control-elevation` and `--brush-accent-elevation`. Accent hover and pressed are written as 90% and 80% alpha colours rather than the reference's `color-mix()`, in case the IDE's Chromium is older.
- 45 rules (the per-theme button rules collapsed into shared ones driven by tokens).

Known
- The New / Open Project dialog never marks a default button (the IDE only adds `.buttonFocused` in some dialogs), so its Open button stays a normal button. Making it accent would need the add-in to pick the button by caption or id; not done.

Validated
- Chromium with 1043's `styles.css` and both theme variable sets: 45 of 45 rules parsed; buttons 32px, 14px regular; dark rest rgba(255,255,255,0.06) with a #FFFFFF18 top edge fading to #FFFFFF12; Open #60CDFF with black text and a #00000023 bottom edge; light Open #005FB8 with white text and a #00000066 bottom edge. Screenshots checked against WinUI Gallery's Button page.

## 2026-11-09: menus, tabs and text boxes from the WinUI HTML/CSS reference

Shane shared his WinUI HTML/CSS reference library (Arrow-Loop/twinBASIC-Knowledge, branch `feature/winui3-html-css-js-reference`, `reference/winui-html`, commit 20b438a) so the add-in can reuse it instead of rebuilding WinUI controls from scratch.

Added
- `WinUI3IdeStyle/css/winui3-ide.css` is now the stylesheet's source, with the WinUI resource and reference rule each value comes from. `tools/build-addin-css.mjs` turns it into `src/Sources/WinUI3IdeCss.twin`: one rule per line, long rules split over several twinBASIC lines, `RuleCount` written as a number. It stops on double quotes, nested blocks such as `@media`, and selectors not prefixed with `body`.
- The reference's colour tokens (`--color-text`, `--color-control`, `--color-flyout`, `--color-divider` and so on) for light and dark, scoped to `body:not(.darkMode)` and `body.darkMode`.
- Menus and context menus as WinUI MenuFlyout, mapped from the reference's `.flyout-menu`: #2C2C2C (dark) or #F9F9F9 (light), 1px `SurfaceStrokeColorFlyout` border, 8px corners, 2px vertical padding; items 32px with 4px corners, inset 2px 4px, 14px Segoe UI Variable, icon column at 11px with text at 39px, `SubtleFillColorSecondary` hover, `SubtleFillColorTertiary` press. Shortcut text is muted 12px; disabled text uses `TextFillColorDisabled`; `<hr>` separators are 1px `DividerStrokeColorDefault` with 4px 6px margins. The IDE's red keyboard highlight (`.focusedMenuItem`) is replaced with the hover fill. This makes menus dark in WinUI3 Dark, which the theme alone cannot do (the IDE hard-codes black item text).
- Editor tabs shaped like the reference's `.tab-view__item`: 8px top corners, 8px left and 4px right padding, 12px regular text, `TextFillColorSecondary` until selected, 1px divider separators 8px from top and bottom between unselected tabs, and a 4px-cornered close button with a subtle hover.
- Text boxes in dialogs and Options as WinUI TextBox, from the reference's `.text-field` and `.text-control`: 32px, padding 5px 6px 6px 10px, 4px corners, `ControlFillColorDefault` with a `ControlStrongStrokeColorDefault` bottom edge, `ControlFillColorSecondary` hover, `ControlFillColorInputActive` with a 2px accent bottom edge when focused, disabled colours. Property sheet inputs are not touched.
- 49 rules in all (was 26).

Kept on purpose
- The IDE's tab height and strip layout are kept; the reference's 36px Edge-measured height and concave tab feet need DOM the IDE does not have.
- No acrylic blur or shadow on menus (the reference uses none either).
- Drop-down lists (`select`) in Options and the code navigation drop-downs are not restyled yet.

Validated
- In Chromium with 1043's `styles.css`, `configEditor.css`, `codicon.css` and both WinUI3 theme variable sets, on a mock of the IDE's menu, tab and Options markup: 49 of 49 rules parsed; menu #2C2C2C dark and #F9F9F9 light with 8px corners and 14px text; items 32px, hover rgba(255,255,255,0.06) dark; keyboard-focused item no longer red; separators 1px; tabs 12px with 8px corners and muted text until selected; text boxes 32px with a 2px #60CDFF (dark) or #005FB8 (light) bottom edge when focused. The dialog button test from the previous entry still gives the same values.
- `tools/twinproj-src.mjs compare` reports all four project entries the same as `src/`.
- Not yet run in the IDE.

## 2026-11-09: dialog buttons follow WinUI Button and ContentDialog

Shane's first working run on 1043: the add-in's stylesheet is on the page (`check: 18 of 18 rules parsed`) and button hovers are right, but the buttons did not look like WinUI's (his side-by-side with WinUI Gallery's Button page).

Changed
- Dialog buttons take WinUI's Button shape: 32px tall, `ButtonPadding` 11,5,11,6, 4px corners, 14px Segoe UI Variable (`ContentControlThemeFontFamily`), regular weight, no margin. The command area uses `ContentDialogPadding` 24 and `ContentDialogButtonSpacing` 8.
- The button Enter presses (`.buttonFocused`, the dialog's accept button) is drawn as WinUI's AccentButtonStyle, the way ContentDialog draws its default button: accent fill (#60CDFF dark, #005FB8 light), on-accent text, the accent elevation border, 90% and 80% accent on hover and press. The IDE's white focus ring around it is removed, since WinUI shows no ring for default status.
- Pressed text and border corrected to current microsoft-ui-xaml values (`TextFillColorSecondary` #C5FFFFFF and #9E000000, `ControlStrokeColorDefault` #0F000000 light); the earlier values were from an older WinUI release.
- `RuleCount` is now counted from the stylesheet (26 rules).

Kept on purpose
- WinUI stretches ContentDialog's buttons into equal columns. The IDE's own layout (Browse on the left, Open and Cancel on the right, minimum widths) is kept.
- The accent is the default Windows blue. Shane's Windows accent is different; reading the system accent is an exploratory roadmap item.

Validated
- In Chromium with 1043's `styles.css` and the WinUI3 Dark theme variables: Browse and Cancel 32px, #2D2D2D, white 14px text, border top rgba(255,255,255,0.094) and others 0.07; Open #60CDFF with black text and a rgba(0,0,0,0.137) bottom border, no outline; Cancel hover #323232.

## 2026-11-09: all page writes through window.eval

Fixed
- The stylesheet was never on the IDE page. Shane's run of the eval check reported `no style element on the page` right after `updated the existing style element`: on BETA 1033/1043, a write through a property path (`ownerDocument.getElementById(id).textContent = css`) reports success even when `getElementById` returns null, so `SetStyleText` always returned True and the `insertAdjacentHTML` branch never ran. The earlier `stylesheet removed` line was the same false success.
- The add-in now adds, updates and removes its `<style>` element with one `window.eval` call each (the route the designer bridge probe proved), passing the CSS as an escaped single-quoted JavaScript string, and logs what the page returned.

Validated
- The exact apply, check and remove scripts the add-in builds, run in Chromium against 1043's `styles.css`: `added the style element`, `updated the style element`, `18 of 18 rules parsed, 1940 characters, body.darkMode = true, selected menu item background = rgba(255, 255, 255, 0.043)`, `stylesheet removed`.

## 2026-11-09: page check through window.eval

Changed
- The `check:` read-back now runs one JavaScript expression through `ownerDocument.defaultView.eval`, the route the designer bridge probe proved on 1043. It also moves the style element to the end of `<head>` on every apply, and tests one rule for real: a temporary hidden `.menuItem.isMenuItemSelected` element's computed background (rgba(255, 255, 255, 0.043) when the add-in's rule wins in WinUI3 Dark).

Found
- Shane's run with the two-second re-check: `updated the existing style element` and `stylesheet applied (1940 characters)` succeed, but reading values back through property paths (`getElementById(...).sheet.cssRules.length`) fails with &H80004005 Unspecified error, and the menu highlight still looked like the IDE's own, so whether the rules take effect is still open.

Validated
- The check expression run in Chromium on a mock page with 1043's `styles.css` and the add-in's CSS returns `18 of 18 rules parsed, 1921 characters, body.darkMode = true, selected menu item background = rgba(255, 255, 255, 0.043)`.

## 2026-11-09: re-check two seconds after loading

Changed
- The add-in re-checks the theme and re-applies its stylesheet two seconds after start-up and after each project load, using the package's `AddinTimer`. Shane found the Debug Console empty after opening a project with the add-in and a WinUI3 theme loaded: in 1043 the IDE loads add-ins, then restores the project's state, and the console can be cleared in between (`clearDebugConsole`), so the first lines were lost and whether the stylesheet was applied at that point could not be seen.

## 2026-11-09: detailed Debug Console log

Changed
- The add-in now logs its architecture and the IDE compiler version on load; the reason, theme name and theme group for every check (start-up, project loaded, theme changed, with the event's own value); each step (tool window created, style element added or updated); and, after applying, a read-back from the IDE page: rules parsed out of the expected 18, whether `body.darkMode` is set, and the id of the last element in `<head>`. Failures name the step and the error number. Asked for by Shane.

## 2026-11-09: add-in reads the theme name on theme changes

Fixed
- `Host_OnChangedTheme` receives only the theme group (`dark` or `light`; 1043's `notifyChangedTheme` sends `getBaseThemeName()`), so switching to WinUI3 Dark logged `theme is dark` and never applied the stylesheet. The add-in now ignores that argument and reads `Host.Themes.ActiveThemeName`.

Validated
- Shane's log after switching to Dark showed `stylesheet removed`, which only happens after the stylesheet element was added, so injecting the stylesheet into the IDE page works on BETA 1043 (win32).

## 2026-11-09: add-in matches the theme name without case

Fixed
- Shane's run on BETA 1043 showed the add-in loads (`[WinUI3 IDE Style] loaded`) but the IDE reports the active theme as `winui3 dark`, in lower case, so the case-sensitive `WinUI3` prefix check never matched and no stylesheet was applied. The check now ignores case.

Validated
- Confirmed on Shane's PC (BETA 1043, win32 compiler): the add-in loads when a project opens and receives the theme name. Styling itself is not yet confirmed.

## 2026-11-09: BETA 1043

Changed
- Both themes target BETA 1043 (Dark 232 properties, Light 227). Added 1043's three new properties: `DialogImportListHoverBackColor` and `DialogImportListHoverForeColor` (the import dialog's list hover, WinUI ListViewItem `SubtleFillColorSecondary` hover with `TextFillColorPrimary` text) and `DialogTickForeColor` (dialog check marks, `TextFillColorPrimary`). Without them WinUI3 Dark inherited black check marks and a near-white hover with black text on its dark dialogs.
- Removed `FrontPageListBackground`, which no BETA since 1033 uses.

Findings (BETA 1043's `ide/` against 1033's)
- 1043 adds those three properties and removes none. `applyThemeData` is unchanged. `formDesigner.css`, `configEditor.css` and `main.htm` are unchanged.
- Every selector the add-in targets is still in `styles.css`, and the tool window and property-walking code it relies on (`createToolWindowById`, shadow root, `toolWindowElementGetProperty`, `toolWindowElementSetProperty`) and add-in loading on project open are still in `main.js`.

Validated
- Both files parse with 1043's `applyThemeData` (copied): no dropped lines of ours. Every value passes Chromium's `CSS.supports` for its property against 1043's stylesheets, apart from the same main.js-only properties and indent-guide colours as before.
- Not yet tested inside the IDE.

## 2026-11-09: add-in logs when it loads

Changed
- `WinUI3IdeStyle` now prints `[WinUI3 IDE Style] loaded` when the IDE loads it and `theme is <name>` for the active theme and each theme change. Before, it printed nothing unless a WinUI3 theme was active, so on Dark or Light there was no way to tell whether it had loaded.

Found
- Shane's first run (BETA 1043): with a project open and the Dark theme, other add-ins' buttons (Global Search, Designer probe) appear, but the Add-ins menu still says "no addins loaded" and the add-in printed nothing, which this change makes testable. The themes target 1033 and have not been re-checked against 1043.


## 2026-10-30: moved into tbUI3, WinUI3 IDE Style add-in spike

Added
- This `tbIDE/` folder in tbUI3, holding the two themes and their generator (moved from the project's shared files; regenerating gives byte-identical .theme files) and the new add-in.
- `WinUI3IdeStyle` add-in spike, written in twinBASIC against the IDE Extensibility Package (`tbIDE`). It adds one stylesheet to the IDE page while a theme whose name starts with `WinUI3` is active and empties it for any other theme. The stylesheet has 18 rules for WinUI Button hover and pressed states on dialog buttons, a WinUI ProgressBar for the progress dialog, and WinUI MenuBarItem hover on the menu and status bars. Values come from microsoft-ui-xaml `Button_themeresources.xaml`, `ProgressBar_themeresources.xaml` and `MenuBar_themeresources.xaml` (main branch, read 2026-10-30).
- `tools/build-addin-project.mjs`, which built the first `WinUI3IdeStyle.twinproj` from `src/` using the IDE's Sample 11 add-in project as the binary container.

Findings (from BETA 1033's `ide/main.js`)
- An add-in tool window's body is in a shadow root attached to an element on the main IDE page, so `ownerDocument` from its `RootDomElement` is the IDE page.
- `toolWindowElementGetProperty` and `toolWindowElementSetProperty` walk any property path from the element and call functions along the way. (Superseded 2026-11-09: in practice, writes through such a path report success without changing the page; use `ownerDocument.defaultView.eval`.)

Validated
- `twinproj-src.mjs compare` shows the built project and `src/` match (4 of 4 files the same).
- The 18 rules parse in Chromium and, layered on BETA 1033's `styles.css` in a mock page, win over the IDE's rules in both dark and light: hovered dialog button #323232 (dark) and #F6F6F6 (light) with no filter, progress indicator 3px at #60CDFF or #005FB8 on a 1px track, menu fills as listed.
- Not yet compiled or run. Shane builds it in the IDE (win32 and win64) using the check list in README.md.


## 2026-10-30: BETA 1033, after Shane's first look

Fixed
- New Project cards: every card had a blue outline, because 1033 draws all cards with `FrontPageSelectedItemBorder`. It is now a faint stroke, so only the selected card (fixed white border and blue outline) stands out.
- WinUI3 Dark progress bar track is dark (#2D2D2D) with white text instead of white.

Found (hard-coded in 1033, not reachable by a theme)
- Dialog button hover is a fixed near-white `#ebeff5`, which is why hovers flash white in WinUI3 Dark.
- The progress bar fill is a fixed green gradient with a white text glow and a grey outline.
- Panel headers are fixed bold.

## 2026-10-30: BETA 1033

Changed
- Both themes now target BETA 1033 (Dark 228 properties, Light 225).
- Dialogs follow WinUI's ContentDialog using 1033's new dialog properties: 8px corners, SurfaceStroke border, content and command-area colours, 4px-rounded buttons with elevation borders and a focus ring, accent tab underline, themed text inputs, lists, nav rail and dialog scrollbars. WinUI3 Dark's dialogs are now dark (previously forced light).
- Docked panels are rounded cards: `DockContainerBorderRadius` 8px, `DockContainerMargin` 2px (4px gaps), a faint outline, layer background; `DockBorder` and the panel borders are now 0.
- Code editor text area set with the new `MonacoBackground` (#1C1C1C dark, #FFFFFF light), and the gutter matches it.
- New Project front page: rounded cards, accent selected border and icon colour.
- Removed the `Light_scroll*` lines, which 1033 dropped in favour of `DialogScroll*`.

Findings (from twinBASIC BETA 1033's `ide/main.js` and stylesheets)
- 1033 adds 51 theme properties (dialogs, modal border and radius, dock container radius, margin and outline, `MonacoBackground`, progress bar, front page, tick icons) and removes 3. The theme parser is unchanged.
- Still hard-coded in 1033: context menu item text, code navigation drop-down text, title and dialog title text, menu bar hover, property category text, and a few Options-page texts.
- The new front page builds its CSS in `main.js` and reads `DialogNavBarBackColor`, `DialogNavButtonBackColorSelected`, `FrontPageIconColor` and `FrontPageSelectedItemBorder` there. `FrontPageListBackground` is no longer used.

Validated
- Both files parse with a copy of 1033's `applyThemeData`: no dropped lines; every property is used by 1033's CSS or main.js.
- Every value passes Chromium's `CSS.supports` for its CSS property, except the six used only in main.js-built CSS and the two indent-guide colours, which were checked by hand.
- Not yet tested inside the IDE.

## 2026-10-20

Added
- `themes/WinUI3 Dark.theme` (inherits Dark, 182 properties) and `themes/WinUI3 Light.theme` (inherits Light, 180 properties), using WinUI 3 colour tokens from `Common_themeresources_any.xaml` with the default blue accent.
- `tools/build-themes.mjs`, which generates both files with a token comment on each line and refuses values the IDE parser would mangle.
- `README.md` with how IDE themes work, install steps, a check list and known limits.

Findings (from twinBASIC BETA 1015's `ide/main.js` and stylesheets)
- Each theme property becomes a `--theme<Name>` CSS variable. Themes load from the IDE's `themes` folder and from `%APPDATA%\twinBASIC\themes`.
- Context menu item text, code navigation drop-down text, dialog contents, title text, caption buttons and property category text are hard-coded, which is why some surfaces stay light or dark regardless of theme.
- The shipped Dark and Light themes lose `DiagnosticsGroupFontSize` and `DiagnosticsGroupFontWeight` to a missing semicolon; both new themes set them again.
- The shipped Light theme draws debug console suggestions in near-white text on a near-white pop-up (`GeneralTextColorProminent`); WinUI3 Light fixes that.

Validated
- Both files parse with a copy of the IDE's own `applyThemeData` parser: no dropped lines, and every property name exists in the shipped themes.
- Every value passes Chromium's `CSS.supports` for the CSS property it feeds (the two indent-guide colours are used inside a larger `box-shadow`, so they were checked by hand).
- Not yet tested inside the IDE. Shane's check on his PC is pending.
