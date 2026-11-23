import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
test('all standalone production native IDE Eval snippets parse as JavaScript',()=>{
 const source=read('tbIDE/tbUI3IDE/src/Sources/UpdaterController.twin');
 const snippets=[...source.matchAll(/Eval\("([^"\r\n]*)"\)/g),...source.matchAll(/^\s*Eval "([^"\r\n]*)"\s*$/gm)];assert(snippets.length>=5);
 for(const m of snippets)assert.doesNotThrow(()=>new vm.Script(m[1]),m[1]);
});
test('shared native contracts remain byte-identical in both projects',()=>{
 for(const name of ['UpdateJson','UpdaterJson','UpdaterPlatform','UpdaterProcesses','InstallationContracts','ManagedResources','Phase1Config'])assert(fs.readFileSync('tbIDE/Updater/src/Sources/'+name+'.twin').equals(fs.readFileSync('tbIDE/tbUI3IDE/src/Sources/'+name+'.twin')),name);
});
test('production embeds Quill view unchanged and excludes preview adapter',()=>{
 for(const [name,resource]of [['welcome.js','tbUI3-welcome.js'],['welcome.css','tbUI3-welcome.css']])assert.equal(read('tbIDE/prototypes/welcome-wizard/'+name),read('tbIDE/tbUI3IDE/src/Resources/OTHER/'+resource));
 assert(!fs.existsSync('tbIDE/tbUI3IDE/src/Resources/OTHER/index.html'));
 const tokens=read('tbIDE/tbUI3IDE/src/Resources/OTHER/tbUI3-welcome-tokens.css');assert(!tokens.includes(':root'));assert(!tokens.includes('@layer components'));assert(tokens.includes('.tbUI3-welcome-shell'));
});
test('every source version matches configuration without renumbering core control package',()=>{
 const config=JSON.parse(read('tbIDE/phase1-config.json'));
 for(const [folder,version]of [['Updater',config.updaterVersion],['tbUI3IDE',config.addinVersion]]){const s=JSON.parse(read('tbIDE/'+folder+'/src/Settings'));assert.equal(['Major','Minor','Build','Revision'].map(k=>s['project.version'+k]).join('.'),version);}
 assert.equal(JSON.parse(read('tbUI3/src/Settings'))['project.versionMajor'],1);
});

test('native source procedure boundaries and endings are structurally intact',()=>{
 for(const folder of ['tbIDE/Updater/src/Sources','tbIDE/tbUI3IDE/src/Sources'])for(const file of fs.readdirSync(folder).filter(n=>n.endsWith('.twin'))){
  const code=read(folder+'/'+file).split(/\r?\n/).map(line=>line.replace(/"(?:[^"]|"")*"/g,'""').replace(/'.*$/,''));
  for(const line of code)assert(!/End (Function|Sub|Property|Class|Module|Type)\s+\w/.test(line),file+': '+line);
  const text=code.join('\n').replace(/^\s*(?:Public |Private )?Interface\b[\s\S]*?^\s*End Interface\b/gm,'');
  for(const kind of ['Sub','Function','Class','Module','Type']){const starts=[...text.matchAll(new RegExp('^\\s*(?:(?:Public|Private|Friend|Static)\\s+)*'+kind+'\\s+','gm'))].length,ends=[...text.matchAll(new RegExp('\\bEnd '+kind+'\\b','gm'))].length;assert.equal(starts,ends,file+' '+kind+' boundaries');}
 }
});
