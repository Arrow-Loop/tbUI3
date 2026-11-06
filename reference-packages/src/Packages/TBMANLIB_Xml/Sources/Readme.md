# TBMANLIB Xml - TwinBASIC XML Library

A full-featured XML parsing and manipulation library designed for the TwinBASIC development environment.

## Features

- **XML Parsing**: Parse XML documents from strings or files
- **Document Building**: Programmatically create and modify XML structures
- **XPath Support**: Full XPath query support for powerful element selection
- **Attribute Operations**: Get, set, and delete element attributes
- **Namespace Support**: Compatible with XML documents containing namespaces
- **CDATA Support**: Properly handle CDATA sections
- **Comment Support**: Preserve XML comments
- **Formatted Output**: Support for both compact and pretty-print serialization
- **UTF-8 Encoding**: Complete UTF-8 encoding support (based on Windows API)
- **File I/O**: Direct read/write of XML files (with BOM)

## Core Classes

### cXml - XML Document Class

The main document class for parsing, creating, and manipulating XML documents.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `XmlString` | String | Get or set XML string (auto-parses) |
| `Encoding` | String | Get or set document encoding (default UTF-8) |
| `Version` | String | Get or set XML version (default 1.0) |
| `RootElement` | cXmlNode | Get the root element node |
| `Document` | cXmlNode | Get the document node |
| `Initialized` | Boolean | Whether the document is initialized |

#### Methods

**Parsing and Loading**
```vb
' Parse XML from string
Dim xml As New cXml
Dim success As Boolean
success = xml.Parse("<?xml version='1.0'?><root><item>text</item></root>")

' Load XML from file
success = xml.LoadFromFile("data.xml")
```

**Creating New Documents**
```vb
' Create a new document
xml.CreateNew "root"
```

**Saving Documents**
```vb
' Save to file (with XML declaration)
success = xml.SaveToFile("output.xml", True)

' Save to file (without declaration)
success = xml.SaveToFile("output.xml", False)

' Save to file (pretty print, with declaration)
success = xml.SaveToFile("output.xml", True, True)

' Save to file (pretty print, 4 spaces indent)
success = xml.SaveToFile("output.xml", True, True, "    ")
```

**Element Selection**
```vb
' Select a single element (simple path syntax)
Dim node As cXmlNode
Set node = xml.SelectElement("/root/item")
Set node = xml.SelectElement("/root/level1/level2")

' Select all elements with the same name
Dim items As Collection
Set items = xml.SelectElements("item")
```

**XPath Queries** (NEW)
```vb
' Select nodes using XPath
Dim nodes As Collection
Set nodes = xml.XPath("//book[@category='fiction']")
Set nodes = xml.XPath("/catalog/book[1]")
Set nodes = xml.XPath("//item[@price>100]")

' Select single node
Dim node As cXmlNode
Set node = xml.XPathSingle("/store/product[@id='123']")

' Get text content using XPath
Dim text As String
text = xml.XPathText("//book[@id='1']/title")

' Get attribute using XPath
Dim attrValue As String
attrValue = xml.XPathAttribute("//product[1]", "category")
```

**Element Manipulation**
```vb
' Add an element
Dim newNode As cXmlNode
Set newNode = xml.AddElement("/root", "child")

' Remove an element
Dim removed As Boolean
removed = xml.RemoveElement("/root/child")
```

**Getting and Setting Content**
```vb
' Get element text
Dim text As String
text = xml.GetElementText("/root/item")

' Set element text
xml.SetElementText "/root/item", "new value"

' Get attribute
Dim attrValue As String
attrValue = xml.GetAttribute("/root/item", "id")

' Set attribute
xml.SetAttribute "/root/item", "id", "123"

' Remove attribute
xml.RemoveAttribute "/root/item", "id"
```

**Serialization**
```vb
' Compact format
Dim xmlString As String
xmlString = xml.ToXmlString()

' With declaration
xmlString = xml.ToXmlString(True)

' Pretty-print format
xmlString = xml.ToXmlString(True, True, "  ")
```

**Other Operations**
```vb
' Clone document
Dim cloned As cXml
Set cloned = xml.Clone()

' Merge documents
xml.Merge anotherXml

' Validate document
Dim isValid As Boolean
isValid = xml.Validate()
```

---

### cXmlNode - XML Node Class

Represents a single node in an XML document.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Name` | String | Node name |
| `NodeType` | XmlNodeType | Node type (Element, Text, Comment, etc.) |
| `Value` | String | Node value (for Text, Comment, CDATA) |
| `Attributes` | Collection | Attribute collection (key-value pairs) |
| `ChildNodes` | Collection | Child node collection |
| `Parent` | cXmlNode | Parent node reference |

#### Node Types

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

#### Methods

```vb
' Attribute operations
Dim value As String
value = node.GetAttribute("id")
node.SetAttribute "id", "123"
node.RemoveAttribute "id"

' Get child node
Dim child As cXmlNode
Set child = node.GetChildNode("childName")

' Get all child nodes with the same name
Dim children As Collection
Set children = node.GetChildNodesByName("item")

' XPath queries from node context
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

## XPath Query Guide

This library provides full XPath 1.0 support. Here is a detailed guide:

### Basic Path Syntax

| Expression | Description | Example |
|------------|-------------|---------|
| `/` | Start from root | `/catalog/book` |
| `//` | Match descendants at any depth | `//item` matches all item elements |
| `.` | Current node | `./child` |
| `..` | Parent node | `../parent` |
| `*` | Wildcard, matches any element | `/root/*` |

### Index Selection

```vb
' Select first element
Dim first As cXmlNode
Set first = xml.XPathSingle("/root/item[1]")

' Select last element
Dim last As cXmlNode
Set last = xml.XPathSingle("/root/item[last()]")

' Select second to last
Dim secondLast As cXmlNode
Set secondLast = xml.XPathSingle("/root/item[last()-1]")
```

### Attribute Predicates

```vb
' Select elements with specific attributes
Dim nodes As Collection
Set nodes = xml.XPath("//book[@id]")              ' books with id attribute
Set nodes = xml.XPath("//book[@id='1']")          ' books with id = '1'
Set nodes = xml.XPath("//book[@id!='1']")         ' books with id != '1'
Set nodes = xml.XPath("//product[@price>100]")    ' products with price > 100
Set nodes = xml.XPath("//product[@price<=50]")    ' products with price <= 50
```

### Text Matching

```vb
' Select elements by text content
Dim nodes As Collection
Set nodes = xml.XPath("//user[text()='John']")
Set nodes = xml.XPath("//title[.='TwinBASIC']")

' Get text content
Dim text As String
text = xml.XPathText("//book[1]/title")           ' Get first book's title
text = xml.XPathText("//user[@id='1']/email")     ' Get specific user's email
```

### XPath Functions

```vb
' contains() - substring match
Dim users As Collection
Set users = xml.XPath("//user[contains(@email, '@gmail.com')]")

' starts-with() - starts with string
Set users = xml.XPath("//user[starts-with(@name, 'John')]")

' not() - negation
Set users = xml.XPath("//user[not(@active)]")          ' Users without active attribute
Set users = xml.XPath("//user[not(contains(@email, 'test'))]")

' last() - last element
Set item = xml.XPathSingle("//item[last()]")
```

### Logical Operators

```vb
' and - multiple conditions
Dim items As Collection
Set items = xml.XPath("//product[@category='books' and @price<50]")
Set items = xml.XPath("//item[@status='active' and @priority>5]")

' or - either condition
Set items = xml.XPath("//item[@type='A' or @type='B']")

' Multiple predicates (implicit and)
Set items = xml.XPath("//product[@category='books'][@price<50]")
```

### Complex Query Examples

```vb
Dim xml As New cXml
xml.Parse "<store>" & _
          "  <product id='1' category='books' price='29.99'>" & _
          "    <name>Programming 101</name>" & _
          "    <author>John Doe</author>" & _
          "  </product>" & _
          "  <product id='2' category='electronics' price='199.99'>" & _
          "    <name>Wireless Earphones</name>" & _
          "    <brand>TechCorp</brand>" & _
          "  </product>" & _
          "</store>"

' Query all books
Dim books As Collection
Set books = xml.XPath("//product[@category='books']")

' Query expensive electronics
Dim expensive As Collection
Set expensive = xml.XPath("//product[@category='electronics'][@price>100]")

' Get first book's author
Dim author As String
author = xml.XPathText("//product[@category='books'][1]/author")

' Query products with "earphone" in name
Dim earphones As Collection
Set earphones = xml.XPath("//product[contains(name, 'Earphone')]")

' Query from node context (relative path)
Dim firstProduct As cXmlNode
Set firstProduct = xml.XPathSingle("//product[1]")
If Not firstProduct Is Nothing Then
    ' Find name child element within current product node
    Dim name As String
    name = firstProduct.XPathText("./name")
    
    ' Get attribute
    Dim price As String
    price = firstProduct.XPathAttribute(".", "price")
End If
```

---

## Usage Examples

### Example 1: Parsing XML String

```vb
Dim xml As New cXml

Dim xmlText As String
xmlText = "<?xml version='1.0' encoding='UTF-8'?>" & _
          "<catalog>" & _
          "  <book id='1'>" & _
          "    <title>VB6 Programming</title>" & _
          "    <author>Zhang San</author>" & _
          "  </book>" & _
          "  <book id='2'>" & _
          "    <title>TwinBASIC Guide</title>" & _
          "    <author>Li Si</author>" & _
          "  </book>" & _
          "</catalog>"

If xml.Parse(xmlText) Then
    ' Get the first book's title
    Dim title As String
    title = xml.GetElementText("/catalog/book/title")
    Debug.Print "First book: " & title  ' Output: VB6 Programming
    
    ' Get the first book's author
    Dim author As String
    author = xml.GetElementText("/catalog/book/author")
    Debug.Print "First book author: " & author  ' Output: Zhang San
    
    ' Get attribute
    Dim bookId As String
    bookId = xml.GetAttribute("/catalog/book", "id")
    Debug.Print "First book ID: " & bookId  ' Output: 1

    ' Get the second book info (using SelectElements and With)
    With xml.SelectElements("book")
        If .Count >= 2 Then
            Debug.Print "Second book: " & .Item(2).GetChildNode("title").GetChildNode("#text").Value  ' Output: TwinBASIC Guide
            Debug.Print "Second book author: " & .Item(2).GetChildNode("author").GetChildNode("#text").Value  ' Output: Li Si
            Debug.Print "Second book ID: " & .Item(2).GetAttribute("id")  ' Output: 2
        End If
    End With

    ' More concise version (using Text property)
    With xml.SelectElements("book")
        If .Count >= 2 Then
            Dim book2 As cXmlNode
            Set book2 = .Item(2)
            Debug.Print "Second book: " & book2.GetChildNode("title").Text   ' Output: TwinBASIC Guide
            Debug.Print "Second book author: " & book2.GetChildNode("author").Text  ' Output: Li Si
            Debug.Print "Second book ID: " & book2.GetAttribute("id")  ' Output: 2
        End If
    End With
End If
```

### Example 2: Creating XML Document

```vb
Dim xml As New cXml

' Create root element
xml.CreateNew "configuration"

' Add settings
Dim setting1 As cXmlNode
Set setting1 = xml.AddElement("/configuration", "setting")
setting1.SetAttribute "name", "Database"
setting1.SetAttribute "value", "MyDB"

Dim setting2 As cXmlNode
Set setting2 = xml.AddElement("/configuration", "setting")
setting2.SetAttribute "name", "Timeout"
setting2.SetAttribute "value", "30"

' Add element with text content
Dim desc As cXmlNode
Set desc = xml.AddElement("/configuration", "description")

' Create text node
Dim textNode As New cXmlNode
textNode.NodeType = mXml.XmlNodeType.Text
textNode.Value = "Application configuration file"
textNode.Name = "#text"
Set textNode.Parent = desc
desc.ChildNodes.Add textNode

' Save to file
xml.SaveToFile "config.xml", True
```

Generated XML:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <setting name="Database" value="MyDB"/>
  <setting name="Timeout" value="30"/>
  <description>Application configuration file</description>
</configuration>
```

### Example 3: Modifying Existing XML

```vb
Dim xml As New cXml

' Load XML
If xml.LoadFromFile("data.xml") Then
    ' Modify element text
    xml.SetElementText "/root/item", "new value"
    
    ' Modify attribute
    xml.SetAttribute "/root/item", "id", "999"
    
    ' Add new element
    Dim newItem As cXmlNode
    Set newItem = xml.AddElement("/root", "newItem")
    newItem.SetAttribute "type", "added"
    
    ' Add text content
    Dim textNode As New cXmlNode
    textNode.NodeType = mXml.XmlNodeType.Text
    textNode.Value = "New item"
    textNode.Name = "#text"
    Set textNode.Parent = newItem
    newItem.ChildNodes.Add textNode
    
    ' Save modifications
    xml.SaveToFile "data_modified.xml", True
End If
```

### Example 4: Handling Multiple Elements with Same Name

```vb
Dim xml As New cXml
xml.Parse "<root><item>1</item><item>2</item><item>3</item></root>"

' Get all item elements
Dim items As Collection
Set items = xml.SelectElements("item")

Debug.Print "Total " & items.Count & " item elements"

Dim i As Long
For i = 1 To items.Count
    Dim item As cXmlNode
    Set item = items(i)
    
    ' Get text content (via child text node)
    If item.ChildNodes.Count > 0 Then
        Debug.Print "Item " & i & ": " & item.ChildNodes(1).Value
    End If
Next i
```

### Example 5: Using CDATA

```vb
Dim xml As New cXml
xml.Parse "<root><code><![CDATA[<html><body>Hello</body></html>]]></code></root>"

' Get CDATA content
Dim code As String
code = xml.GetElementText("/root/code")
Debug.Print code  ' Output: <html><body>Hello</body></html>
```

---

## File Format

### Encoding Support

- **Reading**: Auto-detect UTF-8 BOM, supports BOM-less UTF-8 files
- **Writing**: Always writes UTF-8 BOM for compatibility

### File Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1" available="true">
    <title>Programming Basics</title>
    <author>Wang Wu</author>
    <price>59.00</price>
  </book>
  <!-- More books -->
</library>
```

---

## Technical Implementation

### UTF-8 Conversion

This library uses Windows API for UTF-8 encoding conversion instead of relying on TwinBASIC built-in functions:

```vb
' Windows API declarations
Private Declare PtrSafe Function WideCharToMultiByte Lib "kernel32" (...)
Private Declare PtrSafe Function MultiByteToWideChar Lib "kernel32" (...)
```

This ensures:
- Better performance
- Consistency with Windows native behavior
- Avoidance of encoding issues

### Error Handling

All public methods include error handling using the `On Error` mechanism to catch exceptions and return appropriate status or default values.

---

## Limitations and Notes

1. **XPath Support**: Full XPath query support via `XPath()` and `XPathSingle()` methods, including:
   - Basic path navigation: `/root/child`, `root/child`
   - Descendant selection: `//item` (matches at any depth)
   - Wildcards: `/root/*`, `//*`
   - Index selection: `/root/item[1]`, `/root/item[last()]`
   - Attribute predicates: `[@id]`, `[@id='value']`, `[@price>10]`
   - Text matching: `[text()='value']`
   - Functions: `contains()`, `starts-with()`, `not()`
   - Logical operators: `and`, `or`
   - Multiple predicates: `[@id='1'][@name='test']`

2. **Element Text**: Element node text content needs to be stored as Text-type child nodes; directly setting the `Value` property will not be serialized.

3. **Namespaces**: Namespace prefixes are preserved during parsing, but dedicated namespace management features are not provided.

---

## Project Structure

```
Xml/
├── Src/
│   ├── cXml.twin       ' XML document class
│   ├── cXmlNode.twin   ' XML node class
│   ├── mXml.twin       ' Module (enums, constants, utility functions)
│   ├── mXPath.twin     ' XPath query engine module
│   └── mXmlTests.twin  ' Unit tests
├── test_output.xml     ' Test output file
├── Readme.md           ' This documentation (English)
└── Readme_zh.md        ' Chinese documentation
```

---

## Author Information

- **Author**: woeoo (Deng Wei)
- **Email**: 215879458@qq.com
- **Website**: https://vb6.pro
- **Version**: 1.0.0
- **Date**: 2026-02-07

---

## License

This project is open source and free to use and modify.
