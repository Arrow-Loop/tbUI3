# cRes Resource Management Class

`cRes` is a convenient resource file reader that provides a fluent (chained) calling approach to simplify resource operations.

## Global Access

Use the global instance `Res` through the `TBMAN` module:

```vb
MsgBox Res.Read("car.txt", "Sales").ReturnString()
```

**Single Read, Multiple Returns**:
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

After a single read operation, you can return content in different formats as needed.

## Method Reference

### Read(ByVal id As Variant, ByVal Type As Variant) As cRes

Reads a resource file, supports chained calls.

| Parameter | Description |
|-----------|-------------|
| id | Resource ID or name |
| Type | Resource type (e.g., "PICTURE", "TEXT", "CUSTOM", etc.) |

**Returns**: Self, supports chained calls

### ReturnBytes() As Byte()

Returns the raw byte array.

```vb
Dim b() As Byte
b = Res.Read("data.bin", "CUSTOM").ReturnBytes()
```

### ReturnString(Optional ByVal Conversion As VbStrConv = vbUnicode) As String

Returns the converted string.

| Parameter | Description |
|-----------|-------------|
| Conversion | `StrConv` conversion type, default is `vbUnicode` |

```vb
' Default Unicode conversion
Dim s As String
s = Res.Read("car.txt", "Sales").ReturnString()

' Specify conversion type
s = Res.Read("data.txt", "TEXT").ReturnString(vbFromUnicode)
```

### ReturnHex(Optional ByVal Separator As String = "", Optional ByVal LineBreak As Long = 0) As String

Returns the hexadecimal string of the byte array, with customizable separator and line breaks.

| Parameter | Description |
|-----------|-------------|
| Separator | Separator between bytes, default is empty string |
| LineBreak | Add line break every specified number of bytes, default is 0 (no line break) |

```vb
' No separator (default)
Dim hex1 As String
hex1 = Res.Read("data.bin", "CUSTOM").ReturnHex()
' Output: 48656C6C6F

' Use space separator
Dim hex2 As String
hex2 = Res.Read("data.bin", "CUSTOM").ReturnHex(" ")
' Output: 48 65 6C 6C 6F

' Line break every 16 bytes
Dim hex3 As String
hex3 = Res.Read("data.bin", "CUSTOM").ReturnHex("", 16)
' Output:
' 48656C6C6F20576F
' 726C642068656C6C

' Space separator with line break every 8 bytes
Dim hex4 As String
hex4 = Res.Read("data.bin", "CUSTOM").ReturnHex(" ", 8)
' Output:
' 48 65 6C 6C 6F 20 57 6F
' 72 6C 64 20 68 65 6C 6C
```

### ReturnBase64(Optional ByVal Prefix As Base64Prefix = Base64Prefix_None) As String

Returns the Base64 encoded string of the byte array, optionally with a data URI prefix.

| Parameter | Description |
|-----------|-------------|
| Prefix | Base64 prefix type, default is `Base64Prefix_None` |

**Supported Base64Prefix Enum Values**:

| Enum Value | Prefix Format |
|------------|---------------|
| `Base64Prefix_None` | No prefix |
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
' No prefix
Dim b64 As String
b64 = Res.Read("icon.png", "PICTURE").ReturnBase64()

' With PNG prefix for Web usage
b64 = Res.Read("icon.png", "PICTURE").ReturnBase64(Base64Prefix_ImagePNG)
' Output: data:image/png;base64,iVBORw0KGgo...

' Video Base64 encoding
Dim videoB64 As String
videoB64 = Res.Read("video.mp4", "CUSTOM").ReturnBase64(Base64Prefix_VideoMP4)

' Audio Base64 encoding
Dim audioB64 As String
audioB64 = Res.Read("audio.mp3", "CUSTOM").ReturnBase64(Base64Prefix_AudioMP3)
```

### ReturnPicture() As IPictureDisp

Returns the byte array converted to an `IPictureDisp` object.

```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
Picture1.Refresh()
```

## Usage Examples

### Reading Image Resources

```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
```

### Reading Text Resources

```vb
Dim text As String
text = Res.Read("config.json", "JSON").ReturnString()
```

### Reading Binary Resources

```vb
Dim data() As Byte
data = Res.Read("header.bin", "CUSTOM").ReturnBytes()

' Or convert to hex for viewing
Dim hex As String
hex = Res.Read("header.bin", "CUSTOM").ReturnHex()
```

### Base64 Encoding

```vb
' Basic Base64 encoding
Dim b64 As String
b64 = Res.Read("file.dat", "DATA").ReturnBase64()
Clipboard.SetText b64

' Add data URI prefix for Web usage
Dim webImage As String
webImage = Res.Read("icon.png", "PICTURE").ReturnBase64(Base64Prefix_ImagePNG)
' Can be directly used in <img src="...">
```

### Video/Audio Resources

```vb
' Get video Base64 data URI (for HTML5 video tag)
Dim videoB64 As String
videoB64 = Res.Read("demo.mp4", "CUSTOM").ReturnBase64(Base64Prefix_VideoMP4)

' Get audio Base64 data URI (for HTML5 audio tag)
Dim audioB64 As String
audioB64 = Res.Read("bgm.mp3", "CUSTOM").ReturnBase64(Base64Prefix_AudioMP3)
```

## Comparison with Traditional Approach

**Traditional approach**:
```vb
Dim b() As Byte
b = LoadResData("car3.png", "PICTURE")
Set Picture1.Picture = Global.LoadPicture(b)
Picture1.Refresh()
```

**Using cRes**:
```vb
Set Picture1.Picture = Res.Read("car3.png", "PICTURE").ReturnPicture()
```
