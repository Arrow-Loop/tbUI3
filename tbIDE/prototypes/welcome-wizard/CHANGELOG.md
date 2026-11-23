# Welcome Wizard changelog

## 2026-11-23: Installation health moved out of normal Finish

- Removed all resource/repair/recheck diagnostics from the normal Finish page, leaving only the expandable preference confirmation.
- Added a conditional Setup attention step immediately before Finish for native-reported bootstrap warnings/errors, recovery, missing/damaged resources and explicit repair choices. Healthy snapshots keep the original six pages.
- Preserved native repair confirmation, Check again, resource identity and bootstrap snapshot authority. An unresolved issue is never represented as successfully repaired; wizard remains dismissible.
- Added source-level regression checks. Did not modify native bootstrap sequencing or embed an updater binary.

## 2026-11-23: Confirmation and installation-health presentation cleanup

- Replaced four fixed oversized summary cards with a compact, data-driven definition list. Labels and selected values now use balanced text sizes, and update restart preference is also displayed. The list can grow without changing its layout.
- Replaced raw installation-resource IDs, colon/status output and pipe separators with readable component names, descriptive details and separate state indicators. Repair buttons remain attached to their corresponding resources, and native recheck and confirmation behavior are unchanged.
- Kept native bootstrap status messages and recovery warnings separate from the resource rows. Added source checks for both changes; no production/native code modified.

## 2026-11-23: Compact theme-derived selector previews

- Replaced the old bare theme strip with a shared 86px miniature IDE renderer. Theme previews now use the native-provided validated four-color palette and up to six additional optional resolved colors: titlebar, toolbar, panel, editor, muted and border.
- Added corresponding Classic, Hybrid and Ribbon selector previews using the same miniature renderer and active theme paint, with distinct schematic toolbar arrangements and whole-tile selection.
- Preserved existing native intent names and setSnapshot acknowledgement behavior. No full IDE markup, executable commands, arbitrary CSS injection, filesystem access or native theme switching for preview.
- Extended the standalone simulated theme entries for richer visual inspection, regression checks and the native integration contract. Refused fabricated previews for third-party themes lacking a valid palette.
- No production native bridge, canonical project, updater source or binary was changed by this isolated UI pass. Script parsing and focused source checks were exercised; browser/native acceptance remains outstanding.

## Earlier source history

See repository tbIDE/CHANGELOG.md for preceding wizard revisions and Cody's production integration.
