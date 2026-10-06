# tbUI3 form theme baseline: spec

Status: spec, not built. Written 2026-10-06 by Cloud Claude for Local Claude to implement on `tbui3-dev`. This pulls the first part of spike step S5 forward, at Shane's request.

## Why

In dark mode the tbUI3Test window still has a white title bar and a light grey form. That makes WinUI's dark-mode button colours hard to read: the Standard button's white text nearly disappears. Shane wants the baseline Windows theme plumbing in tbUI3 now, rather than in each of his apps.

## What the developer does

Shane's goal is toolbox first, not code snippets, so there are two ways to switch it on, and both call the same engine:

1. **Drop a control.** Add `UI3FormTheme` from the toolbox to the form. It is a non-visual control, like a Timer: it shows a small icon in the designer and is invisible at runtime (`InvisibleAtRuntime = True`). When it is sited, it themes its parent form.
2. **Call it in code.** `UI3Window.Attach Me` in `Form_Load`, for forms built in code. `UI3Window` is a small public module.

The engine is private. The only public names are `UI3FormTheme`, `UI3Window.Attach` and `UI3Window.Detach`, plus any properties listed below.

## What it does to the form

All of these happen on attach, and again whenever the Windows theme changes.

1. **Title bar follows the app theme.** Set `DWMWA_USE_IMMERSIVE_DARK_MODE` (20) to 1 for dark and 0 for light. If that fails, retry with 19, which is the value on Windows 10 builds before 20H1.
   - Source: Microsoft's docs page "Support Dark and Light themes in Win32 apps", and dwmapi.h.
   - The dark or light choice comes from `UI3Theme.IsDarkMode()` (`AppsUseLightTheme`).
2. **Don't set the caption colours.** Skip attributes 35 and 36 (`DWMWA_CAPTION_COLOR` and `DWMWA_TEXT_COLOR`). The Knowledge reference sets them, but WinUI apps let DWM draw the dark or light title bar itself. Forcing a colour also stops Mica tinting the title bar later. This is a deliberate difference from `native-theme-reference.twin`.
3. **Rounded window corners.** Set `DWMWA_WINDOW_CORNER_PREFERENCE` (33) to `DWMWCP_ROUND` (2). Windows 11 only; ignore failures.
4. **Form background.** Set `Form.BackColor` to `SolidBackgroundFillColorBase`:
   - `#202020` in dark mode;
   - `#F3F3F3` in light mode.
   - Source: Common_themeresources_any.xaml at the commit already cited in UI3Theme.twin. Add both values to UI3Theme as tokens.
   - This is the honest non-Mica background WinUI uses. Mica (attribute 38) waits for real S5, because a classic form paints an opaque client area over it.
5. **Repaint children.** After changing BackColor, call `RedrawWindow(hWnd, 0, 0, RDW_INVALIDATE Or RDW_ERASE Or RDW_ALLCHILDREN Or RDW_FRAME)` so every UI3 control repaints with the new colours. This also fixes the S2 bug where a BackColor change didn't repaint the button, because UserControl_AmbientChanged doesn't seem to fire for it.

## Live theme changes

Subclass the form with `SetWindowSubclass` (comctl32, version 6), and remove the subclass with `RemoveWindowSubclass` on `WM_NCDESTROY` or on Detach. Handle these messages:

- **`WM_SETTINGCHANGE` (&H1A)**, when lParam points to the string "ImmersiveColorSet": light/dark or accent switched. Refresh the theme cache, then reapply items 1 to 5.
- **`WM_DWMCOLORIZATIONCOLORCHANGED` (&H320)**: accent colour changed. Refresh the cache and repaint children (item 5).
- **`WM_THEMECHANGED` (&H31A)**: same as `WM_SETTINGCHANGE`.

Always pass every message on to `DefSubclassProc`.

### Implementation reference choice

The 2026-10-06 reference-package audit resolved the open subclass question:

- model the private tbUI3 helper on the pointer-width-safe comctl32 pattern independently present in WinRT 1.7.0.159 `mdlSubclass.twin` and VBCCR18 1.8.0.125 `ComCtlsBase.bas`;
- use `LongPtr` for HWNDs, callback/subclass IDs, wParam/lParam, and reference data;
- remove the subclass on `WM_NCDESTROY`, support explicit Detach, and forward unhandled messages through `DefSubclassProc`;
- do **not** use TBMANLIB 1.0.29.0 `cSubClass.twin` as the win64 reference; it uses legacy `GetWindowLongW` / `SetWindowLongW` with `Long` pointer values.

Keep only the minimal private declarations/logic needed by tbUI3 and record provenance; do not add WinRT or VBCCR as package dependencies.

Subclassing in the IDE can crash when a debug session stops mid-message. Take a known-good twinBASIC subclass pattern from the Knowledge repo or WinDevLib, and test stopping the debugger while the form is open.

## Theme cache

S2 reads the registry on every paint. Replace that with a cached snapshot in UI3Theme:

- The snapshot holds: dark mode yes or no, and the seven accent palette shades.
- `UI3Theme.Refresh()` reloads it. The subclass calls it on the messages above, and the first call happens lazily.
- `IsDarkMode()` and `AccentShade()` read from the snapshot.

## Properties on UI3FormTheme

Keep these to a minimum for now:

- `ThemeMode`: an enum, `ui3ThemeSystem` (the default, which follows Windows), `ui3ThemeLight` or `ui3ThemeDark`. Forcing light or dark also has to drive the controls, so UI3Theme needs an app-wide override that `IsDarkMode()` respects.
- `ManageBackColor`: Boolean, default True. Set it to False to keep the form's own BackColor.

## Out of scope for this pass

- Mica, and transparent windowless controls (S4 and S5 proper).
- Per-monitor DPI (S6). Don't set the process DPI awareness from inside the package: that's the application's choice, made before any window exists. Note it in the ROADMAP.
- Dark-mode styling of classic VB controls (TextBox, ListBox and so on).
- High contrast.

## How to check it

1. Drop a UI3FormTheme on frmMain in tbUI3Test, then run.
   - In dark mode: the title bar is dark, the form is #202020, both buttons read clearly, and the window corners are rounded.
2. With the app still running, switch Windows to light mode (Settings, Personalization, Colors). The title bar, the form (#F3F3F3) and the buttons all switch without a restart.
3. With the app running, change the accent colour. The Accent button follows.
4. Stop the debugger while the form is open. The IDE must not crash.
5. Remove UI3FormTheme, then use `UI3Window.Attach Me` instead. It gives the same result.
6. Do this in both win32 and win64.

Record the results in CHANGELOG.md and ROADMAP.md, as usual.
