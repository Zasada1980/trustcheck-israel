# Research script: Find data.gov.il datasets with HP numbers NOT starting with 5
# Purpose: Discover sources for עוסק מורשה and עוסק פטור data

Write-Host "=== Data.gov.il Research for עוסק מורשה ===" -ForegroundColor Cyan
Write-Host ""

# CKAN API endpoints
$BASE_URL = "https://data.gov.il/api/3/action"

# Step 1: Search for relevant datasets
Write-Host "[1] Searching for relevant datasets..." -ForegroundColor Yellow

$keywords = @(
    "עוסק מורשה",
    "עוסק פטור",
    "עסקים",
    "רישוי עסקים",
    "business licenses",
    "self employed",
    "משרד הכלכלה",
    "רשות המסים"
)

$foundDatasets = @()

foreach ($keyword in $keywords) {
    Write-Host "  Searching for: $keyword" -ForegroundColor Gray
    
    $searchUrl = "$BASE_URL/package_search?q=$([uri]::EscapeDataString($keyword))&rows=20"
    
    try {
        $response = Invoke-RestMethod -Uri $searchUrl -Method Get -ErrorAction Stop
        
        if ($response.success -and $response.result.results.Count -gt 0) {
            foreach ($dataset in $response.result.results) {
                $foundDatasets += [PSCustomObject]@{
                    Name = $dataset.title
                    Id = $dataset.id
                    Organization = $dataset.organization.title
                    ResourceCount = $dataset.resources.Count
                    LastModified = $dataset.metadata_modified
                    Keyword = $keyword
                }
            }
        }
    }
    catch {
        Write-Host "  Error searching for '$keyword': $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[2] Found $($foundDatasets.Count) datasets" -ForegroundColor Green
Write-Host ""

# Step 2: Analyze each dataset
$candidateDatasets = @()

foreach ($dataset in ($foundDatasets | Sort-Object -Property Name -Unique)) {
    Write-Host "Dataset: $($dataset.Name)" -ForegroundColor Cyan
    Write-Host "  Organization: $($dataset.Organization)"
    Write-Host "  Resources: $($dataset.ResourceCount)"
    Write-Host "  Last Modified: $($dataset.LastModified)"
    
    # Get detailed info
    try {
        $detailUrl = "$BASE_URL/package_show?id=$($dataset.Id)"
        $detail = Invoke-RestMethod -Uri $detailUrl -Method Get -ErrorAction Stop
        
        if ($detail.success) {
            # Check resources for CSV/JSON files
            foreach ($resource in $detail.result.resources) {
                $format = $resource.format.ToLower()
                
                if ($format -in @('csv', 'json', 'xlsx', 'xls')) {
                    Write-Host "    Resource: $($resource.name) ($format)" -ForegroundColor Green
                    Write-Host "      URL: $($resource.url)"
                    
                    $candidateDatasets += [PSCustomObject]@{
                        DatasetName = $dataset.Name
                        DatasetId = $dataset.Id
                        ResourceName = $resource.name
                        ResourceId = $resource.id
                        Format = $format
                        URL = $resource.url
                        Size = $resource.size
                    }
                }
            }
        }
    }
    catch {
        Write-Host "  Error getting details: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Step 3: Download sample from promising datasets
Write-Host "[3] Testing promising datasets..." -ForegroundColor Yellow
Write-Host ""

$testResults = @()

foreach ($candidate in ($candidateDatasets | Select-Object -First 5)) {
    Write-Host "Testing: $($candidate.DatasetName) - $($candidate.ResourceName)" -ForegroundColor Cyan
    
    try {
        # Download first 100 lines for CSV
        if ($candidate.Format -eq 'csv') {
            $tempFile = Join-Path $env:TEMP "data_gov_sample_$($candidate.ResourceId).csv"
            
            Invoke-WebRequest -Uri $candidate.URL -OutFile $tempFile -ErrorAction Stop
            
            # Read first 10 lines
            $lines = Get-Content $tempFile -First 10 -ErrorAction Stop
            
            Write-Host "  Sample content:" -ForegroundColor Gray
            foreach ($line in $lines) {
                Write-Host "    $line" -ForegroundColor DarkGray
            }
            
            # Check for HP numbers
            $containsHP = $false
            $nonFiveHP = 0
            
            foreach ($line in $lines) {
                if ($line -match '\b[0-9]{9}\b') {
                    $containsHP = $true
                    $hp = $matches[0]
                    if ($hp[0] -ne '5') {
                        $nonFiveHP++
                    }
                }
            }
            
            $testResults += [PSCustomObject]@{
                Dataset = $candidate.DatasetName
                Resource = $candidate.ResourceName
                URL = $candidate.URL
                ContainsHP = $containsHP
                NonFiveHPCount = $nonFiveHP
                Recommended = ($containsHP -and $nonFiveHP -gt 0)
            }
            
            Write-Host "  Contains HP: $containsHP" -ForegroundColor $(if ($containsHP) { "Green" } else { "Yellow" })
            Write-Host "  HP not starting with 5: $nonFiveHP" -ForegroundColor $(if ($nonFiveHP -gt 0) { "Green" } else { "Yellow" })
            
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Host "  Error testing dataset: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Step 4: Generate report
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

$recommended = $testResults | Where-Object { $_.Recommended -eq $true }

if ($recommended.Count -gt 0) {
    Write-Host "✅ Found $($recommended.Count) recommended datasets with HP numbers not starting with 5:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($rec in $recommended) {
        Write-Host "  Dataset: $($rec.Dataset)" -ForegroundColor Green
        Write-Host "  Resource: $($rec.Resource)"
        Write-Host "  URL: $($rec.URL)"
        Write-Host "  HP not on 5: $($rec.NonFiveHPCount) found in sample"
        Write-Host ""
    }
    
    # Save URLs to file
    $outputFile = "E:\SBF\osek_morsheh_data_sources.txt"
    $recommended | ForEach-Object { $_.URL } | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "✅ URLs saved to: $outputFile" -ForegroundColor Green
}
else {
    Write-Host "❌ No suitable datasets found with HP numbers not starting with 5" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Apply for Tax Authority API access: https://govextra.gov.il/taxes/innovation/"
    Write-Host "  2. Develop scraper for taxevat.mof.gov.il"
    Write-Host "  3. Check OpenData from Ministry of Economy"
}

Write-Host ""
Write-Host "=== Research Complete ===" -ForegroundColor Cyan
