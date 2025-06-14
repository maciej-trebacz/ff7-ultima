param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Validate version format (basic semver check)
if (-not ($Version -match '^\d+\.\d+\.\d+$')) {
    Write-Error "Version must be in format x.y.z (e.g., 1.0.0)"
    exit 1
}

Write-Host "Starting release process for version $Version" -ForegroundColor Green

# Step 1: Update version in package.json
Write-Host "Updating package.json..." -ForegroundColor Blue
try {
    $packageJsonPath = Join-Path $PWD "package.json"
    $packageContent = Get-Content "package.json" -Raw
    $packageJson = $packageContent | ConvertFrom-Json
    $packageJson.version = $Version
    
    # Convert back to JSON with proper formatting
    $jsonOutput = $packageJson | ConvertTo-Json -Depth 10
    $Utf8NoBomEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $False
    [System.IO.File]::WriteAllText($packageJsonPath, $jsonOutput, $Utf8NoBomEncoding)
    
    # Format with prettier
    & npx prettier --write "package.json"
    Write-Host "package.json updated and formatted successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to update package.json: $_"
    exit 1
}

# Step 2: Update version in Cargo.toml
Write-Host "Updating Cargo.toml..." -ForegroundColor Blue
try {
    $cargoPath = "src-tauri/Cargo.toml"
    $cargoContent = Get-Content $cargoPath
    $updatedCargo = $cargoContent -replace '^version = ".*"', "version = `"$Version`""
    $updatedCargo | Out-File -FilePath $cargoPath -Encoding utf8
    Write-Host "Cargo.toml updated successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to update Cargo.toml: $_"
    exit 1
}

# Step 3: Update version in tauri.conf.json
Write-Host "Updating tauri.conf.json..." -ForegroundColor Blue
try {
    $tauriConfigRelativePath = "src-tauri/tauri.conf.json"
    $tauriConfigPath = Join-Path $PWD $tauriConfigRelativePath
    $tauriContent = Get-Content $tauriConfigRelativePath -Raw
    $tauriConfig = $tauriContent | ConvertFrom-Json
    $tauriConfig.version = $Version
    
    # Convert back to JSON with proper formatting
    $jsonOutput = $tauriConfig | ConvertTo-Json -Depth 10
    $Utf8NoBomEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $False
    [System.IO.File]::WriteAllText($tauriConfigPath, $jsonOutput, $Utf8NoBomEncoding)
    
    # Format with prettier
    & npx prettier --write $tauriConfigRelativePath
    Write-Host "tauri.conf.json updated and formatted successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to update tauri.conf.json: $_"
    exit 1
}

Write-Host "All version files updated successfully!" -ForegroundColor Green

# Step 4: Run build script
Write-Host "Building application..." -ForegroundColor Blue
Write-Host "Running build.ps1..." -ForegroundColor Yellow

try {
    $buildResult = & .\build.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed with exit code $LASTEXITCODE"
        exit 1
    }
    Write-Host "Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Error "Build script failed: $_"
    exit 1
}

# Step 5: Update updater.json
Write-Host "Updating updater.json..." -ForegroundColor Blue

$signatureFile = "src-tauri/target/release/bundle/nsis/FF7 Ultima_${Version}_x64-setup.exe.sig"
if (-not (Test-Path $signatureFile)) {
    Write-Error "Signature file not found: $signatureFile"
    Write-Host "Please check that the build completed successfully and the signature file was created."
    exit 1
}

try {
    $signature = Get-Content $signatureFile -Raw
    $updaterRelativePath = "updater.json"
    $updaterPath = Join-Path $PWD $updaterRelativePath
    $updaterContent = Get-Content $updaterRelativePath -Raw
    $updaterJson = $updaterContent | ConvertFrom-Json
    
    $updaterJson.version = $Version
    $updaterJson.platforms.'windows-x86_64'.signature = $signature.Trim()
    $updaterJson.platforms.'windows-x86_64'.url = "https://github.com/maciej-trebacz/ff7-ultima/releases/download/$Version/FF7.Ultima_${Version}_x64-setup.exe"
    $updaterJson.pub_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    # Convert back to JSON with proper formatting
    $jsonOutput = $updaterJson | ConvertTo-Json -Depth 10
    $Utf8NoBomEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $False
    [System.IO.File]::WriteAllText($updaterPath, $jsonOutput, $Utf8NoBomEncoding)
    
    # Format with prettier
    & npx prettier --write $updaterRelativePath
    Write-Host "updater.json updated and formatted successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to update updater.json: $_"
    exit 1
}

# Step 6: Get commit message from user
$commitMessage = Read-Host "Enter commit message for version $Version"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Release version $Version"
}

# Step 7: Git operations
Write-Host "Committing changes..." -ForegroundColor Blue

try {
    & git add .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git add failed"
        exit 1
    }

    & git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git commit failed"
        exit 1
    }

    Write-Host "Creating and pushing tag..." -ForegroundColor Blue
    & git tag $Version
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git tag creation failed"
        exit 1
    }

    & git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git push failed"
        exit 1
    }

    & git push origin $Version
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git tag push failed"
        exit 1
    }

    Write-Host "Successfully pushed commit and tag!" -ForegroundColor Green

} catch {
    Write-Error "Git operations failed: $_"
    exit 1
}

Write-Host ""
Write-Host "Release $Version completed successfully!" -ForegroundColor Green
Write-Host "Installer location: src-tauri/target/release/bundle/nsis/FF7 Ultima_${Version}_x64-setup.exe" -ForegroundColor Cyan

$releaseUrl = "https://github.com/maciej-trebacz/ff7-ultima/releases/new?tag=$Version"
Write-Host "Create a GitHub release at: $releaseUrl" -ForegroundColor Cyan