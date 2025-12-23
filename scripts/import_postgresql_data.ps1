# TrustCheck Israel — PostgreSQL Data Import Script
# Import 716K companies from data.gov.il into local database

param(
    [Parameter(Mandatory=$false)]
    [string]$PostgresHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [int]$PostgresPort = 5432,
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresDb = "trustcheck_gov_data",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresUser = "trustcheck_admin"
)

Write-Host "🔄 TrustCheck PostgreSQL Data Import" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerStatus = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL container exists
$pgContainer = docker ps --filter "name=trustcheck-postgres" --format "{{.Names}}"
if (-not $pgContainer) {
    Write-Host "❌ PostgreSQL container not found. Start it first:" -ForegroundColor Red
    Write-Host "   docker compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green

# Create data directory if not exists
$dataDir = "E:\SBF\data\government"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "📁 Created directory: $dataDir" -ForegroundColor Green
}

# Download CSV from data.gov.il
$csvUrl = "https://data.gov.il/dataset/246d949c-a253-4811-8a11-41a137d3d613/resource/f004176c-b85f-4542-8901-7b3176f9a054/download/f004176c-b85f-4542-8901-7b3176f9a054.csv"
$csvPath = "$dataDir\companies_registry.csv"

Write-Host ""
Write-Host "⬇️  Downloading Companies Registry CSV (~150 MB)..." -ForegroundColor Cyan

if (Test-Path $csvPath) {
    $response = Read-Host "CSV file already exists. Re-download? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item $csvPath
    } else {
        Write-Host "✅ Using existing CSV file" -ForegroundColor Green
    }
}

if (-not (Test-Path $csvPath)) {
    try {
        # Use WebClient for progress
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($csvUrl, $csvPath)
        Write-Host "✅ Downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Get file size
$fileSize = (Get-Item $csvPath).Length / 1MB
Write-Host "📊 CSV file size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Yellow

# Count lines (estimate records)
Write-Host "🔢 Counting records..." -ForegroundColor Cyan
$lineCount = (Get-Content $csvPath | Measure-Object -Line).Lines - 1
Write-Host "📈 Total companies: $($lineCount.ToString('N0'))" -ForegroundColor Yellow

# Initialize database schema
Write-Host ""
Write-Host "🗄️  Initializing database schema..." -ForegroundColor Cyan

$schemaPath = "E:\SBF\scripts\db\init_v2.sql"
if (-not (Test-Path $schemaPath)) {
    Write-Host "❌ Schema file not found: $schemaPath" -ForegroundColor Red
    exit 1
}

docker exec -i trustcheck-postgres psql -U $PostgresUser -d $PostgresDb < $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema created" -ForegroundColor Green
} else {
    Write-Host "❌ Schema creation failed" -ForegroundColor Red
    exit 1
}

# Import CSV data
Write-Host ""
Write-Host "📥 Importing CSV data (this may take 10-15 minutes)..." -ForegroundColor Cyan
Write-Host "⏳ Please be patient..." -ForegroundColor Yellow

$importStartTime = Get-Date

# Copy CSV into container
docker cp $csvPath trustcheck-postgres:/tmp/companies_registry.csv

# Import using COPY command
$copyCommand = @"
\COPY companies_registry (
  hp_number, name_hebrew, name_english, company_type, status, 
  description, purpose, incorporation_date, government_company, 
  limitations, violations, last_annual_report_year,
  address_city, address_street, address_house_number, address_zipcode,
  address_pobox, address_country, address_care_of, status_sub,
  status_code, company_type_code, company_classification_code,
  purpose_code, limitations_code, violations_code, city_code,
  street_code, country_code
) FROM '/tmp/companies_registry.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
"@

$copyCommand | docker exec -i trustcheck-postgres psql -U $PostgresUser -d $PostgresDb

if ($LASTEXITCODE -eq 0) {
    $importEndTime = Get-Date
    $duration = $importEndTime - $importStartTime
    
    Write-Host ""
    Write-Host "✅ Import completed successfully!" -ForegroundColor Green
    Write-Host "⏱️  Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Yellow
    
    # Get record count
    $countQuery = "SELECT COUNT(*) FROM companies_registry;"
    $recordCount = docker exec -i trustcheck-postgres psql -U $PostgresUser -d $PostgresDb -t -c $countQuery
    
    Write-Host "📊 Records imported: $($recordCount.Trim())" -ForegroundColor Green
} else {
    Write-Host "❌ Import failed" -ForegroundColor Red
    exit 1
}

# Create indexes for performance
Write-Host ""
Write-Host "🔍 Creating indexes..." -ForegroundColor Cyan

$indexes = @"
CREATE INDEX IF NOT EXISTS idx_companies_hp_number ON companies_registry(hp_number);
CREATE INDEX IF NOT EXISTS idx_companies_name_hebrew ON companies_registry(name_hebrew);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies_registry(status);
ANALYZE companies_registry;
"@

$indexes | docker exec -i trustcheck-postgres psql -U $PostgresUser -d $PostgresDb

Write-Host "✅ Indexes created" -ForegroundColor Green

# Cleanup
docker exec trustcheck-postgres rm /tmp/companies_registry.csv

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Data import completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database Statistics:" -ForegroundColor Yellow
Write-Host "   • Total records: $($recordCount.Trim())" -ForegroundColor White
Write-Host "   • Import time: $($duration.ToString('mm\:ss'))" -ForegroundColor White
Write-Host "   • Source: data.gov.il" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Test query:" -ForegroundColor Cyan
Write-Host "   docker exec -i trustcheck-postgres psql -U $PostgresUser -d $PostgresDb -c `"SELECT * FROM companies_registry LIMIT 5;`"" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Your application is now ready to use real government data!" -ForegroundColor Green
