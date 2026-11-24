// Keep shared native contracts, UI resources and canonical projects synchronized in one pass.
import {addWelcomeStartup} from './welcome-startup.mjs';
import fs from 'node:fs';import {scan,edit}from'../../tools/twinproj-edit.mjs';import {createHash} from 'node:crypto';
const config=JSON.parse(fs.readFileSync('tbIDE/phase1-config.json'));
const addinOnly=process.argv.includes('--addin-only');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
if(addinOnly){
 // Do not mutate or re-signify the accepted native helper for an add-in-only version.
 const updater='tbIDE/Updater',settings=JSON.parse(fs.readFileSync(updater+'/src/Settings'));
 const version=['Major','Minor','Build','Revision'].map(k=>settings['project.version'+k]).join('.');
 if(version!==config.updaterVersion)throw Error('Add-in-only sync cannot change the helper version.');
 const helperConfig=fs.readFileSync(updater+'/src/Sources/Phase1Config.twin','utf8');
 for(const [key,value] of [['MinIdeBuild',config.minIdeBuild],['MaxIdeBuild',config.maxIdeBuild]])if(!helperConfig.includes('Public Const '+key+' As Long = '+value+'\r\n'))throw Error('Add-in-only sync cannot change compiled helper compatibility.');
 const project=fs.readFileSync(updater+'/Updater.twinproj'),addin=fs.readFileSync('tbIDE/tbUI3IDE/tbUI3IDE.twinproj'),entries=scan(addin);
 const src='tbIDE/tbUI3IDE/src/Resources/OTHER/',manifestPath=src+'tbUI3-bundle.json',oldManifest=fs.readFileSync(manifestPath),manifest=JSON.parse(oldManifest);
 const packed=name=>{const e=entries['Resources/OTHER/'+name];if(!e)throw Error('Missing packed bundle resource '+name);return addin.subarray(e.cStart+4,e.cEnd);};
 if(!packed('tbUI3-bundle.json').equals(oldManifest)||manifest.updaterProjectSha256!==hash(project)||manifest.schema!==1||manifest.protocol!==config.protocol)throw Error('Unverified existing helper bundle; use the standard native preparation gate.');
 const known={updater:updater+'/Build/Updater.exe',themeDark:'tbIDE/themes/WinUI3 Dark.theme',themeLight:'tbIDE/themes/WinUI3 Light.theme'};
 if(manifest.resources.length!==3||new Set(manifest.resources.map(r=>r.id)).size!==3)throw Error('Invalid existing resource inventory.');
 for(const r of manifest.resources){
  if(!known[r.id])throw Error('Unknown bundle resource '+r.id);
  const bytes=fs.readFileSync(known[r.id]);
  if(!packed(r.resource).equals(bytes)||!fs.readFileSync(src+r.resource).equals(bytes)||r.sha256!==hash(bytes)||r.size!==bytes.length)throw Error('Existing payload verification failed for '+r.id);
  if(r.id==='updater'){if(r.version!==config.updaterVersion)throw Error('Unexpected helper version.');}
  else r.version=config.addinVersion;
 }
 const newManifest=JSON.stringify(manifest,null,2)+'\n';
 if(!oldManifest.equals(Buffer.from(newManifest)))fs.writeFileSync(manifestPath,newManifest);
}
const write=(file,bytes)=>{if(fs.existsSync(file)&&fs.readFileSync(file).equals(Buffer.from(bytes)))return;fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,bytes);};
const twin=(file,text)=>write(file,text.replace(/\r?\n/g,'\r\n'));
const configuration=`' Generated from tbIDE/phase1-config.json.\nPrivate Module Phase1Config\n    Public Const MinIdeBuild As Long = ${config.minIdeBuild}\n    Public Const MaxIdeBuild As Long = ${config.maxIdeBuild}\n    Public Const AddinVersion As String = "${config.addinVersion}"\n    Public Const UpdaterVersion As String = "${config.updaterVersion}"\nEnd Module\n`;
if(!addinOnly)twin('tbIDE/Updater/src/Sources/Phase1Config.twin',configuration);
twin('tbIDE/tbUI3IDE/src/Sources/Phase1Config.twin',configuration);
const shared=['UpdateJson','UpdaterJson','UpdaterPlatform','UpdaterProcesses','InstallationContracts','ManagedResources','ShutdownBridge'];
for(const name of shared)write(`tbIDE/tbUI3IDE/src/Sources/${name}.twin`,fs.readFileSync(`tbIDE/Updater/src/Sources/${name}.twin`));
for(const folder of (addinOnly?['tbIDE/tbUI3IDE']:['tbIDE/Updater','tbIDE/tbUI3IDE']))write(folder+'/src/Sources/DiagnosticPaths.twin',fs.readFileSync('tbUI3/src/Sources/DiagnosticPaths.twin'));
const resources='tbIDE/tbUI3IDE/src/Resources/OTHER/';
write(resources+'tbUI3-theme-service.js',fs.readFileSync('tbIDE/tbUI3IDE/js/theme-service.js'));
write(resources+'tbUI3-installation.js',fs.readFileSync('tbIDE/tbUI3IDE/js/installation-ui.js'));
write(resources+'tbUI3-installation.css',fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/winui.css','utf8')+'\n'+fs.readFileSync('tbIDE/tbUI3IDE/js/installation-layout.css','utf8'));
write(resources+'tbUI3-dialog.css',fs.readFileSync('tbIDE/tbUI3IDE/js/installation-dialog.css'));
const prototype='tbIDE/prototypes/welcome-wizard/';
write(resources+'tbUI3-welcome.js',addWelcomeStartup(fs.readFileSync(prototype+'welcome.js','utf8')));
write(resources+'tbUI3-welcome.css',fs.readFileSync(prototype+'welcome.css'));
write(resources+'tbUI3-welcome-master.css',fs.readFileSync(prototype+'master.css'));
write(resources+'tbUI3-welcome-controls.js',fs.readFileSync(prototype+'controls.js'));
for(const [folder,version]of(addinOnly?[['tbIDE/tbUI3IDE',config.addinVersion]]:[['tbIDE/Updater',config.updaterVersion],['tbIDE/tbUI3IDE',config.addinVersion]])){
 const file=folder+'/src/Settings',old=fs.readFileSync(file,'utf8'),settings=JSON.parse(old),parts=version.split('.').map(Number);
 for(const [i,key]of['Major','Minor','Build','Revision'].entries())settings['project.version'+key]=parts[i];
 if(folder.endsWith('tbUI3IDE'))settings['project.buildPath']='${SourcePath}\\Build\\${Architecture}\\tbUI3IDE.dll';
 write(file,JSON.stringify(settings,null,'\t').replace(/\n/g,old.includes('\r\n')?'\r\n':'\n')+(old.endsWith('\r\n')?'\r\n':'\n'));
 const project=folder+'/'+(folder.endsWith('Updater')?'Updater':'tbUI3IDE')+'.twinproj',bytes=fs.readFileSync(project),entries=scan(bytes),replace={},add={};
 const walk=(base,rel='')=>{for(const item of fs.readdirSync(base,{withFileTypes:true})){const name=rel+item.name;if(item.isDirectory())walk(base+'/'+item.name,name+'/');else{const data=fs.readFileSync(base+'/'+item.name);if(entries[name]){const e=entries[name];if(!data.equals(bytes.subarray(e.cStart+4,e.cEnd)))replace[name]=data;}else add[name]=data;}}};
 walk(folder+'/src');if(Object.keys(replace).length||Object.keys(add).length)write(project,edit(bytes,{replace,add}));
 console.log(project+': synchronized '+Object.keys(replace).length+' existing and '+Object.keys(add).length+' new entries.');
}
