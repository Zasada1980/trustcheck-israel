# 🚀 DNS Configuration Instructions for trustcheck.co.il

**Date:** 25.12.2025  
**Domain:** trustcheck.co.il  
**Server IP:** 46.224.147.252 (Hetzner CX23)  
**Status:** Ready to configure

---

## ✅ STEP 1: Login to Domain Registrar

Где купил домен trustcheck.co.il? Обычно это:
- **domains.co.il** (Isoc)
- **Namecheap**
- **GoDaddy**
- **Register.com**

1. Открой сайт регистратора
2. Войди в аккаунт
3. Найди: "Manage DNS" или "DNS Settings" или "Nameservers"

---

## 📝 STEP 2A: Configure DNS Records (Basic Setup)

**Если НЕ используешь Cloudflare** — добавь эти записи:

```dns
Type    Name    Value                   TTL     Priority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A       @       46.224.147.252          3600    -
A       www     46.224.147.252          3600    -
CAA     @       0 issue "letsencrypt.org"  3600  -
```

**Объяснение:**
- `@` — это сам домен trustcheck.co.il
- `www` — это www.trustcheck.co.il
- `CAA` — разрешает Let's Encrypt выдавать SSL сертификаты

**⏱️ Ожидание:** DNS propagation займёт **15 минут - 2 часа**

---

## 📝 STEP 2B: Configure DNS via Cloudflare (RECOMMENDED)

**Зачем Cloudflare?**
- ✅ Бесплатный SSL сертификат (автоматически)
- ✅ CDN (ускорение загрузки сайта)
- ✅ DDoS защита
- ✅ Аналитика трафика
- ✅ Page Rules (редиректы, кэширование)

### Шаги:

1. **Зарегистрируйся на Cloudflare:**
   - Открой: https://dash.cloudflare.com/sign-up
   - Email + пароль
   - Подтверди email

2. **Добавь домен:**
   - Нажми: "Add a Site"
   - Введи: trustcheck.co.il
   - Выбери план: **Free** (достаточно для MVP)

3. **Cloudflare покажет DNS записи:**
   ```
   Cloudflare Nameservers:
   abe.ns.cloudflare.com
   june.ns.cloudflare.com
   ```
   (Твои nameservers будут другие — запиши их!)

4. **Вернись к регистратору домена:**
   - Найди: "Change Nameservers" или "Custom DNS"
   - Удали старые nameservers
   - Вставь Cloudflare nameservers (2 штуки)
   - Сохрани

5. **Вернись в Cloudflare:**
   - Подожди 5-10 минут
   - Cloudflare проверит и скажет: "Great news! Cloudflare is now protecting your site"

6. **Добавь DNS записи в Cloudflare:**
   ```dns
   Type    Name    Content             Proxy   TTL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   A       @       46.224.147.252      ✅ ON   Auto
   A       www     46.224.147.252      ✅ ON   Auto
   ```
   
   **ВАЖНО:** Включи оранжевое облако (Proxy ON) — это активирует CDN + DDoS защиту

7. **SSL настройки в Cloudflare:**
   - Перейди: SSL/TLS → Overview
   - Выбери: **Full (strict)** ← ВАЖНО!
   - Это работает ПОСЛЕ настройки SSL на сервере (см. STEP 3)

---

## 🔒 STEP 3: Enable HTTPS on Server (Let's Encrypt)

**Подключись к серверу:**

```powershell
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252
```

### Option A: Automatic SSL with Certbot (RECOMMENDED)

```bash
# 1. Install Certbot
apt update
apt install -y certbot python3-certbot-nginx

# 2. Get SSL certificate (если НЕ используешь Cloudflare Proxy)
certbot --nginx -d trustcheck.co.il -d www.trustcheck.co.il

# 3. Certbot автоматически:
#    - Создаст SSL сертификат
#    - Обновит nginx конфиг
#    - Настроит auto-renewal (cron job)

# 4. Test auto-renewal
certbot renew --dry-run
```

**Certbot задаст вопросы:**
```
Email: [твой email для уведомлений о продлении]
Agree to terms: Yes
Share email with EFF: No (опционально)
Redirect HTTP to HTTPS: Yes (ВАЖНО!)
```

**Результат:** Сайт сразу заработает на HTTPS! 🎉

---

### Option B: Manual Nginx Configuration

Если Certbot не сработал, настрой вручную:

```bash
# 1. Создай новый конфиг для trustcheck.co.il
nano /etc/nginx/sites-available/trustcheck.conf
```

**Вставь этот конфиг:**

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name trustcheck.co.il www.trustcheck.co.il;
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trustcheck.co.il www.trustcheck.co.il;

    # SSL certificates (после получения от Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trustcheck.co.il/privkey.pem;
    
    # SSL settings (современные, безопасные)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/trustcheck_access.log;
    error_log /var/log/nginx/trustcheck_error.log;
    
    # Proxy to Next.js app (Docker container)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Next.js static files (_next/static/)
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Favicon, robots.txt
    location ~* \.(ico|txt)$ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

```bash
# 2. Активируй конфиг
ln -s /etc/nginx/sites-available/trustcheck.conf /etc/nginx/sites-enabled/

# 3. Удали дефолтный конфиг (если мешает)
rm /etc/nginx/sites-enabled/default

# 4. Проверь конфиг (ВАЖНО!)
nginx -t

# 5. Перезагрузи Nginx
systemctl reload nginx
```

---

### Option C: Cloudflare SSL (если используешь Cloudflare Proxy)

**Если включил оранжевое облако в Cloudflare:**

1. **В Cloudflare:**
   - SSL/TLS → Overview
   - Выбери: **Flexible** (для начала)
   - Это даст HTTPS сразу, БЕЗ настройки на сервере

2. **Потом (для безопасности) переключись на Full (strict):**
   - Получи **Origin Certificate** от Cloudflare:
     - SSL/TLS → Origin Server → Create Certificate
     - 15 years validity
     - Скопируй Certificate и Private Key
   
   - На сервере создай файлы:
     ```bash
     mkdir -p /etc/ssl/cloudflare
     nano /etc/ssl/cloudflare/trustcheck.pem  # Вставь Certificate
     nano /etc/ssl/cloudflare/trustcheck.key  # Вставь Private Key
     chmod 600 /etc/ssl/cloudflare/trustcheck.key
     ```
   
   - Обнови nginx конфиг:
     ```nginx
     ssl_certificate /etc/ssl/cloudflare/trustcheck.pem;
     ssl_certificate_key /etc/ssl/cloudflare/trustcheck.key;
     ```
   
   - Перезагрузи Nginx: `systemctl reload nginx`
   
   - В Cloudflare переключи: **Full (strict)**

---

## ✅ STEP 4: Verify Everything Works

### 4.1. Check DNS Propagation

**Windows PowerShell:**
```powershell
# Проверь A record
nslookup trustcheck.co.il

# Должно вернуть:
# Address: 46.224.147.252

# Проверь www
nslookup www.trustcheck.co.il

# Тоже должно быть: 46.224.147.252
```

**Online checker:**
- https://dnschecker.org/
- Введи: trustcheck.co.il
- Тип: A
- Проверь разные локации (должны показать 46.224.147.252)

---

### 4.2. Check HTTP/HTTPS Access

```powershell
# Проверь HTTP (должен редиректить на HTTPS)
curl -I http://trustcheck.co.il

# Должно быть: HTTP/1.1 301 Moved Permanently
# Location: https://trustcheck.co.il/

# Проверь HTTPS
curl -I https://trustcheck.co.il

# Должно быть: HTTP/2 200 OK
```

**Браузер:**
- Открой: https://trustcheck.co.il
- Должен показать сайт с 🔒 зелёным замочком
- Проверь сертификат:
  - Click 🔒 → Certificate → Details
  - Issuer: Let's Encrypt (или Cloudflare)
  - Valid: да
  - Expires: через 90 дней (Let's Encrypt) или 15 лет (Cloudflare Origin)

---

### 4.3. Check SSL Security

**SSL Labs Test:**
- Открой: https://www.ssllabs.com/ssltest/
- Введи: trustcheck.co.il
- Жди 2-3 минуты
- **Цель:** Grade A или A+

**Если Grade ниже A:**
- Проверь TLS версии (должны быть TLSv1.2, TLSv1.3)
- Проверь ciphers (современные, без SHA1)
- Добавь HSTS header (уже есть в конфиге выше)

---

### 4.4. Check Google Search Console (опционально, но полезно)

1. Открой: https://search.google.com/search-console
2. Add Property: trustcheck.co.il
3. Verify ownership (через DNS TXT record или HTML file)
4. Submit sitemap: https://trustcheck.co.il/sitemap.xml

---

## 🔄 STEP 5: Update Environment Variables (если нужно)

Если в коде есть `NEXT_PUBLIC_APP_URL`:

```bash
# На сервере
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Обнови .env файл
cd /root/trustcheck
nano .env

# Измени:
NEXT_PUBLIC_APP_URL=https://trustcheck.co.il

# Пересобери контейнеры
docker-compose down
docker-compose up -d --build

# Проверь логи
docker-compose logs -f app
```

---

## 📊 STEP 6: Configure Analytics (GA4)

**Если ещё не настроил Google Analytics:**

1. **Создай GA4 Property:**
   - https://analytics.google.com/
   - Admin → Create Property
   - Property name: TrustCheck Israel
   - Time zone: (GMT+02:00) Jerusalem
   - Currency: ILS (Israeli Shekel)

2. **Get Measurement ID:**
   - Admin → Data Streams → Add stream
   - Web → https://trustcheck.co.il
   - Copy: G-XXXXXXXXXX

3. **Update .env on server:**
   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

4. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Test GA4:**
   - Открой: https://trustcheck.co.il
   - В GA4 → Reports → Realtime
   - Должен показать 1 active user (ты!)

---

## 🛡️ STEP 7: Security Checklist

После настройки DNS проверь безопасность:

### 7.1. Firewall (UFW)

```bash
# Проверь открытые порты
ufw status

# Должны быть открыты ТОЛЬКО:
# 22/tcp (SSH)
# 80/tcp (HTTP - для Let's Encrypt)
# 443/tcp (HTTPS)
# 5432/tcp (PostgreSQL) - только для localhost!

# Если PostgreSQL открыт наружу:
ufw deny 5432
ufw reload
```

---

### 7.2. Docker Security

```bash
# Проверь, что PostgreSQL НЕ доступен снаружи
docker ps | grep postgres

# Должно быть: 127.0.0.1:5432->5432/tcp
# НЕ должно быть: 0.0.0.0:5432->5432/tcp

# Если 0.0.0.0 - СРОЧНО исправь docker-compose.yml:
# ports:
#   - "127.0.0.1:5432:5432"  # ← ПРАВИЛЬНО (только localhost)
```

---

### 7.3. Nginx Security Headers

Проверь, что headers работают:

```powershell
curl -I https://trustcheck.co.il
```

Должны быть:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

---

### 7.4. Backup SSL Certificates

```bash
# Сделай backup сертификатов
tar -czf /root/ssl_backup_$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Скачай на локальный комп (опционально)
# В PowerShell на твоём компе:
# scp -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252:/root/ssl_backup_*.tar.gz E:\SBF\backups\
```

---

## 🎉 SUCCESS CHECKLIST

После выполнения всех шагов проверь:

- [ ] `nslookup trustcheck.co.il` → 46.224.147.252
- [ ] `nslookup www.trustcheck.co.il` → 46.224.147.252
- [ ] https://trustcheck.co.il открывается без ошибок
- [ ] 🔒 Зелёный замочек в браузере
- [ ] http://trustcheck.co.il редиректит на https://
- [ ] SSL Labs Grade A или A+
- [ ] GA4 показывает realtime visitors
- [ ] PostgreSQL НЕ доступен снаружи (только 127.0.0.1)
- [ ] Firewall открыт только для 22, 80, 443

---

## 🐛 TROUBLESHOOTING

### Problem 1: DNS не резолвится (nslookup fails)

**Решение:**
1. Подожди 2 часа (DNS propagation)
2. Проверь на https://dnschecker.org/
3. Убедись, что в регистраторе сохранил изменения
4. Если используешь Cloudflare - проверь, что nameservers изменены

---

### Problem 2: SSL certificate error "NET::ERR_CERT_COMMON_NAME_INVALID"

**Решение:**
1. Проверь, что Certbot выдал сертификат для ОБОИХ доменов:
   ```bash
   certbot certificates
   # Должно быть: trustcheck.co.il, www.trustcheck.co.il
   ```

2. Если нет - перевыпусти:
   ```bash
   certbot delete --cert-name trustcheck.co.il
   certbot --nginx -d trustcheck.co.il -d www.trustcheck.co.il
   ```

---

### Problem 3: "502 Bad Gateway" на https://trustcheck.co.il

**Решение:**
1. Проверь, что Next.js контейнер работает:
   ```bash
   docker ps | grep trustcheck-app
   docker logs trustcheck-app
   ```

2. Проверь, что Nginx проксирует на правильный порт:
   ```bash
   curl http://localhost:3000  # Должен вернуть HTML
   ```

3. Перезагрузи Nginx:
   ```bash
   systemctl reload nginx
   ```

---

### Problem 4: Cloudflare "Too many redirects" (redirect loop)

**Решение:**
- В Cloudflare: SSL/TLS → Overview
- Измени с **Flexible** на **Full**
- Подожди 1-2 минуты
- Очисти кэш браузера (Ctrl+Shift+Del)

---

### Problem 5: Let's Encrypt rate limit exceeded

**Решение:**
- Let's Encrypt лимит: 5 сертификатов за 7 дней на домен
- Если превысил - жди 7 дней ИЛИ используй Cloudflare Origin Certificate (см. Option C)

---

## 📞 SUPPORT CONTACTS

**Hetzner Cloud:**
- Support: https://console.hetzner.cloud/ → Support
- Docs: https://docs.hetzner.com/

**Let's Encrypt:**
- Forum: https://community.letsencrypt.org/

**Cloudflare:**
- Support: https://dash.cloudflare.com/ → Support
- Community: https://community.cloudflare.com/

**DNS Registrar:**
- Зависит от того, где купил домен (domains.co.il, Namecheap, etc.)

---

## 🚀 NEXT STEPS AFTER DNS

После успешной настройки DNS и HTTPS:

1. ✅ **Обнови `copilot-instructions.md`:**
   ```markdown
   **Production URL:** https://trustcheck.co.il
   ```

2. ✅ **Обнови PWA manifest:**
   ```json
   {
     "start_url": "https://trustcheck.co.il",
     "scope": "https://trustcheck.co.il/"
   }
   ```

3. ✅ **Создай sitemap.xml:**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://trustcheck.co.il/</loc>
       <priority>1.0</priority>
     </url>
   </urlset>
   ```

4. ✅ **Добавь robots.txt:**
   ```
   User-agent: *
   Allow: /
   Sitemap: https://trustcheck.co.il/sitemap.xml
   ```

5. ✅ **Запусти Lighthouse audit:**
   - Chrome DevTools → Lighthouse
   - Цель: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO

6. ✅ **Анонсируй Beta:**
   - Пост в соцсетях (LinkedIn, Facebook groups для родителей)
   - Email друзьям/семье: "Попробуйте проверить бизнес перед оплатой"

---

**DNS Configuration Complete! 🎉**

**Estimated Time:** 2-3 hours (включая DNS propagation)

Good luck! 🍀
