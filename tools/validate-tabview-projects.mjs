import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { scan } from './twinproj-edit.mjs';
function content(file) {
    const b=fs.readFileSync(file),files=new Map();
    for(const [p,e] of Object.entries(scan(b))) if(e.type==='file') files.set(p,b.subarray(e.cStart+4,e.cEnd));
    return files;
}
const projects=[['tbUI3/tbUI3.twinproj','tbUI3/src'],['tbUI3Test/tbUI3Test.twinproj','tbUI3Test/src'],
    ['tbIDE/tbUI3IDE/tbUI3IDE.twinproj','tbIDE/tbUI3IDE/src']];
const all=[];
for(const [project,mirror] of projects) {
    const files=content(project);all.push(files);
    for(const [rel,data] of files) {
        assert(data.equals(fs.readFileSync(path.join(mirror,rel))),'Mirror mismatch: '+project+' '+rel);
        if (/(?:^|\/)(?:Settings|\.meta)$|\.(?:tbform|tbcontrol|tbppage|tbreport|json)$/i.test(rel)) {
            try { JSON.parse(data.toString('utf8')); }
            catch (error) { throw new Error('Invalid stored JSON: '+project+' '+rel, {cause:error}); }
        }
        if(rel.endsWith('.twin')) assert(!/(?<!\r)\n/.test(data.toString()),'Non-CRLF source: '+rel);
    }
    function check(dir,rel='') {for(const e of fs.readdirSync(dir,{withFileTypes:true})){
        const p=rel?rel+'/'+e.name:e.name;
        if(e.isDirectory())check(path.join(dir,e.name),p);else assert(files.has(p),'Stale mirror: '+mirror+'/'+p);
    }}
    check(mirror);console.log(project+': '+files.size+' exact mirrors');
}
const [pkg,test]=all;
assert.equal(JSON.parse(pkg.get('Settings'))['project.versionRevision'],69);
const imported=JSON.parse(test.get('Settings'))['project.references'].find(r=>r.symbolId==='tbUI3');
assert.equal(Number(imported.versionRevision),69);
for(const [p,data] of pkg) if(p!=='.meta') assert(data.equals(test.get('Packages/tbUI3/'+p)),'Embedded package mismatch: '+p);
for(const name of ['UI3Button','UI3FormTheme','UI3IconList','UI3TabView','UI3TabPage']) {
    const ids=JSON.parse(fs.readFileSync('tbUI3/'+name+'-ids.json'));
    const source=pkg.get('Sources/'+name+'.twin').toString();
    const descriptor=JSON.parse(pkg.get('Sources/'+name+'.tbcontrol'))[0];
    for(const [key,attr] of Object.entries({form:'FormDesignerId',cls:'ClassId',itf:'InterfaceId',evt:'EventInterfaceId'}))
        assert.equal(source.match(new RegExp('\\['+attr+'\\("([^"\\r\\n]+)"\\)\\]'))[1],ids[key],name+' '+attr);
    assert.equal(descriptor.FormDesignerId,'{'+ids.form+'}');
    if(name.startsWith('UI3Tab')) {assert(descriptor.ControlContainer);assert(descriptor.Public);assert(!descriptor.Windowless);}
}
for(const name of ['frmMain','frmMultiPage']) {
    const f=JSON.parse(test.get('Sources/'+name+'.tbform'))[0];
    assert.equal('{'+test.get('Sources/'+name+'.twin').toString().match(/FormDesignerId\("([^"\r\n]+)"\)/)[1]+'}',f.FormDesignerId);
}
const form=JSON.parse(test.get('Sources/frmMultiPage.tbform'))[0],host=form._children.find(c=>c._className==='tbUI3.UI3TabView');
assert.equal(host._className,'tbUI3.UI3TabView');assert.equal(host._children.length,3);
for(const page of host._children) {assert.equal(page._className,'tbUI3.UI3TabPage');assert(page._children.length>0);}
console.log('Package reference, full embedded package, control IDs, form IDs, real page ownership and CRLF verified.');
