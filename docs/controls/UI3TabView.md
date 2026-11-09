# UI3TabView and UI3TabPage

Status: integrated 1.0.0.61 implementation candidate, 2026-11-09. This is the first recoverable implementation, not a continuation of a previously committed 1.0.0.61. The earlier chat's candidate never reached the repository.

## Ownership and persistence

`UI3TabView` and `UI3TabPage` are native, windowed ControlContainer UserControls drawn with the existing Direct2D/DirectWrite engine. Every page is a direct child of its host. Ordinary controls belong to the page, so their coordinates and state do not depend on which tab is selected. No negative coordinates, Tag-based membership, clipboard access, synthetic input, or runtime add-in dependency is used.

The host discovers immediate page children on Show, Resize, Paint and `RefreshPages`. BETA 1043's `UCContainedControls.Item` supplies the raw control; the enumerator can supply an extender. Discovery accepts both representations. It matches the immediate container's ScaleMode; twips and pixels are the intended baseline. Arbitrary user-defined scale origins/ranges remain outside this candidate's coverage. Page layout uses current window DPI, not a cached system-DPI paint DC. The test project's existing system-DPI awareness policy is preserved.

Pages fill the host below the 40-DIP header area. Only page geometry changes on resize; switching never moves pages or their children. Runtime selection toggles page visibility. At design time, the separate add-in suppresses inactive DOM page nodes and their external resize handles; persisted `Visible` is untouched.

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

See [the add-in instructions](../../tbIDE/TabViewDesigner/README.md). The add-in is required for + creation and fully hiding inactive designer pages. It is optional for runtime use. Without it, pages can still be drawn from the toolbox, selected in Properties, and auto-sized, but the IDE shows inactive pages rather than giving the complete MultiPage experience.

The adapter calls BETA 1043's actual `preparePaste`, `deserializeControls`, `doPaste`, change-property and undo paths. It overrides the paste parent with the TabView itself, so a selected child on page 1 cannot accidentally receive a page 2 container. It neutralizes doPaste's ordinary positioning offset while retaining the IDE's edit path. Mutations wait for pending compiler/snapshot work to finish. Every attempted edit that entered a native transaction requests an undo checkpoint, including partial failures.

The DOM bridge is private IDE integration, not a supported twinBASIC designer API. Required functions are checked before hooks are installed. Timer exceptions remove the hooks and restore page visibility. `TabView refresh` reinstalls the adapter. The adapter version is replaced on install, avoiding stale helpers after rebuilding. It never modifies WinUI3IdeStyle's stylesheet or add-in.

## Source matrix and limits

Value authority: microsoft/microsoft-ui-xaml commit `3259dc4437540678368c6e7c72869cb58d14a568`, `controls/dev/TabView/TabView_themeresources.xaml`. Native theme values already present in UI3Theme are reused where they resolve to the same shared resource. The TabView values below were checked in the current file; existing unrelated control tokens were not migrated.

| Area | WinUI resource | Candidate coverage |
| --- | --- | --- |
| Header band | TabViewHeaderPadding top 8, TabViewItemMinHeight 32 | 40-DIP total header band |
| Equal widths | TabViewItemMinWidth 100, TabViewItemMaxWidth 240 | Clamped equal widths, selected header kept in view |
| Typography | TabViewItemHeaderFontSize 12 | Existing Segoe UI Variable Text / Segoe UI fallback, normal weight |
| Header padding | TabViewItemHeaderPaddingWithoutCloseButton 8,3,8,3 | 8-DIP horizontal content inset; centered vertical text |
| Selected fill | TabViewItemHeaderBackgroundSelected -> SolidBackgroundFillColorTertiaryBrush | Existing dark #282828 / light #F9F9F9 tokens, also used for page background |
| Text | HeaderForeground -> TextFillColorSecondaryBrush; selected -> TextFillColorPrimaryBrush | Existing shared light/dark foreground tokens |
| Disabled text | HeaderForegroundDisabled -> TextFillColorDisabledBrush | Disabled native header input and text |
| Add area | AddButtonWidth 32, AddButtonHeight 24, container left padding 3 | Geometry implemented; the literal + is a candidate convenience, not the WinUI glyph template |
| Focus | Native keyboard focus | Candidate accent underline is a tbUI3 convenience, not the final WinUI focus visual |
| Corners, seams and borders | TabViewItem/TabView templates | Not complete; selected header is currently rectangular |
| Hover, pressed, animation | TabView resource/state mappings | Deferred, not claimed |
| Close, drag/reorder gestures, icons, accessibility automation, high contrast | WinUI TabViewItem/template and implementation | Deferred; toolbar reordering is implemented only in the designer |

This pass establishes page ownership and authoring behavior. It does not establish complete WinUI TabView visual or accessibility fidelity.

## Evidence and next gate

- Read BETA 1043 `ide/main.js`, `ide/formDesigner.css`, the VB UserControl/ActiveXExtender sources and tbIDE add-in API directly from the official release archive. Archive SHA-256 and test counts are recorded in the [validation record](../validation/2026-11-09-tabview-candidate.md).
- `tests/tabview-designer.test.mjs` exercises parent targeting, name allocation, selection, coordinates, Properties reveal, reordering, subtree deletion, undo requests, pending-work guards, cleanup, unsupported internals, narrow hosts and generated-script fidelity. Its optional native contract check loads preparePaste/doPaste from an externally supplied IDE main.js; IDE source is not redistributed.
- Packed projects and source mirrors are compared, including the full refreshed embedded package in tbUI3Test. Existing package/control IDs are preserved; new IDs have their own checked-in records.
- Next gate: IDE acceptance and the actual create/switch/drop/save/reopen/delete/reorder/undo editing loop, followed by runtime page ownership and keyboard checks. The source/fixture results above do not establish those results.

The original research is preserved on main at commit `9f1ee5e88e151fd4f1018d10e18621f6d5a54174`, under `docs/research/2026-11-01-multipage-designer.md`. Its proposed negative-coordinate approaches are historical and are not used by this candidate.
