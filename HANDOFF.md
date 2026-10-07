# Handoff: tbUI3 state on 2026-10-07

This is written for the next developer or AI session; ChatGPT is expected to run the next several passes. Read `AGENTS.md`, then this file, then `CHANGELOG.md` and `ROADMAP.md`. State at the time of writing: `tbui3-dev`, package version 1.0.0.16 (candidate), twinBASIC BETA 997.

## What tbUI3 is

tbUI3 is a twinBASIC package (TWINPACK) of WinUI 3 / Windows 11 style UserControls. You draw them from the toolbox onto ordinary twinBASIC forms.

The decisions are in `docs/2026-10-06-first-pass-report.md` and `docs/2026-10-06-spike-spec.md`:
- UserControls, not CustomControls, because CustomControls only work on a WaynesForm.
- All drawing in Direct2D and DirectWrite, with no GDI+.
- Private declarations only.
- Every visual value cites microsoft-ui-xaml.
- The `UI3` prefix and VB-style property names.

## Where things are

- **Repo:** Arrow-Loop/tbUI3 (private). The work branch is `tbui3-dev`. `main` holds only the S1 commit. PR #1 (`tbui3-dev` into `main`) is still open; it was opened without Shane asking, and he decides whether to merge or close it.
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
| S2: repaint when the form's BackColor changes | Probably fixed by UI3Window's redraw of all child controls, but never checked on its own (see ROADMAP) |
| UI3Window (dark/light title bar, #202020/#F3F3F3 background) | dark mode passed in win32 and win64; light mode deferred |
| Form theme spec: drop-on control, live switching, theme cache | Passed. UI3FormTheme is in the toolbox, drops onto frmMain, replaces manual Attach/Detach, and passes the same runtime behavior tests |
| S3 icons (1.0.0.3): build, designer and runtime rendering, icon left and top, enlarged button, icon-only, MDL2 font check, win64 | Passed on Shane's PC, 2026-10-06 |
| 1.0.0.4: Caption can be cleared in the designer | Passed on Shane's PC in win32 and win64, 2026-10-06 |
| Property page from `(Custom)` → `...` | Works (spike, 2026-10-06); the per-property `[PropertyPage]` link does not work in BETA 997 |
| 1.0.0.5: UI3IconPage searchable icon picker | Opens, shows the search hint and two-line info, and the picked icon is saved with the form (win32, 2026-10-07). The designer bridge in `UI3Icons` must stay until the cause is understood |
| 1.0.0.6: theme-aware PropertyPage chrome | Designer check passed the dark-canvas part but `picChrome` covered the child controls because its designer z-order was wrong. Runtime win32 was also opened by Shane and the themed picker still worked, so the observed stacking issue is designer-only. |
| 1.0.0.7: PropertyPage designer z-order experiment | Superseded. Shane's side-by-side check showed 1.0.0.6's original sibling order was actually the more accurate designer representation. |
| 1.0.0.8: native PropertySheet skin | Core visual proof passed in win32: dark host/title/tab/button shell appeared and the picker still worked. Issues found: initial white search Edit until interaction, tab/button hover flicker, clipped Apply text. |
| 1.0.0.9: PropertySheet paint/layout follow-up | Superseded by 1.0.0.10 before build. Owns WM_PAINT, refreshes the search Edit, resizes/repositions the real button HWNDs, and requests source-backed WinUI TabViewItem dimensions/typography. |
| 1.0.0.10: centered grid + dual-font details | Visually reviewed in win32 by Shane: centered matrix and dual-font Selected icon area look good. Remaining issues: native Edit repaints white, Icon tab still clipped, preview cards too dominant/too near action row. |
| 1.0.0.11: Edit/tab/preview follow-up | Runtime regression in win32: introduced a large white band above the page and did not fix the white Edit; tab still imperfect. Preview cards were reduced as intended. |
| 1.0.0.12: corrective Edit/tab geometry pass | Runtime screenshot still showed the same core defects; the page geometry experiment did not solve the problem. |
| 1.0.0.13: diagnostic rollback | Built/run win32. Probe confirmed `ThunderTextBox` is the exposed txtSearch HWND, parented by `ThunderPropertyPageDC`, and that parent receives `WM_CTLCOLOREDIT` for it. Clicking Apply also caused the page to shift down and reveal the full Icon tab. |
| 1.0.0.14: confirmed TextBox brush + Apply-layout trace | Built/opened in win32. Screenshot showed the native search edit still white and the Icon tab still clipped, so the confirmed WM_CTLCOLOREDIT route alone was not enough to fix the edit and the forced 32-DIP native tab item remained incompatible with BETA 997's reserved page geometry. |
| 1.0.0.15: native tab metrics + ThunderTextBox erase pass | Built/opened in win32. The Icon tab was still clipped; the diagnostic log then showed tbUI3 had attached to ThunderPropertyPageDC itself and had no tab HWND.  Leaves the real tab item at the host's native metrics and paints inside that rectangle; the confirmed ThunderTextBox subclass now fills WM_ERASEBKGND from the same themed brush and invalidates on focus changes. Not built/run. |
| 1.0.0.16: PropertySheet owner-chain host fix | Candidate only. Uses GA_ROOTOWNER so the top-level PropertyPage can resolve its owning PropertySheet and recover the real SysTabControl32. No new tab geometry change. Not built/run. |

## Work queue for the next passes (updated 2026-10-07)

Do these in order, one pass each unless they are trivially small. Each pass ends with Shane building and testing in the IDE, then CHANGELOG.md and ROADMAP.md (and this file's table) recording only what he actually saw.

1. **Build/test 1.0.0.16 in win32.** Pull/build/import and open `(Custom)` → `...`. Check whether the Icon tab is fully visible immediately. Then send the new `%TEMP%\tbUI3-propertypage.log`; the first checkpoint is simply that `Host` is the outer `#32770` PropertySheet and `Tab` is a nonzero `SysTabControl32` HWND. If that is true, continue the search-edit and Apply checks.
   - **Do not touch the designer bridge.** Keep `IconPageApplying`, `SetPendingIcon`/`TakePendingIcon`, `DesignName()` and the `DesignLog` calls exactly as they are.
2. **Finish validating the picker behavior after the chrome pass is visually stable.** In win32 and then win64: pick + Apply; pick + OK; reopen; search `save`, `57716`, `E8CB`, `&HE174`; pick then Cancel; wheel over both the grid and search box; drag/click the new painted scrollbar. Then switch Windows light/dark while the property page is open and note whether the page/titlebar repaint immediately.
3. **If the first chrome pass is stable, spike the host button strip.** Inspect the property-sheet HWND hierarchy and test a reversible overlay for host-owned OK/Cancel/Apply while leaving their native behavior underneath. Do not ship a host-window subclass/overlay unless teardown and keyboard behavior are proven.
4. **Tidy tbUI3Test.** Remove the two MDL2 test lines (`IconFontName`/`IconGlyph`) from frmMain's `Form_Activate`.
5. **Themed form canvas at design time** (ROADMAP, designer experience). UI3FormTheme themes the form only at runtime, so in the designer UI3 controls draw dark on a light form. First check that the designer lets a component set its parent form's BackColor at design time (`Ambient.UserMode = False`), then apply the WinUI window background when `ManageBackColor` is True. Cite the microsoft-ui-xaml source for the colours.
6. **Designer accent refresh** (ROADMAP). The designer reads the accent once at IDE start; refresh the theme cache at design time cheaply.
7. **S2 BackColor repaint check** (ROADMAP, spike A). Change a form's BackColor at runtime without UI3FormTheme and confirm the button repaints.
8. Then continue spike A in ROADMAP order (S4 windowless/transparent, S5 Mica, S6 per-monitor DPI, S7 visual states, S8 keyboard/focus, S9 coexistence). Each needs a short spec and Shane's go-ahead before code.

Things that need Shane's decision, not a pass of their own: a dark icon-picker page (exploratory; the Windows-drawn dialog frame stays light), picker extras (arrow keys, hover), what to do with PR #1 and `main`, and where `reference-packages/` lives.

## How a pass works with Shane

- Shane builds, tests and saves in the IDE himself. Give him one step at a time with the exact command to type or thing to click, and ask for a screenshot when the result is visual.
- Version: bump `project.versionRevision` in `tbUI3/src/Settings` (LF line endings) when the package changes, and add a line to `tbUI3/src/CHANGELOG.md`, which ships inside the package.
- Typical test loop: close the projects in the IDE, `git pull --no-edit`, reopen tbUI3, build, update the tbUI3 package inside tbUI3Test, test, then Shane commits and pushes (`git commit -am "..." && git push`).
- If `git pull` refuses because tbUI3Test.twinproj has local changes (usually from updating the package), use `git stash && git pull --no-edit`; the package is re-imported anyway.
- After Shane pushes, regenerate src from his projects (`node tools/twinproj-src.mjs extract tbUI3Test/tbUI3Test.twinproj tbUI3Test/src`, and the same for tbUI3) and check with `compare`.

### Syncing the project and src

- `tools/twinproj-src.mjs` replaces the twinBASIC CLI for this: `extract` regenerates `src/` from a project Shane pushed, `patch` copies edited src files into the project, `compare` checks they match. The CLI export also works but needs absolute paths.
- Never push a `.twinproj` while Shane has uncommitted IDE changes to the same file: it is binary and cannot be merged. Ask him to commit and push first (`git commit -am "..." && git push`), then pull and work.

## Reference package laboratory

- `reference-packages/ReferencePackages.twinproj` is the validated package-archeology project. Shane confirmed the repaired project runs in BETA 997.
- It intentionally enables many packages so their actual source/API patterns can be inspected in one place. That does **not** authorize adding those packages as tbUI3 dependencies.
- The loose `reference-packages/src/` mirror should be used for searches and diffs; the `.twinproj` remains the canonical snapshot.
- The original diagnostic avalanche was caused by WinDevLibImpl's embedded `Packages/WinDevLib` folder being empty even though its Settings declared that local dependency. The repaired snapshot embeds the same WinDevLib 9.5.742 payload there. Do not “fix” those interfaces by duplicating hundreds of missing declarations.
- Priority donors/references: WinRT (runtime activation, HSTRING, Composition, and its modern subclass helper), WinDevLib/WinDevLibImpl (Windows/COM declarations), VBCCR18 (modern subclassing and mature control behavior), TwinTimerLib, AutoCompleteLib, and OLEGuids. The audited WinRT 1.7.0.159 source does not contain UISettings/GetColorValue, and TBMANLIB 1.0.29.0's subclass helper is legacy 32-bit code, so neither should be assumed to solve those jobs. GdiPlus is comparison/reference only; tbUI3 remains Direct2D/DirectWrite-first.
- For any adapted third-party code, verify the licence and record provenance. Minimize the copied surface and keep helpers private where practical.

## Control fidelity rule

- Read `docs/CONTROL_FIDELITY_POLICY.md` before control work.
- This project is recreating WinUI 3 controls, not generic Fluent-looking controls.
- Control-specific microsoft-ui-xaml templates/theme resources outrank Gallery/general Fluent guidance.
- Follow exact resource chains and visual states where Microsoft defines them.
- Any property/value that exists only for twinBASIC/VB convenience must be explicitly labeled as such and must never be presented as “the WinUI value.”
- The S3 8-DIP `IconSpacing` default is currently one such convenience value; WinUI Button has arbitrary Content and defines no Button-specific icon-spacing property/resource.

## Full control-surface target

- `docs/CONTROL_INVENTORY.md` is the authoritative control/variant coverage map.
- The package goal is broad practical WinUI 3 coverage, including the hundreds of documented Gallery/style/behavior variants, **not** hundreds of toolbox entries.
- Preserve Claude decision D6: one coherent `UI3...` control family exposes related Microsoft controls through `Style`, `Mode`, `Presentation` or other focused properties. Example: `UI3Button` covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit and command-bar button variants.
- Current Microsoft Gallery snapshot used for the inventory: 2026-10-05 main commit `b927a6253d6b183be55b90287b8a04fde14d31a3`, 125 catalog pages.
- Fundamentals/design/accessibility pages become package-wide requirements, while platform/service pages such as Clipboard, shell notifications or AppWindow are not misrepresented as draggable controls.
- Do not add package dependencies merely to cover a Gallery host/service. Use private native implementations, optional adapters/companions or documented existing platform facilities as appropriate.

## Prepared next milestone

- `docs/2026-10-06-s3-icon-spec.md` is the S3 specification. S3 is now implemented and validated.
- Icon code points: a WinUI Symbol value (for example Accept = E10B) is the old Segoe UI Symbol code point. WinUI converts it to a modern code point (Accept = E8FB) before drawing. Segoe Fluent Icons and Segoe MDL2 Assets both use the modern code points, so tbUI3 keeps one table copied from WinUI's `icon.cpp`. This supersedes the S3 spec's original "dual mapping" rule.
- Ordinary text remains Segoe UI Variable Text with Segoe UI fallback; system icons use Segoe Fluent Icons with Segoe MDL2 Assets fallback.
- Current Gallery also exposes SubtleButtonStyle, now recorded as part of the UI3Button family target.

## Gotchas

- **Re-importing the package into tbUI3Test.**
  - The IDE's "Import from file" refuses a package whose name is already embedded ("'tbUI3' conflicts with an existing imported package").
  - Removing the reference in the IDE doesn't remove the embedded copy.
  - Instead, update the embedded copy (Shane does this from the IDE as part of each test loop). The embedded copy is just the package's own source export.
  - In the IDE's dialog, the imported package also has to be ticked by hand. GUI automation struggled with that.
- **`.twinproj` files are binary.**
  - Edit them by exporting to `src/`, editing, and importing with the twinBASIC CLI, or patch them with `tools/*.mjs`.
  - The documentation repo's `impexp.mjs` import re-sorts entries and its export drops `.meta`. Don't round-trip through it.
  - Keep `.twin` files CRLF. Keep each `Settings` file's existing line endings: the package's uses LF.
- **IDs.** Never change UI3Button's class, interface or event IDs (`tbUI3/UI3Button-ids.json`).
- **WinUI colours.** WinUI's dark fills are translucent, so test on a dark form (#202020). On the default light grey form the Standard button's text is nearly invisible.
- **Declarations.** The Direct2D/DirectWrite interfaces in `UI3Direct2D.twin` declare only the vtable slots that are used; the rest are numbered placeholders. When you call a new method, replace its placeholder in the same slot. Never insert or reorder slots.
- **PropertyPages (BETA 997).** Setting `Me.Changed` inside `PropertyPage_SelectionChanged` raises "Automation error" 80004005 (the frame is still in `SetObjects`); start pages unchanged instead. The per-property `[PropertyPage("...")]` link is ignored, so pages open only from `(Custom)` → `...`. `UserControl.PropertyChanged` can leave a swallowed DISP_E_UNKNOWNNAME in `Err` after it returns, so don't treat `Err` after a property Let as proof the Let failed. Shane has reported both issues to twinBASIC.
- **PropertyBag defaults.** A value equal to the `WriteProperty` default is not saved. If a new control starts with a different value (InitProperties), clearing it back to the default must still work (the 1.0.0.4 Caption fix used `NEW_CONTROL_CAPTION` vs `DEFAULT_CAPTION`).
- **CLI export** needs absolute paths; with relative paths it says the input twinproj does not exist. `tools/twinproj-src.mjs` avoids the CLI entirely.
- **Reading the accent.** It is read from the undocumented `AccentPalette` registry value. Entry 1 is Light2, which is the accent button fill in dark mode (so the button shows #FF8279 on Shane's PC).

## Working agreements with Shane

- Push only to `tbui3-dev`. Don't open PRs or merge without Shane asking.
- Update CHANGELOG.md and ROADMAP.md in every pass. Record only what was actually run as verified.
- Keep instructions to Shane short and one step at a time, with the exact thing to click or type.
