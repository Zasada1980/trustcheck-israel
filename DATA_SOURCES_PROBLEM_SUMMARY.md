# Проблема: Почему ИИ возвращает неверный анализ

**Компания:** א.א.ג ארט עיצוב ושירות בע״מ (HP 515972651)  
**Реальность:** Закрыта, много судебных дел, долги  
**TrustCheck показывает:** 4/5 ⭐⭐⭐⭐ "Нет судебных дел"

---

## Корневая причина (Root Cause)

### ❌ База данных ПУСТАЯ

```sql
-- Производственный сервер (46.224.147.252)
SELECT COUNT(*) FROM companies_registry;        -- 716,820 ✅
SELECT COUNT(*) FROM company_owners;             -- 0 ❌
SELECT COUNT(*) FROM legal_cases;                -- 0 ❌
SELECT COUNT(*) FROM execution_proceedings;      -- 0 ❌
```

**Проблема:** Только `companies_registry` загружена, остальные 3 таблицы пусты.

### ❌ Скраперы НЕ РАБОТАЮТ

**lib/courts_scraper.ts** (судебные дела):
```typescript
function parseCourtSearchResults(html: string): LegalCase[] {
  // TODO: Implement proper HTML parsing
  return [];  // ❌ ВСЕГДА ПУСТО
}
```

**lib/execution_office.ts** (исполнительные производства):
```typescript
const RESOURCE_ID = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'; // ❌ PLACEHOLDER
// API возвращает 404

function parseHotzaaResults(html: string): ExecutionProceeding[] {
  // TODO: Implement proper HTML parsing
  return [];  // ❌ ВСЕГДА ПУСТО
}
```

---

## Что получает ИИ (неверные данные)

```json
{
  "name": "א.א.ג ארט עיצוב ושירות  בע~מ",
  "status": "פעילה",  // ✅ Из PostgreSQL
  
  "owners": [],  // ❌ ПУСТО (таблица не загружена)
  
  "legalIssues": {
    "activeCases": 0,         // ❌ НЕВЕРНО (скрапер сломан)
    "totalCases": 0,          // ❌ НЕВЕРНО
    "executionProceedings": 0, // ❌ НЕВЕРНО
    "totalDebt": 0            // ❌ НЕВЕРНО
  }
}
```

**Результат:** ИИ видит "פעילה + 0 дел + 0 долгов" → генерирует 4/5 ⭐⭐⭐⭐

---

## Что сломано

| Источник данных | Статус | Проблема |
|----------------|--------|----------|
| **Рשם החברות** (Реестр компаний) | ✅ Работает | PostgreSQL, 716K компаний |
| **Net HaMishpat** (Суды) | ❌ Сломан | `parseCourtSearchResults()` возвращает `[]` |
| **Hotzaa LaPoal** (Долги) | ❌ Сломан | API `resource_id = 'XXXXXXXX'` (placeholder) |
| **ICA Portal** (Владельцы) | ❌ Не реализован | Скрапер не существует |
| **Tax Authority** (Налоги) | ⚠️ Реализован, но не используется | Не вызывается в unified_data.ts |
| **Bank of Israel** (Банковские ограничения) | ⚠️ Реализован, но не используется | Не вызывается в unified_data.ts |

**Итог:** 1 из 6 источников работает (17%)

---

## План исправления

### Фаза 1: База данных (2 часа) - КРИТИЧНО

```bash
# SSH на производство
ssh root@46.224.147.252

# Создать недостающие таблицы
docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data \
  < /root/trustcheck/scripts/db/init.sql

# Проверить
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "\dt"
# Должны быть: company_owners, legal_cases, execution_proceedings
```

### Фаза 2: API исполнительных производств (4 часа)

1. Найти реальный `resource_id` на data.gov.il для набора "הוצאה לפועל"
2. Заменить в `lib/execution_office.ts` line 112
3. Тестировать и задеплоить

### Фаза 3: Парсер судебных дел (8 часов)

```typescript
// lib/courts_scraper.ts
import * as cheerio from 'cheerio';

function parseCourtSearchResults(html: string): LegalCase[] {
  const $ = cheerio.load(html);
  const cases: LegalCase[] = [];
  
  $('table.search-results tbody tr').each((i, row) => {
    const cells = $(row).find('td');
    cases.push({
      caseNumber: $(cells[0]).text().trim(),
      caseType: $(cells[1]).text().trim(),
      court: $(cells[2]).text().trim(),
      filingDate: $(cells[3]).text().trim(),
      status: $(cells[4]).text().trim(),
      plaintiff: $(cells[5]).text().trim(),
      defendant: $(cells[6]).text().trim(),
    });
  });
  
  return cases;
}
```

### Фаза 4: Скрапер владельцев (8 часов)

Создать `lib/ica_scraper.ts` для получения данных с ica.justice.gov.il

### Фазы 5-6: Налоги/банки + улучшение промптов ИИ (4 часа)

---

## Стоимость исправления

| Фаза | Время | Стоимость (₪200/час) |
|------|-------|----------------------|
| 1. База данных | 2 ч | ₪400 |
| 2. API долгов | 4 ч | ₪800 |
| 3. Парсер судов | 8 ч | ₪1,600 |
| 4. Скрапер владельцев | 8 ч | ₪1,600 |
| 5-6. Доработки | 4 ч | ₪800 |
| **ИТОГО** | **26 ч** | **₪5,200** |

**Срок окупаемости:** 2 дня (при 1000 поисках/месяц, снижение рисков на ₪80,000/мес)

---

## Текущие риски

### Юридические
- ❌ Платформа показывает "нет судебных дел" когда они есть
- ❌ Родители платят авансом на основе 4/5 оценки
- ❌ Теряют деньги → Иски к TrustCheck

### Репутационные
- ❌ Конкуренты могут найти этот пробел
- ❌ "TrustCheck проверяет только реестр, а не суды"
- ❌ Потеря доверия пользователей

### Финансовые
- ❌ Если 1% из 1000 поисков/месяц → споры = ₪80,000/мес потенциальных потерь

---

## Временное решение (до исправления)

**Добавить DISCLAIMER на сайт:**

```hebrew
⚠️ מידע חלקי - כרגע אנו בודקים רק את רשם החברות הרשמי. 
בדיקת תיקים משפטיים, הוצאות לפועל ובעלי מניות תתווסף בקרוב.
המלצה: בצעו בדיקות נוספות לפני תשלום מראש.
```

```english
⚠️ Partial Data - Currently checking official registry only.
Legal cases, execution proceedings, and ownership verification coming soon.
Recommendation: Conduct additional checks before prepayment.
```

**И/ИЛИ:**

Временно снизить все оценки ≤3/5 пока все источники не работают.

---

## Контакты для исправления

**Файлы для изменения:**
- `lib/courts_scraper.ts` (lines 140-165) - реализовать парсер
- `lib/execution_office.ts` (line 112) - заменить resource_id
- `lib/execution_office.ts` (lines 195-200) - реализовать парсер
- `scripts/db/init.sql` - задеплоить на production
- Создать `lib/ica_scraper.ts` - новый файл

**Производственный сервер:**
- IP: 46.224.147.252
- SSH: `ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252`
- Контейнер: `trustcheck-postgres`, `trustcheck-app`

---

**Подготовил:** GitHub Copilot Agent  
**Дата:** 23.12.2025  
**Полный отчёт:** `DATA_SOURCES_AUDIT_REPORT.md` (20 разделов, детали реализации)
