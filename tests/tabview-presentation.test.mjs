import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const metrics=fs.readFileSync('tbUI3/src/Sources/UI3TabMetrics.twin','utf8'),control=fs.readFileSync('tbUI3/src/Sources/UI3TabView.twin','utf8');
// Execute the small, pure arithmetic methods from the native source. This is a
// source/geometry check, not a substitute for a compiled twinBASIC control run.
const context={ui3TabEdge:0,ui3TabExplorer:1};
for(const m of metrics.matchAll(/Public Const (\w+) As Single = (\d+)/g))context[m[1]]=Number(m[2]);
const expr=s=>s.replace(/\bAnd\b/g,'&&').replace(/\bOr\b/g,'||').replace(/<>/g,'!==').replace(/(?<![<>!=])=(?!=)/g,'===');
for(const name of ['HeaderTop','FootRadius','HeaderHeight','AuxiliaryTop','Overflowing','HeaderStart','HeaderArea','HeaderWidth']){
 const m=metrics.match(new RegExp('Public Function '+name+'\\(([^\\n]+)\\) As \\w+\\r?\\n([\\s\\S]*?)    End Function'));assert(m,name);
 const localExpr=s=>expr(s).replace(new RegExp('\\b'+name+'\\b(?!\\s*\\()','g'),'result');
 const params=[...m[1].matchAll(/ByVal (\w+) As \w+/g)].map(x=>x[1]);
 const action=s=>{if(s.startsWith('Return '))return 'return '+localExpr(s.slice(7))+';';const assignment=/^(\w+) = (.*)$/.exec(s);assert(assignment,s);return (assignment[1]===name?'result':assignment[1])+' = '+localExpr(assignment[2])+';';};
 const code=m[2].split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
  const conditional=/^If (.*?) Then (.*?)(?: Else (.*))?$/.exec(line);
  return conditional?'if('+localExpr(conditional[1])+'){'+action(conditional[2])+'}'+(conditional[3]?'else{'+action(conditional[3])+'}':''):action(line);
 }).join('\n');context[name]=vm.runInNewContext('(function('+params.join(',')+'){let result=0;'+code+';return result;})',context);
}
export function nativeTabOutline(x,y,w,h,corner,foot){
 const source=fs.readFileSync('tbUI3/src/Sources/UI3Direct2D.twin','utf8'),body=source.match(/Public Function TabOutline\([\s\S]*?\r?\n([\s\S]*?)    End Function/)[1];
 const values={X:x,Y:y,W:w,H:h,Corner:corner,Foot:foot},point={x:0,y:0},commands=[];
 const value=s=>vm.runInNewContext(s.trim(),values);
 for(const statement of body.split(/\r?\n/).flatMap(line=>line.split(':')).map(x=>x.trim())){
  const set=/^point\.(x|y) = (.*)$/.exec(statement);if(set)point[set[1]]=value(set[2]);
  if(statement.startsWith('sink.BeginFigure'))commands.push(['M',point.x,point.y]);
  if(statement.startsWith('sink.AddLine'))commands.push(['L',point.x,point.y]);
  const arc=/^TabArc sink, (.*)$/.exec(statement);if(arc)commands.push(['A',...arc[1].split(',').map(value)]);
  if(statement.startsWith('sink.EndFigure'))commands.push(['Z']);
 }
 return commands;
}
test('native profiles retain Toolkit Edge geometry and the alternate Explorer geometry with a fixed page origin',()=>{
 assert.deepEqual([context.HeaderTop(0),context.HeaderHeight(0),context.FootRadius(0),context.ContentTop],[4,36,8,40]);
 assert.deepEqual([context.HeaderTop(1),context.HeaderHeight(1),context.FootRadius(1),context.ContentTop],[8,32,4,40]);
 assert.equal(context.AuxiliaryTop(0),10);assert.equal(context.AuxiliaryTop(1),12);
 for(const style of [0,1])for(const width of [60,120,235,500,1000])for(const count of [0,1,2,8])for(const add of [false,true]){
  const area=context.HeaderArea(width,count,add,style),start=context.HeaderStart(width,count,add,style),size=context.HeaderWidth(width,count,add,style);
  assert(area>=0);assert(size>=100&&size<=240);assert(start>=context.FootRadius(style));
  if(context.Overflowing(width,count,add,style))assert.equal(start,context.FootRadius(style)+32);
  assert(start+area<=width-(add?35:0)+context.FootRadius(style));
 }
});
test('the native arc path reproduces the Toolkit concave joins and 8px top corners',()=>{
 // Edge expected vector from Toolkit 8543201, toolbox.js initializeTabView:
 // M0 36 a8,8 0 0 0 8,-8 L8,8 a8,8 0 0 1 8,-8 l184,0
 // a8,8 0 0 1 8,8 l0,20 a8,8 0 0 0 8,8 Z (200px header).
 assert.deepEqual(nativeTabOutline(8,0,200,36,8,8),[['M',0,36],['A',8,28,8,0],['L',8,8],['A',16,0,8,1],['L',200,0],['A',208,8,8,1],['L',208,28],['A',216,36,8,0],['Z']]);
 assert.deepEqual(nativeTabOutline(4,8,100,32,8,4),[['M',0,40],['A',4,36,4,0],['L',4,16],['A',12,8,8,1],['L',96,8],['A',104,16,8,1],['L',104,36],['A',108,40,4,0],['Z']]);
});
test('TabStyle defaults, validation and persistence preserve existing control identities and viewport transience',()=>{
 assert(control.includes('m_TabStyle = ui3TabEdge'));assert(control.includes('PropBag.ReadProperty("TabStyle", ui3TabEdge)'));assert(control.includes('PropBag.WriteProperty "TabStyle", m_TabStyle, ui3TabEdge'));assert(control.includes('If Value <> ui3TabEdge And Value <> ui3TabExplorer Then Err.Raise 380'));
 assert(!control.includes('PropBag.WriteProperty "FirstVisibleTabIndex"'));assert(!control.includes('AccentShade(ACCENT_BASE)'));assert(control.includes('DrawLeftTextStyled'));
 const enums=fs.readFileSync('tbUI3/src/Sources/UI3Enums.twin','utf8');assert(enums.includes('ui3TabEdge = 0'));assert(enums.includes('ui3TabExplorer = 1'));
});

test('existing public TabView members precede the additive style and viewport properties',()=>{
 const members=[...control.matchAll(/Public (?:Property (?:Get|Let)|Sub|Function) (\w+)/g)].map(m=>m[1]);
 const original=['SelectedPage','SelectedPage','IsAddTabButtonVisible','IsAddTabButtonVisible','ScaleMode','PageCount','Pages','SelectedIndex','SelectedIndex','DesignerNewPageRequest','RefreshPages'];
 assert.deepEqual(members.slice(0,original.length),original);assert.deepEqual(members.slice(original.length),['TabStyle','TabStyle','FirstVisibleTabIndex','FirstVisibleTabIndex']);
});


test('TabStyle enum entries cannot introduce quoted Description tokens into native designer JSON',()=>{
 const source=fs.readFileSync('tbUI3/src/Sources/UI3Enums.twin','utf8');
 const body=source.match(/Public Enum UI3TabStyle\r?\n([\s\S]*?)    End Enum/)[1];
 const entries=body.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("'"));
 // BETA 1044's captured native response treated member annotations as enum names:
 // "TabStyle":"Description("Edge Style")". Its raw quote broke the whole form reply.
 const members=entries.map(line=>{
  const match=/^(\w+)\s*=\s*(\d+)$/.exec(line);
  assert(match,'Designer enum entries must be plain identifiers and values: '+line);
  return {name:match[1],value:Number(match[2])};
 });
 assert.deepEqual(members,[{name:'ui3TabEdge',value:0},{name:'ui3TabExplorer',value:1}]);
 const editor=members.map(({name,value})=>'|'+name+','+value).join('');
 for(const member of members){
  // Exercise the unescaped-string boundary observed in the native response.
  const response='[{"serialization":{"TabStyle":"'+member.name+'","__editor_TabStyle":"'+editor+'"}}]';
  assert.equal(JSON.parse(response)[0].serialization.TabStyle,member.name);
 }
});


test('native tab separators disappear beside either a selected or hovered tab',()=>{
 const condition=control.match(/If (.*?) Then UI3TabMetrics\.FillBox m_Target, X \+ W - 1/)[1];
 const expression=condition.replace(/\bNot\s+/g,'!').replace(/\bAnd\b/g,'&&').replace(/<>/g,'!==');
 for(let selected=1;selected<=5;selected++)for(let hot=0;hot<=5;hot++)for(let index=1;index<=5;index++){
  const visible=vm.runInNewContext(expression,{Selected:index===selected,Index:index,Hot:hot,ActiveIndex:()=>selected});
  assert.equal(visible,index!==selected&&index+1!==selected&&index!==hot&&index+1!==hot,
   'Separator owned by tab '+index+'; selected='+selected+' hover='+hot);
 }
});
