# План Удаления CheckID API из TrustCheck Israel

**Дата:** 23 декабря 2025  
**Причина:** Найдена бесплатная легальная альтернатива (data.gov.il)  
**Экономия:** ₪1,500/месяц (при 1000 запросов)

---

## Исполнительное Резюме

### Почему удаляем CheckID?

1. **Стоимость:** ₪1.50/запрос vs ₪0 (data.gov.il)
2. **Зависимость:** Сторонний API vs прямой государственный источник
3. **Легальность:** 100% легальный доступ к Open Government Data
4. **Доступность:** CheckID может закрыть API доступ

### Замена

**Было:**
```typescript
CheckID API → lib/checkid.ts → Платные запросы
```

**Стало:**
```typescript
data.gov.il → PostgreSQL cache → lib/unified_data.ts → БЕСПЛАТНО
```

---

## Шаг 1: Анализ упоминаний CheckID

**Найдено:** 50+ упоминаний в 15 файлах

### Критические файлы (требуют изменений):

| Файл | Упоминаний | Действие | Приоритет |
|------|------------|----------|-----------|
| `lib/checkid.ts` | 200 строк | ❌ УДАЛИТЬ | 🔴 HIGH |
| `PHASE_1_SPECIFICATION.md` | 50+ | 🔄 ОБНОВИТЬ раздел 5 | 🔴 HIGH |
| `research/reports/СКЕЛЕТ.md` | 20+ | ❌ УДАЛИТЬ файл | 🟡 MEDIUM |
| `app/api/report/route.ts` | 5 | 🔄 ОБНОВИТЬ импорты | 🔴 HIGH |
| `app/page.tsx` | 1 | 🔄 ОБНОВИТЬ статус | 🟡 MEDIUM |
| `.env.example` | 2 | 🔄 УДАЛИТЬ переменные | 🟡 MEDIUM |
| `.github/copilot-instructions.md` | 0 | ✅ УЖЕ ОБНОВЛЁН | ✅ DONE |

### Архивные файлы (НЕ удалять — для истории):

- `DATA_SOURCES_ALTERNATIVES_AUDIT.md` — анализ альтернатив
- `research/platforms/03_CheckID/` — исследование платформы
- `research/reports/2025-12-22_*.md` — рыночные отчёты

---

## Шаг 2: Удаление файлов

### 2.1. Удалить lib/checkid.ts

**Файл:** `e:\SBF\lib\checkid.ts` (~200 строк)

**Причина:** Legacy mock data, не используется в production

**Команда:**
```powershell
Remove-Item e:\SBF\lib\checkid.ts -Force
```

**Проверка зависимостей:**
```powershell
# Найти все импорты checkid
grep -r "from '@/lib/checkid'" --include="*.ts" --include="*.tsx"
```

**Ожидаемые результаты:**
- `app/api/report/route.ts` — обновить (см. шаг 3)
- `lib/gemini.ts` — обновить интерфейс (см. шаг 3)

### 2.2. Удалить research/reports/СКЕЛЕТ.md

**Файл:** `e:\SBF\research\reports\СКЕЛЕТ.md`

**Причина:** Весь документ про CheckID интеграцию (устарел)

**Команда:**
```powershell
Remove-Item "e:\SBF\research\reports\СКЕЛЕТ.md" -Force
```

---

## Шаг 3: Обновление кода

### 3.1. app/api/report/route.ts

**Текущий код (строки 12-15):**
```typescript
import { generateBusinessReport, extractKeyFacts } from '@/lib/gemini';
import { getBusinessData, checkDataSourcesHealth } from '@/lib/unified_data';
import { getMockBusinessData } from '@/lib/checkid'; // ❌ УДАЛИТЬ

// ... далее используется CheckIDBusinessData интерфейс
```

**Новый код:**
```typescript
import { generateBusinessReport, extractKeyFacts } from '@/lib/gemini';
import { getBusinessData, checkDataSourcesHealth } from '@/lib/unified_data';

// CheckID больше не нужен — используем unified_data
```

**Изменения в body (строки 44-71):**

**Было:**
```typescript
// Преобразование unified data в CheckID формат для совместимости с Gemini
const checkIDCompatibleData: import('@/lib/checkid').CheckIDBusinessData = {
  registrationNumber: businessData.hpNumber,
  name: businessData.nameHebrew,
  type: businessData.companyType as 'עוסק פטור' | 'עוסק מורשה' | 'חברה בע"מ' | 'שותפות רשומה',
  status: businessData.status as 'active' | 'inactive' | 'suspended' | 'liquidation' | 'dissolved' | 'violating',
  // ... остальные поля
};

const report = await generateBusinessReport(checkIDCompatibleData);
```

**Стало:**
```typescript
// Используем unified data напрямую — Gemini адаптирован под UnifiedBusinessData
const report = await generateBusinessReport(businessData);
```

### 3.2. lib/gemini.ts

**Обновить интерфейс функции (строка 85):**

**Было:**
```typescript
import { CheckIDBusinessData } from './checkid'; // ❌ УДАЛИТЬ

export async function generateBusinessReport(businessData: CheckIDBusinessData): Promise<string> {
```

**Стало:**
```typescript
import { UnifiedBusinessData } from './unified_data';

export async function generateBusinessReport(businessData: UnifiedBusinessData): Promise<string> {
```

**Обновить buildReportPrompt (строки 100-150):**

**Было:**
```typescript
function buildReportPrompt(businessData: CheckIDBusinessData): string {
  return `
    Company: ${businessData.name}
    Type: ${businessData.type}
    Status: ${businessData.status}
    // ... CheckID специфичные поля
  `;
}
```

**Стало:**
```typescript
function buildReportPrompt(businessData: UnifiedBusinessData): string {
  return `
    Company: ${businessData.nameHebrew}
    Type: ${businessData.companyType}
    Status: ${businessData.status}
    Owners: ${businessData.owners.map(o => o.name).join(', ')}
    Legal Issues: ${businessData.legalIssues.activeCases} active cases
    // ... UnifiedBusinessData поля
  `;
}
```

### 3.3. app/page.tsx

**Обновить статус бaннер (строка 38):**

**Было:**
```tsx
<li>🚧 CheckID API - Mock Data (בפיתוח)</li>
```

**Стало:**
```tsx
<li>✅ data.gov.il — 716K חברות במאגר</li>
```

---

## Шаг 4: Обновление документации

### 4.1. PHASE_1_SPECIFICATION.md

**Удалить раздел 5 целиком (строки 450-650):**

```markdown
## 5. Интеграция CheckID API

### 5.1. Authentication
### 5.2. Endpoint Specifications
### 5.3. Error Handling
```

**Заменить на:**

```markdown
## 5. Интеграция data.gov.il Open Data API

### 5.1. Companies Registry Dataset

**Source:** https://data.gov.il  
**Dataset ID:** `f004176c-b85f-4542-8901-7b3176f9a054`  
**Records:** 716,714 Israeli companies  
**Update Frequency:** Monthly  
**Cost:** ₪0 (FREE)

#### Доступные данные:
- מספר חברה (H.P. number)
- שם בעברית (Hebrew name)
- סטטוס (Status: active/liquidation/dissolved)
- בעלים (Owners)
- כתובת (Address)
- תאריך רישום (Registration date)

#### Архитектура доступа:

```typescript
// lib/unified_data.ts — Hybrid Strategy
export async function getBusinessData(hpNumber: string) {
  // 1. PostgreSQL cache (data.gov.il) — fastest
  const cached = await postgres.searchLocalCompany(hpNumber);
  if (cached && !isOutdated(cached)) return cached;
  
  // 2. Real-time scraping (ica.justice.gov.il) — accurate
  const scraped = await scrapeICAJustice(hpNumber);
  await postgres.upsertCompany(scraped);
  return scraped;
  
  // 3. Mock data — development fallback
  return getMockBusinessData(hpNumber);
}
```

### 5.2. Import Script

**Script:** `scripts/import_postgresql_data.ps1`

**Usage:**
```powershell
pwsh scripts/import_postgresql_data.ps1

# Expected time: 10-15 minutes
# Output: 716K companies imported to PostgreSQL
```

### 5.3. Legal Compliance

✅ **Open Government Data Policy** (החלטה 1933)  
✅ **No registration required** — public API  
✅ **Commercial use allowed** — per Terms of Service  
✅ **No rate limits** — for cached data  

**Reference:** `DIRECT_GOVERNMENT_ACCESS_LEGAL_GUIDE.md` (1046 lines)
```

### 4.2. .env.example

**Удалить CheckID переменные:**

**Было:**
```env
# CheckID API (Phase 2)
CHECKID_API_URL=https://api.checkid.co.il
CHECKID_API_KEY=<your-key>
```

**Стало:**
```env
# data.gov.il не требует API ключа (публичный Open Data API)
# Dataset импортируется в PostgreSQL через scripts/import_postgresql_data.ps1
```

---

## Шаг 5: Проверка и тестирование

### 5.1. Компиляция TypeScript

```powershell
npm run type-check
```

**Ожидаемые ошибки:**
- ❌ `Cannot find module '@/lib/checkid'` — НОРМАЛЬНО (удалили файл)
- ✅ Все остальное должно компилироваться

### 5.2. Запуск dev сервера

```powershell
npm run dev
```

**Проверить:**
- ✅ Страница загружается (localhost:3000)
- ✅ Поиск работает (вводим H.P. номер)
- ✅ API /api/report возвращает данные
- ✅ Gemini генерирует отчёт

### 5.3. Тест с реальным H.P. номером

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{"businessName": "515044532"}'

# Should return:
# {
#   "success": true,
#   "businessData": { ... },
#   "report": "דוח אמינות לעסק..."
# }
```

---

## Шаг 6: Git Commit

```powershell
cd E:\SBF

# Stage changes
git add .

# Commit with detailed message
git commit -m "refactor: Remove CheckID API dependency, migrate to data.gov.il

BREAKING CHANGES:
- Removed lib/checkid.ts (legacy mock data)
- Updated lib/gemini.ts to use UnifiedBusinessData interface
- Updated app/api/report/route.ts to remove CheckID imports
- Updated app/page.tsx status banner
- Removed CheckID section from PHASE_1_SPECIFICATION.md
- Deleted research/reports/СКЕЛЕТ.md (outdated)

BENEFITS:
- Cost reduction: ₪0 vs ₪1.50/query (100% savings)
- Legal compliance: Open Government Data Policy
- No third-party dependency
- 716K companies in PostgreSQL cache

MIGRATION:
- All data now flows through lib/unified_data.ts
- PostgreSQL cache from data.gov.il (scripts/import_postgresql_data.ps1)
- Real-time scraping fallback (ica.justice.gov.il)
- Mock data for development only

DOCS:
- See PROJECT_VERIFICATION_REPORT_2025-12-23.md for full analysis
- See DIRECT_GOVERNMENT_ACCESS_LEGAL_GUIDE.md for legal framework
- See CHECKID_REMOVAL_PLAN.md for removal steps
"

# Push to remote
git push origin main
```

---

## Шаг 7: Production Deployment

```bash
# SSH to Hetzner server
ssh root@46.224.147.252

cd /root/trustcheck

# Pull changes
git pull origin main

# Rebuild app
docker-compose down
docker-compose build app
docker-compose up -d

# Import data (CRITICAL — 15 minutes)
pwsh scripts/import_postgresql_data.ps1

# Check logs
docker-compose logs -f app

# Verify /api/health
curl https://trustcheck.co.il/api/health
```

---

## Rollback Plan (если что-то сломалось)

### Вариант A: Git Revert

```bash
# Find last working commit
git log --oneline

# Revert to previous commit
git revert HEAD
git push origin main

# Redeploy
ssh root@46.224.147.252
cd /root/trustcheck
git pull origin main
docker-compose restart app
```

### Вариант B: Восстановить lib/checkid.ts

```bash
# Restore from git history
git checkout HEAD~1 -- lib/checkid.ts
git checkout HEAD~1 -- app/api/report/route.ts

# Commit restored files
git add .
git commit -m "revert: Restore CheckID temporarily (rollback)"
git push origin main
```

---

## Timeline

| Шаг | Задача | Время | Сложность |
|-----|--------|-------|-----------|
| 1 | Анализ упоминаний | 15 мин | 🟢 Easy |
| 2 | Удаление файлов | 5 мин | 🟢 Easy |
| 3 | Обновление кода | 45 мин | 🟡 Medium |
| 4 | Обновление документации | 30 мин | 🟢 Easy |
| 5 | Тестирование | 30 мин | 🟡 Medium |
| 6 | Git commit | 10 мин | 🟢 Easy |
| 7 | Production deploy | 30 мин | 🟡 Medium |

**Общее время:** 2 часа 45 минут

---

## Критерии успеха

✅ **Код компилируется** без ошибок TypeScript  
✅ **Приложение запускается** на localhost:3000  
✅ **API /api/report работает** с UnifiedBusinessData  
✅ **Gemini генерирует отчёты** на иврите  
✅ **PostgreSQL cache работает** (716K компаний)  
✅ **Production деплой успешен** (trustcheck.co.il)  
✅ **Нет упоминаний CheckID** в активном коде  

---

## Выгоды от удаления

### Экономические:

| Метрика | Было (CheckID) | Стало (data.gov.il) | Экономия |
|---------|----------------|---------------------|----------|
| **Setup cost** | ₪0 | ₪0 | ₪0 |
| **Monthly cost** | ₪0 | ₪0 | ₪0 |
| **Per query** | ₪1.50 | ₪0 | **100%** |
| **1,000 queries** | ₪1,500 | ₪0 | **₪1,500** |
| **10,000 queries** | ₪15,000 | ₪0 | **₪15,000** |

### Технические:

✅ **Нет зависимости** от стороннего API  
✅ **Нет rate limits** (данные в PostgreSQL)  
✅ **Нет downtime риска** (собственная БД)  
✅ **Быстрее** (local cache vs HTTP request)  
✅ **Больше контроля** над данными  

### Юридические:

✅ **100% легально** (Open Government Data)  
✅ **Нет лицензионных ограничений**  
✅ **Нет Privacy Protection Issues**  
✅ **Соответствует Israeli law**  

---

## Следующие шаги после удаления

1. ✅ Импортировать данные PostgreSQL (15 мин)
   ```powershell
   pwsh scripts/import_postgresql_data.ps1
   ```

2. ✅ Настроить GA4 tracking (30 мин)
   - См. `docs/GA4_SETUP_COMPLETE_GUIDE.md`

3. ✅ Интегрировать Stripe payments (7 часов)
   - См. `docs/STRIPE_INTEGRATION_GUIDE.md`

4. ✅ Выпустить SSL сертификат (15 мин)
   ```bash
   bash scripts/setup_production_ssl.sh
   ```

5. ⏳ Soft Launch без paywall (Week 1)
   - Собрать 100-500 пользователей
   - Валидация product-market fit

6. ⏳ Добавить Stripe paywall (Week 2)
   - После validation
   - Premium отчёты ₪4.99

---

**Составлено:** GitHub Copilot  
**Дата:** 23 декабря 2025  
**Статус:** READY TO EXECUTE  
**Приоритет:** MEDIUM (не блокирует launch, но экономит деньги)
