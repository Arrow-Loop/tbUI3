# MultiPage-style containers in the twinBASIC designer: investigation record

Covers 2026-10-30 to 2026-11-01, twinBASIC BETA 1033. This is the authoritative record of what we learned, what we tried, what failed, and what Shane decided. It supersedes the conclusions in the two earlier working notes, which stay as history:

- [First analysis and the TabProbe test](2026-11-01-multipage-designer/2026-10-30-first-analysis.md) (2026-10-30)
- [Add-in brainstorm and probe results](2026-11-01-multipage-designer/2026-11-01-addin-ideas.md) (2026-11-01)
- [Feature request draft and its history](2026-11-01-multipage-designer/2026-10-30-feature-request.md)

The working copies of these notes live in the project's shared files under `tbUI3/`. The copies here are the ones to keep.

"Verified" means it was read in the BETA 1033 IDE files or seen in one of Shane's test runs. "Inferred" means it hasn't been tested.

## Bottom line

A tbUI3 tab control can behave like VBA's MultiPage in the twinBASIC designer. You click a tab, drop controls onto that page, and switch tabs to see only that page's controls. With the optional add-in, a one-click "New Page" creates a real page. Without the add-in, everything works except creating pages, which you then do by drawing a page from the toolbox.

## 1. The original questions (2026-10-30)

1. **How does the twinBASIC form designer compare with the VBA UserForm designer?** VBA's designer is a live MSForms window: its controls are real and edit themselves in place. twinBASIC's designer is a web page inside the IDE. The compiler runs the real form hidden, takes a picture of each control, and the page shows those pictures as boxes you select and drag (verified: `getImageFromServer` and `gotNewFormSnapshotsResponse` in `ide/main.js`). Our UserControl code therefore runs at design time.
2. **Can the canvas be dark in dark mode?** The area around the form is themeable, and WinUI3 Dark already makes it #1C1C1C with a dot grid (verified). The form itself is the picture of the real form painted with its BackColor. The default `vbButtonFace` stays light grey, because Windows' classic system colours ignore dark mode (verified). A dark BackColor shows dark in the designer. tbUI3 controls follow the Windows app setting through `UI3Theme.IsDarkMode()`, not the IDE theme.
3. **Can a tbUI3 tab control work like MultiPage at design time?** Yes, see the rest of this record.

## 2. How the designer treats UserControls (verified, BETA 1033)

- `ControlContainer` and `EditAtDesignTime` are UserControl properties. A container can't also be Windowless.
- A ControlContainer UserControl is a drop target like a Frame. While you draw, the designer outlines the nearest container under the cursor in red.
- Children are clipped to their container (`.baseControl { overflow: hidden }` in `formDesigner.css`).
- `UserControl.ContainedControls` is implemented (`UCContainedControls` in the VB package).
- Controls with `Visible = False` still show at design time, greyed at 70% opacity.
- **Design-time clicks reach the control.** Click an already-selected control again without dragging, and after about half a second the designer forwards the click (`_designerClick`). Shane's TabProbe run showed `MouseDown` and `Click` arriving with `Ambient.UserMode = False`.
- **The designer follows the control.** When a UserControl moves its ContainedControls at design time, the designer updates their positions (`dynamicChanges`). Verified in the TabProbe run.
- **Container units must match the form.** With the container's ScaleMode set to pixels on a twips form, a newly drawn child jumped to the container's top-left. With twips, children stayed where they were drawn (verified, TabProbeTest-twips). Rule: tbUI3 containers keep the form's ScaleMode, or convert coordinates explicitly.
- **Verbs exist.** `UserControl.Verbs() As String` is set in the UserControl's property sheet, and `Event VerbInvoked(ByVal Verb As String)` catches them. Wayne pointed this out on Discord, and it's confirmed in the VB package. Inferred: they appear on the designer's right-click menu, which we haven't checked yet.
- The designer has a built-in `Dock` property, including Fill. Inferred: pages could use it to size themselves.

## 3. What we tried, in order

| # | Attempt | Result |
| --- | --- | --- |
| 1 | **TabProbe** (2026-11-01): a ControlContainer UserControl with two painted tabs. It hid the other page's children by moving them 75000 to the left (the SSTab trick), using Tag to say which page each child belonged to | Worked. Tab clicks in the designer switched pages, and the designer followed the moves. New children jumped to the top-left, though (units bug, see 2) |
| 2 | **TabProbeTest-twips**: the same probe with the container in twips | Worked fully. Children stayed where drawn, parked at about -74000 when hidden and returned exactly. Shane: "it works, but not exactly how I would want it" |
| 3 | **TabProbeTest-add**: the control calls `UserControl.Parent.Controls.Add("VB.CommandButton", name)` at design time, sets `Container` to its own Extender, then calls Move | **Failed in the way that matters.** Every call succeeded and the button drew inside the container, but the designer didn't know it existed: you couldn't select it, it wasn't in the Properties list, and it wasn't saved |
| 4 | **TabProbeTest-addpage**: the same, but adding the project's own page UserControl (`TabProbeTest.TabProbePage`, then plain `TabProbePage`) | **Failed outright**: -2147467259, "Unspecified error" |
| 5 | Asked Wayne on Discord | He pointed out Verbs (see 2). On creating designer controls from a verb, he said: "I think you're out of luck on that one at the moment at least." |
| 6 | **DesignerBridgeProbe, probe 1**: a throwaway add-in that tries three ways to run JavaScript in the IDE page | `ownerDocument.defaultView.eval()` **works** and returns values synchronously. `addControl`, `doPasteRaw`, `deserializeControls`, `doPaste`, `preparePaste` and `executeIdeCommand` are page globals. A `<script>` element appended through the bridge **didn't run**. An inline `onerror` handler ran, but only asynchronously. The name `globals` doesn't exist as a page global |
| 7 | **Probe 2, first version**: insert a copied page's JSON through the designer's own insert steps, without the clipboard | Created a real page with its own name, but **one Ctrl+Z removed both the pasted page and the page drawn before it**. Cause: no undo checkpoint after the insert |
| 8 | **Probe 2, final**: the same plus `undoPoint(g)`, using the IDE's own `getCurrentFormEditorGlobals()` | **Passed.** The new page was named, selectable and draggable, came out with one Ctrl+Z, and survived save and reopen |

## 4. Approaches considered and rejected

- **Stacking controls and toggling Visible** (Shane's starting point). Rejected: the designer still shows invisible controls, greyed out, so pages would pile up on each other.
- **SSTab-style parking (Left minus 75000) as the shipped design.** Rejected by Shane on 2026-10-30 ("You had me until the big negative left"). The developer sees odd Left values, there are no real pages or `Pages(n).Controls`, and twinbasic issue #1409 shows SSTab tabs are currently unreliable in the designer. Kept only as a probe technique.
- **Assigning pages by Tag number.** This was only a probe shortcut. Neither real design needs it.
- **Creating pages with `Controls.Add`.** Failed (tries 3 and 4).
- **Simulating mouse clicks from the control's verb** (Shane's idea, 2026-11-01). Rejected: the control's code runs in the hidden copy of the form, so it would have to move the real cursor and guess screen positions. Shane: "I don't like that either."
- **Simulating clicks or drags from the add-in.** Rejected for the same reason: fragile.
- **Going through the real clipboard.** Shane objected that it would overwrite whatever the developer had copied. The final probe never touches the clipboard. It feeds JSON straight into the designer's insert steps.

## 5. Decisions

| Date | Decision | By |
| --- | --- | --- |
| 2026-10-30 | Goal: the developer must not be able to tell it isn't a true MultiPage, and must never need documentation to add a page | Shane |
| 2026-10-30 | No SSTab-style negative Left in the shipped control | Shane |
| 2026-10-30 | Model: a host control plus real page containers (UI3TabView with UI3TabPage), the MultiPage model, which also matches WinUI's TabView and TabViewItem. Pages are sized by the host, never by hand | Shane (decision card), after Claude's recommendation |
| 2026-10-30 | File a twinBASIC feature request for design-time control creation | Shane |
| 2026-11-01 | Public posts (GitHub issue, Discord) never mention tbUI3. Examples use the MSForms MultiPage | Shane |
| 2026-11-01 | Briefly: no hacks, wait for twinBASIC. Then reopened by Shane: explore the add-in, which "could become required later" | Shane |
| 2026-11-01 | The add-in route uses the designer's own insert code, with no clipboard and no fake input | Shane and Claude |

Still open, for Shane:

1. Should the add-in be required for tbUI3 containers, or optional with drawing a page from the toolbox as the fallback? (Claude's recommendation: optional, with the fallback always working.)
2. What triggers "New Page": a "+" drawn over the TabView by the add-in, the right-click verb, or both?
3. How do we handle breakage when a twinBASIC beta changes the designer internals? (Recommendation: the add-in checks each function exists before using it, falls back quietly, and gets rechecked each beta, as the IDE themes already are.)

## 6. The working recipe (verified 2026-11-01)

From an add-in, using a hidden tool window to reach the IDE page (as WinUI3IdeStyle does):

```
doc = ToolWindow.RootDomElement.Properties.ownerDocument
result = doc.defaultView.eval(js)          ' runs in the IDE page, returns synchronously
```

The JavaScript that inserts a control (`json` is an array of serialized controls, as produced by `serializeControls(g, controls)`):

```js
var g = getCurrentFormEditorGlobals();   // the open form designer's state
var n = preparePaste(g);                 // targets the selected container
prepareForMultipleChangeProperties(g);
g.selectedControls = deserializeControls(g, json, n.parentContainer, false, false);
changedSelectedControls(g);
doPaste(g, n, g.selectedControls, false);
handleMultipleChangeProperties(g);
undoPoint(g);                            // required: without it, Ctrl+Z also undoes the previous step
```

Notes:

- These are the same steps as the designer's own Paste, minus its clipboard request. That's why they handle naming, the container, recompiling and saving.
- `addControl` (the toolbox-drawing function) was deliberately not used, because the mouse-up after drawing does extra work it skips.
- The probe's copy step only exists to learn the JSON format. The real feature would build a page's JSON itself.
- An injected helper object stays in the page until the IDE restarts. Version it (the probe uses `v:2`) so a rebuilt add-in replaces it.

## 7. Risks

- Everything in section 6 is undocumented IDE internals. Any beta can rename these functions or change the JSON.
- If the add-in becomes required, every developer needs to install it. Shane decided on 2026-10-30 that the add-in ships separately from the package and is never auto-installed.
- The add-in's tbIDE API has no form designer support at all. If this works well, it's worth showing Wayne. It could become the case for an official designer API.

## 8. Public posts

- **GitHub feature request** (Shane posted it): design-time control creation that the designer tracks. Draft and history: [2026-10-30-feature-request.md](2026-11-01-multipage-designer/2026-10-30-feature-request.md). Wayne's Discord answers changed it: verbs already exist, so only the creation part remains.
- **Discord**: Shane posted a conversational version and got the two answers from Wayne recorded above.
- Related issues: #1139 (CodeJock TabControlPage inside TabControl works, the same host-plus-pages model) and #1409 (SSTab tab contents not visible, still open).

## 9. Probe files (`docs/research/2026-11-01-multipage-designer/probes/`)

| File | Purpose |
| --- | --- |
| `TabProbeTest/TabProbeTest.twinproj` | Probe 1, container in pixels (shows the units bug) |
| `TabProbeTest/TabProbeTest-twips.twinproj` | Probe 1, container in twips (works) |
| `TabProbeTest/TabProbeTest-add.twinproj` | `Controls.Add` of a CommandButton (draws, but isn't tracked or saved) |
| `TabProbeTest/TabProbeTest-addpage.twinproj` | `Controls.Add` of a project UserControl (fails), plus the TabProbePage control used by probe 2 |
| `TabProbeTest/TabProbe.body-final.twin`, `TabProbePage.body.twin` | Plain-text class bodies from the last TabProbe build (the `-addpage` version). Each `.twinproj` holds its own complete source |
| `DesignerBridgeProbe/DesignerBridgeProbe.twinproj`, `MainModule.twin` | The add-in probe: running JavaScript, then inserting through the designer (works). The build path installs the DLL into the IDE's `addins` folders, so delete `DesignerBridgeProbe.dll` from both afterwards |

All of these are throwaway and are not tbUI3 code. The `.twinproj` files were generated in the cloud by patching existing projects: tbUI3Test for the TabProbe projects, and the IDE's Sample 11 for the add-in. Shane built and ran them on BETA 1033. The IDE never saved them, so there's no `src/` export, and they aren't covered by the `twinproj-src.mjs` workflow.

## 10. Suggested next steps

1. Shane decides the three open questions in section 5.
2. Claude writes a UI3TabView design spec covering pages, tab headers, sizing, verbs, the add-in "New Page" bridge and the fallback, plus a tbUI3 ROADMAP entry (and a tbIDE ROADMAP entry for the add-in work), for Shane's review.
3. A quick check that UserControl verbs appear on the designer's right-click menu.
