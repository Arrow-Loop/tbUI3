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

## 1.0.0.15 host-metrics / Edit erase follow-up

Shane's win32 1.0.0.14 screenshot showed that returning a themed brush from the confirmed `ThunderPropertyPageDC` `WM_CTLCOLOREDIT` route did not by itself stop the exposed `ThunderTextBox` from repainting white. The enlarged native `SysTabControl32` item was also still clipped.

The geometry evidence now points away from moving the page. BETA 997 reserves the page against the tab control's original item metrics. Asking the live tab for a taller 32-DIP item after that layout creates an overlap by construction; Apply later causes the native host to perform a relayout, which is why the full tab suddenly becomes visible. 1.0.0.15 therefore leaves the native item metrics unchanged and paints the selected-tab skin inside the rectangle returned by `TCM_GETITEMRECT`.

For the Edit, 1.0.0.15 keeps the confirmed parent `WM_CTLCOLOREDIT` brush but also handles `WM_ERASEBKGND` on the actual `ThunderTextBox` HWND itself, filling its client rectangle with the same persistent theme brush before default text painting. Focus transitions invalidate the edit so active/rest state changes repaint immediately.

This pass deliberately does not revive `TCM_ADJUSTRECT`, manual PropertyPage movement, or any designer-persistence changes. The 1.0.0.15 probe stays enabled for one more build so remaining behavior can be diagnosed from the actual host window messages.

## 1.0.0.16 owner-chain host discovery

The 1.0.0.15 log resolved an important ambiguity: `GetAncestor(picChrome.hWnd, GA_ROOT)` returned the top-level `ThunderPropertyPageDC`, not the outer property-sheet dialog. The resulting probe showed `Tab: HWND=0` and `PageDialog: HWND=0`, so the skin had no access to the actual tab control in that build.

The PropertyPage is effectively a top-level owned window in this designer path. 1.0.0.16 switches the host lookup to `GA_ROOTOWNER`, which walks the owner chain as well as the parent chain and should therefore resolve the real outer `#32770` PropertySheet. This is deliberately a discovery fix only, not another geometry experiment.

## 1.0.0.17 late host acquisition

The 1.0.0.16 run showed the search Edit fix working and the native tab fully visible, but the outer shell stayed classic/light. Its log still began with `ThunderPropertyPageDC` as the host and no tab HWND. Later `WM_WINDOWPOSCHANGED` entries showed BETA 997 moving that page into its final PropertySheet position.

This means the `GA_ROOTOWNER` lookup itself was not necessarily wrong; it was being called before an owner existed. 1.0.0.17 therefore retries `ApplyHostTitleBar` on every `picChrome_Paint`. The intended sequence is: early paint may still see only the page; after BETA 997 inserts/moves the page, the resulting repaint resolves the real owner and `UI3SkinPropertySheetHost` swaps the skin to that host.

This is intentionally a timing fix only. The native tab metrics, ThunderTextBox brush/erase handling, and persistence bridge are unchanged.

## 1.0.0.18 structural host promotion

The 1.0.0.17 run disproved the assumption that `GA_ROOTOWNER` becomes useful after the page is hosted. The log still reported `ThunderPropertyPageDC` as the effective host even after repaint. However, it again captured `WM_WINDOWPOSCHANGED` moving that same page from its initial `(0,0)` top-level position to the PropertySheet's `(21,63)` hosted position.

1.0.0.18 therefore stops trying to infer the host through root/owner semantics. After `DefSubclassProc` processes `WM_WINDOWPOSCHANGED` on the `ThunderPropertyPageDC`, tbUI3 walks `GetParent` repeatedly and calls `FindWindowExW(..., "SysTabControl32", ...)` on each ancestor. The first ancestor with that direct tab child is treated as the real PropertySheet and receives the existing skin.

This uses the hierarchy already observed in the earlier 1.0.0.13 host-tree dump as a runtime structural fingerprint. No page movement or tab resizing is added.

## 1.0.0.19 deferred skin activation

1.0.0.18 proved the structural host lookup: the page promoted to the outer `#32770`, with a valid `SysTabControl32` and inner page dialog. Yet the screenshot still showed native light tab/button chrome even though the titlebar and page were dark.

The remaining suspicious difference is timing. 1.0.0.18 called `UI3SkinPropertySheetHost` while still executing the `ThunderPropertyPageDC` `WM_WINDOWPOSCHANGED` subclass callback. 1.0.0.19 now posts a private `WM_APP` message back to the page, returns from the native window-position callback, and performs the same structural promotion only when that posted message is later dispatched.

The pass also logs the return value of `SetWindowSubclass` for the promoted host, tab and each action button. This will show whether any remaining light paint is caused by attachment failure or by the custom paint path itself.
