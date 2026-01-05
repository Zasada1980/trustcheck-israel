# Quick E2E Test: AI via Cloudflare Tunnel
# Tests that trained model is accessible from production server

Write-Host "🔍 TrustCheck AI Tunnel E2E Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check tunnel is alive
Write-Host "1️⃣ Checking Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelUrl = (Get-Content .env | Select-String "OLLAMA_API_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
if (-not $tunnelUrl) {
    Write-Error "OLLAMA_API_URL not found in .env. Run: pwsh scripts/START_TUNNEL.ps1"
    exit 1
}
Write-Host "   URL: $tunnelUrl" -ForegroundColor Gray

try {
    $tags = Invoke-RestMethod -Uri "$tunnelUrl/api/tags" -TimeoutSec 10
    $modelNames = $tags.models | ForEach-Object { $_.name }
    
    if ($modelNames -contains "trustcheck:15b") {
        Write-Host "   ✅ Tunnel alive, trustcheck:15b available" -ForegroundColor Green
    } else {
        Write-Error "❌ trustcheck:15b not found in models: $($modelNames -join ', ')"
        exit 1
    }
} catch {
    Write-Error "❌ Tunnel not responding: $_"
    exit 1
}

# 2. Test direct generation via tunnel
Write-Host ""
Write-Host "2️⃣ Testing direct model generation..." -ForegroundColor Yellow
try {
    $body = @{
        model = "trustcheck:15b"
        prompt = "Ответь одним словом: Столица Израиля?"
        stream = $false
        options = @{
            temperature = 0.7
            num_ctx = 1024
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$tunnelUrl/api/generate" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
    
    if ($response.response) {
        Write-Host "   ✅ Model response: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))" -ForegroundColor Green
    } else {
        Write-Error "❌ Empty response from model"
        exit 1
    }
} catch {
    Write-Error "❌ Generation failed: $_"
    exit 1
}

# 3. Check server status
Write-Host ""
Write-Host "3️⃣ Checking production server..." -ForegroundColor Yellow
try {
    $serverResponse = Invoke-WebRequest -Uri "https://trustcheck.co.il" -TimeoutSec 10 -UseBasicParsing
    if ($serverResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Server is UP (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ Server responded with HTTP $($serverResponse.StatusCode)"
    }
} catch {
    Write-Error "❌ Server not responding: $_"
    Write-Host "   Checking if rebuild needed..." -ForegroundColor Yellow
}

# 4. Test AI API endpoint on server (if server is up)
Write-Host ""
Write-Host "4️⃣ Testing /api/ai endpoint..." -ForegroundColor Yellow
try {
    $aiBody = @{
        message = "Что такое TrustCheck?"
    } | ConvertTo-Json

    $aiResponse = Invoke-RestMethod -Uri "https://trustcheck.co.il/api/ai" -Method Post -Body $aiBody -ContentType "application/json; charset=utf-8" -TimeoutSec 30
    
    if ($aiResponse.response) {
        Write-Host "   ✅ AI API works! Response:" -ForegroundColor Green
        Write-Host "   $($aiResponse.response.Substring(0, [Math]::Min(150, $aiResponse.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Error "❌ Empty response from AI API"
        exit 1
    }
} catch {
    Write-Error "❌ AI API failed: $_"
    Write-Host ""
    Write-Host "🔧 To fix: Run deployment script to rebuild server" -ForegroundColor Yellow
    Write-Host "   ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252" -ForegroundColor Gray
    Write-Host "   cd /root/trustcheck && git pull && docker compose down && docker compose up -d --build" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  • Cloudflare Tunnel: WORKING" -ForegroundColor Green
Write-Host "  • Trained Model (trustcheck:15b): ACCESSIBLE" -ForegroundColor Green
Write-Host "  • Production Server: UP" -ForegroundColor Green
Write-Host "  • AI API Endpoint: RESPONDING" -ForegroundColor Green
Write-Host ""
