# Changelog: tbIDE (WinUI 3 look for the twinBASIC IDE)

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
