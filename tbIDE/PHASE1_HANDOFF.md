# Phase 1 handoff and native acceptance

**Current checkpoint: 2026-11-23.** [INSTALLATION_MANAGER_SPEC.md](INSTALLATION_MANAGER_SPEC.md) defines approved scope; [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md) defines interfaces; [CHANGELOG.md](CHANGELOG.md) retains historical fixes and evidence. Phase 1 remains the combined updater, embedded provisioning and Welcome Wizard first-release gate. Phases 2/3 remain deferred.

## Current status and next action

| Area | Evidence / remaining gate |
| --- | --- |
| Updater 0.2.0.0 (Win32) | Shane's native report: **58/58 passed**; compiled no-context startup reached `updater:ready`. Retained [native report](Updater/validation/native-startup-2026-11-23-passed.json). |
| Embedded payload | Previous accepted bundle (replacement required): tracked `Updater/Build/Updater.exe`, both WinUI3 themes, verified manifest. Updater SHA-256: `677d86b4a9fe368282e4c1464e0ad549e5309b838f2929570c13e4803dd2ee68`. |
| Add-in 0.4.0.0 | BETA 1045 resource-reader and color-format diagnostics addressed in source; **reopen and build both Win32/Win64 DLLs**, then verify compiled resource bytes. Accepted updater/bundled payload unchanged by that fix. |
| Automated source validation | Latest recorded development pass: 243 Node tests, 140 exact mirrors, IDs/CRLF/hex checks and generator idempotence. These do not establish native DLL or live update acceptance. |
| Remaining live gates | DLL-only offline bootstrap, loader behavior, integrated Welcome/settings, real release checks and transactions, preservation, rollback/recovery, self-update, protected-folder consent and release packaging. |

The next action is **rebuild the canonical updater, repeat native acceptance, and re-embed the clean helper before compiling both add-in architectures**. The neutral stylesheet comment is now packed in the canonical source and synchronized mirror; the previously accepted EXE and add-in payload predate that change. Do not distribute the old payload. The bundle digest and compiled-resource tests must reject the old payload against the updated project until regenerated. Use disposable IDE roots and a disposable Windows profile for tests that alter installation or shared AppData state. No release or main merge is authorized.

## Delivered

Native updater source 0.2.0.0; add-in source 0.4.0.0. Corrected baseline remains 0.3.0.20; four-part major-zero versions and future stable transition remain supported. The separate tbUI3 core version remains 1.0.0.75; only its diagnostic routes changed in this pass.

- Per-user deployment, offline provisioning/repair services, recognized hash/version/protocol ledger, no downgrade/customized overwrite, explicit verified backups and shared locks.
- Per-root canonical identity/preferences/receipts/session/approval/recovery, versioned planning/strategy/operations/inventories and scoped shared-helper protocol. See INSTALLATION_CONTRACTS.md.
- Verified downloads, constrained native in-place transaction, durable backups/rollback/recovery and detached self-update. Scoped same-account UAC, independent privileged release/baseline verification and immutable inputs.
- Quill's functional Welcome view embedded unchanged through production bridge; actual theme/toolbar APIs, native preferences, async backup/reset confirmation, user-global first-run record and Options reopen. No simulated preview shipped.
- Canonical projects/mirrors, configuration generation, actual PE resource validation and release gates requiring both DLL architectures to contain exact accepted payloads.

## Build and verification sequence

1. First complete the changed-updater build and embedding procedure in step 4 below, then use BETA 1045. Close/reopen the canonical `tbUI3IDE/tbUI3IDE.twinproj` before building so an older IDE buffer cannot overwrite resources. Build both Win32 and Win64; do not substitute a stale DLL.
2. Verify from the repository root: `node tbIDE/tools/verify-phase1-release.mjs <win32 DLL> <win64 DLL> tbIDE/Updater/Build/Updater.exe`. This checks actual DLL architecture/version, manifest identity, project digest and payload hashes. Do not proceed with missing or unequal resources.
3. Follow the embedded-bundle and focused native acceptance checklists below. Keep native output in `%LOCALAPPDATA%\tbUI3\Diagnostics\`; see [diagnostic locations](../docs/DIAGNOSTICS.md).
4. Only if the updater changes: reopen/build `tbIDE/Updater/Updater.twinproj` as Win32, run `Updater.exe -SelfTest` unelevated, require the current suite to pass (58 cases at this checkpoint), verify no-context startup, then run `node tbIDE/tools/prepare-phase1-bundle.mjs --updater <accepted fresh Updater.exe>`. Rebuild and verify both DLLs after re-embedding. The old 35,328-byte launcher is stale; never use it.
5. After acceptance, prepare (not publish) release assets: `tbIDE/tools/package-updater-release.ps1 -Win32Dll ... -Win64Dll ... -UpdaterExe ... -MinIdeBuild 1045 -MaxIdeBuild 1045 -Channel development`. Use a fresh, empty output directory (for example `-Output Build/Release-0.4.0.0`). It writes one versioned add-in ZIP containing both DLLs, schema-2 `tbUI3-update.json` listing only the add-in, and `SHA256SUMS.txt` covering the ZIP and manifest. The helper EXE is still required as a verification input, not a separate release asset. Check an add-in-only upgrade followed by startup provisioning of recognized older helper/themes and preservation of newer or modified resources.

Source regeneration: after updater view changes run `node tbIDE/tools/build-updater-script.mjs`, then `node tbIDE/tools/sync-phase1-projects.mjs` to synchronize shared native modules, Wizard assets and canonical project mirrors. The latter does not generate an updater payload. Run the repository source/fixture tests, Wizard tests and `node tools/validate-tabview-projects.mjs` after applicable changes. A changed binary/project must be rebuilt and its acceptance evidence renewed.

## Loader evidence and compatibility boundary

Inspected **official BETA 1045 ZIP**, SHA-256 `20ef4efbd26fdb97a5214b4ddd75c553c875a0d45329b5e0c5fdd3f3373b9196` (42,832,930 bytes), without launching it. Its IDE main.js creates `%APPDATA%\twinBASIC\addins\win32|win64` and passes the common root to `RequestLoadAddins`. This establishes intended shared paths, not native DLL enumeration order or duplicate callback behavior. Native compiler DLLs expose add-in loading strings/interfaces, but static inspection does not establish exact precedence.

The new factory gate prefers the shared DLL when present, refuses legacy duplicate unified/predecessor DLLs before constructing callbacks, and uses a process-scoped event to allow only one new factory instance. Gate diagnostics go to IDE Debug Console. Existing old add-ins cannot retroactively participate in that guard; remove them and restart. There is no automatic deletion or unsafe unload of older DLLs.

Configuration conservatively admits **1045 only** until native evidence establishes other builds. Do not infer compatibility from the existence of an AppData folder or widen a manifest alone: packaging requires bounds equal to compiled config. Older/future IDE behavior and actual shared/local precedence remain native acceptance questions. If the native loader fails to load the shared copy after the local factory yields, capture that evidence before changing this policy. This is an explicit open release gate, not an asserted solved runtime fact.

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
- Stage selected components; Update Now normal save/cancel, Update on Exit normal exit, project-close alone, crash, cancelled shutdown, pending cancellation, PID reuse, another IDE/compiler/cache process. No forced termination or unapproved write.
- In-place update preserves projects, unknown files, customized themes/vendor-name collisions and obsolete official files; mismatched installed baseline refuses safely. New unknown vendor top-level folder requests policy review rather than overwriting.
- Success/hash-verified receipts, optional restart at same root, injected failure before/after intent/replace, rollback, corrupt/missing staged or backup data, process termination/relaunch recovery, user edits after completion and missing/damaged launcher recovery.
- Detached helper updates itself successfully; other IDE's running helper/DLL lock is handled. Protected IDE: UAC accept/deny, different-account credentials, tampered context/plan/staging/reparse/receipts/backups, offline/moved metadata during revalidation; no unrelated protected writes. Recovery must preserve evidence if the old authentic archive is unavailable.

## Native theme and optional styling visual checks

With a project containing a form and module, exercise both WinUI3 themes, then standard/third-party themes and additional styling On/Off. Inspect readable title/menu/caption artwork; docking panel gaps and splitter movement; editor tabs, gutter, syntax/selection, status/compiler badges, Problems headers, designer grid/rulers and Properties rows; Options and project settings fields, navigation, check/radio controls; New/Open and message dialogs, progress, right-click menus, dropdowns, Debug Console suggestions and keyboard menu highlights. Check hover/press/focus/disabled states, tooltip contrast, overflow and clipping, Run/Stop colors, native command state and icon availability. Restart to confirm saved settings and no visible empty hidden tool window. Check Debug Console stylesheet application/removal or error messages, without treating a historical rule count as an invariant. See the architecture and IDE roadmap for detailed scope. 

## Refined wizard native acceptance additions

Compile the add-in with InstalledThemeCatalog and shared DiagnosticPaths. Check local and AppData themes (including duplicate names), inherited RGB/hex/alpha colors, third-party unresolvable palettes, exact-name selection, failed-save rollback and refresh cancellation. No preview should activate a theme without a click. Validate the actual same-origin iframe runtime/CSP and keyboard/focus across outer confirmation, conditional Setup/recovery and normal healthy six-page flow. Channel choice is intentionally absent. 

