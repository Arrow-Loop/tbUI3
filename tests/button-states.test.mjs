import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
// Source checks for UI3Button's WinUI visual states and input behaviour (package 1.0.0.73).
// Expected values are copied from microsoft-ui-xaml commit 8318c5bf:
//   controls/dev/CommonStyles/Button_themeresources.xaml (state -> resource key)
//   controls/dev/CommonStyles/Common_themeresources_any.xaml (resource key -> colour)
//   dxaml/xcp/dxaml/lib/Button_Partial.cpp, ButtonBase_Partial.cpp (state priority, input)
// They do not replace a compiled run in the twinBASIC IDE.
const dir='tbUI3/src/Sources',read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const button=read('UI3Button.twin'),theme=read('UI3Theme.twin'),enums=read('UI3Enums.twin');
const body=(source,signature)=>{
 const start=source.indexOf(signature);assert(start>=0,'missing '+signature);
 const end=source.indexOf(/\bFunction\b/.test(signature)?'    End Function':(/\bProperty\b/.test(signature)?'    End Property':'    End Sub'),start);
 return source.slice(start,end);
};
const constant=name=>{
 const m=theme.match(new RegExp('Public Const '+name+' As Long = &H([0-9A-F]+)\\b'));
 assert(m,'missing theme constant '+name);return m[1].padStart(8,'0');
};

test('new theme tokens match Common_themeresources_any.xaml',()=>{
 const expected={
  DARK_SubtleFillColorTransparent:'00FFFFFF',DARK_SubtleFillColorSecondary:'0FFFFFFF',DARK_SubtleFillColorTertiary:'0AFFFFFF',
  LIGHT_SubtleFillColorTransparent:'00FFFFFF',LIGHT_SubtleFillColorSecondary:'09000000',LIGHT_SubtleFillColorTertiary:'06000000',
  DARK_FocusStrokeColorOuter:'FFFFFFFF',DARK_FocusStrokeColorInner:'B3000000',
  LIGHT_FocusStrokeColorOuter:'E4000000',LIGHT_FocusStrokeColorInner:'B3FFFFFF',
  ControlFillColorTransparent:'00FFFFFF',
  // Existing tokens the new states use.
  DARK_ControlFillColorSecondary:'15FFFFFF',DARK_ControlFillColorTertiary:'08FFFFFF',DARK_ControlFillColorDisabled:'0BFFFFFF',
  LIGHT_ControlFillColorSecondary:'80F9F9F9',LIGHT_ControlFillColorTertiary:'4DF9F9F9',LIGHT_ControlFillColorDisabled:'4DF9F9F9',
  DARK_TextFillColorSecondary:'C5FFFFFF',DARK_TextFillColorDisabled:'5DFFFFFF',
  LIGHT_TextFillColorSecondary:'9E000000',LIGHT_TextFillColorDisabled:'5C000000',
  DARK_TextOnAccentFillColorSecondary:'80000000',DARK_TextOnAccentFillColorDisabled:'87FFFFFF',
  LIGHT_TextOnAccentFillColorSecondary:'B3FFFFFF',LIGHT_TextOnAccentFillColorDisabled:'FFFFFFFF',
  DARK_AccentFillColorDisabled:'28FFFFFF',LIGHT_AccentFillColorDisabled:'37000000',
 };
 for(const [name,value] of Object.entries(expected)) assert.equal(constant(name),value,name);
 assert(/AccentFillSecondaryOpacity As Single = 0\.9\b/.test(theme));
 assert(/AccentFillTertiaryOpacity As Single = 0\.8\b/.test(theme));
 assert(/FocusVisualPrimaryThickness As Single = 2\b/.test(theme));
 assert(/FocusVisualSecondaryThickness As Single = 1\b/.test(theme));
});

test('WithOpacity applies a XAML brush Opacity to an opaque colour',()=>{
 // Mirror of UI3Theme.WithOpacity: alpha = CLng(255 * opacity), banker's rounding.
 const cl=v=>{const f=Math.floor(v),d=v-f;return d>0.5||(d===0.5&&f%2!==0)?f+1:f;};
 assert.equal(cl(255*0.9),230);assert.equal(cl(255*0.8),204);
 const proc=body(theme,'Public Function WithOpacity(');
 assert(/alpha = CLng\(alpha \* opacity\)/.test(proc));
});

test('every style maps each state to the resource Button_themeresources.xaml names',()=>{
 const draw=body(button,'Private Sub DrawButton(');
 const branch=(start,end)=>{const a=draw.indexOf(start);return draw.slice(a,end?draw.indexOf(end,a):undefined);};
 const accent=branch('Case ui3ButtonAccent','Case ui3ButtonSubtle');
 const subtle=branch('Case ui3ButtonSubtle',"' DefaultButtonStyle");
 const standard=draw.slice(draw.indexOf("' DefaultButtonStyle"));
 const state=(src,name,next)=>src.slice(src.indexOf('Case '+name),next?src.indexOf(next,src.indexOf('Case '+name)):undefined);
 // Accent: AccentFillColor{Secondary,Tertiary,Disabled}, TextOnAccent{Primary,Secondary,Disabled}, border elevation/transparent.
 let s=state(accent,'STATE_POINTER_OVER','Case STATE_PRESSED');
 assert(/AccentFillSecondaryOpacity/.test(s)&&/TextOnAccentFillColorPrimary/.test(s)&&/BORDER_ELEVATION/.test(s));
 s=state(accent,'STATE_PRESSED','Case STATE_DISABLED');
 assert(/AccentFillTertiaryOpacity/.test(s)&&/TextOnAccentFillColorSecondary/.test(s)&&/BORDER_NONE/.test(s));
 s=state(accent,'STATE_DISABLED','Case Else');
 assert(/AccentFillColorDisabled/.test(s)&&/TextOnAccentFillColorDisabled/.test(s)&&/BORDER_NONE/.test(s));
 assert(/fillInset = 0/.test(accent),'AccentButtonStyle uses BackgroundSizing OuterBorderEdge');
 // Subtle: SubtleFillColor{Transparent,Secondary,Tertiary}; border brush equals background brush.
 s=state(subtle,'STATE_POINTER_OVER','Case STATE_PRESSED');assert(/SubtleFillColorSecondary/.test(s)&&/TextFillColorPrimary/.test(s));
 s=state(subtle,'STATE_PRESSED','Case STATE_DISABLED');assert(/SubtleFillColorTertiary/.test(s)&&/TextFillColorSecondary/.test(s));
 s=state(subtle,'STATE_DISABLED','Case Else');assert(/SubtleFillColorTransparent/.test(s)&&/TextFillColorDisabled/.test(s));
 assert(/borderKind = BORDER_SOLID\s+borderColor = fill/.test(subtle));
 // Standard: ControlFillColor{Secondary,Tertiary,Disabled}; pressed/disabled border ControlStrokeColorDefault.
 s=state(standard,'STATE_POINTER_OVER','Case STATE_PRESSED');assert(/ControlFillColorSecondary/.test(s)&&/TextFillColorPrimary/.test(s)&&/BORDER_ELEVATION/.test(s));
 s=state(standard,'STATE_PRESSED','Case STATE_DISABLED');assert(/ControlFillColorTertiary/.test(s)&&/TextFillColorSecondary/.test(s)&&/borderColor = strokeDefault/.test(s));
 s=state(standard,'STATE_DISABLED','Case Else');assert(/ControlFillColorDisabled/.test(s)&&/TextFillColorDisabled/.test(s)&&/borderColor = strokeDefault/.test(s));
});

test('state priority follows Button::ChangeVisualState: Disabled, Pressed, PointerOver, Normal',()=>{
 const v=body(button,'Private Function VisualState(');
 const order=['Not UserControl.Enabled','PressedNow()','PointerOverNow()','STATE_NORMAL'].map(x=>v.indexOf(x));
 assert(order.every(i=>i>=0)&&order.every((x,i)=>i===0||x>order[i-1]),'order '+order);
 // Focus visual only for keyboard focus while enabled, and only when UseSystemFocusVisuals.
 const f=body(button,'Private Function ShowsFocusVisual(');
 for(const part of ['m_UseSystemFocusVisuals','m_Focused','m_KeyboardFocus','UserControl.Enabled']) assert(f.includes(part),part);
});

test('Click follows ButtonBase input rules, never UserControl_Click',()=>{
 assert(!button.includes('Private Sub UserControl_Click()'),'Click must come from the ButtonBase rules');
 const down=body(button,'Private Sub UserControl_MouseDown(');
 assert(down.indexOf('ui3ClickModeHover Then Exit Sub')<down.indexOf('m_PointerDown = True'),'Hover ignores presses');
 assert(/If m_ClickMode = ui3ClickModePress Then RaiseEvent Click/.test(down));
 const up=body(button,'Private Sub UserControl_MouseUp(');
 assert(/perform = PointInside\(X, Y\) And Not m_KeyPressed/.test(up),'release outside the button does not click');
 assert(up.indexOf('m_Surface.ReleasePointer')<up.indexOf('RaiseEvent Click'),'state is reset before Click runs');
 assert(/If perform And m_ClickMode = ui3ClickModeRelease Then RaiseEvent Click/.test(up));
 const keyUp=body(button,'Private Sub UserControl_KeyUp(');
 assert(/m_ClickMode = ui3ClickModeRelease/.test(keyUp));
 const access=body(button,'Private Sub UserControl_AccessKeyPress(');
 assert(/If KeyAscii = vbKeyReturn And m_HeldKey = vbKeyReturn Then Exit Sub/.test(access),'Enter must not click twice');
 const hot=body(button,'Private Sub IUI3SurfaceClient_SurfaceHotChanged(');
 assert(/ui3ClickModeHover And UserControl\.Enabled/.test(hot)&&hot.indexOf('m_Surface.Invalidate')<hot.indexOf('RaiseEvent Click'));
 const lost=body(button,'Private Sub UserControl_LostFocus(');assert(lost.includes('CancelPress'));
});

test('new public members keep WinUI names, DISPID_ENABLED and saved defaults',()=>{
 assert(/\[DispId\(-514\)\][\s\S]{0,200}Public Property Get Enabled\(\) As Boolean/.test(button));
 for(const name of ['ClickMode','UseSystemFocusVisuals','AccessKey','Enabled'])
  assert(new RegExp('PropBag\\.WriteProperty "'+name+'"').test(button)&&new RegExp('PropBag\\.ReadProperty\\("'+name+'"').test(button),name);
 assert(/Public Property Get IsPressed\(\) As Boolean/.test(button)&&!/Public Property Let IsPressed/.test(button));
 assert(/Public Property Get IsPointerOver\(\) As Boolean/.test(button)&&!/Public Property Let IsPointerOver/.test(button));
 assert(/ui3ClickModeRelease = 0\s+ui3ClickModePress = 1\s+ui3ClickModeHover = 2/.test(enums),'WinUI ClickMode values');
 assert(/ui3ButtonStandard = 0\s+ui3ButtonAccent = 1\s+ui3ButtonSubtle = 2/.test(enums));
 // Stable IDs never change.
 const ids=JSON.parse(fs.readFileSync('tbUI3/UI3Button-ids.json','utf8'));
 for(const v of Object.values(ids)) assert(button.includes(String(v).replace(/[{}]/g,'')),'id '+v);
});

test('changed sources keep CRLF',()=>{
 for(const name of ["UI3Button.twin","UI3Theme.twin","UI3Enums.twin","UI3Surface.twin","UI3SurfaceHost.twin","UI3Direct2D.twin"])
  assert(!/(?<!\r)\n/.test(read(name)),name);
});

// ---- Package 1.0.0.74: appearance properties ----
const d2d=read('UI3Direct2D.twin');

test('appearance defaults are DefaultButtonStyle values and enums use WinUI numbering',()=>{
 assert(/DEFAULT_PADDING As String = "11,5,11,6"/.test(button),'ButtonPadding');
 assert(/ButtonPaddingLeft As Single = 11[\s\S]*ButtonPaddingTop As Single = 5[\s\S]*ButtonPaddingRight As Single = 11[\s\S]*ButtonPaddingBottom As Single = 6/.test(theme));
 assert(/ControlContentThemeFontSize As Single = 14\b/.test(theme));
 assert(/DEFAULT_FONT_WEIGHT As Long = 400\b/.test(button)&&/DEFAULT_FONT_STYLE As Long = 0\b/.test(button)&&/DEFAULT_FONT_STRETCH As Long = 5\b/.test(button));
 assert(/DEFAULT_CONTENT_ALIGNMENT As Long = 1\b/.test(button),'Button starts with Center content alignment');
 const reset=body(button,'Private Sub ResetAppearance(');
 for(const s of ['m_CornerRadius = ControlCornerRadius','m_BorderThickness = ButtonBorderThemeThickness','m_FontSize = ControlContentThemeFontSize','m_Background = THEME_BRUSH','m_Foreground = THEME_BRUSH','m_BorderBrush = THEME_BRUSH']) assert(reset.includes(s),s);
 assert(/ui3HAlignLeft = 0\s+ui3HAlignCenter = 1\s+ui3HAlignRight = 2\s+ui3HAlignStretch = 3/.test(enums));
 assert(/ui3VAlignTop = 0\s+ui3VAlignCenter = 1\s+ui3VAlignBottom = 2\s+ui3VAlignStretch = 3/.test(enums));
 assert(/ui3FontStyleNormal = 0\s+ui3FontStyleOblique = 1\s+ui3FontStyleItalic = 2/.test(enums));
 assert(/ui3FontStretchUltraCondensed = 1[\s\S]*ui3FontStretchNormal = 5[\s\S]*ui3FontStretchUltraExpanded = 9/.test(enums));
 assert(/ui3InnerBorderEdge = 0\s+ui3OuterBorderEdge = 1/.test(enums));
 assert(/ui3FontWeightNormal = 400[\s\S]*ui3FontWeightBold = 700/.test(enums));
 for(const name of ['FontFamily','FontSize','FontWeight','FontStyle','FontStretch','Padding','HorizontalContentAlignment','VerticalContentAlignment','CornerRadius','BorderThickness','BackgroundSizing','Background','Foreground','BorderBrush'])
  assert(new RegExp('PropBag\\.WriteProperty "'+name+'"').test(button)&&new RegExp('PropBag\\.ReadProperty\\("'+name+'"').test(button),name);
 // Attribute strings must not hold quote characters (BETA 1044 designer JSON).
 for(const m of button.matchAll(/\[Description\("([^\r\n]*)"\)\]/g)) assert(!m[1].includes('"'),m[1]);
});

test('brushes set on the control show only in Normal, as the template states override them',()=>{
 const draw=body(button,'Private Sub DrawButton(');
 const normal=draw.slice(draw.indexOf('If state = STATE_NORMAL Then'));
 const end=normal.indexOf('\n        End If');
 const block=normal.slice(0,end);
 for(const s of ['m_Background <> THEME_BRUSH','m_Foreground <> THEME_BRUSH','m_BorderBrush <> THEME_BRUSH']) assert(block.includes(s),s);
 for(const n of ['m_Background\\b','m_Foreground\\b','m_BorderBrush\\b'])
  assert.equal((draw.match(new RegExp(n,'g'))||[]).length,(block.match(new RegExp(n,'g'))||[]).length,n+' is read only inside the Normal block');
 // A local BackgroundSizing overrides the style's; the content box is BorderThickness plus Padding.
 assert(/If m_BackgroundSizing = ui3InnerBorderEdge Then\s+fillInset = t\s+ElseIf m_BackgroundSizing = ui3OuterBorderEdge Then\s+fillInset = 0/.test(draw));
 assert(/t \+ m_PadLeft, t \+ m_PadTop, _\s+w - t - m_PadRight, h - t - m_PadBottom/.test(draw));
 assert(/ContentTextFormat\(m_FontFamily, m_FontSize, m_FontWeight, m_FontStyle, m_FontStretch\), m_HContent, m_VContent/.test(draw));
});

test('Padding parses XAML Thickness text with one, two or four values',()=>{
 // JS mirror of ParseThickness and ThicknessText; the source shape is checked below.
 const parse=t=>{t=t.replace(/,/g,' ').trim().replace(/ +/g,' ');if(!t)return null;const p=t.split(' ');if(p.length>4)return null;
  const v=p.map(Number);if(v.some(x=>isNaN(x)||x<0))return null;
  if(v.length===1)return [v[0],v[0],v[0],v[0]];if(v.length===2)return [v[0],v[1],v[0],v[1]];if(v.length===4)return v;return null;};
 const text=([l,t,r,b])=>l===t&&t===r&&r===b?String(l):(l===r&&t===b?l+','+t:[l,t,r,b].join(','));
 assert.deepEqual(parse('11,5,11,6'),[11,5,11,6]);assert.deepEqual(parse('8'),[8,8,8,8]);assert.deepEqual(parse('4, 2'),[4,2,4,2]);
 assert.equal(parse('1,2,3'),null);assert.equal(parse('-1'),null);assert.equal(parse('a'),null);assert.equal(parse(''),null);
 assert.equal(text([11,5,11,6]),'11,5,11,6');assert.equal(text([8,8,8,8]),'8');assert.equal(text([4,2,4,2]),'4,2');
 const p=body(button,'Private Function ParseThickness(');
 assert(/Replace\(Text, ",", " "\)/.test(p)&&/If UBound\(parts\) > 3 Then Exit Function/.test(p)&&/If values\(i\) < 0 Then Exit Function/.test(p));
 assert(/Case 1:[\s\S]*Case 2: L = values\(0\): T = values\(1\): R = values\(0\): B = values\(1\)[\s\S]*Case 4:[\s\S]*Case Else: Exit Function/.test(p));
});

test('centred content keeps the original drawing path; other alignments use the aligned layout',()=>{
 const dbc=body(d2d,'Public Sub DrawButtonContent(');
 assert(/If hAlign <> 1 Or vAlign <> 1 Then\s+DrawAlignedContent[\s\S]*?Exit Sub/.test(dbc));
 assert(!dbc.includes('ControlTextFormat(), '),'the caption format is the control\'s');
 assert(/If textFormat Is Nothing Then Set fmt = ControlTextFormat\(\) Else Set fmt = textFormat/.test(dbc));
 const align=body(d2d,'Private Function AlignStart(');
 assert(/Case 1: AlignStart = Low \+ \(\(High - Low\) - Size\) \/ 2\s+Case 2: AlignStart = High - Size\s+Case Else: AlignStart = Low/.test(align),'Stretch draws at the near edge');
 const fmt=body(d2d,'Public Function ContentTextFormat(');
 assert(/CachedObject\(m_TextFormats, key\)/.test(fmt)&&fmt.indexOf('CreateCenteredTextFormat')>fmt.indexOf('If format Is Nothing Then'));
});
