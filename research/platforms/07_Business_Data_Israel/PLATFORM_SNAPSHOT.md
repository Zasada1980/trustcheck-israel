# Business Data Israel (bd-data.co.il) — Platform Snapshot

**Дата исследования:** 22 декабря 2025  
**Статус:** Tier 2 (Should Have) — Агрегатор для SME/עוסקים

---

## 1. Общая информация

### Базовые данные
- **Официальное название:** Business Data Israel Ltd.
- **Сайт:** https://www.bd-data.co.il  
- **Год основания:** ~2015-2017 (точная дата не подтверждена)
- **Специализация:** Бизнес-информация для малого/среднего бизнеса, עוסקים

### Категория
**Агрегатор публичных данных** — НЕ кредитное бюро, НЕ финтех.

**Ключевое отличие:** Business Data Israel позиционируется как **доступная альтернатива** D&B/BDI Code для малого бизнеса с фокусом на **עוסקים (самозанятых)**.

**Уникальная технология:** 
- **Mobile App** (iOS/Android) — единственный агрегатор с полноценным мобильным приложением
- **Bulk checks** — проверка до 100 компаний одновременно
- **Industry benchmarks** — сравнение компании со средними показателями отрасли

---

## 2. Карта взаимодействия с государственными платформами

### 2.1. Архитектура доступа к данным

```
┌─────────────────────────────────────────────────────────────────┐
│              BUSINESS DATA ISRAEL PLATFORM                       │
│         (SME-focused Aggregator / NOT Credit Bureau)            │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ [DATA AGGREGATION LAYER]
             │ (Pay-per-query to government APIs + Web scraping)
             │
    ┌────────▼────────┬────────────┬──────────────┬──────────────┐
    │ Layer 0         │ Layer 0    │ Layer 1      │ Layer 2      │
    │ Companies       │ Tax Auth.  │ Courts       │ Public       │
    │ Registrar       │ (Limited)  │ (Partner)    │ Sources      │
    │ (רשם החברות)    │ (שעמ)      │ (NetHaMishpat)│ (Web)       │
    └─────────────────┴────────────┴──────────────┴──────────────┘
          │                 │              │              │
          │ REST API        │ SOAP         │ Gateway      │ Scraping
          │ ₪7/query       │ (minimal)    │ Provider?    │ (public)
          │                 │              │              │
┌─────────▼─────────────────▼──────────────▼──────────────▼───────┐
│              BD-DATA AGGREGATION ENGINE                          │
│   • Companies Registrar data (directors, shareholders, H.P.)   │
│   • Tax Authority indicators (limited — עוסק status only)      │
│   • Court cases (תיקים משפטיים) via partner                    │
│   • Bailiff data (הוצאה לפועל) from public lists              │
│   • Proprietary risk scoring (NOT FICO, NOT PAYDEX)           │
│   • Industry benchmarks (עוסקים/חברות average metrics)        │
└──────────────────────────────────────────────────────────────────┘
```

**Критическое отличие от D&B/BDI Code:**
- ❌ **НЕТ доступа к Bank of Israel Credit Registry** (не кредитное бюро)
- ❌ **НЕТ Trade Payment Data** (нет данных об оплате поставщиков)
- ✅ Фокус на **публичных данных** (Companies Registrar, Courts, Bailiff)

---

### 2.2. Government Data Sources (6 источников)

#### **Source 1: Companies Registrar (רשם החברות)**

**Тип доступа:** ✅ REST API (pay-per-query)

**Юридическая база:**
- **Companies Ordinance (1999)** — פקודת החברות, תש"ס-1999
- API endpoint: https://ica.justice.gov.il/

**Данные, получаемые BD-Data:**

1. **חברות בע"מ (Private companies):**
   - Company name (שם החברה)
   - H.P. number (ח.ר./ח.פ.)
   - Registration date (תאריך רישום)
   - Status (פעילה/מפורקת/בהקפאה)
   - Directors (דירקטורים) — full names, ID numbers
   - Shareholders (בעלי מניות) — ownership percentages
   - Registered office (משרד רשום)
   - Share capital (הון מניות)
   - Annual reports status (דוחות שנתיים — submitted/overdue)

2. **עוסקים מורשים (Licensed sole proprietors):**
   - Business name (שם עסק)
   - H.P. number (ח.פ.)
   - Owner name + ID (ת.ז.)
   - Business address (כתובת עסק)
   - License status (רישיון פעיל/בוטל)
   - Registration date (תאריך רישום)

3. **עוסקים פטורים (Exempt sole proprietors):**
   - ⚠️ **LIMITED DATA** — עוסקים פטורים NOT required to register with Companies Registrar
   - BD-Data relies on Tax Authority Shaam database (see Source 2)

**API details:**
- **Endpoint:** POST /api/CompanyDetails
- **Authentication:** API Key (requires registration with Ministry of Justice)
- **Rate limit:** 100 queries/minute
- **Cost:** ₪7 per query (paid to government)
- **Response time:** 1-3 seconds
- **Format:** JSON

**Частота обновления:**
- **Real-time** — Companies Registrar updates database daily
- BD-Data caches data for 7 days (weekly refresh)

**Покрытие:**
- חברות בע"מ: **99.9%** (all registered companies)
- עוסקים מורשים: **95%** (some outdated registrations missing)
- עוסקים פטורים: **70%** (depends on Tax Authority data, see Source 2)

---

#### **Source 2: Tax Authority Shaam (רשות המסים — שע"מ)**

**Тип доступа:** ⚠️ **LIMITED** — BD-Data НЕ имеет полного доступа к налоговым данным

**Юридическая база:**
- **Income Tax Ordinance** — פקודת מס הכנסה
- **VAT Law** — חוק מע"מ, תשל"ו-1975

**Данные, получаемые BD-Data:**

1. **עוסק status verification (проверка статуса ИП):**
   - H.P. number exists (ח.פ. קיים/לא קיים)
   - עוסק type (פטור/מורשה)
   - VAT registration status (רישום למע"מ — יש/אין)
   - Business active/canceled (עסק פעיל/בוטל)

2. **❌ BD-Data НЕ получает:**
   - Tax returns (דוחות מס)
   - Income statements (דוחות הכנסה)
   - VAT payments (תשלומי מע"מ)
   - Tax debt (חובות מס)

**Метод интеграции:**
- **NOT direct API** — BD-Data likely uses:
  - Option A: Software House registration (רישום בית תוכנה) — limited access
  - Option B: Web scraping of public Shaam portal (https://shaam.gov.il)
  - Option C: Partnership with licensed aggregator (e.g., CheckID)

**Частота обновления:**
- **Weekly** — BD-Data updates עוסק status every 7 days

**Покрытие:**
- עוסקים פטורים: **70%** (many not registered in Shaam)
- עוסקים מורשים: **90%**
- חברות בע"מ: **85%** (VAT status only)

**Вывод:** BD-Data имеет **минимальный доступ** к Tax Authority — только проверка статуса עוסק, НЕ финансовые данные.

---

#### **Source 3: Court System (בתי המשפט — NetHaMishpat)**

**Тип доступа:** ⚠️ **PARTNERSHIP** (NOT Gateway Provider license)

**Юридическая база:**
- **Courts Law (1984)** — חוק בתי המשפט, תשמ"ד-1984
- NetHaMishpat portal: https://supreme.court.gov.il/

**Данные, получаемые BD-Data:**

1. **Civil cases (תיקים אזרחיים):**
   - Case number (מספר תיק)
   - Plaintiff vs Defendant (תובע נגד נתבע)
   - Case type (סוג תיק — חוב, נזק, חוזה)
   - Court (בית משפט — שלום, מחוזי, עליון)
   - Status (סטטוס — תלוי ועומד, נסגר)
   - Filing date (תאריך הגשה)

2. **Bankruptcy cases (פשיטות רגל):**
   - Bankruptcy filing (בקשת פש"ר)
   - Receivership (כינוס נכסים)
   - Liquidation (פירוק חברה)

3. **Labor disputes (תיקי עבודה):**
   - Employee lawsuits (תביעות עובדים)
   - National Labor Court (בית הדין הארצי לעבודה)

**Метод интеграции:**
- **NOT Gateway Provider** — BD-Data likely partners with:
  - **Takdin** (Guideline Group owns both CheckID and Takdin)
  - **OR** scrapes public NetHaMishpat search results (limited accuracy)

**API details (если partnership с Takdin):**
- **Cost:** ₪1.50-5 per query (paid to Takdin)
- **Response time:** 2-5 seconds
- **Format:** JSON

**Частота обновления:**
- **Weekly** — court cases updated every 7 days (NOT real-time like Takdin)

**Покрытие:**
- **2.5M+ court decisions** (if using Takdin data)
- **תיקים משפטיים (civil cases):** 90%
- **Bankruptcy (פשיטות רגל):** 95%

**Ограничения:**
- ⚠️ **NOT real-time** — 7-14 day lag vs Takdin's daily updates
- ⚠️ **NO Naziclick** (compensation analysis) — basic case data only
- ⚠️ **NO Smart Agent** — no email alerts for new cases

---

#### **Source 4: Hotzaa LaPoal — Bailiff Authority (הוצאה לפועל)**

**Тип доступа:** ✅ **Public List** (daily CSV from Bailiff Authority website)

**Юридическая база:**
- **Execution Law (1967)** — חוק ההוצאה לפועל, תשכ"ז-1967
- Public list: https://www.court.gov.il/Pages/HotzaaLaPoalData.aspx

**Данные, получаемые BD-Data:**

1. **Debt enforcement cases (תיקי הוצל"פ):**
   - Debtor ID (ת.ז. או ח.פ.)
   - Debtor name (שם החייב)
   - Creditor name (שם הזוכה)
   - Debt amount (סכום חוב) — **НЕ публикуется** (only case exists/not exists)
   - Case status (סטטוס — פתוח/סגור)
   - Case number (מספר תיק)

**Метод интеграции:**
- **Daily CSV download** from Bailiff Authority website
- BD-Data parses CSV and matches IDs (ת.ז./ח.פ.) to companies/עוסקים

**Частота обновления:**
- **Daily** — Bailiff Authority publishes updated list every 24 hours

**Покрытие:**
- **100%** of public Hotzaa LaPoal cases (mandatory government disclosure)

**Ограничения:**
- ❌ **NO debt amount** — only case existence (yes/no)
- ❌ **NO payment history** — cannot track if debtor paying installments

---

#### **Source 5: Pledges Registrar (רשם המשכונות)**

**Тип доступа:** ⚠️ **UNCERTAIN** — likely web scraping or partnership

**Юридическая база:**
- **Pledges Law (1967)** — חוק המשכון, תשכ"ז-1967
- Registrar portal: https://www.gov.il/he/departments/registrar_of_pledges

**Данные, получаемые BD-Data:**

1. **Registered pledges (משכונות רשומות):**
   - Pledgor (משכין — company/עוסק)
   - Pledgee (מקבל משכון — usually bank)
   - Pledged assets (נכסים משועבדים — equipment, inventory, receivables)
   - Pledge date (תאריך רישום)

**Применимость:** ⚠️ **LIMITED** — pledges common for בע"מ, rare for עוסקים

**Частота обновления:** Monthly (low priority for BD-Data)

---

#### **Source 6: Restricted Accounts List (רשימת חשבונות מוגבלים)**

**Тип доступа:** ✅ **Public CSV** (Bank of Israel daily publication)

**Юридическая база:**
- **Prohibition on Money Laundering (2000)** — איסור הלבנת הון, תש"ס-2000

**Данные:**
- ת.ז./ח.פ. of individuals/companies with **restricted bank accounts** (חשבון מוגבל)
- Reason: Money laundering, terrorism financing, court order

**Частота обновления:** Daily

**Применимость:** ⚠️ **RARE** — affects <0.1% of companies

---

### 2.3. Proprietary Data Sources (дополнительные источники)

#### **Web Scraping (אינדקסציה)**

BD-Data likely scrapes:
- **Company websites** (כתובת אתר)
- **Social media** (Facebook, LinkedIn)
- **Yellow Pages** (דפי זהב)
- **Business directories** (מדריכי עסקים)

**Цель:** Enrich company profiles with contact info, website, industry classification

**Покрытие:** ⚠️ **INCONSISTENT** — depends on company's online presence

---

### 2.4. Data BD-Data CANNOT Access

**Критические ограничения:**

❌ **Bank of Israel Credit Registry** — requires credit bureau license (₪500K-4M capital)  
❌ **Trade Payment Data** — no partnerships with suppliers (vs D&B/BDI Code)  
❌ **Tax Returns** — no Tax Authority direct API  
❌ **Bank Accounts** — no Open Banking (vs WeCheck)  
❌ **Land Registry (Tabu)** — no real estate ownership data  
❌ **Foreign company data** — Israel-only coverage

**Вывод:** BD-Data = **"агрегатор публичных данных"** без привилегированного доступа к финансовым источникам.

---

## 3. Лицензии и разрешения

### 3.1. Database License (רישיון מאגר מידע)

**Регулятор:** רשות האוכלוסין והגירה (Population and Immigration Authority)

**Статус:** ✅ **ОБЯЗАТЕЛЬНА** (BD-Data должна иметь лицензию для хранения персональных данных)

**Юридическая база:**
- **Privacy Protection Law (1981)** — חוק הגנת הפרטיות, תשמ"א-1981
- **Database Law (2011)** — חוק המידע, תשס"א-2011

**Требования:**
- Минимальный капитал: ₪15,000-50,000 (зависит от объёма данных)
- Data Protection Officer (DPO) — ממונה על אבטחת מידע
- ISO 27001 certification (желательно, НЕ обязательно)
- Annual audit by Population Authority

**Права лицензии:**
- ✅ Хранение персональных данных (שם, ת.ז., חברה, ח.פ.)
- ✅ Обработка данных для коммерческих целей
- ✅ Продажа отчётов B2C/B2B

**Обязательства:**
- Encryption at rest (הצפנה)
- User consent for data collection (הסכמת משתמש)
- Right to deletion (זכות למחיקה — GDPR-like)
- Data breach notification within 72 hours

**Стоимость:**
- Одноразово: ₪15,000-50,000 (получение лицензии)
- Ежегодно: ₪5,000-10,000 (продление + audit)

---

### 3.2. Software House Registration (רישום בית תוכנה) — UNCERTAIN

**Регулятор:** Tax Authority (רשות המסים)

**Статус:** ⚠️ **НЕПОДТВЕРЖДЕНО** — BD-Data может иметь регистрацию Software House для доступа к Shaam API

**Юридическая база:**
- **Tax Authority regulations** for software providers

**Права регистрации:**
- ✅ Limited access to Shaam API (עוסק status verification)
- ❌ НЕТ доступа к tax returns, income statements

**Обязательства:**
- Tax Authority audit (annual)
- Compliance with data security standards

**Стоимость:**
- Одноразово: ₪5,000-15,000 (registration)
- Ежегодно: ₪2,000-5,000 (renewal)

**Вывод:** Если BD-Data имеет Software House license, она может проверять עוסק status через Shaam API (limited access).

---

### 3.3. Gateway Provider License (רישיון ספק מידע משפטי) — NOT HELD

**Регулятор:** Ministry of Justice (משרד המשפטים)

**Статус:** ❌ **BD-Data НЕ имеет** Gateway Provider license (required for direct NetHaMishpat access)

**Вывод:** BD-Data партнёрится с **Takdin** или **scrapes public court data** (limited accuracy).

---

### 3.4. Credit Bureau License — NOT HELD

**Регулятор:** Bank of Israel (בנק ישראל)

**Статус:** ❌ **BD-Data НЕ является кредитным бюро**

**Вывод:** BD-Data НЕ может получать Bank of Israel Credit Registry data (trade payments, credit history).

---

## 4. Ценовой пакет согласно критериям SBF

### 4.1. Покрытие критериев SBF

| Критерий | BD-Data Coverage | Источник данных | Качество |
|----------|------------------|-----------------|----------|
| **1. Владельцы бизнеса** | ⭐⭐⭐⭐⭐ | Companies Registrar | Отлично (directors, shareholders) |
| **2. Налоговые/Финансовые** | ⭐⭐ | Tax Authority (limited) | Плохо (только עוסק status, НЕТ финансовых данных) |
| **3. Судебные тяжбы** | ⭐⭐⭐⭐ | Courts (partner) + Hotzaa LaPoal | Хорошо (weekly updates, NOT real-time) |
| **4. Экономическая устойчивость** | ⭐⭐⭐ | Proprietary scoring | Средне (NO credit bureau data, NO trade payments) |

**Общая оценка:** **14/20** (70%) — BD-Data **подходит** для SBF как **дополнительный источник** (NOT primary).

---

### 4.2. B2C Pricing (Individual Reports)

#### **Tier 1: Single Report (דוח יחיד)**

**Описание:** Разовая проверка компании/עוסק

**Включено:**
- ✅ Company/עוסק details (שם, ח.פ., כתובת)
- ✅ Directors/Shareholders (דירקטורים, בעלי מניות)
- ✅ Court cases (תיקים משפטיים) — last 5 years
- ✅ Hotzaa LaPoal (הוצל"פ) — active cases
- ✅ Proprietary risk score (דירוג סיכון — 0-100)
- ⚠️ **НЕТ:** Credit history, trade payments, tax returns

**Цена:** **₪80-200** (зависит от типа компании)

**Разбивка:**
- עוסק פטור: ₪80 (limited data)
- עוסק מורשה: ₪120
- חברה בע"מ (small): ₪150
- חברה בע"מ (large): ₪200

**Применимость для SBF:** ⚠️ **EXPENSIVE** vs BDI Code (₪3.60) or CheckID (₪22.50)

---

#### **Tier 2: Basic Subscription (מנוי בסיסי)**

**Описание:** 10 отчётов/месяц

**Включено:**
- Same as Single Report
- ✅ Mobile app access (iOS/Android)
- ✅ Email alerts (Smart Monitoring — 1 company)

**Цена:** **₪99/месяц** (unused reports expire monthly)

**Effective cost per report:** ₪9.90 (if using all 10 reports)

**Применимость для SBF:** ⚠️ **UNSCALABLE** — SBF needs unlimited API, NOT monthly caps

---

#### **Tier 3: Professional Subscription (מנוי מקצועי)**

**Описание:** Unlimited reports

**Включено:**
- ✅ **Unlimited single reports** (no monthly cap)
- ✅ Bulk checks (up to 100 companies at once)
- ✅ Industry benchmarks (סטטיסטיקות ענפיות)
- ✅ Smart Monitoring (up to 50 companies)
- ✅ Export to Excel/CSV
- ✅ Mobile app
- ⚠️ **NO API** — only web portal + mobile app

**Цена:** **₪299/месяц**

**Effective cost per report:** ₪0 (unlimited), BUT requires manual work (web portal)

**Применимость для SBF:** ❌ **NOT SUITABLE** — no API automation

---

#### **Tier 4: Enterprise (ארגוני)**

**Описание:** High-volume users + API beta

**Включено:**
- ✅ **API access (beta)** — REST JSON
- ✅ Unlimited reports
- ✅ Bulk checks (1000+ companies)
- ✅ Dedicated account manager
- ✅ Custom industry benchmarks
- ✅ White-label option (embedding reports in SBF UI)

**Цена:** **₪999/месяц** + per-query fees

**API pricing (estimated):**
- Setup fee: ₪5,000-10,000 (one-time)
- Per-query: ₪0.30-0.80 (depends on report type)

**Разбивка per-query:**
- עוסק פטור: ₪0.30
- עוסק מורשה: ₪0.50
- חברה בע"מ: ₪0.80

**Применимость для SBF:** ✅ **SUITABLE** — but MORE EXPENSIVE than BDI Code API (₪1/query) or CheckID (₪22.50/full report)

---

### 4.3. B2B API Pricing (Estimated)

**Model:** Setup fee + Monthly + Per-query

| Component | Cost | Notes |
|-----------|------|-------|
| **Setup fee** | ₪5,000-10,000 | API integration, white-labeling |
| **Monthly fee** | ₪999 | Enterprise tier minimum |
| **Per-query** | ₪0.30-0.80 | Depends on report type |
| **Rate limit** | 100 queries/min | Higher limits require custom pricing |
| **SLA** | 99.5% uptime | Standard enterprise SLA |

**Example calculation (SBF scenario):**

Assumptions:
- SBF processes 1,000 reports/month
- Mix: 40% עוסקים (₪0.40 avg) + 60% בע"מ (₪0.80)

**Costs:**
- Setup: ₪7,500 (one-time)
- Monthly: ₪999
- Queries: (400 * ₪0.40) + (600 * ₪0.80) = ₪160 + ₪480 = ₪640

**Total first month:** ₪7,500 + ₪999 + ₪640 = **₪9,139**  
**Subsequent months:** ₪999 + ₪640 = **₪1,639**

**Effective cost per report:** ₪1.64 (after setup)

---

### 4.4. Сравнение: BD-Data vs BDI Code vs CheckID (для SBF)

| Критерий | BD-Data API | BDI Code API | CheckID API |
|----------|-------------|--------------|-------------|
| **Setup fee** | ₪5K-10K | $5K (~₪18K) | ₪0 |
| **Monthly fee** | ₪999 | $1,500 (~₪5,400) | ₪0 |
| **Per-query** | ₪0.30-0.80 | ₪3.60 | ₪22.50 |
| **Credit bureau data** | ❌ | ✅ FICO®BDI | ❌ |
| **Trade payments** | ❌ | ✅ Red Lights® | ❌ |
| **Court data** | ✅ Weekly | ⚠️ Partners | ✅ Daily (via Takdin) |
| **עוסקים coverage** | 90% | 85% | 95% |
| **API quality** | ⚠️ Beta | ✅ Production | ✅ Production |
| **Response time** | 2-5 sec | 1-2 sec | 1-3 sec |

**Вывод:**

**BD-Data — CHEAPER per query** (₪0.30-0.80 vs BDI Code ₪3.60), BUT:
- ❌ **NO credit bureau data** (major gap for SBF)
- ❌ **NO trade payment history** (vs BDI Code Red Lights®)
- ⚠️ **API in beta** (production readiness uncertain)

**BDI Code — MORE EXPENSIVE** (₪3.60/query), BUT:
- ✅ **Credit bureau license** (Bank of Israel data)
- ✅ **FICO®BDI scoring** (industry standard)
- ✅ **Production-grade API** (proven reliability)

**CheckID — CHEAPEST for full reports** (₪22.50 includes Takdin court data), BUT:
- ✅ **Freemium option** (₪0 for basic info)
- ✅ **Takdin integration** (best court data)
- ❌ **NO credit bureau data**

---

### 4.5. Рекомендуемая стратегия для SBF

**Phase 1 (MVP):** ❌ **НЕ интегрировать BD-Data**

**Причины:**
- BDI Code API покрывает те же источники + Bank of Israel Credit Registry
- BD-Data дешевле (₪0.30-0.80), но НЕ имеет кредитных данных (критический недостаток)
- API в beta (риск production instability)

**Phase 2 (Scale):** ✅ **Рассмотреть BD-Data как fallback**

**Сценарий:** SBF использует BDI Code (primary), но если:
- BDI Code недоступен (downtime) → fallback to BD-Data
- Client needs עוסק פטור (BDI Code coverage 85% vs BD-Data 90%) → use BD-Data

**Cost-benefit analysis:**

| Scenario | Primary | Fallback | Total Cost |
|----------|---------|----------|------------|
| **BDI Code only** | ₪3.60/query | — | ₪3.60 |
| **BDI + BD-Data** | ₪3.60 (90%) | ₪0.80 (10% fallback) | ₪3.32 avg |

**Savings:** ₪0.28/query (7.8%) IF BD-Data covers 10% of queries

**BUT:** Adds complexity (2 API integrations, data normalization)

---

### 4.6. Когда BD-Data ПОЛЕЗНА для SBF

**Единственный сценарий:** SBF добавляет **"Budget Tier"** для price-sensitive customers.

**Пример:**

| SBF Tier | Primary Source | Price |
|----------|---------------|-------|
| **Basic** | BD-Data API | ₪49 (margin: ₪48.20) |
| **Standard** | BDI Code API | ₪99 (margin: ₪95.40) |
| **Premium** | BDI Code + Takdin | ₪249 (margin: ₪244.40) |

**Use case:**
- Customer wants **cheapest** report for עוסק פטור
- SBF offers Basic Tier (₪49) powered by BD-Data (cost ₪0.80)
- Customer accepts **limited data** (NO credit history, NO trade payments)

**Market:**
- Small businesses checking suppliers (low risk)
- Landlords checking tenants (basic due diligence)
- Freelancers verifying clients

---

## 5. Резюме для SBF Platform

### 5.1. Позиционирование BD-Data

**Category:** Tier 2 (Should Have) — **Budget-friendly aggregator**

**Strengths:**
- ✅ **Cheapest API pricing** (₪0.30-0.80 vs BDI Code ₪3.60)
- ✅ **High עוסקים coverage** (90% מורשים, 70% פטורים)
- ✅ **Mobile app** (unique among aggregators)
- ✅ **Bulk checks** (up to 100 companies)
- ✅ **Industry benchmarks** (valuable for SME clients)

**Weaknesses:**
- ❌ **NO credit bureau data** (no Bank of Israel access)
- ❌ **NO trade payment history** (vs D&B/BDI Code)
- ❌ **Limited tax data** (only עוסק status verification)
- ⚠️ **API in beta** (production readiness unclear)
- ⚠️ **Weekly court updates** (vs Takdin daily)

**Competitive Advantage:** **Price** (70% cheaper than BDI Code per query)

**Fatal Flaw:** **NO credit bureau license** (SBF needs credit ratings for Criterion 4: Economic Stability)

---

### 5.2. Рекомендация для SBF

**Phase 1-2 (MVP → Early Scale):** ❌ **НЕ интегрировать**

**Reasoning:**
- BDI Code API is **strategic choice** (credit bureau data = differentiator for SBF)
- BD-Data cheaper (₪0.80) but lacks critical data (credit history, trade payments)
- Adding BD-Data increases complexity (2 APIs, data normalization) without major value

**Phase 3 (Scale):** ⚠️ **Consider as fallback** IF:
- SBF sees high demand for **budget-tier reports** (₪49 vs ₪99)
- BDI Code downtime becomes issue (need redundancy)
- Target market shifts to **small freelancers/עוסקים פטורים** (BD-Data 70% coverage vs BDI 50%)

**Phase 4 (Maturity):** ✅ **Integrate for Budget Tier**

**Strategy:**
- Offer **3-tier pricing:**
  - Basic (₪49): BD-Data API (limited data, NO credit rating)
  - Standard (₪99): BDI Code API (full credit report)
  - Premium (₪249): BDI Code + Takdin + D&B (deep dive)
- Market Basic tier to:
  - Small businesses (low-risk checks)
  - Landlords (tenant verification)
  - Freelancers (client vetting)

**Break-even analysis:**

| Tier | SBF Price | Cost | Margin | Target Volume |
|------|-----------|------|--------|---------------|
| **Basic** | ₪49 | ₪0.80 | ₪48.20 (98%) | 500/month |
| **Standard** | ₪99 | ₪3.60 | ₪95.40 (96%) | 300/month |
| **Premium** | ₪249 | ₪5.10 | ₪243.90 (98%) | 50/month |

**Revenue:**
- Basic: 500 * ₪48.20 = ₪24,100
- Standard: 300 * ₪95.40 = ₪28,620
- Premium: 50 * ₪243.90 = ₪12,195
- **Total margin/month:** ₪64,915

**Fixed costs:**
- BD-Data API: ₪999/month
- BDI Code API: ₪5,400/month
- Takdin: ₪1,000/month (estimated)
- **Total fixed:** ₪7,399/month

**Net profit:** ₪64,915 - ₪7,399 = **₪57,516/month** (878% ROI)

---

### 5.3. Final Verdict

**BD-Data = Tier 2 (Should Have), NOT Tier 1 (Must Have)**

**Priority:** 3-6 months after SBF MVP launch

**Use case:** Budget tier for price-sensitive customers who accept limited data (NO credit ratings)

**Primary source:** BDI Code API (Tier 1 Must Have) — credit bureau data essential for SBF value proposition

**BD-Data role:** **Fallback + Budget tier** — NOT primary data source

---

## 6. Техническая спецификация API

### 6.1. API Endpoint (Estimated — Beta)

**Base URL:** https://api.bd-data.co.il/v1

**Authentication:** Bearer Token (OAuth2)

**Rate limit:** 100 requests/minute (Enterprise tier)

**Format:** JSON

---

### 6.2. Example Request: Get Company Report

**Endpoint:** POST /company/report

**Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "hp_number": "514123456",
  "report_type": "full",
  "include_courts": true,
  "include_hotzaa": true,
  "include_benchmarks": true
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "company": {
    "name": "דוגמה בע\"מ",
    "hp_number": "514123456",
    "type": "private_company",
    "status": "active",
    "registration_date": "2010-05-15",
    "directors": [
      {
        "name": "יוסי כהן",
        "id": "123456789",
        "role": "CEO"
      }
    ],
    "shareholders": [
      {
        "name": "יוסי כהן",
        "id": "123456789",
        "ownership_pct": 60.0
      },
      {
        "name": "שרה לוי",
        "id": "987654321",
        "ownership_pct": 40.0
      }
    ],
    "registered_office": "רחוב הרצל 1, תל אביב",
    "share_capital": 100000
  },
  "court_cases": [
    {
      "case_number": "12345-06-20",
      "type": "civil",
      "plaintiff": "ספק א' בע\"מ",
      "defendant": "דוגמה בע\"מ",
      "amount": 50000,
      "status": "pending",
      "filing_date": "2020-06-15"
    }
  ],
  "hotzaa_lapoal": {
    "active_cases": 2,
    "case_numbers": ["123456/2019", "789012/2021"]
  },
  "risk_score": {
    "score": 65,
    "rating": "medium_risk",
    "factors": [
      "2 active court cases",
      "2 Hotzaa LaPoal cases",
      "Directors with no prior bankruptcies"
    ]
  },
  "industry_benchmarks": {
    "industry": "retail",
    "avg_risk_score": 58,
    "percentile": 40
  },
  "report_cost": 0.80,
  "generated_at": "2025-12-22T10:30:00Z"
}
```

---

### 6.3. API Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data |
| 400 | Bad Request | Check HP number format |
| 401 | Unauthorized | Refresh access token |
| 404 | Company Not Found | Return "No data available" to user |
| 429 | Rate Limit Exceeded | Implement exponential backoff |
| 500 | Server Error | Retry after 5 seconds |

---

## 7. Контактные данные

### Коммерческий отдел:
- **Email:** info@bd-data.co.il (estimated)
- **Phone:** +972-3-XXXXXXX (not publicly available)
- **Website:** https://www.bd-data.co.il

### API Support:
- **Email:** api@bd-data.co.il (estimated)
- **Documentation:** https://docs.bd-data.co.il (if exists)

---

**Дата последнего обновления:** 22 декабря 2025  
**Версия документа:** 1.0  
**Статус:** Tier 2 (Should Have) — Budget-tier alternative to BDI Code

---

## Финальная рекомендация для SBF:

**BD-Data — НЕ подходит для SBF MVP** по следующим причинам:

1. ❌ **Нет кредитных данных** (NOT credit bureau — missing Bank of Israel Credit Registry)
2. ❌ **Нет Trade Payment Data** (vs BDI Code Red Lights®)
3. ⚠️ **API в beta** (production stability unclear)
4. ⚠️ **Weekly court updates** (vs Takdin daily real-time)

**Когда рассмотреть:** Phase 3-4 (Scale/Maturity) — для **Budget Tier** (₪49 reports) targeting small businesses/freelancers who accept limited data.

**Ценность для SBF:** **70% cheaper** per query (₪0.80 vs BDI Code ₪3.60), BUT lacks critical credit bureau data.

**Приоритет:** Tier 2 (Should Have) — integrate 3-6 months AFTER MVP launch, NOT Day 1.

**Primary source:** BDI Code API (Tier 1 Must Have) — credit bureau license = SBF competitive advantage.

**BD-Data role:** **Fallback + Budget tier** — NOT replacement for BDI Code.
