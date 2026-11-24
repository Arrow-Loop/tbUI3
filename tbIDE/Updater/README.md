# Native tbUI3 updater

Current source: **Updater 0.2.0.0**, **tbUI3IDE 0.4.0.0**; corrected add-in baseline **0.3.0.20**. Native twinBASIC engine with WebView2 UI. No PowerShell runtime, classic Win32 updater dialog, managed runtime or arbitrary command execution. PowerShell is used only by the development release packager.

Read [Phase 1 handoff and acceptance](../PHASE1_HANDOFF.md) for the current checkpoint and next test, [versioned native contracts](../INSTALLATION_CONTRACTS.md) for interfaces and [Installation Manager specification](../INSTALLATION_MANAGER_SPEC.md) for approved scope. The accepted Win32 helper passed 58/58 native self-tests and compiled no-context startup. Its previously accepted binary and both themes remain embedded in the canonical add-in. The canonical updater stylesheet now uses neutral wording; rebuild and accept a fresh helper and regenerate the bundle before distribution, then perform native DLL builds, compiled-resource verification and live acceptance. The old payload must not be distributed.

The executable now embeds `MANIFEST/#1.xml` declaring **asInvoker / uiAccess=false**. Starting the updater or its self-tests must not request administrator credentials, including for a standard Windows account. Only the separate approved protected-folder worker requests UAC explicitly. Bundle/release tools reject a compiled EXE missing this manifest or declaring an elevating level. Windows installer-detection background: [Microsoft guidance](https://learn.microsoft.com/en-us/windows/win32/secbp/running-with-administrator-privileges/).

## Build and deployment

When the helper changes, build canonical `Updater.twinproj` as Win32 using BETA 1045; reopen before building to avoid saving older IDE buffers over source. Its `src/` is a synchronized mirror, not an independent project. Run fresh `Updater.exe -SelfTest` unelevated and require all **58** cases to pass. The native report pointer is `%LOCALAPPDATA%\tbUI3\Diagnostics\native-updater-latest.json`. Node fixture/source validation does not execute these tests. The old minimal 35,328-byte launcher is stale and must never be embedded or distributed.

For a new accepted helper (not necessary for the unchanged embedded binary), run `node tbIDE/tools/prepare-phase1-bundle.mjs --updater <fresh accepted Updater.exe>` from repo root, then compile both add-in architectures. The tool embeds the real helper and both themes, checks PE architecture/version/freshness and records hashes/project revision. `verify-phase1-release.mjs <win32 DLL> <win64 DLL> <Updater.exe>` inspects real compiled resource bytes. Release packaging refuses absent/different payloads. See the handoff for exact build order and compatibility parameters.

The preferred manual installation is only DLL(s) under `%APPDATA%\twinBASIC\addins\win32|win64`. Bootstrap provisions shared `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` and AppData themes offline. Do not copy an arbitrary EXE beside `twinBASIC.exe`: the old installation-local helper model is superseded, and a helper needs a recognized compatible hash/protocol ledger before launch.

## Runtime

The add-in queues native Check/Stage and opens the sidecar for an approved staged transaction. Apply/Recover launch a verified detached session copy, keeping the installed shared executable replaceable. The worker stays separate from the WebView2 UI. Checks are independent per root and per release source. Four-part numeric versions include major zero; only documented historical mistaken add-in development identities are aliased, preserving legitimate future stable versions.

Downloads use fixed HTTPS sources, authenticated asset digests, size/ZIP/CRC/PE/version checks and Windows trust verification for signed executables. Official release inventory is data; only strategy policy authorizes destinations. In-place updating requires normal accepted IDE shutdown, exact PID/FILETIME identity, plan/context-bound approval, other-process waits, preflight, verified backups, durable per-file intent journal, atomic rename and verified rollback/recovery. Modified vendor files, unknown vendor paths and customized themes are preserved. Self-update runs from detached bytes. Scoped same-account UAC is available only for approved protected IDE writes, re-verifying the release/baseline before privilege use.

Shared components are serialized separately from per-installation sessions. Settings, receipts and recovery schema failures preserve evidence. The UI exposes pending recovery, explicit backed-up settings/resource reset and retry; a different Windows account cannot inherit authorization. Missing WebView2 Runtime opens the embedded remediation page in the user's browser without starting installation.

No-argument launch shows guidance; use the add-in to create a validated session. `-SelfTest` is the only public diagnostic operation. Other command arguments are a private versioned host/worker contract, not a general installation CLI.

## UI provenance and regeneration

The updater uses the shared WinUI Toolkit's native WebView2 lifecycle, theme schema 2, shared controls and Master CSS. Follow the Arrow-Loop knowledge standards and this project's canonical-project workflow. The current embedded assets are recorded in `REFERENCE.json`.

Quill's separate wizard is integrated by the add-in; its preview/mock page is not distributed. IDE Options installation settings use scoped toolkit styles, with no global IDE CSS override.

Regenerate updater bridge with `node tbIDE/tools/build-updater-script.mjs`; regenerate shared contracts/resources/config/canonical entries with `node tbIDE/tools/sync-phase1-projects.mjs`. Validate `node --test tests/*.mjs`, Quill's isolated tests and `node tools/validate-tabview-projects.mjs`. Native self-tests, compilation, actual DLL payload verification and live installation acceptance are separate gates. Phases 2/3 remain documented/deferred; they are not inactive controls pretending to work.

## Working Toolkit host alignment

The native WebView host follows the shared Toolkit event/lifecycle and form-default pattern. Resource text conversion uses the whole buffer with explicit UTF-8. Updater-specific workers, per-user paths, asInvoker, exact navigation/script policies and error reporting are retained. No Gallery/splash/tab-window dependency is introduced.

Updater.exe has its own updater.html/updater.js for selected updates, progress, consent, cancellation and recovery. It never loads the add-in Welcome Wizard; only tbUI3IDE embeds that separate surface. See the handoff for current native evidence and remaining acceptance.
