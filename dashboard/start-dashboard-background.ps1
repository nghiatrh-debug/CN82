$ErrorActionPreference = "Stop"

$node = "C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$script = Join-Path $PSScriptRoot "server.mjs"
$log = Join-Path $PSScriptRoot "dashboard-server.log"

if (-not (Test-Path -LiteralPath $node)) {
    throw "Khong tim thay Node.js: $node"
}

if (-not (Test-Path -LiteralPath $script)) {
    throw "Khong tim thay server.mjs: $script"
}

$env:HOST = "0.0.0.0"
$env:PORT = "4173"

"[$(Get-Date -Format s)] Starting CN8-2 dashboard on http://localhost:4173" | Out-File -LiteralPath $log -Encoding utf8 -Append
& $node $script >> $log 2>&1
"[$(Get-Date -Format s)] Dashboard server exited with code $LASTEXITCODE" | Out-File -LiteralPath $log -Encoding utf8 -Append
