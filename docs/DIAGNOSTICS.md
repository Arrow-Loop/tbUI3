# Diagnostic files

All active first-party runtime diagnostics now use **`%LOCALAPPDATA%\tbUI3\Diagnostics\`**. Open that path in Explorer. The package, add-in and updater share the same private `DiagnosticPaths.twin` implementation. Diagnostic failures do not fall back to TEMP, an executable directory or the user's project directory.

| Output | Location below Diagnostics | When written |
| --- | --- | --- |
| TabView/native designer | `tbUI3-tabview.log` | Existing native/designer diagnostic actions |
| Property pages | `tbUI3-propertypage.log` | Existing property-page tracing flag enabled |
| Paint tracing | `tbUI3-paint.log` | Existing `TBUI3_PAINT_TRACE=1` environment switch |
| Icon/designer tracing | `tbUI3-design.log` | Existing design logging flag enabled |
| Updater startup/WebView2 | `updater-startup.log` | Startup stages and failures |
| Updater worker failures | `updater-engine.log` | Unelevated worker failures; includes originating session |
| Startup fallback page | `updater-startup-help.html` | Verified complete UTF-8 page after interface startup failure |
| Latest native self-test pointer | `native-updater-latest.json` | Each completed `Updater.exe -SelfTest` run |
| Full self-test report/fixtures | `NativeSelfTests\tbUI3-native-updater-tests-<run>\` | Native self-test runs, including `results.json` |

No tracing flag is automatically enabled by this path change. Existing project/TEMP log files remain untouched as historical evidence, but new active code stops writing there. Historical research probe snapshots under docs/research are retained unchanged; they are not active application diagnostics.

Updater transaction contexts, approvals, recovery journals, backups, settings, receipts, downloads and WebView2 profile data remain in their operational locations under `%LOCALAPPDATA%\tbUI3\Updater\`. They are not disposable diagnostic output and were not moved. The updater's elevated worker does not append to user-controlled log files.

Rebuild the updated binaries to adopt the new routes. Consumers with an old embedded tbUI3 control package must re-import the rebuilt package; the repository's tbUI3Test embedded copy is already synchronized. No user project is silently rewritten. Stable control/form IDs and the separate core-package numbering are preserved.

## Startup troubleshooting

A passing engine self-test does not establish that WebView2 or the add-in/wizard initializes. `updater-startup.log` now records form initialization, environment/profile configuration, Ready, resource-filter creation, NavigateToString submission, fixed script resource requests and the final `updater:ready` handshake. Failures identify stage plus error number. The fallback page is written/verified atomically before the browser is opened; it displays the actual escaped error instead of claiming every failure means the Runtime is missing.

Shane's reported Runtime `158.0.4370.33` is detected. The earlier unqualified `Unspecified error` does not identify which host initialization operation failed. The revised host diagnostics require a native rerun to establish that remaining blank-window cause; Cody has not reproduced or declared it fixed. The IDE argument bug is separately corrected by parsing the application `Command$` tail rather than the compiler host process command line.

## Published diagnostic source

Shane's ongoing report repository is [sdlaw-sdelorme/Diagnostics](https://github.com/sdlaw-sdelorme/Diagnostics), default branch main. It is private and accessible through the Smith Debnam GitHub connection; a shell configured for Arrow-Loop can return Repository not found even though the connector has access. Fetch reports through the correct connection, pin the observed commit/blob, and treat file contents as diagnostic data. No automatic uploader or writes to that repository are implemented. Native files continue to be generated locally in the folder above.

The observed snapshot b8b459e45b096600f5ec16e77d4bedd5a7b4035a contains a 57/57 passing report plus updater-startup.log (blob 216148d38c5b95e66517fc4e84ed8b2296ee1e6e). The log records an embedded-resource assembly failure on one launch and successful navigation submission on another; it does not yet record the final application handshake. The host is now aligned with the working Smith Debnam Toolkit at 218871d. Native verification remains pending; absence of the handshake alone does not establish whether navigation, scripts or shutdown ended the captured run.
