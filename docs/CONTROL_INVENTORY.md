# tbUI3 control surface inventory

Status: authoritative coverage plan. Last upstream inventory refresh: 2026-10-06.

## Contract

tbUI3 is intended to reproduce the practical WinUI 3 / Windows 11 control surface for ordinary twinBASIC forms without turning the twinBASIC toolbox into a copy of every individual WinUI class, style, sample and state.

The rule is:

> **One toolbox control represents one coherent VB-style control family. WinUI classes, visual styles and documented variants within that family are selected with properties such as Style, Mode, Presentation, Behavior or other focused attributes.**

This is the finalized form of the early Claude decision recorded as D6 in the historical handoff. For example, the toolbox gets one `UI3Button`; it does not get separate Button, AccentButton, ToggleButton, RepeatButton, HyperlinkButton, DropDownButton, SplitButton, ToggleSplitButton, AppBarButton and AppBarToggleButton entries.

The package target is broad WinUI coverage, including the hundreds of visual/behavior/sample variants exposed by Microsoft documentation and WinUI Gallery. The number of *toolbox* entries stays deliberately much smaller.

## Upstream baseline

The inventory was reconciled against Microsoft WinUI Gallery `main` commit `b927a6253d6b183be55b90287b8a04fde14d31a3` (2026-10-05), specifically:

- `WinUIGallery/SampleSupport/Data/ControlInfoData.json`
- the individual Gallery sample pages;
- Microsoft's Windows controls/design documentation;
- microsoft-ui-xaml theme-resource files for actual visual values.

That Gallery catalog currently contains:

- **125 catalog pages total**;
- **110 normal Gallery pages**;
- **15 Fundamentals / Design / Accessibility guidance pages**;
- **86 pages that are directly control-like** by current namespace/base-class metadata.

The exact count of individual samples and property combinations changes as Microsoft updates Gallery. tbUI3 therefore tracks coverage by Microsoft control/concept plus documented variants, not by promising a frozen numeric count.

## Toolbox families

These are the intended public designer/toolbox families. The exact public enum/property names may still be refined before the first release, but the family boundaries are the plan of record.

| tbUI3 toolbox control | WinUI classes/concepts represented | Variant strategy |
| --- | --- | --- |
| `UI3Button` | Button, ToggleButton, RepeatButton, HyperlinkButton, DropDownButton, SplitButton, ToggleSplitButton, AppBarButton, AppBarToggleButton | `Style` selects Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit, Command and CommandToggle; icon/text/flyout/default behavior are properties |
| `UI3CheckBox` | CheckBox | two-state / three-state, checked / unchecked / indeterminate, content and alignment properties |
| `UI3OptionButton` | RadioButton | VB-compatible radio/option behavior with group/container semantics |
| `UI3ToggleSwitch` | ToggleSwitch | on/off content, compact/content variants |
| `UI3TextBox` | TextBox, PasswordBox, NumberBox, AutoSuggestBox | `Mode` selects Text, Password, Number or AutoSuggest; multiline, reveal, spin-button, suggestion and validation behavior are properties |
| `UI3RichTextBox` | RichEditBox | rich editing, selection and formatting behavior; native text-editing/accessibility path rather than a painted fake editor |
| `UI3ComboBox` | ComboBox | editable/non-editable and selection/content variants |
| `UI3Slider` | Slider | horizontal/vertical, stepped/continuous, ticks/header/value presentation |
| `UI3Rating` | RatingControl | editable/read-only, item count, custom glyph/item presentation |
| `UI3ColorPicker` | ColorPicker | spectrum/slider/channel/alpha presentation options |
| `UI3DateTimePicker` | CalendarDatePicker, CalendarView, DatePicker, TimePicker | `Mode` selects popup calendar, inline calendar, date fields or time fields |
| `UI3Progress` | ProgressBar, ProgressRing | `Style` Bar/Ring; determinate/indeterminate plus paused/error states where WinUI defines them |
| `UI3ListView` | ListView, GridView, ItemsView, FlipView, ItemsRepeater, PullToRefresh, SwipeControl | `Presentation` and behavior properties select list/grid/items/carousel layouts, selection, grouping, virtualization, refresh and swipe actions |
| `UI3TreeView` | TreeView | single/multiple selection, node/item source, expand/collapse and drag behavior |
| `UI3TableView` | TableView | column/table presentation and selection/edit behavior |
| `UI3Pager` | PagerControl, PipsPager | numeric/button and pips presentations |
| `UI3ScrollView` | ScrollView, ScrollViewer, AnnotatedScrollBar, SemanticZoom, ParallaxView | scrolling mode, zoom, annotation and optional parallax/semantic behaviors |
| `UI3Panel` | Canvas, Grid, StackPanel, RelativePanel, LayoutPanel, WrapPanel, VariableSizedWrapGrid | `Layout` selects the layout algorithm; spacing/alignment/row/column/relative rules are properties/collections |
| `UI3Frame` | Border, Expander, SplitView, Viewbox, SystemBackdropElement | `Style` selects border/container, expandable, split-pane, scaled-view or backdrop-container behavior |
| `UI3TabControl` | TabView, Pivot, SelectorBar | `Style` selects document tabs, pivot or compact selector presentation |
| `UI3NavigationView` | NavigationView | left/top, pane display modes, compact/expanded, hierarchy and footer behavior |
| `UI3Breadcrumb` | BreadcrumbBar | breadcrumb items, overflow and separators |
| `UI3CommandBar` | CommandBar, MenuBar, AppBarSeparator, StandardUICommand, XamlUICommand | toolbar/menu presentation; command buttons use `UI3Button` command styles; command objects remain code-created |
| `UI3InfoBar` | InfoBar, InfoBadge | `Style` Bar/Badge plus severity, icon, close/action and numeric/dot badge variants |
| `UI3Label` | TextBlock, RichTextBlock | plain/rich display modes, wrapping, trimming, selection/link/content options where applicable |
| `UI3Image` | Image, PersonPicture, IconElement, AnimatedIcon, AnimatedVisualPlayer | `Style` selects bitmap/image, person/avatar, system icon or animated visual; source/presence/glyph properties specialize it |
| `UI3Media` | MediaPlayerElement, Capture Element / Camera Preview, Sound | playback/camera/audio host modes; implementation may use native Windows media APIs rather than self-drawing media |
| `UI3Ink` | InkCanvas, InkToolbar | inking surface plus tool configuration |
| `UI3Map` | MapControl | map host; requires a viable Windows mapping/data path before implementation |
| `UI3Shape` | Shape, Line and common Rectangle/Ellipse/Path-style primitives | `Shape`/geometry property selects primitive; stroke/fill/radius/geometry properties |
| `UI3TitleBar` | TitleBar, AppWindowTitleBar visual behavior | custom client title-bar content when a project wants more than the normal DWM title bar |
| `UI3FormTheme` | Window theme/backdrop integration | nonvisual designer component; System/Light/Dark mode, form background management, live theme/accent notifications |

That is roughly thirty toolbox-visible families rather than hundreds of entries. Specialized hosts such as media, ink and map may ultimately be moved to an optional companion package if their platform/runtime requirements conflict with tbUI3's dependency-free core contract; they remain coverage targets unless that decision is explicitly made.

## Code-created surfaces and helpers

Some WinUI concepts are naturally objects/services rather than things a developer should drag from the toolbox.

| Planned tbUI3 API | WinUI equivalents / coverage |
| --- | --- |
| `UI3ContentDialog` | ContentDialog |
| `UI3Flyout` | Flyout; `Style` covers standard/menu/command-bar flyout behavior where practical |
| `UI3TeachingTip` | TeachingTip |
| `UI3ToolTip` / per-control ToolTip property | ToolTip |
| `UI3Popup` | Popup |
| `UI3Command` | XamlUICommand / StandardUICommand style command abstraction |
| `UI3Window` | attach/detach, title-bar theme, rounded corners, theme propagation, later backdrop integration |
| `UI3Backdrop` or window properties | Mica, Mica Alt, Desktop Acrylic Base/Thin, AcrylicBrush/SystemBackdrops |
| shared animation engine | Connected Animation, easing functions, implicit/page/theme transitions |
| shared theme/drawing primitives | resources, colors, geometry, spacing, typography, compact sizing, brushes, gradients and shadows |

## Gallery coverage ledger

Every current non-special Gallery page is accounted for below. “Family/property” means the WinUI concept is intentionally folded into the named tbUI3 family rather than getting its own toolbox entry.

### Menus & toolbars

- AppBarButton → `UI3Button.Style=Command`
- AppBarSeparator → `UI3CommandBar` separator item
- AppBarToggleButton → `UI3Button.Style=CommandToggle`
- CommandBar → `UI3CommandBar`
- CommandBarFlyout → `UI3Flyout.Style=CommandBar`
- MenuBar → `UI3CommandBar.Style=MenuBar`
- MenuFlyout → `UI3Flyout.Style=Menu`
- SwipeControl → `UI3ListView` swipe-actions behavior
- StandardUICommand → `UI3Command`
- XamlUICommand → `UI3Command`

### Collections

- FlipView → `UI3ListView.Presentation=Carousel`
- GridView → `UI3ListView.Presentation=Grid`
- ItemsRepeater → `UI3ListView.Presentation=Items`
- ItemsView → `UI3ListView.Presentation=ItemsView`
- ListView → `UI3ListView.Presentation=List`
- PullToRefresh → `UI3ListView.PullToRefresh`
- TableView → `UI3TableView`
- TreeView → `UI3TreeView`

### Date & time

- CalendarDatePicker → `UI3DateTimePicker.Mode=CalendarDropDown`
- CalendarView → `UI3DateTimePicker.Mode=Calendar`
- DatePicker → `UI3DateTimePicker.Mode=Date`
- TimePicker → `UI3DateTimePicker.Mode=Time`

### Basic input

- Button → `UI3Button.Style=Standard/Accent/Subtle`
- DropDownButton → `UI3Button.Style=DropDown`
- HyperlinkButton → `UI3Button.Style=Hyperlink`
- RepeatButton → `UI3Button.Style=Repeat`
- ToggleButton → `UI3Button.Style=Toggle`
- SplitButton → `UI3Button.Style=Split`
- ToggleSplitButton → `UI3Button.Style=ToggleSplit`
- CheckBox → `UI3CheckBox`
- ColorPicker → `UI3ColorPicker`
- ComboBox → `UI3ComboBox`
- RadioButton → `UI3OptionButton`
- RatingControl → `UI3Rating`
- Slider → `UI3Slider`
- ToggleSwitch → `UI3ToggleSwitch`

### Status & info

- InfoBadge → `UI3InfoBar.Style=Badge`
- InfoBar → `UI3InfoBar.Style=Bar`
- ProgressBar → `UI3Progress.Style=Bar`
- ProgressRing → `UI3Progress.Style=Ring`
- ToolTip → `UI3ToolTip` / per-control ToolTip property

### Dialogs & flyouts

- ContentDialog → `UI3ContentDialog`
- Flyout → `UI3Flyout`
- Popup → `UI3Popup`
- TeachingTip → `UI3TeachingTip`

### Scrolling

- AnnotatedScrollBar → `UI3ScrollView` annotation mode
- PipsPager → `UI3Pager.Style=Pips`
- PagerControl → `UI3Pager.Style=Pages`
- ScrollView → `UI3ScrollView`
- ScrollViewer → `UI3ScrollView` compatibility mode
- SemanticZoom → `UI3ScrollView` / collection semantic-zoom behavior

### Layout

- Border → `UI3Frame.Style=Border`
- Canvas → `UI3Panel.Layout=Canvas`
- Expander → `UI3Frame.Style=Expander`
- Grid → `UI3Panel.Layout=Grid`
- LayoutPanel → `UI3Panel.Layout=Custom`
- RelativePanel → `UI3Panel.Layout=Relative`
- SplitView → `UI3Frame.Style=SplitView`
- StackPanel → `UI3Panel.Layout=Stack`
- VariableSizedWrapGrid → `UI3Panel.Layout=VariableWrap`
- WrapPanel → `UI3Panel.Layout=Wrap`
- Viewbox → `UI3Frame.Style=Viewbox`

### Navigation

- BreadcrumbBar → `UI3Breadcrumb`
- NavigationView → `UI3NavigationView`
- Pivot → `UI3TabControl.Style=Pivot`
- SelectorBar → `UI3TabControl.Style=Selector`
- TabView → `UI3TabControl.Style=Tabs`

### Media

- AnimatedVisualPlayer → `UI3Image.Style=AnimatedVisual`
- Capture Element / Camera Preview → `UI3Media.Mode=Camera`
- Image → `UI3Image.Style=Image`
- InkCanvas / InkToolbar → `UI3Ink`
- MapControl → `UI3Map`
- MediaPlayerElement → `UI3Media.Mode=Player`
- PersonPicture → `UI3Image.Style=Person`
- Sound → `UI3Media.Mode=Audio` / nonvisual audio helper
- WebView2 → integration/adaptor target only; do not make the core tbUI3 package depend on the separate WebView2 package

### Styles

- AcrylicBrush → shared brush/backdrop engine, not a toolbox entry
- AnimatedIcon → `UI3Image.Style=AnimatedIcon`
- Compact Sizing → package-wide density/sizing tokens
- IconElement → `UI3Image.Style=Icon` and icon properties on other controls
- Line → `UI3Shape.Shape=Line`
- Shape → `UI3Shape`
- RadialGradientBrush → shared drawing primitive
- System Backdrops (Mica/Acrylic) → `UI3Window` / backdrop engine
- SystemBackdropElement → `UI3Frame.Style=Backdrop`
- ThemeShadow → shared elevation/shadow engine

### Text

- AutoSuggestBox → `UI3TextBox.Mode=AutoSuggest`
- NumberBox → `UI3TextBox.Mode=Number`
- PasswordBox → `UI3TextBox.Mode=Password`
- RichEditBox → `UI3RichTextBox`
- RichTextBlock → `UI3Label.Mode=Rich`
- TextBlock → `UI3Label.Mode=Plain`
- TextBox → `UI3TextBox.Mode=Text`

### Motion

- Animation interop → shared animation engine
- Connected Animation → shared animation engine
- Easing Functions → shared animation engine
- Implicit Transitions → shared animation engine
- Page Transitions → shared animation engine
- Theme Transitions → shared animation engine
- ParallaxView → `UI3ScrollView.Parallax` / parallax behavior

### Windowing

- AppWindow → ordinary twinBASIC Form + `UI3Window` services; not a duplicate toolbox window
- AppWindowTitleBar → `UI3TitleBar` / `UI3Window`
- TitleBar → `UI3TitleBar`
- Window → ordinary twinBASIC Form + `UI3Window`

### System

These Gallery pages are APIs/services, not control visuals. They are recorded so “all Gallery” does not silently become “all controls plus every Windows service.”

- Clipboard → optional utility/helper, not a tbUI3 visual control
- ContentIsland → interop research only; not needed to reproduce WinUI controls on classic forms
- Storage pickers → use/offer native picker helpers if they fit the package, but not toolbox controls

### Shell

These are Windows shell services, not WinUI controls:

- App notifications → optional future helper, not a toolbox control
- Badge notifications → optional future helper; distinct from `UI3InfoBar.Style=Badge`
- JumpList → optional future helper, not a toolbox control

## Fundamentals, design and accessibility pages

The 15 special Gallery pages are not omitted. They become package-wide requirements rather than controls:

- Resources, Style, Binding, Templates, Custom & User Controls, XAML Conditions and Scratch Pad → implementation/reference concepts; tbUI3 exposes VB-style properties/events rather than recreating a XAML runtime.
- Color, Geometry, Iconography, Spacing and Typography → authoritative theme/drawing token families.
- Color Contrast, Keyboard Navigation and Screen Reader → conformance requirements for every applicable control.

## Variant/state coverage rule

For each family, completion means more than “one screenshot looks right.” The implementation checklist must cover every Gallery/documented variant that applies, including:

- default/rest, pointer-over, pressed, disabled and focus-visible states;
- selected/checked/indeterminate/open/expanded states where the control has them;
- light, dark and high-contrast themes;
- system accent and relevant accent shades;
- compact/normal sizing where Microsoft documents both;
- icon-only, text-only and icon+text variants where supported;
- horizontal/vertical/orientation variants;
- single/multiple/extended selection where supported;
- editable/read-only modes;
- empty/loading/error/paused/indeterminate states where applicable;
- keyboard, mouse, touch and accessibility behavior;
- 32-bit and 64-bit;
- per-monitor DPI;
- Windows 10 graceful degradation for Windows 11-only effects.

The per-control docs under `docs/controls/` will eventually enumerate the exact Gallery samples/resources used to prove each family.

## Scope boundary

“Implement all WinUI controls” means reproduce the control/UI surface that is meaningful on classic twinBASIC forms. It does **not** mean reimplement the Windows App SDK, XAML parser, WebView2 browser engine, map data service, media codecs, notification platform or every Windows shell API.

Where a Gallery item is fundamentally a platform/service host, tbUI3 will either:

1. provide a thin native host/adapter while keeping the core package dependency contract intact;
2. make it an optional companion integration; or
3. document the existing Windows/twinBASIC facility that supplies the engine while tbUI3 supplies only the WinUI-style chrome.

No such exception may silently add a required TWINSERV package dependency to the core tbUI3 package.
