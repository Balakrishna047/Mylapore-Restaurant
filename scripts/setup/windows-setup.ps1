# =======================================================
# Mylapore Express - Automated Windows PowerShell Setup
# =======================================================

Write-Host "🚀 Starting Mylapore Express local environment setup..." -ForegroundColor Cyan

# 1. Check Node.js
$nodeVersion = node -v
Write-Host "✓ Detected Node: $nodeVersion" -ForegroundColor Green

# 2. Check pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "✓ Detected pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "Installing pnpm globally..." -ForegroundColor Yellow
    npm install -g pnpm
}

# 3. Install Monorepo Dependencies
Write-Host "📦 Installing dependencies across monorepo packages..." -ForegroundColor Yellow
pnpm install

# 4. Generate & Sync Database
Write-Host "🗄️ Initializing SQLite / PostgreSQL Database..." -ForegroundColor Yellow
Set-Location "apps\api"
npx prisma generate
npx prisma db push
npx ts-node src/prisma/seed.ts
Set-Location "..\.."

# 5. Build Packages and Services
Write-Host "🔨 Building shared types and validation packages..." -ForegroundColor Yellow
pnpm --filter "./packages/*" build

Write-Host "🔨 Building NestJS backend API..." -ForegroundColor Yellow
pnpm build:api

Write-Host "🔨 Building Next.js frontend web..." -ForegroundColor Yellow
pnpm build:web

Write-Host "`n🎉 Mylapore Express setup completed successfully!" -ForegroundColor Green
Write-Host "To start the application, run:" -ForegroundColor Cyan
Write-Host "  pnpm dev          (Starts both API on :4000 and Web on :3000)" -ForegroundColor White
Write-Host "  pnpm --filter @mylapore/api start:prod" -ForegroundColor White
Write-Host "  pnpm --filter @mylapore/web start" -ForegroundColor White
