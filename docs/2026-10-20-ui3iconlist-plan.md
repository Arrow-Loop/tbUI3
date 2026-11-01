# UI3IconList plan: an ImageList for tbUI3 icons

Status: **approved by Shane on 2026-10-20.** L1 is in 1.0.0.52 and works (Shane, 2026-11-01); 1.0.0.53 fixes the grid flicker on scroll; 1.0.0.56 fixes the grid opening grey. L1 done (1.0.0.57). L2 is in 1.0.0.58 as a temporary `SpikeFind` property on UI3Button rather than a throwaway control, and leaves the dropdown question for later. L2 result (Shane's log, 2026-11-01): `UserControl.Parent.Controls(name)` works at design and run time, including in ReadProperties; `UserControl.ParentControls` fails in twinBASIC. 1.0.0.59 removes the spike. Next: L3. Written 2026-10-20, from the decisions recorded in ROADMAP.md on 2026-10-19 and the pass 5 icon system. Nothing here is built.

## Goal

A dev drops a UI3IconList on a form, fills it with keyed icons of any kind (Segoe Fluent, Fluent UI System, Additional Icons, or their own image files), and any icon-capable tbUI3 control shows one of them by key: `UI3Button1.IconKey = "save"`. The list stores one copy of each icon however many controls use it, and a built app needs no icon library, as with pass 5.

Out of scope:
- Sharing one list between forms. Copy the list control instead, or set an icon from another form's list in code.
- Icons on controls other than UI3Button. The contract below is written so they can join later.
- Editing images (cropping, recolouring) inside the list's page.

## Decisions already made (ROADMAP, Shane, 2026-10-19)

- **Component.** It shows as a small box in the designer and is invisible at run time, like VB6's ImageList.
- **Scope.** One list per form.
- **Linking.** A control names its list through an `IconList` property: a typed name in the Properties pane, or `Set x.IconList = list` in code. If the form has exactly one list, controls use it by default. A dropdown of the form's lists is wanted if twinBASIC allows it (to check).
- **Own images.** The list's page can import SVG (Direct2D) and anything WIC decodes (PNG, ICO, BMP, JPEG, GIF, TIFF built in; others only where Windows has a codec). `UI3IconImage` already recognises all of these. Only monochrome SVGs (#212121 or currentColor) follow the text colour. Large images make the form bigger, so the page shows each icon's size.
- **Every control.** The list, like the rest of the icon system, works for any tbUI3 control with icon properties.

## Proposed design (for Shane to confirm)

### The list

| Member | Kind | Notes |
| --- | --- | --- |
| `Add(Key, Data, Optional Source)` | Method | Adds an icon from bytes. Keys are unique, case-insensitive, and not empty. Adding an existing key replaces that icon. |
| `AddIcon(Key, Icon)` | Method | Adds a Segoe Fluent glyph by its `UI3Icon` value. Stored as the code point, not as bytes. |
| `Remove(Key)`, `Clear` | Methods | |
| `Count`, `Exists(Key)`, `Key(Index)` | Read-only | |
| `IconData(Key)`, `IconSource(Key)` | Read-only | For copying an icon out to a control without the list. |

Saved with the form: each entry's key, kind, and either its glyph code or its bytes and source name.

### Controls

Two new contract members join the pass 5 contract:

| Member | Kind | Notes |
| --- | --- | --- |
| `IconKey` | String, read/write | Draws the list's icon with that key. Empty means no list icon. |
| `IconList` | read/write | The list to use: a name typed in the pane, or an object in code. Empty means "the form's only list". |

Precedence stays "the last icon set wins": setting `IconKey` clears `Icon`, `IconGlyph` and `IconData`, and setting any of those clears `IconKey`. `IconSize` and the recolouring rule apply to list icons exactly as to stored ones.

A missing key or a missing list draws no icon, and raises no error at run time, so a form still loads if a list entry was removed. The designer shows nothing for it either; the Properties pane still shows the key, so the dev can see what is wrong.

### Drawing and updates

The control doesn't copy the list's bytes. It asks the list for the entry when it paints, through a small shared registry in a module (list by form and name). When an entry changes, the list bumps a counter in the registry and refreshes the form's controls that use it, so a changed icon shows at once in the designer and at run time.

### The list's page

The page reuses the picker: the same tabs, search and grid, plus a list pane down the side with the list's entries (icon, key, kind and size in bytes). It has buttons to add the picked icon under a key, import a file, rename a key, remove an entry, and move entries up and down. Apply writes the whole list through the designer bridge, the same way pass 5 does for one icon.

Open: whether the button's own picker also gets a "List" tab to choose an `IconKey`, or whether typing the key in the pane is enough at first. Proposal: typing first, a List tab later.

## Builds, in order (Shane tests each in win32)

1. **L1, the picker draws with UI3IconImage.** Move the picker's Fluent and Additional Icons grid drawing onto `UI3IconImage`, which the list's page will share. No visible change. Test: scroll each tab, pick, Apply, reopen; compare with the current build.
2. **L2, spike: finding the list by name.** A throwaway control (not shipped) answers two questions: can a button find a sibling by name at design time and at run time, and does twinBASIC allow a dropdown of names for a property in the pane. Being invisible at run time is already proven: UI3FormTheme sets `InvisibleAtRuntime` in its `.tbcontrol` (Shane, 2026-10-20), and the list does the same.
3. **L3, the list in code.** `UI3IconList` with the members above, saving and loading, plus `IconKey` and `IconList` on UI3Button. Test in tbUI3Test with no page: add icons in code from `LoadResData` and from a Segoe value, assign keys, save and reopen, remove a key, switch dark and light.
4. **L4, the list's page.** The picker plus the list pane, import, and Apply through the bridge. Test: fill a list from every tab and from a file, set keys on buttons, Apply, OK, Cancel, reopen.
5. **L5, closing checks.** An x64 review of the pass's changes, then the win64 smoke test (open a form, open both pages, apply, reopen, build and run the EXE with `%LOCALAPPDATA%\tbUI3` renamed).

Each build bumps the package version and updates CHANGELOG.md, ROADMAP.md, HANDOFF.md and the package CHANGELOG. Results are recorded only once Shane has seen them. The property page log stays on until the list's page is done.

## Risks and open checks

- **Invisible at run time.** Not a risk: UI3FormTheme already uses `InvisibleAtRuntime`.
- **Finding the list.** Shane's 1.0.0.58 log (`tbUI3Test/tbUI3-propertypage.log`, 2774b89), with `UI3Button2.SpikeFind = "UI3FormTheme1"`: `UserControl.Parent.Controls(name)` returned the sibling as `UI3FormTheme` at every moment tested: the Let, ReadProperties on reopening the form, the first Paint, and at run time both ReadProperties and the first Paint. Its own member read worked late bound (`ThemeMode`) and held typed (`Dim theme As UI3FormTheme: Set theme = found`). `UserControl.ParentControls` fails in twinBASIC (0 items, -2147467262 No such interface supported), so tbUI3 must not use it. Caveat: the buttons' ReadProperties ran in reverse file order (UI3Button4 first), and UI3FormTheme1 is last in the form file, so it probably loaded before UI3Button2. The ReadProperties success does not prove that a sibling loaded later is visible yet, so L3 looks the list up when it is first needed (paint), and never caches a failed lookup. Not tested: `For Each` over `Parent.Controls` (needed for "the form's only list"), and a dropdown of names in the Properties pane (left for later, as planned). A named list is therefore found with `Parent.Controls(name)` on first use. The registry is still needed for the single-list default (unless `For Each` over `Parent.Controls` proves to work) and for telling controls an entry changed.
- **The designer bridge.** Applying a whole list needs a third pending slot. It copies the existing pattern; the existing members stay untouched.
- **Form size.** A list with many large images makes the form file big. The page's size column is the only guard; there is no limit.
- **Copying a list to another form.** The copy keeps its entries, but controls on the new form link to it by name, so a renamed list needs `IconList` updated.
