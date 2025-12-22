# ФИНАЛЬНЫЙ РЕЙТИНГ И АУДИТ ПЛАТФОРМ ДЛЯ SBF

**Дата:** 22 декабря 2025  
**Исследовано:** 10 платформ + 1 extra (Captain Credit)  
**Общий объём:** ~162,000 слов документации

---

## 📊 ИТОГОВЫЙ РЕЙТИНГ: ТОП-10 → Рекомендации

### Легенда оценок:
- ✅ **КРИТИЧНО** — обязательно для MVP
- 🟢 **ВАЖНО** — добавить в Phase 2
- 🟡 **ОПЦИОНАЛЬНО** — nice to have
- 🔴 **НЕ РЕКОМЕНДУЕТСЯ** — не интегрировать
- ❌ **ИГНОРИРОВАТЬ** — wrong category

---

## 🥇 РЕЙТИНГ 1: BDI Code — ✅ КРИТИЧНО (Tier 1)

### Общая оценка: **95/100**

**Категория:** Credit Bureau (Licensed)  
**Покрытие SBF:** 4/4 критерия (95%)  
**Цена:** $5K setup + $1.5K/month + $1/query  
**API:** ✅ REST/JSON  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Bank of Israel Credit Registry** — эксклюзивный доступ (trade payment data)
2. **50% дешевле D&B** — аналогичные данные за половину цены
3. **Red Lights® система** — visual payment behavior indicators
4. **FICO®BDI scoring** — для עוסקים owners (уникально)
5. **Coface partnership** — 200M+ global insurance claims
6. **ISO 27001 certified** — банковский уровень безопасности

**⚠️ НЕДОСТАТКИ:**
1. Требует capital ₪500K-4M (licensing requirement)
2. Annual Bank of Israel audit (regulatory burden)
3. Hebrew documentation (integration complexity)

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **PRIMARY credit bureau** — основной источник кредитных данных
- **Владельцы:** ✅ Public companies + FICO®BDI for עוסקים owners
- **Финансы:** ✅ Trade payments, Red Lights® indicators
- **Суды:** ⚠️ Via partners (not direct)
- **Устойчивость:** ✅ FICO®BDI scoring, payment trends

**💰 ROI РАСЧЁТ:**
- Setup: $5K (one-time)
- Monthly: $1.5K
- Per query: $1 × 10,000 queries/month = $10K
- **Total Year 1:** $143K
- **Cost per check:** $1.19 (если 10K queries/month)

**📊 РЕКОМЕНДАЦИЯ:** ✅ **INTEGRATE Phase 1 (MVP)** — выбрать как PRIMARY credit bureau (вместо D&B из-за цены).

---

## 🥈 РЕЙТИНГ 2: D&B Israel — ✅ КРИТИЧНО (Tier 1)

### Общая оценка: **93/100**

**Категория:** Credit Bureau (Licensed)  
**Покрытие SBF:** 4/4 критерия (95%)  
**Цена:** $10K setup + $3K/month + $2/query  
**API:** ✅ REST/JSON  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Global brand** — Dun & Bradstreet (180 countries)
2. **PAYDEX® score** — industry standard (0-100 scale)
3. **D-U-N-S® Number** — universal business identifier
4. **Predictive analytics** — failure risk models
5. **Best documentation** — English API docs, support

**⚠️ НЕДОСТАТКИ:**
1. **2× дороже BDI Code** — $2/query vs $1/query
2. Same data sources (Bank of Israel) — no unique advantage
3. Enterprise pricing (prohibitive for startups)

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **SECONDARY/VALIDATION** — use for cross-checking BDI Code data
- **Владельцы:** ✅ Public companies
- **Финансы:** ✅ Trade payments, PAYDEX®
- **Суды:** ⚠️ Via partners
- **Устойчивость:** ✅ PAYDEX® scoring, failure risk

**💰 ROI РАСЧЁТ:**
- Setup: $10K (one-time)
- Monthly: $3K
- Per query: $2 × 10,000 queries/month = $20K
- **Total Year 1:** $286K
- **Cost per check:** $2.38 (если 10K queries/month)

**📊 РЕКОМЕНДАЦИЯ:** ✅ **INTEGRATE Phase 1 (MVP)** — как SECONDARY для validation (используать BDI Code primary, D&B для cross-check важных сделок).

---

## 🥉 РЕЙТИНГ 3: Takdin — ✅ КРИТИЧНО (Tier 2)

### Общая оценка: **88/100**

**Категория:** Legal Database (Gateway Provider)  
**Покрытие SBF:** 1.5/4 критерия (40% specialized)  
**Цена:** ₪99-299/month OR ₪1.50/query via CheckID  
**API:** ⚠️ Limited (subscription-based)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **NetHaMishpat Gateway Provider** — legal access to 2.5M+ court decisions
2. **Early bankruptcy indicator** — supplier lawsuits visible 6-9 months BEFORE credit bureaus
3. **Comprehensive coverage** — criminal, civil, family, labor cases
4. **Naziclick compensation** — quantifies lawsuit values
5. **Techdin AI** — legal GPT for case analysis
6. **Smart Agent** — email alerts for new cases

**⚠️ НЕДОСТАТКИ:**
1. **Specialized data** — ONLY courts (no financials)
2. **Gateway Provider license** — ₪1M capital + ₪50K-200K/year (expensive)
3. **Alternative:** Can use via CheckID API (₪1.50/query) — cheaper integration

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **LEGAL LAYER** — essential for comprehensive due diligence
- **Владельцы:** ❌ No (not in scope)
- **Финансы:** ❌ No
- **Суды:** ✅ 2.5M+ decisions, early bankruptcy signals
- **Устойчивость:** ⭐⭐⭐ Indirect (lawsuits predict financial distress)

**💰 ROI РАСЧЁТ:**
- **Option A (Direct):** ₪299/month subscription = ₪3,588/year
- **Option B (via CheckID):** ₪1.50 × 10,000 queries = ₪15,000/month = ₪180K/year
- **Recommendation:** Use **CheckID API integration** (pay-per-query, no subscription burden)

**📊 РЕКОМЕНДАЦИЯ:** ✅ **INTEGRATE Phase 1 (MVP)** — через CheckID API (₪1.50/query) для избежания Gateway Provider licensing.

---

## 4️⃣ РЕЙТИНГ 4: CheckNet — 🟢 ВАЖНО (Tier 2)

### Общая оценка: **75/100**

**Категория:** AI/OSINT Reputation Intelligence  
**Покрытие SBF:** 2.5/4 критерия (50%)  
**Цена:** ₪150-300/report (Basic), ₪500-1,000 (Comprehensive)  
**API:** ⚠️ Unclear (likely available for B2B)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Social media intelligence** — LinkedIn, Facebook, Instagram analysis
2. **News aggregation** — Hebrew + English media (Ynet, Haaretz, Globes)
3. **International sanctions** — OFAC, EU, UN screening
4. **AI-powered** — NLP sentiment analysis, entity recognition
5. **Fills reputation gap** — data NOT available from credit bureaus

**⚠️ НЕДОСТАТКИ:**
1. **Expensive** — ₪150-300 vs BDI Code ₪3.60 (42-83× дороже)
2. **NO financial data** — not substitute for credit bureaus
3. **Limited court data** — news mentions only (NOT full case files)
4. **API unclear** — may require manual reports (slow)

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **PREMIUM LAYER** — for executive screening, M&A due diligence
- **Владельцы:** ⭐⭐⭐⭐ Social media profiles (LIMITED for private beneficial owners)
- **Финансы:** ❌ No
- **Суды:** ⭐⭐⭐ News mentions (NOT comprehensive)
- **Устойчивость:** ⭐⭐⭐ Reputation-based risk (NOT credit scoring)

**💰 ROI РАСЧЁТ:**
- **Standard check:** Skip CheckNet (too expensive) — use BDI Code ₪3.60
- **Premium check (1% cases):** ₪155.10 (BDI + Takdin + CheckNet ₪150)
- **SBF markup:** Charge ₪250-400 for premium (₪95-245 profit)

**📊 РЕКОМЕНДАЦИЯ:** 🟢 **INTEGRATE Phase 2 (Premium)** — ONLY for high-value clients (executives, M&A, VIP).

---

## 5️⃣ РЕЙТИНГ 5: CheckID — 🟡 ОПЦИОНАЛЬНО (Tier 2)

### Общая оценка: **72/100**

**Категория:** Freemium Aggregator  
**Покрытие SBF:** 3/4 критерия (75%)  
**Цена:** ₪0-22.50/query (Freemium model)  
**API:** ✅ REST/JSON  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Revolutionary freemium** — ₪0 basic, ₪19 Nesach, ₪1.50 courts (via Takdin)
2. **Guideline Group** — owns Takdin (integrated court data)
3. **Public data aggregator** — Companies Registrar, public sources
4. **Low barrier to entry** — no setup fees

**⚠️ НЕДОСТАТКИ:**
1. **NO credit bureau license** — missing Bank of Israel Credit Registry (critical gap)
2. **NO financial depth** — can't compete with BDI Code/D&B
3. **Freemium limitations** — basic reports lack comprehensive data

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **BUDGET ALTERNATIVE** — for low-value checks (NOT recommended as primary)
- **Court data gateway** — use CheckID API for Takdin access (₪1.50/query)
- **Владельцы:** ⭐⭐⭐ Public companies only
- **Финансы:** ⭐⭐ Public data only (NO trade payments)
- **Суды:** ✅ Via Takdin integration
- **Устойчивость:** ⭐⭐ Public indicators only

**💰 ROI РАСЧЁТ:**
- Per query: ₪22.50 (full report) vs BDI Code $1 (~₪3.60)
- **CheckID more expensive** for equivalent data (due to lack of credit bureau license)

**📊 РЕКОМЕНДАЦИЯ:** 🟡 **CONSIDER Phase 2** — use CheckID API ONLY for Takdin court data access (₪1.50/query), NOT as primary data source.

---

## 6️⃣ РЕЙТИНГ 6: Business Data Israel — 🟡 ОПЦИОНАЛЬНО (Tier 2)

### Общая оценка: **68/100**

**Категория:** Budget Aggregator for SME/עוסקים  
**Покрытие SBF:** 3.5/4 критерия (85%)  
**Цена:** ₪5K-10K setup + ₪999/month + ₪0.30-0.80/query  
**API:** ⚠️ Beta (unstable)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **70% cheaper than BDI Code** — ₪0.30-0.80/query vs $1 (~₪3.60)
2. **6 government sources** — Companies Registrar, Courts, Pledges, Hotzaa LaPoal, Restricted Accounts, Tax Authority (limited)
3. **עוסקים focus** — designed for small businesses
4. **Budget-friendly** — ₪999/month vs BDI Code $1.5K/month

**⚠️ НЕДОСТАТКИ:**
1. **NO credit bureau license** — missing Bank of Israel Credit Registry (fatal flaw)
2. **API in beta** — unstable, potential integration issues
3. **NO trade payment data** — can't provide PAYDEX/FICO scores
4. **NOT comprehensive** — gaps in financial intelligence

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **NOT for MVP** — missing critical credit data
- **Phase 3-4 consideration** — as budget tier (for price-sensitive customers)
- **Владельцы:** ⭐⭐⭐ Public data
- **Финансы:** ⭐⭐ NO credit bureau data (critical gap)
- **Суды:** ✅ Public court data
- **Устойчивость:** ⭐⭐⭐ Indirect indicators (bankruptcies, liens)

**💰 ROI РАСЧЁТ:**
- Setup: ₪5K-10K
- Monthly: ₪999
- Per query: ₪0.30-0.80 × 10,000 = ₪3K-8K/month
- **Total Year 1:** ₪48K-106K (vs BDI Code $143K)
- **BUT:** Missing 40% of critical data (credit bureau)

**📊 РЕКОМЕНДАЦИЯ:** 🟡 **CONSIDER Phase 3-4** — ONLY if SBF adds "budget tier" for price-sensitive market (NOT strategic choice for MVP).

---

## 7️⃣ РЕЙТИНГ 7: KYC Israel — 🟡 ОПЦИОНАЛЬНО (Tier 3)

### Общая оценка: **82/100** (specialized)

**Категория:** Boutique Research Firm (Manual investigations)  
**Покрытие SBF:** 3.5/4 критерия (80%)  
**Цена:** ₪5,000-20,000/investigation  
**API:** ❌ Manual service (email requests)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Beneficial owner tracing** — discovers hidden stakeholders (⭐⭐⭐⭐⭐)
2. **Field investigations** — site visits, physical verification
3. **Expert analysis** — human intelligence, contextual insights
4. **English-language reports** — for international clients
5. **Asset searches** — real estate, vehicles, pledges

**⚠️ НЕДОСТАТКИ:**
1. **NO API** — manual email requests only (not scalable)
2. **Slow delivery** — 1-3 weeks vs real-time
3. **Expensive** — ₪5K-20K vs BDI Code ₪3.60 (1,400-5,500× дороже)
4. **NOT scalable** — limited by human analyst capacity

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **VIP OUTSOURCING** — for complex M&A (>$1M), fraud investigations
- **Владельцы:** ⭐⭐⭐⭐⭐ BEST (discovers hidden beneficial owners)
- **Финансы:** ⭐⭐⭐ Asset searches (NO direct Tax Authority access)
- **Суды:** ⭐⭐⭐⭐ Comprehensive (manual analysis)
- **Устойчивость:** ⭐⭐⭐⭐ Expert-level assessment

**💰 ROI РАСЧЁТ:**
- **Standard checks:** DON'T use KYC Israel (too expensive)
- **VIP checks (1% cases):** ₪10,162 (BDI + Takdin + CheckNet + KYC Israel ₪10K)
- **SBF charges:** ₪15K-30K (₪5K-20K profit)

**📊 РЕКОМЕНДАЦИЯ:** 🟡 **PARTNERSHIP Phase 3 (VIP)** — outsource ONLY for 1% highest-value cases (M&A due diligence, fraud investigations).

---

## 8️⃣ РЕЙТИНГ 8: WeCheck — 🟡 ОПЦИОНАЛЬНО (Tier 3)

### Общая оценка: **65/100** (niche)

**Категория:** Open Banking / Fintech  
**Покрытие SBF:** 2/4 критерия (60% niche)  
**Цена:** ₪50-150/check + 1-3% guarantee fees  
**API:** ⚠️ Possible (for fintech partners)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Real-time cash flow** — bank account analysis (vs historical credit data)
2. **Open Banking** — direct bank connections (NOT public data aggregation)
3. **עוסקים without formal financials** — alternative to credit bureaus
4. **Instant approval** — check clearing in seconds

**⚠️ НЕДОСТАТКИ:**
1. **NICHE application** — ONLY for עוסקים without tax returns
2. **Requires bank authorization** — user must consent (privacy barrier)
3. **NOT comprehensive** — NO ownership, courts, credit history
4. **Expensive** — ₪50-150 + 1-3% fees (vs BDI Code ₪3.60)

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **NICHE SOLUTION** — for עוסקים lacking formal financials
- **Владельцы:** ❌ No
- **Финансы:** ⭐⭐⭐⭐ Real-time cash flow (LIMITED to bank data)
- **Суды:** ❌ No
- **Устойчивость:** ⭐⭐⭐⭐ Cash flow analysis (ONLY if user authorizes)

**💰 ROI РАСЧЁТ:**
- Per check: ₪50-150 (vs BDI Code ₪3.60)
- **14-42× more expensive** for LIMITED data

**📊 РЕКОМЕНДАЦИЯ:** 🟡 **CONSIDER Phase 3** — ONLY if SBF targets עוסקים niche (NOT strategic for mainstream B2B due diligence).

---

## 9️⃣ РЕЙТИНГ 9: Midrug (S&P Maalot) — 🔴 НЕ РЕКОМЕНДУЕТСЯ

### Общая оценка: **45/100**

**Категория:** Credit Rating Agency (Institutional)  
**Покрытие SBF:** 2.5/4 критерия (70%)  
**Цена:** ₪50,000-200,000/rating  
**API:** ❌ No (institutional service)  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **S&P Global partnership** — international credibility
2. **Institutional ratings** — AAA to D scale
3. **Deep financial analysis** — comprehensive methodology

**⚠️ НЕДОСТАТКИ:**
1. **NO עוסקים coverage** — institutional clients only (public companies, bonds)
2. **Prohibitively expensive** — ₪50K-200K per rating (vs BDI Code ₪3.60)
3. **NO API** — manual rating process (3-6 months)
4. **NOT suitable for SBF** — wrong target market

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **NOT APPLICABLE** — Midrug serves institutional market (NOT SME/עוסקים)

**📊 РЕКОМЕНДАЦИЯ:** 🔴 **DO NOT INTEGRATE** — wrong service category, prohibitively expensive.

---

## 🔟 РЕЙТИНГ 10: ERN (Menora) — ❌ ИГНОРИРОВАТЬ

### Общая оценка: **25/100**

**Категория:** Payment Clearinghouse (Check guarantee)  
**Покрытие SBF:** 1/4 критерия (25%)  
**Цена:** ₪5-15/check + ₪500-2,000/month  
**API:** ⚠️ Merchant POS only  

### Аудит решения:

**✅ ПРЕИМУЩЕСТВА:**
1. **Check payment guarantee** — merchant risk mitigation
2. **Real-time verification** — binary YES/NO (seconds)
3. **Proprietary risk model** — 300+ parameters

**⚠️ НЕДОСТАТКИ:**
1. **WRONG CATEGORY** — ERN is payment processor, NOT business intelligence
2. **Binary output** — ONLY "will check clear?" (NOT comprehensive due diligence)
3. **NO company data** — NO ownership, financials, courts
4. **NOT for SBF** — solves different problem (payment acceptance vs due diligence)

**🎯 ПРИМЕНЕНИЕ ДЛЯ SBF:**
- **NOT APPLICABLE** — ERN for merchants accepting checks, NOT for company verification

**📊 РЕКОМЕНДАЦИЯ:** ❌ **IGNORE** — wrong service category (payment clearinghouse vs business intelligence).

---

## 🚫 EXTRA: Captain Credit — ❌ ИГНОРИРОВАТЬ

### Общая оценка: **0/100** (wrong category)

**Категория:** B2C Personal Credit Scoring  
**Покрытие SBF:** 0/4 критерия  
**Цена:** ₪0-49/month (B2C app)  
**API:** ❌ No B2B API  

### Аудит решения:

**⚠️ КРИТИЧЕСКИЙ ВЫВОД:**
- **Captain Credit = D&B Israel's consumer app** (for citizens checking personal credit)
- **NO company data** — ONLY personal credit scores (ת.ז.)
- **NOT B2B** — wrong category

**📊 РЕКОМЕНДАЦИЯ:** ❌ **IGNORE Captain Credit** — use **D&B Business Reports API** instead (для компаний).

---

## 📈 ИТОГОВАЯ СРАВНИТЕЛЬНАЯ ТАБЛИЦА

| # | Platform | Category | SBF Coverage | Price/Query | API | Tier | Recommendation |
|---|----------|----------|--------------|-------------|-----|------|----------------|
| 1 | **BDI Code** | Credit Bureau | 4/4 (95%) | ~₪3.60 | ✅ | Tier 1 | ✅ PRIMARY |
| 2 | **D&B Israel** | Credit Bureau | 4/4 (95%) | ~₪7.20 | ✅ | Tier 1 | ✅ SECONDARY |
| 3 | **Takdin** | Legal DB | 1.5/4 (40%) | ₪1.50 via CheckID | ⚠️ | Tier 2 | ✅ ESSENTIAL |
| 4 | **CheckNet** | AI/OSINT | 2.5/4 (50%) | ₪150-300 | ⚠️ | Tier 2 | 🟢 PREMIUM |
| 5 | **CheckID** | Aggregator | 3/4 (75%) | ₪22.50 | ✅ | Tier 2 | 🟡 OPTIONAL |
| 6 | **Bus. Data IL** | Aggregator | 3.5/4 (85%) | ₪0.30-0.80 | ⚠️ | Tier 2 | 🟡 Phase 3-4 |
| 7 | **KYC Israel** | Manual Inv. | 3.5/4 (80%) | ₪5K-20K | ❌ | Tier 3 | 🟡 VIP only |
| 8 | **WeCheck** | Open Banking | 2/4 (60%) | ₪50-150 | ⚠️ | Tier 3 | 🟡 Niche |
| 9 | **Midrug** | Rating Agency | 2.5/4 (70%) | ₪50K-200K | ❌ | — | 🔴 NO |
| 10 | **ERN** | Check Clear | 1/4 (25%) | ₪5-15 | ⚠️ | — | ❌ IGNORE |
| — | **Captain Credit** | B2C Personal | 0/4 (0%) | ₪0-49 | ❌ | — | ❌ IGNORE |

---

## 🎯 ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ ДЛЯ SBF

### **PHASE 1 (MVP) — Обязательная интеграция:**

1. ✅ **BDI Code** (₪3.60/query) — PRIMARY credit bureau
2. ✅ **Takdin via CheckID** (₪1.50/query) — courts/litigation
3. ✅ **D&B Israel** (₪7.20/query) — SECONDARY/validation

**Общая стоимость стандартной проверки:** ₪12.30  
**SBF цена клиентам:** ₪20-30 (с наценкой)  
**Target margin:** 62-144% markup

---

### **PHASE 2 (Premium) — Репутационный слой:**

4. 🟢 **CheckNet** (₪150-300/report) — AI/OSINT reputation

**Общая стоимость премиум-проверки:** ₪162.30  
**SBF цена клиентам:** ₪250-400  
**Target clients:** Executive screening, M&A advisors

---

### **PHASE 3 (VIP) — Человеческий интеллект:**

5. 🟡 **KYC Israel** (₪10K-20K/investigation) — beneficial owner tracing, field investigations

**Общая стоимость VIP-проверки:** ₪10,162.30  
**SBF цена клиентам:** ₪15K-30K  
**Target clients:** M&A deals >$1M, fraud investigations

---

### **НЕ РЕКОМЕНДУЕТСЯ:**

- 🔴 **Midrug** — institutional only, ₪50K-200K (prohibitively expensive)
- ❌ **ERN** — payment clearinghouse (wrong category)
- ❌ **Captain Credit** — B2C personal credit (NOT B2B)

---

### **ОПЦИОНАЛЬНО (Phase 3-4):**

- 🟡 **Business Data Israel** — budget tier (если SBF targeting price-sensitive market)
- 🟡 **WeCheck** — niche (עוסקים without formal financials)
- 🟡 **CheckID direct** — if need additional data sources

---

## 💰 ЦЕНОВАЯ СТРАТЕГИЯ SBF

### **Tier 1: Basic Check (₪20-30)**
**Data sources:** BDI Code (₪3.60) + Takdin via CheckID (₪1.50) = **₪5.10**  
**SBF cost:** ₪5.10  
**SBF price:** ₪20-30  
**Margin:** ₪14.90-24.90 (292-488%)  
**Use case:** Standard supplier verification, עוסק מורשה checks

---

### **Tier 2: Standard Check (₪30-50)**
**Data sources:** BDI Code + Takdin + D&B = **₪12.30**  
**SBF cost:** ₪12.30  
**SBF price:** ₪30-50  
**Margin:** ₪17.70-37.70 (144-307%)  
**Use case:** Company verification, חברה בע"מ checks

---

### **Tier 3: Premium Check (₪250-400)**
**Data sources:** BDI + Takdin + D&B + CheckNet (₪150) = **₪162.30**  
**SBF cost:** ₪162.30  
**SBF price:** ₪250-400  
**Margin:** ₪87.70-237.70 (54-146%)  
**Use case:** Executive screening, board appointments, sensitive partnerships

---

### **Tier 4: VIP Investigation (₪15K-30K)**
**Data sources:** ALL automated + KYC Israel (₪10K-20K) = **₪10,162-20,162**  
**SBF cost:** ₪10,162-20,162  
**SBF price:** ₪15K-30K  
**Margin:** ₪4,838-9,838 (48-49%)  
**Use case:** M&A due diligence (deals >$1M), fraud investigations, complex beneficial owner searches

---

## 📊 PROJECTED REVENUE MODEL (Year 1)

### **Assumptions:**
- 1,000 checks/month (12,000/year)
- Mix: 80% Basic, 15% Standard, 4% Premium, 1% VIP

### **Revenue breakdown:**

| Tier | Volume | Price | Revenue |
|------|--------|-------|---------|
| Basic | 9,600 | ₪25 | ₪240K |
| Standard | 1,800 | ₪40 | ₪72K |
| Premium | 480 | ₪325 | ₪156K |
| VIP | 120 | ₪22.5K | ₪2.7M |
| **TOTAL** | **12,000** | **—** | **₪3.168M** |

### **Cost breakdown:**

| Tier | Volume | Cost | Total Cost |
|------|--------|------|------------|
| Basic | 9,600 | ₪5.10 | ₪48.96K |
| Standard | 1,800 | ₪12.30 | ₪22.14K |
| Premium | 480 | ₪162.30 | ₪77.9K |
| VIP | 120 | ₪15K | ₪1.8M |
| **Setup/Fixed** | — | — | ₪50K (BDI+D&B setup) |
| **TOTAL** | **12,000** | **—** | **₪2.0M** |

### **Profitability:**
- **Gross revenue:** ₪3.168M
- **Data costs:** ₪2.0M
- **Gross margin:** ₪1.168M (37%)
- **Net margin (after ops):** ~₪600K-800K (20-25%)

---

## 🚀 IMPLEMENTATION ROADMAP

### **Month 1-3: MVP Launch**
1. Contract BDI Code (setup $5K, negotiate API terms)
2. Contract D&B Israel (setup $10K, secondary validation)
3. Integrate CheckID API (for Takdin court data access)
4. Build SBF aggregation layer (unified API)
5. Launch Basic + Standard tiers

**Deliverable:** 80% of SBF functionality (Basic + Standard checks)

---

### **Month 4-6: Premium Features**
1. Contract CheckNet (negotiate B2B API terms)
2. Integrate CheckNet API (reputation layer)
3. Launch Premium tier (₪250-400)
4. Marketing to M&A advisors, VCs, executive search firms

**Deliverable:** 95% of SBF functionality (Premium checks)

---

### **Month 7-12: VIP Services**
1. Partnership with KYC Israel (referral OR white-label agreement)
2. Launch VIP tier (₪15K-30K)
3. Target: M&A advisors, law firms, fraud investigators
4. Build sales pipeline for high-value clients

**Deliverable:** 100% of SBF functionality (VIP investigations)

---

### **Year 2+: Optimization**
1. Consider Business Data Israel (budget tier)
2. Consider WeCheck (עוסקים niche)
3. Build AI-powered risk scoring (proprietary models)
4. International expansion (use D&B global network)

---

## ⚠️ CRITICAL RISKS & MITIGATION

### **Risk 1: Data Cost Escalation**
**Threat:** BDI Code/D&B raise prices after lock-in  
**Mitigation:** Negotiate 3-year fixed pricing, build Business Data Israel as backup

### **Risk 2: API Stability**
**Threat:** CheckID API in beta (potential downtime)  
**Mitigation:** Build redundancy (direct Takdin subscription as backup)

### **Risk 3: Regulatory Changes**
**Threat:** Bank of Israel tightens credit data access  
**Mitigation:** Maintain credit bureau licenses (BDI Code, D&B), don't rely on aggregators

### **Risk 4: Competition**
**Threat:** D&B/BDI launch B2C apps  
**Mitigation:** Differentiate with AI analysis, Hebrew/Russian UX, עוסקים focus

### **Risk 5: Low VIP Conversion**
**Threat:** <1% customers buy VIP tier  
**Mitigation:** Focus on Basic/Standard tiers (80% revenue), VIP is bonus

---

## ✅ GO/NO-GO DECISION MATRIX

### **✅ GO — Proceed with SBF Platform**

**Reasons:**
1. ✅ **Data accessible** — BDI Code + D&B provide 95% coverage
2. ✅ **Legal compliance** — licensed credit bureaus (no regulatory risk)
3. ✅ **Scalable pricing** — ₪5.10-12.30 per check (sustainable margins)
4. ✅ **Market demand** — Israeli businesses need affordable due diligence
5. ✅ **Differentiation** — AI analysis + Hebrew/Russian UX + עוסקים focus

**Critical success factors:**
- ✅ Negotiate favorable BDI Code terms (primary data source)
- ✅ Integrate CheckID API (avoid Gateway Provider licensing)
- ✅ Build AI risk engine (proprietary value-add)
- ✅ Target עוסקים market (underserved by enterprise platforms)

---

## 📝 FINAL VERDICT

**РЕЙТИНГ ПЛАТФОРМ (от лучшего к худшему):**

1. 🥇 **BDI Code** — PRIMARY credit bureau (Phase 1)
2. 🥈 **D&B Israel** — SECONDARY validation (Phase 1)
3. 🥉 **Takdin (via CheckID)** — Courts/litigation (Phase 1)
4. 4️⃣ **CheckNet** — Reputation layer (Phase 2)
5. 5️⃣ **CheckID** — Optional aggregator (Phase 2)
6. 6️⃣ **Business Data Israel** — Budget tier (Phase 3-4)
7. 7️⃣ **KYC Israel** — VIP outsourcing (Phase 3)
8. 8️⃣ **WeCheck** — Niche (עוסקים) (Phase 3)
9. 9️⃣ **Midrug** — NOT RECOMMENDED (institutional only)
10. 🔟 **ERN** — IGNORE (wrong category)
11. 🚫 **Captain Credit** — IGNORE (B2C personal)

**ИТОГОВАЯ СТРАТЕГИЯ:**
- **Фаза 1:** BDI Code + D&B + Takdin (Core data, 95% functionality)
- **Фаза 2:** + CheckNet (Premium reputation layer)
- **Фаза 3:** + KYC Israel (VIP manual investigations)

**EXPECTED OUTCOME:** Profitable B2B platform with 37% gross margins, serving underserved עוסקים/SME market in Israel.

---

**Дата финализации:** 22 декабря 2025  
**Следующие шаги:** Contract negotiations with BDI Code, D&B, CheckID
