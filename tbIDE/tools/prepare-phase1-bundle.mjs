// Run AFTER the native updater build and BEFORE either add-in architecture is compiled.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {scan,edit} from '../../tools/twinproj-edit.mjs';import {readPE} from './pe-resources.mjs';
const config=JSON.parse(fs.readFileSync('tbIDE/phase1-config.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const at=process.argv.indexOf('--updater'),file=at>=0?process.argv[at+1]:undefined;
if(!file)throw Error('Build the canonical Win32 updater, then pass --updater <fresh Updater.exe>. No placeholder or stale binary is embedded.');
const project='tbIDE/Updater/Updater.twinproj',addin='tbIDE/tbUI3IDE/tbUI3IDE.twinproj',src='tbIDE/tbUI3IDE/src',bytes=fs.readFileSync(file),pe=readPE(bytes);
if(pe.machine!==0x14c||pe.version!==config.updaterVersion)throw Error(`Expected Win32 updater ${config.updaterVersion}; got machine ${pe.machine.toString(16)}, version ${pe.version}`);
if(fs.statSync(file).mtimeMs<fs.statSync(project).mtimeMs)throw Error('Updater predates the canonical project. Rebuild it first.');
const resources=[
 {id:'updater',resource:'tbUI3-updater.payload',version:config.updaterVersion,bytes},
 {id:'themeDark',resource:'tbUI3-dark.theme',version:config.addinVersion,bytes:fs.readFileSync('tbIDE/themes/WinUI3 Dark.theme')},
 {id:'themeLight',resource:'tbUI3-light.theme',version:config.addinVersion,bytes:fs.readFileSync('tbIDE/themes/WinUI3 Light.theme')},
];
const manifest={schema:1,protocol:config.protocol,updaterProjectSha256:hash(fs.readFileSync(project)),resources:resources.map(({bytes,...entry})=>({...entry,size:bytes.length,sha256:hash(bytes),protocolMin:1,protocolMax:1}))};
const input=new Map(resources.map(r=>['Resources/OTHER/'+r.resource,r.bytes]));input.set('Resources/OTHER/tbUI3-bundle.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
const current=fs.readFileSync(addin),entries=scan(current),replace={},add={};
for(const [name,data]of input){fs.mkdirSync(path.dirname(src+'/'+name),{recursive:true});fs.writeFileSync(src+'/'+name,data);(entries[name]?replace:add)[name]=data;}
fs.writeFileSync(addin,edit(current,{replace,add}));
console.log('Embedded the verified native updater and exact themes in the canonical add-in and mirrors. Now compile BOTH DLL architectures.');
