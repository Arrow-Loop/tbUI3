# Unified updater for twinBASIC and tbUI3

Status: **Agreed future work, not implemented**. Decision date: 2026-11-19. This document is the implementation handoff for the tbUI3IDE update feature and its standalone helper.

## Scope and ownership

The existing `tbUI3IDE.dll` add-in discovers updates and owns the in-IDE user experience. A small standalone `Updater.exe`, installed beside the twinBASIC IDE executable, performs file replacement after the IDE closes. Both are part of the tbUI3 developer tooling, not dependencies of applications built with tbUI3.

Manage independently versioned components:

1. The **official twinBASIC IDE** portable distribution, obtained from its official GitHub releases/distribution source. Confirm the canonical release endpoint, asset naming, beta/stable channel semantics and version metadata during implementation; do not infer them from repository commit dates.
2. **tbUI3IDE** add-in binaries for **both** `addins/win32` and `addins/win64`, from explicitly published Arrow-Loop/tbUI3 release assets.
3. **WinUI3 Dark/Light IDE themes**, installed into the existing per-user `%APPDATA%\twinBASIC\themes` location. Preserve existing user-selected themes and preferences.
4. **tbUI3 resource/icon library pack**, from its existing Arrow-Loop/tbUI3-Libraries release and manifest contract (`icons/manifest.txt` on main, release asset named by the manifest). Preserve the established developer-only `%LOCALAPPDATA%\tbUI3` installation and existing icon picker Setup behavior; unify discovery/install coordination without introducing conflicting version stores.
5. **tbUI3 control package**, when an installable official release asset and suitable local installation target are defined. Download/offer the package, but do **not** silently mutate `.twinproj` embedded package references or project-specific copies. Project/package migration is an explicit separate workflow.

The updater should remain useful if some components have no update available or one remote source cannot be reached.

## User experience

On startup, or at a sensible nonblocking interval, the add-in checks metadata for new versions without downloading or installing arbitrary GitHub branch contents. Provide a user-invoked **Check for Updates** action and visible installed/available versions for each component. Allow the user to opt out of automatic checks or defer prompts.

When updates are found, show the components, versions, source and summary. Offer **Update Now**, **Update on Exit**, and **Remind Me Later** (or **Skip This Version** when explicitly supported). No silent replacement. Never imply that a downloaded archive is already installed.

- **Update Now**: download and validate requested release payloads to staging; ask the IDE to close through its normal shutdown/save-prompt behavior. Cancellation or an unsaved-document refusal stops the update. Launch the updater with a validated update plan; it waits for the relevant IDE and compiler/add-in-host processes to release files before installation.
- **Update on Exit**: retain the approved, validated plan and staging across the session; start the updater when the IDE actually exits. Abnormal termination or missing staging must not turn into an unsafe install; allow a later retry.
- **Remind Me Later**: do not close the IDE or install. Persist the deferral state.
- On success, optionally **restart the same IDE executable path** with the same working directory and no speculative restoration of unsaved editor state. On failure, explain the error and provide a retry/rollback path.

The user may choose individual updates. An IDE update and an add-in update should be presented together when available but must have independent versions and outcomes. Inform users when an add-in release specifies minimum/maximum supported IDE builds.

## Staging, replacement, and recovery

**In-place overwrite is the approved installation policy**, including for twinBASIC beta releases. Do not create numbered permanent install folders or relocate the IDE. The installer must never overwrite running/locked binaries.

1. Resolve the IDE installation from the process executable path, not from a guessed drive or fixed directory. Explicitly validate the target paths and write permissions.
2. Resolve release versions and download complete archives to a user-writable temporary staging directory. Never execute untrusted downloaded content or accept redirect destinations outside the approved source policy.
3. Validate HTTP status, release identity, file lengths and SHA-256 checksums from trusted release metadata. Where available, verify signatures. Reject path traversal, absolute paths, symlinks escaping the root, duplicate archive destinations and non-allowlisted target paths. Match add-in architecture to destination.
4. Write a durable per-update manifest/journal covering expected versions, source URLs, checksums, destinations, pending status, backup locations and restart target. Avoid storing access tokens or user secrets.
5. Start `Updater.exe` before IDE shutdown only as the detached orchestration process, **or** arrange a supported on-exit launcher. The helper must wait for the specific IDE/process handles and file locks to clear, with bounded timeout and a visible retry/cancel choice. Do not indiscriminately kill other twinBASIC sessions.
6. Back up **only files scheduled for replacement** and track any newly created files so rollback can remove them. Preserve unrelated files, user configuration, themes from other authors, extensions and projects. A directory-wide blind ZIP extraction must not remove or replace files outside the approved manifest.
7. Apply staged files directly over their current locations, using same-volume temporary files and atomic renames where possible. Maintain a journal for recovery from interruption between operations. If a file is locked, fail safely rather than forcibly replacing it.
8. Validate installed payloads after copying. If any component fails, revert its replaced and newly created files from backup; do not claim atomic all-component rollback unless it is implemented and verified. Record success only after validation.
9. Clear staging and temporary backups after confirmed completion according to a bounded retention policy. Keep a diagnostic log and concise error summary.

If the IDE's portable archive has renamed/removed files, handle obsolete shipped files using a **version-specific allowlist**, not a blanket cleanup. Preserve local extensions and any modified/user-owned files. In-place overwrite is intentionally different from the vendor's current clean-folder beta recommendation; compatibility and cleanup require extra care.

## Updater self-update

Because `Updater.exe` cannot replace its own running executable, launch a verified temporary helper/copy outside the installation directory when updating the updater itself. The temporary helper waits for the original updater to exit, swaps the validated executable, handles rollback and exits. Never execute a newly downloaded updater before its integrity and provenance are verified.

## Release metadata and packaging contracts

Agree on a stable machine-readable release manifest for tbUI3IDE/themes/resource-pack updates and document its schema, release-channel selection, architecture pairs, hashes, compatibility bounds and source URL restrictions. Read the official twinBASIC release metadata independently. The icon library already has its own manifest; integrate with it rather than silently replacing its format. Private GitHub API authentication must not be required for public releases.

Do not treat `main` or `tbui3-dev` heads as published binaries. CI/release packaging must produce architecture-correct DLLs, theme files and installer/updater assets before automatic distribution is enabled. A published version's manifest must be immutable; prefer signed assets or authenticated checksums.

## Implementation sequence

1. **Discovery spike**: establish current official twinBASIC distribution source and version extraction; inspect the existing icon-library updater and release conventions; choose a stable per-component release manifest.
2. **Standalone updater**: build minimal native twinBASIC project from the approved seed; implement lock waiting, staged in-place replacement, journal, backup/rollback, self-update and restart.
3. **IDE integration**: checks, update notification, versions, per-component selection, Update Now/On Exit/Later and clean IDE exit/handoff in Classic/Hybrid/Ribbon.
4. **Release pipeline**: publish both add-in architectures, themes and helper with hashes; coordinate tbUI3 library pack and control package download contracts.
5. **Acceptance**: test IDE open/closed, canceled unsaved changes, compiler still running, simultaneous IDE instances, blocked/partial downloads, corrupt archives, invalid paths, no write access, mixed component updates, crash/power interruption recovery, rollback, restart, offline/ratelimited GitHub, win32/win64, beta channel transitions and updater self-update.

All code changes must follow the repository's canonical `.twinproj`/mirror and changelog workflow. No updater functionality is claimed delivered by this planning document.
