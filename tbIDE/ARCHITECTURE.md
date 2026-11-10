# tbUI3IDE architecture

## Distribution and identity

One canonical project, tbUI3IDE/tbUI3IDE.twinproj, produces tbUI3IDE.dll per IDE architecture, version 1.2.0.0. Its established project ID is unchanged. Remove legacy WinUI3IdeStyle.dll and TabViewDesigner.dll from both addins architecture directories during migration. Theme files and the tbUI3 runtime control package remain separate; built consumer applications do not need this add-in.

## Entry point and independent features

MainModule exports the single tbCreateCompilerAddin and returns tbUI3IDEAddin. It starts TabViewDesignerController independently of theme/layout preferences. The controller and adapter v8 retain native page editing, locks, hidden toolbox entry, host targeting, creation/deletion/reordering and lifecycle cleanup.

The hidden tbUI3IDE tool window reaches the existing IDE document through ownerDocument.defaultView.eval. MainModule installs IdeToolbarScript for every theme, then separately applies WinUI3IdeCss only for the included WinUI3 theme names. The existing WinUI3IdeStyle/Options/Enabled setting is intentionally retained. The new ToolbarMode value in that same namespace is independent; Classic is the default when absent. The shared options timer persists both preferences independently and reports toolbar fallback errors. The settings observer exposes the additional-styling row on every theme so the toolbar combo can remain immediately below it.

## Live command adapter and presentation

js/ide-toolbar.js owns the three toolbar renderers and their essential CSS lifecycle. Classic preserves the native surface. Hybrid retains native menus and groups existing toolbar commands in Home/Code/Form/contextual MultiPage/Add-ins. Ribbon discovers the native rootMenu1Inner headers and lazily captures their showContextMenu descriptors without executing command actions. It preserves command IDs, alternatives, native context expressions, enabled/checked states, combo options and original actions. Native toolbar command proxies dispatch the ordinary mouse sequence to the original nodes; build/zoom/grid controls retain their original nodes and handlers.

The live adapter observes current sources through a bounded 400ms scan, captures the active menu no more than once per second, and reconciles late toolbar/menu contributions without a whitelist of future commands. It supports synchronous/lazy submenus and the native asynchronous Add-ins list. Unsupported native structure restores Classic while retaining the requested mode for persistence. Private-API structural compatibility is not guaranteed for arbitrary future betas.

The fullscreen File view sits inside the IDE window. File operations and Tools/settings use native descriptors. Loaded-add-in information moves into its Add-ins section; other add-ins' toolbar contributions remain on the Add-ins ribbon tab. BETA 1044 has no functional native enable/disable action: its loaded-add-in actions call notSupportedMenuOption. Those entries are displayed disabled with an explanation, and real enablement remains roadmap work.

Save/Undo/Redo/Play/Pause/Stop use the former menu space in rootMenu1Inner, which is the custom title bar when Show real OS titlebar is off and the row above the ribbon when it is on. Window controls and title-drag handlers remain owned by the IDE. File Escape/back returns focus; tab arrow navigation and Ctrl+F1 collapse are handled locally. Current groups use a larger lead command and three stacked rows with horizontal overflow; complete Office adaptive collapse/keytips and visual acceptance remain open.

## Theme and icon ownership

css/ide-toolbar.css is essential presentation, independent of the optional theme stylesheet. Every palette/state color comes from the active IDE's theme variables, including standard and third-party themes. WinUI 3 supplies the visual language; Office supplies the ribbon organization. The existing 19 Fluent SVGs are scaled to 28px lead / 18px stacked presentations. Native designer glyphs and other add-ins' images are retained. No Office icons or new icon library is introduced.

WinUI3IdeCss and its 288 generated rules remain unchanged. Its media state and panel-title normalization are controlled solely by the original additional-styling switch. No toolbar renderer reads that switch or requires an included theme name.

## Packaging and cleanup

tools/build-ide-toolbar.mjs embeds the readable adapter, essential CSS and the existing Fluent map into IdeToolbarScript.twin. tools/build-tabview-designer.mjs embeds the page adapter and patches all current sources/Settings into the canonical project. The .meta project-root rename is applied explicitly. Loose JS/CSS remain review inputs, not runtime dependencies. Source mirrors are compared against packed entries and the current official exporter.

Mode change/unload removes owned surfaces and restores native selectors/grid nodes from comment markers, native menu visibility, the docked toolbar header and the original showContextMenu hook when still owned. Cleanup preserves wrappers installed later by other add-ins. The options timer stops and both feature lifecycles dispose. Pending theme/toolbar preferences are drained before teardown. See ROADMAP.md and ../docs/validation/2026-11-10-ide-toolbar.md for remaining acceptance boundaries.
