# cListboxHScroll - ListBox 水平滚动条组件

为 Twinbasic ListBox 控件添加完整的水平滚动条支持。

`Author: woeoio@qq.com`

## 功能特性

- 自动计算 ListBox 中所有文本项的最大宽度
- 显示和管理水平滚动条
- 支持所有滚动操作（行滚动、页面滚动、拖动滑块等）
- 自动适应字体变化
- 通过子类化拦截滚动消息，实现平滑滚动

## 基本用法

```vb
Class Form1

    Sub New()
    End Sub

    Dim L1 As New cListboxHScroll
    
    Private Sub Form_Load()
        ' 添加一些长文本测试项
        For i As Long = 0 To 20
            List1.AddItem("这是一段很长的测试文本，用于测试水平滚动条功能是否正常工作 - 项目 " & i)
        Next

        ' 显示水平滚动条
        L1.Show(List1)
    End Sub

    Private Sub Form_Terminate()
        ' 移除子类化
        L1.UnShow()
    End Sub

End Class
```

## API 说明

### 方法

#### `Show(ByRef ListBoxInst As Object)`
为指定的 ListBox 控件启用水平滚动条功能。

- **参数**: `ListBoxInst` - ListBox 控件实例

#### `UnShow()`
移除水平滚动条功能，清理子类化。

## 工作原理

1. **初始化阶段** (`Show` 方法):
   - 显示水平滚动条
   - 遍历所有列表项，使用 GDI 函数计算最大文本宽度
   - 设置 `LB_SETHORIZONTALEXTENT` 消息定义水平滚动范围
   - 安装子类化窗口过程以处理滚动消息

2. **滚动处理** (`ListBoxSubclassProc`):
   - 拦截 `WM_HSCROLL` 消息
   - 处理各种滚动操作类型:
     - `SB_LINELEFT/SB_LINERIGHT`: 左右微调（20 像素）
     - `SB_PAGELEFT/SB_PAGERIGHT`: 左右翻页
     - `SB_THUMBTRACK/SB_THUMBPOSITION`: 拖动滑块
     - `SB_LEFT/SB_RIGHT`: 跳转到首/尾
   - 调用默认处理程序执行实际滚动

3. **清理阶段** (`UnShow` 方法):
   - 移除子类化窗口过程
   - 释放相关资源

## 依赖

需要 Windows API 支持:
- `user32.dll`: SendMessage, GetDC, ReleaseDC, ScrollBar 相关函数
- `gdi32.dll`: GetTextExtentPoint32, SelectObject
- `comctl32.dll`: SetWindowSubclass, RemoveWindowSubclass, DefSubclassProc

## 注意事项

- 在使用完毕后必须调用 `UnShow()` 方法移除子类化
- 窗口销毁时会自动清理（通过 `WM_DESTROY` 消息）
- 仅支持 Windows 平台
- 控件必须具备有效的 `hWnd` 属性
