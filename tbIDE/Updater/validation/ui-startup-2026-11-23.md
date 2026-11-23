# Native UI startup report, 2026-11-23

User observations: direct Updater.exe launch without self-test arguments displays a blank form. Running in the twinBASIC IDE displays a blank form and opens an empty page in the default browser.

User-provided startup log excerpt (before this correction):

```text
2026-11-23 17:09:44 WebView2 Runtime 158.0.4370.33; HKLM 32-bit Evergreen registration
2026-11-23 17:13:31 Missing updater argument value.
2026-11-23 17:13:31 WebView2 Runtime 158.0.4370.33; HKLM 32-bit Evergreen registration
2026-11-23 17:13:31 Unspecified error
```

The Runtime is detected. Engine tests independently passed 57/57; they do not initialize the WebView. The old generic error does not identify Form_Load vs resource assembly, filter registration, navigation or page bootstrap, so the blank UI cause is **not established/resolved** by this log.

Source changes in response:

- Parse the application/debugger `Command$` tail with CommandLineToArgvW, rather than GetCommandLineW for the enclosing IDE/compiler process. Expanded the existing native argument test for an empty tail and quoted context.
- Write complete fallback HTML as typed UTF-8 bytes to a temporary file in the diagnostic directory, verify it, publish atomically, then open the browser. Failures log their number and never intentionally open a zero-byte file. Display escaped actual failure detail rather than misdiagnosing an installed Runtime as missing.
- Log creation/profile, form, Ready, filter, navigation, script requests and bootstrap stages plus error numbers; suppress duplicate fallback windows.
- Consolidate diagnostics under `%LOCALAPPDATA%\tbUI3\Diagnostics\`. Next native log: `updater-startup.log` there. Operational browser profiles/state remain in their original locations.

Validation is source/static/DOM only. Native recompile and the resulting stage log are still required to locate or confirm resolution of the blank form. No Screen Control or GUI automation was used.

## Later diagnostic evidence: generated document blocked

Private incoming diagnostics commit **12d18464c5d4171c3162235097cfd179e212df85**, updater-startup.log blob **f1c6aa9cd953333197178b730130fcdc739b5d67**, records two distinct paths: IDE resource reads fail before navigation; the compiled EXE successfully assembles HTML, then the old navigation guard explicitly cancels its generated `data:text/html;charset=utf-8;base64,` page. The intermediate about:blank navigation is not proof the application loaded.

The source patch authorizes the exact locally generated UTF-8/Base64 document (binary equality), never arbitrary data pages or external URLs. The resource reader follows the compiler WebView2 package's `CStr(StrConv(CStr(data), vbFromUTF8))` pattern and reports lookup vs conversion failures separately. A new executable native test checks a Unicode fixture against independently calculated Base64, permitted initial/document navigation, modified/foreign/remote/uninitialized rejection and actual HTML resource reading. Native suite: 58 cases; previous 57/57 is historical evidence. Source/DOM validation cannot prove the native conversion/API or startup succeeds.

Acceptance: reopen/rebuild the canonical Updater project, run -SelfTest unelevated, then launch both in IDE and as EXE without arguments. Require the updater's own rendered UI and `updater:ready received` handshake, no browser fallback, and no worker launch without an approved context. If startup still fails, inspect the staged error or cancelled URI in Diagnostics/updater-startup.log. Raw private diagnostics remain in their source repository.

## Compiled startup confirmed by subsequent native run

Diagnostics commit **52355297f52694bf121ab61f39ed0f3f335ab439**, results blob **49a8ebdd5684d1967567cb2bbc8023112f1b94be**, reports **58/58 passed**, including trusted UTF-8 navigation. Startup blob **12a8b084362f4bb5d9d43570e24cf750b28eace8** records the generated data page allowed, both embedded script requests, `updater:ready received`, and successful final navigation (status 0) at 18:25:14. Shane's screenshot shows the updater's own no-context ready screen. Prior error entries in the cumulative log predate this successful run. There is no later successful IDE debug launch in the snapshot, so that remains unconfirmed. Live transaction and embedding acceptance remain separate. No raw private diagnostic contents copied into this public repo; the validation JSON records sanitized observations and immutable source identifiers only.
