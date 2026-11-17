# TabView shape profiles and core header interaction — 2026-11-17

Candidate: tbUI3 1.0.0.66, tbUI3IDE 1.3.0.16, designer adapter v9. This is an appearance/navigation pass, not a declaration that TabView is finished.

## User requirements and authority

Shane confirmed that the designer workflow works and requested appearance/interactions next. He specified the customized Toolkit shapes, both Edge/Explorer choices through a property, and Edge as the default.

The reference is the user-provided local clone of Smith-Debnam/twinBASIC-Knowledge, commit `85432018090efc339d21ae7c47fd0e45ac8dea6b`. The canonical examples/WinUIElementToolbox/WinUIElementToolbox.twinproj matched all 23 source mirrors using its validator. Read sources: ui/winui.css tab tokens/rules, ui/toolbox.js initializeTabView, docs/fidelity/FIDELITY_068.md and reference/winui-components/TAB_CONTROLS.md. Reference files were not modified. The initial older Arrow-Loop fork was not used as shape authority.

Edge: 36-DIP tab, 4-DIP top inset, 8-DIP top/concave radii, 40-DIP track. Explorer retains the prior 32-DIP tab/8-DIP top/4-DIP concave-foot WinUI profile with 8-DIP upper corners. The Toolkit customization is explicitly user-authored and overrides generic source defaults. Explorer's unselected hover uses the WinUI rounded container; selected shapes and Edge hover use circular vector outlines. Upstream context remains the existing microsoft-ui-xaml 3259dc4437540678368c6e7c72869cb58d14a568 TabView template/resource pin. No pixel numbers are presented as a new official WinUI default.

## Implementation

- Persisted TabStyle enum with Edge default, Explorer alternate, invalid-assignment rejection and old-form fallback. New public members follow the existing public contract; original class/interface/event/form/project identities remain unchanged.
- Native Direct2D path geometry for concave joins, selected fill/seam, separators suppressed beside selection, left-aligned DirectWrite ellipsis, theme hover/pressed/disabled states and keyboard-only content focus outline. Native circular arcs avoid SVG or package dependencies for the control.
- Pointer capture activates only a matching release and guards against changed page identity during a press. Hover is read from current cursor/window position and cleared by a comctl32 WM_MOUSELEAVE invalidation. Lost focus/capture and destruction are handled without a retained COM owner or timer.
- Overflow buttons scroll only the header viewport; selecting a page reveals it. Header width remains clamped to 100–240 DIP. Reserved feet, add/scroll areas and clipping prevent overlap; extremely small hosts omit arrows and retain keyboard access. Add/scroll glyphs are vertically centered per profile. Normal Tab can leave the control; arrows/Home/End and Ctrl+Tab/Shift+Ctrl+Tab navigate, Ctrl+T requests add when enabled.
- FirstVisibleTabIndex is a zero-based transient viewport property, not PropertyBag state. The adapter applies it in the existing native edit/snapshot batch without undo checkpoints or structural notification. Native snapshots can resize the hidden HWND, so resize does not force a manually scrolled viewport back to selection. Both profiles keep the page origin at 40 DIP and retain real page containers/child coordinates.
- Canonical package and full embedded test package updated to revision 66; add-in revision 16 and generated adapter script updated. Unrelated toolbar/theme behavior is retained.

## Checks performed

- 142 tests passed without skips/failures: toolbar/document-command regression suite, original TabView designer workflows, new two-profile top-inset/add/overflow/selection tests, native arithmetic-source execution, outline coordinate checks and public-member-order guard.
- 71 exact project mirrors pass, including the complete embedded package, stable control/form IDs and CRLF. Existing Settings line endings are retained.
- Live Windows API probes in x86 and x64 validate Direct2D factory/path/sink slots, by-value points, arc layout, profile bounds and inside/outside checks. Separate x86/x64 DirectWrite factory/ellipsis/trimming API calls pass. These are equivalent ABI probes, not compiled twinBASIC control tests.
- Browser plugin not available; external Playwright uses installed Edge with the verified Toolkit master CSS/runtime. The live Toolkit selected curve is compared with coordinates evaluated from the native .twin path builder: zero half-pixel sample mismatches in both Light/Dark. Page identity, content, Toolkit selection/hover, no error overlay, console/page health and screenshots pass at widths 1200/720. Previews are explicitly labeled source-derived vectors, not native control screenshots.
- Local, outside-repo evidence: .workspace-tools/tabview-style-qa.cjs, tabview-profiles-light.png, tabview-profiles-dark.png, narrower variants, tab-geometry-probe.ps1 and tab-text-probe.ps1.

## Native build attempt and required next gate

The Computer Use skill initialized and enumerated desktop apps, but launching the existing twinBASIC executable failed with `GetCursorPos failed: Access is denied. (0x80070005)`. A refreshed window inventory contained no twinBASIC window. No security setting was changed or alternate Windows UI automation used. An isolated test copy was prepared outside the repository but no IDE build or native control acceptance run occurred.

Build package 66 in the IDE, re-import the .twinpack into the test project, then rebuild/reload tbUI3IDE 1.3.0.16. Verify both profiles and saved style choice; native compile diagnostics; design/runtime switching, add and overflow; pointer hover/press/drag-off/leave/focus/capture; keyboard navigation; real 100/150/200% DPI and window resize; page ownership/coordinates and save/reopen/undo regressions. Check both architectures. Earlier intermittent reference-reload diagnostics remain historical until explicitly rechecked.

Close buttons/events, per-tab icons, pointer drag/reorder/tear-out, motion, UI Automation/high contrast and exact remaining selected-stroke template details are not complete in this pass. Native reference curves and API probes do not establish those features or waive the compiled-host gate.
