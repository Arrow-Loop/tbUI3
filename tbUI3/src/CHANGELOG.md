# tbUI3 changelog

Pre-release spike builds. The full history is kept in the project repository CHANGELOG.md.

- 2026-10-07 1.0.0.7 candidate: corrected UI3IconPage designer z-order after the first 1.0.0.6 canvas check showed the full-page picChrome surface covering the search/grid/info controls. The chrome surface is now the back-most designer sibling; runtime ZOrder behavior is unchanged. Not yet built or run.
- 2026-10-07 1.0.0.6 candidate: UI3IconPage designer/live chrome pass. The designer canvas now matches the live layout; the page follows Windows light/dark, uses source-backed WinUI TextBox/ScrollBar tokens, paints a theme-aware Direct2D icon grid and scrollbar, and applies dark/light DWM treatment to the host property-sheet title bar. Not yet built or run.
- 2026-10-06 1.0.0.5 candidate: UI3IconPage, a searchable icon picker that opens from (Custom) in the Properties pane of a UI3Button. Builds and opens; twinBASIC BETA 997 does not save the chosen icon in the designer, The chosen icon is saved with the form (checked in win32).
- 2026-10-06 1.0.0.4: UI3Button Caption can be cleared in the designer (icon-only buttons); a newly dropped button still starts as "Button".
- 2026-10-06 1.0.0.3: S3 semantic icon API (UI3Icon values are WinUI's Symbol values; one glyph table, drawn in Segoe Fluent Icons or Segoe MDL2 Assets); measured icon/text composition for UI3Button. Built and validated in BETA 997, win32 and win64.
- 2026-10-06 1.0.0.2: UI3FormTheme, UI3Window.Attach/Detach, cached theme/accent state and live theme notifications; validated in win32/win64 and via the drop-on component path.
- 2026-10-06 1.0.0.1: UI3Window module (dark/light title bar, WinUI window background, UI3IsDarkMode, UI3AccentColor) and the UI3AccentShade enum.
- 2026-10-06 S2: UI3Button drawn with Direct2D and DirectWrite (WinUI Button rest state, light and dark, system accent).
- 2026-10-06 S1: UI3Button placeholder in the toolbox.
