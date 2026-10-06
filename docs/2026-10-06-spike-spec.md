# tbUI3 Spike A: one UI3Button, UserControl plus Direct2D and DirectWrite

Status: spec only, nothing run yet. Written 2026-10-06.

## Decisions this spike builds on

- tbUI3 is a twinBASIC package of UserControls that sit on ordinary VB Forms, like VBCCR. CustomControls is dropped as the primary route because it only hosts on WaynesForm (see the first-pass report).
- All control drawing goes through Direct2D, and all text through DirectWrite. There is no GDI+.
- The COM interface declarations are a private subset copied into tbUI3, with credit, from fafalone's WinDevLib. WinDevLib is CC0 (public domain), so this keeps "no dependencies" without hand-writing every vtable. Nothing from it is Public.

## The one technical bet this spike must settle

A windowless, transparent UserControl has no window of its own. It paints into its container's device context during `UserControl_Paint`. So Direct2D has to draw through an `ID2D1DCRenderTarget` bound to `UserControl.hDC` (`BindDC`, `BeginDraw`, draw, `EndDraw`), not through an `ID2D1HwndRenderTarget`. The questions are:

1. Does this work in the form designer as well as at runtime?
2. Do anti-aliased edges blend correctly over whatever is behind the control?
3. Over a Mica form, which is the hardest case, does the result keep its alpha? A GDI device context traditionally does not.

If (3) fails, the fallback is a windowed control with a per-control `ID2D1HwndRenderTarget` and a solid background matched to the form, or a form-level Direct2D surface. That is a design question to revisit with evidence. It is not a reason to change the toolbox approach.

## Who does what (follows the twinBASIC-Knowledge GitHub-first workflow)

The repo is Arrow-Loop/WinUI3-twinBASIC. The June material moves to `docs/history/` with a "superseded" note. The authoritative files are the `.twinproj` files, with loose `Sources/` review mirrors that the agent regenerates and byte-checks (`.twinmirror.json` and the manifest). `.gitattributes` uses `*.twin text eol=crlf`, `Settings text eol=crlf`, `*.twinproj binary` and `*.twinpack binary`, and `.gitignore` contains `Build/`.

There are two projects:

- **The `tbUI3` package.** The Knowledge seed is a Standard EXE, so the package needs its own IDE-created starting point. Shane creates a blank Package project in the IDE once, saves it into the repo and pushes it. That file then becomes the package seed. The alternative is the IDE-shipped "Sample 7. Package" template, which is IDE-created but carries a placeholder project ID and sample sources.
- **`tbUI3Test`, a Standard EXE.** It is derived from `tB_Template.twinproj` following the seed standard (fresh project ID and FormDesignerId, new name, description and title).

Claude writes the spike source: the UI3Button UserControl, a private Direct2D and DirectWrite declarations module, the thin drawing layer (`FillRoundRect`, `DrawBorder`, `DrawText`, `DrawGlyph`), a small theme module whose values cite their WinUI resource, and a form helper. The form helper adapts the Knowledge repo's validated PacketPilot theme code (`native-theme-reference.twin`: dark title bar, round corners, system backdrop) rather than the untested sample in the handoff. Claude packs everything into the `.twinproj` files, regenerates the mirrors and pushes to a development branch. Shane pulls in GitHub Desktop, opens the projects in the IDE, confirms there's no deserialization warning, runs each step and reports back with screenshots where asked.

Tooling caveat, verified 2026-10-06: an `impexp` export followed by an import of the seed keeps every file's content (once `.meta`, which export drops, is put back), but it re-sorts entries alphabetically, so the bytes differ from the original. The IDE's own shipped templates use several different entry orders, which suggests the order doesn't matter, but that is not proven. The first-open check is what settles it.

## Steps

Record each result as PASS, FAIL or PARTIAL with a note.

**S0. Environment.** Record the twinBASIC build (Help, About), the Windows version and build, and the DPI of each monitor. Expected: BETA 997 or later, Windows 11 22H2 or later for the Mica steps.

**S1. Package and toolbox, with no Direct2D yet.** This separates packaging problems from drawing problems.
1. In the IDE, create a new Package project named `tbUI3` (start from "Sample 7. Package" if a blank package template isn't offered) and import `UI3Button` with a plain-colour placeholder paint.
2. Build the `.twinpack`.
3. Create a new Standard EXE from the IDE. Reference only the `tbUI3` package.
4. Check that UI3Button appears in the toolbox with its icon, can be drawn, resized, selected and deleted, shows Caption and Style in the property sheet, and that Caption persists after save, close and reopen.
5. Check that the instance is named `UI3Button1`.

**S2. Direct2D shape, design time and runtime.** Swap the placeholder paint for a 4 px rounded rectangle with a 1 px border, drawn through `ID2D1DCRenderTarget`. It must render live in the designer, at runtime, and while resizing in the designer. Build and run once as 32-bit and once as 64-bit.

**S3. DirectWrite text and glyphs.** The caption is drawn in `Segoe UI Variable Text` at 14 px. A second test button shows the checkmark glyph U+E73E in `Segoe Fluent Icons`. On a machine without those fonts (Windows 10, or by forcing the fallback with a test flag), check that `Segoe UI` and `Segoe MDL2 Assets` are used instead. Take one screenshot of each.

**S4. Windowless and transparent.** Set `Windowless = True` and `BackStyle = Transparent`. Place the button over a form with a gradient picture behind it. Check that the rounded corners blend into the picture, with no square or black corners, and that clicks in the transparent corners fall through to the form.

**S5. Mica.** Call the Mica helper in `Form_Load`. Test the plain form first, then the black `BackColor` trick, then swallowing `WM_ERASEBKGND`. For each, record how the UI3Button looks, and how a classic Label and TextBox look on the same form. Test light and dark.

**S6. DPI.** Run at 100 % and 150 %. Move the running form between monitors with different scaling. Check that the corner radius, border and text scale, and that nothing blurs.

**S7. Fidelity.** The Standard style in rest, hover, pressed and disabled states, light and dark, uses values Claude takes from Microsoft's `Button_themeresources.xaml` and `Common_themeresources_any.xaml`. Take screenshots beside the WinUI Gallery Button page at 100 % and 150 %. Claude overlays them and lists the differences.

**S8. Behaviour.** Check hover and pressed states, the Click event, Tab order, the focus rectangle, Space and Enter activation, `Default` and `Cancel` behaviour on a form, and the disabled state.

**S9. Coexistence.** In the S1 consumer project, also reference WinDevLib and a GDI+ package. The project must compile with no name clashes, which proves the declarations are truly private.

## Decision table (fill in after the run)

| Question | Result | Notes |
| --- | --- | --- |
| Toolbox via package (S1) | | |
| Live design-time Direct2D (S2) | | |
| 32-bit and 64-bit (S2) | | |
| Font family and glyphs (S3) | | |
| Transparent edges (S4) | | |
| Mica (S5) | | |
| DPI (S6) | | |
| Fidelity vs Gallery (S7) | | |
| Keyboard and focus (S8) | | |
| No name clashes (S9) | | |

## Known exception to "everything Direct2D"

When UI3TextBox arrives, the plan is still to host a real Win32 Edit control for caret, IME, clipboard and accessibility, with Direct2D drawing only the frame. The Edit draws its own text with GDI. That is deliberate and should be written into the charter as the one exception.
