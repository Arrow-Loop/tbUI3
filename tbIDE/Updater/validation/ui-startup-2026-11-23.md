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
