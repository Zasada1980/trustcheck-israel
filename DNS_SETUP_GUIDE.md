# TrustCheck Israel - DNS Setup Guide

**Цель:** Настроить домен trustcheck.co.il для работы с Hetzner сервером (46.224.147.252)

---

## 📋 Что нужно сделать

### Шаг 1: Проверить владение доменом

```bash
# Проверить текущие DNS записи
whois trustcheck.co.il

# Проверить где управляется DNS
nslookup trustcheck.co.il

# Проверить текущий IP
dig trustcheck.co.il +short
```

**Ожидаемый результат:**
- Домен зарегистрирован
- Есть доступ к DNS control panel (GoDaddy/Cloudflare/Hetzner DNS)

---

### Шаг 2: Настроить DNS записи

#### A Record (IPv4):
```
Тип: A
Имя: @
Значение: 46.224.147.252
TTL: 300 (5 минут для тестирования, потом 3600)
```

#### A Record для www:
```
Тип: A
Имя: www
Значение: 46.224.147.252
TTL: 300
```

**Альтернатива (CNAME для www):**
```
Тип: CNAME
Имя: www
Значение: trustcheck.co.il
TTL: 300
```

---

### Шаг 3: Дождаться DNS propagation

```bash
# Проверить распространение DNS (каждые 30 секунд)
watch -n 30 'dig trustcheck.co.il +short'

# Проверить с разных DNS серверов
dig @8.8.8.8 trustcheck.co.il +short        # Google DNS
dig @1.1.1.1 trustcheck.co.il +short        # Cloudflare DNS
dig @208.67.222.222 trustcheck.co.il +short # OpenDNS

# Проверить из России/Израиля
curl -s https://www.whatsmydns.net/api/details?server=world&type=A&query=trustcheck.co.il | jq
```

**Время распространения:**
- Минимум: 5-30 минут (если TTL низкий)
- Обычно: 2-4 часа
- Максимум: 48 часов (если старый TTL был высокий)

---

### Шаг 4: Проверить доступность сайта

```bash
# Проверить HTTP доступ
curl -I http://trustcheck.co.il
curl -I http://www.trustcheck.co.il

# Проверить из браузера
# Windows: Win+R → chrome.exe --new-window http://trustcheck.co.il
# Mac: open -a "Google Chrome" http://trustcheck.co.il

# Проверить из Израиля (VPN или онлайн-сервис)
# https://www.host-tracker.com/
```

**Ожидаемый результат:**
```
HTTP/1.1 200 OK
Server: nginx/1.24.0
```

---

## 🔐 Шаг 5: Получить SSL сертификат (Let's Encrypt)

**После того как DNS работает:**

### 5.1. Остановить NGINX (нужен порт 80 для certbot)

```bash
ssh -i ~/.ssh/trustcheck_hetzner root@46.224.147.252

cd /opt/trustcheck
docker compose down nginx
```

### 5.2. Запустить certbot в standalone mode

```bash
# Установить certbot (если не установлен)
apt update && apt install -y certbot

# Получить сертификат
certbot certonly --standalone \
  -d trustcheck.co.il \
  -d www.trustcheck.co.il \
  --email admin@trustcheck.co.il \
  --agree-tos \
  --non-interactive

# Проверить что сертификат создан
ls -la /etc/letsencrypt/live/trustcheck.co.il/
```

**Ожидаемый output:**
```
Congratulations! Your certificate and chain have been saved at:
/etc/letsencrypt/live/trustcheck.co.il/fullchain.pem
Your key file has been saved at:
/etc/letsencrypt/live/trustcheck.co.il/privkey.pem
```

### 5.3. Скопировать сертификаты в проект

```bash
# Создать директорию ssl
mkdir -p /opt/trustcheck/ssl

# Скопировать сертификаты
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /opt/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /opt/trustcheck/ssl/

# Установить права
chmod 644 /opt/trustcheck/ssl/*.pem
```

### 5.4. Обновить docker-compose.yml

**На сервере:**
```bash
cd /opt/trustcheck
nano docker-compose.yml
```

**Изменить:**
```yaml
# FROM:
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro

# TO:
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro  # Используем nginx.conf с SSL
```

**ВАЖНО:** Убедиться что используется `nginx.conf` (с SSL), а не `nginx.simple.conf`!

### 5.5. Перезапустить NGINX с SSL

```bash
docker compose up -d nginx

# Проверить логи
docker compose logs nginx

# Проверить что HTTPS работает
curl -I https://trustcheck.co.il
```

**Ожидаемый результат:**
```
HTTP/2 200
server: nginx/1.24.0
strict-transport-security: max-age=31536000; includeSubDomains
```

---

## 🔄 Шаг 6: Настроить автоматическое обновление SSL

### 6.1. Создать renewal hook

```bash
nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

**Содержимое:**
```bash
#!/bin/bash
# Reload NGINX after certificate renewal

# Copy new certificates
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /opt/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /opt/trustcheck/ssl/

# Reload NGINX (without downtime)
cd /opt/trustcheck
docker compose exec nginx nginx -s reload

echo "$(date): SSL certificates renewed and NGINX reloaded" >> /var/log/ssl-renewal.log
```

**Сделать исполняемым:**
```bash
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### 6.2. Настроить cron job для автоматического renewal

```bash
crontab -e
```

**Добавить:**
```cron
# SSL Certificate Auto-Renewal (проверка каждый день в 2:30 AM)
30 2 * * * certbot renew --quiet --deploy-hook "/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
```

**Проверить cron:**
```bash
crontab -l
```

### 6.3. Протестировать renewal (dry-run)

```bash
certbot renew --dry-run
```

**Ожидаемый результат:**
```
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem (success)
```

---

## ✅ Checklist финальной проверки

### DNS:
- [ ] `dig trustcheck.co.il +short` → 46.224.147.252
- [ ] `dig www.trustcheck.co.il +short` → 46.224.147.252
- [ ] Доступ из разных стран (проверить whatsmydns.net)

### HTTP:
- [ ] `curl http://trustcheck.co.il` → перенаправляет на HTTPS
- [ ] `curl http://www.trustcheck.co.il` → перенаправляет на HTTPS

### HTTPS:
- [ ] `curl -I https://trustcheck.co.il` → HTTP/2 200
- [ ] `curl -I https://www.trustcheck.co.il` → HTTP/2 200
- [ ] SSL Labs test (https://www.ssllabs.com/ssltest/analyze.html?d=trustcheck.co.il) → A+

### Браузер:
- [ ] Открыть https://trustcheck.co.il в Chrome
- [ ] Проверить "зелёный замок" (Valid Certificate)
- [ ] Проверить что нет browser warnings
- [ ] Проверить на мобильном (iOS Safari, Android Chrome)

### Auto-Renewal:
- [ ] `certbot renew --dry-run` → success
- [ ] `crontab -l` → cron job настроен
- [ ] `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` → исполняемый

---

## 🚨 Troubleshooting

### Проблема: DNS не обновляется

**Решение:**
```bash
# 1. Проверить TTL старой записи
dig trustcheck.co.il | grep "^trustcheck.co.il"

# 2. Подождать TTL × 2 (например, 3600s = 2 часа)

# 3. Очистить локальный DNS cache
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache

# Linux:
sudo systemd-resolve --flush-caches
```

---

### Проблема: Certbot ошибка "Port 80 already in use"

**Решение:**
```bash
# Остановить все контейнеры
docker compose down

# Проверить что порт 80 свободен
netstat -tulpn | grep :80

# Если занят другим процессом:
lsof -i :80
kill -9 <PID>

# Запустить certbot снова
certbot certonly --standalone -d trustcheck.co.il
```

---

### Проблема: NGINX не запускается после SSL

**Решение:**
```bash
# Проверить конфигурацию NGINX
docker compose exec nginx nginx -t

# Проверить что сертификаты существуют
ls -la /opt/trustcheck/ssl/

# Проверить логи
docker compose logs nginx

# Если ошибка "ssl_certificate" - проверить пути в nginx.conf
```

---

### Проблема: Browser показывает "Certificate not valid"

**Причины:**
1. DNS ещё не обновился (подождать)
2. Сертификат для другого домена (проверить `-d` в certbot)
3. Часы на сервере неправильные (проверить `date`)

**Решение:**
```bash
# Проверить дату/время
date

# Если неправильно:
timedatectl set-ntp true

# Пересоздать сертификат
certbot delete --cert-name trustcheck.co.il
certbot certonly --standalone -d trustcheck.co.il -d www.trustcheck.co.il
```

---

## 📞 Контакты для помощи

**DNS Provider Support:**
- GoDaddy: https://www.godaddy.com/help
- Cloudflare: https://support.cloudflare.com/
- Hetzner DNS: https://docs.hetzner.com/dns-console/

**Let's Encrypt Community:**
- Forum: https://community.letsencrypt.org/
- Docs: https://letsencrypt.org/docs/

**TrustCheck Team:**
- Email: admin@trustcheck.co.il
- Slack: #ops-channel

---

**Документ обновлён:** 22.12.2025  
**Следующая проверка:** После DNS setup (Expected: 1 час)
