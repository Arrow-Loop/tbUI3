> Archived working note, copied from the project's shared files on 2026-11-01. The conclusions are superseded by [the investigation record](../2026-11-01-multipage-designer.md).

# Feature request draft: let UserControls add child controls in the designer

Drafted 2026-10-30 and revised 2026-11-01, at Shane's request, so it doesn't mention tbUI3 or WinUI. The only example is the Microsoft Forms 2.0 MultiPage. Shane posts it at https://github.com/twinbasic/twinbasic/issues. Nothing here has been posted.

Copy everything in the block below as the issue body. Suggested title: **Designer: let a UserControl add child controls and context-menu verbs at design time (enables MultiPage-style containers)**

```markdown
## Summary

I'd like a UserControl with ControlContainer = True to be able to do two things: (1) add a right-click menu item in the form designer (a "designer verb"), and (2) in response, add a child control inside itself, exactly as if the developer had drawn it from the toolbox. With that one feature, UserControls could work like the Microsoft Forms 2.0 MultiPage at design time.

## The MultiPage experience I'm after

In the VBA UserForm designer, the MultiPage is a single control that holds a set of Page objects, and each Page is its own container:

- You right-click a tab and choose New Page, and a page appears, already sized to fit the MultiPage.
- You click a tab and drop controls onto that page. Their Left and Top are relative to the page.
- You click another tab and see only that page's controls.
- Every page is always the same size as the MultiPage. The developer never sizes or positions pages.

A developer who has never read any documentation can work all of this out, because the whole workflow happens on the control itself.

## What a UserControl can do today

A UserControl can get most of the way there with a host control plus page controls. The host is a ControlContainer UserControl. Each page is a second ControlContainer UserControl drawn inside the host. The host snaps every page to fill its client area and shows only the selected one. Each page is a real container, so the controls really belong to their page, as in MultiPage.

The gap is creating pages. In the MultiPage you right-click and choose New Page. Here, the developer has to know to drag a separate page control from the toolbox into the host. There's nothing on the control to tell them that. The same gap applies to any container with fixed regions, for example a split panel that should arrive with its two halves already in place.

## Why not just do it the SSTab way?

SSTab avoids the page-creation problem because it has no page objects. It's a single container, and you add tabs by changing its Tabs property. A UserControl could copy that today. The cost is how SSTab hides the other tabs: it moves their controls 75,000 twips to the left. Every developer using the control then sees that trick:

- **Odd property values.** A control on a hidden tab shows a Left of about -74,000 in the Properties window and in code. Reading or setting Left at run time gives the wrong answer unless the developer knows the trick and allows for the offset.
- **No real pages.** Every control's Container is the tab control itself, not a page. There's no Pages(n).Controls collection, and nothing in the object model says which tab a control is on. The control has to track that itself, usually through Left or Tag.
- **Confusing designer selection.** Choose a hidden-tab control in the Properties window's control list and it is selected somewhere off-screen, with nothing visible to drag.
- **Fragile in twinBASIC today.** #1409 (still open) reports that controls on SSTab tabs aren't visible. Wayne said the fix depends on changes to how the form designer works.

MultiPage gets this right because each page is a real container. Controls keep normal coordinates relative to their page, Pages(n).Controls works, and hiding a page hides its controls with no position tricks. A host-plus-pages UserControl can match all of that today. The only missing piece is creating pages from the control itself, which is what this request covers.

## Proposal

1. **Designer verbs already exist.** A UserControl's Verbs property sets them, and the VerbInvoked event catches them, so "New Page" and "Delete Page" are covered. What's missing is what happens inside the handler:

2. **Let design-time Controls.Add create real designer controls.** This already half works. In BETA 1033, a UserControl at design time can call `UserControl.Parent.Controls.Add("VB.CommandButton", "cmdNew")`, set its Container to its own Extender, and Move it, all with no errors. The new button even draws inside the container. But the designer doesn't know it exists: you can't select or move it, it isn't in the Properties window's control list, and it's gone when the form is reopened. Adding one of the project's own UserControls the same way fails outright: `Controls.Add("MyProject.TabPage", "pgNew")` raises error -2147467259 (Unspecified error), with or without the project prefix. I'd like a control added this way during design time to become a normal designer control: named, selectable, saved with the form, and undoable, just like a toolbox drop. Removing one (Controls.Remove) should work the same way, which would cover "Delete Page".

3. **Optional:** let the same verbs run when the developer clicks an area the control marks as a button at design time, for example a "+" tab next to the last page.

## What already works (BETA 1033)

ControlContainer UserControls accept drops. UserControl.ContainedControls lets the host find its pages. Clicking a selected UserControl again reaches its MouseDown and Click events at design time (the SSTab fix). When the control moves its contained controls at design time, the designer updates to match. I've tested both. Controls.Add also runs at design time, but its result isn't tracked or saved by the designer (see point 2). That's the missing piece.

## Related issues

- #1139: a CodeJock TabControlPage inside a TabControl, the same host-plus-pages model, works in the designer.
- #1409: controls on SSTab tabs aren't visible (see above).

## Workaround today

The developer drags the page control from the toolbox into the host, and the host snaps it into place. It works, but it isn't discoverable.

Thanks for considering it. I'm happy to test builds.
```

## Notes for Shane

- Duplicate check, 2026-11-01: web searches of twinbasic/twinbasic found no existing request for designer verbs or for adding child controls at design time. GitHub's own issue search wasn't available to this session, so a quick search on GitHub before posting is still worthwhile. Related issues found: #1139 (CodeJock page-in-tab precedent, works) and #1409 (SSTab tab contents not visible, open; Wayne says the fix depends on form designer backend changes).
- Updated 2026-11-01 after the TabProbe run: design-time clicks and child moves are now stated as tested, so no hedge remains to change.
- `MyProject.TabPage` and `TabPage3` are only example names.
- 2026-11-01: point 2 was rewritten after the TabProbeTest-add run. Controls.Add works at design time, but the added control can't be selected, doesn't appear in the Properties list, and isn't saved (the form's control count was back to 2 after reopening).
- 2026-11-01, TabProbeTest-addpage: Controls.Add of a project UserControl (TabProbeTest.TabProbePage, and TabProbePage) failed at design time with -2147467259 Unspecified error. Added to point 2.
- 2026-11-01: Wayne replied on Discord that UserControls already support verbs (UserControl.Verbs, set in the UserControl's property sheet; VerbInvoked(Verb As String) event). Confirmed both exist in the BETA 1033 VB package. Point 1 was rewritten, so the request is now really just point 2. Not yet tested whether the tB designer's own right-click menu lists the verbs.
