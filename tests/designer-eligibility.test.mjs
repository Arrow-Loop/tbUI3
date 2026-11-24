import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const {JSDOM}=await import(process.env.TB_JSDOM_MODULE||'jsdom');
const read=name=>fs.readFileSync('tbIDE/tbUI3IDE/js/'+name+'.js','utf8');
const factory=vm.runInNewContext(read('designer-eligibility'));
const base=JSON.parse(fs.readFileSync('tbUI3/src/Settings'))['project.id'];
const clsid=name=>'{'+JSON.parse(fs.readFileSync('tbUI3/UI3'+name+'-ids.json')).cls+'}';
const refs=(...references)=>({'project.references':references});
const enabled=refs({id:base});
const resolved=()=>['TabView','TabPage'].map(name=>({package:'tbUI3',name:'UI3'+name,clsid:clsid(name)}));

function fixture(settings, controls=resolved()) {
    const dom=new JSDOM('<button id="addinButton-tbUI3TabNew">New page</button><button id="saveIcon">Save</button><div class="tbui3-ribbon-group" aria-label="MultiPage">Pages</div>');
    const {document}=dom.window;
    const designer=document.createElement('div');
    designer.properties={_className:'Form'};
    const host=designer.appendChild(document.createElement('div'));
    host.properties={_className:'tbUI3.UI3TabView',_clsid:clsid('TabView')};
    const child=host.appendChild(document.createElement('div'));
    const form={designer,customControlsArray:controls,allControls:[host,child],selectedControls:[child]};
    let project={project:{},settings:{},compiler:{},controls}, active=form;
    let tick,time=0,data=settings;
    const requests=[], calls=[];
    const gate=factory({
        document,projectState:()=>project,formGlobals:()=>active,now:()=>time,
        setInterval(fn){tick=fn;return 1;}, clearInterval(){tick=undefined;},
        readSettings(entry,callback){requests.push({entry,callback});}
    },eligible=>{
        const owner=active;
        return {install(){assert(eligible(owner));calls.push('install');},dispose(){calls.push('dispose');},run(op){assert(eligible(owner));calls.push(op);return op;}};
    });
    const visible=selector=>dom.window.getComputedStyle(document.querySelector(selector)).display!=='none';
    return {
        gate,calls,requests,form,host,visible,document,
        reply(){requests.shift()?.callback(data);},
        advance(ms=550){time+=ms;tick();},
        data(value){data=value;},
        project(value){project=value;},
        active(value){active=value;},
        controls(value){project.controls=form.customControlsArray=value;},
        close(){gate.dispose();dom.window.close();}
    };
}

test('designer gate requires the enabled package GUID and resolved native controls for the current form',()=>{
    const cases=[
        ['ordinary project with catalog/old toolbox data',refs(),resolved()],
        ['lookalike package',refs({id:'{00000000-0000-0000-0000-000000000000}',symbolId:'tbUI3'}),resolved()],
        ['disabled reference',refs({id:base,isDisabled:true}),resolved()],
        ['ambiguous reference',refs({id:base},{id:base}),resolved()],
        ['unresolved reference',enabled,[]],
        ['partial resolution',enabled,resolved().slice(0,1)],
        ['invalid settings',undefined,resolved()],
        ['valid reference',enabled,resolved()]
    ];
    for(const [label,settings,controls] of cases){
        const f=fixture(settings,controls);
        try{
            f.reply();
            const allowed=label==='valid reference';
            assert.equal(!!f.gate.selectedHost(),allowed,label);
            assert.equal(f.visible('#addinButton-tbUI3TabNew'),allowed,label);
            assert.equal(f.visible('[aria-label="MultiPage"]'),allowed,label);
            assert(f.visible('#saveIcon'),label);
            assert.equal(f.calls.includes('install'),allowed,label);
        }finally{f.close();}
    }
});

test('removal, re-resolution, form changes and project switches dispose owned sessions and ignore stale responses',()=>{
    const f=fixture(enabled);
    try{
        f.reply();
        assert.equal(f.gate.run('new'),'new');
        f.form.selectedControls=[];
        f.advance();
        assert.equal(f.gate.selectedHost(),null);
        assert(!f.visible('#addinButton-tbUI3TabNew'));
        assert.equal(f.calls.filter(op=>op==='dispose').length,0);
        f.form.selectedControls=[f.host];
        f.data(refs());f.reply();
        assert(!f.gate.selectedHost());
        assert.equal(f.calls.at(-1),'dispose');
        assert.match(f.gate.run('delete'),/unavailable/);
        f.data(enabled);f.controls(resolved());f.advance();f.reply();
        assert.equal(f.gate.selectedHost(),f.host);
        f.active(undefined);f.advance();
        assert.equal(f.calls.at(-1),'dispose');
        f.active(f.form);f.reply();
        assert.equal(f.gate.selectedHost(),f.host);
        f.advance();
        const stale=f.requests.shift();
        f.project(undefined);f.advance(150);stale.callback(enabled);
        assert(!f.gate.selectedHost());
        assert.equal(f.calls.at(-1),'dispose');
        f.project({project:{},settings:{},compiler:{},controls:[]});f.data(refs());
        f.advance();f.reply();
        assert(!f.gate.selectedHost());assert(f.visible('#saveIcon'));
    }finally{f.close();}
});

test('an unavailable settings response expires a previously eligible designer',()=>{
    const f=fixture(enabled);
    try{
        f.reply();assert.equal(f.gate.selectedHost(),f.host);
        f.advance(550);const stale=f.requests.shift();
        f.advance(1050);stale.callback(enabled);
        assert(!f.gate.selectedHost());assert.equal(f.calls.at(-1),'dispose');
    }finally{f.close();}
});

test('supported IDE fixture supplies the project FS and compiler-owned control-list contracts',t=>{
    const file=process.env.TB_IDE_MAIN_JS;
    if(!file)return t.skip('Set TB_IDE_MAIN_JS to use the supported IDE fixture');
    const ide=fs.readFileSync(file,'utf8');
    assert.match(ide,/function getProjectSettings\([\w$]+\)\{.{0,360}\.entries\["settings"\].{0,100}fs\.readFile/);
    assert.match(ide,/request_custom_provideCustomControls\([\w$]+\)\{.{0,150}this\.latestCustomControls=uniqueControls\([\w$.]+\.customControls\)/);
    assert.match(ide,/function formDesigner_updateControlsList\(([\w$]+),([\w$]+)\)\{\1\.customControlsArray=\2/);
    assert.match(ide,/controlTypePackage=[\w$]+\.package/);
});

test('a project reopened after a gap cannot reuse the previous compiler catalog',()=>{
    const f=fixture(enabled);
    try{
        f.reply();assert.equal(f.gate.selectedHost(),f.host);
        f.project(undefined);f.advance(150);
        f.project({project:{},settings:{},compiler:{},controls:f.form.customControlsArray});
        f.advance(150);f.reply();
        assert(!f.gate.selectedHost());
        f.controls(resolved());f.advance();
        assert.equal(f.gate.selectedHost(),f.host);
    }finally{f.close();}
});
