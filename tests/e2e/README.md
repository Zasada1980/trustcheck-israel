# E2E Production Tests for TrustCheck Israel

## Overview

Comprehensive end-to-end tests that validate the entire TrustCheck system against the live production server at `https://trustcheck.co.il`.

## What is Tested

### 1. **API Endpoints**
- `/api/health` - System health check
- `/api/report` - Business report generation

### 2. **AI Agent Accuracy**
- ✅ Business name extraction
- ✅ Business type identification (company/osek_morsheh/osek_patur)
- ✅ Trust score calculation (1.0-5.0)
- ✅ Trust level classification (very_low to very_high)
- ✅ Risk identification
- ✅ Strength identification
- ✅ Recommendation generation
- ✅ Hebrew text generation quality

### 3. **Data Integrity**
- ✅ H.P. number format validation (9 digits)
- ✅ Data source tracking (companies_registry, vat_dealers, osek_morsheh)
- ✅ Response structure validation
- ✅ Required fields presence

### 4. **Error Handling**
- ✅ Invalid H.P. numbers
- ✅ Non-existent businesses
- ✅ Missing parameters
- ✅ Malformed requests

### 5. **Performance**
- ✅ Report generation speed (<10 seconds)
- ✅ Concurrent request handling
- ✅ API response times

### 6. **AI Analysis Quality**
- ✅ Context-aware recommendations
- ✅ Consistency between trust score and level
- ✅ Appropriate risk warnings for low-trust businesses
- ✅ Business age identification
- ✅ Hebrew language quality

## Test Cases

### Test Case 1: Large Established Company
- **H.P. Number**: `520012345`
- **Expected**: High trust score (3.0-5.0), active status, company type
- **Validates**: Positive business analysis, strengths identification

### Test Case 2: VAT Dealer (Osek Morsheh)
- **H.P. Number**: `515044532`
- **Expected**: Medium-high trust (2.0-5.0), osek_morsheh type
- **Validates**: Correct business type classification, VAT data integration

### Test Case 3: Inactive/Problematic Company
- **H.P. Number**: `510123456`
- **Expected**: Low trust score (1.0-3.0), risk warnings
- **Validates**: Risk identification, warning recommendations

## Installation

```powershell
# Navigate to tests directory
cd E:\SBF\tests\e2e

# Install dependencies
npm install
```

## Running Tests

### Run All Tests
```powershell
npm test
```

### Run with Verbose Output
```powershell
npm run test:verbose
```

### Run Specific Test Suite
```powershell
npm test -- --testNamePattern="Health Check"
npm test -- --testNamePattern="Business Report Generation"
npm test -- --testNamePattern="AI Analysis Quality"
```

### Run Single Test Case
```powershell
npm test -- --testNamePattern="test_1_large_company"
```

### Watch Mode (Auto-rerun on changes)
```powershell
npm run test:watch
```

## Expected Output

```
🔍 Testing production server: https://trustcheck.co.il
⏱️  Timeout per test: 30000ms

 PASS  tests/e2e/production.test.ts
  E2E Production Tests - TrustCheck Israel
    Health Check
      ✓ should return healthy status from /api/health (234ms)
    Business Report Generation
      Test Case: test_1_large_company
        ✓ should generate report for H.P. 520012345 (3421ms)
          ✅ Report generated for test_1_large_company:
             Business: Example Company Ltd
             Type: company
             Trust Score: 4.2/5.0
             Trust Level: high
        ✓ should have valid response structure (2ms)
        ✓ should extract business name correctly (1ms)
        ✓ should identify correct business type (1ms)
        ✓ should provide valid trust score (1ms)
        ✓ should have consistent trust level with score (2ms)
        ✓ should generate meaningful summary in Hebrew (3ms)
        ✓ should identify business strengths (2ms)
        ✓ should identify business risks (1ms)
        ✓ should provide actionable recommendations (2ms)
        ✓ should indicate correct data sources (1ms)
        ✓ should have valid H.P. number format (1ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
Time:        28.5s
```

## Success Criteria

✅ **All tests pass** (45/45)  
✅ **Report generation** < 10 seconds  
✅ **Hebrew text quality** validated  
✅ **Trust scores** within expected ranges  
✅ **Error handling** works correctly  
✅ **Concurrent requests** handled properly

## Troubleshooting

### Test Timeout Errors
If tests timeout (>30s), check:
1. Production server status: `curl https://trustcheck.co.il/api/health`
2. Gemini API quota: Check Google Cloud Console
3. PostgreSQL connection: Check database container health

### Failed Trust Score Validation
If trust scores don't match expected ranges:
1. Check if H.P. numbers in test cases are still valid
2. Verify business data in PostgreSQL: `docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT * FROM companies_registry WHERE hp_number=520012345;"`
3. Review Gemini API responses in app logs: `docker logs trustcheck-app`

### Hebrew Text Validation Fails
If Hebrew character tests fail:
1. Check Gemini API response encoding
2. Verify `lib/gemini.ts` uses UTF-8
3. Test Hebrew regex: `/[\u0590-\u05FF]/`

## CI/CD Integration

Add to GitHub Actions (`.github/workflows/e2e.yml`):

```yaml
name: E2E Production Tests

on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: tests/e2e
        run: npm ci
      - name: Run E2E tests
        working-directory: tests/e2e
        run: npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: tests/e2e/test-results/
```

## Monitoring

Track test results over time:
- **Success rate**: Should be >95%
- **Average duration**: Should be <10s per report
- **Error rate**: Should be <5%

## Maintenance

Update test cases when:
1. New H.P. numbers added to database
2. Business data changes (inactive → active)
3. Gemini API prompt updated
4. New data sources added

## Related Files

- `app/api/report/route.ts` - API endpoint implementation
- `lib/gemini.ts` - AI report generation
- `lib/unified_data.ts` - Data fetching logic
- `lib/db/postgres.ts` - Database queries
