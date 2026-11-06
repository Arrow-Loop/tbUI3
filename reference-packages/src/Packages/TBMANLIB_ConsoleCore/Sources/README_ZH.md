# Console Core 核心模块

**作者**: 邓伟
**联系**: 215879458@qq.com
**网站**: https://vb6.pro

Core 核心模块是 Modern Console Library 的基础，提供控制台管理、屏幕缓冲区、API 封装、类型定义、委托和样式工具等核心功能。

## 目录结构

```
Core/
├── cConsole.twin           # 主控制台类
├── cConsoleBuffer.twin     # 屏幕缓冲区（双缓冲）
├── mConsoleAPI.twin        # Windows 控制台 API 声明
├── mConsoleDelegates.twin  # 事件委托
├── mConsoleStyle.twin      # ANSI/VT100 转义序列
└── mConsoleTypes.twin      # 类型定义
```

## 核心组件

### 1. cConsole - 主控制台类

主控制台类提供完整的控制台控制功能，包括输入/输出、颜色、光标、屏幕和事件处理。

#### 基本使用

```vb
Dim console As New cConsole

' UTF-8 支持
console.EnableUTF8()

' 彩色输出
console.ForeColor = ConsoleColor.Green
console.WriteLine "成功！"
console.WriteLineColored "警告！", ConsoleColor.Yellow, ConsoleColor.Black

' 输入
Dim input As String
input = console.ReadLine("请输入名字：")
Dim key As ConsoleKeyInfo
key = console.ReadKey(True)  ' True = 不回显按键
```

#### 全屏模式

```vb
console.EnterFullScreenMode

' 使用缓冲区绘制
console.Buffer.WriteAt 10, 5, "你好", ConsoleColor.Cyan
console.Buffer.DrawBox 5, 3, 20, 10, ConsoleColor.White

' 刷新到屏幕
console.Refresh

' 退出全屏模式
console.ExitFullScreenMode
```

#### 事件处理

```vb
' 窗口大小调整事件处理
console.OnResize = Sub(newWidth As Long, newHeight As Long)
    console.Buffer.Resize newWidth, newHeight
    console.RefreshAll
End Sub

' 按键事件处理
console.OnKeyPress = Sub(ByRef keyInfo As ConsoleKeyInfo, ByRef handled As Boolean)
    If keyInfo.KeyCode = 27 Then  ' ESC
        handled = True
        console.ExitFullScreenMode
    End If
End Sub

' 在主循环中处理事件
Do
    console.ProcessEvents
    ' 你的渲染逻辑
    console.Refresh
    console.Sleep 16  ' 约 60 FPS
Loop While console.FullScreenMode
```

### 2. cConsoleBuffer - 屏幕缓冲区

缓冲区类提供双缓冲支持，实现流畅的全屏渲染。

```vb
' 创建缓冲区
Dim buffer As New cConsoleBuffer(80, 25)

' 清空缓冲区
buffer.Clear ConsoleColor.Gray, ConsoleColor.Black

' 绘制操作
buffer.SetChar 10, 10, "X", ConsoleColor.Red
buffer.WriteAt 5, 5, "你好", ConsoleColor.Cyan
buffer.DrawBox 2, 2, 20, 8, ConsoleColor.White

' 填充矩形
buffer.FillRect 5, 5, 15, 10, " ", ConsoleColor.DarkBlue, ConsoleColor.Gray

' 复制区域
buffer.CopyRegion 0, 0, 10, 10, 20, 5

' 滚动区域
buffer.ScrollRegion 5, 5, 20, 15, 1, 0  ' 向下滚动 1 行

' 刷新到控制台
buffer.Flush hOutput
```

#### 批量更新

```vb
' 开始批量更新
buffer.BeginBatchUpdate

' 大量操作，不跟踪脏区域
For i = 0 To 1000
    buffer.SetChar x(i), y(i), "█", ConsoleColor.Green
Next i

' 结束批量更新并标记所有为脏
buffer.EndBatchUpdate

buffer.Flush hOutput
```

### 3. mConsoleAPI - API 声明

底层 Windows 控制台 API 声明。通常不需要直接使用。

```vb
' 获取控制台句柄
Dim hStdOut As LongPtr
hStdOut = mConsoleAPI.GetStdHandle(mConsoleAPI.STD_OUTPUT_HANDLE)

' 控制台模式
Dim mode As Long
mConsoleAPI.GetConsoleMode hStdOut, mode
mode = mode Or mConsoleAPI.ENABLE_VIRTUAL_TERMINAL_PROCESSING
mConsoleAPI.SetConsoleMode hStdOut, mode

' 辅助函数
Dim attr As Integer
attr = mConsoleAPI.ColorAttribute(ConsoleColor.Green, ConsoleColor.Black)

Dim coord As Long
coord = mConsoleAPI.MakeCOORD(10, 5)
```

### 4. mConsoleDelegates - 事件委托

事件处理的委托类型。

```vb
' 窗口大小调整处理器委托
Public Delegate Sub ConsoleResizeHandler(ByVal newWidth As Long, ByVal newHeight As Long)

' 按键处理器委托
Public Delegate Sub ConsoleKeyHandler(ByRef keyInfo As ConsoleKeyInfo, ByRef handled As Boolean)

' 鼠标处理器委托
Public Delegate Sub ConsoleMouseHandler(ByRef mouseInfo As ConsoleMouseInfo, ByRef handled As Boolean)

' 控制事件处理器（Ctrl+C 等）
Public Delegate Function ConsoleCtrlHandler(ByVal ctrlType As Long) As Long
```

### 5. mConsoleStyle - ANSI/VT100 样式

提供 ANSI 转义序列用于高级样式和格式化。

```vb
' 光标移动
console.WriteTo mConsoleStyle.CursorUp(3)
console.WriteTo mConsoleStyle.CursorPosition(10, 5)
console.WriteTo mConsoleStyle.CursorHide

' 文本样式
console.WriteTo mConsoleStyle.Bold & "粗体文本" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.Underline & "下划线" & mConsoleStyle.Reset

' 颜色
console.WriteTo mConsoleStyle.FgRed & "红色" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.BgBlue & "蓝色背景" & mConsoleStyle.Reset

' 256 色调色板
console.WriteTo mConsoleStyle.Fg256(128) & "自定义颜色" & mConsoleStyle.Reset

' RGB 颜色
console.WriteTo mConsoleStyle.FgRGB(255, 128, 0) & "橙色" & mConsoleStyle.Reset

' 屏幕清除
console.WriteTo mConsoleStyle.ClearScreen(2)  ' 清空整个屏幕
console.WriteTo mConsoleStyle.ClearLine(2)   ' 清空整行

' 盒子绘制字符
console.WriteTo mConsoleStyle.BOX_TOP_LEFT & mConsoleStyle.BOX_HORIZONTAL & mConsoleStyle.BOX_TOP_RIGHT
console.WriteTo mConsoleStyle.BLOCK_FULL  ' █
console.WriteTo mConsoleStyle.ARROW_UP    ' ↑
```

#### 样式化文本辅助工具

```vb
' 创建样式化文本
Dim colored As String
colored = mConsoleStyle.Colored("你好", mConsoleStyle.FgRed, mConsoleStyle.BgWhite)
console.WriteTo colored

' RGB 彩色文本
Dim rgbText As String
rgbText = mConsoleStyle.ColoredRGB("RGB", 255, 128, 0, 0, 0, 0)

' 文本格式化工具
Dim centered As String
centered = mConsoleStyle.CenterText("标题", 40)

Dim truncated As String
truncated = mConsoleStyle.Truncate("这里是很长的文本...", 10)

Dim wrapped As String
wrapped = mConsoleStyle.WordWrap("这是一段需要换行的长文本", 30)
```

### 6. mConsoleTypes - 类型定义

核心类型定义，包括颜色、按键和结构体。

```vb
' 颜色
Dim color As ConsoleColor
color = ConsoleColor.Green
color = ConsoleColor.DarkBlue

' 文本样式
Dim style As ConsoleTextStyle
style = ConsoleTextStyle.StyleBold Or ConsoleTextStyle.StyleUnderline

' 控制台按键
Dim key As ConsoleKey
key = ConsoleKey.KeyEnter
key = ConsoleKey.KeyEscape

' 结构体
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

' 按键信息
Dim keyInfo As ConsoleKeyInfo
keyInfo.KeyCode = 13
keyInfo.KeyChar = Chr$(13)
keyInfo.IsCtrlPressed = True

' 矩形辅助函数
rect = ConsoleRect_Create(5, 3, 25, 15)
If ConsoleRect_Contains(rect, 10, 10) Then
    Debug.Print "点在矩形内"
End If

Dim width As Long
width = ConsoleRect_Width(rect)
```

## 高级特性

### 双缓冲

核心支持双缓冲以实现无闪烁动画：

```vb
console.EnterFullScreenMode

' 绘制到缓冲区
console.Buffer.Clear
console.Buffer.WriteAt 10, 5, "动画文本", ConsoleColor.Cyan

' 刷新到屏幕
console.Refresh
```

### 性能优化

```vb
' 批量更新以获得更好性能
console.Buffer.BeginBatchUpdate
For i = 0 To 100
    console.Buffer.SetChar x(i), y(i), "█", color
Next i
console.Buffer.EndBatchUpdate
console.Buffer.Flush hOutput

' 仅刷新变化区域
If console.Buffer.IsDirty Then
    Dim dirtyRect As ConsoleRect = console.Buffer.GetDirtyRect
    console.Buffer.FlushRegion hOutput, dirtyRect.Left, dirtyRect.Top, dirtyRect.Right, dirtyRect.Bottom
End If
```

### UTF-8 支持

```vb
' 启用 UTF-8 以支持国际字符
console.EnableUTF8

' 写入 Unicode 字符
console.WriteTo "中文测试"
console.WriteTo "日本語"
console.WriteTo "한국어"
console.WriteTo "🎉"
```

### 虚拟终端序列

```vb
' 启用 VT100/ANSI 转义序列
console.EnableVirtualTerminal

' 使用高级样式
console.WriteTo mConsoleStyle.FgRGB(255, 128, 0) & "自定义颜色" & mConsoleStyle.Reset
console.WriteTo mConsoleStyle.Bold & mConsoleStyle.Italic & "样式" & mConsoleStyle.Reset
```

## 最佳实践

1. **始终清理**：程序退出前调用 `console.ExitFullScreenMode()` 或使用 `console.Restore()`
2. **使用批量更新**：将多个绘制操作包装在 `BeginBatchUpdate`/`EndBatchUpdate` 中以提高性能
3. **处理事件**：实现调整大小处理器以处理窗口大小变化
4. **使用缓冲区**：在全屏模式下，始终绘制到缓冲区并调用 `Refresh()` 刷新
5. **隐藏光标**：全屏模式下光标自动隐藏
6. **验证输入**：在写入缓冲区位置前始终检查边界
7. **恢复状态**：`Restore()` 方法会恢复原始控制台状态

## API 参考

### cConsole 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| Width | Long | 控制台宽度 |
| Height | Long | 控制台高度 |
| ForeColor | ConsoleColor | 当前前景色 |
| BackColor | ConsoleColor | 当前背景色 |
| CursorVisible | Boolean | 光标可见性 |
| CursorSize | Long | 光标大小（1-100） |
| Title | String | 控制台窗口标题 |
| FullScreenMode | Boolean | 全屏模式状态 |
| Buffer | cConsoleBuffer | 屏幕缓冲区（全屏模式） |
| FPS | Double | 估计每秒帧数 |
| LastRenderTime | Long | 上次渲染时间（毫秒） |

### cConsole 主要方法

| 方法 | 说明 |
|------|------|
| WriteTo / WriteLine | 写入文本 |
| ReadLine / ReadKey | 读取输入 |
| Clear / ClearLine | 清除屏幕/行 |
| GetCursorPosition / SetCursorPosition | 光标控制 |
| GetSize / GetBufferSize | 获取尺寸 |
| EnterFullScreenMode / ExitFullScreenMode | 全屏控制 |
| Refresh / RefreshAll | 更新显示 |
| ProcessEvents | 处理待处理事件 |

### cConsoleBuffer 主要方法

| 方法 | 说明 |
|------|------|
| Clear | 清空整个缓冲区 |
| SetChar / GetChar | 字符操作 |
| WriteAt | 在位置写入文本 |
| FillRect | 填充矩形区域 |
| DrawBox / DrawHLine / DrawVLine | 绘图原语 |
| Flush / FlushRegion | 写入控制台 |
| BeginBatchUpdate / EndBatchUpdate | 批量操作 |
| CopyRegion / ScrollRegion | 区域操作 |

## 许可

此核心库是 Modern Console Library 的一部分。
