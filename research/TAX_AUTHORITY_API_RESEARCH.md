# Israeli Tax Authority API Integration Research

**Date:** 23.12.2025  
**Target API:** Shaam (שע"ם) - Israel Tax Authority Open API  
**Goal:** Integrate ניהול ספרים (bookkeeping) data for business trust analysis

---

## 📋 Executive Summary

Israeli Tax Authority provides **Open API platform** for software houses to access tax-related data including:
- ✅ **VAT reports** (דוחות מע"מ)
- ✅ **Withholding tax** (ניכויים)
- ✅ **Advance payments** (מקדמות)
- ✅ **Invoice allocation numbers** (מספרי הקצאה)
- ❌ **Bookkeeping data (ניהול ספרים)** — **NOT available via API** (yet)

**Key Finding:** Tax Authority APIs do NOT provide direct access to ניהול ספרים (accounting ledgers). Available APIs are for **filing/payment** only, not for **querying business financial data**.

---

## 🔍 Available Tax Authority APIs

### 1. **VAT Reporting API** (דיווח ותשלום מע"מ)
**Status:** ✅ Production  
**Purpose:** File and pay periodic VAT reports from accounting software  
**Access:** Requires client authorization for account debit

**Use Case for TrustCheck:**
- ❌ **Cannot query** if business filed VAT reports on time
- ❌ **Cannot access** VAT report data (revenue, expenses)
- ✅ **Can verify** if business is registered as עוסק מורשה (VAT-registered)

**Relevance:** LOW (filing tool, not data source)

---

### 2. **Withholding Tax API** (דיווח ותשלום ניכויים)
**Status:** ✅ Production  
**Purpose:** File and pay withholding tax (ניכוי במקור) for employees/contractors

**Use Case for TrustCheck:**
- ❌ Cannot query payment history
- ❌ Cannot verify compliance
- ✅ Only for filing reports

**Relevance:** LOW

---

### 3. **Advance Payments API** (דיווח ותשלום מקדמות)
**Status:** ✅ Production  
**Purpose:** File and pay income tax advance payments

**Use Case for TrustCheck:**
- ❌ Cannot query payment status
- ❌ Cannot access financial estimates

**Relevance:** LOW

---

### 4. **Invoice Allocation API** (מספרי הקצאה לחשבוניות)
**Status:** ✅ Production  
**Purpose:** Request allocation numbers for invoices requiring tax authority approval

**Use Case for TrustCheck:**
- ❌ Only for issuing invoices
- ❌ No data about existing invoices

**Relevance:** NONE

---

### 5. **Donation Receipt API** (קבלת מספר אישור לתרומה)
**Status:** ✅ Production  
**Purpose:** Get approval numbers for donation receipts (non-profits)

**Relevance:** NONE (not B2C businesses)

---

## ⚠️ CRITICAL Finding: ניהול ספרים Data NOT Available

### What We Need (ניהול ספרים):
- Company revenue history (הכנסות)
- Expense reports (הוצאות)
- Profit/loss trends (רווח והפסד)
- Asset declarations (נכסים)
- Tax compliance status (עמידה בדרישות)

### What Tax Authority APIs Provide:
- **Filing interfaces** (הגשת דוחות)
- **Payment gateways** (ביצוע תשלומים)
- **Administrative functions** (מספרי הקצאה)

**Conclusion:** Tax Authority APIs are **NOT designed for data queries**. They are **input-only** (filing reports), NOT **output** (retrieving data).

---

## 🚫 Why Bookkeeping Data is Restricted

### Legal/Privacy Reasons:
1. **Tax Confidentiality Law** (חוק סודיות מידע מס)
   - Financial data is classified information
   - Only taxpayer + authorized representatives can access
   - Cannot be exposed via public API

2. **Data Protection Regulations** (הגנת הפרטיות)
   - Personal financial data requires explicit consent
   - TrustCheck would need individual authorization per company
   - Not scalable for B2C platform

3. **Anti-Fraud Measures**
   - Tax authority restricts bulk data access
   - Prevents competitors from scraping financial intelligence

---

## ✅ What TrustCheck CAN Get from Tax Authority

### Public Data (No API Needed):
1. **VAT Registration Status** (עוסק מורשה/פטור)
   - Available: Via Tax Authority public search
   - Implementation: Already planned in `lib/tax_authority.ts`
   - Data: Registration number, status, registration date

2. **Withholding Tax Status** (ניכוי במקור)
   - Available: Public certificate validation
   - Relevance: Shows if business withholds taxes (trustworthy indicator)

### NOT Available:
- ❌ Revenue data
- ❌ Expense reports
- ❌ Profit/loss statements
- ❌ Tax payment history
- ❌ Audit results
- ❌ Financial ratios

---

## 🔄 Alternative Data Sources for Financial Analysis

Since Tax Authority doesn't provide ניהול ספרים data, TrustCheck must use:

### 1. **Companies Registrar** (רשם החברות)
**Status:** ✅ Already integrated  
**Data:**
- Company status (פעילה/מחוקה)
- Violations (מפרה)
- Annual reports (דוחות שנתיים) — **limited financial data**
- Shareholders (בעלי מניות)

**Limitation:** Annual reports don't include detailed P&L

---

### 2. **BDI Code API** (Recommended)
**Status:** ⏳ Phase 2 integration  
**Data:**
- Credit rating
- Payment behavior (Trade Payment Data)
- Bank relationships
- Estimated revenue (Revenue Estimate)
- Risk scores

**Cost:** ₪1-2 per query  
**Coverage:** ~80% of Israeli businesses

**Advantage:** BDI Code has **exclusive partnerships** with banks/credit bureaus → access to financial indicators

---

### 3. **Bank of Israel Credit Data Registry** (מרשם אשראי)
**Status:** ❌ Requires credit bureau license (₪500K-4M capital)  
**Data:**
- Loan history
- Credit limits
- Default records
- Payment patterns

**Conclusion:** NOT feasible for TrustCheck (startup)

---

### 4. **Court Cases + Execution Proceedings**
**Status:** ✅ Partially integrated (mock data)  
**Data:**
- Debt lawsuits (תיקי חוב)
- Execution orders (הוצאה לפועל)
- Bankruptcy filings (פשיטת רגל)

**Relevance:** HIGH — indicates financial distress

---

### 5. **CheckID API** (Competitor)
**Status:** ❌ PROHIBITED (competitor policy)  
**Data:** Aggregated government + credit data

**Note:** CheckID charges ₪5-10 per check because they PAY for premium data sources

---

## 📊 Registration Process for Tax Authority API

If TrustCheck wants to integrate available APIs (VAT filing, etc.), here's the process:

### Step 1: Personal Registration (נושא משרה)
**Requirement:** Company director/partner must register  
**Link:** https://secapp.taxes.gov.il/srRishum/main/newIncident  
**Support:** *4954

### Step 2: Register Software House (בית תוכנה)
**Requirement:** Verify company linkage in Companies Registrar  
**Link:** https://secapp.taxes.gov.il/srRishum/main/imutComunity/yeshut  
**Documents:**
- Company registration certificate
- Director ID proof

### Step 3: Authorize Developer (הסמכת מפתח)
**Purpose:** Allow employee to access APIs on behalf of company  
**Link:** https://go.gov.il/Hasmacha  
**Type:** "הרשאה לעובד בתאגיד לפעול בשל התאגיד"

### Step 4: Developer Approves Authorization
**Link:** https://secapp.taxes.gov.il/srHasmacha  
**Note:** Developer must register if not already in system

### Step 5: Register for Sandbox
**Portal:** https://openapi-portal.taxes.gov.il/sandbox/  
**Guide:** https://secapp.taxes.gov.il/OpenApiUserGuide/OpenApiUserGuide.pdf  
**Support:** APIsupport@taxes.gov.il

### Step 6: Register for Production
**Portal:** https://openapi-portal.taxes.gov.il/shaam/production/  
**Requirement:** Must complete sandbox testing first

### Step 7: Sign Commitment Letter (כתב התחייבות)
**Document:** https://www.gov.il/BlobFolder/service/connect-to-shaam/he/Service_Pages_shaam_Written-commitment-to-use-API-services.pdf  
**Sent:** Digitally with final application  
**Contact:** Lakohot-bt@taxes.gov.il

---

## ⏱️ Estimated Timeline & Effort

**Total Time:** 2-4 weeks  
**Complexity:** Medium-High (bureaucratic process)

| Step | Time | Difficulty |
|------|------|------------|
| Personal registration | 1-2 days | Easy |
| Software house registration | 3-5 days | Medium (requires docs) |
| Developer authorization | 1-2 days | Easy |
| Sandbox registration | 1 day | Easy |
| API testing in sandbox | 3-7 days | Medium (technical) |
| Production registration | 2-3 days | Easy |
| Commitment letter signing | 1-2 days | Easy |
| **Approval wait** | **1-2 weeks** | N/A (bureaucracy) |

---

## 🎯 Recommendation for TrustCheck

### Short-Term (Phase 1 - Current):
✅ **DO NOT integrate Tax Authority APIs**

**Reasons:**
1. Available APIs don't provide data we need (ניהול ספרים)
2. Only useful for **filing** reports, not **querying** data
3. 2-4 weeks registration for minimal value
4. No financial analysis capability

**Alternative:**
- ✅ Use Companies Registrar (already integrated)
- ✅ Use BDI Code API for financial indicators (Phase 2)

---

### Medium-Term (Phase 2 - Q1 2026):
⏳ **Consider VAT Status API** (optional enhancement)

**Use Case:**
- Verify if business is עוסק מורשה (VAT-registered)
- Validate tax compliance status
- Cross-check with Companies Registrar data

**Implementation:**
```typescript
// lib/tax_authority_api.ts
async function checkVATStatus(hpNumber: string): Promise<VATStatus> {
  // Call Tax Authority API
  // OAuth2 authentication
  // Parse response
  return {
    isVATRegistered: true,
    vatNumber: '1234567890',
    registrationDate: '2020-01-01',
    status: 'active',
    lastVerified: new Date().toISOString(),
  };
}
```

**Value:** LOW (can get same data from public search)  
**Cost:** 2-4 weeks registration + maintenance

---

### Long-Term (Phase 3 - 2026+):
🔮 **Monitor for new APIs**

Tax Authority may release:
- Compliance status API (עמידה בדרישות)
- Tax payment history API (היסטוריית תשלומים)
- Audit results API (תוצאות ביקורת)

**Action:** Subscribe to Tax Authority developer updates:
- Email: APIsupport@taxes.gov.il
- Portal: https://govextra.gov.il/taxes/innovation/

---

## 🚨 Critical Insights for Product Strategy

### What This Means for TrustCheck:

1. **Financial Data Gap**
   - Tax Authority won't provide ניהול ספרים data
   - Must rely on:
     - ✅ Companies Registrar (basic info)
     - ✅ BDI Code (credit data)
     - ✅ Courts (legal cases)
     - ❌ NOT direct financials

2. **Competitive Landscape**
   - CheckID/BDI Code have **exclusive** financial data partnerships
   - TrustCheck cannot match their financial analysis depth
   - Must differentiate on:
     - ✅ User experience (parents-focused)
     - ✅ Price (free basic checks)
     - ✅ AI analysis (Gemini-powered insights)

3. **Data Coverage Reality**
   ```
   TrustCheck Maximum Coverage (without paid APIs):
   - Company info: 100% (Companies Registrar)
   - Violations: 100% (Companies Registrar)
   - Court cases: 60% (mock data, needs BDI Code)
   - Financial data: 0% (NO FREE SOURCE EXISTS)
   - Bank restrictions: 0% (BOI removed CSV access)
   ```

4. **Pricing Implications**
   - **Free tier:** Company info + violations + AI analysis
   - **Premium tier (₪5-10):** BDI Code data (financial indicators)
   - **Cannot undercut CheckID** without sacrificing data quality

---

## 📝 Action Items

### Immediate (This Week):
1. ✅ **Document findings** — This report
2. ❌ **DO NOT register** for Tax Authority API (no value)
3. ✅ **Focus on BDI Code integration** (Phase 2 priority)

### Next Sprint (Phase 2):
1. Contact BDI Code sales (info@bdi-code.co.il)
2. Negotiate API pricing (target: ₪1/query for startups)
3. Implement BDI Code integration:
   ```
   Features:
   - Credit rating
   - Payment behavior
   - Estimated revenue
   - Risk scores
   ```

### Future Monitoring:
1. Subscribe to Tax Authority API updates
2. Check quarterly for new APIs (financial data)
3. Revisit if Tax Authority releases:
   - Compliance status API
   - Payment history API
   - Audit results API

---

## 📚 Resources

### Tax Authority API Portal:
- **Main page:** https://govextra.gov.il/taxes/innovation/home/api/
- **Registration guide:** https://govextra.gov.il/taxes/innovation/home/api/%D7%AA%D7%94%D7%9C%D7%99%D7%9A-%D7%94%D7%A8%D7%99%D7%A9%D7%95%D7%9D-%D7%9C%D7%A9%D7%99%D7%A8%D7%95%D7%AA%D7%99-%D7%94-api/
- **Sandbox portal:** https://openapi-portal.taxes.gov.il/sandbox/
- **Production portal:** https://openapi-portal.taxes.gov.il/shaam/production/
- **User guide (Hebrew):** https://secapp.taxes.gov.il/OpenApiUserGuide/OpenApiUserGuide.pdf
- **User guide (English):** https://secapp.taxes.gov.il/OpenApiUserGuide/OpenApiUserGuide_EN.pdf

### Support:
- **Email:** APIsupport@taxes.gov.il
- **Phone:** *4954 or 02-5656400
- **Hours:** Sun-Thu 08:15-15:45

### Documents:
- **Commitment letter:** https://www.gov.il/BlobFolder/service/connect-to-shaam/he/Service_Pages_shaam_Written-commitment-to-use-API-services.pdf
- **Security appendix:** https://www.gov.il/BlobFolder/service/connect-to-shaam/he/Service_Pages_shaam_appen-info-security-for-software-house.pdf
- **Connection procedure:** https://www.gov.il/BlobFolder/service/connect-to-shaam/he/Service_Pages_shaam_Software-house-connection-procedure.pdf

---

## ✅ Conclusion

**Key Takeaway:** Israeli Tax Authority APIs are **NOT suitable** for TrustCheck's use case.

**Reasons:**
1. ❌ No ניהול ספרים (bookkeeping) data available
2. ❌ APIs designed for filing/payment, not data queries
3. ❌ 2-4 weeks registration for minimal value
4. ✅ Better alternatives exist (BDI Code, Companies Registrar)

**Recommended Strategy:**
- ✅ **Phase 1:** Use Companies Registrar + violations detection (DONE)
- ✅ **Phase 2:** Integrate BDI Code API for financial indicators (NEXT)
- ⏳ **Phase 3:** Monitor Tax Authority for new data APIs (FUTURE)

**Status:** **Research complete. Integration NOT recommended.**

---

**Next Steps:** Focus on BDI Code API integration for financial data access.
