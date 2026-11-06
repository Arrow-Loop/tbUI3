> Archived working note, copied from the project's shared files on 2026-11-01. See [the investigation record](../2026-11-01-multipage-designer.md) for the current state.

# Add-in ideas for a MultiPage-quality designer

Brainstorm for Shane, 2026-11-01. The starting point: twinBASIC can't create a designer-tracked control from a UserControl at design time (our tests, and Wayne: "out of luck... at the moment"). Shane says the add-in could become required later, so this asks what an add-in inside the IDE could do. Ideas only. Nothing is built, and nothing is decided.

## What we know about the ground we'd stand on

Verified in BETA 1033:

- The form designer is ordinary HTML and JavaScript in the IDE's main page. `ide/main.js` loads as a classic script, so its top-level functions are page globals. That includes the designer's own `addControl`, `deserializeControls`, the paste path (`doPasteRaw`, `doPaste`), `changeSelectedControlsProperty` and `executeIdeCommand`.
- The designer's own Paste creates real controls (named, selectable, saved, undoable) inside a selected container. The control data is plain JSON.
- Our WinUI3IdeStyle add-in already reaches the main page's DOM (`RootDomElement.Properties.ownerDocument`) and injects CSS there.
- The official add-in package (tbIDE) has no form designer API at all. Everything below would use undocumented internals.

Not verified when this was first written (now answered, see Probe results):

- Whether an add-in can **run JavaScript** in that page (for example by adding a `<script>` element through the DOM), or only read and style it. Every idea below except 8 depends on the answer. If it can't, the add-in can still do CSS and DOM tricks, but it can't drive the designer.

## Probe results (2026-11-01, DesignerBridgeProbe, BETA 1033)

- **Running JavaScript works.** `ownerDocument.defaultView.eval(js)` runs in the IDE page and returns its value synchronously. All the designer functions listed above are page globals. A `<script>` element appended through the bridge did not run, and an inline `onerror` handler ran, but only asynchronously.
- **Creating a real control works.** With the TabProbe selected, the add-in inserted a page control's JSON through the designer's own insert steps (`getCurrentFormEditorGlobals()`, then `preparePaste`, `deserializeControls`, `doPaste`, `handleMultipleChangeProperties`, `undoPoint`). The clipboard was never used. The new page got its own name, could be selected and dragged, came out with a single Ctrl+Z, and survived save and reopen. Without `undoPoint`, one Ctrl+Z also removed the step before the insert.
- So idea 1 is proven. Next comes building a page's JSON without copying an existing one.

## Ideas, from most to least valuable

1. **Real "New Page" through the designer's own code.** A small JavaScript bridge in the page calls the designer's own create or paste function with a page control's JSON, targeting the selected TabView. That gives a real designer control with no clipboard and no simulated mouse. One click, and the result is exactly as if the developer had drawn it.
2. **"+" and real tabs drawn as HTML over the control.** The add-in lays clickable HTML on top of the TabView's picture in the designer: tab headers, a "+" button and a close "x" on each tab. Clicks are instant. That removes the half-second select-then-click delay, and you get hover effects. "+" calls idea 1, and a tab click sets SelectedPage.
3. **Our items in the designer's own right-click menu.** The add-in watches for the designer's context menu and adds "New Page", "Delete Page", "Move Page Left" and "Move Page Right" when a TabView is selected. This works with or without UserControl verbs.
4. **Drag to reorder tabs.** Drag a tab header in the designer and the add-in reorders the pages (a page-order property on the TabView), the way VBA's MultiPage lets you move pages.
5. **Hide the plumbing.** Hide UI3TabPage from the toolbox, since "+" creates pages. In the Properties panel's control list, show pages as "UI3TabView1 > Page 2". Then the developer never meets the page control as a separate thing.
6. **Auto-adopt stray drops.** If a control lands on the TabView but outside any page (for example on the tab strip), the add-in moves it into the current page.
7. **Region handles for other containers.** The same overlay idea for SplitView (a pane open/close handle and a draggable divider), Expander (a live chevron), and Grid (row and column guide lines you can drag).
8. **Nicer editors.** WinUI-styled HTML dialogs for editing a Pages list, tab headers and icons, opened from a verb or the right-click menu. This one can mostly be done with ordinary property pages too.

## How the control and the add-in would talk

- The add-in watches the designer's selection (DOM) and reads the selected control's class name from its properties. It needs nothing from the control for ideas 2 to 6.
- For verbs, VerbInvoked could set a hidden property such as `_RequestNewPage`. The add-in sees the change in the designer page and acts on it.

## Risks to weigh before committing

- **Breakage per beta.** These internals aren't an API. A twinBASIC beta can rename `addControl` or change the JSON. Mitigation: keep the bridge tiny, check each function exists before using it, fall back silently to "draw a page from the toolbox", and recheck every new beta (as we already do for the themes).
- **Required install.** If the add-in becomes required, every developer using the package needs it. Without it, the fallback above must still work, so the package never breaks.
- **Undo and save edge cases.** Calling designer internals might skip steps the normal toolbox path does, such as undo points, recompile flags or name checks. Idea 1 should reuse the paste path, which already handles those.
- **Etiquette.** If this works, it's worth showing Wayne. It might be the push for an official designer API, which would let us swap the bridge out.

## Suggested first step

One small add-in probe that answers the big unknown: can the add-in run a line of JavaScript in the designer page, and does `typeof addControl` come back as "function"? If yes, a second probe pastes one TabPage into a selected TabView through the designer's own paste path, and we check it's selectable and survives a save and reopen.
