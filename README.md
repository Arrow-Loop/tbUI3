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
| `tbIDE/` | WinUI3 Dark and Light themes for the twinBASIC IDE itself, and the tbUI3IDE add-in (own README, CHANGELOG and ROADMAP) |

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

- The working Button, form theme, icon picker and stored-icon milestones have their validation history in CHANGELOG.md. IconList L3 was added in 1.0.0.60; L4 remains planned.
- Package 1.0.0.65 contains the integrated UI3TabView/UI3TabPage candidate and designer paint lifecycle corrections and temporary diagnostics: real page ownership, sizing and runtime switching, plus [the unified tbUI3 IDE add-in](tbIDE/README.md) for designer authoring. [API, source matrix and validation boundary](docs/controls/UI3TabView.md).
- tbUI3Test preserves the icon harness and adds **Open MultiPage test**, opening a three-page form. Its embedded package is synchronized with the canonical package.
- The unified tbUI3IDE add-in 1.3.0.1 includes adapter v8 and selectable Classic/Hybrid/Ribbon layouts with active-theme presentation, function-based command sizes, complete command icon fallbacks and Help under File. The latest presentation correction restores the toolbar surface/foreground, WinUI hover/pressed effects and themed grid controls; see docs/validation/2026-11-11-ribbon-presentation.md. It hides the page toolbox button and retains the v7 changes: it completes structural deletion and generates host-scoped page names, while native page locks, toolbar help and count diagnostics remain. Package 1.0.0.65 also skips invalid native entries individually so a deleted entry cannot stop later replacement-page discovery. Shane confirms locked pages still accept child controls. The current follow-up is delete/readd state and replacement-page bounds across multiple hosts.
- Adapter fixture, BETA 1043 paste-contract and project/mirror checks are recorded separately from the pending full IDE-loop gate. This is a candidate, not a completed WinUI fidelity milestone.

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

