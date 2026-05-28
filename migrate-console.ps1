#!/usr/bin/env pwsh
# Script de migración uno por uno con verificación

$filesToMigrate = @(
    "src\components\SocialFeed.tsx",
    "src\components\ScanPollCreator.tsx",
    "src\components\FollowButton.tsx",
    "src\components\ShopMap.tsx",
    "src\app\[locale]\wardrobe\page.tsx",
    "src\app\[locale]\settings\page.tsx",
    "src\app\[locale]\page.tsx",
    "src\app\[locale]\profile\page.tsx",
    "src\app\[locale]\onboarding\page.tsx",
    "src\app\[locale]\marketplace\page.tsx",
    "src\app\[locale]\events\page.tsx",
    "src\app\[locale]\events\[id]\page.tsx",
    "src\app\[locale]\events\new\page.tsx",
    "src\app\[locale]\community\page.tsx",
    "src\app\[locale]\challenges\page.tsx",
    "src\app\[locale]\business\campaigns\create\page.tsx",
    "src\app\[locale]\business\create-store\page.tsx",
    "src\app\[locale]\beauty-analysis\page.tsx",
    "src\app\[locale]\battles\page.tsx",
    "src\app\api\scans\[id]\like\route.ts",
    "src\app\api\polls\[id]\vote\route.ts",
    "src\app\api\scans\[id]\comments\route.ts",
    "src\app\api\notifications\[id]\route.ts",
    "src\app\api\items\[id]\route.ts",
    "src\app\api\follow\[userId]\route.ts",
    "src\app\api\events\[id]\attendees\route.ts",
    "src\app\api\events\[id]\photos\route.ts",
    "src\app\api\events\[id]\route.ts",
    "src\app\api\events\[id]\rsvp\route.ts",
    "src\app\api\events\[id]\messages\route.ts",
    "src\app\api\events\[id]\invite\route.ts",
    "src\app\api\battles\[id]\enter\route.ts"
)

$migratedCount = 0

foreach ($file in $filesToMigrate) {
    $fullPath = Join-Path (Get-Location) $file
    
    if (Test-Path $fullPath) {
        $lines = Get-Content $fullPath
        $newLines = @()
        $hasLogger = $false
        $changed = $false
        
        # Check if logger is already imported
        foreach ($line in $lines) {
            if ($line -match "import logger from") {
                $hasLogger = $true
            }
        }
        
        # Process each line
        $firstImportDone = $false
        foreach ($line in $lines) {
            # Add logger import after first import if needed
            if (-not $hasLogger -and -not $firstImportDone -and $line -match "^import .+ from") {
                $newLines += $line
                $newLines += "import logger from '@/lib/logger';"
                $hasLogger = $true
                $firstImportDone = $true
                $changed = $true
                continue
            }
            
            $newLine = $line
            
            # Replace console.error
            if ($newLine -match "console\.error\(") {
                $newLine = $newLine -replace "console\.error\(", "logger.error("
                $changed = $true
            }
            
            # Replace console.warn
            if ($newLine -match "console\.warn\(") {
                $newLine = $newLine -replace "console\.warn\(", "logger.warn("
                $changed = $true
            }
            
            # Replace .catch(console.error)
            if ($newLine -match "\.catch\(console\.error\)") {
                $newLine = $newLine -replace "\.catch\(console\.error\)", ".catch(logger.error)"
                $changed = $true
            }
            
            $newLines += $newLine
        }
        
        if ($changed) {
            $newLines | Set-Content $fullPath
            $migratedCount++
            Write-Host "✓ $file"
        }
    }
}

Write-Host "`n✅ Archivos migrados: $migratedCount"
