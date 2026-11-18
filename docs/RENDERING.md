# How a tbUI3 control paints

Every drawing control paints through `UI3Surface` so that flicker is handled once, not per control. Background and evidence: `docs/2026-11-18-flicker-free-rendering-plan.md`. `tests/rendering-surface.test.mjs` fails when a drawing control does not follow this page, unless it is listed in that test's `HOST_PAINT` with a reason.

## The rules

1. Implement `IUI3SurfaceClient` and own one `UI3Surface`.
2. Never create a render target, call `BeginDraw`/`EndDraw`, subclass the window, call `InvalidateRect` or handle `WM_ERASEBKGND` in the control. The surface does all of that.
3. Never call `UserControl.Refresh` at run time. Use `m_Surface.Invalidate` (whole control) or `m_Surface.InvalidateArea X, Y, W, H` (DIPs). `UserControl.Refresh` is only for the designer, behind `If OwnsPaint() Then ... Else`.
4. Keep layout and discovery out of `SurfaceRender`. Compute them when size, DPI, content or a property changes. Paint only draws.
5. Get brushes from `SolidBrush` and text through the `UI3D2D` drawing helpers. During a surface frame they come from caches; don't call `CreateSolidColorBrush` or `CreateTextFormat` yourself.
6. Hover: return a part id from `SurfaceHitTest` (0 for none) and invalidate only the affected area in `SurfaceHotChanged`. Read `m_Surface.HotPart` when drawing. After your own layout moves under a still pointer (scrolling, selection), call `m_Surface.SyncHot`.
7. Containers that hold user controls stay on host paint until the windowless-children probe in ROADMAP is answered.

## Skeleton

```vb
Public Class UI3Example
    Implements IUI3SurfaceClient
    Private m_Surface As UI3Surface
    Private m_Target As ID2D1RenderTarget   ' borrowed for one SurfaceRender call

    Private Sub EnsureSurface()
        If m_Surface Is Nothing Then Set m_Surface = New UI3Surface
        m_Surface.Attach UserControl.hWnd, Me, Ambient.UserMode
    End Sub

    Private Function OwnsPaint() As Boolean
        If Not m_Surface Is Nothing Then OwnsPaint = m_Surface.OwnsPaint
    End Function

    Private Sub Repaint()
        If OwnsPaint() Then
            m_Surface.Invalidate
        Else
            UserControl.Refresh           ' designer snapshot only
        End If
    End Sub

    Private Sub UserControl_Show()
        EnsureSurface
    End Sub

    Private Sub UserControl_Terminate()
        If Not m_Surface Is Nothing Then m_Surface.Detach
    End Sub

    ' Design time only; at run time the surface handles WM_PAINT and this never fires.
    Private Sub UserControl_Paint()
        EnsureSurface
        m_Surface.PaintEvent UserControl.hDC
    End Sub

    Private Sub IUI3SurfaceClient_SurfaceRender(ByVal Target As ID2D1RenderTarget, ByVal w As Single, ByVal h As Single)
        Set m_Target = Target
        ' The surface has cleared to SurfaceBackground and clipped to the dirty area. Draw everything.
        Set m_Target = Nothing
    End Sub

    Private Function IUI3SurfaceClient_SurfaceHitTest(ByVal X As Single, ByVal Y As Single) As Long
    End Function

    Private Sub IUI3SurfaceClient_SurfaceHotChanged(ByVal OldPart As Long, ByVal NewPart As Long)
        m_Surface.Invalidate
    End Sub

    Private Sub IUI3SurfaceClient_SurfaceStateChanged(ByVal Message As Long)
        m_Surface.Invalidate
    End Sub

    Private Function IUI3SurfaceClient_SurfaceDialogCode(ByVal Code As LongPtr) As LongPtr
        IUI3SurfaceClient_SurfaceDialogCode = Code
    End Function

    Private Function IUI3SurfaceClient_SurfaceBackground() As Long
        IUI3SurfaceClient_SurfaceBackground = UI3TabMetrics.PageBackground()   ' any opaque ARGB
    End Function
End Class
```

## When something still flickers

Set the environment variable `TBUI3_PAINT_TRACE=1` before starting the IDE or the built app. Every erase, paint (with its dirty rectangle, duration and HRESULT), invalidation and hover change is written to `tbUI3-paint.log` next to the project or EXE, or `%TEMP%` if that folder is read-only. A screen recorder often misses a flash shorter than one frame; a phone's slow-motion video does not.
