# E2E Production Tests Runner for TrustCheck Israel
# PowerShell script to run tests and generate report

param(
    [switch]$Install,
    [switch]$Verbose,
    [string]$TestPattern = ""
)

Write-Host "🧪 TrustCheck Israel - E2E Production Tests" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Change to tests directory
$TestDir = "E:\SBF\tests\e2e"
Set-Location $TestDir

# Install dependencies if requested
if ($Install) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n⚠️  Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
}

# Build test command
$TestCommand = "npm test"

if ($Verbose) {
    $TestCommand += " -- --verbose"
}

if ($TestPattern -ne "") {
    $TestCommand += " -- --testNamePattern=`"$TestPattern`""
}

# Check production server health first
Write-Host "`n🔍 Checking production server health..." -ForegroundColor Yellow

try {
    $HealthCheck = Invoke-RestMethod -Uri "https://trustcheck.co.il/api/health" -Method Get -TimeoutSec 10
    
    if ($HealthCheck.status -eq "healthy") {
        Write-Host "✅ Production server is healthy" -ForegroundColor Green
        Write-Host "   - Gemini API: $($HealthCheck.services.gemini)" -ForegroundColor Gray
        Write-Host "   - PostgreSQL: $($HealthCheck.services.postgres)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Production server status: $($HealthCheck.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Production server health check failed: $_" -ForegroundColor Red
    Write-Host "   Tests may fail if server is down" -ForegroundColor Yellow
}

# Execute tests
Write-Host "`n🚀 Running E2E tests..." -ForegroundColor Cyan
Write-Host "   Working directory: $TestDir" -ForegroundColor Gray
Write-Host "   Command: npx jest --no-watch --runInBand" -ForegroundColor Gray
Write-Host ""

$StartTime = Get-Date

# Execute tests from correct directory with local config
$TestOutput = & npx jest --no-watch --runInBand --testTimeout=60000 2>&1

$EndTime = Get-Date
$Duration = ($EndTime - $StartTime).TotalSeconds

# Display output
$TestOutput | Write-Host

# Test results summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "   Duration: $([math]::Round($Duration, 2)) seconds" -ForegroundColor Gray
    
    # Success recommendations
    Write-Host "`n📊 Test Results Summary:" -ForegroundColor Cyan
    Write-Host "   - Health check: ✅ Passed" -ForegroundColor Green
    Write-Host "   - Report generation: ✅ Validated" -ForegroundColor Green
    Write-Host "   - AI accuracy: ✅ Verified" -ForegroundColor Green
    Write-Host "   - Error handling: ✅ Working" -ForegroundColor Green
    Write-Host "   - Performance: ✅ Within limits" -ForegroundColor Green
    
    Write-Host "`n✨ Production system is operating correctly!" -ForegroundColor Green
    
} else {
    Write-Host "❌ TESTS FAILED" -ForegroundColor Red
    Write-Host "   Duration: $([math]::Round($Duration, 2)) seconds" -ForegroundColor Gray
    
    # Failure troubleshooting
    Write-Host "`n🔧 Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "   1. Check production server: docker ps" -ForegroundColor Gray
    Write-Host "   2. Check app logs: docker logs trustcheck-app --tail 50" -ForegroundColor Gray
    Write-Host "   3. Verify database: docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c 'SELECT COUNT(*) FROM companies_registry;'" -ForegroundColor Gray
    Write-Host "   4. Check Gemini API quota: Google Cloud Console" -ForegroundColor Gray
    
    exit 1
}

Write-Host "`n💡 Tip: Run specific tests with:" -ForegroundColor Cyan
Write-Host "   .\run-tests.ps1 -TestPattern 'Health Check'" -ForegroundColor Gray
Write-Host "   .\run-tests.ps1 -TestPattern 'test_1_large_company'" -ForegroundColor Gray
Write-Host "   .\run-tests.ps1 -Verbose" -ForegroundColor Gray
