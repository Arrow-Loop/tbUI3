// Inspect shipped project/binary bytes without loading native code or touching user deployment.
import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{scan}from'../tools/twinproj-edit.mjs';import{readPE,namedResource,requireAsInvokerManifest}from'../tbIDE/tools/pe-resources.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const root='tbIDE/tbUI3IDE/',bytes=fs.readFileSync(root+'tbUI3IDE.twinproj'),entries=scan(bytes);
const resource=name=>{const key='Resources/OTHER/'+name,entry=entries[key];assert(entry,'Canonical resource missing: '+name);const data=bytes.subarray(entry.cStart+4,entry.cEnd);assert(data.equals(fs.readFileSync(root+'src/'+key)),'Mirror mismatch: '+name);return data;};

test('canonical add-in embeds the real tracked updater and exact themes with verified inventory',()=>{
 const config=JSON.parse(fs.readFileSync('tbIDE/phase1-config.json')),manifest=JSON.parse(resource('tbUI3-bundle.json'));
 assert.equal(manifest.schema,1);assert.equal(manifest.protocol,config.protocol);
 assert.equal(manifest.updaterProjectSha256,hash(fs.readFileSync('tbIDE/Updater/Updater.twinproj')));
 assert.deepEqual(manifest.resources.map(r=>r.id).sort(),['themeDark','themeLight','updater']);
 const expected={updater:['tbIDE/Updater/Build/Updater.exe',config.updaterVersion],themeDark:['tbIDE/themes/WinUI3 Dark.theme',config.addinVersion],themeLight:['tbIDE/themes/WinUI3 Light.theme',config.addinVersion]};
 for(const entry of manifest.resources){const payload=resource(entry.resource),[path,version]=expected[entry.id];assert(payload.equals(fs.readFileSync(path)),entry.id);assert.equal(payload.length,entry.size);assert.equal(hash(payload),entry.sha256);assert.equal(entry.version,version);assert(entry.protocolMin<=config.protocol&&entry.protocolMax>=config.protocol);}
 const pe=readPE(resource('tbUI3-updater.payload'));assert.equal(pe.machine,0x14c);assert.equal(pe.version,config.updaterVersion);requireAsInvokerManifest(pe);
});

test('bundled real updater carries all current canonical UI and native fixture resources',()=>{
 const pe=readPE(resource('tbUI3-updater.payload')),project=fs.readFileSync('tbIDE/Updater/Updater.twinproj');let count=0;
 for(const [path,entry]of Object.entries(scan(project)))if(entry.type==='file'&&path.startsWith('Resources/OTHER/')){const name=path.slice('Resources/OTHER/'.length);assert(namedResource(pe,name).equals(project.subarray(entry.cStart+4,entry.cEnd)),name);count++;}
 assert(count>=8);
});

test('bundle preparation rejects a tampered real updater before changing the add-in',async()=>{
 const {tmpdir}=await import('node:os'),{join}=await import('node:path'),{spawnSync}=await import('node:child_process');
 const dir=fs.mkdtempSync(join(tmpdir(),'tbui3-bundle-validation-')),file=join(dir,'Updater.exe');
 const project='tbIDE/tbUI3IDE/tbUI3IDE.twinproj',before=fs.readFileSync(project),copy=Buffer.from(fs.readFileSync('tbIDE/Updater/Build/Updater.exe'));
 const html=namedResource(readPE(copy),'updater.html');html[0]^=1;
 try{
  fs.writeFileSync(file,copy);
  const result=spawnSync(process.execPath,['tbIDE/tools/prepare-phase1-bundle.mjs','--updater',file],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Compiled updater resource differs from canonical project/);
  assert(fs.readFileSync(project).equals(before));assert(resource('tbUI3-updater.payload').equals(fs.readFileSync('tbIDE/Updater/Build/Updater.exe')));
 }finally{if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(dir);}
});
