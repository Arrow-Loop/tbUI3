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


## 1.0.0.8 native host-skin escalation

Shane's side-by-side designer/runtime comparison changed the z-order conclusion: the original 1.0.0.6 sibling order is the better designer representation. The search box was already visible; the Direct2D grid is naturally blank at design time, and the native scrollbar is deliberately hidden because runtime now paints its thumb.

The next spike therefore moves outward to the remaining classic Win32 PropertySheet shell.

### Strategy

Do not replace the property-sheet behavior or create fake buttons on top of it. Instead, subclass the existing HWNDs and paint over their normal pixels after their default window procedures run:

- root PropertySheet client → WinUI window background;
- `SysTabControl32` → tbUI3 dark/light tab surface with an accent active indicator;
- native IDOK → WinUI AccentButton paint;
- native IDCANCEL and ID_APPLY_NOW → WinUI DefaultButton paint.

The original child HWNDs remain in place and continue to own hit testing, keyboard, enabled state and commands. The subclass only replaces visible paint and invalidates on state/theme changes. Cleanup occurs through `WM_NCDESTROY` using the same pointer-safe common-controls subclass model already proven by `UI3Window`.

### Fidelity boundary

WinUI 3 does not define a Win32 PropertySheet control, so the overall dialog/tab composition is a tbUI3 convenience skin. It must not be documented as an exact WinUI PropertySheet.

The painted buttons are different: their rest/pointer-over/pressed/disabled fills and foregrounds use the actual `Button_themeresources.xaml` resource chains and `Common_themeresources_any.xaml` values. This keeps the control-specific fidelity rule intact where a real WinUI equivalent exists.

### First validation

1. Build 1.0.0.8 win32.
2. Import it into tbUI3Test and open the icon PropertyPage.
3. Check whether the previously light tab/header and bottom button strip are now dark.
4. Hover and press OK/Cancel and confirm the native controls still react/click normally.
5. Select an icon and confirm Apply becomes enabled and adopts the painted enabled state.
6. Close with Cancel and confirm clean teardown / no IDE instability.
7. Only after win32 is stable, repeat in win64.


## 1.0.0.9 paint/layout follow-up

The first 1.0.0.8 live run proved the HWND-skin approach, but also exposed why “paint after default” is not sufficient: Windows visibly paints the classic tab/button for a frame during pointer state changes, then Direct2D covers it.

1.0.0.9 therefore owns `WM_PAINT` for the host/tab/buttons. Input/state messages still pass to the original HWND procedures, so the native PropertySheet remains responsible for commands, focus, enable/disable and keyboard semantics.

### Action buttons

Do not create disconnected overlay buttons. Reposition and resize the original IDOK/IDCANCEL/ID_APPLY_NOW HWNDs themselves.

That means:
- their clickable regions move with the tbUI3 visuals;
- their standard PropertySheet command IDs remain intact;
- no click-forwarding shim is required;
- native enable/disable state remains authoritative.

WinUI's Button template supplies exact padding and visual resources but does not define a PropertySheet action-row size. The 80x32-DIP minimum/equal-width/right-aligned arrangement is therefore a documented tbUI3 convenience. The 8-DIP inter-button gap follows the WinUI ContentDialog button-spacing resource.

### Tab

The PropertySheet's real `SysTabControl32` item is asked for the current WinUI TabViewItem minimum dimensions (100x32 DIPs) and no-close header padding (8,3,8,3). Selected text is 12-DIP semibold and the selected background follows the TabView resource chain.

If this Win32 tab style ignores `TCM_SETITEMSIZE`, do not leave paint and hit testing permanently misaligned. The next fallback is custom hit testing/forwarding or moving the underlying tab/page geometry together.

### TextBox

The first white rectangle appears to be an initial native Edit repaint-ordering problem rather than the intended tbUI3 focused color. 1.0.0.9 explicitly refreshes the TextBox immediately after setting BackColor/ForeColor. If that is insufficient, the next escalation is handling `WM_CTLCOLOREDIT` on the page host with a persistent theme brush rather than relying on the classic control's first brush selection.


## 1.0.0.10 centered grid and selected-icon comparison

Once the PropertyPage shell began to read visually like a WinUI surface, the old grid geometry and diagnostic-style metadata became more obvious.

The grid now centers the **cell matrix** rather than only the surrounding PictureBox. The scrollbar retains a dedicated 12-DIP lane at the right edge; the remaining width is used to calculate the column count and a centered X origin. Drawing and mouse hit testing share that origin.

The page height is increased to 456 DIPs. With a 108-DIP details area, the grid still has enough vertical space for six 44-DIP icon rows.

The details area is a tbUI3 picker convenience, not a WinUI control claim. It presents:
- Name
- Enum
- Symbol value in decimal and hex
- modern glyph code point

It also renders the selected modern glyph side by side using `Segoe Fluent Icons` and `Segoe MDL2 Assets`. Both fonts use the same modern code point; the point of the comparison is to show the different font artwork a user can see on the Windows 11 primary path versus the Windows 10 fallback path. Each preview is marked Active, Fallback, or Unavailable based on the installed fonts and `SystemIconFontFamily()`.


## 1.0.0.14 confirmed native route

The 1.0.0.13 probe removed the remaining ambiguity around the search TextBox:

- `txtSearch.hWnd` is `ThunderTextBox` itself, control ID 258.
- Its direct parent is `ThunderPropertyPageDC`.
- `ThunderPropertyPageDC` receives `WM_CTLCOLOREDIT` with the `ThunderTextBox` HWND as `lParam`.

1.0.0.14 therefore applies the TextBox theme brush only on that exact confirmed route. The hook changes no other message and performs no page/tab geometry manipulation.

The same test also revealed that pressing **Apply** causes the native PropertySheet/page hierarchy to perform a layout transition that moves the page down far enough to expose the full enlarged tab. Rather than emulate that transition by guessed coordinates, 1.0.0.14 logs:

- `WM_COMMAND` for Apply, before and after default processing;
- `WM_SIZE`;
- `WM_WINDOWPOSCHANGED`;
- host, tab, inner dialog, `ThunderPropertyPageDC`, and TextBox rectangles;
- the native first tab-item rectangle.

The next tab fix should be based on the recorded native transition, not another replacement rectangle.
