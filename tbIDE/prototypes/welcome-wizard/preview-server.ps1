# Local, read-only Welcome Wizard preview server.
# Uses only Windows PowerShell 5.1 and the installed .NET Framework.
# No administrator privileges, Python, Node, npm or external network access.
$ErrorActionPreference = 'Stop'
$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @{
    '/' = @('index.html', 'text/html; charset=utf-8')
    '/index.html' = @('index.html', 'text/html; charset=utf-8')
    '/welcome.js' = @('welcome.js', 'text/javascript; charset=utf-8')
    '/controls.js' = @('controls.js', 'text/javascript; charset=utf-8')
    '/welcome.css' = @('welcome.css', 'text/css; charset=utf-8')
    '/master.css' = @('master.css', 'text/css; charset=utf-8')
}
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
try {
    $listener.Start()
    $url = 'http://127.0.0.1:' + $port + '/'
    Write-Host ('Welcome Wizard preview: ' + $url)
    Write-Host 'Only this computer can connect. Press Ctrl+C to stop.'
    Start-Process $url
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 5000
            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
            $request = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($request)) { continue }
            # Consume request headers; this server intentionally accepts no request bodies.
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line.Length -eq 0) { break }
            }
            $parts = $request.Split(' ')
            $method = $parts[0]
            $path = if ($parts.Length -ge 2) { $parts[1].Split('?')[0] } else { '' }
            $status = '404 Not Found'
            $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
            $mime = 'text/plain; charset=utf-8'
            if (($method -eq 'GET' -or $method -eq 'HEAD') -and $files.ContainsKey($path)) {
                $record = $files[$path]
                $filename = Join-Path $root $record[0]
                if ([System.IO.File]::Exists($filename)) {
                    $body = [System.IO.File]::ReadAllBytes($filename)
                    $mime = $record[1]
                    $status = '200 OK'
                } else {
                    $status = '500 Internal Server Error'
                    $body = [System.Text.Encoding]::UTF8.GetBytes('Missing preview asset: ' + $record[0])
                }
            }
            $headers = @(
                ('HTTP/1.1 ' + $status),
                ('Content-Type: ' + $mime),
                ('Content-Length: ' + $body.Length),
                'Cache-Control: no-store',
                'X-Content-Type-Options: nosniff',
                "Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; font-src 'self' data:",
                'Connection: close',
                '',
                ''
            ) -join "`r`n"
            $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($headBytes, 0, $headBytes.Length)
            if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
            $stream.Flush()
        } catch {
            Write-Warning ('Preview request failed: ' + $_.Exception.Message)
        } finally {
            if ($client) { $client.Close() }
        }
    }
} catch {
    Write-Host ('Preview server could not start: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
} finally {
    $listener.Stop()
}
