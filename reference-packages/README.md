# Reference Packages Laboratory

This directory is a source-archeology laboratory for tbUI3. It is deliberately **not** part of tbUI3's dependency graph.

## Canonical snapshot

`ReferencePackages.twinproj` is the canonical twinBASIC project. Shane confirmed the repaired snapshot runs in twinBASIC BETA 997 on 2026-10-06.

The first project created by enabling the selected packages produced a large cascade of WinDevLibImpl diagnostics because WinDevLibImpl declared a local WinDevLib dependency but its embedded `Packages/WinDevLib` folder was empty. The repaired snapshot contains an exact copy of the project's WinDevLib 9.5.742 package at that location. No WinDevLibImpl source declarations were patched to hide the problem.

## Loose mirror

`src/` is the unpacked mirror of the canonical project, including the top-level project files and the embedded package contents. It exists so GitHub, developers, and coding agents can search and diff individual `.twin`, `.tbcontrol`, `.tbform`, README, licence, and related files without unpacking the binary project on every pass.

Treat the `.twinproj` as the authoritative snapshot and `src/` as the review/search mirror. When the laboratory project changes, regenerate the mirror.

## Dependency rule

The presence of a package here is **not** permission to add it as a tbUI3 package reference. tbUI3 is intended to remain self-contained apart from baseline twinBASIC/compiler facilities.

Packages may be inspected for proven patterns. Where licensing permits, only the smallest useful portions should be adapted into tbUI3, kept private where practical, and attributed. Prefer learning from a mature implementation over re-inventing Windows plumbing, but do not trade that benefit for a dependency chain in the consumer package.

## Directly enabled reference packages

| Symbol | Version | Publisher | Licence recorded by package metadata | Why it is here |
| --- | --- | --- | --- | --- |
| WinRT | 1.7.0.159 | VanGoghGaming | MIT | UISettings theme/accent plumbing; later WinRT/Composition reference |
| WinDevLib | 9.5.742.0 | fafalone | CC0 1.0 Universal | Windows SDK, COM, Direct2D/DirectWrite, DWM and related declarations |
| WinDevLibImpl | 1.4.41.742 | fafalone | MIT | Implements-compatible COM interface patterns |
| TBMANLIB | 1.0.29.0 | woeoio | MIT | Subclassing and general native utility patterns |
| TBMANLIB_ListBoxHScroll | 1.0.1.0 | woeoio | MIT | Focused control helper reference |
| TBMANLIB_Xml | 1.0.1.0 | woeoio | MIT | Pure-twinBASIC object implementation reference |
| TBMANLIB_Aes | 1.0.4.0 | woeoio | MIT | Package structure/reference only |
| TBMANLIB_Dialog | 1.1.0.0 | woeoio | No licence string in project metadata | Dialog implementation reference; do not reuse code without verifying licence |
| TBMANLIB_Diagnostic | 1.0.1.0 | woeoio | MIT | Diagnostics/reporting implementation reference |
| TBMANLIB_RES | 1.0.4.0 | woeoio | MIT | Resource helper patterns |
| TBMANLIB_ConsoleCore | 1.0.1.0 | woeoio | MIT | Package/framework patterns |
| TBMANLIB_ConsoleComponents | 1.0.1.0 | woeoio | MIT | Component framework patterns |
| TwinTimerLib | 1.0.0.7 | Krool | MIT | 32/64-bit timer implementation before tbUI3 animation work |
| VBCCR18 | 1.8.0.125 | Krool | MIT | Mature toolbox controls, designer lifecycle, keyboard/focus/default behavior |
| AutoCompleteLib | 1.0.0.3 | Krool | MIT | Native Edit/Shell autocomplete patterns for future text controls |
| OLEGuids | 1.0.0.10 | Krool | MIT | COM/OLE GUID/interface definitions |
| GdiPlus | 0.9.0.45 | okaso | MIT | Comparison/reference only; tbUI3 remains Direct2D/DirectWrite-first |

The project also includes the normal twinBASIC compiler packages and package-internal dependencies embedded by the IDE.

## Rendering direction

tbUI3's current rendering architecture is Direct2D + DirectWrite. Avoid GDI/GDI+ unless a concrete future requirement demonstrates that the modern rendering path cannot satisfy it. The presence of GdiPlus in this laboratory is not an architectural reversal.
