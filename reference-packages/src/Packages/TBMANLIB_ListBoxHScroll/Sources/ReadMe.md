# cListboxHScroll - ListBox Horizontal Scrollbar Component

Add full horizontal scrollbar support for Twinbasic ListBox controls.

`Author: woeoio@qq.com`

## Features

- Automatically calculates the maximum width of all text items in the ListBox
- Displays and manages the horizontal scrollbar
- Supports all scroll operations (line scroll, page scroll, drag thumb, etc.)
- Automatically adapts to font changes
- Smooth scrolling through window subclassing

## Basic Usage

```vb
Class Form1

    Sub New()
    End Sub

    Dim L1 As New cListboxHScroll

    Private Sub Form_Load()
        ' Add some long text test items
        For i As Long = 0 To 20
            List1.AddItem("This is a very long test text to verify that the horizontal scrollbar works correctly - Item " & i)
        Next

        ' Show horizontal scrollbar
        L1.Show(List1)
    End Sub

    Private Sub Form_Terminate()
        ' Remove subclassing
        L1.UnShow()
    End Sub

End Class
```

## API Reference

### Methods

#### `Show(ByRef ListBoxInst As Object)`
Enables horizontal scrollbar functionality for the specified ListBox control.

- **Parameter**: `ListBoxInst` - ListBox control instance

#### `UnShow()`
Removes horizontal scrollbar functionality and cleans up subclassing.

## How It Works

1. **Initialization Phase** (`Show` method):
   - Shows the horizontal scrollbar
   - Iterates through all list items and uses GDI functions to calculate maximum text width
   - Sets `LB_SETHORIZONTALEXTENT` message to define horizontal scroll range
   - Installs subclass window procedure to handle scroll messages

2. **Scroll Handling** (`ListBoxSubclassProc`):
   - Intercepts `WM_HSCROLL` messages
   - Handles various scroll operation types:
     - `SB_LINELEFT/SB_LINERIGHT`: Fine adjustment left/right (20 pixels)
     - `SB_PAGELEFT/SB_PAGERIGHT`: Page left/right
     - `SB_THUMBTRACK/SB_THUMBPOSITION`: Drag thumb
     - `SB_LEFT/SB_RIGHT`: Jump to start/end
   - Calls default handler to perform actual scrolling

3. **Cleanup Phase** (`UnShow` method):
   - Removes subclass window procedure
   - Releases related resources

## Dependencies

Requires Windows API support:
- `user32.dll`: SendMessage, GetDC, ReleaseDC, ScrollBar related functions
- `gdi32.dll`: GetTextExtentPoint32, SelectObject
- `comctl32.dll`: SetWindowSubclass, RemoveWindowSubclass, DefSubclassProc

## Notes

- Must call `UnShow()` method to remove subclassing after use
- Automatic cleanup when window is destroyed (via `WM_DESTROY` message)
- Windows platform only
- Control must have a valid `hWnd` property
