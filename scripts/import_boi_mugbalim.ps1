# Import Bank of Israel Mugbalim Data
# Downloads and imports restricted accounts list into PostgreSQL

param(
    [switch]$SkipDownload,
    [string]$InputFile = "data/boi_mugbalim.csv"
)

Write-Host "`n=== Bank of Israel Mugbalim Import ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Configuration
$BOI_URL = "https://www.boi.org.il/PublicApi/GetFile?id=HashbonotMugbalim"
$OUTPUT_DIR = "data/government"
$OUTPUT_FILE = "$OUTPUT_DIR/boi_mugbalim.csv"
$POSTGRES_CONTAINER = "trustcheck-postgres"
$POSTGRES_USER = "trustcheck_admin"
$POSTGRES_DB = "trustcheck_gov_data"

# Step 1: Download data from Bank of Israel
if (-not $SkipDownload) {
    Write-Host "📥 Step 1: Downloading Mugbalim data from BOI..." -ForegroundColor Yellow
    
    # Create output directory
    if (-not (Test-Path $OUTPUT_DIR)) {
        New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
    }
    
    try {
        # Download file
        Write-Host "   Downloading from: $BOI_URL"
        $response = Invoke-WebRequest -Uri $BOI_URL -OutFile "$OUTPUT_DIR/boi_mugbalim.zip" -PassThru
        
        Write-Host "   Downloaded: $(($response.RawContentLength / 1KB).ToString('N2')) KB" -ForegroundColor Green
        
        # Extract ZIP
        Write-Host "   Extracting ZIP file..."
        Expand-Archive -Path "$OUTPUT_DIR/boi_mugbalim.zip" -DestinationPath $OUTPUT_DIR -Force
        
        # Find CSV/Excel file in extracted content
        $extractedFiles = Get-ChildItem -Path $OUTPUT_DIR -Include *.csv,*.xlsx,*.xls -Recurse
        
        if ($extractedFiles.Count -eq 0) {
            throw "No CSV or Excel file found in ZIP"
        }
        
        $sourceFile = $extractedFiles[0].FullName
        Write-Host "   Found data file: $($extractedFiles[0].Name)"
        
        # Convert to UTF-8 CSV if needed
        if ($sourceFile -like "*.csv") {
            # Read with Windows-1255 encoding and save as UTF-8
            $content = Get-Content $sourceFile -Encoding ([System.Text.Encoding]::GetEncoding(1255))
            $content | Set-Content $OUTPUT_FILE -Encoding UTF8
        } else {
            # Excel file - need to convert to CSV
            Write-Host "   Converting Excel to CSV..."
            # TODO: Add Excel conversion logic using Import-Excel module
            throw "Excel conversion not implemented yet. Please convert manually to CSV."
        }
        
        Write-Host "   ✅ Data saved to: $OUTPUT_FILE" -ForegroundColor Green
        
    } catch {
        Write-Host "   ❌ Error downloading Mugbalim data: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Skipping download (using existing file: $InputFile)" -ForegroundColor Yellow
    $OUTPUT_FILE = $InputFile
}

# Step 2: Validate CSV structure
Write-Host "`n📋 Step 2: Validating CSV structure..." -ForegroundColor Yellow

if (-not (Test-Path $OUTPUT_FILE)) {
    Write-Host "   ❌ CSV file not found: $OUTPUT_FILE" -ForegroundColor Red
    exit 1
}

$csvSample = Get-Content $OUTPUT_FILE -First 5
Write-Host "   CSV sample (first 5 lines):"
$csvSample | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

# Step 3: Import to PostgreSQL
Write-Host "`n💾 Step 3: Importing to PostgreSQL..." -ForegroundColor Yellow

# Check if table exists
Write-Host "   Checking if boi_mugbalim table exists..."
$tableCheck = docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boi_mugbalim');"

if ($tableCheck -ne "t") {
    Write-Host "   ❌ Table boi_mugbalim does not exist. Run init_v3.sql first!" -ForegroundColor Red
    exit 1
}

# Copy CSV to container
Write-Host "   Copying CSV to Docker container..."
docker cp $OUTPUT_FILE ${POSTGRES_CONTAINER}:/tmp/boi_mugbalim.csv

# Import CSV
Write-Host "   Importing data to boi_mugbalim table..."

$importSQL = @"
-- Mark existing records as removed (they may be reinstated if in new file)
UPDATE boi_mugbalim SET status = 'removed', removal_date = CURRENT_DATE WHERE status = 'active';

-- Import new data
CREATE TEMP TABLE temp_mugbalim (
    id_number TEXT,
    name_hebrew TEXT,
    account_type TEXT,
    restriction_date DATE,
    bank_name TEXT,
    bank_code TEXT
);

-- Copy data from CSV (adjust columns based on actual BOI format)
\COPY temp_mugbalim(id_number, name_hebrew, account_type, restriction_date, bank_name, bank_code) FROM '/tmp/boi_mugbalim.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- Upsert to main table
INSERT INTO boi_mugbalim (id_number, name_hebrew, account_type, restriction_date, bank_name, bank_code, status)
SELECT 
    id_number,
    name_hebrew,
    COALESCE(account_type, 'business'),
    restriction_date,
    bank_name,
    bank_code,
    'active'
FROM temp_mugbalim
ON CONFLICT (id_number, restriction_date) 
DO UPDATE SET 
    status = 'active',
    removal_date = NULL,
    last_updated = CURRENT_TIMESTAMP;

DROP TABLE temp_mugbalim;
"@

# Execute import
try {
    docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c $importSQL
    Write-Host "   ✅ Import completed successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Import failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Verify import
Write-Host "`n✅ Step 4: Verifying import..." -ForegroundColor Yellow

$stats = docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'active') as active_restrictions,
    COUNT(*) FILTER (WHERE status = 'removed') as removed_restrictions,
    COUNT(*) FILTER (WHERE account_type = 'business') as businesses,
    COUNT(*) FILTER (WHERE account_type = 'individual') as individuals
FROM boi_mugbalim;
"

Write-Host $stats

# Sample data
Write-Host "`n📊 Sample Mugbalim Records:" -ForegroundColor Cyan
$sample = docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT id_number, name_hebrew, restriction_date, bank_name, status 
FROM boi_mugbalim 
WHERE status = 'active'
ORDER BY restriction_date DESC 
LIMIT 5;
"

Write-Host $sample

Write-Host "`n✅ Bank of Israel Mugbalim import completed!" -ForegroundColor Green
Write-Host "   Data source: $BOI_URL"
Write-Host "   Local cache: $OUTPUT_FILE"
Write-Host "   PostgreSQL table: boi_mugbalim"
Write-Host "`n💡 Tip: Run this script daily to keep data fresh (add to cron/Task Scheduler)"
