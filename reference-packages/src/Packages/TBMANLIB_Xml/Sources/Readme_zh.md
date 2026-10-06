# TBMANLIB Xml - TwinBASIC XML 库

一个功能完整的 XML 解析和操作库，专为 TwinBASIC 开发环境设计。

## 功能特性

- **XML 解析**：支持从字符串或文件解析 XML 文档
- **文档构建**：程序化创建和修改 XML 结构
- **XPath 查询**：完整的 XPath 查询支持，强大的元素选择功能
- **属性操作**：获取、设置、删除元素属性
- **命名空间支持**：兼容带命名空间的 XML 文档
- **CDATA 支持**：正确处理 CDATA 区块
- **注释支持**：保留 XML 注释
- **格式化输出**：支持紧凑和美化两种序列化格式
- **UTF-8 编码**：完整的 UTF-8 编码支持（基于 Windows API）
- **文件 I/O**：直接读写 XML 文件（带 BOM）

## 核心类

### cXml - XML 文档类

主文档类，用于解析、创建和操作 XML 文档。

#### 属性

| 属性          | 类型     | 说明                              |
| ------------- | -------- | --------------------------------- |
| `XmlString`   | String   | 获取或设置 XML 字符串（自动解析） |
| `Encoding`    | String   | 获取或设置文档编码（默认 UTF-8）  |
| `Version`     | String   | 获取或设置 XML 版本（默认 1.0）   |
| `RootElement` | cXmlNode | 获取根元素节点                    |
| `Document`    | cXmlNode | 获取文档节点                      |
| `Initialized` | Boolean  | 文档是否已初始化                  |

#### 方法

**解析和加载**

```vb
' 从字符串解析 XML
Dim xml As New cXml
Dim success As Boolean
success = xml.Parse("<?xml version='1.0'?><root><item>text</item></root>")

' 从文件加载 XML
success = xml.LoadFromFile("data.xml")
```

**创建新文档**

```vb
' 创建新文档
xml.CreateNew "root"
```

**保存文档**

```vb
' 保存到文件（带 XML 声明）
success = xml.SaveToFile("output.xml", True)

' 保存到文件（不带声明）
success = xml.SaveToFile("output.xml", False)

' 保存到文件（美化格式，带声明）
success = xml.SaveToFile("output.xml", True, True)

' 保存到文件（美化格式，4空格缩进）
success = xml.SaveToFile("output.xml", True, True, "    ")
```

**元素选择**

```vb
' 选择单个元素（简单路径语法）
Dim node As cXmlNode
Set node = xml.SelectElement("/root/item")
Set node = xml.SelectElement("/root/level1/level2")

' 选择所有同名元素
Dim items As Collection
Set items = xml.SelectElements("item")
```

**XPath 查询**（新增）

```vb
' 使用 XPath 选择节点
Dim nodes As Collection
Set nodes = xml.XPath("//book[@category='fiction']")
Set nodes = xml.XPath("/catalog/book[1]")
Set nodes = xml.XPath("//item[@price>100]")

' 选择单个节点
Dim node As cXmlNode
Set node = xml.XPathSingle("/store/product[@id='123']")

' 使用 XPath 获取文本内容
Dim text As String
text = xml.XPathText("//book[@id='1']/title")

' 使用 XPath 获取属性
Dim attrValue As String
attrValue = xml.XPathAttribute("//product[1]", "category")
```

**元素操作**

```vb
' 添加元素
Dim newNode As cXmlNode
Set newNode = xml.AddElement("/root", "child")

' 移除元素
Dim removed As Boolean
removed = xml.RemoveElement("/root/child")
```

**获取和设置内容**

```vb
' 获取元素文本
Dim text As String
text = xml.GetElementText("/root/item")

' 设置元素文本
xml.SetElementText "/root/item", "new value"

' 获取属性
Dim attrValue As String
attrValue = xml.GetAttribute("/root/item", "id")

' 设置属性
xml.SetAttribute "/root/item", "id", "123"

' 删除属性
xml.RemoveAttribute "/root/item", "id"
```

**序列化**

```vb
' 紧凑格式
Dim xmlString As String
xmlString = xml.ToXmlString()

' 带声明
xmlString = xml.ToXmlString(True)

' 美化格式
xmlString = xml.ToXmlString(True, True, "  ")
```

**其他操作**

```vb
' 克隆文档
Dim cloned As cXml
Set cloned = xml.Clone()

' 合并文档
xml.Merge anotherXml

' 验证文档
Dim isValid As Boolean
isValid = xml.Validate()
```

---

### cXmlNode - XML 节点类

表示 XML 文档中的单个节点。

#### 属性

| 属性         | 类型        | 说明                                  |
| ------------ | ----------- | ------------------------------------- |
| `Name`       | String      | 节点名称                              |
| `NodeType`   | XmlNodeType | 节点类型（Element、Text、Comment 等） |
| `Value`      | String      | 节点值（用于 Text、Comment、CDATA）   |
| `Attributes` | Collection  | 属性集合（键值对存储）                |
| `ChildNodes` | Collection  | 子节点集合                            |
| `Parent`     | cXmlNode    | 父节点引用                            |

#### 节点类型

```vb
Public Enum XmlNodeType
    None = 0
    Element = 1
    Attribute = 2
    Text = 3
    CData = 4
    Comment = 8
    Document = 9
    DocumentFragment = 11
    Notation = 12
End Enum
```

#### 方法

```vb
' 属性操作
Dim value As String
value = node.GetAttribute("id")
node.SetAttribute "id", "123"
node.RemoveAttribute "id"

' 获取子节点
Dim child As cXmlNode
Set child = node.GetChildNode("childName")

' 获取所有同名子节点
Dim children As Collection
Set children = node.GetChildNodesByName("item")

' 从节点上下文执行 XPath 查询
Dim results As Collection
Set results = node.XPath("./child[@type='active']")

Dim singleResult As cXmlNode
Set singleResult = node.XPathSingle("./item[1]")

Dim text As String
text = node.XPathText("./title")

Dim attr As String
attr = node.XPathAttribute("./item", "id")
```

---

## XPath 查询指南

本库提供完整的 XPath 1.0 支持，以下是详细用法：

### 基本路径语法

| 表达式 | 说明 | 示例 |
|--------|------|------|
| `/` | 从根节点开始 | `/catalog/book` |
| `//` | 匹配任意深度的后代 | `//item` 匹配所有 item 元素 |
| `.` | 当前节点 | `./child` |
| `..` | 父节点 | `../parent` |
| `*` | 通配符，匹配任意元素 | `/root/*` |

### 索引选择

```vb
' 选择第一个元素
Dim first As cXmlNode
Set first = xml.XPathSingle("/root/item[1]")

' 选择最后一个元素
Dim last As cXmlNode
Set last = xml.XPathSingle("/root/item[last()]")

' 选择倒数第二个
Dim secondLast As cXmlNode
Set secondLast = xml.XPathSingle("/root/item[last()-1]")
```

### 属性谓词

```vb
' 选择有特定属性的元素
Dim nodes As Collection
Set nodes = xml.XPath("//book[@id]")              ' 有 id 属性的 book
Set nodes = xml.XPath("//book[@id='1']")          ' id 等于 '1' 的 book
Set nodes = xml.XPath("//book[@id!='1']")         ' id 不等于 '1' 的 book
Set nodes = xml.XPath("//product[@price>100]")    ' price 大于 100 的 product
Set nodes = xml.XPath("//product[@price<=50]")    ' price 小于等于 50 的 product
```

### 文本匹配

```vb
' 根据文本内容选择元素
Dim nodes As Collection
Set nodes = xml.XPath("//user[text()='John']")
Set nodes = xml.XPath("//title[.='TwinBASIC']")

' 获取文本内容
Dim text As String
text = xml.XPathText("//book[1]/title")           ' 获取第一本书的标题文本
text = xml.XPathText("//user[@id='1']/email")     ' 获取指定用户的 email
```

### XPath 函数

```vb
' contains() - 包含子串
Dim users As Collection
Set users = xml.XPath("//user[contains(@email, '@gmail.com')]")

' starts-with() - 以某字符串开头
Set users = xml.XPath("//user[starts-with(@name, '张')]")

' not() - 否定
Set users = xml.XPath("//user[not(@active)]")          ' 没有 active 属性的用户
Set users = xml.XPath("//user[not(contains(@email, 'test'))]")

' last() - 最后一个
Set item = xml.XPathSingle("//item[last()]")
```

### 逻辑运算符

```vb
' and - 同时满足多个条件
Dim items As Collection
Set items = xml.XPath("//product[@category='books' and @price<50]")
Set items = xml.XPath("//item[@status='active' and @priority>5]")

' or - 满足任一条件
Set items = xml.XPath("//item[@type='A' or @type='B']")

' 多重谓词（隐式 and）
Set items = xml.XPath("//product[@category='books'][@price<50]")
```

### 复杂查询示例

```vb
Dim xml As New cXml
xml.Parse "<store>" & _
          "  <product id='1' category='books' price='29.99'>" & _
          "    <name>编程入门</name>" & _
          "    <author>张三</author>" & _
          "  </product>" & _
          "  <product id='2' category='electronics' price='199.99'>" & _
          "    <name>无线耳机</name>" & _
          "    <brand>TechCorp</brand>" & _
          "  </product>" & _
          "</store>"

' 查询所有书籍
Dim books As Collection
Set books = xml.XPath("//product[@category='books']")

' 查询价格大于 100 的电子产品
Dim expensive As Collection
Set expensive = xml.XPath("//product[@category='electronics'][@price>100]")

' 获取第一本书的作者
Dim author As String
author = xml.XPathText("//product[@category='books'][1]/author")

' 查询名称包含"耳机"的产品
Dim earphones As Collection
Set earphones = xml.XPath("//product[contains(name, '耳机')]")

' 从节点上下文查询（相对路径）
Dim firstProduct As cXmlNode
Set firstProduct = xml.XPathSingle("//product[1]")
If Not firstProduct Is Nothing Then
    ' 在当前 product 节点下查找 name 子元素
    Dim name As String
    name = firstProduct.XPathText("./name")
    
    ' 获取属性
    Dim price As String
    price = firstProduct.XPathAttribute(".", "price")
End If
```

---

## 使用示例

### 示例 1：解析 XML 字符串

```vb
Dim xml As New cXml

Dim xmlText As String
xmlText = "<?xml version='1.0' encoding='UTF-8'?>" & _
          "<catalog>" & _
          "  <book id='1'>" & _
          "    <title>VB6 编程</title>" & _
          "    <author>张三</author>" & _
          "  </book>" & _
          "  <book id='2'>" & _
          "    <title>TwinBASIC 指南</title>" & _
          "    <author>李四</author>" & _
          "  </book>" & _
          "</catalog>"

If xml.Parse(xmlText) Then
    ' 获取第一本书的标题
    Dim title As String
    title = xml.GetElementText("/catalog/book/title")
    Debug.Print "第一本书：" & title  ' 输出：VB6 编程

    ' 获取第一本书的作者
    Dim author As String
    author = xml.GetElementText("/catalog/book/author")
    Debug.Print "第一本书作者：" & author  ' 输出：张三

    ' 获取属性
    Dim bookId As String
    bookId = xml.GetAttribute("/catalog/book", "id")
    Debug.Print "第一本书ID：" & bookId  ' 输出：1

    ' 获取第二本书的信息（使用 SelectElements 和 With）
    With xml.SelectElements("book")
        If .Count >= 2 Then
            Debug.Print "第二本书：" & .Item(2).GetChildNode("title").GetChildNode("#text").Value  ' 输出：TwinBASIC 指南
            Debug.Print "第二本书作者：" & .Item(2).GetChildNode("author").GetChildNode("#text").Value  ' 输出：李四
            Debug.Print "第二本书ID：" & .Item(2).GetAttribute("id")  ' 输出：2
        End If
    End With

    ' 更简洁的写法（使用 Text 属性）
    With xml.SelectElements("book")
        If .Count >= 2 Then
            Dim book2 As cXmlNode
            Set book2 = .Item(2)
            Debug.Print "第二本书：" & book2.GetChildNode("title").Text   ' 输出：TwinBASIC 指南
            Debug.Print "第二本书作者：" & book2.GetChildNode("author").Text  ' 输出：李四
            Debug.Print "第二本书ID：" & book2.GetAttribute("id")  ' 输出：2
        End If
    End With
End If
```

### 示例 2：创建 XML 文档

```vb
Dim xml As New cXml

' 创建根元素
xml.CreateNew "configuration"

' 添加设置项
Dim setting1 As cXmlNode
Set setting1 = xml.AddElement("/configuration", "setting")
setting1.SetAttribute "name", "Database"
setting1.SetAttribute "value", "MyDB"

Dim setting2 As cXmlNode
Set setting2 = xml.AddElement("/configuration", "setting")
setting2.SetAttribute "name", "Timeout"
setting2.SetAttribute "value", "30"

' 添加带有文本内容的元素
Dim desc As cXmlNode
Set desc = xml.AddElement("/configuration", "description")

' 创建文本节点
Dim textNode As New cXmlNode
textNode.NodeType = mXml.XmlNodeType.Text
textNode.Value = "应用程序配置文件"
textNode.Name = "#text"
Set textNode.Parent = desc
desc.ChildNodes.Add textNode

' 保存到文件
xml.SaveToFile "config.xml", True
```

生成的 XML：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <setting name="Database" value="MyDB"/>
  <setting name="Timeout" value="30"/>
  <description>应用程序配置文件</description>
</configuration>
```

### 示例 3：修改现有 XML

```vb
Dim xml As New cXml

' 加载 XML
If xml.LoadFromFile("data.xml") Then
    ' 修改元素文本
    xml.SetElementText "/root/item", "新值"

    ' 修改属性
    xml.SetAttribute "/root/item", "id", "999"

    ' 添加新元素
    Dim newItem As cXmlNode
    Set newItem = xml.AddElement("/root", "newItem")
    newItem.SetAttribute "type", "added"

    ' 添加文本内容
    Dim textNode As New cXmlNode
    textNode.NodeType = mXml.XmlNodeType.Text
    textNode.Value = "新增项目"
    textNode.Name = "#text"
    Set textNode.Parent = newItem
    newItem.ChildNodes.Add textNode

    ' 保存修改
    xml.SaveToFile "data_modified.xml", True
End If
```

### 示例 4：处理多个同名元素

```vb
Dim xml As New cXml
xml.Parse "<root><item>1</item><item>2</item><item>3</item></root>"

' 获取所有 item 元素
Dim items As Collection
Set items = xml.SelectElements("item")

Debug.Print "共有 " & items.Count & " 个 item 元素"

Dim i As Long
For i = 1 To items.Count
    Dim item As cXmlNode
    Set item = items(i)

    ' 获取文本内容（通过子文本节点）
    If item.ChildNodes.Count > 0 Then
        Debug.Print "Item " & i & ": " & item.ChildNodes(1).Value
    End If
Next i
```

### 示例 5：使用 CDATA

```vb
Dim xml As New cXml
xml.Parse "<root><code><![CDATA[<html><body>Hello</body></html>]]></code></root>"

' 获取 CDATA 内容
Dim code As String
code = xml.GetElementText("/root/code")
Debug.Print code  ' 输出：<html><body>Hello</body></html>
```

---

## 文件格式

### 编码支持

- **读取**：自动检测 UTF-8 BOM，支持无 BOM 的 UTF-8 文件
- **写入**：始终写入 UTF-8 BOM，确保兼容性

### 文件示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1" available="true">
    <title>编程入门</title>
    <author>王五</author>
    <price>59.00</price>
  </book>
  <!-- 更多书籍 -->
</library>
```

---

## 技术实现

### UTF-8 转换

本库使用 Windows API 进行 UTF-8 编码转换，而非依赖 TwinBASIC 内置函数：

```vb
' Windows API 声明
Private Declare PtrSafe Function WideCharToMultiByte Lib "kernel32" (...)
Private Declare PtrSafe Function MultiByteToWideChar Lib "kernel32" (...)
```

这确保了：

- 更好的性能
- 与 Windows 原生行为一致
- 避免编码问题

### 错误处理

所有公共方法都包含错误处理，通过 `On Error` 机制捕获异常并返回适当的状态或默认值。

---

## 限制与注意事项

1. **XPath 支持**：通过 `XPath()` 和 `XPathSingle()` 方法提供完整的 XPath 查询支持，包括：
   - 基本路径导航：`/root/child`、`root/child`
   - 子孙选择：`//item`（匹配任意深度）
   - 通配符：`/root/*`、`//*`
   - 索引选择：`/root/item[1]`、`/root/item[last()]`
   - 属性谓词：`[@id]`、`[@id='value']`、`[@price>10]`
   - 文本匹配：`[text()='value']`
   - 函数：`contains()`、`starts-with()`、`not()`
   - 逻辑运算符：`and`、`or`
   - 多重谓词：`[@id='1'][@name='test']`

2. **元素文本**：Element 节点的文本内容需要作为 Text 类型的子节点存储，直接设置 `Value` 属性不会被序列化。

3. **命名空间**：解析时保留命名空间前缀，但不提供专门的命名空间管理功能。

---

## 项目结构

```
Xml/
├── Src/
│   ├── cXml.twin       ' XML 文档类
│   ├── cXmlNode.twin   ' XML 节点类
│   ├── mXml.twin       ' 模块（枚举、常量、工具函数）
│   ├── mXPath.twin     ' XPath 查询引擎模块
│   └── mXmlTests.twin  ' 单元测试
├── test_output.xml     ' 测试输出文件
├── Readme.md           ' 英文说明文档
└── Readme_zh.md        ' 本说明文档
```

---

## 作者信息

- **作者**：woeoo (邓伟)
- **邮箱**：215879458@qq.com
- **网站**：https://vb6.pro
- **版本**：1.0.0
- **日期**：2026-02-07

---

## 许可证

本项目为开源项目，可自由使用和修改。
