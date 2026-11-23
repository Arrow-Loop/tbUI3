// Keep shared native contracts, UI resources and canonical projects synchronized in one pass.
import fs from 'node:fs';import {scan,edit}from'../../tools/twinproj-edit.mjs';
const config=JSON.parse(fs.readFileSync('tbIDE/phase1-config.json'));
const write=(file,bytes)=>{if(fs.existsSync(file)&&fs.readFileSync(file).equals(Buffer.from(bytes)))return;fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,bytes);};
const twin=(file,text)=>write(file,text.replace(/\r?\n/g,'\r\n'));
const configuration=`' Generated from tbIDE/phase1-config.json.\nPrivate Module Phase1Config\n    Public Const MinIdeBuild As Long = ${config.minIdeBuild}\n    Public Const MaxIdeBuild As Long = ${config.maxIdeBuild}\n    Public Const AddinVersion As String = "${config.addinVersion}"\n    Public Const UpdaterVersion As String = "${config.updaterVersion}"\nEnd Module\n`;
twin('tbIDE/Updater/src/Sources/Phase1Config.twin',configuration);
const shared=['UpdateJson','UpdaterJson','UpdaterPlatform','UpdaterProcesses','InstallationContracts','ManagedResources','Phase1Config'];
for(const name of shared)write(`tbIDE/tbUI3IDE/src/Sources/${name}.twin`,fs.readFileSync(`tbIDE/Updater/src/Sources/${name}.twin`));
const resources='tbIDE/tbUI3IDE/src/Resources/OTHER/';
write(resources+'tbUI3-installation.js',fs.readFileSync('tbIDE/tbUI3IDE/js/installation-ui.js'));
write(resources+'tbUI3-installation.css',fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/winui.css','utf8')+'\n'+fs.readFileSync('tbIDE/tbUI3IDE/js/installation-layout.css','utf8'));
write(resources+'tbUI3-dialog.css',fs.readFileSync('tbIDE/tbUI3IDE/js/installation-dialog.css'));
const prototype='tbIDE/prototypes/welcome-wizard/';
write(resources+'tbUI3-welcome.js',fs.readFileSync(prototype+'welcome.js'));
write(resources+'tbUI3-welcome.css',fs.readFileSync(prototype+'welcome.css'));
const master=fs.readFileSync('tbIDE/Updater/src/Resources/OTHER/winui.css','utf8');
write(resources+'tbUI3-welcome-tokens.css',master.slice(0,master.indexOf('@layer base')).replace(/:root/g,'.tbUI3-welcome-shell'));
for(const [folder,version]of[['tbIDE/Updater',config.updaterVersion],['tbIDE/tbUI3IDE',config.addinVersion]]){
 const file=folder+'/src/Settings',old=fs.readFileSync(file,'utf8'),settings=JSON.parse(old),parts=version.split('.').map(Number);
 for(const [i,key]of['Major','Minor','Build','Revision'].entries())settings['project.version'+key]=parts[i];
 if(folder.endsWith('tbUI3IDE'))settings['project.buildPath']='${SourcePath}\\Build\\${Architecture}\\tbUI3IDE.dll';
 write(file,JSON.stringify(settings,null,'\t').replace(/\n/g,old.includes('\r\n')?'\r\n':'\n')+(old.endsWith('\r\n')?'\r\n':'\n'));
 const project=folder+'/'+(folder.endsWith('Updater')?'Updater':'tbUI3IDE')+'.twinproj',bytes=fs.readFileSync(project),entries=scan(bytes),replace={},add={};
 const walk=(base,rel='')=>{for(const item of fs.readdirSync(base,{withFileTypes:true})){const name=rel+item.name;if(item.isDirectory())walk(base+'/'+item.name,name+'/');else{const data=fs.readFileSync(base+'/'+item.name);if(entries[name]){const e=entries[name];if(!data.equals(bytes.subarray(e.cStart+4,e.cEnd)))replace[name]=data;}else add[name]=data;}}};
 walk(folder+'/src');if(Object.keys(replace).length||Object.keys(add).length)write(project,edit(bytes,{replace,add}));
 console.log(project+': synchronized '+Object.keys(replace).length+' existing and '+Object.keys(add).length+' new entries.');
}
