import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
const base='tbIDE/Updater/src';
const source=name=>fs.readFileSync(`${base}/Sources/${name}.twin`,'utf8');
const fixtures=JSON.parse(fs.readFileSync(`${base}/Resources/OTHER/native-engine-fixtures.json`));

test('native updater has no distributed script engine or interpreter launch',()=>{
 assert(!fs.existsSync('tbIDE/Updater/Updater.ps1'));
 const files=fs.readdirSync(`${base}/Sources`).filter(x=>x.endsWith('.twin'));
 for(const file of files)assert.doesNotMatch(fs.readFileSync(`${base}/Sources/${file}`,'utf8'),/powershell|ExecutionPolicy|Updater\.ps1|wscript\.exe|cscript\.exe|cmd\.exe/i,file);
 assert.match(source('UpdaterHost'),/QuoteArg\(executable\) & " -Worker -Mode "/);
 assert.match(source('MainModule'),/ExitProcess RunNativeEngine\(UpdateMode\)/);
 assert.match(source('MainModule'),/If Not IsSessionRunner\(\) Then UFail/);
 const pack=fs.readFileSync('tbIDE/tools/package-updater-release.ps1','utf8');
 assert.match(pack,/@\(@\{path=\$UpdaterExe;target='Updater.exe'\}\)/);
 assert.doesNotMatch(pack,/Updater\.ps1|Mode Functions/);
});

test('compiled self-test data covers stored, fixed and dynamic streams with independent zlib/hash verification',()=>{
 const blockTypes=new Set();let valid=0,reject=0;
 for(const fixture of fixtures.fixtures){
  const zip=Buffer.from(fixture.archiveHex,'hex');
  if(fixture.reject){reject++;continue;}
  valid++;let offset=0,index=0;
  while(zip.readUInt32LE(offset)===0x04034b50){
   const method=zip.readUInt16LE(offset+8),packed=zip.readUInt32LE(offset+18),size=zip.readUInt32LE(offset+22),nameSize=zip.readUInt16LE(offset+26),extra=zip.readUInt16LE(offset+28);
   const name=zip.subarray(offset+30,offset+30+nameSize).toString('utf8'),start=offset+30+nameSize+extra,body=zip.subarray(start,start+packed);
   if(method===8)blockTypes.add((body[0]>>>1)&3);
   const bytes=method===0?body:zlib.inflateRawSync(body);
   assert.equal(bytes.length,size,fixture.name);
   assert.equal(name,fixture.files[index].name);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),fixture.files[index].sha256,fixture.name);
   offset=start+packed;index++;
  }
  assert.equal(index,fixture.files.length);
 }
 assert.deepEqual([...blockTypes].sort(),[0,1,2]);assert.equal(valid,7);assert.equal(reject,12);
 assert.match(source('UpdaterSelfTest'),/For i = 1 To 35: RunCase i: Next/);
});

test('native transaction preserves consent, policy and durable intent ordering',()=>{
 const engine=source('UpdaterEngine'),transaction=source('UpdaterTransaction');
 assert(engine.indexOf('UApproval session')<engine.indexOf('UInstall plan'));
 assert(engine.indexOf('UWaitInstallation context')<engine.indexOf('UInstall plan'));
 assert(engine.indexOf('UNoDowngrade plan')<engine.indexOf('UInstall plan'));
 const live=transaction.slice(transaction.indexOf('For Each operation In operations.Items'));
 assert(live.indexOf('JS("intent"): UWriteJson')<live.indexOf('UReplace JT(operation'));
 assert(live.indexOf('If UHash(path)')<live.indexOf('JS("applied"): UWriteJson'));
 const policy=source('UpdaterPolicy');assert.match(policy,/If targets.Count <> 1 Or Not targets.Exists\("Updater.exe"\)/);
 assert.match(source('UpdaterPlatform'),/WinHttpReadData/);assert.match(source('UpdaterPlatform'),/BCryptHashData/);
 assert.match(source('UpdaterZip'),/Archive links forbidden/);
 assert.match(source('UpdaterProcesses'),/Hex\$\(created.high\)/);
});
