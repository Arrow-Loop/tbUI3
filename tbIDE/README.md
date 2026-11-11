# tbUI3 IDE: one add-in for designer tools and optional WinUI 3 styling

The single distributed add-in is **tbUI3IDE 1.3.0.2**, built from `tbUI3IDE/tbUI3IDE.twinproj` as **tbUI3IDE.dll**. It includes TabView adapter v8 and the IDE styling implementation. The established project ID and saved theme preference are retained through the rename.

Tab management and toolbar layout are independent of the theme. Both work with the additional-styling switch off and with the IDE's standard themes. The switch continues to control only the optional additional restyling.

**IDE Toolbar**, immediately below that switch, selects Classic (default), Hybrid or Ribbon. All modes follow the selected IDE theme. Version 1.2.0.2 removes the empty native toolbar dock slot in replacement modes, restores the previous Fluent shadow/card corners, and tightens group spacing and labels while retaining the native help in tooltips. Hybrid/Ribbon command areas are capped at 100px with a separate 26px tab strip; full-size buttons are 76px high, 50px standard/minimum width and 86px maximum width, including borders/padding. Hybrid retains the menu bar with Home, Code, Form, contextual MultiPage and Add-ins toolbar groups. Ribbon organizes live native commands by task: Home Clipboard/Editing; Insert; Code; Form; View; Project; Debug; Add-ins, plus vertical fullscreen File and upper quick access. Undo/Redo and main execution controls appear only in quick access. File hides the live workspace while open and restores it before native actions or close. Help is under File. Version 1.3.0.1 restores the previous toolbar surface and compatible text, light/dark hover/pressed effects, function-based full-size/stacked roles and an icon on every command button. Multiple full-size commands can share one group. The grid controls retain native behavior with themed labels/inputs. Version 1.3.0.2 separates the titlebar-colored tab strip from the toolbar card, uses indicator-only tab states, app-themed top-layer dropdowns, a scoped override for native forced-white grid inputs, proper size-aligned chevrons and a circled File Back arrow. See [command mapping](RIBBON_LAYOUT.md). File > Add-ins shows the native loaded-add-in list; BETA 1044 does not expose enable/disable commands. The first implementation uses horizontal overflow and Ctrl+F1 collapse; final Office adaptive behavior and visual acceptance remain open. See [ROADMAP.md](ROADMAP.md) and [validation evidence](../docs/validation/2026-11-11-ribbon-surfaces-popups.md).

### Migration from two add-ins

Install tbUI3IDE.dll in each architecture's addins folder. Remove the old **WinUI3IdeStyle.dll** and **TabViewDesigner.dll** from both `addins\win32` and `addins\win64` before loading the unified build, then restart the IDE. The standalone TabViewDesigner project has been retired. Its old DLL must not be distributed or loaded alongside this one. Existing theme preferences are retained.

This folder provides:

- Two IDE themes, **WinUI3 Dark** and **WinUI3 Light**, which set the IDE's colours, corners and borders through its own theme system.
- **tbUI3 IDE**, the single twinBASIC add-in: TabView page management plus optional styling for the parts the IDE theme cannot reach. The theme files still work independently.

The theme baseline targets twinBASIC **BETA 1043** and was checked against 1033, 1043 and 1044 (the add-in's stylesheet rules and the IDE plumbing it uses are unchanged between them; 1044 changed only Aurora's icon filters and the form designer's text selection). The themes need 1033 or later: older builds ignore the new dialog and panel properties, so dialogs stay in the IDE's defaults and panels lose their gaps.

| Path | Contents |
| --- | --- |
| `themes/WinUI3 Dark.theme` | Inherits the IDE's Dark theme and overrides 232 properties |
| `themes/WinUI3 Light.theme` | Inherits the IDE's Light theme and overrides 227 properties |
| `tools/build-themes.mjs` | Generates both theme files. Change colours there and rerun `node tools/build-themes.mjs themes` from this folder, rather than editing the .theme files by hand |
| `tbUI3IDE/tbUI3IDE.twinproj` | The single add-in project, including both features (Standard DLL referencing the IDE Extensibility Package) |
| `tbUI3IDE/src/` | Plain-text mirror of the add-in project |
| `tools/build-addin-project.mjs` | Built the first `tbUI3IDE.twinproj` from `src/`, using the IDE's add-in sample as the container. Once the IDE has saved the project, sync it like the repository's other projects |

`CHANGELOG.md` and `ROADMAP.md` in this folder track this work separately from the tbUI3 control library.

## Where the colours come from

Every value is a WinUI 3 theme resource from `Common_themeresources_any.xaml` in microsoft-ui-xaml, which is what WinUI Gallery renders with. The comment after each line names the token, for example `SolidBackgroundFillColorBase` (#202020 dark, #F3F3F3 light). Accent colours use the default Windows blue accent (#60CDFF on dark, #005FB8 on light), because a theme file is static and cannot read the Windows accent.

The layout follows WinUI Gallery:
- The window, menu, toolbars, tab strip and status bar sit on the base colour.
- Docked panels, including the code editor area, are rounded cards (8px corners) on a lighter layer (#282828 dark, #F9F9F9 light), with 4px gaps between them.
- Dialogs follow WinUI's ContentDialog: 8px corners, a content area, a darker or greyer button bar, 4px-rounded buttons with a focus ring, and an accent line under the selected tab.

## How twinBASIC themes work (verified in BETA 1015, 1033 and 1043)

- A theme is a `.theme` text file of `Name: value;` lines. `inherits: dark;` or `inherits: light;` at the top pulls in a built-in theme first.
- The IDE turns each property into a CSS variable (`Name` becomes `--themeName`) that its stylesheets use (`ide/styles.css`, `ide/formDesigner.css`, `ide/configEditor.css`, and some CSS built inside `ide/main.js`, such as the new front page). A value ending in `!important` is set as important.
- The parser splits on `; ` or `;` plus a line break, and on `: `. A missing semicolon silently drops that line and the next one (the shipped Dark and Light themes still do this to `DiagnosticsGroupFontSize` in 1033, which these themes set again).
- The theme name in the menu is the file name without `.theme`. The shipped Dark.theme lists every property except a few that only Aurora uses (`DialogButtonFocusBackColor`, `DialogNavBarBackColor`, `DialogNavButtonBackColorSelected`).
- The IDE reads themes from its own `themes` folder and from `%APPDATA%\twinBASIC\themes`. The second survives IDE upgrades.

## Install the themes

1. In File Explorer, type `%APPDATA%\twinBASIC\themes` in the address bar and press Enter.
2. Copy `WinUI3 Dark.theme` and `WinUI3 Light.theme` into that folder, replacing any older copies.
3. In twinBASIC, choose **Window > Theme > Reload from disk**.
4. Choose **Window > Theme > WinUI3 Dark** (or **WinUI3 Light**).

To remove them, switch back to Dark or Light and delete the two files.

## What to check

Open a project with a form and a module, then look at each item in both themes:

1. Title and menu bar: dark grey (#202020) in Dark, blue (#005FB8) in Light, with readable white text.
2. Docked panels (Project Explorer, Properties, Toolbox, the code area): rounded cards on a slightly darker or greyer background, with even gaps, plain headers and no coloured title strip. Drag a panel to a new dock position and resize a splitter: nothing should overflow or leave a gap.
3. Code tabs: unselected tabs blend into the strip, the selected tab matches the panel below it, hover shows a faint highlight.
4. Code editor: the text area and line-number gutter are one colour (#1C1C1C dark, white light), indent guides are faint, selected text is blue.
5. Status bar: the compiler badge is green, yellow or pink-red (Dark) or green, amber or red (Light), with rounded corners.
6. Problems panel: group headings are semibold and slightly smaller.
7. Form designer: the canvas shows a dot grid instead of stripes, the form has a soft shadow, the rulers are flat.
8. Properties panel: rows have subtle dividers, category rows are dark with white text.
9. Options dialog (Tools > Options or the IDE options button): rounded corners, dark content in WinUI3 Dark, readable text in every page, text boxes with a thin border, the focused button shows a ring.
10. New Project dialog (File > New Project): cards with rounded corners, the selected card outlined in blue, side rail readable.
11. A message box (for example, close a project with unsaved changes): rounded, with the button bar below a thin divider.
12. Right-click menus: light, with rounded bottom corners, in both themes.
13. Debug console: type `?` and part of a name, and check the suggestion pop-up is readable.
14. Toolbar Run and Stop icons are green and red.

## TabView management

The same add-in supplies +/New page creation, switching, deletion, reordering, page geometry protection, page toolbox hiding and diagnostics. These remain available with styling disabled. [Page command details](TabViewDesigner/README.md) and [architecture/lifecycle](ARCHITECTURE.md) describe the contract.

The earlier single-row toolbar is retained by Classic. Selectable Hybrid/Ribbon and the current task-based mapping are implemented as described above; remaining adaptive interaction work is tracked in ROADMAP.md.

## Optional IDE styling

### What it does

Rule of thumb: anything a theme property can set lives in the .theme files; the add-in only covers what the IDE hard-codes or what no theme property reaches (shapes, sizes, fonts, states). While the active theme's name starts with `WinUI3`, the add-in adds one stylesheet to the IDE page; when you switch to any other theme it empties it again. It covers what the themes cannot:

- Dialog buttons: the reference library's `.button` and `.button--primary` (WinUI's Button, with its 3px gradient elevation edge), (32px, 4px corners, 14px Segoe UI Variable, ContentDialog's 24px command area padding and 8px spacing), hover and pressed fills instead of the IDE's near-white `#ebeff5` hover, and the accept button as WinUI's accent button.
- Progress bar: WinUI's ProgressBar, a 3px accent indicator with 1.5px corners on a 1px `ControlStrongStrokeColorDefault` track, with the text above it, instead of the green gradient box.
- Menu bar and status bar hover: WinUI's MenuBarItem `SubtleFillColorSecondary` hover and `SubtleFillColorTertiary` selected fill, instead of fixed light grey with grey text.
- Menus and context menus: WinUI's MenuFlyout, capped at the window height and scrolling when longer. Dark in WinUI3 Dark (#2C2C2C), 8px corners, 32px items with 4px corners inset 4px from the edge, 14px Segoe UI Variable, icons in a 16px column, shortcut text muted and 12px, thin divider separators.
- Editor tabs: WinUI's TabView item shape. 8px top corners, 12px text that is muted until selected, thin separators between unselected tabs, a rounded close button. The IDE's tab height is kept.
- Drop-downs (Options, toolbar, code navigation, find panel): WinUI's ComboBox, with a chevron, 4px corners and dark open lists in WinUI3 Dark. The toolbar and code navigation ones stay compact.
- Check boxes and radio buttons in Options, project settings and the find panel: WinUI's CheckBox and RadioButton, 20px, accent when checked.
- Scroll bars outside the code editor: WinUI's thin scroll bar, 8px, no arrow buttons, a slim thumb that widens under the pointer.
- Tooltips: WinUI's ToolTip, 12px text on the flyout colour with 4px corners.
- Toolbar: WinUI's CommandBar (WinUI 3 has no Ribbon), drawn as a floating rounded card like the new Outlook's single-line ribbon. Each button is an AppBarButton with a rounded hover plate and a 16px Fluent UI System Icon in the text colour, except comment, uncomment, indent, outdent, align and size, which keep the IDE's own clearer glyphs; the grid button is an accent toggle; Run is green and Stop red. Buttons added by other add-ins keep their own image.
- IDE Options and Project Settings: a NavigationView list on the left and WinUI settings cards on the right. IDE Options' Yes / No become ToggleSwitches; Project Settings' No / Yes / Default become a row of radio buttons (the Default state cannot fit a two-state switch). Number fields get NumberBox spin buttons.
- Library References and Compiler Warnings: the references tables become a ListView in a card with a column header, WinUI check boxes, hyperlink pencils and a critical InfoBar for load errors; each compiler warning is a list row with its drop-down in a fixed column.
- Text boxes in dialogs and Options: WinUI's TextBox. 32px, 4px corners, a darker bottom edge at rest and a 2px accent bottom edge when focused. The property sheet's inputs are left alone.
- Panels: pane headers with 28px subtle command buttons and the IDE's English panel titles in sentence case (Project explorer, Debug console; restored when the add-in's switch is off); Project Explorer and the other trees as WinUI TreeViews with chevrons and rounded, inset rows.
- Its own switch in IDE Options: "Enable additional IDE theme styling via add-in", added under Colour Theme, on by default. Turning it off disables the add-in's stylesheet at once (the WinUI3 theme stays), and the choice is saved per user in the registry (`HKCU\Software\VB and VBA Program Settings\WinUI3IdeStyle\Options`, value `Enabled`). The switch and independent IDE Toolbar selector appear for all IDE themes.

The stylesheet's source is `tbUI3IDE/css/winui3-ide.css`, and each rule there names the WinUI resource it comes from. Menus, tabs, text boxes and the shared colour tokens are taken from Shane's WinUI HTML/CSS reference library (Arrow-Loop/twinBASIC-Knowledge, branch `feature/winui3-html-css-js-reference`, `reference/winui-html/winui-baseline.css` at commit 20b438a), remapped onto the IDE's own class names. After editing the .css file, run `node tbIDE/tools/build-addin-css.mjs`, which writes `src/Sources/WinUI3IdeCss.twin` (do not edit that file by hand), (it also reads `css/winui3-ide-icons.css`, which `node tbIDE/tools/build-toolbar-icons.mjs` writes from the icon map in that script), then `node tools/twinproj-src.mjs patch tbIDE/tbUI3IDE/tbUI3IDE.twinproj tbIDE/tbUI3IDE/src Sources/WinUI3IdeCss.twin`.

### How it works

The IDE is an HTML page. The add-in opens a hidden tool window, whose body sits in a shadow root on that page, and reaches the page through it: `RootDomElement.Properties.ownerDocument.defaultView.eval(...)` runs one JavaScript expression in the IDE page to add, update or remove a `<style id=winui3IdeStyleCss>` element at the end of `<head>`. (Writing through a property path, such as `getElementById(...).textContent = ...`, reports success without changing the page, so the add-in does not use it.) `Host.Themes.ActiveThemeName` decides when, checked at start-up, on project load, two seconds after each, and on every theme change. It logs each step to the Debug Console with the prefix `[WinUI3 IDE Style]`.

This is not a documented use of the add-in API. The official `ToolWindow.ApplyCss` only styles the tool window's own shadow root. A later BETA could block it, and the IDE's class names (`.msgBoxButton`, `.mainProgressBarOuter`, `.menuItem`) are not a stable contract, so the CSS needs re-checking per BETA.

### Build and install

1. Open `tbUI3IDE/tbUI3IDE.twinproj` in twinBASIC. When rebuilding, hold Shift while the project opens: the IDE loads add-ins whenever a project opens, so otherwise the old `tbUI3IDE.dll` is in use and cannot be overwritten.
2. Build it for win32 and again for win64 (switch the architecture in the toolbar). The build path is the sample's `${IdePath}\addins\${Architecture}\${ProjectName}.${FileExtension}`, so the DLLs land in the IDE's `addins\win32` and `addins\win64` folders.
3. Restart the IDE and open any project (add-ins load when a project opens, not at IDE start; holding Shift skips them). If the IDE lists add-ins in its options, its display name is tbUI3 IDE.
4. Switch to WinUI3 Dark or WinUI3 Light. The Debug Console should show `[WinUI3 IDE Style] stylesheet applied for WinUI3 Dark (... characters)`.
5. Commit the IDE-saved project through the normal repository workflow; regenerate its source mirrors from that canonical project.

To remove all add-in features, delete `tbUI3IDE.dll` from both `addins` folders and restart the IDE. To disable only styling, use the existing additional-styling setting.

### What to check

The consolidation gate also covers TabView add/delete/readd and page toolbox hiding with styling on and off, switching to a standard IDE theme, project reload and unload cleanup. Confirm only one set of page commands exists after removing the old DLL.

1. Debug Console shows `loaded`, then `theme is winui3 dark`, `stylesheet applied` and a `check:` line reading `288 of 288 rules parsed, ... body.darkMode = True` (False on WinUI3 Light) `, last element in head = #winui3IdeStyleCss`. Switching to Dark or Light shows `stylesheet removed`.
2. Any dialog (for example File > New Project): buttons are 32px tall with 4px corners and 14px text; the default button (Open, OK) is accent blue with dark text in WinUI3 Dark and white text in WinUI3 Light, with no white ring. Hovering a normal button gives a slightly lighter fill, not white; pressing it gives a slightly darker fill with dimmer text.
3. A long operation with the progress dialog (for example, a build): a thin blue bar on a thin grey line, with the text above it on the left.
4. Menu bar: hovering File, Edit and so on shows a faint highlight with the text unchanged; an open menu's item stays faintly highlighted.
5. Status bar items: hover is faint and the text keeps its colour.
6. Right-click in the code editor, and open File and a submenu: in WinUI3 Dark the menu is dark grey with white text, rounded corners, rounded item highlights inset from the edge, icons lined up in a column, muted shortcut text and thin separators. Disabled items are dim. Moving through the menu with the arrow keys shows the same faint highlight, not red.
7. Editor tabs: open three or more files. Tabs have rounded top corners and smaller text, unselected tab text is a little dimmer, thin lines separate unselected tabs, and the close button gets a rounded faint highlight on hover.
8. Tools > Options (or any page with text fields), and a rename or input box: text fields are 32px with rounded corners and a darker bottom line; clicking into one gives a blue bottom line. Check nothing in Options is cut off or overlaps because the fields are taller.
9. Drop-downs, check boxes, scroll bars and tooltips: the toolbar's win32 drop-down and the code editor's three drop-downs are dark with a thin chevron, and their open lists are dark; Options check boxes are 20px rounded squares that turn accent blue with a white or black tick; scroll bars in panels are thin with no arrows; hovering a variable while debugging shows a dark rounded tooltip.
10. Switching to Dark, Light or Classic puts everything back to the IDE's own look.
11. Toolbar: a rounded card with a soft shadow holding one row of 40px buttons with Fluent outline icons (the comment, indent, align and size buttons keep tB's own glyphs), faint rounded hover plates, a green Run and red Stop, greyed debug buttons when not running, the grid button filled with the accent colour when the grid is on, and thin divider lines between groups. Report any button that shows no icon.
12. Tools > IDE Options: "Enable additional IDE theme styling via add-in" sits under Colour Theme. Switching it off returns the IDE to the theme alone straight away and the Debug Console says `additional styling turned off in IDE Options (saved)`; restart the IDE and it stays off; switch it on again and everything comes back.
13. Restart the IDE: no empty "WinUI3 IDE Style" window should appear. If one does, report it.

If the Debug Console shows `could not apply the stylesheet:` or nothing at all, copy the line (or say it is missing) and report it with the architecture.

## Known limits

The IDE still hard-codes some colours in BETA 1043, so no theme can change them. The add-in covers the dialog buttons, the progress bar, the menu bar hover, menus and context menus, editor tabs and dialog text boxes; the rest is on the roadmap for it:

- Context menu text is fixed black, so without the add-in menus stay light in WinUI3 Dark. The code navigation drop-downs have fixed dark text, which the add-in overrides.
- The title text and caption buttons, and the dialog title text, are fixed white, so WinUI3 Light uses an accent-blue title bar and dialog header instead of WinUI's light ones.
- Menu bar hover is fixed light grey, the middle panel's header has a fixed grey edge, and the property category text is fixed white.
- A few Options pages still have fixed dark text (compiler warning lists, the not-signed-in warning, the filter bar), which may be hard to read on WinUI3 Dark's dark dialogs. The IDE's own Aurora theme has the same issue.
- Dialog buttons share one text colour, so the default or focused button shows WinUI's focus ring rather than an accent fill.
- The new front page draws a few details in fixed colours (search focus and card hover outlines in tB blue, a white version badge).
- There is no theme property for fonts, tab shape or control heights, so the IDE keeps Segoe UI (not Segoe UI Variable) and its own tab shape. Mica and acrylic are not possible.
- The toolbar has about 30 commands (one row needs about 1610px) and WinUI's overflow ("...") menu cannot be added with CSS, so its buttons are 36px wide rather than CommandBar's 68px and the bar wraps to a second row in narrow windows, as the IDE's own toolbar did.
- Code syntax colours are inherited unchanged from the IDE's Dark and Light themes.
