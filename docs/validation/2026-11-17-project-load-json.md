# Test-project load failure investigation, 2026-11-17

Status: cause identified from the BETA 1044 response; targeted package 68 repair committed. Native reopen confirmation remains pending. Earlier investigation notes below describe the evidence available at each stage.

Shane uploaded logs in 7742dc7 and the failing project in 75b7598. His BETA 1044 error is `Expected ',' or '}' after property value in JSON at position 16525 (line 1 column 16526)`.

## Preserved evidence

- Uploaded `tbUI3Test/tbUI3Test.twinproj`: 625677 bytes; SHA-256 `af549dbc0816f416d5d3c2564d16968173fa9b62706475e33bb50322a39c9edb`.
- An exact backup is retained outside both checkouts in `.workspace-tools/tabview-json-recovery/tbUI3Test-75b7598.twinproj`.
- All 37 file contents are byte-identical by entry path to c109d62. No files were added or removed. Entry order and file revision metadata differ. The earlier commit is a comparison baseline, not a demonstrated working native build.
- All 11 stored JSON documents in the uploaded test project parse: two Settings, .meta, both forms and six control/property-page definitions. Form arrays, saved `_IPersistStreamData`, child controls, source code and IDs were left intact.
- All 71 canonical project/mirror pairs match; complete embedded package, references, identities, page ownership and source CRLF checks pass.
- Uploaded logs record native 1.0.0.65 and adapter v9 installation; they do not contain the malformed JSON payload or a JavaScript stack locating its parser. Do not infer a successful native package 67 run from these logs.

## Reproduction limitation and next evidence

Computer Use could launch the local `%APPDATA%/twinBASIC/twinBASIC.exe`, but its startup alert identifies BETA 904 and fails before opening a project with a different JSON error (`Unexpected token E`, returned text beginning `ERROR: fai...`). This is not a reproduction of Shane's BETA 1044 project failure. No installation, security settings or project contents were changed to bypass it.

The installed IDE JavaScript has multiple JSON consumers, including compiler settings, filesystem descriptions and designer responses. Valid stored JSON does not establish that generated responses are valid. Obtain the failure stage (project open versus form-designer open), whether the standalone package opens, and the full stack/malformed response in BETA 1044 before choosing a repair. Do not erase control persistence, revert forms or hide exceptions on this evidence.

## Validation improvement

`node tools/validate-tabview-projects.mjs` now parses stored Settings, .meta, form/control/property-page/report and .json entries in addition to verifying exact mirrors. It passes all three projects. This catches malformed stored JSON in future passes; it cannot validate a native compiler/designer response that has not been captured. Package 1.0.0.67 and add-in 1.3.0.16 remain unchanged.

## Screenshot follow-up and diagnostic build

Shane confirms the project opens, while frmMultiPage stalls at 20%. The screenshot shows the same parser position and BETA 1044. The installed main.js sets that progress after receiving saved form data, before native snapshots finish. Its full-form snapshot parser has an uncaught JSON.parse; unlike the per-control parser, it does not show a bad-JSON payload dialog. This is a targeted capture point, not proof of the precise faulty value.

Add-in 1.3.0.17 / adapter v10 observes that handler, preserves its return/this/arguments and original exception, and records only malformed JSON failures. The report contains form, response length, position, nearest preceding name, a 420-character excerpt and a stack capped at 1800 characters. It does not log entire image payloads or alter persisted data. The existing controller polls the report every 1.5 seconds and writes both project-local and TEMP tbUI3-tabview.log. Unload restores the original handler when still owned; newer hooks remain intact. The stale adapter v8 log prefix is corrected to v10.

All 146 tests pass, including the installed native snapshot parser receiving a synthetic malformed packet, successful delegation, failure preservation, short-buffer handling and chained-hook disposal. All 71 exact mirrors and stored JSON checks pass. No native BETA 1044 acceptance is claimed. Package 67 and the uploaded test project are unchanged. Next: rebuild/reload the add-in, reopen the form, wait two seconds and collect the Native designer JSON failure entry. The defect remains unresolved pending that response.

## Captured cause and package 1.0.0.68 repair

The 12:51:54 adapter v10 entry uploaded in a2fe3a0 contains a 224448-character response for frmMultiPage. Nearest preceding control: UI3TabView2. Its excerpt contains this malformed native JSON (quotes reproduced literally):

```text
"TabStyle":"Description("Edge Style")","__editor_TabStyle":"|Description("Edge Style"),0|ui3TabEdge,0|Description("Explorer Style"),1|ui3TabExplorer,1"
```

The native parser fails at position 16525, matching Shane's original error. The stack identifies gotNewFormSnapshotsResponse through gotServerMessage. The enum-member Description attributes introduced in package 66 are treated as enum names by BETA 1044, and the response serializer emits their quotes unescaped. The stored project JSON was valid; the load failure arises in the generated native response.

Removed only the two member attributes from UI3TabStyle. Comments, the enum-level description and property help still explain Edge Style/Explorer Style. ui3TabEdge=0, ui3TabExplorer=1, default/persistence and stable identities are retained. The native picker uses the identifiers, consistent with other enums. Updated package version/reference to 68 and synchronized its complete embedded copy. Add-in 1.3.0.17 / adapter v10 remains unchanged.

Validation: the new regression fails against the original enum body and passes after removal; it enforces plain enum identifiers/values and checks both choices at the observed native raw-string JSON boundary. All 147 tests and 71 exact mirrors/stored JSON checks pass. Compared all nine non-package consumer entries except Settings to a2fe3a0: both forms, source, resources and .meta are byte-identical. No saved _IPersistStreamData was removed or changed. This is source/response evidence and automated validation; reopening in the native BETA 1044 IDE is pending. Pull and reopen the updated test project (the repaired package is embedded). Rebuild package 68 before using an external twinpack so an old package cannot replace it.
