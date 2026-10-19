### 1.0.0.32
- Undoes 1.0.0.31's sibling clipping on the picker chrome, which stopped the chrome painting at all.
- Opening the picker no longer touches the search box or grid: they are only hidden and shown again when you switch tabs. The tab strip and buttons still repaint without erasing first.

### 1.0.0.31
- Fixes flicker in the icon picker: the chrome now repaints without erasing first, and no longer paints over the search box and grid (it clips to them).
- Re-arms the search box's dark colours whenever the Segoe Fluent tab shows it, for the light search box seen on first open in 1.0.0.30.

### 1.0.0.30
- The icon picker has a tab strip across the top (Segoe Fluent, Fluent UI System, Gallery, Setup), drawn like WinUI's SelectorBar.
- New Setup tab installs, updates, reinstalls and removes the tbUI3 icon library in `%LOCALAPPDATA%\tbUI3`. It downloads the release named by the Arrow-Loop/tbUI3-Libraries manifest, checks its size and SHA-256, unpacks it with Windows' `tar.exe` and checks the library's SHA-256 before moving it into place. The Fluent UI System and Gallery tabs show whether the library is installed and offer a one-click install; browsing them comes later.
- The property dialog's OK/Cancel/Apply buttons and the picker's new buttons share one WinUI Button drawing routine (`DrawStandardButton`), with no visual change intended.

### 1.0.0.29
- Removed the 1.0.0.26 to 1.0.0.28 spike code and test resources. No behaviour change otherwise.

### 1.0.0.28
- Spike: also reads resources through a `Const ... = LoadResDataInternal(...)`, the form twinBASIC's VB package uses, plus a 1.6 MB random `tbUI3SpikeBig.bin` to measure whether such a constant ends up in built EXEs.

### 1.0.0.27
- Spike: also tries `LoadResDataInternal`, the hidden runtime function twinBASIC's VB package and IDE add-ins use to read their own resources, alongside `LoadResData`.

### 1.0.0.26
- Temporary spike build for the icon galleries: `UI3Spike` reports in message boxes whether tbUI3 can read its own embedded resource (`Resources/OTHER/tbUI3Spike.txt`) and whether a Byte array saved by UI3Button survives Save and reopen. Remove before release.

### 1.0.0.25
- **Breaking:** `UI3Icon` now covers all 1,533 Segoe Fluent Icons glyphs the WinUI Gallery lists, named as the Gallery names them, and a value is the glyph's code point (as in WinUI's `FontIcon.Glyph`). It used to be WinUI's 197-value `Symbol` enum, converted through icon.cpp's table; that table is gone. Some names changed (for example `Find` is now `ui3IconSearch`, `Setting` is `ui3IconSettings`), and saved numeric values from earlier builds point at different glyphs, so re-pick icons on existing forms.
- The icon picker searches the Gallery's tags too (for example "hamburger"), labels the code row Value, and notes glyphs that Segoe MDL2 Assets lacks. When only Segoe MDL2 Assets is installed, those 127 glyphs are left out of the picker.

### 1.0.0.24
- The Properties dialog now opens centred in the work area of the monitor showing the IDE, instead of at the top-left of the screen. It is centred once, when tbUI3 first skins the sheet.

### 1.0.0.23
- Project settings update (Shane) so the package sorts where it is easy to find in the IDE's package picker.

### 1.0.0.22
- The skinned OK/Cancel/Apply buttons now repaint after `WM_UPDATEUISTATE`, `BM_SETSTYLE` and `WM_SETTEXT`. The native button draws its caption and mnemonic underline straight to the screen on those messages, which left a stray underline under the disabled Apply button.

### 1.0.0.21
- The PropertySheet skin now attaches only to the real PropertySheet (the window with the SysTabControl32), found structurally from the page, and is never swapped back to the page's own window. In 1.0.0.17 to 1.0.0.20 every page repaint re-ran a GetAncestor lookup that returned the page itself, which detached the dark tab and button skin right after it was applied.
- The search-box colour hooks are armed separately, as soon as the page exists.
- The diagnostic log is off (PROPERTY_PAGE_LOG_ENABLED in UI3Window).

### 1.0.0.20
- Corrected the private `WM_APP` constant to `&H8000&`. BETA 997 warned that bare `&H8000` was being interpreted as the 16-bit Integer value -32768 before widening, so the deferred PropertySheet-promotion message could use the wrong 32-bit message ID.
- No other behavior changed in this pass.

### 1.0.0.19
- Structural PropertySheet promotion is now deferred with a private posted message instead of attaching the host/tab/button subclasses from inside the page's `WM_WINDOWPOSCHANGED` subclass callback.
- This lets the native move/subclass frame unwind before tbUI3 attaches its paint skin to the real outer PropertySheet and its children, avoiding a re-entrant subclass-attachment path that left the native light tab/button chrome visible in 1.0.0.18.
- The diagnostic log now records success/failure for each `SetWindowSubclass` call on the promoted host, tab and action buttons.
- No page/tab geometry, TextBox painting, or designer-persistence bridge changes were made.

### 1.0.0.18
- PropertySheet discovery no longer depends on GA_ROOT/GA_ROOTOWNER after the page has moved. After the real `ThunderPropertyPageDC` receives `WM_WINDOWPOSCHANGED`, tbUI3 walks its live `GetParent` chain and selects the first ancestor that directly contains a `SysTabControl32` child.
- When that structural PropertySheet ancestor is found, the existing skin is promoted from the temporary page HWND to the real outer PropertySheet. The diagnostic log records the promotion and a post-promotion snapshot.
- The working ThunderTextBox color/erase handling, native tab metrics, and icon persistence bridge are unchanged.

### 1.0.0.17
- PropertySheet host discovery is now retried from `picChrome_Paint`, not only during the PropertyPage's early theme setup.
- BETA 997 creates/paints the top-level `ThunderPropertyPageDC` before inserting it into the outer PropertySheet. The first chrome paint after that insertion now re-runs the existing `GA_ROOTOWNER` lookup so the skin can upgrade from the early page HWND to the actual owning `#32770` PropertySheet and recover its `SysTabControl32`.
- No tab/page geometry, TextBox painting, or designer-persistence bridge behavior changed in this pass.

### 1.0.0.16
- Fixed PropertySheet host discovery for the icon picker. The 1.0.0.15 diagnostic log proved `GetAncestor(..., GA_ROOT)` was resolving only to the top-level `ThunderPropertyPageDC`, so tbUI3 never found the outer `#32770` PropertySheet or its `SysTabControl32` at all.
- Host discovery now uses `GA_ROOTOWNER`, which follows the owned-window chain to the actual PropertySheet host. This should restore access to the real tab/button shell while leaving the page body and designer persistence bridge untouched.
- No additional tab geometry changes were made in this pass.

### 1.0.0.15
- PropertyPage tab skin now leaves the native BETA 997 tab-item metrics alone and paints within the rectangle the host actually reserved, avoiding the post-resize overlap that clipped the Icon tab until Apply forced a native relayout.
- The confirmed ThunderTextBox HWND now handles WM_ERASEBKGND with the same persistent themed brush used by its ThunderPropertyPageDC WM_CTLCOLOREDIT route, and repaints on focus transitions. This is a focused attempt to stop the classic white edit fill from reappearing.
- The 1.0.0.14 diagnostic probe remains enabled for one more validation pass. No manual page-dialog movement or designer-persistence bridge changes were made.

# tbUI3 changelog

Pre-release spike builds. The full history is kept in the project repository CHANGELOG.md.

- 2026-10-07 1.0.0.14 candidate: surgical follow-up using the 1.0.0.13 HWND probe. The confirmed WM_CTLCOLOREDIT route is ThunderPropertyPageDC -> ThunderTextBox, so the diagnostic ancestor subclass now returns a persistent tbUI3 light/dark TextBox brush and text color only for that exact message/child pair. No page/tab geometry change is attempted. The same probe now logs WM_COMMAND Apply before/after default handling plus WM_SIZE and WM_WINDOWPOSCHANGED snapshots for the host, SysTabControl32, inner page dialog and ThunderPropertyPageDC so the native post-Apply layout transition can be reproduced from evidence. Not yet built/run.
- 2026-10-07 1.0.0.13 diagnostic rollback: built/run in win32 by Shane. The log confirmed `txtSearch.hWnd` is the actual `ThunderTextBox` (not a nested EDIT), its parent is `ThunderPropertyPageDC`, and that parent receives `WM_CTLCOLOREDIT` with the textbox HWND as `lParam`. The runtime screenshots also showed that clicking Apply causes the native page to shift downward enough for the full enlarged Icon tab to become visible. This evidence is the basis for 1.0.0.14.
- 2026-10-07 1.0.0.12 candidate: corrective follow-up after 1.0.0.11 made the PropertyPage geometry worse. The TCM_ADJUSTRECT page relocation is removed; the real page now moves down only by its measured overlap with the enlarged tab item. Native Edit theming now resolves the actual inner EDIT HWND (including one/two-level wrapper cases) and subclasses that EDIT's real parent for WM_CTLCOLOREDIT instead of assuming txtSearch.hWnd itself is the control that sends the color request. This specifically targets the persistent white search interior while avoiding the large white host/page band seen in 1.0.0.11. Not yet built/run.
- 2026-10-07 1.0.0.11 candidate: follow-up to Shane's 1.0.0.10 runtime review. The native PropertyPage itself is now subclassed only to answer WM_CTLCOLOREDIT for txtSearch, supplying the tbUI3 dark/light Edit brush/text color on every native repaint so clicking the icon grid should no longer make the search interior flash white. The real PropertyPage HWND is also moved/resized to the SysTabControl32 display rectangle returned after the 100x32-DIP WinUI TabViewItem sizing, targeting the still-clipped Icon tab. UI3IconPage responds to PropertyPage_Resize by re-laying out its child surfaces. Fluent/MDL2 preview cards shrink to 96x88 DIPs with a 26-DIP glyph and are centered in their half of the details region for more breathing room above the action row. Not yet built/run.
- 2026-10-07 1.0.0.10 candidate: icon-picker polish requested after the host skin began to look convincingly WinUI-like. The glyph cell matrix is now horizontally centered within the usable grid width while the scrollbar stays pinned right, and hit testing follows the centered origin. The picker page is taller so the grid keeps six rows while a 108-DIP Selected icon details area labels Name, Enum, Symbol and Glyph. Two Direct2D preview cards render the selected modern glyph side by side in Segoe Fluent Icons and Segoe MDL2 Assets, with Active/Fallback/Unavailable status based on the fonts actually installed. Not yet built/run.
- 2026-10-07 1.0.0.9 candidate: follow-up to Shane's first 1.0.0.8 runtime check. PropertySheet/tab/button WM_PAINT is now fully owned by tbUI3 instead of painting after the classic control, targeting the observed hover flicker. The original OK/Cancel/Apply HWNDs are physically resized/repositioned to a 32-DIP minimum action row with 8-DIP spacing, so their native hit targets and commands move with the new visuals; widths are equalized from measured captions and exact WinUI Button padding. The native tab is asked for the WinUI TabViewItem 100x32 DIP minimum item size and 8,3,8,3 header padding, and the selected header uses 12-DIP semibold text plus the source-backed selected background. Search TextBox now forces a refresh after theme application to target its initial white-paint glitch. The two-line selected-icon information is now painted directly into the Direct2D page chrome instead of relying on the classic transparent Label, which was disappearing under the new host repaint order. Not yet built/run.
- 2026-10-07 1.0.0.8 candidate: restored UI3IconPage's 1.0.0.6 designer sibling order after Shane confirmed that view was actually the closer representation, and added a reversible native PropertySheet skin spike. The host background, tab and native OK/Cancel/Apply HWNDs are now subclassed and painted by tbUI3 while retaining their original behavior. Button paint uses the exact WinUI Button state resource chains; the PropertySheet/tab composition itself is a tbUI3 convenience because WinUI has no PropertySheet equivalent. Not yet built/run.
- 2026-10-07 1.0.0.7 candidate: corrected UI3IconPage designer z-order after the first 1.0.0.6 canvas check showed the full-page picChrome surface covering the search/grid/info controls. The chrome surface is now the back-most designer sibling; runtime ZOrder behavior is unchanged. Shane also opened the 1.0.0.6 page at runtime in win32 and confirmed the themed picker still works, so the observed z-order fault is designer-only. 1.0.0.7 itself is not yet built or visually rechecked.
- 2026-10-07 1.0.0.6 candidate: UI3IconPage designer/live chrome pass. The designer canvas now matches the live layout; the page follows Windows light/dark, uses source-backed WinUI TextBox/ScrollBar tokens, paints a theme-aware Direct2D icon grid and scrollbar, and applies dark/light DWM treatment to the host property-sheet title bar. Not yet built or run.
- 2026-10-06 1.0.0.5 candidate: UI3IconPage, a searchable icon picker that opens from (Custom) in the Properties pane of a UI3Button. Builds and opens; twinBASIC BETA 997 does not save the chosen icon in the designer, The chosen icon is saved with the form (checked in win32).
- 2026-10-06 1.0.0.4: UI3Button Caption can be cleared in the designer (icon-only buttons); a newly dropped button still starts as "Button".
- 2026-10-06 1.0.0.3: S3 semantic icon API (UI3Icon values are WinUI's Symbol values; one glyph table, drawn in Segoe Fluent Icons or Segoe MDL2 Assets); measured icon/text composition for UI3Button. Built and validated in BETA 997, win32 and win64.
- 2026-10-06 1.0.0.2: UI3FormTheme, UI3Window.Attach/Detach, cached theme/accent state and live theme notifications; validated in win32/win64 and via the drop-on component path.
- 2026-10-06 1.0.0.1: UI3Window module (dark/light title bar, WinUI window background, UI3IsDarkMode, UI3AccentColor) and the UI3AccentShade enum.
- 2026-10-06 S2: UI3Button drawn with Direct2D and DirectWrite (WinUI Button rest state, light and dark, system accent).
- 2026-10-06 S1: UI3Button placeholder in the toolbox.
