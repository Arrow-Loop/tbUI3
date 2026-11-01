> Archived working note, copied from the project's shared files on 2026-11-01. The conclusions are superseded by [the investigation record](../2026-11-01-multipage-designer.md).

# Designer canvas, dark mode, and a design-time MultiPage

Answer to Shane's questions of 2026-10-30. Checked against twinBASIC BETA 1033 (the IDE zip in project files: `ide/main.js`, `ide/formDesigner.css`, the VB package source, and strings in `bin/twinBASIC_win64.dll`). **Verified** means I read it in that build. **Inferred** means it follows from what I read but needs the IDE test at the end.

## 1. How the twinBASIC canvas differs from the VBA UserForm designer

In Office, the VBA UserForm designer is a real MSForms window in design mode. The controls on it are live MSForms controls that know how to edit themselves at design time. That is why you can click a MultiPage tab, type straight into a Label's caption, and so on. Each MultiPage Page is its own container object.

twinBASIC works more like a photo booth. The designer you see is a web page inside the IDE. Behind it, the compiler creates the real form and real controls, hidden, and sends back a picture of each control. The designer shows those pictures as boxes you can select, drag and resize, and sends property changes back so the hidden control can repaint and send a new picture.

- **Verified:** the designer asks the compiler for control snapshots (`getImageFromServer`, `gotNewFormSnapshotsResponse`). A control inside a Frame or container is a nested box with `overflow: hidden`, so children are clipped to the container's bounds.
- **Verified:** your UserControl's own code runs at design time, because its picture comes from the hidden live instance. That is how UI3Button already paints itself in the designer.
- **Verified:** controls with `Visible = False` are still shown at design time, greyed and 70% transparent (an IDE option makes them 91%). So "stack controls and toggle Visible" is even messier in twinBASIC's designer than in VBA's.

## 2. Will the canvas go dark?

Partly, and the part that stays light is fixable by us.

- **Verified:** the area around the form (the canvas, rulers, toolbox) is themeable. Our WinUI3 Dark theme already sets `FormDesignerCanvasBackground` to #1C1C1C with a dot grid, and the rulers to #202020.
- **Verified:** the form itself is not part of the IDE theme. It is the picture of the real form, painted with the form's BackColor. The default is `vbButtonFace`, a Windows system colour that stays light grey in dark mode, because Windows' classic system colours do not follow dark mode.
- **Inferred:** so the form looks dark at design time as soon as its BackColor is dark. tbUI3 can make that automatic later, for example a form helper or a tbUI3 surface control that paints #202020 when dark. tbUI3 controls themselves follow `UI3Theme.IsDarkMode()`, which reads the Windows app setting, not the IDE theme. So with Windows in dark mode they draw dark in the designer even if the IDE is in a light theme. If you want the designer to follow the IDE instead, that needs a `ThemeMode` property on the form or control, already sketched in the form-theme spec.

## 3. Can a tbUI3 MultiPage behave like VBA's at design time?

Probably yes, using the same trick Microsoft's own SSTab tab control uses, but one piece needs your test.

**What already exists (verified):**

- `ControlContainer` and `EditAtDesignTime` are real UserControl properties in 1033. The IDE refuses a container that is also Windowless, so the MultiPage must be a windowed UserControl.
- A `ControlContainer` UserControl gets marked as a container in the designer, so you can drop controls into it, the same as a Frame. The designer flashes a red outline on the container it will drop into.
- `UserControl.ContainedControls` is implemented (class `UCContainedControls` in the VB package), so the control can list and move the children dropped on it.
- **Click pass-through exists, with a catch.** When a control is already selected and you click it again without dragging, the designer waits half a second and then sends a "designer click" with the X and Y to the hidden live control (`_designerClick` in main.js and in the compiler DLL). This is the fix twinBASIC made in 2022 so you can click SSTab tabs in design view (nolongerset.com, BETA 60 to 62 notes). So it is click once to select, click again on a tab, then a short pause.
- **The designer picks up children the control moves.** The compiler can report `dynamicChanges`, and the designer applies the new Left, Top, Width and Height of each named control. That is the mechanism that lets a tab control hide other pages' children at design time.

**How it would work (inferred):** all pages share one container, the MultiPage itself, unlike VBA's separate Page objects. The MultiPage remembers which page each child belongs to (saved in its PropertyBag) and parks the children of hidden pages far off to the left (Left minus 75000), which is what SSTab does. Because children are clipped to the container, they vanish from view. Clicking another tab moves the old page's children out and the new page's children back. A control you drop while page 2 is showing gets adopted into page 2. At runtime the same code runs, so the form behaves the same.

**What I could not confirm without the IDE:**

1. Whether the designer click reaches a twinBASIC UserControl's own MouseDown or Click event, or only imported ActiveX controls like SSTab. The compiler string sits next to `_isImportedActiveXControl`, which is a hint either way.
2. Whether a UserControl moving its ContainedControls at design time produces those `dynamicChanges`, so the designer updates.

If (1) fails, there is a reliable fallback: a `SelectedPage` property in the Properties panel. Changing a property definitely runs our code at design time, so the page switch still happens, just from the property sheet instead of clicking the tab. If (2) fails, the approach needs a twinBASIC feature request, and I would raise it on GitHub with the test project as evidence.

**MultiPage-style alternative (added after Shane's follow-up, inferred):** make each page its own container, as MSForms' MultiPage does. That means two controls: `UI3TabView`, a container, and `UI3TabPage`, also a container, which you draw inside it. The TabView stretches each page to fill its client area, builds its tab headers from the pages' captions, and parks every unselected page off to the side. Only the page moves, not each child. A dropped control then really belongs to its page, because its `Container` is that page. That's the MultiPage model, and it matches WinUI's TabView and TabViewItem. Verified: when you drop a control, the designer walks up to the nearest container under the cursor, so it lands in the visible page. Inferred: nesting one ControlContainer UserControl inside another works the way a Frame inside a Frame does. The drawback is that you add a page by drawing a UI3TabPage, not with VBA's right-click "New Page", because a UserControl most likely can't create controls on the form at design time.

**Limits even if both pass:** the half-second click delay is the IDE's, not ours. The control's state lives in one container, so selecting a hidden page's child from the Properties panel's control list will show it parked off-screen, the same as SSTab in VB6.

## 4. Test to run in the IDE (about 10 minutes)

**Ready-made project (2026-11-01):** open `probes/TabProbeTest/TabProbeTest.twinproj`. It already contains the TabProbe UserControl below, with ControlContainer = True, and an empty frmMain, so skip steps 1 and 2 and start at step 3. It was generated in the cloud and has not been opened in twinBASIC yet.

1. In tbUI3Test (or any scratch project), add a new UserControl named `TabProbe`. In its Properties panel set **ControlContainer = True**.
2. Paste this inside the class, replacing the empty body, and save.

```vb
    Private m_Page As Long

    Public Property Get SelectedPage() As Long
        SelectedPage = m_Page
    End Property

    Public Property Let SelectedPage(ByVal Value As Long)
        If Value < 1 Or Value > 2 Then Value = 1
        m_Page = Value
        PropertyChanged "SelectedPage"
        ShowPage
    End Property

    Private Sub UserControl_Initialize()
        UserControl.ScaleMode = vbPixels
    End Sub

    Private Sub UserControl_InitProperties()
        m_Page = 1
        LogLine "InitProperties"
    End Sub

    Private Sub UserControl_ReadProperties(PropBag As PropertyBag)
        m_Page = PropBag.ReadProperty("SelectedPage", 1)
        LogLine "ReadProperties page=" & m_Page
    End Sub

    Private Sub UserControl_WriteProperties(PropBag As PropertyBag)
        PropBag.WriteProperty "SelectedPage", m_Page, 1
    End Sub

    Private Sub UserControl_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
        LogLine "MouseDown x=" & X & " y=" & Y
        If Y <= 24 Then
            If X < UserControl.ScaleWidth / 2 Then SelectedPage = 1 Else SelectedPage = 2
        End If
    End Sub

    Private Sub UserControl_Click()
        LogLine "Click"
    End Sub

    Private Sub UserControl_Paint()
        Dim w As Single
        w = UserControl.ScaleWidth / 2
        UserControl.Cls
        UserControl.Line (0, 0)-(w, 24), IIf(m_Page = 1, RGB(0, 95, 184), RGB(150, 150, 150)), BF
        UserControl.Line (w, 0)-(w * 2, 24), IIf(m_Page = 2, RGB(0, 95, 184), RGB(150, 150, 150)), BF
        UserControl.ForeColor = vbWhite
        UserControl.CurrentX = 8: UserControl.CurrentY = 4: UserControl.Print "Page 1"
        UserControl.CurrentX = w + 8: UserControl.CurrentY = 4: UserControl.Print "Page 2"
    End Sub

    ' Children whose Tag is not the current page are parked 75000 to the left.
    Private Sub ShowPage()
        Dim c As Object
        For Each c In UserControl.ContainedControls
            If c.Tag <> "" Then
                If c.Tag = CStr(m_Page) Then
                    If c.Left < -50000 Then c.Left = c.Left + 75000
                Else
                    If c.Left > -50000 Then c.Left = c.Left - 75000
                End If
            End If
        Next
        LogLine "ShowPage " & m_Page & " children=" & UserControl.ContainedControls.Count
        UserControl.Refresh
    End Sub

    ' Writes beside the project (App.Path), and also to %TEMP% in case
    ' App.Path is not the project folder while the designer is running.
    Private Sub LogLine(ByVal s As String)
        On Error Resume Next
        Dim lineText As String
        lineText = Format$(Now, "hh:nn:ss") & "  UserMode=" & Ambient.UserMode & "  " & s & "  [App.Path=" & App.Path & "]"
        WriteLogFile App.Path & "\tabprobe.log", lineText
        WriteLogFile Environ$("TEMP") & "\tabprobe.log", lineText
    End Sub

    Private Sub WriteLogFile(ByVal filePath As String, ByVal lineText As String)
        On Error Resume Next
        Dim f As Integer
        f = FreeFile
        Open filePath For Append As #f
        Print #f, lineText
        Close #f
    End Sub
```

3. On Form1, draw a large TabProbe. Draw a CommandButton inside it (watch for the red outline on TabProbe while drawing) and set its **Tag = 1**. Draw a TextBox inside it and set its **Tag = 2**.
4. **Property route:** with TabProbe selected, set **SelectedPage = 2** in the Properties panel. Pass if the button disappears and the text box stays. Set it back to 1.
5. **Click route:** click TabProbe once to select it, then click once on the "Page 2" strip and wait a second. Pass if the page switches.
6. Open `tabprobe.log` in the project folder. If it isn't there, use `%TEMP%\tabprobe.log`; each line records the App.Path the designer actually used. Look for `UserMode=False  MouseDown` lines from step 5.
7. Save, close and reopen the form. Pass if the right page's controls are still showing. Then press F5 and click the tabs at runtime.

Tell me which steps passed. Step 4 decides whether a design-time MultiPage is possible at all. Step 5 decides whether it is "click the tab" like VBA or "pick the page in Properties".

## Sources

- twinBASIC BETA 1033 IDE: `ide/main.js` (`_designerClick`, `dynamicChanges`, `WindowElementFlag_IsContainer`, `lessTransparentInvisibleControls`, ControlContainer and EditAtDesignTime checks), `ide/formDesigner.css` (`.baseControl` overflow), VB package `UserControl.ContainedControls`.
- [twinBASIC Update: June 26, 2022](https://nolongerset.com/twinbasic-update-june-26-2022/) (SSTab design-view click fixes).
- [twinbasic issue #945](https://github.com/WaynePhillipsEA/twinbasic/issues/945) (SSTab and SSTabEx used in the designer).
- `tbIDE-theme/themes/WinUI3 Dark.theme` and `tbUI3/2026-10-06-form-theme-spec.md`.
