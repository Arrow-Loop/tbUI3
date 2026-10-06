# Roadmap

Committed work is listed first. Exploratory ideas are marked as such.

## Committed: spike A (see 2026-10-06-spike-spec.md)

- S2 run: validated on 2026-10-06 in win32 (design time and runtime) and win64 (design time; the run starts cleanly): accent and Standard styles, resizing, and Click. UI3Window dark-mode visual baseline also passed in win32. Still to check: light mode, and the running win64 window by eye.
- S2 fix: the button doesn't repaint when the container's BackColor changes. `UserControl_AmbientChanged` is already handled, and commit f660d83 made its check case-insensitive, but the fix is unverified. The form theme spec also forces a redraw of all child controls after a theme change.
- Validate the repaired tbUI3Test from commit 94b621b: **win32 dark-mode visual run passed on 2026-10-06** (dark title bar, #202020 form, readable Accent button at #FF8279, rounded window corners). Still to check: the running win64 window by eye and light mode separately.
- Finish the form theme baseline (`docs/2026-10-06-form-theme-spec.md`): the drop-on `UI3FormTheme` control, live theme switching (subclass WM_SETTINGCHANGE "ImmersiveColorSet", WM_DWMCOLORIZATIONCOLORCHANGED and WM_THEMECHANGED), and the cached theme. Then check dark and light, win32 and win64, and that the IDE doesn't crash when the debugger stops.
- S3: icon glyphs in Segoe Fluent Icons, falling back to Segoe MDL2 Assets, plus a test on a machine without Segoe UI Variable.
- S4: windowless and transparent. In S2 the control is still windowed and clears to the container's BackColor. S4 must remove that and blend over whatever is behind the control.
- S5: Mica, building on UI3Window. The title bar and the #202020/#F3F3F3 background are already in place.
- S6: per-monitor DPI. S2 uses `GetDeviceCaps(LOGPIXELSX)` on the paint DC, which gives the system DPI, not the monitor's.
- S7: hover, pressed and disabled visuals, compared against the WinUI Gallery.
- S8: keyboard, focus visuals, and Default and Cancel.
- S9: coexistence with WinDevLib and a GDI+ package, with no name clashes.

## Committed: reference-derived follow-ups

- Keep `reference-packages/ReferencePackages.twinproj` as the canonical package-laboratory snapshot and keep its loose `reference-packages/src/` mirror synchronized for code search and diffing.
- For UI3FormTheme live notifications, use a minimal private adaptation of the pointer-width-safe `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` pattern evidenced independently by WinRT and VBCCR18. Do not use TBMANLIB 1.0.29.0's legacy `GetWindowLongW` / `SetWindowLongW` subclass helper as the win64 model.
- Before S7/S8, mine VBCCR18 selectively for focus, keyboard handling, Default/Cancel semantics, persistence, designer lifecycle, and ambient-property behavior without adopting its visual architecture.
- Review TwinTimerLib before designing animation/timing infrastructure, AutoCompleteLib before native Edit autocomplete, and OLEGuids/WinDevLibImpl before implementing COM/OLE/accessibility interfaces.
- GdiPlus remains comparison/reference only. Direct2D/DirectWrite remains tbUI3's primary rendering architecture; do not introduce GDI/GDI+ unless a specific requirement demonstrates that the modern path cannot satisfy it.
- Maintain third-party provenance/licence notes for any implementation fragments adapted into tbUI3.

## Committed: technical follow-ups

- High contrast. The tokens currently cover only the Default (dark) and Light dictionaries.
- DirectWrite locale. The text format hard-codes "en-us". Use the user's locale instead.
- Old folder. `E:\Code Projects\WinUI 3` on Shane's PC is a stale duplicate of this repository. Delete it once Shane confirms. Arrow-Loop/WinUI3-twinBASIC stays as the archive of the June 2026 attempt; add a README pointer there to this repository.
- Knowledge repo:
  - add Shane's IDE-created package project as a package seed;
  - add the patch tools;
  - record the finding that the package template's Settings file uses LF line endings.

## Committed: later controls

- UI3ContentDialog: a Windows 11 style message dialog, the tbUI3 equivalent of WinUI's ContentDialog. It is drawn by tbUI3 over the form: a dimmed backdrop, a centred card, and an accent primary button. It is not a system dialog, because Windows only exposes ContentDialog to real WinUI apps, and the classic MsgBox and Task Dialog are older Win32 pieces. Shane confirmed on 2026-10-06 that it should be recreated. Start it once buttons and text are solid.

## Exploratory

- Supported WinRT accent/theme path: the audited WinRT 1.7.0.159 package does **not** implement `UISettings.GetColorValue`; it only defines the `UIColorType` enum. Later, derive/source and validate the minimal `UISettings` declarations needed for `Accent`, `AccentLight1-3`, `AccentDark1-3`, foreground/background, and change notifications. Keep this dependency-free and do not replace the currently working registry/DWM fallback until the supported path is proven.
- Composition (WinRT) for flyout shadows and acrylic, later.
- CustomControls as a secondary route, if WaynesForm's limits are ever lifted.
