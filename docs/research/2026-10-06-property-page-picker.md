# Property-page picker: research notes

Status: spike run on Shane's PC, 2026-10-06 (BETA 997). Results are below.

## Goal

Shane wants a `...` button in the Properties pane for hard-to-guess options. The first one is a searchable icon catalog, similar to Word's Symbol dialog. The button opens a visual picker, and a developer who already knows the value can still type it directly.

## What the twinBASIC sources show

Sources checked: the twinbasic/documentation repository and the VB package sources it documents.

1. **PropertyPage is a real item type.**
   - The Project Explorer has an "Add Windows PropertyPage" item (docs `IDE/Project Explorer.md`).
   - The Feature Flags list includes "PropertyPages support" (`IDE/Project Settings.md`).
   - The VB package contains `PropertyPage.twin`, `BasePropertyPage.twin` and the standard Font, Color and Picture pages.
2. **`UserControl.PropertyPages` holds page names, not CLSIDs.** It is declared as `[CustomDesigner("designer_PropertyPages")] Public PropertyPages() As String`.
   - `ISpecifyPropertyPages.GetPages` looks up each name's CLSID through `RuntimeGetPropertyPageClsidByName`.
   - This code sits under `#If FEATURE_PROPERTYPAGE`.
3. **Per-property mapping exists in the runtime.** `IPerPropertyBrowsing.MapPropertyToPage` calls `RuntimeMapDispIdToPropertyPageClsid`. A source comment says the mapping is set with `[PropertyPage("PageName")]` on the property, or with VB6's `VB_Invoke_Property` attribute.
4. **The IDE's own `...` editors use something else.** The multi-line ToolTipText editor and the ImageList "Custom Properties..." both go through a private `ITwinBasicDesignerExtensions` interface, which packages cannot implement.
5. **It may not have worked in 2023.** A 2023 documentation finding says PropertyPages were "not implemented" at that time. This needs checking on BETA 997.

## Unknown

- Does the twinBASIC IDE Properties pane call `MapPropertyToPage` and show a `...` button? This is the key question.
- What does a non-empty `"PropertyPages"` entry in a `.tbcontrol` look like? It is probably the page names.

## Proposed spike (small, on Shane's PC)

1. In tbUI3, add one PropertyPage containing a single label.
2. Turn on the PropertyPages feature flag if one is needed.
3. Add `[PropertyPage("UI3IconPage")]` to `UI3Button.Icon`.
4. Build, import into tbUI3Test, select the button and look for a `...` next to Icon. Also check the button's right-click menu for "Properties".

What the result means:
- **If a `...` appears:** build the real searchable picker (a grid of glyphs, with search by name, number or code), and reuse the pattern for other complex options.
- **If only the right-click "Properties" page works:** the picker is still usable, just one click further away.
- **If neither works:** fall back to a standalone "tbUI3 Icon Browser" tool that copies the chosen value.

## Spike result (2026-10-06, BETA 997, Shane's PC)

Shane added a PropertyPage named `UI3IconPage` to tbUI3 through Project Explorer → Add → Add Windows PropertyPage. It held a single label. He then linked it to UI3Button in two ways and rebuilt.

- **Feature flag:** "PropertyPages support" was already on by default.
- **Control-wide link works.** He selected the UserControl in `UI3Button.tbcontrol`, opened `PropertyPages`, and ticked `UI3IconPage` in the IDE's own "Select Property Pages" dialog. That list also offers StandardFont, StandardDataFormat, StandardColor and StandardPicture.
  - In tbUI3Test, the Properties pane then showed a `(Custom)` row reading `{ PropertyPage }`, with a `...` button.
  - Clicking `...` opened a "UI3Button1 Properties" dialog with the page and OK, Cancel and Apply buttons.
- **Per-property link does not work.**
  - `[PropertyPage("UI3IconPage")]` on `Icon` (an enum) left the normal dropdown.
  - Moving it to `IconSpacing` (a Single, which has no editor of its own) showed no `...` either.
  - So the data type is not the cause: the IDE does not act on the per-property mapping at all in this beta.

## Decision direction

- Keep typed entry as it is, through the Icon dropdown.
- Put the visual catalog (a searchable glyph grid, searchable by name, number or code) on a tbUI3 PropertyPage reached through `(Custom)` → `...`.
- Keep the `[PropertyPage]` attribute out of shipped code until the IDE honours it. Raise a feature request with twinBASIC so that the IDE honours `IPerPropertyBrowsing.MapPropertyToPage`.
- The spike edits stayed on Shane's PC and were not committed.

## Apply result (2026-10-07, BETA 997, Shane's PC)

- The picker page (1.0.0.5 candidate) opened from `(Custom)` → `...` once `Me.Changed = False` was removed from `SelectionChanged`. Setting `Changed` during `SetObjects` raises "Automation error" 80004005.
- A diagnostic in `ApplyChanges` showed that Apply runs, `CallByName ctl, "Icon", vbLet, value` changes the live button (it reads back as the new value), and `Err` holds -2147352570 "Unknown name" afterwards.
- After closing and reopening the form designer, Icon was back to its old value. The canvas also never redrew the new icon.
- Likely cause (inferred, not proven): `UserControl.PropertyChanged` in the VB package calls `GetIDsOfNames` for the property name on the outer class to raise `IPropertyNotifySink.OnChanged`. That lookup fails, the error is swallowed by its `On Error Resume Next` (and stays in `Err`), so the IDE never learns of the change and reloads the designer from its saved copy.
- Status at that point: parked and reported to twinBASIC by Shane.

## Workaround result (2026-10-07, win32)

- The IDE's `main.js` shows the form designer keeps each control's properties itself (`d.properties`) and replaces them with the `serialization` the backend sends back with each control image. Package UserControls are hosted through `ActiveXExtender`; its `InvokePropertyExtension("Custom")` opens the page and returns `MadeChanges = True`.
- Build 537850e added a "pending icon" bridge, re-applied on the next design-time `ReadProperties`, plus a log file. With it, the picked icon was saved: the backend called the live control's `WriteProperties` right after Apply, which wrote the new value, and the designer asked to save the form. The bridge's fallback never ran.
- Earlier builds differed on that path only in that `Icon`'s `Property Let` now reads `Ambient.DisplayName`. That this matters is a guess. The bridge stays until an experiment shows which piece is needed.
