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

## Fidelity/source matrix

`UI3Button` is governed by `../CONTROL_FIDELITY_POLICY.md`.

| Area | WinUI source | Current tbUI3 status |
| --- | --- | --- |
| Button padding | `Button_themeresources.xaml` → `ButtonPadding = 11,5,11,6` | exact source-derived token |
| Border thickness | `ButtonBorderThemeThickness = 1` | exact source-derived token |
| Corner radius | Button template → `ControlCornerRadius` | exact referenced shared resource |
| Font family | Button template → `ContentControlThemeFontFamily` | implemented through DirectWrite family selection |
| Font size | Button template → `ControlContentThemeFontSize` | current 14-DIP implementation derived from WinUI resources |
| Font weight | Button template → Normal | exact |
| Background/foreground/border | Button-specific resource keys and theme dictionaries | source-derived rest-state implementation |
| Accent style | `AccentButtonStyle` / Accent Button resources | source-derived rest-state implementation |
| Subtle style | `SubtleButtonStyle` resources | planned, not implemented yet |
| PointerOver/Pressed/Disabled | Button `CommonStates` VisualStateGroup | planned S7, not implemented yet |
| Focus visual | `UseSystemFocusVisuals`, `FocusVisualMargin=-3` | planned S8 |
| Semantic icon glyph mapping | microsoft-ui-xaml Symbol table | source-derived dual Fluent/MDL2 mapping |
| Semantic SymbolIcon size | microsoft-ui-xaml IconElement/SymbolIcon core, 20 DIPs | source-derived |
| `Icon` / `IconGlyph` / `IconFontName` | no Button-specific WinUI property; stands in for arbitrary `Button.Content` | **tbUI3 convenience API** |
| `IconPosition` | no Button-specific WinUI property | **tbUI3 convenience API** |
| `IconSpacing` | no Button-specific WinUI value | **tbUI3 convenience API**; current default 8 DIPs from general Gallery spacing guidance, not Button XAML |

The convenience properties above must not be described as native WinUI Button properties/defaults. They exist only to make common XAML content composition practical from the twinBASIC property grid.

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

The default `IconSpacing` is currently 8 DIPs. This is **not** a WinUI Button specification. WinUI Button content is arbitrary XAML and defines no single icon gap; 8 DIPs is a tbUI3 convenience default borrowed from general WinUI Gallery spacing guidance.

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
