# tbUI3IDE

tbUI3IDE is a single twinBASIC add-in that brings a WinUI 3 look to the IDE, offers Classic, Hybrid and Ribbon toolbar layouts, and adds TabView/MultiPage designer tools. It includes WinUI3 Dark and Light themes and a shared native updater. The add-in is a developer tool; applications built with the tbUI3 control package do not require it.

**Current version:** 0.4.0.5 (development)

## Requirements

- twinBASIC BETA 1043 through 1045 (the configured development range).
- A matching Win32 or Win64 add-in DLL for your IDE architecture.
- Microsoft Edge WebView2 Runtime for the updater interface. The Welcome Wizard uses the IDE's existing web host.

## Install

Use the matching DLL from a verified build or release.

1. Close twinBASIC. Remove any older WinUI3IdeStyle.dll and TabViewDesigner.dll copies from both shared and IDE-local add-in folders. Avoid duplicate tbUI3IDE.dll installations.
2. Copy tbUI3IDE.dll into the corresponding folder, creating it if necessary:

   - Win32: %APPDATA%\twinBASIC\addins\win32
   - Win64: %APPDATA%\twinBASIC\addins\win64

3. Start the IDE and open a project.

On first load, the add-in provisions the bundled updater and themes in your user profile, then opens the Welcome Wizard. It does not need a separate installer or network access for this setup. Subsequent loads check for missing resources, preserve customized themes and avoid downgrading a newer updater. The wizard offers repair guidance if setup needs attention.

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

### TabView/MultiPage designer

When a tbUI3 TabView is selected, use the contextual MultiPage commands to create, select, delete and reorder real pages. You can place controls on the selected page and use the usual native form designer. Page management remains available in all toolbar modes, including when optional styling is disabled.

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
- **IDE Toolbar:** Choose Classic, Hybrid or Ribbon.
- **Check for Updates:** Open the update review.
- **Update settings:** Open the standalone updater's automatic-check and restart preferences.
- **Resource repair:** Review and repair embedded updater and theme resources from the IDE.
- **Welcome to tbUI3IDE:** Reopen the onboarding wizard.

Your toolbar and styling choices persist across restarts. Installation-specific update preferences are saved separately for each IDE installation. Welcome completion is saved per user.

## Troubleshooting

Open %LOCALAPPDATA%\tbUI3\Diagnostics in File Explorer for updater, designer and other diagnostic logs. Some tracing requires an explicit opt-in. See [Diagnostics](../docs/DIAGNOSTICS.md) for file names and troubleshooting instructions.

## For contributors

- [Phase 1 handoff](PHASE1_HANDOFF.md): Current build and native acceptance sequence.
- [Installation Manager specification](INSTALLATION_MANAGER_SPEC.md): Product requirements and safety boundaries.
- [Architecture](ARCHITECTURE.md): Technical design and native integration.
- [Build tools](tools/): Theme generation, project synchronization, embedding and release verification.
