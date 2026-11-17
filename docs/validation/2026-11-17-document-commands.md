# Document commands — 2026-11-17

Candidate: tbUI3IDE 1.3.0.15.

- Save Document now enables for a dirty, writable selected CodeEditor/UIDesigner and saves through the IDE's per-editor openEditors.save(node) route. It no longer invokes BETA 1044's deliberately disabled tbEditor_Save placeholder. Other dirty documents remain unsaved; native writers retain failure/dirty handling. Unsaved projects use native Save As, retaining the originally clicked document across tab changes and skipping it if closed before the callback.
- Form / Code now requires an existing counterpart in the native file tree, using the native handler identity and lookup order for .tbform, .tbcontrol, .tbppage and .tbreport. Standalone modules and unrelated editors disable the replacement button. The same predicate guards dispatch; native global command definitions and Classic toolbar handlers are untouched.
- Both corrections apply to Code/Form in Ribbon and Hybrid, full/simplified. 135 automated tests, 71 exact project mirrors and eight Edge document-command flows pass. Checks exercise actual installed native code/form writers, switch helpers and the generated add-in script; failed/successful writes and Save As targeting are covered. Native compiled-host disk/save/reopen confirmation remains pending. Evidence: docs/validation/2026-11-17-document-commands.md.

## Root cause and implementation

Installed BETA 1044 main.js defines tbEditor_Save with defaultContext `0 & (activeEditor || activeDesigner)` and an internal action that only shows `save individual document feature is currently disabled.` Earlier tests mocked that command as enabled and therefore missed the native limitation. Merely overriding its enabled flag would not save anything.

The installed openEditorsCollection.save(node) delegates one dirty node to its existing fileHandler.save. Code uses the Monaco model's current value and native version bookkeeping; forms serialize the native current form state. Both use the native fs.writeFile request/callback and update the dirty state after success. The add-in now routes its Save Document presentation identity to this existing path, with a writable dirty code/form guard. It neither forces dirty flags nor substitutes Save All. An unsaved project uses native Save As before submitting the captured node, checking it remains open. Cancellation leaves it unsaved.

The installed switch command only checks activeEditor/activeDesigner before invoking toggleFormDesign. It does not test whether a code module has a form. The new replacement proxy gate matches the native file-handler identity and counterpart lookup. It supports forms, user controls, property pages and reports and remains disabled when no counterpart exists. Native handlers/global command definitions are preserved.

## Validation performed

- 135 tests passed, zero skipped/failed, with installed IDE fixtures. Regression tests extract/evaluate the real installed editor collection, code/form file-handler objects, native switch helpers and disabled Save placeholder without redistributing IDE source.
- Actual native writer tests capture the fs.writeFile boundary: one selected file is submitted, other dirty tabs stay dirty, failed callbacks do not clear changes and successful callbacks update native dirty state. Save As targeting survives selection changes and skips a closed target. Clean/read-only/no-project/no-selection cases disable saving.
- Native counterpart tests cover both directions for .tbform/.tbcontrol/.tbppage/.tbreport, plus unrelated modules and no selection. All eight Code/Form × Ribbon/Hybrid × full/simplified UI paths verify dirty-state updates and counterpart gating.
- A generated-script regression reconstructs the actual IdeToolbarScript.twin payload, captures its API wiring and verifies Save Document bypasses the real disabled placeholder while ordinary commands retain native dispatch.
- Browser plugin not available; the existing external Playwright/installed Edge fixture uses actual installed header/toolbar markup, native writers and switch functions. Eight document flows pass at 1920x720: selected-only write, failed/successful completion, edit-again enabling, paired switch and standalone-module disabling. Page identity/content, error-overlay absence, console/page errors, screenshots and interactions pass. Existing Classic, profile, inset and theme checks in the runner pass.
- Regenerated IdeToolbarScript.twin, patched revision 15 Settings and canonical project, and verified all 71 exact mirrors/CRLF/IDs/embedded package checks. Package 65 and adapter v8 are unchanged.

Local browser runner/screenshot remain outside the repository: .workspace-tools/document-commands-qa.cjs and document-buttons-module.png.

## Native follow-up

No compiled add-in or real project disk write was performed by these fixtures. Rebuild/reload in twinBASIC and verify save/reopen of edited code/form files, other dirty tabs, Save As cancellation/completion and switching in both replacement modes/presentations. Native backend persistence and failure UI remain compiled-host acceptance gates; source/protocol success alone does not close them. Classic's original toolbar/global commands remain native-owned.
