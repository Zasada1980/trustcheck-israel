# DNS Configuration Checklist - TrustCheck Israel

## ⚠️ Требуется действие пользователя

DNS настройка требует доступа к панели управления доменом `trustcheck.co.il`.

---

## 🔍 Шаг 1: Определить где зарегистрирован домен

### Проверить WHOIS:
```bash
whois trustcheck.co.il
```

**Найди в выводе:**
- **Registrar:** (GoDaddy / Namecheap / Domain.co.il / etc.)
- **Name Server:** (ns1.xxx.com, ns2.xxx.com)

### Или используй онлайн:
- https://who.is/whois/trustcheck.co.il
- https://www.whois.com/whois/trustcheck.co.il

---

## 📝 Шаг 2: Войти в панель управления доменом

### Популярные registrars в Израиле:

#### **Domain.co.il** (israeli domain registrar)
1. Зайди на https://www.domain.co.il/
2. Login → Мой Аккаунт
3. Мои домены → trustcheck.co.il → Управление DNS

#### **GoDaddy**
1. https://www.godaddy.com/
2. My Products → Domains → trustcheck.co.il → DNS

#### **Cloudflare**
1. https://dash.cloudflare.com/
2. Select trustcheck.co.il → DNS → Records

#### **Namecheap**
1. https://www.namecheap.com/
2. Domain List → trustcheck.co.il → Manage → Advanced DNS

---

## ⚙️ Шаг 3: Добавить DNS записи

### Записи для добавления:

| Тип | Имя/Host | Значение/Value | TTL |
|-----|----------|----------------|-----|
| A   | @        | 46.224.147.252 | 300 |
| A   | www      | 46.224.147.252 | 300 |

### Визуальная инструкция (для каждого registrar):

#### **Domain.co.il:**
```
1. DNS Records → Add Record
2. Type: A
3. Host: @ (оставить пустым)
4. Points to: 46.224.147.252
5. TTL: 300
6. Save

7. Add Record (повторить)
8. Type: A
9. Host: www
10. Points to: 46.224.147.252
11. TTL: 300
12. Save
```

#### **GoDaddy:**
```
1. DNS Management → Add Record
2. Type: A
3. Name: @ 
4. Value: 46.224.147.252
5. TTL: Custom → 300 seconds
6. Save

(Repeat for www)
```

#### **Cloudflare:**
```
1. DNS → Add record
2. Type: A
3. Name: @ (or root)
4. IPv4 address: 46.224.147.252
5. Proxy status: DNS only (grey cloud, NOT orange)
6. TTL: Auto
7. Save

(Repeat for www)
```

---

## ✅ Шаг 4: Проверить изменения

### Сразу после добавления:
```powershell
# Windows PowerShell
Resolve-DnsName -Name trustcheck.co.il -Server 8.8.8.8
```

**Ожидаемый вывод (через 5-30 минут):**
```
Name                                           Type   TTL   Section    IPAddress
----                                           ----   ---   -------    ---------
trustcheck.co.il                               A      300   Answer     46.224.147.252
```

### Проверить с разных DNS:
```powershell
# Google DNS
nslookup trustcheck.co.il 8.8.8.8

# Cloudflare DNS
nslookup trustcheck.co.il 1.1.1.1

# OpenDNS
nslookup trustcheck.co.il 208.67.222.222
```

### Проверить глобальное распространение:
- https://www.whatsmydns.net/#A/trustcheck.co.il
- Должно показать **46.224.147.252** из разных стран

---

## ⏱️ Шаг 5: Дождаться propagation

**Типичное время:**
- TTL 300: ~5-30 минут
- TTL 3600: ~1-2 часа
- Максимум: 24-48 часов (редко)

**Как проверить готовность:**
```powershell
# Каждые 60 секунд проверять
while ($true) {
  $result = Resolve-DnsName trustcheck.co.il -Server 8.8.8.8 -ErrorAction SilentlyContinue
  if ($result.IPAddress -eq "46.224.147.252") {
    Write-Host "✅ DNS propagated! IP: $($result.IPAddress)" -ForegroundColor Green
    break
  } else {
    Write-Host "⏳ Waiting... Current IP: $($result.IPAddress)" -ForegroundColor Yellow
  }
  Start-Sleep -Seconds 60
}
```

---

## 🌐 Шаг 6: Проверить доступность сайта

### Из браузера:
```
http://trustcheck.co.il
http://www.trustcheck.co.il
```

**Должно открыться:** TrustCheck Israel landing page

### Из командной строки:
```powershell
Invoke-WebRequest -Uri http://trustcheck.co.il -Method HEAD
```

**Ожидаемый вывод:**
```
StatusCode        : 200
StatusDescription : OK
```

---

## 📋 После успешной настройки DNS

### Уведоми агента:
```
"DNS настроен, trustcheck.co.il указывает на 46.224.147.252"
```

### Агент автоматически выполнит:
1. ✅ SSL certificate с Let's Encrypt
2. ✅ Обновление NGINX config для HTTPS
3. ✅ Редирект HTTP → HTTPS
4. ✅ Auto-renewal настройка

---

## ❌ Troubleshooting

### Проблема: "DNS не обновляется через 2 часа"

**Решение:**
1. Проверь старый IP:
   ```powershell
   nslookup trustcheck.co.il
   ```
2. Если показывает старый IP — проверь TTL старой записи:
   ```powershell
   Resolve-DnsName trustcheck.co.il -Server 8.8.8.8 | Select Name, TTL
   ```
3. Дождись истечения TTL (может быть 86400 = 24 часа)

### Проблема: "Registrar не даёт изменить DNS"

**Решение:**
1. Проверь статус домена (не expired, не locked)
2. Проверь что ты Owner (не только Admin contact)
3. Некоторые registrars требуют email verification перед изменениями

### Проблема: "Показывает 404 Not Found"

**Решение:**
1. DNS настроен правильно (видишь TrustCheck?)
2. Но контент не тот — это OK для MVP
3. Проверь что NGINX работает:
   ```powershell
   Invoke-WebRequest -Uri http://trustcheck.co.il/api/health
   ```

---

## 📞 Нужна помощь?

**Если застрял:**
1. Скриншот DNS панели (закрась sensitive data)
2. Вывод команды: `nslookup trustcheck.co.il`
3. Сообщи агенту: "DNS не работает, вот что вижу: [screenshots]"

---

**Current Status:** ⏳ Ожидает действия пользователя (доступ к domain registrar)

**Next Step:** После настройки DNS → SSL Certificate (автоматически)
