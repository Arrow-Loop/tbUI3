# Test-project load failure investigation, 2026-11-17

Status: unresolved native IDE load error; no project repair is claimed.

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
