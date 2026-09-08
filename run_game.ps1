# Quake III Arena HTML5 Launcher
# Starts a local web server and opens the game in your browser

$port = 8080
$path = $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "         QUAKE III ARENA - HTML5 LAUNCHER         " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "Starte lokalen Webserver auf Port $port..." -ForegroundColor Cyan

# Check if port is already in use
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $port belegt, öffne Spiel direkt als Datei..." -ForegroundColor Yellow
    Start-Process "file:///$path/index.html"
    exit
}

$url = "http://localhost:$port/"
Write-Host "Server aktiv auf: $url" -ForegroundColor Green
Write-Host "Öffne Browser..." -ForegroundColor Cyan

# Open URL in default browser
Start-Process $url

Write-Host "`nDrücke [Ctrl+C] um den Server zu beenden.`n" -ForegroundColor DarkGray

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath) -or $localPath -eq '/') {
            $localPath = "index.html"
        }

        $filePath = Join-Path $path $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content types
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".wasm" { "application/wasm" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }

        $response.Close()
    }
} finally {
    $listener.Stop()
}
