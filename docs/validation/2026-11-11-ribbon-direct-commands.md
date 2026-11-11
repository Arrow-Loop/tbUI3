# Direct ribbon commands and editor context, 2026-11-11

Candidate: tbUI3IDE 1.3.0.3. Native control package 1.0.0.65, page adapter v8 and the consumer project remain unchanged.

## Request and implementation

Shane called 1.3.0.2 a marked improvement and supplied the eight classic alignment/size glyphs for direct Form placement. Further requests: expose native Add options directly on Insert; dismiss dropdowns on outside clicks; align all full-size glyphs to the top; hide quick access inside File; remove the duplicate visible Zoom label; follow Code/Form editor tabs; and restore the classic Grid toggle instead of a Show Grid checkbox.

Current knowledge main AGENTS and linked workflow/tooling/UI/packaging standards and project records were consulted. The project-specific tbui3-dev restriction remains authoritative. No unrelated runtime package/control changes were made.

### Live native producer expansion

`js/native-toolbar-context.js` isolates trusted producer source in its original JavaScript realm using that producer's Function constructor, shadowing only showContextMenu. Actual asynchronous callback closures retain the private descriptor sink; no temporary global menu replacement is needed for expansion. Form uses native Align/Make Same Size hover producers, and Insert uses the actual showContextMenuAddComponent function, which obtains project settings asynchronously and includes getDynamicFormAddMenuOptions.

Form's classic Left/Top/Right/Bottom and Widest/Tallest/Narrowest/Shortest commands reuse their original native toolbar nodes/handlers/glyphs, in classic order. Other native child commands remain directly accessible. Insert groups native options by task, with concise captions and full native tooltips. Unknown/future children remain available. Parent context is inherited and native command/source state remains authoritative.

Captures are cached, with active expanded groups refreshed on menu epochs. Results delivered after restoration/mode change are ignored. A producer incompatible with isolation (bound/native function text, changed private lexical dependencies or structural API changes) retains the original native parent fallback; this does not claim compatibility with arbitrary future private-API replacements.

### Interaction and state

Auto popovers provide browser light-dismiss. Window capture listeners for pointerdown and mousedown run before native document handlers, dismissing outside the popup/its anchor without preventing the original click. Empty ribbon surfaces, browser toggle-to-closed, blur and repeated anchor clicks are covered. [HTML popover standard](https://html.spec.whatwg.org/multipage/popover.html) and [Chrome overview](https://developer.chrome.com/blog/introducing-popover-api/) define native light-dismiss semantics. The legacy max-z fallback and top-layer teardown remain.

All large buttons use one top-aligned 28px glyph / 28px caption / 10px optional-chevron grid. Two 2px gaps, 2px vertical padding and 1px borders keep the total at 76px. One-/two-line captions and dropdown presence do not shift the glyph row. Existing 50px standard / 86px maximum widths, 100px command area and 26px tab cap remain.

File immediately hides quick access and restores it before focus return. Zoom uses a visually clipped accessible label while retaining the exact selector/events. The Grid toggle proxies menuBarGrid and its checked state; the canonical optionGridShow checkbox is retained but its row is hidden only inside the replacement fieldset when the toggle exists. Classic restoration preserves the original checkbox value and handlers.

Editor following reads native openEditors.selectedEditorNode identity and type (CodeEditor or UIDesigner), verified in BETA 1044 file-handler activation source. The existing 400ms observation path changes Code/Form only on editor identity/type changes; an unchanged editor preserves manual ribbon selection. File defers this until exit. Other document types do not force a tab, and no native editor activation function is replaced.

## Measured validation

- **93 tests pass, no failures/skips**: 44 page/combined-add-in cases and 49 toolbar cases.
- Nine new regressions cover all eight direct classic proxies/glyph sources/disabled state; actual async native Add expansion and future options; outside dismissal despite native document mouse interception; fixed top large-button glyph rows; File quick-access hiding/focus restoration; accessible Zoom without a visible duplicate; native editor identity/type following with manual/File behavior; canonical Grid state/Classic restoration; and unsupported-producer parent fallback.
- Native producer tests run the actual BETA 1044 showFormatMenu, showProjectMenu and showContextMenuAddComponent functions in isolated realms, including asynchronous project-settings delivery. They verify no unrequested popup and ignore a result delivered after returning to Classic. The original 108 top-level descriptor inventory remains covered; expanded parent groups are represented through their live native children.
- Existing native command alternatives, actual forced-white grid CSS, page/selection protocols and asynchronous/lazy menu checks continue to pass. Popover lifecycle is mocked in jsdom; no rendered browser/native acceptance is inferred from that mock.
- All **71** packed-project mirrors match (27 package, 37 consumer, 7 IDE add-in). Package/reference contents, stable IDs, page ownership and CRLF checks pass. Official impexp.mjs blob 73547aba63c230f3ba7dd282d45ee71c03a5fadc reproduces all **six** add-in exported files; metadata is checked separately by the mirror validator.
- Generated JavaScript parses and contains the exact adapter, layout/presentation/context bridge and CSS inputs. The 37-SVG Fluent map is unchanged.

Reproduce with jsdom resolvable or TB_JSDOM_MODULE set, TB_IDE_MAIN_JS pointing to BETA 1044 main.js, and TB_IDE_DESIGNER_CSS pointing to its formDesigner.css:

```text
node tbIDE/tools/build-ide-toolbar.mjs
node tbIDE/tools/build-tabview-designer.mjs
node --test tests/ide-toolbar.test.mjs tests/tabview-designer.test.mjs
node tools/validate-tabview-projects.mjs
```

## Remaining observations

Observe real direct Form/Insert command layout, future add-in form options, async project changes, outside dismissal over designer/Monaco surfaces and window deactivation, large glyph alignment, File/Zoom refinements, editor following and Grid persistence in the native IDE. Cover light/dark, third-party themes and additional styling off. Prior browser fixture URL rejection was not bypassed. Automatic collapsed groups and Office keytips remain separate roadmap work.
