# Third-party notices and implementation provenance

## Updater WebView2 reference (2026-11-19)

At Shane's request, the updater adapts the WebView2 host/theme/Runtime-detection patterns and embeds the shared Master CSS/control/theme JavaScript from Smith-Debnam/twinBASIC-Knowledge commit 0babc88f55f4077df7d309826734240cc63796e5. Exact unchanged shared assets and source paths are recorded in tbIDE/Updater/REFERENCE.json. The updater uses Windows system glyph fonts, not the toolkit's image/icon archives. Existing upstream WinUI/Gallery provenance comments are retained in the shared resources.


tbUI3 is MIT-licensed. It is intentionally self-contained and does not require the projects/packages below at runtime.

## Microsoft microsoft-ui-xaml

S3 Symbol table and icon sizing:

- semantic names plus legacy/new glyph mappings: `docs/design-notes/symbol-enum-spec.md`, main commit `f1d1408bdeee58d077efb763063fd059b1f12c4a` (2026-10-06);
- SymbolIcon/IconElement default font size: `dxaml/xcp/core/core/elements/icon.cpp`, where the client core font size is 20 DIPs and the system icon family is defined as Segoe Fluent Icons with Segoe MDL2 Assets fallback.


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

## Microsoft Fluent UI System Icons: explicit IDE command icons, 2026-11-12

The add-in embeds the selected Microsoft Fluent UI System Icons from the official `@fluentui/svg-icons` npm package, version **1.1.341**. License: MIT, Copyright (c) Microsoft Corporation. The retained license is `tbIDE/tbUI3IDE/icons/fluent/LICENSE`. Each selected SVG's exact filename, published URL and SHA-256 are recorded in `tbIDE/tbUI3IDE/icons/requested.json`. The importer reads only these assets from that pinned package; no npm dependency is added to the add-in runtime.

The authorized `fluent/tab_desktop_arrow_right_composite` is derived from `tab_desktop_arrow_left_20_regular.svg` and `arrow_circle_right_20_filled.svg`: the old badge is masked out and the right-arrow badge is scaled to the same position/radius. The manifest records both source hashes and the composition. No other requested SVG artwork is redrawn.

Segoe glyph selections refer to code points in the installed Segoe Fluent Icons / Segoe MDL2 Assets fonts. Windows font files are not redistributed.

## Microsoft WinUI Gallery

S3 uses the Gallery's 2026-10-05 main snapshot (`b927a6253d6b183be55b90287b8a04fde14d31a3`) as behavioral/design reference.

Relevant source:

- `Samples/IconElement/IconElementSymboliconButton.txt` demonstrates a SymbolIcon as Button content;
- `Samples/Spacing/SpacingPage.xaml` documents the 4-pixel spacing grid and identifies 8 epx as spacing between adjacent UI controls / a control and label.

License: MIT / Microsoft repository licensing as distributed with WinUI Gallery. No Gallery code or assets are required at runtime.


## TabView candidate (2026-11-09)

- TabView geometry/resource mappings were transcribed from microsoft-ui-xaml `3259dc4437540678368c6e7c72869cb58d14a568`, `controls/dev/TabView/TabView_themeresources.xaml` (MIT), using existing shared theme colors where equal. The control source matrix records incomplete states.
- The adapter was independently written after inspecting official twinBASIC BETA 1043 designer and VB/tbIDE APIs. No IDE implementation source or release archive is redistributed. The optional test reads native function bodies only from the developer-supplied local archive extraction.
- TabViewDesigner uses the repository's existing Sample 11-derived probe container with a fresh project identity; it retains baseline compiler references without adding runtime dependencies.
