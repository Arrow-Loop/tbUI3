import fs from'node:fs';import test from'node:test';import assert from'node:assert/strict';
const source=n=>fs.readFileSync('tbIDE/Updater/src/Sources/'+n+'.twin','utf8');
test('debugger launches parse application Command$ rather than compiler process arguments',()=>{
 assert.match(source('UpdaterCommandLine'),/ParseNativeArguments\(Command\$\(\)\)/);assert.doesNotMatch(source('UpdaterCommandLine'),/GetCommandLineW/);
 assert.match(source('UpdaterSelfTest'),/ParseNativeArguments\(""\): Check arguments.Count = 0/);
 assert.match(source('UpdaterSelfTest'),/arguments.Count = 4 And CStr\(arguments\(4\)\)/);
});
test('startup fallback verifies complete typed UTF-8 output before opening the browser',()=>{
 const host=source('UpdaterHost'),start=host.indexOf('Public Sub RuntimeHelp'),body=host.slice(start);
 assert(!body.slice(0,body.indexOf('Failed:')).includes('On Error Resume Next'));
 assert(body.indexOf('Dim bytes() As Byte')<body.indexOf('UWriteRaw temp, bytes'));
 assert(body.indexOf('USize(temp) < 100')<body.indexOf('UReplace temp, path'));
 assert(body.indexOf('UReplace temp, path')<body.indexOf('If ShellExecuteW('));
 assert(body.includes('If mHelpShown Then Exit Sub'));assert(body.includes('Startup help failed ('));
});
test('WebView startup records stages and guards reentrant Ready using the Toolkit lifecycle',()=>{
 const form=source('frmMain');for(const stage of ['WebView2 Create:','Form_Load: begin','WebView2 Ready: begin','script resource filter','NavigateToString','updater:ready received'])assert(form.includes(stage),stage);
 assert(form.includes('RuntimeHelp "WebView2 Ready / " & stage & " (" & CStr(Err.Number)'));
 assert(form.indexOf('mNavigated = True')<form.indexOf('wvMain.NavigateToString html'));
 assert(form.includes('mNavigated = False'));assert(form.includes('wvMain_NavigationComplete'));assert.doesNotMatch(form,/Handles wvMain\\./);
});
test('fallback template is a real readable error page without assuming Runtime is missing',async()=>{
 const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
 const html=fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/runtime-help.html','utf8').replace('{{STYLE_BLOCK}}','').replace('{{ERROR_DETAIL}}','WebView2 Ready / NavigateToString (5): &lt;failure&gt;');
 const dom=new JSDOM(html);try{assert.match(dom.window.document.querySelector('h1').textContent,/interface could not start/);assert.match(dom.window.document.querySelector('[role=alert]').textContent,/NavigateToString/);assert.equal(dom.window.document.querySelector('failure'),null);assert.match(dom.window.document.body.textContent,/Diagnostics\\updater-startup.log/);}finally{dom.window.close();}
});

test('updater resource conversion uses the Toolkit whole-buffer pattern with explicit UTF-8',()=>{
 const host=source('modWinUIHost');const reader=host.slice(host.indexOf('Public Function UIX_ResourceText'),host.indexOf('Public Function UIX_JsonString'));
 assert.match(reader,/Dim data As Variant/);assert.match(reader,/data = LoadResData\(resourceName, "OTHER"\)/);assert.match(reader,/StrConv\(CStr\(data\), vbFromUTF8\)/);
 assert.doesNotMatch(reader,/VarPtr|MultiByteToWideChar|ByRef.*bytes/);assert.match(reader,/Embedded resource.*resourceName/);
});
test('Updater has its own application UI and never mounts the add-in Welcome Wizard',()=>{
 const html=fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/updater.html','utf8'),js=fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/updater.js','utf8');
 assert.match(html,/Update on Exit/);assert.match(html,/Update progress/);assert.match(html,/id="recover"/);assert.match(js,/updater:/);
 assert.doesNotMatch(html+js+source('frmMain'),/tbUI3CreateWelcomeWizard|tbUI3-welcome\.js|welcome\.open/);
 assert(!fs.existsSync('tbIDE/Updater/src/Resources/OTHER/tbUI3-welcome.js'));
});

test('generated document authorization is established before navigation and fails closed',()=>{
 const form=source('frmMain'),policy=source('UpdaterDocument');
 assert(form.indexOf('mExpectedDocumentUri = UpdaterDocumentUri(html)')<form.indexOf('wvMain.NavigateToString html'));
 assert.match(form,/Cancel = Not UpdaterDocumentAllowed\(uri, mExpectedDocumentUri\)/);
 assert.match(policy,/If Len\(expected\) = 0 Then Return False/);
 assert.match(policy,/StrComp\(uri, expected, vbBinaryCompare\) = 0/);
 assert.doesNotMatch(policy,/Left\$\(uri|InStr\(uri|Trim\$\(uri|vbTextCompare/);
 assert.match(policy,/StrConv\(html, vbUTF8\)/);
 assert.match(policy,/StrPtr\(bytes\), LenB\(bytes\)/);
 assert.match(policy,/&H40000001/); // Base64 without CR/LF, matching the observed WebView2 transport.
});

test('native navigation self-test has an independent non-ASCII UTF-8 base64 oracle and rejection cases',()=>{
 const native=source('UpdaterSelfTest'),expected='data:text/html;charset=utf-8;base64,'+Buffer.from('<p>é中</p>','utf8').toString('base64');
 assert(native.includes('Dim expectedUri As String = "'+expected+'"'));
 for(const label of ['exact document','initial blank','modified document','foreign data','remote','uninitialized','resource conversion'])assert(native.includes('name & " '+label+'"'),label);
 assert.match(native,/Check Not UpdaterDocumentAllowed\(expectedUri & "A", expectedUri\)/);
});
