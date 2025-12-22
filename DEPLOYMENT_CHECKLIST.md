# TrustCheck Israel - Deployment Checklist

**Server:** 46.224.147.252 (Hetzner CX23)  
**Project:** E:\SBF  
**Target:** /opt/trustcheck

---

## ✅ Pre-Deployment Checklist

### 1. Локальное тестирование
- [x] npm install выполнен успешно
- [x] Dev сервер работает (http://localhost:3001)
- [x] API health check: 200 OK
- [x] API report endpoint: 200 OK (real Gemini responses)
- [x] Gemini API квота проверена и работает
- [x] Mock fallback работает корректно

### 2. Файлы проекта
- [x] .env файл настроен (GOOGLE_API_KEY)
- [x] .gitignore защищает .env
- [x] Dockerfile готов (multi-stage build)
- [x] docker-compose.yml настроен (app + nginx)
- [x] nginx.conf с SSL поддержкой
- [x] package.json с корректными зависимостями

### 3. Конфигурация сервера
- [x] Hetzner CX23 создан (46.224.147.252)
- [x] Ubuntu 24.04 установлен
- [x] Docker 29.1.3 установлен
- [x] NGINX 1.24.0 установлен
- [x] Node.js v20.19.6 установлен
- [x] UFW firewall настроен (22, 80, 443)
- [x] Fail2Ban активен
- [x] SSH ключ: C:\Users\zakon\.ssh\trustcheck_hetzner

---

## 🚀 Deployment Steps

### Step 1: Подготовка файлов (5 мин)

**1.1. Проверить .env перед загрузкой:**
```powershell
# Убедиться что GOOGLE_API_KEY не пустой
Select-String -Path E:\SBF\.env -Pattern "GOOGLE_API_KEY"
# Должно показать: AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw
```

**1.2. Создать production .env на сервере:**
```bash
# На сервере создать .env с production настройками
cat > /opt/trustcheck/.env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://trustcheck.co.il
NEXT_PUBLIC_APP_NAME=TrustCheck Israel

GOOGLE_API_KEY=AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw
GOOGLE_GEMINI_MODEL=gemini-2.0-flash
GOOGLE_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta

CHECKID_API_KEY=your_checkid_api_key_here
CHECKID_API_URL=https://api.checkid.co.il

# Остальные переменные оставить как есть
EOF
```

### Step 2: Upload файлов на сервер (10 мин)

**Option A: SCP (быстрый способ)**
```powershell
# Из Windows PowerShell
cd E:\SBF

# Upload всех файлов (исключая node_modules)
scp -i "$env:USERPROFILE\.ssh\trustcheck_hetzner" -r `
  .dockerignore, .env, .env.example, .gitignore, `
  Dockerfile, docker-compose.yml, nginx.conf, `
  next.config.js, package.json, package-lock.json, `
  postcss.config.js, tailwind.config.js, tsconfig.json, `
  app, components, lib, public `
  root@46.224.147.252:/opt/trustcheck/
```

**Option B: rsync (рекомендуется, быстрее)**
```powershell
# Установить rsync для Windows (если нет)
# choco install rsync

rsync -avz --progress -e "ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner" `
  --exclude 'node_modules' `
  --exclude '.next' `
  --exclude '.git' `
  E:\SBF/ root@46.224.147.252:/opt/trustcheck/
```

**Option C: Git (если репозиторий настроен)**
```bash
# На сервере
cd /opt/trustcheck
git pull origin main
```

### Step 3: Build на сервере (10 мин)

**3.1. Подключиться к серверу:**
```powershell
ssh -i "$env:USERPROFILE\.ssh\trustcheck_hetzner" root@46.224.147.252
```

**3.2. Установить зависимости:**
```bash
cd /opt/trustcheck
npm install --production
# Ожидается: ~5 минут, 711 пакетов
```

**3.3. Build Docker образов:**
```bash
docker compose build
# Ожидается: ~5-10 минут, образ ~150MB
```

**3.4. Проверить образы:**
```bash
docker images | grep trustcheck
# Должно показать:
# trustcheck-app         latest    xxx MB
# trustcheck-nginx       latest    xxx MB
```

### Step 4: Запуск сервисов (5 мин)

**4.1. Запустить контейнеры:**
```bash
docker compose up -d
# Ожидается: 2 контейнера (app, nginx) в статусе "Up"
```

**4.2. Проверить статус:**
```bash
docker compose ps
# NAME                COMMAND              SERVICE   STATUS
# trustcheck-app      "node server.js"     app       Up
# trustcheck-nginx    "nginx -g ..."       nginx     Up
```

**4.3. Проверить логи:**
```bash
docker compose logs -f app
# Ctrl+C для выхода
# Должно показать: "✓ Ready in X.Xs"
```

### Step 5: Тестирование на сервере (5 мин)

**5.1. Health check (внутренний):**
```bash
curl http://localhost:3000/api/health
# Ожидается: {"status":"healthy",...}
```

**5.2. NGINX проксирование:**
```bash
curl http://localhost/health
# Ожидается: OK
```

**5.3. Report generation (тест Gemini API):**
```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{"businessName":"מעון ילדים"}' | jq
# Ожидается: JSON с fullText (Hebrew report)
```

**5.4. Внешний доступ (из Windows):**
```powershell
# Из локального PowerShell
curl http://46.224.147.252
# Ожидается: HTML страница TrustCheck
```

### Step 6: SSL сертификат (15 мин)

**6.1. Остановить NGINX (для standalone mode):**
```bash
docker compose down nginx
```

**6.2. Получить сертификат:**
```bash
certbot certonly --standalone \
  -d trustcheck.co.il \
  -d www.trustcheck.co.il \
  --email YOUR_EMAIL@example.com \
  --agree-tos \
  --non-interactive

# Сертификаты сохранятся в:
# /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem
# /etc/letsencrypt/live/trustcheck.co.il/privkey.pem
```

**6.3. Скопировать сертификаты:**
```bash
mkdir -p /opt/trustcheck/ssl
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /opt/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /opt/trustcheck/ssl/
chmod 644 /opt/trustcheck/ssl/*.pem
```

**6.4. Запустить NGINX обратно:**
```bash
docker compose up -d nginx
```

**6.5. Проверить HTTPS:**
```bash
curl -I https://trustcheck.co.il
# Ожидается: HTTP/2 200
```

### Step 7: Auto-renewal SSL (5 мин)

**7.1. Создать cronjob:**
```bash
crontab -e
```

**7.2. Добавить строку:**
```cron
# Обновление SSL сертификата каждый месяц в 2:00 AM
0 2 1 * * certbot renew --quiet --deploy-hook "docker compose -f /opt/trustcheck/docker-compose.yml restart nginx"
```

### Step 8: Мониторинг (5 мин)

**8.1. Системные ресурсы:**
```bash
# CPU/RAM
htop

# Disk space
df -h

# Docker stats
docker stats
```

**8.2. Логи приложения:**
```bash
# Real-time logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Ошибки only
docker compose logs app | grep ERROR
```

**8.3. Hetzner Console:**
- https://console.hetzner.com/projects/12831241/servers
- Графики: CPU, RAM, Network, Disk I/O

---

## 🔍 Post-Deployment Verification

### Внешние тесты (из Windows)

**1. Home page:**
```powershell
curl https://trustcheck.co.il
# Должно вернуть HTML с "TrustCheck Israel"
```

**2. API Health:**
```powershell
Invoke-WebRequest -Uri https://trustcheck.co.il/api/health | ConvertFrom-Json
```

**3. Report Generation:**
```powershell
$body = '{"businessName":"גן ילדים שמש"}'
Invoke-WebRequest -Uri https://trustcheck.co.il/api/report `
  -Method POST -Body $body `
  -ContentType 'application/json; charset=utf-8' | 
  ConvertFrom-Json | Select-Object -ExpandProperty report | 
  Select-Object -ExpandProperty fullText
```

**4. SSL Certificate:**
```powershell
# Проверить SSL rating
# https://www.ssllabs.com/ssltest/analyze.html?d=trustcheck.co.il
```

### Браузерные тесты

**1. Desktop (Chrome/Firefox):**
- https://trustcheck.co.il
- Проверить Hebrew RTL layout
- Протестировать SearchForm
- Проверить console на ошибки (F12)

**2. Mobile (Device Toolbar F12):**
- iPhone 14 Pro Max (430px)
- Samsung Galaxy S21 (360px)
- iPad Pro (1024px)

**3. Lighthouse Audit:**
- F12 → Lighthouse → Generate report
- Target: >90 Performance, >90 Accessibility

---

## 🐛 Troubleshooting

### Проблема 1: Docker build fails
```bash
# Очистить кэш
docker system prune -a
docker compose build --no-cache
```

### Проблема 2: NGINX 502 Bad Gateway
```bash
# Проверить app контейнер
docker compose logs app

# Перезапустить
docker compose restart app nginx
```

### Проблема 3: SSL certificate fails
```bash
# Проверить DNS
dig trustcheck.co.il +short
# Должно вернуть: 46.224.147.252

# Проверить порт 80
sudo netstat -tulpn | grep :80
```

### Проблема 4: Gemini API 429
```bash
# Проверить логи
docker compose logs app | grep "Gemini API error"

# Fallback должен сработать автоматически
# Проверить mock данные работают:
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{"businessName":"test"}' | grep "Mock Data"
```

### Проблема 5: Out of memory
```bash
# Проверить использование
free -h

# Restart Docker
systemctl restart docker
docker compose up -d
```

---

## 📊 Success Metrics

### Критерии успешного deployment:

- [ ] ✅ Server responding on HTTPS
- [ ] ✅ SSL certificate valid (A+ rating)
- [ ] ✅ Health check returns 200
- [ ] ✅ Report generation works (real Gemini API)
- [ ] ✅ Hebrew RTL layout корректный
- [ ] ✅ Mobile responsive работает
- [ ] ✅ Lighthouse score >90
- [ ] ✅ No console errors
- [ ] ✅ Docker containers stable (no restarts)
- [ ] ✅ Server resources <50% usage

### Performance Targets:

- Page Load Time: **<3 seconds**
- API Response Time: **<5 seconds**
- Time to Interactive: **<4 seconds**
- CPU Usage: **<30%**
- RAM Usage: **<2GB**

---

## 🎯 Next Steps After Deployment

### Phase 2 Tasks:
1. **Real CheckID API integration** (заменить mock в lib/checkid.ts)
2. **Stripe payment flow** (checkout + webhooks)
3. **Supabase database** (users, checks, reports tables)
4. **Analytics setup** (Google Analytics 4, Sentry)
5. **User authentication** (NextAuth.js)
6. **Russian language support** (i18n)
7. **PDF export** (react-pdf)
8. **Rate limiting** (10 checks/minute per user)

### Marketing Launch:
1. SEO optimization
2. Google Ads campaign
3. Social media announcements
4. Israel-Mama forum post
5. Press release (Hebrew/Russian media)

---

**Estimated Total Deployment Time:** ~60 minutes  
**Server Cost:** €2.99/month (~₪11)  
**Gemini API Cost:** ~$0.64/month (~₪2.30)  
**Total Monthly Cost:** ~₪13.30

**Status:** Ready to deploy! 🚀
