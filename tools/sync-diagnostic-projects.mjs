// Preserve the canonical core package and its complete embedded test reference after diagnostics edits.
import fs from 'node:fs';import path from 'node:path';import {scan,edit}from'./twinproj-edit.mjs';
const project='tbUI3/tbUI3.twinproj',bytes=fs.readFileSync(project),entries=scan(bytes),replace={},add={};
for(const name of ['DiagnosticPaths','UI3Button','UI3Icons','UI3Surface','UI3TabDiagnostics','UI3Window']){
 const rel='Sources/'+name+'.twin',data=fs.readFileSync('tbUI3/src/'+rel),entry=entries[rel];
 if(!entry)add[rel]=data;else if(!data.equals(bytes.subarray(entry.cStart+4,entry.cEnd)))replace[rel]=data;
}
if(Object.keys(replace).length||Object.keys(add).length)fs.writeFileSync(project,edit(bytes,{replace,add}));
const core=fs.readFileSync(project),packed=scan(core),testProject='tbUI3Test/tbUI3Test.twinproj',testBytes=fs.readFileSync(testProject),testEntries=scan(testBytes),testReplace={},testAdd={};
for(const [name,entry]of Object.entries(packed)){
 if(entry.type!=='file'||name==='.meta')continue;
 const rel='Packages/tbUI3/'+name,data=core.subarray(entry.cStart+4,entry.cEnd),existing=testEntries[rel];
 if(!existing)testAdd[rel]=data;else if(!data.equals(testBytes.subarray(existing.cStart+4,existing.cEnd)))testReplace[rel]=data;
 const mirror='tbUI3Test/src/'+rel;fs.mkdirSync(path.dirname(mirror),{recursive:true});if(!fs.existsSync(mirror)||!fs.readFileSync(mirror).equals(data))fs.writeFileSync(mirror,data);
}
if(Object.keys(testReplace).length||Object.keys(testAdd).length)fs.writeFileSync(testProject,edit(testBytes,{replace:testReplace,add:testAdd}));
console.log(`Core: ${Object.keys(replace).length} replacements, ${Object.keys(add).length} additions; embedded test reference: ${Object.keys(testReplace).length} replacements, ${Object.keys(testAdd).length} additions.`);
