# DNS Configuration for trustcheck.co.il

**Date:** 25.12.2025  
**Server IP:** 46.224.147.252 (Hetzner CX23)  
**Registrar:** (Указать где купил домен - GoDaddy/Namecheap/другой)

## DNS Records Required

### 1. A Records (IPv4)
```
Type    Name    Value               TTL
A       @       46.224.147.252      3600
A       www     46.224.147.252      3600
```

### 2. Optional: AAAA Records (IPv6)
Если у Hetzner сервера есть IPv6 адрес, добавь:
```
AAAA    @       [IPv6-адрес]       3600
AAAA    www     [IPv6-адрес]       3600
```

### 3. CAA Records (SSL Security)
```
CAA     @       0 issue "letsencrypt.org"
```

## Step-by-Step Configuration

### Option A: У регистратора (Recommended)
1. Зайди в панель управления доменом trustcheck.co.il
2. Найди раздел "DNS Settings" или "DNS Management"
3. Добавь записи из таблицы выше
4. Сохрани изменения

### Option B: Cloudflare (Better Performance + DDoS Protection)
1. Создай аккаунт на cloudflare.com
2. Добавь сайт trustcheck.co.il
3. Cloudflare даст 2 nameserver адреса (ns1.cloudflare.com, ns2.cloudflare.com)
4. У регистратора измени NS записи на Cloudflare
5. В Cloudflare добавь DNS записи:
   - A @ 46.224.147.252 (Proxy enabled - оранжевое облако)
   - A www 46.224.147.252 (Proxy enabled)

**Cloudflare преимущества:**
- ✅ CDN (ускорение загрузки)
- ✅ DDoS защита (бесплатно)
- ✅ Автоматический SSL (Let's Encrypt)
- ✅ Аналитика трафика
- ✅ Page Rules для редиректов

## SSL Certificate Setup

### Current Status
Сейчас сайт работает через HTTP (незащищённый).

### Enable HTTPS on Server

#### Method 1: Certbot (Let's Encrypt)
```bash
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Install Certbot
apt update
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d trustcheck.co.il -d www.trustcheck.co.il

# Auto-renewal (already configured by certbot)
systemctl status certbot.timer
```

#### Method 2: Cloudflare SSL (Easier)
1. В Cloudflare: SSL/TLS → Full (strict)
2. Origin Server → Create Certificate
3. Скопируй сертификат и приватный ключ
4. На сервере сохрани в `/root/trustcheck/ssl/`
5. Обнови nginx.conf:
```nginx
ssl_certificate /root/trustcheck/ssl/cloudflare.pem;
ssl_certificate_key /root/trustcheck/ssl/cloudflare.key;
```

## Verification Commands

### Check DNS Propagation
```powershell
# Windows
nslookup trustcheck.co.il
nslookup www.trustcheck.co.il

# Check from multiple locations
# https://dnschecker.org/#A/trustcheck.co.il
```

### Test HTTPS
```bash
curl -I https://trustcheck.co.il
curl -I https://www.trustcheck.co.il
```

### SSL Certificate Info
```bash
openssl s_client -connect trustcheck.co.il:443 -servername trustcheck.co.il
```

## Expected Timeline

- **DNS Propagation:** 15 minutes - 48 hours (обычно 1-2 часа)
- **SSL Setup:** 5 minutes (Certbot) или 2 minutes (Cloudflare)

## Nginx Configuration Update

После настройки DNS обнови nginx.conf:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name trustcheck.co.il www.trustcheck.co.il;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name trustcheck.co.il www.trustcheck.co.il;

    ssl_certificate /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trustcheck.co.il/privkey.pem;
    
    # ... остальная конфигурация
}
```

## Troubleshooting

### DNS не резолвится
```bash
# Проверь NS записи
dig trustcheck.co.il NS

# Проверь A записи
dig trustcheck.co.il A
```

### SSL ошибка
```bash
# Проверь права на сертификат
ls -la /etc/letsencrypt/live/trustcheck.co.il/

# Перезапусти nginx
docker exec trustcheck-nginx nginx -t
docker restart trustcheck-nginx
```

## Next Steps After DNS

1. ✅ Проверь сайт: https://trustcheck.co.il
2. ✅ Обнови Google Analytics: NEXT_PUBLIC_APP_URL=https://trustcheck.co.il
3. ✅ Обнови sitemap.xml с новым доменом
4. ✅ Добавь домен в Google Search Console
5. ✅ Настрой redirects с www на без www (или наоборот)

## Security Checklist

- [ ] SSL/TLS certificate активен
- [ ] HTTP → HTTPS redirect работает
- [ ] Security headers настроены (HSTS, CSP)
- [ ] CAA records добавлены
- [ ] Cloudflare DDoS protection включен (если используется)

---

**Status:** Waiting for DNS configuration  
**Contact:** APIsupport@taxes.gov.il (для Tax Authority API access)
