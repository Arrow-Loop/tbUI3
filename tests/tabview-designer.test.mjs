import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source = fs.readFileSync('tbIDE/WinUI3IdeStyle/js/tabview-designer.js','utf8');
const factory = vm.runInNewContext(source);
class Node {
    constructor(properties = {}) {
        this.properties = properties; this.children = []; this.classes = new Set();
        this.classList = { add: x=>this.classes.add(x), remove: x=>this.classes.delete(x),
            contains: x=>this.classes.has(x), toggle: (x,on)=>on?this.classes.add(x):this.classes.delete(x) };
    }
    appendChild(c) { c.parentElement = c.parentNode = this; this.children.push(c); return c; }
    contains(c) { return c===this || this.children.some(x=>x.contains(c)); }
    closest(selector) { for(let c=this;c;c=c.parentElement) if(c.classes.has(selector.slice(1))) return c; return null; }
    remove() { if(this.parentElement) this.parentElement.children=this.parentElement.children.filter(c=>c!==this); }
    get childNodes() { return this.children; }
    get offsetLeft() { return Number(this.properties.Left)||0; }
    get offsetTop() { return Number(this.properties.Top)||0; }
    getBoundingClientRect() { return {left:100,top:50,width:this.properties.Width*1.5,height:this.properties.Height*1.5}; }
}
function fixture() {
    const form = new Node({_className:'Form',Name:'Form1'}); form.classList.add('designer');
    const host = form.appendChild(new Node({_className:'tbUI3.UI3TabView',Name:'Tabs1',SelectedPage:'Page1',Width:500,Height:240,Left:20,Top:20}));
    const g = {designer:form,allControls:[host],selectedControls:[host],designerContainerOUTER:{parentNode:{}},
        pendingChangesCount:0,outstandingSerializationRequests:0,multiChangeNestCount:0,isInFullFormMode:false,lockedControls:[]};
    const calls = { undo:0,edit:0,clipboard:0,move:[],events:new Map(),intervals:new Map() };
    const api = {
        getCurrentFormEditorGlobals:()=>g,
        preparePaste:()=>{g.selectedControls=[];return {parentContainer:form};},
        prepareForMultipleChangeProperties:()=>calls.edit++,handleMultipleChangeProperties:()=>{},
        deserializeControls:(g,json,parent)=>JSON.parse(json).map(p=>{const c=parent.appendChild(new Node(p));g.allControls.push(c);return c;}),
        getTopLeftOfAllControls:(g,cs)=>({x:cs[0].properties.Left,y:cs[0].properties.Top}),
        doPaste:(g,n,cs)=>{g.selectedControls=cs;},changedSelectedControls:()=>{},
        unselectAllControls:g=>{g.selectedControls.forEach(c=>{c.isSelected=false;c.classList.remove('baseControlSelected');});g.selectedControls=[];},
        lockTheControl:(g,n)=>{g.lockedControls=g.lockedControls.filter(x=>x.toLowerCase()!==n.toLowerCase());g.lockedControls.push(n);},
        unlockTheControl:(g,n)=>{g.lockedControls=g.lockedControls.filter(x=>x.toLowerCase()!==n.toLowerCase());},
        changeProperty:(g,c,k,v)=>{c.properties[k]=v;},undoPoint:()=>calls.undo++,
        getImageFromServer:()=>{},queueMultipleSnapshot:()=>{},syncPropertySheet:()=>{},updateAllControlDragPoints:()=>{},
        onSignificantChange:()=>{},deleteSelectedControls:g=>{for(const c of g.selectedControls){g.allControls=g.allControls.filter(x=>!c.contains(x));c.remove();c.isDeleted=true;}g.selectedControls=[form];},
        document:{head:new Node(),createElement:()=>new Node(),addEventListener:(t,f)=>calls.events.set(t,f),removeEventListener:t=>calls.events.delete(t)},
        setInterval:f=>{calls.intervals.set(1,f);return 1;},clearInterval:id=>calls.intervals.delete(id)
    };
    const adapter=factory(api);
    const page=(name,order=0)=>{const c=host.appendChild(new Node({_className:'tbUI3.UI3TabPage',Name:name,PageOrder:order,Left:0,Top:40,Width:500,Height:200}));g.allControls.push(c);return c;};
    return {form,host,g,calls,api,adapter,page};
}
test('new page is a direct host child even when a child of the first page is selected',()=>{
    const f=fixture(),p=f.page('Page1'),child=p.appendChild(new Node({_className:'TextBox',Name:'Text1',Left:18,Top:30}));
    f.g.allControls.push(child);f.g.selectedControls=[child];
    assert.equal(f.adapter.run('new'),'Tabs1_Page2');
    const created=f.g.allControls.at(-1);
    assert.equal(created.parentElement,f.host);assert.notEqual(created.parentElement,p);
    assert.equal(f.host.properties.SelectedPage,'Tabs1_Page2');assert.equal(f.calls.undo,1);
    assert.equal(child.properties.Left,18);assert.equal(child.properties.Top,30);
});
test('creation reserves a unique name across the whole form and keeps existing page order',()=>{
    const f=fixture();f.page('Tabs1_Page1',8);f.page('Tabs1_Page3',2);
    assert.equal(f.adapter.run('new'),'Tabs1_Page4');assert.equal(f.g.allControls.at(-1).properties.PageOrder,9);
});
test('switching changes only selection and designer visibility, never child coordinates or Visible',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2',1);
    f.adapter.install();const before=JSON.stringify([a.properties,b.properties]);
    const handler=f.calls.events.get('pointerdown');let intercepted=0;
    handler({button:0,target:f.host,clientX:100+250*1.5,clientY:50+20*1.5,preventDefault:()=>intercepted++,stopImmediatePropagation:()=>intercepted++});
    assert.equal(intercepted,2);assert.equal(f.host.properties.SelectedPage,'Page2');
    assert.equal(JSON.stringify([a.properties,b.properties]),before);
    assert(a.classes.has('tbui3-inactive-page'));assert(!b.classes.has('tbui3-inactive-page'));
    f.adapter.tick();assert.equal(f.host.properties.SelectedPage,'Page2');
});
test('Properties selection reveals a child on an inactive page without stealing that selection',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2',1),child=b.appendChild(new Node({_className:'TextBox',Name:'Text2'}));
    f.g.allControls.push(child);f.adapter.tick();f.g.selectedControls=[child];f.adapter.tick();
    assert.equal(f.host.properties.SelectedPage,'Page2');assert.equal(f.g.selectedControls[0],child);
    assert(a.classes.has('tbui3-inactive-page'));assert(!b.classes.has('tbui3-inactive-page'));
});
test('reordering normalizes duplicate orders and preserves selected page identity',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2');f.host.properties.SelectedPage='Page2';
    f.adapter.run('left');assert.equal(b.properties.PageOrder,0);assert.equal(a.properties.PageOrder,1);
    assert.equal(f.host.properties.SelectedPage,'Page2');assert.equal(f.calls.undo,1);
    f.adapter.run('left');assert.equal(f.calls.undo,1);
});
test('delete removes the page subtree and selects a surviving neighbor with one undo checkpoint',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2',1),child=a.appendChild(new Node({Name:'Text1'}));f.g.allControls.push(child);
    f.adapter.run('delete');assert(!f.g.allControls.includes(a));assert(!f.g.allControls.includes(child));
    assert.equal(f.host.properties.SelectedPage,'Page2');assert.equal(f.calls.undo,1);assert.equal(f.g.selectedControls[0],f.host);
    f.adapter.run('delete');assert.equal(f.host.properties.SelectedPage,'');assert.equal(f.calls.undo,2);
});
test('compiler replies, drag operations and resync block mutation',()=>{
    for(const flag of ['pendingChangesCount','outstandingSerializationRequests','isDragging','isSyncingToLiveForm','isInitialSync','multiChangeNestCount']){
        const f=fixture();f.g[flag]=1;const count=f.g.allControls.length;
        assert.match(f.adapter.run('new'),/waiting for the compiler/);assert.equal(f.g.allControls.length,count);assert.equal(f.calls.undo,0);
    }
});
test('hidden resize handles and page nodes are restored when the add-in unloads',()=>{
    const f=fixture();f.page('Page1');const b=f.page('Page2',1);b.draggerTop=new Node();
    f.adapter.install();assert(b.draggerTop.classes.has('tbui3-inactive-page'));
    f.adapter.dispose();assert.equal(f.calls.intervals.size,0);assert.equal(f.calls.events.size,0);
    assert(!b.classes.has('tbui3-inactive-page'));assert(!b.draggerTop.classes.has('tbui3-inactive-page'));
});
test('unsupported internals install no timer, style or event hook',()=>{
    const f=fixture();delete f.api.deserializeControls;
    assert.match(f.adapter.install(),/Unsupported/);assert.equal(f.calls.events.size,0);assert.equal(f.api.document.head.children.length,0);
});
test('report and control-definition designers are left alone',()=>{
    const f=fixture();f.form.properties._className='UserControl';assert.match(f.adapter.run('new'),/consumer Form/);
    f.form.properties._className='Form';f.g.designerContainerOUTER.parentNode.isReportMode=true;assert.match(f.adapter.run('new'),/consumer Form/);
});
test('verb request is consumed once, not once per timer tick',()=>{
    const f=fixture();f.adapter.tick();f.host.properties.DesignerNewPageRequest=1;f.adapter.tick();const count=f.g.allControls.length;
    f.adapter.tick();f.adapter.tick();assert.equal(f.g.allControls.length,count);assert.equal(f.calls.undo,1);
});
test('insertion against actual IDE preparePaste/doPaste keeps coordinates and the intended parent',t=>{
    const file=process.env.TB_IDE_MAIN_JS;
    if(!file) return t.skip('Set TB_IDE_MAIN_JS to run the optional installed-IDE contract check');
    const ide=fs.readFileSync(file,'utf8'),f=fixture(),a=f.page('Page1');f.g.selectedControls=[a];
    // Extract just the named function bodies without redistributing the IDE source.
    function extract(name){const start=ide.indexOf('function '+name+'(');assert(start>=0);let pos=start;while((pos=ide.indexOf('}',pos+1))>=0){try{const text=ide.slice(start,pos+1);new vm.Script('('+text+')');return text;}catch{}}throw Error(name);}
    const sandbox={unselectAllControls:f.api.unselectAllControls,getLowestPointOfControls:()=>({x:0,y:0}),
        changedSelectedControls:f.api.changedSelectedControls,getTopLeftOfAllControls:f.api.getTopLeftOfAllControls,
        moveControls:(g,cs,dx,dy)=>f.calls.move.push([dx,dy]),updateAllControlDragPoints:()=>{},
        doAnchoringAdjustments:()=>{},onSignificantChange:()=>{}};
    for(const name of ['preparePaste','doPaste']) f.api[name]=vm.runInNewContext('('+extract(name)+')',sandbox);
    f.adapter.run('new');assert.equal(f.g.allControls.at(-1).parentElement,f.host);assert.deepEqual(f.calls.move,[[0,0]]);
});
test('refresh does not replay a verb request from the previous adapter',()=>{
    const f=fixture();f.host.properties.DesignerNewPageRequest=4;f.adapter.tick();
    assert.equal(f.g.allControls.length,1);assert.equal(f.calls.undo,0);
});
test('partial insertion failure still requests an undo checkpoint',()=>{
    const f=fixture();f.api.deserializeControls=(g,json)=>{
        const c=f.form.appendChild(new Node(JSON.parse(json)[0]));g.allControls.push(c);return[c];
    };
    assert.match(f.adapter.run('new'),/direct page child/);assert.equal(f.calls.undo,1);
    f.api.deserializeControls=()=>[];
    assert.match(f.adapter.run('new'),/direct page child/);assert.equal(f.calls.undo,2);
});
test('a timer exception restores the native designer rather than leaving invisible pages',()=>{
    const f=fixture();f.page('Page1');const b=f.page('Page2',1);f.adapter.install();
    assert(b.classes.has('tbui3-inactive-page'));
    f.api.getCurrentFormEditorGlobals=()=>{throw Error('IDE contract changed');};
    f.calls.intervals.get(1)();assert(!b.classes.has('tbui3-inactive-page'));assert.equal(f.calls.intervals.size,0);
    assert.match(f.adapter.lastError,/IDE contract changed/);assert.match(f.adapter.run('new'),/Adapter disabled/);
    assert.equal(f.g.lockedControls.length,0);
});
test('narrow hosts keep the selected overflow tab reachable and the add button separate',()=>{
    const f=fixture();f.host.properties.Width=235;
    const list=[f.page('Page1',0),f.page('Page2',1),f.page('Page3',2),f.page('Page4',3)];
    f.host.properties.SelectedPage='Page4';f.adapter.install();
    const handler=f.calls.events.get('pointerdown');
    handler({button:0,target:f.host,clientX:100+30*1.5,clientY:50+20*1.5,preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(f.host.properties.SelectedPage,'Page3');assert.equal(f.g.selectedControls[0],list[2]);
});
test('embedded twinBASIC script exactly reconstructs parseable JavaScript',()=>{
    const p='tbIDE/WinUI3IdeStyle/src/Sources/TabViewDesignerScript.twin';
    if(!fs.existsSync(p)) return;
    const src=fs.readFileSync(p,'utf8');let js='';
    for(const line of src.split(/\r?\n/)) {
        if(line.trim()==='js = js & vbLf'){js+='\n';continue;}
        if(!line.trim().startsWith('js = js & '))continue;
        for(const part of line.trim().slice(10).split(' & ')) {
            if(part==='Chr(34)') js+='"';
            else {assert(part.startsWith('"')&&part.endsWith('"'));js+=part.slice(1,-1);}
        }
    }
    new vm.Script(js);assert(js.includes(source.trim()));assert(!src.match(/"[^"\r\n]+""[^"\r\n]+"/));
});
test('new UserControl defaults are replaced through native setters after compiler acknowledgement',()=>{
    const f=fixture();f.page('Existing',7);f.g.isInFullFormMode=true;f.host.formDesignerControlId=1;
    const original=f.api.deserializeControls;
    f.api.deserializeControls=(g,json,parent)=>{
        const cs=original(g,json,parent);
        cs[0].properties.Caption='Page';cs[0].properties.PageOrder=0;
        g.pendingChangesCount=1;return cs;
    };
    f.adapter.run('new');const created=f.g.allControls.at(-1);
    assert.equal(created.properties.Caption,'Page');assert.equal(f.calls.undo,0);
    assert.match(f.adapter.run('new'),/waiting for the compiler/);
    f.g.pendingChangesCount=0;f.adapter.tick();assert.equal(f.calls.undo,0);
    created.formDesignerControlId=99;f.adapter.tick();
    assert.equal(created.properties.Caption,'Page 2');assert.equal(created.properties.PageOrder,8);
    assert.equal(f.calls.undo,1);f.adapter.tick();assert.equal(f.calls.undo,1);
});
test('the marked harness initializes native properties once and keeps later user edits',()=>{
    const f=fixture();f.host.properties.Name='UI3TabView1';
    Object.assign(f.form.properties,{Tag:'tbUI3:MultiPageHarness:1',FormDesignerId:'{B64F9C2B-DC41-4C4E-8C0F-7147B529D994}'});
    const pages=['pgGeneral','pgDetails','pgFinish'].map(n=>f.page(n));
    for(let i=0;i<3;i++)f.g.allControls.push(pages[i].appendChild(new Node({_className:'tbUI3.UI3Button',Name:'cmdPage'+(i+1),Caption:'Button'})));
    f.adapter.tick();assert.deepEqual(pages.map(p=>p.properties.Caption),['General','Details','Finish']);
    assert.deepEqual(pages.map(p=>p.properties.PageOrder),[0,1,2]);
    assert.equal(f.host.properties.SelectedPage,'pgGeneral');assert.equal(f.form.properties.Tag,'');assert.equal(f.calls.undo,1);
    pages[0].properties.Caption='My edit';f.adapter.tick();assert.equal(pages[0].properties.Caption,'My edit');
});
test('a marker copied to another form does not authorize harness initialization',()=>{
    const f=fixture();f.host.properties.Name='UI3TabView1';
    Object.assign(f.form.properties,{Tag:'tbUI3:MultiPageHarness:1',FormDesignerId:'{OTHER-FORM}'});
    const page=f.page('pgGeneral');f.page('pgDetails');f.page('pgFinish');page.properties.Caption='Keep this';
    f.adapter.tick();assert.equal(page.properties.Caption,'Keep this');assert.equal(f.calls.undo,0);
});
test('diagnostics reveal rejected class/selection state without changing controls or undo history',()=>{
    const f=fixture(),p=f.page('Page1');p.properties.Caption='Page';p.imageData='';
    f.form.properties._className='MyProject.frmMultiPage';f.g.selectedControls=[p];
    const before=JSON.stringify([f.form.properties,f.host.properties,p.properties]);
    const text=f.adapter.run('diagnostics');assert(text.startsWith('DIAGNOSTICS '));
    const report=JSON.parse(text.slice(12));assert.equal(report.adapter,8);assert.equal(report.consumerAccepted,false);
    assert.equal(report.form.className,'MyProject.frmMultiPage');assert.equal(report.controls.length,2);
    assert.equal(report.selection[0].name,'Page1');assert.equal(f.calls.undo,0);
    assert.equal(JSON.stringify([f.form.properties,f.host.properties,p.properties]),before);
});
test('diagnostics report missing internals even when normal editing commands are disabled',()=>{
    const f=fixture();delete f.api.deserializeControls;
    const report=JSON.parse(f.adapter.run('diagnostics').slice(12));
    assert.equal(report.supported,false);assert(report.missing.includes('deserializeControls'));assert.equal(f.calls.undo,0);
});

// Live property changes are acknowledged asynchronously, unlike the simple facade above.
function liveFixture(t) {
    const file=process.env.TB_IDE_MAIN_JS;
    if(!file){t.skip('Set TB_IDE_MAIN_JS for live-designer protocol checks');return;}
    const ide=fs.readFileSync(file,'utf8'),f=fixture();
    function extract(name){const start=ide.indexOf('function '+name+'(');assert(start>=0);let pos=start;while((pos=ide.indexOf('}',pos+1))>=0){try{const text=ide.slice(start,pos+1);new vm.Script('('+text+')');return text;}catch{}}throw Error(name);}
    const sandbox={};
    for(const name of ['prepareForMultipleChangeProperties','handleMultipleChangeProperties','queueMultipleChangeProperty','queueMultipleSnapshot','getImageFromServer','changeProperty'])
        sandbox[name]=vm.runInNewContext('('+extract(name)+')',sandbox);
    Object.assign(f.api,sandbox);
    f.g.isInFullFormMode=true;f.g.uniqueFormDesignerId='fixture';f.host.formDesignerControlId=1;
    f.calls.messages=[];f.g.exampleSocket={send:wire=>f.calls.messages.push(JSON.parse(wire.split('/FORMJSON/0/')[1]))};
    const page=f.page;
    f.page=(name,order=0)=>{const p=page(name,order);p.formDesignerControlId=f.g.allControls.length;return p;};
    f.ack=()=>{for(const batch of f.calls.messages.splice(0)){
        for(const change of batch)if(typeof change==='object'){
            const c=f.g.allControls.find(c=>c.formDesignerControlId===change.controlID);if(c)c.properties[change.propertyName]=change.value;
        }
        f.g.pendingChangesCount--;
    }};
    return f;
}
test('live reordering requests a host bitmap in the same native batch',t=>{
    const f=liveFixture(t);if(!f)return;f.page('Page1');f.page('Page2',1);
    f.adapter.run('right');
    assert(f.calls.messages.some(batch=>batch.includes(1)),'Parent header snapshot missing');
    assert.equal(f.host.properties.SelectedPage,'Page1');
    f.ack();assert.equal(f.g.pendingChangesCount,0);
});
test('live page insertion activates the host only after the new ID exists',t=>{
    const f=liveFixture(t);if(!f)return;f.page('Page1');
    f.adapter.run('new');const added=f.g.allControls.at(-1);
    assert(!f.calls.messages.flat().some(v=>v&&v.propertyName==='SelectedPage'),'Host activated before page acknowledgement');
    added.formDesignerControlId=90;f.adapter.tick();
    const batch=f.calls.messages.at(-1);
    assert(batch.some(v=>v&&v.controlID===1&&v.propertyName==='SelectedPage'&&v.value===added.properties.Name));
    assert(batch.includes(1),'Configured page did not refresh parent headers');
    f.ack();f.adapter.tick();
    assert.equal(f.host.properties.SelectedPage,added.properties.Name);
    f.adapter.install();const handler=f.calls.events.get('pointerdown');
    handler({button:0,target:f.host,clientX:145,clientY:80,preventDefault(){},stopImmediatePropagation(){}});
    f.ack();f.adapter.tick();assert.equal(f.host.properties.SelectedPage,'Page1');
    handler({button:0,target:f.host,clientX:100+350*1.5,clientY:80,preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(f.host.properties.SelectedPage,'Page1');
    f.ack();f.adapter.tick();assert.equal(f.host.properties.SelectedPage,added.properties.Name);
});
test('live delete and refresh include the host in the native snapshot request',t=>{
    const f=liveFixture(t);if(!f)return;f.page('Page1');f.page('Page2',1);
    f.adapter.run('delete');assert(f.calls.messages.some(batch=>batch.includes(1)));
    f.ack();f.adapter.tick();f.adapter.run('refresh');
    assert(f.calls.messages.some(batch=>batch.includes(1)));
});
test('full-form bitmap diagnostics use the background image rather than an empty imageData',()=>{
    const f=fixture();
    const header=Buffer.alloc(33);header.write('\x89PNG\r\n\x1a\n',0,'binary');header.writeUInt32BE(500,16);header.writeUInt32BE(240,20);
    f.host.style={backgroundImage:'url("data:image/png;base64,'+header.toString('base64')+'")'};
    f.api.document.defaultView={getComputedStyle:()=>({}),atob:s=>Buffer.from(s,'base64').toString('binary')};
    const report=JSON.parse(f.adapter.run('diagnostics').slice(12));
    assert.equal(report.controls[0].snapshot.pngSize,'500x240');assert(report.controls[0].snapshot.encodedLength>0);
    assert(!JSON.stringify(report).includes(header.toString('base64')));
});
test('one plus gesture on an empty host sends one page insertion',()=>{
    const f=fixture();let insertions=0;const deserialize=f.api.deserializeControls;
    f.api.deserializeControls=(...args)=>{insertions++;return deserialize(...args);};
    f.adapter.install();f.calls.events.get('pointerdown')({button:0,target:f.host,clientX:115,clientY:80,preventDefault(){},stopImmediatePropagation(){}});
    f.adapter.tick();f.adapter.tick();
    assert.equal(insertions,1);assert.equal(f.host.children.length,1);
    assert.equal(f.g.selectedControls[0],f.host.children[0]);
});
test('matching captions remain distinct pages with their own header selections',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2',1);
    a.properties.Caption=b.properties.Caption='Same caption';f.adapter.install();
    f.calls.events.get('pointerdown')({button:0,target:f.host,clientX:100+350*1.5,clientY:80,preventDefault(){},stopImmediatePropagation(){}});
    assert.equal(f.host.properties.SelectedPage,'Page2');assert.equal(f.g.selectedControls[0],b);
    assert(a.classes.has('tbui3-inactive-page'));assert(!b.classes.has('tbui3-inactive-page'));
});
test('diagnostics distinguish a native header count from distinct designer page names',()=>{
    const f=fixture();f.page('Page1');f.host.properties.PageCount=2;
    const host=JSON.parse(f.adapter.run('diagnostics').slice(12)).controls[0];
    assert.equal(host.nativePageCount,2);assert.equal(host.designerPageCount,1);assert.deepEqual(host.designerPageNames,['Page1']);
});
test('toolbar hover help explains page deletion and diagnostics, and is restored on unload',()=>{
    const f=fixture(),buttons=new Map(['tbUI3TabDelete','tbUI3TabDiagnostics'].map(id=>['addinButton-'+id,{title:id}]));
    f.api.document.getElementById=id=>buttons.get(id);f.adapter.install();
    assert.match(buttons.get('addinButton-tbUI3TabDelete').title,/every control it contains/);
    assert.match(buttons.get('addinButton-tbUI3TabDiagnostics').title,/tbUI3-tabview.log/);
    f.adapter.dispose();assert.equal(buttons.get('addinButton-tbUI3TabDelete').title,'tbUI3TabDelete');
});
test('page protection preserves child/host editing and restores pre-existing locks on unload',()=>{
    const f=fixture(),a=f.page('Page1'),b=f.page('Page2',1),child=a.appendChild(new Node({_className:'TextBox',Name:'Text1'}));f.g.allControls.push(child);
    f.g.lockedControls=['Text1','Page2'];const before=JSON.stringify(f.g.allControls.map(c=>c.properties));
    f.adapter.install();assert.deepEqual([...f.g.lockedControls].sort(),['Page1','Page2','Text1']);
    assert(!f.g.lockedControls.includes('Tabs1'));assert.equal(JSON.stringify(f.g.allControls.map(c=>c.properties)),before);assert.equal(f.calls.undo,0);
    f.adapter.dispose();assert.deepEqual([...f.g.lockedControls].sort(),['Page2','Text1']);
});
test('new pages are protected immediately and locks follow rename and native node replacement',()=>{
    const f=fixture();f.adapter.install();f.adapter.run('new');const page=f.g.allControls.at(-1);
    assert(f.g.lockedControls.includes(page.properties.Name));
    // Native rename migrates the existing lock; it remains owned by this adapter.
    page.properties.Name='RenamedPage';f.g.lockedControls=['RenamedPage'];f.adapter.tick();
    assert.deepEqual([...f.g.lockedControls],['RenamedPage']);
    f.g.allControls=f.g.allControls.filter(c=>c!==page);page.remove();f.page('RenamedPage');f.adapter.tick();
    assert.deepEqual([...f.g.lockedControls],['RenamedPage']);f.adapter.dispose();assert.deepEqual([...f.g.lockedControls],[]);
});
test('page protection is released on reparent and page deletion still removes its subtree',()=>{
    const f=fixture(),p=f.page('Page1'),child=p.appendChild(new Node({_className:'TextBox',Name:'Text1'}));f.g.allControls.push(child);f.adapter.install();
    assert(f.g.lockedControls.includes('Page1'));p.remove();f.form.appendChild(p);f.adapter.tick();assert(!f.g.lockedControls.includes('Page1'));
    p.remove();f.host.appendChild(p);f.adapter.tick();assert(f.g.lockedControls.includes('Page1'));
    f.g.selectedControls=[p];f.adapter.run('delete');f.adapter.tick();
    assert(!f.g.allControls.includes(p));assert(!f.g.allControls.includes(child));assert(!f.g.lockedControls.includes('Page1'));
});
test('shipped IDE drag, keyboard move and resize handlers honor page-only native locks',t=>{
    const file=process.env.TB_IDE_MAIN_JS;if(!file)return t.skip('Set TB_IDE_MAIN_JS for native lock/drag protocol checks');
    const ide=fs.readFileSync(file,'utf8'),f=fixture(),p=f.page('Page1'),child=p.appendChild(new Node({_className:'TextBox',Name:'Text1',Left:18,Top:30,Width:80,Height:25}));f.g.allControls.push(child);
    function extract(name){const start=ide.indexOf('function '+name+'(');assert(start>=0);let pos=start;while((pos=ide.indexOf('}',pos+1))>=0){try{const text=ide.slice(start,pos+1);new vm.Script('('+text+')');return text;}catch{}}throw Error(name);}
    const noop=()=>{};
    const sandbox={calculateInclusionCount:(g,cs)=>cs.forEach(c=>{c.InclusionCount=1;}),isRectangularControl:()=>true,
        syncDesignerControlToProperties:noop,updateAllControlDragPoints:noop,refreshPendingControls:noop,setSelectionDragInfo:noop,
        syncPropertySheet:noop,syncUserScaledWidthHeight:noop,getImageFromServer:noop,doAnchoringAdjustments:noop,configureMiniToolbar:noop};
    for(const name of ['isControlLocked','unlockTheControl','lockTheControl','handleMoveDragControlInProgress','handleDraggerRightInProgress','moveControls'])
        sandbox[name]=vm.runInNewContext('('+extract(name)+')',sandbox);
    f.api.lockTheControl=sandbox.lockTheControl;f.api.unlockTheControl=sandbox.unlockTheControl;f.g.zoomRatio=1;
    f.adapter.install();
    function drag(c){c.LastPositionX=c.properties.Left;c.LastPositionY=c.properties.Top;c.LastPositionWidth=c.properties.Width;f.g.selectedControls=[c];sandbox.handleMoveDragControlInProgress(f.g,10,20);sandbox.handleDraggerRightInProgress(f.g,15,0);sandbox.moveControls(f.g,[c],12,8,true,true);}
    const before=JSON.stringify(p.properties);drag(p);assert.equal(JSON.stringify(p.properties),before);
    drag(child);assert.equal(child.properties.Left,40);assert.equal(child.properties.Top,58);assert.equal(child.properties.Width,95);
    drag(f.host);assert.equal(f.host.properties.Left,42);assert.equal(f.host.properties.Top,48);assert.equal(f.host.properties.Width,515);
    assert.equal(JSON.stringify(p.properties),before);f.adapter.dispose();assert(!sandbox.isControlLocked(f.g,p));
});
test('page deletion sends the native form-structure notification needed to remove saved members',t=>{
    const file=process.env.TB_IDE_MAIN_JS;if(!file)return t.skip('Set TB_IDE_MAIN_JS for deletion notification contract');
    const ide=fs.readFileSync(file,'utf8'),f=fixture(),p=f.page('Page1');
    const child=p.appendChild(new Node({_className:'TextBox',Name:'Text1'}));f.g.allControls.push(child);const messages=[];
    const start=ide.indexOf('function onSignificantChange('),end=ide.indexOf('function ',start+10);assert(start>=0);
    const source=ide.slice(start,end);
    f.g.vscode={postMessage:m=>messages.push(m)};
    f.api.onSignificantChange=vm.runInNewContext('('+source+')',{serializeForm:g=>g.allControls.map(c=>({Name:c.properties.Name}))});
    f.adapter.run('delete');
    const message=messages.find(m=>m.type==='onSignificantChange');assert(message,'Deletion never notified the project model');
    assert(!message.args[0].form.some(c=>c.Name==='Page1'||c.Name==='Text1'));
});
test('page names and captions are scoped to each host while all form names stay unique',()=>{
    const f=fixture();f.adapter.install();
    assert.equal(f.adapter.run('new'),'Tabs1_Page1');const a=f.g.allControls.at(-1);assert.equal(a.properties.Caption,'Page 1');
    const host2=f.form.appendChild(new Node({_className:'tbUI3.UI3TabView',Name:'SettingsTabs',Width:310,Height:180,Left:600,Top:40}));f.g.allControls.push(host2);f.g.selectedControls=[host2];
    assert.equal(f.adapter.run('new'),'SettingsTabs_Page1');const b=f.g.allControls.at(-1);
    assert.equal(b.properties.Caption,'Page 1');assert.equal(b.parentElement,host2);assert.equal(b.properties.Width,310);assert.equal(b.properties.Height,140);
    assert.equal(a.properties.Width,500);assert.equal(a.properties.Height,200);assert.equal(a.properties.Caption,'Page 1');
});
test('delete and add on a second host preserves ownership and bounds, including after deleting the last page',()=>{
    const f=fixture();f.adapter.install();f.adapter.run('new');const first=f.g.allControls.at(-1),before=JSON.stringify(first.properties);
    const host2=f.form.appendChild(new Node({_className:'tbUI3.UI3TabView',Name:'OtherTabs',Width:270,Height:160,Left:550,Top:100}));f.g.allControls.push(host2);f.g.selectedControls=[host2];
    assert.equal(f.adapter.run('new'),'OtherTabs_Page1');const removed=f.g.allControls.at(-1);f.adapter.run('delete');assert(!f.g.allControls.includes(removed));
    assert.equal(f.adapter.run('new'),'OtherTabs_Page2');let replacement=f.g.allControls.at(-1);
    assert.equal(replacement.parentElement,host2);assert.deepEqual([replacement.properties.Left,replacement.properties.Top,replacement.properties.Width,replacement.properties.Height],[0,40,270,120]);
    assert.equal(JSON.stringify(first.properties),before);assert.equal(host2.properties.SelectedPage,'OtherTabs_Page2');
    f.adapter.run('delete');f.adapter.dispose();const refreshed=factory(f.api);refreshed.install();f.g.selectedControls=[host2];
    assert.equal(refreshed.run('new'),'OtherTabs_Page3');assert(!Object.keys(f.g).includes('__tbUI3PageNames'));
});
test('page allocation skips unrelated name collisions and keeps user labels unchanged',()=>{
    const f=fixture();const existing=f.page('MyCustomPage');existing.properties.Caption='Account settings';
    f.g.allControls.push(f.form.appendChild(new Node({_className:'TextBox',Name:'Tabs1_Page2'})));
    assert.equal(f.adapter.run('new'),'Tabs1_Page3');assert.equal(existing.properties.Name,'MyCustomPage');assert.equal(existing.properties.Caption,'Account settings');
});
test('new page initialization survives replacement of its DOM node during native resync',()=>{
    const f=fixture();f.g.isInFullFormMode=true;f.host.formDesignerControlId=1;
    assert.equal(f.adapter.run('new'),'Tabs1_Page1');const old=f.g.allControls.at(-1),properties={...old.properties,Caption:'Page',PageOrder:0};
    f.g.allControls=f.g.allControls.filter(c=>c!==old);old.remove();old.isDeleted=true;
    const replacement=f.host.appendChild(new Node(properties));replacement.formDesignerControlId=99;f.g.allControls.push(replacement);f.adapter.tick();
    assert.equal(replacement.properties.Caption,'Page 1');assert.equal(f.host.properties.SelectedPage,'Tabs1_Page1');assert.equal(f.g.selectedControls[0],replacement);
    assert(!f.adapter.run('new').includes('finishing the new page'));
});
test('live delete then add sends a structure change and configures the replacement after acknowledgement',t=>{
    const f=liveFixture(t);if(!f)return;const messages=[];f.g.vscode={postMessage:m=>messages.push(m)};
    const ide=fs.readFileSync(process.env.TB_IDE_MAIN_JS,'utf8'),start=ide.indexOf('function onSignificantChange('),end=ide.indexOf('function ',start+10);
    f.api.onSignificantChange=vm.runInNewContext('('+ide.slice(start,end)+')',{serializeForm:g=>g.allControls.map(c=>({Name:c.properties.Name}))});
    const p=f.page('Tabs1_Page1');f.host.properties.SelectedPage='Tabs1_Page1';f.adapter.run('delete');
    assert(messages.some(m=>m.type==='onSignificantChange'&&!m.args[0].form.some(c=>c.Name==='Tabs1_Page1')));
    f.ack();f.adapter.tick();assert.equal(f.adapter.run('new'),'Tabs1_Page2');const created=f.g.allControls.at(-1);created.formDesignerControlId=100;
    f.adapter.tick();f.ack();f.adapter.tick();assert.equal(f.host.properties.SelectedPage,'Tabs1_Page2');assert.equal(created.properties.Caption,'Page 2');
});


test('page toolbox hiding preserves registration, new-page creation and unrelated entries',()=>{
    const f=fixture(),pageTool=new Node(),hostTool=new Node(),otherTool=new Node();
    Object.assign(pageTool,{controlTypePackage:'tbUI3',controlType:'UI3TabPage',clsid:'{1681A635-13C8-47F3-B96A-FE8123C9F708}'});
    Object.assign(hostTool,{controlTypePackage:'tbUI3',controlType:'UI3TabView',clsid:'{HOST}'});
    Object.assign(otherTool,{controlTypePackage:'Other',controlType:'UI3TabPage',clsid:pageTool.clsid});
    const tools=[pageTool,hostTool,otherTool];f.g.allToolboxItems=tools;
    let pointerClicks=0;f.g.selectedTool=pageTool;f.g.toolBoxPointer={onclick:()=>{pointerClicks++;f.g.selectedTool=f.g.toolBoxPointer;}};
    f.adapter.install();
    assert(pageTool.classList.contains('tbui3-page-toolbox-hidden'));assert(!hostTool.classList.contains('tbui3-page-toolbox-hidden'));
    assert(!otherTool.classList.contains('tbui3-page-toolbox-hidden'));assert.equal(f.g.allToolboxItems,tools);assert.equal(tools.length,3);
    assert.equal(pointerClicks,1);assert.equal(f.adapter.run('new'),'Tabs1_Page1');assert.equal(f.calls.undo,1);
    assert.match(f.api.document.head.children[0].textContent,/\.tbui3-page-toolbox-hidden\{display:none!important\}/);
    const replacement=new Node();Object.assign(replacement,{controlTypePackage:pageTool.controlTypePackage,controlType:pageTool.controlType,clsid:pageTool.clsid});
    pageTool.isConnected=false;f.g.allToolboxItems=[replacement,hostTool,otherTool];f.adapter.tick();
    assert(!pageTool.classList.contains('tbui3-page-toolbox-hidden'));assert(replacement.classList.contains('tbui3-page-toolbox-hidden'));
    f.adapter.dispose();assert(!replacement.classList.contains('tbui3-page-toolbox-hidden'));assert.equal(f.api.document.head.children.length,0);
});

// Evaluate the actual theme-options expression emitted by the twinBASIC wrapper.
// Only its small string-concatenation grammar is needed; native methods are not simulated.
function themeOptionsExpression(enabled) {
    const source=fs.readFileSync('tbIDE/WinUI3IdeStyle/src/Sources/MainModule.twin','utf8').replace(/& _\r?\n\s*/g,'& ');
    const values={enabled,IIf:(condition,yes,no)=>condition?yes:no,
        JsString:s=>"'"+s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n')+"'"};
    const evaluate=expression=>vm.runInNewContext(expression.replace(/"[^"]*"|&/g,t=>t==='&'?'+':JSON.stringify(t.slice(1,-1))),values);
    for(const m of source.matchAll(/Private Const (\w+) As String = ([^\r\n]+)/g))values[m[1]]=evaluate(m[2]);
    const method=source.slice(source.indexOf('Private Sub InstallOption()'),source.indexOf('Private Sub OptionTimer_Timer()'));
    const expression=method.match(/Dim js As String = ([^\r\n]+)/)[1];
    return evaluate(expression);
}
test('one add-in entry point owns both features and preserves the saved theme setting',()=>{
    const dir='tbIDE/WinUI3IdeStyle/src',main=fs.readFileSync(dir+'/Sources/MainModule.twin','utf8');
    const controller=fs.readFileSync(dir+'/Sources/TabViewDesignerController.twin','utf8');
    const sources=fs.readdirSync(dir+'/Sources').filter(p=>p.endsWith('.twin')).map(p=>fs.readFileSync(dir+'/Sources/'+p,'utf8')).join('\n');
    assert.equal((sources.match(/\[DllExport\]/g)||[]).length,1);assert.equal((sources.match(/Implements AddIn\b/g)||[]).length,1);
    assert(!fs.existsSync('tbIDE/TabViewDesigner/TabViewDesigner.twinproj'));
    const startup=main.slice(main.indexOf('Public Sub New('),main.indexOf('Private Sub Class_Terminate()'));
    assert(startup.indexOf('New TabViewDesignerController(Host)')<startup.indexOf('ApplyForActiveTheme'));
    assert.match(main,/TabDesigner.ProjectLoaded/);assert.match(main,/TabDesigner.Dispose/);
    assert.match(main,/SettingsApp As String = "WinUI3IdeStyle"/);assert.match(main,/SettingEnabled As String = "Enabled"/);
    assert(!controller.includes('OptionEnabled'));assert(!controller.includes('ThemePrefix'));
    assert.match(controller,/Set LoadTimer = Nothing/);assert.match(controller,/__tbUI3TabDesigner.dispose\(\)/);
});
test('the actual theme option switches styling off and on while tab management keeps working',()=>{
    const f=fixture(),style={media:'all'},heading={textContent:'TOOLBOX',data:new Map(),
        getAttribute(k){return this.data.has(k)?this.data.get(k):null;},setAttribute(k,v){this.data.set(k,v);},removeAttribute(k){this.data.delete(k);}};
    const anchor=new Node();anchor.textContent='Colour Theme';const row={after(n){this.nextElementSibling=n;}};anchor.closest=()=>row;
    const document={getElementById:id=>id==='winui3IdeStyleCss'?style:null,
        getElementsByClassName:cls=>cls==='sectionHeaderInner'?[heading]:[anchor],
        createElement:()=>{const n=new Node();n.classList.contains=x=>String(n.className).split(' ').includes(x)||n.classes.has(x);return n;},body:{}};
    const window={__tbUI3TabDesigner:f.adapter};let disconnected=false;
    const sandbox={window,document,MutationObserver:class{observe(){}disconnect(){disconnected=true;}}};
    vm.runInNewContext(themeOptionsExpression(true),sandbox);
    assert.equal(heading.textContent,'Toolbox');assert.equal(style.media,'all');
    const option=row.nextElementSibling,segments=option.children[1].children[0].children;
    segments[0].onclick();assert.equal(style.media,'not all');assert.equal(heading.textContent,'TOOLBOX');
    assert.equal(window.__winui3IdeStyle.dirty,true);assert.equal(window.__tbUI3TabDesigner.run('new'),'Tabs1_Page1');
    segments[1].onclick();assert.equal(style.media,'all');assert.equal(heading.textContent,'Toolbox');
    assert.equal(window.__tbUI3TabDesigner.run('new'),'Tabs1_Page2');assert.equal(disconnected,false);
    document.getElementById=()=>null;window.__winui3IdeStyle.titles();assert.equal(heading.textContent,'TOOLBOX');
    assert.equal(window.__tbUI3TabDesigner.run('new'),'Tabs1_Page3');
});
test('the actual theme option restores its saved disabled state without disabling page insertion',()=>{
    const f=fixture(),style={media:'all'},window={__tbUI3TabDesigner:f.adapter};
    const document={getElementById:()=>style,getElementsByClassName:()=>[],body:{}};
    vm.runInNewContext(themeOptionsExpression(false),{window,document,MutationObserver:class{observe(){}}});
    assert.equal(style.media,'not all');assert.equal(window.__winui3IdeStyle.enabled,false);assert.equal(window.__winui3IdeStyle.dirty,false);
    assert.equal(window.__tbUI3TabDesigner.run('new'),'Tabs1_Page1');
});
