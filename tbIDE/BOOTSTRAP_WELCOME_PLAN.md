# Self-provisioning tbUI3IDE bootstrap and Welcome Wizard

**Current checkpoint:** See [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md). Native helper acceptance and canonical embedding are complete; compiled DLL and live bootstrap acceptance remain open. This document describes the approved design.

**Agent implementation entry point:** [INSTALLATION_MANAGER_SPEC.md](INSTALLATION_MANAGER_SPEC.md) is the consolidated cross-phase specification capturing Shane's exact UX, preservation, update strategy, release inventory, discovery and compatibility decisions from the full planning discussion. This bootstrap plan expands first-install and Welcome Wizard details. If older phase planning prose differs, follow the newer approved decisions in the consolidated specification; actual source behavior must still be verified independently.

## Delivery sequencing decision: merged first production milestone (2026-11-23)

**Shane approved combining the former Phase 1 (production-ready native updater) and Phase 2 (self-provisioning and Welcome Wizard) into one FIRST PUBLIC / SMITH DEBNAM PRODUCTION RELEASE gate.** Do not ship a final release that requires separately copying `Updater.exe` or the two themes. The currently implemented updater remains the starting point for native validation, not a substitute for the agreed first-install deliverable.

The combined first milestone includes: native updater compile/runtime/47 self-test and transactional/recovery acceptance; verified GitHub release manifest and packaging; user-installed architecture DLLs in the **per-user** `%APPDATA%\twinBASIC\addins\win32|win64` directories (subject to verifying twinBASIC's actual per-user search paths, duplicate-loading behavior and version compatibility); each DLL's embedded, hash-verified updater/themes; silent provisioning/repair to `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` and `%APPDATA%\twinBASIC\themes`; a versioned, re-openable IDE-hosted HTML/CSS/JS Welcome Wizard; IDE Options for update-check preferences; installation-specific identity/settings/recovery scopes; and migration away from the legacy beside-IDE helper. Keep ordinary IDE updates **in place** as the default. Test user-selected theme persistence, offline bootstrap, protected IDE directories, missing/modified resources and multi-IDE isolation before publishing.

**Future installation-management architecture to preserve now, without requiring complete implementation at first release:**

- Define a versioned installation identity, settings schema and update planning/strategy contract. The initial concrete strategy can remain `InPlace`; make later `InstallAlongside` and `ArchivePrevious` independently implementable without replacing update download, verification or recovery logic.
- Preserve a release-file inventory model derived from the *verified actual upstream archive* with strictly constrained path validation; track known official previous-version inventory and user/unknown modifications separately. A newly introduced vendor directory must not automatically be classified as user content. Avoid hard-coded folder assumptions as the only source of legitimacy.
- Future strategy `InstallAlongside`: configurable destination root and naming; preserve old installations and their per-installation preferences. Future strategy `ArchivePrevious`: configurable archive root **including another volume**, preserve the entire old environment safely, with per-folder rules to keep extra content in archive only, new install only or **both** (recommended for recognized user files). For cross-volume archive, stage/copy/hash-verify before any original removal; journal and recover.
- Future **Reorganize Existing Installations** wizard: find candidates by registered/running paths and conservative nearby/user-selected discovery (not arbitrary filesystem scans), let the user confirm identity and exact old/new paths, offer opt-in reorganization and reviewed shortcut adjustments. Discovery never authorizes moving anything. Never prompt repeatedly on every routine update.
- Configure strategy, archive destination, additional-content preservation and management preferences through **IDE Options → tbUI3 → Installations**, saving per-installation settings under LocalAppData. Preserve explicit user decisions; prompt only when new unhandled conflicts make safe operation impossible.
- Shared user add-ins require **actual host-loader compatibility/precedence verification** before implementing installation-specific archived add-in overrides. Do not assume a shared copy can unregister/unload after local and shared copies have already loaded. Keep a future compatibility opt-out/override as an advanced feature only after host behavior is established.
- Do not implement bulk reorganization, shortcut surgery, archive transfers or multi-layout detection as first-release blockers. The first-release release-inventory and identity contracts should remain extensible enough to add these without destructive migrations.

The [Updater README](Updater/README.md) describes the current deployment. See the handoff for acceptance.

**Status:** Approved design implemented in source; live acceptance remains open. This supersedes the original beside-IDE helper placement in the historical [UPDATER_PLAN.md](UPDATER_PLAN.md).

## User-facing contract

The only manual first-install payload is the appropriate `tbUI3IDE.dll` for each twinBASIC architecture the user runs, preferably placed in the shared `%APPDATA%\\twinBASIC\\addins\\win32` and/or `win64` folder, subject to loader acceptance. The add-in DLL must *embed* the complete portable **Win32** `Updater.exe` and both `WinUI3 Dark.theme` and `WinUI3 Light.theme`. Either DLL alone must be able to provision these assets; both contain equivalent resource bytes and validated manifest entries. No separate user-installed EXE, setup wizard binary, PowerShell script or loose HTML/CSS/JS is required.

When the add-in loads, it checks for missing/outdated **bundled** dependencies regardless of whether this is the first launch, whether automatic online update checks are enabled, or whether the Welcome Wizard was previously dismissed. It silently restores missing resources where permitted, without replacing a newer installed updater or overwriting modified user themes. Resource bootstrap is local, offline and distinct from user-approved *downloaded* updates.

### Directories

- **Shared updater executable:** `%LOCALAPPDATA%\tbUI3\Updater\Updater.exe` (per Windows user, one current updater executable shared by multiple twinBASIC installations).
- **Per-installation updater state and recovery:** under `%LOCALAPPDATA%\tbUI3\Updater\Installations\<Installation-ID>\`, with deterministic, collision-resistant installation identity based on the normalized canonical IDE root; no reliance on installation folder name or version alone. Preserve the existing updater's transactional journal, staging, backup/recovery and file-lock safety during migration; migrate legacy contexts carefully.
- **Shared per-user themes:** `%APPDATA%\twinBASIC\themes\WinUI3 Dark.theme` and `WinUI3 Light.theme`, preserving the user's active theme selection and any customized theme contents.
- **IDE installation:** only manually installed `addins/<architecture>/tbUI3IDE.dll`; bootstrap does not put `Updater.exe` beside `twinBASIC.exe` or require writing to its program directory.

The `Updater.exe` location is local-machine user application data, *not* roaming AppData: the latter is appropriate for small themes/settings, but not executables, caches or update transaction state. This prevents roaming executable conflicts and avoids routine UAC prompts for bootstrap, including IDE installs under `Program Files`. The user may still need admin permission to place the add-in DLLs in protected locations.

### Multiple parallel twinBASIC IDE installations

One updater executable can service multiple IDE roots without combining their state. An update action, approvals, pending On Exit consent, installed IDE build, rollback backups, version receipts, channel/preferences and restart target must be explicitly scoped to the **originating installation**. Never update all roots just because they share a user profile or shared `Updater.exe`. Multiple add-in processes/architectures may start concurrently; protect shared provisioning with a named cross-process lock and atomic verified replacements. If a newer shared updater is already installed, an older DLL must not downgrade it. A newer updater must retain documented compatibility with older installed add-in clients, or clearly report it as incompatible rather than silently replacing it.

### Embedded resource provisioning policy

1. Store the canonical, versioned updater EXE and exact theme bytes as embedded binary resources in the add-in project, using a build/package pipeline that verifies resource presence and SHA-256 (and updater version/PE identity) for **both architectures**. Do not embed arbitrary downloaded content.
2. On each add-in load, safely probe the shared install paths. Missing file => provision from the add-in; identical verified file => do nothing; installed updater newer than bundled => keep installed. Upgrade an older *recognized managed updater* only after validating the bundled candidate and ensuring that the executable is not in use. If busy, defer and retry safely. Unknown, corrupt, incompatible, or user-modified existing files => preserve and surface a targeted recovery action rather than silently overwriting.
3. Theme files: install when missing; avoid overwriting user edits. If a managed theme is outdated, replace only when its existing hash is a known unmodified earlier supplied version, otherwise preserve and offer explicit choice/reset. Never silently change the active IDE theme or reset the selected theme setting.
4. Use atomic, same-volume temporary-file writes and post-write hashes; create parent directories safely. No automatic elevation, forced process termination or writing through reparse points. If provisioning fails, the add-in still loads and shows a useful error/action; no repeated intrusive prompt loop.
5. Treat bundled updater repair, subsequent online updates, updater self-replacement and release package verification as distinct paths. The standalone updater's signed/hash-checked transaction and rollback guarantees must not be weakened by bootstrap.
6. Update the add-in controller's present `<IDE>\Updater.exe` assumption, the portable worker's path/receipt contracts, installer/release manifest, packager, tests and operational documentation together. Keep the shipped updater as a single native twinBASIC executable with embedded WebView2 assets.

### Protected locations and UAC

Bootstrap writes only to the user's data paths and normally needs no elevation. A user-approved update that modifies the IDE under a protected directory may require Windows UAC. Stage and verify in user space first; request elevation *only* when the user approves a specific file-changing transaction and the target requires it. The elevated worker must accept only a validated, constrained plan, retain existing locks and rollback/recovery, and handle UAC denial without damage. The scoped worker is implemented in source; native protected-folder acceptance remains open. Avoid probing protected writes with dangerous partial modifications.

## Welcome Wizard

An embedded **HTML/CSS/JavaScript** Welcome Wizard runs in the add-in's existing IDE-hosted UI context, using the shared WinUI3 visual design, with no dependence on `Updater.exe`, any network connection or a separately initialized WebView2 sidecar. The first-run welcome experience is informational/configurational and **does not gate** resource provisioning.

- Trigger when no per-user completion/dismissal record exists for the current wizard schema; typically after bootstrap on first add-in use. Missing/deleted dependency on a later launch is a repair event, **not** a reason to replay the wizard.
- Persist wizard completion/dismissal per user independently of each IDE installation, with schema version so a substantial future onboarding revision can be offered deliberately. Provide **Welcome to tbUI3IDE** in the IDE Help/add-in entry point and IDE Options to reopen it at will.
- Pages: Welcome; conditional Setup only when attention is required; Updates; Themes (all effective installed themes with compact resolved-color previews); Toolbar (Classic/Hybrid/Ribbon); Features (add-in capabilities); Finish (preferences only). No channel selector until a genuine stable channel exists. The normal flow has six pages.
- Explain the exact new IDE Options controls and direct user to them. Settings offered in the wizard must use the actual add-in's configuration APIs, not simulated UI state; users can back/skip/finish, and their settings persist. Do not apply a WinUI3 theme without express selection. Default to leaving IDE theme and toolbar preference unchanged unless the user chooses otherwise.
- Silently provision and verify before onboarding. Report only issues requiring attention on the conditional Setup step after Welcome. The wizard must still run when `Updater.exe` is missing or cannot launch. A failed bootstrap should not be represented as a successful installation.
- Reuse an accessible WinUI-styled view/container for a future **What's New** experience; use responsive layout, keyboard navigation, focus management, screen-reader names, Light/Dark/accent support and non-blocking operation.

## Delivery / acceptance / release sequencing

1. The accepted Updater 0.2.0.0 and canonical embedded bundle are complete. Follow the current [Phase 1 handoff](PHASE1_HANDOFF.md) for Win32/Win64 add-in compilation and actual resource verification.
2. Verify DLL-only deployment, shared updater and per-installation state, not the superseded manual helper model.
3. Exercise fresh first-install using only architecture-appropriate DLLs, repair after deleting individual resources, older DLL after newer updater, two concurrent IDE installations, Win32/Win64 races, read-only files, customized themes, corrupted resources, locked updater, UAC rejection, offline startup, wizard dismissal/reopen/configuration, and AppData paths with spaces and Unicode.
4. Test protected `Program Files` IDE with normal (unelevated) bootstrap; for any separately implemented elevated update worker, confirm explicit consent, constrained destination, rollback, cancellation and UAC denial.
5. Publish a properly marked prerelease only after native acceptance, with DLLs that really contain verified payloads. Do not publish the current manually assembled loose-file ZIP as if it already provides self-provisioning. Preserve separate independently versioned release assets where needed by the updater.

The first-party core tbUI3 control package's separate prerelease version migration remains outside this scope.
