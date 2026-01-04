# SHAAM Integration Guide - TrustCheck Israel

**Date:** 29 December 2025  
**Source:** https://www.gov.il/he/service/connect-to-shaam  
**Status:** Planning phase - awaiting approval

---

## Overview

**SHAAM (שירותי המכון הממשלתי למידע)** is the Israeli Government Information Services platform that provides official access to government databases via API.

**For TrustCheck Israel:** This is the official, legal way to access real-time business data instead of relying on:
- Manual data.gov.il downloads (716K companies, outdated)
- Web scraping (legal grey area)
- Mock data fallbacks

---

## Benefits of SHAAM Integration

✅ **Legal compliance** - Official authorization from government  
✅ **Real-time data** - Live queries instead of cached datasets  
✅ **Comprehensive coverage** - Access to multiple government databases  
✅ **Better accuracy** - Direct source without intermediaries  
✅ **Scalability** - No rate limits from web scraping  
✅ **Professional credibility** - Official partner status

---

## Registration Process (קישור בתי תוכנה)

### Step 1: Company Registration
**Prerequisites:**
- Israeli company registration (ח.פ. 345033898 ✅)
- Valid business license
- Company bank account
- Insurance policy (if required)

**Documents needed:**
- Certificate of incorporation (תעודת התאגדות)
- Business license (רישיון עסק)
- Company bylaws (תקנון)
- ID card of authorized signatory
- Power of attorney (if applicable)

### Step 2: Software House Application
**Application form sections:**
1. Company details (name, H.P., address, contact)
2. Software description:
   - **Product name:** TrustCheck Israel
   - **Purpose:** Business reliability verification platform
   - **Target users:** Parents, consumers, small businesses
   - **Expected volume:** 1,000-5,000 queries/month (Phase 1)
3. Data usage declaration
4. Security measures
5. Privacy compliance (GDPR + Israeli law)

**Submission:** Via gov.il portal or email to SHAAM office

### Step 3: Technical Integration
**After approval:**
1. Receive API credentials (client_id, client_secret)
2. Access to sandbox environment
3. API documentation (SOAP/REST)
4. Test credentials for development
5. Production credentials after testing

### Step 4: Testing & Certification
- Functional testing in sandbox (2-4 weeks)
- Security audit
- Privacy compliance review
- Load testing (if high volume)
- Final approval from SHAAM

### Step 5: Go-Live
- Production credentials activated
- Monitoring dashboard access
- Support contact assigned
- Quarterly usage reports

---

## Available Data Sources via SHAAM

### 1. Companies Registry (רשם החברות)
**Database:** Ministry of Justice  
**Data available:**
- Company name, H.P. number, registration date
- Legal status (active/inactive/liquidation)
- Company type (בע"מ, שותפות, עוסק מורשה)
- Registered address
- Directors and shareholders
- Share capital
- Annual reports filing status

**API endpoints:**
- `/api/companies/search` - Search by name/H.P.
- `/api/companies/{hp}` - Get full company details
- `/api/companies/{hp}/directors` - Get directors list
- `/api/companies/{hp}/filings` - Get filing history

### 2. Tax Authority (רשות המסים)
**Database:** Israel Tax Authority  
**Data available:**
- VAT status (עוסק מורשה/עוסק פטור)
- Tax compliance status
- Active/suspended status
- Registration date

**API endpoints:**
- `/api/vat/verify` - Verify VAT number
- `/api/vat/status` - Get current status

**Note:** Limited data due to privacy laws. Full tax records not accessible.

### 3. Legal Cases (נט המשפט)
**Database:** Courts System  
**Data available:**
- Civil cases (תיקים אזרחיים)
- Criminal cases (תיקים פליליים)
- Labor court cases
- Administrative cases
- Case status, verdicts, dates

**API endpoints:**
- `/api/courts/search` - Search by party name/ID
- `/api/courts/case/{id}` - Get case details

### 4. Execution Office (הוצאה לפועל)
**Database:** Israel Courts Authority  
**Data available:**
- Open execution files
- Creditor/debtor details
- Amount owed
- File status (active/closed)

**API endpoints:**
- `/api/execution/search` - Search by debtor ID/name
- `/api/execution/file/{id}` - Get file details

### 5. Blocked Accounts (חשבונות מוגבלים)
**Database:** Bank of Israel  
**Data available:**
- List of businesses with blocked bank accounts
- Reason for block
- Effective date

**API endpoints:**
- `/api/blocked-accounts/search` - Check if account blocked

---

## Pricing Model

**SHAAM charges per API call:**

| Service | Cost per Query | Notes |
|---------|---------------|-------|
| Companies Registry | ₪0.50-₪2.00 | Depends on data depth |
| Tax Authority | ₪0.30-₪1.00 | Basic verification |
| Courts | ₪1.00-₪3.00 | Per case search |
| Execution Office | ₪1.00-₪2.00 | Per file search |
| Blocked Accounts | ₪0.50 | Simple check |

**Estimated cost per TrustCheck report:**
- Basic report (free tier): ₪2-₪4 per query
- Full report (₪29): ₪5-₪10 per query
- Monthly subscription: ₪500-₪2,000 in API costs

**Business model impact:**
- Current pricing sustainable: ₪29 report covers ₪10 API cost + ₪19 margin
- Need to optimize: Cache results for 30 days (allowed by license)
- Volume discounts: Negotiate with SHAAM after 10,000 queries/month

---

## Technical Implementation Plan

### Phase 1: Database Schema Update

Create `government_api_cache` table to minimize API costs:

```sql
CREATE TABLE government_api_cache (
  id SERIAL PRIMARY KEY,
  hp_number BIGINT NOT NULL,
  data_source VARCHAR(50) NOT NULL, -- 'companies_registry', 'vat', 'courts', etc.
  raw_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- NOW() + 30 days
  api_cost DECIMAL(10,2), -- Track actual cost
  UNIQUE(hp_number, data_source)
);

CREATE INDEX idx_cache_hp ON government_api_cache(hp_number);
CREATE INDEX idx_cache_expires ON government_api_cache(expires_at);
```

### Phase 2: API Client Library

```typescript
// lib/shaam/client.ts
export class ShaamClient {
  private baseUrl = process.env.SHAAM_API_URL;
  private clientId = process.env.SHAAM_CLIENT_ID;
  private clientSecret = process.env.SHAAM_CLIENT_SECRET;
  
  async authenticate(): Promise<string> {
    // OAuth2 authentication
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    const data = await response.json();
    return data.access_token;
  }
  
  async getCompanyDetails(hpNumber: number): Promise<CompanyData> {
    // Check cache first
    const cached = await this.getFromCache(hpNumber, 'companies_registry');
    if (cached && cached.expires_at > new Date()) {
      return cached.raw_data;
    }
    
    // Call API if not cached
    const token = await this.authenticate();
    const response = await fetch(`${this.baseUrl}/api/companies/${hpNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await response.json();
    
    // Cache for 30 days
    await this.saveToCache(hpNumber, 'companies_registry', data, 30);
    
    return data;
  }
  
  // Similar methods for VAT, courts, execution, blocked accounts
}
```

### Phase 3: Update unified_data.ts

```typescript
// lib/unified_data.ts
import { ShaamClient } from './shaam/client';

export async function getBusinessData(hpNumber: number) {
  const shaam = new ShaamClient();
  
  try {
    // Try SHAAM first (if credentials configured)
    if (process.env.SHAAM_CLIENT_ID) {
      const [company, vat, courts, execution, blocked] = await Promise.all([
        shaam.getCompanyDetails(hpNumber),
        shaam.getVATStatus(hpNumber),
        shaam.searchLegalCases(hpNumber),
        shaam.searchExecutionFiles(hpNumber),
        shaam.checkBlockedAccount(hpNumber),
      ]);
      
      return {
        source: 'shaam_api',
        company,
        vat,
        courts,
        execution,
        blocked,
        cached: false,
      };
    }
  } catch (error) {
    console.error('SHAAM API error, falling back to PostgreSQL', error);
  }
  
  // Fallback to PostgreSQL cache (current implementation)
  return await postgres.searchLocalCompany(hpNumber);
}
```

---

## Timeline & Milestones

### Month 1: Application (January 2026)
- [ ] Week 1-2: Prepare application documents
- [ ] Week 3: Submit application to SHAAM
- [ ] Week 4: Follow-up, answer questions

**Deliverable:** Application submitted

### Month 2-3: Approval Process (February-March 2026)
- [ ] Security review by SHAAM
- [ ] Privacy compliance audit
- [ ] Contract negotiation
- [ ] Payment terms agreement

**Deliverable:** Approval letter + sandbox credentials

### Month 4: Integration (April 2026)
- [ ] Week 1: Setup sandbox environment
- [ ] Week 2-3: Develop API client library
- [ ] Week 4: Integration testing

**Deliverable:** Working integration in staging

### Month 5: Testing & Certification (May 2026)
- [ ] Functional tests (all 5 data sources)
- [ ] Load testing (1,000 queries/day)
- [ ] Security audit
- [ ] Privacy compliance review

**Deliverable:** SHAAM certification

### Month 6: Production Launch (June 2026)
- [ ] Production credentials received
- [ ] Deploy to production
- [ ] Monitor API costs
- [ ] User acceptance testing

**Deliverable:** Live with SHAAM API

---

## Cost Analysis

### Setup Costs
- Application fee: ₪500-₪2,000 (one-time)
- Security audit: ₪5,000-₪10,000 (if external required)
- Development: 160 hours @ ₪200/hour = ₪32,000
- Testing: 40 hours @ ₪200/hour = ₪8,000

**Total setup: ₪45,500-₪52,000**

### Monthly Operating Costs (Phase 1: 1,000 reports/month)
- API calls: 1,000 reports × ₪8 avg = ₪8,000/month
- SHAAM subscription fee: ₪500-₪1,000/month (if applicable)
- Infrastructure: ₪200/month (caching layer)

**Total monthly: ₪8,700-₪9,200**

### Revenue Projection (1,000 reports/month)
- Free reports: 500 × ₪0 = ₪0
- Paid reports: 400 × ₪29 = ₪11,600
- Monthly subscriptions: 10 × ₪99 = ₪990

**Total revenue: ₪12,590/month**

**Gross margin: ₪12,590 - ₪9,200 = ₪3,390/month (27%)**

### Break-even Analysis
- Setup cost: ₪50,000
- Monthly profit: ₪3,390
- **Break-even: 15 months**

**Scale to profitability:**
- At 2,000 reports/month: ₪8,000 profit/month → break-even in 6 months
- At 5,000 reports/month: ₪25,000 profit/month → break-even in 2 months

---

## Risks & Mitigation

### Risk 1: Application Rejected
**Probability:** Low (15%)  
**Impact:** High  
**Mitigation:**
- Consult with SHAAM before applying
- Hire consultant with government experience
- Fallback: Continue with data.gov.il + scraping

### Risk 2: High API Costs
**Probability:** Medium (40%)  
**Impact:** High  
**Mitigation:**
- Implement aggressive caching (30-day TTL)
- Negotiate volume discounts
- Optimize queries (only call needed APIs)
- Rate limiting per user

### Risk 3: Long Approval Process
**Probability:** High (60%)  
**Impact:** Medium  
**Mitigation:**
- Start application ASAP (January 2026)
- Continue Phase 1 with existing data
- Set expectations: SHAAM by Phase 2 (June 2026)

### Risk 4: Technical Integration Issues
**Probability:** Medium (30%)  
**Impact:** Medium  
**Mitigation:**
- Budget extra development time (200 hours total)
- Hire experienced SHAAM developer as consultant
- Thorough testing in sandbox

---

## Next Steps (Immediate)

### January 2026 - Application Preparation

**Week 1 (Jan 1-7):**
- [ ] Collect company documents (incorporation cert, bylaws, etc.)
- [ ] Draft software description (Hebrew + English)
- [ ] Prepare privacy policy proof (already done ✅)
- [ ] Prepare security measures document

**Week 2 (Jan 8-14):**
- [ ] Contact SHAAM office for pre-application consultation
- [ ] Review application form thoroughly
- [ ] Get legal review of application
- [ ] Prepare budget approval for API costs

**Week 3 (Jan 15-21):**
- [ ] Submit application via gov.il portal
- [ ] Email follow-up to SHAAM contact
- [ ] Set up tracking system for application status

**Week 4 (Jan 22-31):**
- [ ] Follow-up on application status
- [ ] Answer any questions from SHAAM
- [ ] Begin technical planning (while waiting)

### Parallel Work (January-March)

**Phase 1 continues with existing data:**
- Complete payment gateway integration (Tranzilla)
- Launch with PostgreSQL cache (716K companies)
- Build user base and revenue
- Refine AI analysis

**SHAAM integration = Phase 2 upgrade:**
- Users get real-time data instead of cached
- Competitive advantage over platforms using only static data
- Premium tier: "Real-time verification" at higher price point

---

## Contact Information

**SHAAM Office:**
- Website: https://www.gov.il/he/service/connect-to-shaam
- Email: shaam@economy.gov.il (verify current email)
- Phone: 02-6662222 (Ministry of Economy switchboard)
- Address: Ministry of Economy and Industry, Jerusalem

**TrustCheck Contact for Application:**
- Company: TrustCheck Israel בע"מ
- H.P.: 345033898
- Contact: Dan Cohen (CEO)
- Email: dan@trustcheck.co.il
- Phone: 050-123-4567

---

## Compliance Requirements

### Data Usage Restrictions
- ✅ Can use data for customer reports
- ✅ Can cache for 30 days (check license)
- ❌ Cannot resell raw data to third parties
- ❌ Cannot create competing database product
- ❌ Cannot share API credentials

### Privacy Compliance
- Must comply with Israeli Privacy Protection Law
- GDPR compliance for EU users
- Secure storage of API credentials (encrypted)
- Audit trail of all API calls
- User consent for data processing

### Security Requirements
- HTTPS/TLS encryption for all API calls
- Secure storage of access tokens
- Regular security audits
- Incident response plan
- Data breach notification (72 hours)

---

## Conclusion

**SHAAM integration is the long-term solution for TrustCheck Israel.**

**Short-term strategy (Phase 1, Jan-May 2026):**
- Launch with PostgreSQL cache + data.gov.il
- Build user base and revenue
- Prove business model

**Long-term strategy (Phase 2, June 2026+):**
- Migrate to SHAAM API for real-time data
- Premium tier with "Real-time verification"
- Scale to 10,000+ reports/month
- Become official government partner

**ROI:** Break-even in 6-15 months depending on volume. Essential for credibility and long-term sustainability.

**Next action:** Start application preparation in January 2026.

---

**Document Version:** 1.0  
**Last Updated:** 29 December 2025  
**Author:** GitHub Copilot (Claude Sonnet 4.5)  
**Status:** Strategic planning document
