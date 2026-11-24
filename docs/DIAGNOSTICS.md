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

The earlier unqualified startup error is superseded by the accepted compiled startup run. The IDE argument path uses application `Command# Diagnostic files

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

 rather than the compiler host command line. If a new failure occurs, collect the current staged error and runtime version.

## Current startup evidence and troubleshooting

The 58/58 native report and successful compiled no-context startup are recorded in [native-startup-2026-11-23-passed.json](../tbIDE/Updater/validation/native-startup-2026-11-23-passed.json). The host authorizes only its exact generated UTF-8/Base64 document and about:blank, not arbitrary URLs. Embedded text conversion uses the package's whole-buffer UTF-8 conversion. Prior cumulative log entries and 42/54 and 57/57 reports are historical evidence; see CHANGELOG. IDE debug startup, integrated add-in launch and live update acceptance remain separate checks.

If startup fails, inspect `updater-startup.log` for the stage/error number, navigation decision, script requests and `updater:ready received`. Report current diagnostics through the user's approved private channel; do not publish private diagnostic sources, credentials, paths or raw logs in this repository. Local logs are not automatically uploaded.
