# Full Segoe Fluent icon set (2026-10-14)

Shane asked whether tbUI3's icon list is complete, because the WinUI Gallery shows 1,533 icons and tbUI3 shows 197.

## What each list is

- tbUI3 `Icon` (1.0.0.24) holds WinUI's `Symbol` enum: 197 values, each an old Segoe UI Symbol code point (for example `Target = &HE1D2`) that `UI3Icons.twin` converts to a modern glyph, copied from `icon.cpp` `CSymbolIcon::ConvertSymbolValueToGlyph`. This is what `SymbolIcon` takes in WinUI.
- The Gallery's Iconography page lists the Segoe Fluent Icons font itself, which WinUI uses through `FontIcon.Glyph`. Its data file is `WinUIGallery/Samples/Iconography/IconsData.json`.

## Source data

Shane supplied `WinUIElementToolbox.twinproj` (ChatGPT's WebView2 toolbox). Its `Resources/OTHER/icon-library.b64` is a gzip of JSON that records its own provenance: microsoft/WinUI-Gallery commit `05939cc7d48fc0d7288ff3c89ced86cf1a08eb9d`, file `WinUIGallery/Samples/Iconography/IconsData.json`, SHA-256 `2d3e9f8f…3082b`, with the Gallery's MIT notice. The same archive also holds 21,764 Fluent UI System Icons SVGs (a separate library, not the font) and 112 other assets; those are out of scope.

The 1,533 `segoe` entries are copied to `docs/research/data/segoe-fluent-icons.json` (code, name, `fluentOnly`, tags, plus the source block and MIT notice). Not yet re-checked against the upstream file's hash from here, because the cloud proxy blocks downloads from that repository.

## Findings

- 1,533 glyphs, U+E700 to U+F8CC. Names are unique even case-insensitively and are all valid twinBASIC identifiers (longest 40 characters).
- 127 are marked `fluentOnly`: they are in Segoe Fluent Icons but not Segoe MDL2 Assets, so Windows 10 without the Fluent font would show a missing-glyph box.
- 194 of tbUI3's 197 converted glyphs are in the list. Not in it: `Placeholder` (U+E18A), `StopSlideShow` (U+E620) and `Target` (U+F5F0). `Target` is the blank box Shane saw on 2026-10-07.
- 26 of the 197 have a different name in the Gallery, for example `Find` is `Search`, `Setting` is `Settings`, and both `Favorite` and `OutlineStar` are `FavoriteStar`. Four Symbol names collide with a different Gallery glyph of the same name (`MapPin`, `Page`), so Symbol-name aliases cannot simply be kept alongside the Gallery names.

## Proposal (agreed in principle by Shane, 2026-10-14)

One route, not two. `Icon` keeps its name, but its value becomes the Segoe Fluent glyph code, and `UI3Icon` gets one member per Gallery entry, named after the Gallery name (`ui3IconSearch = &HE721&`). The Symbol conversion table goes. The picker lists the 1,533 entries, searches name, code and tags, and marks or hides glyphs the active font lacks (DirectWrite `GetGlyphIndices` returning 0, with `fluentOnly` as a hint). Saved `Icon` values from earlier builds change meaning; nothing has been released, so test forms are simply re-picked.
