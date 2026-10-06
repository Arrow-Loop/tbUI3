# Third-party notices and implementation provenance

tbUI3 is MIT-licensed. It is intentionally self-contained and does not require the projects/packages below at runtime.

## Microsoft microsoft-ui-xaml

Theme-resource values, control measurements, colors, radii, paddings and visual-state behavior are derived from Microsoft's open-source `microsoft-ui-xaml` project. Current S2/theme snapshot: commit `8318c5bf` (2026-10-05).

Relevant files include `Common_themeresources_any.xaml`, `Button_themeresources.xaml` and `CornerRadius_themeresources.xaml`.

License: MIT.

## WinDevLib by fafalone

`UI3Direct2D.twin` adapts the minimal Direct2D/DirectWrite COM declarations tbUI3 needs from WinDevLib. Reference version preserved in `reference-packages/`: 9.5.742.0.

License: CC0 1.0 Universal.

No WinDevLib package dependency is added.

## WinRT Interfaces and XAML Islands DevKit by VanGoghGaming

The live form-theme subclass layer uses the pointer-width-safe comctl32 `SetWindowSubclass` / `RemoveWindowSubclass` / `DefSubclassProc` architecture in WinRT 1.7.0.159 `Sources/mdlSubclass.twin` as one implementation reference.

License: MIT.

No WinRT package dependency is added. The audited 1.7.0.159 package does not contain `UISettings.GetColorValue`.

## VBCCR18 by Krool

VBCCR18 1.8.0.125 `Sources/Builds/ComCtlsBase.bas` independently uses the same modern comctl32 subclass family and is corroborating prior art for pointer-safe subclassing and mature VB-compatible control behavior.

License: MIT.

No VBCCR18 package dependency is added.
