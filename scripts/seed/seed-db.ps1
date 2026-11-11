# =======================================================
# Mylapore Express - Database Re-seed Script
# =======================================================

Write-Host "🌱 Reseeding Mylapore Express Database..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\..\..\apps\api"
npx ts-node src/prisma/seed.ts
Set-Location "$PSScriptRoot\..\.."
Write-Host "✅ Database re-seeded with authentic South Indian dishes, categories, and test accounts!" -ForegroundColor Green
