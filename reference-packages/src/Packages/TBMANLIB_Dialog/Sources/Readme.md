# cDialog - Windows API Dialog Object Class

## Overview

`cDialog` is a Windows API-based VB/VBA dialog object class that provides encapsulation for commonly used dialog functions such as file open/save dialogs and folder selection dialogs.

**Author**: (woeoio) 215879458@qq.com
**Version**: v1.1.0.0

## Main Features

- ✅ **Open File Dialog** (`ShowOpen`)
- ✅ **Save File Dialog** (`ShowSave`)
- ✅ **Folder Selection Dialog** (`ShowBrowseForFolder`)
- ✅ **File Extension Filtering**
- ✅ **Multiple File Selection Support**
- ✅ **Common Filter Presets** (Images, Documents, Code, etc.)
- ✅ **File Path Processing Utility Methods**
- ✅ **File Opening Functionality** (`OpenFile`, `SelectAndOpenFile`)

## Properties

### Basic Properties

| Property      | Type   | Description            | Default Value |
| ------------- | ------ | ---------------------- | ------------- |
| `DialogTitle` | String | Dialog title           | `""`          |
| `InitialDir`  | String | Initial directory      | `""`          |
| `DefaultExt`  | String | Default file extension | `""`          |
| `FileName`    | String | Default filename       | `""`          |
| `Filter`      | String | File filter            | `""`          |

### Behavior Properties

| Property          | Type    | Description                    | Default Value |
| ----------------- | ------- | ------------------------------ | ------------- |
| `MultiSelect`     | Boolean | Allow multiple file selection  | `False`       |
| `OverwritePrompt` | Boolean | Prompt when overwriting files  | `True`        |
| `PathMustExist`   | Boolean | Path must exist                | `True`        |
| `FileMustExist`   | Boolean | File must exist                | `True`        |
| `HideReadOnly`    | Boolean | Hide read-only checkbox        | `True`        |
| `ReadOnly`        | Boolean | Open in read-only mode         | `False`       |
| `NoChangeDir`     | Boolean | Don't change current directory | `False`       |
| `CreatePrompt`    | Boolean | Prompt when creating files     | `False`       |
| `NewDialogStyle`  | Boolean | Use new dialog style           | `True`        |

## Methods

### Core Methods

#### `ShowOpen()` As Variant

Displays an open file dialog. Returns a single file path (string) or an array of file paths (multi-select mode).

#### `ShowSave()` As String

Displays a save file dialog. Returns the file path selected by the user.

#### `ShowBrowseForFolder()` As String

Displays a folder selection dialog. Returns the folder path selected by the user.

#### `SelectFiles()` As Collection

Displays an open file dialog and returns a `Collection` object, providing a unified interface for both single and multiple file selection.

**Features:**

- Returns a `Collection` object for both single and multi-select modes
- Use `Collection.Count` to check if any files were selected
- Use `For Each` to iterate through all selected files
- Returns an empty collection (Count = 0) when no files are selected

### Filter Methods

#### `AddFilter(strDescription, strExtension)`

Adds a file filter.

- `strDescription`: Filter description, e.g., `"Text Files (*.txt)"`
- `strExtension`: Extension pattern, e.g., `"*.txt"`

#### `ClearFilter()`

Clears all filters.

#### `SetCommonFilters()`

Sets common file filters (text files, all files).

#### `SetImageFilters()`

Sets image file filters (BMP, JPEG, PNG, GIF).

#### `SetDocumentFilters()`

Sets document file filters (Word, Excel, PowerPoint, PDF, text).

#### `SetCodeFilters()`

Sets code file filters (Basic, C/C++, C#, Java, Python, JavaScript, HTML, XML).

### File Operation Methods

#### `OpenFile(strFilePath, [strOperation])` As Long

Opens a specified file using the system default program.

- `strFilePath`: File path
- `strOperation`: Operation type, default is `"open"`

#### `SelectAndOpenFile()` As Long

Displays a file selection dialog and opens the selected file(s).

#### `Reset()`

Resets all properties to default values.

### Path Processing Methods

#### `GetFilePath(strFullPath)` As String

Extracts the file path from a full path (without filename).

#### `GetFileName(strFullPath)` As String

Extracts the filename from a full path (without path).

#### `GetFileExtension(strFullPath)` As String

Extracts the file extension from a full path (including the dot).

#### `GetFileNameWithoutExt(strFullPath)` As String

Extracts the filename from a full path (without extension).

#### `PathCombine(strPath1, strPath2)` As String

Intelligently combines two path segments, automatically handling backslash separators. Edge cases like empty paths, absolute paths, and duplicate slashes are all handled.

- `strPath1`: Base path
- `strPath2`: Sub-path to append
- If `strPath2` is an absolute path (e.g., `D:\abc`), returns `strPath2` directly

```vb
dlg.PathCombine("C:\Users", "test.txt")     ' → "C:\Users\test.txt"
dlg.PathCombine("C:\Users\", "\test.txt")   ' → "C:\Users\test.txt"
dlg.PathCombine("", "test.txt")             ' → "test.txt"
dlg.PathCombine("C:", "D:\abc")             ' → "D:\abc"
```

## Usage Examples

### Example 1: Basic Open File Dialog

```vb
Sub BasicOpenFileDialog()
    Dim dlg As New cDialog

    ' Set dialog title
    dlg.DialogTitle = "Select a file"

    ' Set initial directory
    dlg.InitialDir = "C:\Users\Public\Documents"

    ' Set default file extension
    dlg.DefaultExt = "txt"

    ' Show dialog
    Dim strFile As String
    strFile = dlg.ShowOpen()

    If strFile <> "" Then
        MsgBox "You selected: " & strFile
    Else
        MsgBox "You cancelled the selection"
    End If
End Sub
```

### Example 2: Open File with Filters

```vb
Sub OpenFileWithFilter()
    Dim dlg As New cDialog

    ' Add filters
    dlg.AddFilter "Text Files (*.txt)", "*.txt"
    dlg.AddFilter "Word Documents (*.doc;*.docx)", "*.doc;*.docx"
    dlg.AddFilter "All Files (*.*)", "*.*"

    ' Set dialog title
    dlg.DialogTitle = "Select a file to open"

    ' Show dialog
    Dim strFile As String
    strFile = dlg.ShowOpen()

    If strFile <> "" Then
        MsgBox "Selected file: " & strFile & vbCrLf & _
               "Filename: " & dlg.GetFileName(strFile) & vbCrLf & _
               "Extension: " & dlg.GetFileExtension(strFile)
    End If
End Sub
```

### Example 3: Multiple File Selection

```vb
Sub OpenMultipleFiles()
    Dim dlg As New cDialog

    ' Enable multi-select
    dlg.MultiSelect = True

    ' Add filters
    dlg.AddFilter "Image Files (*.bmp;*.jpg;*.png)", "*.bmp;*.jpg;*.png"
    dlg.AddFilter "All Files (*.*)", "*.*"

    ' Set dialog title
    dlg.DialogTitle = "Select multiple image files"

    ' Show dialog
    Dim varFiles As Variant
    varFiles = dlg.ShowOpen()

    If IsArray(varFiles) Then
        Dim i As Long
        Dim strMsg As String

        strMsg = "You selected " & UBound(varFiles) - LBound(varFiles) + 1 & " files:" & vbCrLf & vbCrLf
        For i = LBound(varFiles) To UBound(varFiles)
            strMsg = strMsg & (i + 1) & ". " & varFiles(i) & vbCrLf
        Next i

        MsgBox strMsg
    ElseIf varFiles <> "" Then
        MsgBox "You selected: " & varFiles
    Else
        MsgBox "You cancelled the selection"
    End If
End Sub
```

### Example 4: Using Preset Filters

```vb
Sub UsePresetFilters()
    Dim dlg As New cDialog

    ' Use preset image filters
    dlg.SetImageFilters
    dlg.DialogTitle = "Select an image file"
    Dim strImage As String
    strImage = dlg.ShowOpen()

    ' Reset and use document filters
    dlg.Reset
    dlg.SetDocumentFilters
    dlg.DialogTitle = "Select a document file"
    Dim strDoc As String
    strDoc = dlg.ShowOpen()

    ' Reset and use code filters
    dlg.Reset
    dlg.SetCodeFilters
    dlg.DialogTitle = "Select a code file"
    Dim strCode As String
    strCode = dlg.ShowOpen()
End Sub
```

### Example 5: Save File Dialog

```vb
Sub SaveFileDialog()
    Dim dlg As New cDialog

    ' Set dialog title
    dlg.DialogTitle = "Save File"

    ' Set initial directory and default filename
    dlg.InitialDir = "C:\Users\Public\Documents"
    dlg.FileName = "New Document"

    ' Set default extension
    dlg.DefaultExt = "txt"

    ' Add filters
    dlg.AddFilter "Text Files (*.txt)", "*.txt"
    dlg.AddFilter "All Files (*.*)", "*.*"

    ' Disable overwrite prompt (optional)
    dlg.OverwritePrompt = False

    ' Show dialog
    Dim strFile As String
    strFile = dlg.ShowSave()

    If strFile <> "" Then
        MsgBox "Save to: " & strFile
        ' Add code to save the file here
    End If
End Sub
```

### Example 6: Folder Selection Dialog

```vb
Sub BrowseForFolderDialog()
    Dim dlg As New cDialog

    ' Set dialog title
    dlg.DialogTitle = "Select a folder"

    ' Show dialog
    Dim strFolder As String
    strFolder = dlg.ShowBrowseForFolder()

    If strFolder <> "" Then
        MsgBox "You selected folder: " & strFolder
    End If
End Sub
```

### Example 7: Select and Open File

```vb
Sub SelectAndOpenFileExample()
    Dim dlg As New cDialog

    ' Set filters
    dlg.AddFilter "Text Files (*.txt)", "*.txt"
    dlg.AddFilter "All Files (*.*)", "*.*"

    ' Select and open file
    Dim lngResult As Long
    lngResult = dlg.SelectAndOpenFile()

    If lngResult > 0 Then
        MsgBox "File opened"
    Else
        MsgBox "You cancelled or failed to open the file"
    End If
End Sub
```

### Example 8: Open Specific File Directly

```vb
Sub OpenSpecificFile()
    Dim dlg As New cDialog
    Dim strFile As String

    strFile = "C:\Users\Public\Documents\example.txt"

    ' Check if file exists
    If Dir(strFile) <> "" Then
        Dim lngResult As Long
        lngResult = dlg.OpenFile(strFile)

        If lngResult > 32 Then
            MsgBox "File opened successfully"
        Else
            MsgBox "Failed to open file"
        End If
    Else
        MsgBox "File does not exist: " & strFile
    End If
End Sub
```

### Example 9: Path Processing Utilities

```vb
Sub PathProcessingExample()
    Dim dlg As New cDialog
    Dim strFullPath As String

    strFullPath = "C:\Users\Public\Documents\Report.xlsx"

    Debug.Print "Full path: " & strFullPath
    Debug.Print "Folder path: " & dlg.GetFilePath(strFullPath)
    Debug.Print "Filename: " & dlg.GetFileName(strFullPath)
    Debug.Print "Filename (no extension): " & dlg.GetFileNameWithoutExt(strFullPath)
    Debug.Print "Extension: " & dlg.GetFileExtension(strFullPath)

    ' Output:
    ' Full path: C:\Users\Public\Documents\Report.xlsx
    ' Folder path: C:\Users\Public\Documents
    ' Filename: Report.xlsx
    ' Filename (no extension): Report
    ' Extension: .xlsx
End Sub
```

### Example 10: Using SelectFiles for Unified File Selection

```vb
Sub UseSelectFilesCollection()
    Dim dlg As New cDialog
    Dim files As Collection
    Dim file As Variant
    Dim strMsg As String

    ' Configure dialog
    dlg.DialogTitle = "Select files"
    dlg.SetImageFilters
    dlg.MultiSelect = True  ' Can be True or False

    ' Get file collection
    Set files = dlg.SelectFiles()

    ' Check if any files were selected
    If files.Count > 0 Then
        strMsg = "You selected " & files.Count & " file(s):" & vbCrLf & vbCrLf
        For Each file In files
            strMsg = strMsg & "- " & file & vbCrLf
        Next file
        MsgBox strMsg
    Else
        MsgBox "You cancelled the selection"
    End If
End Sub
```

**Notes:**

- Whether `MultiSelect` is `True` or `False`, it always returns a `Collection` object
- Use `files.Count` to check if any files were selected
- Use `For Each` to iterate through files, no need to distinguish between single and multi-select
- Simpler and more unified code

### Example 11: Complete File Processing Workflow

```vb
Sub CompleteFileWorkflow()
    Dim dlg As New cDialog
    Dim strFile As String
    Dim strContent As String
    Dim fso As Object
    Dim ts As Object

    ' Step 1: Select file
    dlg.SetCommonFilters
    dlg.DialogTitle = "Select a text file to read"
    strFile = dlg.ShowOpen()

    If strFile = "" Then
        MsgBox "You cancelled the selection"
        Exit Sub
    End If

    ' Step 2: Read file content
    Set fso = CreateObject("Scripting.FileSystemObject")
    If fso.FileExists(strFile) Then
        Set ts = fso.OpenTextFile(strFile, 1) ' 1 = ForReading
        strContent = ts.ReadAll
        ts.Close

        MsgBox "File content: " & vbCrLf & vbCrLf & strContent
    End If

    ' Step 3: Modify content and prepare for save
    strContent = strContent & vbCrLf & vbCrLf & "--- Edited at " & Now() & " ---"

    ' Step 4: Select save location
    dlg.Reset
    dlg.DialogTitle = "Save modified file"
    dlg.FileName = dlg.GetFileNameWithoutExt(strFile) & "_modified"
    dlg.DefaultExt = "txt"

    Dim strSavePath As String
    strSavePath = dlg.ShowSave()

    If strSavePath <> "" Then
        Set ts = fso.CreateTextFile(strSavePath, True) ' True = overwrite
        ts.Write strContent
        ts.Close

        MsgBox "File saved to: " & strSavePath
    End If
End Sub
```

## Notes

1. **Buffer Size**: A 32KB buffer is allocated in multi-select mode, sufficient for handling selection of a large number of files.

2. **Return Value Types**:
   - `ShowOpen()` returns `Variant`, which can be a string (single select) or an array (multi-select)
   - Check return value type using `IsArray()` or `VarType()` before use

3. **File Existence**: When `FileMustExist = True` is set, users can only select existing files.

4. **Path Processing**: All path processing methods use backslash `\` as the path separator.

5. **Multiple File Selection**: When `MultiSelect` is enabled, the return value is an array where the first element is the path and subsequent elements are filenames.

## Technical Details

This class uses the following Windows APIs:

- `GetOpenFileNameW` / `GetSaveFileNameW` - File dialogs
- `SHBrowseForFolder` - Folder selection dialog
- `SHGetPathFromIDList` - Path conversion
- `ShellExecute` - File opening

Supported Windows versions: Windows XP and later
---

## More Dialog Classes

This library also provides the following enhanced dialog classes for additional scenarios:

### cDialogEx - Extended File Dialog

An extended file dialog class based on the modern IFileOpenDialog/IFileSaveDialog interfaces (Vista+), providing a more modern file selection experience.

**Source file:** `cDialogEx.twin`

**Key features:**
- Vista+ modern file dialog UI
- Folder selection (split-pane dialog)
- Compatible with legacy cDialog property interface
- Custom icon support (`SetCustomIcon`, `SetSystemIcon`, `ClearIcon`)
- System icon enumeration (`SystemIconId`: Document, Folder, DriveFixed, etc.)
- Built-in filter presets (`GetPresetFilter`: all/text/images/documents/executables)
- Multi-select returns String array or `SelectFiles()` returns Collection

---

### cColorDialog - Color Selection Dialog

Provides the Windows standard color selection dialog.

**Key features:**
- Standard color picker
- Independent RGB component access (Red, Green, Blue properties)
- HTML color format conversion (`ToHtmlColor`, `FromHtmlColor`)
- Custom 16-color palette support
- Full-open mode (shows complete color panel)

---

### cFontDialog - Font Selection Dialog

Provides the Windows standard font selection dialog.

**Key features:**
- Font name, size, and style selection
- Bold, italic, underline, strikethrough effects
- Font color selection
- Font size range limits (MinSize, MaxSize)
- Monospace font filter option
- CSS font style output (`ToCssFont`)
- Font description output (`ToDescription`)

---

### cPrintDialog - Print Dialog

Provides the Windows standard print dialog.

**Key features:**
- Print range selection (All/Selection/Page range)
- Print copies setting
- Collate support
- Print to file option
- Printer device context access (hDC property)
- Print settings description output

---

### cPageSetupDialog - Page Setup Dialog

Provides the Windows standard page setup dialog.

**Key features:**
- Paper size setting
- Margin settings
- Paper orientation (Portrait/Landscape)
- Preset paper sizes (Letter, A4, Legal)
- Preset margins (Default, Narrow)
- Metric/Imperial unit switching
- Printable area calculation

---

### cFindReplaceDialog - Find and Replace Dialog

Provides the Windows standard Find/Replace dialog (modeless).

**Key features:**
- Modeless dialog design
- Find/Replace mode switching
- Case-sensitive option
- Whole word match option
- Search direction selection
- Replace/Replace All functionality
- Registered message notification (`MessageId` property)

---

### cPasswordDialog - Password Input Dialog

Provides a secure password input dialog with strength detection and complexity validation.

**Key features:**
- Real-time password strength detection (VeryWeak to VeryStrong, 5 levels)
- Custom password mask character (`PasswordChar` property, default `*`, can be set to `#`, `●`, etc.)
- Input masking via SetTimer hack (no plain-text display)
- Password complexity requirement validation
  - Minimum/Maximum length limits
  - Uppercase letter requirement
  - Lowercase letter requirement
  - Digit requirement
  - Special character requirement
- Password confirmation mode
- Password change mode (`ShowChangeDialog`)
- Maximum attempt limits
- Password requirements description output

---

### cCountdownMsgBox - Countdown Message Box

Provides a message box with a countdown timer and auto-close support.

**Key features:**
- Auto-close function (configurable countdown seconds)
- All standard MsgBox button styles
  - OK / OKCancel / YesNo / YesNoCancel etc.
- All standard icon styles
  - Information / Warning / Error / Question
- Timeout detection (`IsTimedOut` method)
- Result description output
- Convenience methods: `ShowInfo`, `ShowWarning`, `ShowError`, `ShowQuestion`, `ShowConfirm`

---

### cInputBox - Enhanced Input Dialog

Provides an enhanced input dialog with multiple validation modes.

**Key features:**
- Multiple input validation modes
  - None / Numeric / Integer / Alpha / AlphaNumeric
  - Email / Phone / URL / Custom
- Input length limits (minimum/maximum)
- Placeholder prompt
- Empty value control
- Cancel status detection
- Convenience methods: `ShowSimple`, `ShowNumeric`, `ShowEmail`, `ShowURL`, `ShowPhone`
- Numeric conversion: `GetValueAsNumber`, `GetValueAsInteger`

---

### cProgressDialog - Progress Dialog

Provides a progress bar dialog with time estimation and cancel support.

**Key features:**
- Standard progress bar mode (0-100 or custom range)
- Step-based progress updates
- Elapsed time display
- Remaining time estimation
- Progress description output
- Cancel operation support
- Progress change event

---

### cDateTimeDialog - Date-Time Selection Dialog

Provides a date-time selection dialog.

**Key features:**
- Three modes: Date, Time, DateTime
- Date formatted output
  - Short format (MM/DD/YYYY)
  - Long format (Monday, January 01, 2026)
  - Custom format
- Time formatted output (24-hour / 12-hour)
- Seconds display control
- Year range limits
- Date calculations (`AddDays`, `AddHours`)
- Day-of-week name (`GetDayOfWeekName`)
- Month name (`GetMonthName`)
- Automatic leap year handling
- Automatic month day count calculation

---

## mDialog Public Module

Provides shared type definitions and utility functions.

**Type definitions:**
- `COMDLG_FILTERSPEC` - Filter specification structure
- `RECT` - Rectangle structure
- `POINT` - Point structure

**Constants:**
- Paper size constants (Letter, Legal, A4, A3)
- Unit conversion constants

**Utility functions:**
- `InchesToMM` / `MMToInches` - Inches/Millimeters conversion
- `InchesToPoints` / `PointsToInches` - Inches/Points conversion
- `TwipsToInches` / `InchesToTwips` - Twips/Inches conversion
- `RGBToHtml` / `HtmlToRGB` - RGB/HTML color conversion

## Version History

- **v1.1.0.0** - Added 10 extended dialog classes (cDialogEx, cColorDialog, cFontDialog, cPrintDialog, cPageSetupDialog, cFindReplaceDialog, cPasswordDialog, cCountdownMsgBox, cInputBox, cProgressDialog, cDateTimeDialog) and mDialog shared module; fixed cDialogEx compilation errors (Set keyword, CLSID, IShellItemArray vtable); added custom icon support and test cases
- **v1.0.3.0** - Fixed bug where `ShowOpen()` only returned one file in multi-select mode (original code truncated at first null character, destroying multi-select results; now correctly parses the null-delimited buffer)
- **v1.0.2.0** - Added `SelectFiles()` method that returns a `Collection` object, providing unified handling for both single and multiple file selection scenarios
- **v1.0** - Initial version, supports basic file open/save and folder selection features

## License

Please add appropriate license information based on project requirements.

---

**Need Help?** Contact author: 215879458@qq.com