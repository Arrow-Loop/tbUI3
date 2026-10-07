# Roadmap

Committed work is listed first. Exploratory ideas are marked as such.

## Committed: spike A (see 2026-10-06-spike-spec.md)

- S2 run: validated on 2026-10-06 in win32 and win64 at design time and runtime: accent/Standard styles, resizing and Click. UI3Window dark-mode visual baseline passed in both architectures. Light mode is deferred by user choice and remains unvalidated.
- S2 fix: the button didn't repaint when the container's BackColor changed. `UserControl_AmbientChanged` is handled case-insensitively (f660d83), and UI3Window now redraws every child control after a theme change, which probably covers it. Still to check on its own: change a form's BackColor at runtime without UI3FormTheme and confirm the button repaints.
- UI3Window baseline: win32 and win64 dark-mode runtime visuals passed; Click passed in win64. Light mode is deferred by user choice and remains unvalidated.
- **Form theme baseline complete (2026-10-06):** 1.0.0.2 builds/imports cleanly; code-based Attach/Detach and drop-on `UI3FormTheme` both passed the runtime tests, including live accent and light/dark changes plus clean teardown in win32/win64.
- S3: **done and validated on Shane's PC on 2026-10-06 (1.0.0.3, win32 and win64).** The 1.0.0.4 Caption fix (clearing Caption in the designer for icon-only buttons) also passed in win32 and win64. The semantic Symbol mappings and 20-DIP SymbolIcon size are source-derived. `Icon`, `IconGlyph`, `IconFontName`, `IconPosition`, and `IconSpacing` are tbUI3 convenience abstractions over WinUI Button.Content; the current 8-DIP IconSpacing default is general Gallery guidance, not a Button XAML value. Source review: `docs/reviews/2026-10-06-s3-source-review.md`. `UI3Icon` values are WinUI's Symbol values, and there is one glyph table; the MDL2 check passed.
- S4: windowless and transparent. In S2 the control is still windowed and clears to the container's BackColor. S4 must remove that and blend over whatever is behind the control.
- S5: Mica, building on UI3Window. The title bar and the #202020/#F3F3F3 background are already in place.
- S6: per-monitor DPI. S2 uses `GetDeviceCaps(LOGPIXELSX)` on the paint DC, which gives the system DPI, not the monitor's.
- S7: hover, pressed and disabled visuals, compared against the WinUI Gallery.
- S8: keyboard, focus visuals, and Default and Cancel.
- S9: coexistence with WinDevLib and a GDI+ package, with no name clashes.

## Committed: designer experience (Shane, 2026-10-06)

- **Themed form canvas in the designer.** UI3FormTheme only themes the form at runtime, so in the designer the form stays light while UI3 controls draw in the IDE's dark theme. That makes the Standard style nearly invisible. Let UI3FormTheme also apply the WinUI window background at design time, when ManageBackColor is True. This needs a short check that the designer allows a component to set its parent form's BackColor.
- **Designer accent refresh.** The designer reads the accent colour once, when the IDE starts; it updated only after an IDE restart. Runtime is fine. Refresh the theme cache at design time, for example on UI3 paint after a WM_SETTINGCHANGE, or with a cheap staleness check.
- **Visual catalog pickers (`...` in the Properties pane).** For hard-to-guess options, starting with `Icon`: a searchable grid of glyphs (search by name, number or code), in the spirit of Word's Symbol dialog. Typing a value directly must keep working. Spike done on 2026-10-06 (`docs/research/2026-10-06-property-page-picker.md`): a control-wide PropertyPage opens from `(Custom)` → `...` in the Properties pane, but the IDE ignores per-property links on any type. **1.0.0.13 diagnostic rollback (2026-10-07):** 1.0.0.11/12 did not fix the clipped tab or white Edit and destabilized page geometry, so the host skin is back on the 1.0.0.10 visual baseline. The next gate is evidence, not another guess: open the picker once, collect `%TEMP%\tbUI3-propertypage.log`, and use the recorded HWND tree / WM_CTLCOLOREDIT route to identify the true Edit parent and the exact tab/page relationship before changing either. The designer canvas remains a practical approximation of the live page; a Direct2D background/search/grid layer follows Windows light/dark; the classic TextBox supplies native editing behavior under tbUI3-drawn WinUI-style chrome; the native scrollbar is hidden and replaced visually with a Direct2D WinUI-style thumb while retaining its range/value state; and the property-sheet root receives the existing DWM title-bar treatment. This candidate is not yet built/run. First validate that body/titlebar approach before attempting the more invasive next step of overpainting the host-owned OK/Cancel/Apply strip. The existing picker persistence bridge in `UI3Icons` remains frozen until its behavior is understood. After the chrome pass is stable, finish Apply/OK/Cancel/reopen/search/wheel checks in win32 and win64, then consider arrow-key navigation and hover.
- Property-pane previews inside the enum dropdown itself are not possible as far as is known: twinBASIC draws that list as plain text.

## Committed: housekeeping

- Decide where `reference-packages/` lives. It adds about 112 MB of third-party package source to this repository; a separate repository (or keeping only the notes and a list of package versions) would keep tbUI3 small. Check each package's licence before it is published anywhere.

## Committed: reference-derived follow-ups

- Keep `reference-packages/ReferencePackages.twinproj` as the canonical package-laboratory snapshot and keep its loose `reference-packages/src/` mirror synchronized for code search and diffing.
- For UI3FormTheme live notifications, use a minimal private adaptation of the pointer-width-safe `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` pattern evidenced independently by WinRT and VBCCR18. Do not use TBMANLIB 1.0.29.0's legacy `GetWindowLongW` / `SetWindowLongW` subclass helper as the win64 model.
- Before S7/S8, mine VBCCR18 selectively for focus, keyboard handling, Default/Cancel semantics, persistence, designer lifecycle, and ambient-property behavior without adopting its visual architecture.
- Review TwinTimerLib before designing animation/timing infrastructure, AutoCompleteLib before native Edit autocomplete, and OLEGuids/WinDevLibImpl before implementing COM/OLE/accessibility interfaces.
- GdiPlus remains comparison/reference only. Direct2D/DirectWrite remains tbUI3's primary rendering architecture; do not introduce GDI/GDI+ unless a specific requirement demonstrates that the modern path cannot satisfy it.
- Maintain third-party provenance/licence notes for any implementation fragments adapted into tbUI3.

## Committed: technical follow-ups

- Stable public-control IDs: every new public toolbox control gets a checked-in `tbUI3/UI3<Control>-ids.json` record when first created; established FormDesignerId/ClassId/InterfaceId/EventInterfaceId values are never regenerated during ordinary work.

- High contrast. The tokens currently cover only the Default (dark) and Light dictionaries.
- DirectWrite locale. The text format hard-codes "en-us". Use the user's locale instead.
- Old folder. `E:\Code Projects\WinUI 3` on Shane's PC is a stale duplicate of this repository. Delete it once Shane confirms. Arrow-Loop/WinUI3-twinBASIC stays as the archive of the June 2026 attempt; add a README pointer there to this repository.
- Knowledge repo:
  - add Shane's IDE-created package project as a package seed;
  - add the patch tools;
  - record the finding that the package template's Settings file uses LF line endings.

## Committed: full WinUI control surface

- **Control fidelity policy:** `docs/CONTROL_FIDELITY_POLICY.md` is authoritative. Each control/variant must reproduce the exact microsoft-ui-xaml control-specific resources/template/visual states/behavior wherever Microsoft defines them. Generic Fluent guidance may only supply explicitly labeled tbUI3 convenience behavior when the target control leaves that value undefined.

- Use `docs/CONTROL_INVENTORY.md` as the authoritative coverage map.
- Target the complete practical WinUI 3 control/style surface represented by current Microsoft documentation and WinUI Gallery, including its hundreds of documented visual/behavior/sample variants.
- Keep the toolbox manageable by implementing coherent families rather than one toolbox entry per Microsoft class or sample. Variant access belongs in `Style`, `Mode`, `Presentation` and other focused properties.
- Maintain a Gallery coverage ledger on upstream refreshes so new/removed Microsoft control pages are intentionally mapped rather than discovered ad hoc.
- Build per-control documentation under `docs/controls/` with the WinUI equivalent, supported variants, resource/template sources and validation matrix.
- Platform/service hosts such as WebView2, mapping, camera/media and shell APIs remain coverage items, but must not silently break the core package's dependency-free contract.

## Committed: later controls

- UI3ContentDialog: a Windows 11 style message dialog, the tbUI3 equivalent of WinUI's ContentDialog. It is drawn by tbUI3 over the form: a dimmed backdrop, a centred card, and an accent primary button. It is not a system dialog, because Windows only exposes ContentDialog to real WinUI apps, and the classic MsgBox and Task Dialog are older Win32 pieces. Shane confirmed on 2026-10-06 that it should be recreated. Start it once buttons and text are solid.

## Exploratory

- Supported WinRT accent/theme path: the audited WinRT 1.7.0.159 package does **not** implement `UISettings.GetColorValue`; it only defines the `UIColorType` enum. Later, derive/source and validate the minimal `UISettings` declarations needed for `Accent`, `AccentLight1-3`, `AccentDark1-3`, foreground/background, and change notifications. Keep this dependency-free and do not replace the currently working registry/DWM fallback until the supported path is proven.
- Composition (WinRT) for flyout shadows and acrylic, later.
- CustomControls as a secondary route, if WaynesForm's limits are ever lifted.
