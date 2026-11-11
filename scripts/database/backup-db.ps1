# =======================================================
# Mylapore Express - Database Backup Script
# =======================================================

$backupDir = "$PSScriptRoot\..\..\backups"
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dbFile = "$PSScriptRoot\..\..\apps\api\prisma\dev.db"

if (Test-Path $dbFile) {
    $target = "$backupDir\dev_backup_$timestamp.db"
    Copy-Item -Path $dbFile -Destination $target
    Write-Host "✅ Local SQLite database backed up to $target" -ForegroundColor Green
} else {
    Write-Host "ℹ️ For Render Managed PostgreSQL, automatic point-in-time recovery and daily snapshots are managed via Render Cloud Dashboard." -ForegroundColor Cyan
}
