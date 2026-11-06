# cRes 资源管理类

`cRes` 是一个便捷的资源文件读取类，提供链式调用方式，简化资源操作。

## 全局调用

通过 `TBMAN` 模块可直接使用全局实例 `Res`：

```vb
MsgBox Res.Read("car.txt", "Sales").ReturnString()
```

**单次读取，多种返回**：
```vb
With New cRes
    .Read "data.bin", "TEST"
    Text1.Text = .ReturnHex(" ", 16)
    Text2.Text = .ReturnBase64()
    Text3.Text = .ReturnString()
    Dim b() As Byte
    b = .ReturnBytes()
End With
```

一次读取操作后，可以根据需要返回不同格式的内容。

## 方法说明

### Read(ByVal id As Variant, ByVal Type As Variant) As cRes

读取资源文件，支持链式调用。

| 参数 | 说明 |
|------|------|
| id | 资源 ID 或名称 |
| Type | 资源类型（如 "PICTURE"、"TEXT"、"CUSTOM" 等） |

**返回值**：返回自身，支持链式调用

### ReturnBytes() As Byte()

返回原始字节数组。

```vb
Dim b() As Byte
b = Res.Read("data.bin", "CUSTOM").ReturnBytes()
```

### ReturnString(Optional ByVal Conversion As VbStrConv = vbUnicode) As String

返回转换后的字符串。

| 参数 | 说明 |
|------|------|
| Conversion | `StrConv` 转换类型，默认 `vbUnicode` |

```vb
' 默认 Unicode 转换
Dim s As String
s = Res.Read("car.txt", "Sales").ReturnString()

' 指定转换类型
s = Res.Read("data.txt", "TEXT").ReturnString(vbFromUnicode)
```

### ReturnHex(Optional ByVal Separator As String = "", Optional ByVal LineBreak As Long = 0) As String

返回字节数组的十六进制字符串，可自定义分隔符和换行。

| 参数 | 说明 |
|------|------|
| Separator | 字节之间的分隔符，默认为空字符串 |
| LineBreak | 每指定字节数添加换行符，默认为 0（不换行） |

```vb
' 默认无分隔符
Dim hex1 As String
hex1 = Res.Read("data.bin", "CUSTOM").ReturnHex()
' 输出: 48656C6C6F

' 使用空格分隔
Dim hex2 As String
hex2 = Res.Read("data.bin", "CUSTOM").ReturnHex(" ")
' 输出: 48 65 6C 6C 6F

' 每 16 字节换行
Dim hex3 As String
hex3 = Res.Read("data.bin", "CUSTOM").ReturnHex("", 16)
' 输出:
' 48656C6C6F20576F
' 726C642068656C6C

' 使用空格分隔且每 8 字节换行
Dim hex4 As String
hex4 = Res.Read("data.bin", "CUSTOM").ReturnHex(" ", 8)
' 输出:
' 48 65 6C 6C 6F 20 57 6F
' 72 6C 64 20 68 65 6C 6C
```

### ReturnBase64(Optional ByVal Prefix As Base64Prefix = Base64Prefix_None) As String

返回字节数组的 Base64 编码字符串，可选择添加数据 URI 前缀。

| 参数 | 说明 |
|------|------|
| Prefix | Base64 前缀类型，默认 `Base64Prefix_None` |

**支持的 Base64Prefix 枚举值**：

| 枚举值 | 前缀格式 |
|--------|----------|
| `Base64Prefix_None` | 无前缀 |
| `Base64Prefix_ImagePNG` | `data:image/png;base64,` |
| `Base64Prefix_ImageJPEG` | `data:image/jpeg;base64,` |
| `Base64Prefix_ImageGIF` | `data:image/gif;base64,` |
| `Base64Prefix_ImageBMP` | `data:image/bmp;base64,` |
| `Base64Prefix_ImageICO` | `data:image/x-icon;base64,` |
| `Base64Prefix_ImageWebP` | `data:image/webp;base64,` |
| `Base64Prefix_VideoMP4` | `data:video/mp4;base64,` |
| `Base64Prefix_VideoWebM` | `data:video/webm;base64,` |
| `Base64Prefix_VideoOGG` | `data:video/ogg;base64,` |
| `Base64Prefix_AudioMP3` | `data:audio/mpeg;base64,` |
| `Base64Prefix_AudioWAV` | `data:audio/wav;base64,` |
| `Base64Prefix_AudioOGG` | `data:audio/ogg;base64,` |

```vb
' 无前缀
Dim b64 As String
b64 = Res.Read("icon.png", "PICTURE").ReturnBase64()

' 带 PNG 前缀，用于 Web
b64 = Res.Read("icon.png", "PICTURE").ReturnBase64(Base64Prefix_ImagePNG)
' 输出: data:image/png;base64,iVBORw0KGgo...

' 视频 Base64 编码
Dim videoB64 As String
videoB64 = Res.Read("video.mp4", "CUSTOM").ReturnBase64(Base64Prefix_VideoMP4)

' 音频 Base64 编码
Dim audioB64 As String
audioB64 = Res.Read("audio.mp3", "CUSTOM").ReturnBase64(Base64Prefix_AudioMP3)
```

### ReturnPicture() As IPictureDisp

返回字节数组转换为的 `IPictureDisp` 对象。

```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
Picture1.Refresh()
```

## 使用示例

### 读取图片资源

```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
```

### 读取文本资源

```vb
Dim text As String
text = Res.Read("config.json", "JSON").ReturnString()
```

### 读取二进制资源

```vb
Dim data() As Byte
data = Res.Read("header.bin", "CUSTOM").ReturnBytes()

' 或转为十六进制查看
Dim hex As String
hex = Res.Read("header.bin", "CUSTOM").ReturnHex()
```

### Base64 编码

```vb
' 基础 Base64 编码
Dim b64 As String
b64 = Res.Read("file.dat", "DATA").ReturnBase64()
Clipboard.SetText b64

' 为 Web 使用添加数据 URI 前缀
Dim webImage As String
webImage = Res.Read("icon.png", "PICTURE").ReturnBase64(Base64Prefix_ImagePNG)
' 可直接用于 <img src="...">
```

### 视频/音频资源

```vb
' 获取视频的 Base64 数据 URI（用于 HTML5 video 标签）
Dim videoB64 As String
videoB64 = Res.Read("demo.mp4", "CUSTOM").ReturnBase64(Base64Prefix_VideoMP4)

' 获取音频的 Base64 数据 URI（用于 HTML5 audio 标签）
Dim audioB64 As String
audioB64 = Res.Read("bgm.mp3", "CUSTOM").ReturnBase64(Base64Prefix_AudioMP3)
```

## 传统方式对比

**传统方式**：
```vb
Dim b() As Byte
b = LoadResData("car3.png", "PICTURE")
Set Picture1.Picture = Global.LoadPicture(b)
Picture1.Refresh()
```

**使用 cRes**：
```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
```
