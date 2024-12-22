$dir = Get-Location
$env:TAURI_SIGNING_PRIVATE_KEY="$dir\~\.tauri\ff7-ultima.key"
npm run tauri build