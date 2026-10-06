# Roadmap

Committed work is listed first. Exploratory ideas are marked as such.

## Committed: spike A (see 2026-10-06-spike-spec.md)

- S2 run: validated on 2026-10-06 in win32 (design time and runtime) and win64 (design time; the run starts cleanly): accent and Standard styles, resizing, and Click. Still to check: light mode, and the running win64 window by eye.
- S2 fix: the button doesn't repaint when the container's BackColor changes. `UserControl_AmbientChanged` is already handled, and commit f660d83 made its check case-insensitive, but the fix is unverified. The form theme spec also forces a redraw of all child controls after a theme change.
- Validate the repaired tbUI3Test from commit 94b621b: visually run the win32 and win64 harness with `UI3ApplyWindowTheme Me`, confirm the title bar/form background/button rendering, and then test light mode separately.
- Finish the form theme baseline (`docs/2026-10-06-form-theme-spec.md`): the drop-on `UI3FormTheme` control, live theme switching (subclass WM_SETTINGCHANGE "ImmersiveColorSet", WM_DWMCOLORIZATIONCOLORCHANGED and WM_THEMECHANGED), and the cached theme. Then check dark and light, win32 and win64, and that the IDE doesn't crash when the debugger stops.
- S3: icon glyphs in Segoe Fluent Icons, falling back to Segoe MDL2 Assets, plus a test on a machine without Segoe UI Variable.
- S4: windowless and transparent. In S2 the control is still windowed and clears to the container's BackColor. S4 must remove that and blend over whatever is behind the control.
- S5: Mica, building on UI3Window. The title bar and the #202020/#F3F3F3 background are already in place.
- S6: per-monitor DPI. S2 uses `GetDeviceCaps(LOGPIXELSX)` on the paint DC, which gives the system DPI, not the monitor's.
- S7: hover, pressed and disabled visuals, compared against the WinUI Gallery.
- S8: keyboard, focus visuals, and Default and Cancel.
- S9: coexistence with WinDevLib and a GDI+ package, with no name clashes.

## Committed: reference-package review

- Keep `reference-packages/ReferencePackages.twinproj` as the canonical package-laboratory snapshot and keep its loose `reference-packages/src/` mirror synchronized for code search and diffing.
- Review WinRT's UISettings implementation for a supported Windows theme/accent path. If adopted, copy/adapt only the minimal required interfaces/helpers with attribution; do not add a WinRT package dependency.
- Compare the planned live-theme subclassing against TBMANLIB's subclass implementation and proven PacketPilot/SPConnect patterns before finalizing UI3FormTheme.
- Mine VBCCR18 for mature toolbox-control behavior: focus, keyboard handling, Default/Cancel semantics, persistence, designer lifecycle, and 32/64-bit patterns.
- Review TwinTimerLib before designing animation/timing infrastructure, AutoCompleteLib before native Edit autocomplete, and OLEGuids/WinDevLibImpl before implementing COM/OLE/accessibility interfaces.
- GdiPlus is retained in the laboratory for comparison/reference only. Direct2D/DirectWrite remains tbUI3's primary rendering architecture; do not introduce GDI/GDI+ unless a specific requirement demonstrates that the modern path cannot satisfy it.
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

- Read the accent colour through WinRT `UISettings.GetColorValue`, the supported API, in place of the AccentPalette registry layout, which is observed but undocumented. Shane's twinBASIC package list includes "WinRT Interfaces and XAML Islands DevKit" (library symbol WinRT), probably VanGoghGaming's package (MIT). Review it before relying on it, because tbUI3 must stay dependency-free: copy or adapt only the small part needed.
- Composition (WinRT) for flyout shadows and acrylic, later.
- CustomControls as a secondary route, if WaynesForm's limits are ever lifted.
