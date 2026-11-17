# UI3TabView and UI3TabPage

Status: package 1.0.0.66 / tbUI3IDE 1.3.0.16 / adapter v9 appearance candidate, 2026-11-17. Shane confirms the designer workflow works. This pass adds shape profiles and core header interaction; it is not a claim of complete TabView fidelity or compiled-native acceptance.

## Shape profile authority and defaults

`TabStyle As UI3TabStyle` is saved per control. `ui3TabEdge = 0` (Edge Style) is the default, including when reading older forms without the property. `ui3TabExplorer = 1` (Explorer Style) is the alternate. Invalid assignments raise error 380; invalid stored numeric values fall back to Edge.

Edge is Shane's explicit customized profile from [Smith-Debnam Toolkit 8543201](https://github.com/Smith-Debnam/twinBASIC-Knowledge/tree/85432018090efc339d21ae7c47fd0e45ac8dea6b/examples/WinUIElementToolbox): its canonical project and 23 mirrors matched. Sources are ui/winui.css tab tokens and shapes, ui/toolbox.js initializeTabView, and docs/fidelity/FIDELITY_068.md. This overrides the generic upstream shape default under Shane's instruction. The reference repository was read only.

| Profile | Track | Top inset | Tab height | Top radius | Concave foot radius |
| --- | --- | --- | --- | --- | --- |
| Edge (default) | 40 DIP | 4 DIP | 36 DIP | 8 DIP | 8 DIP |
| Explorer | 40 DIP | 8 DIP | 32 DIP | 8 DIP | 4 DIP |

Both styles preserve the page origin at 40 DIP. Their selected outline uses native circular arcs; Edge hover/pressed uses the same profile outline, while Explorer's unselected hover/pressed uses the rounded WinUI container. Selection joins the page surface without a line beneath it. Adjacent selected separators are suppressed. Captions align left with native DirectWrite ellipsis. Focus is keyboard-only with the Toolkit's 2px inset outline treatment, replacing the earlier accent underline.

## Header interaction

Native pointer capture activates a tab/add/scroll action only on matching release. Releasing outside cancels activation, and WM_MOUSELEAVE clears hover; lost focus/capture and destruction invalidate or remove the pointer hook. The comctl32 subclass uses LongPtr signatures, no stored COM owner and no per-control timer.

Overflow arrows reserve 32 DIP each and scroll the viewport without changing selection. Selecting a page brings it into view. With the header focused, Left/Right and Ctrl+Tab/Shift+Ctrl+Tab wrap; Home/End reach the ends; Ctrl+T raises the existing add request when enabled. Very narrow headers omit arrows when all their reserved areas cannot fit and retain clipped selected-tab/keyboard access. `FirstVisibleTabIndex` is a zero-based transient viewport convenience, not a saved PropertyBag property. Adapter v9 applies it inside the existing native edit/snapshot protocol without requesting structural changes or an undo checkpoint. Native compiled-host verification must confirm viewport behavior through snapshots and resize.


## Toolbox presentation

TabViewDesigner adapter v8 inside the unified tbUI3 IDE add-in 1.1.0.0 hides the UI3TabPage toolbox button while active on a consumer form. UI3TabView remains available; +/New page creates real page controls. UI3TabPage remains public and registered, and pages remain selectable in Properties. This is reversible add-in presentation, not a package-level hidden-control flag. Without the add-in the entry is visible. Package remains 1.0.0.65.

## Structural deletion, generated names and multiple hosts

Adapter v7 (add-in 1.0.0.6) calls the IDE's onSignificantChange after native page deletion and its undo checkpoint, matching the native Delete command. This structural notification is necessary beyond live control removal; its omission left the adapter's deletion path incomplete for the saved/generated form model.

New default control names include the host Name, e.g. UI3TabView2_Page1. Default captions are numbered within the host; generated numbers can have gaps after deletion. Allocation skips any name already used anywhere on the form and reserves issued names across adapter refreshes in the same editing session. This history is a non-enumerable designer-session field, not a saved form/page property. Existing page names/custom captions are preserved to avoid changing code references. Native containment determines ownership; naming is organizational, not a membership scheme.

New pages always use their selected host's bounds. Pending initialization resolves only the uniquely allocated page under its original host after native resync, not whichever control becomes selected. The user narrowed the sizing problem to the delete/readd sequence; v7 fixes structural completion and tests that sequence across differently sized hosts. It does not introduce an unverified native ownership/layout rewrite. The actual IDE outcome, save/reopen and undo/redo remain gates.

## Managed page geometry in the designer

Adapter v6 (add-in 1.0.0.5) locks direct UI3TabPage children through BETA 1043's native lockTheControl/unlockTheControl path. isControlLocked is consulted by native mouse movement, keyboard moveControls and resizing. It tests the selected control's own lock, so the TabView and contained buttons/text boxes remain independently editable. Page selection, property editing and the existing Delete page path remain available. The native package still owns page geometry on layout.

Locks are applied to existing/new pages and follow rename/resync. Reparenting or deleting a page releases a session-owned lock. Unload/error cleanup restores locks introduced by this adapter session and leaves pre-existing locks alone. Standard IDE Options serialization can save current lock names with the form; the next session treats those saved locks as pre-existing. Protection itself makes no page geometry edits and requests no undo checkpoint. Package 1.0.0.64 is unchanged.

## Historical repeated header follow-up

Current package 1.0.0.64 and adapter v5 (add-in 1.0.0.4) address Shane's report that a freshly drawn empty TabView shows two matching Page 2 headers after +, with the second inaccessible. The screenshot is consistent with a repeated page entry in native discovery; it is not proof of duplicate native object creation. The package now builds and publishes a distinct page list by object identity or nonempty control name. It never deduplicates captions. Page names must be distinct, matching SelectedPage's name-based identity contract; control arrays are outside this candidate's supported identity model.

Native discovery traces report raw/unique counts, duplicates and accepted names/object addresses. Adapter diagnostics report designer page counts/names and native PageCount when serialized. Compare these after one + gesture before claiming an enumeration or insertion cause. Toolbar buttons have descriptive hover help; Delete page includes the page's children, and diagnostics writes tbUI3-tabview.log. Empty hosts remain empty until the first + action. The native outcome after this correction remains open.

## Historical live designer selection follow-up

The package remains 1.0.0.63. Shane reports normal rendering and successful + page creation in the working session, but v3 cannot select the added page. Uploaded logs confirm native fixture captions/order and accepted root/IDs. Adapter v4 (add-in 1.0.0.3) queues parent header snapshots through the full-form native batch protocol, because getImageFromServer returns immediately in that mode. It configures and activates a new page after its native ID is assigned. This correction is covered by protocol checks with actual shipped helper functions; the native authoring outcome remains a gate. Reference-reload deserialization and the logged Paint exception are separate unresolved findings.

## Native discovery after deletion, 1.0.0.65

The v7/native 64 trace shows replacement objects are created but stay 480x200 while discovery retains only the surviving page. The old collector had one error boundary around the full loop. Each entry now has its own guarded retrieval, PageName/PageOrder/Caption probes, duplicate check and sorted insertion. A failed entry increments skipped count and leaves later indices reachable. This does not remove the IDE's stale object or replace structural-delete notification. Temporary discovery logs include last failed index/stage/HRESULT. Source inspection supports this correction; the next native capture must establish the actual failed stage and restored replacement layout.

## Current rendering investigation

Shane's subsequent BETA 1043 win32 screenshots show dark headers initially and a purple strip after interaction, with custom captions still at defaults. Version 1.0.0.63 corrects unsafe layout/property mutations during Paint and adds temporary local evidence collection. The shipped UserControl snapshot implementation temporarily resizes the HWND around WM_PRINTCLIENT; stable behavior after this correction has not yet been observed. `TabView diagnostics` captures adapter v3 state without editing the form. Native lines and adapter output append to `tbUI3-tabview.log` beside the consumer project (native route uses App.Path), with TEMP as an additional route. Compare a capture before and after the symptom.

## Ownership and persistence

`UI3TabView` and `UI3TabPage` are native, windowed ControlContainer UserControls drawn with the existing Direct2D/DirectWrite engine. Every page is a direct child of its host. Ordinary controls belong to the page, so their coordinates and state do not depend on which tab is selected. No negative coordinates, Tag-based membership, clipboard access, synthetic input, or runtime add-in dependency is used.

Shane's first BETA 1043 win32 screenshot showed the native designer controls and toolbar, but the header's white text was being drawn over the form's light ambient color and the fixture's custom properties were at defaults. Version 1.0.0.62 addresses those findings; it does not record the corrected IDE outcome as passed.

The host discovers immediate page children on Show, Resize, Paint and `RefreshPages`, builds a separate unique collection and then replaces the current list. Discovery in Paint and property getters is read-only with respect to control geometry/properties; explicit layout remains in `RefreshPages`/resize. Identical ScaleMode assignments are skipped, and Paint does not assign BackColor. BETA 1043's `UCContainedControls.Item` supplies the raw control; the enumerator can supply an extender. Discovery accepts both representations. It matches the immediate container's ScaleMode; twips and pixels are the intended baseline. Arbitrary user-defined scale origins/ranges remain outside this candidate's coverage. Page layout uses current window DPI, not a cached system-DPI paint DC. The test project's existing system-DPI awareness policy is preserved.

Pages fill the host below the 40-DIP header area. Only page geometry changes on resize; switching never moves pages or their children. Runtime selection toggles page visibility. At design time, the unified add-in suppresses inactive DOM page nodes and their external resize handles; persisted `Visible` is untouched.

| Member | Contract |
| --- | --- |
| `SelectedPage As String` | tbUI3 convenience: saved control name; empty or unresolved selects the first available page without replacing the saved value during loading |
| `SelectedIndex As Long` | Zero-based code selection; -1 when empty; invalid assignments raise 380 |
| `PageCount` | Number of immediate UI3TabPage children |
| `Pages(Index)` | One-based access to actual page objects, ordered by PageOrder then control name |
| `RefreshPages()` | Re-discover and arrange current pages; no Add/Remove through this method |
| `IsAddTabButtonVisible` | Shows the + header action |
| `AddTabButtonClick` | Runtime event; application code owns runtime page creation |
| `SelectionChanged` | Raised for runtime SelectedPage assignments that change the requested name |
| Page `Caption` | Saved tab header |
| Page `PageOrder` | Saved nonnegative order; tbUI3 convenience over XAML item ordering |
| Page `Controls` | Actual contained-controls collection; indexed access follows twinBASIC's zero-based ContainedControls, not VB6 Controls assumptions |

The host supports mouse selection and Left/Right/Home/End while focused. It brings the selected header into the visible range when tabs exceed available width. This candidate has no scroll buttons: keyboard selection, Properties and code can reach overflow pages. An empty or very narrow host still exposes + when space allows. A deleted selected page falls back to the first survivor; the add-in's Delete page command explicitly selects its next or previous neighbor. Changing a page's control name can invalidate a saved SelectedPage string; select it again after renaming.

## Designer integration

Theme styling can be disabled independently; TabView management stays active. The standalone TabViewDesigner build is retired. See [the unified add-in page-management instructions](../../tbIDE/TabViewDesigner/README.md). The add-in is required for + creation and fully hiding inactive designer pages. It is optional for runtime use. Without it, pages can still be drawn from the toolbox, selected in Properties, and auto-sized, but the IDE shows inactive pages rather than giving the complete MultiPage experience.

The adapter calls BETA 1043's actual `preparePaste`, `deserializeControls`, `doPaste`, change-property and undo paths. It overrides the paste parent with the TabView itself, so a selected child on page 1 cannot accidentally receive a page 2 container. It neutralizes doPaste's ordinary positioning offset while retaining the IDE's edit path. Mutations wait for pending compiler/snapshot work to finish. A new page is configured in two native phases: insert, then set Caption/PageOrder after its compiler-assigned ID exists. The final phase requests the undo checkpoint; failed insertion still requests one. Initial custom-property JSON is not assumed to be PropertyBag state. The marked fixture uses an exact form ID plus a consumed form-level marker for first-open initialization, never page Tag-based membership.

The DOM bridge is private IDE integration, not a supported twinBASIC designer API. Required functions are checked before hooks are installed. Timer exceptions remove the hooks and restore page visibility. `TabView refresh` reinstalls the adapter. The adapter version is replaced on install, avoiding stale helpers after rebuilding. It never modifies WinUI3IdeStyle's stylesheet or add-in.

## Source matrix and limits

Value authority: microsoft/microsoft-ui-xaml commit `3259dc4437540678368c6e7c72869cb58d14a568`, `controls/dev/TabView/TabView_themeresources.xaml`. Native theme values already present in UI3Theme are reused where they resolve to the same shared resource. The TabView values below were checked in the current file; existing unrelated control tokens were not migrated.

| Area | WinUI resource | Candidate coverage |
| --- | --- | --- |
| Header band | Toolkit Edge override; upstream Explorer profile | Fixed 40-DIP band; profiles above |
| Equal widths | TabViewItemMinWidth 100, TabViewItemMaxWidth 240 | Clamped widths with reserved feet/add/scroll areas; selected header revealed |
| Typography | TabViewItemHeaderFontSize 12 | Existing Segoe UI Variable Text / Segoe UI fallback, normal weight |
| Header padding | TabViewItemHeaderPaddingWithoutCloseButton 8,3,8,3 | 8-DIP horizontal content inset; centered vertical text |
| Header backdrop | SolidBackgroundFillColorBase | 1.0.0.62 uses an opaque, matching base surface as a tbUI3 hosting convenience; WinUI TabViewBackground is transparent. This avoids white text on the unrelated root form's light ambient color. |
| Selected fill | TabViewItemHeaderBackgroundSelected -> SolidBackgroundFillColorTertiaryBrush | Existing dark #282828 / light #F9F9F9 tokens, also used for page background |
| Text | HeaderForeground -> TextFillColorSecondaryBrush; selected -> TextFillColorPrimaryBrush | Existing shared light/dark foreground tokens |
| Disabled text | HeaderForegroundDisabled -> TextFillColorDisabledBrush | Disabled native header input and text |
| Add area | AddButtonWidth 32, AddButtonHeight 24, container padding 3 | Centered native Segoe Add glyph; scroll glyphs use 8-DIP font |
| Focus | Toolkit focus-visible outline 2px, inset 2px | Keyboard-only content outline; native acceptance pending |
| Corners, seams and borders | Toolkit SVG outline and upstream TabView template | Edge/Explorer vector outlines and joined page seam; exact selected stroke-gradient details remain incomplete |
| Hover, pressed, animation | Toolkit colors and upstream state mappings | Hover/pressed/disabled implemented; animation deferred; native acceptance pending |
| Close, drag/reorder gestures, icons, accessibility automation, high contrast | WinUI TabViewItem/template and implementation | Deferred; toolbar reordering is implemented only in the designer |

This pass establishes page ownership and authoring behavior. It does not establish complete WinUI TabView visual or accessibility fidelity.

## Evidence and next gate

- Read BETA 1043 `ide/main.js`, `ide/formDesigner.css`, the VB UserControl/ActiveXExtender sources and tbIDE add-in API directly from the official release archive. Archive SHA-256 and test counts are recorded in the [validation record](../validation/2026-11-09-tabview-candidate.md).
- `tests/tabview-designer.test.mjs` exercises parent targeting, name allocation, selection, coordinates, Properties reveal, reordering, subtree deletion, undo requests, pending-work guards, cleanup, unsupported internals, narrow hosts and generated-script fidelity. Its optional native contract check loads preparePaste/doPaste from an externally supplied IDE main.js; IDE source is not redistributed.
- Packed projects and source mirrors are compared, including the full refreshed embedded package in tbUI3Test. Existing package/control IDs are preserved; new IDs have their own checked-in records.
- Shane confirms the designer workflow works as of 2026-11-17. Next gate: compile/run package 66 and adapter v9, verify both styles and input/overflow/persistence at real DPI, then close/icon/drag/accessibility work. Repeat create/switch/drop/save/reopen/delete/reorder/undo checks to detect regressions. The source/fixture results above do not establish those results.

The original research is preserved on main at commit `9f1ee5e88e151fd4f1018d10e18621f6d5a54174`, under `docs/research/2026-11-01-multipage-designer.md`. Its proposed negative-coordinate approaches are historical and are not used by this candidate.
