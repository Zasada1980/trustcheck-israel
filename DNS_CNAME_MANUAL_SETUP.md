# ДИАГНОСТИКА: DNS CNAME не создались автоматически

**Проблема:** После добавления Public Hostname в tunnel, DNS CNAME записи не создались автоматически.

**Статус:**
- ✅ Tunnel HEALTHY (4 соединения)
- ✅ Config.yml настроен (trustcheck.co.il + www)
- ✅ Public Hostname добавлены в Dashboard
- ❌ DNS CNAME не созданы (nslookup возвращает Non-existent domain)

---

## РЕШЕНИЕ: Создать CNAME вручную

### Вариант 1: Через Cloudflare Dashboard (РЕКОМЕНДУЕТСЯ)

1. **Открой DNS управление:**
   https://dash.cloudflare.com/20f5ee00fbbdf9c8b779161ea33c21cb/trustcheck.co.il/dns

2. **Добавь CNAME запись #1:**
   ```
   Type: CNAME
   Name: @
   Target: e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4.cfargotunnel.com
   Proxy status: Proxied (оранжевое облако)
   TTL: Auto
   ```

3. **Добавь CNAME запись #2:**
   ```
   Type: CNAME
   Name: www
   Target: e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4.cfargotunnel.com
   Proxy status: Proxied (оранжевое облако)
   TTL: Auto
   ```

4. **Сохрани обе записи**

**Примечание:** Удали существующие A записи (@ и www → 46.224.147.252) если они есть - CNAME их заменит.

---

### Вариант 2: Через cloudflared CLI

```bash
ssh -i "C:\Users\zakon\.ssh\trustcheck_hetzner" root@46.224.147.252

# Добавить DNS routing (требует origin cert)
cloudflared tunnel route dns e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4 trustcheck.co.il
cloudflared tunnel route dns e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4 www.trustcheck.co.il
```

**Проблема:** Может показать ошибку "No origin certificate" - нужен cert.pem.

---

## Почему CNAME не создались автоматически?

**Возможные причины:**

1. **Nameserver mismatch:**
   - MyNames настроил: elsa/todd.ns.cloudflare.com
   - Cloudflare ожидает: jihoon/molly.ns.cloudflare.com
   - **Решение:** Cloudflare не может управлять DNS пока nameservers не совпадают

2. **DNS уже управляется вручную:**
   - Существующие A записи блокируют автосоздание CNAME
   - **Решение:** Удалить A записи, добавить CNAME вручную

3. **Требуется оплата:**
   - Иногда автосоздание DNS требует активного плана
   - **Решение:** Создать CNAME вручную (работает на free плане)

---

## Проверка после создания CNAME

```powershell
# Подожди 1-2 минуты после создания CNAME, затем:
nslookup trustcheck.co.il

# Должно вернуть:
# trustcheck.co.il canonical name = e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4.cfargotunnel.com
# Name: e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4.cfargotunnel.com
# Addresses: 104.17.x.x, 172.64.x.x (Cloudflare IPs)
```

```powershell
# Проверка HTTPS:
curl -I https://trustcheck.co.il

# Должно вернуть:
# HTTP/2 200
# cf-ray: ...
# server: cloudflare
```

```powershell
# Открыть в браузере:
Start-Process "https://trustcheck.co.il"
```

---

## Альтернатива: Дождаться активации nameservers

**Если не хочешь создавать CNAME вручную:**

1. Подожди активации nameservers в MyNames (ещё 30-60 минут)
2. Когда nameservers elsa/todd станут активны глобально
3. Cloudflare автоматически обнаружит домен
4. CNAME создастся автоматически

**Проверка статуса nameservers:**
```powershell
nslookup -type=NS trustcheck.co.il
```

Когда вернёт `elsa.ns.cloudflare.com` и `todd.ns.cloudflare.com` → домен активен.

---

## Рекомендация

**Самый быстрый путь:**
1. Открой https://dash.cloudflare.com/20f5ee00fbbdf9c8b779161ea33c21cb/trustcheck.co.il/dns
2. Удали A записи (@ и www)
3. Добавь 2 CNAME записи (см. Вариант 1)
4. Через 1-2 минуты сайт заработает

**Преимущество:** Не зависит от nameservers, работает через Cloudflare proxy сразу.

---

**Tunnel ID:** e8a1fbd0-ddc9-41fe-9daa-293ba05c4ee4  
**Account ID:** 20f5ee00fbbdf9c8b779161ea33c21cb  
**Zone ID:** 736fb1cca4558c8a7f36adf14e2b153b
