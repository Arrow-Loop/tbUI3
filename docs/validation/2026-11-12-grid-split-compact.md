# Grid toggle/flyout and compact refinements, 2026-11-12

Candidate: tbUI3IDE 1.3.0.11. Implements Shane's three screenshot corrections and follow-up Quick Access padding request.

## Changes

- The full-width Ribbon card is retained. The down/up presentation chevron is positioned inside its bottom-right corner; internal end padding protects the last command instead of reserving an external strip. Simplified commands are vertically centered in the 48px command area.
- Shared presentation metadata hides labels for both Center in Container commands, Lock Controls, Preview, Grid, Page Left/Right, TabView Refresh/Diagnostics and Insert Folder/Other file/Import. Original glyphs, native help/accessible names, callbacks and disabled/checked state remain. New Page and Delete Page keep captions.
- Grid's main native proxy remains a toggle, paired with a separate options arrow in a labeled group. The arrow opens the original native inputs/handlers in a nonmodal top-layer dialog. The duplicate Show Grid row remains hidden; the other five native rows are available.
- The original options body is parked once in a fieldset. The fieldset moves between hidden storage and the flyout; no inputs are cloned. Close, Escape, outside input, blur, style/tab/mode changes and context disabling restore it appropriately. Escape returns focus to the arrow; Alt+Down on the main toggle opens options. Classic/unload restores the body to its original native marker.
- Routine menu polling defers rendering while Grid is being edited. Binding-state updates still run, and disabled form context closes the flyout. Shared fieldset CSS follows the controls outside the Ribbon; the existing native forced-white number-field exception remains scoped.
- Quick Access has exactly 16px internal left padding. Visibility conditions, logo bytes and saved full/simplified preference are unchanged. Hybrid keeps its structure while using the shared compact controls/Grid composition.

## Validation

- Node v22.21.1, jsdom 26.1.0 and installed IDE fixtures: `node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs`: **119 passed, zero failures/skips**.
- Added requested-label/native-action coverage; toggle/arrow independence in Ribbon and Hybrid; full/simplified flyout lifecycles; original input identity, change events, values and checkbox state; keyboard dismissal/focus; disabled context; tab/style/Classic restoration. A regression parses the actual installed main.htm Grid markup and checks all six original input nodes and the hidden duplicate row.
- `node tools/validate-tabview-projects.mjs`: **71 exact mirrors**, references/embedded package, stable IDs, page ownership and CRLF checks pass. Generated IdeToolbarScript.twin and Settings are patched into the canonical add-in project.
- Browser plugin not available; used Playwright with installed Edge against an external temporary localhost fixture. It uses the actual BETA 1044 Grid markup and relevant formDesigner.css rules, with a declared root theme palette. Original controls dispatch native-style change callbacks once; arrow opening does not toggle Grid. Edits survive dismissal and presentation changes; polling with changed menu descriptors does not close the flyout. Five option rows are visible, Show Grid is hidden, and number-field fill overrides native white.
- At 1920px, tested Full and Simplified Form with contextual MultiPage: no horizontal overflow, chevron entirely inside the card, the requested labels hidden and New/Delete Page captions retained. Simplified command centers match the content center within 1px. Quick Access computed padding is 16px. Insert's three requested labels are hidden. Existing 1280px/640px reachability, menu/command, logo, File and preference checks continue to pass. No page/console errors; all requested SVGs decode. Screenshots and runner remain outside the repository.
- Native 1.3.0.11 build/reload and user acceptance remain pending. Shane's screenshots establish previous-version behavior only. No native Win32/COM declarations, public IDs, runtime package or adapter version changed; there are no new pointer-width-sensitive changes.

## Native follow-up

Build/reload 1.3.0.11. Confirm the inset corner chevron, Form fit and compact centering; test Grid main toggle versus arrow, all option values/events, open/close/Escape/disabled context and Classic restoration. Review the icon-only tooltips and the 16px Quick Access left padding. Repeat shared controls in Hybrid and retain previous saved-preference/TabView gates.
