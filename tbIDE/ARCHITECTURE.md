# tbUI3 IDE add-in architecture

## Distribution and identity

One canonical project, WinUI3IdeStyle/WinUI3IdeStyle.twinproj, produces WinUI3IdeStyle.dll for each IDE architecture. The add-in display name is tbUI3 IDE, version 1.1.0.0. Its existing project ID and output name are preserved. The standalone TabViewDesigner DLL/build target is retired and must be removed from installed architecture folders when migrating.

Theme files remain optional independent files. The tbUI3 control package remains a separate runtime library. Neither the combined DLL nor loose development JS/CSS is required by built consumer applications.

## Entry point and lifecycle

MainModule exports the only tbCreateCompilerAddin and returns the only AddIn implementation, WinUI3IdeStyleAddin. That object starts the private TabViewDesignerController before applying the optional theme, forwards project-loaded events and disposes both features on unload.

The tab controller owns existing command buttons, its hidden page bridge and native retry/error-report timer. Its embedded JavaScript factory owns page selection/presentation, locks, insertion/deletion/reordering and toolbox hiding. It does not read the theme name or styling preference. Adapter version remains v8 because its behavior did not change in this pass.

The existing theme implementation owns a separate hidden page bridge, settle timer, preference timer, winui3IdeStyleCss stylesheet and theme-option observer. It applies only to WinUI3 themes. The WinUI3IdeStyle/Options/Enabled registry preference remains unchanged. Its switch changes the theme stylesheet's media state and panel-title presentation; it never disables or disposes the tab controller. A standard theme removes optional styling while page management continues.

Unload stops timers, disposes the page adapter (restoring owned presentation/locks), removes optional styling, disconnects the option observer and removes the injected option row. Native host-managed toolbar objects are released through the single add-in lifecycle.

## Source and packaging

WinUI3IdeStyle/js/tabview-designer.js is the readable functional adapter. tools/build-tabview-designer.mjs embeds it using Chr(34) into TabViewDesignerScript.twin and patches the existing canonical project, including the native controller. It requires that project to exist.

WinUI3IdeStyle/css/winui3-ide.css and winui3-ide-icons.css remain the authoritative style inputs. tools/build-addin-css.mjs emits WinUI3IdeCss.twin. The 288 generated rules and CSS inputs are unchanged by consolidation. The initial build-addin-project bootstrap refuses to overwrite an established project. All generated sources are contained in the canonical DLL project and synchronized to src for review.

## Next extension

The agreed Microsoft Office-style ribbon will be implemented inside this same project. TabView command IDs/handlers must remain stable and receive their own group/context. Optional styling must not become a dependency of page commands. See ROADMAP.md for restoration, fallback, focus and overflow constraints.
