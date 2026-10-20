# Pass 5 plan: one icon system for every control

Status: **approved by Shane on 2026-10-19.** Build 5a is in 1.0.0.42 (validated); 5b is in 1.0.0.43 (validated); 5c is in 1.0.0.44 (validated); 5d passed in win32 with 1.0.0.45 (win64 to confirm). win64 Apply fails (the designer host dies when the dialog closes); a plain twinBASIC repro works in win64, so it is tbUI3's. 1.0.0.51 stops the picker relaying itself on the empty teardown SelectionChanged, the likely cause.
Written 2026-10-19, from the decisions recorded in ROADMAP.md that day.

## Goal

A dev can pick any icon from the picker (Segoe Fluent, Fluent UI System or Additional Icons), click Apply, and the control draws it. The pick is saved with the form, so a built app draws it on a PC that doesn't have the icon library.

The same picker, storage and drawing must work for any tbUI3 control with icon properties. UI3Button is the first control to use them.

Out of scope for this pass:
- The `UI3IconList` component.
- A dev's own image files in the picker.
- Icons on controls other than UI3Button.
- A non-blocking download in Setup.

## Decisions already made

- **IconSize** (Shane, 2026-10-19). It is in DIPs and defaults to 20, WinUI's SymbolIcon size. It means the icon fills that square, whatever kind it is:
  - a Segoe glyph uses it as the font size;
  - an SVG is scaled to it;
  - a PNG is shrunk to it with high-quality cubic sampling.
- **Fluent file choice.** A Fluent pick stores the file whose size is closest to IconSize at the moment of the pick. Only one copy is kept.
- **One active icon.** A control never has two icons at once.
- **Run-time changes.** Pass 5 adds copying an icon from another control (`Button1.IconData = Button2.IconData`), and loading SVG or PNG bytes in code.
- **Older Windows.** Before Windows 10 1703, which has no Direct2D SVG support, a stored SVG draws nothing.
- **Names.** Stored icons show a read-only name. Fluent icons use Microsoft's own name, such as `ic_fluent_arrow_down_20_regular`; Gallery images look like `gallery_Acrylic`. There is no enum.
- **The designer bridge.** Its existing parts stay untouched. Library picks get a separate pending slot next to them.

## The icon contract

These are the properties and methods every icon-capable control implements, with these exact names. The picker, the shared drawing and the bridge only talk to these, by name (`CallByName`), so they never need to know the control's type.

| Member | Kind | Notes |
| --- | --- | --- |
| `Icon` | `UI3Icon`, read/write | Exists today. Setting it clears any stored icon. |
| `IconGlyph`, `IconFontName` | String, read/write | Exist today (a custom glyph). Setting `IconGlyph` clears any stored icon. |
| `IconSize` | Single, read/write | New. Default 20. Applies to every kind of icon. |
| `IconData` | Variant holding a Byte array, read/write | New. The stored SVG or PNG file. Assigning it from another control copies the icon. Empty means no stored icon. A Variant so that copying and clearing need no array plumbing in the caller. Hidden from the Properties pane if it misbehaves there (to check in 5b). |
| `IconSource` | String, read-only | New. The readable name shown in the Properties pane, for example `ic_fluent_arrow_down_20_regular`, `gallery_Acrylic`, or `file:save.svg`. |
| `LoadIcon(Data() As Byte, Optional Name As String)` | Method | New. Stores an SVG or PNG from bytes, for example from `LoadResData` in the app's own resources. |
| `LoadIconFile(Path As String)` | Method | New. The same, from a file. `IconSource` becomes `file:<name>`. |

Saved with the form: `IconData` and `IconSource`.

Recolouring (changed in 5b): there is no `Recolor` flag. An SVG that uses the Fluent ink `#212121` or `currentColor` takes the text colour; every other SVG (including the Fluent Color style) and every bitmap keeps its own colours.

Precedence rule: the last icon set wins and clears the others. That means setting `Icon`, `IconGlyph`, `IconData`, or calling `LoadIcon`.

## Shared code

- **New `UI3IconImage` class.** It holds the bytes, the kind (SVG or PNG, recognised from the first bytes), whether to recolour, and per-render-target caches (an SVG document per colour, a bitmap). Every control keeps one instance. Its drawing code comes from the picker's library tabs (1.0.0.39 to 1.0.0.41), moved here rather than copied. (5b: the class is written with its own drawing. The picker's tabs still use their own drawing code; moving them onto UI3IconImage is a later cleanup, not needed for 5c.)
- **Content layout.** `DrawButtonContent` (UI3Direct2D) measures a glyph by its text box today. It gets split into a layout step, which places an IconSize square and the caption, and a draw step for each kind of icon. Any control that shows "icon plus text" calls the same layout.
- **Glyph placement (5b).** Only images use the IconSize square; a Segoe glyph keeps its own text-box measurement, so existing buttons don't shift.

## The picker

- Library picks enable Apply (`Me.Changed = True` on the user's click, never in `SelectionChanged`).
- `ApplyChanges` writes a Segoe pick through `Icon`, as now. A library pick goes through a new contract call that sets the data, the source and the recolour flag together.
- The designer bridge gets a second slot in UI3Icons: `SetPendingLibraryIcon` and `TakePendingLibraryIcon`, keyed the same way. The control's `ReadProperties` takes it next to the existing `TakePendingIcon` call. The existing bridge members are not changed.
- The page opens on the tab of the control's current icon, with that icon selected. It reads `IconSource` and finds the icon in the library when the library is installed.
- **Early test: which property was clicked.** Result (5a, 2026-10-19): twinBASIC raises `PropertyPage_EditProperty` with the property name ("Icon"). A control with two icon properties needs to know which "..." was clicked. VB6 raised `PropertyPage_EditProperty(PropertyName)` for that. Since BETA 1008 honours the per-property link, the page logs whether twinBASIC raises it. The result decides how later controls with two icon properties work; UI3Button has only one.

## Builds, in order (Shane tests each)

1. **5a, IconSize and the EditProperty test.** Add `IconSize` to UI3Button (glyphs only for now), plus the log line for `PropertyPage_EditProperty`. Test: IconSize 20, 32 and 48 on icon-only and icon-plus-caption buttons; check for any shift at 20; open the picker from Icon's "..." and read the log.
2. **5b, shared drawing and loading in code.** Add `UI3IconImage`, the layout split, `IconData`, `IconSource`, `LoadIcon` and `LoadIconFile`, plus saving and loading in UI3Button. Test in tbUI3Test, with no picker involved:
   - load an SVG and a PNG from files;
   - copy one button's icon to another;
   - save, close and reopen the form;
   - switch dark and light; use an Accent button.
3. **5c, Apply from the library tabs.** Add the bridge slot, Apply, and reopening on the current pick. Test: pick from each tab, then Apply, OK, Cancel and reopen; change IconSize after a pick; then go back to a Segoe icon and to None.
4. **5d, built-app check.** Build tbUI3Test to an EXE, temporarily rename `%LOCALAPPDATA%\tbUI3`, run the EXE, and check every picked icon still draws. Then rename the folder back. Repeat in win64.

Each build bumps the package version and updates CHANGELOG.md, ROADMAP.md, HANDOFF.md and the package CHANGELOG. Results are recorded only once Shane has seen them. The diagnostic log stays on.

## Risks and open checks

- **Byte arrays as properties.** Whether twinBASIC shows or hides a Byte array property in the Properties pane, and whether `Button1.IconData = Button2.IconData` works across controls in the designer, is unknown until 5b.
- **Form size.** Large PNGs or SVGs make the form file bigger. Library icons are small: Fluent SVGs are about 1 to 3 KB, Gallery PNGs a few KB.
- **The bridge.** The cause of the designer reload is still not understood. The new slot copies the existing pattern exactly. If it misbehaves, the log shows it.
- **Fluent sizes.** Picking the closest size needs a new library accessor (the entry for a given icon, style and size).
