$dir = Get-Location
$env:TAURI_SIGNING_PRIVATE_KEY="$dir\~\.tauri\ff7-ultima.key"
bun run build