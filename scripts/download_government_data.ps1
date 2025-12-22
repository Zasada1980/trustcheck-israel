#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Download and import datasets from data.gov.il into PostgreSQL
    
.DESCRIPTION
    This script downloads Israeli government open data:
    - Companies Registry (רשם החברות)
    - Licensed Dealers (עוסקים מורשים)
    - Execution Proceedings (הוצאה לפועל)
    
    Then imports them into PostgreSQL database for fast local queries.
    
.PARAMETER DatasetType
    Which dataset to download: 'companies', 'dealers', 'executions', 'all'
    
.EXAMPLE
    ./download_government_data.ps1 -DatasetType all
#>

param(
    [Parameter()]
    [ValidateSet('companies', 'dealers', 'executions', 'all')]
    [string]$DatasetType = 'all'
)

$ErrorActionPreference = 'Stop'

# Configuration
$DATA_DIR = "$PSScriptRoot\..\data\government"
$POSTGRES_HOST = $env:POSTGRES_HOST ?? 'localhost'
$POSTGRES_PORT = $env:POSTGRES_PORT ?? '5432'
$POSTGRES_DB = $env:POSTGRES_DB ?? 'trustcheck_gov_data'
$POSTGRES_USER = $env:POSTGRES_USER ?? 'trustcheck_admin'
$POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD

# data.gov.il Dataset URLs
$DATASETS = @{
    companies = @{
        name = 'companies_registry'
        url = 'https://data.gov.il/dataset/246d949c-a253-4811-8a11-41a137d3d613/resource/f004176c-b85f-4542-8901-7b3176f9a054/download/f004176c-b85f-4542-8901-7b3176f9a054.csv'
        resource_id = 'f004176c-b85f-4542-8901-7b3176f9a054'  # מאגר חברות - רשם החברות (248 MB, ~600K+ records, last update: 2025-12-22)
        description = 'Companies Registry (רשם החברות)'
    }
    dealers = @{
        name = 'licensed_dealers'
        url = 'https://data.gov.il/api/3/action/datastore_search'
        resource_id = 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY'  # TODO: Find actual resource ID
        description = 'Licensed Dealers (עוסקים מורשים)'
    }
    executions = @{
        name = 'execution_proceedings'
        url = 'https://data.gov.il/api/3/action/datastore_search'
        resource_id = 'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ'  # TODO: Find actual resource ID
        description = 'Execution Office (הוצאה לפועל)'
    }
}

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $color = switch ($Level) {
        'INFO' { 'Cyan' }
        'SUCCESS' { 'Green' }
        'WARNING' { 'Yellow' }
        'ERROR' { 'Red' }
        default { 'White' }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-PostgreSQLConnection {
    Write-Log "Testing PostgreSQL connection..." -Level INFO
    
    try {
        # Use docker exec instead of psql (Windows compatibility)
        $result = docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "PostgreSQL connection successful" -Level SUCCESS
            return $true
        } else {
            Write-Log "PostgreSQL connection failed: $result" -Level ERROR
            return $false
        }
    } catch {
        Write-Log "PostgreSQL connection error: $_" -Level ERROR
        return $false
    }
}

function Download-DataGovILDataset {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ResourceId,
        [string]$Description
    )
    
    Write-Log "Downloading dataset: $Description" -Level INFO
    
    # Create data directory
    New-Item -ItemType Directory -Force -Path $DATA_DIR | Out-Null
    
    $outputFile = "$DATA_DIR\$Name.csv"
    
    try {
        # Direct CSV download (data.gov.il provides direct download links)
        Write-Log "Downloading from: $Url" -Level INFO
        
        $headers = @{
            'User-Agent' = 'datagov-external-client TrustCheck/1.0 (+https://trustcheck.co.il)'
        }
        
        Invoke-WebRequest -Uri $Url -OutFile $outputFile -Headers $headers -UseBasicParsing
        
        if (Test-Path $outputFile) {
            $fileSize = (Get-Item $outputFile).Length / 1MB
            Write-Log "Downloaded: $outputFile ($('{0:N2}' -f $fileSize) MB)" -Level SUCCESS
            return $outputFile
        }
    } catch {
        Write-Log "Direct download failed: $_" -Level WARNING
        
        # Method 2: Try API with pagination
        Write-Log "Trying API method with pagination..." -Level INFO
        
        try {
            $allRecords = @()
            $offset = 0
            $limit = 10000
            $totalRecords = 0
            
            do {
                $apiUrl = "${Url}?resource_id=${ResourceId}&limit=${limit}&offset=${offset}"
                
                $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
                
                if ($response.success -and $response.result.records) {
                    $allRecords += $response.result.records
                    $totalRecords = $response.result.total
                    $offset += $limit
                    
                    Write-Log "Fetched $($allRecords.Count) / $totalRecords records" -Level INFO
                } else {
                    break
                }
            } while ($allRecords.Count -lt $totalRecords)
            
            # Convert to CSV
            if ($allRecords.Count -gt 0) {
                $allRecords | Export-Csv -Path $outputFile -NoTypeInformation -Encoding UTF8
                Write-Log "Saved API data to: $outputFile ($($allRecords.Count) records)" -Level SUCCESS
                return $outputFile
            } else {
                Write-Log "No records found in API response" -Level WARNING
                return $null
            }
        } catch {
            Write-Log "API download failed: $_" -Level ERROR
            return $null
        }
    }
}

function Import-CSVToPostgreSQL {
    param(
        [string]$CsvFile,
        [string]$TableName
    )
    
    Write-Log "Importing $CsvFile to table $TableName" -Level INFO
    
    if (-not (Test-Path $CsvFile)) {
        Write-Log "CSV file not found: $CsvFile" -Level ERROR
        return $false
    }
    
    try {
        # Copy CSV into Docker container
        Write-Log "Copying CSV to Docker container..." -Level INFO
        docker cp $CsvFile trustcheck-postgres:/tmp/import.csv
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to copy CSV to container" -Level ERROR
            return $false
        }
        
        # Execute import via docker exec
        Write-Log "Running PostgreSQL COPY command..." -Level INFO
        
        $sql = "TRUNCATE TABLE $TableName CASCADE; COPY $TableName FROM '/tmp/import.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');"
        
        docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c $sql
        
        if ($LASTEXITCODE -eq 0) {
            # Count imported records
            $count = docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c "SELECT COUNT(*) FROM $TableName;"
            
            Write-Log "Imported $($count.Trim()) records to $TableName" -Level SUCCESS
            
            # Cleanup
            docker exec trustcheck-postgres rm /tmp/import.csv
            
            return $true
        } else {
            Write-Log "Import failed with exit code: $LASTEXITCODE" -Level ERROR
            return $false
        }
    } catch {
        Write-Log "Import error: $_" -Level ERROR
        return $false
    }
}

function Update-DataSyncStatus {
    param(
        [string]$DatasetName,
        [int]$RecordsImported,
        [string]$Status = 'completed'
    )
    
    try {
        $sql = "UPDATE data_sync_status SET last_sync_date = CURRENT_TIMESTAMP, next_sync_date = CURRENT_TIMESTAMP + INTERVAL '30 days', records_imported = $RecordsImported, sync_status = '$Status' WHERE dataset_name = '$DatasetName';"
        
        docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c $sql | Out-Null
        
        Write-Log "Updated sync status for $DatasetName" -Level SUCCESS
    } catch {
        Write-Log "Failed to update sync status: $_" -Level WARNING
    }
}

# ============================================
# MAIN SCRIPT
# ============================================

Write-Log "=== TrustCheck Government Data Downloader ===" -Level INFO
Write-Log "Dataset Type: $DatasetType" -Level INFO

# Check PostgreSQL connection
if (-not (Test-PostgreSQLConnection)) {
    Write-Log "Cannot connect to PostgreSQL. Exiting." -Level ERROR
    exit 1
}

# Determine which datasets to process
$datasetsToProcess = if ($DatasetType -eq 'all') {
    $DATASETS.Keys
} else {
    @($DatasetType)
}

$successCount = 0
$failureCount = 0

foreach ($key in $datasetsToProcess) {
    $dataset = $DATASETS[$key]
    
    Write-Log "`n--- Processing: $($dataset.description) ---" -Level INFO
    
    # Download dataset
    $csvFile = Download-DataGovILDataset -Name $dataset.name `
                                          -Url $dataset.url `
                                          -ResourceId $dataset.resource_id `
                                          -Description $dataset.description
    
    if ($csvFile) {
        # Import to PostgreSQL
        $imported = Import-CSVToPostgreSQL -CsvFile $csvFile -TableName $dataset.name
        
        if ($imported) {
            Update-DataSyncStatus -DatasetName $dataset.name -RecordsImported 1000  # TODO: Get actual count
            $successCount++
        } else {
            $failureCount++
        }
    } else {
        Write-Log "Skipping import - download failed" -Level WARNING
        $failureCount++
    }
}

# Summary
Write-Log "`n=== Import Summary ===" -Level INFO
Write-Log "Successful: $successCount" -Level SUCCESS
Write-Log "Failed: $failureCount" -Level $(if ($failureCount -gt 0) { 'WARNING' } else { 'SUCCESS' })

if ($successCount -gt 0) {
    Write-Log "`nDatabase is ready for queries!" -Level SUCCESS
    Write-Log "Next steps:" -Level INFO
    Write-Log "1. Test queries: psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB" -Level INFO
    Write-Log "2. Setup monthly cron job to re-sync data" -Level INFO
}

exit $(if ($failureCount -eq 0) { 0 } else { 1 })
