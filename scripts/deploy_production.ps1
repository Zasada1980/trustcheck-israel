# TrustCheck Israel - Production Deployment Script
# Deploys Next.js app with local Ollama AI to Hetzner server

param(
    [switch]$SkipBuild,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$SERVER = "root@46.224.147.252"
$SSH_KEY = "C:\Users\zakon\.ssh\trustcheck_hetzner"
$REMOTE_PATH = "/root/trustcheck"

Write-Host "`n🚀 TrustCheck Production Deployment" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Step 1: Local Build
if (-not $SkipBuild) {
    Write-Host "📦 Step 1: Building Next.js application..." -ForegroundColor Yellow
    
    Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
    
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
    
    # Check if AI route compiled
    if (Test-Path ".next\server\app\api\ai\route.js") {
        Write-Host "   ✅ AI route compiled successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ AI route missing in build!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Build completed`n" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping build (using existing .next)`n" -ForegroundColor Yellow
}

# Step 2: Create tarball
Write-Host "📁 Step 2: Creating deployment package..." -ForegroundColor Yellow

$tarballName = "trustcheck-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"

tar.exe -czf $tarballName .next app lib components public package.json next.config.js
$tarballSize = [math]::Round((Get-Item $tarballName).Length / 1MB, 2)

Write-Host "   ✅ Created $tarballName ($tarballSize MB)`n" -ForegroundColor Green

# Step 3: Upload to server
Write-Host "📤 Step 3: Uploading to server..." -ForegroundColor Yellow

scp -i $SSH_KEY $tarballName "${SERVER}:/root/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Upload failed!" -ForegroundColor Red
    Remove-Item $tarballName
    exit 1
}

Write-Host "   ✅ Upload completed`n" -ForegroundColor Green

# Step 4: Deploy on server
Write-Host "🔧 Step 4: Deploying on server..." -ForegroundColor Yellow

$deployScript = @"
cd $REMOTE_PATH && \
echo '=== Extracting build ===' && \
tar -xzf /root/$tarballName && \
echo '=== Rebuilding Docker image ===' && \
docker compose build --no-cache app && \
echo '=== Restarting containers ===' && \
docker compose down app && \
docker compose up -d app && \
echo '=== Waiting for startup ===' && \
sleep 20 && \
echo '=== Health check ===' && \
docker ps | grep trustcheck-app && \
echo '=== Cleanup ===' && \
rm /root/$tarballName && \
echo '✅ Deployment completed!'
"@

ssh -i $SSH_KEY $SERVER $deployScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Deployment failed!" -ForegroundColor Red
    Remove-Item $tarballName
    exit 1
}

Write-Host "   ✅ Deployment completed`n" -ForegroundColor Green

# Step 5: Test AI endpoint
Write-Host "🧪 Step 5: Testing AI endpoint..." -ForegroundColor Yellow

$testScript = @"
curl -s -X POST http://localhost:3001/api/ai \
  -H 'Content-Type: application/json' \
  -d '{\"message\": \"Test deployment\"}' | head -c 200
"@

$testResult = ssh -i $SSH_KEY $SERVER $testScript

if ($testResult -match '"message"') {
    Write-Host "   ✅ AI endpoint responding`n" -ForegroundColor Green
    Write-Host "   Response preview: $($testResult.Substring(0, [Math]::Min(100, $testResult.Length)))" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  AI endpoint not responding yet (may need more time)" -ForegroundColor Yellow
    Write-Host "   Response: $testResult`n" -ForegroundColor Gray
}

# Cleanup local tarball
Remove-Item $tarballName -ErrorAction SilentlyContinue

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green
Write-Host "Production URL: https://trustcheck.co.il" -ForegroundColor Cyan
Write-Host "AI Endpoint: https://trustcheck.co.il/api/ai`n" -ForegroundColor Cyan
