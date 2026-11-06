VERSION 1.0 CLASS
BEGIN
    MultiUse = -1  'True
    Persistable = 0  'NotPersistable
    DataBindingBehavior = 0  'vbNone
    DataSourceBehavior  = 0  'vbNone
    MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "TwinTimer"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = True
Option Explicit
Public Event Timer(ByVal ElapsedTime As LongLong)
Attribute Timer.VB_Description = "Occurs when a preset interval for a timer has elapsed."
Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As Long
Private Declare PtrSafe Function SetTimer Lib "user32" (ByVal hWnd As LongPtr, ByVal nIDEvent As LongPtr, ByVal uElapse As Long, ByVal lpTimerFunc As LongPtr) As LongPtr
Private Declare PtrSafe Function KillTimer Lib "user32" (ByVal hWnd As LongPtr, ByVal nIDEvent As LongPtr) As Long
Private PropID As LongPtr, PropStartTime As LongLong
Private PropEnabled As Boolean
Private PropInterval As Long

Private Sub Class_Initialize()
PropEnabled = True
PropInterval = 0
End Sub

Private Sub Class_Terminate()
Call DestroyTimer
End Sub

Public Property Get Enabled() As Boolean
Attribute Enabled.VB_Description = "Returns/sets a value that determines whether an object can respond to user-generated events."
Attribute Enabled.VB_UserMemId = 0
Enabled = PropEnabled
End Property

Public Property Let Enabled(ByVal Value As Boolean)
PropEnabled = Value
Call DestroyTimer
Call CreateTimer
End Property

Public Property Get Interval() As Long
Attribute Interval.VB_Description = "Returns/sets the number of milliseconds between calls to a timer event."
Interval = PropInterval
End Property

Public Property Let Interval(ByVal Value As Long)
If Value < 0 Then Err.Raise 380
PropInterval = Value
Call DestroyTimer
Call CreateTimer
End Property
    
Private Sub CreateTimer()
If PropID <> 0 Then Exit Sub
If PropEnabled = True And PropInterval > 0 Then
    PropStartTime = 0
    PropID = SetTimer(vbNullPtr, 0, PropInterval, AddressOf Me.TimerProc)
End If
End Sub

Private Sub DestroyTimer()
If PropID = 0 Then Exit Sub
KillTimer vbNullPtr, PropID
PropID = 0
End Sub

Private Function CLngToULng(ByVal Value As Long) As LongLong
Const OFFSET_4 As LongLong = 4294967296^
If Value < 0 Then CLngToULng = Value + OFFSET_4 Else CLngToULng = Value
End Function

Private Sub TimerProc(ByVal hWnd As LongPtr, ByVal uMsg As Long, ByVal nIDEvent As LongPtr, ByVal dwTime As Long)
Static TotalElapsedTime As LongLong, LastElapsedTime As LongLong
If PropStartTime > 0 Then
    Dim ElapsedTime As LongLong
    ElapsedTime = CLngToULng(dwTime) - PropStartTime
    ' Circumvent the 49.7 days limitation for the ElapsedTime argument.
    If ElapsedTime < LastElapsedTime Then
        TotalElapsedTime = TotalElapsedTime + (4294967295^ - LastElapsedTime)
        LastElapsedTime = 0
    End If
    TotalElapsedTime = TotalElapsedTime + (ElapsedTime - LastElapsedTime)
    LastElapsedTime = ElapsedTime
    RaiseEvent Timer(TotalElapsedTime)
Else
    PropStartTime = CLngToULng(dwTime)
    TotalElapsedTime = 0
    LastElapsedTime = 0
    RaiseEvent Timer(0)
End If
End Sub
