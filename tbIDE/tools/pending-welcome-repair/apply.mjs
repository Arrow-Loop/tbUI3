// One-time, repository-backed assembly handoff for the 0.4.0.3 UI repair.
// Run from a clean synchronized development checkout, with twinBASIC closed.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../..');
process.chdir(root);
function capture(exe,args){
 const r=spawnSync(exe,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
 if(r.error||r.status!==0)throw Error([exe,...args].join(' ')+' failed: '+(r.error?.message||r.stderr||r.stdout));
 return r.stdout;
}
const git=(...args)=>capture('git',args).trim();
function runNode(...args){
 console.log('\n> node '+args.join(' '));
 const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
 if(r.error||r.status!==0)throw Error('Validation or assembly failed: node '+args.join(' '));
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const blob=p=>git('hash-object','--no-filters',p);
const addin='tbIDE/tbUI3IDE/tbUI3IDE.twinproj',helper='tbIDE/Updater/Updater.twinproj';
const packager='tbIDE/tools/package-updater-release.ps1';
const changes=['theme.json','bridge.json','updates.json','version-docs.json'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')));
if(process.argv.slice(2).some(a=>a!=='--commit-push'))throw Error('Only --commit-push is supported.');
if(git('branch','--show-current')!=='tbui3-dev')throw Error('Switch to tbui3-dev first.');
if(git('status','--porcelain','--untracked-files=no'))throw Error('The tracked working tree is not clean. Commit or set aside your edits first.');
if(blob(addin)!=='79a9b52a50c653e0b48f604b9dfed921bb21360d'||blob(helper)!=='a4c551c6badb8e4c61b4f87f9721bd801376249b')throw Error('Canonical baseline changed; reconcile the candidate instead of overwriting a newer project.');
if(new Set(changes.map(c=>c.path)).size!==changes.length)throw Error('Duplicate candidate path.');
for(const c of changes){
 if(!/^(?:tbIDE\/|tests\/|CHANGELOG\.md$|ROADMAP\.md$)/.test(c.path)||c.path.includes('..')||typeof c.content!=='string')throw Error('Invalid candidate entry.');
 if(blob(c.path)!==c.sha)throw Error('Baseline changed: '+c.path+'; reconcile before applying.');
}
try{await import(process.env.TB_JSDOM_MODULE||'jsdom');}catch(e){throw Error('The repository regression suite requires jsdom. Install it locally or set TB_JSDOM_MODULE to the existing test runtime, then rerun. No files have been changed. '+e.message);}
for(const [project,mirror]of[[addin,'tbIDE/tbUI3IDE/src'],[helper,'tbIDE/Updater/src']]){
 const output=capture(process.execPath,['tools/twinproj-src.mjs','compare',project,mirror]);
 if(/(^|\n)DIFF /m.test(output))throw Error('Existing canonical/mirror mismatch in '+project);
}
const helperHash=hash(fs.readFileSync(helper)),packagerHash=hash(fs.readFileSync(packager));
for(const c of changes)fs.writeFileSync(c.path,c.content,'utf8');
// Keep the exact previously pinned shared Toolkit assets, but renew the view hashes.
const refPath='tbIDE/tbUI3IDE/WELCOME_REFERENCE.json',refBytes=fs.readFileSync(refPath,'utf8'),reference=JSON.parse(refBytes);
for(const n of ['master.css','controls.js']){
 if(reference.sha256[n]!==hash(fs.readFileSync('tbIDE/prototypes/welcome-wizard/'+n)))throw Error('Pinned shared Toolkit asset changed: '+n);
}
for(const n of ['welcome.js','welcome.css'])reference.sha256[n]=hash(fs.readFileSync('tbIDE/prototypes/welcome-wizard/'+n));
reference.integration='Pinned full shared Toolkit assets retained; view revised for 0.4.0.3 theme acknowledgement and miniature repair. Master CSS and shared controls remain isolated.';
reference.upstreamNote='sourceCommit identifies the initial approved baseline; sha256 identifies the exact current synchronized assets.';
fs.writeFileSync(refPath,(JSON.stringify(reference,null,2)+'\n').replace(/\n/g,refBytes.includes('\r\n')?'\r\n':'\n'));
runNode('tbIDE/tools/build-updater-script.mjs');
runNode('tbIDE/tools/sync-phase1-projects.mjs','--addin-only');
if(hash(fs.readFileSync(helper))!==helperHash||hash(fs.readFileSync(packager))!==packagerHash)throw Error('Helper project or release packaging changed unexpectedly.');
if(git('diff','--name-only').split(/\r?\n/).some(p=>p.startsWith('tbIDE/Updater/')))throw Error('Unexpected updater changes.');
// Re-run the generator and ensure idempotence before the full regression suite.
const assembled=hash(fs.readFileSync(addin));
runNode('tbIDE/tools/sync-phase1-projects.mjs','--addin-only');
if(hash(fs.readFileSync(addin))!==assembled)throw Error('Add-in synchronization was not idempotent.');
for(const file of ['tbIDE/tbUI3IDE/js/theme-service.js','tbIDE/tbUI3IDE/js/installation-ui.js','tbIDE/tbUI3IDE/js/updater.js','tbIDE/prototypes/welcome-wizard/welcome.js'])runNode('--check',file);
runNode('tools/validate-tabview-projects.mjs');
runNode('tools/validate-hex-literals.mjs');
const tests=fs.readdirSync('tests').filter(n=>n.endsWith('.mjs')).map(n=>'tests/'+n);
runNode('--test',...tests);
runNode('--test','tbIDE/prototypes/welcome-wizard/welcome.test.mjs');
for(const file of ['CHANGELOG.md','tbIDE/CHANGELOG.md']){
 const content=fs.readFileSync(file,'utf8'),needle='Native updater engine and release packaging are unchanged.';
 if(!content.includes(needle))throw Error('Missing validation insertion point: '+file);
 fs.writeFileSync(file,content.replace(needle,needle+' The full repository Node regression suite, isolated Wizard suite, exact mirror/hex validation and add-in-only generator idempotence passed during assembly.'),'utf8');
}
// The guarded handoff has served its purpose; do not ship duplicate candidate source files.
for(const name of ['theme.json','bridge.json','updates.json','version-docs.json','README.md','apply.mjs'])fs.unlinkSync(path.join(dir,name));
fs.rmdirSync(dir);
console.log('\n0.4.0.3 canonical source assembled and automated checks passed. Native build/live acceptance is still pending.');
if(process.argv.includes('--commit-push')){
 git('add','-u');
 git('commit','-m','Repair Welcome theme and update review UI for 0.4.0.3');
 git('push','origin','tbui3-dev');
 console.log('Validated source revision pushed to tbui3-dev. No main merge or release.');
}else console.log('Review and commit the tracked changes through GitHub Desktop, then push tbui3-dev.');
