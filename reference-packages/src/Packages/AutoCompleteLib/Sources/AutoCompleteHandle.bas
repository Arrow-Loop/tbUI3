Attribute VB_Name = "AutoCompleteHandle"
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

' Required:

' AutoCompleteGuids.tlb (in IDE only)

Private Type VTableIEnumStringDataStruct
VTable As LongPtr
RefCount As Long
Enumerable As AutoCompleteGuids.IEnumStringVB
End Type
#If VBA7 Then
Private Declare PtrSafe Function CLSIDFromString Lib "ole32" (ByVal lpszProgID As LongPtr, ByRef pCLSID As Any) As Long
Private Declare PtrSafe Function CoCreateInstance Lib "ole32" (ByRef rclsid As Any, ByVal pUnkOuter As LongPtr, ByVal dwClsContext As Long, ByRef riid As Any, ByRef ppv As IUnknown) As Long
#Else
Private Declare Function CLSIDFromString Lib "ole32" (ByVal lpszProgID As Long, ByRef pCLSID As Any) As Long
Private Declare Function CoCreateInstance Lib "ole32" (ByRef rclsid As Any, ByVal pUnkOuter As Long, ByVal dwClsContext As Long, ByRef riid As Any, ByRef ppv As IUnknown) As Long
#End If
Private Const CLSCTX_INPROC_SERVER As Long = 1
Private Const CLSID_IAutoComplete As String = "{00BB2763-6A77-11D0-A535-00C04FD7D062}"
Private Const CLSID_IAutoCompleteDropDown As String = "{3CD141F4-3C6A-11D2-BCAA-00C04FD929DB}"
Private Const CLSID_IACList2 As String = "{470141A0-5186-11D2-BBB6-0060977B464C}"
Private Const CLSID_ACLHistory As String = "{00BB2764-6A77-11D0-A535-00C04FD7D062}"
Private Const CLSID_ACListISF As String = "{03C036F1-A186-11D0-824A-00AA005B4383}"
Private Const CLSID_ACLMRU As String = "{6756A641-DE71-11D0-831B-00AA005B4383}"
Private Const CLSID_ACLMulti As String = "{00BB2765-6A77-11D0-A535-00C04FD7D062}"
Private Const IID_IAutoComplete2 As String = "{EAC04BC0-3791-11D2-BB95-0060977B464C}"
Private Const IID_IUnknown As String = "{00000000-0000-0000-C000-000000000046}"
Private Const IID_IObjMgr As String = "{00BB2761-6A77-11D0-A535-00C04FD7D062}"
Private Const E_NOTIMPL As Long = &H80004001
Private Const E_NOINTERFACE As Long = &H80004002
Private Const E_POINTER As Long = &H80004003
Private Const S_OK As Long = &H0
Private VTableIEnumString(0 To 6) As LongPtr

Public Function GetACLEnum(ByVal This As AutoCompleteGuids.IEnumStringVB) As AutoCompleteGuids.IEnumString
Dim VTableIEnumStringData As VTableIEnumStringDataStruct
With VTableIEnumStringData
.VTable = GetVTableIEnumString()
.RefCount = 1
Set .Enumerable = This
Dim hMem As LongPtr
hMem = AutoCompleteGuids.[_CoTaskMemAlloc](LenB(VTableIEnumStringData))
If hMem <> NULL_PTR Then
    AutoCompleteGuids.[_CopyMemory] ByVal hMem, VTableIEnumStringData, LenB(VTableIEnumStringData)
    AutoCompleteGuids.[_CopyMemory] ByVal VarPtr(GetACLEnum), hMem, PTR_SIZE
    AutoCompleteGuids.[_CopyMemory] ByVal VarPtr(.Enumerable), NULL_PTR, PTR_SIZE
End If
End With
End Function

Private Function GetVTableIEnumString() As LongPtr
If VTableIEnumString(0) = NULL_PTR Then
    VTableIEnumString(0) = ProcPtr(AddressOf IEnumString_QueryInterface)
    VTableIEnumString(1) = ProcPtr(AddressOf IEnumString_AddRef)
    VTableIEnumString(2) = ProcPtr(AddressOf IEnumString_Release)
    VTableIEnumString(3) = ProcPtr(AddressOf IEnumString_Next)
    VTableIEnumString(4) = ProcPtr(AddressOf IEnumString_Skip)
    VTableIEnumString(5) = ProcPtr(AddressOf IEnumString_Reset)
    VTableIEnumString(6) = ProcPtr(AddressOf IEnumString_Clone)
End If
GetVTableIEnumString = VarPtr(VTableIEnumString(0))
End Function

Private Function IEnumString_QueryInterface(ByRef This As VTableIEnumStringDataStruct, ByRef IID As AutoCompleteGuids.[_AC_GUID], ByRef pvObj As LongPtr) As Long
If VarPtr(pvObj) = NULL_PTR Then
    IEnumString_QueryInterface = E_POINTER
    Exit Function
End If
' IID_IEnumString = {00000101-0000-0000-C000-000000000046}
If IID.Data1 = &H101 And IID.Data2 = &H0 And IID.Data3 = &H0 Then
    If IID.Data4(0) = &HC0 And IID.Data4(1) = &H0 And IID.Data4(2) = &H0 And IID.Data4(3) = &H0 _
    And IID.Data4(4) = &H0 And IID.Data4(5) = &H0 And IID.Data4(6) = &H0 And IID.Data4(7) = &H46 Then
        pvObj = VarPtr(This)
        IEnumString_AddRef This
        IEnumString_QueryInterface = S_OK
    Else
        IEnumString_QueryInterface = E_NOINTERFACE
    End If
Else
    IEnumString_QueryInterface = E_NOINTERFACE
End If
End Function

Private Function IEnumString_AddRef(ByRef This As VTableIEnumStringDataStruct) As Long
This.RefCount = This.RefCount + 1
IEnumString_AddRef = This.RefCount
End Function

Private Function IEnumString_Release(ByRef This As VTableIEnumStringDataStruct) As Long
This.RefCount = This.RefCount - 1
IEnumString_Release = This.RefCount
If IEnumString_Release = 0 Then
    Set This.Enumerable = Nothing
    AutoCompleteGuids.[_CoTaskMemFree] VarPtr(This)
End If
End Function

Private Function IEnumString_Next(ByRef This As VTableIEnumStringDataStruct, ByVal cElt As Long, ByVal rgElt As LongPtr, ByVal lpcEltFetched As LongPtr) As Long
This.Enumerable.Next IEnumString_Next, cElt, rgElt, lpcEltFetched
End Function

Private Function IEnumString_Skip(ByRef This As VTableIEnumStringDataStruct, ByVal cElt As Long) As Long
This.Enumerable.Skip IEnumString_Skip, cElt
End Function

Private Function IEnumString_Reset(ByRef This As VTableIEnumStringDataStruct) As Long
This.Enumerable.Reset IEnumString_Reset
End Function

Private Function IEnumString_Clone(ByRef This As VTableIEnumStringDataStruct, ByRef ppEnum As AutoCompleteGuids.IEnumString) As Long
IEnumString_Clone = E_NOTIMPL
End Function

Public Function CreateIAutoComplete2() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_IAutoComplete), CLSID
CLSIDFromString StrPtr(IID_IAutoComplete2), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIAutoComplete2
End Function

Public Function CreateIAutoCompleteDropDown() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_IAutoCompleteDropDown), CLSID
CLSIDFromString StrPtr(IID_IUnknown), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIAutoCompleteDropDown
End Function

Public Function CreateIACList2() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_IACList2), CLSID
CLSIDFromString StrPtr(IID_IUnknown), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIACList2
End Function

Public Function CreateIACLHistory() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_ACLHistory), CLSID
CLSIDFromString StrPtr(IID_IUnknown), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIACLHistory
End Function

Public Function CreateIACListISF() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_ACListISF), CLSID
CLSIDFromString StrPtr(IID_IUnknown), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIACListISF
End Function

Public Function CreateIACLMRU() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_ACLMRU), CLSID
CLSIDFromString StrPtr(IID_IUnknown), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIACLMRU
End Function

Public Function CreateIObjMgr() As IUnknown
Dim CLSID As AutoCompleteGuids.[_AC_GUID], IID As AutoCompleteGuids.[_AC_GUID]
On Error Resume Next
CLSIDFromString StrPtr(CLSID_ACLMulti), CLSID
CLSIDFromString StrPtr(IID_IObjMgr), IID
CoCreateInstance CLSID, NULL_PTR, CLSCTX_INPROC_SERVER, IID, CreateIObjMgr
End Function

Private Function ProcPtr(ByVal Address As LongPtr) As LongPtr
ProcPtr = Address
End Function
