# =======================================================
# Mylapore Express - Render Deployment Verification
# =======================================================

param (
    [string]$ApiUrl = "https://mylapore-express-api.onrender.com",
    [string]$WebUrl = "https://mylapore-express-web.onrender.com"
)

Write-Host "🔍 Verifying Render Production Deployments..." -ForegroundColor Cyan

# 1. Check API Health
try {
    $apiHealth = Invoke-RestMethod -Uri "$ApiUrl/api/v1/health" -Method Get
    if ($apiHealth.status -eq "ok") {
        Write-Host "✅ Render API is Healthy! (Uptime: $($apiHealth.uptime)s, Database: $($apiHealth.database))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Render API returned non-ok status: $($apiHealth.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to connect to Render API at $ApiUrl. Verify service status in Render Dashboard." -ForegroundColor Red
}

# 2. Check Web Frontend
try {
    $webResponse = Invoke-WebRequest -Uri "$WebUrl" -UseBasicParsing -Method Head
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "✅ Render Next.js Web Frontend is Live (HTTP 200 OK)!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Render Web returned StatusCode $($webResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to connect to Render Web at $WebUrl. Verify service status in Render Dashboard." -ForegroundColor Red
}
