import fs from'node:fs';import test from'node:test';import assert from'node:assert/strict';import{scan}from'../tools/twinproj-edit.mjs';
const source=name=>fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/'+name+'.twin','utf8');

test('standard DLL resource compatibility helper is embedded, pointer-safe and owned by the add-in',()=>{
 const project=fs.readFileSync('tbIDE/tbUI3IDE/tbUI3IDE.twinproj'),entry=scan(project)['Sources/AddinResources.twin'],shim=source('AddinResources');
 assert(entry);assert(project.subarray(entry.cStart+4,entry.cEnd).equals(Buffer.from(shim)));
 const settings=JSON.parse(fs.readFileSync('tbIDE/tbUI3IDE/src/Settings'));assert.equal(settings['project.buildType'],'Standard DLL');
 assert(!settings['project.references'].some(r=>r.name==='[COMPILER PACKAGE] Visual Basic (VB6 compatible)'));
 assert.match(shim,/Public Function LoadResData\(ByVal resourceName As String, ByVal resourceType As String\) As Variant/);
 assert.match(shim,/RModuleForAddress\(6, AddressOf ResourceAnchor, moduleHandle\)/);
 assert.match(shim,/RFind\(moduleHandle, StrPtr\(name\), StrPtr\(kind\)\)/);
 assert.match(shim,/Dim bytes\(\) As Byte/);assert.match(shim,/RCopy VarPtr\(bytes\(0\)\), pointer, size/);
 assert(shim.indexOf('size <= 0 Or size > 134217728')<shim.indexOf('ReDim bytes'));
 assert.doesNotMatch(shim,/RFind\(0,|GetModuleHandleW|LoadLibrary/);
 assert.match(source('BundledResources'),/bytes\(\) As Byte = LoadResData\(resource, "OTHER"\)/);
 assert.match(source('ManagedResources'),/LoadResData\(name, "OTHER"\)/);
});

test('theme color formatting avoids the nested Hex call rejected by BETA 1045',()=>{
 const catalog=source('InstalledThemeCatalog');
 assert.doesNotMatch(catalog,/Hex\$\(CLng\(Int\(/);
 assert.match(catalog,/Dim rounded As Long = CLng\(Fix\(n \+ 0\.5\)\)/);
 assert.match(catalog,/Mid\$\("0123456789abcdef", \(rounded \\ 16\) \+ 1, 1\)/);
 assert.match(catalog,/Mid\$\("0123456789abcdef", \(rounded Mod 16\) \+ 1, 1\)/);
});
