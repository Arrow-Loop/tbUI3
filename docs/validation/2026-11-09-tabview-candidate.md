# TabView candidate validation, 2026-11-09

Current candidate: **package 1.0.0.65 with adapter v8 (add-in 1.0.0.7)**. Earlier candidate evidence is retained below as history.

## Adapter v8 toolbox presentation and package 65 evidence, 2026-11-10

Official BETA 1044 setCustomControlsArray creates toolboxItemOuter buttons with clsid, controlType and controlTypePackage, and retains them in allToolboxItems. Adapter v8 matches the existing page ClassId plus package/name, applies an owned display:none rule to that button and leaves registry/metadata intact. The existing tick handles newly rebuilt buttons. Unload/error cleanup removes owned classes; a selected page drawing tool returns to the native pointer when ready. No toolbox-wide filter, public-class visibility change or deletion is used.

Executed: 41 JS adapter/contract checks pass with official 1044 helpers. The new case covers exact-class targeting, unrelated controls, registry preservation, new-page creation, pointer reset, rebuilt toolbox nodes and cleanup. CSS declaration/DOM-class handling is checked in the facade; actual native toolbox presentation is pending. All 68 packed mirrors match and all 3 official add-in export file contents match. Add-in SHA-256: b26973a2cc46f4b25947b7ba8e492c4a5dffd26b6dc27a7ef7d87ce1c93b7e11. Package remains 65.

New log evidence from commit 529663cf94fc10177f9a2ca952f53782e2314b01, Git blob 3cf682ddf25a95345bf5872df0df598554d82258: 10:05:41 raw=4 unique=1 duplicates=0 skipped=3, last failure index=3 stage=Name hr=&H5B. At 10:05:43 raw=6 unique=2 duplicates=1 skipped=3 includes UI3TabView2_Page8. This confirms replacement discovery continues past stale name errors. Shane reports the result appears to work. It does not establish save/reopen, full undo/redo or removal of generated/Properties entries. The latest canonical test binary was preserved and its stale frmMultiPage mirror refreshed.

## Historical native stale-entry discovery follow-up, 1.0.0.65, 2026-11-10

Evidence: tbUI3Test/tbUI3-tabview.log at commit 9bfc629527cfecbe393bc46499a42445c16bd60a, Git blob 461c9831c9356d310cfeabd4735c5aaf1ceb5481. Adapter v7 is installed at 09:24:10. At 09:25:13 deletion leaves raw=3 unique=1 duplicates=1. At 09:25:25 raw=5 unique=1 duplicates=1; at 09:26 raw=7 unique=1 duplicates=1. Page3 and Page4 paint at 480x200 and never receive the host's 538x376 page bounds. This proves replacement creation without acceptance into the native layout list; it does not reveal an HRESULT.

Source inspection: the old CollectPages handler exits the entire enumeration on an Item/property failure, retaining only the partial list before that entry. The new CollectPageEntry guards each index independently, probes properties needed by paint/layout and preserves identity/name deduplication and ordering. Errors increment skipped count and record index/stage/HRESULT; later indices remain reachable. No ownership/geometry rewrite or stale-object destruction is introduced. Adapter v7 remains unchanged.

Executed: all 68 packed-project mirrors, full package embedding/reference 65, stable IDs, ownership and CRLF checks pass. Official exports match all 27 package and 36 consumer file contents. All 40 existing JS adapter/contract checks pass with official BETA 1044 helpers; they do not run the native collector. Native behavior after the new error boundary remains the next gate, alongside deleted Properties/source removal, persistence and undo/redo.

- tbUI3/tbUI3.twinproj SHA-256: 55f67ec98c93f9c6d6ebd8dc133e07112c4c107cc92207d99315446117a8c9b5
- tbUI3Test/tbUI3Test.twinproj SHA-256: 734ba5d485cb7575ca1f600abbdf162c5b3bcd765b31ebe8b92c2cead650270c
- tbIDE/TabViewDesigner/TabViewDesigner.twinproj SHA-256: 713b52c2b4d8621cb2b9ec7cfac03da4af05a395f796bbd2518172445f592f26

## Historical adapter v7 delete/readd and host-scoped naming follow-up, 2026-11-10

Shane confirms child controls can be added with page locking. He then reports deletion removes a header but leaves the page in Properties, add-after-delete fails, and sizing/positioning problems occur after deletion when adding on multiple hosts. The supplied screenshot identifies BETA 1044 and form-global UI3TabPage names/captions.

Actual native Delete action: deleteSelectedControls, undoPoint, onSignificantChange. V6 called deletion and undo but omitted onSignificantChange, which sends the current serialized form in a structure-change message. A new actual-source contract check fails on v6 and passes with the notification added. V7 also allocates host-prefixed names, host-local default captions and session-reserved identifiers without changing existing page names/captions. It rebinds pending setup only to its uniquely allocated page under the original host after native DOM replacement.

Executed: all 40 checks pass with the actual shipped 1043 helpers, and all 40 pass with 1044. Cases include structural deletion notification, last-page deletion/readd, distinct host bounds and ownership, name collisions, reservation across refresh and delayed native acknowledgement/resync. These exercise JS/protocol functions and a test facade, not a complete native IDE editing loop. All 68 packed-project mirrors match; the add-in officially exports with all 3 file contents matching its mirror. Package/test canonical binaries are unchanged from the current branch; frmMultiPage's stale mirror was refreshed from the saved project in the prior sync commit.

Official BETA 1044 tag: beta-x-1044. Release archive SHA-256: d9e525fd7743f6161653025c130aec141fbcfa79dca7255b1eff067b519a0554. ide/main.js SHA-256: e6785e459e2f6fd729c7e79a5eb6d9d64022a32b72b9e8364ff246cec00923ba. Inspected dependencies and insertion/deletion paths are unchanged from 1043. Add-in SHA-256: `713b52c2b4d8621cb2b9ec7cfac03da4af05a395f796bbd2518172445f592f26`.

The pushed v5/native 64 log also now provides direct evidence for the earlier repeated-entry hypothesis: 17:34:02 shows raw=2 unique=1 duplicates=1 for the second host, and 17:34:05 shows raw=4 unique=2 duplicates=2. Those older lines are not a capture of today's v6 delete/readd failure. No speculative native layout rewrite or compiler-counter reset was added. Next gate: the exact native delete/readd transition, Properties/source removal, correct bounds, persistence and undo/redo after v7.

## Historical adapter v6 page-lock follow-up, package unchanged at 1.0.0.64

Shane reports the prior correction appears to work, then describes accidental independent page-control movement. Adapter v6 uses the shipped IDE native lock registry for direct UI3TabPage children. The inspected isControlLocked check is local to that control, and the actual mouse drag, keyboard moveControls and resize functions all consult it. The same check does not automatically lock a child or the owning host. deleteControl does not reject a locked page; existing subtree deletion remains intact.

Lock ownership is tracked per designer and DOM node, including rename and node replacement. Pre-existing lock state is retained; session-owned locks are removed when no longer owned by a TabView or on adapter unload/error cleanup. Uses the silent native path, with no geometry property writes or undo checkpoints. Standard IDE Options serialization includes current lockedControls, so saved locks are treated as pre-existing at the next installation; no cross-session ownership guess is made.

Executed: all 34 adapter/contract checks pass with official BETA 1043 main.js. The lock check runs actual shipped lock/unlock, mouse movement, keyboard movement and right-edge resize functions in the test facade, proving their properties remain unchanged for a protected page while host/child geometry can change. Separate checks cover new pages, rename/resync, reparent/subtree deletion, pre-existing locks and cleanup. These are protocol/function checks; native IDE authoring remains a separate outcome. All 68 project mirrors match. Canonical package/test binaries are unchanged. Add-in SHA-256: `e8f9412f7517d191c6e0662154fd581e0a2f460aab74e6275a4db1a404655ffe`.

## Historical 1.0.0.64 / adapter v5 repeated-header follow-up

Shane reports v4 is better, but + on a newly drawn empty TabView appears to create two pages and the second is inaccessible. Enlarging the supplied screenshot shows both headers read Page 2. This supports, but does not establish, a repeated native discovery entry. The last pushed logs predate this screenshot; do not treat them as a capture of this new host.

The native page collector previously accepted every recognized enumeration entry without uniqueness checks. It now builds a temporary collection, excludes matching object identities or nonempty control names, then publishes the unique list. Drawing, count, arrangement and selection use that list. It never uses Caption for identity. Names must be distinct; control-array identity remains future work. Discovery diagnostics record raw/unique counts, duplicate count and accepted names/object addresses. Adapter v5 records actual designer counts/names and native PageCount if present in the snapshot.

Toolbar buttons now have explanatory hover titles, restored on unload. Empty hosts still start with no pages. No speculative second insertion path, click suppression or native request-counter throttling was added. Existing saved form descriptors and public IDs are preserved.

Executed: 30 adapter/contract checks pass with official BETA 1043 main.js, including one empty-host + gesture, matching captions on distinct pages, native-versus-designer diagnostics and toolbar help restoration. Those are JS/facade checks, not execution of native ContainedControls enumeration. The native guard is source-inspected; its actual IDE outcome remains open. All 68 packed-project mirrors, complete embedded package/version 64, stable IDs, form ownership and CRLF checks pass. Official exports of all three packed projects match the mirrors (27/36/3 files; .meta preserved).

| Current project | SHA-256 |
| --- | --- |
| `tbUI3/tbUI3.twinproj` | `b144bba9c3fd21a889ba5d731c381166753c0dfdc7ebac823a5aafb3a5844c34` |
| `tbUI3Test/tbUI3Test.twinproj` | `4b95d7b110aec2a3b7e66c8b3e041fa44641926de73864fc949bbc9aaffd8ed9` |
| `tbIDE/TabViewDesigner/TabViewDesigner.twinproj` | `4daa8604318ebd31751fc395cab6b9d5c284d0f997a306a6cd5146e033736cc8` |

## Historical adapter v4 follow-up, package unchanged at 1.0.0.63

Shane reports normal tab rendering in the working session, + creation succeeds, and the added page cannot be selected under v3. Reference unload/reload sometimes succeeds with unchanged code and sometimes triggers the previously reported deserialization failure. Keep that intermittent issue distinct from selection.

Source log: tbUI3Test/tbUI3-tabview.log at e23e46250d631bd0eaf4e399126341445460f846. It identifies native 1.0.0.63 and adapter v3, consumerAccepted=true, real IDs and zero pending work in two captures. It confirms native General/Details/Finish captions/order and consumed marker. UI3TabPage1 paints at 16:47:03, 16:47:58 and 16:50:38 with hr=0. The captures themselves contain only the three fixture pages, so they do not establish new-page DOM ownership/class at failure. A host Paint exception &H80020009 at 16:48:01 remains unexplained.

Official BETA 1043 source confirms getImageFromServer returns immediately when isInFullFormMode is true. queueMultipleSnapshot adds a control ID to the active batch; handleMultipleChangeProperties sends those IDs alongside property changes. Adapter v4 uses that path for parent header snapshots and activates a new page after native ID acknowledgement, with caption/order in the same batch. Full-form diagnostics now read backgroundImage, where actual live snapshots are stored; v3's zero imageData lengths did not mean no bitmap existed.

Executed: 26 adapter/contract checks pass with the official main.js. The previous v3 adapter failed the new missing-parent-snapshot and premature-host-activation checks. The live checks run the actual shipped batch, changeProperty and snapshot functions with delayed property acknowledgement in a test facade; they are not native IDE outcome evidence. All 68 current packed-project mirrors match. The latest human-saved test binary is unchanged; its two form exports were refreshed. The add-in project SHA-256 is `c57da8785919941a7f7621663b5ddd65e87b3268774eb788148870f01c24e5a3`. The full native add/select/switch/drop/save/reopen/undo sequence remains open after v4.

## Historical 1.0.0.63 reported loading/compilation failure

Shane's later BETA 1043 win32 report lists TB5079 for the existing frmMain buttons and frmMultiPage controls, plus secondary TB5125 Len errors. The screenshot shows the embedded tbUI3 1.0.0.63 reference enabled and "failed to deserialize JSON [1]" on UI3TabView1. Treat native loading/compilation as failed for that observed session. The earlier 22 adapter checks and 68 mirror checks did not exercise native control deserialization.

Current branch packed blobs still match the delivered 1.0.0.63 artifacts. All form/control JSON documents parse, package identities and references remain present. No JSON syntax defect or missing reference was found. These checks cannot explain or clear the native failure. Required next evidence: whether the same rejection persists in a fresh IDE session, and diagnostics from tbUI3/tbUI3.twinproj itself. No code correction, regression cause or clean build is claimed.

## 1.0.0.63 interaction follow-up

Shane supplied two BETA 1043 win32 screenshots: the first shows dark headers, the second has a purple strip and missing labels after interacting with the form. Header-strip pixels sampled from the supplied image include RGB (133,21,181), while the initial image at the same locations is dark. The page body remains visible. Both show default Page/Button labels, so neither stable rendering nor fixture initialization is established.

The shipped `VB/Sources/CONTROLS/STANDARD/UserControl.twin` IViewObjectDraw temporarily changes the native HWND size, sends WM_PRINTCLIENT into a compatible bitmap and restores the rectangle. `Graphics.ScaleModeChanged` notifies ambient scale changes even on identical assignments. Version 1.0.0.63 removes layout/property mutation from Paint and property getters, guards identical scale assignments, caches the paint DC and adds native state/error traces. This corrects an unsafe lifecycle path; it is not proof that the final purple-strip cause is fully identified.

Adapter v3 adds read-only diagnostics available even when ordinary commands reject the consumer/selection. It records actual versions/classes/IDs/parents, marker, pending state, computed canvas presentation and snapshot PNG dimensions/checksum. Both adapters and native controls append local evidence to tbUI3-tabview.log. Raw bitmaps and ordinary textbox contents are excluded.

Executed: 22 adapter/contract checks passed using the official BETA 1043 main.js; 27 package, 37 test-app and 4 add-in entries match their mirrors (68 total). Full embedded package, imported revision 63, stable identities, page ownership and CRLF checks pass. The official exporter successfully exported all three packed projects; all 27/36/3 exported file contents match the mirrors byte for byte (the exporter omits the preserved .meta entries). The latest IDE-saved frmMultiPage descriptor from the branch is preserved byte for byte while updating its embedded package; the stale local descriptor was not republished. Live corrected outcome remains open.

| Current project | SHA-256 |
| --- | --- |
| `tbUI3/tbUI3.twinproj` | `599f6ab6e31bc059f1348c29a8c01ec06ae35b0b699d3df1722c40f7f2019cc6` |
| `tbUI3Test/tbUI3Test.twinproj` | `41372ddf5aaa720790cda83938fcecddd329ed3eae751a9a0416c9639725e0a3` |
| `tbIDE/TabViewDesigner/TabViewDesigner.twinproj` | `8f78e902720c7f398dcb5e72719c1abdc92967bb960c86ade0460d61f05297eb` |

## Historical 1.0.0.62 record



## 1.0.0.62 screenshot follow-up

Shane's attached BETA 1043 win32 screenshot shows the tab/page controls and add-in toolbar loaded. The visible issues are low header contrast and custom captions at Page/Button defaults. The screenshot's selection-rejection messages predate its current display and are not treated as proof of a current ownership failure.

Source inspection confirms ActiveXExtender.AmbientBackColor returns the root form BackColor, even for controls inside custom pages. The new header draws a matching solid-base surface; UI3FormTheme now applies its managed designer background without runtime subclasses. The fresh harness contains that helper.

The adapter now waits for compiler-assigned page IDs and uses native setters for caption/order, with the final undo checkpoint after configuration. The marked fixture initializes native properties once, while runtime code explicitly sets the same intended values. No guessed PropertyBag wire encoding is introduced.

Validation: 20 adapter/contract checks passed; all 66 mirrors match; all three packed projects exported successfully with the official tool, and its exported contents match the mirrors. The correction's actual IDE outcome remains to be observed.

| Current project | SHA-256 |
| --- | --- |
| `tbUI3/tbUI3.twinproj` | `0116ebc95ac87bc66901bb83810cf419ee86a521b74052f2c44c5820ee29f76f` |
| `tbUI3Test/tbUI3Test.twinproj` | `2c4fe467b866215749247616f7d85d183afa86334f611c8a049705d2bb687cce` |
| `tbIDE/TabViewDesigner/TabViewDesigner.twinproj` | `40edafaca6e84ed75326f86e1262f5a04be269cddd75f6e846b3cf0c6def0262` |

## Historical 1.0.0.61 record

Candidate: tbUI3 1.0.0.61. This record supersedes the unverified earlier chat status.

## Executed checks

- `TB_IDE_MAIN_JS=<BETA 1043>/ide/main.js node --test tests/tabview-designer.test.mjs`: 17 passed, 0 failed, 0 skipped. The native contract case uses the actual preparePaste/doPaste bodies from the official local release, with a test designer facade. It is not a live compiler/IDE editing session.
- `node tools/validate-tabview-projects.mjs`: 26 package, 36 test-app and 4 add-in file entries matched their mirrors exactly. Full embedded package equality, imported package revision, control IDs, paired form IDs, three real page ownership and source CRLF checks passed.
- The current official twinbasic/documentation `scripts/impexp.mjs` exported all three assembled projects successfully without repacking them. Its 26 package, 35 test-app and 3 add-in exported file contents matched repository mirrors byte for byte; the omitted .meta entries were preserved by the order-preserving project tools.
- Original control identities were checked against the existing ID records; new controls have separate stable ID records. Existing probe projects and styling files are not replaced by this pass.

## Source evidence

- Official twinBASIC BETA 1043 release tag: `beta-x-1043`.
- Release archive SHA-256: `5b199cb5108713bf70756f1a070076c745e758f529296c7868d65670f01972b8`.
- `ide/main.js` SHA-256: `6a93374793ad18cee5c8e34fe748b40e5ebefab6f17d48c16d62009ada72783c`.
- Inspected designer insertion, property-change, deletion, undo and pending-work behavior; inspected UserControl.ContainedControls and ActiveXExtender.Object; reused the repository add-in Host/ToolWindow/Button lifecycle and the shipped tbIDE AddinTimer API.
- WinUI resource authority: microsoft-ui-xaml `3259dc4437540678368c6e7c72869cb58d14a568`, `controls/dev/TabView/TabView_themeresources.xaml`. Scope and deliberate candidate divergences are in `../controls/UI3TabView.md`.

## Packed artifacts

| Project | SHA-256 |
| --- | --- |
| `tbUI3/tbUI3.twinproj` | `f17cf0419602c2021ab83d5a456462dcb52e31cc60c2f02bf46124797462656e` |
| `tbUI3Test/tbUI3Test.twinproj` | `16ef3cd14daafac77b6dfaae24f468afc71057ad2e9cd2f6f5066a9fa3110cbe` |
| `tbIDE/TabViewDesigner/TabViewDesigner.twinproj` | `77512d4dfb1ca55a583ca2eab052c8ff9159ffbe542981781b2c9de514bf2c10` |

## Remaining gate

The 1.0.0.61 integration had no recorded real IDE result at publication. Subsequent screenshots establish designer opening with rendering/initialization defects; they do not establish a successful full editing loop. The next gate is the actual add/switch/drop/Properties/resize/save/reopen/delete/reorder/undo workflow, then runtime ownership/keyboard and final win64 smoke. WinUI visual-state, accessibility, high-contrast and overflow-button work remains in ROADMAP.md. Do not promote source/fixture results to those categories.

The starting package/test-project snapshots came from tbui3-dev `18ab64f4f08543bb60dde6163b98f78bcbe95479`. Concurrent styling commit `312eebe0b3a7335d01ee7dae5b56c5235442bac7` is preserved; the shared tbIDE changelog was reconciled with its additions.


