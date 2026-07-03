$ErrorActionPreference = "Stop"

$node = "C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$script = Join-Path $PSScriptRoot "server.mjs"

if (-not (Test-Path -LiteralPath $node)) {
    throw "Khong tim thay Node.js: $node"
}

$env:HOST = "0.0.0.0"
$env:PORT = "4173"

Write-Host "CN8-2 Dashboard"
Write-Host "Local: http://localhost:4173"
Write-Host "Nhan Ctrl+C de dung."
& $node $script
