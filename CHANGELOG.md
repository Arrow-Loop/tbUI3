# Changelog

All notable changes to tbUI3. Dates are when the change was made, not released. Nothing has been released yet.

## Unreleased

### 2026-10-06, UI3IconPage icon picker (1.0.0.5 candidate, not built)

- Started from Shane's spike page (commit a5af8a4). `tbUI3/src` was regenerated from his project, because the CLI export needs absolute paths and failed.
- `UI3IconPage` is a PropertyPage, captioned "Icon", that opens from `(Custom)` → `...` on a UI3Button:
  - a search box matches a name, a UI3Icon value in decimal or hex, or the drawn glyph code (`&H`, `0x` and `U+` prefixes are accepted);
  - a scrolling grid draws every icon with the same Direct2D/DirectWrite code as UI3Button, and selecting a cell uses the light Accent button colours;
  - an info line shows the name, the value and the glyph drawn;
  - it opens on the selected button's current icon, and OK or Apply sets `Icon` on every selected button.
- `UI3Icons` gained a catalog (`IconCatalogCount`, `IconCatalogName`, `IconCatalogValue`), because enum names are not available at runtime.
- `[PropertyPage("UI3IconPage")]` moved from the spike's `IconSpacing` back to `Icon`, with a comment explaining why it stays although BETA 997 ignores it.
- The page designer was resized to 460 × 400, and its spike label became `lblInfo`. Shane still has to add `txtSearch` (TextBox), `picGrid` (PictureBox) and `vsbGrid` (VScrollBar) in the designer. Code positions them, so their placement does not matter.
- Package version 1.0.0.5. Patched into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`; every entry matches `tbUI3/src` byte for byte. Not compiled.


### 2026-10-06, property-page picker spike

- Ran on Shane's PC in BETA 997. No code was committed.
- A tbUI3 PropertyPage attached through UserControl `PropertyPages` appears as `(Custom)` → `...` in the Properties pane and opens as a dialog with OK, Cancel and Apply. This works.
- Per-property `[PropertyPage("...")]` links show no `...`, whether the property is an enum (`Icon`) or a Single (`IconSpacing`). The IDE does not honour them yet.
- Details are in `docs/research/2026-10-06-property-page-picker.md`. ROADMAP.md is updated with the chosen route.


### 2026-10-06, tbUI3Test synced

- Shane committed his local tbUI3Test (dropped UI3FormTheme, tbUI3 1.0.0.4) as commit 7c20660.
- The CLI export in that step did not refresh `tbUI3Test/src`, so the mirror was regenerated from the committed `.twinproj`. Every entry matches byte for byte, and the embedded tbUI3 package matches `tbUI3/src`.
- frmMain still contains the two MDL2 test lines in `Form_Activate`.


### 2026-10-06, S3 icons validated; 1.0.0.4 Caption fix

- Shane built 1.0.0.3 in twinBASIC BETA 997 with 0 errors and 0 warnings, then imported it into his local tbUI3Test.
- Validated on his PC (Windows 11, dark mode), by screenshot:
  - semantic icons render at design time and at runtime, on the Standard and Accent styles (tested with `ui3IconSort`, saved as 57716 = `&HE174`, WinUI's Sort value, which drew the Sort glyph);
  - icon left and icon top, with an enlarged button;
  - icon-only, which centres in the button;
  - the MDL2 check: `IconGlyph = ChrW(&HE8FB&)` with `IconFontName = "Segoe MDL2 Assets"` draws a modern check mark, which confirms that the single-table decision was right;
  - win64: the app runs under the Win64 compiler and the icon draws.
- Found and fixed (1.0.0.4; Shane built it and confirmed the fix in win32 and win64 the same evening):
  - Caption could not be cleared in the designer. It reverted to "Button" because "Button" was also the saved default, so an empty caption was not kept.
  - The saved default is now an empty string, and a newly dropped button still starts as "Button".
  - Side effect: a form saved before this change with the untouched caption "Button" will now load with an empty caption. No known form is affected.
- Found, not fixed: the designer keeps the old accent colour after a Windows accent change until the IDE restarts. Runtime updates live.
- Package version 1.0.0.4. Patched `UI3Button.twin`, `Settings` and the package CHANGELOG into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`. Every entry matches `tbUI3/src` byte for byte.
- Recorded Shane's designer requests in ROADMAP.md: a themed form canvas at design time, a designer accent refresh, and `...` visual catalog pickers. Added research notes for the picker in `docs/research/2026-10-06-property-page-picker.md`.


### 2026-10-06, S3 icons use WinUI's Symbol values and one glyph table

- Shane approved both points from the S3 source review.
- `UI3Icon` values are now WinUI's own Symbol enum values (`ui3IconAccept = &HE10B&` and so on), with `ui3IconNone = 0`. Microsoft never renumbers these, so a form that saves an icon stays correct when new symbols are added. The old alphabetical 1 to 197 numbering is gone. No saved forms used it, because 1.0.0.3 was never built.
- `UI3Icons.SemanticIconGlyph` now holds a single table copied from WinUI's `CSymbolIcon::ConvertSymbolValueToGlyph` (microsoft-ui-xaml `cd7c7c41`, `dxaml/xcp/core/core/elements/icon.cpp`). The second "legacy" table is removed. A value outside the table is drawn as itself, as WinUI does. The function no longer takes a font name.
- Font selection is unchanged: Segoe Fluent Icons when installed, otherwise Segoe MDL2 Assets.
- Checked by script: all 197 enum values and glyphs match WinUI's table, and the enum values are unique. Patched the three sources and the package CHANGELOG into `tbUI3/tbUI3.twinproj` with `tools/twinproj-edit.mjs`; every entry in the project matches `tbUI3/src` byte for byte.
- Not compiled or run. Package 1.0.0.3 still needs its first IDE build. That build should include the MDL2 check from the review, which confirms that the Windows 10 font has the modern code points.
- Marked the S3 spec's "dual mapping" rule as superseded, and updated HANDOFF.md, ROADMAP.md and `docs/controls/UI3Button.md` to match.


### 2026-10-06, S3 source review and handoff tidy-up (no code changes)

- Reviewed the 1.0.0.3 S3 icon code against microsoft-ui-xaml `main` (`cd7c7c41`, `dxaml/xcp/core/core/elements/icon.cpp`) and dwrite.h. Notes are in `docs/reviews/2026-10-06-s3-source-review.md`. Nothing was compiled or run; 1.0.0.3 remains untested.
- Checked by script: all 197 Fluent code points in `UI3Icons.twin` match WinUI's `CSymbolIcon::ConvertSymbolValueToGlyph`, with none missing or extra. The 20-DIP icon size matches `g_ClientCoreFontSize`.
- Checked by reading: the new `IDWriteTextFormat`, `IDWriteTextLayout` and `IDWriteFactory.CreateTextLayout` vtable slots and `DWRITE_TEXT_METRICS` match dwrite.h and WinDevLib.
- Raised two points to settle before 1.0.0.3 ships: the second "legacy" glyph table is probably unnecessary (inferred, one PC check settles it), and the `UI3Icon` numbers should become WinUI's fixed Symbol values so saved forms stay correct.
- Updated the UI3Button fidelity matrix: it now cites the glyph mapping source and labels the MDL2 fallback as a tbUI3 convenience.
- Made HANDOFF.md and ROADMAP.md agree on the next step (build and test 1.0.0.3), and added syncing Shane's local tbUI3Test and deciding where `reference-packages/` lives to the roadmap.
- Removed `tbUI3Test/tbUI3Test.twinproj.bak-20261006-000844`. It was byte-identical to the project at commit c6ba137, so git history already keeps it. `.gitignore` now ignores `*.bak-*`.


### 2026-10-06, control fidelity policy

- Added `docs/CONTROL_FIDELITY_POLICY.md` as the authoritative rule that tbUI3 reproduces control-specific WinUI XAML/resources/behavior rather than generic Fluent approximations.
- Defined source priority: control-specific microsoft-ui-xaml theme resources/templates first, then implementation source, WinUI Gallery, official API documentation, and only then general Fluent guidance for explicitly labeled convenience behavior.
- Required per-control source matrices covering padding, dimensions, typography, brushes/resource chains, visual states, transitions, focus, compact sizing, high contrast, orientation and interaction behavior.
- Clarified that collapsing hundreds of WinUI variants into a smaller toolbox does not relax fidelity; every mapped variant still follows its own WinUI control/style definition.
- Reclassified UI3Button's S3 `Icon`, `IconGlyph`, `IconFontName`, `IconPosition`, and `IconSpacing` as tbUI3 convenience abstractions over WinUI Button.Content rather than native WinUI Button properties.
- Corrected the documentation for the 8-DIP `IconSpacing` default: it comes from general WinUI Gallery spacing guidance and is not a Button-specific XAML value.
- Added a Button fidelity/source matrix and moved S3's next gate from immediate compiler validation to a source-matrix review before validation.


### 2026-10-06, S3 icon implementation candidate

- Bumped the package source to 1.0.0.3 and added the first S3 implementation candidate.
- Generated a 197-entry `UI3Icon` semantic enum from Microsoft's current Symbol table and a private dual-code-point mapping for Segoe Fluent Icons and legacy Segoe MDL2 Assets.
- Added `UI3IconPosition` (Left/Top/Right/Bottom) and UI3Button properties `Icon`, `IconGlyph`, `IconFontName`, `IconPosition`, and `IconSpacing`.
- Added installed-font selection: semantic icons prefer Segoe Fluent Icons and fall back to Segoe MDL2 Assets. Raw `IconGlyph` can optionally specify a custom `IconFontName`.
- Extended the private DirectWrite layer with the minimum `IDWriteTextLayout` / metrics surface needed to measure caption and glyph runs, then center icon+text as one content block instead of using guessed offsets.
- UI3Button now supports text-only, icon-only, and icon+Caption composition in Left/Top/Right/Bottom positions while preserving the existing Standard/Accent S2 chrome.
- Icon size is 20 DIPs, matching WinUI's SymbolIcon/IconElement core default. Default icon-caption spacing is 8 DIPs, matching WinUI Gallery's documented spacing between adjacent controls / control and label.
- The S3 candidate is packed into the canonical `tbUI3/tbUI3.twinproj`, but has **not** yet been compiled or run in BETA 997.
- tbUI3Test was intentionally not repacked in this pass because Shane's local designer copy now contains the validated drop-on UI3FormTheme placement. Sync that local form before replacing the repository test harness.


### 2026-10-06, UI3FormTheme milestone complete

- Shane removed the manual `UI3Window.Attach/Detach` calls from tbUI3Test, dropped `UI3FormTheme` from the toolbox onto frmMain, and repeated the same runtime validation set successfully.
- The drop-on nonvisual component path therefore matches the code-based Attach/Detach behavior for the tested harness: normal startup, UI3Button Click, live Windows accent updates, live light/dark switching, and clean debugger-stop teardown all pass.
- This completes the current form-theme baseline milestone. `UI3FormTheme`, cached theme/accent state, live notifications, rounded corners, form background management and child redraw are now validated as a usable package feature.
- The next implementation milestone is S3 icon support as specified in `docs/2026-10-06-s3-icon-spec.md`.


### 2026-10-06, win64 live-engine validation

- Shane repeated the full 1.0.0.2 live-engine test set in win64.
- The win64 harness runs normally, UI3Button Click remains functional, live Windows accent changes repaint correctly, live light-to-dark switching updates correctly, and debugger-stop teardown returns cleanly to the IDE.
- The code-based `UI3Window.Attach/Detach` path is now validated in both win32 and win64 for the current form-theme milestone.
- Remaining validation for the milestone: the drop-on nonvisual `UI3FormTheme` component path.


### 2026-10-06, debugger-stop teardown validation

- Shane stopped the running win32 tbUI3Test session from inside the twinBASIC IDE while the subclassed form was still open.
- twinBASIC returned normally to the debugger, reported that it was waiting for remaining forms to close, completed teardown, and cleared global variables.
- No IDE crash or hang occurred. This validates the tested win32 subclass/window-destruction cleanup path, including the current `WM_NCDESTROY` removal behavior.
- Remaining form-theme validation: win64 live-engine run/stop and the drop-on UI3FormTheme path.


### 2026-10-06, live accent and theme switching validation

- Shane confirmed that changing the Windows accent colour while tbUI3Test is already running updates the Accent UI3Button immediately and correctly; no app restart or manual re-attachment is required.
- Shane also confirmed live Windows light-to-dark theme switching works correctly while tbUI3Test is running.
- This validates the live `WM_SETTINGCHANGE` / DWM/theme refresh path at runtime for the tested win32 harness, including theme-cache refresh and child redraw behavior.
- Light mode is now runtime-observed as part of the successful live light-to-dark transition; a separate exhaustive light-theme visual pass is no longer required for the current milestone.
- Remaining form-theme validation: debugger-stop safety, win64 live-engine run/stop, and the drop-on UI3FormTheme path.


### 2026-10-06, 1.0.0.2 runtime baseline

- Shane confirmed that the 1.0.0.2 tbUI3 package builds cleanly in twinBASIC BETA 997 and imports into tbUI3Test without issues.
- Shane then ran the updated tbUI3Test harness successfully with the new `UI3Window.Attach Me` path active.
- UI3Button Click still raises the Hello World message box under the new live-theme attachment path.
- This validates the normal runtime baseline for the new form-theme engine. Live accent/theme message handling, debugger-stop safety, the drop-on UI3FormTheme path and light mode remain separate checks.


### 2026-10-06, repository handoff cleanup

- Updated the README with the actual 1.0.0.2 development state, authoritative full-control inventory and prepared S3 icon specification.
- Generalized the immutable COM/designer ID rule now that a second public control exists; both UI3Button and UI3FormTheme have checked-in ID records.
- Updated the handoff's button-family example to include the newly confirmed WinUI Subtle variant and linked the prepared S3 spec.


### 2026-10-06, S3 icon specification

- Added `docs/2026-10-06-s3-icon-spec.md` so icon work can start immediately after the form-theme compile checkpoint without reopening API/design questions.
- Verified from Microsoft's current Symbol specification that many semantic icons use different code points in Segoe Fluent Icons versus legacy Segoe MDL2 Assets. S3 therefore requires dual glyph mappings rather than merely swapping font names.
- Specified installed-font-only fallback: Segoe Fluent Icons → Segoe MDL2 Assets for icons and Segoe UI Variable Text → Segoe UI for normal text.
- Specified a shared semantic icon property plus a raw-glyph escape hatch, and DirectWrite measurement for centered icon+text composition.
- Corrected the full control inventory to include WinUI's current SubtleButtonStyle as a UI3Button family variant alongside Standard and Accent.
- Kept S3 implementation behind the 1.0.0.2 form-theme compile/runtime checkpoint to avoid stacking unvalidated native code.


### 2026-10-06, UI3FormTheme implementation candidate

- Shane confirmed the existing UI3Window dark-mode harness looks identical at runtime in win64 and that UI3Button Click still raises the Hello World message box. The win64 runtime/Click check is passed.
- Light mode remains intentionally untested for now at Shane's request; it is deferred rather than marked validated.
- Added cached theme/accent state to UI3Theme and package-wide `UI3ThemeMode` System/Light/Dark override support.
- Added `UI3Window.Attach` / `Detach`, pointer-width-safe comctl32 subclassing, live `WM_SETTINGCHANGE` / `WM_DWMCOLORIZATIONCOLORCHANGED` / `WM_THEMECHANGED` refresh, `WM_NCDESTROY` cleanup, rounded-window-corner application and forced child redraw after form-theme changes.
- Added the nonvisual drop-on `UI3FormTheme` control with `ThemeMode` and `ManageBackColor` property persistence.
- Updated tbUI3Test source to use `UI3Window.Attach Me` and detach on Form_Unload so the next run exercises the live engine rather than activation-time one-shot refresh.
- Bumped the package source version to 1.0.0.2.
- Added `THIRD-PARTY-NOTICES.md` documenting microsoft-ui-xaml, WinDevLib, WinRT and VBCCR18 provenance used by the current implementation.
- Static-audited the candidate against the current official twinBASIC documentation: `Form_Unload(Cancel As Integer)` is a documented form signature; `InvisibleAtRuntime` is explicitly supported for host-side service controls; and `UserControl_Show` is the documented run-view lifecycle event. UI3FormTheme now retries attachment on Show/UserMode changes instead of attempting it from Initialize.
- Hardened `UI3Window.Attach` so it retains a Form reference only after `SetWindowSubclass` succeeds; if subclass installation fails, the theme is applied once without leaving an attachment that has no destruction callback.
- Byte-verified the final 1.0.0.2 packed package against its loose mirror: all 8 source/control-descriptor files plus Settings match exactly.
- Byte-verified tbUI3Test: its packed frmMain and Settings match the loose mirrors, and all 12 files in its embedded tbUI3 package match the canonical tbUI3 package exactly.
- This is structural/source synchronization evidence only; the new 1.0.0.2 form-theme code still needs IDE compiler/runtime validation.


### 2026-10-06, full control inventory

- Added `docs/CONTROL_INVENTORY.md` as the authoritative coverage plan for the complete practical WinUI 3 control surface.
- Reconciled the plan against WinUI Gallery `main` commit `b927a6253d6b183be55b90287b8a04fde14d31a3`: 125 catalog pages total, 110 normal pages, 15 fundamentals/design/accessibility pages, and 86 directly control-like pages by current metadata.
- Made Claude's D6 family rule explicit: related WinUI classes and documented variants are exposed through one coherent VB-style toolbox control with `Style`, `Mode`, `Presentation` or focused properties rather than hundreds of toolbox entries.
- Added a complete Gallery coverage ledger mapping every current non-special Gallery page to a tbUI3 toolbox family, code-created surface, shared engine, platform adapter or deliberately non-control helper category.
- Recorded the package-wide rule that the hundreds of state/style/sample variants are coverage requirements even though the public toolbox remains much smaller.


### 2026-10-06, UI3Window win32 dark-mode visual validation

- Shane ran the current tbUI3Test harness in twinBASIC BETA 997, win32, with Windows in dark mode.
- Runtime screenshot confirms the native title bar is dark and the form client background is exactly #202020.
- The Accent UI3Button remains readable and renders with #FF8279 fill, matching the expected Accent Light2 shade for Shane's current Windows accent palette.
- The screenshot also shows the Windows 11 rounded outer window corners.
- This visual run validates the dark-mode UI3Window baseline in win32. It does not by itself revalidate Click behavior, live theme switching, light mode, or the running win64 window.


### 2026-10-06, reference package source audit conclusions

- Audited the loose sources from the validated BETA 997 reference package laboratory and recycled the reusable findings into `Arrow-Loop/twinBASIC-Knowledge` commit `8c54824`.
- Corrected the earlier WinRT assumption: WinRT 1.7.0.159 defines `UIColorType` accent values but does not expose `UISettings`, `IUISettings`, `GetColorValue`, or `ColorValuesChanged`. tbUI3 therefore keeps its current registry/DWM accent path for now; any future supported UISettings path will require a minimal locally adapted and validated declaration set or a later package version that actually implements it.
- Selected the pointer-width-safe comctl32 `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` pattern independently present in WinRT and VBCCR18 as the implementation reference for UI3FormTheme live notifications. TBMANLIB 1.0.29.0's current subclass helper uses legacy `GetWindowLongW` / `SetWindowLongW` with `Long` pointers and will not be used as the win64-capable model.
- Identified VBCCR18 as strong prior art for later UserControl lifecycle, focus/keyboard, Default/Cancel, ambient-property, and persistence work; TwinTimerLib for later timer/animation plumbing; AutoCompleteLib for a future native-Edit-backed text control; and WinDevLib/WinDevLibImpl/OLEGuids as declaration/COM donors.
- Confirmed GdiPlus remains reference-only. Direct2D/DirectWrite remains tbUI3's rendering architecture.


### 2026-10-06, reference package laboratory

- Added `reference-packages/ReferencePackages.twinproj`, a dedicated package-archeology project containing the selected TWINSERV packages used to study implementation patterns without making them tbUI3 dependencies.
- Repaired WinDevLibImpl's missing embedded WinDevLib dependency by placing the exact WinDevLib 9.5.742 payload under `Packages/WinDevLibImpl/Packages/WinDevLib`, matching WinDevLibImpl's own local-package reference.
- Shane confirmed the repaired reference project runs in twinBASIC BETA 997.
- The validated snapshot contains WinRT 1.7.0.159, WinDevLib 9.5.742.0, WinDevLibImpl 1.4.41.742, TBMANLIB and selected TBMAN companions, TwinTimerLib 1.0.0.7, VBCCR18 1.8.0.125, AutoCompleteLib 1.0.0.3, OLEGuids 1.0.0.10, and GdiPlus 0.9.0.45.
- Documented the architectural rule that these packages are reference/source donors only. tbUI3 stays self-contained; permissively licensed implementation fragments may be selectively adapted and attributed rather than introducing package dependencies.

### 2026-10-06, form theme baseline (built, not yet run)

- Added `docs/2026-10-06-form-theme-spec.md`. It specifies a dark or light title bar that follows Windows, the WinUI window background, live theme switching, a drop-on `UI3FormTheme` control, and `UI3Window.Attach`.
- Added the public module `UI3Window` (commit f660d83), adapted from the Knowledge repo's `native-theme-reference.twin`:
  - `UI3ApplyWindowTheme` sets the form's title bar to match Windows dark or light mode, without forcing caption colours, and sets the form background to #202020 (dark) or #F3F3F3 (light).
  - Helpers `UI3IsDarkMode`, `UI3AccentColor` and `UI3WindowBackColor`, and a new `UI3AccentShade` enum.
  - The package version is now 1.0.0.1. The package builds in the IDE. It has not been run.
- Not yet built from the spec: the drop-on `UI3FormTheme` control, live switching through subclassing, and the cached theme.
- UI3Button's AmbientChanged check is now case-insensitive for "BackColor". Whether this fixes the repaint bug from the S2 checks is untested.
- Commit 94b621b repaired tbUI3Test's imported tbUI3 1.0.0.1 reference, refreshed its embedded package, and added `UI3ApplyWindowTheme Me` in Form_Load and Form_Activate. That repaired harness has not yet been visually/runtime validated by Shane, so UI3Window remains recorded as built but not run.

### 2026-10-06, spike S2 remaining checks

- Checked on Shane's PC (dark mode), with a temporary second UI3Button and a temporary form BackColor of #202020. Both were discarded afterwards and not saved.
- Resizing: a 260 x 80 px button keeps its 4 px corners, its border and a centred caption, at design time and at runtime.
- Standard style on the dark #202020 backdrop: a subtle lighter fill with white caption text, as in WinUI DefaultButtonStyle. Judged by eye; pixel colours were not measured.
- Standard style on the default light-grey form: the white caption is nearly invisible. This is expected: the dark-theme fills assume a dark backdrop, which is why S5 makes the test form dark.
- win64: after switching the IDE target to win64, the designer (now hosted by the 64-bit compiler) draws both buttons correctly, and a 64-bit run starts with no errors in the debug console. The running 64-bit window itself was not inspected.
- Bug found: after the form's BackColor changed, the win32 designer kept painting the controls over the old light-grey background until the compiler restarted. (Correction: UI3Button does handle `UserControl_AmbientChanged`, so the cause is still open.)
- Not checked: light mode (that needs Shane's Windows theme to be switched).

### 2026-10-06, spike S2 first run (win32)

- Built tbUI3 in the IDE (BETA 997, win32) and re-imported the package into tbUI3Test. The saved test project and its `src/` export are committed.
- Validated on Shane's PC (dark mode, accent #FF4343), win32 only:
  - Design time: UI3Button1 draws with rounded corners and the accent fill, with black caption text, instead of the S1 grey placeholder.
  - Runtime: the same rendering, and clicking the button still raises Click (the "Hello World" message box appeared).
- Not yet checked: 64-bit, resizing the control, Standard style, and light mode.
- Re-importing a package with the same name fails with "'tbUI3' conflicts with an existing imported package". Remove the old `[IMPORTED] tbUI3` reference first.

### 2026-10-06, repository set up

- The project moved to its own private repository, Arrow-Loop/tbUI3. Shane's PC created it with the S1 projects and plain-text exports in `src/`.
- Added the design notes in `docs/`, the `.twinproj` tools in `tools/`, `AGENTS.md`, and this CHANGELOG and ROADMAP.
- Arrow-Loop/WinUI3-twinBASIC is unchanged. It remains the archive of the June 2026 attempt.

### 2026-10-06, spike S2 (written, not yet built or run)

- UI3Button now draws through Direct2D and DirectWrite instead of GDI. It binds an `ID2D1DCRenderTarget` to the paint DC on every `UserControl_Paint`.
- It draws the rest state of WinUI's DefaultButtonStyle and AccentButtonStyle:
  - a 4 px rounded shape;
  - the 1 px elevation border gradient;
  - the WinUI fill and text colours for light and dark;
  - the caption in Segoe UI Variable Text 14 px (falls back to Segoe UI), with ButtonPadding 11,5,11,6.
- Values are taken from microsoft-ui-xaml at commit 8318c5bf (2026-10-05).
- New private module `UI3Direct2D.twin` holds:
  - the minimum Direct2D and DirectWrite interface declarations, adapted from fafalone's WinDevLib (CC0), with placeholder slots for unused vtable entries;
  - the shared factories;
  - small drawing helpers.
- New private module `UI3Theme.twin`:
  - Reads dark mode from `AppsUseLightTheme`.
  - Reads the accent palette from the `AccentPalette` registry value, then falls back to `DwmGetColorizationColor`, then to the default blue.
  - Holds the WinUI colour, radius, border and padding tokens, each with its source.
- If Direct2D fails, the button prints `D2D error &H...` instead of drawing, so a failed spike run shows the code.
- Tool: `tools/build-sources.mjs` replaces a project's Sources folder and leaves every other entry byte-identical.

### 2026-10-06, spike S1 (passed)

- Created the tbUI3 package project from the IDE's "Sample 7. Package" template.
- Added a placeholder UI3Button UserControl with Caption, Style and Click, and the UI3ButtonStyle enum.
- Created tbUI3Test from the twinBASIC-Knowledge seed.
- Shane checked all of this in the BETA 997 IDE:
  - the package built;
  - UI3Button appeared in the toolbox of tbUI3Test and dropped onto the form as UI3Button1;
  - Caption and Style persisted through a save;
  - Click ran at runtime.
