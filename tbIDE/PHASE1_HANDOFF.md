# Phase 1 handoff and native acceptance

**Current checkpoint: 2026-11-24.** [INSTALLATION_MANAGER_SPEC.md](INSTALLATION_MANAGER_SPEC.md) defines approved scope; [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md) defines interfaces; [CHANGELOG.md](CHANGELOG.md) retains historical fixes and evidence. Phase 1 remains the combined updater, embedded provisioning and Welcome Wizard internal IDE prerelease distribution gate. Phases 2/3 remain deferred.

## Internal prerelease distribution scope

The initial internally distributed IDE prerelease covers themes, optional styling, Classic/Hybrid/Ribbon, Welcome, provisioning and the standalone updater. The incomplete tbUI3 control package and TabView designer implementation remain in development and are not full-function acceptance gates for internal IDE prerelease distribution. The entire tbUI3/tbIDE project remains prerelease until the planned controls are complete and stable release is explicitly approved. General IDE functionality is permanently independent of the optional control package, not just for this distribution. Preserve their tooling in the add-in. Before distribution, verify that projects without an enabled, resolved tbUI3 reference (including no project and disabled/unresolved references) expose no tbUI3-specific designer commands or MultiPage UI in any toolbar mode and experience no designer interference. Verify switching between eligible and ordinary projects, reference removal/disable and restoration, plus normal form editing, save and reopen. The reference gate is implemented and covered by fixture tests in 0.4.0.6. Native in-IDE transition testing remains open.

## Current status and next action

The 0.4.0.5 add-in and 0.2.0.3 helper implement the standalone ownership boundary on `tbui3-dev`. Prior 0.4.0.2 live testing found delayed staging UI and shutdown timing failures. The 0.4.0.4 fixes remain represented in the native workflow and versioned process inspection. The revised bridge records the IDE's accepted close before tearing down its compiler. Run the remaining live matrix below in disposable installations before distribution.

In a disposable BETA 1043 installation, manual review worked with automatic checks disabled. Update on Exit armed before the first payload transfer, acknowledged native closure during extraction and completed the update to BETA 1045 with a completed journal. On this run, extraction and inventory hashing took 86 seconds for the new archive and 87 seconds for the previous baseline. Both full transfers were roughly one second or less. A separate BETA 1045 run showed the automatic notification, opened standalone review and completed Update Now for the published icon library after native IDE shutdown. The installed DAT and completed journal were verified. A subsequent due automatic check found no available updates and exited without a notification.

Native build evidence consists of the BETA 1045 Win32 updater and Win32/Win64 DLL builds, 62 passing updater self-tests and exact compiled-resource validation. The local package dry run produced the add-in ZIP, update manifest and checksums. The standard JavaScript suite passed, with its optional external IDE fixtures skipped.

## Delivered

Updater 0.2.0.3 and add-in 0.4.0.6. BETA 1045 built both DLLs for 0.4.0.6, and compiled PE checks verified both embedded bundles. The 62 native helper self-tests pass. The four pre-existing BETA 1045 Ribbon fixture failures block publication pending resolution or conclusive native acceptance. The BETA 1043 and 1044 fixture runs each pass all 256 tests. The configured compatibility range remains BETA 1043 through 1045. Major-zero version ordering and the documented historical version aliases remain supported.

- Per-user deployment, offline provisioning/repair services, recognized hash/version/protocol ledger, no downgrade/customized overwrite, explicit verified backups and shared locks.
- Standalone notification, review, preferences, cancellation, visible staging progress and recovery. The per-root launch/consent bridge binds native exit to the exact asset selection and the final verified plan. See INSTALLATION_CONTRACTS.md.
- Verified downloads, constrained native in-place transaction, durable backups/rollback/recovery and detached self-update. Scoped same-account UAC, independent privileged release/baseline verification and immutable inputs.
- Quill's functional Welcome view embedded unchanged through production bridge; actual theme/toolbar APIs, native preferences, async backup/reset confirmation, user-global first-run record and Options reopen. No simulated preview shipped.
- Canonical projects/mirrors, configuration generation, actual PE resource validation and release gates requiring both DLL architectures to contain exact accepted payloads.

## Build and verification sequence

For Windows development convenience, after building a changed helper and closing the add-in project, double-click `tbIDE/Prepare-Addin.bat`. It runs native self-tests and existing bundle preparation/validation using the portable Node cache. Reopen and build both add-in architectures, then double-click `tbIDE/Package-Release.bat` to create the verified prerelease assets and open their output directory. These launchers do not commit, push, publish or replace native startup/live acceptance.

1. Use the accepted tracked Win32 Updater.exe when its version, resources and project binding verify. Build it using BETA 1045 after any helper source change. Run its 62 unelevated self-tests and verify executable startup. Embed it with Prepare-Addin.bat, then reopen the canonical add-in project and compile both architectures.
2. Verify from the repository root: `node tbIDE/tools/verify-phase1-release.mjs <win32 DLL> <win64 DLL> tbIDE/Updater/Build/Updater.exe`. This checks actual DLL architecture/version, manifest identity, project digest and payload hashes. Do not proceed with missing or unequal resources.
3. Follow the embedded-bundle and focused native acceptance checklists below. Keep native output in `%LOCALAPPDATA%\tbUI3\Diagnostics\`; see [diagnostic locations](../docs/DIAGNOSTICS.md).
4. Repeat the updater build, self-tests and embedding whenever the helper project changes.
5. After acceptance, prepare (not publish) release assets: `tbIDE/tools/package-updater-release.ps1 -Win32Dll ... -Win64Dll ... -UpdaterExe ... -MinIdeBuild 1043 -MaxIdeBuild 1045 -Channel development`. Use a fresh, empty output directory (for example `-Output Build/Release-0.4.0.6`). It writes one versioned add-in ZIP containing both DLLs, schema-2 `tbUI3-update.json` listing only the add-in, and `SHA256SUMS.txt` covering the ZIP and manifest. The helper EXE is still required as a verification input, not a separate release asset. Check an add-in-only upgrade followed by startup provisioning of recognized older helper/themes and preservation of newer or modified resources.

Source regeneration: after changes to the IDE shutdown adapter run `node tbIDE/tools/build-updater-script.mjs`, then `node tbIDE/tools/sync-phase1-projects.mjs` to synchronize shared native modules, Wizard assets and canonical project mirrors. The latter does not generate an updater payload. Run the repository source/fixture tests, Wizard tests and `node tools/validate-tabview-projects.mjs` after applicable changes. A changed binary/project must be rebuilt and its acceptance evidence renewed.

## Loader evidence and compatibility boundary

Inspected **official BETA 1045 ZIP**, SHA-256 `20ef4efbd26fdb97a5214b4ddd75c553c875a0d45329b5e0c5fdd3f3373b9196` (42,832,930 bytes), without launching it. Its IDE main.js creates `%APPDATA%\twinBASIC\addins\win32|win64` and passes the common root to `RequestLoadAddins`. This establishes intended shared paths, not native DLL enumeration order or duplicate callback behavior. Native compiler DLLs expose add-in loading strings/interfaces, but static inspection does not establish exact precedence.

The new factory gate prefers the shared DLL when present, refuses legacy duplicate unified/predecessor DLLs before constructing callbacks, and uses a process-scoped event to allow only one new factory instance. Gate diagnostics go to IDE Debug Console. Existing old add-ins cannot retroactively participate in that guard; remove them and restart. There is no automatic deletion or unsafe unload of older DLLs.

Current development configuration admits **1043 through 1045** for the approved live update test; this is not evidence that all host hooks work on every supported build. Do not infer compatibility from the existence of an AppData folder or widen a manifest alone: packaging requires bounds equal to compiled config. Older/future IDE behavior and actual shared/local precedence remain native acceptance questions. If the native loader fails to load the shared copy after the local factory yields, capture that evidence before changing this policy. This is an explicit open release gate, not an asserted solved runtime fact.

## Focused embedded-bundle acceptance

- Compile both add-in architectures from the reopened canonical project. Verify their exact compiled resources using `node tbIDE/tools/verify-phase1-release.mjs <win32 DLL> <win64 DLL> tbIDE/Updater/Build/Updater.exe`; no loose payload files should be needed at runtime.
- In a disposable standard-user setup, install only matching DLL(s), disable online checks and start the IDE offline. Verify shared Updater.exe and both AppData themes are provisioned with the manifest hashes, without UAC. Both IDE architectures must use the same helper.
- Restart to verify no unnecessary replacement. Test missing helper/theme repair, preserve customized themes and unknown helpers pending explicit backed-up repair, and preserve a newer helper. Verify first-run/reopened wizard and saved theme/toolbar preferences survive bootstrap.
- Launch the updater from the add-in and inspect the ready handshake and selected context. Live transaction, rollback/recovery, self-update and protected-folder consent retain the complete acceptance checklist above; successful embedding alone does not establish those outcomes.

## Focused native acceptance

Use disposable installations and a disposable Windows profile/theme state. Record Win32/Win64, IDE build, native results and paths. Do not publish until all applicable native gates and compiled resource verification pass.

- Verify both add-in builds and the accepted updater's recorded native self-tests, including Unicode/long-path fixtures. Repeat updater tests if its source or binary changes.
- After accepted-binary embedding, install **only** architecture DLL(s) into AppData. Offline, unelevated first launch creates shared helper/themes and correct root identity. Verify DLL/helper hashes and actual resource contents.
- Delete each dependency and relaunch with automatic checks off and Welcome completed: restore offline without reopening onboarding. Preserve a newer helper, an unknown helper and customized themes; explicit reset retains exact backup. Test locked helper, corrupt/future settings/ledger and explicit backed-up reset.
- Run shared-only, local-only and duplicate new copies in both architectures; inspect factory diagnostics and exactly one UI/callback set. Test legacy unified and predecessor copies, remove/restart; examine actual load order. Unsupported older betas must decline safely.
- Wizard: six pages, previews without activation, actual Light/Dark change, Classic/Hybrid/Ribbon change/failure, Windows theme/accent, keyboard/focus/Escape/skip/finish, Options reopen, persistence and missing Runtime remediation. Confirm no arbitrary filesystem/network operation from the view.
- Two IDE roots: distinct settings, checks, consent and recovery; shared helper/themes; no inherited old-session approval. Concurrent shared repairs/updates and loaded DLLs must defer/fail safely, with no corruption.
- Real published test assets: missing release, offline/API/rate limit/invalid hashes/ZIP/PE/signature/protocol/channel, valid 0.x four-part ordering, documented legacy identities and future 1.0.0.0. Failed source must not hide other components.
- For both Update Now and Update on Exit, verify the standalone updater is visible before the first authorized release-asset download, shows live download/extraction/baseline/verification progress, remains responsive and accessible after IDE closure, and does not obscure native save prompts. Quiet automatic metadata checks may remain hidden; deliberate user minimization is allowed.
- Stage selected components; Update Now normal save/cancel, Update on Exit normal exit, project-close alone, crash, cancelled shutdown, pending cancellation, PID reuse, another IDE/compiler/cache process. No forced termination or unapproved write.
- In-place update preserves projects, unknown files, customized themes/vendor-name collisions and obsolete official files; mismatched installed baseline refuses safely. New unknown vendor top-level folder requests policy review rather than overwriting.
- Success/hash-verified receipts, optional restart at same root, injected failure before/after intent/replace, rollback, corrupt/missing staged or backup data, process termination/relaunch recovery, user edits after completion and missing/damaged launcher recovery.
- Detached helper updates itself successfully; other IDE's running helper/DLL lock is handled. Protected IDE: UAC accept/deny, different-account credentials, tampered context/plan/staging/reparse/receipts/backups, offline/moved metadata during revalidation; no unrelated protected writes. Recovery must preserve evidence if the old authentic archive is unavailable.

## Native theme and optional styling visual checks

With a project containing a form and module, exercise both WinUI3 themes, then standard/third-party themes and additional styling On/Off. Inspect readable title/menu/caption artwork; docking panel gaps and splitter movement; editor tabs, gutter, syntax/selection, status/compiler badges, Problems headers, designer grid/rulers and Properties rows; Options and project settings fields, navigation, check/radio controls; New/Open and message dialogs, progress, right-click menus, dropdowns, Debug Console suggestions and keyboard menu highlights. Check hover/press/focus/disabled states, tooltip contrast, overflow and clipping, Run/Stop colors, native command state and icon availability. Restart to confirm saved settings and no visible empty hidden tool window. Check Debug Console stylesheet application/removal or error messages, without treating a historical rule count as an invariant. See the architecture and IDE roadmap for detailed scope. 

## Refined wizard native acceptance additions

Compile the add-in with InstalledThemeCatalog and shared DiagnosticPaths. Check local and AppData themes (including duplicate names), inherited RGB/hex/alpha colors, third-party unresolvable palettes, exact-name selection, failed-save rollback and refresh cancellation. No preview should activate a theme without a click. Validate the actual same-origin iframe runtime/CSP and keyboard/focus across outer confirmation, conditional Setup/recovery and normal healthy six-page flow. Channel choice is intentionally absent. 


## Optional guarded publication

After the existing build/package checks and explicit release authorization, run Publish-Release.bat as documented in [Development release publication](README.md#development-release-publication). It does not replace the native acceptance gates. Validate the launcher before relying on it; no live publication was performed in the tooling pass.
