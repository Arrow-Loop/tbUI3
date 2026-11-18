# Flicker-free rendering foundation for tbUI3 controls

Status: approved by Shane 2026-11-18 (TabView first). Pass A is implemented in package 1.0.0.71 but not yet built in twinBASIC or seen on a display. How to write a control against it: `docs/RENDERING.md`.
Branch read: `tbui3-dev` at d740ed3 (package 1.0.0.70). Not `main`.

## The goal

Every tbUI3 control paints through one shared piece of code that is flicker-free by construction. A new control supplies only "what do I look like" and "where is the pointer"; it never touches erasing, invalidation, render targets or brush lifetimes. Flicker stops being something we debug per control.

## What the repository's own history tells us

This is the third time we have hit the same flash, and the pattern is consistent:

| Where | What we tried first | Result | What fixed it |
| --- | --- | --- | --- |
| Icon picker chrome (1.0.0.30 to 1.0.0.33) | `InvalidateRect` with no erase (1.0.0.31, 1.0.0.32) | Still flickered on hover | 1.0.0.33: subclass the window, swallow `WM_ERASEBKGND`, handle `WM_PAINT` ourselves with `BeginPaint`/`EndPaint` (`UI3PageSurface`). Shane: "no flicker on the tab strip or any tab's content". |
| Icon picker grid (1.0.0.52 to 1.0.0.53) | `picGrid.Refresh` | Flickered on scroll | Same `UI3PageSurface` route. Shane: smooth. |
| Property sheet tabs and buttons (1.0.0.18 to 1.0.0.21) | Native paint | Flicker on hover | `UI3Window` owns their `WM_PAINT`. Shane: "hover works". |
| TabView header (1.0.0.69, 1.0.0.70) | `InvalidateRect` with no erase, swallow `WM_ERASEBKGND` in a subclass, sync `BackColor` | Still flashes on the physical display | Not yet tried: owning `WM_PAINT`. |

In plain terms: twinBASIC's UserControl and PictureBox have their own paint routine that runs before our `Paint` event. Telling Windows "don't erase" isn't enough, because the host's own routine still gets a turn first. Every time we took the whole `WM_PAINT` away from the host and drew the frame ourselves in one go, the flicker stopped. TabView is still on the host's routine, and so is UI3Button.

The flash showing on the monitor but not in a screen recording fits this: it lasts less than one recorded frame. (Testing tip: a phone's slow-motion video catches it where a screen recorder won't.)

## Secondary costs Shane already spotted

These make each paint slower, which widens any window in which a half-drawn frame can be seen, and they waste CPU on every mouse move. Measured from the current source, not timed:

- Every TabView paint re-enumerates `ContainedControls` (`CollectPages`) and recomputes the layout.
- Every fill creates a new Direct2D brush (`SolidBrush` calls `CreateSolidColorBrush` each time).
- Every caption creates a new DirectWrite text format and ellipsis sign, and checks the system font list (`DrawLeftTextStyled`, `FontFamilyExists`).
- Every tab shape rebuilds its path geometry (`TabOutline`).
- UI3Button repaints with `UserControl.Refresh` (synchronous, full control, host routine) on every state change.

## Proposal: `UI3Surface`

One private class plus one private interface, in the tbUI3 package. Each control owns one `UI3Surface`.

```
' Private interface the control implements (as built in 1.0.0.71, UI3SurfaceHost.twin)
Interface IUI3SurfaceClient
    Sub SurfaceRender(ByVal Target As ID2D1RenderTarget, ByVal WidthDips As Single, ByVal HeightDips As Single)
    Function SurfaceHitTest(ByVal X As Single, ByVal Y As Single) As Long       ' part id under the pointer, 0 = none
    Sub SurfaceHotChanged(ByVal OldPart As Long, ByVal NewPart As Long)          ' only on a real change
    Sub SurfaceStateChanged(ByVal Message As Long)                              ' capture, focus, enabled
    Function SurfaceDialogCode(ByVal Code As LongPtr) As LongPtr                ' WM_GETDLGCODE
    Function SurfaceBackground() As Long                                        ' opaque ARGB behind the frame
End Interface
```

Implementation note: the proposal's separate `SurfaceLayout` callback was not needed. Layout stays in each control and is rebuilt only when it changes (TabView: `RefreshPages` on show, resize, property and page changes), and the surface's render path never triggers it.

What `UI3Surface` does, so no control has to:

1. **Owns the paint at run time.** Subclasses the control's HWND with the comctl32 `SetWindowSubclass` pattern AGENTS.md requires. `WM_ERASEBKGND` returns 1. `WM_PAINT` is handled with `BeginPaint`/`EndPaint` and never reaches the host's routine. `WM_PRINTCLIENT` draws the same frame. This is the step every successful fix above had in common.
2. **Draws a whole frame in one blit.** It keeps one cached `ID2D1DCRenderTarget` per control, binds it to the paint DC, clips to the dirty rectangle, clears with an opaque surface colour and calls the client once. Direct2D composes offscreen and copies once at `EndDraw`, so the screen never sees a partial frame. On `D2DERR_RECREATE_TARGET` it rebuilds the target and its cached brushes and repaints.
3. **Caches resources.** Brushes are cached per surface, keyed by ARGB value. Because the key is the colour itself, a light/dark switch needs no special handling: new colours simply create new brushes, and the cache is cleared when it grows past a small bound or the target is rebuilt. Text formats move to a shared cache in `UI3D2D`, keyed by family, size, weight, alignment and trimming, and the font-exists check is done once. Controls keep their own path geometries in their layout cache.
4. **Keeps layout out of paint.** `SurfaceLayout` runs only after `Surface.InvalidateLayout` (size, DPI, content or property change). Paint just draws what layout computed.
5. **Invalidates precisely.** `Surface.Invalidate` (whole control) and `Surface.InvalidateRect x, y, w, h` (in DIPs, rounded out to device pixels) always use `bErase = FALSE`. There is no path that calls `UserControl.Refresh` at run time.
6. **Tracks hover and press once.** It handles `TrackMouseEvent`/`WM_MOUSELEAVE`, calls `SurfaceHitTest`, and calls `SurfaceHotChanged` only when the part under the pointer actually changes. Pressed and capture state live here too. A mouse move inside one tab costs nothing.
7. **Handles DPI and theme.** It reads the window DPI (and `WM_DPICHANGED`), and repaints on the existing theme notifications without rebuilding anything that isn't colour-dependent.
8. **Cleans up.** Removes its subclass and releases the client on `WM_NCDESTROY`, which also breaks the control/surface reference cycle so `Terminate` still runs.
9. **Optional paint trace.** A switch that logs every erase/paint/invalidate for the control (message, rectangle, time) to a log next to the `.twinproj`, with a `%TEMP%` fallback. If a flash ever appears again, we read the log instead of guessing.

### Design time stays on the proven path

The IDE takes synchronous snapshots of controls after edits, and we don't yet know whether those come through `WM_PAINT`. So at design time the surface does not subclass. The control's `UserControl_Paint` just calls `Surface.PaintFromEvent UserControl.hDC`, which runs the same render code. Same picture, two delivery routes. A later probe can decide whether design time can use the owned route too.

### One known limit: containers with windowless children

If twinBASIC draws windowless controls (for example a Label) through their container's own paint routine, owning `WM_PAINT` on a container would make those children disappear. So `UI3TabPage`, which holds the user's controls, stays on the host route; it only fills a flat colour and isn't involved in hover. The TabView host is safe because user controls live on its pages, not on the host. Before any future container control uses the owned route, a small probe answers this question.

## Keeping it enforced

A new source test in `tests/` (Node, like the existing ones) checks every public control:

- it has a `UI3Surface`,
- no `UserControl.Refresh` in a run-time path and no `CreateSolidColorBrush`/`CreateTextFormat` outside the caches,
- no `CollectPages`-style discovery inside a render method.

That turns "remember the flicker rules" into a test that fails when a new control forgets them. A short "How a control paints" section in `docs/CONTROL_FIDELITY_POLICY.md` (or a new `docs/RENDERING.md`) gives the template for new controls.

## Plan, in bounded passes

1. **Pass A, package 1.0.0.71:** add `UI3Surface`, the interface, the brush and text-format caches and the paint trace. Move `UI3TabView` onto it; `UI3TabPage` unchanged. Fold `UI3TabMetrics`' current subclass (erase, focus/capture invalidation, `DLGC` keys) into the surface so the TabView has one subclass, not two. Source tests plus the enforcement test. Shane checks hover/press/leave/focus, both tab styles, Light/Dark, resize, page switch, designer add/delete page, save/reopen, win32 and win64.
2. **Pass B:** move `UI3Button` onto the surface once Pass A is confirmed on the physical display.
3. **Later, optional:** move `UI3IconPage`'s chrome/grid from `UI3PageSurface` onto `UI3Surface` so there is only one implementation. Not required; that code already works.

Not proposed: DirectComposition or HWND render targets (Direct2D's DC target is already double-buffered, and those add D3D11 per control and design-time risk), and `WS_EX_COMPOSITED` on the form (it changes paint order for every control on the user's form, and is known to fight with Direct2D/DWM). Both stay on the roadmap as experiments only if Pass A fails.

## Risks

- Owning `WM_PAINT` means twinBASIC's `Paint` event no longer fires for that control at run time. That's intended; no tbUI3 control relies on it for anything else, but the source test will check.
- If the host does something besides drawing in its `WM_PAINT` (for example, internal bookkeeping), skipping it could matter. The two picker surfaces have run this way since October without a problem, which is the best evidence we have.
- `Implements` of a private interface on a `[COMControl]` UserControl hasn't been used in tbUI3 yet. If twinBASIC objects, the fallback is Friend methods called through a typed reference; the rest of the design doesn't change.
- Nothing here is validated until Shane sees it on the physical display.
