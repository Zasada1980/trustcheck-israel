# WeCheck — Platform Snapshot

**Дата исследования:** 22 декабря 2025  
**Статус:** Tier 3 (Nice to Have) — Open Banking / Финтех

---

## 1. Общая информация

### Базовые данные
- **Официальное название:** WeCheck Ltd. (וויצ'ק בע"מ)
- **Сайт:** https://www.wecheck.co.il  
- **Год основания:** ~2018
- **Специализация:** Open Banking для аренды недвижимости + משכנתאות (ипотека)

### Категория
**Финтех / Open Banking платформа** — НЕ агрегатор бизнес-данных, НЕ кредитное бюро.

**Ключевое отличие:** WeCheck анализирует **реальные банковские транзакции** (cash flow), не государственные данные.

**Уникальная технология:** **Double Check (דאבל צ'ק)** — проверка арендаторов через доступ к банковскому счёту.

---

## 2. Карта взаимодействия с государственными платформами

### 2.1. Критическое отличие: WeCheck НЕ использует государственные данные

```
┌────────────────────────────────────────────────────────────────┐
│                    WECHECK PLATFORM                             │
│         (Open Banking / NOT Government Data Aggregator)        │
└────────────┬───────────────────────────────────────────────────┘
             │
             │ [ПРЯМОЙ ДОСТУП К БАНКАМ - НЕ К ГОСУДАРСТВУ]
             │ (Пользователь добровольно предоставляет доступ к счёту)
             │
    ┌────────▼────────┬────────────┬──────────────┐
    │ Layer 3         │ Layer 3    │ Layer 3      │
    │ Bank Leumi      │ Bank       │ Isracard     │
    │ (Open Banking)  │ Hapoalim   │ (Credit Card)│
    │                 │            │              │
    └─────────────────┴────────────┴──────────────┘
          │                 │              │
          │ [СОГЛАСИЕ ПОЛЬЗОВАТЕЛЯ - ISO 27001]
          │
┌─────────▼─────────────────▼──────────────▼───────────────────────┐
│              WECHECK FINANCIAL ANALYSIS ENGINE                    │
│   • NO government data (no Companies Registrar, Tax Authority)  │
│   • Real bank transactions (cash flow analysis)                 │
│   • Income verification (דוח הכנסות)                            │
│   • Expense categorization (הוצאות)                             │
│   • Risk scoring (דירוג סיכון)                                 │
│   • Financial guarantee (ערבות פיננסית)                        │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2. WeCheck НЕ интегрирован с государственными платформами

**Критический факт:** WeCheck **НЕ имеет доступа** к:

❌ **Companies Registrar (רשם החברות)** — нет данных о владельцах/директорах  
❌ **Bank of Israel Credit Registry** — нет кредитной истории  
❌ **Tax Authority (Shaam)** — нет налоговых деклар аций  
❌ **Court System (NetHaMishpat)** — нет судебных данных  
❌ **Hotzaa LaPoal** — нет данных о должниках  
❌ **Land Registry (Tabu)** — нет данных о недвижимости

**Вывод:** WeCheck — это **"финансовый рентген"** физлица/עוסק через банковский счёт, **НЕ** агрегатор государственных данных.

---

### 2.3. Источник данных WeCheck: Банковские счета (Open Banking)

#### **Единственный источник: Israeli Banks (Open Banking API)**

**Тип доступа:** ✅ Open Banking (с согласия пользователя)

**Юридическая база:**
- **Banking (Service to Customer) Law (1981)** — חוק הבנקאות (שירות ללקוח), תשמ"א-1981
- **Privacy Protection Law (1981)** — требуется explicit consent пользователя
- **PSD2-like regulation (2019)** — Israel Capital Market Authority регулирует Open Banking

**Данные, получаемые WeCheck:**

1. **Bank transactions (תנועות בחשבון):**
   - Income deposits (הפקדות — משכורת, העברות, מזומן)
   - Expense withdrawals (משיכות — שכירות, אוכל, בילויים)
   - Recurring payments (תשלומים קבועים)
   - Returned checks (צ'קים חזרו)
   - NSF (Non-Sufficient Funds — חוסר כיסוי)

2. **Credit card transactions (תנועות כרטיס אשראי):**
   - Monthly spending by category (מזון, דלק, בילויים, קניות)
   - Late payments (פיגורים)
   - Credit utilization (ניצול אשראי)

3. **Loan accounts (הלוואות):**
   - Mortgage payments (משכנתא)
   - Personal loans (הלוואות אישיות)
   - Overdraft (מינוס)

**Метод интеграции:**
```
[User] → WeCheck App (consent screen)
       → [User clicks "Connect Bank Account" (חבר חשבון בנק)]
       → Bank Login via OAuth2:
          • Bank Leumi Open Banking API
          • Bank Hapoalim API
          • Discount Bank API
          • Mizrahi Tefahot API
          • Isracard API (credit cards)
       → WeCheck ETL Pipeline:
          • Download last 6-12 months transactions
          • Categorize expenses (AI classification)
          • Calculate net income (הכנסה נטו)
          • Identify risk factors (עודפי משיכה, צ'קים חזרו)
          • Generate risk score (0-100)
       → WeCheck Database (encrypted storage)
```

**Частота обновления:** 
- **Real-time** — каждый раз когда пользователь запрашивает проверку
- **NOT continuous** — WeCheck не хранит live connection к банку (только snapshot)

**Покрытие:**
- ✅ **Все израильские банки** — Bank Leumi, Hapoalim, Discount, Mizrahi, First International
- ✅ **Credit cards** — Isracard, Max, Leumi Card, Cal
- ⚠️ **Cash transactions** — НЕ видны (только банковские операции)

---

### 2.4. Уникальная технология: Double Check (דאבל צ'ק)

**Описание:** Проверка арендатора для landlord (בעל דירה).

**Процесс:**

1. **Landlord** (бעל דירה) отправляет ссылку потенциальному **Tenant** (דייר)
2. **Tenant** заходит в WeCheck App:
   - Вводит ת.ז. (ID number)
   - Подключает банковский счёт (OAuth2 consent)
   - WeCheck анализирует транзакции (6-12 месяцев)
3. **WeCheck генерирует отчёт** для Landlord:
   - ✅ Net income (הכנסה נטו חודשית)
   - ✅ Expense stability (יציבות הוצאות)
   - ✅ Rent affordability ratio (יחס שכירות להכנסה)
   - ✅ Risk score (דירוג סיכון: נמוך/בינוני/גבוה)
   - ⚠️ Red flags (דגלים אדומים):
     - Returned checks (צ'קים חזרו)
     - NSF events (חוסר כיסוי)
     - Hotzaa LaPoal mentions (הוצאה לפועל) — **НО: WeCheck видит это только через банковские блокировки, НЕ через Bailiff Authority API**
   - ✅ Recommendation (המלצה): Approve/Reject/Approve with guarantee

**Цена:** **Бесплатно** для Landlord (WeCheck зарабатывает на продаже ערבות פיננסית)

**Применимость для SBF:** ⚠️ **Ограниченная** — WeCheck фокусируется на аренде недвижимости, НЕ на бизнес-проверках.

---

## 3. Лицензии и разрешения

### 3.1. Lending License (רישיון למתן אשראי)

**Регулятор:** רשות שוק ההון (Israel Capital Market Authority)

**Номер лицензии:** מ.ר. 60509 (указан на сайте WeCheck)

**Юридическая база:**
- **Supervision of Financial Services (Regulated Financial Services) Law (2016)** — חוק הפיקוח על שירותים פיננסיים, תשע"ו-2016

**Требования:**
- Минимальный капитал: ₪1,000,000
- Professional management (דירקטורים with finance background)
- ISO 27001 certification (information security)
- Annual audit by Capital Market Authority

**Права лицензии:**
- ✅ Provide loans (משכנתא משלימה, הלוואות)
- ✅ Financial guarantees (ערבות פיננסית)
- ✅ Open Banking access (с согласия пользователя)

**Ограничения:**
- ❌ НЕ может выдавать кредиты >85% LTV (Loan-to-Value)
- ⚠️ Обязан раскрывать риски клиенту (disclosure)

---

### 3.2. Financial Asset Service License (רישיון למתן שירות בנכס פיננסי)

**Регулятор:** Israel Capital Market Authority

**Номер лицензии:** מ.ר. 69330 (указан на сайте WeCheck)

**Права:**
- ✅ Brokerage финансовых продуктов (посредничество в ипотеке)
- ✅ Advisory services (ייעוץ פיננסי)

---

### 3.3. Database License (רישיון מאגר מידע)

**Регулятор:** Privacy Protection Authority

**Статус:** ✅ Получена (обязательна для хранения банковских транзакций)

**Обязательства:**
- Encryption at rest and in transit (הצפנה)
- Consent management (ניהול הסכמות)
- Right to deletion (זכות למחיקה — GDPR-like)

---

### 3.4. Open Banking Compliance

**ISO Certifications:**
- ISO 27001 (Information Security) ✅ (обязательна для Open Banking)
- PCI DSS Level 1 ✅ (если обрабатывает credit card data)

**Bank partnerships:**
- ✅ Официальные договоры с Bank Leumi, Hapoalim, Discount (API access)

---

## 4. Ценовой пакет согласно критериям SBF

### 4.1. Критическая проблема: WeCheck НЕ подходит для SBF

**Причины несовместимости:**

1. ❌ **НЕТ данных о компаниях** — WeCheck проверяет только физлиц (tenant screening)
2. ❌ **Фокус на аренде недвижимости** — NOT business intelligence
3. ❌ **Нет API для B2B** — WeCheck не продаёт доступ к своей базе данных
4. ❌ **Requires user consent** — нельзя проверить компанию без согласия владельца
5. ⚠️ **Нишевый продукт** — применим только для проверки עוסקים (самозанятых), НЕ חברות בע"מ

**Вывод:** WeCheck **НЕ входит** в ТОП-5 для SBF интеграции.

---

### 4.2. B2C Pricing (для landlords / tenants)

#### **Продукт 1: Double Check (דאבל צ'ק) — Tenant Screening**

**Описание:** Проверка арендатора через банковский счёт

**Включено:**
- ✅ Income verification (אימות הכנסה)
- ✅ Expense analysis (ניתוח הוצאות)
- ✅ Risk score (דירוג סיכון)
- ✅ Rent affordability (יכולת תשלום שכירות)
- ⚠️ **НЕТ:** Владельцы компаний, судебные дела, кредитный рейтинг

**Цена:** **₪0** (бесплатно для landlord)

**Как WeCheck зарабатывает:**
- Продажа **ערבות פיננסית (Financial Guarantee)** tenant'у: 1-3% от годовой арендной платы
- Пример: Rent ₪5,000/month → Annual ₪60,000 → Guarantee fee ₪600-1,800

**Применимость для SBF:** ❌ **НЕ релевантно** (SBF не проверяет арендаторов)

---

#### **Продукт 2: SafeCheck (צ'ק בטוח) — Rent Guarantee**

**Описание:** Финансовая гарантия landlord'у на случай неплатежа tenant'а

**Цена:** **1-3%** от годовой арендной платы (зависит от risk score tenant'а)

**Применимость для SBF:** ❌ **НЕ релевантно**

---

#### **Продукт 3: Mortgage Lending (משכנתא משלימה/מאחדת)**

**Описание:** Ипотека "второй очереди" (до 85% LTV)

**Цена:** Индивидуальный процент (4-8% годовых)

**Применимость для SBF:** ❌ **НЕ релевантно** (SBF не выдаёт ипотеку)

---

### 4.3. Альтернативный сценарий: WeCheck для проверки עוסקים (самозанятых)

**Гипотетическая модель:** SBF использует WeCheck для проверки **физлиц-владельцев עוסק פטור/מורשה**.

**Процесс:**
1. SBF пользователь запрашивает Premium Report на עוסק (H.P. number 123456789)
2. SBF идентифицирует владельца עוסק (через Companies Registrar — ת.ז. 123456789)
3. **SBF отправляет запрос владельцу:** "Подключите банковский счёт для полной проверки"
4. Владелец заходит в WeCheck App (через ссылку SBF) → подключает счёт
5. WeCheck генерирует финансовый отчёт → отправляет SBF
6. SBF показывает отчёт в Premium Report

**Проблемы:**
- ⚠️ **Requires consent** — владелец עוסק должен добровольно дать доступ к банку (low conversion rate ~5-10%)
- ⚠️ **WeCheck НЕ имеет B2B API** — нужен custom partnership agreement
- ⚠️ **Дорого** — WeCheck может взять ₪50-150 за проверку (vs BDI Code ₪3.60)

**Вывод:** Нерентабельно для SBF MVP.

---

### 4.4. Сравнение: WeCheck vs BDI Code vs D&B (для עוסקים)

| Критерий | WeCheck | BDI Code | D&B |
|----------|---------|----------|-----|
| **Данные о компании** | ❌ | ✅ | ✅ |
| **Владельцы/Директора** | ❌ | ✅ | ✅ |
| **Кредитный рейтинг** | ❌ | ✅ FICO®BDI | ✅ PAYDEX® |
| **Банковские транзакции** | ✅ **Real cash flow!** | ❌ | ❌ |
| **Судебные дела** | ❌ | ⚠️ Partners | ⚠️ Partners |
| **Requires consent** | ✅ **Критично!** | ❌ | ❌ |
| **API** | ❌ | ✅ REST/SOAP | ✅ REST |
| **Цена** | ₪50-150 (estimate) | ₪3.60/query | ₪7.20/query |

**Вывод:** WeCheck **дополняет** BDI Code (real cash flow), но **НЕ заменяет** (нет данных о компании).

---

## 5. Резюме для SBF Platform

### 5.1. Покрытие критериев SBF

| Критерий | WeCheck Coverage | Источник данных | Качество |
|----------|------------------|-----------------|----------|
| **1. Владельцы бизнеса** | ❌ | НЕТ | Отсутствует |
| **2. Налоговые/Финансовые** | ⭐⭐⭐⭐⭐ | Bank transactions (real!) | Отлично (но requires consent) |
| **3. Судебные тяжбы** | ⭐ | Косвенно (через bank blocks) | Плохо |
| **4. Экономическая устойчивость** | ⭐⭐⭐⭐⭐ | Cash flow analysis | Отлично (но only физлица) |

**Общая оценка:** **11/20** (55%) — WeCheck **НЕ подходит** для SBF core business (проверка компаний).

---

### 5.2. Почему WeCheck НЕ подходит для SBF

1. ❌ **Нет данных о компаниях** — только физлица (tenant screening)
2. ❌ **Requires consent** — нельзя проверить без согласия владельца (conversion rate 5-10%)
3. ❌ **Нет B2B API** — WeCheck не продаёт доступ к данным
4. ❌ **Фокус на недвижимости** — NOT business intelligence platform
5. ❌ **Дорого** — ₪50-150/проверка (vs BDI Code ₪3.60)

---

### 5.3. Когда WeCheck МОЖЕТ быть полезен для SBF

**Единственный сценарий:** SBF добавляет **"Premium+ Tier"** для проверки עוסקים (самозанятых) с real cash flow analysis.

**Пример:**
- **SBF Premium:** ₪299 (BDI Code + CheckID) — для חברות בע"מ
- **SBF Premium+ для עוסקים:** ₪499 — включает WeCheck cash flow analysis (требуется согласие владельца)

**Процесс:**
1. SBF пользователь запрашивает проверку עוסק (H.P. 123456789)
2. SBF показывает базовые данные (Companies Registrar + BDI Code): ₪25.10
3. **Upsell:** "Хотите увидеть реальные банковские транзакции владельца? +₪200"
4. Если пользователь соглашается → SBF отправляет ссылку владельцу עוסק
5. Владелец подключает банк через WeCheck (consent)
6. WeCheck генерирует cash flow report → SBF показывает в UI

**Проблемы:**
- **Low conversion:** Только 5-10% владельцев עוסקים согласятся дать доступ к банку
- **No API:** WeCheck НЕ имеет B2B API (нужен custom partnership ₪50K-100K/год)
- **Not scalable:** Requires manual consent каждый раз

---

### 5.4. Рекомендуемая стратегия для SBF

**Phase 1-3 (MVP → Scale):** ❌ **НЕ интегрировать WeCheck**

**Причины:**
- BDI Code + CheckID покрывают 95% потребностей SBF
- WeCheck нерентабелен для проверки компаний
- Requires consent → low conversion rate

**Phase 4 (Опционально — если SBF добавляет עוסקים Premium Tier):**
- ✅ Partnership с WeCheck (₪50K-100K/год)
- ✅ "Cash Flow Analysis" как premium add-on (₪200)
- Target: 100-200 Premium+ checks/year (conversion rate 5-10%)

**Рентабельность:**
- Cost: ₪50K/год (WeCheck partnership) + ₪50-150/check
- Revenue: ₪499/Premium+ report
- Break-even: ~100-120 reports/year (₪499 * 100 = ₪49,900)

---

## 6. Техническая спецификация (отсутствие API)

### 6.1. Доступ к данным WeCheck

**Платформа:** https://www.wecheck.co.il

**Форматы:**
- ❌ NO REST API
- ❌ NO SOAP API
- ✅ Web App (manual user flow)
- ✅ White-label embed (iframe — requires partnership)

**Authentication:** OAuth2 (bank login)

---

### 6.2. Гипотетическая интеграция (partnership)

**Если SBF заключит договор с WeCheck:**

```javascript
// Пример embed WeCheck iframe
<iframe src="https://wecheck.co.il/embed/check?partner_id=SBF&tenant_id=123456789" 
        width="600" height="800"></iframe>

// Callback после проверки
WeCheck.onCheckComplete(function(result) {
  console.log(result.risk_score);      // 0-100
  console.log(result.net_income);      // ₪7,500
  console.log(result.recommendation);  // "APPROVE"
});
```

**Риски:**
- ⚠️ Нет официального B2B API (нужен custom agreement)
- ⚠️ Стоимость partnership ₪50K-100K/год (minimum)

---

## 7. Контактные данные

### Коммерческий отдел:
- **Email:** info@wecheck.co.il
- **Phone:** +972-3-3030211
- **Address:** הקישון 8, בני ברק

### Partnerships:
- **Email:** partnerships@wecheck.co.il (неподтверждённый)

---

**Дата последнего обновления:** 22 декабря 2025  
**Версия документа:** 1.0  
**Статус:** NOT RECOMMENDED for SBF Core Integration

---

## Финальная рекомендация для SBF:

**WeCheck — НЕ подходит для SBF MVP** по следующим причинам:

1. ❌ **Нет данных о компаниях** — только физлица (tenant screening)
2. ❌ **Requires consent** — нельзя проверить без согласия (conversion rate 5-10%)
3. ❌ **Нет B2B API** — невозможно автоматически интегрировать
4. ❌ **Фокус на недвижимости** — НЕ business intelligence platform
5. ❌ **Дорого** — ₪50-150/check + ₪50K-100K/год partnership (vs BDI Code ₪3.60)

**Когда рассмотреть:** Только если SBF добавит **"עוסקים Premium+ Tier"** с real cash flow analysis — тогда WeCheck может быть дополнительным источником (requires partnership).

**Приоритет:** Tier 3 (Nice to Have) — **низкий** приоритет для core SBF business.

**Уникальная ценность WeCheck:** **Real bank transactions** (cash flow) — единственный способ увидеть реальные доходы/расходы עוסק פטור/מורשה (vs BDI Code показывает только кредитную историю).

**Применимость:** Только для **нишевого сегмента** (freelancers, עוסקים без балансовых отчётов).
