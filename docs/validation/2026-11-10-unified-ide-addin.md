# Unified tbUI3 IDE add-in consolidation, 2026-11-10

Baseline: tbui3-dev commit 9b6273d484d332dd750351e5311ede7014b090de. The current styling project was fetched and its four packed file contents compared to the extracted mirror before edits. Existing project ID/output name are preserved. Package 1.0.0.65 and the consumer project are not modified.

## Implemented structure

WinUI3IdeStyle/WinUI3IdeStyle.twinproj now contains six files (.meta, Settings and four sources): MainModule, WinUI3IdeCss, TabViewDesignerController and TabViewDesignerScript. One DllExport entry point and one AddIn implementation own both features. TabView adapter v8 is moved without changing its JS content. The standalone project, entry point, Settings and old source mirror are removed; the old README redirects to current installation/maintenance. Theme CSS and per-user preference keys remain unchanged.

## Executed evidence

- 44 JS/contract checks pass with official BETA 1044 ide/main.js. Existing insertion, deletion, ordering, locks, toolbox and private-helper checks remain in the suite.
- New checks reconstruct and execute the actual InstallOption string emitted by MainModule, exercise its Yes/No callbacks, observe theme stylesheet media/title changes, restore a saved disabled preference and create pages through the actual adapter while styling is off or its stylesheet is absent. This is a JS/DOM facade test, not native loading of the DLL.
- A structure check confirms one entry point/implementation, unconditional controller construction before theme application, project-load/disposal forwarding and preserved preference names.
- All 70 packed-project mirrors match (27 package, 37 test, 6 combined add-in), including stable package/control/form IDs, full consumer embedding, ownership and CRLF checks. Official standalone export of the combined add-in matches all 5 exported file contents; .meta is preserved by the order-preserving editor.
- Generated WinUI3IdeCss.twin SHA-256 remains 5ca713dbd5ea2d3972160b3f8026203dfedaac6ab7bb46d74bafca6d25b2c771, identical to baseline. All 288 style rules and both CSS inputs are preserved.
- Canonical combined project SHA-256: ddc1911faa616018d6f333317019a042ad73fa642b678e2552473d4ee75878c6. The generated adapter script reconstructs the same parseable adapter v8 JS at its new path.

## Remaining observation

Native combined startup/project load/unload, a single set of toolbar buttons after legacy DLL removal, standard theme operation and theme preference persistence remain the next combined-package observations. Preserve existing win32-per-pass/final-win64 workflow without calling the source/JS results native tests. Ribbon layout is agreed future work, not part of this revision.
