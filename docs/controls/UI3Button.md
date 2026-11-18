# UI3Button

Status: S3 icons validated in package 1.0.0.3 (win32 and win64, 2026-10-06); 1.0.0.4 Caption fix validated in win32 and win64. Package 1.0.0.73 adds the WinUI visual states, the Subtle style, the keyboard focus visual and ButtonBase input behaviour; it is **not yet built or tested in twinBASIC**. Package 1.0.0.74 adds the appearance properties (fonts, padding, content alignment, corner radius, border thickness, background sizing, brushes); also not yet built. Package 1.0.0.75 adds `Destructive` (a tbUI3 extension), the focus visual properties and `RequestedTheme`; also not yet built.

## WinUI family

UI3Button is one twinBASIC toolbox family for the WinUI button family. The long-term Style surface covers Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit, Command and CommandToggle variants rather than creating separate toolbox controls.

Currently implemented and validated before S3:

- Standard rest-state chrome;
- Accent rest-state chrome;
- Direct2D/DirectWrite rendering;
- light/dark/system-accent integration;
- Click;
- win32/win64.

S3 adds icon content, validated on 2026-10-06.

## Fidelity/source matrix

`UI3Button` is governed by `../CONTROL_FIDELITY_POLICY.md`.

| Area | WinUI source | Current tbUI3 status |
| --- | --- | --- |
| Button padding | `Button_themeresources.xaml` → `ButtonPadding = 11,5,11,6` | exact source-derived default of the `Padding` property (1.0.0.74), inside BorderThickness |
| Border thickness | `ButtonBorderThemeThickness = 1` | exact source-derived token |
| Corner radius | Button template → `ControlCornerRadius` | exact referenced shared resource |
| Font family | Button template → `ContentControlThemeFontFamily` | implemented through DirectWrite family selection |
| Font size | Button template → `ControlContentThemeFontSize` | current 14-DIP implementation derived from WinUI resources |
| Font weight | Button template → Normal | exact |
| Background/foreground/border | Button-specific resource keys and theme dictionaries | source-derived rest-state implementation |
| Accent style | `AccentButtonStyle` / Accent Button resources | source-derived rest-state implementation |
| Subtle style | `SubtleButtonStyle` resources | source-derived, all four states (1.0.0.73) |
| PointerOver/Pressed/Disabled | Button `CommonStates` VisualStateGroup in each style | source-derived (1.0.0.73); see the state table below |
| State priority | `Button::ChangeVisualState` (`Button_Partial.cpp`) | exact: Disabled, Pressed, PointerOver, Normal |
| State transition | `ContentPresenter.BackgroundTransition` `BrushTransition Duration=0:0:0.083` | **not implemented**: states switch instantly (roadmap) |
| Focus visual | `UseSystemFocusVisuals`, `FocusVisualMargin=-3`, `FocusRectManager.cpp` | colours and 2 + 1 DIP rings exact; **placed inside the button** instead of 3 DIPs outside (deviation below) |
| Pointer and keyboard input | `ButtonBase_Partial.cpp` | ClickMode, press/drag-off/release, Space/Enter, lost focus, capture loss (1.0.0.73) |
| High contrast | `HighContrast` theme dictionary | not implemented (roadmap) |
| Semantic icon glyph mapping | microsoft-ui-xaml `icon.cpp` `CSymbolIcon::ConvertSymbolValueToGlyph` | exact copy of WinUI's table, one table for both fonts (checked by script 2026-10-06; see `../reviews/2026-10-06-s3-source-review.md`) |
| Icon font | `icon.cpp`: SymbolIcon uses Segoe Fluent Icons only | Segoe Fluent Icons; the Segoe MDL2 Assets fallback for Windows 10 is a **tbUI3 convenience** |
| Semantic SymbolIcon size | microsoft-ui-xaml IconElement/SymbolIcon core, 20 DIPs | source-derived |
| `Icon` / `IconGlyph` / `IconFontName` | no Button-specific WinUI property; stands in for arbitrary `Button.Content` | **tbUI3 convenience API** |
| `IconPosition` | no Button-specific WinUI property | **tbUI3 convenience API** |
| `IconSpacing` | no Button-specific WinUI value | **tbUI3 convenience API**; current default 8 DIPs from general Gallery spacing guidance, not Button XAML |

The convenience properties above must not be described as native WinUI Button properties/defaults. They exist only to make common XAML content composition practical from the twinBASIC property grid.

## Visual states (1.0.0.73)

Source: microsoft-ui-xaml commit 8318c5bf, `controls/dev/CommonStyles/Button_themeresources.xaml` (state to resource key) and `Common_themeresources_any.xaml` (resource key to colour). Tokens live in `UI3Theme.twin`; `tests/button-states.test.mjs` pins them.

| Style | State | Background | Foreground | Border |
| --- | --- | --- | --- | --- |
| Standard | Normal | ControlFillColorDefault | TextFillColorPrimary | ControlElevationBorderBrush |
| Standard | PointerOver | ControlFillColorSecondary | TextFillColorPrimary | ControlElevationBorderBrush |
| Standard | Pressed | ControlFillColorTertiary | TextFillColorSecondary | ControlStrokeColorDefault |
| Standard | Disabled | ControlFillColorDisabled | TextFillColorDisabled | ControlStrokeColorDefault |
| Accent | Normal | AccentFillColorDefault (SystemAccentColorLight2 dark, Dark1 light) | TextOnAccentFillColorPrimary | AccentControlElevationBorderBrush |
| Accent | PointerOver | AccentFillColorSecondary (same colour, Opacity 0.9) | TextOnAccentFillColorPrimary | AccentControlElevationBorderBrush |
| Accent | Pressed | AccentFillColorTertiary (Opacity 0.8) | TextOnAccentFillColorSecondary | ControlFillColorTransparent |
| Accent | Disabled | AccentFillColorDisabled | TextOnAccentFillColorDisabled | ControlFillColorTransparent |
| Subtle | Normal | SubtleFillColorTransparent | TextFillColorPrimary | SubtleFillColorTransparent |
| Subtle | PointerOver | SubtleFillColorSecondary | TextFillColorPrimary | SubtleFillColorSecondary |
| Subtle | Pressed | SubtleFillColorTertiary | TextFillColorSecondary | SubtleFillColorTertiary |
| Subtle | Disabled | SubtleFillColorTransparent | TextFillColorDisabled | SubtleFillColorTransparent |

BackgroundSizing: Standard and Subtle are InnerBorderEdge (fill inside the 1-DIP border); Accent is OuterBorderEdge (fill under the border). Brush opacity 0.9 and 0.8 is applied as alpha 230 and 204.

PointerOver is tracked by `UI3Surface` (the whole button is one hit part) and is only shown at run time. Disabled shows in the designer too when `Enabled` is False.

## Input behaviour (1.0.0.73)

Source: `dxaml/xcp/dxaml/lib/ButtonBase_Partial.cpp` and `Button_Partial.cpp`.

- `ClickMode = Release` (default): a left press takes focus (pointer focus, no focus visual), captures the pointer and shows Pressed. Moving off the button shows Normal and moving back shows Pressed again. Click is raised on release only if the pointer is still over the button.
- `ClickMode = Press`: Click is raised on the press.
- `ClickMode = Hover`: presses are ignored; the button shows Pressed and raises Click when the pointer enters, and returns to Normal when it leaves.
- Space or Enter while focused: Pressed on key down, Click on key up (Press mode: Click on key down). Key repeat does not click again. The `ButtonBase_Partial.cpp` comment confirms Enter follows ClickMode; the key-processing header itself (`ButtonBaseKeyProcess.h`) was not retrieved, so Space handling and Hover buttons ignoring keys are the standard WinUI behaviour as understood, not line-checked.
- Losing focus, being disabled, a ClickMode change, or capture taken away while the button is still held all end the press without a Click.
- twinBASIC additions with no WinUI equivalent on Button: the form's `Default` button clicks on Enter and its `Cancel` button on Esc (VB `DefaultCancel`), and `AccessKey` clicks on Alt+key. An Enter already being handled through KeyDown/KeyUp is not clicked a second time. WinUI's access key tips (the letters shown when Alt is pressed) are not drawn.

## Focus visual deviation

WinUI draws the system focus visual outside the button: `FocusVisualMargin = -3` grows the bounds by 3 DIPs, then a 2-DIP `FocusStrokeColorOuter` ring with a 1-DIP `FocusStrokeColorInner` ring inside it (`FocusVisualPrimaryThickness`/`SecondaryThickness` defaults), corner radius ControlCornerRadius + 3 (`FocusRectManager.cpp` `AdjustCornerRadius`). A twinBASIC UserControl can only draw inside its own window, so those rings would be invisible. tbUI3 draws the same two rings, same colours and thicknesses, inside the button's edge (outer ring flush with the edge, radius following ControlCornerRadius), on top of the border. This is a known, documented difference. Since 1.0.0.75 the `FocusVisual*` properties change the colours and widths, and `FocusVisualMargin` moves the rings inward by (margin + 3) DIPs; a margin of -3 or less keeps them on the edge, because nothing can be drawn further out. A focus adorner window that draws outside the control is listed in ROADMAP as an option.

The visual shows only for keyboard focus: focus that arrives while Tab or Alt is held. A click focuses the button without it, and a click on a button already showing it hides it, as WinUI's FocusState Pointer does. Programmatic `SetFocus` shows no visual.

## WinUI Button property coverage

Implemented as WinUI properties (same name and meaning): `Enabled` (IsEnabled), `ClickMode`, `UseSystemFocusVisuals`, `AccessKey`, `IsPressed` and `IsPointerOver` (read-only, run time), and `Style` choosing DefaultButtonStyle, AccentButtonStyle or SubtleButtonStyle. `Caption` stands in for string `Content`.

Provided by the twinBASIC extender rather than the control: `Visible` (Visibility), `TabStop` (IsTabStop), `TabIndex`, `ToolTipText` (ToolTipService.ToolTip), `Tag`, `Left`/`Top`/`Width`/`Height`, `Name`, `Default`/`Cancel`.

Appearance properties (1.0.0.74), same names and defaults as WinUI's DefaultButtonStyle:

| Property | Default (source) | Notes |
| --- | --- | --- |
| `FontFamily` | empty = ContentControlThemeFontFamily | Segoe UI Variable Text, Segoe UI on Windows 10; DirectWrite falls back for a missing font |
| `FontSize` | 14 (ControlContentThemeFontSize) | DIPs |
| `FontWeight` | 400 Normal | `UI3FontWeight` names WinUI's FontWeights; any 1 to 999 |
| `FontStyle` | Normal | Normal, Oblique, Italic |
| `FontStretch` | Normal | UltraCondensed to UltraExpanded; WinUI's Undefined is refused (DirectWrite cannot use it) |
| `Padding` | `11,5,11,6` (ButtonPadding) | XAML Thickness text: one, two or four values; content sits inside BorderThickness plus Padding, as in the ContentPresenter |
| `HorizontalContentAlignment` | Center (Button's starting value, per the Control.HorizontalContentAlignment docs) | Stretch draws as Left, as a stretched TextBlock left-aligns its text |
| `VerticalContentAlignment` | Center | Stretch draws as Top |
| `CornerRadius` | 4 (ControlCornerRadius) | **uniform only**: WinUI's per-corner CornerRadius is not supported yet; the focus rings follow it |
| `BorderThickness` | 1 (ButtonBorderThemeThickness) | **uniform only**; 0 draws no border |
| `BackgroundSizing` | FromStyle | `ui3BackgroundSizingFromStyle` (-1) is a **tbUI3 convenience** meaning the Style's setter (Inner for Standard and Subtle, Outer for Accent); InnerBorderEdge and OuterBorderEdge are WinUI's values |
| `Background`, `Foreground`, `BorderBrush` | `ui3ThemeBrush` (-1) = the Style's theme resource | OLE colours, so opaque only. As in WinUI they show only in the Normal state, because the template's PointerOver, Pressed and Disabled states set the ContentPresenter's brushes directly |

Focus and theme properties (1.0.0.75), WinUI names and defaults:

| Property | Default (source) | Notes |
| --- | --- | --- |
| `FocusVisualPrimaryBrush`, `FocusVisualSecondaryBrush` | `ui3ThemeBrush` (-1) = FocusStrokeColorOuter / FocusStrokeColorInner | OLE colours, opaque only |
| `FocusVisualPrimaryThickness`, `FocusVisualSecondaryThickness` | 2 and 1 (FocusRectManager defaults) | **uniform only**; 0 hides that ring |
| `FocusVisualMargin` | -3 (Button styles) | **uniform only**; see the focus visual deviation above |
| `RequestedTheme` | `ui3ThemeSystem` = ElementTheme.Default | Light or Dark for this button only; same numbering as ElementTheme |

tbUI3 extension, not part of WinUI (1.0.0.75):

| Property | Default | Notes |
| --- | --- | --- |
| `Destructive` | False | From the tbUI3 CSS library's `button--danger`. The caption and icon use SystemFillColorCritical (#C42B1C light, #FF99A4 dark) at rest and on hover; pressed and disabled keep WinUI's colours. Ignored on Accent, where red text on the accent fill would be unreadable. A `Foreground` you set still wins at rest |

Before 1.0.0.74 the padding was measured from the button's outer edge, 1 DIP short of WinUI's ContentPresenter. Centred content is unaffected; left, right, top and bottom alignment now match WinUI.

Not applicable in twinBASIC, so not exposed:

- `Command`, `CommandParameter`: ICommand is a XAML data-binding/MVVM type. Click is the VB route.
- `Flyout`, `ContextFlyout`: need tbUI3 flyout/menu controls, which don't exist yet. Revisit with a future UI3Flyout.
- `ContentTemplate`, `ContentTemplateSelector`, `ContentTransitions`, `Template`, `Style` (as a XAML Style object), `Resources`, `DataContext`: XAML templating, resources and binding have no twinBASIC counterpart.
- `KeyboardAccelerators`: a form-level shortcut (Ctrl+S and so on) belongs to the form's KeyPreview or menus in twinBASIC.
- `Margin`, `HorizontalAlignment`, `VerticalAlignment`, `MinWidth`/`MaxWidth`/`MinHeight`/`MaxHeight`: layout-panel concepts. A twinBASIC form places controls absolutely with Left/Top/Width/Height.
- `FlowDirection`: right-to-left layout is not supported by tbUI3 yet (roadmap).
- `ElementSoundMode`: XAML's ElementSoundPlayer has no twinBASIC equivalent.
- `IsFocusEngagementEnabled`, `RequiresPointer`, `XYFocus*`: Xbox/gamepad focus navigation.
- `Opacity`, `Translation`, `Rotation`, `Scale`, `CenterPoint`, `Shadow`, composition and animation properties: a Win32 child window cannot be composited this way.
- `AllowDrop`, `CanDrag` and the drag events: twinBASIC's OLE drag-and-drop properties would be the route; out of Button scope.

Deferred, with reasons (on the roadmap, not ruled out):

- `AutomationProperties.Name`, `HelpText` and the rest of UI Automation: a screen reader needs a real accessibility provider (MSAA or UIA) behind the control window. That provider should be shared by every tbUI3 control, so it is its own pass rather than a Button property. Until then a screen reader sees the button's window without a name.
- `AllowFocusOnInteraction`: twinBASIC moves focus to a control when it is clicked, before the control's code runs. Refusing that focus means handing it back afterwards, which fires LostFocus/GotFocus on both controls. It needs an IDE test before it is offered.
- `IsTextScaleFactorEnabled`: Windows' Text size setting should scale every tbUI3 control's text together, or a form's layout breaks. It belongs in a library-wide accessibility pass, not one control.
- `CharacterSpacing`: needs IDWriteTextLayout1, which the private Direct2D declarations do not cover yet.
- High-contrast resources, the 83 ms BrushTransition, and access key tips on Alt.
- Pointer, key, focus and manipulation events other than Click: the extender supplies GotFocus/LostFocus; MouseDown/MouseUp/MouseMove/KeyDown/KeyUp/KeyPress events are on the roadmap.

## Current properties

- `Caption As String`
- `Style As UI3ButtonStyle`
- `Icon As UI3Icon`
- `IconGlyph As String`
- `IconFontName As String`
- `IconPosition As UI3IconPosition`
- `IconSpacing As Single`
- `IconSize As Single`, `IconKey As String`, `IconList`, `IconData`/`IconSource` (icon library)
- `Enabled As Boolean`, `ClickMode As UI3ClickMode`, `UseSystemFocusVisuals As Boolean`, `AccessKey As String` (1.0.0.73)
- `IsPressed As Boolean`, `IsPointerOver As Boolean` (read-only, 1.0.0.73)
- `FontFamily`, `FontSize`, `FontWeight`, `FontStyle`, `FontStretch`, `Padding`, `HorizontalContentAlignment`, `VerticalContentAlignment`, `CornerRadius`, `BorderThickness`, `BackgroundSizing`, `Background`, `Foreground`, `BorderBrush` (1.0.0.74)
- `FocusVisualPrimaryBrush`, `FocusVisualSecondaryBrush`, `FocusVisualPrimaryThickness`, `FocusVisualSecondaryThickness`, `FocusVisualMargin`, `RequestedTheme`, and the tbUI3 extension `Destructive` (1.0.0.75)

`IconGlyph` overrides the semantic `Icon`. `IconFontName` applies to the raw-glyph path; semantic icons deliberately use tbUI3's system-font selection so their Fluent/MDL2 code-point mapping remains portable.

## S3 icon source

The `UI3Icon` enum contains WinUI's 197 Symbol values, copied from microsoft-ui-xaml `dxaml/xcp/core/core/elements/icon.cpp` (commit cd7c7c41). The values match WinUI's Symbol enum and never get renumbered. `UI3Icons.SemanticIconGlyph` converts each one to the modern glyph WinUI draws, using WinUI's own `ConvertSymbolValueToGlyph` table. Segoe Fluent Icons and Segoe MDL2 Assets share those code points, so one table serves both fonts.

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

- Toggle/Repeat/Hyperlink/DropDown/Split behavior (Subtle, states, focus and Default/Cancel arrived in 1.0.0.73);
- UI Automation completion;
- BitmapIcon/ImageIcon/PathIcon/AnimatedIcon objects.

Those remain separate roadmap work.
