# Competitor Policy - TrustCheck Israel

**Date Created:** 23.12.2025  
**Last Updated:** 23.12.2025  
**Status:** ACTIVE

---

## Purpose

This document defines which Israeli business intelligence platforms are **COMPETITORS** and must NOT be integrated into TrustCheck codebase.

---

## ⛔ PROHIBITED Integrations (Competitors)

### 1. CheckID (checkid.co.il)

**Status:** 🔴 **COMPETITOR - DO NOT USE**

**Why it's a competitor:**
- Direct B2C business intelligence platform
- Targets same audience (Israeli parents checking businesses)
- Overlapping feature set (company verification, court cases, tax status)

**What's PROHIBITED:**
- ❌ Integrating CheckID API into production code
- ❌ Using their paid endpoints (RashamHavarotDataModel, MaamDataModel, etc.)
- ❌ Recommending CheckID in user-facing documentation
- ❌ Creating dependencies on their infrastructure

**What's ALLOWED:**
- ✅ Analyzing their architecture for educational purposes
- ✅ Reading their public documentation to understand market
- ✅ Competitive analysis reports (stored in `research/platforms/03_CheckID/`)

**Files that mention CheckID (for research only):**
```
research/platforms/03_CheckID/PLATFORM_SNAPSHOT.md
CHECKID_FREE_SOURCES_IMPLEMENTATION.md
CHECKID_FREE_SOURCES_IMPLEMENTATION_REPORT.md
```

**Code files with CheckID warnings:**
```
.env — ⚠️ COMPETITOR WARNING added
lib/execution_office.ts — Mentions removed, replaced with BDI Code
DIRECT_GOVERNMENT_API_GAP_ANALYSIS.md — Marked as DEPRECATED
```

---

## ✅ APPROVED Alternatives (NOT Competitors)

### 1. BDI Code API (bdi-code.co.il)

**Status:** 🟢 **APPROVED PARTNER**

**Why it's NOT a competitor:**
- B2B focus (API provider, not end-user platform)
- Does not target parents (focuses on banks, insurance companies)
- Complementary business model

**Integration Guidelines:**
- ✅ Use BDI Code API for court data (₪1-2/query)
- ✅ Use for execution proceedings data
- ✅ Recommend in technical documentation

**Cost:** ₪1.00-2.00 per query (includes multiple data sources)

---

### 2. Takdin (takdin.co.il)

**Status:** 🟡 **APPROVED DATA PROVIDER**

**Why it's NOT a competitor:**
- Legal database platform (not business intelligence)
- Owned by Guideline Group (CheckID parent, but different product line)
- No direct overlap with TrustCheck use case

**Integration Guidelines:**
- ✅ Partner directly for court data access (₪5K-15K setup)
- ✅ Use as alternative to BDI Code
- ⚠️ Avoid mentioning CheckID connection in marketing

**Cost:** ₪5,000-15,000 setup + ₪1.50/query

---

### 3. data.gov.il Open Data Portal

**Status:** 🟢 **APPROVED FREE SOURCE**

**Why it's approved:**
- Government open data (public domain)
- Free access
- No commercial entity involved

**Integration Guidelines:**
- ✅ Use all available datasets (Companies Registry, BOI Mugbalim, etc.)
- ✅ Primary data source for TrustCheck
- ✅ No restrictions

**Cost:** ₪0 (free)

---

## 🟡 NEUTRAL Platforms (Case-by-Case Review)

### 1. WeCheck (wecheck.co.il)

**Status:** 🟡 **REVIEW REQUIRED**

**Overlap:** Partial (bank account verification focus, less business intelligence)

**Decision:** Discuss with product team before integration

---

### 2. Midrug (midrug.co.il)

**Status:** 🟡 **REVIEW REQUIRED**

**Overlap:** Moderate (credit ratings, business intelligence)

**Decision:** Discuss with product team before integration

---

## Code Review Checklist

Before merging any PR that mentions external business intelligence platforms:

- [ ] Check if platform is listed in this document
- [ ] If competitor (🔴) → Reject integration, suggest alternative
- [ ] If approved (🟢) → Review cost and terms
- [ ] If neutral (🟡) → Escalate to product team
- [ ] Update `.env` with warnings if needed
- [ ] Add comments to code explaining why alternative chosen

---

## Exceptions

**Research & Documentation:**
- ✅ Competitive analysis documents allowed in `research/` folder
- ✅ Architecture study for learning purposes
- ✅ Price comparison tables

**What requires approval:**
- ⚠️ API integration (even for testing)
- ⚠️ User-facing recommendations
- ⚠️ Affiliate partnerships

---

## Recent Updates

### 2025-12-23: CheckID Competitor Classification

**Changes made:**
1. ✅ Added ⚠️ COMPETITOR WARNING to `.env`
2. ✅ Updated `CHECKID_FREE_SOURCES_IMPLEMENTATION_REPORT.md` with disclaimer
3. ✅ Updated `DIRECT_GOVERNMENT_API_GAP_ANALYSIS.md` (marked CheckID as DEPRECATED)
4. ✅ Updated `lib/execution_office.ts` (replaced CheckID with BDI Code)
5. ✅ Created this policy document

**Reason:**
CheckID is a direct B2C competitor targeting same market (Israeli parents). Using their API would create revenue dependency on competitor and risk strategic lock-in.

**Alternative approved:** BDI Code API (B2B provider, no conflict of interest)

---

## Contact

**Questions about competitor policy:** Contact project lead  
**New platform to evaluate:** Create issue in GitHub with label `competitor-review`

---

**Document Owner:** TrustCheck Product Team  
**Review Frequency:** Quarterly (or when new platform discovered)
