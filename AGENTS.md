# Working on tbUI3

## Project files

- Each `.twinproj` is the canonical project.
  - Each `src/` folder is a plain-text export of its project. The IDE's own exporter writes it, and so does the documentation repo's `impexp.mjs export`; the two match apart from empty folders.
  - Whoever changes a project regenerates its `src/` and checks the export matches the project.
- Change a project in one of two ways:
  - Edit `src/` and run `twinBASIC_win64.exe import` (with the project closed in the IDE).
  - Or patch the `.twinproj` directly with the tools in `tools/`. They keep the entry order and leave every entry they don't change byte-identical.
  - Don't round-trip a project through `impexp.mjs` export and import: its export drops `.meta`, and its import re-sorts the entries.
- Line endings:
  - `.twin` sources are CRLF.
  - Keep whatever line endings a `Settings` file already has. The package's Settings uses LF.
  - `.gitattributes` stores every file byte-for-byte.
- Build, test and save in the twinBASIC IDE. The command-line compiler (BETA 997) only exports and imports projects.
  - After rebuilding tbUI3, re-import the `.twinpack` into tbUI3Test (Ctrl+T, then Available Packages). `tbUI3Test/src/Packages/tbUI3` is the embedded copy.
- Never change the class, interface or event IDs of an existing control. They are listed in `tbUI3/UI3Button-ids.json`.

## Branches

- Work goes on `tbui3-dev`. Shane decides what reaches `main`.
- After Shane saves in the IDE, the saved projects and their exports are committed, so the repository always holds his real copy.

## Documents

- Update `CHANGELOG.md` and `ROADMAP.md` in every pass.
- Record only what was actually built and run as validated.
