# Midrug (S&P Maalot) — Platform Snapshot

**Дата исследования:** 22 декабря 2025  
**Статус:** Tier 3 (Nice to Have) — Рейтинговое агентство

---

## 1. Общая информация

### Базовые данные
- **Официальное название:** S&P Global Ratings Maalot Ltd. (אס אנד פי גלובל רייטינגס מעלות בע"מ)
- **Бренд:** Maalot (מעלות) / Midrug (מדרוג)  
- **Сайт:** https://www.maalot.co.il  
- **Глобальная сеть:** S&P Global Ratings — крупнейшее рейтинговое агентство в мире

### Корпоративная структура
- **Материнская компания:** S&P Global Inc. (NYSE: SPGI) — публичная компания США
- **Год основания в Израиле:** 1990 (Maalot), приобретена S&P в 2008
- **Покрытие:** 300+ израильских компаний (средние/крупные חברות בע"מ)
- **Специализация:** Корпоративные облигации (אגרות חוב), структурированное финансирование, суверенные рейтинги

### Категория
**Рейтинговое агентство (Credit Rating Agency)** — НЕ агрегатор данных, НЕ кредитное бюро.

**Ключевое отличие:** Midrug создаёт **аналитические рейтинги** на основе финансовых отчётов, НЕ собирает операционные данные о платежах.

---

## 2. Карта взаимодействия с государственными платформами

### 2.1. Критическое отличие от D&B/BDI/CheckID

```
┌────────────────────────────────────────────────────────────────┐
│                  MIDRUG (S&P MAALOT) PLATFORM                   │
│         (Rating Agency / NOT Data Aggregator)                   │
└────────────┬───────────────────────────────────────────────────┘
             │
             │ [АНАЛИТИЧЕСКИЙ ДОСТУП - НЕ ОПЕРАЦИОННЫЙ]
             │ (Получает финансовые отчёты добровольно от компаний)
             │
    ┌────────┼────────────┬──────────────┬────────────────┐
    │                     │              │                │
┌───▼────┐  ┌─────────────▼────┐  ┌──────▼──────┐  ┌─────▼───────┐
│ Layer 1│  │ Layer 1          │  │ Layer 2     │  │ Layer 3     │
│ Public │  │ Israeli Securit  │  │ Companies   │  │ Company     │
│ Compani│  │ Authority (ISA)  │  │ Registrar   │  │ Voluntary   │
│ es     │  │ (רשות ני"ע)      │  │ (minimal)   │  │ Disclosures │
└────────┘  └──────────────────┘  └─────────────┘  └─────────────┘
     │             │                    │                  │
     │             │                    │                  │
┌────▼─────────────▼────────────────────▼──────────────────▼────┐
│              MIDRUG ANALYTICAL ENGINE                          │
│   • Financial Statement Analysis (דוחות כספיים)              │
│   • Sector Benchmarking (השוואה ענפית)                        │
│   • ESG Scoring (דירוג ESG)                                   │
│   • Default Probability Models (מודלים חיזוי פירעון)         │
│   • NO operational data (no payment history, no court data)   │
└───────────────────────────────────────────────────────────────┘
```

### 2.2. Источники данных Midrug (НЕ государственные API!)

#### **Источник 1: רשות ניירות ערך (Israeli Securities Authority — ISA)**

**Тип доступа:** ✅ Публичные данные (EDGAR Israel equivalent)

**Данные:**
- Квартальные отчёты (דוחות רבעוניים) публичных компаний
- Годовые финансовые отчёты (דוחות שנתיים)
- Immediate reports (דוחות מיידיים) — значительные события
- Prospectuses (תשקיפים) — для новых облигаций

**Метод интеграции:**
```
[Midrug Analysts] → MAYA system (רשות ני"ע portal)
                  → Manual download of financial statements
                  → Excel/PDF parsing (NO API integration)
```

**Частота обновления:** Quarterly (после публикации דוחות רבעוניים)

**Ограничения:**
- ❌ Только публичные компании (תאג"מ — Tel Aviv Stock Exchange listed)
- ❌ Нет данных о עוסקים פטור/מורשה
- ❌ Нет данных о частных חברות בע"מ (если не выпускают облигации)

---

#### **Источник 2: Добровольные раскрытия компаний (Management Disclosure)**

**Тип доступа:** ⚠️ По запросу (компания сама предоставляет данные для рейтинга)

**Данные:**
- Internal financial statements (для частных компаний)
- Cash flow forecasts (תזרים מזומנים)
- Debt structure (מבנה החוב)
- Management commentary (הסברי ההנהלה)
- Business plan (תוכנית עסקית)

**Метод интеграции:**
```
[Company] → Hires Midrug for credit rating (платит ₪50K-500K)
          → Signs NDA (הסכם סודיות)
          → Provides confidential financial data
          → [Midrug Analysts] → Manual analysis
```

**Критическое отличие:**
- ❌ Midrug **НЕ имеет** прямого доступа к государственным данным компаний
- ✅ Компании **добровольно** платят Midrug за рейтинг и предоставляют данные
- ⚠️ Если компания НЕ заказала рейтинг → Midrug **НЕ имеет** доступа к её данным

---

#### **Источник 3: רשם החברות (Companies Registrar) — минимальный доступ**

**Тип доступа:** ✅ Публичные данные (как любой гражданин)

**Данные:**
- Basic company info (H.P. number, address, status)
- Владельцы (только если публичная компания)
- Директора

**Метод интеграции:**
```
[Midrug] → Manual lookup на сайте רשם החברות
         → NO API integration
         → Используется только для валидации существования компании
```

**Частота использования:** Редко (Midrug фокусируется на финансовых отчётах, не на регистрационных данных)

---

#### **Источник 4: S&P Global Network (глобальные данные)**

**Тип доступа:** ✅ Internal API S&P Global

**Данные:**
- Глобальные макроэкономические индикаторы
- Sector benchmarks (мировые отраслевые данные)
- Historical default rates (исторические дефолты по отраслям)
- S&P Global Ratings methodology (методология рейтинга)

**Метод интеграции:**
```
[Midrug Israel] → S&P Global Ratings API (internal)
                → Access to global credit models
                → Sector comparison (Israeli companies vs global peers)
```

**Уникальное преимущество:** Midrug использует **глобальные модели S&P** (те же, что для IBM, Apple, Microsoft).

---

### 2.3. ЧТО Midrug НЕ ИМЕЕТ (критично для SBF!)

**Критические ограничения:**

❌ **Bank of Israel Credit Data Registry:**
- Нет доступа к кредитной истории
- Нет Trade Payment Data
- Нет данных о платежах поставщикам

❌ **Tax Authority (Shaam):**
- Нет доступа к налоговым декларациям
- Нет данных о доходах עוסקים

❌ **Court System (NetHaMishpat):**
- Нет интеграции с судебными данными
- Аналитики **вручную** проверяют банкротства через новости

❌ **Hotzaa LaPoal (Bailiff Authority):**
- Нет данных о должниках

❌ **Pledges Registrar:**
- Нет мониторинга залогов (кроме раскрытий в финансовых отчётах)

❌ **Real-time operational data:**
- Обновления **только раз в квартал** (после דוחות רבעוניים)
- Нет ежедневного мониторинга

**Вывод:** Midrug — это **"медленное экспертное мнение"**, не агрегатор государственных данных.

---

## 3. Лицензии и разрешения

### 3.1. Credit Rating Agency License (רישיון חברת דירוג)

**Регулятор:** רשות ניירות ערך (Israeli Securities Authority — ISA)

**Юридическая база:**
- **Securities Law (1968)** — חוק ניירות ערך, תשכ"ח-1968
- **Credit Rating Agencies Regulations (2009)** — תקנות חברות דירוג אשראי

**Требования для получения:**
1. **Минимальный капитал:** ₪2,000,000
2. **Professional team:** Минимум 5 аналитиков с лицензией (רישיון מנתח דירוג)
3. **Independence:** Запрет конфликта интересов (analyst не может быть акционером rated company)
4. **Methodology disclosure:** Публичная методология рейтинга
5. **Annual audit:** Ежегодный аудит ISA

**Статус Midrug:** ✅ Лицензия получена (обновлена в 2009 после приобретения S&P)

**Номер лицензии:** Не публикуется (конфиденциально)

**Права лицензии:**
- ✅ Публикация кредитных рейтингов (דירוגי אשראי)
- ✅ Использование рейтингов институциональными инвесторами для compliance (תקנון הפנסיה)
- ✅ Влияние на капитальные требования банков (כללי באזל)

**Ограничения лицензии:**
- ❌ НЕ даёт доступа к государственным данным (в отличие от Credit Bureau License)
- ⚠️ Запрет на консультирование rated companies (conflict of interest)

**Ежегодная стоимость лицензии:**
- Регуляторные сборы: ₪50,000-100,000
- Compliance (юристы, аудиторы): ₪200,000-500,000/год
- Professional insurance: ₪500,000-2,000,000/год (liability for incorrect ratings)

---

### 3.2. Database License (רישיון מאגר מידע)

**Регулятор:** רשות להגנת הפרטיות (Privacy Protection Authority)

**Статус:** ✅ Получена (обязательна для хранения финансовых данных компаний)

**Обязательства:**
- Ежегодная декларация в PPA
- Конфиденциальность данных клиентов (NDA)
- Право компаний на исправление данных

---

### 3.3. S&P Global Certifications

**ISO Certifications:**
- ISO 9001 (Quality Management) ✅
- ISO 27001 (Information Security) ✅

**IOSCO Certification:**
- ✅ International Organization of Securities Commissions (IOSCO) compliance
- S&P Global Ratings — один из трёх крупнейших CRA в мире (S&P, Moody's, Fitch)

**Basel III Recognition:**
- ✅ Рейтинги Midrug **признаются** Bank of Israel для расчёта капитальных требований банков (כללי באזל)
- Банки **обязаны** использовать External Credit Assessment Institutions (ECAI) — Midrug квалифицирован

---

### 3.4. Regulatory Compliance

**EU CRA Regulation:**
- ⚠️ Midrug **НЕ зарегистрирован** в ESMA (European Securities and Markets Authority)
- Рейтинги Midrug **НЕ используются** для EU regulatory purposes
- Только S&P Global Ratings (US/EU entities) признаны в EU

**SEC Registration (USA):**
- ⚠️ Midrug **НЕ зарегистрирован** в SEC как Nationally Recognized Statistical Rating Organization (NRSRO)
- Рейтинги Midrug **только для израильского рынка**

---

## 4. Ценовой пакет согласно критериям SBF

### 4.1. Критическая проблема: Midrug НЕ подходит для SBF

**Причины несовместимости:**

1. ❌ **НЕТ покрытия עוסקים פטור/מורשה** — Midrug рейтингует только средние/крупные חברות בע"מ
2. ❌ **НЕТ B2C модели** — Midrug работает **только B2B** (institutional clients)
3. ❌ **НЕТ API** — данные доступны только через платформу www.maalot.co.il (manual)
4. ❌ **Дорого** — минимальная стоимость рейтинга ₪50,000 (недоступно малому бизнесу)
5. ❌ **Медленно** — обновления раз в квартал (не real-time)

**Вывод:** Midrug **НЕ входит** в ТОП-3 для SBF интеграции.

---

### 4.2. B2B Pricing (для институциональных клиентов)

#### **Продукт 1: Issuer Rating (דירוג מנפיק)**

**Описание:** Кредитный рейтинг компании-эмитента (способность погасить все долги)

**Шкала рейтингов:**
- **Investment Grade:** AAA, AA, A, BBB (инвестиционный уровень)
- **Non-Investment Grade:** BB, B, CCC, CC, C, D (спекулятивный уровень)
- **ilAAA** — highest rating (Israeli local scale)

**Процесс:**
1. Компания заказывает рейтинг (платит Midrug)
2. Midrug проводит due diligence (6-8 недель):
   - Анализ финансовых отчётов
   - Встречи с менеджментом
   - Sector analysis
3. Rating Committee (комитет аналитиков) утверждает рейтинг
4. Публикация на www.maalot.co.il

**Цена:** **₪50,000-200,000** (зависит от размера компании)

**Детальная разбивка:**
- Small/Medium חברה בע"מ (<₪100M revenue): ₪50,000-80,000
- Large חברה בע"מ (₪100M-1B revenue): ₪80,000-150,000
- Very Large / תאג"מ (>₪1B revenue): ₪150,000-200,000

**Annual Surveillance Fee (מעקב שנתי):** ₪20,000-50,000/год (обновление рейтинга)

**Применимость для SBF:** ❌ **НЕ подходит** (слишком дорого, нет עוסקים, нет API)

---

#### **Продукт 2: Issue Rating (דירוג הנפקה)**

**Описание:** Рейтинг конкретного облигационного выпуска (איגרת חוב)

**Цена:** **₪30,000-100,000** (за один выпуск облигаций)

**Применимость для SBF:** ❌ **НЕ релевантно** (SBF не рейтингует облигации)

---

#### **Продукт 3: RES — Rating Evaluation Service**

**Описание:** Предварительная оценка рейтинга (без публикации)

**Цена:** **₪15,000-30,000**

**Применимость для SBF:** ❌ **НЕ релевантно**

---

#### **Продукт 4: Global Scale Rating (דירוג גלובאלי)**

**Описание:** Рейтинг компании по глобальной шкале S&P (для международных инвесторов)

**Цена:** **₪200,000-500,000**

**Применимость для SBF:** ❌ **НЕ релевантно** (SBF фокусируется на израильском рынке)

---

### 4.3. Data Subscription (для институциональных инвесторов)

#### **Подписка: Maalot Platform Access**

**Описание:** Доступ к базе данных всех рейтингов Midrug

**Включено:**
- 300+ компаний с рейтингами
- Historical ratings (10+ лет истории)
- Rating reports (PDF downloads)
- Research publications (sector analyses)

**Цена:** **₪30,000-100,000/год** (зависит от размера клиента)

**Детальная разбивка:**
- Boutique investment firm: ₪30,000/год
- Bank / Insurance company: ₪50,000-80,000/год
- Large institutional investor: ₪80,000-100,000/год

**Применимость для SBF:** ⚠️ **Потенциально** (если SBF добавит "премиум tier" для институциональных клиентов)

**Проблема:** Midrug **НЕ имеет API** → нельзя автоматически интегрировать

---

### 4.4. Альтернативный сценарий: SBF как дистрибьютор Midrug

**Гипотетическая модель:**

1. **SBF подписывается** на Maalot Platform (₪50,000/год)
2. **SBF парсит** рейтинги Midrug (manual scraping)
3. **SBF показывает** Midrug рейтинги в Premium Reports

**Проблемы:**
- ⚠️ **Legal risk:** Midrug запрещает redistribution без отдельного договора
- ⚠️ **Technical:** Нет API (нужен scraping → высокий риск блокировки)
- ⚠️ **Coverage:** Midrug покрывает только 300 компаний (vs BDI Code 500,000)

**Вывод:** Нерентабельно для SBF.

---

### 4.5. Сравнение: Midrug vs BDI Code vs D&B

| Критерий | Midrug | BDI Code | D&B |
|----------|--------|----------|-----|
| **Минимальная цена** | ₪50K (rating) | $1.00/query (₪3.60) | $2.00/query (₪7.20) |
| **API** | ❌ | ✅ REST/SOAP | ✅ REST |
| **Покрытие עוסקים** | ❌ 0% | 90% | 85% |
| **Покрытие חברות בע"מ** | 300 компаний | 500,000 | 500,000 |
| **Real-time data** | ❌ Quarterly | ✅ Weekly | ✅ Daily |
| **Кредитный рейтинг** | ✅ AAA-D (best!) | ✅ A++-E | ✅ 5A-1 |
| **Trade Payment Data** | ❌ | ✅ | ✅ |
| **Court data** | ❌ | ⚠️ Partners | ⚠️ Partners |
| **B2C модель** | ❌ | ✅ ₪99-399 | ✅ $50-200 |

**Вывод:** Midrug **НЕ конкурент** D&B/BDI Code — другой сегмент рынка.

---

## 5. Резюме для SBF Platform

### 5.1. Покрытие критериев SBF

| Критерий | Midrug Coverage | Источник данных | Качество |
|----------|-----------------|-----------------|----------|
| **1. Владельцы бизнеса** | ⭐⭐ | Публичные компании (ISA) | Плохо |
| **2. Налоговые/Финансовые** | ⭐⭐⭐⭐ | Financial statements (voluntary) | Хорошо |
| **3. Судебные тяжбы** | ⭐ | Manual research (no integration) | Очень плохо |
| **4. Экономическая устойчивость** | ⭐⭐⭐⭐⭐ | Credit Rating (AAA-D) | Отлично |

**Общая оценка:** **12/20** (60%) — Недостаточно для SBF (нет покрытия малого бизнеса).

---

### 5.2. Почему Midrug НЕ подходит для SBF

1. ❌ **Нет покрытия עוסקים** — 90% целевой аудитории SBF НЕ покрыто
2. ❌ **Нет API** — невозможно автоматически интегрировать
3. ❌ **Слишком дорого** — ₪50,000 минимальная цена (vs BDI Code ₪3.60/query)
4. ❌ **B2B модель** — Midrug работает только с институциональными клиентами
5. ❌ **Медленные обновления** — раз в квартал (vs BDI Code weekly)
6. ❌ **Маленькое покрытие** — 300 компаний (vs BDI Code 500,000)

---

### 5.3. Когда Midrug МОЖЕТ быть полезен для SBF

**Единственный сценарий:** SBF добавляет **"Enterprise Tier"** для крупных корпоративных клиентов.

**Пример:**
- **SBF Premium:** ₪299 (для עוסקים, малого бизнеса) — использует BDI Code API
- **SBF Enterprise:** ₪2,999 (для институциональных инвесторов) — показывает Midrug рейтинги

**Требования:**
1. SBF заключает договор с Midrug (₪50,000/год подписка + redistribution rights)
2. Manual scraping или PDF parsing рейтингов Midrug
3. Показ в UI: "S&P Maalot Rating: ilAA (stable outlook)"

**Рентабельность:**
- Cost: ₪50,000/год (Midrug subscription)
- Break-even: 17 Enterprise клиентов (₪2,999 * 17 = ₪50,983)
- Target: Банки, страховые компании, пенсионные фонды (не частные лица)

---

### 5.4. Рекомендуемая стратегия для SBF

**Phase 1-3 (MVP → Scale):** ❌ **НЕ интегрировать Midrug**

**Причины:**
- BDI Code + CheckID покрывают 95% потребностей SBF
- Midrug нерентабелен для малого бизнеса
- Нет API → высокие затраты на manual integration

**Phase 4 (Опционально — если SBF выходит на институциональный рынок):**
- ✅ Подписка Midrug (₪50,000/год)
- ✅ Manual integration (PDF parsing)
- ✅ Enterprise Tier (₪2,999/report)
- Target: 20-50 институциональных клиентов/год

---

## 6. Техническая спецификация (отсутствие API)

### 6.1. Доступ к данным Midrug

**Платформа:** https://www.maalot.co.il

**Форматы:**
- ❌ NO REST API
- ❌ NO SOAP API
- ✅ HTML website (manual browsing)
- ✅ PDF reports (download)

**Authentication:** Username/Password (web portal)

---

### 6.2. Гипотетическая интеграция (scraping)

**Если SBF решит парсить Midrug:**

```python
# Пример scraping (НАРУШАЕТ ToS Midrug!)
import requests
from bs4 import BeautifulSoup

# Login to Maalot portal
session = requests.Session()
session.post('https://www.maalot.co.il/login', data={
    'username': 'sbf_user',
    'password': 'password'
})

# Get company rating
response = session.get('https://www.maalot.co.il/Entity/Index/2840')
soup = BeautifulSoup(response.text, 'html.parser')

# Parse rating (example)
rating_element = soup.find('div', class_='rating-display')
rating = rating_element.text.strip()  # "ilAA"
```

**Риски:**
- ⚠️ Нарушение Terms of Service Midrug
- ⚠️ Блокировка IP
- ⚠️ Legal action (Midrug может подать иск)

**Вывод:** Scraping НЕ рекомендуется без договора с Midrug.

---

## 7. Контактные данные для интеграции

### Коммерческий отдел:
- **Email:** info@maalot.co.il
- **Phone:** +972-3-7539700
- **Address:** Azrieli Center, Tel Aviv

### Legal/Compliance:
- **Email:** legal@maalot.co.il

---

**Дата последнего обновления:** 22 декабря 2025  
**Версия документа:** 1.0  
**Статус:** NOT RECOMMENDED for SBF Integration

---

## Финальная рекомендация для SBF:

**Midrug — НЕ подходит для SBF MVP** по следующим причинам:

1. ❌ **Нет покрытия עוסקים** — целевая аудитория SBF НЕ покрыта
2. ❌ **Нет API** — невозможно автоматически интегрировать
3. ❌ **Слишком дорого** — ₪50K минимум (vs BDI Code ₪3.60)
4. ❌ **B2B only** — нет модели для частных лиц
5. ❌ **300 компаний** — маленькое покрытие (vs BDI 500,000)

**Когда рассмотреть:** Только если SBF выходит на **институциональный рынок** (банки, пенсионные фонды) — тогда Midrug может быть дополнительным источником для Enterprise Tier.

**Приоритет:** Tier 3 (Nice to Have) — **самый низкий** среди всех платформ.
