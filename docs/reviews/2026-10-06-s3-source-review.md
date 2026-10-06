# S3 icon candidate: source review

Status: review notes, written 2026-10-06 by Cloud Claude without access to Shane's PC. Nothing here has been compiled or run. Package 1.0.0.3 is still untested.

This is the source-matrix review that ROADMAP.md puts before S3 validation. It checks the S3 code in `tbUI3/src/Sources` against microsoft-ui-xaml and the Windows SDK. It does not change any code.

Upstream source checked: microsoft-ui-xaml `main` at commit `cd7c7c41`, file `dxaml/xcp/core/core/elements/icon.cpp`. This is the real SymbolIcon implementation, not a design note.

## Verdict

The S3 code is in good shape for a first build. The DirectWrite declarations line up with the real vtables, and the icon table matches WinUI exactly. There are two design points to settle before 1.0.0.3 ships, because both get harder to change once forms have been saved with icons on them.

## What checks out

1. **The glyph table matches WinUI exactly.**
   - WinUI's `CSymbolIcon::ConvertSymbolValueToGlyph` (icon.cpp line 461) maps every Symbol value to the glyph it actually draws.
   - All 197 entries in `UI3Icons.twin` match it. No entries are missing or extra, and the "Fluent" code point is right for every one. This was checked by script, not by eye.
2. **The icon size is right.** `SymbolIconDefaultFontSize = 20` matches `g_ClientCoreFontSize = 20.f` (icon.cpp line 13).
3. **The font weight is right.** SymbolIcon draws with normal weight and normal style, and so does tbUI3.
4. **The vtables are right.**
   - The new `IDWriteTextFormat` slots 3 to 24, the `IDWriteTextLayout` slots up to `GetMetrics`, and `IDWriteFactory.CreateTextLayout` all match the order in dwrite.h.
   - They also match WinDevLib's declarations in `reference-packages`.
   - `DWRITE_TEXT_METRICS` has the right fields in the right order.
5. **The icon properties are honestly labelled.** `Icon`, `IconPosition` and `IconSpacing` are documented as tbUI3 convenience properties, as the fidelity policy requires.

## To settle before 1.0.0.3 ships

### 1. The second "legacy" glyph table is probably unnecessary (inferred, check on the PC)

- **What the spec assumed.** The S3 spec read Microsoft's symbol-enum design note as saying that Segoe MDL2 Assets needs the "legacy" code points (E10B for Accept, for example) and Segoe Fluent Icons needs the new ones (E8FB).
- **What WinUI actually does.**
  - The legacy column is the old Segoe UI Symbol numbering, which is what the Symbol enum's numeric values are.
  - The new E7 to E9 code points are the Segoe MDL2 Assets code points. Segoe Fluent Icons was built to keep them.
  - WinUI itself always draws the new code point and asks for Segoe Fluent Icons only (icon.cpp line 376). It has no MDL2 branch.
- **Why it matters.** On a Windows 10 PC without Segoe Fluent Icons, tbUI3 would currently draw MDL2's old Windows 8 style glyph (E10B), when the matching modern glyph (E8FB) is also in MDL2.
- **Suggested change.** Keep one table, WinUI's own, and still fall back to Segoe MDL2 Assets when Segoe Fluent Icons isn't installed. That is simpler, matches WinUI exactly, and removes half of `UI3Icons.twin`.
- **How sure.** This is inferred from Microsoft's published MDL2 icon list (which lists Accept as E8FB) and from the WinUI source. It is not proven on a machine. One check settles it: on the PC, set `IconFontName` to `Segoe MDL2 Assets` and `IconGlyph` to `ChrW(&HE8FB)`, and see whether a modern check mark appears.

### 2. The `UI3Icon` numbers are not stable yet

- **The problem.**
  - `UI3Icon` numbers the icons 1 to 197 in alphabetical order.
  - A form saves the number, not the name.
  - If Microsoft adds a symbol and the table is regenerated in alphabetical order, every icon after it shifts by one. Saved forms would then quietly show the wrong icon.
- **Suggested change.** Use WinUI's own Symbol values as the enum values (`ui3IconAccept = &HE10B`, and so on), with `ui3IconNone = 0`.
  - These values are fixed by Microsoft and never move.
  - They match the WinUI Symbol enum exactly.
  - `SemanticIconGlyph` becomes a straight lookup of WinUI's table.
- **Timing.** This is free to change now, because no saved form uses icons yet. After release it would be a breaking change.

## Smaller notes (no change needed for the first build)

- `SystemIconFontFamily()` calls `FontFamilyExists` on every paint. It is harmless, but the answer could be cached with the theme snapshot later.
- Text and glyph layout rectangles are exactly as wide as the measured text, and drawing uses `D2D1_DRAW_TEXT_OPTIONS_CLIP`. A glyph that hangs slightly past its advance width could lose a pixel at the edge. Watch for this in the enlarged-button test. If it appears, widen the rectangle or drop the clip flag.
- WinUI turns off text scaling on SymbolIcon (`IsTextScaleFactorEnabled = False`). tbUI3 doesn't scale text at all yet, so nothing differs today. Note it for when text scaling arrives.
- The Segoe MDL2 Assets fallback is a tbUI3 choice for Windows 10, since WinUI names only Segoe Fluent Icons. It should be labelled as a tbUI3 convenience in `docs/controls/UI3Button.md`.

## First build checklist (when the PC is available)

The checklist in HANDOFF.md still applies. Add the single MDL2 check from point 1 above.
