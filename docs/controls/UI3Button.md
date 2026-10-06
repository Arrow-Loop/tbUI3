# UI3Button

Status: S3 candidate in package 1.0.0.3.

## WinUI family

UI3Button is one twinBASIC toolbox family for the WinUI button family. The long-term Style surface covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit, Command and CommandToggle variants rather than creating separate toolbox controls.

Currently implemented and validated before S3:

- Standard rest-state chrome;
- Accent rest-state chrome;
- Direct2D/DirectWrite rendering;
- light/dark/system-accent integration;
- Click;
- win32/win64.

Current S3 candidate adds icon content; it is not yet validated.

## Current properties

- `Caption As String`
- `Style As UI3ButtonStyle`
- `Icon As UI3Icon`
- `IconGlyph As String`
- `IconFontName As String`
- `IconPosition As UI3IconPosition`
- `IconSpacing As Single`

`IconGlyph` overrides the semantic `Icon`. `IconFontName` applies to the raw-glyph path; semantic icons deliberately use tbUI3's system-font selection so their Fluent/MDL2 code-point mapping remains portable.

## S3 icon source

The `UI3Icon` enum contains 197 semantic symbols generated from microsoft-ui-xaml's current Symbol table. Each semantic ID has both the legacy Segoe MDL2 Assets code point and the newer Segoe Fluent Icons code point.

Font selection:

1. Segoe Fluent Icons when installed;
2. Segoe MDL2 Assets otherwise.

The WinUI SymbolIcon/IconElement core default font size is 20 DIPs. tbUI3 uses that value.

The default `IconSpacing` is 8 DIPs. WinUI Button content itself is arbitrary XAML, so there is no single Button-specific icon gap to clone; 8 DIPs comes from WinUI Gallery's spacing guidance for adjacent controls / control+label.

## S3 layout

DirectWrite `IDWriteTextLayout` metrics are used for both glyph and caption. The combined block is centered as a unit.

Supported positions in the candidate:

- Left
- Top
- Right
- Bottom

Supported compositions:

- text only;
- icon only;
- icon + text.

## Not yet part of S3

- Subtle/Toggle/Repeat/Hyperlink/DropDown/Split behavior;
- hover/pressed/disabled states;
- focus/default/cancel behavior;
- UI Automation completion;
- BitmapIcon/ImageIcon/PathIcon/AnimatedIcon objects.

Those remain separate roadmap work.
