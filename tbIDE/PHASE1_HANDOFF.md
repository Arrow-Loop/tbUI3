# Phase 1 source handoff — native acceptance, then embedding

> Host alignment update: the updater now follows the current working Smith Debnam Toolkit lifecycle/form defaults and whole-buffer UI resource conversion (explicit UTF-8), reference 218871d. Incoming diagnostics are read from the private sdlaw-sdelorme/Diagnostics repository through the Smith Debnam connection. Its latest observed report passes 57/57; GUI success remains unconfirmed. Updater.exe uses its own update/progress/recovery UI; the Welcome Wizard remains exclusively in the add-in.

> Current handoff: the user's follow-up archive reports **57/57 native self-tests passed** after the byte-buffer fix; preserved in Updater/validation/native-2026-11-23-byte-buffer-fix-passed.json. Quill's approved Toolkit wizard through 79be9e5 is integrated with native installed-theme data. New native theme parsing, iframe/focus/CSP behavior and live updates remain acceptance work. The subsequently reported blank native updater form is not yet confirmed fixed: this pass corrects IDE arguments and fallback output and adds stage/error-number diagnostics. Read [all diagnostic locations](../docs/DIAGNOSTICS.md).

> Diagnostics now live under **%LOCALAPPDATA%\tbUI3\Diagnostics\**: `updater-startup.log`, `updater-engine.log`, `updater-startup-help.html`, `native-updater-latest.json`, `NativeSelfTests\...`, plus the TabView/property-page/paint/design logs. Old TEMP pointers below are historical. Rebuild all updated projects/re-import the control package to adopt these paths. Actual compiled-helper embedding remains a separate Phase 1 pass.

> Startup UAC correction: rebuild the canonical updater with the new embedded MANIFEST/#1.xml (asInvoker / uiAccess=false). Normal launch must work as a standard user. The already compiled EXE is unchanged. Protected-folder UAC acceptance remains separate. Fifteen focused regression tests and 127 mirror/ID/CRLF/hex checks pass for this correction; native launch has not been run.

2026-11-23. Authoritative product plan: INSTALLATION_MANAGER_SPEC.md. **This is source implementation, not a claim of a compiled or production-accepted release.** Shane subsequently directed that embedding the actual helper is a separate Phase 1 pass after the native updater compiles and works. Both parts still gate the first public release. Phases 2/3 remain deferred.

## Delivered

Native updater source 0.2.0.0; add-in source 0.4.0.0. Corrected baseline remains 0.3.0.20; four-part major-zero versions and future stable transition remain supported. The separate tbUI3 core version remains 1.0.0.75; only its diagnostic routes changed in this pass.

- Per-user deployment, offline provisioning/repair services, recognized hash/version/protocol ledger, no downgrade/customized overwrite, explicit verified backups and shared locks.
- Per-root canonical identity/preferences/receipts/session/approval/recovery, versioned planning/strategy/operations/inventories and scoped shared-helper protocol. See INSTALLATION_CONTRACTS.md.
- Verified downloads, constrained native in-place transaction, durable backups/rollback/recovery and detached self-update. Scoped same-account UAC, independent privileged release/baseline verification and immutable inputs.
- Quill's functional Welcome view embedded unchanged through production bridge; actual theme/toolbar APIs, native preferences, async backup/reset confirmation, user-global first-run record and Options reopen. No simulated preview shipped.
- Canonical projects/mirrors, configuration generation, actual PE resource validation and release gates requiring both DLL architectures to contain exact accepted payloads.

## Build order and separate embedding pass

1. Close/reopen canonical projects so an old IDE buffer cannot overwrite source changes. Build `tbIDE/Updater/Updater.twinproj` as **Win32**, BETA 1045. Do not use the old minimal `Build/Updater.exe` (35,328 bytes); tooling rejects its version/staleness.
2. Run the new EXE `-SelfTest` unelevated. Require **57 cases** (38 policy/filesystem/contracts plus 19 independently generated ZIP fixtures), zero failures; inspect `%LOCALAPPDATA%\tbUI3\Diagnostics\native-updater-latest.json` and its results file. These native tests have NOT been run by Cody.
3. Build/test add-in architectures from source for integration acceptance if needed; these development DLLs intentionally report missing bundle. Existing helper cannot be adopted merely by copying an unrecognized EXE. Use disposable per-user test data and retain accepted native test results. Current source does not provide DLL-only first install until step 4.
4. **Following updater acceptance, separate Phase 1 embedding pass:** from repo root run `node tbIDE/tools/prepare-phase1-bundle.mjs --updater <accepted fresh Updater.exe>`. It validates real PE/version/timestamp and embeds helper, both exact themes and manifest in canonical add-in/mirrors. Then compile **both** DLL architectures. Never edit project/source after compiling without rebuilding.
5. Run `node tbIDE/tools/verify-phase1-release.mjs <win32 DLL> <win64 DLL> <Updater.exe>`. It inspects real DLL resource bytes, architecture, versions, identical manifests, project digest and exact payload hashes. No dummy/stale helper or loose-files-only package can pass.
6. Development packager: `tbIDE/tools/package-updater-release.ps1 -Win32Dll ... -Win64Dll ... -UpdaterExe ... -MinIdeBuild 1045 -MaxIdeBuild 1045 -Channel development`. It writes manifest schema 2/perUser/protocol bounds and versioned ZIPs; it does not publish. No GitHub release is authorized by this handoff.

Source regeneration: after changing updater view run `node tbIDE/tools/build-updater-script.mjs`, then `node tbIDE/tools/sync-phase1-projects.mjs`; the latter copies shared native modules, Quill resources and configuration into both canonical projects/mirrors. It does not generate an updater payload. Native compilation cannot be substituted by these tools.

## Loader evidence and compatibility boundary

Inspected **official BETA 1045 ZIP**, SHA-256 `20ef4efbd26fdb97a5214b4ddd75c553c875a0d45329b5e0c5fdd3f3373b9196` (42,832,930 bytes), without launching it. Its IDE main.js creates `%APPDATA%\twinBASIC\addins\win32|win64` and passes the common root to `RequestLoadAddins`. This establishes intended shared paths, not native DLL enumeration order or duplicate callback behavior. Native compiler DLLs expose add-in loading strings/interfaces, but static inspection does not establish exact precedence.

The new factory gate prefers the shared DLL when present, refuses legacy duplicate unified/predecessor DLLs before constructing callbacks, and uses a process-scoped event to allow only one new factory instance. Gate diagnostics go to IDE Debug Console. Existing old add-ins cannot retroactively participate in that guard; remove them and restart. There is no automatic deletion or unsafe unload of older DLLs.

Configuration conservatively admits **1045 only** until native evidence establishes other builds. Do not infer compatibility from the existence of an AppData folder or widen a manifest alone: packaging requires bounds equal to compiled config. Older/future IDE behavior and actual shared/local precedence remain native acceptance questions. If the native loader fails to load the shared copy after the local factory yields, capture that evidence before changing this policy. This is an explicit open release gate, not an asserted solved runtime fact.

## Focused native acceptance

Use disposable installations and a disposable Windows profile/theme state. Record Win32/Win64, IDE build, native results and paths. Do not publish until both the source and embedding pass pass.

- Compile updater and both add-ins warning-free in BETA 1045; run all 57 native self-tests. Verify Unicode/long-path fixtures.
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

## Validation boundary

Cody uses Node unit/DOM tests, exact mirror/IDs/CRLF/hex checks, PowerShell parse checks and static archive inspection. JSDOM is not a rendered browser or native IDE. No Screen Control, GUI automation, twinBASIC compilation or live update was performed. Native tests and compiled resource verification remain unperformed until the above build order. No release exists solely because the repository is public.

## Automated validation recorded for this source pass

- `node --test tests/*.mjs`: **211 passed, 0 failed**. Includes 22 new production-adapter/PE/contract checks; remaining suite covers existing controls, toolbar, update UI, ZIP fixtures and project contracts.
- `node --test tbIDE/prototypes/welcome-wizard/welcome.test.mjs`: **9 passed, 0 failed** (Quill-owned sources unchanged).
- `node tools/validate-tabview-projects.mjs`: **126 exact mirrors** across all four active projects; embedded package, stable control/form identities, CRLF and explicit high-bit hex widths pass.
- Phase 1 project/resource regeneration: second run makes **zero changes** in either canonical project. Shared native contracts and Quill production copies are byte-identical.
- Development release packager PowerShell AST parse and Git whitespace/diff checks pass. Negative packaging tests reject missing native build inputs; real compiled-DLL packaging validation is unperformed because accepted binaries do not exist yet.

The native self-test suite is **54 authored cases, unexecuted**, not 54 passing cases. No GUI automation, native compilation, installed-file mutation, PR, main merge or release publication occurred.

## Refined wizard native acceptance additions

Compile the add-in with InstalledThemeCatalog and shared DiagnosticPaths. Check local and AppData themes (including duplicate names), inherited RGB/hex/alpha colors, third-party unresolvable palettes, exact-name selection, failed-save rollback and refresh cancellation. No preview should activate a theme without a click. Validate the actual same-origin iframe runtime/CSP and keyboard/focus across outer confirmation, conditional Setup/recovery and normal healthy six-page flow. Channel choice is intentionally absent. Recompile the updater and inspect Diagnostics/updater-startup.log if its window remains blank; the old unqualified error did not establish its failing stage. Native -SelfTest remains 57 cases, with the argument case expanded for Command-tail parsing.
