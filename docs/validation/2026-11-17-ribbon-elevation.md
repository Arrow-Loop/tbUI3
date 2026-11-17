# Ribbon elevation scope — 2026-11-17

Candidate: tbUI3IDE 1.3.0.14.

The ribbon command card now has no drop shadow or bottom border in standard and third-party themes. Its existing raised treatment is enabled only for WinUI3 Dark and WinUI3 Light, with case-normalized theme names. This applies to Ribbon and Hybrid in both full and simplified presentation, independently of the additional-styling switch. Theme changes toggle a presentation class without replacing command/control nodes. Command behavior, group dividers, dimensions, corner radius and popup styling are retained.

Validation: 130 tests, 71 exact project mirrors and Edge renderer checks pass. Edge covers 32 theme/profile/presentation states, including live transitions through native Dark/Light/Classic, custom names and both WinUI themes, with no page/console errors. Native add-in build/reload acceptance remains pending. Package 65, adapter v8 and stable identities are unchanged.

## Evidence and limits

- Source: css/ide-toolbar.css defaults the command surface to box-shadow:none and border-bottom:0. The WinUI-only shell class restores the existing Fluent shadow4 effect and theme border. No new visual values or upstream control-template claims are introduced.
- js/ide-toolbar.js reconciles the exact two theme names at build and on the existing tick. Leaving the theme removes the effect; returning restores it. Both replacement profiles and presentations use the same shell rule.
- Automated tests exercise live theme transitions and preserve the same button/input/select nodes, including styling Off. The CSS assertions cover flat defaults and the explicit WinUI override.
- Browser plugin not available; used the existing external Playwright/installed Edge native-markup fixture at an ephemeral loopback URL, 1920x720. Theme checks use generated WinUI files and installed native Dark/Light/Classic files. Third-party and similarly prefixed names are checked for the flat treatment.
- Page identity, meaningful UI content, no error overlays, console/page health, interactions and screenshots pass. Computed shadow is none and bottom border 0 outside WinUI3; both existing effects return in WinUI3. Full/simplified command heights remain 100px/48px. Existing Classic, command dispatch, accent and inset checks pass in the same runner.
- Local evidence outside the repo: .workspace-tools/ribbon-elevation-qa.cjs, ribbon-native-dark-flat.png and ribbon-winui-dark-raised.png. No browser fixture/dependency is shipped.
- Regenerated IdeToolbarScript.twin and patched revision 14 Settings into the canonical project. The 71 exact mirrors/CRLF/identities/embedded package checks pass. No native compiled add-in was built/run in this pass; user rebuild/reload confirmation remains open.
