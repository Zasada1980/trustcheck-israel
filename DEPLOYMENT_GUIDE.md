# TrustCheck Israel - Production Deployment Guide
# Дата: 23.12.2025

## Предварительные требования
✅ PostgreSQL интегрирован локально
✅ Docker образы собраны
✅ NGINX настроен (HTTP-only для dev, HTTPS для prod)
✅ API протестирован

## Шаг 1: Коммит изменений
```powershell
cd E:\SBF
git add .
git commit -m "feat: PostgreSQL integration + Unified Data Service + NGINX fixes

- Added PostgreSQL 15-alpine for government data caching
- Created unified_data.ts with hybrid strategy (PostgreSQL → Scraping → Mock)
- Fixed TypeScript compilation errors in API route
- Updated NGINX to HTTP-only for development
- Created dynamic icons via Next.js metadata API
- 6 database tables: companies_registry, company_owners, legal_cases, etc.
- Ready for data.gov.il import (scripts/download_government_data.ps1)
"

git push origin main
```

## Шаг 2: Подключение к серверу
```powershell
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252
```

## Шаг 3: Backup текущей версии (на сервере)
```bash
cd /root/trustcheck

# Создать backup текущей версии
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  docker-compose.yml \
  .env \
  nginx.conf \
  --exclude=node_modules \
  --exclude=.next

# Сохранить в /root/backups/
mkdir -p /root/backups
mv backup_*.tar.gz /root/backups/
```

## Шаг 4: Pull изменений
```bash
cd /root/trustcheck
git pull origin main
```

## Шаг 5: Обновить .env на production
```bash
nano .env

# Добавить PostgreSQL секцию:
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=trustcheck_gov_data
POSTGRES_USER=trustcheck_admin
POSTGRES_PASSWORD=СОЗДАЙТЕ_БЕЗОПАСНЫЙ_ПАРОЛЬ_ДЛЯ_PRODUCTION
```

**Генерация безопасного пароля:**
```bash
openssl rand -base64 32
```

## Шаг 6: Пересобрать и запустить
```bash
# Остановить текущие контейнеры
docker-compose down

# Очистить старые образы (опционально)
docker image prune -a -f

# Пересобрать с новыми изменениями
docker-compose build --no-cache

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker ps
docker logs trustcheck-postgres --tail 50
docker logs trustcheck-app --tail 50
docker logs trustcheck-nginx --tail 50
```

## Шаг 7: Проверка работоспособности
```bash
# Health check PostgreSQL
docker exec -it trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "\dt"

# Ожидаемый вывод: 6 таблиц
# companies_registry | company_owners | legal_cases | execution_proceedings | scraping_logs | data_sync_status

# Health check API
curl http://localhost/health
# Ожидаемый вывод: OK

# Test API endpoint
curl -X POST http://localhost/api/report \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test","registrationNumber":"123456789"}'

# Ожидаемый вывод: JSON с metadata.dataSource = "mock_data"
```

## Шаг 8: SSL сертификаты (для HTTPS)
**После успешного запуска на HTTP, настроить HTTPS:**

```bash
# 1. Установить Certbot
apt-get update
apt-get install -y certbot

# 2. Остановить NGINX (для standalone режима)
docker-compose stop nginx

# 3. Получить сертификат
certbot certonly --standalone -d trustcheck.co.il -d www.trustcheck.co.il

# 4. Скопировать сертификаты в проект
mkdir -p /root/trustcheck/ssl
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /root/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /root/trustcheck/ssl/

# 5. Обновить docker-compose.yml - раскомментировать HTTPS блок в nginx.conf
# 6. Перезапустить NGINX
docker-compose up -d nginx
```

## Шаг 9: Мониторинг
```bash
# Логи в реальном времени
docker logs -f trustcheck-app

# Проверка использования ресурсов
docker stats

# Проверка дискового пространства PostgreSQL
docker exec trustcheck-postgres du -sh /var/lib/postgresql/data
```

## Rollback план (если что-то пойдёт не так)
```bash
cd /root/trustcheck

# Остановить новую версию
docker-compose down

# Восстановить backup
tar -xzf /root/backups/backup_TIMESTAMP.tar.gz

# Запустить старую версию
docker-compose up -d
```

## Производительность
**Ожидаемые метрики после деплоя:**
- Запуск PostgreSQL: <10 секунд
- Запуск App: <40 секунд
- API response time (mock): <2 секунды
- API response time (PostgreSQL cache): <100 мс (после импорта данных)

## Следующие шаги после деплоя
1. ✅ Импортировать данные с data.gov.il
2. ✅ Настроить cron для ежемесячного обновления данных
3. ✅ Создать ICA scraper для свежих данных
4. ✅ Интегрировать MishpatNet Pro (₪199/month) или создать court scraper

---

**Контакты для поддержки:**
- Сервер: root@46.224.147.252
- SSH Key: C:\Users\zakon\.ssh\trustcheck_hetzner
- Git: https://github.com/YOUR_REPO/trustcheck-israel
