# Full/Simplified Ribbon, 2026-11-12

Candidate: tbUI3IDE 1.3.0.10. Shane's comparison image supplies the composition target: full groups versus one compact row with the same tabs/options. These are add-in Ribbon presentation choices, not a new native WinUI control or fourth toolbar mode.

## Behavior

- A fixed down chevron sits at the Ribbon's bottom-right corner. Clicking sets Simplified Ribbon, reverses it upward and changes its tooltip/accessible pressed/expanded state. Clicking again restores Full Ribbon. The corner remains reachable while the command row scrolls.
- Full command height remains 100px; simplified is 48px with a 32px control row and 20px icons. The 26px tab strip remains separate. Large captions become single-line horizontal labels; existing icon-only commands stay icon-only. Group names remain accessible while visual captions are hidden. MultiPage retains its pair separators.
- Switching styles reuses the same command/control nodes, selected tab, values, callbacks and enabled/checked state. Existing popups close before geometry changes; native selectors/Grid remain in place. Full label measurement resumes when expanding.
- Every tab/option remains present. Wide rows scroll horizontally with scrollbar/mouse wheel; focus reveals off-screen commands. Input/select wheel events are not intercepted. Automatic group overflow menus/adaptive collapse are not part of this pass.
- Ctrl+F1 performs the same switch in Ribbon. Hybrid keeps its existing hide/show shortcut and native-menu structure; Classic remains native.
- MainModule restores/saves SimplifiedRibbon independently of ToolbarMode and optional styling under the existing user preference namespace. The polling protocol drains each dirty kind separately; teardown now flushes all three. This is source/fixture-tested persistence plumbing, not a claim of a native restart test.

## Validation

- `node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs`: **116 passed, zero failed/skipped**, using Node v22.21.1, jsdom 26.1.0 and installed IDE native fixtures.
- Added coverage for toggle scope/state/direction semantics, unchanged DOM nodes/tabs/active selection, native selector/Grid preservation, lazy command dispatch, contextual/dynamic commands, disabled state, keyboard/mode transitions, wheel-event exclusions, saved restore without dirtying and execution of the actual preference-poll JavaScript with all three dirty kinds queued.
- `node tools/validate-tabview-projects.mjs`: **71 exact mirrors**, package/embedded reference, stable IDs, page ownership and CRLF checks pass. MainModule.twin, generated IdeToolbarScript.twin and Settings are patched into the canonical project.
- Browser plugin not available; Playwright used installed Edge with a temporary localhost fixture. At 1280px, verified expected page identity/nonblank content, 100px/48px command heights, 32px single-row commands/nowrap captions, a 180-degree chevron reversal, unchanged tab list and exact control node identities, retained command sets on every fixture tab, dropdown dispatch, Grid value preservation, contextual MultiPage, File/Escape and Ctrl+F1. All 55 requested SVGs still decode and prior logo/Options checks pass.
- At 640px, confirmed overflow, keyboard focus scrolling the last Insert command into view, and the corner toggle remaining within the Ribbon bounds. Reviewed full, simplified Home, simplified Form/Grid/MultiPage and narrow Insert screenshots. No page/console errors. Fixture runner/screenshots remain outside the repository.
- Native twinBASIC build/restart, full/light/dark/high-contrast native rendered acceptance and user acceptance remain pending. MainModule changes are settings/string logic only; no Win32/COM declarations, struct layouts, control IDs or pointer-width-sensitive code changed. Runtime package 65 and adapter v8 are unchanged.

## Native follow-up

Build/reload 1.3.0.10. Check the corner down/up toggle on each tab, compact dropdowns and Grid edits, narrow scrolling, native command state/dispatch, File navigation and Ctrl+F1. Restart the IDE to confirm the saved presentation, then switch between Ribbon/Hybrid/Classic and confirm the independent preference and existing structures are retained.
