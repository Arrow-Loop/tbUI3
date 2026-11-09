# Roadmap: tbIDE (WinUI 3 look for the twinBASIC IDE)

## Committed next steps
- Shane rebuilds the add-in (hold Shift while opening its project) and runs README.md check list items 1 to 8, especially Options for anything cut off by the 32px text fields and the arrow-key highlight in menus. Fix what reads wrong.
- Shane builds `WinUI3IdeStyle` in win32 and win64, runs the add-in check list in README.md and reports the Debug Console output. Then he saves the project in the IDE and the IDE-saved project and its export are committed, replacing the tool-built container.
- Shane tests both themes in BETA 1043 using the check list in README.md (the 1015 versions were never tested in the IDE); fix whatever reads wrong and record the result in CHANGELOG.md.
- Watch the dock container margin: if 2px margins make panels overflow or misalign when docking or resizing, fall back to `DockContainerMargin: 0` with `DockBorder` gaps.
- Re-check both themes against each new twinBASIC BETA. New properties appear in the shipped Dark.theme (it lists them all); rerun the property map against the new `ide/styles.css`.

## Planned: WinUI3 IDE Style add-in (agreed with Shane 2026-10-20; spike written 2026-10-30)

Update 2026-10-30: after testing on 1033 Shane wants the whole IDE to look like it was built with WinUI 3, using WinUI's DockingManager sample as the reference for panels (flat panels, sentence-case semibold-free headers with ... / pin / close glyphs, TabView-style document tabs). The theme files have reached their limit; the remaining items need this add-in: dialog button hover (fixed #ebeff5), WinUI ProgressBar (fixed green fill), menu bar hover, context menus and drop-downs, panel header weight and layout, tab shape.

Goal: reshape the IDE (tab shape, control heights and padding, Segoe UI Variable, dark context menus and drop-downs in WinUI3 Dark) beyond what a .theme file can set, without editing the IDE's own files.

Since BETA 1033, rounded panels and dialogs and dark dialogs no longer need the add-in; the theme files cover them. What BETA 1015 shows (read from the tbIDE package and ide/main.js, not yet tested):
- The official `ToolWindow.ApplyCss` and `AddMonacoWidget(..., Css)` only reach their own shadow DOM, so they cannot style the IDE.
- The add-in object model is late-bound into the real page. An `HtmlElement`'s `.Properties` walks any JavaScript property path and can call functions with arguments (Sample 11 calls `chartElement.Properties.chart.data.pushAndWrap(...)`). From any tool-window element, `.Properties.ownerDocument.head.insertAdjacentHTML("beforeend", "<style id=...>...</style>")` should add a stylesheet to the whole IDE.
- `Host` raises `OnChangedTheme` and exposes `Themes.ActiveThemeName`, so the add-in can apply its CSS only when WinUI3 Dark or WinUI3 Light is active and remove it otherwise.
- Add-ins are twinBASIC DLLs built like Sample 12, entry point `tbCreateCompilerAddin`, output to `addins\win32` and `addins\win64`.

Risks: reaching outside the tool window is not a documented use of the API and could be blocked or changed in a later BETA. Selectors in the IDE's stylesheet are not a stable contract either, so the add-in's CSS needs re-checking per BETA. Keep the .theme files working on their own, so the add-in is an optional extra.

Steps:
1. Spike (written 2026-10-30, not yet built): dialog button hover and pressed, ProgressBar, menu bar hover. It proves whether the page can be reached at all. Open questions it answers: does twinBASIC keep the case of late-bound JavaScript names (`ownerDocument`, `getElementById`, `textContent`); does the hidden tool window stay hidden across restarts; does the stylesheet survive the IDE reloading its theme.
2. If the spike works, extend the CSS per surface, using the property map from the theme work, in this order: context menus and code navigation drop-downs (dark in WinUI3 Dark), panel headers and layout per the DockingManager reference, TabView document tabs, accent-filled default dialog button, Segoe UI Variable, control heights and padding, the remaining Options-page texts.
2a. Done 2026-11-09: menus and context menus, editor tab shape, dialog and Options text boxes (from Shane's WinUI HTML/CSS reference). Next from the same reference, in order: drop-downs (`select` in Options and the toolbar, and the code navigation drop-downs that stay light) as ComboBox; panel headers and layout per the DockingManager reference; check boxes and radio buttons in Options; scroll bars (the reference has scrollbar tokens); tooltips; Segoe UI Variable across the rest of the UI.
3. Record per-BETA re-check steps (rerun the property map, then confirm each selector in `css/winui3-ide.css` still exists in `ide/styles.css`).
4. If an IDE release blocks reaching the page, fall back to the themes alone and raise the missing theme properties upstream (see Exploratory).

## Exploratory
- Ask the twinBASIC project for theme properties for the hard-coded colours listed in README.md "Known limits" (still open in 1033: context menu item text, menu bar hover, title and dialog title text, caption icons, drop-down text, property category text, a separate focused dialog button text colour, tab shape, UI font). 1033 already added dialog contents and panel corners. With the rest, WinUI3 Dark could have dark menus, and WinUI3 Light a light title bar. This would be a GitHub issue on twinbasic/twinbasic, filed only with Shane's go-ahead.
- Accent variants: the build script could take an accent colour and emit themes for other Windows accents, since a theme file cannot read the system accent.
- WinUI-style syntax colours: optional, since WinUI defines no code palette; would need a reference such as Visual Studio's Dark and Light.
- Toolbox icons: the `ToolboxIcon*` properties accept data URIs, so the toolbox could show Fluent icons. Could reuse the tbUI3 icon library.
- Distribution (decided by Shane 2026-10-30): the themes and add-in stay separate from the tbUI3 package. A package runs no code when it is enabled, and silently installing into the IDE from a control was rejected. Likely shape: a "tbUI3 IDE extras" zip attached to tbUI3 releases, and possibly the add-in copying the themes into `%APPDATA%\twinBASIC\themes` on first load. Only after the add-in spike works in win32 and win64.
- Read the accent from Windows: the add-in could read the system accent and set the theme's accent CSS variables at run time, which a static .theme file cannot.
