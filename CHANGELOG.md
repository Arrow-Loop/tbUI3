# Changelog

All notable changes to tbUI3. Dates are when the change was made, not released. Nothing has been released yet.

## Unreleased

### 2026-10-06, spike S2 first run (win32)

- Built tbUI3 in the IDE (BETA 997, win32) and re-imported the package into tbUI3Test. The saved test project and its `src/` export are committed.
- Validated on Shane's PC (dark mode, accent #FF4343), win32 only:
  - Design time: UI3Button1 draws with rounded corners and the accent fill, with black caption text, instead of the S1 grey placeholder.
  - Runtime: the same rendering, and clicking the button still raises Click (the "Hello World" message box appeared).
- Not yet checked: 64-bit, resizing the control, Standard style, and light mode.
- Re-importing a package with the same name fails with "'tbUI3' conflicts with an existing imported package". Remove the old `[IMPORTED] tbUI3` reference first.

### 2026-10-06, repository set up

- The project moved to its own private repository, Arrow-Loop/tbUI3. Shane's PC created it with the S1 projects and plain-text exports in `src/`.
- Added the design notes in `docs/`, the `.twinproj` tools in `tools/`, `AGENTS.md`, and this CHANGELOG and ROADMAP.
- Arrow-Loop/WinUI3-twinBASIC is unchanged. It remains the archive of the June 2026 attempt.

### 2026-10-06, spike S2 (written, not yet built or run)

- UI3Button now draws through Direct2D and DirectWrite instead of GDI. It binds an `ID2D1DCRenderTarget` to the paint DC on every `UserControl_Paint`.
- It draws the rest state of WinUI's DefaultButtonStyle and AccentButtonStyle:
  - a 4 px rounded shape;
  - the 1 px elevation border gradient;
  - the WinUI fill and text colours for light and dark;
  - the caption in Segoe UI Variable Text 14 px (falls back to Segoe UI), with ButtonPadding 11,5,11,6.
- Values are taken from microsoft-ui-xaml at commit 8318c5bf (2026-10-05).
- New private module `UI3Direct2D.twin` holds:
  - the minimum Direct2D and DirectWrite interface declarations, adapted from fafalone's WinDevLib (CC0), with placeholder slots for unused vtable entries;
  - the shared factories;
  - small drawing helpers.
- New private module `UI3Theme.twin`:
  - Reads dark mode from `AppsUseLightTheme`.
  - Reads the accent palette from the `AccentPalette` registry value, then falls back to `DwmGetColorizationColor`, then to the default blue.
  - Holds the WinUI colour, radius, border and padding tokens, each with its source.
- If Direct2D fails, the button prints `D2D error &H...` instead of drawing, so a failed spike run shows the code.
- Tool: `tools/build-sources.mjs` replaces a project's Sources folder and leaves every other entry byte-identical.

### 2026-10-06, spike S1 (passed)

- Created the tbUI3 package project from the IDE's "Sample 7. Package" template.
- Added a placeholder UI3Button UserControl with Caption, Style and Click, and the UI3ButtonStyle enum.
- Created tbUI3Test from the twinBASIC-Knowledge seed.
- Shane checked all of this in the BETA 997 IDE:
  - the package built;
  - UI3Button appeared in the toolbox of tbUI3Test and dropped onto the form as UI3Button1;
  - Caption and Style persisted through a save;
  - Click ran at runtime.
