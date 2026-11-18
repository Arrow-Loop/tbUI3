import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
// Source checks for UI3Button package 1.0.0.75: Destructive (a tbUI3 extension taken from the
// tbUI3 CSS library's .button--danger), the FocusVisual* properties and RequestedTheme.
// WinUI values from microsoft-ui-xaml 8318c5bf (FocusRectManager.cpp, Button_themeresources.xaml).
// They do not replace a compiled run in the twinBASIC IDE.
const dir='tbUI3/src/Sources',read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const button=read('UI3Button.twin'),theme=read('UI3Theme.twin');
const body=(source,signature)=>{
 const start=source.indexOf(signature);assert(start>=0,'missing '+signature);
 const end=source.indexOf(/\bFunction\b/.test(signature)?'    End Function':'    End Sub',start);
 return source.slice(start,end);
};

test('Destructive uses SystemFillColorCritical at rest and on hover, not on Accent',()=>{
 assert(/DARK_SystemFillColorCritical As Long = &HFFFF99A4\b/.test(theme));
 assert(/LIGHT_SystemFillColorCritical As Long = &HFFC42B1C\b/.test(theme));
 const draw=body(button,'Private Sub DrawButton(');
 const d=draw.indexOf('If m_Destructive And m_Style <> ui3ButtonAccent Then');
 assert(d>0,'Destructive skips Accent');
 const block=draw.slice(d,draw.indexOf('End If',draw.indexOf('End If',d)+6));
 assert(/state = STATE_NORMAL Or state = STATE_POINTER_OVER/.test(block));
 assert(/SystemFillColorCritical/.test(block));
 // An explicit Foreground still wins in Normal: the override block comes after Destructive.
 assert(draw.indexOf('If m_Foreground <> THEME_BRUSH')>d);
});

test('focus visual properties default to the WinUI values and drive the drawing',()=>{
 const reset=body(button,'Private Sub ResetAppearance(');
 for(const line of ['m_FocusPrimaryBrush = THEME_BRUSH','m_FocusSecondaryBrush = THEME_BRUSH',
  'm_FocusPrimaryThickness = FocusVisualPrimaryThicknessDefault','m_FocusSecondaryThickness = FocusVisualSecondaryThicknessDefault',
  'm_FocusMargin = ButtonFocusVisualMargin','m_RequestedTheme = DEFAULT_REQUESTED_THEME','m_Destructive = DEFAULT_DESTRUCTIVE'])
  assert(reset.includes(line),line);
 assert(/ButtonFocusVisualMargin As Single = -3\b/.test(theme));
 const focus=body(button,'Private Sub DrawFocusVisual(');
 assert(/p = m_FocusPrimaryThickness/.test(focus)&&/q = m_FocusSecondaryThickness/.test(focus));
 assert(/m_FocusPrimaryBrush <> THEME_BRUSH/.test(focus)&&/m_FocusSecondaryBrush <> THEME_BRUSH/.test(focus));
 assert(/d = FocusVisualInset\(\)/.test(focus));
 // Inset = max(margin + 3, 0): the default -3 sits on the edge, larger margins move inward.
 const inset=m=>Math.max(m-(-3),0);
 assert.equal(inset(-3),0);assert.equal(inset(-5),0);assert.equal(inset(2),5);
 assert(/MaxSingle\(m_FocusMargin - ButtonFocusVisualMargin, 0\)/.test(body(button,'Private Function FocusVisualInset(')));
});

test('RequestedTheme follows ElementTheme numbering and replaces the app theme for this button',()=>{
 const enums=read('UI3Enums.twin');
 assert(/ui3ThemeSystem = 0/.test(enums)&&/ui3ThemeLight = 1/.test(enums)&&/ui3ThemeDark = 2/.test(enums));
 assert(/dark = ButtonIsDark\(\)/.test(body(button,'Private Sub DrawButton(')));
 assert(!/IsDarkMode\(\)/.test(body(button,'Private Sub DrawButton(')));
});

test('package 75 properties persist with their defaults and avoid quotes in descriptions',()=>{
 const names=['Destructive','FocusVisualPrimaryBrush','FocusVisualSecondaryBrush','FocusVisualPrimaryThickness',
  'FocusVisualSecondaryThickness','FocusVisualMargin','RequestedTheme'];
 const write=body(button,'Private Sub UserControl_WriteProperties(');
 const readA=body(button,'Private Sub ReadAppearance(');
 for(const n of names){
  assert(new RegExp('Public Property Get '+n+'\\(').test(button),n);
  assert(write.includes('PropBag.WriteProperty "'+n+'"'),'write '+n);
  assert(readA.includes('PropBag.ReadProperty("'+n+'"'),'read '+n);
 }
 for(const m of button.matchAll(/\[Description\("([^\n]*)"\)\]/g)) assert(!m[1].includes('""'),m[1]);
});
