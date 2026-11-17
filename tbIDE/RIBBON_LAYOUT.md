# Ribbon command organization

Current implementation: tbUI3IDE 1.3.0.15, 2026-11-17.

Save Document follows the selected code/form document's dirty and read-only state. It uses the IDE's native per-editor writer, preserving its completion/failure behavior and leaving other dirty documents alone. A project without a saved path first opens native Save As. Form / Code enables only when the selected document has a matching designer/code file; standalone modules disable it. Both commands use the same behavior in Ribbon/Hybrid, full/simplified.

The ribbon card's shadow and bottom border apply only to WinUI3 Dark/Light. Standard and third-party themes use a flat command surface in both Ribbon and Hybrid, full and simplified. Live theme changes preserve command/control nodes. This presentation choice is independent of additional styling; other layout and interaction behavior is unchanged.

In both Ribbon and Hybrid, full layouts retain the requested secondary labels and inline Grid options. Only Simplified hides the Center in Container, Lock Controls, Preview, Grid, Page Left/Right, TabView Refresh/Diagnostics and Insert Folder/Other file/Import labels and puts Grid options in a toggle-split flyout. Help, accessible names, original values and events remain. The original ten alignment/size commands stay icon-only in both presentations. The chevron sits inside both cards with a transparent resting background and hover fill; its glyph remains visible. Simplified controls are vertically centered. Quick Access retains 16px internal left padding.

Both replacement profiles support full/simplified presentation using the corner chevron or Ctrl+F1 and the same independently saved preference. Hybrid retains native menus, its smaller Home/Code/Form/Add-ins inventory and no Quick Access or Backstage. No fourth toolbar mode is added.

Save Document and Form / Code share the leading Document group in Code and Form, in that order, for both profiles. The latter dispatches the native Switch Between Form and Code action with its native tooltip. Classic retains its original native toolbar inventory/order/handlers while showing the corresponding Ribbon glyphs and tooltips without button labels; selectors retain their native display.

Only in WinUI3 Dark/Light with additional styling enabled, main-window surfaces receive 8px side insets and no bottom inset. An 8px top inset applies only with the real OS titlebar disabled. The caption/Quick Access row is excluded from side insets, retaining Quick Access padding and native caption-button geometry.

The Form tab shows MultiPage as a normal group immediately after Grid when a MultiPage host, page or child is selected. This applies to Ribbon and Hybrid; no nested launcher or sub-ribbon is used. Existing native page buttons and command state remain authoritative.

Shane's Office Home/View/Backstage screenshots define the composition. Ribbon mode organizes commands by task rather than reproducing the native menu names. The IDE-specific Code, Form, Project and Debug tabs retain the IDE's actual functions. Classic and Hybrid keep their existing organizations.

| Surface | Groups and native commands |
| --- | --- |
| Quick access | Save, Undo, Redo, Start/Continue, Break, Stop. Undo/Redo and these execution controls are omitted from ribbon groups. |
| Home | Clipboard: Paste as the large lead command, Cut, Copy, Paste as comment. Editing: Find as the large lead command, Replace, Find in project, Delete, Select all; advanced find/match commands in Find options. |
| Insert | Direct native Add options grouped into Forms, Code, Resources and Files, with Components as a future fallback. Async/dynamic options remain live; unsupported producer changes retain the native parent as a fallback. |
| Code | Document: Save Document followed by Form / Code, in their own leading group. Comments; Formatting: indent/outdent and format selection/document; Navigation: definition, last position, line/column; Outlining: Fold and Unfold dropdowns; Case: Change case dropdown. |
| Form | Document: Save Document followed by Form / Code, in their own leading group. Arrange directly exposes Left, Top, Right, Bottom plus other native alignment options; Size directly exposes Widest, Tallest, Narrowest, Shortest. Existing source handlers are reused. Spacing, Position, Protection, Designer preview, the native Grid toggle and remaining grid options remain. Contextual MultiPage follows Grid with New Page, Delete Page, separator, Page Left, Page Right, separator, TabView Refresh and TabView Diagnostics. |
| View | Views: Code editor, Object designer, Object browser. Show: common Project explorer/Toolbox/Properties commands plus More panels. Zoom: context-sensitive native zoom/font commands and original zoom selector. Window: native panel layouts/features. Appearance: native theme selector. |
| Project | Project settings/references; Build and Clean with the original build configuration selector; compiler restart/cache controls; project/output folders. |
| Debug | Stepping, Breakpoints, Watches, Execution, native debugger Options. |
| Add-ins | Live toolbar contributions from other add-ins; contextual page management remains under Form. |
| File > Help | Every native Help command, with native callbacks/states and future entries retained. There is no separate Help ribbon tab. |
| File | Vertical navigation rail: Info, New, Open, horizontal divider, Save, Save as, Export, Close project; Add-ins, Help, Options and Exit in the lower group. Open includes Open recent. Info shows the actual project name with settings/references tasks. IDE Options, language and keyboard shortcuts share the Options page. Save Document is on Code/Form instead. |

Sections/tabs are populated when the IDE provides their commands. Newly discovered Tools commands can create a Tools tab. Unknown native menus create their own named tab. New commands in known menus fall back to Home > More editing, View > More views, File > More commands or the corresponding native tab/group; they are never discarded by an allowlist. Root File Build/Clean move to Project. Project settings/references are intentionally available in both Project and File > Info, as project-level tasks.

## Implementation contract

`tbUI3IDE/js/ribbon-layout.js` is pure presentation metadata over current native descriptors. `js/ide-toolbar.js` discovers menus, resolves native context alternatives, refreshes their contents/state, renders the resulting model and dispatches the original command/action. IDs, localized native labels, context expressions, disabled/checked state and lazy submenu functions are retained. Group labels and synthetic grouping captions are currently English, as are the existing toolbar labels.

The factory is embedded by `tools/build-ide-toolbar.mjs`; no loose JavaScript installation is required. Semantic grouping uses stable native command IDs and localization token names rather than translated display text. Synthetic Fold/Unfold, Change case, Find options and More panels wrappers retain every child descriptor/action. New unknown commands remain reachable without a new grouping rule. This depends on the existing IDE menu/descriptor hooks remaining compatible; it does not promise compatibility with arbitrary future API replacements.

Large versus stacked commands are explicit function roles in `js/ribbon-presentation.js`, independent of group position or ordering. This applies to Hybrid source controls and Ribbon descriptors, with multiple full-size commands permitted per group. The following mapping uses the supplied Office screenshots as analogies; IDE-only actions are documented project composition choices, not claims that Microsoft ships these IDE commands.

| Reference function | Full-size roles | Stacked roles |
| --- | --- | --- |
| Home Clipboard / Editing | Paste, Find, Find in project and Find options | Cut, Copy, Paste as comment, Delete, Select all, Replace |
| View Views / Zoom / Window | Code editor, Object designer, Object browser; Zoom in/out; More panels; panel layouts/features; Theme | Project explorer, Toolbox and Properties; original zoom selector keeps its own geometry |
| Page Layout Arrange | Align, Make same size, horizontal/vertical spacing, Bring forward, Send backward, Lock controls | Center in container commands; native grid controls |
| Developer / editing and navigation | Comments; format selection/document; definition, previous position, line/column; Fold/Unfold; Preview; Add component | Indent/outdent; Change case, like Office Font's case control |
| Project / Debug, IDE-specific analogies | References, Project settings, Build/Clean, compiler restart/cache, project/build folders, breakpoint toggle, set next statement, debugger options | Stepping, add/clear watches, clear breakpoints |
| Add-ins | Contributed command buttons | Selectors retain their native control geometry |

 Explicit requested Segoe/Fluent assignments override native icons for named commands; unlisted Fluent/native designer/codicon glyphs are retained. Geometry stays at a 100px command-area maximum, separate 26px tabs, 50px standard/minimum and 86px maximum large-button widths, and 76px large-button height. Essential CSS uses the old toolbar card/ToolbarBackground resource and matching foreground, preserves Fluent shadow/card corners and supplies the existing pinned WinUI subtle hover/pressed alpha effects for light/dark even with additional styling off. File navigation and every command receive icons; explicit requested assignments take priority, then unlisted native/source images and pinned Fluent fallback artwork. The titlebar-colored tab strip remains a separate surface with transparent selected/hover tabs and accent/grey underline indicators. Dropdowns use the application flyout/general surface and WinUI subtle interaction effects, promoted to the browser top layer when available; native context-menu fills are deliberately light in the supplied dark theme and are not used for these dropdowns. Full-size dropdown chevrons are centered below the caption; compact chevrons are centered at the right. All are real masked Fluent glyphs. Native forced-white grid number fields receive a narrowly scoped themed background override. Optional WinUI3 Light/Dark CSS supplies subtle Fluent shadow4 elevation for native and replacement dropdowns.

Code/Form editor changes follow native selected-editor identity/type; an unchanged editor leaves manual ribbon selection alone. Every large command uses the same fixed top glyph row, including dropdowns and one-/two-line captions. Zoom and Configuration retain accessible labels without redundant visible captions. The Grid toggle and native options occupy one Grid group. The toggle replaces the displayed Show Grid checkbox while preserving that original checkbox as native state. Both replacement modes share 32px/16px centered glyph canvases, font-measured large widths bounded by 50px/86px, 4px canvas-to-caption spacing, 4px top padding inside the 100px card and 89px dividers.

## Backstage lifecycle

File is an opaque, full-client-area surface below the title controls. Back is an icon-only circled left arrow with an accessible name and tooltip; it preserves the existing focus-return behavior. Opening or leaving File closes any owned top-layer dropdown first. Its rail extends through the former 32px quick-access row while title controls remain uncovered. File foreground follows the application rather than the light native dialog palette. Its rail stays vertical; content is a vertical task list rather than a wrapping ribbon group. While open, quick access is hidden and the ribbon, docked designer/workspace and floating panels receive an owned visibility rule, `inert` and `aria-hidden`. Original values are restored before native command dispatch and on Back, Escape, mode change or unload. Panels appearing while File is open receive the same treatment. Stable content/navigation signatures avoid replacing focused buttons on each refresh.

The loaded-add-in list remains informational in BETA 1044 because its native callbacks call `notSupportedMenuOption`; those entries are disabled with an explanation. Other add-ins' toolbar buttons remain functional on the Add-ins ribbon tab. No enable/disable mechanism is fabricated.

## Evidence and remaining work

The JavaScript/DOM suite checks semantic placement, native command coverage, context alternatives, lazy/async menus, future menu/command discovery, exact-once actions and Backstage underlay/accessibility restoration. The official BETA 1044 menu builders supply 108 top-level descriptor entries in the code-context inventory; lazy submenu actions remain native and have separate execution checks. All 99 JS/DOM/CSSOM/native-protocol checks pass. See `../docs/validation/2026-11-11-ribbon-geometry-theme-lifecycle.md` for the measured results. Final rendered acceptance, automatic group collapse/flyouts and Office keytips remain in ROADMAP.md.

References: Shane's supplied Office screenshots, [Microsoft Backstage overview](https://support.microsoft.com/en-us/office/collab-files/start-backstage-with-the-file-tab), [Microsoft Backstage accessibility](https://support.microsoft.com/en-us/accessibility/office-accessibility/use-a-screen-reader-with-microsoft-365-backstage) and [Microsoft ribbon display behavior](https://support.microsoft.com/en-gb/excel/show-the-ribbon). These support the Office interaction pattern; the IDE-specific command mapping above is this project's implementation decision.
