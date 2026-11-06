# TwinBASIC System Diagnostic Package

> 🏆 A complete Windows system diagnostic package with real-time monitoring and multi-format report export.

## 📦 Package Overview

This package is a modular Windows system diagnostic toolkit, inspired by Linux's `htop` tool. The package includes complete diagnostic data collection and formatted output. The core layer is completely UI-independent and can be integrated into any TwinBASIC project.

**Key Features:**

- 🔌 **Modular Architecture** - Core engine completely separated from UI, easy integration
- 📊 **11 Diagnostic Categories** - Covering OS, CPU, Memory, Disk, Processes, etc.
- 🔄 **Three-Level Refresh Modes** - Static/Dynamic/SemiDynamic intelligent refresh
- 🎨 **Multi-Format Output** - Supports TEXT, JSON, and HTML formats
- 🚀 **Zero External Dependencies** - Only uses built-in WinAPI and TwinBASIC features
- 📐 **Modern Language Features** - Full application of generics, delegates, and interfaces
- 🎯 **Multi-UI Support** - Core abstraction layer supports Console/GUI/WEB and other callers

## 📁 Package Structure

```
src/
├── Core/                   # Core diagnostic engine
│   ├── DiagnosticEngine.twin       # Diagnostic engine main class
│   └── RefreshMode.twin            # Refresh mode enumeration
│
├── Collectors/             # Diagnostic data collectors
│   ├── Static/                     # Static data (fetch once)
│   │   ├── OSInfoCollector.twin           # Operating system information
│   │   ├── CPUInfoCollector.twin          # CPU information
│   │   ├── LocaleCollector.twin           # Locale settings
│   │   ├── EnvironmentCollector.twin      # Environment variables
│   │   └── RuntimesCollector.twin         # Installed runtimes
│   ├── Dynamic/                    # Dynamic data (refresh every time)
│   │   ├── CPULoadCollector.twin          # CPU real-time load
│   │   ├── MemoryInfoCollector.twin       # Memory usage
│   │   ├── ProcessInfoCollector.twin      # Process information
│   │   └── UptimeCollector.twin           # System uptime
│   └── SemiDynamic/                # Semi-dynamic data (optional refresh)
│       ├── DiskInfoCollector.twin          # Disk information
│       └── NetworkInfoCollector.twin       # Network configuration
│
├── Formatters/             # Output formatters
│   ├── IOutputFormatter.twin         # Formatter interface
│   ├── TextFormatter.twin            # Plain text format
│   ├── JsonFormatter.twin            # JSON format
│   ├── HtmlFormatter.twin            # HTML format
│   └── FormatterFactory.twin          # Formatter factory
│
├── Interfaces/             # Interface definitions
│   ├── IDiagnosticCollector.twin     # Diagnostic collector interface
│   └── IOutputFormatter.twin         # Output formatter interface
│
├── Generics/               # Generic containers
│   ├── DiagnosticResult.twin         # Generic result container
│   ├── List.twin                    # Generic list
│   ├── Dictionary.twin               # Generic dictionary
│   └── KeyValuePair.twin            # Key-value pair
│
├── Delegates/              # Delegate definitions
│   └── Delegates.twin               # Event delegates
│
├── Utilities/              # Utility classes
│   ├── FormatHelper.twin             # Formatting utilities (bytes, time)
│   ├── StringBuilder.twin            # String builder
│   └── FileHelper.twin               # File operation helpers
│
└── WinAPI/                 # Windows API declarations
    ├── Declarations.twin            # API function declarations
    └── Structures.twin               # Structure definitions
```

## 🚀 Quick Start

### Basic Usage

```vb
' Import necessary modules
Imports Core
Imports Collectors.Static
Imports Collectors.Dynamic
Imports Formatters

' 1. Create diagnostic engine
Dim engine As DiagnosticEngine
Set engine = New DiagnosticEngine

' 2. Register collectors
engine.RegisterCollector New OSInfoCollector
engine.RegisterCollector New CPUInfoCollector
engine.RegisterCollector New MemoryInfoCollector
engine.RegisterCollector New CPULoadCollector
' ... add more collectors

' 3. Run data collection
Dim results As List(Of DiagnosticResult)
Set results = engine.RunAll(False)  ' False = collect complete data

' 4. Format output
Dim formatter As TextFormatter
Set formatter = New TextFormatter
Console.Print formatter.Format(results)
```

### Using Summary Mode (Performance Optimization)

```vb
' Summary mode only collects key data, suitable for high-frequency refresh
Dim results As List(Of DiagnosticResult)
Set results = engine.RunAll(True)  ' True = use summary mode
```

### Export Different Formats

```vb
' JSON format
Dim jsonFormatter As JsonFormatter
Set jsonFormatter = New JsonFormatter
FileHelper.WriteAllText "report.json", jsonFormatter.Format(results)

' HTML format
Dim htmlFormatter As HtmlFormatter
Set htmlFormatter = New HtmlFormatter
FileHelper.WriteAllText "report.html", htmlFormatter.Format(results)
```

### Using Factory Pattern

```vb
Dim formatter As IOutputFormatter
Set formatter = FormatterFactory.Create("json")  ' Supports text, json, html
```

## 📊 Diagnostic Categories

| Category              | Collector              | Refresh Mode | Description                                 |
| --------------------- | ---------------------- | ------------ | ------------------------------------------- |
| Operating System Info | `OSInfoCollector`      | Static       | Windows version, build number, architecture |
| CPU Info              | `CPUInfoCollector`     | Static       | Processor name, core count, frequency       |
| Locale Settings       | `LocaleCollector`      | Static       | Locale, code page, time zone                |
| Environment Variables | `EnvironmentCollector` | Static       | System environment variables like PATH      |
| Installed Runtimes    | `RuntimesCollector`    | Static       | .NET, VC++ runtimes, etc.                   |
| CPU Real-time Load    | `CPULoadCollector`     | Dynamic      | Dynamic CPU usage monitoring                |
| Memory Usage          | `MemoryInfoCollector`  | Dynamic      | Physical memory, virtual memory statistics  |
| Process Info          | `ProcessInfoCollector` | Dynamic      | Running process list, PID, thread count     |
| System Uptime         | `UptimeCollector`      | Dynamic      | System running time since boot              |
| Disk Info             | `DiskInfoCollector`    | SemiDynamic  | Logical drives, space usage                 |
| Network Config        | `NetworkInfoCollector` | SemiDynamic  | IP addresses, network adapters              |

## 🏗️ Architecture Design

This package adopts a layered architecture design. The core implementation layer is completely UI-independent and supports multiple callers.

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│              UI Layer (Callers)              │
├──────────┬──────────┬──────────┬────────────┤
│ Console  │ GUI      │ Web UI   │ CLI        │
│ TUI      │ WinForms │ HTML/JS  │ Export     │
└────┬─────┴────┬─────┴────┬─────┴────┬───────┘
     │          │          │          │
┌────┴──────────┴──────────┴──────────┴───────┐
│          Core Layer (Core Implementation)   │
│  ┌──────────────────────────────────────┐  │
│  │   DiagnosticEngine                  │  │
│  │   (Register collectors, data        │  │
│  │    collection, event callbacks)     │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Collectors (Static/Dynamic/...)     │  │
│  │   IDiagnosticCollector Interface     │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Formatters (Text/JSON/HTML)        │  │
│  │   IOutputFormatter Interface         │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
     │          │          │          │
┌────┴──────────┴──────────┴──────────┴───────┐
│          Data Layer (Data Models)            │
│  DiagnosticResult(Of T)                    │
│  KeyValuePair(Of String, String)           │
└─────────────────────────────────────────────┘
```

### Architecture Benefits

- 🔌 **Plugin Extension** - Add new UIs without modifying core code
- 📱 **Multi-Platform Coverage** - Same core library serves multiple scenarios
- 🧪 **Independent Testing** - Core logic separated from UI, easy unit testing
- 📦 **Module Reuse** - Core library can be independently published to TwinBASIC package manager

## 🔧 Advanced Features

### Custom Collectors

```vb
' Implement IDiagnosticCollector interface
Public Class MyCustomCollector
    Implements IDiagnosticCollector

    Private m_Category As String

    Public Sub New()
        m_Category = "Custom Metrics"
    End Sub

    Public Property Get IDiagnosticCollector_CategoryName() As String
        Return m_Category
    End Property

    Public Property Get IDiagnosticCollector_RefreshMode() As RefreshMode
        Return RefreshMode.Dynamic
    End Property

    Public Function IDiagnosticCollector_Collect( _
        ByVal useSummary As Boolean) As DiagnosticResult

        Dim result As DiagnosticResult
        Set result = New DiagnosticResult("Custom Metrics")

        ' Add custom data
        result.AddItem "Custom Metric 1", "Value 1"
        result.AddItem "Custom Metric 2", "Value 2"

        Set IDiagnosticCollector_Collect = result
    End Function
End Class
```

### Custom Formatters

```vb
' Implement IOutputFormatter interface
Public Class CustomFormatter
    Implements IOutputFormatter

    Public Function IOutputFormatter_Format( _
        ByVal results As List(Of DiagnosticResult)) As String

        Dim sb As StringBuilder
        Set sb = New StringBuilder

        Dim i As Long
        For i = 1 To results.Count
            sb.Append "=== " & results(i).CategoryName & " ==="
            sb.Append vbCrLf
            ' ... custom formatting logic
        Next i

        Set IOutputFormatter_Format = sb.ToString()
    End Function
End Class
```

### Event Handling

```vb
Dim WithEvents engine As DiagnosticEngine

Private Sub DiagnosticEngine_OnCollectorCompleted( _
    ByVal category As String, _
    ByVal success As Boolean, _
    ByVal itemCount As Long)

    If success Then
        Console.Print "[OK] " & category & " - " & itemCount & " items"
    Else
        Console.Print "[FAIL] " & category
    End If
End Sub
```

## 📖 Utility Classes

### FormatHelper

Formatting helper utilities for friendly data display.

```vb
' Format bytes
FormatHelper.FormatBytes(17592186018592)    ' → "16.00 TB"
FormatHelper.FormatBytes(17592186018592, 0) ' → "16 TB"

' Format time (milliseconds)
FormatHelper.FormatUptime(345678901)  ' → "4d 00:00:01"

' Align text
FormatHelper.PadLeft("Test", 10)       ' → "      Test"
FormatHelper.PadRight("Test", 10)      ' → "Test      "
```

### StringBuilder

Efficient string builder to reduce memory allocations.

```vb
Dim sb As StringBuilder
Set sb = New StringBuilder

sb.Append "Line 1" & vbCrLf
sb.Append "Line 2" & vbCrLf
sb.AppendFormat "Total: {0} items", 42

Console.Print sb.ToString()
```

### FileHelper

File operation helper utilities.

```vb
' Write text file
FileHelper.WriteAllText "output.txt", "Hello World"

' Read text file
Dim content As String
content = FileHelper.ReadAllText "input.txt"

' Append content
FileHelper.AppendAllText "log.txt", "New entry" & vbCrLf
```

## 💡 Design Patterns

This package employs multiple design patterns:

- **Factory Pattern** - `FormatterFactory` creates formatter instances
- **Strategy Pattern** - `IOutputFormatter` supports multiple output strategies
- **Observer Pattern** - `DiagnosticEngine` event notifications
- **Template Method** - `IDiagnosticCollector` defines collection flow
- **Layered Architecture** - Core/Data/UI three-layer separation

## 🔌 Dependencies

- TwinBASIC Compiler
- Windows 10+ Operating System
- No administrator privileges required

## 🎯 Technical Highlights

1. **Generic Application** - `DiagnosticResult(Of T)` type safety
2. **Delegate Events** - Asynchronous data collection callbacks
3. **Interface Abstraction** - Easy to extend new collectors and formatters
4. **Smart Refresh** - Three-level refresh mode for performance optimization
5. **Zero Dependencies** - Pure WinAPI implementation

## 📄 License

This project is open source under the MIT License.

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

**Author:** woeoio
**Project:** TwinBASIC System Diagnostic Package
**Version:** 1.0.1

