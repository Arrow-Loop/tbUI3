# tbUI3 first pass: what changes the handoff

Read-only pass, 2026-10-06. Sources: the handoff notes from the chat (2026-10-05), Arrow-Loop/WinUI3-twinBASIC (the June attempt, last commit 3e221b5), Arrow-Loop/twinBASIC-Knowledge (commit 9cbdbf9), the official twinbasic/documentation repo (as of 2026-10-04), and the twinBASIC BETA 997 release ZIP. BETA 997 is the newest release tag on twinbasic/twinbasic. I unpacked its built-in packages and samples with the official `impexp.mjs` tool and read the source. Nothing was compiled or run, and no repository was changed.

## 1. CustomControls only work on a WaynesForm (this changes the plan)

The handoff says CustomControls are the leading candidate. The evidence says they can't deliver the core goal, which is dropping controls onto an ordinary twinBASIC form next to the classic VB controls.

- The official WaynesForm reference says: "Within the current release of the package every form created with the designer is hard-coded to use **WaynesForm** as its root class; other base form classes are planned but not yet supported." A WaynesForm replaces the VB `Form`. It is an owner-drawn surface, not a Win32 form with controls on top.
- The same page says WaynesForm "supports modal display only". `Show vbModeless` only writes a debug message.
- All 10 forms in the shipped "Sample 6. CustomControls" project (BETA 997) are WaynesForms, and none of them contains a VB control.
- The VB Forms package (`VB` 0.0.0.31) has no reference to the CustomControls framework.
- The CustomControls packages are unchanged between BETA 983 and BETA 997 (designer 0.0.0.24, controls package 0.0.0.5). Its published changelog stops in January 2022. "Planned but not yet supported" has not moved.

In practice, a tbUI3 built on CustomControls would only appear on a separate, modal-only kind of form. It could not mix with TextBox, ListBox or VBCCR controls, and it would carry the "experimental" and private-internals risks already noted in the handoff.

The UserControl route, by contrast, has hard evidence that it works the way you want:

- The IDE ships a "Standard EXE (plus VBCCR v1.8)" template. It references Krool's VBCCR as a package containing 35 UserControls (`.tbcontrol`) that sit on ordinary VB Forms and appear in the toolbox. So "a package of controls that shows up in the toolbox of a project that only references the package" is already proven for UserControls, without OCX registration.
- The twinBASIC `UserControl` (VB package, `CONTROLS/STANDARD/UserControl.twin`) has VB6's `Windowless`, `BackStyle` (transparent) and `HitBehavior`, and implements `IOleInPlaceObjectWindowless` and `IViewObjectEx`. So transparent, windowless self-drawn controls are at least supported on paper.

Recommendation: make "a package of UserControls on ordinary VB Forms" the primary route. Spike A then becomes "one UI3Button UserControl in a package". The open question moves from "which framework" to "which drawing backend inside the UserControl": GDI+ shapes plus GDI text (cheapest), or Direct2D and DirectWrite (best text and alpha, more declarations). The thin internal drawing layer from the handoff makes that a backend swap rather than a rewrite.

## 2. Font family is confirmed missing from CustomControls

Handoff open question 1 is now answered from source. In BETA 997, `CustomControlsPackage/Sources/zTemporarySupport.twin` defines `Private Class FontStyle` with exactly `Size`, `Weight`, `Underline`, `Italic` and `Strikeout`. There is no family or name. The text is rendered natively by the runtime canvas (`<runtimeuicanvas>`) from that descriptor, so a field can't simply be added from outside. One docs page even says weight availability "depends on which faces are installed for the chosen font family", but nothing lets you choose one. This is a second, independent reason against CustomControls for tbUI3.

## 3. Keyboard and focus support does exist in CustomControls (moot if route 1 is taken)

Handoff open question 5: `ElementDescriptor` in BETA 997 has `OnGotFocus`, `OnLostFocus`, `OnKeyDown`, `OnKeyUp`, `OnKeyPress`, `ElementTabIndex`, `ElementTabStop` and a `CaretPosition`, and `WaynesButton` uses them. The tutorial's "keyboard coming soon" text is stale.

## 4. The Knowledge repo no longer mandates WebView2

Decision D13 assumed the Knowledge repo's AGENTS.md forces HTML/WebView2 UI. It doesn't any more. AGENTS.md says "WebView2 is optional, not mandatory" and lists native controls, Win32, custom rendering and others as legitimate. The decision itself (tbUI3 gets its own AGENTS.md, and Knowledge is reference only) still stands. The reason for it is just milder now.

## 5. Knowledge repo conventions tbUI3 should adopt

These are not in the handoff and should go into the charter or AGENTS.md:

- **The `.twinproj` is canonical.** Loose `.twin` and `.tbform` files in Git are generated review mirrors (`.twinmirror.json` plus a manifest), refreshed by the agent, never hand-maintained by you.
- **Start new projects from the IDE-created seed** (`reference/twinbasic-seeds/tB_Template.twinproj`) with fresh project and form GUIDs. A synthesized `.twinproj` failed IDE deserialization once already. A package project would need its own IDE-created seed, since the template is a Standard EXE.
- **`.gitattributes`:** `*.twinproj binary` and `*.twinpack binary`. Line-ending conversion corrupts them.
- **CRLF only for `.twin` and exported `Settings`.** `.tbform` is single-line JSON. Don't enforce EOL on anything else. This refines your general CRLF rule rather than conflicting with it.
- **`Option Explicit` is set at project level.** Don't add it per module. The June modules put it inside each module.
- **`Build/` is in `.gitignore`.**
- **Packed projects can be unpacked with the official `impexp` tool.** In practice, I can read and diff `.twinproj` and `.twinpack` files from here, including twinBASIC's own built-in packages. That's how sections 1 to 3 were verified.

## 6. One conflict to resolve in tbUI3's favour

`UI_WINUI_DESIGN_STANDARD.md` in the Knowledge repo suggests radii of "about 6 to 8 px" for controls and "10 to 12 px" for floating surfaces, with Segoe UI as the default face. That is general team guidance shaped by the WebView2 apps. WinUI's own values are about 4 px and 8 px with Segoe UI Variable. For tbUI3, the microsoft-ui-xaml resources win (decision D7), and the charter should say so explicitly so a future session doesn't "correct" the theme module toward the Knowledge standard.

## 7. The June attempt: what to keep and what to avoid

What it was: a twinBASIC ActiveX Control project (`WinUI3_TB`) with a `WUI_` prefix and GDI+ drawing. It got as far as four foundation modules (enums, Win32 declares, GDI+ helpers, theme), with clean diagnostics on BETA 983 by your report. No control was ever built or run.

Lessons worth keeping:

- `.twin` source needs an explicit `Module ... End Module` (or `Class`) container. Loose VB6 `.bas`-style content gives TB5182 errors everywhere (Pass02 to Pass03).
- `SetWindowLongPtr` has no `...PtrA` export on 32-bit, so 32-bit needs the `SetWindowLong` alias.
- The planned TextBox approach (a Fluent-drawn frame around a real Win32 Edit at runtime, with a mock-up painted at design time) matches handoff 5.6. It is still the right plan.
- The `WUI_FormHelper.Attach Me` idea is a good shape for the form-level helper: one line that subclasses the form for theme, DPI and setting changes, the dark title bar, rounded corners and optional Mica.

Things not to carry forward:

- **Invented theme values.** `modWinUI3Theme.WUI_BuildBaseTokens` makes up its colours, for example "FillColorPrimary = 70 % white blended over RGB(243,243,243)". None of them cites a WinUI resource. This is the "vibes" problem decision D8 exists to stop.
- **Public declarations.** `modWin32` exposes about 96 `Public Declare` statements plus public constants, which is exactly the cross-package name collision decision D11 forbids.
- **Registered OCX distribution.** It targeted ActiveX OCX registration. The VBCCR template shows the package route is simpler for consumers.
- **`.gitattributes` with `* text=auto`.** The `.twin` files are LF in the repo, so whether they arrive as CRLF depends on each machine's Git settings. That conflicts with the CRLF rule for `.twin`.

## 8. Smaller notes

- The Knowledge repo's evidence build is BETA 983, but the newest release is BETA 997. Record which build you actually run in the charter, because twinBASIC changes quickly.
- Microsoft's WinUI Gallery and the microsoft-ui-xaml theme files were not read in this pass. They come in when the theme token table is built.
- The handoff's Appendix B skeleton matches the real attribute syntax (`[CustomControl("/miscellaneous/frmButton.png")]`, `[ClassId(...)]`, `[COMCreatable(False)]`). That only matters if CustomControls is kept as a secondary experiment.

## What this changes in the handoff's next steps

1. Spike A becomes a UserControl-in-a-package button on an ordinary form. It tests toolbox from package, live design-time paint, `Windowless` with `BackStyle` transparent over Mica, and Segoe UI Variable text plus a Segoe Fluent Icons glyph.
2. Spike B becomes the drawing-backend comparison inside that same UserControl: GDI+ with GDI text, against Direct2D with DirectWrite.
3. CustomControls drops to "watch for WaynesForm limits lifting", recorded in ROADMAP as exploratory.
