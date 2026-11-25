# Building a tbUI3 property page

This guide records how the icon picker (`UI3IconPage`) was built, and the mistakes made on the way, so the next property page starts from what works. It covers twinBASIC BETA 997 to 1012 on Windows 10 and 11. The evidence behind each rule is in `CHANGELOG.md` (1.0.0.5 to 1.0.0.38) and in `docs/research/2026-10-06-property-page-picker.md` and `docs/research/2026-10-07-property-page-chrome.md`.

Every rule below was learned from a real failure on Shane's PC. Where a cause is only inferred, it says so.

## 1. How a page is reached and applied

- A page is opened from the Properties pane's `(Custom)` row, with `...`. Add it through Project Explorer, Add, Add Windows PropertyPage, then tick it in the UserControl's `PropertyPages` list.
- The per-property link `[PropertyPage("PageName")]` above a property gives that property its own "..." button that opens the page. It did nothing up to BETA 1007; Wayne fixed it in BETA 1008, and Shane confirmed it on UI3Button.Icon in BETA 1012 (2026-10-19). Add the link as well as ticking the page, so both routes work.
- Never set `Me.Changed = False` in `SelectionChanged`. Setting `Changed` while the IDE is calling `SetObjects` raises Automation error 80004005 and the page doesn't open. Set `Me.Changed = True` only in response to a user action.
- A value set in `ApplyChanges` with `CallByName` changes the live control, but the designer reloads its saved copy and loses it. The icon picker survives this through the designer bridge in `UI3Icons` (`IconPageApplying`, `SetPendingIcon`/`TakePendingIcon`, `DesignName`, `DesignLog`). Don't change or remove that bridge until an experiment shows which part is needed. A new page that applies values needs the same treatment. Copy the pattern; don't redesign it.

## 2. Layout: one owner-drawn surface plus a few native controls

The page is one full-size PictureBox (`picChrome`) that tbUI3 paints with Direct2D. A few native controls sit on top of it, only where Windows' own behaviour is expensive to rebuild:

| Control | Why it is native | What tbUI3 does to it |
| --- | --- | --- |
| `txtSearch` (TextBox) | Caret, selection, clipboard, undo, IME and accessibility come free | Borderless, inset inside a search box that `picChrome` draws; coloured through hooks (section 4) |
| `picGrid` (PictureBox) | Its own window for mouse, wheel and clipping | Painted entirely with Direct2D |
| `vsbGrid` (VScrollBar) | Range and value only | Hidden; the thumb is drawn in `picGrid` |
| `lblInfo` (Label) | Designer placeholder only | Hidden at run time; the details are drawn in `picChrome` |

Rules:
- Lay out the `.tbppage` at the size the live page uses (460 by 456 DIPs), so the designer shows the real composition. `LayoutControls` only adapts it at run time.
- Anything purely visual (tab strips, buttons, labels, cards) belongs in `picChrome`'s Direct2D paint, not in extra native controls. Hit testing for drawn items is done in `picChrome_MouseDown/Move/Up`, in DIPs.
- To show or hide native controls per tab, toggle `Visible` only when the value actually changes (1.0.0.31). Re-arm the search box hooks when it comes back.

## 3. Painting without flicker

- **Own `WM_PAINT` on drawn surfaces.** `picChrome` is subclassed (`UI3PageSurface`). The subclass returns 1 from `WM_ERASEBKGND` and handles `WM_PAINT` with `BeginPaint`, a Direct2D DC render target bound to the paint DC, and `EndPaint`. This is the same pattern as the sheet's OK, Cancel and Apply buttons, and it is what finally stopped the tab-strip flicker (1.0.0.33). `picChrome.Refresh` erases first and flickers. A no-erase `InvalidateRect` with `UpdateWindow` still flickered while VB owned the paint (1.0.0.32).
- **Repaint drawn state with `RepaintChrome`** (`InvalidateRect` with bErase 0, then `UpdateWindow`), never `Refresh`, once the surface subclass is attached.
- **Don't add `WS_CLIPSIBLINGS` to a PictureBox after creation.** In 1.0.0.31 it stopped `picChrome` painting at all. The cause was inferred, not proven: VB's persistent DC kept a stale visible region.
- **Track `WM_MOUSELEAVE`** (`TrackMouseEvent`) so hover state clears when the pointer leaves the surface.
- Direct2D resources (brushes aside, which are made per paint) belong to the render target that made them. The icon picker keeps its SVG documents and bitmaps per surface (grid and chrome) and drops them when that surface's target is recreated or the library index changes (1.0.0.39, not yet built).
- Direct2D draws in DIPs. Convert mouse coordinates with the DC's DPI (`DpiOfDC`), and size native controls with `ScaleX`/`ScaleY`.

## 4. The native search box (the hardest part)

A native Edit paints in classic colours unless it is told otherwise at every paint. The working setup (`UI3Window`) has four parts:

1. **`WM_CTLCOLOREDIT`** is answered on the TextBox's real parent, `ThunderPropertyPageDC`, with a persistent theme brush (1.0.0.14). Confirm the route with the log before trusting it: `txtSearch.hWnd` is the `ThunderTextBox` itself, and its parent receives the message.
2. **`WM_ERASEBKGND`** on the `ThunderTextBox` fills its client area with the same brush (1.0.0.15). Focus changes invalidate it so the active and rest fills swap at once.
3. **Keep the hooks on the visible page.** The IDE creates a second, hidden copy of the page, with its controls still at their designer positions, and its paint arms the hooks for its own TextBox. Once the hooks are on a TextBox inside the sheet, a TextBox outside the sheet cannot take them (1.0.0.35).
4. **Repaint the box after the dialog's first paint.** The inner `#32770` container that holds the page erases its whole client area in classic button-face grey (rgb 240) after the search box has painted, and nothing repaints the box afterwards (proven by the 1.0.0.38 log). A one-shot timer on the TextBox, starting at 1 ms, repaints it. `WM_TIMER` is only delivered once no `WM_PAINT` is pending, so the repaint lands straight after that erase. Five more repaints follow up to 500 ms.

Wrong turns, so they aren't repeated:
- Repainting once after the chrome's first paint (1.0.0.33), and clipping the box out of the page's own erase (1.0.0.37), didn't help. The page wasn't the window painting the grey.
- `WM_CTLCOLORSTATIC` never arrives for the search box (1.0.0.36 log). It is answered anyway, which is harmless.
- Screen pixels (`GetDC(0)`) lag behind painting because Windows composes the screen later. To see what a window really holds, read its own DC (`GetDC(hWnd)`).
- A fully drawn search box was considered on 2026-10-19 and parked. It would mean rebuilding caret, selection, clipboard, undo, IME and screen reader support.

## 5. Skinning the property sheet around the page

The OK, Cancel and Apply buttons, the tab and the dialog belong to the IDE's property sheet, not to the page.
- **Find the sheet structurally.** It is the first ancestor of the page with a direct `SysTabControl32` child. `GetAncestor` with `GA_ROOT` or `GA_ROOTOWNER` returns the page itself, because the page starts as a top-level window and is moved into the sheet later (1.0.0.15 to 1.0.0.18).
- **Promote late.** Arm on the page's `WM_WINDOWPOSCHANGED`, then post a private message so the new subclasses attach after that callback unwinds (1.0.0.19). `WM_APP` is `&H8000&` (1.0.0.20).
- **Never downgrade the skin.** Repeated calls from page paints must not swap the real sheet for a lesser window (1.0.0.21).
- **Own `WM_PAINT`** on the host, tab and buttons. Painting after the default procedure shows the classic control for a frame (1.0.0.9). Move and resize the real buttons rather than drawing fake ones, so commands, focus and enabled state stay native.
- **Don't resize the native tab item.** The page is laid out against the original tab metrics, so paint inside `TCM_GETITEMRECT` instead (1.0.0.15).
- Centre the dialog once, on the monitor of its owner (1.0.0.24).

## 6. Diagnosing

- `PROPERTY_PAGE_LOG_ENABLED` in `UI3Window.twin` writes `tbUI3-propertypage.log` in `%LOCALAPPDATA%\tbUI3\Diagnostics\` (see [DIAGNOSTICS.md](DIAGNOSTICS.md)); it will sit beneath the tbUI3 "Store logs and diagnostics" switch after the alignment pass. Shane wants it left on until the property page work is completely finished.
- Log the facts that settle a question: window classes, parents, rectangles, which hook answered, and the window's own pixel before and after a paint or erase. Several builds were spent on guesses that a log would have settled in one.
- Present designs as proposals until Shane has built and run them, and record only observed results as validated.

## 7. Checklist for a new page

1. Add the page and tick it in the UserControl's `PropertyPages`. Add `[PropertyPage("PageName")]` above the property it edits; from BETA 1008 that property gets its own `...`, and `(Custom)` still works.
2. Lay out the `.tbppage` at the live size. Use one owner-drawn surface for everything visual, and native controls only for text entry or scrolling state.
3. Attach a `UI3PageSurface`-style subclass to the surface in `LayoutControls`, and repaint with no-erase invalidation.
4. If the page has a TextBox, route it through the existing hooks (`UI3SkinPropertySheetForPage` with the TextBox's hWnd) rather than writing new ones.
5. Call `UI3SkinPropertySheetForPage` from the page's paint so the sheet gets skinned once the page is inside it.
6. Apply values through the designer bridge pattern, and test that the value survives closing and reopening the form designer.
7. Test with the log on: first open, hover, typing, Apply, OK, Cancel, reopen, and win32 and win64.
