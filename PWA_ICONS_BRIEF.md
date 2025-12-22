# PWA Icons - Design Brief

## Текущее состояние

✅ Создан placeholder SVG: `public/icon-512.svg`
- Синий фон (#2563eb)
- Белый shield outline
- Зелёная галочка (checkmark)
- Текст "TrustCheck"

## Требуется от дизайнера

### 1. Создать финальный дизайн иконки

**Концепция:**
- **Shield (щит)** — символ защиты и безопасности
- **Checkmark (галочка)** — символ проверки и одобрения
- **Hebrew typography** — опционально добавить "בדיקת אמינות"

**Цветовая палитра:**
- Primary: #2563eb (синий)
- Success: #10b981 (зелёный)
- Background: белый или градиент

**Стиль:**
- Modern, clean, professional
- Узнаваемый на маленьких размерах (48x48)
- Хорошо смотрится на светлом и тёмном фоне

### 2. Экспортировать в следующих форматах

#### Required files:

1. **icon-192.png** (192×192 px)
   - Android Chrome minimal size
   - PNG, 24-bit color + alpha
   - Optimized (<50 KB)

2. **icon-512.png** (512×512 px)
   - iOS, Android, Desktop PWA
   - PNG, 24-bit color + alpha
   - Optimized (<150 KB)

3. **apple-touch-icon.png** (180×180 px)
   - iOS Safari "Add to Home Screen"
   - PNG, opaque background (no alpha)
   - Optimized (<100 KB)

4. **favicon.ico** (32×32, 16×16 multi-size)
   - Browser tab icon
   - ICO format with multiple sizes

5. **icon-maskable-512.png** (optional, but recommended)
   - Safe zone: inner 80% circle
   - For Android Adaptive Icons
   - PNG, 512×512

### 3. Design Tools

**Рекомендуемые:**
- Figma: https://www.figma.com/ (бесплатный)
- Canva: https://www.canva.com/
- Adobe Illustrator (если есть)

**Online генераторы (quick solution):**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/

### 4. Checklist перед экспортом

- [ ] Иконка читаема на 48×48 px
- [ ] Хорошо смотрится на белом фоне
- [ ] Хорошо смотрится на тёмном фоне
- [ ] Нет мелких деталей (<3px)
- [ ] Padding от краёв (минимум 8px)
- [ ] Optimized PNG (используй TinyPNG.com)

## Быстрое решение (placeholder)

Если нет времени на дизайн, можно:

1. Использовать текущий SVG
2. Конвертировать через https://cloudconvert.com/svg-to-png
3. Задать размеры: 192×192, 512×512, 180×180
4. Сохранить как PNG

## После создания иконок

Положи файлы в:
```
E:\SBF\public\
├── icon-192.png
├── icon-512.png
├── apple-touch-icon.png
├── favicon.ico
└── icon-maskable-512.png (optional)
```

Обнови `manifest.json`:
```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Тестирование

После добавления иконок:
```bash
# Deploy на сервер
scp -i ~/.ssh/trustcheck_hetzner E:\SBF\public\icon-*.png root@46.224.147.252:/opt/trustcheck/public/

# Проверить манифест
curl http://46.224.147.252/manifest.json

# Тест на мобильном
# iOS: Safari → Share → Add to Home Screen
# Android: Chrome → Menu → Add to Home Screen
```

---

**Current Status:** Placeholder SVG создан, требуется финальный дизайн от дизайнера.
