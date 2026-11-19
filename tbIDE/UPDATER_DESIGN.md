# Unified updater design

**Decision recorded:** 2026-11-19  
**Status:** Source implementation candidate exists in tbUI3IDE 0.3.0.21 and Updater 0.1.0.0. Final native compilation/runtime and first release publication are pending; see [current implementation](Updater/README.md).

## Goal and scope

Build one small, standalone Windows updater, provisionally named **Updater.exe**, placed alongside the existing twinBASIC IDE executable. The unified tbUI3IDE add-in checks for updates and offers the user a normal update workflow. The updater installs changes after the IDE is safely closed, because loaded add-in DLLs and IDE binaries cannot be reliably replaced in place.

The update catalog covers four independently versioned components:

1. **Official twinBASIC IDE**: discover an applicable official twinBASIC GitHub release, download its published ZIP and update the existing portable installation.
2. **tbUI3IDE add-in**: update the matching win32 and win64 builds of tbUI3IDE.dll under the existing IDE addins directories. Do not reinstall retired WinUI3IdeStyle.dll or TabViewDesigner.dll.
3. **WinUI3 Dark / WinUI3 Light IDE themes**: update the installed theme files in their existing location, without changing users' selected theme or unrelated themes.
4. **tbUI3 resources / control distribution**: update the existing developer-machine icon resource pack (tbUI3-Icons.dat and associated metadata in %LOCALAPPDATA%\tbUI3), and discover/download separately distributed tbUI3 control package releases when available. Updating the icon resource pack must not rewrite user projects or their embedded TWINPACK references.

The tbUI3 resource pack is distinct from the add-in and from the tbUI3 control TWINPACK. Keep the existing icon-picker Setup install/update/reinstall/uninstall experience compatible with the shared version and install-state logic, rather than creating conflicting installers.

## User experience

- Perform a lightweight, nonblocking update check at a suitable IDE startup/interval and expose a manual **Check for Updates** action in an appropriate add-in/IDE settings surface. Exact placement is a UI implementation decision.
- Show installed and available versions and which components are affected. Do not claim an update exists until its source manifest/release and applicable asset are confirmed.
- Download selected updates to a separate temporary staging directory while the IDE runs, when possible. The helper must revalidate the staged content and can download or retry any missing or stale asset.
- Present **Update Now**, **Update on Exit** and **Remind Me Later**. A dismiss/skip action leaves the current installation untouched; remembering a skipped version is optional and must be reversible.
- **Update Now**: arrange the updater handoff, then request normal IDE shutdown so the IDE can handle unsaved work. If the user cancels IDE shutdown, do not apply the update.
- **Update on Exit**: record the pending update; when normal IDE exit begins, start the helper and let it wait for IDE and relevant compiler/helper processes to release target files. Do not interrupt or force-close the user's IDE session.
- After success, offer to relaunch the same IDE executable with the previous launch context where practicable. Restart behavior must not discard unsaved work, and the user must be able to decline.

## Chosen installation policy

**In-place overwrite is intentional.** Preserve the current installation folder and component-specific destinations. Do not create parallel numbered twinBASIC installations or require the user to migrate shortcuts and preferences. The official beta recommendation to unpack into a clean directory is acknowledged, but the agreed updater behavior is an in-place installation.

To make this reliable:

1. Resolve the existing twinBASIC installation path and installed architecture/components; never guess a path or replace a different installation.
2. Obtain release metadata and only appropriate archive assets from trusted/approved release sources. Version-check components independently, including a clear pre-release/beta policy.
3. Stage all selected assets outside the files being replaced. Validate expected size and SHA-256 from trusted manifests or release metadata. Apply safe ZIP extraction: reject absolute paths, traversal paths, collisions and unexpected target paths.
4. Wait for IDE, loaded add-ins and any compiler cache/helper processes that hold target files to exit. Recheck lock state before replacement. Do not kill unrelated processes.
5. Back up every managed file to be overwritten and persist a small recovery journal before modifying installation files. Replace only the expected managed paths. Preserve user-added files, workspace projects, settings and unrelated add-ins.
6. Apply updates and verify the resulting files/versions. On an error, restore the backup, retain a useful log and show a clear recovery message. If rollback itself fails, retain backup and journal for manual recovery.
7. Only after successful verification mark the installed versions updated and clean up temporary state. Make interrupted or repeated runs idempotent. Handle a pending Windows reboot and permission/elevation requirements explicitly rather than silently forcing them.
8. Update Updater.exe itself by using a detached temporary helper/copy, never trying to overwrite its running executable.

For a multi-component operation, the implementation must define and test its rollback boundary before release. Prefer a recoverable all-selected-components transaction where feasible; do not report a global success if a required component failed.

## Release sources and trust

- The twinBASIC source is the **official** twinBASIC GitHub release distribution, not a hard-coded third-party mirror. Verify the repository, asset naming, ZIP contents and architecture mapping during implementation rather than assuming a particular release API or filename.
- The tbUI3IDE add-in and WinUI3 themes are released from this project's controlled distribution; package them with versions, install-relative paths and hashes. The resource pack retains its separately published manifest/release metadata where applicable.
- The Arrow-Loop/tbUI3 development repository is private. A desktop updater must not embed a GitHub personal access token, private key or reusable maintainer credential. Determine a usable authenticated release channel or public distributable assets before coding the download client.
- Manifest and release metadata must prevent mixing mismatched add-in/IDE architectures, unintended downgrade, or applying an asset whose digest cannot be established. Consider signature verification if the respective publisher supplies it.
- Keep a version/compatibility policy for beta IDE changes that can break private add-in APIs. A newer IDE build does not automatically prove the add-in is compatible; warn or allow users to exclude incompatible components.

## Implementation boundaries and follow-ups

- The add-in owns version discovery, notifications, selection, staged-download requests and a safe helper launch. It never overwrites its own loaded DLL.
- Updater.exe is a small, architecture-appropriate standalone executable with no dependence on the loaded tbUI3IDE add-in. It owns shutdown waiting, download/revalidation fallback, ZIP extraction, backups, replacement, rollback, logs and optional relaunch.
- Reuse existing tbUI3 icon library manifest/hash/install-state behavior when possible. Do not replace it with a second disconnected update state.
- Installing a new control TWINPACK into the developer's IDE is a distinct integration decision. Existing consumer .twinproj files embed package versions; the updater must not silently rewrite those projects or their serialized controls.
- Installation must work for both win32 and win64 IDE add-in directories; respect the existing user profile's theme and library paths. Handle network or permission errors without damaging a working IDE.
- Record exact approved release endpoints, release artifact formats, compatibility rules, staging/backup paths, persisted update schema and privilege policy before implementing.
- Test normal update, deferred update, saved/unsaved/cancelled exit, running/lingering process, locked file, interrupted download, corrupt archive, insufficient permissions/disk space, partial replacement/rollback, updater self-update, repeated run, offline mode, and both IDE architectures. Include component-only and combined updates.

## Original delivery sequence (current status in Updater/README.md)

1. Finalize release asset/manifest contracts and decide how private add-in distribution is made accessible.
2. Implement a read-only update detector and nonblocking user notification in tbUI3IDE.
3. Implement staging, verification and the persistent Update Now / Update on Exit handoff.
4. Build Updater.exe with process waiting, in-place replacement, backup/recovery, logging and restart.
5. Integrate all four component types, self-update and existing icon-library setup; validate win32/win64 and recovery scenarios.
6. Document user-facing installation and maintenance after the implementation has real evidence.

This document records the agreed behavior and outstanding engineering decisions. The initial documentation-only pass included no implementation; the subsequent coordinated source implementation is now recorded in the changelog.
