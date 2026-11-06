# WinUI 3 control fidelity policy

Status: authoritative project rule.

## Purpose

tbUI3 is not a generic Fluent-inspired control library. Its goal is to reproduce the practical WinUI 3 control surface on ordinary twinBASIC forms as faithfully as the host architecture allows.

The governing rule is:

> **If Microsoft defines a value, visual state, layout rule, animation, resource, template behavior, or interaction contract for a control in WinUI 3 source/documentation, tbUI3 must reproduce that control-specific definition rather than substitute a generic Fluent approximation.**

Generic “Windows 11-looking” choices are not sufficient evidence.

## Source priority

For each control or variant, use sources in this order:

1. **microsoft-ui-xaml control theme resources and templates**
   - control-specific `*_themeresources.xaml`;
   - the control's `Style`, `ControlTemplate`, visual-state groups, setters and theme dictionaries;
   - shared resources referenced by that template.
2. **microsoft-ui-xaml implementation source**
   - C++/IDL/XAML implementation where behavior is not fully expressed in the template/resources.
3. **Microsoft WinUI Gallery**
   - sample composition, documented variants and current control-surface coverage;
   - visual sanity checking against Microsoft's own examples.
4. **Microsoft Windows App SDK / WinUI documentation**
   - public API contracts, accessibility behavior and usage guidance.
5. **General Fluent guidance**
   - only when a control-specific source does not define the value/behavior and the project is intentionally adding a tbUI3 convenience abstraction.

A lower-priority source must not override a higher-priority control-specific definition.

## Exactness requirements

For every implemented control/variant, the per-control documentation must identify the exact upstream source used for each applicable category:

- padding and margins;
- minimum/maximum/default dimensions;
- border thickness;
- corner radius;
- font family, size, weight and style;
- background, foreground and border resource keys;
- accent resource chain;
- pointer-over, pressed, disabled, selected, checked, indeterminate, open and focus states;
- transitions and animation durations;
- icon/glyph sizing when the control defines it;
- template structure and content alignment;
- focus visual margin/geometry;
- compact sizing resources;
- high-contrast resources;
- orientation/layout differences;
- keyboard/mouse/touch interaction behavior;
- accessibility/automation behavior;
- version-specific Windows behavior.

When a WinUI template references a shared resource, tbUI3 should follow that exact resource chain rather than replacing it with a visually similar hard-coded value.

## Shared resource rule

Shared WinUI resources are valid and expected when the control's own XAML references them.

Examples:

- `ButtonPadding` may be copied from Button's own theme resources;
- `ControlCornerRadius` is valid for Button because Button's template explicitly references it;
- `ControlContentThemeFontSize` is valid for Button because Button explicitly consumes it.

This is different from choosing an unrelated global Fluent spacing token merely because it looks appropriate.

## tbUI3 convenience abstractions

Sometimes tbUI3 needs a VB-friendly property that WinUI does not have because XAML can express arbitrary content/layout.

Those are allowed, but must satisfy all of these rules:

1. document that the property is a **tbUI3 convenience**, not a WinUI control property;
2. do not describe its default as “the WinUI value” unless a control-specific source actually defines that value;
3. keep the convenience from altering exact WinUI behavior when it is unused;
4. where possible, let the developer supply/override the value;
5. record why the abstraction exists and what WinUI XAML construct it is standing in for.

Example: WinUI `Button` has arbitrary `Content`; it does not define `IconPosition` or `IconSpacing`. If tbUI3 exposes those properties for VB convenience, they are tbUI3 API design, not part of the Button XAML specification.

## No “Fluent vibes” rule

Do not implement or document a value because it:

- “looks about right”;
- matches a generic Windows 11 screenshot;
- appears in an unrelated Fluent control;
- is a common spacing number;
- exists in a generic Fluent design guide but is not referenced by the target control.

If a required value cannot be found in the control-specific source, mark it as unresolved or as an explicit tbUI3 convenience. Do not silently fill the gap with a plausible number.

## Variant-family rule

Collapsing many WinUI controls/styles into one tbUI3 toolbox family does **not** relax fidelity.

For example, one `UI3Button` may expose Standard, Accent, Subtle, Toggle, Repeat, Hyperlink, DropDown, Split, ToggleSplit, Command and CommandToggle variants through properties. Each variant must still follow the exact XAML/resources/behavior of the corresponding WinUI control/style.

The smaller toolbox is only an API/designer organization choice.

## Validation rule

A control is not “WinUI-faithful” merely because it looks close in one screenshot.

Validation should compare the implemented control against the relevant WinUI source and Gallery state matrix:

- light;
- dark;
- high contrast where applicable;
- normal;
- pointer over;
- pressed;
- disabled;
- focus;
- selection/check/open states;
- compact sizing;
- orientation/layout variants;
- win32/win64;
- DPI behavior.

Any intentionally unsupported WinUI state must remain documented as incomplete.

## Per-control documentation requirement

Every implemented family under `docs/controls/` should eventually contain a source matrix like:

| Area | WinUI source | tbUI3 implementation |
| --- | --- | --- |
| Padding | exact XAML resource/template | exact token/helper |
| Corner radius | exact resource/template | exact token/helper |
| Rest background | exact resource key chain | exact theme token |
| Pointer-over | exact VisualState/resource | implementation state |
| Pressed | exact VisualState/resource | implementation state |
| Disabled | exact VisualState/resource | implementation state |
| Font | exact resource/template | DirectWrite format |
| Icon sizing | exact source if defined | implementation |
| Convenience-only API | no WinUI equivalent | clearly labeled tbUI3 behavior |

No control should be considered complete until that matrix is filled in for the states/variants claimed as implemented.

## Version pinning

Source comments/docs should record the microsoft-ui-xaml or WinUI Gallery commit used for a milestone.

Do not silently update token values from a newer upstream commit in the middle of a milestone. Review upstream changes deliberately and record them in CHANGELOG/ROADMAP when adopted.
