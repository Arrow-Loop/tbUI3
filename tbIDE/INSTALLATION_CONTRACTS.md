# Installation contracts, revision 2

JSON is UTF-16LE with BOM on disk and strict UTF-8 input is accepted. Hashes are lowercase SHA-256. Unknown protocol, schema and operation versions fail closed. [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md) records native validation.

## Identity and storage

`InstallationContracts.twin` is shared byte-for-byte by both projects. Resolve the existing installation directory through a directory handle/GetFinalPathNameByHandleW; reject reparse ancestors, normalize case using invariant LCMapStringEx, then hash its UTF-16LE bytes without BOM. Identity is `v1-` plus all 64 hash digits. Folder identity remains available if a failed transaction removed/damaged the launcher. New add-in registration separately validates the launcher's PE. A move creates a new identity; discovery/migration is deferred.

- Shared DLLs: `%APPDATA%\twinBASIC\addins\win32|win64\tbUI3IDE.dll`.
- Shared themes: `%APPDATA%\twinBASIC\themes\WinUI3 Dark.theme` and `WinUI3 Light.theme`.
- Helper: `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` (portable Win32 executable for both IDE architectures).
- Installation home: helper directory plus `Installations\<identity>\`.
- Installation home contains `identity.json`, `settings.json`, `Receipts\`, `Sessions\<session>\`, `pending.json`, `active.json`.
- Helper `Shared\` contains managed resource ledger, component receipts, Welcome completion and explicit repair backups. Native per-file replacements, durable JSON and archive streams use Unicode Windows APIs/extended paths.

`identity.json` schema 1 records id, canonical root, first/last seen, origin SID, executable and protocol. Settings schema 1 records installation identity, strategy `InPlace`, automatic checks, development/stable channel, restart, last check and deferral. Read/modify/write is locked per installation, preserves unknown fields and rejects future schemas. Legacy automatic/deferral settings are copied only when this installation has no settings file. Theme/toolbar choices continue using the IDE's established user-wide settings; they are not update approvals.

Named mutexes include the user's SID: per-installation transaction, per-installation settings, Welcome record and shared resources. Shared-resource lock is acquired after normal IDE shutdown, so an Update on Exit waiting overnight cannot block offline provisioning in another IDE. A busy operation reports/retries safely. Shared replacement still fails safely if another IDE has its DLL loaded.

## Session and approval

Launch modes `Quiet`, `Review` and `Settings` use bridge version 1 with release/engine protocol 1. The add-in creates a saved origin context for the running compiler and starts only the recognized compatible helper. The updater captures the owning IDE PID and FILETIME before discovery. It runs its standalone UI and workers from verified detached copies so the shared executable is replaceable. Quiet mode serializes discovery/notification per installation and applies the stored daily check and deferral preferences. Review always requests a check. Settings opens the current installation's preferences and recovery actions directly.

1. Updater.exe creates a fresh transaction context on explicit consent. It records its session directory identity, expiry, origin-context SHA-256, owning IDE PID/FILETIME, compiler identity, choice, restart preference and ordered component/release asset identities. The selection includes any authenticated baseline asset supplied by discovery. An origin-local `arm.json` names the transaction.
2. The add-in validates the contained context, launch hash, protocol, matching live compiler and owning IDE. It installs the native hook before writing `armed.json`. The already visible updater starts payload staging only after verifying that record. Update Now also writes a bound `request-exit.json`; Update on Exit waits for the user's native close command.
3. The native IDE uses its usual Save/Discard/Cancel handling. The bridge intercepts the accepted exit at `closeProjectNow` before compiler teardown and writes `native-exit.json` as `shutdown` before resuming the original continuation. A cancelled native prompt records `cancelled`. Closing a project alone skips the bridge. Each record binds the installation, exact context digest, launch digest and unique transaction session. Expiry and cancellation prevent stale approval from writing.
4. Staging verifies the catalog selection before downloading, validates the completed plan and writes `verified-plan.json` with the request and plan digests. Apply validates the plan against the authorized ordered selection and process identity, verifies all bridge records, waits for process/lock clearance, and rechecks cancellation before entering the transaction. Scoped elevation pins the bridge and staged inputs and independently revalidates release provenance. Previously interrupted journals remain eligible for the existing recovery path.

Context schema 3/protocol 1 includes installation id/root/stateRoot, origin SID, compiler PID plus exact FILETIME birth, IDE executable, shared helper path, strategy, channel, client compatibility bounds, selected components, choice and restart. Its path must be exactly an immediate `Sessions/<session>/context.json` under the derived installation home. PID reuse cannot authorize a later session.

A schema-3 catalog captures actual owning IDE identity by following compiler ancestry. Plan schema 3 includes protocol, installation identity/root, `strategy: InPlace`, `strategyVersion: 1`, explicit `targets[]`, settings snapshot, selected verified components, identity and operations. Each target names component, root, `installation` or `userShared` scope and installation identity. Strategy validation recomputes these scopes.

An operation is version 1, `kind: ReplaceFile`, with root, relative target, staged file and SHA-256; optional `expectedOriginal`/`expectAbsent` bind preconditions. Stage paths must remain in the session. Only selected-component allowlisted targets and constrained receipts/managed ledger are permitted. Phase 2 can introduce strategies/operation versions without replacing release verification, views, identities or the transaction boundary; this version implements no alongside/archive/discovery operations.

Legacy plan-bound approvals are retained as historical files. New Apply operations require the active bridge contract. Restart uses the originating executable after a successful transaction.

Journals schema 3 bind the full encoded plan digest. All destinations are preflighted and original bytes durably backed up/hash-verified before the first replacement. Each operation moves through prepared/intent/applied/reverted; intent is flushed before replacement and completion afterward. Renames are same-volume; rollback verifies originals and refuses unexpected post-update edits. Incomplete sessions/backups remain for recovery. Completed sessions older than seven days are eligible for conservative cleanup; cleanup failure retains them.

## Verified release inventories

Release manifest schema 2 requires protocol range including 1, `deployment: perUser`, matching tag/channel and four-part add-in version. Major zero is valid development; future 1.0.0.0 is valid stable. Only documented historical mistaken add-in identities are normalized. Core control-package, library and upstream numbering are independent. The initial public release lists only the add-in component and both architecture DLL targets. Optional separate updater/theme components remain supported by the native contract; when an updater component is listed it declares its protocol range. The embedded bundle retains the helper and theme identities independently of the release manifest. Installed versions are rechecked before replacement to prevent races/downgrades.

GitHub metadata is HTTPS from fixed repositories; downloads require approved repository/tag/CDN, size and SHA-256. ZIP paths, central/local identities, sizes, duplicate names, methods, CRC and DEFLATE are checked. PE architecture/fixed version and any present Authenticode signature are checked; explicitly unsigned files require the authenticated archive/file digests. Upstream GitHub release-asset digest absence fails rather than guessing trust.

Inventory schema 1 records verified asset identity and **all official ZIP files**, size/hash, managed flag and disposition. Phase 1 replaces only its constrained IDE runtime set; projects/themes/addins from the vendor distribution remain inventoried/unmanaged. New managed files are installable; removed vendor files are classified and preserved. Unexpected new vendor top-level paths fail with a vendor-layout review message, not a claim that they are user files. Modified vendor-name collisions and customized themes are preserved. Actual shared theme updates require recognized original ledger hashes and preflight rechecks.

## Bootstrap and shared helper

Bundle manifest schema 1/protocol 1 embeds resource ids updater/themeDark/themeLight, exact resource names, versions, sizes, SHA-256 and helper protocol bounds, plus canonical updater project hash. Each DLL architecture must contain identical verified payload bytes. Offline bootstrap runs at every add-in load and retries while shared files are busy, independently of online opt-out and Welcome completion. Missing resources are provisioned atomically. Exact matches are registered; recognized older resources may be upgraded. Newer helper binaries are never downgraded. Unknown/modified files require explicit backed-up reset; a newer helper without a compatible recognized ledger remains preserved but cannot be launched. Resetting a corrupt/future resource registry also requires explicit approval and a verified backup, then treats unknown bytes conservatively.

Detached session copy runs Apply/Recover so the shared EXE can replace itself. Never execute arbitrary helper bytes just because a file exists: launch verifies ledger hash, PE version/architecture and protocol. The accepted helper and exact themes are embedded in the canonical add-in; compiled resource verification and offline bootstrap acceptance remain required.

## Protected installations

Bootstrap stays unelevated and writes only per-user locations. An already approved transaction probes IDE destinations; access denial offers a visible scoped UAC action in WebView2. Denial changes no installation files. Elevated GUI/check/stage is refused. Only a detached Apply/Recover worker may elevate, with fixed context/plan hash arguments and the same originating Windows SID. Different-account credentials are rejected.

The privileged worker pins context, plan, staged inputs, recovery backups and directory ancestry with handles denying writes/deletes, rechecks reparse points, validates plan destinations and re-authenticates release metadata/downloads independently. Protected originals/recovery backups must match a freshly verified old official archive, not a user-editable receipt. Recovery uses an immutable in-memory journal snapshot while writing durable progress. No elevated append to a user-controlled log. Network failure or a moved latest release can require rechecking; unavailable authentic old baseline requires manual recovery from retained evidence. Empty preparation directories can remain after failure; payload replacement still requires the transaction. This is a same-user application elevation boundary, not a defense against a compromised executable/account or malicious administrators.

## Wizard/native adapter

Quill owns `prototypes/welcome-wizard`; production embeds its committed JS/CSS unchanged and never ships its preview/mock adapter. The allowlisted intents are defined below. Each queued request gains a native `requestId`; snapshots carry `ack:{id,ok}` and actual theme/toolbar/preferences. The adapter withholds authoritative wizard snapshots until all outstanding ids settle, so unrelated bootstrap refreshes cannot acknowledge pending choices. Native failures restore actual values and report an error. Theme reload has a 15-second cancellation token; toolbar failure restores the previous requested mode. Settings/repair views use scoped shared toolkit CSS; Wizard uses the full approved shared Master CSS/control runtime inside an isolated same-origin iframe under a modal HTML dialog, with live Windows accent. Resource reset requires a styled asynchronous confirmation plus explicit checkbox. Welcome schema 1 is user-global; dismiss/finish are independent of file provisioning. IDE Options exposes settings/repair and reopen in every toolbar mode.

### Welcome-first startup sequence

A lightweight completion check runs before the add-in injects its Welcome bridge. Native IDE dialogs take precedence. The bridge acknowledges the loaded view after yielding through browser frames. Registration, preference initialization, each bundled file and installed theme discovery run in separate IDE timer stages, followed by toolbar and designer initialization. The shared-resource mutex and ledger are acquired afresh for each staged resource. Setup receives task states and per-service readiness alongside the existing correlated acknowledgements. The production startup adaptation extends the approved Wizard view at build time. Quiet launch waits for the saved disposition, a closed Welcome, initialized preferences and a verified helper. Automatic windows use the validated originating IDE identity to choose normal Z-order without activation. Explicit review requests regular window activation, subject to [Windows foreground rules](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow).

### Native services and snapshot

Production bridge requests are structured objects from the add-in-hosted JS queue; no filesystem paths, executable names, arbitrary commands or update approvals are accepted from the wizard.

| Intent | Payload | Native effect |
|---|---|---|
| `choose-theme` | `name`: exact current installed-theme inventory member | Reload actual IDE theme list, select/persist via the verified BETA 1045 IDE APIs, acknowledge actual result. No selection during preview. |
| `choose-toolbar` | `name`: exact `Classic`, `Hybrid`, `Ribbon` | Existing toolbar controller and the existing per-user toolbar setting. |
| `installation-preferences` | Optional Boolean `automatic`, Boolean `restart`, `channel`: `development` or `stable` | Persist versioned preferences for the originating installation. The Wizard initializes the same per-installation settings used by Updater.exe. |
| `welcome-record` | `schema`: 1; `disposition`: `completed` or `dismissed` | Persist user-global Welcome completion, independently of bootstrap and per-IDE settings. |
| `bootstrap-retry` | none | Offline recheck/repair of missing/recognized bundled assets. Never overwrites unknown/customized files. |
| `repair-resource` | exact resource `id`: `updater`, `themeDark`, `themeLight`; `confirmed`: true | Explicit reset retains a verified backup before replacing a customized resource. Never downgrades a newer updater. |

State snapshots (schema 1): `root`, `installationId`, `preferences` (schema 1, strategy `InPlace`), actual `theme` and `toolbar`, `bootstrap` (`status`, `message`, `resources[]`), `message` (native acknowledgement/error), . Resource entries carry `id`, `path`, `status`, `message`, `repairable` and an optional retained `backup` path. The wizard must show native errors instead of assuming a queued setting has succeeded.

Automatic online opt-out does not disable bootstrap or manual checks. Wizard completion is per user; preferences and transaction approvals are per installation. Future schemas are preserved instead of overwritten by an older wizard. The accepted helper and themes are embedded; compiled DLL verification remains required. A resource must never be replaced by a mock EXE.


## Installed-theme inventory and diagnostic routing

Snapshots now include installedThemes (exact names, base mode, validated preview colors) and themeDiscovery pending/error state. The trusted parent bridge exports BETA 1045 customThemes and its actual inheritsFromLink chains after reloadThemesFromDisk has enumerated both installation and AppData directories. It collapses names with the same case-insensitive first-match semantics as buildThemeData; async load order is not replaced by a guessed directory priority. Native InstalledThemeCatalog parses parent-first declarations into paint values without changing activeThemeData or selecting themes. Supports hex, RGB/RGBA percentages, black/white/transparent and bounded theme-variable references. Unresolvable colors remain unavailable. Only hex color fields enter the iframe; source declarations/files/URLs do not. Selection is checked against the current trusted inventory, refreshed and checked again before apply; failed saves restore the previous theme. Discovery timeout cancels late selection; repair reprovisions before refreshing the list.

The adapter maps native resource statuses to Quill's view vocabulary and includes theme-discovery errors in conditional Setup. The channel selector is removed from both production surfaces while internal schema/channel safety remains. Four approved base assets are pinned by WELCOME_REFERENCE.json. The Wizard JS receives its startup-only production adaptation during synchronization; preview/mock/server assets are excluded.

Shared DiagnosticPaths routes active package/add-in/updater logs and self-test artifacts to %LOCALAPPDATA%\tbUI3\Diagnostics. Operational transaction/settings/profile storage is unchanged. See ../docs/DIAGNOSTICS.md for filenames and opt-in flags.
