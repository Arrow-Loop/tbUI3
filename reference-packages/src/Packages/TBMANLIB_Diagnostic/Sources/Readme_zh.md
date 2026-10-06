# TwinBASIC System Diagnostic Package

> 🏆 一款功能完整的 Windows 系统诊断包，提供实时监控和多格式报告导出功能。

## 📦 包简介

本包是一个模块化的 Windows 系统诊断工具集，灵感来源于 Linux 的 `htop` 工具。包内包含完整的诊断数据收集、格式化输出，核心层完全脱离 UI 依赖，可集成到任何 TwinBASIC 项目中。

**核心特性:**

- 🔌 **模块化架构** - 核心引擎与 UI 完全分离，易于集成
- 📊 **11 个诊断类别** - 涵盖 OS、CPU、内存、磁盘、进程等
- 🔄 **三级刷新模式** - Static/Dynamic/SemiDynamic 智能刷新
- 🎨 **多格式输出** - 支持 TEXT、JSON、HTML 三种格式
- 🚀 **零外部依赖** - 仅使用内置 WinAPI 和 TwinBASIC 特性
- 📐 **现代语言特性** - 泛型、委托、接口完整应用
- 🎯 **多 UI 支持** - 核心抽象层支持控制台/GUI/WEB 等多种调用者

## 📁 包结构

```
src/
├── Core/                   # 核心诊断引擎
│   ├── DiagnosticEngine.twin       # 诊断引擎主类
│   └── RefreshMode.twin            # 刷新模式枚举
│
├── Collectors/             # 诊断数据收集器
│   ├── Static/                     # 静态数据（一次获取）
│   │   ├── OSInfoCollector.twin           # 操作系统信息
│   │   ├── CPUInfoCollector.twin          # CPU 信息
│   │   ├── LocaleCollector.twin           # 区域设置
│   │   ├── EnvironmentCollector.twin      # 环境变量
│   │   └── RuntimesCollector.twin         # 已安装运行时
│   ├── Dynamic/                    # 动态数据（每次刷新）
│   │   ├── CPULoadCollector.twin          # CPU 实时负载
│   │   ├── MemoryInfoCollector.twin       # 内存使用情况
│   │   ├── ProcessInfoCollector.twin      # 进程信息
│   │   └── UptimeCollector.twin           # 系统运行时间
│   └── SemiDynamic/                # 半动态数据（可选刷新）
│       ├── DiskInfoCollector.twin          # 磁盘信息
│       └── NetworkInfoCollector.twin       # 网络配置
│
├── Formatters/             # 输出格式化器
│   ├── IOutputFormatter.twin         # 格式化器接口
│   ├── TextFormatter.twin            # 纯文本格式
│   ├── JsonFormatter.twin            # JSON 格式
│   ├── HtmlFormatter.twin            # HTML 格式
│   └── FormatterFactory.twin          # 格式化器工厂
│
├── Interfaces/             # 接口定义
│   ├── IDiagnosticCollector.twin     # 诊断收集器接口
│   └── IOutputFormatter.twin         # 输出格式化器接口
│
├── Generics/               # 泛型容器
│   ├── DiagnosticResult.twin         # 泛型结果容器
│   ├── List.twin                    # 泛型列表
│   ├── Dictionary.twin               # 泛型字典
│   └── KeyValuePair.twin            # 键值对
│
├── Delegates/              # 委托定义
│   └── Delegates.twin               # 事件委托
│
├── Utilities/              # 工具类
│   ├── FormatHelper.twin             # 格式化工具（字节、时间）
│   ├── StringBuilder.twin            # 字符串构建器
│   └── FileHelper.twin               # 文件操作辅助
│
└── WinAPI/                 # Windows API 声明
    ├── Declarations.twin            # API 函数声明
    └── Structures.twin               # 结构体定义
```

## 🚀 快速开始

### 基本用法

```vb
' 引入必要的模块
Imports Core
Imports Collectors.Static
Imports Collectors.Dynamic
Imports Formatters

' 1. 创建诊断引擎
Dim engine As DiagnosticEngine
Set engine = New DiagnosticEngine

' 2. 注册收集器
engine.RegisterCollector New OSInfoCollector
engine.RegisterCollector New CPUInfoCollector
engine.RegisterCollector New MemoryInfoCollector
engine.RegisterCollector New CPULoadCollector
' ... 添加更多收集器

' 3. 运行数据收集
Dim results As List(Of DiagnosticResult)
Set results = engine.RunAll(False)  ' False = 收集完整数据

' 4. 格式化输出
Dim formatter As TextFormatter
Set formatter = New TextFormatter
Console.Print formatter.Format(results)
```

### 使用摘要模式（性能优化）

```vb
' 摘要模式只收集关键数据，适合高频刷新
Dim results As List(Of DiagnosticResult)
Set results = engine.RunAll(True)  ' True = 使用摘要模式
```

### 导出不同格式

```vb
' JSON 格式
Dim jsonFormatter As JsonFormatter
Set jsonFormatter = New JsonFormatter
FileHelper.WriteAllText "report.json", jsonFormatter.Format(results)

' HTML 格式
Dim htmlFormatter As HtmlFormatter
Set htmlFormatter = New HtmlFormatter
FileHelper.WriteAllText "report.html", htmlFormatter.Format(results)
```

### 使用工厂模式

```vb
Dim formatter As IOutputFormatter
Set formatter = FormatterFactory.Create("json")  ' 支持 text, json, html
```

## 📊 诊断类别

| 类别         | 收集器                 | 刷新模式    | 说明                       |
| ------------ | ---------------------- | ----------- | -------------------------- |
| 操作系统信息 | `OSInfoCollector`      | Static      | Windows 版本、构建号、架构 |
| CPU 信息     | `CPUInfoCollector`     | Static      | 处理器名称、核心数、频率   |
| 区域设置     | `LocaleCollector`      | Static      | 语言区域、代码页、时区     |
| 环境变量     | `EnvironmentCollector` | Static      | PATH 等系统环境变量        |
| 已安装运行时 | `RuntimesCollector`    | Static      | .NET、VC++ 等运行时        |
| CPU 实时负载 | `CPULoadCollector`     | Dynamic     | 动态 CPU 使用率监控        |
| 内存使用情况 | `MemoryInfoCollector`  | Dynamic     | 物理内存、虚拟内存统计     |
| 进程信息     | `ProcessInfoCollector` | Dynamic     | 运行进程列表、PID、线程数  |
| 系统运行时间 | `UptimeCollector`      | Dynamic     | 系统启动后运行时长         |
| 磁盘信息     | `DiskInfoCollector`    | SemiDynamic | 逻辑驱动器、空间使用率     |
| 网络配置     | `NetworkInfoCollector` | SemiDynamic | IP 地址、网络适配器        |

## 🏗️ 架构设计

本包采用分层架构设计，核心实现层完全脱离 UI 依赖，支持多种调用者。

### 架构图

```
┌─────────────────────────────────────────────┐
│              UI Layer (调用者)               │
├──────────┬──────────┬──────────┬────────────┤
│ Console  │ GUI      │ Web UI   │ CLI        │
│ TUI      │ WinForms │ HTML/JS  │ Export     │
└────┬─────┴────┬─────┴────┬─────┴────┬───────┘
     │          │          │          │
┌────┴──────────┴──────────┴──────────┴───────┐
│          Core Layer (核心实现)              │
│  ┌──────────────────────────────────────┐  │
│  │   DiagnosticEngine                  │  │
│  │   (注册收集器、数据收集、事件回调)   │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Collectors (Static/Dynamic/...)     │  │
│  │   IDiagnosticCollector 接口         │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Formatters (Text/JSON/HTML)        │  │
│  │   IOutputFormatter 接口              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
     │          │          │          │
┌────┴──────────┴──────────┴──────────┴───────┐
│          Data Layer (数据模型)              │
│  DiagnosticResult(Of T)                    │
│  KeyValuePair(Of String, String)           │
└─────────────────────────────────────────────┘
```

### 架构优势

- 🔌 **插件化扩展** - 新增 UI 无需修改核心代码
- 📱 **多平台覆盖** - 同一核心库服务多种场景
- 🧪 **独立测试** - 核心逻辑与 UI 分离，易于单元测试
- 📦 **模块复用** - 核心库可独立发布到 TwinBASIC 包管理器

## 🔧 高级特性

### 自定义收集器

```vb
' 实现 IDiagnosticCollector 接口
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

        ' 添加自定义数据
        result.AddItem "Custom Metric 1", "Value 1"
        result.AddItem "Custom Metric 2", "Value 2"

        Set IDiagnosticCollector_Collect = result
    End Function
End Class
```

### 自定义格式化器

```vb
' 实现 IOutputFormatter 接口
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
            ' ... 自定义格式化逻辑
        Next i

        Set IOutputFormatter_Format = sb.ToString()
    End Function
End Class
```

### 事件处理

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

## 📖 工具类说明

### FormatHelper

格式化辅助工具，提供友好的数据显示。

```vb
' 格式化字节数
FormatHelper.FormatBytes(17592186018592)    ' → "16.00 TB"
FormatHelper.FormatBytes(17592186018592, 0) ' → "16 TB"

' 格式化时间（毫秒）
FormatHelper.FormatUptime(345678901)  ' → "4d 00:00:01"

' 对齐文本
FormatHelper.PadLeft("Test", 10)       ' → "      Test"
FormatHelper.PadRight("Test", 10)      ' → "Test      "
```

### StringBuilder

高效的字符串构建器，减少内存分配。

```vb
Dim sb As StringBuilder
Set sb = New StringBuilder

sb.Append "Line 1" & vbCrLf
sb.Append "Line 2" & vbCrLf
sb.AppendFormat "Total: {0} items", 42

Console.Print sb.ToString()
```

### FileHelper

文件操作辅助工具。

```vb
' 写入文本文件
FileHelper.WriteAllText "output.txt", "Hello World"

' 读取文本文件
Dim content As String
content = FileHelper.ReadAllText "input.txt"

' 追加内容
FileHelper.AppendAllText "log.txt", "New entry" & vbCrLf
```

## 💡 设计模式

本包采用多种设计模式：

- **工厂模式** - `FormatterFactory` 创建格式化器实例
- **策略模式** - `IOutputFormatter` 支持多种输出策略
- **观察者模式** - `DiagnosticEngine` 事件通知
- **模板方法** - `IDiagnosticCollector` 定义收集流程
- **分层架构** - 核心/数据/UI 三层分离

## 🔌 依赖要求

- TwinBASIC 编译器
- Windows 10+ 操作系统
- 无需管理员权限

## 🎯 技术亮点

1. **泛型应用** - `DiagnosticResult(Of T)` 类型安全
2. **委托事件** - 异步数据收集回调
3. **接口抽象** - 易于扩展新收集器和格式化器
4. **智能刷新** - 三级刷新模式优化性能
5. **零依赖** - 纯 WinAPI 实现

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**作者:** woeoio
**项目:** TwinBASIC System Diagnostic Package
**版本:** 1.0.1

