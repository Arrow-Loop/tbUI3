# Welcome Wizard changelog

## 2026-11-23: Compact theme-derived selector previews

- Replaced the old bare theme strip with a shared 86px miniature IDE renderer. Theme previews now use the native-provided validated four-color palette and up to six additional optional resolved colors: titlebar, toolbar, panel, editor, muted and border.
- Added corresponding Classic, Hybrid and Ribbon selector previews using the same miniature renderer and active theme paint, with distinct schematic toolbar arrangements and whole-tile selection.
- Preserved existing native intent names and setSnapshot acknowledgement behavior. No full IDE markup, executable commands, arbitrary CSS injection, filesystem access or native theme switching for preview.
- Extended the standalone simulated theme entries for richer visual inspection, regression checks and the native integration contract. Refused fabricated previews for third-party themes lacking a valid palette.
- No production native bridge, canonical project, updater source or binary was changed by this isolated UI pass. Script parsing and focused source checks were exercised; browser/native acceptance remains outstanding.

## Earlier source history

See repository tbIDE/CHANGELOG.md for preceding wizard revisions and Cody's production integration.
