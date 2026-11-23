# Working on tbUI3

## Agent entry point: updater and installation management

For any tbUI3IDE updater, first-install, Welcome Wizard, per-user add-in, IDE update strategy, release-inventory, archive, or installation-discovery work, read **[tbIDE/INSTALLATION_MANAGER_SPEC.md](tbIDE/INSTALLATION_MANAGER_SPEC.md)** *before* development. It is Shane's consolidated approved requirements and phase boundaries, including deferred work, safety constraints and unresolved IDE loader questions. Cross-check [tbIDE/BOOTSTRAP_WELCOME_PLAN.md](tbIDE/BOOTSTRAP_WELCOME_PLAN.md), [tbIDE/Updater/README.md](tbIDE/Updater/README.md) and current roadmaps. Do not mistake approved design for implemented code or native acceptance. Do not merge to main or publish a release without Shane's approval.

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

## Hexadecimal literal widths (required)

- Never leave `&H8000` through `&HFFFF` untyped in first-party twinBASIC code, even inside `ChrW$`, casts, constant declarations, comparisons, API arguments or bitwise expressions. VB-compatible inference treats these as **negative 16-bit Integer** values; assignment/conversion to Long does not repair that sign extension (TB0012).
- For a positive Unicode code point, PE machine identifier, mask or other Long value, append `&`: `ChrW$(&HFEFF&)`, `&H8664&`, `&HF041&`, `&HF000&`, `&HA000&`. Prefer named, explicitly typed constants when reused, and type the literal itself as well.
- Use `%` only when a signed 16-bit Integer is intentional, and keep its width consistent with the destination. Example: the WinTrust GUID's Integer field uses `&HCD44%` to preserve those 16 bits. Do not mechanically widen such fields or change native structure layouts.
- Review high-bit 32-bit literals separately when converting to LongPtr, LongLong or unsigned values: an explicit Long literal can still sign-extend when widened. Specify the intended width/bit pattern; never suppress TB0012 to hide an unintended conversion.
- Before every development-pass commit, run `node tools/validate-hex-literals.mjs` (also included in `node tools/validate-tabview-projects.mjs` and `node --test tests/*.mjs`). It checks active first-party canonical projects, source mirrors and the embedded tbUI3 copy, excluding third-party compiler packages. It ignores quoted strings/comments and requires an explicit suffix for the ambiguous 16-bit range. Historical probe snapshots and reference-package donor code are outside that automatic gate; apply the same rule to any first-party code brought back into active development.

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
- Commit and push to `origin/tbui3-dev` after every development pass, as Shane explicitly requested on 2026-11-12. Verify that the push succeeded; report any failure. This standing authorization does not authorize merging into `main` or opening PRs.
- After Shane saves in the IDE, the saved projects and their exports are committed, so the repository always holds his real copy.

## Documents

- Update `CHANGELOG.md` and `ROADMAP.md` in every pass.
- Record only what was actually built and run as validated.
