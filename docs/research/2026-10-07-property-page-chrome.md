# PropertyPage WinUI-style chrome spike

Status: 1.0.0.6 implementation candidate, 2026-10-07. Not yet compiled or run.

## Goal

Make `UI3IconPage` useful in the twinBASIC designer and substantially reduce the classic bright Win32 appearance at runtime without replacing the native property-page protocol.

The architecture deliberately follows a hybrid rule:

- keep native controls where they provide difficult behavior cheaply (Edit caret/selection/clipboard/IME, PropertyPage Apply/OK/Cancel protocol);
- hide or visually cover classic chrome where tbUI3 can own the pixels safely;
- draw visible surfaces with the same Direct2D/theme infrastructure as the package.

## Candidate

- The `.tbppage` now contains the intended 460×400 composition at design time.
- `picChrome` is a full-page Direct2D background/chrome surface.
- `txtSearch` remains a native TextBox, but is borderless and inset inside a Direct2D-drawn 4-DIP rounded TextBox surface.
- Search focus paints a 2-DIP accent bottom edge, matching the structure of WinUI TextBox focused border resources.
- `picGrid` renders against the effective light/dark WinUI window background and uses the appropriate Accent button shade for selection.
- The native VScrollBar is hidden. It remains the range/value model, while `picGrid` draws an 8-DIP thumb in a 12-DIP reserved strip with the WinUI ScrollBar minimum thumb height of 30 DIPs.
- Mouse wheel, track click and thumb dragging change that hidden range/value model.
- The root PropertyPage host receives `UI3ApplyTitleBarTheme` when its HWND can be found with `GetAncestor(..., GA_ROOT)`.

## Microsoft sources

Pinned to the package's existing microsoft-ui-xaml token baseline where possible:

- `controls/dev/CommonStyles/Common_themeresources_any.xaml`
  - `SolidBackgroundFillColorBase`
  - `TextFillColorPrimary`
  - `TextFillColorSecondary`
  - `ControlFillColorDefault`
  - `ControlFillColorInputActive`
  - `ControlStrongFillColorDefault`
  - `ControlStrokeColorDefault`
- `controls/dev/CommonStyles/TextBox_themeresources.xaml`
  - `TextControlBackground`
  - `TextControlBackgroundFocused`
  - `TextControlBorderBrush`
  - focused border structure
  - `ControlCornerRadius`
- `controls/dev/CommonStyles/ScrollBar_themeresources.xaml`
  - `ScrollBarSize = 12`
  - `ScrollBarVerticalThumbMinWidth = 8`
  - `ScrollBarVerticalThumbMinHeight = 30`
  - `ScrollBarPanningThumbBackground = ControlStrongFillColorDefaultBrush`

This is an internal PropertyPage chrome experiment, not a claim that the classic TextBox has become a real WinUI TextBox. Native behavior remains Win32/twinBASIC; tbUI3 owns the visible shell around it.

## Deliberately deferred

The outer PropertyPage dialog and its OK/Cancel/Apply controls are created by the property-sheet host, not by `UI3IconPage`. This first candidate only applies DWM title-bar theming to that root host.

If the page-body approach proves stable, the next spike may place a reversible tbUI3-drawn child overlay above the host button strip and forward clicks to the original native buttons underneath. That must preserve keyboard behavior and cleanly tear down before it is considered viable.

## First validation

1. Open `UI3IconPage` in the package designer and compare the canvas to the live page.
2. Build 1.0.0.6 in BETA 997.
3. Update tbUI3 in tbUI3Test.
4. Open a UI3Button's `(Custom)` → `...`.
5. Capture the first screenshot before changing anything.
6. Check search focus, grid selection, wheel, track click and thumb dragging.
7. Only after the dark appearance is stable, switch Windows apps to light and check the same page.
8. Repeat in win64 after win32 is sound.

Record only behavior actually observed.
