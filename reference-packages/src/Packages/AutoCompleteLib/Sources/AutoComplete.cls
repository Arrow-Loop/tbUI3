VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
  Persistable = 0  'NotPersistable
  DataBindingBehavior = 0  'vbNone
  DataSourceBehavior  = 0  'vbNone
  MTSTransactionMode  = 0  'NotAnMTSObject
END
Attribute VB_Name = "AutoComplete"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = True
Option Explicit
#If (VBA7 = 0) Then
Private Enum LongPtr
[_]
End Enum
#End If
#If Win64 Then
Private Const NULL_PTR As LongPtr = 0
Private Const PTR_SIZE As Long = 8
#Else
Private Const NULL_PTR As Long = 0
Private Const PTR_SIZE As Long = 4
#End If
#If False Then
Private AutoCompleteOptionNone, AutoCompleteOptionAppend, AutoCompleteOptionSuggest, AutoCompleteOptionSuggestAppend, AutoCompleteOptionSearch, AutoCompleteOptionFilterPrefixes, AutoCompleteOptionUseTab, AutoCompleteOptionUpDownKeyDropsList, AutoCompleteOptionRightToLeft
Private AutoCompleteSourceNone, AutoCompleteSourceHistory, AutoCompleteSourceFileSystem, AutoCompleteSourceMRU, AutoCompleteSourceAll, AutoCompleteSourceCustomSource
Private AutoCompleteFileSystemOptionNone, AutoCompleteFileSystemOptionCurrentDir, AutoCompleteFileSystemOptionMyComputer, AutoCompleteFileSystemOptionDesktop, AutoCompleteFileSystemOptionFavorites, AutoCompleteFileSystemOptionFileSysOnly, AutoCompleteFileSystemOptionFileSysDirs
#End If
Private Const ACO_NONE As Long = &H0
Private Const ACO_AUTOSUGGEST As Long = &H1
Private Const ACO_AUTOAPPEND As Long = &H2
Private Const ACO_SEARCH As Long = &H4
Private Const ACO_FILTERPREFIXES As Long = &H8
Private Const ACO_USETAB As Long = &H10
Private Const ACO_UPDOWNKEYDROPSLIST As Long = &H20
Private Const ACO_RTLREADING As Long = &H40
Public Enum AutoCompleteOptionConstants
AutoCompleteOptionNone = ACO_NONE
AutoCompleteOptionAppend = ACO_AUTOAPPEND
AutoCompleteOptionSuggest = ACO_AUTOSUGGEST
AutoCompleteOptionSuggestAppend = (ACO_AUTOSUGGEST Or ACO_AUTOAPPEND)
AutoCompleteOptionSearch = ACO_SEARCH
AutoCompleteOptionFilterPrefixes = ACO_FILTERPREFIXES
AutoCompleteOptionUseTab = ACO_USETAB
AutoCompleteOptionUpDownKeyDropsList = ACO_UPDOWNKEYDROPSLIST
AutoCompleteOptionRightToLeft = ACO_RTLREADING
End Enum
Private Const ACLO_NONE As Long = 0
Private Const ACLO_CURRENTDIR As Long = 1
Private Const ACLO_MYCOMPUTER As Long = 2
Private Const ACLO_DESKTOP As Long = 4
Private Const ACLO_FAVORITES As Long = 8
Private Const ACLO_FILESYSONLY As Long = 16
Private Const ACLO_FILESYSDIRS As Long = 32
Public Enum AutoCompleteFileSystemOptionConstants
AutoCompleteFileSystemOptionNone = ACLO_NONE
AutoCompleteFileSystemOptionCurrentDir = ACLO_CURRENTDIR
AutoCompleteFileSystemOptionMyComputer = ACLO_MYCOMPUTER
AutoCompleteFileSystemOptionDesktop = ACLO_DESKTOP
AutoCompleteFileSystemOptionFavorites = ACLO_FAVORITES
AutoCompleteFileSystemOptionFileSysOnly = ACLO_FILESYSONLY
AutoCompleteFileSystemOptionFileSysDirs = ACLO_FILESYSDIRS
End Enum
Public Enum AutoCompleteSourceConstants
AutoCompleteSourceNone = 0
AutoCompleteSourceHistory = 1
AutoCompleteSourceFileSystem = 2
AutoCompleteSourceMRU = 3
AutoCompleteSourceAll = 4
AutoCompleteSourceCustomSource = 5
End Enum
#If VBA7 Then
Private Declare PtrSafe Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (ByRef Destination As Any, ByRef Source As Any, ByVal Length As Long)
#Else
Private Declare Sub CopyMemory Lib "kernel32" Alias "RtlMoveMemory" (ByRef Destination As Any, ByRef Source As Any, ByVal Length As Long)
#End If
Private Const S_OK As Long = &H0, S_FALSE As Long = &H1
Private Const E_POINTER As Long = &H80004003
Private Const E_NOTIMPL As Long = &H80004001
Private Const ACDD_VISIBLE As Long = 1
Implements AutoCompleteGuids.IEnumStringVB
Private IEnumStringElements() As String
Private IEnumStringCurrentElement As Long
Private IEnumStringCount As Long
Private IAutoComplete As AutoCompleteGuids.IAutoComplete2
Private IAutoCompleteDropDown As AutoCompleteGuids.IAutoCompleteDropDown
Private IAutoCompleteIACList2 As AutoCompleteGuids.IACList2

Private Sub Class_Initialize()
Set IAutoComplete = CreateIAutoComplete2()
End Sub

#If VBA7 Then
Private Sub IEnumStringVB_Next(ByRef RetVal As Long, ByVal cElt As Long, ByVal rgElt As LongPtr, ByVal lpcEltFetched As LongPtr)
#Else
Private Sub IEnumStringVB_Next(ByRef RetVal As Long, ByVal cElt As Long, ByVal rgElt As Long, ByVal lpcEltFetched As Long)
#End If
If rgElt = NULL_PTR Then RetVal = E_POINTER: Exit Sub
Dim i As Long, cEltFetched As Long, lpString As LongPtr
cEltFetched = 0
For i = 0 To cElt - 1
    If IEnumStringCurrentElement = IEnumStringCount Then Exit For
    lpString = AutoCompleteGuids.[_CoTaskMemAlloc](LenB(IEnumStringElements(IEnumStringCurrentElement) & vbNullChar))
    If lpString = NULL_PTR Then RetVal = S_FALSE: Exit Sub
    AutoCompleteGuids.[_CopyMemory] ByVal lpString, ByVal StrPtr(IEnumStringElements(IEnumStringCurrentElement)), LenB(IEnumStringElements(IEnumStringCurrentElement) & vbNullChar)
    AutoCompleteGuids.[_CopyMemory] ByVal UnsignedAdd(rgElt, i * PTR_SIZE), lpString, PTR_SIZE
    IEnumStringCurrentElement = IEnumStringCurrentElement + 1
    cEltFetched = cEltFetched + 1
Next i
If lpcEltFetched <> NULL_PTR Then AutoCompleteGuids.[_CopyMemory] ByVal lpcEltFetched, cEltFetched, 4
If i = cElt Then
    RetVal = S_OK
Else
    RetVal = S_FALSE
End If
End Sub

Private Sub IEnumStringVB_Skip(ByRef RetVal As Long, ByVal cElt As Long)
If IEnumStringCurrentElement + cElt <= IEnumStringCount Then
    IEnumStringCurrentElement = IEnumStringCurrentElement + cElt
    RetVal = S_OK
Else
    IEnumStringCurrentElement = IEnumStringCount
    RetVal = S_FALSE
End If
End Sub

Private Sub IEnumStringVB_Reset(ByRef RetVal As Long)
IEnumStringCurrentElement = 0
RetVal = S_OK
End Sub

#If VBA7 Then
Private Sub IEnumStringVB_Clone(ByRef RetVal As Long, ByVal lppEnum As LongPtr)
#Else
Private Sub IEnumStringVB_Clone(ByRef RetVal As Long, ByVal lppEnum As Long)
#End If
RetVal = E_NOTIMPL
End Sub

#If VBA7 Then
Public Sub Init(ByVal hWndEdit As LongPtr, ByVal Source As AutoCompleteSourceConstants)
Attribute Init.VB_Description = "Initializes the autocomplete object."
#Else
Public Sub Init(ByVal hWndEdit As Long, ByVal Source As AutoCompleteSourceConstants)
Attribute Init.VB_Description = "Initializes the autocomplete object."
#End If
If IAutoComplete Is Nothing Then Exit Sub
Dim IACLHistory As IUnknown
Dim IACListISF As IUnknown
Dim IACLMRU As IUnknown
Select Case Source
    Case AutoCompleteSourceHistory
        Set IACLHistory = CreateIACLHistory()
        IAutoComplete.Init hWndEdit, IACLHistory, NULL_PTR, NULL_PTR
    Case AutoCompleteSourceFileSystem
        If IAutoCompleteIACList2 Is Nothing Then
            Set IACListISF = CreateIACListISF()
            Set IAutoCompleteIACList2 = IACListISF
        End If
        IAutoComplete.Init hWndEdit, IAutoCompleteIACList2, NULL_PTR, NULL_PTR
    Case AutoCompleteSourceMRU
        Set IACLMRU = CreateIACLMRU()
        IAutoComplete.Init hWndEdit, IACLMRU, NULL_PTR, NULL_PTR
    Case AutoCompleteSourceAll
        Set IACLHistory = CreateIACLHistory()
        If IAutoCompleteIACList2 Is Nothing Then
            Set IACListISF = CreateIACListISF()
            Set IAutoCompleteIACList2 = IACListISF
        End If
        Set IACLMRU = CreateIACLMRU()
        Dim IObjMgr As AutoCompleteGuids.IObjMgr
        Set IObjMgr = CreateIObjMgr()
        IObjMgr.Append IACLHistory
        IObjMgr.Append IAutoCompleteIACList2
        IObjMgr.Append IACLMRU
        IAutoComplete.Init hWndEdit, IObjMgr, NULL_PTR, NULL_PTR
    Case AutoCompleteSourceCustomSource
        IAutoComplete.Init hWndEdit, GetACLEnum(Me), NULL_PTR, NULL_PTR
    Case Else
        Err.Raise 380
End Select
End Sub

Public Property Get Options() As AutoCompleteOptionConstants
Attribute Options.VB_Description = "Returns/sets one or more values that determines how the automatic completion works."
If Not IAutoComplete Is Nothing Then IAutoComplete.GetOptions Options
End Property

Public Property Let Options(ByVal Value As AutoCompleteOptionConstants)
If Not IAutoComplete Is Nothing Then IAutoComplete.SetOptions Value
End Property

Public Property Get FileSystemOptions() As AutoCompleteFileSystemOptionConstants
Attribute FileSystemOptions.VB_Description = "Returns/sets one or more values that determines which objects are enumerated when the AutoCompleteSource property is set to FileSystem."
If IAutoCompleteIACList2 Is Nothing Then
    Dim IACListISF As IUnknown
    Set IACListISF = CreateIACListISF()
    Set IAutoCompleteIACList2 = IACListISF
End If
If Not IAutoCompleteIACList2 Is Nothing Then IAutoCompleteIACList2.GetOptions FileSystemOptions
End Property

Public Property Let FileSystemOptions(ByVal Value As AutoCompleteFileSystemOptionConstants)
If IAutoCompleteIACList2 Is Nothing Then
    Dim IACListISF As IUnknown
    Set IACListISF = CreateIACListISF()
    Set IAutoCompleteIACList2 = IACListISF
End If
If Not IAutoCompleteIACList2 Is Nothing Then IAutoCompleteIACList2.SetOptions Value
End Property

Public Property Get CustomSource() As Variant
Attribute CustomSource.VB_Description = "Returns/sets a custom string array to use when the AutoCompleteSource property is set to CustomSource."
CustomSource = IEnumStringElements()
End Property

Public Property Let CustomSource(ByVal StringArray As Variant)
If IsArray(StringArray) Then
    Dim Ptr As LongPtr
    CopyMemory Ptr, ByVal UnsignedAdd(VarPtr(StringArray), 8), PTR_SIZE
    If Ptr <> NULL_PTR Then
        Dim DimensionCount As Integer
        CopyMemory DimensionCount, ByVal Ptr, 2
        If DimensionCount = 1 Then
            Erase IEnumStringElements()
            IEnumStringCurrentElement = 0
            IEnumStringCount = 0
            Dim i As Long
            For i = LBound(StringArray) To UBound(StringArray)
                If VarType(StringArray(i)) = vbString Then
                    If Not StringArray(i) = vbNullString Then
                        ReDim Preserve IEnumStringElements(0 To IEnumStringCount) As String
                        IEnumStringElements(IEnumStringCount) = StringArray(i)
                        IEnumStringCount = IEnumStringCount + 1
                    End If
                End If
            Next i
        Else
            Err.Raise Number:=5, Description:="Array must be single dimensioned"
        End If
    Else
        Err.Raise Number:=91, Description:="Array is not allocated"
    End If
ElseIf IsEmpty(StringArray) Then
    Erase IEnumStringElements()
    IEnumStringCurrentElement = 0
    IEnumStringCount = 0
Else
    Err.Raise 380
End If
End Property

Public Function DroppedDown() As Boolean
Attribute DroppedDown.VB_Description = "Returns a value that determines whether the drop-down list is dropped down or not."
If IAutoCompleteDropDown Is Nothing Then Set IAutoCompleteDropDown = IAutoComplete
If Not IAutoCompleteDropDown Is Nothing Then
    Dim Flags As Long
    IAutoCompleteDropDown.GetDropDownStatus Flags, NULL_PTR
    DroppedDown = CBool((Flags And ACDD_VISIBLE) = ACDD_VISIBLE)
End If
End Function

Public Sub Enable()
Attribute Enable.VB_Description = "Enables the auto completion."
If Not IAutoComplete Is Nothing Then IAutoComplete.Enable 1
End Sub

Public Sub Disable()
Attribute Disable.VB_Description = "Disables the auto completion."
If Not IAutoComplete Is Nothing Then IAutoComplete.Enable 0
End Sub

Public Sub Refresh()
Attribute Refresh.VB_Description = "Forces the autocomplete object to refresh its drop-down list of suggestions when it is visible."
If IAutoCompleteDropDown Is Nothing Then Set IAutoCompleteDropDown = IAutoComplete
If Not IAutoCompleteDropDown Is Nothing Then IAutoCompleteDropDown.ResetEnumerator
End Sub

Private Function UnsignedAdd(ByVal Start As LongPtr, ByVal Incr As LongPtr) As LongPtr
#If Win64 Then
UnsignedAdd = ((Start Xor &H8000000000000000^) + Incr) Xor &H8000000000000000^
#Else
UnsignedAdd = ((Start Xor &H80000000) + Incr) Xor &H80000000
#End If
End Function
