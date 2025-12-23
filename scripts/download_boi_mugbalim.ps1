#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Download Bank of Israel Restricted Accounts (Mugbalim) data
    
.DESCRIPTION
    Downloads daily ZIP file from boi.org.il, extracts CSV, imports to PostgreSQL.
    CheckID equivalent: They charge ₪0.50 per lookup for this FREE government data.
    
    ⚠️ NOTE (2025-12-23): BOI removed public CSV access.
    Portal https://mugbalim.boi.org.il exists but requires manual search.
    Alternative: BDI Code API (₪1-2/query) or contact BOI for API access.
    See: BOI_MUGBALIM_DATA_SOURCE_INVESTIGATION.md for details.
    
.EXAMPLE
    .\download_boi_mugbalim.ps1
    
.NOTES
    Source: https://www.boi.org.il/en/DataAndStatistics/Lists/BoiTablesAndGraphs/Attachments/7/ClosedAccounts_en.zip
    Format: CSV with ISO-8859-8 encoding (Hebrew + English)
    Update Frequency: Daily
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# ============================================
# Configuration
# ============================================
$BOI_ZIP_URL = "https://www.boi.org.il/en/DataAndStatistics/Lists/BoiTablesAndGraphs/Attachments/7/ClosedAccounts_en.zip"
$DATA_DIR = Join-Path $PSScriptRoot "..\data\government"
$TEMP_DIR = Join-Path $DATA_DIR "mugbalim_temp"

# PostgreSQL connection (from env or defaults)
$POSTGRES_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { 'localhost' }
$POSTGRES_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { '5432' }
$POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { 'trustcheck_gov_data' }
$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { 'trustcheck_admin' }

# ============================================
# Helper Functions
# ============================================

function Write-StepHeader {
    param([string]$Message)
    Write-Host "`n===================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
}

function Test-PostgresConnection {
    Write-Host "[CHECK] Testing PostgreSQL connection..." -ForegroundColor Yellow
    
    try {
        $testQuery = "SELECT version();"
        docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c $testQuery | Out-Null
        Write-Host "[CHECK] ✅ PostgreSQL connection OK" -ForegroundColor Green
        return $true
    } catch {
        Write-Error "[CHECK] ❌ PostgreSQL connection failed: $_"
        return $false
    }
}

# ============================================
# Main Script
# ============================================

Write-StepHeader "BOI Mugbalim Data Download"

# Step 1: Create directories
if (-not (Test-Path $DATA_DIR)) {
    Write-Host "[SETUP] Creating data directory: $DATA_DIR" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
}

if (Test-Path $TEMP_DIR) {
    Write-Host "[CLEANUP] Removing old temp files..." -ForegroundColor Yellow
    Remove-Item $TEMP_DIR -Recurse -Force
}
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# Step 2: Download ZIP
Write-StepHeader "Downloading from BOI"
Write-Host "[DOWNLOAD] URL: $BOI_ZIP_URL" -ForegroundColor Yellow

$zipPath = Join-Path $TEMP_DIR "mugbalim.zip"

try {
    Invoke-WebRequest -Uri $BOI_ZIP_URL -OutFile $zipPath -UseBasicParsing
    $zipSize = (Get-Item $zipPath).Length / 1KB
    Write-Host "[DOWNLOAD] ✅ Downloaded: $($zipSize.ToString('0.0')) KB" -ForegroundColor Green
} catch {
    Write-Error "[DOWNLOAD] ❌ Failed to download: $_"
    exit 1
}

# Step 3: Extract ZIP
Write-StepHeader "Extracting CSV"

try {
    Expand-Archive -Path $zipPath -DestinationPath $TEMP_DIR -Force
    
    # Find CSV file (filename varies, e.g., ClosedAccounts_en.csv or mugbalim_YYYYMMDD.csv)
    $csvFile = Get-ChildItem $TEMP_DIR -Filter "*.csv" | Select-Object -First 1
    
    if (-not $csvFile) {
        Write-Error "[EXTRACT] ❌ No CSV file found in ZIP"
        exit 1
    }
    
    Write-Host "[EXTRACT] ✅ Found CSV: $($csvFile.Name) ($($csvFile.Length / 1KB) KB)" -ForegroundColor Green
} catch {
    Write-Error "[EXTRACT] ❌ Failed to extract: $_"
    exit 1
}

# Step 4: Check PostgreSQL connection
Write-StepHeader "Checking PostgreSQL"

if (-not (Test-PostgresConnection)) {
    Write-Error "[DB] ❌ Cannot connect to PostgreSQL. Is Docker container running?"
    exit 1
}

# Step 5: Import to PostgreSQL
Write-StepHeader "Importing to PostgreSQL"

$csvFullPath = $csvFile.FullName
$containerPath = "/tmp/mugbalim.csv"

# Copy CSV into Docker container (handle Windows paths)
Write-Host "[DB] Copying CSV into Docker container..." -ForegroundColor Yellow
docker cp $csvFullPath trustcheck-postgres:$containerPath

# SQL import script
$importSQL = @"
-- ============================================
-- BOI Mugbalim Import Script
-- Source: boi.org.il restricted accounts
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS boi_mugbalim (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_number VARCHAR(9) UNIQUE NOT NULL,  -- H.P. or T.Z. (Israeli ID)
    name_hebrew VARCHAR(255),              -- Company/Person name in Hebrew
    name_english VARCHAR(255),             -- Company/Person name in English
    restriction_date DATE,                 -- Date account restricted
    bank_name VARCHAR(255),                -- Bank name
    reason TEXT,                           -- Reason for restriction (e.g., "10+ returned checks")
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'boi.org.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mugbalim_id ON boi_mugbalim(id_number);
CREATE INDEX IF NOT EXISTS idx_mugbalim_date ON boi_mugbalim(restriction_date);

COMMENT ON TABLE boi_mugbalim IS 'Bank of Israel restricted accounts (Mugbalim) - daily updates';

-- Create temp table for import
DROP TABLE IF EXISTS mugbalim_import;
CREATE TEMP TABLE mugbalim_import (
    id_number TEXT,
    name_hebrew TEXT,
    name_english TEXT,
    restriction_date TEXT,  -- Import as text first (date format varies)
    bank_name TEXT,
    reason TEXT
);

-- Import CSV (handle ISO-8859-8 encoding)
\COPY mugbalim_import FROM '$containerPath' WITH (FORMAT CSV, HEADER, DELIMITER ',', ENCODING 'ISO_8859_8');

-- Transform and insert (upsert to handle updates)
INSERT INTO boi_mugbalim (id_number, name_hebrew, name_english, restriction_date, bank_name, reason, data_source, last_updated)
SELECT 
    TRIM(id_number),
    TRIM(name_hebrew),
    TRIM(name_english),
    TO_DATE(restriction_date, 'DD/MM/YYYY'),  -- Convert Israeli date format
    TRIM(bank_name),
    TRIM(reason),
    'boi.org.il',
    NOW()
FROM mugbalim_import
WHERE id_number IS NOT NULL AND id_number ~ '^[0-9]{9}$'  -- Valid 9-digit H.P./T.Z. only
ON CONFLICT (id_number) DO UPDATE SET
    name_hebrew = EXCLUDED.name_hebrew,
    name_english = EXCLUDED.name_english,
    restriction_date = EXCLUDED.restriction_date,
    bank_name = EXCLUDED.bank_name,
    reason = EXCLUDED.reason,
    last_updated = NOW();

-- Show statistics
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT bank_name) as unique_banks,
    MIN(restriction_date) as oldest_restriction,
    MAX(restriction_date) as newest_restriction
FROM boi_mugbalim;
"@

# Execute SQL in container
try {
    Write-Host "[DB] Executing import SQL..." -ForegroundColor Yellow
    
    $tempSqlPath = Join-Path $TEMP_DIR "import.sql"
    $importSQL | Out-File -FilePath $tempSqlPath -Encoding UTF8 -NoNewline
    
    # Copy SQL into container and execute
    docker cp $tempSqlPath trustcheck-postgres:/tmp/import.sql
    $result = docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f /tmp/import.sql 2>&1
    
    Write-Host "[DB] SQL Output:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor White
    
    # Get final count
    $countQuery = "SELECT COUNT(*) FROM boi_mugbalim;"
    $recordCount = docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c $countQuery
    
    Write-Host "[DB] ✅ Import complete: $recordCount records in database" -ForegroundColor Green
    
} catch {
    Write-Error "[DB] ❌ Failed to import: $_"
    exit 1
}

# Step 6: Cleanup
Write-StepHeader "Cleanup"

Write-Host "[CLEANUP] Removing temp files..." -ForegroundColor Yellow
Remove-Item $TEMP_DIR -Recurse -Force
Write-Host "[CLEANUP] ✅ Done" -ForegroundColor Green

# Step 7: Summary
Write-StepHeader "Summary"

Write-Host "✅ BOI Mugbalim data successfully downloaded and imported" -ForegroundColor Green
Write-Host "📊 Database: $POSTGRES_DB @ $POSTGRES_HOST" -ForegroundColor Cyan
Write-Host "📅 Last Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test API: curl http://localhost:3000/api/report -d '{\"businessName\":\"515972651\"}'" -ForegroundColor White
Write-Host "   2. Verify data: docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c 'SELECT * FROM boi_mugbalim LIMIT 5;'" -ForegroundColor White
Write-Host "   3. Setup cron: Add daily job for automated updates" -ForegroundColor White
Write-Host "`n📈 CheckID Comparison:" -ForegroundColor Yellow
Write-Host "   CheckID charges: ₪0.50 per lookup" -ForegroundColor White
Write-Host "   TrustCheck cost: ₪0 (direct BOI download)" -ForegroundColor White
Write-Host "   Savings: ₪0.50 × 1000 checks/month = ₪6,000/year" -ForegroundColor Green

exit 0
