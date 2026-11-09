# TabView candidate validation, 2026-11-09

Current candidate: **1.0.0.63**. Earlier candidate evidence is retained below as history.

## 1.0.0.63 reported loading/compilation failure

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


