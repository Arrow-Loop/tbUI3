# Working on tbUI3

## Project files

- Each `.twinproj` is the canonical project.
  - Each `src/` folder is a plain-text export of its project. The IDE's own exporter writes it, and so does the documentation repo's `impexp.mjs export`; the two match apart from empty folders.
  - Whoever changes a project regenerates its `src/` and checks the export matches the project.
- Change a project in one of two ways:
  - Edit `src/` and run `twinBASIC_win64.exe import` (with the project closed in the IDE).
  - Or patch the `.twinproj` directly with the tools in `tools/`. They keep the entry order and leave every entry they don't change byte-identical. `node tools/twinproj-src.mjs compare|extract|patch <project.twinproj> <srcdir> [relpath...]` covers the usual cases.
  - `UI3Icon` and the picker's icon catalog are generated: edit `docs/research/data/segoe-fluent-icons.json` or `tools/gen-icons.mjs`, run `node tools/gen-icons.mjs`, then patch the `.twinproj`. Never hand-edit the `<generated:...>` regions.
  - Don't round-trip a project through `impexp.mjs` export and import: its export drops `.meta`, and its import re-sorts the entries.
- Line endings:
  - `.twin` sources are CRLF.
  - Keep whatever line endings a `Settings` file already has. The package's Settings uses LF.
  - `.gitattributes` stores every file byte-for-byte.
- Build, test and save in the twinBASIC IDE. The command-line compiler (BETA 997) only exports and imports projects.
  - After rebuilding tbUI3, re-import the `.twinpack` into tbUI3Test (Ctrl+T, then Available Packages). `tbUI3Test/src/Packages/tbUI3` is the embedded copy.
- Never change the FormDesignerId, class, interface or event IDs of an existing control. Each public control's stable IDs are recorded in `tbUI3/UI3*-ids.json` (currently `UI3Button-ids.json`, `UI3FormTheme-ids.json` and `UI3IconList-ids.json`). Add a new record when a new public control is created; preserve it thereafter.

## WinUI fidelity

- Read `docs/CONTROL_FIDELITY_POLICY.md` before implementing or restyling any control.
- tbUI3 reproduces WinUI 3 control-specific XAML/resources/behavior; do not substitute generic Fluent approximations when Microsoft defines a control-specific value or state.
- Source priority is control-specific microsoft-ui-xaml theme resources/templates first, then implementation source, Gallery, official API docs, and only then general Fluent guidance for genuinely undefined convenience behavior.
- When a control consumes a shared resource, follow the exact resource chain referenced by that control's XAML.
- Any tbUI3-only convenience property must be documented as such and must not be described as a WinUI property/default.
- Per-control docs under `docs/controls/` must identify exact upstream sources for every state/variant claimed as implemented.
- If a value cannot be sourced, mark it unresolved or convenience-only; never invent a plausible value merely because it looks Fluent.

## Dependencies and reference packages

- tbUI3 must remain self-contained apart from baseline twinBASIC/compiler references that every consumer project can reasonably be expected to have.
- Do not add WinRT, WinDevLib, WinDevLibImpl, GdiPlus, TBMAN, VBCCR, or another TWINSERV package as a tbUI3 dependency merely because the reference project uses it.
- `reference-packages/ReferencePackages.twinproj` is a package-archeology laboratory. Its enabled packages are there to inspect proven twinBASIC implementations.
- When a reference implementation is useful, first check its licence and provenance. Adapt only the smallest needed portion, keep implementation plumbing private where practical, and record attribution/source details.
- The loose `reference-packages/src/` mirror is for search and review. The validated `.twinproj` remains the canonical snapshot of the laboratory project.
- For native window subclassing, prefer the pointer-width-safe comctl32 `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` pattern evidenced by WinRT/VBCCR18. Do not copy TBMANLIB 1.0.29.0's legacy `GetWindowLongW` / `SetWindowLongW` helper into win64-capable tbUI3 code.

## Branches

- Work goes on `tbui3-dev`. Shane decides what reaches `main`.
- After Shane saves in the IDE, the saved projects and their exports are committed, so the repository always holds his real copy.

## Documents

- Update `CHANGELOG.md` and `ROADMAP.md` in every pass.
- Record only what was actually built and run as validated.
