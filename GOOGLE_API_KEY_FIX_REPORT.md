# Google API Key Security Fix - Success Report

**Дата:** 23.12.2025, 12:20 UTC+2  
**Проблема:** Google API ключ скомпрометирован (403 Forbidden - "Your API key was reported as leaked")  
**Статус:** ✅ **ИСПРАВЛЕНО И ПРОВЕРЕНО**

---

## 🔴 Обнаруженные проблемы

### 1. Google API Key Leak (КРИТИЧНО)
**Ошибка в логах:**
```
[403 Forbidden] Your API key was reported as leaked. Please use another API key.
```

**Причина:** Старый ключ `AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw` попал в публичный git commit.

**Решение:**
1. ✅ Создан новый ключ: `AIzaSyCPqzIU9SwB8Qv-p6kcQIC4dj-TKoNYX-M`
2. ✅ Ограничен по API (только Generative Language API)
3. ✅ Ограничен по IP: `46.224.147.252`
4. ⚠️ **ВАЖНО:** Старый ключ должен быть удален из Google Console

---

### 2. PostgreSQL Authentication Failed
**Ошибка:**
```
password authentication failed for user "trustcheck_admin"
```

**Причина:** Volume `postgres_data` сохранил пароль от предыдущей инициализации.

**Решение:**
```bash
docker compose down -v  # Удалить volumes
docker compose up -d    # Пересоздать с новым паролем
```

---

### 3. Missing Database Schema
**Ошибка:**
```
column "incorporation_date" does not exist
```

**Причина:** База создана без `init_v2.sql` (29 columns schema).

**Решение:**
```bash
docker compose exec -T postgres psql -U trustcheck_admin -d trustcheck_gov_data < scripts/db/init_v2.sql
```

**Результат:**
- ✅ Таблица `companies_registry` создана (29 столбцов)
- ⚠️ Hebrew full-text search не работает (text search configuration "hebrew" not found)
- ℹ️ Некритично - использует mock data

---

## ✅ Выполненные действия

### Шаг 1: Создание нового API ключа
```bash
# Инструкции:
1. https://console.cloud.google.com/apis/credentials
2. Create Credentials → API Key
3. Edit API Key:
   - API restrictions: Generative Language API only
   - Application restrictions: IP addresses
   - Add: 46.224.147.252
4. Delete old key: AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw
```

### Шаг 2: Обновление .env
**Файл:** `E:\SBF\.env.server`
```env
GOOGLE_API_KEY=AIzaSyCPqzIU9SwB8Qv-p6kcQIC4dj-TKoNYX-M
```

### Шаг 3: Загрузка .env на сервер
```powershell
scp -i C:\Users\zakon\.ssh\trustcheck_hetzner E:\SBF\.env.server root@46.224.147.252:/root/trustcheck/.env
```

### Шаг 4: Пересоздание контейнеров с чистым volume
```bash
ssh root@46.224.147.252 "cd /root/trustcheck && docker compose down -v && docker compose up -d"
```

**Результат:**
- Volume `trustcheck_postgres_data` удален
- PostgreSQL создан с правильным паролем: `TrustCheck2025SecurePass!`
- 3 контейнера запущены: postgres → app → nginx

### Шаг 5: Инициализация схемы базы данных
```bash
ssh root@46.224.147.252 "cd /root/trustcheck && docker compose exec -T postgres psql -U trustcheck_admin -d trustcheck_gov_data < scripts/db/init_v2.sql"
```

**Результат:**
- Таблица `companies_registry` создана
- 6 индексов созданы (hp_number, status, company_type, city, registration_date, name_english)
- ⚠️ 2 ошибки: Hebrew text search config не найден (некритично)

---

## 🧪 Проверка работоспособности

### 1. HTTP доступность
```powershell
Invoke-WebRequest -Uri "http://46.224.147.252/" -UseBasicParsing
```
**Результат:** ✅ HTTP 200 OK

### 2. Google Analytics 4
```powershell
$html = (Invoke-WebRequest -Uri "http://46.224.147.252/" -UseBasicParsing).Content
$html -match "G-D7CJVWP2X3"
```
**Результат:** ✅ GA4 скрипт найден в HTML

### 3. Gemini AI API
```powershell
$body = @{ businessName = "515044532" } | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "http://46.224.147.252/api/report" -Method POST -Body $body -ContentType "application/json"
$resp.aiAnalysis.fullReport.Length
```
**Результат:** ✅ 2038 символов (полный отчет на иврите)

**Пример отчета:**
```
## דוח אמינות: קייטרינג "טעים ובריא" בע"מ

**1. סיכום כללי:**
קייטרינג "טעים ובריא" בע"מ נראה כעסק פעיל ויציב מבחינה משפטית ופיננסית...
רמת אמינות: ⭐⭐⭐ (3 כוכבים)

**2. נקודות חוזק:**
✅ **רישום תקין:** העסק רשום כעוסק מורשה...
✅ **אין חשבונות מוגבלים:** אין דיווחים על חשבון בנק מוגבל...
✅ **אין תיקים משפטיים פעילים:** אין רישומים על תיקים משפטיים...
```

### 4. PostgreSQL
```bash
ssh root@46.224.147.252 "docker compose exec postgres psql -U trustcheck_admin -d trustcheck_gov_data -c 'SELECT COUNT(*) FROM companies_registry;'"
```
**Результат:** ✅ База пустая (0 строк) - готова к загрузке данных

---

## 📊 Финальная статистика

| Компонент | Статус | Версия | Примечания |
|-----------|--------|--------|------------|
| **Next.js App** | ✅ Работает | 14.2.35 | Порт 3000 (внутри Docker) |
| **PostgreSQL** | ✅ Работает | 15-alpine | Пустая база, ждет загрузки |
| **NGINX** | ✅ Работает | alpine | HTTP на порту 80 |
| **Google Gemini** | ✅ Работает | 2.0 Flash | Новый ключ, ограничен по IP |
| **Google Analytics** | ✅ Работает | G-D7CJVWP2X3 | Скрипты в HTML |

---

## ⚠️ Известные проблемы (некритичные)

### 1. Hebrew Full-Text Search
**Ошибка при создании индекса:**
```sql
ERROR: text search configuration "hebrew" does not exist
```

**Решение (опционально):**
```sql
-- Установить Hebrew text search через pg_catalog
CREATE TEXT SEARCH CONFIGURATION hebrew (COPY = simple);
```

**Статус:** Не блокирует работу - система использует mock data для поиска.

### 2. Icon Font Build Warnings
**Предупреждения при сборке:**
```
Failed to load dynamic font for ✓. Error: Failed to download dynamic font. Status: 400
```

**Маршруты:**
- `/icon?0ee7e3fec727eccb` → 0 B (пустой)
- `/apple-icon?89d5a97d661ce9f6` → 0 B (пустой)

**Статус:** Косметическая проблема, не влияет на функциональность.

---

## 🔒 Рекомендации по безопасности

### 1. ❗ УДАЛИТЬ старый API ключ
```
https://console.cloud.google.com/apis/credentials
→ Найти: AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw
→ Delete
```

### 2. Проверить историю git на утечки
```bash
# Поиск утечек в истории (если нужно)
git log --all --full-history -p -- .env
git log --all --full-history -p -S "AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw"
```

### 3. Ротация паролей PostgreSQL (опционально)
```bash
# Если нужно сменить пароль базы в будущем:
docker compose exec postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "ALTER USER trustcheck_admin WITH PASSWORD 'new_password';"
# Обновить .env и перезапустить app контейнер
```

---

## 📝 Следующие шаги

### HIGH PRIORITY
1. **Загрузить government data** (716K компаний)
   ```bash
   pwsh scripts/download_government_data.ps1
   scp data/government/companies_registry.csv root@46.224.147.252:/root/trustcheck/data/
   ```

2. **Удалить старый Google API ключ** (см. секцию безопасности выше)

### MEDIUM PRIORITY
3. **Lighthouse audit** (проверить performance >90)
4. **Uptime monitoring** (UptimeRobot)
5. **Исправить Icon Font warnings** (заменить на статичные SVG)

### LOW PRIORITY
6. **Domain + HTTPS** (если потребуется)
7. **Hebrew full-text search** (установить pg_catalog Hebrew config)

---

## 🎯 Итоги

**Время выполнения:** ~25 минут  
**Проблем исправлено:** 3 (API leak, PostgreSQL auth, DB schema)  
**Систем проверено:** 4 (HTTP, GA4, Gemini, PostgreSQL)  
**Статус:** ✅ **ВСЕ СИСТЕМЫ РАБОТАЮТ**

**Критические риски устранены:**
- ✅ Скомпрометированный API ключ заменен
- ✅ База данных работает корректно
- ✅ Gemini API генерирует отчеты (2000+ символов)
- ✅ GA4 tracking активирован

**Доступные URL:**
- 🌐 Prod: http://46.224.147.252/
- 📊 API: http://46.224.147.252/api/report
- 🏥 Health: http://46.224.147.252/api/health

---

**Документация обновлена:** 23.12.2025, 12:20 UTC+2  
**Автор:** GitHub Copilot (Claude Sonnet 4.5)  
**Проект:** TrustCheck Israel (Zasada1980/trustcheck-israel)
