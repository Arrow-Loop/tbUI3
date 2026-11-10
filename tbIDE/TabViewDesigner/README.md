# tbUI3 TabView Designer

Adapter v8, add-in version 1.0.0.7. Separate native IDE add-in for tbUI3 1.0.0.65's real page containers. It coexists with WinUI3IdeStyle and does not require a particular IDE theme. BETA 1043 and 1044 are source-inspected adapter baselines; the insertion recipe originated in the BETA 1033 probe.

Package 1.0.0.65 is the native delete/readd follow-up: failed contained-control entries no longer abort discovery of later pages. Update the package/embedded test package for this correction; adapter v7 remains unchanged. Native logs now report skipped-entry count and failure stage/HRESULT.

## Page toolbox entry

While this add-in is active on a consumer form, UI3TabPage is hidden from the toolbox. Create pages through the TabView + button or New page toolbar command. UI3TabView stays available in the toolbox, and existing pages remain accessible through Properties. The registered page class and native toolbox array are retained for insertion and saved-form loading. The add-in reapplies its owned display class after toolbox rebuilds and removes it on unload/error cleanup; without the add-in, the page entry is visible.

## Installation and use

Open `TabViewDesigner.twinproj`. Its build path uses the existing add-in sample convention `${IdePath}\addins\${Architecture}\${ProjectName}.${FileExtension}`. Hold Shift while opening an add-in project if the IDE would otherwise load the DLL being replaced. The add-in is a separate developer installation; the package never auto-installs it.

With a consumer Form designer open, drop UI3TabView and click its +, or select the host and use **New page** on the toolbar. A real UI3TabPage is created directly inside the host and receives its own header. The adapter waits for the compiler to assign the new page an ID, then sets its caption/order through native setters before the final undo checkpoint. Controls drawn on that page belong to that page. Click another header to switch pages. Selecting an inactive page's child in Properties reveals its page.

| Toolbar command | Behavior |
| --- | --- |
| New page | Creates and selects a direct page child of the selected TabView, even when its descendant is selected |
| Delete page | Deletes the active page and its children through the native designer; requests one undo checkpoint |
| Page left / Page right | Changes saved PageOrder while retaining selected-page identity |
| TabView refresh | Reinstalls the adapter and refreshes current page display |
| TabView diagnostics | Read-only adapter v8 report; works even when ordinary editing commands reject the selection |

These commands expect one host or one of its descendants selected. Pending compiler replies, snapshots, dragging and resync block edits until the designer settles; a toolbar command reports the reason in Debug Console. The adapter does not queue a stale command against another selection. The control's New page verb supplies an additional request path; its visibility in the actual context menu remains a separate IDE check.

Without the add-in, the package and runtime have no missing dependency. The toolbox path still allows real pages, but the IDE's ordinary visibility rendering does not hide inactive pages completely. Unloading the add-in restores the ordinary designer display. After an adapter timer error it restores the display and disables itself; TabView refresh reinstalls it.

Hover over a toolbar button for its full explanation. These are designer commands for the selected TabView, its page or a contained control; Delete page also deletes that page's contents. A newly drawn host intentionally has no pages until + or New page is used.

## Structural deletion, generated names and multiple hosts

Adapter v7 (add-in 1.0.0.6) calls the IDE's onSignificantChange after native page deletion and its undo checkpoint, matching the native Delete command. This structural notification is necessary beyond live control removal; its omission left the adapter's deletion path incomplete for the saved/generated form model.

New default control names include the host Name, e.g. UI3TabView2_Page1. Default captions are numbered within the host; generated numbers can have gaps after deletion. Allocation skips any name already used anywhere on the form and reserves issued names across adapter refreshes in the same editing session. This history is a non-enumerable designer-session field, not a saved form/page property. Existing page names/custom captions are preserved to avoid changing code references. Native containment determines ownership; naming is organizational, not a membership scheme.

New pages always use their selected host's bounds. Pending initialization resolves only the uniquely allocated page under its original host after native resync, not whichever control becomes selected. The user narrowed the sizing problem to the delete/readd sequence; v7 fixes structural completion and tests that sequence across differently sized hosts. It does not introduce an unverified native ownership/layout rewrite. The actual IDE outcome, save/reopen and undo/redo remain gates.

## Managed page geometry in the designer

Adapter v6 (add-in 1.0.0.5) locks direct UI3TabPage children through BETA 1043's native lockTheControl/unlockTheControl path. isControlLocked is consulted by native mouse movement, keyboard moveControls and resizing. It tests the selected control's own lock, so the TabView and contained buttons/text boxes remain independently editable. Page selection, property editing and the existing Delete page path remain available. The native package still owns page geometry on layout.

Locks are applied to existing/new pages and follow rename/resync. Reparenting or deleting a page releases a session-owned lock. Unload/error cleanup restores locks introduced by this adapter session and leaves pre-existing locks alone. Standard IDE Options serialization can save current lock names with the form; the next session treats those saved locks as pre-existing. Protection itself makes no page geometry edits and requests no undo checkpoint. Package 1.0.0.64 is unchanged.

## Native page-count investigation

Shane's v4 screenshot shows two matching Page 2 headers after + on a fresh empty host. Package 1.0.0.64 publishes a distinct page collection by identity/control name while preserving different pages with matching captions. Adapter v5 diagnostics include real designer counts/names and native PageCount if the IDE serializes it. Compare those with the native discovery raw/unique/duplicate lines in tbUI3-tabview.log. The screenshot alone does not establish that two real pages were inserted.

## Live designer header refresh

BETA 1043's getImageFromServer is a no-op in full-form mode. Adapter v4 requests the host snapshot with queueMultipleSnapshot inside the native property batch after changes that affect its headers. New-page activation follows compiler ID acknowledgement and Caption/PageOrder configuration. That v4 correction updated only the add-in; the current unique-page-discovery candidate also updates the package to 1.0.0.64. The source/fixture protocol checks pass; actual new-page selection remains the native gate.

## Rendering diagnostics

Shane reports normal rendering in the current 1.0.0.63 session, while v3 creates a page that cannot be selected. Earlier sessions showed a purple strip. If it remains with 1.0.0.63 and adapter v5, click **TabView diagnostics** once before and once after the change, then preserve `tbUI3-tabview.log` beside the consumer `.twinproj`. The add-in also writes a copy under TEMP. Native control traces use App.Path and TEMP. The log records adapter version, IDs, ownership, fixture marker, pending operations, canvas/computed state and snapshot dimensions/checksums, plus native draw dimensions/DPI/pixels/result. It excludes raw image data and ordinary textbox contents. This is temporary investigation instrumentation; remove/disable it when the cause is established.

## Harness and validation boundary

`tbUI3Test` keeps its existing startup form and icon tests. **Open MultiPage test** opens `frmMultiPage`, which contains General, Details and Finish pages. Details owns a TextBox; each page owns a separate button. The fresh fixture carries a one-time form marker and matching form ID. The adapter initializes its actual native captions/order, then consumes the marker so later edits survive. Runtime setup is explicit too; the fixture includes UI3FormTheme for a managed designer background. Runtime + is hidden in this fixed-page harness. The add-in is used only for authoring.

The implementation is an integrated candidate. The actual IDE editing loop is not yet recorded as passed. The next gate covers adding pages from host/page/child selections, dropping controls, header switching, Properties reveal, resizing, save/reopen, delete/undo, reorder/undo, then runtime selection and keyboard behavior. Preserve the existing win32-every-pass and final win64-smoke agreement.

## Maintenance

Readable adapter: `js/tabview-designer.js`. Run `node tbIDE/tools/build-tabview-designer.mjs` from the repository root after editing it. The builder embeds the full script in `src/Sources/TabViewDesignerScript.twin` and patches the canonical add-in project. It uses Chr(34) for embedded quotes. The installed add-in needs no loose JavaScript file.

After other source edits, pack with the repository's order-preserving tools and regenerate `src/`. Keep the canonical project and every mirror synchronized. The project was derived from the existing Sample 11-based DesignerBridgeProbe container with a new project ID; the probe itself is unchanged.

Run `node --test tests/tabview-designer.test.mjs`. Set `TB_IDE_MAIN_JS` to a local official release's `ide/main.js` to enable the optional native paste-contract check. The check extracts functions locally and does not copy IDE source into the repository. Re-inspect these private functions on future betas before claiming compatibility.

Detailed API, source matrix and remaining work: [UI3TabView](../../docs/controls/UI3TabView.md).
