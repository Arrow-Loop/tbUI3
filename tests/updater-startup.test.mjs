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
test('WebView startup records stage and error number and commits navigation only after submission',()=>{
 const form=source('frmMain');for(const stage of ['WebView2 Create:','Form_Load: begin','WebView2 Ready: begin','script resource filter','NavigateToString','updater:ready received'])assert(form.includes(stage),stage);
 assert(form.includes('RuntimeHelp "WebView2 Ready / " & stage & " (" & CStr(Err.Number)'));
 assert(form.indexOf('wvMain.NavigateToString html')<form.indexOf('mNavigated = True'));
});
test('fallback template is a real readable error page without assuming Runtime is missing',async()=>{
 const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
 const html=fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/runtime-help.html','utf8').replace('{{STYLE_BLOCK}}','').replace('{{ERROR_DETAIL}}','WebView2 Ready / NavigateToString (5): &lt;failure&gt;');
 const dom=new JSDOM(html);try{assert.match(dom.window.document.querySelector('h1').textContent,/interface could not start/);assert.match(dom.window.document.querySelector('[role=alert]').textContent,/NavigateToString/);assert.equal(dom.window.document.querySelector('failure'),null);assert.match(dom.window.document.body.textContent,/Diagnostics\\updater-startup.log/);}finally{dom.window.close();}
});
