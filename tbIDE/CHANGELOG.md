# Changelog: tbIDE (WinUI 3 look for the twinBASIC IDE)

## 2026-11-25 - Native update toast visual checkpoint

Owner's BETA 1045 Dark screenshot verifies the revised notification's single-column layout, readable body text, equal-height actions and green system accent. The Close glyph is missing and the shadow is not visibly apparent; those remain open. Source review confirms that Dismiss only hides the card, automatic checks are gated by local calendar date and deferral, and standalone Remind Me Later persists 24-hour deferral. Recorded the visual corrections and proposed split-button reminder behavior in ROADMAP. No runtime code or release changed.

## 2026-11-25 - Store logs and diagnostics switch (add-in 0.4.0.19, updater 0.2.0.8 source)

IDE Options category renamed "tbUI3" and gains the Store logs and diagnostics row; the add-in saves it to `tbUI3\Diagnostics\StoreLogs`. The add-in, updater and development tools stop storing logs while it is off. Details and limits: root [CHANGELOG](../CHANGELOG.md). Updater.exe needs a rebuild for 0.2.0.8.

## 2026-11-25 - Single-step development release publication approval

Selecting Development Tools option 1 or 3 now explicitly approves publication of the verified development prerelease. The publisher receives a per-invocation PublishApproved switch and skips the duplicate Y/N prompt only on that path. Standalone publication retains its confirmation. All source/account/asset/tag checks, conflicting-draft review and cancellation, immutable published-release handling and final result verification remain unchanged. No change to build-only options, runtime versions or published releases. Source inspection only; live publication acceptance remains pending.

## 2026-11-25 - Idle leak confirmed fixed; leak probe removed (add-in 0.4.0.18 source)

Owner native check of 0.4.0.17 with probe 0: Commit size of the IDE process stays flat while idle (it briefly dropped), so the per-tick theme inventory read was the leak. The temporary LeakProbe registry switch is removed from MainModule and TabViewDesignerController, and option M is removed from Development-Tools.bat and the README. A leftover `LeakProbe` value in the registry is now ignored and harmless. Version bumped to 0.4.0.18 because 0.4.0.17 is published.

## 2026-11-25 - Idle leak traced to the updater poll; theme inventory no longer fetched every tick (add-in 0.4.0.17 source)

Owner probe runs on 0.4.0.16: probe 1 (updater poll off after start-up) kept Commit size static, while probes 2 and 4 still leaked. The options timer kept running under probe 1 (several small page calls a second), so small page calls are not the leak. The only large per-tick read in the updater poll was `window.__tbUI3Themes.inventory()`, the full JSON of every installed theme, fetched every 750 ms only to compare it with the last copy. The theme service now keeps a change counter (`revision()`), and the poll reads that short value, fetching and republishing the inventory only when it changes. This is inferred from the probe results and has not yet been confirmed natively; the probe stays until it is.

## 2026-11-25 - Leak probe fix: updater bit no longer blocks start-up (add-in 0.4.0.16 source)

Owner run of 0.4.0.15: probe 1 and 7 showed no growth, but the add-in never finished loading (no Ribbon, no options), because CoreReady and the first start-up stages are advanced by Updater.Poll, which bit 1 skipped from the start. Bit 1 now skips the poll only after start-up stage 2. Probe 2 (options timer off) still leaked, so the options timer is not the sole cause.

## 2026-11-25 - Temporary leak probe (add-in 0.4.0.15 source)

Version bumped to 0.4.0.15: publication of the probe build failed because tbUI3IDE-v0.4.0.14 was already published from 7936a5a, and the publisher correctly refused to reuse it (Publish-20261125-120533-936.log).

The owner's native measurement after 04d35a6 showed the same idle growth (about 0.5 to 1 MB per second), so the UISettings and page-object caching were not the cause. They stay as harmless efficiency changes. Since the add-in runs in the compiler process and every RunJs and Eval is a round trip to the IDE page, the leading suspect is now the native idle polling: the updater poll every 750 ms, the options timer every second and the designer error poll every 1.5 s, roughly ten page calls a second. A registry value `HKCU\Software\VB and VBA Program Settings\WinUI3IdeStyle\Options\LeakProbe`, read once at load and echoed to the debug console, switches these off by bits (1 updater, 2 options, 4 designer) so one build can isolate the source. It is temporary and is to be removed once the cause is found. Development-Tools.bat gains option M (Memory leak probe), which shows the current value and sets 0, 7, 1, 2 or 4 without editing the registry by hand.

## 2026-11-25 - Reconciled the 0.4.0.14 build inputs

The pending assembly request still named the project before the idle-memory correction. Compared packed entries and mirrors to confirm that the current project contains both the updated notification and Options UI and the idle-memory correction. Reconciled the assembly pin to the reviewed project, then ran standard preparation, which refreshed the bundle and removed the fulfilled request. Only the updater payload and its manifest changed inside the reconciled add-in project.

BETA 1045 built Updater 0.2.0.7 and tbUI3IDE 0.4.0.14 for Win32 and Win64. All 62 native updater self-tests, all 269 repository tests with BETA 1045 fixtures, canonical mirror checks and both DLL payload verifications passed. Interactive acceptance remains pending.

## 2026-11-25 - Development Tools final operation summary

A failed build previously printed its error before automatic diagnostics synchronization, leaving a green diagnostics success message as the apparent outcome. Each selected operation now prints its overall result last, after the diagnostics upload, with the verified package location when available and a separate diagnostic-sync result. Prep and publication child scripts provide per-invocation structured results with the actual exception and transcript location; no login output is captured. The publisher distinguishes a verified publication from a retained draft, cancellation, or a different existing publication. The reset submenu reports all caught reset errors to its caller rather than hiding them on exit. Diagnostic sync uses neutral progress color, and quitting repeats the last development outcome after the final sync. The primary outcome is logged before sync, and a sync failure cannot replace a build failure or imply a successful build failed. No integrity gates or runtime components changed. Static source review; Windows acceptance pending.

## 2026-11-25 - Idle memory growth: one UISettings instance, cached page objects (add-in 0.4.0.14 source)

Owner measurement: with the add-in loaded and the IDE idle, twinBASIC_win32_noDEP_LAA.exe grew 0.5 to 1 MB per second; without the add-in it stayed flat. Eventually the IDE showed many memory message boxes and logged "restarting from MEMORY". Code inspection (not yet confirmed natively): `WinUI3SystemAccent.ReadPalette` called RoInitialize, activated a new `Windows.UI.ViewManagement.UISettings`, and called RoUninitialize on every call. It was called by the updater poll every 750 ms and by the options timer every second, so about 2.3 WinRT activations per second while idle. It now activates one UISettings for the add-in's lifetime, reuses a palette for two seconds, and releases it in Class_Terminate (`ReleasePalette`). Second suspect: each JS call walked `RootDomElement.Properties.ownerDocument.defaultView`, creating fresh host proxies several times a second. MainModule.RunJs, TabViewDesignerController.RunJs and UpdaterController.Eval now resolve the page window once and reuse it. On an error they drop the cached object and re-raise, without re-running the script.

Validation: Node suite 269 tests, 268 pass (the remaining failure is the embed check that needs the rebuilt Updater.exe). The native measurement is pending.

## 2026-11-24 - Correct actionable update notification layout (0.4.0.14 source; pending assembly)

Owner's BETA 1044 screenshot shows the automatic update notification with overlapping header, narrow vertically wrapped message, oversized action buttons and incorrect typography. Source inspection found that the actionable card reused the Master's passive `.toast` selector, inheriting its two-column grid and pointer-events:none; its inline composition did not replace those properties. The primary button also requested the nonexistent `button--accent` modifier instead of the Master's `button--primary`. The notification now has a distinct, single-column scoped composition in the existing installation layout stylesheet, a three-column header, full-width wrapping message and equal-width action row using shared Button styles. It uses Master theme, font, spacing, radius, and flyout tokens, a solid theme-correct acrylic fallback surface, and a reduced-motion variant. The header close action uses the shared Subtle icon Button. Corrected the shared installation action factory's primary modifier (including resource reset confirmation). Notification scheduling, commands and native updater ownership are unchanged. Added DOM/source contract coverage with the real embedded stylesheet; JavaScript syntax checked, native appearance and fixture execution pending. Included in the existing unassembled 0.4.0.14 candidate rather than incrementing again.

## 2026-11-24 - Shared Toolkit buttons in IDE Options (0.4.0.14 source; pending assembly)

Owner's BETA 1045 screenshot identified four native-looking outlined action buttons in the tbUI3 Updates category. The Options row factory was replacing the shared Button class with the native IDE tbis-control class. The four actions now keep the shared Toolkit Button class in isolated shadow roots with the existing pinned Master CSS, shared theme/accent propagation, and shared Button metrics and states. Native settings navigation, row layout and callbacks are unchanged. Outer CSS provides host geometry only; the shared stylesheet is reused where constructable stylesheets are available and otherwise installed locally. Updated the DOM fixture and added theme, isolation, rebuild and dispatch coverage. The source/mirror changes are staged for the guarded add-in-only assembly; no native helper change, build or release is claimed.

## 2026-11-24 - Differing local files no longer block an update (updater 0.2.0.7 source)

Owner report: updating a BETA 1044 test install stopped with "Preserved a vendor-name collision: ...\ide\fin-hypergrid.min.js" and only offered Retry. That file is new in BETA 1045 (not in the 1044 archive), so the 1044 folder must have kept it from an earlier 1045 install. Owner requirement (documented by Quill in INSTALLATION_MANAGER_SPEC and ROADMAP): an update fails only when the official release can't be obtained or installed safely.

UProtectVendor no longer fails. A file at an official destination that is not in the prior baseline, or differs from it, is classified `unrecognizedAtOfficialPath` or `modifiedOfficial`; one identical to the new official file is `alreadyCurrent`. Its current hash becomes the plan's `expectedOriginal`, so the existing preflight rechecks it, makes a verified backup and rolls back on failure. Customized WinUI3 themes are handled the same way (`customizedTheme`) instead of requiring Resource Repair first. The classification is recorded in the IDE receipt. After a successful install, the new UPreserveReplaced copies those backups to `%LOCALAPPDATA%\tbUI3\Updater\Installations\<id>\Replaced\<timestamp>`, verifies each copy's hash and writes `replaced.json`. The completion message names the folder. If that copy fails, the install still counts as complete and the message points to the session backups. The elevated verifier accepts these bound conflicts at authenticated official paths. The self-test "vendor collision preserved" became "vendor collision backed up and replaced" (it installs over the collision and checks the backup).

Validation: Node suite 267 tests, 266 pass (the remaining failure is the add-in embed check that needs the rebuilt Updater.exe). Native self-tests and a real update have not been run on this change.

## 2026-11-24 - Interactive conflicting draft recovery

Owner's 0.4.0.13 development run successfully packaged both verified architecture DLLs; the publication transcript confirms matching embedded updater/themes, checksums and fixed PE versions, then blocked on an existing draft whose target differed in reset/development/diagnostics tooling paths. The same diagnostic checkpoint was independently observed at both private repository heads, demonstrating the configured workstation's first dual-remote sync. The publisher now opens a conflicting draft's validated GitHub page and waits for Enter to recheck or Q to cancel. Discarding the draft permits a new draft using the existing verified package and normal publication confirmation; manual publication of that draft consumes its version and ends the operation without overwriting or claiming publication of different local artifacts. Matching existing publications are verified against the exact commit, tag and asset digests; mismatches are reported explicitly. Conflicting source history and asset verification failures require owner review. The review loop rechecks account, synchronized source and package/native hashes before resuming, and retains all original immutable-tag and no-overwrite safeguards. Existing conservative non-build allowlist is unchanged because the developer orchestrator can affect build output. Source inspection only for the new recovery path; Windows acceptance is pending. No release was published by this change.

## 2026-11-24 - Two-account private diagnostics mirroring

The owner requested both private Diagnostics repositories remain synchronized across development PCs. Added C (Configure Diagnostics Sync) with one-time local target selection and named-account GitHub CLI authentication, reusing the installed or SHA-256-verified portable CLI. The tool captures account-specific tokens in memory, verifies the authenticated owner, repository ID, private visibility, write access and main branch for both destinations before network Git transfer, and passes scoped credentials to Git through its process environment without changing Git credentials or storing tokens in the tool configuration. Configuration is outside the diagnostic checkout and the public project. Setup restores the previous active CLI account. D, configured startup/exit and completed or failed build, prepare, package, publication and reset operations checkpoint logs, fetch both histories, merge (including independent initial histories), push without force and verify equal remote commit IDs. Merge or partial-push failure preserves local commits and is retried by the next sync; diagnostics failures remain separate from development results. Existing logs can be adopted into a dedicated new checkout without overwriting them. Source inspection only; Windows authentication and dual-remote acceptance remain pending. No runtime or release change.

## 2026-11-24 - Manual and failure-triggered private diagnostics synchronization

Added D (Sync Diagnostics) to the unified menu and a best-effort sync after handled operation failures, after the original error and stack are logged. The helper uses the existing standalone Diagnostics checkout at the common local log directory, commits changes, verifies current GitHub private-repository status and matching default branch through existing GitHub CLI authentication, fetches/merges and pushes without force. No private repository identifiers are hardcoded or raw logs added to the public project. A missing checkout, credentials, network or merge failure leaves logs/local commits intact and does not mask the original failure; selecting D does not recursively retry itself. Diagnostic archive reset now preserves Git metadata and attributes. Static source inspection; Windows sync acceptance remains pending. No runtime or release changes.

## 2026-11-24 - Automatic source checkpoints and end-to-end Git workflow

Following the owner's clarification, the unified menu now automatically commits ordinary local source changes and existing tracked/staged repository diagnostics before building, fetches and merges incoming changes without requiring GitHub Desktop, reloads updated tooling, and checkpoints verified generated inputs after preparation/packaging. Build/package-only and preparation-only checkpoint locally without pushing. The publication workflow verifies the package receipt and source history, merges non-build-only remote updates if necessary, and pushes automatically before the existing Y/N release confirmation. Diagnostic-only merge conflicts keep the local diagnostic version while retaining both parent histories; real source conflicts abort the merge and preserve the checkpoint. Newly collected raw diagnostic output and ignored files are not staged automatically. Exercised the Git operations in disposable repositories: source/log classification, tracked diagnostic commits, local and remote source integration, diagnostic-only conflict resolution and push, and source-conflict abort with the local checkpoint intact. PowerShell lexical inspection completed; Windows end-to-end execution remains pending. No runtime version, binary or release changes.

## 2026-11-24 - Automatic developer Git synchronization and diagnostic exclusions

The first unified-tool attempt stopped at the generated-input receipt gate before any CDP build. The owner requested automatic Git synchronization and no diagnostic-related clean-tree blockers. The development and publication tools now use shared, narrow Git pathspec exclusions for local diagnostic output while retaining checks on source/resource trees. Build and preparation modes accept existing allowlisted generated inputs for verification instead of demanding an earlier tool receipt. Build/prepare automatically fetch and fast-forward incoming source before work, restarting the menu with the selected action when an incoming revision is applied. Publication fetches again, accepts non-build-only fast-forwards, and commits/pushes verified generated paths without staging diagnostics or unrelated changes. Real divergence, conflicting local files, unverified source changes or intervening build changes still stop rather than overwrite work or publish stale binaries. Build-only does not push. Tested Git pathspec behavior against staged, tracked and untracked diagnostic files and a changed source resource in a temporary repository; PowerShell lexical checks only, Windows execution remains pending. No add-in/helper version, binary or release changes.

## 2026-11-24 - Direct Check for Updates in Ribbon File Options (0.4.0.13 source)

Added a Check for Updates row to the existing Ribbon File > Options page, with the established Fluent globe-search glyph and backstage command styling. It closes Backstage and dispatches the same `check` request as IDE Options and notification Review, without new update logic. The row is conditional on the installation bridge being available; Classic/Hybrid menu behavior is unchanged. Reconstructed the generated toolbar module from the prior embedded script and verified byte-exact reproduction of the original generator output before substituting the changed factory. Updated installation JS mirror and added focused fixture coverage. JavaScript syntax checked; native acceptance and guarded local assembly remain pending. Add-in version advances to 0.4.0.13; Updater 0.2.0.7 remains unchanged.

## 2026-11-24 - Unified development tool and CDP release build candidate

Added Development-Tools.bat as the primary menu for build/package/publication, individual preparation/package steps, test resets and diagnostics. The build adapter uses the pinned MIT-licensed upstream twinBASIC documentation CDP harness, private IDE/project copies, preserved project identity and an explicit private output path. It verifies native diagnostics, architecture/version and unchanged canonical project before promoting each binary. The orchestrator reuses verified unchanged helper payloads, bootstraps prerequisites, invokes existing self-test/embedding/package/publication gates, and can commit and push checkpointed generated inputs before the existing Y/N publication confirmation. Build-only does not push; reset remains an explicitly selected operation. Follow-up static review corrected reserved PowerShell variable names, kept interactive sign-in attached to the console, and required a current verified package fingerprint before automatically synchronizing dirty generated inputs. No runtime version or canonical project changes. Native first-use, private-desktop builds and end-to-end pipeline acceptance remain open.

## 2026-11-24 - In-IDE update toast, updater review cleanup, themed Resource Repair and a tbUI3 Updates Options category (add-in 0.4.0.12, updater 0.2.0.7 source)

Owner screenshots and feedback (0.4.0.9 era, still present): there was no real toast, only the updater window opening without focus over the IDE; the updater used checkboxes for its two preferences, repeated "Release check complete" above the list, and had five footer buttons; Resource Repair opened light in a dark IDE, top-anchored with no shadow; the four tbUI3 commands sat as plain stacked buttons in the Appearance options.

Toast: in Quiet mode the updater no longer shows a window. After the check it writes `notify.json` (schema 1, the available components with installed and offered versions) into its session folder and exits. The add-in's BridgePoll, on seeing `closed.json`, reads `notify.json` and calls `window.__tbUI3Installation.toast(names)`, which shows an in-IDE card styled after a Windows 11 notification (not routed through the Windows notification center): bottom-right, 364 px, acrylic-like themed surface, app header with close, "Updates available" title, component names, equal-width Review (accent) and Dismiss buttons, slide-in and fade-out, Escape to close. Review queues the existing `check` request, which opens the updater in Review mode.

Updater review: the two preferences are WinUI ToggleSwitch rows in a settings card (glyph, title, description, On/Off); the info bar is closed when the check lists available updates with no source errors (it stays for "You are up to date", errors and progress); Check for updates moved to the header; Close is hidden while Remind Me Later shows (that button already closes), so the review footer is Remind Me Later, Update on Exit, Update Now.

Resource Repair: root cause of the light dialog was the shadow-view stylesheet translation. `:root[data-theme="dark"]` became `:host[data-theme="dark"]`, which never matches, so dark tokens never applied (the toast had the same issue). A new `hostCss` emits `:host([data-theme=...])`. The repair and confirmation dialogs now share the Welcome shell placement (fixed, centered, isolated from host margins), the ContentDialog shadow and the 40% backdrop, with a transparent dialog so the themed view paints the surface; confirmations are 548 px wide.

IDE Options: a "tbUI3 Updates" nav category with four described rows (Check for updates, Update preferences, Resource repair, Welcome to tbUI3IDE), each with a themed `tbis-control` button. It shows under All and when selected, hides while the native filter is active, and is re-added after every `tips_initUI` rebuild. The same tbis layout was confirmed in the BETA 1043, 1044 and 1045 main.js.

Validation: jsdom tests added for the toast, the updater review layout, the Options category and the dark selector translation; full suite 264 tests, 261 pass. The 3 failures are the expected bundle checks that need the rebuilt Updater.exe 0.2.0.7 embedded. Not yet run natively.

## 2026-11-24 - Updater closes itself after a clean update that restarts twinBASIC (updater 0.2.0.7 source)

Owner request: with the "start twinBASIC" preference on, the final confirmation window is unnecessary when everything succeeded. After a verified install the Apply worker launches the IDE and then rewrites state.json as complete with `restarted: true` (only on that path; a failed launch still raises "Update completed, but restarting the IDE failed." and stays visible). frmMain.PollState unloads the updater when the Apply worker exited with code 0, status is complete and that flag is set. Errors, rollbacks, cancellations, elevation and runs without the preference keep the final screen. The planned Launch twinBASIC button is dropped as redundant. Not compiled yet.

## 2026-11-24 - Native evidence: 0.4.0.11 on BETA 1044 and faster IDE staging

Owner run, 2026-11-24 13:29 to 13:31, Updater 0.2.0.6: the 1045-compiled 0.4.0.11 DLL loaded on BETA 1044 and launched the updater, which updated BETA 1044 to 1045 (complete). Compared with the 0.2.0.4 run earlier that day: ZIP directory 0.9 s (was 7.2 s), new-archive extraction and hashing 13.2 s (was 89.9 s), baseline 12.8 s (was 96.7 s); staging from Stage launch to ready took 37 s (was about 3.5 minutes). Downloads stayed about 1.5 to 2.6 s.

## 2026-11-24 - BETA 1044 loadable again for updater testing (add-in 0.4.0.11 source)

Owner decision: keep BETA 1044 testable so the updater's IDE update path can be exercised without waiting for a new beta; new add-in features may be missing there. phase1-config.json minIdeBuild is back to 1044 (max stays 1045), so the load gate, updater compatibility and release manifest accept 1044. On 1044 the host is IHostV1 (same IID, vtable prefix and event interface as 1045's IHostV2), so InstallMenus now skips Host.Menus below build 1045 instead of calling past the V1 vtable; the IDE Options buttons remain the entry points there. Assumes, unverified, that 1044 passes its host to the 1045-compiled factory without a QueryInterface for IHostV2; if 1044 refuses to load the DLL, that assumption is wrong.

## 2026-11-24 - Single-handle ZIP directory read (updater 0.2.0.6 source)

Native log of the 0.2.0.4 BETA 1044 to 1045 update (2026-11-24 12:58 to 13:02): download 2.3 s, SHA-256 0.08 s, Reading ZIP directory 7.2 s, extraction and hashing 89.9 s for the new archive; the baseline repeated these (7.3 s and 96.7 s); the two-DLL add-in extraction took 5.8 s for 10 MB, about 1.8 MB/s, which confirms the old decoder dominated. The directory step opened, sized and closed the archive four times per entry (about 1,640 opens for 410 entries). UZipEntries now reads every header through one handle, with the same bounds checks (a short read still fails). Not compiled yet.

## 2026-11-24 - Faster official archive extraction (updater 0.2.0.5 source)

Native evidence: extracting and hashing the 253-file BETA 1045 archive took 86 s, and the previous-version baseline another 87 s, while downloads took about a second. The cause was UpdateInflate: every bit read evaluated `2 ^ n` in floating point (several times per Huffman symbol), symbols were decoded one bit at a time, constant tables were Variants, and every output byte went through a function with its own CRC step and copies. The decoder now decodes Huffman codes of up to 10 bits through a 1024-entry lookup table (longer codes keep the canonical walk), reads from a buffered Long with precomputed power/mask tables, uses Long constant tables, runs CRC32 once per 64-KiB flush, and writes/reads buffers directly instead of copying them. All original checks remain: declared size, distance, reserved codes, oversubscribed trees, CRC32, and exact consumption of the packed stream (read-ahead past the final block may only be padding). A JavaScript model of the same algorithm matched zlib byte for byte and CRC for CRC on every file of the BETA 1043, 1044 and 1045 archives (239, 239 and 253 files, about 4 s each in Node) and rejected truncated, trailing, undersized, oversized and garbage streams. The twinBASIC source is not compiled or timed natively yet. Tar.exe/7-Zip were not adopted: they add an external engine and trust surface, and the code deliberately does not delegate extraction.

## 2026-11-24 - BETA 1045 only: Add-ins menu entries, Ribbon menus and WinUI3 add-in colors (add-in 0.4.0.10, updater 0.2.0.5 source)

Shane dropped BETA 1043 and 1044 support (they were only used to test the IDE update path). phase1-config.json now sets minIdeBuild and maxIdeBuild to 1045 and the updater to 0.2.0.5 (its only change is the regenerated Phase1Config). New IdeMenus class: on BETA 1045 the add-in adds four flat entries to the end of the native Add-ins menu through Host.Menus (IHostV2): tbUI3: Check for Updates..., Update Settings..., Resource Repair... and Welcome.... Clicks reach UpdaterController.MenuCommand, which reuses the IDE Options button paths (standalone updater Review/Settings launch, or the installation dialog). Entries are flat because the Ribbon runs flat add-in entries directly but cannot render 1045's nested add-in submenus. Menu creation failure is logged and leaves the Options buttons; entries are removed on unload. Not compiled or run yet; requires rebuilding Updater.exe, re-embedding and building both DLLs on BETA 1045.

BETA 1045 menu producers call the new asynchronous showContextMenuNew(menuId, ...), which merges add-in menu entries and then calls showContextMenu. The isolated producer capture used for hover submenus and Insert now shadows showContextMenuNew as well as showContextMenu, so those submenus no longer escape to a native popup on 1045; add-in entries merged into such submenus are not captured yet. The Ribbon fixtures install the shipped showContextMenuNew when the IDE main.js has it. Result: 260/260 tests with the BETA 1045 and 1044 fixtures and 259/259 with 1043 (previously four 1045 Ribbon failures). Added the eight BETA 1045 Addin* properties to build-themes.mjs with WinUI3 tokens (dark: layer #282828, card #323232, control #3B3B3B, stroke #474747, accent #60CDFF on black; light: #F9F9F9, #FFFFFF, #FFFFFF, #C4C4C4, accent #005FB8 on white) so add-in surfaces no longer inherit the stock Dark theme's warm brown values. Regenerated both themes and embedded them in the add-in. Not yet built or checked natively; the Addin* colors are unverified visually.

Toolbar order and default (Shane's request): the IDE Options IDE Toolbar dropdown and the Welcome Wizard toolbar step now list Ribbon, Hybrid, Classic, and Ribbon is the default when no ToolbarMode setting is saved (or the saved value is invalid). Users who already saved a mode keep it; a failed Ribbon/Hybrid build still falls back to Classic. WELCOME_REFERENCE.json records the new welcome.js hash. Not run natively yet.

## 2026-11-24 - Recorded 0.4.0.9 native feedback and next UI refinement requirements

Confirmed published 0.4.0.9 at 8b2907a. The owner reports the Welcome Wizard looks and works as intended. Native BETA 1043 screenshots establish remaining Options placement/button styling, Resource Repair theme/geometry and updater preference/status/footer presentation issues; automatic toast absence was reported, not root-caused. Source review confirmed the standalone quiet notification path still exists and is gated by automatic preference, daily check and deferral. Updated specification, roadmap and acceptance handoff; no runtime changes or new release in this documentation pass.

## 2026-11-24 - Record Wizard Builder design decision

Documented the future design-time toolbar Builder, Phone Link/OOBE visual direction, independently optional per-page split panes and editable generated forms in the [IDE roadmap](ROADMAP.md#planned-wizard-builder-2026-11-24). No implementation, version change or publication.

## 2026-11-24 - Correct Welcome modal vertical positioning (0.4.0.9 source)

The owner reports near-instant Welcome presentation in published 0.4.0.8, but the screenshot shows the modal horizontally centered and flush against the top of the IDE. Replaced auto-margin centering with explicit 50% viewport anchoring and a negative half-size translation, scoped to the Welcome shell with important declarations to isolate it from generic host dialog styling. Preserved dimensions, modality and existing light/dark shadow values. In an isolated real Chromium layout test with simulated hostile generic dialog rules, the previous geometry reproduced the top-aligned defect; the replacement centered to within one pixel in both axes at 1920x1032, 1000x600 and 800x500. The precise native host override is not yet established. Updated the resource mirror and source assertion, advanced add-in source to 0.4.0.9 and queued the existing guarded local assembly workflow. No native build or publication; user can finish 0.4.0.8 testing before assembling a combined next pass.

## 2026-11-24 - Separated public release notes from development history

Verified that 0.4.0.8 was published as a prerelease at 584ef47, with all three expected asset digests recorded by GitHub. The owner's publisher output confirms local compiled payload and package verification; first-run native acceptance is not established. The automatic changelog extraction had copied an outdated pre-assembly entry into public release notes. Added curated 0.4.0.8 notes and changed the publisher to consume version-specific public notes on creation and final publication, including resumed drafts. Missing notes produce a minimal testing notice with a roadmap link, not a raw changelog dump or an extra confirmation. Release-note-only changes are eligible for existing non-build draft resumption. Updated current-state documentation. Static source checks only; the GitHub connection cannot edit an already published release body, and no published tag or assets were changed.

## 2026-11-24 - Resume verified drafts after publisher-only changes

The 0.4.0.8 draft was created at f33c66b before the Y/N prompt update. The later 719dc20 commit changed only the publisher and documentation, yet the existing draft check rejected it despite successful local DLL/package verification. The publisher now accepts an unpublished prerelease draft at an ancestor commit only when every changed path is on a narrow non-build-input allowlist. It still verifies existing assets, freezes the draft identity and rechecks source/account/tag/assets before final confirmation, and publishes the exact current synchronized commit. No existing asset is overwritten and no published release or tag is altered. Static source inspection only; Windows resume and publication are pending. No project or binary changed.

## 2026-11-24 - Simplified publication confirmation

Replaced the typed release-tag confirmation with a case-insensitive Y/N prompt defaulting to No. Only Y (with optional surrounding whitespace) proceeds; all other responses retain the verified draft. The exact version and commit remain visible, and account, source, package, draft, asset and tag checks are unchanged. Verified the script diff is confined to the prompt and its condition. No runtime version, binary or release changes.

## 2026-11-24 - Portable GitHub CLI and first-run publication sign-in

After the owner completed and committed the guarded 0.4.0.8 project assembly, publication stopped on a workstation without GitHub CLI. The publisher now reuses installed gh or downloads the architecture-specific official v2.105.0 ZIP, verifies its pinned SHA-256 and caches the executable locally. On missing authentication it requests browser sign-in as Arrow-Loop without transcribing device login codes; wrong-account and repository-permission checks remain mandatory, as do all source, package, draft, asset and tag safeguards. No global installation, elevation or token handling by scripts. Source and lexical checks only; Windows first-use and live publication remain pending. No binaries or releases changed.

## 2026-11-24 - Retired one-time Welcome repair tooling

Removed the superseded 0.4.0.3 Apply-Welcome-Repair launcher, PowerShell implementation and leftover version-docs assembly payload. Removed the obsolete preparation guard and active documentation references. Prepare-Addin.bat owns current prerequisite setup and guarded add-in assembly. Retained the historical changelog and existing local transcripts, and left the active 0.4.0.8 assembly request and all release verification intact. Development tooling only; no binary or version changes.

## 2026-11-24 - Unified development-tool log routing

Redirected the existing timestamped preparation, packaging, publication and legacy Welcome-repair PowerShell transcripts to `%LOCALAPPDATA%\tbUI3\Diagnostics`, alongside native diagnostics. Preserved portable runtime cache, publication scratch files, reset backups and existing historical logs. Verified the script changes are limited to the log directory assignments; no binary rebuild or runtime version change. Windows transcript creation remains to be observed.

## 2026-11-24 - Self-contained development preparation prerequisites

The owner reported that Prepare-Addin.bat now parsed but stopped because Node was not installed or cached on this PC. Reused the existing verified portable Node 22 download/cache routine and GitHub Desktop Git discovery in preparation, with pinned local jsdom setup when missing. No system installation, permanent PATH changes or administrator rights are required. Pending assembly now binds the verified helper before running add-in-only sync, accommodating the owner's freshly rebuilt helper without bypassing existing verification/self-tests or the original project hash guard. Static delimiter inspection only; Windows execution and assembly remain pending.

## 2026-11-24 - Corrected preparation script syntax

Reconstructed Prepare-IDE-Release.ps1 from its last known working version with only the pending add-in assembly insertions. The previous source edit accidentally expanded the JavaScript replacement-string `$'` sequence inside the PowerShell hash regex, duplicating the script tail and preventing PowerShell parsing. Verified original script preservation outside the two inserts, intact regex, one exit and balanced lexical delimiters. Native preparation remains pending; no project, runtime or release changes in this repair.

## 2026-11-24 - Welcome initialization hot path and modal placement (0.4.0.8 pending assembly)

Changed the add-in-only UI bridge to escape large embedded assets using a bounded sequence of binary Replace passes instead of repeated one-character concatenation through JQuote. Added individual monotonic timings for tool-window creation, script injection, snapshot, each asset read/quote, expression assembly and factory invocation. Kept the shared transaction JSON module and Updater 0.2.0.4 unchanged. Explicitly centered the native HTML dialog in the IDE viewport and applied the light/dark two-shadow CSS translation of pinned WinUI ContentDialog Translation.Z=128 (source and blur limitation documented in CSS). Added source regression assertions. Source and generated CSS mirror updated; connector cannot retrieve the canonical binary, so Prepare-Addin.bat now consumes a versioned, exact-blob-guarded local assembly request using the existing add-in-only sync tool. No native build, timing improvement or release claimed. The completion-screen launch action remains outstanding.

## 2026-11-24 - Isolated remaining Welcome startup bottleneck

Reviewed native 0.4.0.7 startup diagnostics: the 36.50 s observed Welcome delay is dominated by the 36,125 ms `InitializeUI` stage, with eligibility already determined at 234 ms and paint acknowledged at 36,468 ms. Source inspection identified bulk per-character `JQuote` concatenation as a likely contributor; inner-stage timing and correction are pending. Recorded measured evidence and next work in the Phase 1 handoff and roadmap. Also observed the add-in-only update engine reaching `complete`. Documentation/diagnostic review only; no runtime or release changes.

## 2026-11-24 - Documented completion-screen launch action

Recorded the requested next-release `Launch twinBASIC` button beside Close in the installation specification, pending native contract, roadmap and acceptance checklist. The owner's screenshot shows Updater 0.2.0.3 reporting successful installation and verification; it does not independently establish the installed DLL version or verify hashes. Documentation only; no runtime or release changes.

## 2026-11-24 - Welcome-first startup (add-in 0.4.0.7, updater 0.2.0.4)

The add-in checks the Welcome disposition first, waits for native dialogs, and yields through a paint of the existing Wizard before registration, preferences, each bundled file check, theme discovery and toolbar/designer initialization. Setup displays the actual operations and disables dependent choices until their services are available. Returning users get silent offline provisioning. The 2.5-second onboarding cutoff and 10-second automatic check delay are removed. A quiet check waits for onboarding to close after saving the disposition and honors the selected preferences.

Updater 0.2.0.4 positions a non-activating notification above the active originating IDE and restores normal activation when the user opens review. Manual review requests normal activation subject to Windows foreground rules. Startup timings use monotonic counters in the existing diagnostics directory.

BETA 1045 built Updater 0.2.0.4 and both add-in DLLs. All 62 native updater self-tests passed and both DLLs passed exact payload verification. The BETA 1043 and 1044 fixture suites each passed 259/259. BETA 1045 passed 255/259. All 24 Wizard prototype tests and canonical mirror and hex checks passed.

Use this development prerelease for testing, starting with BETA 1043 and 1044. Four known BETA 1045 Ribbon fixture failures remain in File/Save, native menu capture, compact alignment and sizing, and asynchronous Insert Add presentation. In-IDE startup timing, focus behavior, provisioning and the live update acceptance matrix remain pending.

Published the [tbUI3IDE 0.4.0.7 development prerelease](https://github.com/Arrow-Loop/tbUI3/releases/tag/tbUI3IDE-v0.4.0.7) for development testing. The tag resolves to the synchronized build commit `f6e06479ee425e5d1e59498ef98186bebb615f70`. The publisher verified all three uploaded assets. An independent GitHub API read confirmed the prerelease and its digests, and the public ZIP, manifest and checksum file matched the original local package by SHA-256 and size.

## 2026-11-24 - Prioritized Welcome-first startup correction

Updated the IDE roadmap and Phase 1 handoff to record the owner's priority: implement the responsive first-run Welcome flow and preserve quiet subsequent repair before addressing the known BETA 1045 Ribbon issues. Documentation only; no runtime or release changes.

## 2026-11-24 - Documented Welcome-first startup correction

Recorded the native BETA 1043 first-run timing observation (39.82 s to theme settle messages, 43.83 s to updater appearance, no Welcome) and successful full reset rerun. Source review confirmed the fixed 2.5 s Welcome gate and the 10 s automatic-check scheduling delay, without attributing the full measured delay to either. Updated approved onboarding requirements, pending bridge contract, roadmap and acceptance checks for Welcome-first rendering, live conditional Setup and notification coordination. Documentation only; no runtime fix or new release in this pass.

## 2026-11-24 - Fixed reset-menu backup path and removed confirmation

The first full-reset attempt reported a null Path. Source inspection identified the invoked payload's local backup variable shadowing the script-scoped assignment. Start-Backup now returns its directory directly to the menu's local variable before registry or file operations. Renamed the recovery loop variable to avoid PowerShell's reserved HOME variable. Menu selection now runs the chosen operation without typing RESET; the existing backup and recovery safeguards remain. Errors include the failing line and stack. Reviewed source and verified matching downloadable/repository bytes; Windows rerun remains pending.

## 2026-11-24 - Developer test reset menu

Added a self-contained `Reset-TestState.bat` using Windows PowerShell and the current user profile. It offers independent native options/layout/window, add-in preferences, Welcome record, updater installation state, shared theme, shared DLL, WebView2 cache and diagnostics resets, plus a combined first-run reset retaining the DLLs. Selected registry values are backed up and removed; files and folders are moved into a dated local backup. Preserves native licence, publisher credentials, project files/state, packages and unrelated themes. Checks running IDE/updater processes, rejects reparse points and refuses to archive unfinished or unverified recovery journals. Confirmations and errors are visible. Source and path review performed; Windows execution and recovery scenarios remain pending. No runtime or release assets changed.

## 2026-11-24 - Development prerelease publication and retention policy

Documented the owner-approved distinction between development-testing publication, internal team deployment and stable release. Known functional failures and incomplete native acceptance may be disclosed in explicitly authorized testing prereleases, without weakening package integrity, security or traceability. Recorded the specific 0.4.0.6 testing authorization and deferred owner-approved cleanup of obsolete prereleases. Documentation only; no release, tag, runtime or binary was changed by this pass.

## 2026-11-24 - Optional package isolation (add-in 0.4.0.6)

The designer checks the active project’s applied reference settings for the tbUI3 package GUID and requires the current compiler control list to resolve the TabView and TabPage IDs for the active form. Project, reference and form changes retire the old adapter and its owned state. Classic hides ineligible native buttons without adding a separator. Hybrid and Ribbon omit the MultiPage group in both presentations unless a TabView or child is selected. General IDE features have no dependency on this gate.

Preparation and packaging now verify the committed updater bytes and the canonical bundle binding when Git checkout timestamps would otherwise reject the unchanged helper. The version, architecture, startup manifest, canonical resources and fresh native self-tests still gate preparation. Locally built DLLs still require fresh timestamps.

BETA 1045 produced both 0.4.0.6 DLLs and compiled PE verification confirmed the exact 0.2.0.3 helper and themes. The helper passed 62/62 native self-tests. Repository tests passed 256/256 with each of the BETA 1043 and 1044 fixtures and 252/256 with BETA 1045 fixtures. The same four Ribbon failures reproduce on the unmodified base, including File/Save and the native menu capture paths used for alignment and Insert. The 24 Wizard tests and canonical mirror/hex checks pass. Native in-IDE isolation acceptance and the BETA 1045 Ribbon findings remain open.

Published [tbUI3IDE 0.4.0.6 development prerelease](https://github.com/Arrow-Loop/tbUI3/releases/tag/tbUI3IDE-v0.4.0.6) for standalone updater testing with explicit approval to proceed despite those known issues. The tag resolves to the original synchronized build commit `bb5047d9d38f563c47a78656a58a193804c0392b`. Verified prerelease status and all three GitHub asset digests and sizes, then downloaded the public ZIP, manifest and checksum file and matched their bytes to the original local package. Release notes identify the BETA 1045 limitations and pending native acceptance. Initial acceptance uses BETA 1043 and 1044. The publisher now explicitly sends the expected tag and source commit when publishing a draft, because a draft update that omits the tag can cause GitHub to substitute its internal untagged name.

## 2026-11-24 - Clarified prerelease distribution and permanent package independence

Reconciled the version policy, product specification, IDE handoff, roadmaps and READMEs with the owner's clarification: internal IDE prerelease distribution is separate from project-wide stable readiness, and general IDE functionality must remain independent of the optional control package. Documented pending reference-based isolation without claiming implementation or native acceptance. Documentation only; no runtime, version, binary or release changed.

## 2026-11-24 - Guarded GitHub prerelease publication launcher

Added Publish-Release.bat and its development-only PowerShell publisher. It resolves GitHub CLI and Git (including GitHub Desktop), checks the authenticated Arrow-Loop identity and live synchronized development commit, verifies the existing add-in-only package and current DLLs with the existing compiled-payload verifier, creates/resumes a matching draft, checks remote asset sizes and SHA-256 digests, and requires exact-tag confirmation before publishing. It refuses existing tags/published releases and never overwrites assets. Documented per-PC prerequisites and pending Windows/live publication acceptance. No runtime, project binary, version, existing packaging script or GitHub release changed.

## 2026-11-24 - Shutdown bridge cannot block IDE close (add-in 0.4.0.5)

Review fixes to the new shutdown bridge before the first 0.4.0.5 build. (1) An armed close that was interrupted (Save As cancelled, or save failed) left a stale attempt that made every later close a no-op until the add-in reloaded; a new close now replaces a stale attempt, while a held continuation still blocks duplicates. (2) A held exit is now released after 10 seconds if the add-in never acknowledges it, so the IDE always closes; without the native-exit record the updater still refuses to install. Added two bridge tests that fail on the previous bridge. 250/250 tests pass with the 1044 IDE fixtures. Not yet run natively. Separately, 4 ribbon tests fail with the BETA 1045 main.js fixture (the File tab Save section does not build from 1045's native menus); unrelated to the updater and not addressed here.

## 2026-11-24 - Standalone updater ownership (add-in 0.4.0.5, updater 0.2.0.3)

- Moved discovery, notification, review, ongoing preferences, consent, deferral and staging orchestration to Updater.exe. The IDE keeps Welcome, resource repair, launch entry points and the native exit bridge.
- Added a versioned, expiring shutdown handshake bound to the originating IDE and selected release assets. Recorded the native accepted close before compiler teardown and retained the separately sealed plan, process verification, cancellation and scoped elevation checks.
- Added worker-driven download, extraction, verification and baseline progress, with session-correlated diagnostics. Removed the IDE-hosted updater view and scheduler.
- BETA 1045 built the Win32 updater and both add-in architectures. The updater passed 62 native self-tests. Verified both DLL payloads and exercised local package generation.
- A disposable BETA 1043 installation completed Update on Exit to BETA 1045. Manual discovery worked with automatic checks disabled. The updater was visible before downloads and remained active after normal IDE close during extraction. Extraction plus inventory hashing took 86 seconds for the new release and 87 seconds for its previous baseline on this run.
- On BETA 1045, automatic discovery displayed the compact standalone notification. Opening it and selecting Update Now closed the IDE normally and installed the published icon library into the disposable profile. Fixed the library version-marker length found by this run and covered it with a native fixture.

## 2026-11-24 - Explicit updater visibility requirement

Clarified the approved Phase 1 specification, roadmap and acceptance checklist: the standalone updater must appear before the first authorized release-asset download for either update choice and remain accessible with live progress throughout staging and installation. Quiet metadata checks may remain hidden. Documentation only; implementation and native acceptance remain pending.

## 2026-11-24 - Add-in 0.4.0.4 and updater 0.2.0.2 fix the Update Now exit stall and IDE identity check

Two bounded fixes for the failures recorded in the live BETA 1043 test. These are not the approved updater ownership migration, which is still pending. (1) Update Now never let the IDE exit. The add-in's closeIde called the hooked closeProjectSafely, whose callback text contains hostAppObject.Exit('ignore'), so the hook wrapped it a second time. After the save prompt, the approval handshake ran the outer callback, which only re-armed the exit function instead of exiting; the controller then stopped polling and the updater timed out waiting for shutdown. closeIde now calls the original closeProjectSafely, so the approved continuation performs the real exit. Normal-exit approval and its plan binding are unchanged. (2) The IDE identity check failed with "Could not inspect IDE identity" when OpenProcess on an exited IDE returned an error other than 87. UProcessTime now captures the Win32 error immediately, treats a PID absent from the WMI process list as exited, and otherwise fails safe with the error code in the message. Both fixes are inferred from source and have not been run natively. Pending: rebuild Updater.exe, re-embed it, rebuild both DLLs and repeat the live Update Now and Update on Exit tests. Until then tests 137 and 139 fail on the stale embedded updater; the other 248 of 250 tests pass.

## 2026-11-24 - Update ownership specification and live test findings

Documented the approved Phase 1 architecture: Updater.exe will exclusively own update UI (including toast), ongoing preferences and update transaction lifecycle; tbUI3IDE retains onboarding, offline provisioning, entry points and a narrow native shutdown bridge. Updated specification, contracts, architecture, READMEs, roadmap and acceptance handoff to distinguish existing implementation from the approved migration. Reviewed the live diagnostic evidence: Update Now timed out waiting for normal shutdown, forced termination was refused because approval was absent, and Update on Exit eventually reported an IDE identity inspection failure. The displayed installed updater was 0.2.0.0. These are observed outcomes, not a completed root-cause fix. No code, packed projects, protocol, payload or release assets changed in this documentation pass.

## 2026-11-23 - Embed launcher test-runtime fix

The corrected Windows launcher located portable Node, ran all 58 native updater self-tests successfully, embedded the verified helper/themes, and passed all 140 exact mirror checks and hex validation. The focused suite passed 10 of 11 tests; the remaining XML manifest check could not import jsdom because the new PowerShell process lacked the Welcome launcher's transient environment variable. The Embed launcher now resolves the cached jsdom module using the existing TB_JSDOM_MODULE file-URL contract and checks importability before changing the project. No validation assertions or release gates are removed. Repeat focused validation remains pending.

## 2026-11-23 - Release launcher PowerShell compatibility fix

The first Windows PowerShell 5.1 Embed attempts stopped during portable Node discovery because `$home` collides case-insensitively with the read-only automatic `$HOME` variable. Renamed the local variable to `$portableNodeDirectory` in the shared Embed/Package launcher and included failure position and stack details in the transcript. Static inspection of assignment names in all three development PowerShell scripts found no remaining assignments to the checked automatic-variable names. No project, payload or release verification rules changed. Successful Windows execution remains pending.

## 2026-11-23 - Double-click add-in build preparation and release packaging

Added `tbIDE/Prepare-Addin.bat` and `tbIDE/Package-Release.bat` with a shared development-only PowerShell entry point. The first reuses the existing portable Node cache, checks the rebuilt Win32 helper, runs native self-tests and requires a fresh successful report, embeds using the existing PE/resource verification tool and checks mirrors and focused contracts. The second reads versions and compatibility from configuration and invokes the existing release packager against both DLL architectures in a fresh output directory. Both log outside the checkout, pause on completion and leave publication manual. No updater engine or release packager changes. Windows execution and native acceptance of these launchers are pending.

## 2026-11-23 - Repair assembly first-run diagnostics and test harness corrections

The Windows launcher successfully provisioned portable Node and jsdom, assembled 12 canonical entries, passed the second synchronization without changes, and verified 140 exact mirrors plus 86 canonical and mirrored hex checks. The first regression run reported 227 passes, 2 failures and 21 optional skips (250 total); the guard correctly withheld commit/push. The pending candidate now checks manual update results in the already-open dialog, retains separate background-toast coverage, and makes the pre-existing native theme-change test conditional on the required TB_IDE_MAIN_JS fixture, consistently with the other native contract tests. Known jsdom CSS-layer parser diagnostics are filtered only in the update UI test harness. No production behavior or integrity checks changed in this follow-up; repeat validation is pending.

## 2026-11-23 - Portable development runtime for the repair launcher

The double-click repair launcher now prepares a cached official Node.js 22 LTS ZIP (verified against the published SHA-256 checksum) and pinned jsdom 26.1.0 test dependency outside the repository, without administrator rights or a system-wide Node installation. GitHub Desktop's Git remains supported. The launcher captures a transcript in the per-user development cache and retains all existing guarded assembly and validation checks. Windows execution remains to be verified.

## 2026-11-23 - Double-click assembly launcher

Added `tbIDE/Apply-Welcome-Repair.bat` to launch the existing guarded 0.4.0.3 assembly, validation and commit/push workflow from Explorer. It resolves the repository location, checks Node and Git availability, retains the command result and pauses for inspection. The launcher does not bypass validation, compile DLLs or publish a release.

## 2026-11-23 - IDE Welcome and update review repair (0.4.0.3 source)

Addressed reported BETA 1043 / add-in 0.4.0.2 theme preview and selection failures: tolerant native theme declaration parsing with actual-theme paint fallbacks, retained loader inventory, synchronous exact-name selection with rollback and request correlation, and case-insensitive reconciliation of native theme names. Miniature paint is isolated per theme, toolbar layouts render with an explicitly identified fallback if paint is unavailable, and selected tiles use a persistent outline. Welcome uses a bounded startup eligibility gate and a centered dimmed modal; late automatic onboarding is suppressed for the session. Update review and notification use scoped pinned Toolkit classes and tokens, streamlined footer actions and an explanation for optional icon-library version issues. Add-in-only synchronization preserves the existing updater project and executable, validates embedded payloads, and updates the add-in and bundled theme version metadata. Native updater engine and release packaging are unchanged. The configured repository Node regression suite and isolated Wizard suite exited successfully, and exact mirror/hex validation and add-in-only generator idempotence passed during assembly. Optional installed-IDE fixture checks are reported as skipped if their inputs are absent. Actual BETA 1043/1045 rendering, theme application and self-update acceptance remain pending.

## 2026-11-24 - Add-in 0.4.0.2 fixes the repeating "Invalid use of Null" updater error

On BETA 1043, add-in 0.4.0.1 printed "[tbUI3 updater] Invalid use of Null" to the Debug Console every second and the updates and Welcome UI never appeared. Cause (inferred from source, not reproduced natively): UpdaterController.InitializeUI evaluates tbUI3-welcome.js, whose last statement yields no value, and Eval passed that Null straight to CStr. InitializeUI therefore stopped before marking itself installed and was retried on every poll. Eval now returns an empty string for Null or Empty results, and the welcome script evaluation ends with a string result. Add-in version bumped to 0.4.0.2 through phase1-config.json and sync-phase1-projects.mjs; the updater stays 0.2.0.1 because only its generated Phase1Config.AddinVersion constant changed. Pending: rebuild Updater.exe, re-embed it with prepare-phase1-bundle, rebuild both DLLs and confirm on 1043. Until then test 134 fails on the stale embedded bundle; the other 243 tests pass.

## 2026-11-23 - Add-in 0.4.0.1 and updater 0.2.0.1 accept BETA 1043 to 1045

Shane chose to widen the IDE compatibility range so the updater can be tested by updating a BETA 1043 installation to 1045. `phase1-config.json` now sets minIdeBuild 1043 and maxIdeBuild 1045, with add-in 0.4.0.1 and updater 0.2.0.1; `sync-phase1-projects.mjs` regenerated both canonical projects. The load gate message now names the supported range and the detected build instead of a hard-coded 1045. The add-in's IDE hooks were last tuned against 1045, so presentation on 1043 is unverified. Pending: rebuild Updater.exe, re-embed it with prepare-phase1-bundle, rebuild both DLLs. Until then phase1-bundle tests 134 and 136 fail on the stale embedded updater; the other 242 tests pass.

## 2026-11-23 - Add-in-only release packaging

Changed the development release packager to emit one versioned ZIP containing both architecture DLLs, the schema-2 update manifest listing only the add-in, and SHA256SUMS for those two assets. The independently versioned updater and themes remain embedded and subject to existing binary, version, compatibility and exact-payload verification; the native update engine and bootstrap are unchanged. Nonempty output directories are rejected to prevent publishing obsolete standalone ZIPs. Updated the packaging source regression assertions. Full repository regression, real-binary package generation and live upgrade acceptance remain pending; no release published.

## 2026-11-23 - Neutral updater stylesheet attribution and repository identity rule

Replaced the organization-specific header comment in updater.css with neutral shared WinUI Master CSS wording in the canonical Updater.twinproj and its exact source mirror. No CSS rules, project identity or other packed entry changed. Verified all 37 original packed file entries against repository mirror blobs, confirmed the updated stylesheet matches its packed resource and all other packed bytes are identical. The previously accepted native executable and add-in bundle remain unchanged; they require a new native updater build, acceptance and re-embedding before distribution. Established a mandatory independent repository identity and confidentiality rule covering source, documents, metadata, embedded assets, binaries and release materials. No new native test or compiled binary is claimed.

## 2026-11-23 - User-facing IDE README and private-reference cleanup

Replaced the IDE README's change narrative with current requirements, install, features, settings and troubleshooting. Moved enduring theme/styling implementation details to architecture and the visual acceptance checklist to the Phase 1 handoff. Consolidated the diagnostic startup guidance. Neutralized the shared Toolkit provenance repository label, test title and private diagnostic origin without changing test assertions, recorded commit/blob hashes or native results. The remaining embedded CSS header cleanup requires a fresh accepted helper and verified DLL bundle; it is explicitly tracked in the IDE roadmap. Existing canonical projects, embedded payloads and accepted binaries are unchanged. No new native acceptance is claimed.

## 2026-11-23 - Consolidated current Wizard integration guide

Replaced superseded implementation notices and pending-embedding instructions with one current integration reference, retaining the factory API, four pinned assets, six native intents, palette schema, selection/repair semantics, preview-server instructions and conditional Setup behavior. Production/native acceptance remains in the Phase 1 handoff. No view source or asset bytes changed.

## 2026-11-23 - Documentation consolidation: installation and reference authority

Merged the retired updater design, original updater plan, bootstrap plan and coordination contract into the enduring Installation Manager specification, native contracts and AGENTS guidance. Removed four superseded Markdown files from the active tree while retaining their history in Git. Reconciled current add-in architecture/geometry descriptions, repaired diagnostic guide duplication, and removed private organizational/repository identifiers from first-party Markdown while retaining commit IDs, hashes and technical evidence. Updated navigation and roadmap boundaries. No application source, test code, canonical project, runtime resource, binary or release changed. Non-Markdown provenance/source/log review remains separately tracked.

## 2026-11-23 - Documentation consolidation: roadmap and handoff

Replaced stale candidate narratives and duplicated completed work in the root and IDE roadmaps with pending-only, component-scoped acceptance and future work; kept historical evidence in the existing changelogs and Git history. Converted the root HANDOFF into an authoritative-document navigation entry, and synchronized the approved Wizard's pending native acceptance. Preserved the combined Phase 1 release scope, native validation gates, deferred installation strategies, separate core package migration and outstanding control/Ribbon requirements. No application code, canonical projects, assets, release policy or native test results changed.

## 2026-11-23 - Immediate documentation reconciliation for active handoff

Reconciled the current Phase 1 acceptance walkthrough, updater/add-in READMEs, product and native interface documentation, bootstrap plan, version policy, diagnostics guidance and ownership. The current handoff now distinguishes the accepted 58/58 helper and completed canonical embedding from pending compiled DLL and live installation/update acceptance. Corrected the Welcome flow to match the approved conditional Setup and preferences-only Finish. Marked the earlier beside-IDE updater plan historical, removed recently duplicated completed entries from both roadmaps, retained outstanding and deferred requirements, and established an in-place current-state documentation rule. Removed direct private-source references from the active handoff guidance; the broader repository-wide reference and Markdown inventory audit remains deferred to the dedicated consolidation pass. No source, project, binary, release scope or accepted safety policy was changed.

## 2026-11-23 - BETA 1045 add-in compilation corrections

Addressed the three reported diagnostics: LoadResData is supplied by the VB forms runtime, which the Standard DLL does not reference. Added a project-local resource compatibility reader using pointer-width-safe Windows APIs, module identity from a function address in this DLL, uppercase resource names, bounded sizes and typed Byte() copying. Both existing provisioning/text callers now resolve without adding a forms runtime dependency. Replaced the rejected nested Hex$ expression in InstalledThemeCatalog with explicit two-nibble formatting and the same nonnegative half-up channel rounding.

The canonical add-in and mirror are synchronized. **243 automated Node tests pass**, with **140 exact mirrors**, IDs/CRLF/hex checks and generator idempotence. Regression contracts cover DLL module ownership and typed resource copying. The accepted Updater.exe, its canonical project and all embedded payload/theme bytes are unchanged; only the add-in needs rebuilding in Win32 and Win64. Native compilation and DLL bootstrap acceptance remain Shane's checks. No GUI automation, Wizard prototype edits, release or main merge.

## 2026-11-23 - Real updater and themes embedded in the add-in

Completed the separately authorized Phase 1 embedding pass: canonical tbUI3IDE 0.4.0.0 and its synchronized mirrors now contain Shane's committed Win32 Updater 0.2.0.0 (2,117,120 bytes, SHA-256 677d86b4a9fe368282e4c1464e0ad549e5309b838f2929570c13e4803dd2ee68), both exact WinUI3 themes and a version/hash/protocol inventory. The same project supplies both DLL architectures. Existing offline provisioning/repair and shared-helper launch services consume these resources; no Wizard view changes. Updater provenance: commit 03904cc, source 1225eb2, 58/58 native tests and compiled startup confirmed in the recorded incoming diagnostics.

Packaging now checks the real updater's embedded UI/fixtures against its canonical project, and PE resource lookup recognizes twinBASIC's uppercase names while rejecting conflicting aliases/languages. **241 Node tests and 24 isolated Wizard source tests pass**, plus **139 exact mirrors**, IDs/CRLF/hex checks and bundle/generator idempotence. Reopen the canonical add-in and compile both architectures, then verify real DLL payloads and DLL-only/offline provisioning, preserved custom/newer components and shared-helper launch. Those native add-in acceptance checks remain pending; no native build, GUI automation, GitHub release, main merge or Phase 2/3 work was performed.

## 2026-11-23 - Native updater startup confirmed; 58/58 tests pass

Shane's new diagnostic snapshot 5235529 reports **58/58 native self-tests passed**, including trusted UTF-8 document navigation. The compiled startup log confirms the generated data page is allowed, both embedded scripts are requested, `updater:ready` arrives, and final navigation succeeds (status 0). The supplied screenshot shows the updater's own expected no-context ready screen. This confirms the compiled blank-window fix; it does not establish IDE debug startup, live update/elevation/recovery/self-update or add-in embedding acceptance. Sanitized evidence references: `tbIDE/Updater/validation/native-startup-2026-11-23-passed.json`. No production source, canonical projects, Wizard or binaries changed in this evidence-only pass.

## 2026-11-23 - Updater trusted document navigation and IDE resource decoding

The latest private diagnostic snapshot (12d1846, startup blob f1c6aa9) identifies the compiled blank window: the generated HTML navigates as a UTF-8 Base64 data URL, which the old about:blank-only guard cancelled. The host now computes and authorizes only that exact generated document, preserving rejection of external and unrelated data pages. Resource decoding now uses the WebView2 package's raw-string conversion before explicit UTF-8 decoding; failures distinguish resource lookup from decoding. The updater retains its own UI; no Welcome Wizard changes.

Canonical updater and mirrors are synchronized. **237 Node tests pass**; the executable native suite now contains **58 cases**, adding an independent Unicode/Base64/navigation-policy test. Previous native evidence remains 57/57 before this patch. Native compilation, IDE and compiled-EXE page-ready confirmation remain pending Shane's acceptance; no GUI automation, binary embedding, release or main merge.

## 2026-11-23 - Updater host aligned to the working shared Toolkit

Shane designated a private incoming diagnostic channel. Local output remains `%LOCALAPPDATA%\tbUI3\Diagnostics\`. No automatic upload or remote writes were added.

The latest snapshot again records 57/57 native self-tests passing. Its startup log shows one embedded-resource-assembly E_FAIL, then another run submitting a 192,315-character HTML document without a recorded page-ready handshake. This narrows the evidence without proving the precise blank-window cause.

Compared the current shared Toolkit example at **218871daaae25c81df668d174b80284edae22ec2** against its canonical mirror hashes. Aligned updater event conventions, constructor DPI initialization, complete IDE-created form defaults, black native underlay, Ready reentrancy guard and navigation-completion lifecycle. Replaced the custom pointer-based UI resource conversion with the Toolkit's whole-buffer LoadResData/StrConv pattern, explicitly selecting UTF-8 for our resources. Per-resource error context is retained. Form identities, updater dimensions and security restrictions remain; Gallery, tab windows, splash and installer/message-box dependencies are not imported.

**Updater.exe retains its separate update/progress/recovery UI. The Welcome Wizard remains add-in-only.** Native form/UI launch and the changed resource reader still require rebuild/runtime confirmation; no native success is claimed by source/DOM checks. Canonical projects/mirrors are synchronized. No main merge, PR, release, binary embedding or GUI automation.

Validation: **235 Node tests pass**, with **134 exact canonical/source mirrors**, stable IDs/CRLF/hex checks, generator idempotence and diff checks passing. The existing user-provided 57/57 native result predates this host change; no new native compile or GUI run was performed by Cody.

## 2026-11-23 - Refined Wizard integration, native 57/57 evidence, unified diagnostics

Integrated Quill's approved view through **79be9e5** unchanged: full Master CSS/shared controls in an isolated iframe under the native HTML dialog, real native installed-theme inventory/parent inheritance/color data, exact-name apply validation, Windows accent, correlated acknowledgements, conditional Setup, async repair, hidden channel selector and revised feature copy. Production settings also omit channel selection; internal release safety/channel metadata remains. Known BETA 1045 loader behavior determines effective duplicate-name selection; no guessed AppData/local precedence. New native palette/host code still needs native acceptance; unresolved colors are explicitly unavailable.

Shane's second archive reports **57 native self-tests passed, zero failed** after the byte-buffer correction. The original 42/54 report and the passing report/archive digest are retained in `tbIDE/Updater/validation/`. These results establish the tested engine cases, not WebView2 or live installation acceptance. Actual helper binary embedding remains the separate Phase 1 pass.

Consolidated active TabView, property-page, paint/designer, updater startup/worker and native-test diagnostics under **%LOCALAPPDATA%\tbUI3\Diagnostics\**; [diagnostic locations](../docs/DIAGNOSTICS.md). Operational recovery/settings/profile data stays in place. Canonical core, test embedded package, add-in and updater are synchronized; rebuild/re-import existing consumers to adopt the new routes. No trace flags enabled, user projects rewritten or old logs deleted.

Shane reported a blank updater form and blank browser fallback despite detected WebView2. Corrected IDE argument parsing (`Command$` instead of host-process command line), changed fallback to verified atomic UTF-8 output with actual escaped error, added startup-stage/error-number logs and guarded repeated fallback. **The blank native window's exact failing operation remains unconfirmed pending the new stage log; no GUI/native startup success is claimed.** See the diagnostic guide. No Screen Control/GUI automation, main merge, PR, release or compiled-helper embedding.

## 2026-11-23 - Toolkit-backed Welcome Wizard redesign and user-approved content corrections

In Quill's isolated `tbIDE/prototypes/welcome-wizard/`, replaced hand-built control visuals with the shared WinUI Toolkit runtime and Master CSS in an isolated document, retaining native action/snapshot methods. Refactored wizard CSS to layout-only, with an updated standalone simulated preview and contract checks. Subsequently removed the release-channel selector because twinBASIC has no stable release, featured WinUI3 Light/Dark while adding installed-theme cards/previews with a native-enumeration contract, and removed TabView/TabPage product marketing from Features. Updated isolated contract/tests and ROADMAP. **This is view/source work only; native theme inventory and production integration are not claimed, and GUI/native acceptance has not been performed.**

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

Shane's subsequent sequencing instruction makes **actual compiled Updater.exe embedding a separate Phase 1 pass after native acceptance**. Bundle generation and real compiled-DLL verification are implemented; no stale/mock payload is embedded. The combined first public release remains gated on accepted updater, both embedded DLLs, shared-loader evidence and complete first-install/runtime acceptance. Phases 2/3 remain deferred. See [Phase 1 handoff](PHASE1_HANDOFF.md) for build order, static loader evidence, open native gates and focused acceptance. This source pass does not claim successful native compilation or a production-ready release. Validation: 211 Node tests plus 9 Quill smoke tests pass; 126 exact mirrors/IDs/CRLF/hex checks, regeneration idempotence, release-tool syntax and diff checks pass. Native builds, 54 authored executable self-tests, live loader/update acceptance and actual DLL payload verification remain unperformed.

## 2026-11-23 - Complete updater and installation-manager agent handoff documented

Created `INSTALLATION_MANAGER_SPEC.md` consolidating Shane's updater, self-provisioning, Welcome Wizard, update strategy, custom-content handling, cross-drive archival, release inventory, existing-installation discovery/reorganization, add-in compatibility, settings, safety and validation decisions. Linked from AGENTS and supporting documents and refreshed ROADMAP. **Documentation only: no canonical project, source, runtime behavior, test result or release publication changed.**

## 2026-11-23 - Combined updater first-release milestone documented

Recorded Shane's decision to combine native-updater production acceptance with DLL self-provisioning and the Welcome Wizard into one release gate. Expanded the bootstrap architecture to reserve versioned per-installation settings, strategy, release inventory and later alongside/archive/reorganization behaviors without implementing them. Updated ROADMAP. **Documentation only, no source/build/release change.**

## 2026-11-23 - Approved embedded bootstrap and Welcome Wizard design documented

Added the historical bootstrap plan (now consolidated in the Installation Manager specification) specifying a future two-DLL-only first installation: embedded native Updater EXE and WinUI3 themes, shared per-user dependency provisioning, installation-specific update/recovery state, safe versioned repair, protected-directory handling, and a native IDE-hosted HTML/CSS/JS Welcome Wizard for updates, themes, toolbar modes and designer tooling. Added implementation/acceptance work to ROADMAP. **Documentation only; no source, packed project, runtime behavior, build output or release asset changed.** The existing manual first-install instructions remain current until implementation.


## 2026-11-23 - Updater hexadecimal widths and mandatory TB0012 guard

Shane's BETA 1045 report identified six unintended signed-Integer literal conversions. The JSON BOM, both x64 PE machine checks, ZIP flags mask, Unix mode mask and symlink comparison now use explicit positive Long literals (`&HFEFF&`, `&H8664&`, `&HF041&`, `&HF000&`, `&HA000&`). An updater audit also made the GUID's intentionally signed Integer literal explicit as `&HCD44%`, preserving its 16-bit structure field. This corrects actual x64 PE/link-validation comparisons, not just warning text. Canonical Updater.twinproj and CRLF sources are synchronized; versions and native layouts are unchanged during compile acceptance.

AGENTS.md now mandates explicit widths for the ambiguous 16-bit range and explains signed-Integer exceptions and wider-type sign extension. The new lexical gate checks active first-party source mirrors and packed canonical project entries, including embedded tbUI3, while ignoring strings/comments and third-party packages. It runs through the normal project validator and Node test suite. Validation: 189 Node tests pass; 104 exact mirrors/IDs/package/CRLF checks and 63 mirror plus 63 canonical hex scans pass. Native warning-free rebuild and executable self-tests remain Shane's next check; no successful native build is claimed by these source checks. Shane confirmed the repository is public; no release is published yet, so binary update acceptance still awaits release assets.


## 2026-11-20 - Updater BETA 997 duplicate-label correction

Shane reported TB5172 in MainModule at the repeated DPI initialization lines. Split all three colon-separated parameterless-call sequences into separate statements: `WinUI_InitializeDpiAwareness:` was parsed as a line label rather than a Sub call. The no-argument, detached GUI and startup-error paths now explicitly execute DPI initialization before opening the WebView window. Patched canonical Updater.twinproj and matching CRLF source; 104 exact mirror/ID/package checks pass. Native recompilation remains Shane's next check; no successful build is claimed yet.


## 2026-11-20 - Native twinBASIC updater engine (tbUI3IDE 0.3.0.22, Updater 0.1.0.1)

At Shane's request, moved the update engine into the canonical twinBASIC sidecar project and removed the distributed `Updater.ps1` and its obsolete PowerShell engine tests. The WebView2 UI now starts a hidden native worker instance of the same EXE. Discovery, four-part/major-zero/legacy version policy, streaming WinHTTP downloads, CNG SHA-256, publisher trust, strict JSON, ZIP/DEFLATE/CRC32 validation, PE/version checks, vendor-baseline preservation, consent/process waits, cancellation, durable backup/journal/atomic swaps, rollback/recovery, detached self-update, retention and restart are twinBASIC code. No new compiler references or control-package changes. Runtime distribution is one EXE; release packaging is a separate self-contained development tool.

Plans/journals use schema 2 and exact FILETIME strings for owning-process identity. Stale script-engine sessions must be rechecked; unresolved old backups are retained for inspection. Added `Updater.exe -SelfTest`: 28 policy/filesystem cases plus 19 embedded ZIP fixtures generated independently with Node zlib (47 native cases). The previous PowerShell results do not validate the new native implementation.

Validation performed: all 186 Node tests pass, including independent ZIP-fixture zlib/hash verification, no interpreter/distributed-script regression checks and existing UI tests; release-tool PowerShell syntax parses; canonical/mirror, stable IDs, embedded package and CRLF checks pass (104 exact mirrored files). Source/ABI review: new Windows handles and pointer fields use LongPtr; DWORDs/status/length fields remain Long; FILETIME is two DWORDs; the sidecar remains a Win32 build for both IDE architectures. Native compilation, the 47 compiled self-tests and live installation/recovery remain explicitly unrun under Shane's deferred-compile instruction. No production installation or release publication performed.


## 2026-11-19 - Updater implementation candidate (tbUI3IDE 0.3.0.21, Updater 0.1.0.0)

Implemented asynchronous release checks and an IDE Options update panel with automatic-check opt-out, per-component installed/available versions, notification, selection, Update Now/On Exit/Later and normal-shutdown approval. Source failures are independent. The add-in never replaces its loaded DLL.

Added a native twinBASIC sidecar with an embedded WebView2 interface based on the shared Toolkit snapshot 0babc88f: shared named controls/Master CSS, live Windows theme/accent, local browser profile, restricted bridge, in-memory script resources, progress, retry/recovery and Runtime remediation without classic message boxes. A separate Windows PowerShell 5.1 engine verifies/stages published assets, waits for the owning IDE/other installation processes, protects locally modified vendor files, journals replacements, backs up and rolls back selected components, handles detached self-update, rejects downgrades on retry and optionally restarts the same IDE. Projects/embedded control packages are not rewritten.

Coordinated with Quill and incorporated the corrected add-in baseline 0.3.0.20; this feature pass is 0.3.0.21. Only the documented historical add-in identities are aliased; verified future stable receipts preserve real 1.x identities. Core tbUI3 1.0.0.75 and resource-library versions are unchanged. Added a release-manifest contract and architecture/version/stale-build-checked packager; no release was published.

Validation: 183 Node tests and 23 actual-filesystem/ZIP/recovery PowerShell 5.1 tests; 93 exact canonical/mirror files, embedded package, stable IDs and CRLF checks. Headless Edge Light/Dark + desktop/narrow interaction checks pass without browser errors. Actual official BETA 1044 ZIP: size/digest/signature checks and 197 managed files verified; BETA 997 baseline: 196 managed files verified, including zero-padded release-tag handling. tbUI3 currently returns public API 404; other sources remain usable.

Shane explicitly deferred final native compilation/runtime until tomorrow. The earlier minimal launcher was compiled before the WebView2 UI was added; it is stale and must not be distributed. Reopen the projects before building. See [Updater build, release and acceptance checklist](Updater/README.md).


## 2026-11-19 - Prerelease version policy documentation

Documented first-party version mapping (original tbUI3IDE 1.3.0.20 => corrected designation 0.3.0.20), with the independent tbUI3 package reference migration and updater compatibility still pending. Historical build evidence remains intact. See ../docs/VERSIONING_POLICY.md. **No canonical project or compiled DLL was renumbered by this documentation pass.**

## 2026-11-19, unified updater design documentation only

Documented the agreed standalone `Updater.exe` and tbUI3IDE update-check workflow, covering in-place twinBASIC replacement, both add-in architectures, WinUI3 themes, existing developer icon library, optional control-package release downloads, user consent, safe IDE shutdown, staging, integrity checks, backups/rollback, self-update and release packaging follow-ups. Added the historical updater plan (now consolidated in the Installation Manager specification) and roadmap entry. **No updater code, install capability, release assets or runtime validation was implemented in this pass.**

## 2026-11-17, package 1.0.0.67 warning follow-up (add-in unchanged)

Changed the Add, Previous and Next glyph literals in UI3TabView to explicit Long values (&HE710&, &HE76B&, &HE76C&), addressing the three BETA 1044 TB0012 warnings Shane reported. Package revision is 1.0.0.67; tbUI3IDE remains 1.3.0.16 / adapter v9. Updated the canonical package, complete embedded test package and version reference. Existing 142 tests and 71 mirror checks pass; warning-free native recompilation remains to be confirmed. No IDs or interaction behavior changed.


## 2026-11-17, TabView adapter v9 (tbUI3IDE 1.3.0.16)

- Added persisted UI3TabView.TabStyle with UI3TabStyle choices ui3TabEdge (Edge Style, default) and ui3TabExplorer (Explorer Style). Edge follows Shane's customized Toolkit at the shared Toolkit snapshot commit 85432018090efc339d21ae7c47fd0e45ac8dea6b: 36-DIP tabs, 4-DIP top inset and 8-DIP concave feet. Explorer uses the prior WinUI 32/8/4 profile. Both retain a 40-DIP page origin; style changes do not alter page ownership or child coordinates.
- Added native vector tab outlines, selected/page seams, neighbor separators, left-aligned ellipsized captions, theme hover/pressed/disabled states, keyboard-only focus indication, centered add/scroll glyphs, pointer capture/cancel and hover-leave cleanup. Selected tabs paint last so their joins remain intact. Explorer's unselected hover uses the rounded WinUI container; Edge hover uses the Toolkit outline.
- Added overflow arrows that scroll the header viewport without selecting/moving pages, automatic reveal on selection, wrapping Left/Right and Ctrl+Tab navigation, Home/End and Ctrl+T add requests. Very narrow hosts retain a clipped selected tab and keyboard access instead of overlapping arrows. Transient FirstVisibleTabIndex is not written to PropertyBag. Pointer tracking uses pointer-width-safe comctl32 subclass APIs with no retained control reference or timer.
- Adapter v9 mirrors both profiles, reserved feet, add-button position and overflow hit testing. Native viewport changes request header snapshots without structural edits or undo checkpoints. Existing designer page containers, names, locks, selection and insertion paths are retained. Updated canonical package/test/add-in projects and the full embedded package; existing control/project IDs and public-member order are preserved.
- Validation: 142 tests and 71 exact project mirrors pass; x86/x64 Direct2D arc/point ABI and DirectWrite ellipsis probes pass. Edge source-derived curve coordinates match the live verified Toolkit SVG with zero point mismatches in Light/Dark; preview checks cover 1200px/720px widths without console/page errors. Native IDE automation was attempted but could not launch twinBASIC: GetCursorPos returned Access denied (0x80070005). This is not a compiled control acceptance run. Evidence: docs/validation/2026-11-17-tabview-profiles.md.


## 2026-11-17, document command behavior (tbUI3IDE 1.3.0.15)

- Save Document now enables for a dirty, writable selected CodeEditor/UIDesigner and saves through the IDE's per-editor openEditors.save(node) route. It no longer invokes BETA 1044's deliberately disabled tbEditor_Save placeholder. Other dirty documents remain unsaved; native writers retain failure/dirty handling. Unsaved projects use native Save As, retaining the originally clicked document across tab changes and skipping it if closed before the callback.
- Form / Code now requires an existing counterpart in the native file tree, using the native handler identity and lookup order for .tbform, .tbcontrol, .tbppage and .tbreport. Standalone modules and unrelated editors disable the replacement button. The same predicate guards dispatch; native global command definitions and Classic toolbar handlers are untouched.
- Both corrections apply to Code/Form in Ribbon and Hybrid, full/simplified. 135 automated tests, 71 exact project mirrors and eight Edge document-command flows pass. Checks exercise actual installed native code/form writers, switch helpers and the generated add-in script; failed/successful writes and Save As targeting are covered. Native compiled-host disk/save/reopen confirmation remains pending. Evidence: docs/validation/2026-11-17-document-commands.md.


## 2026-11-17, theme-scoped ribbon elevation (tbUI3IDE 1.3.0.14)

The ribbon command card now has no drop shadow or bottom border in standard and third-party themes. Its existing raised treatment is enabled only for WinUI3 Dark and WinUI3 Light, with case-normalized theme names. This applies to Ribbon and Hybrid in both full and simplified presentation, independently of the additional-styling switch. Theme changes toggle a presentation class without replacing command/control nodes. Command behavior, group dividers, dimensions, corner radius and popup styling are retained.

Validation: 130 tests, 71 exact project mirrors and Edge renderer checks pass. Edge covers 32 theme/profile/presentation states, including live transitions through native Dark/Light/Classic, custom names and both WinUI themes, with no page/console errors. Native add-in build/reload acceptance remains pending. Package 65, adapter v8 and stable identities are unchanged.


## 2026-11-12, neutral Light chrome and Windows accent (tbUI3IDE 1.3.0.13)

- WinUI3 Light now uses neutral #F3F3F3 title/menu chrome and dark foregrounds. Optional styling corrects native hard-coded white caption text/PNG icons and also neutralizes an older installed Light theme. The generated Light.theme has the same neutral palette.
- Restricted the 8px window side/top insets to the exact WinUI3 Dark and WinUI3 Light themes with additional styling enabled. Other themes, including other names starting with WinUI3, receive no insets. Existing caption/Quick Access exemptions, real-titlebar top condition and no-bottom-inset behavior remain.
- Added live Windows accent integration for both WinUI3 themes while additional styling is enabled. The private UISettings bridge reads all seven system accent shades on the existing one-second options timer. WinUI resource mapping uses Light2/Dark1 for dark/light fill and Light3/Dark2 for links, including hover/pressed opacity, native UI accents and progress bars. Theme changes, styling Off and unload remove the owned override stylesheet; unavailable Windows colors fall back to the static theme.
- Validation: 129 tests and 71 project mirrors pass. Equivalent documented UISettings ABI probes succeeded in both 32-bit and 64-bit Windows processes. Edge checks cover neutral/old-installed Light chrome, readable caption controls, blue/purple palette refresh, both themes, styling Off and non-WinUI cleanup. Native twinBASIC compile/reload and live Windows-settings change acceptance remain pending. Evidence: docs/validation/2026-11-12-neutral-light-system-accent.md.


## 2026-11-12, profile parity and corrected presentation scope (tbUI3IDE 1.3.0.12)

- Added Switch Between Form and Code immediately after Save Document in the Code/Form Document group for Ribbon and Hybrid, reusing the native action and tooltip.
- Hybrid now supports full/simplified presentation and Ctrl+F1 while keeping its smaller tab/command inventory, native menus and no quick access or Backstage.
- Corrected 1.3.0.11's scope: only Simplified removes the additional Center in Container, Lock Controls, Preview, Grid, four secondary MultiPage and Insert file-command labels and uses the Grid options flyout. Full layouts restore labels and inline Grid options. The original ten alignment/size icon-only commands remain in both. The chevron stays inside both layouts and has a transparent background at rest, with hover fill and a visible glyph in both WinUI3 themes.
- Classic retains its native controls, order and handlers, using the same icon resolver as Ribbon. Toolbar/add-in buttons have glyphs and tooltips without visible labels; native selectors remain unchanged. Late contributions and teardown are handled reversibly.
- Additional styling enables 8px left/right main-window insets without a bottom inset. Custom-titlebar mode also adds 8px above Quick Access, preserving its existing 16px left padding and the caption-button rectangles. Real OS titlebar mode gets no top inset; the caption/Quick Access row is excluded from side insets.
- 126 automated tests and 71 exact project mirrors pass. Edge checks cover native BETA 1044 toolbar/header/Grid markup, both replacement profiles and presentations, 38 Classic buttons, theme states and inset geometry. Native compiled build/reload and restart acceptance remain pending. Evidence: docs/validation/2026-11-12-profiles-insets-scope.md.

## 2026-11-12, compact controls and Grid toggle/flyout (tbUI3IDE 1.3.0.11)

- The presentation chevron now overlays the bottom-right inside the full-width card; end padding keeps commands clear without an external strip. Simplified commands are vertically centered. Quick Access has 16px left padding.
- Removed only the requested labels: both Center in Container actions, Lock Controls, Preview, Grid, the last four MultiPage actions, and Insert Folder/Other file/Import. Native tooltips/accessible names, glyphs, state and dispatch remain. The changes use shared metadata in both replacement layouts.
- Grid is a two-part toggle/flyout composition: the main action keeps native toggling/pressed state; the arrow opens a top-layer Grid options dialog with the original inputs and handlers. Show Grid's duplicate row remains hidden. Options are stored hidden between openings and restored to the native container on tab/mode/unload cleanup. Escape returns focus; outside click, blur, style change and disabled context close correctly. Menu-state refresh defers layout rebuilding during Grid edits.
- Shared Grid field styles now follow the fieldset into the flyout, retaining the existing native forced-white background exception. No new package/control/native API dependency is introduced.
- 119 tests and 71 mirrors pass. Edge uses actual BETA 1044 Grid markup/relevant CSS and verifies independent toggle/arrow actions, native change events, stable polling/editing, five option rows, theme fill, original values, compact label visibility/centering, inset chevron, 16px Quick Access padding and 1920px Form fit. Native rebuild/reload acceptance remains pending. Evidence: ../docs/validation/2026-11-12-grid-split-compact.md.

## 2026-11-12, Full/Simplified Ribbon (tbUI3IDE 1.3.0.10)

- Added the bottom-right down chevron in Ribbon mode, switching to an up chevron and a compact single-row layout on click. The same live command/control nodes and selected tab are retained; switching back restores full measured button widths. The command area is 100px full / 48px simplified, with the existing separate 26px tab strip.
- Simplified uses 20px icons, single-line captions, compact accessible groups and horizontal scrolling without dropping commands. Mouse wheel scrolls overflowing rows except over native inputs/selectors; keyboard focus reveals off-screen controls. File, contextual MultiPage, native selectors/Grid handlers, disabled/checked state and dropdowns remain functional.
- Added the independent saved SimplifiedRibbon preference and polling protocol; teardown drains all three pending preference kinds. Ribbon Ctrl+F1 uses this toggle. Hybrid/Classic structures are unchanged and Hybrid's prior Ctrl+F1 hide/show remains.
- 116 automated tests, 71 project mirrors and Edge fixture checks at 1280px/640px pass without page/console errors. Native build/restart preference and visual acceptance remain pending. Evidence: ../docs/validation/2026-11-12-simplified-ribbon.md.

## 2026-11-12, replacement quick-access image (tbUI3IDE 1.3.0.9)

- Swapped in Shane's supplied twinBASIC_WinUI3_16px.png without modifying its bytes. The existing images/twinBASIC_WinUI3.png path is retained, with native 15×16px display instead of enlarging the small asset. Theme/titlebar conditions and Hybrid structure are unchanged.
- Generated script and packed add-in contain the new image; the embedded-byte regression checks it. 111 tests, 71 mirrors and Edge fixture checks pass. Native rebuild/reload confirmation remains pending.

## 2026-11-12, explicit Segoe/Fluent assignments (tbUI3IDE 1.3.0.8)

- Implemented Shane's icon specification for all named command surfaces. Explicit icon references take precedence over native glyphs/backgrounds; Segoe code points use Segoe Fluent Icons with MDL2 fallback, and Fluent SVG masks follow the current theme foreground. Unlisted glyphs retain native/fallback behavior.
- Added a pinned, hash-recorded catalog of 55 selected Fluent assets from @fluentui/svg-icons 1.1.341 and an importer. No runtime npm dependency is introduced. The Page Right derivative masks out the old left-arrow badge and overlays arrow_circle_right_20_filled at the same center/radius.
- MultiPage labels and two internal vertical dividers match the request, while native tooltips, state and command dispatch remain intact. File has the requested navigation icons and an Open/Save horizontal divider. All File add-in rows use puzzle_piece. Restart Compiler and Flush LLVM Cache have the requested captions/icons.
- Save Document has its own first Document group on Code and Form in both Ribbon and Hybrid and no longer appears in Ribbon File. It uses the native tbEditor_Save command and native availability. Hybrid's native menus are preserved.
- 111 automated tests, 71 mirrors, SVG decoding and Edge fixture navigation/dispatch checks pass without errors. Native compiled-host visual/build acceptance remains pending. See ../docs/validation/2026-11-12-requested-icons.md.

## 2026-11-12, Hybrid parity audit (no binary/version change)

- Shared renderer/CSS already supplies Hybrid's label measurement/font refresh, Grid spacing, compact alignment/size source buttons and inline MultiPage section. Added explicit Hybrid width/font regression and both-mode native compact-command dispatch/state coverage. All 105 tests pass without skips.
- Shane confirmed Hybrid should retain its current native-menu structure without quick access or Backstage. The logo and Backstage-specific Options organization remain Ribbon-only.

## 2026-11-12, native theme-name logo fix (tbUI3IDE 1.3.0.7)

- Fixed the native host mismatch: getThemeName() returns lowercase names, so comparing it against WinUI3 Dark/Light hid the quick-access image. Normalize the value before comparing; accept only the same two themes and keep the real-OS-titlebar exclusion.
- Added an actual installed getThemeName() regression and mixed/lowercase coverage. Updated the external Edge fixture to use that actual function rather than its former title-case mock; verified a visible, decoded original PNG, theme/titlebar transitions and the existing inline MultiPage/Options flows without page/console errors.
- 104 automated checks pass without skips and 71 exact mirrors match. Native rebuild/reload acceptance remains pending. Follow-up evidence is appended to ../docs/validation/2026-11-12-ribbon-refinements.md.

## 2026-11-12, inline contextual MultiPage (tbUI3IDE 1.3.0.6)

- Ribbon and Hybrid now insert a regular MultiPage command group immediately after Grid on the Form tab. Removed the nested launcher and its unused styling; clicking a page command no longer replaces the Form command area.
- Existing host/page/child context detection and native page buttons, state, tooltips, glyphs and dispatch are preserved. Other Form groups remain visible. Selecting an unrelated control or leaving the Form tab removes the group; returning restores it when applicable.
- 103 automated checks and 71 exact project mirrors pass. Edge fixture checks pass in both layouts with no console/page errors. Native compiled-host acceptance remains pending. Evidence: ../docs/validation/2026-11-12-inline-multipage.md.

## 2026-11-12, recovered Ribbon requirements (tbUI3IDE 1.3.0.5)

- Large labels are measured in their actual rendered font, choosing the smallest width that fits up to two whole-word lines between 50px and 86px. Cached measurements track font/style changes and clear when fonts finish loading. Overlong captions retain the 86px cap and full tooltip.
- The Grid toggle-to-options gap matches the 4px group/divider inset. Align left/top/right/bottom/center horizontal/center vertical and widest/tallest/narrowest/shortest are compact icon-only buttons; tooltips, accessible names and native execution/state remain intact. Content buttons fit the existing 24px stacked rows.
- File has one Options page containing the former Preferences commands and the native IDE Options button. Entering the page keeps File open; executing IDE Options closes File before native dispatch.
- The original user-supplied PNG is preserved as images/twinBASIC_WinUI3.png and embedded in the generated script. Its 24px quick-access image precedes Save only in WinUI3 Dark/Light when Show real OS titlebar is off, independent of optional styling. Classic/Hybrid remain unchanged.
- 103 automated checks pass with zero skips against installed native IDE fixtures. Edge fixture validation covers rendered widths, compact commands, matching Grid spacing, Options dispatch and live logo conditions without console/page errors. Packed-source validation and limitations are recorded in ../docs/validation/2026-11-12-ribbon-refinements.md. Native build/rendered acceptance remains pending.

## 2026-11-11, compact glyph canvases and theme reconciliation (tbUI3IDE 1.3.0.4)

- Corrected large-button horizontal alignment by replacing the inherited left-justified grid with a stretched single column. Large buttons now size to minimum content between 50px and 86px rather than starting from maximum content. Labels wrap at word boundaries with a bounded long-word fallback. Paste, Grid and all other large commands share this layout in Hybrid and Ribbon.
- The 100px command card now has 4px top padding and 89px section dividers. Each 76px large button budgets 32px glyph canvas, 4px caption gap, 28px two-line caption, 2px chevron gap, 8px chevron and 2px borders. Artwork is centered in the canvas; small command canvases are 16px. Group gaps remain compact.
- Combined the original Grid toggle and its live native options into one Grid group. Configuration joins Zoom as a visually hidden accessible selector caption. File's rail extends through the former quick-access row, while the title controls remain uncovered. File now pairs the general surface with the application foreground, correcting black text on Native Dark.
- Fixed missing theme-event coverage: BETA 1044's IDE Options save path calls changedIdeOptions without notifyChangedTheme. The shared options timer now reconciles the actual theme name. A page-side theme-property observer removes optional CSS immediately when leaving WinUI3, restores native panel titles and removes only previously recorded theme variables omitted by the next palette whose value/priority remain unchanged. Native palette values are retained.
- Verified the additional-styling toggle's actual emitted JavaScript still switches optional CSS off/on and restores saved Off independently of page management and toolbar mode. Reinitialization no longer overwrites a newer, unsaved page preference; stylesheet insertion sets its media before attaching it, preserving Off during theme reapplication. Both observers disconnect on unload.
- Added a subtle menu shadow in WinUI3 Light and Dark using the existing Fluent shadow4 composition. Native menus/submenus and replacement dropdowns share the token. This remains optional additional styling and disappears with that stylesheet; other themes retain their own palette.
- All 99 JavaScript/DOM/CSSOM/native-protocol checks pass without skips, all 71 project mirrors match, and all six current official-export files match. Runtime package 1.0.0.65, adapter v8, consumer project and stable IDs remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md.

## 2026-11-11, direct Form/Insert commands and editor-aware ribbon (tbUI3IDE 1.3.0.3)

- Form now expands the live native Align and Make Same Size descriptors directly into its groups. The four alignment and four size commands use their existing toolbar nodes/handlers/glyphs in classic order; additional native alignment options remain directly available. Context/disabled state and future child descriptors are retained.
- Insert now expands the actual asynchronous native Add component producer into Forms, Code, Resources, Files and fallback Components groups, with concise labels/full native tooltips. New dynamic options are retained. An isolated descriptor-capture bridge shadows only showContextMenu in the producer's own JavaScript realm, so asynchronous captures do not temporarily replace the IDE's global menu function or open an unrequested popup. Unsupported producer/private-closure changes retain the native parent as a compatibility fallback.
- Dropdowns use browser auto-popover light-dismiss plus window-capture pointer/mouse outside-click handling. Clicking empty ribbon surfaces now dismisses them too; browser close events, window blur and clicking the same dropdown button also clean up state. The original outside click is not consumed.
- All full-size buttons share the same fixed top glyph/caption/chevron grid, independent of caption length or dropdown role; the 76px height and existing size caps remain unchanged.
- File immediately hides quick access, restoring the same six buttons and focus on exit. The visible Zoom caption above its native selector is removed while retaining an accessible hidden label and the original selector/events.
- Native editor identity/type changes switch the ribbon to Code for CodeEditor or Form for UIDesigner. Stable editor state leaves a manual ribbon choice intact; File defers editor-following until exit. Both Hybrid and Ribbon use the same bounded native-state observation.
- Restored the classic Grid toggle on Form using its original native handler, checked state and canonical Show Grid checkbox state. The redundant checkbox row is hidden only inside the replacement grid fieldset when that toggle exists; Classic restoration retains the original node and value.
- All 93 JavaScript/DOM/CSSOM/protocol checks pass without skips, including nine new regressions and actual BETA 1044 native producers. All 71 project mirrors and six official-export files match. Native package 1.0.0.65, adapter v8, consumer project and identities remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-direct-commands.md.

## 2026-11-11, separate ribbon surfaces and correct dropdown layering (tbUI3IDE 1.3.0.2)

- Separated the title/menu-colored tab strip from the toolbar-colored command card. Only the command card carries the existing Fluent shadow/corners. Tabs stay transparent: selected tabs show an active-theme accent underline, and unselected hover shows a grey underline without a hover plate. Keyboard focus remains visible.
- Dropdowns now use the application flyout/general surface and matching toolbar foreground instead of the IDE's deliberately light native context-menu surface. Standard selects receive the active light/dark color-scheme. Menus use manual browser popover promotion when available, escaping native designer stacking/overflow. Older hosts retain a body-level maximum-z fallback. Escape, File opening/closing, command dispatch, mode changes and unload remove the owned popup and clear its expanded state.
- Corrected the grid number-field background conflict: BETA 1044 formDesigner.css hard-codes white !important for input.optionGridWidth/Height. One scoped background !important declaration now consumes a themed fill token; hover/focus vary that token. Original native nodes/classes/values/events are retained, and unrelated designer controls are untouched.
- Replaced the U+2304 text marker with a masked Fluent Chevron Down from the existing pinned Microsoft icon source. Full-size dropdowns center it below the caption in a 76px layout; compact/popup commands center it at the right. The combined map contains 37 SVGs: 19 established and 18 gap-fill.
- File Back is now an icon-only left arrow in a circular outline, with an accessible label/tooltip and existing Escape/back focus restoration.
- All 84 JavaScript/DOM/CSSOM/protocol checks pass without skips, including six new regressions for the reported surfaces, layering, native style conflict and glyphs. All 108 native top-level menu descriptors remain accounted for; all 71 packed mirrors and six official-export files match. Package 1.0.0.65, adapter v8, consumer project and stable identities remain unchanged. Evidence: docs/validation/2026-11-11-ribbon-surfaces-popups.md.

## 2026-11-11, ribbon surface, command sizing, icons and File Help (tbUI3IDE 1.3.0.1)

- Reconnected the replacement ribbon to the old toolbar surface resource: the existing CardBackgroundFillColorDefault token when available, otherwise the selected theme's ToolbarBackground. Toolbar text uses the corresponding general/control foreground rather than the titlebar foreground; quick access retains the titlebar foreground, and popups use their native menu surface/foreground pair.
- Restored the established WinUI SubtleFillColorSecondary/Tertiary hover/pressed fills in essential CSS for light/dark, including when optional additional styling is off. These are the same pinned alpha effects as the existing stylesheet; they do not replace the selected theme's surface/foreground palette. Popup hover follows the native context-menu resource.
- Replaced the remaining first-command sizing rules with an explicit function-based presentation map, derived from Shane's Office Home/View/Developer/Page Layout screenshots. Related view controls, Project Settings/References, Bring Forward/Send Backward, formatting and other primary actions can all be full-size within one group. Clipboard Cut/Copy, indent/outdent, stepping and similar auxiliary commands stay stacked. Retained the 100px command area, 26px tabs and 50px standard / 86px maximum by 76px full-size limits; dropdown arrows do not add a vertical layout row.
- Filled missing command icons across ribbon groups, synthetic/lazy dropdowns, File navigation, contextual MultiPage and text-only add-in buttons. Existing 19 Fluent glyphs, native designer glyphs and contributed images remain intact. Added 17 MIT Fluent UI System Icons from pinned Microsoft source for gaps; future text-only commands receive a generic Fluent fallback without filtering the native action.
- Moved every native Help command into File > Help and intercepted the native Help menu opening to that section. No separate Help ribbon tab remains. Native command/callback dispatch and dynamically added Help entries remain available.
- The moved grid controls now inherit the toolbar foreground and themed number-input fill/border, with consistent three-row placement. Their original nodes, values and handlers restore intact in Classic.
- Validation: 78 JavaScript/DOM/CSSOM/protocol tests pass with no skips; all 108 shipped BETA 1044 top-level menu descriptors remain accounted for. All 71 project mirrors and six official-export files match. Native package 1.0.0.65, TabView adapter v8, consumer project and stable identities are unchanged. Detailed evidence: docs/validation/2026-11-11-ribbon-presentation.md.

## 2026-11-10, task-based Ribbon and vertical Backstage (tbUI3IDE 1.3.0.0)

- Replaced literal native-menu tabs/separator captions with semantic task groups: Home Clipboard/Editing; Insert Components; Code formatting/navigation/outlining/case; Form designer arrangement; View views/panels/zoom/window/appearance; Project build/compiler/folders; Debug and Help. Undo/Redo and Start/Break/Stop remain in quick access without duplicate ribbon entries. Paste/Find and other explicit roles determine large buttons instead of making each separator's first command large.
- Added compact native-action dropdowns for Fold/Unfold, Change case, Find options and More panels. Native command IDs, context alternatives, lazy submenus, enabled/checked state and original actions remain authoritative. New native commands and menus retain fallback destinations. Existing Fluent/native glyphs, theme-independent styling choice, geometry caps and elevation are preserved.
- Rebuilt File with a vertical navigation rail, project information and vertical tasks. Save, Save document, Options and Exit dispatch native actions; Open/recent, Export, Preferences and loaded Add-ins have task sections. Build/Clean move to Project. The designer/workspace and floating panels are hidden/inert only while File is open, then their prior visibility/accessibility state is restored before commands, on close, mode change and unload. Stable rendering retains focused rail controls across refreshes.
- Documented the command mapping and future-command fallback contract in tbIDE/RIBBON_LAYOUT.md. The existing BETA 1044 add-in enablement limitation is unchanged.
- All 72 JS/DOM/protocol checks pass with no skips, including coverage of all 108 shipped top-level native menu descriptors; all 71 mirrors and six official-export files match. Detailed evidence: docs/validation/2026-11-10-ide-toolbar.md. Runtime package 1.0.0.65, TabView adapter v8, stable project IDs and consumer project contents are unchanged.

## 2026-11-10, collapse the empty toolbar slot and restore compact presentation (tbUI3IDE 1.2.0.2)

- Shane's BETA 1044 screenshot shows a blank rounded strip under Hybrid, missing toolbar elevation and oversized/overlapping command captions. The native stylesheet gives dockElementContainer a 30px minimum height; hiding only the toolbar header/body leaves that slot visible. The adapter now hides the nearest dock/floating slot only when its sole sectionHeader is the TOOLBAR header. Shared panels stay visible; redocking releases the previous slot, and Classic/unload restores all owned visibility classes without changing saved dimensions or docking configuration.
- Restored the existing simplified-toolbar Fluent shadow4 (0 0 2px at .12 alpha plus 0 2px 4px at .14 alpha) and 8px card corners on the replacement ribbon. The selected IDE theme still supplies palette/state colors. These are the already established elevation values, not Office iconography or a new palette.
- Separated concise captions from native tooltip/help text. Known commands now use Save, Form / code, Restart compiler, Configuration and similar compact labels; the original help, ALT-key explanation and shortcuts remain in tooltips. Unknown/contributed commands are still discovered and routed normally. Stacked labels stay on one line with ellipsis; full-size labels retain two lines.
- Reduced group horizontal padding from 8px to 4px, command-column/group gaps to 2px, and selector caption width to 120px. Preserved the 100px command-area cap, 26px tab-strip cap, 50px standard / 86px maximum full-size widths, fixed 76px full-size height and all existing glyphs.
- All 66 JS/DOM/protocol checks pass, including four new regressions for dedicated-slot cleanup, shared-slot safety, redocking and caption/tooltip separation. The 71 configured project mirrors and current official add-in export match. The reported screenshot is the before-state evidence; the corrected native appearance remains the next observation. Package 1.0.0.65, adapter v8 and the saved consumer project are unchanged.

## 2026-11-10, compact ribbon sizing (tbUI3IDE 1.2.0.1)

- Applied Shane's requested geometry to Hybrid/Ribbon: command area capped at 100px, with a separate tab strip capped at 26px. Full-size commands use a 50px standard minimum width, expand for their label up to 86px, and remain exactly 76px high. The supplied Office screenshot confirms the separate command/tab areas.
- Centralized the dimensions in ribbon CSS variables and applied border-box sizing so padding and borders count toward those limits. Reduced stacked rows to 24px, retained 76px for the three-row span, tightened group captions and limited large labels to two lines with the original tooltip retained. Kept quick access, Backstage and submenu button sizing separate.
- Regenerated the embedded stylesheet/script and packed add-in as 1.2.0.1. Existing 62 JS/DOM/protocol checks, source/mirror checks and official-export comparison pass. Geometry was inspected statically; this entry does not claim a new rendered IDE observation. Package 1.0.0.65, adapter v8, glyphs and command behavior are unchanged.

## 2026-11-10: reconcile main research with the current IDE candidate

- Preserved the main-branch designer-bridge research and its probe history alongside the unified tbUI3IDE implementation records. Updated the roadmap to distinguish historical questions from the current acceptance gates. No source or packed-project changes.

## 2026-11-10, first selectable-toolbar implementation (tbUI3IDE 1.2.0.0)

- Renamed the canonical IDE add-in project, container root, output, metadata and active tooling to tbIDE/tbUI3IDE/tbUI3IDE.twinproj / tbUI3IDE.dll, preserving project ID {15AA6303-46EB-4D7C-B378-F0564F750D0C}, the legacy Enabled preference, package 1.0.0.65 and TabView adapter v8. Added independently persisted ToolbarMode, with Classic as the compatibility default.
- Added IDE Toolbar below the additional-styling switch for every IDE theme. Classic preserves native UI; Hybrid provides Home, Code, Form, nested contextual MultiPage and Add-ins; Ribbon discovers native menu headers/descriptors, presents their commands in groups, opens fullscreen File/Backstage and routes loaded-add-in information to File. Save/Undo/Redo/Play/Pause/Stop occupy the upper quick-access area. Third-party toolbar buttons remain in Add-ins.
- Reused all 19 established Fluent SVG glyphs, scaling lead commands to 28px and stacked commands to 18px. Existing native designer glyphs and third-party images are retained. Essential toolbar CSS uses active IDE theme variables and is independent of optional WinUI3 restyling. No Office icon assets were introduced.
- Retained native command/context authority and live build/zoom/grid controls. Added menu alternatives, checked/disabled state, lazy submenus, asynchronous Add-ins population, late contribution discovery, native menu shortcut interception, tab keyboard navigation, File Escape/focus return, Ctrl+F1 collapse and horizontal overflow. Mode changes/unload restore original nodes and the native docked toolbar header without editing the saved panel layout. Unsupported structure falls back to Classic while retaining the requested preference and reporting the reason.
- BETA 1044's native Add-Ins menu lists loaded add-ins, but its action calls notSupportedMenuOption and no enable/disable bridge is exposed. Backstage displays that limitation and disables those stub actions; enable/disable management remains open rather than inventing a toggle.
- All 62 JS/DOM/protocol checks pass against official BETA 1044 helpers (44 existing and 18 toolbar checks), including native menu builders and native command/context bindings. All 71 configured project mirrors match; the latest official impexp export matches the six add-in export files, with .meta checked separately. Browser visual checking was blocked by the browser URL policy; no rendered appearance or native IDE startup result is claimed. Detailed evidence and remaining acceptance work: docs/validation/2026-11-10-ide-toolbar.md.

## 2026-11-10: documented Classic, Hybrid and Ribbon requirements

- Revised ROADMAP.md so the previous Home/Code/Form/contextual MultiPage/Add-ins proposal is Hybrid, alongside Classic and full Ribbon, selected through an independent IDE Toolbar combo box below the additional-styling option. Recorded saved preferences and the compatibility default.
- Documented full native menu migration, fullscreen Office-style File/Backstage with add-in enablement, separate contributed-button ribbon and upper/custom-title-bar quick-access controls. Recorded dynamic live-menu discovery and future-menu coverage as requirements, with restoration and state/dispatch checks.
- Recorded Shane's clarification that all toolbar presentations follow whichever IDE theme is selected, including standard/third-party themes, independently of the additional-styling switch. Updated architecture and handoff documents. Documentation only: no toolbar mode, setting, rename or runtime behavior was implemented or tested in this pass.

## 2026-11-10: recorded ribbon and rename requirements

- Recorded Shane's command-by-command Home, Code, Form, contextual nested MultiPage and Add-ins layout in tbIDE/ROADMAP.md, including an always-visible Home tab and third-party button routing.
- Documented the future tbUI3IDE project/output rename, identity/preference migration and scoped use of Fluent UI Web as the ribbon-pattern basis with WinUI 3 visuals. Updated handoff/architecture requirements. This is a documentation revision; runtime, project name and ribbon implementation are unchanged.


## 2026-11-10: one distributed tbUI3 IDE add-in, 1.1.0.0

- Shane chose one distributed IDE add-in with independently optional theme styling. The existing WinUI3IdeStyle project now contains the theme implementation and TabView adapter v8. It exposes one add-in entry point, reports tbUI3 IDE as its display name and retains the WinUI3IdeStyle.dll output/project ID so existing styling installations and per-user preferences carry forward.
- Moved the readable adapter and embedded script into the unified project. A private TabViewDesignerController owns its existing toolbar commands, hidden page bridge, retry timer and disposal. The single add-in starts it independently of theme selection/settings and forwards project load. Theme changes and the saved styling switch affect only theme presentation; tab commands, page protection and toolbox hiding remain active.
- Preserved all 288 generated theme rules and both CSS inputs byte-for-byte. Preserved the WinUI3IdeStyle/Options/Enabled setting. Unload stops both feature timers, disposes tab behavior, removes theme CSS and disconnects the theme option observer/removes its row. Retired the standalone TabViewDesigner project, entry point and export tree; its README now directs users to the unified add-in. Existing installations must remove TabViewDesigner.dll from both architecture folders to prevent duplicate loaded components.
- Updated the script builder and validator for the single canonical project. The initial project bootstrap refuses to overwrite the established project. All 44 JS/contract checks pass against official BETA 1044 helpers, including the actual theme-switch script with styling on/off, saved disabled state, page insertion after theme removal and one entry point. All 70 project mirrors and 5 official add-in export contents match. These are source, packing and JS checks; the unified native load/unload outcome is a separate gate.
- Recorded the Microsoft Office-style tabbed ribbon as the next agreed pass, with TabView commands in their own group/tab rather than the general toolbar. No ribbon layout is implemented in this consolidation. Package 1.0.0.65 and the saved consumer project are unchanged.


## 2026-11-10: hide the page toolbox button (adapter v8, add-in 1.0.0.7)

- Hides only the exact registered tbUI3.UI3TabPage toolbox entry while active, preserving class registration/arrays and page insertion. Reapplies after toolbox rebuild, returns a previously selected page drawing tool to the native pointer when ready, and removes its presentation class on unload/error cleanup. Host/unrelated tools remain visible.
- All 41 JS adapter checks pass against official BETA 1044 helpers; packed/exported add-in contents match. Package 65 remains unchanged. Native toolbox observation is open. New uploaded package 65 logs now confirm stale Name failures &H5B are skipped and replacement Page8 is discovered.

## 2026-11-10: native package 65 delete/readd follow-up

- New v7/native 64 logs still show replacements excluded from native discovery after deletion. Package 65 isolates per-entry failures and adds skipped/failure diagnostics; the adapter and its packed project are unchanged. All 40 existing adapter checks pass with official BETA 1044 helpers, without implying native collector execution.

## 2026-11-10: structural delete completion and host-scoped naming (adapter v7, add-in 1.0.0.6)

- Added the missing native onSignificantChange after deletion/undo, matching the native Delete command. A source-contract check confirms v6 omitted the project-model notification.
- New pages use host-prefixed names and host-local default captions, with form-wide collision checking and session reservation across refreshes. Existing names/captions remain intact. Pending initialization can resolve its own page under the original host after resync and reports native initialization errors.
- All 40 adapter/contract checks pass against official 1043 and 1044 functions, including delete/readd across two host sizes and deletion of the last page. Package 1.0.0.64 and the latest canonical test project are unchanged; native persistence/undo/redo remain open. Child-control insertion with v6 locking is confirmed by Shane.

## 2026-11-09: TabView page-position protection (adapter v6, add-in 1.0.0.5)

- Uses native per-control locks for direct UI3TabPage children so accidental page drag, keyboard move and resize are blocked while host/child controls remain editable. New pages are protected immediately; locks follow rename/resync and release on reparent/delete.
- Preserves pre-existing locks and restores session-owned locks on unload/timer failure. Standard IDE saving can record current page locks in IDE Options; protection does not edit geometry or request undo checkpoints. Diagnostics now include layoutLocked.
- All 34 adapter/contract checks pass, including actual shipped drag/move/resize functions and lock lifecycle cases. Package 1.0.0.64 and canonical test project are unchanged. Shane's native authoring result for the new protection remains open.

## 2026-11-09: TabView Designer page-count diagnostics and toolbar help (adapter v5, add-in 1.0.0.4)

- Added designer page counts/names and native PageCount when serialized to diagnostics, to distinguish repeated native headers from actual duplicate controls. Package 1.0.0.64 now guards its page collection against repeated identities/names; equal captions remain valid.
- The six existing toolbar buttons now describe their behavior on hover, including the page contents removed by Delete and the diagnostic log location. Original titles are restored on unload.
- All 30 adapter/contract checks pass; the native empty-host duplicate-header outcome remains open. No extra insertions, mouse suppression or inferred native-request deduplication were added without evidence. Styling sources remain unchanged.

## 2026-11-09: TabView Designer live snapshot correction (adapter v4, add-in 1.0.0.3)

- BETA 1043 getImageFromServer is a no-op in full-form mode. Parent headers now use queueMultipleSnapshot in the active native property batch after child changes. New pages receive Caption/PageOrder and host activation after their compiler-assigned ID exists.
- Full-form bitmap diagnostics use the actual backgroundImage PNG instead of an absent imageData property. Raw PNG contents are excluded from logs.
- Actual shipped live batch/property/snapshot functions reproduce missing parent snapshots and premature activation in v3. All 26 adapter/contract checks pass after correction. Package 1.0.0.63 and styling implementation are unchanged; the native new-tab selection outcome is the next gate.

## 2026-11-09: TabView Designer rendering diagnostics

- Adapter v3 adds a read-only TabView diagnostics toolbar command that bypasses normal selection/edit gates, reporting supported API state, root/selected controls, real IDs and parents, fixture marker, pending work, computed canvas state and bitmap dimensions/checksums.
- Adapter reports append to tbUI3-tabview.log beside the consumer project and under TEMP; package 1.0.0.63 adds corresponding native paint-state/error lines. No raw bitmap or textbox contents are recorded.
- Twenty-two adapter/contract checks pass; packed add-in and source mirror match. Shane's purple-strip screenshot remains an open native IDE result. Styling sources are unchanged by this pass.

## 2026-11-09: TabView Designer initialization follow-up

- Adapter v2 waits for new control IDs, then sets Caption/PageOrder through native changeProperty before its final undo checkpoint. Initial insertion JSON alone is not treated as saved UserControl state.
- Added one-time initialization for the explicitly marked frmMultiPage fixture, with exact form-ID scoping and marker consumption. Later edits and other forms remain untouched. Selection diagnostics include selected name/class.
- Regenerated the embedded script and canonical add-in project. Twenty adapter/contract checks pass; the screenshot-driven correction's native IDE outcome remains to be observed.

## 2026-11-10: checked against BETA 1044

Compared Shane's BETA 1044 install with 1043. The only theme change is Aurora's IconType2Filter and IconType2HoverFilter; the built-in Dark and Light themes the WinUI3 themes inherit are unchanged, no `--theme` property was added or removed, and no class name in main.js changed. The other changes (form designer text selection while renaming, a rename guard, debugger hover values in hex) touch nothing the themes or the add-in style. No theme or add-in change needed. Not yet run in 1044.

## 2026-11-09: panel titles in sentence case

Shane agreed to sentence case for the IDE's panel titles (WinUI style), which the IDE hard-codes in capitals.

Changed (add-in)
- The page script rewrites the IDE's own English panel titles (Project explorer, Toolbox, Properties, Debug console, Editor 1 and the rest, from a fixed list) while the styling is on, keeping a trailing number. Add-in tool windows and titles in other languages are untouched. The original text comes back when the IDE Options switch is turned off or the theme stops being WinUI3, and a title the IDE rewrites later is converted again.

Validated: in a Chromium mock, titles convert, an IDE rewrite is converted again, an add-in title and a German title stay as they are, and switching off or clearing the theme restores the capitals. Not yet run in the IDE.

## 2026-11-09: panel headers and Project Explorer TreeView

Next roadmap items, agreed with Shane: panel headers and the Project Explorer as a WinUI TreeView.

Changed (themes)
- PanelHeaderFontSize 14px (BodyStrong) and PanelHeaderPadding 4px 4px 4px 0 in both WinUI3 themes.

Changed (add-in)
- Panel headers are at least 40px tall. Their command buttons (search, settings, add, clear, close and the rest) are 28px subtle buttons in the secondary text colour with a 4px-corner hover fill, instead of faded 16px glyphs with a white outline on hover.
- Tree panels (Project Explorer and the other trees) follow the reference TreeView: rows inset 4px with 4px corners and at least 28px tall, a pressed fill, chevrons instead of plus / minus boxes, and text that keeps its colour on hover (the IDE turned it white, which disappeared in WinUI3 Light). The IDE's per-level indents, folder icons and file icons are unchanged. Trees with grid lines (call stack) keep full-width rows.

Validated: Chromium mock with the 1043 styles.css, codicons and both themes (288 of 288 rules parsed; previews panels-dark.png, panels-light.png, panels-before-dark.png). Not yet checked in the real IDE.

## 2026-11-09: on/off switch for the add-in in IDE Options

Shane asked for a toggle under Colour Theme that turns the add-in's extra styling on or off, on by default.

Added (add-in)
- "Enable additional IDE theme styling via add-in" under Colour Theme in IDE Options. A MutationObserver adds the row whenever the IDE builds the list (opening the dialog, filtering) and a WinUI3 theme is active. It reuses the dialog's own row and Yes / No classes, so it is a ToggleSwitch like the others.
- Switching it disables or re-enables the stylesheet at once through the style element's media attribute, without the dialog's Save Changes (as a WinUI ToggleSwitch does). A 1-second timer reads the change back and saves it with SaveSetting (HKCU, WinUI3IdeStyle\Options\Enabled); start-up reads it, defaulting to on.

Validated: the page script, extracted from MainModule.twin, parses and in a Chromium mock of IDE Options adds one row under Colour Theme, adds it again after the list is rebuilt, never twice, and switches the stylesheet off and on (media 'not all' / 'all'). Not yet compiled or run in the IDE: the twinBASIC side (SaveSetting, the timer) is untested.

## 2026-11-09: references tables, Shane's first look in 1043

Shane in 1043: "almost perfect". Left over: the Use ActiveX Controls tick boxes were still the IDE's, the ActiveX Fusion Mode drop-down ran into the Fusion: Async Events column, and the Available lists' unloaded symbols showed as bold blue "...".

Fixed (add-in)
- Every tick box in a references row (not only the Enabled column) is the WinUI CheckBox.
- The Fusion Mode drop-down is a 144px ComboBox centred in its 160px column, and the Async Events check box and its header share a 160px column.
- The click-to-load "..." symbol is an accent HyperlinkButton (the IDE's generic .clickable is bold blue).

Validated: Chromium mock with the fusion columns and an Available row (271 of 271 rules parsed). Not yet checked in the real IDE.

## 2026-11-09: Library References tables and Compiler Warnings list

Shane's screenshots of Project Settings: the references tables still had the IDE's grey grid look, and the Compiler Warnings drop-downs ran into the descriptions.

Fixed (add-in)
- Compiler Warnings: the combo box rule gave each warning's drop-down a 200px minimum inside the IDE's 110px column, so it spilled over the description. The drop-down now fills a 136px column, rows are a ListView (centred, divider between rows, neutral hover) in a bordered list, and the filter box is a TextBox.

Changed (add-in)
- Library References (Enabled Libraries, Available COM References, Available Packages) as a ListView in a bordered card with a column header: semibold 12px header with subtle column dividers, 36px rows with a divider and neutral hover, no grey grid lines, "in order of priority" no longer italic.
- The tick boxes (PNG divs, not inputs) drawn as the WinUI CheckBox; the drag grip uses the muted text colour.
- The symbol edit pencil and AUTO-FIX as HyperlinkButtons (new token --color-accent-link, AccentTextFillColorPrimary); a reference load error as a critical InfoBar instead of red on yellow.
- Import from file..., and the package and reference-type buttons, use the reference button; the available-list search box is a TextBox.
- The list colours themselves still come from the theme (DialogList* keys); only what the theme cannot reach is in the add-in.

Validated: Chromium mock with the IDE's 1043 styles.css, configEditor.css and injected tbps CSS plus both WinUI3 themes (266 of 266 rules parsed; previews settings-tables-dark/light.png and settings-tables-before-dark.png). Not yet checked in the real IDE.

## 2026-11-09: TextBox and ComboBox edges match the Gallery; menus clear the menu bar

Shane compared 1043 with the compiled WinUI Gallery (screenshots): text box and combo box borders showed as grey outlines, and the long Edit menu scrolled but covered the menu bar.

Fixed (add-in)
- TextBoxes, ComboBoxes and the settings filter boxes clip their fill to the padding box (WinUI's BackgroundSizing=InnerBorderEdge). The translucent 1px edge was painted over the fill, so it doubled up: 79 on a 66 fill in Shane's screenshot, where the Gallery draws 47 on a 45 fill over a 32 background. Measured after the fix in Chromium: edge 68 on a 65 fill over 54, top edge 72, text box bottom line 163, the same proportions as the Gallery.
- Menus are capped at the window height less 44px instead of 10px, so when the IDE moves a long menu up to fit it stops below the menu bar, as a WinUI MenuBar flyout does.

## 2026-11-09: settings dialogs, Shane's review fixes

Shane's comments on the previews: dark combo boxes not quite right, the toggle a little wonky, the restart notice should sit left of the switch, and the three-state Segmented control did not look right.

Changed (add-in)
- ComboBoxes everywhere: 6px top and bottom padding instead of WinUI's 5/7. Chromium centres the 18px line box differently from XAML, so the text sat 1px high.
- ToggleSwitch knob 10px from either outer edge (it was 9.5px off, 10.5px on, from the reference's 8.5px origin).
- IDE Options: "FULL IDE RESTART REQUIRED" sits left of the switch on the same line.
- Project Settings' No / Yes / Default: a horizontal RadioButtons group (reference radio) instead of a Segmented control.
- Project ID's refresh button now uses the same reference `.button` rules as the dialog buttons (masked elevation edge, hover and pressed fills); it had its own flat look.
- 233 rules, 51,577 characters.

Validated
- Chromium mocks of both dialogs, both themes: 233 of 233 rules parsed; switch clicks still toggle. Not yet checked in the real IDE.

## 2026-11-09: Options and Project Settings as WinUI settings pages

Shane (1043 screenshots of both dialogs): the dialogs should use NavigationView, ToggleSwitch instead of the `No | Yes` element, a correct ComboBox, and the reference's settings rows.

Added (add-in; 1043 builds both dialogs in script with their own injected stylesheets, `tips-style` with `tbis-*` classes for IDE Options and `tbps-style` with `tbps-*` for Project Settings, so no theme property reaches them)
- Left list as NavigationView items (as in the New / Open dialog): 36px, 4px corners, subtle hover, selected fill and accent indicator, muted counts. Filter box as a TextBox. The nav's grey edge is a divider.
- Groups as the reference's settings list: a 14px semibold header over one card (`CardBackgroundFillColorDefault`, `CardStrokeColorDefault`, 4px corners) of 64px rows, 600 titles, 12px muted descriptions, control on the right. The row divider stays the themes' `DialogConfigRowBorderBottom`.
- IDE Options' No / Yes as a ToggleSwitch (reference `.toggle`): 40x20 track, knob 12px (14px on hover, 17px wide pressed), accent when on, Off / On text to its left as in Windows Settings. The IDE's two segments stay as invisible click targets over the switch and its text; the selected one ignores the pointer, so a click always selects the other.
- Project Settings' No / Yes / Default as a Segmented control: its third state is "use the default", whose value only the script knows, so a two-state switch would lose it.
- ComboBoxes in both dialogs: the dialogs' `padding: 4px 6px !important` pushed the text under the chevron; WinUI padding now wins. Number fields as a NumberBox with inline chevron spin buttons. Refresh button as a Button, references tabs as a SelectorBar, the edition banner and "FULL IDE RESTART REQUIRED" as caution InfoBar colours, option errors as critical.
- New tokens `SystemFillColorCautionBackground` and `SystemFillColorCriticalBackground`. 229 rules, 50,898 characters.

Validated
- Chromium mocks of both dialogs built from the 1043 builder functions' class names, with each dialog's injected CSS (extracted from main.js), `configEditor.css` and both theme variable sets: 229 of 229 rules parsed. Clicking an off switch turns it on, clicking again turns it off, clicking its Off / On text toggles it. `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: separate TabView Designer candidate

- Added the separately installed TabViewDesigner add-in for tbUI3 1.0.0.61. WinUI3IdeStyle, its CSS and themes are unchanged.
- Implemented direct-parent insertion through the native BETA 1043 paste path, header hit-testing, designer-only page hiding, Properties reveal, delete/reorder commands, pending-work guards, undo requests and cleanup/recovery. Script generation embeds the adapter in the canonical project with Chr(34) quoting.
- Added regression checks, an optional actual-IDE paste-contract check, and TabViewDesigner/README.md. Full IDE-loop validation remains pending; evidence is in ../docs/validation/2026-11-09-tabview-candidate.md.

## 2026-11-09: disabled Preview button greys out

Shane's 1043 screenshot with the add-in loaded showed the toolbar, menus and New / Open dialog working (`163 of 163 rules parsed`), with Preview in red text while disabled in code view.

Fixed (add-in)
- A disabled Preview button now uses `TextFillColorDisabled` like every other disabled toolbar button. The IDE marks it disabled with a red background, which earlier passes turned into red text.

## 2026-11-09: long menus no longer run off the window

Shane: large menus (the Edit menu) were cut off by the window.

Fixed (add-in)
- Menus and context menus are capped at the window height less 10px and scroll, as WinUI's MenuFlyout does (it moves the flyout to fit and scrolls what is still too tall). The IDE already moves a menu up to fit, but a menu taller than the window ended up above the top edge, and its own max-height fallback is set without a unit, so it never applied. WinUI's 32px items made the IDE's longer menus taller than many windows.

Validated
- Chromium, 600px window, 30-item menu opened under the menu bar with the IDE's own positioning code: the menu sits at 7px to 597px and scrolls (before the fix it started above the window). 163 of 163 rules; `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: original glyphs for comment, indent, align and size

Shane: these buttons "need to probably stick with the original glyphs that tB used because they relay more information visually as to their function than the Fluent ones" (with a screenshot of comment, uncomment, indent, outdent, the four align and the four size buttons).

Changed (add-in)
- Those 12 buttons keep the IDE's own images and colour filters (16px, 19px for align and size, as the IDE draws them) inside the CommandBar button shape and hover states. Their Fluent SVGs are removed; 19 toolbar buttons still use Fluent icons.
- The exclusions use attribute selectors, not ids, so the rule's specificity stays below the IDE's `#menuBarPreview` width (an id-based first try made Preview and the theme button overlap in the mock).
- 163 rules, 40,478 characters.

Validated
- Chromium mock, both themes: 163 of 163 rules parsed; the 12 buttons show the IDE's glyphs; `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: toolbar card like the new Outlook's simplified ribbon

Shane pointed at the new Outlook's ribbon. That ribbon is web Fluent UI (Outlook runs in WebView2), not a WinUI 3 control, so its look carries over to the IDE's HTML directly. Shane agreed to the CSS-only version now and a tabbed ribbon as a roadmap idea.

Changed (add-in)
- The toolbar is a card floating on the window background: `CardBackgroundFillColorDefault` fill, `CardStrokeColorDefault` border, 8px corners and Fluent's shadow4, inset 4px from the edges. Group separators have 6px gaps either side. Buttons, icons and states are unchanged.
- 173 rules, 46,238 characters. The bar now needs about 1610px for one row.

Validated
- Same Chromium mock as the CommandBar entry, both themes: 173 of 173 rules parsed, `twinproj-src.mjs compare` all same. Not yet checked in the real IDE.

## 2026-11-09: toolbar as a WinUI CommandBar with Fluent icons

Shane: the toolbar "needs to be restyled to look like whatever WinUI3's version of a Ribbon is and replace all the icons with their Fluent equivalents where possible." WinUI 3 has no Ribbon control (the Community Toolkit Labs Ribbon is experimental); its command surface is CommandBar, so the toolbar follows CommandBar, AppBarButton, AppBarToggleButton and AppBarSeparator (`CommandBar_themeresources.xaml`, `AppBarButton_themeresources.xaml`, reference `.command-bar`, `.appbar-button`, `.appbar-separator`).

Added (add-in; the toolbar's icon images and filters are hard-coded in `styles.css`, so no theme property reaches them)
- Every built-in toolbar button is an AppBarButton with collapsed label: 40px tall, 36px wide, 16px icon, a 4px-corner hover plate inset 6px 2px (`AppBarButtonInnerBorderMargin`), `SubtleFillColorSecondary` hover, `SubtleFillColorTertiary` press, `TextFillColorDisabled` when disabled. The IDE's image and colour filters are cleared.
- 31 icons replaced with Fluent UI System Icons (MIT, Microsoft), drawn as masks in the text colour. Run is `SystemFillColorSuccess` green and Stop `SystemFillColorCritical` red while enabled.
- The grid toggle is an AppBarToggleButton: accent fill with on-accent icon when on, instead of a white outline.
- Separators are 1px `DividerStrokeColorDefault` lines with 8px vertical margins. The two drop-downs are 32px ComboBoxes. Preview is a labelled AppBarButton.
- Buttons that other add-ins put on the toolbar (`addinButton-*`) keep their own image or caption and get only the shape, size and hover states.
- The toolbar panel's header padding is removed so the bar is 40px tall.
- New `tools/build-toolbar-icons.mjs` maps toolbar ids to Fluent icons and writes `css/winui3-ide-icons.css`; the 31 SVGs and Microsoft's MIT licence are in `WinUI3IdeStyle/icons/fluent/`. `build-addin-css.mjs` now reads both .css files.
- 173 rules, 45,911 characters.

Validated
- Chromium with 1043's `styles.css`, `formDesigner.css`, `codicon.css`, the toolbar markup from `main.htm` inside a panel header, both theme variable sets and a text-only add-in button: 173 of 173 rules parsed, every icon's mask resolves, the bar is 40px tall and one row at 1640px wide (it needs about 1530px; the IDE's own icons needed about 1160px, and narrower windows wrap to a second row as before). `twinproj-src.mjs compare` reports every entry the same. Not yet checked in the real IDE.

## 2026-11-09: New / Open Project dialog as a NavigationView

Shane: the New / Open dialog "needs to look like a NavigationView".

Changed (themes)
- `DialogNavButtonBackColorSelected` is `SubtleFillColorSecondary` (rgba(255,255,255,0.0588) dark, rgba(0,0,0,0.0353) light), the reference's `--color-neutral-selected` and NavigationView's selected item fill.

Added (add-in)
- The dialog (`#fp2root`, 1043) injects its own stylesheet with fixed colours, so the add-in's rules are prefixed `body #fp2root` and win whichever loads last.
- Left rail as NavigationView (reference `.nav-item`, `.nav-indicator`): 36px items with 4px corners inset 2px 4px, 16px icon in a 40px column, 14px regular label, subtle hover, selected fill and the 3x16 accent selection indicator; icons in the text colour; counts as muted caption text; divider instead of the fixed grey border.
- Search box as AutoSuggestBox: TextBox shape and states with the query glyph on the right.
- Version badge as a quiet caption tag instead of a white pill with black text.
- Template tiles as GridView items on cards: no blue hover border, shadow or brightening; `ControlFillColorSecondary` hover, `ControlFillColorTertiary` press, 2px accent border when selected. Card fill, border and radius still come from the themes.
- Recent rows as ListView items with the accent selection indicator and a subtle 24px remove button; search group titles as 14px semibold sentence case.
- 114 rules.

Validated
- Chromium with 1043's `styles.css`, `codicon.css`, the dialog's own injected CSS (extracted from main.js) and both theme variable sets, with the add-in's style element placed before the dialog's to prove order independence: 114 of 114 rules parsed; rail items 36px with the selected fill from the theme and the accent indicator; search box 32px; hovered card rgba(255,255,255,0.082) with no filter and its theme border; screenshots checked. Not yet run in the IDE.

## 2026-11-09: glyph colours

Shane spotted wrong-coloured glyphs on 1043 with the add-in loaded: the info icon in message boxes and the Theme icon in the Window menu.

Fixed (themes)
- `InfoBoxIconFilter`: the info icon is a white PNG that the inherited IDE Dark theme inverts to black. WinUI3 Dark now shows it at `TextFillColorSecondary` (`opacity(0.7725)`), WinUI3 Light inverts it to black at `TextFillColorSecondary` (`invert(1) opacity(0.6196)`).

Fixed (add-in, no theme property)
- The Theme menu glyph (`.codicon-symbol-color`) is hard-coded black with `!important`; it now takes the menu text colour.
- Panel header buttons (the `...` and close glyphs) turned black on a translucent white square when hovered; they now use WinUI's subtle button hover (`SubtleFillColorSecondary`, `TextFillColorPrimary`, 4px corners). 77 rules.

Validated
- Chromium with 1043's CSS: info icon filter as above in each theme; Theme glyph white (dark) and rgba(0,0,0,0.894) (light), matching its menu item; hovered panel button white on rgba(255,255,255,0.06) in dark with no outline.

## 2026-11-09: New Project Options dialog

Shane asked whether the themes can fix the New Project Options dialog (white Project Name box, native blue check boxes, grey-bordered drop-down) before the add-in loads.

Finding
- No. In 1043 that dialog's controls use no theme variables: the Project Name box is an `<input>` with no `type` attribute (so the IDE's `input[type="text"]` rules, and the add-in's, never matched it), the check boxes are native `.IDEoptionCheckbox` scaled to 1.2, and `.IDEoptionDropdown` has a hard-coded grey border. A theme value becomes a CSS variable inside the IDE's own declarations, so it cannot add rules. Only the add-in can reach them.

Fixed (add-in)
- `.IDEoptionValue input:not([type])` is now styled as a TextBox (rest fill from the add-in, since no theme property reaches it), and `input.IDEoptionCheckbox` as a CheckBox (the 1.2 scale removed). `select.IDEoptionDropdown` was already covered. 75 rules.

Validated
- Chromium with 1043's CSS on a mock of the dialog's markup (taken from `showNewProjectOptions` in main.js): Project Name 32px, rgba(255,255,255,0.06) with white text in dark and rgba(255,255,255,0.7) in light, 4px corners; check box 20px accent with no scale; drop-down styled.

## 2026-11-09: theme first, and theme colours aligned with the reference tokens

Shane's rule: anything a theme property can do belongs in the theme; the add-in only covers what the themes cannot. Every add-in rule was checked against the 1043 theme properties.

Changed (themes)
- Text boxes in Options and dialogs rest on `ControlFillColorDefault` (rgba(255,255,255,0.0588) dark, rgba(255,255,255,0.702) light) instead of `ControlFillColorInputActive`, matching the reference's `.text-field` rest state.
- Scroll bar thumbs use the reference's thumb colours: `TextFillColorTertiary` (0.5294 dark, 0.4471 light), and `TextFillColorSecondary` for the dialog thumb hover.
- Light tab hover is `LayerOnMicaBaseAltFillColorSecondary` #0A000000, the reference's `--color-tab-hover`.

Changed (add-in)
- The text box rule no longer sets the rest fill and text colour, and the tooltip rule no longer sets its fill and text colour; both now come from the themes. The simple input box (no theme property) keeps an add-in rest fill. 75 rules.

What stays in the add-in, because 1043 has no theme property for it: shapes, sizes, padding and fonts of every control; the dark menu (item text is hard-coded black); menu bar hover; progress bar; dialog button hover, pressed and accent default button (one text colour is shared by all buttons); the code navigation drop-downs' text (hard-coded #202020); text box hover, focus and bottom edge; check boxes and radio buttons; scroll bar width, arrows and hover for the main scroll bars; tooltip shape.

Validated
- Chromium with 1043's CSS: 75 of 75 rules parsed; text boxes rgba(255,255,255,0.06) dark and rgba(255,255,255,0.7) light at rest from the theme, focus unchanged; tooltip #2C2C2C and #F9F9F9 from the theme.

## 2026-11-09: themes: dialog button hover no longer turns white without the add-in

Shane noticed that before the add-in loads, hovering a dialog button in WinUI3 Dark turned it near-white with unreadable text.

Fixed
- The IDE hard-codes `.msgBoxButton:hover { background-color: #ebeff5 }`, which beats the theme's flat `DialogButtonsBackColor`. Aurora avoids it by using a gradient, which paints over the background colour. `DialogButtonsBackColor` and `DialogButtonFocusBackColor` are now single-colour gradients (#2D2D2D dark, #FBFBFB light), so the hover keeps the button's fill with the IDE's `brightness(1.3)` hover filter (#3A3A3A in dark). The add-in's own button rules still replace this when it is loaded.

Validated
- Chromium with 1043's `styles.css` and the theme variables only (no add-in): hovered buttons keep the gradient over the #EBEFF5 colour, with white text in dark and #1A1A1A in light.

## 2026-11-09: drop-downs, check boxes, scroll bars and tooltips from the reference

Shane confirmed the reference-based buttons are right on 1043 and asked to bring the rest of the UI in line.

Added (all from winui-baseline.css, commit 20b438a, mapped onto the IDE's own elements)
- Drop-downs as `.select-field` (ComboBox): padding 5px 32px 7px 12px, 32px, 4px corners, token fills for rest, hover and pressed, a 12px chevron 12px from the right in `TextFillColorSecondary` (an SVG, since a `select` cannot carry the reference's `::after` glyph), and `color-scheme` so the open list follows the theme. A `select` cannot carry the edge ring either, so the elevation border is a solid border with `ControlStrokeColorSecondary` on the top (dark) or bottom (light). Covers Options, the find panel, the web page zoom, the toolbar and the code navigation drop-downs; the last two stay compact. The code navigation drop-downs' hard-coded #202020 text is overridden, so they are dark in WinUI3 Dark.
- Check boxes and radio buttons as `.choice input` (CheckBox, RadioButton): 20px, 4px corners or round, `ControlAltFillColor` fills, accent when checked, a 12px tick drawn as an SVG mask in the shape of the CheckMark glyph (no dependency on the Segoe Fluent Icons font), radio dot 12px, 14px on hover, 10px pressed. Covers Options, project settings and the find panel's scope options.
- Scroll bars as the reference's `*::-webkit-scrollbar`: 8px, transparent track, no arrow buttons, pill thumb inset 3px that widens to 1px under the pointer. The thumb stays visible at rest (the reference hides it until its container is hovered, which in the IDE's nested panels would show every scroll bar at once). Monaco's own scroll bars are not affected.
- Tooltips (`#hoverTooltip`) as `.tool-tip`: padding 6px 9px 8px, 12px, 4px corners, flyout fill and border, max width 320px, no shadow.
- Tokens: `ControlAltFillColor` Secondary, Tertiary and Quarternary, `ControlStrongStrokeColorDisabled`, accent disabled colours, and the chevron image per theme.
- 74 rules.

Validated
- Chromium with 1043's `styles.css`, `configEditor.css` and both theme variable sets, with the CSS passed through the add-in's JavaScript string escaping and `window.eval` exactly as the add-in does: 74 of 74 rules parsed. Toolbar and code navigation drop-downs rgba(255,255,255,0.06) with white text and `color-scheme: dark` in WinUI3 Dark; Options drop-down 32px; checked box #60CDFF (dark) and #005FB8 (light) with the tick visible; tooltip #2C2C2C and #F9F9F9, 12px; scroll bars 8px. Screenshots checked. Not yet run in the IDE.

## 2026-11-09: dialog buttons from the reference's .button

Shane's first run of the menus, tabs and text boxes (`check: 49 of 49 rules parsed`) showed the dialog buttons were still the hand-built ones, not his reference library's.

Changed
- Dialog buttons now use the reference's `.button` and `.button--primary` rules (winui-baseline.css, commit 20b438a) instead of hand-composited colours. The fill is the translucent `ControlFillColorDefault`/`Secondary`/`Tertiary` tokens. The border is the reference's masked edge ring: the real border is transparent and a `::before` ring paints `ControlElevationBorderBrush` as a 3px gradient (lighter top in dark, darker bottom in light), keeping the 4px corners. Pressed flattens it to `ControlStrokeColorDefault`. The default button (`.buttonFocused`) is `.button--primary`: accent fill, `AccentControlElevationBorderBrush` ring, no ring when pressed.
- Added the tokens these rules need: `--color-control-active`, `--color-control-border-bottom`, the accent hover, pressed, text and border colours, `--brush-control-elevation` and `--brush-accent-elevation`. Accent hover and pressed are written as 90% and 80% alpha colours rather than the reference's `color-mix()`, in case the IDE's Chromium is older.
- 45 rules (the per-theme button rules collapsed into shared ones driven by tokens).

Known
- The New / Open Project dialog never marks a default button (the IDE only adds `.buttonFocused` in some dialogs), so its Open button stays a normal button. Making it accent would need the add-in to pick the button by caption or id; not done.

Validated
- Chromium with 1043's `styles.css` and both theme variable sets: 45 of 45 rules parsed; buttons 32px, 14px regular; dark rest rgba(255,255,255,0.06) with a #FFFFFF18 top edge fading to #FFFFFF12; Open #60CDFF with black text and a #00000023 bottom edge; light Open #005FB8 with white text and a #00000066 bottom edge. Screenshots checked against WinUI Gallery's Button page.

## 2026-11-09: menus, tabs and text boxes from the WinUI HTML/CSS reference

Shane shared his WinUI HTML/CSS reference library (Arrow-Loop/twinBASIC-Knowledge, branch `feature/winui3-html-css-js-reference`, `reference/winui-html`, commit 20b438a) so the add-in can reuse it instead of rebuilding WinUI controls from scratch.

Added
- `WinUI3IdeStyle/css/winui3-ide.css` is now the stylesheet's source, with the WinUI resource and reference rule each value comes from. `tools/build-addin-css.mjs` turns it into `src/Sources/WinUI3IdeCss.twin`: one rule per line, long rules split over several twinBASIC lines, `RuleCount` written as a number. It stops on double quotes, nested blocks such as `@media`, and selectors not prefixed with `body`.
- The reference's colour tokens (`--color-text`, `--color-control`, `--color-flyout`, `--color-divider` and so on) for light and dark, scoped to `body:not(.darkMode)` and `body.darkMode`.
- Menus and context menus as WinUI MenuFlyout, mapped from the reference's `.flyout-menu`: #2C2C2C (dark) or #F9F9F9 (light), 1px `SurfaceStrokeColorFlyout` border, 8px corners, 2px vertical padding; items 32px with 4px corners, inset 2px 4px, 14px Segoe UI Variable, icon column at 11px with text at 39px, `SubtleFillColorSecondary` hover, `SubtleFillColorTertiary` press. Shortcut text is muted 12px; disabled text uses `TextFillColorDisabled`; `<hr>` separators are 1px `DividerStrokeColorDefault` with 4px 6px margins. The IDE's red keyboard highlight (`.focusedMenuItem`) is replaced with the hover fill. This makes menus dark in WinUI3 Dark, which the theme alone cannot do (the IDE hard-codes black item text).
- Editor tabs shaped like the reference's `.tab-view__item`: 8px top corners, 8px left and 4px right padding, 12px regular text, `TextFillColorSecondary` until selected, 1px divider separators 8px from top and bottom between unselected tabs, and a 4px-cornered close button with a subtle hover.
- Text boxes in dialogs and Options as WinUI TextBox, from the reference's `.text-field` and `.text-control`: 32px, padding 5px 6px 6px 10px, 4px corners, `ControlFillColorDefault` with a `ControlStrongStrokeColorDefault` bottom edge, `ControlFillColorSecondary` hover, `ControlFillColorInputActive` with a 2px accent bottom edge when focused, disabled colours. Property sheet inputs are not touched.
- 49 rules in all (was 26).

Kept on purpose
- The IDE's tab height and strip layout are kept; the reference's 36px Edge-measured height and concave tab feet need DOM the IDE does not have.
- No acrylic blur or shadow on menus (the reference uses none either).
- Drop-down lists (`select`) in Options and the code navigation drop-downs are not restyled yet.

Validated
- In Chromium with 1043's `styles.css`, `configEditor.css`, `codicon.css` and both WinUI3 theme variable sets, on a mock of the IDE's menu, tab and Options markup: 49 of 49 rules parsed; menu #2C2C2C dark and #F9F9F9 light with 8px corners and 14px text; items 32px, hover rgba(255,255,255,0.06) dark; keyboard-focused item no longer red; separators 1px; tabs 12px with 8px corners and muted text until selected; text boxes 32px with a 2px #60CDFF (dark) or #005FB8 (light) bottom edge when focused. The dialog button test from the previous entry still gives the same values.
- `tools/twinproj-src.mjs compare` reports all four project entries the same as `src/`.
- Not yet run in the IDE.

## 2026-11-09: dialog buttons follow WinUI Button and ContentDialog

Shane's first working run on 1043: the add-in's stylesheet is on the page (`check: 18 of 18 rules parsed`) and button hovers are right, but the buttons did not look like WinUI's (his side-by-side with WinUI Gallery's Button page).

Changed
- Dialog buttons take WinUI's Button shape: 32px tall, `ButtonPadding` 11,5,11,6, 4px corners, 14px Segoe UI Variable (`ContentControlThemeFontFamily`), regular weight, no margin. The command area uses `ContentDialogPadding` 24 and `ContentDialogButtonSpacing` 8.
- The button Enter presses (`.buttonFocused`, the dialog's accept button) is drawn as WinUI's AccentButtonStyle, the way ContentDialog draws its default button: accent fill (#60CDFF dark, #005FB8 light), on-accent text, the accent elevation border, 90% and 80% accent on hover and press. The IDE's white focus ring around it is removed, since WinUI shows no ring for default status.
- Pressed text and border corrected to current microsoft-ui-xaml values (`TextFillColorSecondary` #C5FFFFFF and #9E000000, `ControlStrokeColorDefault` #0F000000 light); the earlier values were from an older WinUI release.
- `RuleCount` is now counted from the stylesheet (26 rules).

Kept on purpose
- WinUI stretches ContentDialog's buttons into equal columns. The IDE's own layout (Browse on the left, Open and Cancel on the right, minimum widths) is kept.
- The accent is the default Windows blue. Shane's Windows accent is different; reading the system accent is an exploratory roadmap item.

Validated
- In Chromium with 1043's `styles.css` and the WinUI3 Dark theme variables: Browse and Cancel 32px, #2D2D2D, white 14px text, border top rgba(255,255,255,0.094) and others 0.07; Open #60CDFF with black text and a rgba(0,0,0,0.137) bottom border, no outline; Cancel hover #323232.

## 2026-11-09: all page writes through window.eval

Fixed
- The stylesheet was never on the IDE page. Shane's run of the eval check reported `no style element on the page` right after `updated the existing style element`: on BETA 1033/1043, a write through a property path (`ownerDocument.getElementById(id).textContent = css`) reports success even when `getElementById` returns null, so `SetStyleText` always returned True and the `insertAdjacentHTML` branch never ran. The earlier `stylesheet removed` line was the same false success.
- The add-in now adds, updates and removes its `<style>` element with one `window.eval` call each (the route the designer bridge probe proved), passing the CSS as an escaped single-quoted JavaScript string, and logs what the page returned.

Validated
- The exact apply, check and remove scripts the add-in builds, run in Chromium against 1043's `styles.css`: `added the style element`, `updated the style element`, `18 of 18 rules parsed, 1940 characters, body.darkMode = true, selected menu item background = rgba(255, 255, 255, 0.043)`, `stylesheet removed`.

## 2026-11-09: page check through window.eval

Changed
- The `check:` read-back now runs one JavaScript expression through `ownerDocument.defaultView.eval`, the route the designer bridge probe proved on 1043. It also moves the style element to the end of `<head>` on every apply, and tests one rule for real: a temporary hidden `.menuItem.isMenuItemSelected` element's computed background (rgba(255, 255, 255, 0.043) when the add-in's rule wins in WinUI3 Dark).

Found
- Shane's run with the two-second re-check: `updated the existing style element` and `stylesheet applied (1940 characters)` succeed, but reading values back through property paths (`getElementById(...).sheet.cssRules.length`) fails with &H80004005 Unspecified error, and the menu highlight still looked like the IDE's own, so whether the rules take effect is still open.

Validated
- The check expression run in Chromium on a mock page with 1043's `styles.css` and the add-in's CSS returns `18 of 18 rules parsed, 1921 characters, body.darkMode = true, selected menu item background = rgba(255, 255, 255, 0.043)`.

## 2026-11-09: re-check two seconds after loading

Changed
- The add-in re-checks the theme and re-applies its stylesheet two seconds after start-up and after each project load, using the package's `AddinTimer`. Shane found the Debug Console empty after opening a project with the add-in and a WinUI3 theme loaded: in 1043 the IDE loads add-ins, then restores the project's state, and the console can be cleared in between (`clearDebugConsole`), so the first lines were lost and whether the stylesheet was applied at that point could not be seen.

## 2026-11-09: detailed Debug Console log

Changed
- The add-in now logs its architecture and the IDE compiler version on load; the reason, theme name and theme group for every check (start-up, project loaded, theme changed, with the event's own value); each step (tool window created, style element added or updated); and, after applying, a read-back from the IDE page: rules parsed out of the expected 18, whether `body.darkMode` is set, and the id of the last element in `<head>`. Failures name the step and the error number. Asked for by Shane.

## 2026-11-09: add-in reads the theme name on theme changes

Fixed
- `Host_OnChangedTheme` receives only the theme group (`dark` or `light`; 1043's `notifyChangedTheme` sends `getBaseThemeName()`), so switching to WinUI3 Dark logged `theme is dark` and never applied the stylesheet. The add-in now ignores that argument and reads `Host.Themes.ActiveThemeName`.

Validated
- Shane's log after switching to Dark showed `stylesheet removed`, which only happens after the stylesheet element was added, so injecting the stylesheet into the IDE page works on BETA 1043 (win32).

## 2026-11-09: add-in matches the theme name without case

Fixed
- Shane's run on BETA 1043 showed the add-in loads (`[WinUI3 IDE Style] loaded`) but the IDE reports the active theme as `winui3 dark`, in lower case, so the case-sensitive `WinUI3` prefix check never matched and no stylesheet was applied. The check now ignores case.

Validated
- Confirmed on Shane's PC (BETA 1043, win32 compiler): the add-in loads when a project opens and receives the theme name. Styling itself is not yet confirmed.

## 2026-11-09: BETA 1043

Changed
- Both themes target BETA 1043 (Dark 232 properties, Light 227). Added 1043's three new properties: `DialogImportListHoverBackColor` and `DialogImportListHoverForeColor` (the import dialog's list hover, WinUI ListViewItem `SubtleFillColorSecondary` hover with `TextFillColorPrimary` text) and `DialogTickForeColor` (dialog check marks, `TextFillColorPrimary`). Without them WinUI3 Dark inherited black check marks and a near-white hover with black text on its dark dialogs.
- Removed `FrontPageListBackground`, which no BETA since 1033 uses.

Findings (BETA 1043's `ide/` against 1033's)
- 1043 adds those three properties and removes none. `applyThemeData` is unchanged. `formDesigner.css`, `configEditor.css` and `main.htm` are unchanged.
- Every selector the add-in targets is still in `styles.css`, and the tool window and property-walking code it relies on (`createToolWindowById`, shadow root, `toolWindowElementGetProperty`, `toolWindowElementSetProperty`) and add-in loading on project open are still in `main.js`.

Validated
- Both files parse with 1043's `applyThemeData` (copied): no dropped lines of ours. Every value passes Chromium's `CSS.supports` for its property against 1043's stylesheets, apart from the same main.js-only properties and indent-guide colours as before.
- Not yet tested inside the IDE.

## 2026-11-09: add-in logs when it loads

Changed
- `WinUI3IdeStyle` now prints `[WinUI3 IDE Style] loaded` when the IDE loads it and `theme is <name>` for the active theme and each theme change. Before, it printed nothing unless a WinUI3 theme was active, so on Dark or Light there was no way to tell whether it had loaded.

Found
- Shane's first run (BETA 1043): with a project open and the Dark theme, other add-ins' buttons (Global Search, Designer probe) appear, but the Add-ins menu still says "no addins loaded" and the add-in printed nothing, which this change makes testable. The themes target 1033 and have not been re-checked against 1043.

## 2026-11-01: designer bridge probe (research, no add-in change)

Validated by Shane on BETA 1033 with a throwaway add-in (`../docs/research/2026-11-01-multipage-designer/probes/DesignerBridgeProbe/`):
- `ownerDocument.defaultView.eval(js)` runs in the IDE page and returns its value synchronously. A `<script>` element appended through the bridge did not run, and an inline `onerror` handler ran, but only asynchronously.
- The form designer's functions are page globals (`addControl`, `preparePaste`, `deserializeControls`, `doPaste`, `executeIdeCommand` and others). The open designer's state is `getCurrentFormEditorGlobals()`.
- Inserting a page control's JSON through the designer's own insert steps, plus `undoPoint`, created a real control inside the selected container: named, selectable, one-step undo, and kept after save and reopen.

## 2026-10-30: moved into tbUI3, WinUI3 IDE Style add-in spike

Added
- This `tbIDE/` folder in tbUI3, holding the two themes and their generator (moved from the project's shared files; regenerating gives byte-identical .theme files) and the new add-in.
- `WinUI3IdeStyle` add-in spike, written in twinBASIC against the IDE Extensibility Package (`tbIDE`). It adds one stylesheet to the IDE page while a theme whose name starts with `WinUI3` is active and empties it for any other theme. The stylesheet has 18 rules for WinUI Button hover and pressed states on dialog buttons, a WinUI ProgressBar for the progress dialog, and WinUI MenuBarItem hover on the menu and status bars. Values come from microsoft-ui-xaml `Button_themeresources.xaml`, `ProgressBar_themeresources.xaml` and `MenuBar_themeresources.xaml` (main branch, read 2026-10-30).
- `tools/build-addin-project.mjs`, which built the first `WinUI3IdeStyle.twinproj` from `src/` using the IDE's Sample 11 add-in project as the binary container.

Findings (from BETA 1033's `ide/main.js`)
- An add-in tool window's body is in a shadow root attached to an element on the main IDE page, so `ownerDocument` from its `RootDomElement` is the IDE page.
- `toolWindowElementGetProperty` and `toolWindowElementSetProperty` walk any property path from the element and call functions along the way. (Superseded 2026-11-09: in practice, writes through such a path report success without changing the page; use `ownerDocument.defaultView.eval`.)

Validated
- `twinproj-src.mjs compare` shows the built project and `src/` match (4 of 4 files the same).
- The 18 rules parse in Chromium and, layered on BETA 1033's `styles.css` in a mock page, win over the IDE's rules in both dark and light: hovered dialog button #323232 (dark) and #F6F6F6 (light) with no filter, progress indicator 3px at #60CDFF or #005FB8 on a 1px track, menu fills as listed.
- Not yet compiled or run. Shane builds it in the IDE (win32 and win64) using the check list in README.md.


## 2026-10-30: BETA 1033, after Shane's first look

Fixed
- New Project cards: every card had a blue outline, because 1033 draws all cards with `FrontPageSelectedItemBorder`. It is now a faint stroke, so only the selected card (fixed white border and blue outline) stands out.
- WinUI3 Dark progress bar track is dark (#2D2D2D) with white text instead of white.

Found (hard-coded in 1033, not reachable by a theme)
- Dialog button hover is a fixed near-white `#ebeff5`, which is why hovers flash white in WinUI3 Dark.
- The progress bar fill is a fixed green gradient with a white text glow and a grey outline.
- Panel headers are fixed bold.

## 2026-10-30: BETA 1033

Changed
- Both themes now target BETA 1033 (Dark 228 properties, Light 225).
- Dialogs follow WinUI's ContentDialog using 1033's new dialog properties: 8px corners, SurfaceStroke border, content and command-area colours, 4px-rounded buttons with elevation borders and a focus ring, accent tab underline, themed text inputs, lists, nav rail and dialog scrollbars. WinUI3 Dark's dialogs are now dark (previously forced light).
- Docked panels are rounded cards: `DockContainerBorderRadius` 8px, `DockContainerMargin` 2px (4px gaps), a faint outline, layer background; `DockBorder` and the panel borders are now 0.
- Code editor text area set with the new `MonacoBackground` (#1C1C1C dark, #FFFFFF light), and the gutter matches it.
- New Project front page: rounded cards, accent selected border and icon colour.
- Removed the `Light_scroll*` lines, which 1033 dropped in favour of `DialogScroll*`.

Findings (from twinBASIC BETA 1033's `ide/main.js` and stylesheets)
- 1033 adds 51 theme properties (dialogs, modal border and radius, dock container radius, margin and outline, `MonacoBackground`, progress bar, front page, tick icons) and removes 3. The theme parser is unchanged.
- Still hard-coded in 1033: context menu item text, code navigation drop-down text, title and dialog title text, menu bar hover, property category text, and a few Options-page texts.
- The new front page builds its CSS in `main.js` and reads `DialogNavBarBackColor`, `DialogNavButtonBackColorSelected`, `FrontPageIconColor` and `FrontPageSelectedItemBorder` there. `FrontPageListBackground` is no longer used.

Validated
- Both files parse with a copy of 1033's `applyThemeData`: no dropped lines; every property is used by 1033's CSS or main.js.
- Every value passes Chromium's `CSS.supports` for its CSS property, except the six used only in main.js-built CSS and the two indent-guide colours, which were checked by hand.
- Not yet tested inside the IDE.

## 2026-10-20

Added
- `themes/WinUI3 Dark.theme` (inherits Dark, 182 properties) and `themes/WinUI3 Light.theme` (inherits Light, 180 properties), using WinUI 3 colour tokens from `Common_themeresources_any.xaml` with the default blue accent.
- `tools/build-themes.mjs`, which generates both files with a token comment on each line and refuses values the IDE parser would mangle.
- `README.md` with how IDE themes work, install steps, a check list and known limits.

Findings (from twinBASIC BETA 1015's `ide/main.js` and stylesheets)
- Each theme property becomes a `--theme<Name>` CSS variable. Themes load from the IDE's `themes` folder and from `%APPDATA%\twinBASIC\themes`.
- Context menu item text, code navigation drop-down text, dialog contents, title text, caption buttons and property category text are hard-coded, which is why some surfaces stay light or dark regardless of theme.
- The shipped Dark and Light themes lose `DiagnosticsGroupFontSize` and `DiagnosticsGroupFontWeight` to a missing semicolon; both new themes set them again.
- The shipped Light theme draws debug console suggestions in near-white text on a near-white pop-up (`GeneralTextColorProminent`); WinUI3 Light fixes that.

Validated
- Both files parse with a copy of the IDE's own `applyThemeData` parser: no dropped lines, and every property name exists in the shipped themes.
- Every value passes Chromium's `CSS.supports` for the CSS property it feeds (the two indent-guide colours are used inside a larger `box-shadow`, so they were checked by hand).
- Not yet tested inside the IDE. Shane's check on his PC is pending.
