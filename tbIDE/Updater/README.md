# tbUI3 Updater

**Consolidated agreed future product design:** [INSTALLATION_MANAGER_SPEC.md](../INSTALLATION_MANAGER_SPEC.md). It records the full conversation decisions including first-release gate, later folder strategies and preservation policies, distinct from the current build/run instructions below. Use it together with the current canonical source; do not infer that planned behavior has already shipped.

**Pending change to first-install behavior (approved 2026-11-23):** [Embedded bootstrap and Welcome Wizard plan](../BOOTSTRAP_WELCOME_PLAN.md). The add-in DLLs will eventually embed and provision Updater.exe to `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` and both themes to `%APPDATA%\twinBASIC\themes`, with per-installation state. The instructions below describe the **current implementation**, not the future bootstrap. Do not represent the current DLL as self-provisioning until that work is delivered and validated.

Source implementation: **Updater 0.1.0.1**, coordinated with **tbUI3IDE 0.3.0.22**. The final WebView2 project and add-in are ready for Shane's native compilation and acceptance checks. The earlier minimal launcher build predates this interface and must not be distributed.

The add-in owns automatic/manual discovery requests, notifications, installed/available versions, component selection and consent. The twinBASIC EXE contains both the embedded WebView2 interface and the native update engine. Network/staging/install work runs in a separate hidden instance of that same EXE, keeping it out of the IDE and the UI process. Installation starts only after the WebView interface is ready. No PowerShell, .NET or script interpreter is required at runtime.

## Build and first install

1. Reopen the current canonical projects from `tbui3-dev` before saving or building. An IDE window left open on the earlier launcher contains stale project state.
2. Build `tbIDE/tbUI3IDE/tbUI3IDE.twinproj` in win32 and win64. Its existing build path writes `addins/<architecture>/tbUI3IDE.dll` under that IDE.
3. Build `tbIDE/Updater/Updater.twinproj` in **win32**. `Build/Updater.exe` contains the portable UI and update engine for both IDE architectures.
4. Copy the freshly built `Updater.exe` beside the installation's `twinBASIC.exe`. The HTML/CSS/JavaScript are embedded in the EXE; no loose UI directory is required.
5. Restart the IDE and open **IDE Options → tbUI3 updates → Check for Updates**. The entry works independently of Classic/Hybrid/Ribbon and additional theme styling.

The Microsoft Edge WebView2 Evergreen Runtime is the UI prerequisite. The engine uses Windows WinHTTP, CNG, WinTrust, process/file APIs and baseline Windows COM services (FSO, ADODB.Stream and WMI). The built-in WebView2 Package 0.0.0.3 is the only added compiler reference. The sidecar checks the Runtime before constructing its browser. If unavailable, it opens an embedded remediation page in the default browser; it does not install prerequisites silently or start replacement. There are no Win32 message-box or browser alert/confirm/prompt workflows.

The control package and existing consumer projects are unchanged by this development pass.

## In-IDE workflow

Automatic checks run once per day, ten seconds after initialization, unless disabled in the update panel. Settings and a 24-hour Remind Me Later deadline are persisted per user. A manual check remains available. Each source can fail independently.

The panel shows installed/available versions, sources, summaries and add-in compatibility bounds. Both add-in architecture versions are shown. Updates are opt-in per component:

- **Update Now:** stage and verify, then use the IDE's normal save/discard/cancel close path. Only its accepted exit callback writes shutdown approval before continuing the original close.
- **Update on Exit:** stage and verify, then intercept the same accepted IDE-exit callback when the user closes normally.
- **Remind Me Later:** save the deferral; if an update was already pending, request cancellation as well.
- **Cancel Pending Update:** cancel before installation; never interrupt a file transaction halfway through.

A crash, a cancelled save prompt, or an unrelated project-close callback does not create shutdown approval. The sidecar waits for the specific owning IDE identity and other IDE/compiler processes from that installation. It never kills processes. Now waits up to two minutes for approval; On Exit waits up to twelve hours. Lingering compiler/cache processes or another session cause a safe, retryable failure.

Restart is optional and uses the same IDE executable. Its working directory currently defaults to the installation directory; arbitrary original command-line/editor state is not restored.

## Sidecar interface

The WebView2 host, native theme schema 2, Runtime detection and shared control resources come from **Smith-Debnam/twinBASIC-Knowledge**, commit `0babc88f55f4077df7d309826734240cc63796e5`. [REFERENCE.json](REFERENCE.json) records exact shared asset hashes. The form and project retain their tbUI3-specific identities. This project follows tbUI3's canonical-project/`src` workflow, rather than importing the Smith Debnam synchronization rules.

The screen uses the toolkit's full shared Master CSS and named Button, InfoBar and ProgressBar controls. Application CSS supplies window composition only. It follows Windows theme/accent, uses the native theme-notification subclass, and resizes the WebView at ZoomFactor 1. Scripts are served from a fixed, in-memory application origin; remote navigation and host objects are disabled.

Selected components, waiting/installing status, verified-file progress, retry, restore-backup, cancellation and completion are shown in the embedded interface. Privileged messages are a fixed operation allowlist; the page cannot supply filesystem paths, commands or executables. The installed sidecar copies its single EXE into the approved session before installation, freeing the installed EXE for self-update.

## Release contracts

Making the repository public permits anonymous access, but **does not publish an update by itself**. Branch heads are never treated as installable binaries.

### tbUI3IDE, themes and sidecar

Publish an explicitly versioned GitHub release with `tbUI3-update.json` and its ZIP assets in the **same release**. The initial baseline identity is:

- tag: `tbUI3IDE-v0.3.0.20`;
- add-in ZIP: `tbUI3IDE-0.3.0.20.zip`.

This native-engine pass uses add-in identity `0.3.0.22`; the corrected baseline remains `0.3.0.20`. Four numeric components and major zero are supported. Development releases require GitHub's prerelease flag and manifest channel `development`; an explicitly designated stable release uses channel `stable` and can transition to `1.0.0.0`.

Known historical add-in identities only are aliased: `1.1.0.0`, `1.2.0.0–2`, `1.3.0.0–20` map to their major-zero counterparts. Verified stable-install receipts prevent this legacy alias from overriding a legitimate future stable identity. IDE, library and control-package versions use ordinary numeric comparison and are never renumbered.

Manifest shape:

```json
{
  "schema": 1,
  "releaseTag": "tbUI3IDE-v0.3.0.20",
  "channel": "development",
  "components": [{
    "id": "addin",
    "version": "0.3.0.20",
    "asset": "tbUI3IDE-0.3.0.20.zip",
    "minIdeBuild": 1044,
    "maxIdeBuild": 1044,
    "summary": "Release summary",
    "files": [{
      "source": "addins/win32/tbUI3IDE.dll",
      "target": "addins/win32/tbUI3IDE.dll",
      "size": 12345,
      "sha256": "<64 lowercase hexadecimal characters>"
    }, {
      "source": "addins/win64/tbUI3IDE.dll",
      "target": "addins/win64/tbUI3IDE.dll",
      "size": 23456,
      "sha256": "<64 lowercase hexadecimal characters>"
    }]
  }]
}
```

Example sizes/digests above are illustrative; the packaging tool calculates real values. GitHub's release API provides each archive/manifest asset's identity, size and SHA-256 digest. Files inside each archive have their own manifest size/hash. The packager rejects mismatched architecture/version pairs, stale builds and overwriting existing output assets.

After compiling and validating, run from the repository root:

```powershell
& ./tbIDE/tools/package-updater-release.ps1 `
  -Win32Dll '<IDE>/addins/win32/tbUI3IDE.dll' `
  -Win64Dll '<IDE>/addins/win64/tbUI3IDE.dll' `
  -UpdaterExe './tbIDE/Updater/Build/Updater.exe' `
  -MinIdeBuild 1044 -MaxIdeBuild 1044 `
  -Channel development -Output './Build/Release-0.3.0.22'
```

Set compatibility bounds only to builds actually checked. Upload all generated ZIPs and the manifest to the matching release, and mark it prerelease. Publish new versions rather than replacing a published manifest or asset. Publishing is separate from this pass.

### Official twinBASIC

The verified source is `https://api.github.com/repos/twinbasic/twinbasic/releases?per_page=100`. Numeric beta build order is used, including older zero-padded tags such as `beta-x-0997`. Current confirmed asset naming is `twinBASIC_IDE_BETA_<build>.zip`. Stable-channel support awaits a real vendor contract.

Only the launcher and files explicitly shipped under `bin/`, `ide/`, `locale/` and `packages/` are eligible. Projects/samples, add-ins, themes, preferences and unrelated paths are preserved. Existing runtime files must match the prior verified install receipt or the installed build's authenticated official archive. Modified files and new vendor-name collisions stop the update without overwriting them. An older build outside the metadata window requires a manual IDE update. Obsolete files are not deleted.

### Icon library and optional control package

The library retains its established `tbUI3-Libraries/main/icons/manifest.txt` contract and `%LOCALAPPDATA%/tbUI3/tbUI3-Icons.dat` installation. Installed versions are read from the DAT header, and both archive and DAT hashes are checked. No competing version store is introduced.

An optional `controlPackage` manifest entry can offer a published `tbUI3-<version>.twinpack` into `%LOCALAPPDATA%/tbUI3/Downloads`. It does not import the package or rewrite embedded project references. The packager does not invent a control-package release.

## Verification, replacement and recovery

Approved URLs are restricted to the appropriate repositories' release downloads. Redirects are explicitly restricted to GitHub release CDN hosts. Status, lengths, SHA-256, ZIP traversal/absolute paths, case-colliding entries, links, existing reparse points and component destination allowlists are checked. Both add-in PE architectures are required. A supplied code signature must validate; unsigned twinBASIC outputs rely on authenticated release digests.

Every approval gets a separate session under `%LOCALAPPDATA%/tbUI3/Updater`. It contains context/catalog/plan, staging, state, log, journal, backups and the temporary sidecar. No tokens are stored. A named installation mutex prevents concurrent updater transactions.

All selected components and their receipts form one logical transaction. Preflight validates staged bytes and destination locks, then backs up only replacement files. Each intent is flushed to the journal before an atomic same-volume temporary-file replacement. Installed hashes are verified before success. On failure, replaced files are restored and newly created files removed. Unexpected user changes or corrupt/missing backups stop recovery and retain evidence. This is recoverable per-file installation, not a power-atomic filesystem transaction.

A per-installation active-journal marker prevents starting a new transaction over an unfinished one. The UI offers **Restore backup** after a failure. Manual recovery uses the existing context, after closing the installation normally:

```powershell
& '<IDE>/Updater.exe' -Mode Recover -Context '<full-session-path>/context.json'
```

Recovery validates journal destinations and backup paths against the approved plan. Completed/rolled-back sessions older than seven days are cleaned on later checks; unresolved recovery sessions are retained. Windows permissions are respected; there is no forced replacement, process termination, automatic elevation or reboot scheduling.

## Native engine and executable self-tests

The canonical project now contains `UpdaterEngine`, `UpdaterPolicy`, `UpdaterPlatform`, `UpdaterProcesses`, `UpdaterTransaction`, `UpdaterZip`, `UpdateInflate`, `UpdaterJson` and `UpdateJson`. The private JSON parser rejects duplicate fields/trailing data. WinHTTP streams bounded downloads to disk; CNG streams SHA-256; WinTrust validates supplied publisher signatures. The ZIP reader validates the complete central directory and uses the private streaming RFC 1951 decoder for Stored/Deflate entries, with CRC32, length and expansion limits. ZIP64/encryption/unsupported methods are rejected. There is no shell extraction or executable downloaded helper dependency.

The GUI launches the same executable with a private `-Worker` mode, preserving UI responsiveness. Apply/Recover workers must run from the detached session copy. Owning-process identity now uses exact FILETIME hex strings; schema-2 plans/journals reject stale script-engine sessions. Check again after replacing the old updater. Old script-engine artifacts are not accepted as native recovery plans; retain any unresolved old backups for manual inspection. No production update had been published before this migration.

After compiling, run the actual compiled engine's **47 local self-tests** (no network, live IDE or installed files are touched):

```powershell
$test = Start-Process './tbIDE/Updater/Build/Updater.exe' -ArgumentList '-SelfTest' -WindowStyle Hidden -Wait -PassThru
$test.ExitCode
Get-Content "$env:TEMP/tbUI3-native-updater-latest.json"
```

Exit code zero requires all tests to pass. The latest-results pointer identifies a fresh disposable fixture directory containing `results.json`; failed fixtures are retained. Tests exercise major-zero/stable/legacy versions, strict JSON, path/device/ADS rejection, known SHA-256, atomic JSON, install/idempotence/rollback, staging corruption, later edits, corrupt backups, vendor collisions/races, locks, journal tampering and 19 independently generated ZIP fixtures. `build-updater-fixtures.mjs` uses Node zlib solely to generate deterministic embedded test data; it is not a runtime dependency.

`tools/package-updater-release.ps1` remains development-time release tooling. It is self-contained and distributes only `Updater.exe` for the updater component. It is never launched by the application. A legacy loose `Updater.ps1` is unused and can be removed after replacing the EXE.

Windows API references: [WinHTTP streaming](https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpreaddata), [CNG hashing](https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptcreatehash), [publisher trust](https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-winverifytrust); archive format: [PKWARE APPNOTE](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT), [RFC 1951](https://www.rfc-editor.org/rfc/rfc1951).

## Validation and tomorrow's acceptance

Automated validation is recorded in the repository handoff. Headless Edge checks exercise the actual shared toolkit controls in Light/Dark, desktop/narrow layout, theme snapshots, waiting/cancel, file progress, retry/recovery, escaped errors and completion. These are browser tests, not a live twinBASIC WebView2 run.

Tomorrow:

1. Reopen, compile and save both canonical projects; build both add-in architectures and the Win32 sidecar. Run `Updater.exe -SelfTest` and require all 47 cases to pass before using an installation. Regenerate mirrors after any compiler fixes. Confirm the fixed PE version parts read as 0.3.0.22 and 0.1.0.1; the packager refuses a mismatch with canonical Settings.
2. Check launch with no loose UI folder, Windows Light/Dark/accent changes, 100%/150% DPI, resize, WebView2-unavailable remediation and clean close.
3. Check manual/automatic discovery and opt-out in Classic, Hybrid and Ribbon, including offline/ratelimited sources and no published tbUI3 release.
4. On a disposable portable installation, check accepted/cancelled unsaved-work shutdown, Update on Exit, abnormal termination without approval, another IDE/cache process, cancellation and optional restart.
5. Exercise verified component-only/combined releases, local vendor-file modifications, locked files, partial/corrupt downloads, copy failures, interrupted journals, rollback and sidecar self-update.
6. Publish release assets only after native acceptance. No release or `main` merge has been performed.

Remaining acceptance gaps are explicit: final native compilation/runtime, actual IDE exit-hook acceptance on the chosen beta, real self-update/recovery, native DPI/accessibility and publication of the first release assets. These do not block the source implementation or push.

