# Console Components Library

**Author**: woeoio
**Email**: 215879458@qq.com
**Website**: https://vb6.pro

A high-level component library built on top of the Core kernel.

## Directory Structure

```
Components/
├── README.md              # This file
├── Panels/
│   ├── cConsolePanel.twin # Panel component
│   └── cConsoleLayout.twin    # Layout manager
├── Controls/
│   ├── cProgressBar.twin   # Progress bar
│   ├── cVBar.twin          # Vertical bar chart
│   ├── cSparkline.twin     # Mini sparkline
│   └── cDataGrid.twin      # Data grid
├── Themes/
│   └── cConsoleTheme.twin  # Theme system
└── Helpers/
    ├── cLayoutHelper.twin   # Layout helper
    └── cColorHelper.twin    # Color helper
```

## Quick Start

### 1. Using the Theme System

```vb
Dim theme As cConsoleTheme
Set theme = cConsoleTheme.CreateHTOP()  ' HTOP style theme
' or
Set theme = cConsoleTheme.CreateDefault()  ' Default dark theme
' or
Set theme = cConsoleTheme.CreateLight()   ' Light theme

' Use theme colors
Dim successColor As ConsoleColor = theme.Success
Dim errorColor As ConsoleColor = theme.Error
```

### 2. Using Panel Components

```vb
Dim console As New cConsole
Dim panel As New cConsolePanel("Main Panel", 2, 2, 40, 10)

panel.Title = "System Monitor"
panel.BorderStyle = cConsolePanel.PanelBorderStyle.Single
panel.BorderColor = theme.Border
panel.TitleColor = theme.HeaderForeground

console.EnterFullScreenMode
panel.Render console.Buffer, theme.Border, theme.Background

' Get content area for drawing
Dim contentRect As ConsoleRect = panel.ContentRect
console.Buffer.WriteAt contentRect.Left, contentRect.Top, "Hello, World!", theme.Foreground

console.Refresh
```

### 3. Using Progress Bar

```vb
Dim console As New cConsole
Dim progressBar As New cProgressBar(console)

console.EnterFullScreenMode

' Simple progress bar
progressBar.Render 10, 5, 30, 75, "█", "░", ConsoleColor.Green, ConsoleColor.DarkGray

' Progress bar with brackets
progressBar.RenderWithBrackets 10, 8, 30, 50, "█", "░", ConsoleColor.Green, ConsoleColor.DarkGray

' Progress bar with label
progressBar.RenderWithLabel 10, 11, 40, 80, "Installing:", "█", "░", ConsoleColor.Green

' Progress bar with auto color (changes based on percentage)
progressBar.RenderWithAutoColor 10, 14, 30, 90, "█", "░"

console.Refresh
```

### 4. Using Vertical Bar Chart

```vb
Dim console As New cConsole
Dim vBar As New cVBar(console)

console.EnterFullScreenMode

' Single bar chart
vBar.Render 10, 5, 10, 75, ConsoleColor.Green

' Multiple bar charts (display CPU core usage)
Dim cpuUsage(0 To 3) As Double
cpuUsage(0) = 45
cpuUsage(1) = 60
cpuUsage(2) = 80
cpuUsage(3) = 30

vBar.RenderBars 10, 5, 10, cpuUsage, 2, 0, 100, ConsoleColor.Green

' Bar chart with gradient color
vBar.RenderWithGradient 10, 20, 8, cpuUsage, 2, 0, 100

console.Refresh
```

### 5. Using Mini Sparkline

```vb
Dim console As New cConsole
Dim sparkline As New cSparkline(console)

console.EnterFullScreenMode

' Historical data
Dim cpuHistory(0 To 19) As Double
Dim i As Long
For i = 0 To 19
    cpuHistory(i) = 30 + Rnd() * 50  ' Random value 30-80%
Next i

' Draw sparkline
sparkline.Render 5, 3, 30, 5, cpuHistory, 0, 100, ConsoleColor.Green

' Draw sparkline with statistics
sparkline.RenderWithStats 5, 10, 30, 5, cpuHistory, 0, 100, ConsoleColor.Green

console.Refresh
```

### 6. Using Data Grid

```vb
Dim console As New cConsole
Dim grid As New cDataGrid(console)

console.EnterFullScreenMode

' Set data
Dim rows(0 To 4) As String
rows(0) = "PID" & vbTab & "Name" & vbTab & "CPU%" & vbTab & "MEM%"
rows(1) = "1234" & vbTab & "chrome.exe" & vbTab & "45.2" & vbTab & "12.3"
rows(2) = "5678" & vbTab & "node.exe" & vbTab & "23.1" & vbTab & "8.5"
rows(3) = "9012" & vbTab & "python.exe" & vbTab & "12.8" & vbTab & "15.2"
rows(4) = "3456" & vbTab & "vscode.exe" & vbTab & "8.5" & vbTab & "5.1"

grid.SetRows rows

' Set column widths
Dim colWidths(0 To 3) As Long
colWidths(0) = 8
colWidths(1) = 15
colWidths(2) = 8
colWidths(3) = 8
grid.SetColumnWidths colWidths

' Set alignments
Dim alignments(0 To 3) As cDataGrid.ColumnAlignment
alignments(0) = cDataGrid.ColumnAlignment.Right
alignments(1) = cDataGrid.ColumnAlignment.Left
alignments(2) = cDataGrid.ColumnAlignment.Right
alignments(3) = cDataGrid.ColumnAlignment.Right
grid.SetColumnAlignments alignments

' Set selected row
grid.SelectedRow = 1

' Set theme colors
grid.HeaderColor = ConsoleColor.Cyan
grid.SelectionColor = ConsoleColor.DarkBlue

' Render grid
grid.Render 5, 3

console.Refresh
```

### 7. Using Layout Manager

```vb
Dim console As New cConsole
Dim layout As New cConsoleLayout(console)
Dim theme As cConsoleTheme

Set theme = cConsoleTheme.CreateHTOP()

console.EnterFullScreenMode

' Create basic layout: header / content / footer
Dim panels As Variant = layout.CreateHeaderFooter(3, 2, "header", "content", "footer")
Dim headerPanel As cConsolePanel = panels(0)
Dim contentPanel As cConsolePanel = panels(1)
Dim footerPanel As cConsolePanel = panels(2)

headerPanel.Title = "System Monitor"
footerPanel.Title = "Status"

' Render all panels
layout.Render theme

' Get panel content area
Dim contentRect As ConsoleRect = contentPanel.ContentRect()
console.Buffer.WriteAt contentRect.Left, contentRect.Top, "Content Area", theme.Foreground

console.Refresh
```

**Horizontal Split Example:**

```vb
' Create horizontal split (30% left, 70% right)
Dim splitPanels As Variant = layout.SplitHorizontal("content", 0.3, "left", "right")
Dim leftPanel As cConsolePanel = splitPanels(0)
Dim rightPanel As cConsolePanel = splitPanels(1)

leftPanel.Title = "Sidebar"
rightPanel.Title = "Main Content"

layout.Render theme
```

**Vertical Split Example:**

```vb
' Create vertical split (60% top, 40% bottom)
Dim splitPanels As Variant = layout.SplitVertical("content", 0.6, "top", "bottom")
Dim topPanel As cConsolePanel = splitPanels(0)
Dim bottomPanel As cConsolePanel = splitPanels(1)

topPanel.Title = "History"
bottomPanel.Title = "Details"

layout.Render theme
```

**Grid Layout Example:**

```vb
' Create 2x2 grid layout
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

**Sidebar Layout Example:**

```vb
' Create sidebar layout (20% left)
Dim sidebarPanels As Variant = layout.CreateSidebar(console.PercentX(20), "sidebar", "main")
Dim sidebarPanel As cConsolePanel = sidebarPanels(0)
Dim mainPanel As cConsolePanel = sidebarPanels(1)

sidebarPanel.Title = "Menu"
mainPanel.Title = "Content"

layout.Render theme
```

**Responsive Layout:**

```vb
' Automatically adjust layout when window size changes
layout.AutoResize  ' or layout.Resize newWidth, newHeight
layout.Render theme
```

### 8. Using Layout Helper

```vb
Dim console As New cConsole
Dim layout As New cLayoutHelper(console)

console.EnterFullScreenMode

' Calculate center position
Dim pos As ConsolePosition
pos = layout.Center(40, 10)
' pos.Col = (console.Width - 40) \ 2
' pos.Row = (console.Height - 10) \ 2

' Calculate percentage position
Dim pos2 As ConsolePosition
pos2 = layout.Percent(50, 50)  ' Screen center

' Horizontal split (50/50)
Dim rects As Variant
rects = layout.SplitHorizontal(50)
Dim topRect As ConsoleRect = rects(0)
Dim bottomRect As ConsoleRect = rects(1)

' Vertical split (30/70)
rects = layout.SplitVertical(30)
Dim leftRect As ConsoleRect = rects(0)
Dim rightRect As ConsoleRect = rects(1)

' 2x2 grid layout
Dim gridRects As Variant
gridRects = layout.Grid(2, 2)  ' 2 columns x 2 rows
Dim topLeft As ConsoleRect = gridRects(0)
Dim topRight As ConsoleRect = gridRects(1)
Dim bottomLeft As ConsoleRect = gridRects(2)
Dim bottomRight As ConsoleRect = gridRects(3)

' Sidebar layout (20% left, 80% right)
rects = layout.Sidebar(console.PercentX(20))

' Header/Content/Footer layout
rects = layout.HeaderFooter(2, 1)  ' Header 2 rows, footer 1 row
```

### 9. Using Color Helper

```vb
Dim colorHelper As New cColorHelper

' Get heatmap color (based on value)
Dim cpuUsage As Double = 85
Dim cpuColor As ConsoleColor
cpuColor = colorHelper.CPUUsageColor(cpuUsage)  ' Returns ConsoleColor.Red

' Memory usage color
Dim memUsage As Double = 65
Dim memColor As ConsoleColor
memColor = colorHelper.MemoryUsageColor(memUsage)  ' Returns ConsoleColor.Green

' Disk usage color
Dim diskUsage As Double = 92
Dim diskColor As ConsoleColor
diskColor = colorHelper.DiskUsageColor(diskUsage)  ' Returns ConsoleColor.Yellow

' Get heatmap color (custom)
Dim value As Double = 75
Dim heatColor As ConsoleColor
heatColor = colorHelper.HeatmapColor(value, 0, 100, ConsoleColor.Green, ConsoleColor.Yellow, ConsoleColor.Red)

' Get contrast color (for text)
Dim bgColor As ConsoleColor = ConsoleColor.DarkBlue
Dim textColor As ConsoleColor
textColor = colorHelper.GetContrastColor(bgColor)  ' Returns ConsoleColor.White

' Dim/Brighten color
Dim dimColor As ConsoleColor = colorHelper.DimColor(ConsoleColor.White)  ' Returns ConsoleColor.Gray
Dim brightColor As ConsoleColor = colorHelper.BrightenColor(ConsoleColor.DarkGray)  ' Returns ConsoleColor.Gray
```

## Performance Optimization Tips

### 1. Using Batch Updates

```vb
console.Buffer.BeginBatchUpdate

' Execute many drawing operations
For i = 0 To 100
    console.Buffer.SetChar x, y, "█", fore, back
Next i

console.Buffer.EndBatchUpdate
```

### 2. Using Partial Refresh

```vb
' Refresh only specific region
console.Buffer.FlushRegion console.hOutput, left, top, right, bottom
```

### 3. Dirty Rectangle Mechanism

```vb
' Check if there are changes
If console.Buffer.IsDirty Then
    Dim dirtyRect As ConsoleRect = console.Buffer.GetDirtyRect
    ' Only refresh dirty region
    console.Buffer.FlushRegion console.hOutput, dirtyRect.Left, dirtyRect.Top, dirtyRect.Right, dirtyRect.Bottom
End If
```

## Theme Customization

Create custom themes:

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

## Notes

1. Component library depends on Core kernel, ensure it's properly referenced before use
2. All components need `console.EnterFullScreenMode()` to be called before rendering
3. Call `console.Refresh()` after drawing to refresh the screen
4. In full-screen mode, the cursor is hidden by default
5. Exit full-screen mode with `console.ExitFullScreenMode()`

## License

This component library is part of Modern Console Library.
