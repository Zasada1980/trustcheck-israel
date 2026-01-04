# עוסק מורשה (VAT Registered Dealers) - Источники данных

## Проблема
**Критично:** Companies Registry (data.gov.il) содержит ТОЛЬКО חברות бע"מ (HP начинаются на 5).
Для עוסק מורשה нужны HP номера **НЕ начинающиеся на 5** (индивидуальные предприниматели).

## Правило классификации
```
HP начинается на 5 → חברה בע"מ (Ltd company)
HP НЕ начинается на 5 → עוסק מורשה или עוסק פטור (individual business)
```

---

## Источники данных для עוסק מורשה

### 1. **Tax Authority API** (Официальный источник) ⭐
**URL:** `https://taxevat.mof.gov.il/`
**Требования:** 
- Регистрация как "Beit Tochna" (Software House)
- OAuth2 authentication
- Процесс занимает 2-4 недели

**Данные:**
- ✅ Полный список עוסק מורשה с HP номерами
- ✅ VAT numbers (מספר עוסק)
- ✅ Статус регистрации
- ✅ Даты регистрации/отмены

**Приоритет:** P0 - Официальный источник

---

### 2. **Scraping: Tax Authority Public Search**
**URL:** `https://taxevat.mof.gov.il/tevat/`
**Метод:** Puppeteer/Playwright scraping

**Процесс:**
1. Сгенерировать список HP номеров НЕ на 5 (префиксы: 0-4, 6-9)
2. Для каждого HP: проверить существование через форму поиска
3. Извлечь: статус VAT, название, адрес

**Сложность:**
- ⚠️ CAPTCHA protection
- ⚠️ Rate limiting
- ⚠️ ~100M потенциальных комбинаций HP

**Приоритет:** P2 - Резервный метод

---

### 3. **Data.gov.il: Business Licenses Dataset**
**URL:** `https://data.gov.il/dataset/business_licenses`
**Формат:** CSV/JSON

**Содержит:**
- Лицензии на бизнес (ristuyim)
- HP номера владельцев
- Типы бизнеса

**Ограничения:**
- ❌ НЕ все עוסק מורשה имеют лицензии
- ❌ Может быть устаревшим

**Приоритет:** P3 - Дополнительный источник

---

### 4. **OpenData: Ministry of Economy**
**URL:** `https://economy.gov.il/opendata`
**Datasets:** Grants, subsidies, government contracts

**Может содержать:**
- HP номера получателей грантов
- Контракты с индивидуальными предпринимателями

**Приоритет:** P3 - Дополнительный источник

---

### 5. **Court Rulings (Nevo/Takdin)** 🔄
**Источники:**
- `https://www.nevo.co.il/` - Legal database
- `https://www.takdin.co.il/` - Court decisions

**Метод:** Scraping упоминаний HP номеров в судебных делах

**Ограничения:**
- ⚠️ Нет прямого API
- ⚠️ Требуется NLP для извлечения
- ⚠️ Частичные данные

**Приоритет:** P4 - Низкий приоритет

---

## Рекомендуемая стратегия

### Немедленно (сегодня):
```bash
# 1. Скачать Business Licenses dataset
curl "https://data.gov.il/api/3/action/datastore_search?resource_id=..." -o business_licenses.csv

# 2. Извлечь HP номера НЕ на 5
awk -F',' '$1 !~ /^5/ {print $1}' business_licenses.csv > hp_not_5.txt
```

### Краткосрочно (1-2 недели):
1. **Подать заявку на Tax Authority API:**
   - Заполнить форму: https://govextra.gov.il/taxes/innovation/
   - Указать цель: "Business reliability verification platform"
   - Ожидать OAuth2 credentials

2. **Создать scraper для taxevat.mof.gov.il:**
   ```typescript
   // scripts/scrape_vat_dealers.ts
   async function checkVATStatus(hpNumber: string) {
     // Puppeteer logic для проверки статуса
     const page = await browser.newPage();
     await page.goto('https://taxevat.mof.gov.il/tevat/');
     await page.type('#hp_input', hpNumber);
     // Extract result
   }
   ```

### Долгосрочно (1-2 месяца):
1. **Интеграция Tax Authority API** (после получения доступа)
2. **Автоматическая синхронизация** (webhook или polling)

---

## Временное решение (MVP)

**Для Phase 1 (текущий MVP):**
Используем **inference на основе company_type**:

```typescript
// lib/vat_dealer.ts - CURRENT LOGIC (CORRECT)
const firstDigit = hpStr.charAt(0);

if (firstDigit === '5') {
  dealerType = 'חברה בע"מ';
  isVATRegistered = true;
} else {
  // HP doesn't start with 5 → individual business
  const isPartnership = companyType.includes('שותפות');
  
  if (isPartnership) {
    dealerType = 'עוסק מורשה';
    isVATRegistered = true;
  } else {
    dealerType = 'עוסק פטור';
    isVATRegistered = false; // Default: assume exempt
  }
}
```

**Проблема:** В текущей базе companies_registry **НЕТ** HP не на 5, поэтому:
- ✅ 716,714 записей = все חברה בע"מ (100%)
- ❌ 0 записей עוסק מורשה/פטור

---

## Action Items

### P0 - Critical (Today):
- [ ] Исследовать data.gov.il для датасетов с HP не на 5
- [ ] Скачать Business Licenses dataset
- [ ] Создать таблицу `osek_morsheh` в PostgreSQL

### P1 - High Priority (This Week):
- [ ] Подать заявку на Tax Authority API access
- [ ] Разработать scraper prototype для taxevat.mof.gov.il
- [ ] Создать генератор валидных HP номеров (checksum algorithm)

### P2 - Medium Priority (2-4 Weeks):
- [ ] Собрать HP номера из OpenData (economy.gov.il)
- [ ] Интегрировать scraping в ночной batch job
- [ ] Добавить фильтр в unified_data.ts для עוסק מורשה

---

## PostgreSQL Schema для עוסק מורשה

```sql
CREATE TABLE osek_morsheh (
  hp_number BIGINT PRIMARY KEY,
  business_name TEXT,
  dealer_type VARCHAR(50) DEFAULT 'עוסק מורשה',
  is_vat_registered BOOLEAN DEFAULT true,
  vat_number VARCHAR(20), -- מספר עוסק בעסקאות (VAT ID)
  registration_date DATE,
  tax_status VARCHAR(20) DEFAULT 'active', -- active/cancelled/suspended
  business_type TEXT, -- סוג עסק
  city TEXT,
  address TEXT,
  phone VARCHAR(20),
  
  -- Metadata
  data_source VARCHAR(50), -- 'tax_authority', 'scraping', 'business_licenses'
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT osek_hp_not_5 CHECK (hp_number::TEXT NOT LIKE '5%')
);

CREATE INDEX idx_osek_tax_status ON osek_morsheh(tax_status);
CREATE INDEX idx_osek_city ON osek_morsheh(city);
CREATE INDEX idx_osek_data_source ON osek_morsheh(data_source);
```

---

## Next Steps

1. **Запустить исследование data.gov.il:**
   ```bash
   pwsh scripts/research_data_gov_osek.ps1
   ```

2. **Создать прототип scraper:**
   ```bash
   npx tsx scripts/scrape_tax_authority.ts --test-hp=123456789
   ```

3. **Когда получим данные:** Обогатить unified_data.ts для поддержки обоих источников

---

**Last Updated:** 25.12.2025
**Status:** Research & Planning Phase
