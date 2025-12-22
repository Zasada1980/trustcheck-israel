# GA4 Events Verification Guide

**Дата:** 22 декабря 2025  
**Measurement ID:** G-D7CJVWP2X3  
**URL:** http://46.224.147.252/

---

## 🎯 Events для проверки

### 1. **search_business** (Поиск компании)
- **Trigger:** User вводит название и кликает "בדוק עכשיו"
- **Parameters:**
  - `event_category`: engagement
  - `event_label`: hp_number | phone | name_hebrew | name_english
- **Код:** `lib/analytics.ts` → `trackSearch()`

### 2. **view_report** (Просмотр отчёта)
- **Trigger:** AI report успешно загружен и отображен
- **Parameters:**
  - `event_category`: engagement
  - `event_label`: Business name
  - `value`: Trust score (1-5)
- **Код:** `lib/analytics.ts` → `trackReportView()`

### 3. **user_rating** (Оценка пользователя)
- **Trigger:** User кликает на звёздочки (1-5) после 3 секунд
- **Parameters:**
  - `event_category`: feedback
  - `event_label`: rating_1 | rating_2 | ... | rating_5
  - `value`: Rating number
- **Код:** `lib/analytics.ts` → `trackRating()`

### 4. **error** (Ошибки)
- **Trigger:** API error, validation error, etc.
- **Parameters:**
  - `event_category`: technical
  - `event_label`: Error type: message
- **Код:** `lib/analytics.ts` → `trackError()`

---

## ✅ Тестовый сценарий (5-10 минут)

### Шаг 1: Откройте сайт

```powershell
# Локально или с мобильного
start http://46.224.147.252/
```

---

### Шаг 2: Выполните тестовый поиск

**Действия:**
1. Введите в search field: `גן ילדים שמש`
2. Кликните "בדוק עכשיו"
3. Дождитесь AI отчёта (5-10 секунд)

**Ожидаемые events:**
- ✅ `search_business` (срабатывает сразу при submit)
- ✅ `view_report` (срабатывает когда report отобразился)

---

### Шаг 3: Дождитесь rating prompt (опционально)

**Действия:**
1. После появления отчёта подождите 3 секунды
2. Должны появиться звёздочки: "דרג את החוויה שלך"
3. Кликните на любую звёздочку (например 5 ⭐)

**Ожидаемый event:**
- ✅ `user_rating` (value: 5)

---

### Шаг 4: Проверьте error tracking (опционально)

**Действия:**
1. Оставьте search field пустым
2. Кликните "בדוק עכשיו"
3. Должна появиться ошибка: "נא להזין שם עסק"

**Ожидаемый event:**
- ✅ `error` (label: "validation: נא להזין שם עסק")

---

## 📊 Проверка в Google Analytics Dashboard

### Метод 1: Realtime Reports (рекомендовано)

**Шаги:**
1. Откройте https://analytics.google.com/
2. Выберите Property: **TrustCheck Production** (G-D7CJVWP2X3)
3. Sidebar → **Reports** → **Realtime**
4. Секция "Event count by Event name" (правая панель)

**Ожидаемые события (через 10-30 секунд):**
```
Event name             Count
─────────────────────  ─────
page_view              1      ← Automatic (Next.js)
search_business        1      ← Custom
view_report            1      ← Custom
user_rating            1      ← Custom (если кликнули звёзды)
```

**Если events не появились:**
- Подождите 1-2 минуты (может быть delay)
- Проверьте browser console (F12) → Network → googletagmanager.com
- Проверьте gtag.js загрузился: `curl http://46.224.147.252/ | Select-String gtag`

---

### Метод 2: DebugView (для детальной отладки)

**Активация Debug Mode:**

**Option A: Chrome Extension**
1. Установите "Google Analytics Debugger" extension
2. Включите extension (icon в toolbar)
3. Reload http://46.224.147.252/
4. Events будут отправляться в debug mode

**Option B: URL Parameter**
```
http://46.224.147.252/?debug_mode=1
```

**Проверка в GA4:**
1. Sidebar → **Admin** → **DebugView**
2. Выберите своё устройство (обычно показывает hostname)
3. Смотрите events в реальном времени с полными параметрами

**Пример debug event:**
```json
{
  "event_name": "search_business",
  "event_category": "engagement",
  "event_label": "name_hebrew",
  "timestamp": "2025-12-22T22:15:30Z",
  "user_properties": {
    "session_id": "abc123",
    "page_location": "http://46.224.147.252/"
  }
}
```

---

### Метод 3: Browser DevTools (техническая проверка)

**Шаги:**
1. Откройте http://46.224.147.252/
2. F12 → Console
3. Введите в search field что-то и submit
4. В console должен появиться gtag call

**Ожидаемый console output (если включён verbose logging):**
```javascript
// Если добавить console.log в trackSearch()
gtag('event', 'search_business', {
  event_category: 'engagement',
  event_label: 'name_hebrew'
})
```

**Проверка Network:**
1. F12 → Network tab
2. Filter: `googletagmanager.com`
3. После search должен появиться request:
   - `https://www.googletagmanager.com/gtag/js?id=G-D7CJVWP2X3`
   - `https://www.google-analytics.com/g/collect?v=2&...`

---

## 🐛 Troubleshooting

### Проблема 1: Events не появляются в Realtime

**Причины:**
1. GA4 delay (может быть до 2 минут)
2. Ad blockers блокируют gtag.js
3. NEXT_PUBLIC_GA_ID не задан в .env

**Решение:**
```bash
# На сервере проверьте .env
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252
cat /opt/trustcheck/.env | grep NEXT_PUBLIC_GA_ID

# Должно вернуть:
# NEXT_PUBLIC_GA_ID=G-D7CJVWP2X3
```

---

### Проблема 2: gtag.js не загружается

**Проверка:**
```powershell
curl.exe -s http://46.224.147.252/ | Select-String "gtag"
```

**Ожидаемый output:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D7CJVWP2X3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-D7CJVWP2X3', {...});
</script>
```

**Если пусто:**
- Проверьте `app/layout.tsx` содержит GA4 script
- Rebuild Docker image: `docker compose build --no-cache app`

---

### Проблема 3: Events срабатывают, но неправильные параметры

**Debug код:**
```typescript
// Добавьте в lib/analytics.ts для временного логирования
export const trackSearch = (businessName: string, inputType: string) => {
  console.log('[GA4] trackSearch:', { businessName, inputType }); // ADD THIS
  event({
    action: 'search_business',
    category: 'engagement',
    label: inputType,
  });
};
```

**Проверьте в browser console** после search.

---

## 📈 Expected Results (Success Criteria)

**Minimum (PASS):**
- ✅ `page_view` event появляется при загрузке
- ✅ `search_business` event появляется при search
- ✅ `view_report` event появляется при отображении отчёта

**Nice to have (не блокеры):**
- `user_rating` event работает (если кликнули звёзды)
- `error` event работает (если была ошибка)
- Events появляются в Realtime < 1 минуты

---

## 📊 Metrics Dashboard (после 24 часов)

**Где смотреть после накопления данных:**

1. **Reports → Engagement → Events**
   - Top events by count
   - Event parameters breakdown

2. **Reports → Engagement → Conversions**
   - Если настроили conversions (Phase 2)

3. **Explore → Free form**
   - Custom reports с фильтрами
   - Funnel analysis: page_view → search → view_report

---

## ✅ Чеклист проверки

```
[ ] Открыл https://analytics.google.com/
[ ] Выбрал Property: G-D7CJVWP2X3
[ ] Открыл Realtime reports
[ ] Сделал тестовый search на http://46.224.147.252/
[ ] Увидел search_business event (через 10-30 сек)
[ ] Дождался AI отчёта
[ ] Увидел view_report event (через 10-30 сек)
[ ] Кликнул rating stars (если появились)
[ ] Увидел user_rating event (через 10-30 сек)
```

**Статус:** ✅ PASS / ❌ FAIL

---

## 🎯 Next Steps (если всё работает)

1. ✅ **Mark GA4 verification complete**
2. 🟡 **Wait 24-48 hours** для накопления данных
3. 📊 **Check standard reports:**
   - User acquisition
   - Page views by country (ожидаем 90%+ Israel)
   - Device breakdown (mobile vs desktop)
4. ⏳ **Setup custom conversions (Phase 2):**
   - Conversion: search → report view (funnel)
   - Conversion: report view → rating (satisfaction)

---

**Проверено:** _______________  
**Дата:** 22.12.2025  
**Результат:** ✅ Events работают / ❌ Требуется fix
