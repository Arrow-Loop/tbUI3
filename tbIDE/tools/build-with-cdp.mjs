// Uses the pinned MIT-licensed twinBASIC documentation CDP harness.
// Preserve all packed entries, project GUID and compiler settings except the private output path.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {scan,edit} from '../../tools/twinproj-edit.mjs';
import {readPE,requireAsInvokerManifest} from './pe-resources.mjs';
const [harness,ide,projectArg,arch,destinationArg,reportArg,requiredBuildArg]=process.argv.slice(2);
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>import(pathToFileURL(path.join(harness,p)).href);
const norm=p=>path.resolve(p).toLowerCase();
const report={schema:1,harnessCommit:'d7a800dc341f2ba74724bae10148f956d1efbf2b',arch,project:projectArg,ide,status:'failed'};
let work,cleanup;
try {
 if(process.platform!=='win32'||!requiredBuildArg||!['win32','win64'].includes(arch))throw Error('Expected Windows, a pinned IDE build and Win32/Win64.');
 const project=path.resolve(projectArg),destination=path.resolve(destinationArg);
 const original=fs.readFileSync(project),entries=scan(original),entry=entries.Settings;
 if(!entry||entry.type!=='file')throw Error('Packed Settings missing.');
 const sourceHash=hash(original);report.projectSha256=sourceHash;
 const settings=JSON.parse(original.subarray(entry.cStart+4,entry.cEnd));
 const version=['Major','Minor','Build','Revision'].map(k=>settings['project.version'+k]).join('.');
 process.env.TB_BROKER='off';delete process.env.TB_REGISTRY_OWNER;
 const {buildNumber}=await load('scripts/lib/tb-install.mjs');
 if(buildNumber(ide)!==Number(requiredBuildArg))throw Error('Selected IDE is not BETA '+requiredBuildArg);
 const {makeIdeCopy,removeTreeAsync}=await load('scripts/lib/tb-ide-copy.mjs');cleanup=removeTreeAsync;
 const {compileProject}=await load('scripts/lib/tb-build.mjs');
 const {leaseSlot}=await load('scripts/lib/tb-ide.mjs');
 const {startTidy,finishTidy}=await load('scripts/lib/tb-registry.mjs');
 const {asksForLlvm,holdLlvmCache}=await load('scripts/lib/tb-llvm-cache.mjs');
 work=fs.mkdtempSync(path.join(os.tmpdir(),'tbui3-release-'));
 const privateIde=makeIdeCopy({ide,dest:path.join(work,'ide')});
 const isolatedAppdata=path.join(work,'Roaming');fs.mkdirSync(isolatedAppdata,{recursive:true});
 const staged=path.join(work,path.basename(project)),output=path.join(work,path.basename(destination));
 const stagedSettings={...settings,'project.buildPath':output};
 const bytes=edit(original,{replace:{Settings:Buffer.from(JSON.stringify(stagedSettings,null,'\t').replace(/\n/g,'\r\n')+'\r\n')}});
 const stagedEntries=scan(bytes);
 for(const [name,e] of Object.entries(entries)){
  const n=stagedEntries[name];
  if(!n||e.type!==n.type)throw Error('Staging changed structure: '+name);
  if(e.type==='file'&&name!=='Settings'&&!original.subarray(e.cStart+4,e.cEnd).equals(bytes.subarray(n.cStart+4,n.cEnd)))throw Error('Staging changed '+name);
 }
 if(Object.keys(entries).length!==Object.keys(stagedEntries).length)throw Error('Unexpected staged entries.');
 if(stagedSettings['project.id']!==settings['project.id'])throw Error('Project identity changed.');
 fs.writeFileSync(staged,bytes);
 const sources=Object.entries(entries).filter(([name,e])=>e.type==='file'&&name.endsWith('.twin')).map(([,e])=>original.subarray(e.cStart+4,e.cEnd).toString('utf8')).join('\n');
 const llvm=asksForLlvm(settings,sources);
 Object.assign(report,{build:buildNumber(privateIde),version,projectId:settings['project.id'],stagedProjectSha256:hash(bytes),llvm});
 const tidy=startTidy({prefixes:[work]});if(!tidy)throw Error('Could not establish registry cleanup scope.');
 let slot,lease,result;const appdata=process.env.APPDATA;
 try {
  slot=await leaseSlot({tag:'tbUI3 release '+path.basename(project)+' '+arch});
  if(llvm)lease=await holdLlvmCache(privateIde);
  process.env.APPDATA=isolatedAppdata;
  result=await compileProject({project:staged,ide:privateIde,slot,arch,build:true,llvm,show:false,keep:false,timeout:180000,buildTimeout:300000,followRun:/\[\s*RunAfterBuild\b/i.test(sources)});
  report.result=result;
 } finally {
  if(appdata===undefined)delete process.env.APPDATA;else process.env.APPDATA=appdata;
  try{await lease?.release();}finally{try{await slot?.release();}finally{report.registryCleanup=finishTidy(tidy);}}
 }
 if(!report.registryCleanup)throw Error('IDE registry cleanup failed.');
 if(result.code!==0||result.counts[0]!==0||!result.built)throw Error(result.message||'Compiler/build returned '+result.code);
 if(norm(result.built)!==norm(output)||!fs.existsSync(output))throw Error('Build did not produce the exact requested private output.');
 if(hash(fs.readFileSync(project))!==sourceHash)throw Error('Canonical project changed during build.');
 const artifact=fs.readFileSync(output),pe=readPE(artifact);
 if(pe.machine!==(arch==='win32'?0x14c:0x8664)||pe.version!==version)throw Error('Compiled PE architecture/version mismatch.');
 if(path.extname(destination).toLowerCase()==='.exe')requireAsInvokerManifest(pe);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 const pending=destination+'.cdp-'+process.pid+'.tmp';
 try{fs.writeFileSync(pending,artifact,{flag:'wx'});fs.renameSync(pending,destination);}
 finally{if(fs.existsSync(pending))fs.unlinkSync(pending);}
 Object.assign(report,{output:destination,outputSha256:hash(artifact),status:'success'});
 console.log('Built '+path.basename(destination)+' '+arch+' '+version+' ('+artifact.length+' bytes).');
} catch(e){report.error=String(e.stack||e);console.error(e.message);process.exitCode=1;}
finally {
 try{if(work&&cleanup)await cleanup(work);}
 catch(e){report.cleanupWarning=String(e.message);console.error('Temporary workspace cleanup: '+e.message);}
 if(reportArg&&reportArg!=='-')fs.writeFileSync(reportArg,JSON.stringify(report,null,2)+'\n');
}
