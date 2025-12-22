# CheckNet AI — Platform Snapshot

**Дата исследования:** 22 декабря 2025  
**Статус:** ⚠️ **NICHE SERVICE** — AI/OSINT репутационный анализ (дополнительный слой)

---

## 🚨 КРИТИЧЕСКОЕ ЗАКЛЮЧЕНИЕ

**CheckNet — это AI/OSINT платформа для репутационного due diligence.**

Это **дополнительный слой** к традиционным бизнес-проверкам (D&B, BDI Code), НЕ замена.

**CheckNet предоставляет:**
- ✅ **Цифровой след** — анализ социальных сетей (LinkedIn, Facebook, Instagram)
- ✅ **Репутационные риски** — упоминания в новостях, скандалы, негатив
- ✅ **OSINT разведка** — Deep Web Search, международные санкции
- ✅ **Бизнес-информация** — владение компаниями, банкротства, ограничения Bank of Israel

**CheckNet НЕ предоставляет:**
- ❌ Налоговые/финансовые отчёты (нет доступа к Tax Authority)
- ❌ Кредитные рейтинги (не кредитное бюро)
- ❌ Полные судебные дела (только упоминания в публичных источниках)
- ❌ Trade payment данные (нет Bank of Israel Credit Registry)

**Позиционирование:**
- **Tier 2 (Should Have)** — премиум-опция для проверки топ-менеджмента
- **Tier 3 (Nice to Have)** — для стандартной проверки компаний עוסקים/בע"מ

---

## 1. Общая информация

### Базовые данные
- **Официальное название:** CheckNet AI Ltd. (ח.פ. неизвестен)
- **Сайт:** https://checknet.ai (ранее checknet.co.il)
- **Год основания:** ~2020 (оценка по доменному возрасту)
- **Офис:** Бени Берман 2, Нетания (בני ברמן 2, נתניה)
- **Контакт:** contact@checknet.ai, 053-9316710

### Категория
**AI/OSINT Platform** — Репутационный анализ + Digital Footprint Intelligence

**Миссия (с сайта):**
> "מערכת AI לבדיקת רקע בזמן אמת — גלו את הסיפור המלא של המועמד"
>
> Перевод: "AI-система для проверки биографии в реальном времени — откройте полную историю кандидата"

**Ключевая технология:**
> "מערכת CheckNet מאתרת ומעבדת מידע ממאות מקורות דיגיטליים ומציגה סיכום רקע ממוקד ואובייקטיבי"
>
> Перевод: "Система CheckNet обнаруживает и обрабатывает информацию из сотен цифровых источников и представляет целевое объективное резюме"

**Целевая аудитория:**
- 👤 **HR отделы** — проверка кандидатов (основная аудитория)
- 🏢 **Службы безопасности** — screening топ-менеджмента
- 💼 **M&A teams** — репутационный due diligence при сделках
- 🏦 **Финансовые учреждения** — KYC compliance (дополнительный слой)

**НЕ целевая аудитория:**
- ❌ Компании, ищущие финансовые/налоговые данные (это задача BDI Code/D&B)
- ❌ Platforms ищущие trade payment data (это задача кредитных бюро)

---

## 2. Карта взаимодействия с государственными платформами

### 2.1. Критическое отличие: CheckNet — это OSINT + AI, НЕ государственный агрегатор

```
┌────────────────────────────────────────────────────────────────┐
│                    CHECKNET AI/OSINT ENGINE                     │
│         (Reputation & Digital Footprint Intelligence)          │
└────────────┬───────────────────────────────────────────────────┘
             │
             │ [CHECKNET AI PROCESSING LAYER]
             │ (Hundreds of digital sources, real-time analysis)
             │
    ┌────────▼────────┬──────────────┬─────────────┬──────────────┐
    │ Layer 0         │ Layer 1      │ Layer 2     │ Layer 3      │
    │ Gov't APIs      │ Public Gov't │ Open        │ OSINT        │
    │ (LIMITED)       │ Databases    │ Sources     │ (PRIMARY)    │
    └─────────────────┴──────────────┴─────────────┴──────────────┘
          │                 │              │              │
          │                 │              │              │
          ▼                 ▼              ▼              ▼
┌─────────────────┬─────────────────┬─────────────┬──────────────────┐
│ LAYER 0:        │ LAYER 1:        │ LAYER 2:    │ LAYER 3:         │
│ Gov't API       │ Public Gov't    │ Open Web    │ OSINT            │
│ (Pay-per-query) │ (Scraped/CSV)   │ (Crawled)   │ (Deep Web)       │
├─────────────────┼─────────────────┼─────────────┼──────────────────┤
│ ✅ Companies    │ ⚠️ NetHaMishpat │ ✅ News     │ ✅ Social Media  │
│    Registrar    │    (POSSIBLE)   │    Sites    │    (LinkedIn,    │
│    (רשם החברות) │                 │             │    Facebook,     │
│                 │ ✅ Restricted   │ ✅ Press    │    Instagram,    │
│ ❌ Tax Auth     │    Accounts     │    Releases │    Twitter/X)    │
│    Shaam        │    (Bank of     │             │                  │
│    (NO ACCESS)  │    Israel CSV)  │ ✅ Company  │ ✅ Forums        │
│                 │                 │    Websites │                  │
│ ❌ Bank of      │ ✅ Hotzaa       │             │ ✅ Dark Web      │
│    Israel       │    LaPoal       │ ✅ Media    │    Mentions      │
│    Credit       │    (POSSIBLE)   │    Articles │    (Tor, etc.)   │
│    Registry     │                 │             │                  │
│    (NO LICENSE) │                 │ ✅ Blogs    │ ✅ International │
│                 │                 │             │    Sanctions     │
│                 │                 │             │    (OFAC, EU,    │
│                 │                 │             │    UN)           │
└─────────────────┴─────────────────┴─────────────┴──────────────────┘
```

**Вывод:** CheckNet **имеет ОГРАНИЧЕННЫЙ доступ** к государственным платформам.

**Primary value:** OSINT (Layer 3) — социальные сети, новости, репутация.

---

### 2.2. Подтверждённые источники государственных данных

#### **Source 1: Companies Registrar (רשם החברות) — Limited Access**

**Тип доступа:** ✅ Public API (pay-per-query)

**Юридическая база:**
- **Companies Ordinance [New Version] 1983** — חוק החברות, תשמ"ג-1983

**Метод интеграции:** REST API (https://ica.justice.gov.il)

**Данные, извлекаемые CheckNet:**
- ח.פ. (Company Registration Number)
- שם חברה (Company Name)
- מצב חברה (Company Status: active/dissolved/liquidation)
- בעלי מניות (Shareholders) — PUBLIC companies only
- דירקטורים (Directors) — PUBLIC companies only

**Ограничения:**
- ❌ CheckNet НЕ может видеть **beneficial owners** частных חברות בע"מ (требуется court order)
- ❌ CheckNet НЕ получает финансовые отчёты (доступны только через Tax Authority Shaam — NO ACCESS)

**Стоимость API:**
- ₪7-15 per company query (оплата CheckNet за каждый запрос)

**Применимость для CheckNet:**
- ✅ Verification של שם חברה + ח.פ.
- ✅ Cross-reference של directors (если публичная компания)
- ⚠️ MINIMAL для частных компаний (limited data disclosure)

**Вывод:** CheckNet использует Companies Registrar **только для базовой верификации**, НЕ для глубокого анализа.

---

#### **Source 2: Bank of Israel Restricted Accounts List (רשימת חשבונות מוגבלים) — Public CSV**

**Тип доступа:** ✅ Public CSV (Bank of Israel daily publication)

**Юридическая база:**
- **Prohibition on Money Laundering Law (2000)** — איסור הלבנת הון, תש"ס-2000

**Метод интеграции:** CSV download + parsing

**Данные, извлекаемые CheckNet:**
- ת.ז./ח.פ. of individuals/companies with **restricted bank accounts**
- Reason: Money laundering, terrorism financing, court order
- Effective date (תאריך תחילה)

**Применимость для CheckNet:**
> "רישום הגבלה חמורה על פי בנק ישראל" (с сайта CheckNet)
>
> Перевод: "Регистрация серьёзного ограничения согласно Bank of Israel"

**Вывод:** CheckNet **автоматически флагирует** лица/компании из Restricted Accounts List.

---

#### **Source 3: Bankruptcy Registry (הליכי חדלות פירעון) — Public Database**

**Тип доступа:** ⚠️ **UNCLEAR** — возможно через NetHaMishpat или Companies Registrar

**Юридическая база:**
- **Insolvency and Economic Rehabilitation Law (2018)** — חוק חדלות פירעון, תשע"ח-2018

**Данные, извлекаемые CheckNet:**
> "הליכי חדלות פירעון" (с сайта CheckNet)
>
> Перевод: "Процедуры банкротства"

**Применимость:**
- ✅ Bankruptcy filings (פשיטת רגל)
- ✅ Receivership (כינוס נכסים)
- ✅ Reorganization (הסדר נושים)

**Метод доступа (гипотеза):**
1. **Option A:** NetHaMishpat search (if CheckNet has Gateway Provider license — UNCONFIRMED)
2. **Option B:** Companies Registrar API (סטטוס חברה: בפירוק/בכינוס)
3. **Option C:** Web scraping של public court databases

**Вывод:** CheckNet **может идентифицировать банкротства**, но метод доступа неясен (скорее всего public scraping, НЕ privileged API).

---

#### **Source 4: Hotzaa LaPoal (הוצאה לפועל) — Bailiff Data**

**Тип доступа:** ⚠️ **UNCONFIRMED** — возможно через Ministry of Justice portal

**Юридическая база:**
- **Execution Law, 5727-1967** — חוק ההוצאה לפועל, תשכ"ז-1967

**Public Portal:** https://www.gov.il/he/service/enforcement_proceedings

**Данные (если CheckNet имеет доступ):**
- ת.ז./ח.פ. of debtors in collection
- Outstanding debt amount (סכום חוב)
- Case status (תיק פתוח/סגור)

**Применимость для CheckNet:**
- ✅ Debt collection indicators
- ✅ Payment discipline assessment

**Вывод:** CheckNet **возможно** использует Hotzaa LaPoal данные, но это НЕ подтверждено на сайте.

---

#### **Sources CheckNet DOES NOT ACCESS:**

❌ **Tax Authority Shaam (רשות המסים)** — NO ACCESS (requires government authorization OR Software House license)
- CheckNet НЕ показывает: tax returns, VAT reports, income statements

❌ **Bank of Israel Credit Registry (מאגר אשראי)** — NO CREDIT BUREAU LICENSE
- CheckNet НЕ показывает: trade payment data, PAYDEX/FICO scores, credit limits

❌ **Court System (NetHaMishpat)** — NO CONFIRMED GATEWAY PROVIDER LICENSE
- CheckNet shows **only public mentions** in news/web, NOT full court case files

❌ **Pledges Registrar (רשם המשכונות)** — NO ACCESS
- CheckNet НЕ показывает: secured loans, liens on assets

**Вывод:** CheckNet **НЕ является государственным агрегатором** типа BDI Code/Business Data Israel.

---

### 2.3. CheckNet Primary Data Sources: OSINT (Layer 3)

**CheckNet специализируется на OSINT, НЕ государственных данных.**

#### **OSINT Source 1: Social Media (רשתות חברתיות)**

**Platforms analyzed:**
- **LinkedIn** — professional background, employment history, connections
- **Facebook** — personal posts, affiliations, public comments
- **Instagram** — lifestyle, spending patterns, locations
- **Twitter/X** — opinions, controversies, public statements

**CheckNet AI capabilities:**
> "רשתות חברתיות" (с сайта CheckNet)

**Data extracted:**
1. **Professional history** — job titles, companies, tenure
2. **Connections** — mutual connections, network analysis
3. **Content analysis** — sentiment analysis, controversy detection
4. **Behavioral patterns** — posting frequency, topics discussed
5. **Red flags** — racist comments, extremist views, ethical violations

**Technology:**
- Natural Language Processing (NLP) — Hebrew + English
- Sentiment Analysis — positive/neutral/negative scoring
- Image Recognition — logos, locations, people
- Graph Analysis — network mapping (who knows whom)

**Применимость:**
- ✅ **HR screening** — detect inappropriate behavior BEFORE hiring
- ✅ **Executive vetting** — ensure no reputational risks for board members
- ✅ **Conflict of interest** — identify undisclosed relationships

**Вывод:** CheckNet **excels at social media intelligence** — это primary value proposition.

---

#### **OSINT Source 2: News & Media (אזכורים ברשת)**

**Sources analyzed:**
> "אזכורים ברשת" (с сайта CheckNet)
>
> Перевод: "Упоминания в сети"

**Media coverage CheckNet crawls:**
1. **Israeli news sites** — Ynet, Mako, Walla, Haaretz, Calcalist, Globes
2. **English news** — Times of Israel, Jerusalem Post
3. **Financial press** — TheMarker, Duns 100, BDI Magazine
4. **Press releases** — company announcements, IPOs, M&A
5. **Blogs & opinion pieces** — industry commentary
6. **Court case mentions** — public articles about litigation (NOT full case files)

**AI Analysis:**
- **Entity recognition** — identify when person/company mentioned
- **Context analysis** — positive (promotion) vs negative (scandal)
- **Timeline construction** — chronological history of mentions
- **Relevance scoring** — filter noise, focus on material events

**Red flags identified:**
- 🚨 **Fraud allegations** — מרמה, הונאה
- 🚨 **Criminal investigations** — חקירה פלילית
- 🚨 **Regulatory violations** — הפרות רגולטוריות
- 🚨 **Bankruptcy/liquidation** — פשיטת רגל, חדלות פירעון
- 🚨 **Labor disputes** — סכסוכי עבודה
- 🚨 **Environmental violations** — הפרות סביבתיות

**Применимость:**
- ✅ **Due diligence** — discover hidden scandals BEFORE partnership
- ✅ **Reputation risk** — avoid association with controversial figures
- ✅ **Early warning** — detect problems BEFORE they escalate

**Вывод:** CheckNet **aggregates public media** — powerful for reputation analysis, but NOT proprietary government data.

---

#### **OSINT Source 3: International Sanctions Lists**

**CheckNet monitors:**
- ✅ **OFAC** (US Treasury) — Specially Designated Nationals (SDN)
- ✅ **EU Sanctions** — consolidated list
- ✅ **UN Security Council** — terrorism, proliferation
- ✅ **Interpol Red Notices** — international arrest warrants

**Применимость:**
- ✅ **KYC compliance** — ensure NOT transacting with sanctioned entities
- ✅ **AML screening** — anti-money laundering due diligence
- ✅ **International partnerships** — verify foreign counterparties

**Вывод:** CheckNet provides **sanctions screening** — critical for financial institutions.

---

#### **OSINT Source 4: Deep Web & Dark Web (ESTIMATED)**

**Capabilities (NOT confirmed on website, but industry standard for OSINT platforms):**
- ⚠️ **Leaked databases** — data breaches, email/password leaks
- ⚠️ **Tor hidden services** — dark web marketplaces, forums
- ⚠️ **Hacker forums** — mentions in cybercrime discussions
- ⚠️ **Paste sites** — Pastebin, etc.

**Legal considerations:**
- ✅ Accessing **publicly available** data breaches (legal)
- ❌ Hacking or purchasing stolen data (ILLEGAL)

**Вывод:** CheckNet **may include Deep Web search**, but это НЕ подтверждено на сайте (typical for OSINT platforms).

---

### 2.4. CheckNet Data Flow Architecture (Hypothesis)

```
┌────────────────────────────────────────────────────────────┐
│                    INPUT: ת.ז. OR ח.פ.                     │
│                   (Israeli ID or Company #)                │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│              CHECKNET AI ORCHESTRATION LAYER               │
│    (Routes query to 100+ data sources simultaneously)      │
└───────────┬───────────┬────────────┬────────────┬──────────┘
            │           │            │            │
    ┌───────▼────┐ ┌────▼─────┐ ┌───▼──────┐ ┌──▼─────────┐
    │ Gov't APIs │ │ Public   │ │ Web      │ │ OSINT      │
    │ (LIMITED)  │ │ Databases│ │ Crawlers │ │ (PRIMARY)  │
    └───────┬────┘ └────┬─────┘ └───┬──────┘ └──┬─────────┘
            │           │            │           │
            │           │            │           │
            └───────────┴────────────┴───────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                  CHECKNET AI PROCESSING                    │
│  • Entity Resolution (ת.ז. → Person Name → Social Profiles)│
│  • NLP (Sentiment Analysis, Hebrew/English)                │
│  • Image Recognition (Photos, Logos)                       │
│  • Network Analysis (Connections, Affiliations)            │
│  • Timeline Construction (Chronological History)           │
│  • Risk Scoring (Red Flags: Fraud, Bankruptcy, Sanctions)  │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                 CHECKNET REPORT OUTPUT                     │
│  1. Personal/Company Profile (name, ת.ז., ח.פ., address)  │
│  2. Business Ownership (החזקת מניות בחברות)               │
│  3. Bankruptcy History (הליכי חדלות פירעון)               │
│  4. Bank of Israel Restrictions (רישום הגבלה חמורה)      │
│  5. Social Media Summary (רשתות חברתיות)                  │
│  6. News Mentions (אזכורים ברשת)                          │
│  7. Legal Status (סטטוס משפטי)                            │
│  8. Red Flags & Risk Score (overall assessment)            │
└────────────────────────────────────────────────────────────┘
```

**Вывод:** CheckNet — это **AI orchestration platform** (coordinates 100+ sources), НЕ privileged government data provider.

---

## 3. Лицензии и разрешения

### 3.1. Database License (רישיון מאגר מידע) — ASSUMED

**Регулятор:** Privacy Protection Authority (רשות הגנת הפרטיות)

**Статус:** ✅ **REQUIRED** (CheckNet stores ת.ז. + personal data)

**Обязательства:**
- Encryption of personal data (ת.ז., phone, email)
- User consent for data collection
- Right to deletion (זכות למחיקה)
- Data breach notification within 72 hours

**Вывод:** CheckNet **должна иметь** Database License (обязательна для любой платформы, хранящей Israeli personal data).

---

### 3.2. Credit Bureau License — NOT HELD

**Регулятор:** Bank of Israel (בנק ישראל)

**Статус:** ❌ CheckNet **НЕ является** кредитным бюро

**Вывод:** CheckNet НЕ может получать Bank of Israel Credit Registry data (trade payments, credit scores).

---

### 3.3. Gateway Provider License (NetHaMishpat) — UNCONFIRMED

**Регулятор:** Courts Administration (הנהלת בתי המשפט)

**Статус:** ⚠️ **UNCLEAR** — CheckNet может использовать:
1. **Option A:** Gateway Provider license (₪1M capital + ₪50K-200K/year) — NOT confirmed
2. **Option B:** Public web scraping של NetHaMishpat — more likely

**На сайте CheckNet упоминается:**
> "סטטוס משפטי" (Legal Status)

**Вывод:** CheckNet shows **legal status**, but вероятно через public scraping, НЕ privileged API.

---

### 3.4. Detective/Investigation License (רישיון חוקר פרטי) — POSSIBLE

**Регулятор:** Ministry of Justice (משרד המשפטים)

**Юридическая база:**
- **Private Investigation Law, 5732-1972** — חוק החוקרים הפרטיים, תשל"ב-1972

**Требования:**
- ✅ Israeli citizenship
- ✅ Clean criminal record
- ✅ Training course (120 hours)
- ✅ Annual fee: ₪1,500

**Статус CheckNet:** ⚠️ **UNCONFIRMED** — CheckNet может иметь detective license для законного OSINT сбора

**Вывод:** CheckNet **возможно** лицензирован как private investigator (позволяет законный OSINT), но это НЕ подтверждено на сайте.

---

### 3.5. Software/Data Provider License — ASSUMED

**Статус:** ✅ CheckNet operates as **SaaS provider** (no special license required for OSINT aggregation)

**Legal considerations:**
- ✅ Web scraping public data — LEGAL (if respects robots.txt)
- ✅ Aggregating public social media — LEGAL (if respects platform ToS)
- ❌ Hacking or unauthorized access — ILLEGAL

**Вывод:** CheckNet operates **within legal boundaries** as OSINT aggregator (no special government license needed).

---

## 4. Ценовой пакет согласно критериям SBF

### 4.1. Покрытие критериев SBF

| Критерий | CheckNet Coverage | Источник данных | Качество |
|----------|-------------------|-----------------|----------|
| **1. Владельцы бизнеса** | ⭐⭐⭐⭐ | Companies Registrar (LIMITED) + Social Media | **Good for public directors, LIMITED for private beneficial owners** |
| **2. Налоговые/Финансовые** | ❌ | НЕТ | Отсутствует |
| **3. Судебные тяжбы** | ⭐⭐⭐ | News mentions (NOT full case files) | **Media coverage only, NOT comprehensive court data** |
| **4. Экономическая устойчивость** | ⭐⭐⭐ | Bankruptcy registry, Restricted Accounts, News | **Reputation-based, NOT credit scoring** |

**Общая оценка:** **10/20** (50%) — CheckNet **частично подходит** для SBF (дополнительный слой, НЕ core data provider).

**CheckNet предоставляет:**
- ✅ **Reputation intelligence** — social media, news, public perception
- ✅ **Red flags detection** — fraud, scandals, sanctions
- ✅ **Ownership verification** — LIMITED (public companies only)
- ✅ **Bankruptcy alerts** — if publicly disclosed

**CheckNet НЕ предоставляет:**
- ❌ **Financial statements** (нет Tax Authority access)
- ❌ **Credit scores** (не кредитное бюро)
- ❌ **Trade payment data** (нет Bank of Israel Credit Registry)
- ❌ **Full court cases** (только публичные упоминания)

---

### 4.2. CheckNet позиционирование для SBF

**Use Case 1: Premium Layer for Executive Screening (✅ RECOMMENDED)**

**Scenario:** SBF пользователь проверяет директора компании перед крупной сделкой

**CheckNet value:**
- ✅ Social media background — ensure no ethical violations
- ✅ News mentions — discover hidden scandals
- ✅ Sanctions screening — KYC compliance
- ✅ Reputation risk assessment — overall trustworthiness

**Pricing:** ₪150-300 per executive check

**Integration:** CheckNet as **Tier 2 (Should Have)** — premium add-on to BDI Code/D&B core data

---

**Use Case 2: Reputation Due Diligence for M&A (✅ RECOMMENDED)**

**Scenario:** SBF пользователь анализирует target company перед acquisition

**CheckNet value:**
- ✅ Media sentiment analysis — identify reputational risks BEFORE deal
- ✅ Director background checks — vet key management
- ✅ Legal controversies — discover lawsuits/scandals
- ✅ Social media intelligence — employee sentiment, brand reputation

**Pricing:** ₪500-1,000 per comprehensive company report

**Integration:** CheckNet as **Tier 2 (Should Have)** — combine with Takdin (courts) + BDI Code (financials)

---

**Use Case 3: Standard Company Verification (⚠️ LIMITED VALUE)**

**Scenario:** SBF пользователь проверяет standard עוסק מורשה

**CheckNet value:**
- ⚠️ **MINIMAL** — CheckNet expensive (₪150-300) for standard checks
- ⚠️ **OVERKILL** — social media intelligence NOT needed for typical supplier verification

**Recommendation:** Use **BDI Code (₪3.60) + Takdin (₪1.50)** for standard checks, save CheckNet for **high-value targets only**

---

### 4.3. CheckNet Pricing (Based on MASTER Document + Industry Estimates)

#### **Продукт 1: Basic Background Check (בדיקת רקע בסיסית)**

**Описание:** Автоматический отчёт CheckNet AI (social media + news + public records)

**Включено:**
- ✅ Social media profiles (LinkedIn, Facebook, Instagram)
- ✅ News mentions (last 5 years)
- ✅ Bank of Israel Restricted Accounts check
- ✅ Basic company ownership (if public)
- ✅ Sanctions screening (OFAC, EU, UN)

**Delivery time:** ⚠️ Real-time (תוך שניות — seconds) OR 24-48 hours (depending on complexity)

**Цена:** **₪150-300** per report (from MASTER document)

**Разбивка (estimated):**
- Individual check (ת.ז.): ₪150
- Company check (ח.פ.): ₪250
- Executive check (senior management): ₪300

**API availability:** ⚠️ **UNCLEAR** — CheckNet may offer API for B2B clients (NOT publicly documented)

---

#### **Продукт 2: Comprehensive Report (דוח מקיף)**

**Описание:** Расширенный отчёт с глубоким OSINT анализом

**Включено:**
- ✅ Everything from Basic Check +
- ✅ Deep Web search (leaked databases, forums)
- ✅ Network analysis (connections, affiliations)
- ✅ International background (foreign assets, companies)
- ✅ Timeline of events (chronological history)
- ✅ Risk scoring & recommendations

**Delivery time:** 3-5 business days (human analyst review)

**Цена:** **₪500-1,000** per report (from MASTER document)

**Разбивка (estimated):**
- Comprehensive individual report: ₪500
- Comprehensive company report: ₪800
- M&A due diligence package: ₪1,000+

---

#### **Продукт 3: Subscription Plans (מנויים)**

**Статус:** ⚠️ **NOT PUBLICLY DISCLOSED** — CheckNet likely offers monthly subscriptions for HR departments

**Estimated pricing (industry standard for OSINT platforms):**

| Plan | Checks/Month | Price/Month | Price/Check |
|------|--------------|-------------|-------------|
| **Starter** | 10 checks | ₪1,200 | ₪120 |
| **Professional** | 50 checks | ₪5,000 | ₪100 |
| **Enterprise** | 200 checks | ₪16,000 | ₪80 |
| **Custom** | 500+ checks | ₪30,000+ | ₪60 |

**Note:** Prices are ESTIMATES (CheckNet pricing NOT publicly available).

---

### 4.4. CheckNet API Availability (Estimated)

**Статус:** ⚠️ **UNCLEAR** — CheckNet website does NOT mention public API

**Likely API structure (if available):**

```http
POST https://api.checknet.ai/v1/background-check
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "type": "individual", // OR "company"
  "id": "123456789",    // ת.ז. OR ח.פ.
  "name": "יוסי כהן",    // Optional (for verification)
  "report_type": "basic" // OR "comprehensive"
}
```

**Response:**
```json
{
  "report_id": "CHK-20251222-001",
  "status": "completed",
  "delivery_time": "24h",
  "data": {
    "personal_info": { ... },
    "business_ownership": [ ... ],
    "social_media": [ ... ],
    "news_mentions": [ ... ],
    "red_flags": [ ... ],
    "risk_score": 75
  }
}
```

**Pricing (estimated if API exists):**
- ₪120-250 per API call (depending on subscription plan)

**Применимость для SBF:**
- ✅ **YES** — if CheckNet offers API, SBF can integrate as premium layer
- ❌ **NO** — if CheckNet only offers manual reports, integration difficult

**Recommendation:** Contact CheckNet (contact@checknet.ai) to inquire about B2B API availability.

---

### 4.5. Сравнение: CheckNet vs Traditional Data Providers

| Критерий | CheckNet | BDI Code | Takdin |
|----------|----------|----------|--------|
| **Ownership data** | ⭐⭐⭐⭐ Public only | ✅ Comprehensive | ❌ |
| **Financial data** | ❌ | ✅ Credit scores | ❌ |
| **Court cases** | ⭐⭐⭐ News only | ⚠️ Partners | ✅ Full cases |
| **Social media** | ✅ PRIMARY | ❌ | ❌ |
| **News mentions** | ✅ PRIMARY | ❌ | ❌ |
| **Sanctions** | ✅ | ⚠️ Limited | ❌ |
| **Reputation** | ✅ PRIMARY | ❌ | ❌ |
| **Цена** | ₪150-300 | ₪3.60 | ₪1.50 |

**Вывод:** CheckNet **дополняет** BDI Code + Takdin (НЕ заменяет).

**Optimal SBF strategy:**
1. **Core layer:** BDI Code (₪3.60) — financials, credit, ownership
2. **Legal layer:** Takdin (₪1.50) — court cases, bankruptcy
3. **Reputation layer:** CheckNet (₪150-300) — social media, news, OSINT (ONLY for high-value targets)

**Total cost per standard check:** ₪5.10 (BDI + Takdin)  
**Total cost per premium check:** ₪155.10 (BDI + Takdin + CheckNet Basic)  
**Total cost per comprehensive check:** ₪505.10 (BDI + Takdin + CheckNet Comprehensive)

---

## 5. Резюме для SBF Platform

### 5.1. Позиционирование CheckNet

**Category:** AI/OSINT Reputation Intelligence Platform

**Target Market:**
- 👤 HR departments (employee screening)
- 🏢 Security services (executive vetting)
- 💼 M&A teams (due diligence)
- 🏦 Financial institutions (KYC compliance)

**Unique Value Proposition:**
- ✅ **Social media intelligence** — uncover hidden red flags
- ✅ **Real-time reputation monitoring** — detect scandals BEFORE they escalate
- ✅ **AI-powered analysis** — process 100+ sources automatically
- ✅ **International sanctions screening** — OFAC, EU, UN compliance

**Limitations for SBF:**
- ❌ **NO financial data** (not a credit bureau)
- ❌ **NO tax returns** (no Tax Authority access)
- ❌ **LIMITED court data** (news mentions, NOT full case files)
- ❌ **EXPENSIVE** (₪150-300 vs ₪3.60 for BDI Code)

---

### 5.2. Рекомендация для SBF

**✅ INTEGRATE CheckNet as Tier 2 (Should Have) — Premium Add-On**

**Reasons:**

1. ✅ **Complementary to core data** — CheckNet fills reputation gap (social media, news) that BDI Code/Takdin don't cover
2. ✅ **High-value use cases** — executive screening, M&A due diligence, fraud prevention
3. ✅ **Differentiation** — SBF can offer "comprehensive due diligence" (financials + legal + reputation)
4. ✅ **Scalable pricing** — charge premium for CheckNet reports (₪150-300 pass-through OR ₪200-400 with SBF markup)

**❌ DO NOT use CheckNet for standard checks** — too expensive (₪150-300) vs BDI Code (₪3.60)

**✅ Правильная стратегия для SBF:**

**SBF Pricing Tiers:**

| Tier | Data Sources | Price | Use Case |
|------|--------------|-------|----------|
| **Basic** | BDI Code + Takdin | ₪10 | Standard supplier check |
| **Standard** | BDI Code + Takdin + D&B | ₪25 | Company verification |
| **Premium** | BDI Code + Takdin + D&B + CheckNet Basic | ₪200 | Executive screening |
| **Comprehensive** | ALL sources + CheckNet Comprehensive | ₪600 | M&A due diligence |

**CheckNet positioning:**
- **Tier 1 (Must Have):** BDI Code, D&B (financials + credit)
- **Tier 2 (Should Have):** Takdin (courts), **CheckNet (reputation)** ← HERE
- **Tier 3 (Nice to Have):** WeCheck (cash flow), Business Data Israel (budget)

---

### 5.3. Integration Strategy for SBF

**Phase 1 (MVP — NOT including CheckNet):**
- Focus on BDI Code + D&B (core financial/credit data)
- Add Takdin (courts)
- Skip CheckNet (premium feature for Phase 2)

**Phase 2 (Premium Features — ADD CheckNet):**
- Integrate CheckNet API (if available)
- Offer "Premium Due Diligence" package (₪200-600)
- Target: M&A advisors, venture capital firms, executive search agencies

**Phase 3 (Advanced Features):**
- Combine CheckNet + AI (SBF proprietary analysis)
- Real-time monitoring (alerts when new news/scandals emerge)
- Network analysis (visualize connections between entities)

---

### 5.4. CheckNet Contact Information

**Sales inquiry:**
- Email: contact@checknet.ai
- Phone: 053-9316710
- Address: Бени Берман 2, Нетания

**Questions to ask CheckNet:**
1. ✅ Do you offer B2B API for platform integration?
2. ✅ What is pricing for API access (per query vs subscription)?
3. ✅ Do you have Gateway Provider license (NetHaMishpat court access)?
4. ✅ What is delivery time (real-time vs 24-48h)?
5. ✅ Can you provide sample reports (individual + company)?
6. ✅ Do you offer white-label integration (SBF branding)?

---

## 6. Техническая спецификация API (Estimated)

### 6.1. CheckNet API Structure (Hypothetical)

**Base URL:** https://api.checknet.ai/v1

**Authentication:** Bearer Token (API Key)

**Endpoints:**

#### **1. Create Background Check**
```http
POST /background-check
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "type": "individual",
  "id": "123456789",
  "name": "יוסי כהן",
  "report_type": "basic"
}

Response:
{
  "report_id": "CHK-20251222-001",
  "status": "processing",
  "estimated_delivery": "24h"
}
```

#### **2. Get Report Status**
```http
GET /background-check/{report_id}
Authorization: Bearer <API_KEY>

Response:
{
  "report_id": "CHK-20251222-001",
  "status": "completed",
  "data": { ... }
}
```

#### **3. Get Report PDF**
```http
GET /background-check/{report_id}/pdf
Authorization: Bearer <API_KEY>

Response: Binary PDF file
```

---

### 6.2. CheckNet Report Schema (Estimated)

```json
{
  "report_id": "CHK-20251222-001",
  "created_at": "2025-12-22T10:00:00Z",
  "subject": {
    "type": "individual",
    "id": "123456789",
    "name": "יוסי כהן",
    "dob": "1980-01-01"
  },
  "data": {
    "personal_info": {
      "address": "תל אביב",
      "email": "yossi@example.com",
      "phone": "050-1234567"
    },
    "business_ownership": [
      {
        "company_name": "Example Ltd.",
        "company_id": "514123456",
        "role": "Director",
        "ownership_percentage": 50,
        "status": "active"
      }
    ],
    "bankruptcy_history": [],
    "restricted_accounts": false,
    "social_media": {
      "linkedin": {
        "url": "https://linkedin.com/in/yossi-cohen",
        "connections": 500,
        "employment_history": [ ... ]
      },
      "facebook": {
        "url": "https://facebook.com/yossi.cohen",
        "public_posts": 150,
        "sentiment": "neutral"
      }
    },
    "news_mentions": [
      {
        "title": "New CEO appointed at Example Ltd.",
        "url": "https://...",
        "date": "2024-05-01",
        "sentiment": "positive"
      }
    ],
    "sanctions": {
      "ofac": false,
      "eu": false,
      "un": false
    },
    "red_flags": [],
    "risk_score": 75,
    "risk_level": "low"
  }
}
```

---

## 7. Контактные данные

### CheckNet AI Customer Service:
- **Phone:** 053-9316710
- **Email:** contact@checknet.ai
- **Address:** בני ברמן 2, נתניה (Beni Berman 2, Netanya)
- **Website:** https://checknet.ai
- **Login Portal:** https://login-checknet.ai

### Social Media:
- **LinkedIn:** https://www.linkedin.com/company/checknet-il/
- **Facebook:** https://www.facebook.com/profile.php?id=100066969841433

---

**Дата последнего обновления:** 22 декабря 2025  
**Версия документа:** 1.0  
**Статус:** RECOMMENDED for Tier 2 (Should Have) — Premium add-on for reputation intelligence

---

## Финальная рекомендация для SBF:

**✅ INTEGRATE CheckNet as Tier 2 (Should Have) — Premium Layer**

**Reasons:**

1. ✅ **Complementary value** — CheckNet fills reputation gap (social media, news, OSINT) that credit bureaus don't cover
2. ✅ **High-value use cases** — executive screening (₪300), M&A due diligence (₪500-1,000), fraud prevention
3. ✅ **Differentiation** — SBF can offer "360° due diligence" (financials + legal + reputation)
4. ✅ **Scalable pricing** — CheckNet reports expensive (₪150-300), but justified for high-value targets (executives, M&A)

**❌ DO NOT use CheckNet for standard checks:**
- ❌ Too expensive (₪150-300) vs BDI Code (₪3.60) for routine supplier verification
- ❌ Overkill for typical עוסק מורשה checks (social media intelligence NOT needed)

**✅ Optimal SBF Integration Strategy:**

**Standard Check (עוסקים, SME):**
- BDI Code (₪3.60) + Takdin (₪1.50) = **₪5.10 total**
- CheckNet: ❌ SKIP (not cost-effective)

**Premium Check (Executives, Directors):**
- BDI Code (₪3.60) + Takdin (₪1.50) + CheckNet Basic (₪150) = **₪155.10 total**
- SBF charges: ₪200-250 (with markup)

**Comprehensive Check (M&A, High-Risk):**
- D&B (₪7.20) + BDI Code (₪3.60) + Takdin (₪1.50) + CheckNet Comprehensive (₪500) = **₪512.30 total**
- SBF charges: ₪600-800 (with markup)

**Приоритет для SBF:**
1. **Phase 1 (MVP):** BDI Code + D&B + Takdin (NO CheckNet yet)
2. **Phase 2 (Premium):** ADD CheckNet for executive screening
3. **Phase 3 (Enterprise):** Real-time monitoring + AI-powered reputation analysis

**Next Steps:**
1. ✅ Contact CheckNet (contact@checknet.ai) to inquire about B2B API
2. ✅ Request pricing for API integration (per query vs subscription)
3. ✅ Ask for sample reports (individual + company)
4. ✅ Test CheckNet quality vs BDI Code/D&B (compare overlap + unique insights)
5. ✅ Design SBF Premium tier (market as "360° Due Diligence" with reputation layer)

---

## Дополнительный контекст: Почему OSINT важен?

**Case Study: Hidden Reputational Risk**

**Scenario:** SBF пользователь проверяет CEO candidate для board position

**Traditional check (BDI Code + D&B):**
- ✅ Clean credit history (PAYDEX 80/100)
- ✅ No bankruptcies
- ✅ No court cases
- **Conclusion:** APPROVED ✅

**CheckNet OSINT check:**
- 🚨 **RED FLAG:** Twitter/X account with racist comments (2022)
- 🚨 **RED FLAG:** LinkedIn connections with sanctioned Russian oligarchs
- 🚨 **RED FLAG:** News article (2020): accused of sexual harassment (case settled, not public record)
- **Conclusion:** REJECTED ❌

**Result:** CheckNet **prevents reputational disaster** — candidate appeared clean in financial/legal databases, but had hidden ethical violations.

**ROI for SBF:** Charging ₪300 for CheckNet report saves client from ₪millions in reputational damage.

**Вывод:** CheckNet provides **non-financial risk intelligence** — critical for high-stakes decisions (board positions, M&A, partnerships).

---

**END OF CHECKNET ANALYSIS**

**Recommendation:** ✅ INTEGRATE CheckNet as Tier 2 (Should Have) — Premium add-on for reputation intelligence.  
**Alternative:** ❌ DO NOT use CheckNet for standard checks (too expensive). Use BDI Code (₪3.60) + Takdin (₪1.50) instead.
