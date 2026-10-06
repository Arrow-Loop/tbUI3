# Roadmap

Committed work is listed first. Exploratory ideas are marked as such.

## Committed: spike A (see 2026-10-06-spike-spec.md)

- S2 run: Shane builds tbUI3, re-imports it into tbUI3Test, and checks design time, runtime and resizing, in both 32-bit and 64-bit.
- S3: icon glyphs in Segoe Fluent Icons, falling back to Segoe MDL2 Assets, plus a test on a machine without Segoe UI Variable.
- S4: windowless and transparent. In S2 the control is still windowed and clears to the container's BackColor. S4 must remove that and blend over whatever is behind the control.
- S5: Mica, through a form helper adapted from the Knowledge repo's `native-theme-reference.twin`. The test form should then be dark: WinUI's translucent fills assume a dark backdrop such as SolidBackgroundFillColorBase #202020 or Mica.
- S6: per-monitor DPI. S2 uses `GetDeviceCaps(LOGPIXELSX)` on the paint DC, which gives the system DPI, not the monitor's.
- S7: hover, pressed and disabled visuals, compared against the WinUI Gallery.
- S8: keyboard, focus visuals, and Default and Cancel.
- S9: coexistence with WinDevLib and a GDI+ package, with no name clashes.

## Committed: technical follow-ups

- Theme change notifications. S2 reads the registry on every paint. Replace this with a cached theme that refreshes on WM_SETTINGCHANGE "ImmersiveColorSet" and WM_DWMCOLORIZATIONCOLORCHANGED, delivered through the form helper.
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

- Read the accent colour through WinRT `UISettings.GetColorValue`, the supported API, in place of the AccentPalette registry layout, which is observed but undocumented. VanGoghGaming's WinRT package (MIT) is a candidate source once it can be obtained. It is not on Shane's PC and its download host is blocked from the cloud session.
- Composition (WinRT) for flyout shadows and acrylic, later.
- CustomControls as a secondary route, if WaynesForm's limits are ever lifted.
