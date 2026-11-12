# Inline contextual MultiPage, 2026-11-12

Candidate: tbUI3IDE 1.3.0.6. Shane requested the existing MultiPage buttons directly to the right of Grid instead of opening a nested ribbon.

## Implementation

Both Ribbon and Hybrid use the same context-group function. With the existing currentHost detection satisfied, it creates the MultiPage group, adds the six discovered native page-command proxies and inserts the section immediately after Grid. The launcher and its unused CSS are removed. The existing signatures refresh the group when host selection changes. No control/package code, native hooks or pointer-width-sensitive declarations were changed.

## Validation

- Node v22.21.1, jsdom 26.1.0, installed IDE main.js/formDesigner.css fixtures: `node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs` reports 103 passed, zero failed/skipped.
- Context regression covers Ribbon and Hybrid: initial absence; host/page/child selection; exact six source buttons in order; immediate adjacency after Grid; no nested launcher; one native dispatch; preserved Form/Grid content; live disabled state; tab switching; unrelated/empty selection; restoration in Classic.
- `node tools/validate-tabview-projects.mjs`: 71 exact mirrors plus package reference, embedded package, stable IDs, page ownership and CRLF checks pass.
- Generated script is regenerated from source and patched with Settings into the canonical add-in project. Existing generated-script tests verify source/CSS inclusion, parsing, image bytes and CRLF.
- Browser plugin not available. A temporary Playwright/Edge localhost fixture at 1280×720 validates a nonblank page with the expected title, MultiPage physically to the right of Grid in both layouts, six visible commands, native dispatch retaining Form content, contextual selection changes and absence of the launcher. Existing width/logo/Options fixture interactions also pass. No page/console errors. Runner and screenshots remain outside the repository; the MultiPage screenshot shows a renderer fixture, not the compiled IDE.
- Native twinBASIC build and rendered acceptance were not performed. Existing adaptive collapse/keytips and broader TabView acceptance remain open. No mobile viewport was tested for this desktop IDE change.

## Native follow-up

Build/save the 1.3.0.6 add-in in twinBASIC. On Form, select a MultiPage host or its page/child, verify MultiPage appears immediately after Grid, try each page command and confirm the remaining Form commands stay available. Deselect or select an unrelated control and verify the group disappears. Repeat with Hybrid.
