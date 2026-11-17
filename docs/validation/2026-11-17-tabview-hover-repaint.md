# TabView hover repaint and separator follow-up, 2026-11-17

Package 1.0.0.69; add-in 1.3.0.17 / adapter v10 unchanged.

## Report and implementation

Shane confirms package 68 resolves the malformed designer JSON. Screenshots show an unwanted horizontal stroke above page content, a large page in the running test form, white flashes when moving over tabs and a divider visible through the left edge of a hovered tab.

- Removed the two page-top FillBox strokes and their join-position calculation. This applies to Edge and Explorer as explicitly requested; curve geometry and page origin remain unchanged.
- Each tab draws its right separator. It now checks both its own hover state and the next tab's hover state, retaining the existing selected-neighbor checks. This hides both edges of a hovered tab without removing unrelated separators.
- Runtime hover, press, focus and overflow scrolling use an InvalidateRect update limited to the 40-DIP header, rounded up to physical pixels and clamped to the client rectangle, with bErase=FALSE. Zero HWND/failed or empty client rectangles are rejected. Native layout/property refreshes and synchronous designer snapshots are retained.
- The existing host-only comctl32 subclass returns nonzero for WM_ERASEBKGND instead of forwarding to the default system brush. Opaque Direct2D painting provides the background. Leave/capture/focus/enable invalidations also target the header. Mouse movement rearms tracking without reinstalling the subclass.
- The test form's existing Form_Resize moves UI3TabView1 to (240,240) with width/height ScaleWidth/ScaleHeight minus 480 twips. This explains its nearly form-sized content surface. No sample sizing behavior, saved forms, children or public identities were changed.

The erase contract follows Microsoft's [InvalidateRect documentation](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-invalidaterect) and [WM_ERASEBKGND documentation](https://learn.microsoft.com/en-us/windows/win32/winmsg/wm-erasebkgnd). Existing Toolkit curve authority is unchanged; page-top stroke removal is Shane's explicit presentation request.

## Validation and limits

- 148 automated tests pass, with zero skips. The added test executes the native separator condition over five tab positions, each selected position and each hover position plus no hover. It failed before adding the next-tab hover condition and passes afterwards.
- 71 exact mirrors, embedded package/reference 69, stored JSON, IDs, page ownership and CRLF checks pass.
- Equivalent Win32 probe tools/probes/tabview-repaint.ps1 passes in 32-bit and 64-bit Windows PowerShell. A non-activating offscreen test window receives 100 header invalidations at each of 96/120/144/168/192 DPI. The resulting update rectangle excludes the page, no erase is requested, and WM_ERASEBKGND returns handled without forwarding. Initial probing with a fully hidden window produced no update rectangle; the final probe uses an offscreen visible-style window and destroys it in finally.
- The API probe does not compile or run UI3TabView. No compiled BETA 1044 screenshot or flicker-free acceptance is claimed.

Next native check: reopen the updated embedded test project/rebuild package 69, run both styles in Light/Dark, move repeatedly across selected/unselected/adjacent tabs and off the control, press/drag out/release, change keyboard focus, select/scroll and resize. Confirm no white flash, no horizontal page-top stroke, correct neighboring separators and unchanged page children/layout. Newly drawn controls retain their drawn size unless application code resizes them.
