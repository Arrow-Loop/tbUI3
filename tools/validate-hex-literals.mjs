// TB0012 guard: VB-compatible bare &H8000..&HFFFF literals are signed Integers.
// Strip strings/comments first; the same check runs on mirrors and canonical containers.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scan} from './twinproj-edit.mjs';
export const activeProjects=[
 ['tbUI3/tbUI3.twinproj','tbUI3/src'],
 ['tbUI3Test/tbUI3Test.twinproj','tbUI3Test/src'],
 ['tbIDE/tbUI3IDE/tbUI3IDE.twinproj','tbIDE/tbUI3IDE/src'],
 ['tbIDE/Updater/Updater.twinproj','tbIDE/Updater/src'],
];
function codeOnly(line){
 let result='',statementStart=true;
 for(let i=0;i<line.length;){
  const ch=line[i];
  if(ch==="'")break;
  if(statementStart&&/^Rem(?:\s|$)/i.test(line.slice(i)))break;
  if(ch==='"'){
   result+=' ';i++;
   while(i<line.length){
    result+=' ';
    if(line[i++]==='"'){
     if(line[i]==='"'){result+=' ';i++;}else break;
    }
   }
   statementStart=false;
  }else{
   result+=ch;i++;
   if(ch===':')statementStart=true;
   else if(!/\s/.test(ch))statementStart=false;
  }
 }
 return result;
}
export function findAmbiguousHex(source,file='<source>'){
 const diagnostics=[];
 for(const [index,line] of source.split(/\r?\n/).entries()){
  for(const match of codeOnly(line).matchAll(/&H([0-9a-f]+)([%&^]?)/gi)){
   const value=BigInt('0x'+match[1]);
   if(value>=0x8000n&&value<=0xffffn&&!match[2])diagnostics.push({
    file,line:index+1,column:match.index+1,literal:match[0],
    message:`${match[0]} infers a negative 16-bit Integer; use ${match[0]}& for a positive Long, or ${match[0]}% only for an intentional signed Integer.`,
   });
  }
 }
 return diagnostics;
}
function ownSource(name){
 return name.endsWith('.twin')&&(!name.includes('/Packages/')&&!name.startsWith('Packages/')||/(?:^|\/)Packages\/tbUI3\//.test(name));
}
function mirrorSources(folder){
 const result=[];
 for(const item of fs.readdirSync(folder,{withFileTypes:true})){
  const file=path.posix.join(folder,item.name);
  if(item.isDirectory())result.push(...mirrorSources(file));
  else if(ownSource(file))result.push(file);
 }
 return result;
}
export function validateHexLiterals(){
 const diagnostics=[];let mirrors=0,packed=0;
 for(const [project,mirror] of activeProjects){
  for(const file of mirrorSources(mirror)){
   diagnostics.push(...findAmbiguousHex(fs.readFileSync(file,'utf8'),file));mirrors++;
  }
  const bytes=fs.readFileSync(project);
  for(const [name,entry] of Object.entries(scan(bytes))){
   if(entry.type==='file'&&ownSource(name)){
    diagnostics.push(...findAmbiguousHex(bytes.subarray(entry.cStart+4,entry.cEnd).toString('utf8'),`${project}!${name}`));packed++;
   }
  }
 }
 return {diagnostics,mirrors,packed};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=validateHexLiterals();
 for(const d of result.diagnostics)console.error(`${d.file}:${d.line}:${d.column}: ${d.message}`);
 if(result.diagnostics.length)process.exitCode=1;
 else console.log(`Explicit high-bit hex widths verified: ${result.mirrors} source mirrors and ${result.packed} canonical source entries.`);
}