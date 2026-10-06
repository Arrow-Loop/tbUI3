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
| `reference-packages/ReferencePackages.twinproj` | Validated package-laboratory project used only to study third-party implementations |
| `reference-packages/src/` | Loose mirror of the reference project and embedded packages for search, diffing, and code archaeology |

The `.twinproj` files are binary and are the source of truth for the IDE. The `src/` folders are
exported from them so changes can be diffed and reviewed.

## Syncing source and project

```
D:\twinBASIC\bin\twinBASIC_win64.exe export "tbUI3\tbUI3.twinproj" "tbUI3\src\" --overwrite
D:\twinBASIC\bin\twinBASIC_win64.exe import "tbUI3\tbUI3.twinproj" "tbUI3\src\" --overwrite
```

Export after saving in the IDE; import after editing files under `src/` (close the project in the
IDE first).

## Current development state

- `UI3Button` is the first working Direct2D/DirectWrite control. Standard and Accent rest-state rendering, resizing and Click have been validated in win32 and win64 dark mode.
- Package version 1.0.0.2 contains the validated form-theme baseline: `UI3Window.Attach/Detach` plus the nonvisual drop-on `UI3FormTheme`, cached theme/accent state and live Windows theme/accent notifications.
- Live light/dark switching has been validated during runtime testing.
- The active implementation milestone is S3 icon glyph support. Package version 1.0.0.3 contains the first packed candidate and awaits BETA 997 compile/runtime validation.

## WinUI fidelity contract

tbUI3 is source-driven, not “Fluent-inspired.” `docs/CONTROL_FIDELITY_POLICY.md` is authoritative: each control/variant must trace its values, resources, visual states and behavior to that control's actual WinUI XAML/theme resources/implementation wherever Microsoft defines them. Generic Fluent guidance may only fill a gap as an explicitly labeled tbUI3 convenience.

## Control coverage

`docs/CONTROL_INVENTORY.md` is the authoritative coverage map. tbUI3 targets the broad practical WinUI 3 control/style surface, including the hundreds of documented variants represented across WinUI Gallery, while collapsing related Microsoft classes/styles into a much smaller set of VB-style toolbox families selected through properties such as `Style`, `Mode` and `Presentation`.

The current inventory is reconciled against WinUI Gallery main commit `b927a6253d6b183be55b90287b8a04fde14d31a3` (2026-10-05).

## Project documents

- `CHANGELOG.md` records what was done. `ROADMAP.md` records what comes next.
- `THIRD-PARTY-NOTICES.md` records the exact open-source implementation/resource provenance adapted into the self-contained package.
- `AGENTS.md` describes how to work on the repository.
- `docs/CONTROL_FIDELITY_POLICY.md` defines the non-negotiable source-fidelity rule for every control and variant.
- `docs/` holds the design notes, including the spike A plan in `docs/2026-10-06-spike-spec.md`.
- `tools/` holds Node scripts that edit `.twinproj` files in place, keeping every entry they don't change byte-identical.

## Dependency policy

tbUI3 is intentionally self-contained. Public TWINSERV and built-in packages may be studied as reference implementations, and permissively licensed portions may be adapted when useful, but they are not added as tbUI3 package dependencies merely for convenience. Any adapted third-party implementation must be minimized, kept private where practical, and have its source/licence recorded.

The project under `reference-packages/` is therefore a laboratory, not a dependency template. Its many enabled packages are expected there and must not be copied wholesale into `tbUI3/tbUI3.twinproj`.
