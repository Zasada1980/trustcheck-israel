# Terms of Service - TrustCheck Israel

**Last Updated:** 23.12.2025  
**Effective Date:** 23.12.2025

## 1. Service Overview

TrustCheck Israel provides business reliability reports for Israeli companies using publicly available government data sources. Our service is designed to help parents and individuals verify business trustworthiness before making payments.

## 2. Data Sources

TrustCheck aggregates data from multiple public Israeli government databases:

### 2.1 Primary Sources
- **Companies Registrar** (רשם החברות) - data.gov.il
  - Company registration details, ownership, status
  - Annual reports, financial statements
  - Violations and limitations

- **Tax Authority Public Certificates** (רשות המיסים)
  - URL: https://taxinfo.taxes.gov.il/gmishurim/
  - Bookkeeping approval status (אישור ניהול ספרים)
  - Withholding tax certificates (ניכוי מס במקור)
  - **Caching Policy:** Data cached for up to 7 days for performance
  - **Freshness:** Last update date displayed in reports

- **Justice Ministry Courts** (בתי המשפט) - court.gov.il
  - Civil cases, bankruptcy proceedings
  - Legal judgments and settlements

- **Execution Office** (הוצאה לפועל) - hotzaa.justice.gov.il
  - Debt collection proceedings
  - Outstanding payment orders

- **Bank of Israel Mugbalim** (בנק ישראל - חשבונות מוגבלים)
  - Restricted bank accounts (10+ bounced checks)
  - Banking limitations

### 2.2 Data Accuracy & Limitations

**IMPORTANT DISCLAIMERS:**

1. **Cache Staleness:** Tax certificate data is cached for up to 7 days. For critical decisions, verify data directly at source URLs provided in reports.

2. **No Warranty:** TrustCheck provides data "AS IS" without warranties of:
   - Accuracy - government databases may contain errors
   - Completeness - not all companies have data in all sources
   - Timeliness - cached data may be up to 7 days old

3. **Not Legal Advice:** Reports are informational only and do not constitute:
   - Legal advice or recommendations
   - Financial advice
   - Investment decisions
   - Credit ratings

4. **Verify Critical Information:** Before making significant financial decisions:
   - ✅ Request official documents directly from business
   - ✅ Verify tax certificates at taxinfo.taxes.gov.il
   - ✅ Check court records at court.gov.il
   - ✅ Consult legal/financial professionals

## 3. Automated Data Collection (Web Scraping)

### 3.1 Legal Basis

TrustCheck uses automated tools (web scrapers) to collect public data from government websites. This is legally permitted under:

- **Israeli Freedom of Information Law** (חוק חופש המידע, 1998)
- **Public Data Doctrine:** Factual data from public sources is not copyrighted
- **Robots.txt Compliance:** We respect robots.txt directives where present

### 3.2 Respectful Scraping Policy

We implement "respectful scraping" practices:

- ✅ **Rate Limiting:** 2-5 seconds delay between requests
- ✅ **Transparent Identity:** User-Agent identifies as `TrustCheckBot/1.0`
- ✅ **No DDOS:** Maximum 3 concurrent requests
- ✅ **Caching:** Minimize load on government servers (7-day TTL)
- ✅ **No Circumvention:** We do not bypass security measures

### 3.3 Bot Information Page

For government webmasters concerned about our scraping:

- **Bot Name:** TrustCheckBot/1.0
- **Purpose:** Aggregating public business data for consumer protection
- **Contact:** admin@trustcheck.co.il
- **Opt-Out:** Contact us to exclude specific domains
- **More Info:** https://trustcheck.co.il/about/bot

## 4. Data Usage & Privacy

### 4.1 What We Store

- **Cached Government Data:** Company profiles, certificates, legal cases (7-day retention)
- **User Search Queries:** HP numbers, company names (anonymized analytics only)
- **Report Generation:** AI-generated reports (stored for 30 days)

### 4.2 What We DON'T Store

- ❌ Personal user information (unless you create an account)
- ❌ Payment information (handled by payment processors)
- ❌ Browsing history outside TrustCheck

### 4.3 Third-Party Services

We use:
- **Google Analytics:** Anonymous usage statistics (GDPR-compliant)
- **Google Gemini AI:** Report generation (no PII sent)
- **Stripe/PayPal:** Payment processing (PCI DSS compliant)

## 5. Intellectual Property

### 5.1 TrustCheck Ownership

- **Original Content:** AI-generated reports, UI design, logos - © TrustCheck Israel
- **Software Code:** Proprietary (all rights reserved)

### 5.2 Government Data

- **No Ownership Claimed:** Factual data from government sources remains public domain
- **Attribution:** We always cite source URLs (e.g., "Source: taxinfo.taxes.gov.il")
- **No Resale:** We do not sell raw government data as a separate product

## 6. Service Usage Restrictions

### 6.1 Permitted Uses

✅ **Allowed:**
- Checking businesses before making payments
- Due diligence for service providers (tutors, daycares, contractors)
- Personal research on Israeli companies

### 6.2 Prohibited Uses

❌ **Not Allowed:**
- **Mass Scraping:** Downloading entire database (use our API instead)
- **Competitive Intelligence:** Bulk monitoring of competitors
- **Credit Decisions:** Using reports as sole basis for loans/credit
- **Harassment:** Using data to harass or defame businesses
- **Unauthorized Resale:** Selling reports to third parties without permission

## 7. Liability Limitations

### 7.1 Maximum Liability

TrustCheck's total liability for any claim is limited to:
- **Free Tier:** ₪0 (no refund)
- **Premium Tier:** Amount paid for specific report (max ₪50)

### 7.2 No Consequential Damages

We are NOT liable for:
- ❌ Lost profits, revenue, or business opportunities
- ❌ Damages from relying on outdated/inaccurate data
- ❌ Third-party actions based on our reports
- ❌ Unavailability of government data sources

### 7.3 User Responsibility

**YOU ARE RESPONSIBLE FOR:**
- ✅ Verifying critical information independently
- ✅ Making informed decisions based on multiple sources
- ✅ Consulting professionals for legal/financial advice

## 8. Government Source Availability

### 8.1 No Guarantee of Uptime

Government websites may be:
- Temporarily unavailable (maintenance, outages)
- Permanently restructured (URL changes, API deprecation)
- Subject to access restrictions (IP blocks, CAPTCHAs)

### 8.2 Fallback Mechanisms

When sources fail:
1. We use cached data (if < 30 days old)
2. We notify users of data freshness
3. We provide alternative verification methods

## 9. Modifications to Service

TrustCheck reserves the right to:
- ✅ Add/remove data sources
- ✅ Change pricing (with 30-day notice)
- ✅ Modify report format/content
- ✅ Discontinue service (with 60-day notice)

**Notification:** Major changes will be announced via email and website banner.

## 10. Termination

### 10.1 User Termination
You may stop using TrustCheck at any time. No refunds for unused premium credits.

### 10.2 TrustCheck Termination
We may suspend/terminate accounts for:
- ❌ Violating Terms of Service
- ❌ Abusive scraping of our website
- ❌ Fraudulent payment activity
- ❌ Legal violations

## 11. Governing Law

These Terms are governed by **Israeli Law**. Disputes resolved in Tel Aviv courts.

## 12. Contact Information

**TrustCheck Israel**  
Email: admin@trustcheck.co.il  
Website: https://trustcheck.co.il

**For Government Webmasters:**  
To discuss bot activity or request exclusions: bot-support@trustcheck.co.il

---

## Changelog

**v1.1 (23.12.2025):**
- Added Tax Certificates data source (taxinfo.taxes.gov.il)
- Clarified 7-day caching policy
- Added bot information for webmasters
- Updated data freshness disclaimers

**v1.0 (15.12.2025):**
- Initial Terms of Service
