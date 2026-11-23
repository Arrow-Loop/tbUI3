# Roadmap: tbUI3 IDE

## 2026-11-23 - Updater host aligned to the working Smith Debnam Toolkit

Shane designated the private **sdlaw-sdelorme/Diagnostics** repository as the ongoing incoming diagnostic source. Read it through the Smith Debnam connection; local output remains `%LOCALAPPDATA%\tbUI3\Diagnostics\`. No automatic upload or writes to the diagnostics repository are added.

The latest snapshot again records 57/57 native self-tests passing. Its startup log shows one embedded-resource-assembly E_FAIL, then another run submitting a 192,315-character HTML document without a recorded page-ready handshake. This narrows the evidence without proving the precise blank-window cause.

Compared the current Smith-Debnam Toolkit example at **218871daaae25c81df668d174b80284edae22ec2** against its canonical mirror hashes. Aligned updater event conventions, constructor DPI initialization, complete IDE-created form defaults, black native underlay, Ready reentrancy guard and navigation-completion lifecycle. Replaced the custom pointer-based UI resource conversion with the Toolkit's whole-buffer LoadResData/StrConv pattern, explicitly selecting UTF-8 for our resources. Per-resource error context is retained. Form identities, updater dimensions and security restrictions remain; Gallery, tab windows, splash and installer/message-box dependencies are not imported.

**Updater.exe retains its separate update/progress/recovery UI. The Welcome Wizard remains add-in-only.** Native form/UI launch and the changed resource reader still require rebuild/runtime confirmation; no native success is claimed by source/DOM checks. Canonical projects/mirrors are synchronized. No main merge, PR, release, binary embedding or GUI automation.

Validation: **235 Node tests pass**, with **134 exact canonical/source mirrors**, stable IDs/CRLF/hex checks, generator idempotence and diff checks passing. The existing user-provided 57/57 native result predates this host change; no new native compile or GUI run was performed by Cody.

## 2026-11-23 - Refined Wizard integration, native 57/57 evidence, unified diagnostics

Integrated Quill's approved view through **79be9e5** unchanged: full Master CSS/shared controls in an isolated iframe under the native HTML dialog, real native installed-theme inventory/parent inheritance/color data, exact-name apply validation, Windows accent, correlated acknowledgements, conditional Setup, async repair, hidden channel selector and revised feature copy. Production settings also omit channel selection; internal release safety/channel metadata remains. Known BETA 1045 loader behavior determines effective duplicate-name selection; no guessed AppData/local precedence. New native palette/host code still needs native acceptance; unresolved colors are explicitly unavailable.

Shane's second archive reports **57 native self-tests passed, zero failed** after the byte-buffer correction. The original 42/54 report and the passing report/archive digest are retained in `tbIDE/Updater/validation/`. These results establish the tested engine cases, not WebView2 or live installation acceptance. Actual helper binary embedding remains the separate Phase 1 pass.

Consolidated active TabView, property-page, paint/designer, updater startup/worker and native-test diagnostics under **%LOCALAPPDATA%\tbUI3\Diagnostics\**; [diagnostic locations](../docs/DIAGNOSTICS.md). Operational recovery/settings/profile data stays in place. Canonical core, test embedded package, add-in and updater are synchronized; rebuild/re-import existing consumers to adopt the new routes. No trace flags enabled, user projects rewritten or old logs deleted.

Shane reported a blank updater form and blank browser fallback despite detected WebView2. Corrected IDE argument parsing (`Command$` instead of host-process command line), changed fallback to verified atomic UTF-8 output with actual escaped error, added startup-stage/error-number logs and guarded repeated fallback. **The blank native window's exact failing operation remains unconfirmed pending the new stage log; no GUI/native startup success is claimed.** See the diagnostic guide. No Screen Control/GUI automation, main merge, PR, release or compiled-helper embedding.

## 2026-11-23 - Welcome Wizard theme enumeration and deferred release channel

**Future (deferred):** Restore the Welcome Wizard's stable/development **release-channel selector only after twinBASIC has a genuine stable release/channel**, with real available-release semantics, native validation and persistence. Shane explicitly removed it from first-release onboarding on 2026-11-23 because twinBASIC currently has no stable release. Keep existing internal channel compatibility as needed; do not expose a nonfunctional selection.

**Phase 1 native integration requirement:** Extend the `choose-theme` whitelist from two hardcoded WinUI3 theme names to the **trusted current installed IDE theme inventory**. Publish `installedThemes` and resolved theme preview colors to the wizard snapshot; featured WinUI3 Light/Dark remain first, and all other installed IDE themes can be chosen without arbitrary filesystem path acceptance. Quill's isolated Toolkit-based view in `prototypes/welcome-wizard/` implements the UI, but **Cody's production bridge enumeration and native tests remain pending**. Remove TabView/TabPage marketing from the wizard Features page: those controls belong to the core tbUI3 toolkit, although tbUI3IDE supports them.

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

Shane's subsequent sequencing instruction makes **actual compiled Updater.exe embedding a separate Phase 1 pass after native acceptance**. Bundle generation and real compiled-DLL verification are implemented; no stale/mock payload is embedded. The combined first public release remains gated on accepted updater, both embedded DLLs, shared-loader evidence and complete first-install/runtime acceptance. Phases 2/3 remain deferred. See [Phase 1 handoff](PHASE1_HANDOFF.md) for build order, static loader evidence, open native gates and focused acceptance. This source pass does not claim successful native compilation or a production-ready release.

## 2026-11-23 - Agent-ready consolidated updater and installation manager specification

Created [INSTALLATION_MANAGER_SPEC.md](INSTALLATION_MANAGER_SPEC.md) as the authoritative complete product handoff for Cody/Claude: combined first-release updater/bootstrap/Welcome scope, user AppData DLLs and themes, LocalAppData helper and per-installation state, preferences and low-prompt interaction, InPlace/InstallAlongside/ArchivePrevious, cross-drive full archives, extra-content archive/new/both choices, dynamically validated official release inventories, optional discovery/reorganization and shortcut caveats, shared-versus-local add-in compatibility and verified phase gates. **The specification is documentation only, not a shipped feature.** Follow its phase boundaries; preserve unresolved host-loader and elevation questions for explicit investigation.

## 2026-11-23 - Release milestone consolidation: native updater + bootstrap + Welcome Wizard

**Agreed change:** Combine former Phases 1 and 2 into the **first production release**. Ship only after native updater acceptance *and* verified two-DLL per-user deployment, embedded/updater/theme self-provisioning, re-openable Welcome Wizard, IDE Options, and release packaging are implemented and validated together. In-place remains the default IDE update strategy. See [detailed phase boundaries, compatibility and future-proofing](BOOTSTRAP_WELCOME_PLAN.md#delivery-sequencing-decision-merged-first-production-milestone-2026-11-23).

Subsequent phases: (1) alongside and archive update strategies, configurable cross-drive archival and release-inventory classification with preserved custom content; (2) installation discovery/reorganization, shortcuts, advanced archived-add-in compatibility. Define identity, settings, release inventory and strategy boundaries during the combined first phase, but do not implement advanced workflows before they're needed. **Planning only; implementation/first release pending.**

## 2026-11-23 - Self-provisioning add-in and Welcome Wizard (approved, not implemented)

**Agreed future architecture:** the user manually installs only architecture-appropriate `tbUI3IDE.dll` files. Each DLL embeds the portable Win32 `Updater.exe` and WinUI3 Light/Dark themes; on every add-in load it validates/provisions missing or eligible outdated dependencies, independent of the online update setting. Shared updater location is `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe`; themes remain in `%APPDATA%\twinBASIC\themes`. Multiple separate twinBASIC IDE installations share the per-user executable but keep per-installation update settings/transactions, backed by stable installation IDs. Preserve custom themes, never downgrade newer updater, use atomic writes/locks and no silent UAC. Approved changes to protected IDE files need a separately implemented consented elevation path.

An embedded HTML/CSS/JS Welcome Wizard introduces updates, WinUI3 themes, Classic/Hybrid/Ribbon and designer capabilities, allows relevant preferences to be set, persists completion independently of resource repair, and can be reopened through the add-in. The existing updater path contract, packaging, canonical projects and native tests must be revised before claiming this behavior works. See [complete bootstrap and welcome design](BOOTSTRAP_WELCOME_PLAN.md). **The present first install remains manual; implementation and acceptance pending.**


## 2026-11-23 - BETA 1045 hex-literal warnings corrected; automated gate added

Explicitly typed the updater's Unicode, PE and ZIP literals and its intentional signed GUID field. AGENTS.md now defines the required width rule; both the normal project validator and Node suite enforce it against active canonical projects and mirrors. Source checks pass; reopen/recompile Updater in BETA 1045, then run its native self-tests. Public repository access is available, but end-to-end binary update acceptance still needs a published release with ZIPs and tbUI3-update.json. No release is published by this pass.


## 2026-11-20 - Updater compile correction awaiting recheck

Fixed Shane's BETA 997 TB5172 duplicate-label report by separating the three DPI initialization/window-opening call sequences in MainModule. Canonical project/mirror validation passes. Next: reopen the updated Updater project and compile again; native build/runtime and the executable self-tests remain pending.


## 2026-11-20 - Native updater engine source delivered; compile acceptance pending

Updater 0.1.0.1 now contains its update/recovery engine as twinBASIC code; tbUI3IDE 0.3.0.22 expects only the EXE. The PowerShell runtime script is removed. WebView2 UI and hidden worker are separate processes of the same executable, with verified detached self-update. Current architecture and native test instructions: [Updater README](Updater/README.md#native-engine-and-executable-self-tests).

Next gate: reopen/build both canonical projects, run the compiled EXE's 47 `-SelfTest` cases, then use a disposable portable IDE to validate normal shutdown/On Exit/cancel, real download/staging, vendor-file preservation, locks, interrupted recovery and self-update. The 186 Node checks validate fixtures/source contracts/UI; they do not establish that the native engine compiles or runs. Native compilation remains deferred at Shane's request. No `main` merge, PR or release publication.


## 2026-11-19 - Updater source implementation delivered; native acceptance next

tbUI3IDE 0.3.0.21 and Updater 0.1.0.0 implement the agreed discovery/notification, WebView2 sidecar, verified staging, normal-exit consent, in-place journal/backup/rollback, self-update handoff and release-packaging contract. Quill coordination is complete; the separate core-package numbering migration remains outside this pass.

**Next gate (Shane, deferred at his request):** fresh native builds of both add-in architectures and the Win32 WebView2 sidecar; live save/cancel/On Exit/crash/other-session/locked-cache cases; combined update, interrupted recovery and self-update; Windows theme/accent, DPI and missing Runtime. Then publish the first release assets. [Detailed checklist](Updater/README.md#validation-and-tomorrows-acceptance).

Automated validation is complete as recorded in CHANGELOG.md. Remaining follow-ups: a real vendor stable-channel contract, optional control-package distribution when published, original working-directory/launch-context capture where supported, and automated release CI after native acceptance. No main merge or PR is part of this pass.


## 2026-11-19 - Prerelease version correction (pending coordinated migration)

Current tbUI3IDE 1.3.0.20 will be corrected to 0.3.0.20 in both canonical packed project and source Settings; earlier 1.1/1.2/1.3 development series map retrospectively to 0.1/0.2/0.3 without rewriting historical Git commits. The separate core tbUI3 package 1.0.0.75 similarly maps to 0.0.0.75, including the test-project embedded package reference. Coordinate with active updater implementation before edits and ensure updater migrates known mislabeled versions. See [versioning policy](../docs/VERSIONING_POLICY.md). **Not yet applied to binaries or packed projects.**

## Agreed scope: unified twinBASIC / tbUI3 updater (2026-11-19)

Build a small standalone `Updater.exe` alongside the twinBASIC IDE and an update-check/consent flow in the unified `tbUI3IDE` add-in. Manage official twinBASIC portable IDE releases, both add-in architectures, WinUI3 IDE themes, and the existing tbUI3 icon/resource pack. Include tbUI3 control-package release downloads without silently rewriting embedded copies inside user projects. User choices: **Update Now**, **Update on Exit**, **Remind Me Later**; select components; optional IDE restart. Approved policy is **in-place overwrite** of the existing portable IDE directory, not permanent versioned folders. Require verified downloads, locked-process wait, backups and rollback, target allowlists, preservation of user files and a detached helper for updater self-update. Source implementation, confirmed beta endpoint, release manifest and packager are delivered. Native acceptance and release publication remain open. Full implementation specification: [Unified updater plan](UPDATER_PLAN.md).

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

## Current TabView candidate: package 1.0.0.67 / add-in 1.3.0.16

The three reported TB0012 glyph warnings are addressed with explicit Long suffixes. Rebuild package 67, confirm those warnings are gone, re-import into the test project and continue the native Edge/Explorer/interaction checks from the preceding pass. Adapter v9 and the add-in are unchanged. 142 tests and 71 mirrors pass; native recompilation and remaining TabView feature gates remain open.

## Current TabView candidate: package 1.0.0.66 / add-in 1.3.0.16

Shane confirms the existing designer workflow works. The next milestone is appearance/interactions. TabStyle now offers Edge (default, Toolkit 36/4/8) and Explorer (WinUI 32/8/4), curved joins, state/focus rendering, ellipsis and header overflow navigation with adapter v9. 142 tests, 71 mirrors, x86/x64 geometry/text API probes and live Toolkit curve comparisons pass. Native IDE launch was blocked by Computer Use Access denied (0x80070005); no compiled-control acceptance is claimed. Build/re-import package 66, rebuild/reload the add-in, then verify both styles, geometry, input/scroll behavior, persistence and existing page authoring. Evidence: docs/validation/2026-11-17-tabview-profiles.md. Close buttons/events, icons, drag/reorder, animation, accessibility/high contrast and remaining template stroke fidelity remain open.

## Current candidate: tbUI3IDE 1.3.0.15

Save Document now uses the selected editor's native save route instead of the disabled IDE placeholder. Form / Code requires a real designer/code counterpart. Native gate: rebuild/reload, edit both a form and code document, save one and verify the other remains dirty; reopen the saved document, exercise Save As cancel/complete, and switch between standalone modules and paired form/code tabs. Repeat in Ribbon/Hybrid full/simplified. 135 tests, 71 mirrors and eight Edge document flows pass; native compiled-host acceptance remains open. Evidence: docs/validation/2026-11-17-document-commands.md. TabView work is deferred while this reported add-in bug is addressed.

## Current candidate: tbUI3IDE 1.3.0.14

Ribbon elevation is restricted to WinUI3 Dark/Light. Standard and third-party themes have no command-card shadow/bottom border. Native gate: rebuild/reload, switch themes in Ribbon and Hybrid (full/simplified), confirm the bottom line disappears outside WinUI3 and raised WinUI3 rendering remains. 130 tests, 71 mirrors and 32 Edge theme/profile/presentation checks pass. Evidence: docs/validation/2026-11-17-ribbon-elevation.md. Earlier native accent, preference and TabView acceptance gates remain open.

## Current candidate: tbUI3IDE 1.3.0.13

Neutral Light chrome, theme-restricted insets and Windows accent colors are implemented. Native gate: rebuild/reload the add-in; install the regenerated Light.theme; switch between both WinUI themes, standard/third-party themes and styling On/Off; verify no non-WinUI margin changes, caption readability/hover, unchanged caption-button geometry and system accent updates after changing Windows Personalization. Check both IDE architectures and restart preferences. Static themes retain fallback colors without the add-in. 129 tests, 71 mirrors, x86/x64 UISettings ABI probes and Edge fixtures pass; native compiled-host acceptance remains open. Evidence: docs/validation/2026-11-12-neutral-light-system-accent.md. Earlier candidate notes below are historical; only the two WinUI themes now receive optional insets.

## Current add-in follow-up: 1.3.0.12

Profile parity and the simplified-only scope correction are implemented. Rebuild/reload and verify Form / Code beside Save Document in both editors/profiles, Hybrid full/simplified with its original smaller inventory, Classic glyph-only native/add-in buttons and tooltips, and additional-styling window insets. Check full labels/inline Grid versus simplified icon-only controls/Grid flyout, inset chevron in both with hover-only background, and custom/real OS titlebar geometry. Restart to verify the saved presentation. Native acceptance remains open; 126 tests, 71 mirrors and Edge fixtures pass. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md. Older entries below describe their versions; this pass supersedes earlier scope/Hybrid shortcut statements. Adaptive group overflow/keytips and TabView gates remain open.

## Current candidate: 1.3.0.11, compact Form and Grid split

Native gate: rebuild/reload; verify Grid's main toggle versus options arrow, option values/events and flyout cleanup, no duplicate Show Grid option, labels/tooltips, full-width card/inset chevron, compact vertical centering and Quick Access's 16px left padding. Repeat shared controls in Hybrid and switch to Classic to verify restoration. 119 tests/71 mirrors and Edge fixtures pass; native acceptance remains pending. Evidence: ../docs/validation/2026-11-12-grid-split-compact.md. Previous adaptive overflow/keytip and TabView gates remain open.

## Current candidate: 1.3.0.10, Full/Simplified Ribbon

Native follow-up: toggle the bottom-right chevron and Ctrl+F1 between full and compact Ribbon, check every tab and dropdown, edit Grid values, use contextual MultiPage and native selectors, resize horizontally and restart to confirm the saved choice. Hybrid keeps its current structure. Source/browser validation: ../docs/validation/2026-11-12-simplified-ribbon.md (116 tests, 71 mirrors, Edge at 1280px/640px). Simplified uses horizontal scrolling with all commands retained; automatic group overflow menus/adaptive collapse and keytips remain open.

## Current candidate: 1.3.0.9, replacement quick-access logo

Rebuild/reload and verify the supplied small PNG before Save at native 15×16px size, with the existing theme/titlebar conditions. 111 tests, 71 mirrors and Edge fixture checks pass. Prior icon/Save Document/MultiPage acceptance gates remain open.

## Current candidate: 1.3.0.8, requested icons and Save Document

Native follow-up: review the requested Segoe/Fluent assignments on all tabs and File pages, Page Right's overlaid badge, the MultiPage separators/labels with unchanged help, and the File Open/Save separator. Confirm native Save Document enabled state/dispatch from the leading Document group on both Code/Form tabs, in Ribbon and Hybrid. Hybrid continues to retain native menus without quick access. Evidence: ../docs/validation/2026-11-12-requested-icons.md (111 checks, 71 mirrors, Edge fixture pass). Native build/rendered acceptance and previous adaptive/TabView gates remain open.

## Hybrid parity audit, 2026-11-12

105 checks pass with explicit Hybrid width/font and compact native-command coverage; shared Grid and inline MultiPage checks already cover both layouts. Shane confirmed Hybrid keeps its current native-menu structure, without quick access or Backstage. The logo and Backstage-specific Options organization remain Ribbon-only. This audit changes tests/docs only; current binary candidate remains 1.3.0.7.

## Current candidate: 1.3.0.7, quick-access logo fix

The logo gate now normalizes the lowercase name from twinBASIC's actual getThemeName(). Native follow-up: rebuild/reload and verify the logo in WinUI3 Dark/Light with real OS titlebar off, then verify it hides with a standard theme or real titlebar on. 104 checks and 71 mirrors pass; actual-function Edge fixture validation passes. Prior MultiPage/native acceptance gates remain open.

## Current candidate: 1.3.0.6, inline MultiPage

MultiPage is a contextual command group immediately after Grid in both Form layouts. Validate host/page/child selection, deselection, six command states/actions and continued access to the rest of Form in the compiled IDE. Automated/browser-fixture evidence: ../docs/validation/2026-11-12-inline-multipage.md. Existing adaptive Ribbon and TabView gates remain open.

## Current candidate: 1.3.0.5, 2026-11-12

The five recovered Ribbon refinements are implemented. Evidence: ../docs/validation/2026-11-12-ribbon-refinements.md. Next, build/save in twinBASIC and validate short/long labels, font scaling, Grid spacing, all ten icon-only actions, the single Options page, and logo visibility across both WinUI3 themes/titlebar settings. Prior native acceptance, adaptive collapse/keytips and real add-in enablement gates remain open.

## Single add-in distribution, implemented 2026-11-10

- Consolidation history: version 1.1.0.0 used WinUI3IdeStyle/WinUI3IdeStyle.twinproj and WinUI3IdeStyle.dll. The current 1.3.0.4 candidate uses tbUI3IDE/tbUI3IDE.twinproj and tbUI3IDE.dll. It combines the theme implementation with TabView adapter v8. The old standalone TabViewDesigner target is retired; migration removes its DLL from both architecture folders.
- Current gate: native combined startup/project load/unload, one set of toolbar commands, standard theme operation, page creation with the styling switch off and saved preferences retained. Source/JS/packing evidence is in ../docs/validation/2026-11-10-unified-ide-addin.md.

## Current implementation: tbUI3IDE 1.3.0.4 candidate

Implemented 2026-11-10: project/output rename, independent saved IDE Toolbar selector, Classic/Hybrid/Ribbon renderers, active-theme CSS, the existing Fluent glyphs at larger sizes, live native menu/toolbar discovery and state/dispatch, fullscreen File view, quick access, contextual MultiPage and restoration. The original requirements below remain the acceptance specification; implementation is not a claim of final Office parity. Source/DOM evidence is in ../docs/validation/2026-11-10-ide-toolbar.md.

Geometry update, 1.2.0.1: use a 100px command-area maximum plus a separate 26px tab-strip maximum, matching Shane's Office reference screenshot. Full-size buttons are 76px high, normally at least 50px wide and never wider than 86px. Borders/padding are included. Stacked rows are 24px with 2px gaps, giving a 76px span. Verify these compact dimensions in the native acceptance pass below.

Spacing follow-up, 1.2.0.2: collapse only the toolbar-owned native dock slot to remove its 30px minimum-height remainder; restore the established Fluent shadow4/card corners; use concise button/selector captions with full native help in tooltips; halve group side padding and use 2px horizontal gaps. The supplied BETA 1044 screenshot is evidence of the original blank strip and overlapping tooltip-derived labels. The new four regression checks pass; the corrected native appearance is not yet observed.

Semantic organization follow-up, 1.3.0.0: implemented Home Clipboard/Editing, dedicated Code/Form groups, Office-style View groups, Project build/compiler commands and vertical File navigation/tasks. Undo/Redo and the main execution controls are quick-access only. Backstage now hides/inerts and restores the live workspace/floating panels; new commands keep dynamic fallback destinations. Exact mapping and implementation contract: [RIBBON_LAYOUT.md](RIBBON_LAYOUT.md). Native rendered acceptance of this revision remains open.

Reference-driven presentation follow-up, 1.3.0.1 (2026-11-11): implemented the old toolbar surface resource, matching foregrounds, independent light/dark hover/pressed effects, function-based large/stacked command roles, icon coverage/fallbacks, Help under File and themed live grid controls. Shane's 1.3.0.0 screenshots demonstrate the organized tabs/File page opening and identify the prior surface/icon/sizing deficiencies; they do not validate the new revision. The 78 JS/DOM/CSSOM/protocol checks and packing comparisons pass. Mapping: RIBBON_LAYOUT.md; evidence: ../docs/validation/2026-11-11-ribbon-presentation.md.

Surface/layering follow-up, 1.3.0.2: implemented separate titlebar-colored tabs and toolbar-colored command card, indicator-only tab states, active-theme application dropdown fills, top-layer popovers with legacy fallback, the narrowly scoped native forced-white field override, masked and size-aligned chevrons, and an accessible circled File Back arrow. Shane's subsequent native 1.3.0.1 screenshots establish that the previous light dropdown, designer overlap and forced-white grid problem remained; prior CSSOM checks did not establish those rendered results. The new 84-check evidence includes the actual native forced-white rule: ../docs/validation/2026-11-11-ribbon-surfaces-popups.md.

Direct-command/editor-context follow-up, 1.3.0.3: implemented the eight classic Form controls directly, expanded native Insert items by task, browser/window outside dismissal, common top glyph alignment, File quick-access hiding, a visually unlabelled accessible Zoom selector, Code/Form editor following and the native Grid toggle. Shane describes the previous revision as a marked improvement; its manual-popover dismissal remained insufficient. The 93-check source/DOM/protocol evidence now includes real asynchronous native Add/Format producers and mode-change callback cleanup: ../docs/validation/2026-11-11-ribbon-direct-commands.md.

Geometry/theme lifecycle follow-up, 1.3.0.4: implemented centered 32px/16px canvases, minimum-content full-size widths within 50px/86px caps, 4px command-card top padding, 89px dividers, one Grid group, hidden Configuration caption, full-height File rail and application foreground. The actual BETA 1044 Options save path omits notifyChangedTheme; the add-in now observes page theme-property changes and reconciles the native name on its options timer, without resetting an unsaved styling preference. WinUI3 Light/Dark native and replacement dropdowns share subtle elevation. All 99 source/DOM/CSSOM/native-protocol checks pass; evidence: ../docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md. Shane's 1.3.0.3 screenshots establish the prior off-center glyphs, wide buttons, separate Grid categories, rail gap, incomplete theme cleanup and Native Dark File contrast failure.

Remaining work:

- Observe 1.3.0.4 canvas/label alignment, minimum-content widths on long/localized labels, 4px top padding, 89px dividers, single Grid category, hidden Configuration caption, full-height rail, native/replacement dropdown shadows and Native Dark contrast. Switch themes through both Options and View/Theme, including same-group dark-to-dark changes, additional styling On/Off, rapid changes before persistence and saved Off on restart. Retain the direct Form commands and expanded Insert options, window/browser outside dismissal over designer/Monaco surfaces, consistent top glyph rows, File quick-access hiding, Zoom caption removal, editor type/identity following without overriding manual choices, and Grid toggle/persistence. Retain top-layer/fallback painting checks over selected designer controls/grabbers; separate titlebar/tab and toolbar surfaces; selected/hover indicators; real grid number-field normal/hover/focus states; chevron positions; circled File Back. Cover light/dark, standard/third-party themes, additional styling on/off, native titlebar modes and popup teardown while switching modes/unloading. Compare to Shane's Office references; retain earlier shadow, compact labels and dock-slot checks in both Hybrid/Ribbon; switch to Classic and back, including redocked/shared-slot layouts. Verify no unrelated panel disappears and native panel layout persists as before.

- Observe the new native add-in startup/settings/mode-switch/unload and saved-mode restart in the IDE, including standard/third-party themes and additional styling off. Verify the project rename retains its prior Enabled setting and only one add-in instance loads after removing legacy DLLs.
- Review actual ribbon appearance and spacing, glyph rendering, narrow-window access and keyboard navigation. The current composition uses larger lead commands, three stacked rows and horizontal overflow. Office-style automatic group collapse/flyouts, keytips, complete focus parity remain follow-ups. Source validation is not visual acceptance.
- File > Add-ins migrates the native loaded-add-in list. BETA 1044 showAddinsMenu supplies notSupportedMenuOption stub actions and the inspected root bridge has only getAddinsList, without enable/disable. Real add-in enablement requires an exposed, validated IDE capability or separately designed restart-safe management; no functional enable/disable setting is implemented in this candidate.
- Validate all native menu families, every dynamic/lazy submenu and combo selector with real project/debug/designer context. Existing command handlers/shortcuts are reused, but private-API compatibility remains bounded by the current command model. Verify future menus/options appear without changing the add-in.
- Check live grid controls, build/zoom selectors, native menu shortcut interception, selected-page context, popup placement and File focus return in the actual IDE. Verify toolbar reparenting/docking and layout restoration without persisting hidden panels.
- The earlier browser fixture was rejected by the browser URL policy. Shane supplied native screenshots of 1.3.0.0 on 2026-11-11; native 1.3.0.1 findings are recorded above; Shane subsequently reported marked improvement; rendered acceptance of the new 1.3.0.4 behavior remains open. Remove temporary diagnostics only after observed behavior supports doing so.





## Toolbar requirements and acceptance specification

Shane specified and revised the next pass on 2026-11-10. Version 1.1.0.0 was the first consolidated add-in; the following rename, settings and toolbar modes are the agreed requirements; current implementation and remaining gates are recorded above. The original single ribbon proposal is retained below as Hybrid, superseded as the only replacement by the three-mode choice. The inline mockup was canceled.

### Identity and migration

- Rename the project to **tbUI3IDE**, including the canonical project/folder, output DLL and build/generator/documentation references. Intended canonical target: tbIDE/tbUI3IDE/tbUI3IDE.twinproj, output tbUI3IDE.dll.
- Preserve the established project ID, existing theme preference and all native page identities. Retain or migrate the WinUI3IdeStyle/Options/Enabled preference without resetting the user's choice.
- The rename remains one distributed add-in. Migration must remove the old WinUI3IdeStyle.dll as well as any remaining TabViewDesigner.dll from both architecture folders to avoid duplicate add-in instances.

### Design authority

Use Microsoft Office ribbon organization with WinUI 3's visual language. Shane explicitly authorizes Fluent UI Web as the basis for the ribbon, since there is no official WinUI 3 Ribbon implementation. This is a scoped design exception for ribbon structure/interaction, not a change to the control package's WinUI 3 fidelity policy. Consult current Microsoft Fluent UI Web sources for the ribbon pattern before implementation; use WinUI 3 resources for shared typography, geometry, controls and interaction states where those definitions exist. The selected IDE theme supplies the toolbar's palette and theme-state colors, as required below; do not force the included WinUI3 palettes onto other themes. Do not describe the result as an official WinUI 3 Ribbon control.

### Settings, themes and compatibility

- In IDE settings, directly below **Enable additional IDE theme styling via add-in**, add **IDE Toolbar**, a combo box with exactly **Classic**, **Hybrid**, and **Ribbon**, in that order. Persist the selected mode independently of the existing styling preference and preserve it through the tbUI3IDE rename.
- The control's placement below the styling switch is positional only. Turning additional theme styling off must not disable the combo box, force Classic or disable page management.
- Shane explicitly requires the toolbar UI to follow **whatever IDE theme the user selects**, including standard and third-party themes, whether or not either included WinUI3 theme is selected. This applies to the settings control, Hybrid/Ribbon tabs, groups, menus, fullscreen File view and quick-access area. Use the active IDE theme's colors/state resources, updating on theme changes; do not gate the toolbar on the WinUI3 theme names or impose their palettes on other themes.
- Keep the existing theme-styling preference's scope separate: it controls the optional additional IDE restyling. The toolbar modes have their own essential layout/presentation and active-theme integration, independent of that restyling.
- Compatibility default for existing installations with no saved toolbar mode: Classic. This is an implementation default to preserve their current layout, not a claim that the user selected a mode.

| Mode | Required behavior |
| --- | --- |
| Classic | Preserve the current native menu bar and existing toolbar layout, commands and contributed buttons, with their current active-theme behavior. |
| Hybrid | Preserve the native menu bar; replace the toolbar with the previously specified Home, Code, Form, contextual nested MultiPage and Add-ins organization below. |
| Ribbon | Migrate the full native menu/command surface into an Office-style ribbon, fullscreen File view and quick-access area as specified below. |

### Hybrid command layout

Home is a static, always-visible top-level tab. Code, Form and Add-ins are the other top-level tabs; MultiPage is contextual and nested under Form rather than a permanent peer. Ribbon controls should use appropriately sized icons, labels and groups, not merely place the existing small toolbar row inside tabs.

| Tab | Groups and commands, in requested order |
| --- | --- |
| Home | Save, Find in Project, Switch Between Form and Code; Undo, Redo; Start/Continue, Break Into Code, Stop, Step Over, Step Into, Step Out; build-configuration dropdown; Restart Compiler, Clean, Build; Change IDE Theme |
| Code | Comment Selection, Uncomment Selection, Indent Block, Outdent Block |
| Form | All Align Controls commands; all Resize Controls commands; existing grid indicator/options exposed directly in the ribbon where practical; Bring to Front and Send to Back; form designer zoom dropdown; Preview |
| MultiPage, nested under Form | Visible only for the selected multipage context; existing New page, Delete page, Page left, Page right, Refresh and Diagnostics commands |
| Add-ins | Toolbar buttons contributed by other add-ins, discovered dynamically and preserving each button's original behavior |

The request's plural Forms and singular Form refer to the same tab; use Form consistently. Bring to Front/Send to Back correspond to the existing menuBarBringToFront and menuBarSendToBack commands. Resolve the contextual MultiPage owner from native selection; the existing adapter already resolves a TabView from its page/child selection. Keep contextual navigation stable when commands create/select a page. This table defines Hybrid; do not silently substitute it for the complete Ribbon mode.

### Ribbon: full menu migration and Office interaction

- Reproduce Microsoft Office's ribbon organization and interaction with WinUI 3 visuals: tabs, labeled command groups, appropriate large/small commands, contextual tools, expanding/collapsing groups, overflow and keyboard access. This is a full menu replacement, not a second copy of Hybrid. The current mapping is documented in RIBBON_LAYOUT.md using Shane's screenshots and the linked official Office references; Office applications have differing command inventories, so preserve twinBASIC's IDE functions rather than inventing document-editing commands.
- Migrate all commands from **File, Edit, View, Project, Format, Debug, Run, Tools, Add-Ins, Window, and Help**, including nested and dynamically populated menu options. Project and Format are separate native menus. Retain their functions and discoverable grouping; the old menu row is replaced in Ribbon mode. Record a complete mapping from the current native menu tree during implementation, including how contextual Form/MultiPage tools are exposed.
- **File** opens an Office-style **fullscreen Backstage view within the IDE window**, covering the working area, with navigation, content sections and a clear back/close route. It is not an ordinary dropdown or OS fullscreen switch. Back/Escape returns to the prior document/designer and focus. Route existing file operations and settings to their real native commands.
- Put **which add-ins are enabled** into an **Add-ins section of the fullscreen File view**, preserving the native enable/disable behavior and any restart requirement the IDE actually has. Keep that management UI distinct from the **Add-ins ribbon**, which contains toolbar buttons contributed by other add-ins, including buttons added after startup.
- Move **Save, Undo, Redo, Play/Start/Continue, Pause/Break Into Code, and Stop** to a quick-access area in the space formerly occupied by the native menus, above the ribbon. If **Show real OS titlebar** is **off**, place this area in the IDE's custom title bar instead. Follow changes to that setting, preserve window controls/title dragging and command states, and do not attempt to put HTML controls into the real OS title bar.
- The eight classic alignment/size toolbar commands belong directly on Form, with other native options retained; Insert should expose the native Add options directly. Large-button glyphs share a fixed top row, File hides quick access, Zoom has no redundant visible caption, Code/Form follow real editor changes, and Form retains the native Grid toggle instead of a duplicate visible Show Grid checkbox.
- Help belongs under the fullscreen File view, not a separate ribbon tab. Every command button requires an icon, retaining existing Fluent/native glyphs and contributed images; use suitable Fluent fallback artwork for missing/unknown command glyphs. Determine full-size versus stacked roles from the closest Office function, independent of command order; multiple full-size commands may share one group.
- File view, quick-access commands, tabs, flyouts and groups all inherit the active IDE theme, including standard/third-party themes, independently of the additional-styling switch.

### Dynamic command discovery and future IDE updates

- Build the presentation from twinBASIC's **live menu and toolbar command model**, preserving command identity, hierarchy, caption, icon, enabled/visible/checked state, shortcuts, selectors and original handlers. The IDE remains the execution/state authority. Menu and toolbar entries representing the same command must share state and not execute twice.
- Discover new menus and menu options automatically: a new top-level native menu obtains a reachable ribbon section/tab, and an unrecognized option appears within its discovered parent group or overflow. Do not require a hard-coded whitelist or an add-in release for newly added commands to remain accessible. Explicit mappings may improve known-command presentation but cannot determine whether a command exists.
- Reconcile additions, removals, renames, ordering and state changes after startup, including project/context changes, theme changes, recently used items, dynamic submenus and other add-ins' contributions. Respect native lazy population without executing user actions merely to enumerate commands. Preserve native shortcuts and keyboard access through the replacement surface.
- The compatibility promise concerns added menus/options under the existing command model. Structural changes to twinBASIC's private APIs are a separate compatibility risk; detect unsupported layouts and restore the fully working Classic surface rather than showing incomplete menus. Document that boundary without claiming arbitrary future internals are supported.

### Implementation constraints and checks

- Preserve the IDE's real command nodes/handlers, enabled/checked state, tooltips, build/zoom selectors and shortcuts. Reuse/recheck actual command IDs from README.md and tools/build-toolbar-icons.mjs against the current BETA. Keep unknown native commands accessible rather than silently dropping them.
- Collect third-party toolbar buttons in Add-ins, including buttons added after startup. Keep this add-in's own TabView commands in MultiPage, not Add-ins. Preserve other add-ins' images and handlers.
- Keep tab management and all three toolbar choices available when optional styling is off or any standard/third-party IDE theme is selected. Provide the ordinary toolbar as a working fallback if replacement setup is unsupported. Restore moved nodes, selection, state and focus on mode changes, unload/error, without losing the saved mode preference.
- Cover Classic/Hybrid/Ribbon transitions, saved-mode restart, all active-theme/style-switch combinations, contextual selection, narrow-window overflow, keyboard/focus navigation, project changes, refresh and cleanup. In Hybrid, Home stays reachable. In Ribbon, File and quick-access controls remain reachable, including with the real OS title bar on/off and while changing that option.
- Verify every discovered native menu command has a reachable equivalent in Ribbon. Exercise newly injected top-level menus, nested/lazy menu items, renamed/removed commands and late third-party buttons without changing add-in code. Verify state synchronization, exact-once invocation, File enable/disable management and return focus. Keep observed DOM checks and native IDE results distinct.
- Preserve the working combined add-in lifecycle and native delete/readd correction; record actual native observations separately from DOM/protocol checks.

## TabView Designer candidate

- TabView management is now part of the unified add-in alongside tbUI3 1.0.0.65 (initial candidate 1.0.0.61), independently of the styling work below. Its README documents installation and validation boundaries.
- Current gate: adapter v8 in unified add-in 1.2.0.0 hides the page toolbox button without unregistering the class. Observe native toolbox rebuild/unload and ordinary +/New page insertion. Package 65 remains unchanged.
- Package 65 progress: Shane reports delete/readd appears to work; native logs confirm Name failures &H5B are skipped and replacement Page8 is discovered. Continue persistence and full undo/redo coverage.
- Continuing gate: adapter v7 (add-in 1.0.0.6) adds missing structural-delete notification and host-scoped generated names. Verify deleted Properties/generated entries vanish and add-after-delete works with correct bounds on two hosts, then save/reopen and undo/redo on BETA 1044. Host rename/reparent migration of existing names requires explicit refactoring; no automatic rename of existing code references is implemented.
- Previous gate: Shane reports the repeated-header correction appears to work. Adapter v6 (add-in 1.0.0.5) now locks page geometry through the native IDE while keeping host/child editing available. Verify selection, drag/keyboard/resize protection, host resizing, child editing and delete/undo. Confirm standard IDE Options lock persistence matches the intended workflow; cleanup preserves pre-existing locks.
- Earlier gate: adapter v4 improves behavior, but Shane reports a new empty host shows two matching Page 2 headers after + and the second is inaccessible. Package 1.0.0.64 deduplicates native discovery by identity/name; adapter v5 (add-in 1.0.0.4) adds count/name diagnostics and toolbar hover help. Verify one real first-page insertion, accessible headers and a second real page; compare native raw/unique/duplicate traces with DOM counts before assigning cause.
- Earlier blocker: Shane reports 1.0.0.63 renders normally and v3 + creates a page, but the new page cannot be selected. Logs confirm native fixture labels/order. Adapter v4 corrects live parent-header snapshots and activation after native page acknowledgement; verify the actual add/select/switch/drop/save/reopen loop. Intermittent reference-reload deserialization remains a separate unresolved issue. Older screenshots showed a purple strip and default labels. Compare adapter v4 TabView diagnostics before/after against the native 1.0.0.63 lines in tbUI3-tabview.log. The uploaded v3 diagnostics confirm accepted root/IDs and consumed marker; they show only the original three pages. Capture the added page before inferring its DOM ownership/class.
- Distinguish native bitmap corruption from DOM/CSS presentation using logged snapshot dimensions/checksums and native draw results. Follow up on temporary snapshot HWND resize if bounds drift. Remove/disable temporary logging after resolution.
- Next gate: actual native IDE authoring, persistence, undo/redo, Properties-selected child reveal and final win64 smoke. Record results before calling the baseline validated.
- Re-inspect private internals per beta. Preserve direct host targeting, unchanged coordinates, pending-compiler guards and cleanup. Replace the bridge with an official designer API when available.

## Committed next steps
- Shane rebuilds the add-in (hold Shift while opening its project) and runs README.md check list items 1 to 8, especially Options for anything cut off by the 32px text fields and the arrow-key highlight in menus. Fix what reads wrong.
- Shane builds `tbUI3IDE` in win32 and win64, runs the add-in check list in README.md and reports the Debug Console output. Then he saves the project in the IDE and the IDE-saved project and its export are committed, replacing the tool-built container.
- Shane tests both themes in BETA 1043 using the check list in README.md (the 1015 versions were never tested in the IDE); fix whatever reads wrong and record the result in CHANGELOG.md.
- Watch the dock container margin: if 2px margins make panels overflow or misalign when docking or resizing, fall back to `DockContainerMargin: 0` with `DockBorder` gaps.
- Re-check both themes against each new twinBASIC BETA. New properties appear in the shipped Dark.theme (it lists them all); rerun the property map against the new `ide/styles.css`.

## Planned: WinUI3 IDE Style add-in (agreed with Shane 2026-10-20; spike written 2026-10-30)

Update 2026-10-30: after testing on 1033 Shane wants the whole IDE to look like it was built with WinUI 3, using WinUI's DockingManager sample as the reference for panels (flat panels, sentence-case semibold-free headers with ... / pin / close glyphs, TabView-style document tabs). The theme files have reached their limit; the remaining items need this add-in: dialog button hover (fixed #ebeff5), WinUI ProgressBar (fixed green fill), menu bar hover, context menus and drop-downs, panel header weight and layout, tab shape.

Goal: reshape the IDE (tab shape, control heights and padding, Segoe UI Variable, dark context menus and drop-downs in WinUI3 Dark) beyond what a .theme file can set, without editing the IDE's own files.

Since BETA 1033, rounded panels and dialogs and dark dialogs no longer need the add-in; the theme files cover them. What BETA 1015 shows (read from the tbIDE package and ide/main.js, not yet tested):
- The official `ToolWindow.ApplyCss` and `AddMonacoWidget(..., Css)` only reach their own shadow DOM, so they cannot style the IDE.
- The add-in object model is late-bound into the real page. An `HtmlElement`'s `.Properties` walks any JavaScript property path and can call functions with arguments (Sample 11 calls `chartElement.Properties.chart.data.pushAndWrap(...)`). From any tool-window element, `.Properties.ownerDocument.head.insertAdjacentHTML("beforeend", "<style id=...>...</style>")` should add a stylesheet to the whole IDE.
- `Host` raises `OnChangedTheme` and exposes `Themes.ActiveThemeName`, so the add-in can apply its CSS only when WinUI3 Dark or WinUI3 Light is active and remove it otherwise.
- Add-ins are twinBASIC DLLs built like Sample 12, entry point `tbCreateCompilerAddin`, output to `addins\win32` and `addins\win64`.

Risks: reaching outside the tool window is not a documented use of the API and could be blocked or changed in a later BETA. Selectors in the IDE's stylesheet are not a stable contract either, so the add-in's CSS needs re-checking per BETA. Keep the .theme files working on their own, so the add-in is an optional extra.

Steps:
1. Spike (written 2026-10-30, not yet built): dialog button hover and pressed, ProgressBar, menu bar hover. It proves whether the page can be reached at all. Open questions it answers: does twinBASIC keep the case of late-bound JavaScript names (`ownerDocument`, `getElementById`, `textContent`); does the hidden tool window stay hidden across restarts; does the stylesheet survive the IDE reloading its theme.
2. If the spike works, extend the CSS per surface, using the property map from the theme work, in this order: context menus and code navigation drop-downs (dark in WinUI3 Dark), panel headers and layout per the DockingManager reference, TabView document tabs, accent-filled default dialog button, Segoe UI Variable, control heights and padding, the remaining Options-page texts.
2a. Done 2026-11-09: menus and context menus, editor tab shape, dialog and Options text boxes (from Shane's WinUI HTML/CSS reference). Also done 2026-11-09: dialog buttons from the reference's `.button`, drop-downs, check boxes and radio buttons, scroll bars, tooltips, the New / Open Project dialog as a NavigationView, the toolbar as a CommandBar with Fluent icons, the Options and Project Settings dialogs as NavigationView with settings rows, and the Library References tables and Compiler Warnings list as ListViews. Also done 2026-11-09: panel headers (subtle command buttons) and trees as TreeView. Also done 2026-11-09: English panel titles in sentence case (the add-in rewrites them). Next: the property sheet as list rows; the New / Open dialog's Open button as an accent button (the add-in would pick it by caption, if Shane wants); a WinUI overflow menu for the toolbar would need JavaScript, not CSS; Segoe UI Variable across the rest of the UI; Monaco's own hover and scroll bars through its theme.
3. Record per-BETA re-check steps (rerun the property map, then confirm each selector in `css/winui3-ide.css` still exists in `ide/styles.css`).
4. If an IDE release blocks reaching the page, fall back to the themes alone and raise the missing theme properties upstream (see Exploratory).

## Historical research: designer bridge for tbUI3 containers (2026-11-01)

Preserved from main during the 2026-11-10 reconciliation. Distribution and the initial page-authoring questions below are historical: the unified tbUI3IDE candidate now contains the implemented adapter. Current acceptance gates above are authoritative.

The add-in can drive the form designer, not just style it. `ownerDocument.defaultView.eval(js)` runs JavaScript in the IDE page and returns its value, and inserting a control's JSON through the designer's own insert steps creates a real, saved, undoable control. Proven with the throwaway DesignerBridgeProbe add-in. Recipe and history: `../docs/research/2026-11-01-multipage-designer.md`. Intended first use: one-click "New Page" for UI3TabView. Ideas beyond that (each needs Shane's go-ahead): HTML tab headers and a "+" drawn over the TabView (instant clicks, hover), our own items on the designer's right-click menu, drag to reorder tabs, hiding UI3TabPage from the toolbox, and handles for SplitView and Expander. Open for Shane: whether this goes in WinUI3IdeStyle or a separate add-in, and whether tbUI3 containers require it. The same per-beta risk as the stylesheet applies, but it's higher here, because these are internal designer functions, not just selectors.

## Exploratory

- The 2026-11-09 parked tabbed-ribbon idea was promoted to the next agreed pass on 2026-11-10; see the committed ribbon section above.
- Ask the twinBASIC project for theme properties for the hard-coded colours listed in README.md "Known limits" (still open in 1033: context menu item text, menu bar hover, title and dialog title text, caption icons, drop-down text, property category text, a separate focused dialog button text colour, tab shape, UI font). 1033 already added dialog contents and panel corners. With the rest, WinUI3 Dark could have dark menus, and WinUI3 Light a light title bar. This would be a GitHub issue on twinbasic/twinbasic, filed only with Shane's go-ahead.
- Accent variants: the build script could take an accent colour and emit themes for other Windows accents, since a theme file cannot read the system accent.
- WinUI-style syntax colours: optional, since WinUI defines no code palette; would need a reference such as Visual Studio's Dark and Light.
- Dropped 2026-11-09 (Shane): Fluent icons for the toolbox. The toolbox keeps the icons each control defines for itself, so the WinUI3 themes must not set the `ToolboxIcon*` properties to replace them.
- Distribution (decided by Shane 2026-10-30): one combined IDE add-in and optional theme files stay separate from the tbUI3 control package. A package runs no code when it is enabled, and silently installing into the IDE from a control was rejected. Likely shape: a "tbUI3 IDE extras" zip attached to tbUI3 releases, and possibly the add-in copying the themes into `%APPDATA%\twinBASIC\themes` on first load. Only after the add-in spike works in win32 and win64.
- Read the accent from Windows: the add-in could read the system accent and set the theme's accent CSS variables at run time, which a static .theme file cannot.
