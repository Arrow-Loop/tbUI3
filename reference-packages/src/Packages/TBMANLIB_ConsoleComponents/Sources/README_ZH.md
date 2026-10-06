# Console Components Library

**作者**: 邓伟
**联系**: 215879458@qq.com
**网站**: https://vb6.pro

控制台组件库 - 基于 Core 内核构建的高级组件集合。

## 目录结构

```
Components/
├── README.md              # 本文件
├── Panels/
│   ├── cConsolePanel.twin # 面板组件
│   └── cConsoleLayout.twin    # 布局管理器
├── Controls/
│   ├── cProgressBar.twin   # 进度条
│   ├── cVBar.twin          # 垂直柱状图
│   ├── cSparkline.twin     # 迷你折线图
│   └── cDataGrid.twin      # 数据表格
├── Themes/
│   └── cConsoleTheme.twin  # 主题系统
└── Helpers/
    ├── cLayoutHelper.twin   # 布局辅助
    └── cColorHelper.twin    # 颜色辅助
```

## 快速开始

### 1. 使用主题系统

```vb
Dim theme As cConsoleTheme
Set theme = cConsoleTheme.CreateHTOP()  ' HTOP 风格主题
' 或者
Set theme = cConsoleTheme.CreateDefault()  ' 默认深色主题
' 或者
Set theme = cConsoleTheme.CreateLight()   ' 浅色主题

' 使用主题颜色
Dim successColor As ConsoleColor = theme.Success
Dim errorColor As ConsoleColor = theme.Error
```

### 2. 使用面板组件

```vb
Dim console As New cConsole
Dim panel As New cConsolePanel("Main Panel", 2, 2, 40, 10)

panel.Title = "System Monitor"
panel.BorderStyle = cConsolePanel.PanelBorderStyle.Single
panel.BorderColor = theme.Border
panel.TitleColor = theme.HeaderForeground

console.EnterFullScreenMode
panel.Render console.Buffer, theme.Border, theme.Background

' 获取内容区域进行绘制
Dim contentRect As ConsoleRect = panel.ContentRect
console.Buffer.WriteAt contentRect.Left, contentRect.Top, "Hello, World!", theme.Foreground

console.Refresh
```

### 3. 使用进度条

```vb
Dim console As New cConsole
Dim progressBar As New cProgressBar(console)

console.EnterFullScreenMode

' 简单进度条
progressBar.Render 10, 5, 30, 75, "█", "░", ConsoleColor.Green, ConsoleColor.DarkGray

' 带括号的进度条
progressBar.RenderWithBrackets 10, 8, 30, 50, "█", "░", ConsoleColor.Green, ConsoleColor.DarkGray

' 带标签的进度条
progressBar.RenderWithLabel 10, 11, 40, 80, "Installing:", "█", "░", ConsoleColor.Green

' 带自动颜色的进度条（根据百分比变化颜色）
progressBar.RenderWithAutoColor 10, 14, 30, 90, "█", "░"

console.Refresh
```

### 4. 使用垂直柱状图

```vb
Dim console As New cConsole
Dim vBar As New cVBar(console)

console.EnterFullScreenMode

' 单个柱状图
vBar.Render 10, 5, 10, 75, ConsoleColor.Green

' 多个柱状图（显示 CPU 核心使用率）
Dim cpuUsage(0 To 3) As Double
cpuUsage(0) = 45
cpuUsage(1) = 60
cpuUsage(2) = 80
cpuUsage(3) = 30

vBar.RenderBars 10, 5, 10, cpuUsage, 2, 0, 100, ConsoleColor.Green

' 带渐变颜色的柱状图
vBar.RenderWithGradient 10, 20, 8, cpuUsage, 2, 0, 100

console.Refresh
```

### 5. 使用迷你折线图

```vb
Dim console As New cConsole
Dim sparkline As New cSparkline(console)

console.EnterFullScreenMode

' 历史数据
Dim cpuHistory(0 To 19) As Double
Dim i As Long
For i = 0 To 19
    cpuHistory(i) = 30 + Rnd() * 50  ' 30-80% 随机值
Next i

' 绘制折线图
sparkline.Render 5, 3, 30, 5, cpuHistory, 0, 100, ConsoleColor.Green

' 绘制带统计信息的折线图
sparkline.RenderWithStats 5, 10, 30, 5, cpuHistory, 0, 100, ConsoleColor.Green

console.Refresh
```

### 6. 使用数据表格

```vb
Dim console As New cConsole
Dim grid As New cDataGrid(console)

console.EnterFullScreenMode

' 设置数据
Dim rows(0 To 4) As String
rows(0) = "PID" & vbTab & "Name" & vbTab & "CPU%" & vbTab & "MEM%"
rows(1) = "1234" & vbTab & "chrome.exe" & vbTab & "45.2" & vbTab & "12.3"
rows(2) = "5678" & vbTab & "node.exe" & vbTab & "23.1" & vbTab & "8.5"
rows(3) = "9012" & vbTab & "python.exe" & vbTab & "12.8" & vbTab & "15.2"
rows(4) = "3456" & vbTab & "vscode.exe" & vbTab & "8.5" & vbTab & "5.1"

grid.SetRows rows

' 设置列宽
Dim colWidths(0 To 3) As Long
colWidths(0) = 8
colWidths(1) = 15
colWidths(2) = 8
colWidths(3) = 8
grid.SetColumnWidths colWidths

' 设置对齐
Dim alignments(0 To 3) As cDataGrid.ColumnAlignment
alignments(0) = cDataGrid.ColumnAlignment.Right
alignments(1) = cDataGrid.ColumnAlignment.Left
alignments(2) = cDataGrid.ColumnAlignment.Right
alignments(3) = cDataGrid.ColumnAlignment.Right
grid.SetColumnAlignments alignments

' 设置选中行
grid.SelectedRow = 1

' 设置主题颜色
grid.HeaderColor = ConsoleColor.Cyan
grid.SelectionColor = ConsoleColor.DarkBlue

' 渲染表格
grid.Render 5, 3

console.Refresh
```

### 7. 使用布局管理器

```vb
Dim console As New cConsole
Dim layout As New cConsoleLayout(console)
Dim theme As cConsoleTheme

Set theme = cConsoleTheme.CreateHTOP()

console.EnterFullScreenMode

' 创建基础布局：头部 / 内容 / 底部
Dim panels As Variant = layout.CreateHeaderFooter(3, 2, "header", "content", "footer")
Dim headerPanel As cConsolePanel = panels(0)
Dim contentPanel As cConsolePanel = panels(1)
Dim footerPanel As cConsolePanel = panels(2)

headerPanel.Title = "System Monitor"
footerPanel.Title = "Status"

' 渲染所有面板
layout.Render theme

' 获取面板内容区域
Dim contentRect As ConsoleRect = contentPanel.ContentRect()
console.Buffer.WriteAt contentRect.Left, contentRect.Top, "Content Area", theme.Foreground

console.Refresh
```

**水平分割示例：**

```vb
' 创建水平分割（左侧 30%，右侧 70%）
Dim splitPanels As Variant = layout.SplitHorizontal("content", 0.3, "left", "right")
Dim leftPanel As cConsolePanel = splitPanels(0)
Dim rightPanel As cConsolePanel = splitPanels(1)

leftPanel.Title = "Sidebar"
rightPanel.Title = "Main Content"

layout.Render theme
```

**垂直分割示例：**

```vb
' 创建垂直分割（上方 60%，下方 40%）
Dim splitPanels As Variant = layout.SplitVertical("content", 0.6, "top", "bottom")
Dim topPanel As cConsolePanel = splitPanels(0)
Dim bottomPanel As cConsolePanel = splitPanels(1)

topPanel.Title = "History"
bottomPanel.Title = "Details"

layout.Render theme
```

**网格布局示例：**

```vb
' 创建 2x2 网格布局
Dim gridPanels As Variant = layout.CreateGrid(2, 2, "cell")
Dim cell00 As cConsolePanel = gridPanels(0)
Dim cell01 As cConsolePanel = gridPanels(1)
Dim cell10 As cConsolePanel = gridPanels(2)
Dim cell11 As cConsolePanel = gridPanels(3)

cell00.Title = "CPU"
cell01.Title = "Memory"
cell10.Title = "Disk"
cell11.Title = "Network"

layout.Render theme
```

**侧边栏布局示例：**

```vb
' 创建侧边栏布局（左侧 20%）
Dim sidebarPanels As Variant = layout.CreateSidebar(console.PercentX(20), "sidebar", "main")
Dim sidebarPanel As cConsolePanel = sidebarPanels(0)
Dim mainPanel As cConsolePanel = sidebarPanels(1)

sidebarPanel.Title = "Menu"
mainPanel.Title = "Content"

layout.Render theme
```

**响应式布局：**

```vb
' 当窗口大小改变时，自动调整布局
layout.AutoResize  ' 或 layout.Resize newWidth, newHeight
layout.Render theme
```

### 8. 使用布局辅助

```vb
Dim console As New cConsole
Dim layout As New cLayoutHelper(console)

console.EnterFullScreenMode

' 计算居中位置
Dim pos As ConsolePosition
pos = layout.Center(40, 10)
' pos.Col = (console.Width - 40) \ 2
' pos.Row = (console.Height - 10) \ 2

' 计算百分比位置
Dim pos2 As ConsolePosition
pos2 = layout.Percent(50, 50)  ' 屏幕中心

' 水平分割（50/50）
Dim rects As Variant
rects = layout.SplitHorizontal(50)
Dim topRect As ConsoleRect = rects(0)
Dim bottomRect As ConsoleRect = rects(1)

' 垂直分割（30/70）
rects = layout.SplitVertical(30)
Dim leftRect As ConsoleRect = rects(0)
Dim rightRect As ConsoleRect = rects(1)

' 2x2 网格布局
Dim gridRects As Variant
gridRects = layout.Grid(2, 2)  ' 2列 x 2行
Dim topLeft As ConsoleRect = gridRects(0)
Dim topRight As ConsoleRect = gridRects(1)
Dim bottomLeft As ConsoleRect = gridRects(2)
Dim bottomRight As ConsoleRect = gridRects(3)

' 侧边栏布局（左侧20%，右侧80%）
rects = layout.Sidebar(console.PercentX(20))

' 头部/内容/底部布局
rects = layout.HeaderFooter(2, 1)  ' 头部2行，底部1行
```

### 8. 使用颜色辅助

```vb
Dim colorHelper As New cColorHelper

' 获取热力图颜色（根据数值）
Dim cpuUsage As Double = 85
Dim cpuColor As ConsoleColor
cpuColor = colorHelper.CPUUsageColor(cpuUsage)  ' 返回 ConsoleColor.Red

' 内存使用颜色
Dim memUsage As Double = 65
Dim memColor As ConsoleColor
memColor = colorHelper.MemoryUsageColor(memUsage)  ' 返回 ConsoleColor.Green

' 磁盘使用颜色
Dim diskUsage As Double = 92
Dim diskColor As ConsoleColor
diskColor = colorHelper.DiskUsageColor(diskUsage)  ' 返回 ConsoleColor.Yellow

' 获取热力图颜色（自定义）
Dim value As Double = 75
Dim heatColor As ConsoleColor
heatColor = colorHelper.HeatmapColor(value, 0, 100, ConsoleColor.Green, ConsoleColor.Yellow, ConsoleColor.Red)

' 获取对比色（用于文本）
Dim bgColor As ConsoleColor = ConsoleColor.DarkBlue
Dim textColor As ConsoleColor
textColor = colorHelper.GetContrastColor(bgColor)  ' 返回 ConsoleColor.White

' 颜色变暗/变亮
Dim dimColor As ConsoleColor = colorHelper.DimColor(ConsoleColor.White)  ' 返回 ConsoleColor.Gray
Dim brightColor As ConsoleColor = colorHelper.BrightenColor(ConsoleColor.DarkGray)  ' 返回 ConsoleColor.Gray
```

## 性能优化技巧

### 1. 使用批量更新

```vb
console.Buffer.BeginBatchUpdate

' 执行大量绘制操作
For i = 0 To 100
    console.Buffer.SetChar x, y, "█", fore, back
Next i

console.Buffer.EndBatchUpdate
```

### 2. 使用部分刷新

```vb
' 只刷新特定区域
console.Buffer.FlushRegion console.hOutput, left, top, right, bottom
```

### 3. 脏矩形机制

```vb
' 检查是否有变化
If console.Buffer.IsDirty Then
    Dim dirtyRect As ConsoleRect = console.Buffer.GetDirtyRect
    ' 只刷新脏区域
    console.Buffer.FlushRegion console.hOutput, dirtyRect.Left, dirtyRect.Top, dirtyRect.Right, dirtyRect.Bottom
End If
```

## 主题定制

创建自定义主题：

```vb
Dim customTheme As New cConsoleTheme

customTheme.Background = ConsoleColor.Black
customTheme.Foreground = ConsoleColor.Gray
customTheme.Primary = ConsoleColor.Cyan
customTheme.Success = ConsoleColor.Green
customTheme.Warning = ConsoleColor.Yellow
customTheme.Error = ConsoleColor.Red
customTheme.Info = ConsoleColor.Cyan
customTheme.Border = ConsoleColor.Gray
customTheme.HeaderBackground = ConsoleColor.DarkBlue
customTheme.HeaderForeground = ConsoleColor.White
customTheme.SelectedBackground = ConsoleColor.DarkBlue
customTheme.SelectedForeground = ConsoleColor.White
```

## 注意事项

1. 组件库依赖 Core 内核，使用前确保已正确引用
2. 所有组件在绘制前都需要先调用 `console.EnterFullScreenMode()`
3. 绘制完成后需要调用 `console.Refresh()` 来刷新屏幕
4. 在全屏模式下，光标默认是隐藏的
5. 退出全屏模式时调用 `console.ExitFullScreenMode()`

## 许可

此组件库是 Modern Console Library 的一部分。
