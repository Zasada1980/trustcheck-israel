# Tax Certificates Database Discovery Report

**Date:** 23.12.2025  
**Discovered by:** User  
**URL:** https://taxinfo.taxes.gov.il/gmishurim/

---

## Executive Summary

Discovered **public tax certificates database** containing critical business data that official Tax Authority APIs do NOT provide:

✅ **ניהול ספרים (Bookkeeping Approval)** — approval status + expiration  
✅ **ניכוי מס במקור (Withholding Tax Certificates)** — multiple categories  
✅ **No Authentication Required** — public access  
✅ **Free Data** — no API fees (unlike BDI Code ₪1-2/query)

**Impact:** This discovery **CHANGES** integration strategy. Instead of relying solely on paid APIs, we can scrape public government data.

---

## Database Overview

### Access Information

**Main URL:** https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx  
**Query Interface:** Web forms (POST requests), NOT REST API  
**Authentication:** None (public access)  
**Rate Limiting:** Unknown (need testing)

### Available Data

Based on user-provided example (company 515972651):

```
פרטים מזהים (Identifying Details):
- ישות (Entity): 515972651
- שם (Name): א.א.ג ארט עיצוב ושירות בע"מ
- תיק מע''מ (VAT File): 515972651
- תיק מ''ה (Withholding Tax File): 515972651

אישור ניכוי מס במקור (Withholding Tax Certificate):
- שרותים נכסים (Services): עפ''י תקנות מ''ה (per regulations)
- בניה והובלה (Construction/Transport): עפ''י תקנות מ''ה
- שמירה ניקיון (Security/Cleaning): עפ''י תקנות מ''ה
- שרותי הפקה (Production): עפ''י תקנות מ''ה
- ייעוץ (Consulting): עפ''י תקנות מ''ה
- תכנון ופרסום (Planning/Advertising): עפ''י תקנות מ''ה
- שרותי מחשוב (IT Services): עפ''י תקנות מ''ה
- ביטוח ופנסיה (Insurance/Pension): אין אישור (no approval)

תוקף אישור ניהול ספרים (Bookkeeping Approval Validity):
- Status: אין אישור (no approval)
- Expiration: N/A
```

### Data Categories

1. **Withholding Tax Certificates (אישור ניכוי מס במקור)**
   - Services (שרותים נכסים)
   - Construction & Transport (בניה והובלה)
   - Security & Cleaning (שמירה ניקיון)
   - Production Services (שרותי הפקה)
   - Consulting (ייעוץ)
   - Planning & Advertising (תכנון ופרסום)
   - IT Services (שרותי מחשוב)
   - Insurance & Pension (ביטוח ופנסיה)

2. **Bookkeeping Approval (ניהול ספרים)**
   - Approval status (יש אישור / אין אישור)
   - Expiration date (תוקף)

---

## Technical Architecture

### Current Implementation

**Type:** ASP.NET Web Forms application  
**Framework:** Bootstrap + jQuery + AngularJS + Kendo UI  
**Character Set:** UTF-8 (Hebrew RTL)  
**Session:** Stateless (no login required for single queries)

### Query Workflow

```
User Flow:
1. Navigate to https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx
2. Select option: "אישור לישות" (Certificate for Entity)
3. Enter HP number (9 digits)
4. Submit form (POST request)
5. Receive HTML page with certificate data

Current Challenge:
- URL parameter ?cur=515972651 → redirects to input form
- Direct access NOT supported
- Requires POST request emulation
```

### HTML Structure (Test Fetch)

**Command tested:**
```powershell
Invoke-WebRequest -Uri 'https://taxinfo.taxes.gov.il/gmishurim/frmIshurimInfo.aspx?cur=515972651'
```

**Result:**
- ✅ HTTP 200 (page accessible)
- ✅ UTF-8 encoding correct
- ❌ No company data (shows input form instead)
- ❌ Requires POST submission

**Key HTML elements found:**
```html
<h2>מידע על אישורי ניכוי מס במקור וניהול ספרים</h2>
<input id="rbMekabel" type="radio" name="rb" value="frmInputMekabel.aspx?cur=0" title="אישור לתיק" />
<label>אישור לישות</label>
```

---

## Integration Options

### Option A: Browser Automation (Recommended)

**Technology:** Playwright or Puppeteer  
**Pros:**
- ✅ Handles JavaScript rendering
- ✅ Fills forms automatically
- ✅ Parses dynamic content
- ✅ Can handle CAPTCHAs (if added later)

**Cons:**
- ❌ Slower (1-3 seconds per query)
- ❌ Requires headless browser
- ❌ Higher resource usage

**Implementation:**
```typescript
// lib/scrapers/tax_certificates.ts
import { chromium } from 'playwright';

async function getTaxCertificates(hpNumber: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Navigate to form
  await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx');
  
  // 2. Select "אישור לישות"
  await page.click('#rbMekabel');
  
  // 3. Navigate to input form
  await page.click('button[type="submit"]');
  
  // 4. Enter HP number
  await page.fill('#txtHP', hpNumber);
  
  // 5. Submit
  await page.click('#btnSubmit');
  
  // 6. Wait for results
  await page.waitForSelector('.results-table');
  
  // 7. Parse data
  const data = await page.evaluate(() => {
    return {
      hpNumber: document.querySelector('#hp').textContent,
      name: document.querySelector('#name').textContent,
      vatFile: document.querySelector('#vat').textContent,
      withholdingTaxFile: document.querySelector('#withholding').textContent,
      bookkeepingApproval: document.querySelector('#bookkeeping').textContent,
      // ... extract all fields
    };
  });
  
  await browser.close();
  return data;
}
```

**Cost:** Free (open-source library)  
**Maintenance:** Medium (may break if UI changes)

---

### Option B: Direct HTTP Emulation (Faster)

**Technology:** axios + cheerio  
**Pros:**
- ✅ Fast (<500ms per query)
- ✅ Low resource usage
- ✅ No browser required

**Cons:**
- ❌ Must reverse-engineer POST parameters
- ❌ May need cookies/session management
- ❌ ViewState complexity (ASP.NET)

**Implementation:**
```typescript
// lib/scrapers/tax_certificates_http.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

async function getTaxCertificates(hpNumber: string) {
  const client = axios.create({
    baseURL: 'https://taxinfo.taxes.gov.il/gmishurim/',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'he-IL',
    },
  });
  
  // 1. GET initial form (retrieve ViewState)
  const formPage = await client.get('frmInputMekabel.aspx?cur=0');
  const $form = cheerio.load(formPage.data);
  const viewState = $form('#__VIEWSTATE').val();
  const eventValidation = $form('#__EVENTVALIDATION').val();
  
  // 2. POST with HP number
  const resultPage = await client.post('frmIshurimInfo.aspx', {
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    txtHP: hpNumber,
    btnSubmit: 'חיפוש',
  });
  
  // 3. Parse results
  const $result = cheerio.load(resultPage.data);
  return {
    hpNumber: $result('#hp').text(),
    name: $result('#name').text(),
    // ... extract fields
  };
}
```

**Cost:** Free  
**Maintenance:** High (ViewState changes, form parameter changes)

---

### Option C: Hybrid Approach (Best of Both)

**Strategy:**
1. **Development:** Use Playwright for rapid prototyping
2. **Production:** Switch to HTTP emulation after reverse-engineering
3. **Fallback:** If HTTP breaks, fall back to Playwright

**Benefits:**
- ✅ Fast iteration during development
- ✅ Optimal performance in production
- ✅ Resilience against changes

---

## Data Quality Assessment

### Coverage Testing Plan

**Phase 1: Sample Testing (10 companies)**
- 515972651 — Known: אין אישור (no bookkeeping approval)
- 510000334 — עין שרה (clean company from previous tests)
- 5 random companies from PostgreSQL (active status)
- 3 random companies (inactive status)
- Test: Check if data exists for all

**Phase 2: Statistical Analysis (1,000 companies)**
- Query 1,000 random companies from government dataset
- Measure:
  * Data availability rate (% with certificate info)
  * Bookkeeping approval rate (% with ניהול ספרים)
  * Withholding tax coverage (% with ניכוי מס)
  * Response time (avg query duration)

**Phase 3: Accuracy Validation**
- Compare with Companies Registrar data
- Cross-check with BDI Code API (sample)
- Verify against known companies

---

## Legal Considerations

### Public Data Doctrine

**Israeli Law:** Public government databases are generally scrapable if:
1. ✅ **Publicly accessible** (no paywall/login) — YES
2. ✅ **No robots.txt restrictions** — NEED TO CHECK
3. ✅ **No Terms of Service violations** — NEED TO CHECK
4. ✅ **Reasonable rate limiting** — IMPLEMENT
5. ✅ **No circumvention of security** — NOT REQUIRED

### Robots.txt Check

**Action Required:**
```powershell
curl https://taxinfo.taxes.gov.il/robots.txt
```

**Expected Result:**
- If no robots.txt → Scraping allowed by default
- If robots.txt exists → Check for `/gmishurim/` restrictions

### Terms of Service

**Action Required:** Review https://taxinfo.taxes.gov.il/terms  
**Key Questions:**
- Is automated access prohibited?
- Are there usage limits?
- Is commercial use allowed?

---

## Implementation Plan

### Phase 1: Proof of Concept (Week 1)

**Goal:** Validate data accessibility and quality

1. **Set up Playwright** (1 day)
   ```bash
   npm install playwright
   npx playwright install chromium
   ```

2. **Create scraper module** (2 days)
   ```typescript
   // lib/scrapers/tax_certificates.ts
   export async function getTaxCertificates(hpNumber: string): Promise<TaxCertificates>
   ```

3. **Test with 10 companies** (1 day)
   - 515972651 (known data from user)
   - 510000334 (עין שרה)
   - 8 random from PostgreSQL

4. **Document findings** (1 day)
   - Data structure
   - Field mappings
   - Edge cases (missing data, errors)

**Deliverables:**
- Working scraper function
- Test report (10 companies)
- Data schema definition

---

### Phase 2: Integration (Week 2)

**Goal:** Add certificates data to TrustCheck reports

1. **Update TypeScript interfaces** (1 day)
   ```typescript
   // lib/unified_data.ts
   interface TaxCertificates {
     hpNumber: string;
     vatFile: string;
     withholdingTaxFile: string;
     withholdingTaxCategories: {
       services: CertificateStatus;
       construction: CertificateStatus;
       security: CertificateStatus;
       production: CertificateStatus;
       consulting: CertificateStatus;
       planning: CertificateStatus;
       it: CertificateStatus;
       insurance: CertificateStatus;
     };
     bookkeepingApproval: {
       hasApproval: boolean;
       expirationDate: string | null;
     };
     lastUpdated: string;
   }
   
   type CertificateStatus = 'עפ\'\'י תקנות מ\'\'ה' | 'אין אישור' | 'לא ידוע';
   ```

2. **Integrate with unified_data.ts** (2 days)
   ```typescript
   export async function getBusinessData(
     hpNumber: string,
     options?: DataFetchOptions
   ): Promise<UnifiedBusinessData> {
     // ... existing fetches
     
     // NEW: Fetch tax certificates
     const taxCerts = await getTaxCertificates(hpNumber);
     
     return {
       // ... existing data
       taxCertificates: taxCerts,
     };
   }
   ```

3. **Update risk scoring** (1 day)
   ```typescript
   riskIndicators: {
     // ... existing
     hasNoBookkeepingApproval: !taxCerts.bookkeepingApproval.hasApproval,
     hasLimitedWithholdingTax: countNoApprovals(taxCerts.withholdingTaxCategories) > 3,
   }
   ```

4. **Update Gemini prompts** (1 day)
   ```typescript
   // lib/gemini.ts
   const prompt = `
   ...
   
   אישורי מס (Tax Certificates):
   - ניהול ספרים: ${taxCerts.bookkeepingApproval.hasApproval ? 'יש אישור' : 'אין אישור'}
   - ניכוי מס במקור: [list categories]
   
   **משמעות:** עסק ללא אישור ניהול ספרים לא מנהל הנהלת חשבונות תקינה
   `;
   ```

**Deliverables:**
- Updated data structures
- Tax certificates in reports
- Enhanced risk indicators

---

### Phase 3: Caching & Optimization (Week 3)

**Goal:** Improve performance and reduce scraping load

1. **Add PostgreSQL table** (1 day)
   ```sql
   CREATE TABLE tax_certificates (
     hp_number BIGINT PRIMARY KEY,
     name TEXT,
     vat_file BIGINT,
     withholding_tax_file BIGINT,
     bookkeeping_approval BOOLEAN,
     bookkeeping_expiration DATE,
     withholding_tax_data JSONB,
     last_updated TIMESTAMP DEFAULT NOW(),
     INDEX idx_last_updated (last_updated)
   );
   ```

2. **Implement caching layer** (2 days)
   ```typescript
   async function getCachedTaxCertificates(hpNumber: string): Promise<TaxCertificates> {
     // 1. Check cache (PostgreSQL)
     const cached = await db.query(
       'SELECT * FROM tax_certificates WHERE hp_number = $1 AND last_updated > NOW() - INTERVAL \'7 days\'',
       [hpNumber]
     );
     
     if (cached.rows.length > 0) {
       return cached.rows[0]; // Use cached data (fresh within 7 days)
     }
     
     // 2. Scrape fresh data
     const fresh = await getTaxCertificates(hpNumber);
     
     // 3. Update cache
     await db.query(
       'INSERT INTO tax_certificates (...) VALUES (...) ON CONFLICT (hp_number) DO UPDATE SET ...',
       [fresh]
     );
     
     return fresh;
   }
   ```

3. **Rate limiting** (1 day)
   - Delay between scrapes: 2-5 seconds
   - Max concurrent scrapes: 3
   - Daily limit: 1,000 companies

4. **Background refresh** (1 day)
   - Cron job: Daily refresh of top 100 companies
   - Async worker: Refresh on-demand for searched companies

**Deliverables:**
- PostgreSQL schema + indexes
- Caching logic
- Rate limiting middleware
- Background worker

---

### Phase 4: Production Deployment (Week 4)

**Goal:** Deploy to Hetzner server with monitoring

1. **Legal review** (2 days)
   - Check robots.txt
   - Review Terms of Service
   - Consult legal advisor (if needed)
   - Document compliance

2. **Add monitoring** (1 day)
   ```typescript
   // lib/analytics.ts
   export function trackCertificateScrape(
     hpNumber: string,
     success: boolean,
     duration: number,
     errorMessage?: string
   ) {
     // Google Analytics
     gtag('event', 'certificate_scrape', {
       hp_number: hpNumber,
       success,
       duration_ms: duration,
       error: errorMessage,
     });
     
     // Internal logging
     logger.info('Certificate scrape', {
       hpNumber,
       success,
       duration,
       errorMessage,
     });
   }
   ```

3. **Error handling** (1 day)
   - Retry logic (3 attempts)
   - Fallback to "data unavailable"
   - Alert on high failure rate

4. **Deploy** (1 day)
   - Push to GitHub
   - SSH to Hetzner
   - `docker-compose down && docker-compose up -d --build`
   - Verify logs

**Deliverables:**
- Legal compliance document
- Monitoring dashboard
- Production deployment
- Health checks

---

## Cost-Benefit Analysis

### Costs

**Development Time:** 4 weeks (~160 hours)  
**Infrastructure:** ₪0 (runs on existing Hetzner CX23)  
**Maintenance:** 2-4 hours/month (monitoring, updates)

### Benefits

**Direct Savings:**
- BDI Code API: ₪1-2 per query
- Expected queries: 1,000/month (MVP target)
- Savings: ₪1,000-2,000/month = **₪12,000-24,000/year**

**Competitive Advantage:**
- ✅ **Unique data:** Bookkeeping approval (competitors don't have)
- ✅ **Free tier enhancement:** Add certificates to free reports
- ✅ **Premium upsell:** "Tax compliance check included"

**User Value:**
- Parents see: "העסק לא מנהל ניהול ספרים תקין" (red flag)
- Increases trust in TrustCheck accuracy
- Differentiates from competitors

---

## Risks & Mitigation

### Risk 1: Website Structure Changes

**Probability:** Medium  
**Impact:** High (scraper breaks)  

**Mitigation:**
- Unit tests with known data
- Automated daily health checks
- Fallback to "data unavailable" (don't break UX)
- Set up alerts for scrape failures

---

### Risk 2: Rate Limiting / IP Block

**Probability:** Low-Medium  
**Impact:** High (no data)  

**Mitigation:**
- Implement respectful rate limiting (2-5s delays)
- Use rotating User-Agents
- Cache aggressively (7-day TTL)
- Contact Tax Authority if blocked (explain use case)

---

### Risk 3: Legal Issues

**Probability:** Low  
**Impact:** Critical (must stop scraping)  

**Mitigation:**
- Legal review BEFORE production
- Monitor Terms of Service changes
- Comply with robots.txt
- Be transparent (User-Agent: TrustCheckBot)
- Ready to remove feature if challenged

---

### Risk 4: Data Quality Issues

**Probability:** Medium  
**Impact:** Medium (incorrect reports)  

**Mitigation:**
- Test with 1,000 companies before production
- Cross-validate with Companies Registrar
- Add confidence scores to data
- Show "last updated" dates to users

---

## Success Metrics

### Technical KPIs

- **Scraping Success Rate:** >95%
- **Average Query Time:** <3 seconds
- **Cache Hit Rate:** >80% (after 1 month)
- **Daily Scrape Volume:** 100-500 companies

### Business KPIs

- **User Engagement:** +15% time on report pages
- **Premium Conversion:** +5% (certificates data as upsell)
- **Cost Savings:** ₪1,000-2,000/month vs BDI Code
- **Competitive Differentiation:** Unique feature vs 10 competitors

---

## Next Steps

**IMMEDIATE (Today):**
1. ✅ Document discovery (this file)
2. ⏳ Check robots.txt: https://taxinfo.taxes.gov.il/robots.txt
3. ⏳ Review Terms of Service
4. ⏳ Create GitHub issue: "Phase 2: Tax Certificates Scraper"

**SHORT-TERM (This Week):**
1. Install Playwright: `npm install playwright`
2. Create POC scraper: `lib/scrapers/tax_certificates.ts`
3. Test with 10 companies
4. Document findings

**MEDIUM-TERM (Next Sprint):**
1. Legal review completion
2. Integration with unified_data.ts
3. PostgreSQL caching
4. Production deployment

**DECISION POINT:**
- If legal review ❌ FAILS → Fall back to BDI Code API
- If data quality ❌ POOR → Deprioritize feature
- If scraping ✅ SUCCESS → Full integration (4-week plan)

---

## Comparison: Certificates DB vs BDI Code API

| Feature | Tax Certificates DB | BDI Code API |
|---------|---------------------|--------------|
| **Cost** | ₪0 (free scraping) | ₪1-2 per query |
| **Data: Bookkeeping** | ✅ יש/אין אישור | ❌ Not available |
| **Data: Withholding Tax** | ✅ 8 categories | ❌ Not available |
| **Data: Credit Rating** | ❌ Not available | ✅ Credit score |
| **Data: Payment Behavior** | ❌ Not available | ✅ Payment history |
| **Coverage** | Unknown (need testing) | ~80% businesses |
| **Speed** | 1-3 seconds | <500ms |
| **Reliability** | Medium (may break) | High (official API) |
| **Legal Risk** | Medium (scraping) | None (licensed) |
| **Maintenance** | 2-4 hours/month | None |

**Conclusion:** Use BOTH sources!
- **Free Tier:** Certificates DB only
- **Premium Tier:** Certificates DB + BDI Code API

---

## References

- **Database URL:** https://taxinfo.taxes.gov.il/gmishurim/
- **User Discovery:** 23.12.2025 conversation
- **Example Company:** 515972651 (א.א.ג ארט עיצוב ושירות בע"מ)
- **Previous Research:** `research/TAX_AUTHORITY_API_RESEARCH.md`

---

**Report Version:** 1.0  
**Last Updated:** 23.12.2025  
**Author:** GitHub Copilot (based on user discovery)
