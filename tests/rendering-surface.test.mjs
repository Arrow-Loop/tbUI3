import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
// Source checks for the shared flicker-free paint surface (docs/2026-11-18-flicker-free-rendering-plan.md).
// They keep every new control on UI3Surface. They are not a substitute for a compiled run on a
// physical display, which is the only acceptance for flicker.
const dir='tbUI3/src/Sources',read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const surface=read('UI3Surface.twin'),host=read('UI3SurfaceHost.twin'),d2d=read('UI3Direct2D.twin');
const metrics=read('UI3TabMetrics.twin'),tabView=read('UI3TabView.twin');
// Controls still on twinBASIC's own paint routine, and why. A new control is not listed here,
// so it must paint through UI3Surface.
const HOST_PAINT={
 UI3TabPage:'container for user controls, which may be windowless and drawn by the host paint routine',
};
const body=(source,signature)=>{
 const start=source.indexOf(signature);assert(start>=0,'missing '+signature);
 const end=source.indexOf(/\bFunction\b/.test(signature)?'    End Function':'    End Sub',start);
 return source.slice(start,end);
};
const procedures=source=>[...source.matchAll(/^    (?:Private |Public |Friend )?(?:Sub|Function|Property (?:Get|Let|Set)) [\s\S]*?^    End (?:Sub|Function|Property)/gm)].map(m=>m[0]);

test('every drawing control paints through UI3Surface unless explicitly listed with a reason',()=>{
 const controls=fs.readdirSync(dir).filter(f=>f.endsWith('.twin')).map(f=>[f.slice(0,-5),read(f)]).filter(([,s])=>s.includes('[COMControl]'));
 assert(controls.length>=5);
 for(const [name,source] of controls){
  if(!source.includes('Private Sub UserControl_Paint()'))continue;
  if(HOST_PAINT[name]){assert(!source.includes('Implements IUI3SurfaceClient'),name+' moved to UI3Surface: remove it from HOST_PAINT');continue;}
  assert(source.includes('Implements IUI3SurfaceClient'),name+' draws but does not implement IUI3SurfaceClient');
  for(const member of ['SurfaceRender','SurfaceHitTest','SurfaceHotChanged','SurfaceStateChanged','SurfaceDialogCode','SurfaceBackground'])
   assert(source.includes('IUI3SurfaceClient_'+member+'('),name+' lacks '+member);
  // The surface owns the render target, erase suppression and the window subclass.
  for(const forbidden of ['CreateDCTarget','BindDC','BeginDraw','EndDraw','SetWindowSubclass','InvalidateRect','&H14'])
   assert(!source.includes(forbidden),name+' must leave '+forbidden+' to UI3Surface');
  // Synchronous Refresh is only for designer snapshots, behind an ownership check.
  for(const proc of procedures(source).filter(p=>p.includes('UserControl.Refresh')))
   assert(/If OwnsPaint\(\) Then/.test(proc)&&proc.indexOf('UserControl.Refresh')>proc.search(/^\s+Else\s*$/m)&&proc.search(/^\s+Else\s*$/m)>proc.indexOf('If OwnsPaint() Then'),
    name+' refreshes at run time:\n'+proc.split('\n')[0]);
  assert(/Private Sub UserControl_Paint\(\)[\s\S]*?m_Surface\.PaintEvent UserControl\.hDC/.test(source),name+' Paint event must use the shared render');
 }
});

test('the surface owns paint at run time and never lets the host erase first',()=>{
 const message=body(surface,'Public Function WindowMessage(');
 assert(/Case WM_ERASEBKGND[\s\S]*?WindowMessage = 1\s*\n\s*Exit Function/.test(message),'erase must be handled without forwarding');
 assert(/Case WM_PAINT\s*\n\s*If m_OwnsPaint Then\s*\n\s*UI3SurfaceHost\.SurfacePaintOwned hWnd, Me\s*\n\s*WindowMessage = 0\s*\n\s*Exit Function/.test(message),'run-time WM_PAINT must not reach the host');
 const owned=body(host,'Public Sub SurfacePaintOwned(');
 assert(/BeginPaint\(hWnd, ps\)[\s\S]*Surface\.RenderDirty dc, ps\.rcPaint[\s\S]*EndPaint hWnd, ps/.test(owned));
 // Every invalidation the surface makes leaves bErase = FALSE.
 const calls=[...host.matchAll(/^\s+If hWnd <> 0 Then InvalidateRect (.*)$/gm)].map(m=>m[1].trim());
 assert.deepEqual(calls,['hWnd, VarPtr(Box), 0','hWnd, 0, 0']);
 assert(!/UserControl\.Refresh|RDW_ERASE/.test(surface+host));
 // NCDESTROY releases the subclass and the client, breaking the reference cycle.
 assert(/Case WM_NCDESTROY[\s\S]*?SurfaceForward\(hWnd, Message, wParam, lParam\)\s*\n\s*Detach/.test(message));
 // One frame: clear and draw inside BeginDraw/EndDraw, clipped to the dirty area.
 const render=body(surface,'Private Sub Render(');
 const order=['BindDC dc, client','BeginDraw','UseBrushCache','PushAxisAlignedClip clip','Clear ColorFromArgb(m_Client.SurfaceBackground())','SurfaceRender m_Target','PopAxisAlignedClip','EndDraw(0, 0)','EndBrushCache'].map(s=>render.indexOf(s));
 assert(order.every(i=>i>=0)&&order.every((v,i)=>i===0||v>order[i-1]),'render order '+order);
 assert(render.includes('If hr = D2DERR_RECREATE_TARGET And m_OwnsPaint Then Invalidate'));
});

test('dirty rectangles round outward so a DIP area is always fully covered',()=>{
 const area=body(surface,'Public Sub InvalidateArea(');
 const lines=Object.fromEntries([...area.matchAll(/box\.(\w+) = (.*)/g)].map(m=>[m[1],m[2].trim()]));
 for(const dpi of [96,120,144,168,192]) for(const [x,y,w,h] of [[0,0,500,40],[0.5,3.3,99.9,36.7],[10,4,240,36]]){
  const ctx={X:x,Y:y,W:w,H:h,factor:dpi/96,Int:Math.floor};
  const box=Object.fromEntries(Object.entries(lines).map(([k,e])=>[k,vm.runInNewContext(e,ctx)]));
  assert(box.Left<=x*dpi/96+1e-6&&box.Top<=y*dpi/96+1e-6);
  assert(box.Right>=(x+w)*dpi/96-1e-6&&box.Bottom>=(y+h)*dpi/96-1e-6);
  assert(box.Right-(x+w)*dpi/96<1+1e-6&&box.Bottom-(y+h)*dpi/96<1+1e-6,'over-invalidation '+JSON.stringify(box));
 }
});

test('hover repaints only when the part under the pointer changes',()=>{
 const setHot=body(surface,'Private Sub SetHot(');
 assert(/If Part = m_HotPart Then Exit Sub[\s\S]*m_Client\.SurfaceHotChanged previous, Part/.test(setHot));
 // Run as a tiny state machine: a move inside one part notifies nothing.
 let hot=0;const notices=[];
 const move=part=>{if(part===hot)return;notices.push([hot,part]);hot=part;};
 [0,2,2,2,3,3,0,0,-1,-1,0].forEach(move);
 assert.deepEqual(notices,[[0,2],[2,3],[3,0],[0,-1],[-1,0]]);
 const changed=body(tabView,'Private Sub IUI3SurfaceClient_SurfaceHotChanged(');
 assert(/InvalidateHeader\s*\n\s*End Sub/.test(changed+'    End Sub'),'TabView hover must invalidate only its header');
});

test('TabView keeps page discovery and resource creation out of run-time paint',()=>{
 const render=body(tabView,'Private Sub IUI3SurfaceClient_SurfaceRender(');
 for(const line of render.split(/\r?\n/).filter(l=>/\bCollectPages\b/.test(l)))
  assert.equal(line.trim(),'If Not OwnsPaint() Then CollectPages','run-time render must not rediscover pages');
 assert(!/CreateDCTarget|CreateSolidColorBrush|CreateTextFormat|CreatePathGeometry/.test(tabView));
 assert(!/HeaderWindowProc|WatchPointer|SetWindowSubclass|InvalidateRect/.test(metrics),'TabView must have one subclass: UI3Surface');
 assert(metrics.includes('Public Function TabDialogCode(ByVal Code As LongPtr) As LongPtr'));
 const show=body(tabView,'Private Sub UserControl_Show(');assert(/EnsureSurface\s*\n\s*RefreshPages/.test(show));
});

test('UI3Button releases target-bound icon resources when the surface makes a new target',()=>{
 const button=read('UI3Button.twin'),render=body(button,'Private Sub IUI3SurfaceClient_SurfaceRender(');
 assert(/If m_Surface\.TargetGeneration <> m_TargetGeneration Then[\s\S]*m_IconImage\.ReleaseDeviceResources[\s\S]*m_ListImage\.ReleaseDeviceResources[\s\S]*DrawButton w, h/.test(render));
 assert(!/m_Target\.Clear/.test(button),'the surface clears to SurfaceBackground');
 assert(/IUI3SurfaceClient_SurfaceBackground = ArgbFromOleColor\(ContainerBackColor\(\)\)/.test(button));
 const create=body(surface,'Private Sub Render(');assert(/Set m_Target = CreateDCTarget\(\)[\s\S]*m_Generation = m_Generation \+ 1/.test(create));
});

test('brushes, text formats, fonts and outlines are cached rather than created per paint',()=>{
 const brush=body(d2d,'Public Function SolidBrush(');
 assert(/m_BrushTarget = ObjPtr\(target\)[\s\S]*CachedObject\(m_Brushes, key\)[\s\S]*CreateSolidColorBrush[\s\S]*CacheObject m_Brushes, key, SolidBrush, m_BrushLimit/.test(brush));
 for(const sig of ['Public Sub DrawLeftTextStyled(','Public Sub DrawCenteredTextStyled(']){
  const proc=body(d2d,sig);assert(/CachedObject\(m_TextFormats, key\)/.test(proc),sig);
  assert(proc.indexOf('CreateCenteredTextFormat')>proc.indexOf('If format Is Nothing Then'),sig+' must create only on a cache miss');
 }
 assert(/Public Function FontFamilyExists[\s\S]*?m_FontExists\(key\)[\s\S]*?LookupFontFamily/.test(d2d));
 assert(/Public Function TabOutline[\s\S]*?CachedObject\(m_Outlines, key\)[\s\S]*?BuildTabOutline/.test(d2d));
 // Cache storage must not convert Direct2D objects to IDispatch.
 assert(d2d.includes('Private Function CachedObject(ByVal Cache As Collection, ByVal Key As String) As stdole.IUnknown'));
 assert(d2d.includes('ByVal Item As stdole.IUnknown, ByVal Limit As Long)'));
});

test('new surface sources keep CRLF and private visibility',()=>{
 for(const source of [surface,host]) assert(!/(?<!\r)\n/.test(source));
 assert(surface.includes('Private Class UI3Surface'));
 assert(host.includes('Private Interface IUI3SurfaceClient Extends stdole.IUnknown'));
 assert(host.includes('Private Module UI3SurfaceHost'));
 const tbcontrol=JSON.parse(read('UI3TabView.tbcontrol'))[0];
 assert.equal(tbcontrol.ClipControls,true,'children must stay clipped out of the host paint');
});
