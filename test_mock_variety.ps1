# Test Mock Data Variety - TrustCheck Israel
# Tests 3 different HP numbers to verify diverse mock business data

Write-Host "`n🧪 Testing Mock Business Data Variety..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$testCases = @(
    @{ HP = "515000001"; Expected = "גן ילדים ""שמש"""; Seed = 1 }
    @{ HP = "515000002"; Expected = "בית ספר פרטי ""אופק"""; Seed = 2 }
    @{ HP = "515972651"; Expected = "Based on seed calculation"; Seed = "651 % 10 = 1" }
)

foreach ($test in $testCases) {
    Write-Host "`n📊 Testing HP: $($test.HP) (Seed: $($test.Seed))" -ForegroundColor Yellow
    Write-Host "Expected Business: $($test.Expected)" -ForegroundColor Gray
    
    try {
        $body = @{
            businessName = $test.HP
            registrationNumber = $test.HP
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://46.224.147.252/api/report" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        
        Write-Host "✅ API Response Success" -ForegroundColor Green
        Write-Host "   📋 Full Response Keys: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        
        if ($response.businessData) {
            Write-Host "   📌 Name: $($response.businessData.name)" -ForegroundColor White
            Write-Host "   📌 Type: $($response.businessData.type)" -ForegroundColor Cyan
            Write-Host "   📌 Industry: $($response.businessData.industry)" -ForegroundColor Magenta
            Write-Host "   📌 Status: $($response.businessData.status)" -ForegroundColor Blue
            Write-Host "   📌 Founded: $($response.businessData.foundedDate)" -ForegroundColor Gray
            
            if ($response.businessData.risks) {
                Write-Host "   ⚠️  First Risk: $($response.businessData.risks[0])" -ForegroundColor Red
            }
            
            if ($response.businessData.strengths) {
                Write-Host "   ✨ First Strength: $($response.businessData.strengths[0])" -ForegroundColor Green
            }
            
            if ($response.businessData.owners) {
                Write-Host "   👤 Owner: $($response.businessData.owners[0].name) ($($response.businessData.owners[0].role))" -ForegroundColor White
            }
            
            if ($response.aiAnalysis) {
                Write-Host "   🤖 AI Rating: $($response.aiAnalysis.rating)/5" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ No business data in response" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ API Error: $_" -ForegroundColor Red
    }
    
    Write-Host "-" * 60 -ForegroundColor Gray
}

Write-Host "`n✅ Test Complete! Check if businesses are DIFFERENT" -ForegroundColor Green
Write-Host "Expected: 3 different business names/types/industries" -ForegroundColor Yellow
