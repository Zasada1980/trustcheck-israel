#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Find data.gov.il resource_id for Execution Office (Hotzaa LaPoal) dataset
    
.DESCRIPTION
    Searches data.gov.il CKAN API for הוצאה לפועל datasets and lists their resource IDs
    
.EXAMPLE
    .\find_execution_resource_id.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "  data.gov.il Execution Dataset Finder" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Search for datasets containing "הוצאה לפועל" or "execution"
$searchTerms = @(
    "הוצאה לפועל",
    "hotzaa",
    "execution",
    "bailiff"
)

Write-Host "`n[SEARCH] Searching data.gov.il for execution-related datasets..." -ForegroundColor Yellow

foreach ($term in $searchTerms) {
    Write-Host "`nSearching for: '$term'" -ForegroundColor Cyan
    
    $encodedTerm = [System.Uri]::EscapeDataString($term)
    $url = "https://data.gov.il/api/3/action/package_search?q=$encodedTerm&rows=10"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
        
        if ($response.success -and $response.result.count -gt 0) {
            Write-Host "  Found $($response.result.count) datasets" -ForegroundColor Green
            
            foreach ($dataset in $response.result.results) {
                Write-Host "`n  📦 Dataset: $($dataset.title)" -ForegroundColor White
                Write-Host "     ID: $($dataset.id)" -ForegroundColor Gray
                Write-Host "     URL: https://data.gov.il/dataset/$($dataset.name)" -ForegroundColor Gray
                
                if ($dataset.resources.Count -gt 0) {
                    Write-Host "     Resources:" -ForegroundColor Yellow
                    foreach ($resource in $dataset.resources) {
                        Write-Host "       • Name: $($resource.name)" -ForegroundColor White
                        Write-Host "         Format: $($resource.format)" -ForegroundColor Gray
                        Write-Host "         ID: $($resource.id)" -ForegroundColor Cyan
                        Write-Host "         URL: $($resource.url)" -ForegroundColor Gray
                        
                        # Check if API enabled
                        if ($resource.url -like "*datastore_search*") {
                            Write-Host "         ✅ API ENABLED - USE THIS ID!" -ForegroundColor Green
                        }
                    }
                }
            }
        } else {
            Write-Host "  No datasets found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "  Instructions" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "1. Find the resource with 'API ENABLED' flag above" -ForegroundColor White
Write-Host "2. Copy the resource ID (format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)" -ForegroundColor White
Write-Host "3. Update lib/execution_office.ts line 112:" -ForegroundColor White
Write-Host "   const RESOURCE_ID = 'YOUR-RESOURCE-ID-HERE';" -ForegroundColor Cyan
Write-Host "`n4. Test API call:" -ForegroundColor White
Write-Host "   Invoke-RestMethod -Uri 'https://data.gov.il/api/3/action/datastore_search?resource_id=YOUR_ID&limit=1'" -ForegroundColor Cyan

exit 0
