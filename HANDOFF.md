# Handoff: tbUI3 state on 2026-10-06

This is written for the next developer or AI session. Read `AGENTS.md`, then `CHANGELOG.md` and `ROADMAP.md`.

## What tbUI3 is

tbUI3 is a twinBASIC package (TWINPACK) of WinUI 3 / Windows 11 style UserControls. You draw them from the toolbox onto ordinary twinBASIC forms.

The decisions are in `docs/2026-10-06-first-pass-report.md` and `docs/2026-10-06-spike-spec.md`:
- UserControls, not CustomControls, because CustomControls only work on a WaynesForm.
- All drawing in Direct2D and DirectWrite, with no GDI+.
- Private declarations only.
- Every visual value cites microsoft-ui-xaml.
- The `UI3` prefix and VB-style property names.

## Where things are

- **Repo:** Arrow-Loop/tbUI3 (private). The work branch is `tbui3-dev`. `main` holds only the S1 commit. PR #1 (`tbui3-dev` into `main`) is open, and Shane merges it.
- **Shane's PC:** the clone is `E:\Code Projects\tbUI3`, and twinBASIC BETA 997 is in `D:\twinBASIC`. The CLI (`bin\twinBASIC_win64.exe`) can only `export` and `import`; it has no build command, so builds happen in the IDE.
- **Stale folder:** `E:\Code Projects\WinUI 3` is an old duplicate. Ignore it.
- **Shane's machine:** dark mode, accent #FF4343.

## Verified vs not

| Item | State |
| --- | --- |
| S1: the package's control appears in the toolbox, drops onto a form, its properties persist, Click works | Passed (win32) |
| S2: Direct2D button, accent and Standard styles, 4 px corners, gradient border, Segoe UI Variable text | Passed in win32, at design time and runtime |
| S2: resizing | Passed |
| S2: win64 | Designer draws correctly and a run starts cleanly. The running window was not inspected |
| S2: light mode | Not tested |
| S2: repaint when the form's BackColor changes | Bug. Cause still open (see ROADMAP) |
| UI3Window (dark/light title bar, #202020/#F3F3F3 background) | Built. Not run |
| Form theme spec: drop-on control, live switching, theme cache | Not built |

## First job for the next session: repair tbUI3Test

The tbUI3Test project file in the repo embeds the new 1.0.0.1 package. It is missing its `[IMPORTED] tbUI3` reference, so UI3Button1 shows a warning triangle. To fix it:

1. Close tbUI3Test in the IDE, then back up `tbUI3Test\tbUI3Test.twinproj`.
2. Run `twinBASIC_win64.exe export` on it into `tbUI3Test\src --overwrite`.
3. Add the `[IMPORTED] tbUI3` entry to `src\Settings` under `project.references`. Copy it from `git show 6df11b7:tbUI3Test/src/Settings`. Set `versionRevision` to `"1"` to match package 1.0.0.1.
4. Make `src\Packages\tbUI3\` an exact copy of `tbUI3\src\`.
5. In `src\Sources\frmMain.twin`, call `UI3ApplyWindowTheme Me` in `Form_Load` and `Form_Activate`. Check the exact name in `tbUI3/src/Sources/UI3Window.twin`.
6. Run `twinBASIC_win64.exe import` back into the `.twinproj`. Open it in the IDE and run it.
7. Expect: a dark title bar, a #202020 form, both button styles readable, and Click working.

## Gotchas

- **Re-importing the package into tbUI3Test.**
  - The IDE's "Import from file" refuses a package whose name is already embedded ("'tbUI3' conflicts with an existing imported package").
  - Removing the reference in the IDE doesn't remove the embedded copy.
  - Instead, update the embedded copy through export, copy and import, as in steps 2 to 6 above. The embedded copy is just the package's own source export.
  - In the IDE's dialog, the imported package also has to be ticked by hand. GUI automation struggled with that.
- **`.twinproj` files are binary.**
  - Edit them by exporting to `src/`, editing, and importing with the twinBASIC CLI, or patch them with `tools/*.mjs`.
  - The documentation repo's `impexp.mjs` import re-sorts entries and its export drops `.meta`. Don't round-trip through it.
  - Keep `.twin` files CRLF. Keep each `Settings` file's existing line endings: the package's uses LF.
- **IDs.** Never change UI3Button's class, interface or event IDs (`tbUI3/UI3Button-ids.json`).
- **WinUI colours.** WinUI's dark fills are translucent, so test on a dark form (#202020). On the default light grey form the Standard button's text is nearly invisible.
- **Declarations.** The Direct2D/DirectWrite interfaces in `UI3Direct2D.twin` declare only the vtable slots that are used; the rest are numbered placeholders. When you call a new method, replace its placeholder in the same slot. Never insert or reorder slots.
- **Reading the accent.** It is read from the undocumented `AccentPalette` registry value. Entry 1 is Light2, which is the accent button fill in dark mode (so the button shows #FF8279 on Shane's PC).

## Working agreements with Shane

- Push only to `tbui3-dev`. Don't open PRs or merge without Shane asking.
- Update CHANGELOG.md and ROADMAP.md in every pass. Record only what was actually run as verified.
- Keep instructions to Shane short and one step at a time, with the exact thing to click or type.
