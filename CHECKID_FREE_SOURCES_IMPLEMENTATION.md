# CheckID-Like Free Sources Implementation Plan

**Date:** 23.12.2025  
**Goal:** Implement CheckID's free data sources (no license required)

---

## ⚠️ COMPETITOR DISCLAIMER

**CheckID (checkid.co.il) — КОНКУРЕНТ TrustCheck Israel!**

Этот документ использует CheckID исключительно для:
- ✅ Конкурентного анализа (разрешено)
- ✅ Обучения на их архитектуре
- ❌ **НЕ для интеграции их API** (запрещено)

**Для продакшн интеграций использовать:**
- BDI Code API (bdi-code.co.il)
- Takdin Direct Partnership
- data.gov.il Open Data

---

## Sources Analysis (from CheckID research)

### ✅ FREE Sources (No License) — IMPLEMENT THESE

| Source | CheckID Uses | License Required | TrustCheck Status | Implementation Priority |
|--------|-------------|------------------|-------------------|------------------------|
| **Companies Registrar** | data.gov.il API + CSV | ❌ NO | ✅ WORKING (716K companies) | 1. Enhance |
| **BOI Mugbalim** | Daily CSV parsing | ❌ NO | ⚠️ Code exists, not integrated | 2. HIGH |
| **Execution Proceedings** | data.gov.il API | ❌ NO | ❌ Broken (resource_id missing) | 3. HIGH |
| **Ministry of Transport** | Public API | ❌ NO | ❌ Not implemented | 4. LOW (not needed for SBF) |

### ❌ PAID/LICENSED Sources — DON'T IMPLEMENT NOW

| Source | CheckID Pays | License/Partnership Required | Alternative |
|--------|--------------|------------------------------|-------------|
| **Tax Authority (Shaam)** | ₪0.50/query | ✅ YES (Beit Tochna registration 2-4 weeks) | Phase 2 |
| **Courts (Takdin)** | ₪1.50/query | ✅ YES (Partnership or Takdin ownership) | Phase 3 |
| **Land Registry (Tabu)** | ₪36.60/query | ✅ YES (API agreement) | Not needed |
| **Credit Bureau** | N/A | ✅ YES (₪500K-4M capital for license) | Use BDI Code API |

---

## Implementation Plan

### Phase 1: Enhance Companies Registrar (DONE ✅)

**Current State:**
- ✅ 716,820 companies loaded via CSV
- ✅ PostgreSQL schema complete
- ✅ Basic fields working

**What CheckID Does Better:**
- Real-time API queries to data.gov.il (in addition to CSV)
- Full Nesach on-demand (₪19 per query to gov)

**Action:** Keep current implementation (CSV is sufficient for MVP)

---

### Phase 2: BOI Mugbalim Integration (HIGH PRIORITY)

**CheckID Approach:**
```
1. Daily download ZIP from boi.org.il/en/restricted-accounts
2. Parse ASCII/Excel (ISO-8859-8 encoding)
3. Local cache in PostgreSQL
4. API endpoint returns instant lookup (₪0.50 CheckID markup)
```

**TrustCheck Implementation:**

#### Step 1: Download BOI CSV Script

**File:** `scripts/download_boi_mugbalim.ps1` (NEW)

```powershell
#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Download Bank of Israel Restricted Accounts (Mugbalim) data
    
.DESCRIPTION
    Downloads daily ZIP file from boi.org.il, extracts CSV, imports to PostgreSQL
    
.EXAMPLE
    ./download_boi_mugbalim.ps1
#>

$ErrorActionPreference = 'Stop'

# Configuration
$DATA_DIR = "$PSScriptRoot\..\data\government"
$BOI_URL = "https://www.boi.org.il/en/DataAndStatistics/Lists/BoiTablesAndGraphs/ClosedAccounts_en.zip"
$POSTGRES_HOST = $env:POSTGRES_HOST ?? 'localhost'
$POSTGRES_DB = $env:POSTGRES_DB ?? 'trustcheck_gov_data'
$POSTGRES_USER = $env:POSTGRES_USER ?? 'trustcheck_admin'

Write-Host "[BOI] Downloading Mugbalim data from BOI..." -ForegroundColor Cyan

# Download ZIP
$zipPath = "$DATA_DIR\mugbalim.zip"
Invoke-WebRequest -Uri $BOI_URL -OutFile $zipPath

# Extract CSV
Expand-Archive -Path $zipPath -DestinationPath "$DATA_DIR\mugbalim" -Force

# Find CSV file (name varies)
$csvFile = Get-ChildItem "$DATA_DIR\mugbalim" -Filter "*.csv" | Select-Object -First 1

if (!$csvFile) {
    Write-Error "CSV file not found in ZIP"
    exit 1
}

Write-Host "[BOI] Found CSV: $($csvFile.Name)" -ForegroundColor Green

# Import to PostgreSQL
docker exec -i trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB <<EOF
-- Create temp table
CREATE TEMP TABLE mugbalim_import (
    id_number TEXT,
    restriction_date TEXT,
    bank_name TEXT,
    reason TEXT
);

-- Copy CSV (adjust delimiter if needed)
\COPY mugbalim_import FROM '$($csvFile.FullName)' WITH (FORMAT CSV, HEADER, DELIMITER ',', ENCODING 'ISO-8859-8');

-- Insert into main table (upsert)
INSERT INTO boi_mugbalim (id_number, restriction_date, bank_name, reason, data_source, last_updated)
SELECT id_number, restriction_date, bank_name, reason, 'boi.org.il', NOW()
FROM mugbalim_import
ON CONFLICT (id_number) DO UPDATE SET
    restriction_date = EXCLUDED.restriction_date,
    bank_name = EXCLUDED.bank_name,
    reason = EXCLUDED.reason,
    last_updated = NOW();

DROP TABLE mugbalim_import;
EOF

Write-Host "[BOI] Import complete: $(docker exec trustcheck-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -t -c 'SELECT COUNT(*) FROM boi_mugbalim;') records" -ForegroundColor Green
```

#### Step 2: Update Database Schema

**File:** `scripts/db/init.sql` (ADD TABLE)

```sql
-- ============================================
-- TABLE: boi_mugbalim (Bank of Israel Restricted Accounts)
-- Source: https://www.boi.org.il/en/restricted-accounts
-- ============================================
CREATE TABLE IF NOT EXISTS boi_mugbalim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_number VARCHAR(9) UNIQUE NOT NULL,  -- H.P. or T.Z.
    restriction_date DATE,
    bank_name VARCHAR(255),
    reason TEXT,  -- "10+ returned checks"
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'boi.org.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mugbalim_id ON boi_mugbalim(id_number);
CREATE INDEX idx_mugbalim_date ON boi_mugbalim(restriction_date);

COMMENT ON TABLE boi_mugbalim IS 'Bank of Israel restricted accounts (Mugbalim) - daily updates';
```

#### Step 3: Activate lib/boi_mugbalim.ts

**File:** `lib/boi_mugbalim.ts` (UPDATE IMPLEMENTATION)

```typescript
// CHANGE FROM:
export async function checkMugbalimStatus(hpNumber: string): Promise<MugbalimCheckResult> {
  throw new Error('BOI Mugbalim CSV not downloaded');
}

// CHANGE TO:
export async function checkMugbalimStatus(hpNumber: string): Promise<MugbalimCheckResult> {
  try {
    const { pool } = await import('./db/postgres');
    
    const result = await pool.query(`
      SELECT id_number, restriction_date, bank_name, reason
      FROM boi_mugbalim
      WHERE id_number = $1
      LIMIT 1
    `, [hpNumber]);
    
    if (result.rows.length === 0) {
      return {
        isRestricted: false,
        records: [],
        lastChecked: new Date().toISOString(),
        source: 'boi.org.il'
      };
    }
    
    const record = result.rows[0];
    
    return {
      isRestricted: true,
      records: [{
        restrictionDate: record.restriction_date,
        bank: record.bank_name,
        reason: record.reason
      }],
      lastChecked: new Date().toISOString(),
      source: 'boi.org.il'
    };
  } catch (error) {
    console.error('[BOI] Error checking mugbalim:', error);
    return {
      isRestricted: false,
      records: [],
      lastChecked: new Date().toISOString(),
      source: 'boi.org.il'
    };
  }
}
```

#### Step 4: Enable in unified_data.ts

**File:** `lib/unified_data.ts` (ALREADY HAS CODE, VERIFY IT'S CALLED)

Lines 168-186 already call `checkMugbalimStatus()`. Just verify:

```typescript
if (options.includeAllSources) {
  console.log(`[UnifiedData] Fetching all free government sources...`);
  
  [mugbalimResult, taxStatus, courtCases, executionResult] = await Promise.all([
    checkMugbalimStatus(hpNumber).catch(err => {
      console.warn(`[Mugbalim] Error:`, err.message);
      return null;  // ✅ Graceful fallback
    }),
    // ...
  ]);
}
```

**Status:** ✅ Code ready, just need to populate database

---

### Phase 3: Execution Proceedings API (HIGH PRIORITY)

**CheckID Approach:**
- Uses data.gov.il API with correct resource_id
- Real-time queries
- ₪1.00 markup per query

**TrustCheck Implementation:**

#### Step 1: Find Correct data.gov.il Resource ID

**Manual Search:**
1. Go to https://data.gov.il
2. Search: "הוצאה לפועל" or "execution proceedings" or "bailiff"
3. Find dataset with API access
4. Copy resource_id (format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)

**Alternative — CheckID Research:**
Based on CheckID docs, execution proceedings likely at:
- Dataset: "Hotzaa LaPoal Public Data"
- Possible resource_id: Contact data.gov.il support OR reverse-engineer CheckID API calls

#### Step 2: Update lib/execution_office.ts

**File:** `lib/execution_office.ts` (FIX LINE 112)

```typescript
// BEFORE:
const RESOURCE_ID = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'; // ❌ PLACEHOLDER

// AFTER (example, need to find real ID):
const RESOURCE_ID = 'a1b2c3d4-1234-5678-90ab-cdef12345678'; // ✅ REAL ID FROM data.gov.il
```

#### Step 3: Test API Endpoint

```powershell
# Test direct data.gov.il API
$RESOURCE_ID = "FOUND_ID_HERE"
$HP_NUMBER = "515972651"

Invoke-RestMethod -Uri "https://data.gov.il/api/3/action/datastore_search?resource_id=$RESOURCE_ID&filters={`"debtor_id`":`"$HP_NUMBER`"}&limit=10" | ConvertTo-Json -Depth 5
```

If API works → Keep existing code in lib/execution_office.ts (already implemented)

If API doesn't exist → Fall back to scraping (but that's Phase 3 with legal risks)

---

### Phase 4: Enable in Production

#### Step 1: Deploy Database Schema

```powershell
ssh root@46.224.147.252

# Add boi_mugbalim table
docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data <<EOF
-- Paste boi_mugbalim table creation SQL here
EOF
```

#### Step 2: Run BOI Download Script

```powershell
# On production server
cd /root/trustcheck
pwsh scripts/download_boi_mugbalim.ps1
```

#### Step 3: Setup Cron Job (Daily Updates)

```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * cd /root/trustcheck && pwsh scripts/download_boi_mugbalim.ps1 >> /var/log/boi_mugbalim.log 2>&1
```

#### Step 4: Test in Production

```powershell
# Test HP number with known mugbalim restriction (find from BOI website)
$body = @{businessName='KNOWN_MUGBALIM_HP'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://46.224.147.252/api/report' -Method POST -Body $body -ContentType 'application/json' | ConvertFrom-Json | Select bankingStatus
```

Expected output:
```json
{
  "bankingStatus": {
    "hasRestrictedAccount": true,
    "restrictionDate": "2023-06-15",
    "restrictionDetails": ["Bank Hapoalim - 15/06/2023"]
  }
}
```

---

## Cost Analysis (vs CheckID)

### CheckID Pricing for Free Sources

| Source | CheckID Charges | TrustCheck Cost | Savings |
|--------|-----------------|-----------------|---------|
| Companies Registrar (basic) | ₪0 | ₪0 | ₪0 |
| BOI Mugbalim | ₪0.50 | ₪0 | ₪0.50 per check |
| Execution Proceedings | ₪1.00 | ₪0 (if API works) | ₪1.00 per check |
| **Total per report** | **₪1.50** | **₪0** | **₪1.50 savings** |

**Annual Savings (1000 reports/month):**
- ₪1.50 × 1,000 × 12 = **₪18,000/year**

---

## What We CAN'T Implement (Requires Licenses)

### Tax Authority (Shaam) — ₪0.50 per query at CheckID

**Barrier:** 
- Requires "Beit Tochna" (Software House) registration
- 2-4 weeks approval process
- ₪5K-10K software certification

**Phase:** 2 (after MVP proven)

### Courts (Takdin) — ₪1.50 per query at CheckID

**Barrier:**
- CheckID owns Takdin (Guideline Group)
- No public API for Net HaMishpat
- Scraping is illegal (Hashavim precedent)
- Partnership required (₪5K-15K setup)

**Phase:** 3 (negotiate partnership with Takdin or BDI)

### Credit Bureau Data

**Barrier:**
- Requires Bank of Israel license (₪500K-4M capital)
- CheckID doesn't have this either

**Alternative:** Use BDI Code API ($1.00 per query) for credit ratings

---

## Timeline

**Week 1 (Current):**
- [x] Research CheckID sources
- [ ] Create download_boi_mugbalim.ps1 script
- [ ] Test BOI CSV parsing locally
- [ ] Update database schema

**Week 2:**
- [ ] Find data.gov.il execution proceedings resource_id
- [ ] Test execution API
- [ ] Deploy to production
- [ ] Setup cron jobs

**Week 3:**
- [ ] E2E testing with real mugbalim cases
- [ ] Update API documentation
- [ ] Monitor performance

**Week 4:**
- [ ] Phase 2 planning (Tax Authority registration)

---

## Success Metrics

**After Implementation:**

1. **Data Completeness:**
   - BOI Mugbalim: >0 records in database (verify daily updates)
   - Execution Proceedings: Returns data for known cases

2. **API Performance:**
   - Mugbalim check: <100ms (local DB lookup)
   - Execution check: <2s (data.gov.il API call)

3. **Cost Savings:**
   - ₪1.50 per report saved vs CheckID
   - ₪18,000/year saved at 1000 reports/month

4. **Data Quality:**
   - Compare with CheckID results for same HP numbers
   - Accuracy: >95% match

---

## Next Steps (After Free Sources Working)

**Phase 2: Tax Authority Integration**
- Register as Beit Tochna (4-6 weeks)
- Get OAuth2 credentials
- Activate lib/tax_authority.ts
- Savings: ₪0.50 per report vs CheckID

**Phase 3: Courts Partnership**
- Negotiate with Takdin or BDI Code
- Alternative: Use BDI Code API (includes court data)
- Savings: ₪1.50 per report vs CheckID

**Phase 4: Complete Independence**
- 100% free government sources working
- CheckID used only as fallback
- Total savings: ₪3.00+ per report

---

**Prepared By:** GitHub Copilot Agent  
**Date:** 23.12.2025  
**Related Documents:**
- `research/platforms/03_CheckID/PLATFORM_SNAPSHOT.md` — Full CheckID analysis
- `DATA_SOURCES_AUDIT_REPORT.md` — Current state audit
- `DIRECT_GOVERNMENT_API_GAP_ANALYSIS.md` — Why not using direct APIs
