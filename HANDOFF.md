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
| S2: win64 | Passed at runtime by eye; looks identical to win32, and Click raises the Hello World message box |
| S2: light mode | Deferred by Shane; not validated |
| S2: repaint when the form's BackColor changes | Bug. Cause still open (see ROADMAP) |
| UI3Window (dark/light title bar, #202020/#F3F3F3 background) | dark mode passed in win32 and win64; light mode deferred |
| Form theme spec: drop-on control, live switching, theme cache | 1.0.0.2 builds/imports cleanly; Attach-based harness runs with Click intact; live accent changes, live light→dark switching, and win32 debugger-stop teardown passed. win64 live-engine run/stop and drop-on UI3FormTheme remain |

## First job for the next session: validate the 1.0.0.2 form-theme engine

**Final overnight structural check:** the canonical tbUI3 package matches its loose package mirror byte-for-byte for all current Sources/descriptors and Settings. tbUI3Test's packed frmMain/Settings match its loose mirror, and its 12-file embedded tbUI3 package matches the canonical package exactly. This is not compiler/runtime validation.

The source/project candidate now contains UI3FormTheme, UI3Window.Attach/Detach, cached theme/accent state and live subclass notifications.

1. **Passed:** tbUI3 builds cleanly in BETA 997 and imports into tbUI3Test.
2. **Passed:** tbUI3Test runs through `UI3Window.Attach Me`; UI3Button Click still raises Hello World.
3. **Passed:** changing the Windows accent while the app is open updates the Accent button live.
4. **Passed:** changing Windows from light to dark while the app is open updates the app live.
5. **Passed:** stopping the debugger while the subclassed win32 form is open returns cleanly to the IDE with no crash/hang.
6. Repeat the run/stop checks in win64.
7. Then drop UI3FormTheme from the toolbox onto frmMain, remove the code Attach/Detach calls, and confirm the drop-on path behaves identically.


## Reference package laboratory

- `reference-packages/ReferencePackages.twinproj` is the validated package-archeology project. Shane confirmed the repaired project runs in BETA 997.
- It intentionally enables many packages so their actual source/API patterns can be inspected in one place. That does **not** authorize adding those packages as tbUI3 dependencies.
- The loose `reference-packages/src/` mirror should be used for searches and diffs; the `.twinproj` remains the canonical snapshot.
- The original diagnostic avalanche was caused by WinDevLibImpl's embedded `Packages/WinDevLib` folder being empty even though its Settings declared that local dependency. The repaired snapshot embeds the same WinDevLib 9.5.742 payload there. Do not “fix” those interfaces by duplicating hundreds of missing declarations.
- Priority donors/references: WinRT (runtime activation, HSTRING, Composition, and its modern subclass helper), WinDevLib/WinDevLibImpl (Windows/COM declarations), VBCCR18 (modern subclassing and mature control behavior), TwinTimerLib, AutoCompleteLib, and OLEGuids. The audited WinRT 1.7.0.159 source does not contain UISettings/GetColorValue, and TBMANLIB 1.0.29.0's subclass helper is legacy 32-bit code, so neither should be assumed to solve those jobs. GdiPlus is comparison/reference only; tbUI3 remains Direct2D/DirectWrite-first.
- For any adapted third-party code, verify the licence and record provenance. Minimize the copied surface and keep helpers private where practical.

## Full control-surface target

- `docs/CONTROL_INVENTORY.md` is the authoritative control/variant coverage map.
- The package goal is broad practical WinUI 3 coverage, including the hundreds of documented Gallery/style/behavior variants, **not** hundreds of toolbox entries.
- Preserve Claude decision D6: one coherent `UI3...` control family exposes related Microsoft controls through `Style`, `Mode`, `Presentation` or other focused properties. Example: `UI3Button` covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit and command-bar button variants.
- Current Microsoft Gallery snapshot used for the inventory: 2026-10-05 main commit `b927a6253d6b183be55b90287b8a04fde14d31a3`, 125 catalog pages.
- Fundamentals/design/accessibility pages become package-wide requirements, while platform/service pages such as Clipboard, shell notifications or AppWindow are not misrepresented as draggable controls.
- Do not add package dependencies merely to cover a Gallery host/service. Use private native implementations, optional adapters/companions or documented existing platform facilities as appropriate.

## Prepared next milestone

- `docs/2026-10-06-s3-icon-spec.md` is the S3 implementation specification, ready once the 1.0.0.2 form-theme checkpoint passes.
- Important discovery: Microsoft's Symbol table maps many semantic icons to different Unicode points in Segoe Fluent Icons versus legacy Segoe MDL2 Assets. The implementation must use dual semantic mappings rather than changing only the font family.
- Ordinary text remains Segoe UI Variable Text with Segoe UI fallback; system icons use Segoe Fluent Icons with Segoe MDL2 Assets fallback.
- Current Gallery also exposes SubtleButtonStyle, now recorded as part of the UI3Button family target.

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
