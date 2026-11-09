# TabView candidate validation, 2026-11-09

Current candidate: **1.0.0.62**. The initial 1.0.0.61 evidence is retained below as history.

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

No real IDE first-open, compiler, runtime or full editing-loop result is recorded for this candidate. The next gate is the actual add/switch/drop/Properties/resize/save/reopen/delete/reorder/undo workflow, then runtime ownership/keyboard and final win64 smoke. WinUI visual-state, accessibility, high-contrast and overflow-button work remains in ROADMAP.md. Do not promote source/fixture results to those categories.

The starting package/test-project snapshots came from tbui3-dev `18ab64f4f08543bb60dde6163b98f78bcbe95479`. Concurrent styling commit `312eebe0b3a7335d01ee7dae5b56c5235442bac7` is preserved; the shared tbIDE changelog was reconciled with its additions.


