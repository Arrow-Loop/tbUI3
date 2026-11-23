# Handoff: tbUI3

## 2026-11-23 - Allow the native updater executable in Git

Added a narrowly scoped ignore exception for `tbIDE/Updater/Build/Updater.exe`. All other contents of that Build folder and all other Build folders remain ignored. The only local EXE available to Cody is the stale November 19 launcher (35,328 bytes), so it was deliberately not committed; Shane's newly compiled/tested updater can now be added from his build checkout. This pass changes ignore rules and documentation only; it does not embed the helper or publish a release.

## 2026-11-23 - Native updater startup confirmed; 58/58 tests pass

Shane's new diagnostic snapshot 5235529 reports **58/58 native self-tests passed**, including trusted UTF-8 document navigation. The compiled startup log confirms the generated data page is allowed, both embedded scripts are requested, `updater:ready` arrives, and final navigation succeeds (status 0). The supplied screenshot shows the updater's own expected no-context ready screen. This confirms the compiled blank-window fix; it does not establish IDE debug startup, live update/elevation/recovery/self-update or add-in embedding acceptance. Sanitized evidence references: `tbIDE/Updater/validation/native-startup-2026-11-23-passed.json`. No production source, canonical projects, Wizard or binaries changed in this evidence-only pass.

## 2026-11-23 - Updater trusted document navigation and IDE resource decoding

The latest private diagnostic snapshot (12d1846, startup blob f1c6aa9) identifies the compiled blank window: the generated HTML navigates as a UTF-8 Base64 data URL, which the old about:blank-only guard cancelled. The host now computes and authorizes only that exact generated document, preserving rejection of external and unrelated data pages. Resource decoding now uses the WebView2 package's raw-string conversion before explicit UTF-8 decoding; failures distinguish resource lookup from decoding. The updater retains its own UI; no Welcome Wizard changes.

Canonical updater and mirrors are synchronized. **237 Node tests pass**; the executable native suite now contains **58 cases**, adding an independent Unicode/Base64/navigation-policy test. Previous native evidence remains 57/57 before this patch. Native compilation, IDE and compiled-EXE page-ready confirmation remain pending Shane's acceptance; no GUI automation, binary embedding, release or main merge.

## 2026-11-23 - Updater host aligned to the working Smith Debnam Toolkit

Shane designated the private **sdlaw-sdelorme/Diagnostics** repository as the ongoing incoming diagnostic source. Read it through the Smith Debnam connection; local output remains `%LOCALAPPDATA%\tbUI3\Diagnostics\`. No automatic upload or writes to the diagnostics repository are added.

The latest snapshot again records 57/57 native self-tests passing. Its startup log shows one embedded-resource-assembly E_FAIL, then another run submitting a 192,315-character HTML document without a recorded page-ready handshake. This narrows the evidence without proving the precise blank-window cause.

Compared the current Smith-Debnam Toolkit example at **218871daaae25c81df668d174b80284edae22ec2** against its canonical mirror hashes. Aligned updater event conventions, constructor DPI initialization, complete IDE-created form defaults, black native underlay, Ready reentrancy guard and navigation-completion lifecycle. Replaced the custom pointer-based UI resource conversion with the Toolkit's whole-buffer LoadResData/StrConv pattern, explicitly selecting UTF-8 for our resources. Per-resource error context is retained. Form identities, updater dimensions and security restrictions remain; Gallery, tab windows, splash and installer/message-box dependencies are not imported.

**Updater.exe retains its separate update/progress/recovery UI. The Welcome Wizard remains add-in-only.** Native form/UI launch and the changed resource reader still require rebuild/runtime confirmation; no native success is claimed by source/DOM checks. Canonical projects/mirrors are synchronized. No main merge, PR, release, binary embedding or GUI automation.

Validation: **235 Node tests pass**, with **134 exact canonical/source mirrors**, stable IDs/CRLF/hex checks, generator idempotence and diff checks passing. The existing user-provided 57/57 native result predates this host change; no new native compile or GUI run was performed by Cody.

## 2026-11-23 - Refined Wizard integration, native 57/57 evidence, unified diagnostics

Integrated Quill's approved view through **79be9e5** unchanged: full Master CSS/shared controls in an isolated iframe under the native HTML dialog, real native installed-theme inventory/parent inheritance/color data, exact-name apply validation, Windows accent, correlated acknowledgements, conditional Setup, async repair, hidden channel selector and revised feature copy. Production settings also omit channel selection; internal release safety/channel metadata remains. Known BETA 1045 loader behavior determines effective duplicate-name selection; no guessed AppData/local precedence. New native palette/host code still needs native acceptance; unresolved colors are explicitly unavailable.

Shane's second archive reports **57 native self-tests passed, zero failed** after the byte-buffer correction. The original 42/54 report and the passing report/archive digest are retained in `tbIDE/Updater/validation/`. These results establish the tested engine cases, not WebView2 or live installation acceptance. Actual helper binary embedding remains the separate Phase 1 pass.

Consolidated active TabView, property-page, paint/designer, updater startup/worker and native-test diagnostics under **%LOCALAPPDATA%\tbUI3\Diagnostics\**; [diagnostic locations](docs/DIAGNOSTICS.md). Operational recovery/settings/profile data stays in place. Canonical core, test embedded package, add-in and updater are synchronized; rebuild/re-import existing consumers to adopt the new routes. No trace flags enabled, user projects rewritten or old logs deleted.

Shane reported a blank updater form and blank browser fallback despite detected WebView2. Corrected IDE argument parsing (`Command$` instead of host-process command line), changed fallback to verified atomic UTF-8 output with actual escaped error, added startup-stage/error-number logs and guarded repeated fallback. **The blank native window's exact failing operation remains unconfirmed pending the new stage log; no GUI/native startup success is claimed.** See the diagnostic guide. No Screen Control/GUI automation, main merge, PR, release or compiled-helper embedding.

Validation for this integration/diagnostics pass: **232 repository Node tests and 24 Quill source tests pass**; **134 exact mirrors** across core, embedded test package, add-in and updater, stable IDs/CRLF/hex rules, generator idempotence and diff checks pass. These are automated/static results; no new native build or GUI automation was run by Cody.

## 2026-11-23 - Native report: 42/54 passed; typed byte-buffer correction

Shane supplied `tbUI3-native-updater-tests-rad87A03-tmp.zip`: 54 native cases completed, 42 passed and 12 failed; all 19 ZIP cases passed. Archived atomic JSON, Unicode JSON, installed-file bytes and journals are well-formed, while text/JSON reads and comparison-dependent transaction assertions fail. This points to the native text-reader boundary: `UDecodeText` took addresses/indexed ByRef values through a Variant byte array rather than typed Byte storage. The same unsafe pattern existed in bundled payload output.

Changed text decoding, UText storage, raw byte writes and bootstrap resource callers to typed `Byte()` buffers, including nonzero lower-bound support. Added the ABI rule to AGENTS.md, static regression contracts and three executable native cases (raw byte roundtrip, nonzero-bound UTF-8 decode, invalid UTF-8 rejection). Canonical projects/mirrors are synchronized; revised executable suite is **57 cases**. Preserved the original report and archive SHA-256 under `tbIDE/Updater/validation/` without storing workstation paths.

Validation: 19 focused Node tests and 127 mirror/IDs/CRLF/hex checks pass. **The corrected native EXE has not been compiled/run by Cody; resolution of the 12 failures requires a fresh native rerun.** Existing native evidence remains 42/54, not a passing acceptance gate. No release, GUI automation or payload embedding performed.

## 2026-11-23 - Updater launches without administrator credentials

Shane reported UAC before Updater.exe could start from a standard account. The project omitted an explicit execution-level manifest, leaving the 32-bit executable subject to Windows installer-detection heuristics. Added canonical/mirrored `Resources/MANIFEST/#1.xml` with `requestedExecutionLevel level="asInvoker" uiAccess="false"`. Normal launch and self-tests use the caller's permissions; the existing explicit, approved protected-folder worker still uses `runas` when required. No change to same-account privileged-worker policy.

Bundle preparation and release verification now inspect the real EXE's RT_MANIFEST/#1 in every language and reject missing/elevating manifests. Regression tests cover canonical resource embedding, namespace-valid XML, missing/unsafe/multilingual/comment-only manifests and UTF-16. Validation: all 15 focused PE/contract tests and 127 exact mirror/IDs/CRLF/hex checks pass. Native rebuild and standard-account launch remain unperformed by Cody. Reopen/rebuild Updater.twinproj before retesting; the already compiled EXE is unchanged. No release or embedding pass performed.

## 2026-11-23 - Phase 1 native installation-manager source and wizard integration

Implemented source candidate tbUI3IDE **0.4.0.0** / Updater **0.2.0.0**: shared per-user deployment/bootstrap and explicit backed-up repair, per-root identity/settings/approval/recovery, schema-versioned strategy/transaction/inventory contracts, protected IDE scoped UAC verification, detached native self-update, Options integration and Quill's committed Welcome Wizard through real native services. Canonical projects and mirrors are synchronized. Corrected add-in baseline remains 0.3.0.20; separate core tbUI3 1.0.0.75 is unchanged.

Shane's subsequent sequencing instruction makes **actual compiled Updater.exe embedding a separate Phase 1 pass after native acceptance**. Bundle generation and real compiled-DLL verification are implemented; no stale/mock payload is embedded. The combined first public release remains gated on accepted updater, both embedded DLLs, shared-loader evidence and complete first-install/runtime acceptance. Phases 2/3 remain deferred. See [Phase 1 handoff](tbIDE/PHASE1_HANDOFF.md) for build order, static loader evidence, open native gates and focused acceptance. This source pass does not claim successful native compilation or a production-ready release. Validation: 211 Node tests plus 9 Quill smoke tests pass; 126 exact mirrors/IDs/CRLF/hex checks, regeneration idempotence, release-tool syntax and diff checks pass. Native builds, 54 authored executable self-tests, live loader/update acceptance and actual DLL payload verification remain unperformed.

## 2026-11-23 - BETA 1045 hex-literal warnings corrected; automated gate added

Explicitly typed the updater's Unicode, PE and ZIP literals and its intentional signed GUID field. AGENTS.md now defines the required width rule; both the normal project validator and Node suite enforce it against active canonical projects and mirrors. Source checks pass; reopen/recompile Updater in BETA 1045, then run its native self-tests. Public repository access is available, but end-to-end binary update acceptance still needs a published release with ZIPs and tbUI3-update.json. No release is published by this pass.


## 2026-11-20 - Updater compile correction awaiting recheck

Fixed Shane's BETA 997 TB5172 duplicate-label report by separating the three DPI initialization/window-opening call sequences in MainModule. Canonical project/mirror validation passes. Next: reopen the updated Updater project and compile again; native build/runtime and the executable self-tests remain pending.


## 2026-11-20 - Native updater port, source complete; compile next

Shane requested all updater runtime logic be twinBASIC. This pass replaces `tbIDE/Updater/Updater.ps1` with ten private native source files in the canonical `Updater.twinproj`. Updater 0.1.0.1 hosts WebView2 and launches another hidden instance as its worker; Apply/Recover must use a verified session copy, freeing the installed EXE for replacement. The add-in prerequisite check now requires only `Updater.exe`; add-in source is 0.3.0.22, corrected baseline still 0.3.0.20. No control-package, library-version or upstream-version changes.

The full release/staging/consent/transaction/recovery behavior is ported. Native JSON parsing, streaming WinHTTP/CNG, ZIP central-directory validation and private RFC 1951 decoding avoid script/managed runtime dependencies. Schema-2 journals and exact FILETIME identities replace script-era sessions. The standalone packager remains development-only PowerShell and now emits only the native EXE for the updater component.

Validation: 186 Node tests pass; fixture zlib/hashes, no-interpreter/source-ordering contracts, existing UI behavior, package/reference/IDs/CRLF and 104 exact mirror files checked. Packaging syntax parsed. New native code has NOT been compiled or executed; the earlier script engine's 23 tests are historical evidence only. No live installation modified.

**Next action (Shane):** close/reopen the canonical projects before saving/building. Build the add-in in win32/win64 and Updater in win32. Run `Updater.exe -SelfTest` and require all 47 cases to pass (results pointer: `%TEMP%/tbUI3-native-updater-latest.json`). Copy only the fresh EXE beside twinBASIC.exe, recheck updates to create a native session, then follow the disposable-installation acceptance list in [Updater README](tbIDE/Updater/README.md). Native compile/runtime remains deferred as requested. Previous instructions to copy Updater.ps1 are superseded.


## 2026-11-19 - Updater implementation candidate (tbUI3IDE 0.3.0.21, Updater 0.1.0.0)

Implemented asynchronous release checks and an IDE Options update panel with automatic-check opt-out, per-component installed/available versions, notification, selection, Update Now/On Exit/Later and normal-shutdown approval. Source failures are independent. The add-in never replaces its loaded DLL.

Added a native twinBASIC sidecar with an embedded WebView2 interface based on Smith-Debnam/twinBASIC-Knowledge 0babc88f: shared named controls/Master CSS, live Windows theme/accent, local browser profile, restricted bridge, in-memory script resources, progress, retry/recovery and Runtime remediation without classic message boxes. A separate Windows PowerShell 5.1 engine verifies/stages published assets, waits for the owning IDE/other installation processes, protects locally modified vendor files, journals replacements, backs up and rolls back selected components, handles detached self-update, rejects downgrades on retry and optionally restarts the same IDE. Projects/embedded control packages are not rewritten.

Coordinated with Quill and incorporated the corrected add-in baseline 0.3.0.20; this feature pass is 0.3.0.21. Only the documented historical add-in identities are aliased; verified future stable receipts preserve real 1.x identities. Core tbUI3 1.0.0.75 and resource-library versions are unchanged. Added a release-manifest contract and architecture/version/stale-build-checked packager; no release was published.

Validation: 183 Node tests and 23 actual-filesystem/ZIP/recovery PowerShell 5.1 tests; 93 exact canonical/mirror files, embedded package, stable IDs and CRLF checks. Headless Edge Light/Dark + desktop/narrow interaction checks pass without browser errors. Actual official BETA 1044 ZIP: size/digest/signature checks and 197 managed files verified; BETA 997 baseline: 196 managed files verified, including zero-padded release-tag handling. tbUI3 currently returns public API 404; other sources remain usable.

Shane explicitly deferred final native compilation/runtime until tomorrow. The earlier minimal launcher was compiled before the WebView2 UI was added; it is stale and must not be distributed. Reopen the projects before building. See [Updater build, release and acceptance checklist](tbIDE/Updater/README.md).

**Next action (Shane):** close/reopen any IDE window holding the earlier Updater project before saving; build tbUI3IDE in win32/win64 and Updater in win32, copy the newly built EXE and Updater.ps1 beside twinBASIC.exe, restart, then follow the native acceptance list. Public repository visibility alone does not publish binary updates: the matching GitHub release, ZIPs and tbUI3-update.json are still required.


## 2026-11-18 - UI3Button Destructive, focus visual properties and RequestedTheme (package 1.0.0.75)

Shane asked for the useful non-WinUI ideas from his WinUI3 HTML/CSS library, starting with the Destructive button, and for the remaining meaningful WinUI Button properties. Built from the GitHub version of the library (`twinBASIC-Knowledge`, branch feature/winui3-html-css-js-reference); Shane confirmed the concepts there match his newer local copy.

UI3Button gains `Destructive`, a documented **tbUI3 extension** from the library's `.button--danger`: the caption and icon use SystemFillColorCritical (#C42B1C light, #FF99A4 dark, the same tokens the CSS uses) at rest and on hover, while pressed and disabled keep WinUI's colours, exactly as the CSS cascade does. It is ignored on Accent, and a set `Foreground` still wins at rest. WinUI properties added with WinUI names and defaults: `FocusVisualPrimaryBrush` and `FocusVisualSecondaryBrush` (theme = FocusStrokeColorOuter/Inner), `FocusVisualPrimaryThickness` (2), `FocusVisualSecondaryThickness` (1), `FocusVisualMargin` (-3), and `RequestedTheme` (ElementTheme numbering; `ui3ThemeSystem` follows the app). The focus rings still draw inside the button; a margin above -3 moves them inward. UI3Theme's `FocusVisualPrimaryThickness`/`SecondaryThickness` constants were renamed with a `Default` suffix so they don't share a name with the new properties. The other library button variants were reviewed: compact is an AppBarButton concept, icon and graphical are sizing presets a developer gets from Width and Padding, and toggle, dropdown and hyperlink are WinUI controls already on the roadmap.

Deferred with reasons in docs/controls/UI3Button.md: UI Automation names (needs a shared accessibility provider for every control), AllowFocusOnInteraction (twinBASIC focuses on click before control code runs; needs an IDE test), IsTextScaleFactorEnabled (library-wide pass), CharacterSpacing (IDWriteTextLayout1).

Validation: new `tests/button-extras.test.mjs` (4 tests: Destructive colours, states and Accent exclusion, Foreground precedence; focus defaults against FocusRectManager and the inset formula; RequestedTheme numbering and use in DrawButton; persistence of all 7 properties and no quotes in descriptions); a mutation (inset ignoring the -3 offset) makes it fail. `node --test tests/*.mjs`: 84 tests, 73 pass, 8 skip, the same 3 environment failures as before (ide-toolbar needs jsdom; two native-theme tests). `node tools/validate-tabview-projects.mjs`: 75 exact mirrors, embedded package 75, IDs and CRLF verified. No new declares. **Not yet compiled or run in twinBASIC.**

Next: Shane builds 75 after checking 73 and 74 and runs the checks at the top of ROADMAP.md.

## 2026-11-18 - UI3Button appearance properties (package 1.0.0.74)

Pass B of Shane's full WinUI Button parity request. UI3Button gains WinUI's appearance properties with WinUI's names and DefaultButtonStyle defaults: `FontFamily` (empty = ContentControlThemeFontFamily), `FontSize` (14), `FontWeight` (400, `UI3FontWeight` names), `FontStyle`, `FontStretch`, `Padding` (XAML Thickness text, default ButtonPadding 11,5,11,6), `HorizontalContentAlignment` and `VerticalContentAlignment` (Center, Button's starting value), `CornerRadius` (4), `BorderThickness` (1), `BackgroundSizing` (FromStyle, a documented tbUI3 convenience meaning the Style's own setter), and the brushes `Background`, `Foreground`, `BorderBrush` (`ui3ThemeBrush` = theme resource). As in WinUI the brushes show only in the Normal state, because the template's other states set the presenter's brushes directly. Content now sits inside BorderThickness plus Padding, as in WinUI's ContentPresenter; before, padding was measured from the outer edge, which centred content hid. UI3D2D gains a cached `ContentTextFormat` and an alignment-aware `DrawButtonContent`; centred content (every other caller) still takes the original drawing path. New enums: UI3FontWeight, UI3FontStyle, UI3FontStretch, UI3HorizontalAlignment, UI3VerticalAlignment, UI3BackgroundSizing, UI3ThemeBrush. Saved forms load unchanged; IDs unchanged.

Limits, documented in docs/controls/UI3Button.md: CornerRadius and BorderThickness are uniform only (WinUI allows per-corner and per-side); brushes are opaque OLE colours (XAML brushes can be translucent); Stretch alignment draws as Left/Top.

Validation: `tests/button-states.test.mjs` grows to 11 tests (defaults and enum numbering against WinUI, persistence of all 14 properties, no quotes in attribute strings, Normal-only brushes, BorderThickness plus Padding content box, Padding parsing, the unchanged centred path); a mutation (padding measured from the edge again) makes it fail. `node --test tests/*.mjs`: 80 tests, 69 pass, 8 skip, the same 3 environment failures as the untouched branch. `node tools/validate-tabview-projects.mjs`: 75 exact mirrors, embedded package 74, IDs and CRLF verified. No new declares. **Not yet compiled or run in twinBASIC.**

Next: Shane builds 74 after checking 73 and runs the checks at the top of ROADMAP.md.

## 2026-11-18 - UI3Button visual states, focus and WinUI input behaviour (package 1.0.0.73)

Shane asked (2026-11-18) for UI3Button to reach full WinUI Button parity, starting with hover; hover and the other states had never been implemented. Package 73 is pass A of two. Every value comes from microsoft-ui-xaml commit 8318c5bf (`Button_themeresources.xaml`, `Common_themeresources_any.xaml`, `Button_Partial.cpp`, `ButtonBase_Partial.cpp`, `FocusRectManager.cpp`). UI3Button now draws PointerOver, Pressed and Disabled for Standard and Accent, and has the Subtle style (SubtleButtonStyle) with all four states. State priority follows `Button::ChangeVisualState`. Keyboard focus shows the system focus visual (2-DIP FocusStrokeColorOuter ring, 1-DIP FocusStrokeColorInner ring); pointer focus shows none. New WinUI properties: `Enabled` (DISPID_ENABLED, so the form's Enabled works), `ClickMode` (Release, Press, Hover), `UseSystemFocusVisuals`, `AccessKey`, and read-only `IsPressed` and `IsPointerOver`. Click now follows ButtonBase: the press captures the pointer, dragging off shows Normal and cancels the click, Space and Enter press on key down and click on key up, and lost focus, disabling or stolen capture end a press without a click. The form's Default (Enter) and Cancel (Esc) buttons and Alt+AccessKey click through `AccessKeyPress`, with a guard against a double click on Enter. UI3Surface gains `CapturePointer`, `ReleasePointer`, `HasCapture`, `LeftButtonHeld` and `KeyboardFocusIntent`. `docs/controls/UI3Button.md` has the full state table, the input rules, the focus visual deviation and the list of WinUI Button properties with no twinBASIC meaning, each with its reason. Saved forms load unchanged (new properties default to WinUI's defaults); IDs are unchanged.

Deviations and gaps, all documented: the focus visual is drawn inside the button, because WinUI draws it 3 DIPs outside (FocusVisualMargin -3) and a control can't paint outside its window. The 83 ms BrushTransition between states is not animated. High contrast is not covered. Access key tips are not drawn. Space handling and Hover buttons ignoring keys are standard WinUI behaviour as understood; the key-processing header was not retrieved.

Validation: new `tests/button-states.test.mjs` (7 tests) pins the 27 colour tokens to the XAML values, each style's state-to-resource mapping, state priority, the ButtonBase input rules, DISPID_ENABLED and saved defaults, stable IDs and CRLF; two mutation checks (wrong pressed fill, Click back on UserControl_Click) make it fail. `node --test tests/*.mjs`: 76 tests, 65 pass, 8 skip, 3 fail; the same 3 fail on the untouched branch in this environment (ide-toolbar needs jsdom, which isn't installed here, plus two native-theme tests). `node tools/validate-tabview-projects.mjs`: 75 exact mirrors, embedded package 73, IDs and CRLF verified. x64 review: the new declares (SetCapture, GetCapture, ReleaseCapture, GetKeyState) take and return LongPtr for window handles. **Not yet compiled or run in twinBASIC.**

Next: Shane builds 73 and runs the checks listed in ROADMAP.md. Pass B is package 74, above.

## 2026-11-18 - UI3Button on the shared paint surface (package 1.0.0.72)

Shane confirmed package 71 fixed the TabView flicker with all checks passing, and asked for the same base on the other controls. UI3Button now implements IUI3SurfaceClient. At run time UI3Surface owns its WM_PAINT and swallows erase. All 16 run-time `UserControl.Refresh` calls (property setters, Resize, ambient BackColor, icon-list changes) go through `Repaint`, which invalidates without erase at run time and keeps the synchronous Refresh only for designer snapshots. The surface clears to the container colour, which still shows through the rounded corners, and the button draws as before. The surface now exposes `TargetGeneration`, so the button releases icon bitmaps and SVG documents made for a previous render target. The design-time D2D failure text (PaintFailure) is kept. The look is unchanged, and hover, pressed, disabled and focus visuals are still later roadmap steps (SurfaceHitTest returns 0). IDs, public members and saved forms are unchanged.

What stays on host paint, and why: UI3TabPage holds the user's controls, which may be windowless and drawn by the host's own paint routine; it only fills a flat colour and isn't involved in hover. UI3FormTheme and UI3IconList draw nothing (no Paint). UI3IconPage's chrome and grid already own WM_PAINT through UI3PageSurface, which Shane validated flicker-free in October. With UI3Button moved, `HOST_PAINT` in tests/rendering-surface.test.mjs lists only UI3TabPage.

Validation: 158 tests, 133 pass, 21 skip (installed-IDE), and the same 4 pre-existing IDE-toolbar failures as the untouched branch in this environment. A new test covers the button's target-generation release and the clear to the container colour. 75 exact mirrors, embedded package 72, IDs and CRLF verified. x64 review: no new declares or structures; the button uses only the surface's existing pointer-width-safe calls. Not compiled yet. Next: Shane rebuilds 72 and checks buttons in both styles, Light/Dark, with Segoe, SVG, PNG and IconKey icons, resizing, theme switching, the icon picker's Apply and save/reopen in win32, then a win64 smoke test.

## 2026-11-18 - Shared flicker-free paint surface, TabView first (package 1.0.0.71)

Shane asked for flicker to be solved once for every control instead of per control (plan approved 2026-11-18: docs/2026-11-18-flicker-free-rendering-plan.md). Repository history shows no-erase invalidation alone never cured a flash (picker chrome 1.0.0.31/32, TabView 69/70); every fix that worked owned WM_PAINT through a subclass (UI3PageSurface, UI3Window). Package 71 adds that as shared infrastructure: private class `UI3Surface`, private interface `IUI3SurfaceClient` and private module `UI3SurfaceHost`. At run time the surface swallows WM_ERASEBKGND and handles WM_PAINT/WM_PRINTCLIENT with BeginPaint/EndPaint, so twinBASIC's paint routine never draws before the frame; one cached ID2D1DCRenderTarget composes the frame offscreen, cleared to the control's opaque background and clipped to the dirty rectangle, and copies it once. It recreates the target on D2DERR_RECREATE_TARGET, tracks the part under the pointer and notifies the control only when it changes, invalidates in DIPs rounded outward without erase, repaints on WM_DPICHANGED_AFTERPARENT, and detaches on WM_NCDESTROY. At design time it only swallows erase and answers WM_GETDLGCODE; the IDE's synchronous snapshots still come through the Paint event, which calls the same render code. `TBUI3_PAINT_TRACE=1` logs erase/paint/invalidate/hover events with timings to tbUI3-paint.log next to the project (fallback %TEMP%).

UI3TabView now implements IUI3SurfaceClient. Its own subclass in UI3TabMetrics (erase, header invalidation, DLGC) is removed, so the host has one subclass. Hover no longer reads the cursor at paint time or repaints on every mouse move; run-time paint no longer re-enumerates ContainedControls (the designer still does); every run-time Refresh became a no-erase invalidate. UI3D2D caches brushes per render target while a surface frame is active, and caches text formats, font-family lookups and tab outlines. UI3TabPage and UI3Button stay on the host paint routine (TabPage may hold windowless user controls; Button moves after TabView is confirmed). IDs, public members, properties and saved forms are unchanged. Package/reference and embedded copy are 71; add-in unchanged.

Validation: new tests/rendering-surface.test.mjs (7 tests) requires every drawing control to implement IUI3SurfaceClient unless listed with a reason, and checks erase/paint ownership, no-erase invalidation, outward DIP rounding at five DPIs, hover-change-only notification, no run-time page discovery and cache use; mutation checks confirmed it fails when run-time paint rediscovers pages, when a run-time Refresh is added and when erase is forwarded. 157 tests: 132 pass, 21 skip (installed-IDE checks), 4 fail; the same 4 IDE-toolbar tests fail identically on the untouched branch in this environment. 75 exact mirrors, embedded package 71, IDs and CRLF verified. Shane's result (2026-11-18, BETA 1044): package 71 removes the TabView hover flicker on his physical display, and all requested checks pass (hover/press/leave/focus, both styles, Light/Dark, resize, page switch, designer add/delete page, save/reopen).

## 2026-11-18 - Replace all Build artwork with buildv3 (add-in 1.3.0.20)

Shane reports the prior small-size adjustment did not resolve the gap and supplied buildv3.svg. Replaced the shared Build asset with that artwork and removed the separate heavier build-small variant/resolver branch. All Build surfaces now use the same supplied geometry: Quick Access, full/simplified Ribbon and Hybrid, and Classic. Only XML/DTD declarations, display dimensions and fill=currentColor were normalized for the existing embedded foreground-colored mask. Path/viewBox/transforms/stroke settings match the supplied file; no outline thickening is applied. Quick Access order, command dispatch and full ribbon padding remain unchanged.

Validation: 150 tests and 71 exact mirrors pass. Playwright/Edge component checks pass for Light/Dark and full/simplified rendering, foreground colors, Quick Access order/dispatch, unchanged spacing and no browser errors. Native add-in reload remains pending; no claim is made that the previous gap fix succeeded. Rebuild/reload tbUI3IDE 1.3.0.20. Package 70 and adapter v10 are unchanged.

## 2026-11-18 - Small Build icon optical weight (add-in 1.3.0.19)

The supplied thin outline produces weak partial pixels at 16px. Added build-small.svg with identical path/viewBox/transforms and a rounded 90-unit outline in its transformed 3840-unit space (0.375 CSS px at 16px). Quick Access and Classic's 16px Build use this heavier mask. Full/simplified ribbon commands keep the original build.svg; theme coloring, native dispatch, command placement and the 7px full ribbon padding remain unchanged. Both variants are embedded; no loose runtime image is required.

Validation: 150 tests and 71 mirrors pass. Playwright/Edge renders show the original 16px mask fragmented into eight four-connected regions at alpha>=128; the adjusted mask forms one connected region at that threshold. Light/Dark full/simplified component checks pass with both mask variants, correct foreground colors and Quick Access order/dispatch, without page/console errors. Raster comparisons and screenshots live outside the repo in .workspace-tools. Browser plugin remains unavailable; native compiled reload is pending. Rebuild/reload tbUI3IDE 1.3.0.19. Package 70 and adapter v10 remain unchanged.

## 2026-11-18 - Custom Build icon, Quick Access and full ribbon spacing (add-in 1.3.0.18)

Uses Shane's supplied build.svg for Build through the shared icon resolver in full/simplified Ribbon and Hybrid (and the existing Classic glyph mapping). Normalized only XML/DTD declarations, display dimensions and fill=currentColor; path geometry/viewBox/transforms are retained. The local custom asset is embedded as a foreground-colored CSS mask, white on dark themes and dark on light themes, without a loose runtime SVG dependency. Build is added between Redo and Play in Ribbon Quick Access, forwarding the native button's handler/state. Build remains on the Project tab; it is explicitly excluded from the history/debug-only Quick Access suppression set. Hybrid retains its structure without Quick Access.

Full Ribbon/Hybrid now have 7px top padding (was 4), a 73px command area (was 76) and three 23px small-command rows (was 24). Large buttons lose 3px from the unused bottom grid row; icons/labels retain their dimensions. Group-title/bottom positions and the 100px ribbon card remain fixed. Scoped full-mode rules leave Simplified and Quick Access dimensions unchanged.

Validation: 150 tests and all 71 exact mirrors pass. Browser plugin not available; a temporary Playwright/Edge component fixture verifies four Light/Dark x full/simplified states, custom mask/foreground colors, Quick Access order and click dispatch without console/page errors. Before/after rendered geometry checks cover Ribbon and Hybrid: padding 4->7, command area/large buttons -3, first button top +3, unchanged ribbon/Quick Access heights and identical simplified geometry. Screenshots/scripts remain outside the repo in .workspace-tools. Native compiled add-in reload is pending. Rebuild/reload tbUI3IDE 1.3.0.18; package 1.0.0.70 and adapter v10 are unchanged. Remaining TabView flicker acceptance is unchanged by this pass.

## 2026-11-17 - Native backgrounds and focus cues (package 1.0.0.70)

Shane reports package 69 still flickers on physical display during hover, although recording misses the flash. Do not mark 69's repaint change as a successful flicker fix. The outlined selected caption is our 2px focus indicator; GotFocus previously assumed keyboard input. Focus intent now checks held navigation keys and the explicit pointer-focus guard; handled keyboard navigation enables the cue, while unhandled keys no longer enable it or request layout. The white field containing This text belongs to Details is the existing standard TextBox txtDetails (system window background), not a TabView drawing artifact.

The native opaque host/page BackColor still used the default system control color while Direct2D painted dark. Package 70 synchronizes host BackColor to the header surface and page BackColor to the page surface at InitProperties, ReadProperties, Show and ambient background changes, plus before runtime header invalidation. Changes are guarded/idempotent and never performed inside Paint. This addresses another possible light erase surface; the exact remaining physical-display flicker mechanism is not yet captured or proven. Retains header invalidation, separator/line fixes, IDs, control sizes and saved forms. Full package/reference/embedded copy 70; add-in 17/adapter v10 unchanged. 149 tests and 71 mirrors/stored JSON checks pass; native compile/run and physical-display confirmation remain pending.

## 2026-11-17 - TabView hover repaint and separators (package 1.0.0.69)

Shane confirms package 68 resolves the form-load failure. This pass removes the unwanted horizontal stroke above page content in both Edge and Explorer. Native tab separators now disappear on both sides of a hovered tab; the divider is owned by its left neighbor, so its condition also checks the next tab's hover state. Runtime hover/press/focus/header-scroll changes invalidate only the DPI-scaled header without requesting background erase. The host subclass handles WM_ERASEBKGND without forwarding to the light system brush; opaque Direct2D paint supplies the background. Mouse moves rearm leave tracking without reinstalling the subclass. Design-time edits retain synchronous Refresh for native snapshots.

The large runtime page is explained by the test form's existing Form_Resize handler, which stretches UI3TabView1 to the form's client area minus 240 twips on each side. That code and saved form sizes were retained; a newly drawn control does not automatically fill its form. Package/reference and full embedded copy are 69; add-in 1.3.0.17 / adapter v10 is unchanged. All 148 tests and 71 mirrors pass; the new separator regression failed before the fix and passes across all selected/hovered combinations. Equivalent offscreen Win32 probes pass in x86/x64 for 500 no-erase header invalidations at five DPIs and erase-message handling. These are not compiled-control tests. Reopen the embedded test project/rebuild package 69 and verify hover/leave/capture/focus, resize, both styles and Light/Dark in BETA 1044. Evidence: docs/validation/2026-11-17-tabview-hover-repaint.md.

## 2026-11-17 - TabStyle designer JSON repair (package 1.0.0.68)

The uploaded adapter v10 log in a2fe3a0 identifies the exact failure: BETA 1044 serializes UI3TabView2.TabStyle as `"Description("Edge Style")"` and includes both Description annotations as enum entries. Those unescaped quotes break the full native form response at position 16525. Removed the two enum-member attributes, retaining the enum-level/property descriptions, identifiers, values and Edge default. Friendly style names are documented in comments/property help; the native picker uses ui3TabEdge/ui3TabExplorer. This corrects the annotations introduced in package 66, not damaged saved form data.

Updated the canonical package and full embedded test package/reference to 68. All nine non-package consumer entries other than Settings, including both forms and saved control state, are byte-identical to Shane's upload. Add-in 1.3.0.17 / adapter v10 remains unchanged. Regression failed on the old attributes and passes after removal; all 147 tests and 71 mirrors/stored-JSON checks pass. Native BETA 1044 reopening is still pending: pull and reopen the test project with its updated embedded package. Rebuild tbUI3 68 before importing a separately built twinpack. Evidence: docs/validation/2026-11-17-project-load-json.md.

## 2026-11-17 - Native designer response capture (add-in 1.3.0.17 / adapter v10)

Shane's screenshot establishes that the project opens but frmMultiPage remains at 20% with the JSON error. Installed IDE source sets 20% after receiving the saved form data and starts native control synchronization next. Added a reversible observer around gotNewFormSnapshotsResponse. Only when that native handler throws and its response JSON fails parsing, it records the form, payload length, parser position, nearest preceding control name, 420-character context and bounded original stack. The existing controller writes it automatically to tbUI3-tabview.log beside the project and in TEMP. The native exception is rethrown unchanged; no recovery, global JSON.parse override or form/persistence edits are attempted. Corrected the stale log prefix to adapter v10.

Validation: 146 tests pass, including malformed JSON through the actual installed snapshot parser, successful delegation, original failure preservation, invalid transport handling and reversible hook ownership. All 71 mirrors and stored JSON checks pass. Package remains 1.0.0.67. The BETA 1044 failure is not repaired or natively reproduced locally. Rebuild/reload tbUI3IDE 1.3.0.17, reopen the failing form, wait two seconds for the log timer and supply the new Native designer JSON failure line to identify the failing native value. No package rebuild or test-project edit is needed for this diagnostic pass.

## 2026-11-17 - Test-project JSON load investigation (unresolved)

Preserved Shane's uploaded 75b7598 project. All 37 stored files match c109d62 by content; all 11 stored JSON documents parse. Entry order/revision metadata differ. All 71 project mirrors and existing identity/ownership checks pass. Added stored-JSON parsing to the project validator. Local IDE launch identifies BETA 904 and fails at startup with a different error, so BETA 1044 reproduction is still required. Do not discard form persistence or claim this is repaired. Need failure stage and full stack/generated JSON response. Package 67/add-in 16 unchanged. Evidence: docs/validation/2026-11-17-project-load-json.md.

## Compiler-warning follow-up, 2026-11-17: package 1.0.0.67

Changed the Add, Previous and Next glyph literals in UI3TabView to explicit Long values (&HE710&, &HE76B&, &HE76C&), addressing the three BETA 1044 TB0012 warnings Shane reported. Package revision is 1.0.0.67; tbUI3IDE remains 1.3.0.16 / adapter v9. Updated the canonical package, complete embedded test package and version reference. Existing 142 tests and 71 mirror checks pass; warning-free native recompilation remains to be confirmed. No IDs or interaction behavior changed.

Rebuild package 67 and re-import its .twinpack into the test project. The prior TabView native/runtime gates remain open; the user report establishes these three compiler warnings, not complete acceptance.

## Current TabView pass, 2026-11-17: package 1.0.0.66 / add-in 1.3.0.16

- Added persisted UI3TabView.TabStyle with UI3TabStyle choices ui3TabEdge (Edge Style, default) and ui3TabExplorer (Explorer Style). Edge follows Shane's customized Toolkit at Smith-Debnam/twinBASIC-Knowledge commit 85432018090efc339d21ae7c47fd0e45ac8dea6b: 36-DIP tabs, 4-DIP top inset and 8-DIP concave feet. Explorer uses the prior WinUI 32/8/4 profile. Both retain a 40-DIP page origin; style changes do not alter page ownership or child coordinates.
- Added native vector tab outlines, selected/page seams, neighbor separators, left-aligned ellipsized captions, theme hover/pressed/disabled states, keyboard-only focus indication, centered add/scroll glyphs, pointer capture/cancel and hover-leave cleanup. Selected tabs paint last so their joins remain intact. Explorer's unselected hover uses the rounded WinUI container; Edge hover uses the Toolkit outline.
- Added overflow arrows that scroll the header viewport without selecting/moving pages, automatic reveal on selection, wrapping Left/Right and Ctrl+Tab navigation, Home/End and Ctrl+T add requests. Very narrow hosts retain a clipped selected tab and keyboard access instead of overlapping arrows. Transient FirstVisibleTabIndex is not written to PropertyBag. Pointer tracking uses pointer-width-safe comctl32 subclass APIs with no retained control reference or timer.
- Adapter v9 mirrors both profiles, reserved feet, add-button position and overflow hit testing. Native viewport changes request header snapshots without structural edits or undo checkpoints. Existing designer page containers, names, locks, selection and insertion paths are retained. Updated canonical package/test/add-in projects and the full embedded package; existing control/project IDs and public-member order are preserved.
- Validation: 142 tests and 71 exact project mirrors pass; x86/x64 Direct2D arc/point ABI and DirectWrite ellipsis probes pass. Edge source-derived curve coordinates match the live verified Toolkit SVG with zero point mismatches in Light/Dark; preview checks cover 1200px/720px widths without console/page errors. Native IDE automation was attempted but could not launch twinBASIC: GetCursorPos returned Access denied (0x80070005). This is not a compiled control acceptance run. Evidence: docs/validation/2026-11-17-tabview-profiles.md.

Shane confirmed the designer workflow works and requested appearance/interactions next. He explicitly requires the customized Toolkit shapes, two TabStyle choices and Edge as the default. The correct read-only reference clone is ../twinBASIC-Knowledge relative to this workspace's parent Projects folder; verify its remote is Smith-Debnam, not the older Arrow-Loop fork. Its canonical WinUIElementToolbox project and 23 mirrors validated before inspection. Reference files were not modified.

Next required external check: build package 66, re-import into the test project, rebuild/reload tbUI3IDE 1.3.0.16 and test both styles at design time/runtime in both architectures. Check hover/pressed/leave/focus, scroll/reselect, narrow hosts, persistence and child ownership. Close controls/events, tab icons, drag/reorder gestures, animation, accessibility/high contrast and exact remaining selected-stroke details are still incomplete; do not describe TabView as finished. Commit and verify the push every development pass.

## Current implementation, 2026-11-17: tbUI3IDE 1.3.0.15

- Save Document now enables for a dirty, writable selected CodeEditor/UIDesigner and saves through the IDE's per-editor openEditors.save(node) route. It no longer invokes BETA 1044's deliberately disabled tbEditor_Save placeholder. Other dirty documents remain unsaved; native writers retain failure/dirty handling. Unsaved projects use native Save As, retaining the originally clicked document across tab changes and skipping it if closed before the callback.
- Form / Code now requires an existing counterpart in the native file tree, using the native handler identity and lookup order for .tbform, .tbcontrol, .tbppage and .tbreport. Standalone modules and unrelated editors disable the replacement button. The same predicate guards dispatch; native global command definitions and Classic toolbar handlers are untouched.
- Both corrections apply to Code/Form in Ribbon and Hybrid, full/simplified. 135 automated tests, 71 exact project mirrors and eight Edge document-command flows pass. Checks exercise actual installed native code/form writers, switch helpers and the generated add-in script; failed/successful writes and Save As targeting are covered. Native compiled-host disk/save/reopen confirmation remains pending. Evidence: docs/validation/2026-11-17-document-commands.md.

This supersedes earlier claims that tbEditor_Save was a functioning native command. The earlier mocked availability tests did not expose its disabled placeholder. Package 65, adapter v8 and stable identities remain unchanged. Rebuild/reload and verify selected-document saving without saving other dirty tabs, file reopen, Save As cancel/complete and paired/unpaired editor switching. Commit and verify the push every pass.

## Current implementation, 2026-11-17: tbUI3IDE 1.3.0.14

The ribbon command card now has no drop shadow or bottom border in standard and third-party themes. Its existing raised treatment is enabled only for WinUI3 Dark and WinUI3 Light, with case-normalized theme names. This applies to Ribbon and Hybrid in both full and simplified presentation, independently of the additional-styling switch. Theme changes toggle a presentation class without replacing command/control nodes. Command behavior, group dividers, dimensions, corner radius and popup styling are retained.

Validation: 130 tests, 71 exact project mirrors and Edge renderer checks pass. Edge covers 32 theme/profile/presentation states, including live transitions through native Dark/Light/Classic, custom names and both WinUI themes, with no page/console errors. Native add-in build/reload acceptance remains pending. Package 65, adapter v8 and stable identities are unchanged.

Rebuild/reload and compare both WinUI themes with standard/third-party themes. Commit and verify the push after every pass. Evidence: docs/validation/2026-11-17-ribbon-elevation.md.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.13

- WinUI3 Light now uses neutral #F3F3F3 title/menu chrome and dark foregrounds. Optional styling corrects native hard-coded white caption text/PNG icons and also neutralizes an older installed Light theme. The generated Light.theme has the same neutral palette.
- Restricted the 8px window side/top insets to the exact WinUI3 Dark and WinUI3 Light themes with additional styling enabled. Other themes, including other names starting with WinUI3, receive no insets. Existing caption/Quick Access exemptions, real-titlebar top condition and no-bottom-inset behavior remain.
- Added live Windows accent integration for both WinUI3 themes while additional styling is enabled. The private UISettings bridge reads all seven system accent shades on the existing one-second options timer. WinUI resource mapping uses Light2/Dark1 for dark/light fill and Light3/Dark2 for links, including hover/pressed opacity, native UI accents and progress bars. Theme changes, styling Off and unload remove the owned override stylesheet; unavailable Windows colors fall back to the static theme.
- Validation: 129 tests and 71 project mirrors pass. Equivalent documented UISettings ABI probes succeeded in both 32-bit and 64-bit Windows processes. Edge checks cover neutral/old-installed Light chrome, readable caption controls, blue/purple palette refresh, both themes, styling Off and non-WinUI cleanup. Native twinBASIC compile/reload and live Windows-settings change acceptance remain pending. Evidence: docs/validation/2026-11-12-neutral-light-system-accent.md.

This supersedes 1.3.0.12's all-theme inset scope. Theme files remain usable without the add-in, with static fallback accent colors. Rebuild/reload the add-in and copy the regenerated Light.theme to the IDE themes folder to update the standalone palette. Package 65, adapter v8 and stable identities remain unchanged. Commit and verify the push every pass.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.12

- Added Switch Between Form and Code immediately after Save Document in the Code/Form Document group for Ribbon and Hybrid, reusing the native action and tooltip.
- Hybrid now supports full/simplified presentation and Ctrl+F1 while keeping its smaller tab/command inventory, native menus and no quick access or Backstage.
- Corrected 1.3.0.11's scope: only Simplified removes the additional Center in Container, Lock Controls, Preview, Grid, four secondary MultiPage and Insert file-command labels and uses the Grid options flyout. Full layouts restore labels and inline Grid options. The original ten alignment/size icon-only commands remain in both. The chevron stays inside both layouts and has a transparent background at rest, with hover fill and a visible glyph in both WinUI3 themes.
- Classic retains its native controls, order and handlers, using the same icon resolver as Ribbon. Toolbar/add-in buttons have glyphs and tooltips without visible labels; native selectors remain unchanged. Late contributions and teardown are handled reversibly.
- Additional styling enables 8px left/right main-window insets without a bottom inset. Custom-titlebar mode also adds 8px above Quick Access, preserving its existing 16px left padding and the caption-button rectangles. Real OS titlebar mode gets no top inset; the caption/Quick Access row is excluded from side insets.
- 126 automated tests and 71 exact project mirrors pass. Edge checks cover native BETA 1044 toolbar/header/Grid markup, both replacement profiles and presentations, 38 Classic buttons, theme states and inset geometry. Native compiled build/reload and restart acceptance remain pending. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md.

Package 1.0.0.65, adapter v8 and existing project/control identities are unchanged. Commit and verify the push after every development pass. Earlier entries below are historical; this pass supersedes the 1.3.0.11 full-layout scope and the earlier Hybrid shortcut behavior.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.11

Shane's screenshots prompted an inset chevron (no external strip), centered simplified row, more icon-only controls and a Grid toggle/options split. Shared metadata hides the specified labels while preserving help/accessible names. Grid's primary proxy keeps the native action/pressed state; its arrow opens the original options fieldset in the existing top-layer popup lifecycle. The fieldset returns to hidden storage on close and its body returns to the native container during tab/mode/unload cleanup. Routine menu refresh does not tear down inputs during editing. Escape returns focus, and native disabled/form context closes/disables the flyout. Added Shane's follow-up 16px Quick Access left padding. 119 tests/71 mirrors pass; Edge uses the actual BETA 1044 Grid markup/CSS and validates values/events, compact centering, inset chevron and Form fit at 1920px. Native rebuilt-host acceptance remains pending. Evidence: docs/validation/2026-11-12-grid-split-compact.md. Settings/persistence from 1.3.0.10, package 65 and adapter v8 are unchanged. Commit and push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.10

Shane requested a bottom-right down-chevron toggle to an Outlook-like Simplified Ribbon with all existing tabs/options. Ribbon now toggles 100px full / 48px single-row command areas; the chevron points up when simplified. Same command/control nodes, selected tab, state and callbacks are retained. Long rows scroll horizontally by scrollbar, mouse wheel or keyboard focus; inputs/selectors retain wheel behavior. An independent SimplifiedRibbon preference is restored/saved through MainModule and all three preference kinds drain on teardown. Ctrl+F1 toggles full/simplified only in Ribbon; Hybrid/Classic keep their structures. Tests: 116 pass without skips; 71 mirrors match; Edge validates 1280px/640px, node/tab retention, popup dispatch, Grid persistence, File and narrow reachability. Native build/restart/visual acceptance remains pending. Evidence: docs/validation/2026-11-12-simplified-ribbon.md. Automatic group-overflow menus/adaptive collapse/keytips remain separate future work. Commit/push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.9

Shane supplied a replacement quick-access logo, twinBASIC_WinUI3_16px.png. Its actual dimensions are 15×16px; it is copied byte-for-byte to the existing images/twinBASIC_WinUI3.png path and displayed at native size. SHA-256: 2b6f1817a8da030d4644d83f1af8a3dd25865f499b63a1c643830e6ad1b6a92d. Existing logo conditions, Hybrid structure and all 1.3.0.8 icon/command behavior remain unchanged. Regenerated/repacked add-in; 111 tests, 71 mirrors and Edge fixture checks pass. Native rebuild/reload confirmation remains pending. Commit and push every pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.8

Implemented Shane's requested command icons, MultiPage labels/dividers, File icons/Open-Save separator and Save Document relocation. Explicit metadata in ribbon-presentation.js overrides native codicons/images; unlisted commands remain native. Segoe uses system fonts; 55 pinned Fluent SVGs are embedded from icons/requested.json (importer: tbIDE/tools/import-ribbon-icons.mjs). Page Right is the authorized left-tab plus filled right-arrow composite with the old badge masked out. Save Document leads Code and Form in an isolated Document group in Ribbon and Hybrid; it is removed only from Ribbon File, with native Hybrid menus preserved. 111 tests, 71 mirrors and Edge fixture checks pass; all SVGs decode. Native build/acceptance remains pending. Detailed evidence: docs/validation/2026-11-12-requested-icons.md. Package/control identities and adapter v8 are unchanged. Commit and push every pass to origin/tbui3-dev.

## Hybrid audit, 2026-11-12 (current add-in remains 1.3.0.7)

Shane asked that Hybrid receive the Ribbon fixes too. Audit confirms shared label sizing/font refresh, Grid geometry, compact alignment/size buttons and inline MultiPage code already serves both. Added explicit Hybrid width/font and both-mode native command-state/dispatch coverage; 105 tests pass without skips. Shane explicitly chose to keep Hybrid's current structure: native menus without quick access or File Backstage. The logo and Backstage-specific Options consolidation remain Ribbon-only. This pass changes tests/docs only; no version bump or native build is needed.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.7

Shane reported the quick-access PNG was absent in his IDE. Root cause: native getThemeName() lowercases activeThemeInfo.name; the initial logo gate compared title-case names, and its mock repeated that assumption. The renderer now normalizes theme names. A regression executes the installed native function; the Edge fixture also uses it and verifies the original image actually decodes and is visible. All 104 tests and 71 mirrors pass; native rebuilt-host confirmation remains pending. Inline MultiPage from 1.3.0.6 remains intact. Commit and push this pass to origin/tbui3-dev.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.6

Shane requested MultiPage directly in Form rather than a nested sub-ribbon. Both Ribbon and Hybrid now insert its six existing native buttons in a normal MultiPage group immediately after Grid, preserving host/page/child context detection and native state/dispatch. Selection changes remove/restore the group; commands retain the surrounding Form UI. 103 automated checks and 71 mirrors pass; Edge fixture selection/placement/dispatch checks pass in both layouts with no errors. Native build/rendered acceptance remains pending. Evidence: docs/validation/2026-11-12-inline-multipage.md. Commit and push each development pass to origin/tbui3-dev per Shane's standing authorization.

## Current implementation, 2026-11-12: tbUI3IDE 1.3.0.5

Reconstructed Shane's five Ribbon refinements from his prompt and progress screenshots, using the supplied original PNG. Large captions measure their actual font for the narrowest two-line whole-word fit within 50–86px; Grid spacing matches the divider inset; ten alignment/size commands are icon-only with native state/dispatch; File > Options contains IDE Options and former Preferences entries; the embedded logo precedes Save only on WinUI3 Dark/Light with real OS titlebar off. Package 65, adapter v8 and control/consumer identities are unchanged. 103 automated checks pass without skips against installed IDE fixtures; Edge browser-fixture checks pass. Native compiled build and rendered acceptance remain open. See docs/validation/2026-11-12-ribbon-refinements.md. Work is in the local tbui3-dev worktree; no GitHub push is implied by this entry.

## Current implementation, 2026-11-11: tbUI3IDE 1.3.0.4

The 1.3.0.4 pass corrects shared Hybrid/Ribbon geometry: stretched single-column centering, 32px full-size and 16px small glyph canvases, a 4px caption gap, minimum-content widths within the existing 50px/86px caps, 4px card top padding within 100px and 89px dividers. Grid is one group; Configuration is visually hidden; the File rail reaches the top and uses application foreground. Native BETA 1044 Options saves omit notifyChangedTheme, leaving the old optional stylesheet active: page observation now removes it immediately on departure and the options timer reconciles the actual theme name. Previous palette-only variables are removed only when still unchanged; current native values are retained. Reinstalling options preserves unsaved Off, and new CSS attaches with its correct media from the outset. WinUI3 Light/Dark optional CSS adds subtle native/replacement menu shadows. All 99 JS/DOM/CSSOM/native-protocol checks pass without skips, 71 mirrors and six official exports match. Evidence: docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md. Native rendered acceptance remains open; package 65, adapter v8 and consumer identities are unchanged.

The 1.3.0.3 pass responds to Shane's marked-improvement feedback: Form's eight classic align/size controls are direct native proxies; Insert expands the actual async Add producer; dropdowns use auto-popover light-dismiss plus early window-level pointer/mouse capture; large glyphs share a fixed top row; File hides quick access; Zoom has no duplicate visible label; native editor identity/type changes follow Code/Form without overriding a stable manual choice; the native Grid toggle replaces the visible Show Grid checkbox. js/native-toolbar-context.js captures trusted producer descriptors in their original JavaScript realm with a private showContextMenu sink and reads native CodeEditor/UIDesigner state. Unsupported capture retains the native parent fallback. All 93 JS/DOM/CSSOM/protocol checks pass without skips; all 71 mirrors and six official-export files match. Evidence: docs/validation/2026-11-11-ribbon-direct-commands.md. Package 65, adapter v8, consumer project and identities remain unchanged. Native rendered acceptance of this revision is open.

The 1.3.0.2 pass addresses Shane's subsequent native screenshots: separate titlebar/tab and toolbar surfaces; transparent selected/hover tabs with accent/grey indicators; app-themed dropdowns promoted to the browser top layer (legacy max-z fallback); the real native white !important grid-field conflict; masked, size-aligned chevrons; accessible circled File Back. Native source confirms windowed controls at an offset of 1e6 and grabbers at 99,999,999, above the prior dropdown layer. The prior CSSOM checks missed the host's forced-white rule; the new suite loads it. All 84 JS/DOM/CSSOM/protocol checks pass with no skips; all 108 descriptors, 71 mirrors and six official-export matches remain intact. Current evidence: docs/validation/2026-11-11-ribbon-surfaces-popups.md. The icon map now has 37 SVGs (19 established, 18 gap-fill). Package 65, adapter v8, consumer project and identities remain unchanged. Rendered acceptance of this revision is still open.

The 1.3.0.1 pass follows Shane's 2026-11-11 Office/native screenshots: old toolbar surface and compatible foregrounds; sourced light/dark hover/pressed fills independent of optional styling; command-specific full-size/stacked roles with multiple large buttons per group; icons on all command/navigation surfaces; Help moved under File; themed live grid controls. New metadata: tbIDE/tbUI3IDE/js/ribbon-presentation.js; 17 pinned MIT Fluent gap-fill SVGs: icons/ribbon.json. All 78 JS/DOM/CSSOM/protocol checks pass, all 108 live menu descriptors remain reachable, all 71 mirrors and six official-export files match. Evidence: docs/validation/2026-11-11-ribbon-presentation.md. Native rendered acceptance of this revision remains open; do not infer it from the supplied 1.3.0.0 screenshots. Package 65, adapter v8 and the consumer project are unchanged.

The 1.3.0.0 revision replaces literal menu tabs with Home Clipboard/Editing, task-based Code/Form, View groups and Project build/compiler commands. Undo/Redo and main execution controls are quick-access only. File now has a vertical rail/task surface and explicitly hides/inerts the live designer/workspace and floating panels until close or native dispatch. Future commands keep dynamic fallback destinations. All 72 JS/DOM/protocol checks pass, including all 108 live top-level menu descriptors; all 71 mirrors and six official-export files match. Exact command map: tbIDE/RIBBON_LAYOUT.md. Package/consumer project and adapter v8 are unchanged. This is source/DOM/packing evidence; rendered acceptance and adaptive group behavior remain open.

The canonical IDE add-in is now tbIDE/tbUI3IDE/tbUI3IDE.twinproj, output tbUI3IDE.dll. Remove both legacy WinUI3IdeStyle.dll and TabViewDesigner.dll from both architecture folders. Project ID and the WinUI3IdeStyle/Options/Enabled preference remain unchanged; ToolbarMode is saved independently. Package 1.0.0.65 and adapter v8 are unchanged.

The current implementation includes the three-mode selector, active-theme toolbar CSS, enlarged existing Fluent glyphs, native command/menu discovery, Hybrid context, full-menu Ribbon, File/Backstage and quick access. The current validation results below supersede the initial 62-check baseline;  all 71 project mirrors and the current official add-in export match. Evidence: docs/validation/2026-11-10-ide-toolbar.md. Native/visual acceptance and Office adaptive collapse/keytips remain open. BETA 1044's Add-Ins menu only lists loaded add-ins with unsupported action stubs, so real enable/disable is still future work. Do not claim those gates passed. Current architecture and detailed remaining work: tbIDE/ARCHITECTURE.md and tbIDE/ROADMAP.md.

Sizing update in 1.2.0.1: the command area is capped at 100px, separate from the 26px tab strip. Full-size buttons are 76px high and 50px standard/minimum width, growing for labels up to 86px. The supplied Office screenshot confirms the spacing model. Validate the compact geometry along with the existing native acceptance gates.

Spacing correction in 1.2.0.2: the adapter now collapses the toolbar-only native dock slot (BETA 1044 reserves a 30px minimum height), restores the established Fluent shadow/card corners, and uses concise captions rather than help paragraphs, with tighter group spacing. All 66 JS/DOM/protocol checks pass, including the dedicated/shared-slot and redocking regressions. The native screenshot supplied by Shane is the before-state; corrected native appearance remains open. Package/test contents are unchanged.

## Earlier consolidation/planning update, 2026-11-10

Current control package remains 1.0.0.65. One IDE add-in, version 1.1.0.0, now combines theme styling and TabView adapter v8. Canonical project: tbIDE/WinUI3IdeStyle/WinUI3IdeStyle.twinproj. Display name: tbUI3 IDE. Output remains WinUI3IdeStyle.dll; remove legacy TabViewDesigner.dll from both addins architecture directories when migrating. The standalone TabViewDesigner project/src has been retired, and its old README redirects to current instructions.

The existing theme setting and all 288 CSS rules are preserved. MainModule owns the only exported AddIn entry point and the styling lifecycle; private TabViewDesignerController owns functional page behavior. It starts independently of the theme setting and remains available when styling is off or a standard theme is selected. Both features clean up on unload. Readable adapter/script generation now targets the unified project's js/src directories. All 44 JS/contract checks pass with actual BETA 1044 helpers, all 70 mirrors match and official export matches all 5 add-in files. The actual combined native load/unload is the next observation.

Shane revised the next pass: rename the project/output to tbUI3IDE and add IDE Toolbar directly below the additional-styling option, with Classic, Hybrid and Ribbon choices saved independently. Classic retains the existing menu/toolbar; Hybrid is the earlier Home/Code/Form/contextual MultiPage/Add-ins plan, retaining native menus. Ribbon migrates all native menus to an Office-style ribbon, with fullscreen File/Backstage, add-in enablement under File and contributed toolbar commands in Add-ins. Save/Undo/Redo/Play/Pause/Stop go above the ribbon in the former menu area, or the custom title bar when Show real OS titlebar is off. All toolbar UI follows whatever IDE theme the user selects, including standard/third-party themes, even when additional styling is off. Dynamic discovery must expose future menus/options without an add-in update while preserving native command/state authority. Fluent UI Web remains the authorized ribbon-pattern basis with WinUI 3 visuals. Exact groups, migration, discovery and validation requirements are authoritative in tbIDE/ROADMAP.md. These are recorded future requirements; version 1.1.0.0 still uses WinUI3IdeStyle and its existing toolbar. Package 65 delete/readd progress remains supported by the stale Name &H5B trace and replacement Page8 discovery; broader persistence/undo gates remain open.

## Earlier milestone context

This is written for the next developer or AI session; ChatGPT is expected to run the next several passes. Read `AGENTS.md`, then this file, then `CHANGELOG.md` and `ROADMAP.md`. State at the time of writing: `tbui3-dev`, package version 1.0.0.58, twinBASIC BETA 1012.

## What tbUI3 is

tbUI3 is a twinBASIC package (TWINPACK) of WinUI 3 / Windows 11 style UserControls. You draw them from the toolbox onto ordinary twinBASIC forms.

The decisions are in `docs/2026-10-06-first-pass-report.md` and `docs/2026-10-06-spike-spec.md`:
- UserControls, not CustomControls, because CustomControls only work on a WaynesForm.
- All drawing in Direct2D and DirectWrite, with no GDI+.
- Private declarations only.
- Every visual value cites microsoft-ui-xaml.
- The `UI3` prefix and VB-style property names.

## Where things are

- **Repo:** Arrow-Loop/tbUI3 (private). The work branch is `tbui3-dev`. `main` holds only the S1 commit. PR #1 (`tbui3-dev` into `main`) is still open; it was opened without Shane asking, and he decides whether to merge or close it.
- **Shane's PC:** the clone is `E:\Code Projects\tbUI3`, and twinBASIC BETA 997 is in `D:\twinBASIC`. The CLI (`bin\twinBASIC_win64.exe`) can only `export` and `import`; it has no build command, so builds happen in the IDE.
- **Stale folder:** `E:\Code Projects\WinUI 3` is an old duplicate. Ignore it.
- **Shane's machine:** dark mode, accent #FF4343.

## Verified vs not

| Item | State |
| --- | --- |
| S1: the package's control appears in the toolbox, drops onto a form, its properties persist, Click works | Passed (win32) |
| S2: Direct2D button, accent and Standard styles, 4 px corners, gradient border, Segoe UI Variable text | Passed in win32, at design time and runtime |
| S2: resizing | Passed |
| S2: win64 | Passed at runtime by eye; looks identical to win32, and Click raises the Hello World message box |
| S2: light mode | Deferred by Shane; not validated |
| S2: repaint when the form's BackColor changes | Probably fixed by UI3Window's redraw of all child controls, but never checked on its own (see ROADMAP) |
| UI3Window (dark/light title bar, #202020/#F3F3F3 background) | dark mode passed in win32 and win64; light mode deferred |
| Form theme spec: drop-on control, live switching, theme cache | Passed. UI3FormTheme is in the toolbox, drops onto frmMain, replaces manual Attach/Detach, and passes the same runtime behavior tests |
| S3 icons (1.0.0.3): build, designer and runtime rendering, icon left and top, enlarged button, icon-only, MDL2 font check, win64 | Passed on Shane's PC, 2026-10-06 |
| 1.0.0.4: Caption can be cleared in the designer | Passed on Shane's PC in win32 and win64, 2026-10-06 |
| Property page from `(Custom)` → `...` | Works (spike, 2026-10-06); the per-property `[PropertyPage]` link did not work in BETA 997 but works from BETA 1008 (Icon's own "...", confirmed in 1012) |
| 1.0.0.5: UI3IconPage searchable icon picker | Opens, shows the search hint and two-line info, and the picked icon is saved with the form (win32, 2026-10-07). The designer bridge in `UI3Icons` must stay until the cause is understood |
| 1.0.0.6: theme-aware PropertyPage chrome | Designer check passed the dark-canvas part but `picChrome` covered the child controls because its designer z-order was wrong. Runtime win32 was also opened by Shane and the themed picker still worked, so the observed stacking issue is designer-only. |
| 1.0.0.7: PropertyPage designer z-order experiment | Superseded. Shane's side-by-side check showed 1.0.0.6's original sibling order was actually the more accurate designer representation. |
| 1.0.0.8: native PropertySheet skin | Core visual proof passed in win32: dark host/title/tab/button shell appeared and the picker still worked. Issues found: initial white search Edit until interaction, tab/button hover flicker, clipped Apply text. |
| 1.0.0.9: PropertySheet paint/layout follow-up | Superseded by 1.0.0.10 before build. Owns WM_PAINT, refreshes the search Edit, resizes/repositions the real button HWNDs, and requests source-backed WinUI TabViewItem dimensions/typography. |
| 1.0.0.10: centered grid + dual-font details | Visually reviewed in win32 by Shane: centered matrix and dual-font Selected icon area look good. Remaining issues: native Edit repaints white, Icon tab still clipped, preview cards too dominant/too near action row. |
| 1.0.0.11: Edit/tab/preview follow-up | Runtime regression in win32: introduced a large white band above the page and did not fix the white Edit; tab still imperfect. Preview cards were reduced as intended. |
| 1.0.0.12: corrective Edit/tab geometry pass | Runtime screenshot still showed the same core defects; the page geometry experiment did not solve the problem. |
| 1.0.0.13: diagnostic rollback | Built/run win32. Probe confirmed `ThunderTextBox` is the exposed txtSearch HWND, parented by `ThunderPropertyPageDC`, and that parent receives `WM_CTLCOLOREDIT` for it. Clicking Apply also caused the page to shift down and reveal the full Icon tab. |
| 1.0.0.14: confirmed TextBox brush + Apply-layout trace | Built/opened in win32. Screenshot showed the native search edit still white and the Icon tab still clipped, so the confirmed WM_CTLCOLOREDIT route alone was not enough to fix the edit and the forced 32-DIP native tab item remained incompatible with BETA 997's reserved page geometry. |
| 1.0.0.15: native tab metrics + ThunderTextBox erase pass | Built/opened in win32. The Icon tab was still clipped; the diagnostic log then showed tbUI3 had attached to ThunderPropertyPageDC itself and had no tab HWND.  Leaves the real tab item at the host's native metrics and paints inside that rectangle; the confirmed ThunderTextBox subclass now fills WM_ERASEBKGND from the same themed brush and invalidates on focus changes. Not built/run. |
| 1.0.0.16: PropertySheet owner-chain host fix | Built/opened in win32. Search TextBox stayed dark and the Icon tab was fully visible, but the outer PropertySheet remained classic/light because host discovery still happened before BETA 997 inserted the top-level page into its owner. |
| 1.0.0.17: late PropertySheet host acquisition | Built/opened in win32. TextBox stayed dark and native Icon tab stayed fully visible, but the outer shell remained classic/light; repaint-time GA_ROOTOWNER still resolved only to ThunderPropertyPageDC. |
| 1.0.0.18: structural PropertySheet promotion | Built/opened in win32. Correctly found the outer #32770 and SysTabControl32; titlebar/page/TextBox were dark and tab geometry was correct, but tab strip and action buttons still showed native light paint. |
| 1.0.0.19: deferred PropertySheet skin activation | Built in win32 with TB0012 on `WM_APP = &H8000`; visual result still showed native light tab/button chrome. |
| 1.0.0.20: WM_APP literal-width correction | Candidate only. Uses `&H8000&` so the deferred promotion message is a proper 32-bit Long. No other behavior change. |
| 1.0.0.21: PropertySheet skin attach fix (Claude review) | Built on BETA 999 win32: fully dark on open, hover works. Skin attaches only to the real sheet and is never swapped back to the page; search-box hooks armed separately; log off. See CHANGELOG. |
| 1.0.0.22: disabled Apply underline fix | Validated on BETA 999 win32 with Apply, OK, Cancel and reopen. Skinned buttons repaint after WM_UPDATEUISTATE, BM_SETSTYLE and WM_SETTEXT. |
| 1.0.0.23: package settings (Shane) | Package sorts where it is easy to find in the IDE picker. |
| 1.0.0.24: dialog centred on open | Validated by Shane (win32 and win64 checks). Centred once on the IDE's monitor work area. |
| 1.0.0.25: full Segoe Fluent icon set | Validated by Shane (search, pick, Apply, reopen). UI3Icon = 1,533 Gallery glyphs by code point, generated by tools/gen-icons.mjs; breaking for saved icons. |
| 1.0.0.26 to 1.0.0.28: icon gallery spike | Answered and removed in 1.0.0.29. Package resources read from the host or bloat EXEs; PropertyBag byte arrays persist. |
| 1.0.0.29: spike removed | Not yet built. Next: per-PC icon library (ROADMAP). |
| Icon library builder | `tools/build-icon-library.mjs` (zip checked in the cloud and with Windows `tar` by Shane; not yet used by tbUI3). Host: Arrow-Loop/tbUI3-Libraries. |
| 1.0.0.30: picker tab strip and Setup tab | Built by Shane: install/uninstall work; flicker and a light search box on first open. Installs the library to %LOCALAPPDATA%\tbUI3 (UI3IconLibrary); Fluent and Gallery tabs only report state. |
| 1.0.0.31: flicker and search box fix | Built by Shane: worse, the chrome stopped painting (WS_CLIPSIBLINGS). |
| 1.0.0.32: clipping removed | Built by Shane: chrome paints; tab/Setup hover still flickers; search box opens light until first interaction. |
| 1.0.0.33: owner-drawn picker chrome | Built by Shane: flicker gone; search box still opens light. UI3PageSurface owns picChrome WM_PAINT like the sheet buttons; search box repainted once after first paint. |
| 1.0.0.34: search box log build | Built by Shane: log showed a hidden second icon page taking over the search-box hooks. |
| 1.0.0.35: search box keeps its hooks | Built by Shane: still light on open. Hooks stay on the TextBox inside the sheet. |
| 1.0.0.36: search box repaint and pixel log | Built by Shane: box ends dark after a brief grey flash; log shows the page erase covering it. |
| 1.0.0.37: page erase skips the search box | Built by Shane: grey flash remains. |
| 1.0.0.38: immediate search box repaint | Built by Shane: no grey flash, confirmed fixed. Cause: the inner #32770 container's erase. Diagnostic log still on. |
| 1.0.0.39: Fluent UI System and Gallery grids | Built by Shane: both tabs work, Color SVGs draw; non-24 px icons drew unscaled. Passes 3 and 4: SVG grid with style cards, PNG grid; picks preview only. How the page was built: `docs/PROPERTY_PAGE_GUIDE.md`. |
| 1.0.0.40: Fluent icons scaled to their slot | Not yet built. |
| 1.0.0.40 and 1.0.0.41: icon scaling, Additional Icons tab, MDL2 preview disabled when the glyph is missing | Built by Shane: all work. Icon's own "..." works from BETA 1008 (confirmed in 1012). |
| 1.0.0.42: pass 5a, IconSize and the EditProperty log | Built by Shane: IconSize works; `PropertyPage_EditProperty` is raised with "Icon". Pass 5 plan: `docs/2026-10-19-pass5-icon-system-plan.md`. |
| 1.0.0.43: pass 5b, stored SVG and image icons | Built by Shane: images load, copy, scale and recolour in dark and light. The pane hides IconSource and shows a blank IconData (fixed in 5c). |
| 1.0.0.44: pass 5c, Apply from the library tabs | Built by Shane: works. Log shows a spurious error 438 from `CallByName ... LoadIcon` after each Apply. |
| 1.0.0.45: LoadIcon step logging, for 5d | Built by Shane: EXE draws all picked icons without the library (win32). No error 438. win64: library Apply resyncs and is lost. |
| 1.0.0.46: design-time load/save tracing for the win64 failure | Built by Shane: win64 rebuilds the buttons from the saved form; Segoe Apply fails too. |
| 1.0.0.47: ApplyChanges, Let Icon and process tracing | Built by Shane: win64 Let Icon runs, then error 438 and the designer host process restarts. |
| 1.0.0.48: locate the win64 error inside Let Icon | Built by Shane: Let Icon completes; the win64 designer process dies when the dialog closes (even Cancel). |
| 1.0.0.49: win64 page window hooks off | Built by Shane: still resyncs; tbUI3's hooks are not the cause. BETA 999 fails too. |
| 1.0.0.50: hooks back on in win64 | Superseded by 1.0.0.51. |
| Repro (`tbUI3-Repro`) | win64 Apply works in plain twinBASIC; the fault is tbUI3's. |
| 1.0.0.51: page ignores the teardown SelectionChanged | Built by Shane: win64 Apply works for Segoe, Fluent and Additional Icons, and a win64 EXE draws the picked icons. Pass 5 closed (2026-10-20). |
| 1.0.0.52: UI3IconList L1, picker draws with UI3IconImage | Built by Shane: looks right and works; the grid flickered on scroll (2026-11-01). |
| 1.0.0.53: grid paints without erase | Built by Shane: smooth scrolling, but the grid opened classic grey (2026-11-01). |
| 1.0.0.54: grid repainted once on open | Built by Shane: still grey on open (2026-11-01). |
| 1.0.0.55: grid paint log | Built by Shane: the container erase paints over the grid after it draws (2026-11-01). |
| 1.0.0.56: grid repainted on the search box's repaint ticks | Built by Shane: grid opens correctly (2026-11-01). |
| 1.0.0.57: grid paint diagnostic removed | Built by Shane: all good; UI3IconList L1 done (2026-11-01). |
| 1.0.0.58: L2 spike (UI3Button.SpikeFind, temporary) | Built by Shane: `Parent.Controls(name)` finds a sibling at design and run time; `ParentControls` fails (2026-11-01). |
| 1.0.0.59: L2 spike removed | Not built on its own (folded into 1.0.0.60's test). |
| 1.0.0.60: UI3IconList L3, the list in code plus IconKey/IconList | Not yet built. |

## Work queue for the next passes (updated 2026-10-07)

Do these in order, one pass each unless they are trivially small. Each pass ends with Shane building and testing in the IDE, then CHANGELOG.md and ROADMAP.md (and this file's table) recording only what he actually saw.

1. **Build/test 1.0.0.25 in win32 (full icon set), then win64.** Open `(Custom)` → `...` and check that the title bar, tab strip, page and OK/Cancel/Apply are all dark, the Icon tab is fully visible, and the search box is dark. Then hover the buttons, type in the search box, pick an icon, click Apply, and close with OK; the dark skin must stay on throughout. If anything is light, set `PROPERTY_PAGE_LOG_ENABLED = True` in `UI3Window.twin`, rebuild, and read `%TEMP%\tbUI3-propertypage.log`.
   - **Do not touch the designer bridge.** Keep `IconPageApplying`, `SetPendingIcon`/`TakePendingIcon`, `DesignName()` and the `DesignLog` calls exactly as they are.
2. **Finish validating the picker behavior after the chrome pass is visually stable.** In win32 and then win64: pick + Apply; pick + OK; reopen; search `save`, `57716`, `E8CB`, `&HE174`; pick then Cancel; wheel over both the grid and search box; drag/click the new painted scrollbar. Then switch Windows light/dark while the property page is open and note whether the page/titlebar repaint immediately.
3. **If the first chrome pass is stable, spike the host button strip.** Inspect the property-sheet HWND hierarchy and test a reversible overlay for host-owned OK/Cancel/Apply while leaving their native behavior underneath. Do not ship a host-window subclass/overlay unless teardown and keyboard behavior are proven.
4. **Tidy tbUI3Test.** Remove the two MDL2 test lines (`IconFontName`/`IconGlyph`) from frmMain's `Form_Activate`.
5. **Themed form canvas at design time** (ROADMAP, designer experience). UI3FormTheme themes the form only at runtime, so in the designer UI3 controls draw dark on a light form. First check that the designer lets a component set its parent form's BackColor at design time (`Ambient.UserMode = False`), then apply the WinUI window background when `ManageBackColor` is True. Cite the microsoft-ui-xaml source for the colours.
6. **Designer accent refresh** (ROADMAP). The designer reads the accent once at IDE start; refresh the theme cache at design time cheaply.
7. **S2 BackColor repaint check** (ROADMAP, spike A). Change a form's BackColor at runtime without UI3FormTheme and confirm the button repaints.
8. Then continue spike A in ROADMAP order (S4 windowless/transparent, S5 Mica, S6 per-monitor DPI, S7 visual states, S8 keyboard/focus, S9 coexistence). Each needs a short spec and Shane's go-ahead before code.

Things that need Shane's decision, not a pass of their own: a dark icon-picker page (exploratory; the Windows-drawn dialog frame stays light), picker extras (arrow keys, hover), what to do with PR #1 and `main`, and where `reference-packages/` lives.

## How a pass works with Shane

- Shane builds, tests and saves in the IDE himself. Give him one step at a time with the exact command to type or thing to click, and ask for a screenshot when the result is visual.
- Version: bump `project.versionRevision` in `tbUI3/src/Settings` (LF line endings) when the package changes, and add a line to `tbUI3/src/CHANGELOG.md`, which ships inside the package.
- Typical test loop: close the projects in the IDE, `git pull --no-edit`, reopen tbUI3, build, update the tbUI3 package inside tbUI3Test, test, then Shane commits and pushes (`git commit -am "..." && git push`).
- If `git pull` refuses because tbUI3Test.twinproj has local changes (usually from updating the package), use `git stash && git pull --no-edit`; the package is re-imported anyway.
- After Shane pushes, regenerate src from his projects (`node tools/twinproj-src.mjs extract tbUI3Test/tbUI3Test.twinproj tbUI3Test/src`, and the same for tbUI3) and check with `compare`.

### Syncing the project and src

- `tools/twinproj-src.mjs` replaces the twinBASIC CLI for this: `extract` regenerates `src/` from a project Shane pushed, `patch` copies edited src files into the project, `compare` checks they match. The CLI export also works but needs absolute paths.
- Never push a `.twinproj` while Shane has uncommitted IDE changes to the same file: it is binary and cannot be merged. Ask him to commit and push first (`git commit -am "..." && git push`), then pull and work.

## Reference package laboratory

- `reference-packages/ReferencePackages.twinproj` is the validated package-archeology project. Shane confirmed the repaired project runs in BETA 997.
- It intentionally enables many packages so their actual source/API patterns can be inspected in one place. That does **not** authorize adding those packages as tbUI3 dependencies.
- The loose `reference-packages/src/` mirror should be used for searches and diffs; the `.twinproj` remains the canonical snapshot.
- The original diagnostic avalanche was caused by WinDevLibImpl's embedded `Packages/WinDevLib` folder being empty even though its Settings declared that local dependency. The repaired snapshot embeds the same WinDevLib 9.5.742 payload there. Do not “fix” those interfaces by duplicating hundreds of missing declarations.
- Priority donors/references: WinRT (runtime activation, HSTRING, Composition, and its modern subclass helper), WinDevLib/WinDevLibImpl (Windows/COM declarations), VBCCR18 (modern subclassing and mature control behavior), TwinTimerLib, AutoCompleteLib, and OLEGuids. The audited WinRT 1.7.0.159 source does not contain UISettings/GetColorValue, and TBMANLIB 1.0.29.0's subclass helper is legacy 32-bit code, so neither should be assumed to solve those jobs. GdiPlus is comparison/reference only; tbUI3 remains Direct2D/DirectWrite-first.
- For any adapted third-party code, verify the licence and record provenance. Minimize the copied surface and keep helpers private where practical.

## Control fidelity rule

- Read `docs/CONTROL_FIDELITY_POLICY.md` before control work.
- This project is recreating WinUI 3 controls, not generic Fluent-looking controls.
- Control-specific microsoft-ui-xaml templates/theme resources outrank Gallery/general Fluent guidance.
- Follow exact resource chains and visual states where Microsoft defines them.
- Any property/value that exists only for twinBASIC/VB convenience must be explicitly labeled as such and must never be presented as “the WinUI value.”
- The S3 8-DIP `IconSpacing` default is currently one such convenience value; WinUI Button has arbitrary Content and defines no Button-specific icon-spacing property/resource.

## Full control-surface target

- `docs/CONTROL_INVENTORY.md` is the authoritative control/variant coverage map.
- The package goal is broad practical WinUI 3 coverage, including the hundreds of documented Gallery/style/behavior variants, **not** hundreds of toolbox entries.
- Preserve Claude decision D6: one coherent `UI3...` control family exposes related Microsoft controls through `Style`, `Mode`, `Presentation` or other focused properties. Example: `UI3Button` covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit and command-bar button variants.
- Current Microsoft Gallery snapshot used for the inventory: 2026-10-05 main commit `b927a6253d6b183be55b90287b8a04fde14d31a3`, 125 catalog pages.
- Fundamentals/design/accessibility pages become package-wide requirements, while platform/service pages such as Clipboard, shell notifications or AppWindow are not misrepresented as draggable controls.
- Do not add package dependencies merely to cover a Gallery host/service. Use private native implementations, optional adapters/companions or documented existing platform facilities as appropriate.

## Prepared next milestone

- `docs/2026-10-06-s3-icon-spec.md` is the S3 specification. S3 is now implemented and validated.
- Icon code points: a WinUI Symbol value (for example Accept = E10B) is the old Segoe UI Symbol code point. WinUI converts it to a modern code point (Accept = E8FB) before drawing. Segoe Fluent Icons and Segoe MDL2 Assets both use the modern code points, so tbUI3 keeps one table copied from WinUI's `icon.cpp`. This supersedes the S3 spec's original "dual mapping" rule.
- Ordinary text remains Segoe UI Variable Text with Segoe UI fallback; system icons use Segoe Fluent Icons with Segoe MDL2 Assets fallback.
- Current Gallery also exposes SubtleButtonStyle, now recorded as part of the UI3Button family target.

## Gotchas

- **Re-importing the package into tbUI3Test.**
  - The IDE's "Import from file" refuses a package whose name is already embedded ("'tbUI3' conflicts with an existing imported package").
  - Removing the reference in the IDE doesn't remove the embedded copy.
  - Instead, update the embedded copy (Shane does this from the IDE as part of each test loop). The embedded copy is just the package's own source export.
  - In the IDE's dialog, the imported package also has to be ticked by hand. GUI automation struggled with that.
- **`.twinproj` files are binary.**
  - Edit them by exporting to `src/`, editing, and importing with the twinBASIC CLI, or patch them with `tools/*.mjs`.
  - The documentation repo's `impexp.mjs` import re-sorts entries and its export drops `.meta`. Don't round-trip through it.
  - Keep `.twin` files CRLF. Keep each `Settings` file's existing line endings: the package's uses LF.
- **IDs.** Never change UI3Button's class, interface or event IDs (`tbUI3/UI3Button-ids.json`).
- **WinUI colours.** WinUI's dark fills are translucent, so test on a dark form (#202020). On the default light grey form the Standard button's text is nearly invisible.
- **Declarations.** The Direct2D/DirectWrite interfaces in `UI3Direct2D.twin` declare only the vtable slots that are used; the rest are numbered placeholders. When you call a new method, replace its placeholder in the same slot. Never insert or reorder slots.
- **PropertyPages (BETA 997).** Setting `Me.Changed` inside `PropertyPage_SelectionChanged` raises "Automation error" 80004005 (the frame is still in `SetObjects`); start pages unchanged instead. The per-property `[PropertyPage("...")]` link is ignored, so pages open only from `(Custom)` → `...`. `UserControl.PropertyChanged` can leave a swallowed DISP_E_UNKNOWNNAME in `Err` after it returns, so don't treat `Err` after a property Let as proof the Let failed. Shane has reported both issues to twinBASIC.
- **PropertyBag defaults.** A value equal to the `WriteProperty` default is not saved. If a new control starts with a different value (InitProperties), clearing it back to the default must still work (the 1.0.0.4 Caption fix used `NEW_CONTROL_CAPTION` vs `DEFAULT_CAPTION`).
- **CLI export** needs absolute paths; with relative paths it says the input twinproj does not exist. `tools/twinproj-src.mjs` avoids the CLI entirely.
- **Reading the accent.** It is read from the undocumented `AccentPalette` registry value. Entry 1 is Light2, which is the accent button fill in dark mode (so the button shows #FF8279 on Shane's PC).

## Working agreements with Shane

- Push only to `tbui3-dev`. Don't open PRs or merge without Shane asking.
- Update CHANGELOG.md and ROADMAP.md in every pass. Record only what was actually run as verified.
- Keep instructions to Shane short and one step at a time, with the exact thing to click or type.
- win32 and win64 (Shane, 2026-10-20): Shane tests each build in win32 only. At the end of each pass, first review that pass's changes for x64 traps (Long vs LongPtr in declares, struct sizes, COM interface layouts, subclassing), then Shane runs one short win64 smoke test: open a form, open the picker, apply, reopen, run the app.
