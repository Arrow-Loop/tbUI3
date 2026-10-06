# tbUI3

WinUI 3 style UserControls for twinBASIC, packaged as a TWINPACK so they can be dropped onto
twinBASIC forms like the built-in VB6-compatible controls.

## Layout

| Path | Contents |
| --- | --- |
| `tbUI3/tbUI3.twinproj` | Package project (build type: Package TWINPACK) |
| `tbUI3/src/` | Plain-text export of the package project |
| `tbUI3Test/tbUI3Test.twinproj` | Standard EXE test harness that references the tbUI3 package |
| `tbUI3Test/src/` | Plain-text export of the test harness |

The `.twinproj` files are binary and are the source of truth for the IDE. The `src/` folders are
exported from them so changes can be diffed and reviewed.

## Syncing source and project

```
D:\twinBASIC\bin\twinBASIC_win64.exe export "tbUI3\tbUI3.twinproj" "tbUI3\src\" --overwrite
D:\twinBASIC\bin\twinBASIC_win64.exe import "tbUI3\tbUI3.twinproj" "tbUI3\src\" --overwrite
```

Export after saving in the IDE; import after editing files under `src/` (close the project in the
IDE first).

## Project documents

- `CHANGELOG.md` records what was done. `ROADMAP.md` records what comes next.
- `AGENTS.md` describes how to work on the repository.
- `docs/` holds the design notes, including the spike A plan in `docs/2026-10-06-spike-spec.md`.
- `tools/` holds Node scripts that edit `.twinproj` files in place, keeping every entry they don't change byte-identical.
