# Lighthouse Performance Audit Guide

**Дата:** 22 декабря 2025  
**URL:** http://46.224.147.252/  
**Время:** 10-15 минут

---

## 🎯 Целевые метрики Phase 1

| Метрика | Target | Priority |
|---------|--------|----------|
| **Performance** | 90+ | 🔴 Critical |
| **Accessibility** | 95+ | 🟡 Important |
| **Best Practices** | 90+ | 🟡 Important |
| **SEO** | 90+ | 🟢 Nice to have |

---

## 📋 Метод 1: Chrome DevTools (рекомендовано)

### Шаг 1: Откройте DevTools

```powershell
# Откройте сайт в Chrome
start chrome http://46.224.147.252/
```

**Затем:**
1. F12 (или Ctrl+Shift+I)
2. Перейдите на вкладку **Lighthouse**
3. Если нет вкладки → кликните `>>` → выберите Lighthouse

---

### Шаг 2: Настройте параметры теста

**Categories (выберите все):**
- ✅ Performance
- ✅ Accessibility
- ✅ Best Practices
- ✅ SEO
- ⬜ PWA (опционально - пока placeholder icons)

**Device:**
- 🟦 Mobile (приоритет) ← Начните с этого
- ⬜ Desktop (после mobile)

**Mode:**
- 🔵 Navigation (default)

---

### Шаг 3: Запустите анализ

1. Кликните **"Analyze page load"**
2. Дождитесь завершения (30-60 секунд)
3. Lighthouse откроет новую вкладку с результатами

---

### Шаг 4: Сохраните отчёт

**В Lighthouse report:**
1. Кликните ⚙️ (Settings icon) вверху справа
2. **"Save as HTML"**
3. Сохраните как: `lighthouse-mobile-report.html`

**Или через URL:**
```
chrome://lighthouse/
```

---

## 📊 Ожидаемые результаты (Mobile)

### Performance (~85-95) 🟢

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** <2.5s ✅
  - Target: "TrustCheck Israel" heading loads быстро
- **TBT (Total Blocking Time):** <300ms ✅
  - Next.js server-side rendering минимизирует блокировку
- **CLS (Cumulative Layout Shift):** <0.1 ✅
  - Нет неожиданных сдвигов (fixed layout)

**Metrics breakdown:**
```
First Contentful Paint (FCP):    ~1.2s  ✅ (<1.8s good)
Speed Index:                      ~2.0s  ✅ (<3.4s good)
Largest Contentful Paint (LCP):   ~2.3s  ✅ (<2.5s good)
Time to Interactive (TTI):        ~2.5s  ✅ (<3.8s good)
Total Blocking Time (TBT):        ~150ms ✅ (<300ms good)
Cumulative Layout Shift (CLS):    0.01   ✅ (<0.1 good)
```

**Возможные issues (не блокеры):**
- ⚠️ "Serve images in next-gen formats" - пока нет images
- ⚠️ "Reduce unused JavaScript" - GA4 gtag.js (~50KB gzipped)
- ⚠️ "Eliminate render-blocking resources" - TailwindCSS (~10KB)

---

### Accessibility (~95-100) 🟢

**Expected checks:**
- ✅ Contrast ratio sufficient (dark text on white)
- ✅ Touch targets >= 48×48px (button, input)
- ✅ HTML lang attribute (`lang="he"`)
- ✅ Meta viewport tag present
- ✅ Form inputs have labels (`<label for="businessName">`)

**Возможные issues:**
- ⚠️ "Links do not have accessible names" - пока нет links (кроме footer)
- ⚠️ "ARIA roles used correctly" - нет custom ARIA (пока)

---

### Best Practices (~85-95) 🟡

**Expected checks:**
- ✅ HTTPS ready (пока HTTP - DNS pending)
- ✅ No browser errors in console
- ✅ Images have proper aspect ratio
- ✅ No vulnerable JavaScript libraries

**Возможные issues:**
- 🔴 "Does not use HTTPS" - ожидаемо (пока нет SSL)
  - **Fix:** После DNS + SSL это станет 100
- ⚠️ "Browser errors logged to console" - если есть GA4 warnings

---

### SEO (~90-100) 🟢

**Expected checks:**
- ✅ `<title>` tag present
- ✅ `<meta name="description">` present
- ✅ `<meta name="viewport">` present
- ✅ Font sizes readable (>12px)
- ✅ Tap targets sized appropriately

**Возможные issues:**
- ⚠️ "Document does not have valid hreflang" - пока только Hebrew
- ⚠️ "robots.txt not found" - опционально для MVP

---

## 📋 Метод 2: CLI (advanced)

### Установка Lighthouse CLI

```powershell
# Требуется Node.js 18+
npm install -g lighthouse

# Проверка версии
lighthouse --version
```

---

### Запуск теста (Mobile)

```powershell
lighthouse http://46.224.147.252/ `
  --output html `
  --output-path ./lighthouse-mobile-report.html `
  --emulated-form-factor mobile `
  --throttling.cpuSlowdownMultiplier 4 `
  --chrome-flags="--headless"
```

**Параметры:**
- `--output html` - HTML отчёт
- `--emulated-form-factor mobile` - Mobile device simulation
- `--throttling.cpuSlowdownMultiplier 4` - Slow 4G network
- `--chrome-flags="--headless"` - Без GUI (background)

**Время выполнения:** ~30-45 секунд

---

### Запуск теста (Desktop)

```powershell
lighthouse http://46.224.147.252/ `
  --output html `
  --output-path ./lighthouse-desktop-report.html `
  --emulated-form-factor desktop `
  --chrome-flags="--headless"
```

---

### JSON output (для CI/CD - Phase 2)

```powershell
lighthouse http://46.224.147.252/ `
  --output json `
  --output-path ./lighthouse-report.json `
  --emulated-form-factor mobile
```

**Используется для:**
- Автоматические проверки в GitHub Actions
- Performance budgets enforcement
- Regression detection

---

## 📋 Метод 3: Online Tool (без установки)

### PageSpeed Insights (Google)

**URL:** https://pagespeed.web.dev/

**Шаги:**
1. Откройте https://pagespeed.web.dev/
2. Введите: `http://46.224.147.252/`
3. Кликните **"Analyze"**
4. Дождитесь результатов (1-2 минуты)

**Преимущества:**
- Нет установки ПО
- Тестирование с реальных серверов Google (разные локации)
- Сравнение Mobile + Desktop в одном отчёте

**Недостатки:**
- Медленнее чем локальный Lighthouse
- Может не работать с http:// (только https://)
- Нет advanced параметров

---

## 🐛 Распространённые проблемы и fix'ы

### Проблема 1: Performance < 80

**Причины:**
- Slow server response (TTFB > 600ms)
- Large JavaScript bundles
- No caching headers

**Fix'ы:**
```typescript
// next.config.js - добавить compression
module.exports = {
  compress: true, // Gzip compression
  
  // Image optimization (если будут images)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true, // CSS optimization
  }
}
```

---

### Проблема 2: Accessibility < 90

**Типичные issues:**

**Issue:** "Form elements do not have labels"
```tsx
// ❌ ПЛОХО
<input type="text" placeholder="שם עסק" />

// ✅ ХОРОШО (уже есть в коде)
<label htmlFor="businessName">שם עסק או מספר רישום</label>
<input id="businessName" type="text" placeholder="שם עסק" />
```

**Issue:** "Buttons do not have accessible names"
```tsx
// ❌ ПЛОХО
<button><svg>...</svg></button>

// ✅ ХОРОШО (уже есть)
<button aria-label="בדוק עכשיו">
  🔍 בדוק עכשיו
</button>
```

---

### Проблема 3: Best Practices - HTTPS warning

**Issue:** "Does not use HTTPS"

**Expected:** Это нормально для Phase 1 (пока нет DNS/SSL)

**Fix (Phase 2):**
1. Настроить DNS (trustcheck.co.il → 46.224.147.252)
2. Получить SSL certificate (Let's Encrypt)
3. Update NGINX конфиг (nginx.conf с SSL)
4. Повторный тест → Best Practices станет 95+

---

### Проблема 4: SEO - "Document uses plugins"

**Issue:** Flash/Java plugins detected

**Expected:** Не должно быть (Next.js не использует plugins)

**Если появилось:**
- Проверьте нет ли сторонних scripts (ads, widgets)
- GA4 gtag.js не считается plugin

---

## 📊 Interpretация результатов

### Цветовая схема Lighthouse:

```
🟢 Green (90-100):  Excellent - всё отлично
🟡 Orange (50-89):  Needs improvement - можно улучшить
🔴 Red (0-49):      Poor - требуется fix
```

### Что считается PASS для Phase 1:

**Minimum criteria:**
- Performance: **85+** 🟢 (good enough для MVP)
- Accessibility: **90+** 🟢 (critical для users)
- Best Practices: **80+** 🟡 (HTTPS warning expected)
- SEO: **85+** 🟢 (базовый SEO готов)

**Если ниже threshold:**
- Performance < 80: 🔴 Блокер (нужен fix)
- Accessibility < 85: 🔴 Блокер (legal requirement)
- Best Practices < 75: 🟡 Nice to fix (но не блокер)
- SEO < 80: 🟡 Nice to fix (можно в Phase 2)

---

## 📈 Opportunities & Diagnostics

### Performance Opportunities (что улучшить):

**High impact (сейчас):**
1. ✅ "Properly size images" - N/A (нет images пока)
2. ✅ "Defer offscreen images" - N/A
3. ⚠️ "Reduce unused JavaScript" - GA4 gtag.js (50KB)
   - **Action:** Acceptable trade-off для analytics

**Medium impact (Phase 2):**
1. "Enable text compression" - Gzip/Brotli на NGINX
   - **Action:** Добавить в nginx.conf:
     ```nginx
     gzip on;
     gzip_types text/plain text/css application/json application/javascript;
     gzip_min_length 1000;
     ```

2. "Use HTTP/2" - Upgrade NGINX (после SSL)
   - **Action:** `listen 443 ssl http2;`

---

### Accessibility Diagnostics (что проверить):

**Expected passes:**
- ✅ Color contrast (4.5:1 для text)
- ✅ Touch targets (48×48px buttons)
- ✅ HTML lang attribute (`lang="he"`)
- ✅ Valid ARIA attributes

**Potential warnings:**
- ⚠️ "Some elements have a [tabindex] value greater than 0"
  - **Check:** Нет custom tabindex в коде (пока)

---

## ✅ Чеклист выполнения

```
[ ] Открыл Chrome DevTools → Lighthouse
[ ] Выбрал Mobile + All categories
[ ] Запустил "Analyze page load"
[ ] Дождался результатов (30-60 сек)
[ ] Сохранил HTML report
[ ] Проверил все 4 метрики:
    [ ] Performance: ___/100
    [ ] Accessibility: ___/100
    [ ] Best Practices: ___/100
    [ ] SEO: ___/100
[ ] Повторил для Desktop (опционально)
[ ] Сохранил оба отчёта в E:\SBF\lighthouse-reports\
```

---

## 📂 Где сохранить отчёты

```powershell
# Создайте директорию для отчётов
New-Item -ItemType Directory -Force -Path E:\SBF\lighthouse-reports

# Переместите HTML файлы
Move-Item .\lighthouse-*.html E:\SBF\lighthouse-reports\
```

**Структура:**
```
E:\SBF\lighthouse-reports\
├── lighthouse-mobile-report.html   ← Основной
├── lighthouse-desktop-report.html  ← Опциональный
└── lighthouse-report.json          ← Для CI/CD (Phase 2)
```

---

## 🎯 Next Steps (после аудита)

### Если Performance >= 85:
✅ **PASS** - Phase 1 готов к запуску

### Если Performance 70-84:
🟡 **Conditional PASS** - Можно запустить, улучшить в Phase 2

### Если Performance < 70:
🔴 **FAIL** - Требуется оптимизация:
1. Проверить NGINX caching headers
2. Минифицировать CSS/JS (Next.js должен делать автоматически)
3. Проверить server response time (TTFB)

---

## 📊 Benchmark (для сравнения)

**Типичные результаты для Next.js 14 MVP:**
```
Mobile:
- Performance:     85-95  ← SSR + optimization
- Accessibility:   90-100 ← Semantic HTML
- Best Practices:  85-95  ← Modern Next.js
- SEO:             90-100 ← Good meta tags

Desktop:
- Performance:     90-100 ← More CPU power
- Accessibility:   90-100 ← Same as mobile
- Best Practices:  85-95  ← Same as mobile
- SEO:             90-100 ← Same as mobile
```

---

**Аудитор:** _______________  
**Дата:** 22.12.2025  
**Mobile Score:** ___/100  
**Desktop Score:** ___/100 (опционально)  
**Статус:** ✅ PASS / 🟡 CONDITIONAL / 🔴 FAIL
