// Synthetic PE fixtures test a byte parser; these are never build or release artifacts.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {spawnSync}from'node:child_process';
import {readPE,namedResource,requireAsInvokerManifest}from'../tbIDE/tools/pe-resources.mjs';
function image(resources,machine=0x14c){
 const b=Buffer.alloc(8704);b.writeUInt16LE(0x5a4d);b.writeUInt32LE(128,60);b.writeUInt32LE(0x4550,128);b.writeUInt16LE(machine,132);b.writeUInt16LE(1,134);b.writeUInt16LE(224,148);b.writeUInt16LE(0x10b,152);b.writeUInt32LE(4096,264);b.writeUInt32LE(8192,268);b.writeUInt32LE(4096,388);b.writeUInt32LE(8192,392);b.writeUInt32LE(512,396);
 const tree=new Map();for(const [key,data]of resources){const names=key.split('/');let node=tree;for(const name of names.slice(0,-1)){if(!node.has(name))node.set(name,new Map());node=node.get(name);}node.set(names.at(-1),data);}
 let used=0;const alloc=n=>{const at=used;used=(used+n+3)&~3;assert(used<8192);return at;};
 const label=name=>{if(name.startsWith('#'))return +name.slice(1);const at=alloc(2+name.length*2);b.writeUInt16LE(name.length,512+at);b.write(name,514+at,'utf16le');return (at|0x80000000)>>>0;};
 function directory(node){const at=alloc(16+node.size*8);b.writeUInt16LE(node.size,512+at+14);let i=0;for(const[name,child]of node){const entry=512+at+16+8*i++;b.writeUInt32LE(label(name),entry);if(child instanceof Map)b.writeUInt32LE((directory(child)|0x80000000)>>>0,entry+4);else{const data=alloc(16),value=alloc(child.length);b.writeUInt32LE(4096+value,512+data);b.writeUInt32LE(child.length,512+data+4);child.copy(b,512+value);b.writeUInt32LE(data,entry+4);}}return at;}
 directory(tree);return b;
}
function fixed(version){const b=Buffer.alloc(52),v=version.split('.').map(Number);b.writeUInt32LE(0xfeef04bd);b.writeUInt32LE(((v[0]<<16)|v[1])>>>0,8);b.writeUInt32LE(((v[2]<<16)|v[3])>>>0,12);return b;}
test('PE fixed versions preserve all four numeric components including major zero',()=>{const pe=readPE(image([['#16/#1/#1033',fixed('0.3.0.20')],['OTHER/bundle/#1033',Buffer.from('verified')]]));assert.equal(pe.version,'0.3.0.20');assert.equal(pe.machine,0x14c);assert.equal(namedResource(pe,'bundle').toString(),'verified');});
test('PE resources accept RCDATA and require agreeing language bytes',()=>{const pe=readPE(image([['#10/payload/#1033',Buffer.from('a')],['#10/payload/#1036',Buffer.from('b')]]));assert.throws(()=>namedResource(pe,'payload'),/languages disagree/);assert.throws(()=>namedResource(pe,'missing'),/Missing embedded/);});
test('conflicting fixed PE versions are rejected',()=>assert.throws(()=>readPE(image([['#16/#1/#1033',fixed('0.2.0.0')],['#16/#1/#1036',fixed('1.0.0.0')]])),/Conflicting/));
test('truncated or invalid PE headers cannot supply release identities',()=>{assert.throws(()=>readPE(Buffer.alloc(20)),/Truncated/);assert.throws(()=>readPE(Buffer.alloc(100)),/MZ/);const b=image([]);b.writeUInt32LE(0xfffffff0,60);assert.throws(()=>readPE(b),/Truncated/);});
test('cyclic resource directories and payload RVA escape fail closed',()=>{const cycle=image([['OTHER/a/#1033',Buffer.from('x')]]);cycle.writeUInt32LE(0x80000000,512+20);assert.throws(()=>readPE(cycle),/nesting limit/);const b=image([['OTHER/a/#1033',Buffer.from('x')]]);b.writeUInt32LE(0xffffff00,388);assert.throws(()=>readPE(b),/RVA escapes/);});
test('bundle preparation refuses a missing binary without modifying canonical inputs',()=>{const path='tbIDE/tbUI3IDE/tbUI3IDE.twinproj',before=fs.readFileSync(path),r=spawnSync(process.execPath,['tbIDE/tools/prepare-phase1-bundle.mjs'],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/No placeholder or stale binary/);assert(fs.readFileSync(path).equals(before));});
test('release verification cannot pass before both actual architecture DLLs are supplied',()=>{const r=spawnSync(process.execPath,['tbIDE/tools/verify-phase1-release.mjs'],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/win32 DLL, win64 DLL and Updater/);});

test('updater launch manifest must explicitly run as the invoking user',()=>{
 const xml=fs.readFileSync('tbIDE/Updater/src/Resources/MANIFEST/#1.xml');
 assert.doesNotThrow(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',xml]]))));
 assert.throws(()=>requireAsInvokerManifest(readPE(image([]))),/embedded #1 application manifest/);
 for(const level of ['requireAdministrator','highestAvailable'])assert.throws(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',Buffer.from(xml.toString().replace('asInvoker',level))]]))),/asInvoker/);
 assert.throws(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',Buffer.from(xml.toString().replace('uiAccess="false"','uiAccess="true"'))]]))),/uiAccess=false/);
});
test('every updater manifest language must be safe; comment-only declarations cannot pass',()=>{
 const safe=fs.readFileSync('tbIDE/Updater/src/Resources/MANIFEST/#1.xml');
 const unsafe=Buffer.from(safe.toString().replace('asInvoker','requireAdministrator'));
 assert.throws(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',safe],['#24/#1/#1036',unsafe]]))),/asInvoker/);
 const comment=Buffer.from('<assembly><!-- <requestedExecutionLevel level="asInvoker" uiAccess="false"/> --></assembly>');
 assert.throws(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',comment]]))),/asInvoker/);
 const utf16=Buffer.concat([Buffer.from([255,254]),Buffer.from(safe.toString(),'utf16le')]);
 assert.doesNotThrow(()=>requireAsInvokerManifest(readPE(image([['#24/#1/#1033',utf16]]))));
});

test('compiled twinBASIC uppercase resources resolve without weakening language/case conflict checks',()=>{
 const actual=readPE(image([['OTHER/TBUI3-BUNDLE.JSON/#0',Buffer.from('bundle')],['#10/TBUI3-UPDATER.PAYLOAD/#0',Buffer.from('exe')]]));
 assert.equal(namedResource(actual,'tbUI3-bundle.json').toString(),'bundle');
 assert.equal(namedResource(actual,'tbUI3-updater.payload').toString(),'exe');
 const conflict=readPE(image([['OTHER/TBUI3-BUNDLE.JSON/#0',Buffer.from('a')],['OTHER/tbUI3-bundle.json/#1033',Buffer.from('b')]]));
 assert.throws(()=>namedResource(conflict,'tbUI3-bundle.json'),/languages disagree/);
});
