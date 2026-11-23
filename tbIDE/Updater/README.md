# Native tbUI3 updater

> Latest native evidence: **57/57 tests passed** in Shane's second archive after the byte-buffer fix; report retained under validation/. That result does not validate WebView2 startup. The reported blank form remains an open native acceptance issue. IDE command-tail parsing and verified fallback output are corrected; new stage/error-number logs are in **%LOCALAPPDATA%\tbUI3\Diagnostics\updater-startup.log**. Rebuild before retesting. All runtime diagnostic locations are listed in [docs/DIAGNOSTICS.md](../../docs/DIAGNOSTICS.md).

Current source: **Updater 0.2.0.0**, **tbUI3IDE 0.4.0.0**; corrected add-in baseline **0.3.0.20**. Native twinBASIC engine with WebView2 UI. No PowerShell runtime, classic Win32 updater dialog, managed runtime or arbitrary command execution. PowerShell is used only by the development release packager.

Read [Phase 1 handoff and acceptance](../PHASE1_HANDOFF.md), [versioned native contracts](../INSTALLATION_CONTRACTS.md) and the authoritative [Installation Manager specification](../INSTALLATION_MANAGER_SPEC.md). The source is implemented; **native compilation/runtime acceptance is pending**. Shane directed the actual compiled-helper embedding into both DLLs to a separate Phase 1 pass after the updater works. DLL-only/offline first install cannot be claimed until that pass and its acceptance complete.

The executable now embeds `MANIFEST/#1.xml` declaring **asInvoker / uiAccess=false**. Starting the updater or its self-tests must not request administrator credentials, including for a standard Windows account. Only the separate approved protected-folder worker requests UAC explicitly. Bundle/release tools reject a compiled EXE missing this manifest or declaring an elevating level. Reopen and rebuild the canonical project to incorporate this startup fix; old EXEs do not change when source is updated. Windows installer-detection background: [Microsoft guidance](https://learn.microsoft.com/en-us/windows/win32/secbp/running-with-administrator-privileges/).

## Build and deployment

Build canonical `Updater.twinproj` as Win32 using BETA 1045; reopen before building to avoid saving older IDE buffers over source. Its `src/` is a synchronized mirror, not an independent project. Run fresh `Updater.exe -SelfTest` unelevated and require all **57** cases to pass. The native report pointer is `%LOCALAPPDATA%\tbUI3\Diagnostics\native-updater-latest.json`. Node fixture/source validation does not execute these tests. The old minimal 35,328-byte launcher is stale and must never be embedded or distributed.

After native acceptance, run `node tbIDE/tools/prepare-phase1-bundle.mjs --updater <fresh accepted Updater.exe>` from repo root, then compile both add-in architectures. The tool embeds the real helper and both themes, checks PE architecture/version/freshness and records hashes/project revision. `verify-phase1-release.mjs <win32 DLL> <win64 DLL> <Updater.exe>` inspects real compiled resource bytes. Release packaging refuses absent/different payloads. See the handoff for exact build order and compatibility parameters.

The preferred manual installation is only DLL(s) under `%APPDATA%\twinBASIC\addins\win32|win64`. Bootstrap provisions shared `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` and AppData themes offline. Do not copy an arbitrary EXE beside `twinBASIC.exe`: the old installation-local helper model is superseded, and a helper needs a recognized compatible hash/protocol ledger before launch.

## Runtime

The add-in queues native Check/Stage and opens the sidecar for an approved staged transaction. Apply/Recover launch a verified detached session copy, keeping the installed shared executable replaceable. The worker stays separate from the WebView2 UI. Checks are independent per root and per release source. Four-part numeric versions include major zero; only documented historical mistaken add-in development identities are aliased, preserving legitimate future stable versions.

Downloads use fixed HTTPS sources, authenticated asset digests, size/ZIP/CRC/PE/version checks and Windows trust verification for signed executables. Official release inventory is data; only strategy policy authorizes destinations. In-place updating requires normal accepted IDE shutdown, exact PID/FILETIME identity, plan/context-bound approval, other-process waits, preflight, verified backups, durable per-file intent journal, atomic rename and verified rollback/recovery. Modified vendor files, unknown vendor paths and customized themes are preserved. Self-update runs from detached bytes. Scoped same-account UAC is available only for approved protected IDE writes, re-verifying the release/baseline before privilege use.

Shared components are serialized separately from per-installation sessions. Settings, receipts and recovery schema failures preserve evidence. The UI exposes pending recovery, explicit backed-up settings/resource reset and retry; a different Windows account cannot inherit authorization. Missing WebView2 Runtime opens the embedded remediation page in the user's browser without starting installation.

No-argument launch shows guidance; use the add-in to create a validated session. `-SelfTest` is the only public diagnostic operation. Other command arguments are a private versioned host/worker contract, not a general installation CLI.

## UI provenance and regeneration

WebView2 hosting, native theme schema 2 and unmodified shared controls/Master CSS originate from **Smith-Debnam/twinBASIC-Knowledge** commit `0babc88f55f4077df7d309826734240cc63796e5`; [REFERENCE.json](REFERENCE.json) records hashes. The tbUI3 canonical-project workflow applies, not that repository's sync rules. Arrow-Loop knowledge main was refreshed at `8c832b974a7b020d73e5e53b13f3e475e941e766` for coding, interop, WebView2, CSS and packaging guidance.

Quill's separate wizard is integrated by the add-in; its preview/mock page is not distributed. IDE Options installation settings use scoped toolkit styles, with no global IDE CSS override.

Regenerate updater bridge with `node tbIDE/tools/build-updater-script.mjs`; regenerate shared contracts/resources/config/canonical entries with `node tbIDE/tools/sync-phase1-projects.mjs`. Validate `node --test tests/*.mjs`, Quill's isolated tests and `node tools/validate-tabview-projects.mjs`. Native self-tests, compilation, actual DLL payload verification and live installation acceptance are separate gates. Phases 2/3 remain documented/deferred; they are not inactive controls pretending to work.
