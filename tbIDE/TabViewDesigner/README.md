# TabView management in the unified tbUI3 IDE add-in

TabView adapter v8 is now included in **tbUI3IDE 1.2.0.0**, alongside optional IDE theme styling. There is one project and DLL: [tbUI3IDE.twinproj](../tbUI3IDE/tbUI3IDE.twinproj), output tbUI3IDE.dll. The old standalone TabViewDesigner project/export has been retired. [Build, install and migration](../README.md) explains removing the legacy WinUI3IdeStyle.dll and TabViewDesigner.dll from both architecture folders before loading the unified add-in.

Page management works with standard IDE themes and with additional styling disabled. Package 1.0.0.65 remains the native control dependency; no add-in is needed by built consumer applications.

| Command | Behavior |
| --- | --- |
| + / New page | Add one real UI3TabPage under the selected host, page or child control's owning TabView |
| Delete page | Delete the active page and its contents, notify the native form model and select a survivor |
| Page left / Page right | Change page order within its owning TabView |
| TabView refresh | Reinstall the page adapter and request fresh display |
| TabView diagnostics | Log ownership, counts, selection and native snapshot information to tbUI3-tabview.log |

New pages use host-prefixed control names and host-local captions. Existing code names/captions are preserved. Containment determines ownership. Geometry remains native; direct pages receive native IDE locks while their children and host remain editable. Pre-existing locks survive cleanup. Standard IDE Options saving can persist locks.

While active, the adapter hides only the page toolbox button, retaining its class registration for creation and saved forms. UI3TabView remains in the toolbox, and pages remain selectable through Properties. Inactive designer pages are suppressed without changing their saved Visible properties. Unload/error cleanup restores ordinary presentation and releases only adapter-owned locks. TabView refresh reinstalls the adapter after an error.

Pending compiler replies, resync and drag operations block edits until the designer settles. Commands retain their existing toolbar positions for now; the Office-style ribbon is the next agreed implementation pass.

## Source and maintenance

- Readable adapter: ../tbUI3IDE/js/tabview-designer.js.
- Native controller: ../tbUI3IDE/src/Sources/TabViewDesignerController.twin.
- Generated script: ../tbUI3IDE/src/Sources/TabViewDesignerScript.twin.
- Run `node tbIDE/tools/build-tabview-designer.mjs` from the repository root to regenerate/pack the script into the one canonical project. It uses Chr(34) for embedded quotes. Installed DLLs need no loose JS/CSS files.
- Run `node tools/validate-tabview-projects.mjs` and the tests in tests/tabview-designer.test.mjs. Set TB_IDE_MAIN_JS to the official BETA's ide/main.js for native-helper protocol checks.

[API and control source matrix](../../docs/controls/UI3TabView.md), [architecture](../ARCHITECTURE.md) and [consolidation evidence](../../docs/validation/2026-11-10-unified-ide-addin.md) record the current contracts. Persistence, full undo/redo and native combined-load observations remain separate from source/JS checks.
