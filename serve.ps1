param([string]$Root, [int]$Port = 8821)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $Root on http://localhost:$Port/"
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.svg'='image/svg+xml'; '.woff2'='font/woff2'; '.woff'='font/woff'; '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.webp'='image/webp'; '.md'='text/plain; charset=utf-8'; '.ico'='image/x-icon' }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path $Root $path
    $full = [IO.Path]::GetFullPath($file)
    if ($full.StartsWith([IO.Path]::GetFullPath($Root)) -and (Test-Path $full -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $nf = Join-Path $Root '404.html'
      if (Test-Path $nf -PathType Leaf) {
        $ctx.Response.ContentType = 'text/html; charset=utf-8'
        $b = [IO.File]::ReadAllBytes($nf)
      } else { $b = [Text.Encoding]::UTF8.GetBytes('404') }
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    }
  } catch { } finally { $ctx.Response.Close() }
}
