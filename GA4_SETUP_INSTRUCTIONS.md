# Google Analytics 4 Setup Instructions

## Шаг 1: Создание GA4 Property

1. Перейди на https://analytics.google.com/
2. Войди с Google аккаунтом
3. Нажми **"Admin"** (левый нижний угол)
4. Нажми **"+ Create Property"**
5. Заполни форму:
   - **Property name:** TrustCheck Israel
   - **Reporting time zone:** (GMT+02:00) Jerusalem
   - **Currency:** New Israeli Shekel (₪)
6. Нажми **"Next"**

## Шаг 2: Business Information

1. **Industry category:** Legal Services (или Business Services)
2. **Business size:** Small (1-10 employees)
3. Нажми **"Next"**

## Шаг 3: Business Objectives

Выбери:
- ✅ **Generate leads**
- ✅ **Examine user behavior**
- Нажми **"Create"**

## Шаг 4: Принять Terms of Service

1. Выбери **Israel** в Country dropdown
2. Прочитай и согласись с Terms
3. Нажми **"I Accept"**

## Шаг 5: Настройка Data Stream

1. Выбери **"Web"** platform
2. Заполни:
   - **Website URL:** http://46.224.147.252 (временно, потом поменять на https://trustcheck.co.il)
   - **Stream name:** TrustCheck Production
   - **Enable Enhanced Measurement:** ✅ (оставить включённым)
3. Нажми **"Create stream"**

## Шаг 6: Получить Measurement ID

**После создания stream увидишь:**
```
Measurement ID: G-XXXXXXXXXX
```

**Скопируй это ID!**

## Шаг 7: Добавить ID на сервер

```bash
# SSH на сервер
ssh -i ~/.ssh/trustcheck_hetzner root@46.224.147.252

# Редактировать .env
nano /opt/trustcheck/.env

# Добавить строку:
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # <-- вставь свой ID

# Сохранить (Ctrl+X, Y, Enter)

# Перезапустить контейнер
cd /opt/trustcheck
docker compose restart app

# Проверить
docker compose logs -f app
```

## Шаг 8: Проверка работы

1. Открой http://46.224.147.252/
2. Сделай поиск компании
3. Через 5-10 минут зайди в GA4:
   - **Reports** → **Realtime**
   - Должен увидеть свой визит

## Шаг 9: Настроить Events (опционально)

В GA4 Dashboard:
1. **Configure** → **Events**
2. Увидишь custom events:
   - `search_business`
   - `view_report`
   - `user_rating`
   - `error`

## Troubleshooting

**Не видно данных в Realtime?**
- Проверь Network tab в браузере: должны быть запросы к `google-analytics.com`
- Проверь `docker compose logs app` — не должно быть ошибок
- Проверь что NEXT_PUBLIC_GA_ID начинается с `G-` (не `UA-`)

**404 на gtag.js?**
- Проверь что в `app/layout.tsx` правильный script tag
- Перезапусти контейнер: `docker compose restart app`

---

## После получения Measurement ID:

Запусти команды:
```bash
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252 "echo 'NEXT_PUBLIC_GA_ID=G-ТВОЙ_ID' >> /opt/trustcheck/.env && cd /opt/trustcheck && docker compose restart app"
```

Замени `G-ТВОЙ_ID` на реальный ID из GA4.
