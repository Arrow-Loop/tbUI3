# Console Core

**Author**: woeoio
**Email**: 215879458@qq.com
**Website**: https://vb6.pro

The core kernel module provides the foundational features for the Modern Console Library, including console management, screen buffer handling, API wrappers, types, delegates, and styling utilities.

## Directory Structure

```
Core/
├── cConsole.twin           # Main console class
├── cConsoleBuffer.twin     # Screen buffer for double buffering
├── mConsoleAPI.twin        # Windows console API declarations
├── mConsoleDelegates.twin  # Event delegates
├── mConsoleStyle.twin      # ANSI/VT100 escape sequences
└── mConsoleTypes.twin      # Type definitions
```

## Core Components

### 1. cConsole - Main Console Class

The main console class provides comprehensive console control with features for input/output, colors, cursor, screen, and event handling.

#### Basic Usage

```vb
Dim console As New cConsole

' UTF-8 support
console.EnableUTF8()

' Color output
console.ForeColor = ConsoleColor.Green
console.WriteLine "Success!"
console.WriteLineColored "Warning!", ConsoleColor.Yellow, ConsoleColor.Black

' Input
Dim input As String
input = console.ReadLine("Enter name: ")
Dim key As ConsoleKeyInfo
key = console.ReadKey(True)  ' True = don't echo key
```

#### Full-Screen Mode

```vb
console.EnterFullScreenMode

' Use buffer for drawing
console.Buffer.WriteAt 10, 5, "Hello", ConsoleColor.Cyan
console.Buffer.DrawBox 5, 3, 20, 10, ConsoleColor.White

' Refresh to screen
console.Refresh

' Exit full-screen mode
console.ExitFullScreenMode
```

#### Event Handling

```vb
' Resize event handler
console.OnResize = Sub(newWidth As Long, newHeight As Long)
    console.Buffer.Resize newWidth, newHeight
    console.RefreshAll
End Sub

' Key press handler
console.OnKeyPress = Sub(ByRef keyInfo As ConsoleKeyInfo, ByRef handled As Boolean)
    If keyInfo.KeyCode = 27 Then  ' ESC
        handled = True
        console.ExitFullScreenMode
    End If
End Sub

' Process events in main loop
Do
    console.ProcessEvents
    ' Your render logic here
    console.Refresh
    console.Sleep 16  ' ~60 FPS
Loop While console.FullScreenMode
```

### 2. cConsoleBuffer - Screen Buffer

The buffer class provides double-buffering support for smooth full-screen rendering.

```vb
' Create buffer
Dim buffer As New cConsoleBuffer(80, 25)

' Clear buffer
buffer.Clear ConsoleColor.Gray, ConsoleColor.Black

' Draw operations
buffer.SetChar 10, 10, "X", ConsoleColor.Red
buffer.WriteAt 5, 5, "Hello", ConsoleColor.Cyan
buffer.DrawBox 2, 2, 20, 8, ConsoleColor.White

' Fill rectangle
buffer.FillRect 5, 5, 15, 10, " ", ConsoleColor.DarkBlue, ConsoleColor.Gray

' Copy region
buffer.CopyRegion 0, 0, 10, 10, 20, 5

' Scroll region
buffer.ScrollRegion 5, 5, 20, 15, 1, 0  ' Scroll down by 1 row

' Flush to console
buffer.Flush hOutput
```

#### Batch Updates

```vb
' Begin batch update
buffer.BeginBatchUpdate

' Many operations without dirty rect tracking
For i = 0 To 1000
    buffer.SetChar x(i), y(i), "█", ConsoleColor.Green
Next i

' End batch and mark all as dirty
buffer.EndBatchUpdate

buffer.Flush hOutput
```

### 3. mConsoleAPI - API Declarations

Low-level Windows console API declarations. You rarely need to use these directly.

```vb
' Get console handles
Dim hStdOut As LongPtr
hStdOut = mConsoleAPI.GetStdHandle(mConsoleAPI.STD_OUTPUT_HANDLE)

' Console mode
Dim mode As Long
mConsoleAPI.GetConsoleMode hStdOut, mode
mode = mode Or mConsoleAPI.ENABLE_VIRTUAL_TERMINAL_PROCESSING
mConsoleAPI.SetConsoleMode hStdOut, mode

' Helper functions
Dim attr As Integer
attr = mConsoleAPI.ColorAttribute(ConsoleColor.Green, ConsoleColor.Black)

Dim coord As Long
coord = mConsoleAPI.MakeCOORD(10, 5)
```

### 4. mConsoleDelegates - Event Delegates

Delegate types for event handling.

```vb
' Resize handler delegate
Public Delegate Sub ConsoleResizeHandler(ByVal newWidth As Long, ByVal newHeight As Long)

' Key handler delegate
Public Delegate Sub ConsoleKeyHandler(ByRef keyInfo As ConsoleKeyInfo, ByRef handled As Boolean)

' Mouse handler delegate
Public Delegate Sub ConsoleMouseHandler(ByRef mouseInfo As ConsoleMouseInfo, ByRef handled As Boolean)

' Control event handler (Ctrl+C, etc.)
Public Delegate Function ConsoleCtrlHandler(ByVal ctrlType As Long) As Long
```

### 5. mConsoleStyle - ANSI/VT100 Styling

Provides ANSI escape sequences for advanced styling and formatting.

```vb
' Cursor movement
console.WriteTo mConsoleStyle.CursorUp(3)
console.WriteTo mConsoleStyle.CursorPosition(10, 5)
console.WriteTo mConsoleStyle.CursorHide

' Text styling
console.WriteTo mConsoleStyle.Bold & "Bold Text" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.Underline & "Underlined" & mConsoleStyle.Reset

' Colors
console.WriteTo mConsoleStyle.FgRed & "Red" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.BgBlue & "Blue Background" & mConsoleStyle.Reset

' 256 color palette
console.WriteTo mConsoleStyle.Fg256(128) & "Custom Color" & mConsoleStyle.Reset

' RGB colors
console.WriteTo mConsoleStyle.FgRGB(255, 128, 0) & "Orange" & mConsoleStyle.Reset

' Screen clearing
console.WriteTo mConsoleStyle.ClearScreen(2)  ' Clear entire screen
console.WriteTo mConsoleStyle.ClearLine(2)   ' Clear entire line

' Box drawing characters
console.WriteTo mConsoleStyle.BOX_TOP_LEFT & mConsoleStyle.BOX_HORIZONTAL & mConsoleStyle.BOX_TOP_RIGHT
console.WriteTo mConsoleStyle.BLOCK_FULL  ' █
console.WriteTo mConsoleStyle.ARROW_UP    ' ↑
```

#### Styled Text Helpers

```vb
' Create styled text
Dim colored As String
colored = mConsoleStyle.Colored("Hello", mConsoleStyle.FgRed, mConsoleStyle.BgWhite)
console.WriteTo colored

' RGB colored text
Dim rgbText As String
rgbText = mConsoleStyle.ColoredRGB("RGB", 255, 128, 0, 0, 0, 0)

' Text formatting utilities
Dim centered As String
centered = mConsoleStyle.CenterText("Title", 40)

Dim truncated As String
truncated = mConsoleStyle.Truncate("Long text here...", 10)

Dim wrapped As String
wrapped = mConsoleStyle.WordWrap("This is a long text that needs wrapping", 30)
```

### 6. mConsoleTypes - Type Definitions

Core type definitions including colors, keys, and structures.

```vb
' Colors
Dim color As ConsoleColor
color = ConsoleColor.Green
color = ConsoleColor.DarkBlue

' Text styles
Dim style As ConsoleTextStyle
style = ConsoleTextStyle.StyleBold Or ConsoleTextStyle.StyleUnderline

' Console keys
Dim key As ConsoleKey
key = ConsoleKey.KeyEnter
key = ConsoleKey.KeyEscape

' Structures
Dim pos As ConsolePosition
pos.Col = 10
pos.Row = 5

Dim size As ConsoleSize
size.Width = 80
size.Height = 25

Dim rect As ConsoleRect
rect.Left = 5
rect.Top = 3
rect.Right = 25
rect.Bottom = 15

' Key info
Dim keyInfo As ConsoleKeyInfo
keyInfo.KeyCode = 13
keyInfo.KeyChar = Chr$(13)
keyInfo.IsCtrlPressed = True

' Rect helpers
rect = ConsoleRect_Create(5, 3, 25, 15)
If ConsoleRect_Contains(rect, 10, 10) Then
    Debug.Print "Point inside rect"
End If

Dim width As Long
width = ConsoleRect_Width(rect)
```

## Advanced Features

### Double Buffering

The core supports double-buffering for flicker-free animations:

```vb
console.EnterFullScreenMode

' Draw to buffer
console.Buffer.Clear
console.Buffer.WriteAt 10, 5, "Animated text", ConsoleColor.Cyan

' Refresh to screen
console.Refresh
```

### Performance Optimization

```vb
' Batch updates for better performance
console.Buffer.BeginBatchUpdate
For i = 0 To 100
    console.Buffer.SetChar x(i), y(i), "█", color
Next i
console.Buffer.EndBatchUpdate
console.Buffer.Flush hOutput

' Partial refresh only changed regions
If console.Buffer.IsDirty Then
    Dim dirtyRect As ConsoleRect = console.Buffer.GetDirtyRect
    console.Buffer.FlushRegion hOutput, dirtyRect.Left, dirtyRect.Top, dirtyRect.Right, dirtyRect.Bottom
End If
```

### UTF-8 Support

```vb
' Enable UTF-8 for international characters
console.EnableUTF8

' Write Unicode characters
console.WriteTo "中文测试"
console.WriteTo "日本語"
console.WriteTo "한국어"
console.WriteTo "🎉"
```

### Virtual Terminal Sequences

```vb
' Enable VT100/ANSI escape sequences
console.EnableVirtualTerminal

' Use advanced styling
console.WriteTo mConsoleStyle.FgRGB(255, 128, 0) & "Custom Color" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.Bold & mConsoleStyle.Italic & "Styled" & mConsoleStyle.Reset
```

## Best Practices

1. **Always clean up**: Call `console.ExitFullScreenMode()` or use `console.Restore()` before program exit
2. **Use batch updates**: Wrap multiple draw operations in `BeginBatchUpdate`/`EndBatchUpdate` for better performance
3. **Handle events**: Implement resize handlers to handle window size changes
4. **Use buffer**: In full-screen mode, always draw to the buffer and call `Refresh()` to flush
5. **Hide cursor**: The cursor is automatically hidden in full-screen mode
6. **Validate input**: Always check bounds before writing to buffer positions
7. **Restore state**: The `Restore()` method restores original console state

## API Reference

### cConsole Properties

| Property | Type | Description |
|----------|------|-------------|
| Width | Long | Console width |
| Height | Long | Console height |
| ForeColor | ConsoleColor | Current foreground color |
| BackColor | ConsoleColor | Current background color |
| CursorVisible | Boolean | Cursor visibility |
| CursorSize | Long | Cursor size (1-100) |
| Title | String | Console window title |
| FullScreenMode | Boolean | Full-screen mode status |
| Buffer | cConsoleBuffer | Screen buffer (full-screen mode) |
| FPS | Double | Estimated frames per second |
| LastRenderTime | Long | Last render time in ms |

### cConsole Key Methods

| Method | Description |
|--------|-------------|
| WriteTo / WriteLine | Write text |
| ReadLine / ReadKey | Read input |
| Clear / ClearLine | Clear screen/line |
| GetCursorPosition / SetCursorPosition | Cursor control |
| GetSize / GetBufferSize | Get dimensions |
| EnterFullScreenMode / ExitFullScreenMode | Full-screen control |
| Refresh / RefreshAll | Update display |
| ProcessEvents | Handle pending events |

### cConsoleBuffer Key Methods

| Method | Description |
|--------|-------------|
| Clear | Clear entire buffer |
| SetChar / GetChar | Character operations |
| WriteAt | Write text at position |
| FillRect | Fill rectangle area |
| DrawBox / DrawHLine / DrawVLine | Drawing primitives |
| Flush / FlushRegion | Write to console |
| BeginBatchUpdate / EndBatchUpdate | Batch operations |
| CopyRegion / ScrollRegion | Region operations |

## License

This core library is part of Modern Console Library.
