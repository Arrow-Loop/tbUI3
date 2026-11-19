// One-time assembly from a known-good IDE-created seed. Never replaces a saved project.
// Normal development uses tools/twinproj-src.mjs patch/add to preserve the canonical container.
import fs from 'node:fs';
import path from 'node:path';
import {scan,edit} from '../../tools/twinproj-edit.mjs';
const seed=process.argv[2];if(!seed)throw Error('Pass a known-good IDE-created seed .twinproj');
const dir='tbIDE/Updater',src=dir+'/src',dest=dir+'/Updater.twinproj';
if(fs.existsSync(dest))throw Error('Canonical project exists. Use twinproj-src patch/add.');
const files=(folder)=>fs.readdirSync(folder).sort().map(name=>[name,fs.readFileSync(path.join(folder,name))]);
let buf=fs.readFileSync(seed);scan(buf);
const add=Object.fromEntries(files(src+'/Resources/OTHER').map(([name,data])=>['Resources/OTHER/'+name,data]));
buf=edit(buf,{replace:{Settings:fs.readFileSync(src+'/Settings'),'.meta':fs.readFileSync(src+'/.meta')},setDirChildren:{Sources:files(src+'/Sources')},add});
const old=buf.readUInt32LE(6),name=Buffer.from('Updater'),length=Buffer.alloc(4);length.writeUInt32LE(name.length);
buf=Buffer.concat([buf.subarray(0,6),length,name,buf.subarray(10+old)]);scan(buf);fs.writeFileSync(dest,buf);
console.log('Created '+dest+' from the IDE seed and complete WebView2 source/resource mirror.');

