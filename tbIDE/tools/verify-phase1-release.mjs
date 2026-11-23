import fs from 'node:fs';import {createHash}from'node:crypto';import{readPE,namedResource,requireAsInvokerManifest}from'./pe-resources.mjs';
const config=JSON.parse(fs.readFileSync('tbIDE/phase1-config.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);if(args.length!==3)throw Error('Pass win32 DLL, win64 DLL and Updater.exe');
const [win32,win64,updater]=args.map(p=>readPE(fs.readFileSync(p))),updaterBytes=fs.readFileSync(args[2]);
requireAsInvokerManifest(updater);
if(win32.machine!==0x14c||win64.machine!==0x8664||updater.machine!==0x14c)throw Error('Release architecture mismatch');
if(win32.version!==config.addinVersion||win64.version!==config.addinVersion||updater.version!==config.updaterVersion)throw Error('Release fixed PE version mismatch');
let manifestBytes;
for(const dll of[win32,win64]){
 const bytes=namedResource(dll,'tbUI3-bundle.json');if(manifestBytes&&!manifestBytes.equals(bytes))throw Error('DLL bundle manifests differ');manifestBytes=bytes;
 const m=JSON.parse(bytes);if(m.schema!==1||m.protocol!==config.protocol||!Array.isArray(m.resources)||m.resources.length!==3||new Set(m.resources.map(r=>r.id)).size!==3||m.resources.some(r=>!['updater','themeDark','themeLight'].includes(r.id)))throw Error('Invalid embedded bundle');
 if(m.updaterProjectSha256!==hash(fs.readFileSync('tbIDE/Updater/Updater.twinproj')))throw Error('DLL embeds an updater from a different project revision');
 for(const r of m.resources){const data=namedResource(dll,r.resource);if(data.length!==r.size||hash(data)!==r.sha256)throw Error('Embedded payload size/hash mismatch: '+r.id);
  const expected=({updater:updaterBytes,themeDark:fs.readFileSync('tbIDE/themes/WinUI3 Dark.theme'),themeLight:fs.readFileSync('tbIDE/themes/WinUI3 Light.theme')})[r.id];
  if(!expected||!data.equals(expected))throw Error('Embedded release payload differs: '+r.id);
 }
}
console.log('Both real DLLs embed the exact verified native updater and themes, with matching fixed PE versions.');
