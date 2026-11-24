# tbUI3IDE

tbUI3IDE is a single twinBASIC add-in that brings a WinUI 3 look to the IDE, offers Classic, Hybrid and Ribbon toolbar layouts, and adds TabView/MultiPage designer tools. It includes WinUI3 Dark and Light themes and a shared native updater. The add-in is a developer tool intended to work independently of the optional tbUI3 control package, whether or not a developer ever uses that package. Applications built with the tbUI3 control package do not require the add-in. The overall tbUI3/tbIDE project remains prerelease until its planned controls are complete and stable release is explicitly approved; accepted add-in prereleases may be distributed internally.

**Current release:** [tbUI3IDE 0.4.0.9 development prerelease](https://github.com/Arrow-Loop/tbUI3/releases/tag/tbUI3IDE-v0.4.0.9) (Welcome positioning refinement; wider native acceptance remains pending).

## Requirements

- twinBASIC BETA 1045 (BETA 1043 and 1044 are no longer supported from add-in 0.4.0.10).
- A matching Win32 or Win64 add-in DLL for your IDE architecture.
- Microsoft Edge WebView2 Runtime for the updater interface. The Welcome Wizard uses the IDE's existing web host.

## Install

Use the matching DLL from a verified build or release.

1. Close twinBASIC. Remove any older WinUI3IdeStyle.dll and TabViewDesigner.dll copies from both shared and IDE-local add-in folders. Avoid duplicate tbUI3IDE.dll installations.
2. Copy tbUI3IDE.dll into the corresponding folder, creating it if necessary:

   - Win32: %APPDATA%\twinBASIC\addins\win32
   - Win64: %APPDATA%\twinBASIC\addins\win64

3. Start the IDE and open a project.

The add-in provisions the bundled updater and themes in your user profile and provides the first-run Welcome Wizard. Welcome appears before staged prerequisite work; the owner reports near-instant presentation and the intended Wizard experience in the current prerelease. See the Phase 1 handoff for remaining native acceptance. It does not need a separate installer or network access for this setup. Subsequent loads check for missing resources, preserve customized themes and avoid downgrading a newer updater. The wizard offers repair guidance if setup needs attention.

The current development candidate is undergoing native installation and update acceptance; see the contributor handoff before distributing builds.

## Features

### WinUI3 themes

- Select WinUI3 Dark or WinUI3 Light through Window > Theme or the IDE's Colour Theme setting.
- Enable additional IDE theme styling via add-in for WinUI-style menus, dialogs, editor tabs, panels and controls, with the Windows system accent.
- Turn additional styling off to retain the theme alone. The themes can also be installed independently by copying the .theme files from [themes/](themes/) into %APPDATA%\twinBASIC\themes and choosing Window > Theme > Reload from disk.

### Toolbar layouts

- **Classic:** The familiar native toolbar and menus with updated command icons.
- **Hybrid:** Keeps the native menus and groups commands into task-oriented tabs.
- **Ribbon:** Replaces the menu row with task-oriented tabs, Quick Access commands and a fullscreen File view within the IDE.

Hybrid and Ribbon support full and simplified layouts. Use the corner chevron or Ctrl+F1 to switch between them. The toolbar follows your selected IDE theme, independently of additional styling.

### TabView/MultiPage designer (development preview)

The add-in retains experimental TabView/MultiPage designer tooling for the separately developed tbUI3 control package. Full designer functionality is not required for internal IDE prerelease distribution. The add-in enables designer tooling only for an active project with the enabled tbUI3 reference and compiler-resolved controls. The MultiPage commands require a selected TabView or one of its children. Normal projects can use themes, styling, all toolbar modes, Welcome and the updater independently. Native isolation acceptance remains pending.

### Updates

Updater.exe owns the desktop notification, review, preferences, progress and recovery. See the [handoff](PHASE1_HANDOFF.md) for current validation.

The updater checks published releases for the twinBASIC IDE, tbUI3IDE and developer icon resources. The initial add-in release contains both DLL architectures with the updater and themes embedded; they are provisioned or safely upgraded when the add-in loads. Open **Check for Updates** to review available versions and choose which published components to update. Separate updater/theme components can be supported when explicitly published in future releases.

- **Update Now:** Stages approved updates and follows the IDE's normal save and exit prompts.
- **Update on Exit:** Waits for an approved normal IDE shutdown.
- **Remind Me Later:** Leaves the current installation untouched.

Automatic checks do not authorize downloads or installations. Updates preserve user files and settings, use verified payloads and backups, and support recovery. Protected IDE locations may require approval through Windows UAC.

## Settings

In IDE Options, find the add-in settings near **Colour Theme**:

- **Enable additional IDE theme styling via add-in:** Turn optional styling on or off.
- **IDE Toolbar:** Choose Ribbon (default), Hybrid or Classic.
- **Check for Updates:** Open the update review.
- **Update settings:** Open the standalone updater's automatic-check and restart preferences.
- **Resource repair:** Review and repair embedded updater and theme resources from the IDE.
- **Welcome to tbUI3IDE:** Reopen the onboarding wizard.

The last four are also at the end of the **Add-ins** menu (and the Ribbon's Add-ins page) as **tbUI3: Check for Updates...**, **tbUI3: Update Settings...**, **tbUI3: Resource Repair...** and **tbUI3: Welcome...**.

Your toolbar and styling choices persist across restarts. Installation-specific update preferences are saved separately for each IDE installation. Welcome completion is saved per user.

## Troubleshooting

Open %LOCALAPPDATA%\tbUI3\Diagnostics in File Explorer for updater, designer and other diagnostic logs. Some tracing requires an explicit opt-in. See [Diagnostics](../docs/DIAGNOSTICS.md) for file names and troubleshooting instructions.

## For contributors

- [Phase 1 handoff](PHASE1_HANDOFF.md): Current build and native acceptance sequence.
- [Installation Manager specification](INSTALLATION_MANAGER_SPEC.md): Product requirements and safety boundaries.
- [Architecture](ARCHITECTURE.md): Technical design and native integration.
- [Build tools](tools/): Theme generation, project synchronization, embedding and release verification.


## Development test reset

Run [Reset-TestState.bat](Reset-TestState.bat) as the Windows user being tested (no administrator elevation or installed repository tools required). Close every IDE/compiler and updater process. The menu independently resets native options/layouts/shortcuts/window, add-in appearance and Welcome, per-installation updater settings/sessions, Welcome alone, the two shared WinUI3 themes, shared add-in DLLs, native WebView2 caches, and diagnostics. The full test reset archives the helper and all updater state, both shared themes and native WebView2 caches, and resets native/add-in/legacy updater preferences. It deliberately retains shared DLLs so the next launch exercises offline provisioning and Welcome; use the separate shared-DLL removal option to simulate manually copying the add-in again. IDE-local copies and unrelated themes/packages, licences, publisher credentials, recent projects and project files/state are retained. The optional developer icon library is unchanged. Native settings/cache locations follow the [twinBASIC documentation](https://docs.twinbasic.com/tB/IDE/Customising/) and [troubleshooting reference](https://docs.twinbasic.com/tB/IDE/Troubleshooting/Missing-Files).

Selecting a numbered action runs it immediately without a second confirmation. Data is archived under %LOCALAPPDATA%\tbUI3\ResetBackups in a unique dated folder (selected registry values in CLIXML, moved files with a path inventory). Option B opens the backups. To restore, close the IDE and updater; move archived items back to their recorded locations after backing up any newly created replacements. For registry backups, use Import-Clixml and restore the recorded Subkey, value names, types and values under HKCU; do not import into another user's profile. Retain recovery backups until testing is complete. The updater-only reset preserves the shared helper/resource ledger and component receipts but archives all registered installation roots and clears legacy updater preferences; the full reset archives the entire updater directory. Neither reset may discard incomplete transaction recovery. Resolve recovery first if refused. A partial reset stops on error and retains the backup; do not assume it completed. Use only for controlled development testing, not production recovery. Windows execution acceptance remains pending.

## Development release publication

During each release development pass, maintain a concise public `tbIDE/release-notes/<version>.md` describing user-facing changes, known issues and actual acceptance status. This is a developer/agent task, not an extra publishing step for the owner. Do not copy internal assembly instructions or historical pending-work notices. The publisher reads these notes on each run, including resumed drafts, and applies them on publication. If notes are absent it emits a warning and a minimal development-testing notice with a link to the current known-issues roadmap, never raw CHANGELOG text or unsupported acceptance claims.

Development prereleases are also the real updater test channel. Retention and later owner-approved cleanup follow the [versioning policy](../docs/VERSIONING_POLICY.md).

On either Windows development PC, use GitHub Desktop to synchronize the Arrow-Loop/tbUI3 checkout on tbui3-dev. Build the helper and both DLLs as required, then use the existing Prepare-Addin.bat and Package-Release.bat workflow. Git checkouts can reuse the tracked helper when its exact bytes and project match the prepared bundle. Prepare-Addin.bat reuses installed Node.js or automatically downloads and SHA-256 verifies portable Node 22 into the per-user development cache, prepares pinned jsdom when missing, and discovers GitHub Desktop's bundled Git when needed. Initial setup requires access to nodejs.org and registry.npmjs.org; no global installation or elevation is required. Build output and caches are local; GitHub Desktop does not synchronize them. The publication launcher reuses installed GitHub CLI or downloads and verifies a pinned official portable Windows release (v2.105.0) into the per-user development cache. It opens the one-time GitHub CLI browser sign-in if needed; select Arrow-Loop. Login output is excluded from the transcript. If a different account is active, the publisher stops and prints the exact CLI command for switching or signing in. GitHub Desktop login does not automatically authenticate gh. No administrator rights or separate CLI installation are required; first setup requires GitHub access. The publisher verifies the actual API account and numeric identity, not merely Git configuration. No token is stored by these scripts. Respect workstation software and network policy.

Double-click Publish-Release.bat after packaging. It finds the newest version-matching release directory under the checkout's ignored Build folder; an alternate directory can be supplied with -PackageDirectory. The publisher refuses dirty/unsynchronized source, wrong account/repository/branch, incompatible versions, existing tags or published releases, unexpected assets, and mismatches between the ZIP, manifest, checksums, current DLLs and embedded payloads. It creates a development-only draft targeting the exact synchronized commit, uses the maintained public `tbIDE/release-notes/<version>.md` instead of copying historical engineering notes, uploads the three expected files without overwriting, and verifies GitHub's reported SHA-256 digests and sizes. Missing digests fail closed. A matching unpublished draft can be resumed. If only explicitly allowlisted publisher or documentation files changed since its ancestor commit, existing verified assets are reused and the final publication targets the current synchronized commit. Changes to build inputs or conflicting existing assets still require review; assets are never overwritten automatically. Review the draft and actual native acceptance evidence, then answer Y at the displayed version's publication prompt. N, Enter or any other response leaves the verified draft unpublished. The version and exact target commit are displayed before confirmation. The publisher rechecks the account, source commit, tag absence and unchanged draft assets before publication and checks the resulting release/tag afterward. All preparation, packaging and publication transcripts are under %LOCALAPPDATA%\tbUI3\Diagnostics. The development runtime cache stays in its existing location. If publication is attempted but verification fails, inspect GitHub before retrying. The launcher never merges, pushes source, publishes a stable release or moves a tag. Explicitly authorized development-testing prereleases can disclose known functional defects and pending acceptance. Package integrity, authentication, checksums, source synchronization and exact-commit tagging are mandatory. Internal production deployment and stable publication require separate approval. [tbUI3IDE 0.4.0.6 development prerelease](https://github.com/Arrow-Loop/tbUI3/releases/tag/tbUI3IDE-v0.4.0.6) is available for testing the upgrade from 0.4.0.5.
