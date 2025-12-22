# Мануал: Настройка Hetzner Cloud сервера для TrustCheck Israel

**Дата:** 22 декабря 2025  
**Назначение:** Пошаговая инструкция создания облачного сервера для всех 3 фаз проекта  
**Целевая аудитория:** DevOps-инженеры, разработчики, владельцы проекта  

---

## 📋 Оглавление

1. [Введение](#1-введение)
2. [Регистрация в Hetzner Cloud](#2-регистрация-в-hetzner-cloud)
3. [Выбор конфигурации по фазам](#3-выбор-конфигурации-по-фазам)
4. [Создание сервера (Step-by-Step)](#4-создание-сервера-step-by-step)
5. [Первичная настройка сервера](#5-первичная-настройка-сервера)
6. [Деплой приложения](#6-деплой-приложения)
7. [Настройка домена и SSL](#7-настройка-домена-и-ssl)
8. [Мониторинг и бэкапы](#8-мониторинг-и-бэкапы)
9. [Масштабирование (Upgrade)](#9-масштабирование-upgrade)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Введение

### 1.1. Почему Hetzner Cloud?

**Преимущества для TrustCheck Israel:**

| Критерий | Hetzner Cloud | Vercel | AWS EC2 | Преимущество |
|----------|---------------|--------|---------|--------------|
| **Цена (Phase 1)** | €3.79/month | €20/month | ~$25/month | **81% дешевле** |
| **GDPR compliance** | ✅ EU (Germany) | ⚠️ US (CloudFlare) | ⚠️ Global | **Критично для Израиля** |
| **Root access** | ✅ Full SSH | ❌ Serverless only | ✅ Full SSH | **Гибкость настройки** |
| **Scalability** | ✅ 1→32GB RAM | ⚠️ Vendor lock-in | ✅ Unlimited | **Легко upgrade** |
| **DDoS protection** | ✅ Included | ❌ Paid add-on | ❌ Separate service | **Бесплатная защита** |
| **Backup cost** | 20% (€0.76) | Included | ~$5/month | **Предсказуемо** |

**Вердикт:** Hetzner — лучший выбор для bootstrapped стартапа с требованиями GDPR.

---

### 1.2. Архитектура на Hetzner

```
┌──────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE DNS + CDN                         │
│            (trustcheck.co.il → Hetzner IP)                   │
└────────────┬─────────────────────────────────────────────────┘
             │ HTTPS (SSL)
             │
┌────────────▼─────────────────────────────────────────────────┐
│         HETZNER CLOUD SERVER (Nuremberg, Germany)            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NGINX Reverse Proxy (Port 80/443)                     │  │
│  │  • SSL termination (Let's Encrypt)                     │  │
│  │  • Rate limiting (10 req/sec per IP)                   │  │
│  │  • Gzip compression                                     │  │
│  └─────────────┬──────────────────────────────────────────┘  │
│                │                                               │
│  ┌─────────────▼──────────────────────────────────────────┐  │
│  │  DOCKER CONTAINER: Next.js App (Port 3000)            │  │
│  │  • Node.js 20 runtime                                  │  │
│  │  • Environment variables (.env.production)            │  │
│  │  • PM2 process manager (auto-restart)                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Storage:                                                     │
│  • 20GB NVMe SSD (Phase 1: CX11)                            │
│  • Docker images: ~2GB                                       │
│  • Logs: /var/log (max 5GB, rotated)                       │
│  • Free space: ~13GB                                         │
└──────────────┬────────────────────────────────────────────────┘
               │
    ┌──────────▼────────┐  ┌────────────────┐  ┌──────────────┐
    │ Supabase          │  │ CheckID API    │  │ OpenAI GPT-4 │
    │ (PostgreSQL)      │  │ (External)     │  │ (External)   │
    └───────────────────┘  └────────────────┘  └──────────────┘
```

---

## 2. Регистрация в Hetzner Cloud

### 2.1. Создание аккаунта

1. **Перейти:** https://console.hetzner.com/register
2. **Заполнить форму:**
   - Email: your-email@example.com
   - Password: Strong password (min 12 characters)
   - Company/Name: TrustCheck Israel
   - Country: Israel
3. **Подтвердить email** (check inbox)
4. **Добавить платёжный метод:**
   - Credit Card (Visa/MasterCard)
   - PayPal
   - SEPA Direct Debit (для EU)

**Первый месяц:** Hetzner даёт €20 кредит для новых клиентов (покрывает ~5 месяцев CX11!)

---

### 2.2. Создание проекта

1. **Login:** https://console.hetzner.com/
2. **Create Project:**
   - Name: `TrustCheck-Production`
   - Description: `Israel business reliability checks platform`
3. **Project ID:** Автоматически присваивается (например, `12831241`)

**ВАЖНО:** Все серверы, networks, volumes должны быть в одном проекте для взаимодействия.

---

## 3. Выбор конфигурации по фазам

### 3.1. Phase 1: MVP "Валидатор" (4 недели)

**Target:** 1,000 checks/месяц, <500 concurrent users

**Рекомендуемый сервер: CX11**

```
Server Type: CX11 (Intel/AMD vCPU)
├─ vCPU: 1 shared core (fair-use policy)
├─ RAM: 2 GB DDR4
├─ Storage: 20 GB NVMe SSD (local RAID10)
├─ Network: 20 TB traffic included (EU)
├─ IPv4: 1 public IP
├─ IPv6: /64 subnet (18,446,744,073,709,551,616 addresses!)
└─ Price: €3.79/month (€0.0061/hour)

Достаточно для:
✅ Next.js app (Node.js) - 500MB RAM
✅ NGINX - 50MB RAM
✅ Docker - 300MB RAM
✅ System (Ubuntu) - 200MB RAM
✅ Free buffer: ~950MB RAM
```

**Benchmark (expected performance):**
- Request handling: ~50 req/sec
- Concurrent connections: 200-300
- Database queries (Supabase external): No local overhead
- API calls (CheckID): Network-bound (not CPU)

**Cost:**
- Server: €3.79/month (~₪14)
- Backup (optional): +€0.76/month (~₪3)
- **Total: €4.55/month (~₪17)**

---

### 3.2. Phase 2: Судебные данные + Монетизация (2 месяца)

**Target:** 5,000 checks/месяц, 1,000 concurrent users

**Рекомендуемый сервер: CPX11**

```
Server Type: CPX11 (AMD EPYC)
├─ vCPU: 2 cores (shared, better burst)
├─ RAM: 2 GB DDR4
├─ Storage: 40 GB NVMe SSD
├─ Network: 20 TB traffic included
├─ IPv4: 1 public IP
├─ IPv6: /64 subnet
└─ Price: €4.99/month (€0.0080/hour)

Upgrade путь:
CX11 → CPX11 (via "Rescale" в консоли)
Downtime: ~2 minutes (automatic reboot)
```

**Когда апгрейдить:**
- ✅ CPU usage >70% sustained (1 hour+)
- ✅ RAM usage >80%
- ✅ Response time >5 sec (99th percentile)
- ✅ >500 concurrent connections

**Cost:**
- Server: €4.99/month (~₪18)
- Backup: +€1.00/month (~₪4)
- **Total: €5.99/month (~₪22)**

---

### 3.3. Phase 3: Кредитные данные + B2B (6 месяцев)

**Target:** 20,000 checks/месяц, 3,000 concurrent users

**Рекомендуемый сервер: CPX21**

```
Server Type: CPX21 (AMD EPYC)
├─ vCPU: 3 cores (shared)
├─ RAM: 4 GB DDR4
├─ Storage: 80 GB NVMe SSD
├─ Network: 20 TB traffic included
├─ IPv4: 1 public IP
├─ IPv6: /64 subnet
└─ Price: €8.99/month (€0.0144/hour)

Достаточно для:
✅ Next.js app - 1GB RAM
✅ NGINX - 100MB RAM
✅ Redis cache - 500MB RAM
✅ Docker - 500MB RAM
✅ System - 300MB RAM
✅ Free buffer: ~1.6GB RAM
```

**Альтернатива (если нужно больше):**
- **CPX31:** 4 cores, 8GB RAM, 160GB SSD → €17.49/month
- **Dedicated CCX13:** 2 dedicated cores, 8GB RAM → €19.99/month (гарантированная производительность)

**Cost:**
- Server: €8.99/month (~₪33)
- Backup: +€1.80/month (~₪7)
- **Total: €10.79/month (~₪40)**

---

### 3.4. Сравнительная таблица

| Фаза | Server | vCPU | RAM | SSD | Price | Users | Checks/month |
|------|--------|------|-----|-----|-------|-------|--------------|
| **Phase 1** | CX11 | 1 | 2GB | 20GB | **€3.79** | <500 | 1,000 |
| **Phase 2** | CPX11 | 2 | 2GB | 40GB | **€4.99** | 1,000 | 5,000 |
| **Phase 3** | CPX21 | 3 | 4GB | 80GB | **€8.99** | 3,000 | 20,000 |
| **Scale-up** | CPX31 | 4 | 8GB | 160GB | **€17.49** | 10,000 | 50,000+ |

**Итого за Year 1 (если идеально):**
- Months 1-3 (Phase 1): €3.79 × 3 = €11.37
- Months 4-5 (Phase 2): €4.99 × 2 = €9.98
- Months 6-12 (Phase 3): €8.99 × 7 = €62.93
- **Total Year 1: €84.28 (~₪310)** — дешевле 1 месяца Vercel Pro!

---

## 4. Создание сервера (Step-by-Step)

### 4.1. Открыть форму создания

1. **Login:** https://console.hetzner.com/
2. **Select Project:** `TrustCheck-Production`
3. **Menu:** `Servers` (левая панель)
4. **Click:** `ADD SERVER` (красная кнопка)

---

### 4.2. Location (Локация)

**🌍 Выбор датацентра:**

| Location | Code | Latency (Israel) | GDPR | Рекомендация |
|----------|------|------------------|------|--------------|
| **Nuremberg, Germany** | `nbg1` | ~80ms | ✅ EU | **✅ РЕКОМЕНДУЕТСЯ** |
| **Falkenstein, Germany** | `fsn1` | ~85ms | ✅ EU | ✅ Альтернатива |
| **Helsinki, Finland** | `hel1` | ~100ms | ✅ EU | ⚠️ Дальше |
| **Ashburn, USA** | `ash` | ~180ms | ❌ US | ❌ НЕ GDPR |
| **Hillsboro, USA** | `hil` | ~200ms | ❌ US | ❌ НЕ GDPR |

**Выбрать:** `Nuremberg (nbg1)` — ближайший EU датацентр к Израилю.

**ВАЖНО:** После создания сервера локацию НЕЛЬЗЯ изменить (только удалить и создать заново).

---

### 4.3. Image (Операционная система)

**Выбрать категорию:** `OS Images`

**Рекомендуемая OS: Ubuntu 24.04 LTS**

```
Operating System: Ubuntu 24.04 LTS
├─ Version: Noble Numbat (latest)
├─ Kernel: Linux 6.8+
├─ Support: Long-Term Support (до 2029)
├─ Package manager: apt
└─ Default user: root (SSH key required)

Почему Ubuntu 24.04?
✅ LTS (5 лет обновлений безопасности)
✅ Широкая поддержка (Docker, Node.js, etc.)
✅ Большое комьюнити (легко найти решения)
✅ Автоматические security updates
```

**Альтернативы:**
- **Debian 12:** Более стабильная (для консерваторов)
- **Rocky Linux 9:** Аналог CentOS (для enterprise)
- **Fedora 40:** Новейшие фичи (для экспериментов)

**НЕ рекомендуется:**
- ❌ Windows Server (нужна отдельная лицензия ~$10/month)
- ❌ FreeBSD (нет Docker support)

---

### 4.4. Type (Тип сервера)

**Выбрать категорию:** `Shared vCPU` (для Phase 1)

**Выбрать план:**

```
┌─────────────────────────────────────────────────┐
│  CX11 — Shared Regular Performance              │
│                                                  │
│  vCPU: 1 (Intel/AMD)                            │
│  RAM: 2 GB                                       │
│  SSD: 20 GB NVMe                                 │
│  Traffic: 20 TB                                  │
│                                                  │
│  €3.79/month (€0.0061/hour)                     │
│                                                  │
│  [ SELECT ]                                      │
└─────────────────────────────────────────────────┘
```

**Что такое "Shared vCPU"?**
- CPU cores разделяются между несколькими клиентами на одном физическом сервере
- Fair-use policy: Если сосед нагружает CPU на 100%, ваша производительность может снизиться
- **Подходит для:** Development, небольшие production (до 5K users)

**Когда переходить на Dedicated?**
- ✅ Если CPU usage >80% sustained
- ✅ Если нужна predictable performance (финансовые расчёты, ML)
- ✅ Если budget >€20/month

**Dedicated альтернатива:**
- **CCX13:** 2 dedicated cores, 8GB RAM, 80GB SSD → €19.99/month

---

### 4.5. Networking (Сеть)

**Опция 1: Public IPv4 + IPv6 (рекомендуется)**

```
[✓] Public IPv4
[✓] Public IPv6

Result:
• IPv4: 1 address (например, 88.99.123.45)
• IPv6: /64 subnet (18+ квинтиллионов адресов)

Use case: Standard web server (HTTPS)
Cost: €0.59/month за IPv4 (included in first month)
```

**ВАЖНО:** С 2024 года Hetzner взимает €0.59/month за КАЖДЫЙ IPv4 (дефицит адресов).

**Опция 2: Only IPv6 (экономия €0.59/month)**
```
[✗] Public IPv4
[✓] Public IPv6

Savings: €0.59/month
BUT: Requires Cloudflare IPv6→IPv4 proxy (сложнее)
```

**Рекомендация для TrustCheck:** **Выбрать IPv4 + IPv6** (стандартная конфигурация).

---

#### SSH Key (КРИТИЧНО!)

**ОБЯЗАТЕЛЬНО добавить SSH key!** Без него не будет доступа к серверу.

**Если у вас уже есть SSH key:**
1. Click `Add SSH Key`
2. Paste public key (файл `~/.ssh/id_rsa.pub`)
3. Name: `My Laptop Key`

**Если нет SSH key:**
```powershell
# Windows PowerShell (генерация ключа)
ssh-keygen -t ed25519 -C "trustcheck-server"

# Enter file: C:\Users\YourName\.ssh\id_ed25519
# Enter passphrase: [strong password]

# Скопировать public key
Get-Content C:\Users\YourName\.ssh\id_ed25519.pub | Set-Clipboard

# Paste в Hetzner форму
```

**ВАЖНО:** Без SSH key Hetzner отправит root password по email (небезопасно!).

---

#### Private Network (опционально)

**Для Phase 1:** НЕ нужно (только 1 сервер).

**Для Phase 3 (масштабирование):**
- Create Network: `trustcheck-private-net`
- Subnet: `10.0.0.0/24` (254 IP адреса)
- Use case: Backend server ↔ Database server (изолированная сеть)

---

### 4.6. Volumes (Дополнительное хранилище)

**Для Phase 1:** **НЕ нужно** (20GB SSD достаточно).

**Когда добавлять Volume:**
- ✅ Если нужно хранить логи >5GB
- ✅ Если нужно хранить user uploads (файлы)
- ✅ Если SSD заполнен >80%

**Pricing:** €0.044/GB/month
- 10GB Volume = €0.44/month
- 100GB Volume = €4.40/month

---

### 4.7. Firewalls (Брандмауэр)

**Для безопасности:** **ОБЯЗАТЕЛЬНО создать Firewall!**

**Click:** `Create Firewall`

**Правила (Inbound):**

| Rule | Protocol | Port | Source | Action | Purpose |
|------|----------|------|--------|--------|---------|
| **SSH** | TCP | 22 | `0.0.0.0/0` (All IPs) | Allow | Remote access |
| **HTTP** | TCP | 80 | `0.0.0.0/0` | Allow | Web traffic (redirect to HTTPS) |
| **HTTPS** | TCP | 443 | `0.0.0.0/0` | Allow | Web traffic (SSL) |
| **ICMP** | ICMP | — | `0.0.0.0/0` | Allow | Ping (monitoring) |
| **ALL OTHER** | — | — | — | **Deny** | Block everything else |

**Правила (Outbound):**
```
[✓] Allow all outbound traffic

Why: Server needs to:
• Download packages (apt-get)
• Call CheckID API
• Call OpenAI API
• Update SSL certificates
```

**Apply to:** `trustcheck-production-server`

---

### 4.8. Backups (Бэкапы)

**Опция:** Automated Backups

```
[✓] Enable Backups

Cost: 20% of server price
• CX11: +€0.76/month
• CPX11: +€1.00/month
• CPX21: +€1.80/month

Features:
• Daily automated snapshots (7 slots)
• Retention: 7 days
• Restore time: ~5 minutes
• Use case: Disaster recovery
```

**Рекомендация для Phase 1:** **Включить backups** (€0.76/month — дешёвая страховка).

**Альтернатива (если tight budget):**
- Manual Snapshots (€0.011/GB/month)
- Git-based deploy (восстановление за 10 минут)

---

### 4.9. Placement Groups (опционально)

**Для Phase 1:** НЕ нужно (только 1 сервер).

**Use case:** High Availability (HA) с несколькими серверами.

---

### 4.10. Labels (Метки)

**Добавить для организации:**

```
environment = production
project = trustcheck
phase = 1
```

**Use case:** Фильтрация в dashboard, автоматизация (API/CLI).

---

### 4.11. Cloud-config (Автоматизация)

**Для опытных:** Cloud-init script для автоматической настройки после boot.

**Пример (Phase 1):**
```yaml
#cloud-config
package_update: true
package_upgrade: true
packages:
  - docker.io
  - docker-compose
  - nginx
  - certbot
  - python3-certbot-nginx
runcmd:
  - systemctl enable docker
  - systemctl start docker
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
```

**Для новичков:** **Оставить пустым** (настроим вручную после создания).

---

### 4.12. Name (Имя сервера)

**Требования RFC 1123:**
- Only: `a-z`, `0-9`, `-`, `.`
- First character: letter or digit
- Last character: NOT `-` or `.`
- Max length: 63 characters
- Case insensitive

**Примеры (good):**
- ✅ `trustcheck-prod-web1`
- ✅ `tc-phase1-nbg1`
- ✅ `web.trustcheck.co.il`

**Примеры (bad):**
- ❌ `TrustCheck_Production` (underscore)
- ❌ `-trustcheck` (starts with -)
- ❌ `trustcheck.` (ends with .)

**Рекомендация:** `trustcheck-prod-phase1`

---

### 4.13. Количество серверов

**Для Phase 1:** `1 server`

**Phase 3 (масштабирование):**
- Web server × 2 (Load Balancer)
- Database server × 1 (Postgres primary)
- Redis cache server × 1

---

### 4.14. Итоговая конфигурация (Review)

```
──────────────────────────────────────────────────────
  SERVER SUMMARY
──────────────────────────────────────────────────────
  Name: trustcheck-prod-phase1
  
  Location: Nuremberg (nbg1), Germany
  
  Image: Ubuntu 24.04 LTS
  
  Type: CX11 (Shared vCPU)
    • 1 vCPU (Intel/AMD)
    • 2 GB RAM
    • 20 GB NVMe SSD
    • 20 TB traffic
  
  Network:
    • IPv4: 88.99.123.45 (example)
    • IPv6: 2a01:4f8:c012:abc::/64
  
  Firewall: trustcheck-firewall
    • Allow: SSH (22), HTTP (80), HTTPS (443)
  
  Backups: Enabled (+€0.76/month)
  
  SSH Key: my-laptop-key
  
  Labels:
    • environment = production
    • project = trustcheck
    • phase = 1
  
──────────────────────────────────────────────────────
  COST ESTIMATE
──────────────────────────────────────────────────────
  Server (CX11): €3.79/month
  IPv4: €0.59/month (first month free)
  Backups: €0.76/month
  ──────────────────────────────────────────────────
  TOTAL: €5.14/month (~₪19/month)
  
  Hourly: €0.0082/hour (if deleted mid-month)
──────────────────────────────────────────────────────
```

**Click:** `CREATE & BUY NOW` 🚀

---

### 4.15. Что происходит после создания?

```
1. [Provisioning] Server creation started... (0 sec)
2. [Network] Assigning IP addresses... (5 sec)
3. [OS] Installing Ubuntu 24.04... (30 sec)
4. [SSH] Adding SSH keys... (5 sec)
5. [Firewall] Applying rules... (10 sec)
6. [Boot] Starting server... (15 sec)
   ✅ Server is RUNNING! (Total: ~1 minute)
```

**Получите:**
- ✅ Public IPv4: `88.99.123.45`
- ✅ Public IPv6: `2a01:4f8:c012:abc::1`
- ✅ Root access: `ssh root@88.99.123.45`

---

## 5. Первичная настройка сервера

### 5.1. Подключение по SSH

```powershell
# Windows PowerShell
ssh root@88.99.123.45

# Если SSH key с passphrase:
# Enter passphrase for key 'C:\Users\...\id_ed25519': [password]

# Успешное подключение:
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-49-generic x86_64)

root@trustcheck-prod-phase1:~#
```

---

### 5.2. System Update (ОБЯЗАТЕЛЬНО!)

```bash
# Update package lists
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git vim ufw fail2ban htop

# Reboot if kernel updated
reboot
```

**Time:** ~5 минут

---

### 5.3. Firewall (UFW) Configuration

```bash
# Enable UFW (uncomplicated firewall)
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (IMPORTANT: before enabling!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status verbose

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

### 5.4. Fail2Ban (Защита от brute-force)

```bash
# Install Fail2Ban
apt install -y fail2ban

# Configure for SSH
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Restart Fail2Ban
systemctl restart fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status sshd

# Expected: 0 currently banned IPs
```

**Что делает:**
- Блокирует IP после 3 неудачных попыток логина
- Ban на 1 час (3600 секунд)
- Защищает от brute-force атак

---

### 5.5. Docker Installation

```bash
# Install Docker (official script)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
# Expected: Docker version 24.0+

# Test Docker
docker run hello-world

# Expected output:
# Hello from Docker!
# This message shows that your installation appears to be working correctly.
```

---

### 5.6. Docker Compose Installation

```bash
# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify
docker compose version
# Expected: Docker Compose version v2.20+
```

---

### 5.7. Create Application User (Security)

```bash
# Create non-root user for app
useradd -m -s /bin/bash trustcheck
usermod -aG docker trustcheck

# Set password (optional)
passwd trustcheck

# Add to sudoers (optional)
usermod -aG sudo trustcheck

# Test user
su - trustcheck
whoami
# Expected: trustcheck

exit
```

**Best practice:** Деплоить приложение под `trustcheck` пользователем, НЕ `root`.

---

### 5.8. Setup Application Directory

```bash
# Create app directory
mkdir -p /opt/trustcheck
chown trustcheck:trustcheck /opt/trustcheck

# Switch to app user
su - trustcheck
cd /opt/trustcheck

# Clone repository (example)
git clone https://github.com/your-org/trustcheck-israel.git .

# Or create from scratch
mkdir -p app
cd app
```

---

## 6. Деплой приложения

### 6.1. Dockerfile (Next.js Production)

```dockerfile
# /opt/trustcheck/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

### 6.2. Docker Compose (Production Stack)

```yaml
# /opt/trustcheck/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: trustcheck-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CHECKID_API_KEY=${CHECKID_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - trustcheck-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: trustcheck-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - trustcheck-net

networks:
  trustcheck-net:
    driver: bridge
```

---

### 6.3. Environment Variables

```bash
# /opt/trustcheck/.env.production
NODE_ENV=production

# CheckID API
CHECKID_API_KEY=your-checkid-key-here

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# App Config
NEXT_PUBLIC_APP_URL=https://trustcheck.co.il
```

**ВАЖНО:** Файл `.env.production` НЕ коммитить в Git! Добавить в `.gitignore`.

---

### 6.4. Build и Deploy

```bash
# Build Docker image
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f app

# Expected output:
# ✓ Ready in 2.3s
# ✓ Local: http://0.0.0.0:3000
# ✓ Network: http://172.18.0.2:3000
```

---

### 6.5. NGINX Configuration

```nginx
# /opt/trustcheck/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name trustcheck.co.il www.trustcheck.co.il;

        # Redirect HTTP → HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name trustcheck.co.il www.trustcheck.co.il;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Rate limiting (10 req/sec per IP)
            limit_req zone=api burst=20 nodelay;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 7. Настройка домена и SSL

### 7.1. DNS (Cloudflare)

**Предполагается:** Домен `trustcheck.co.il` зарегистрирован в Cloudflare.

**DNS Records:**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `88.99.123.45` (Hetzner IP) | ☁️ Proxied | Auto |
| A | `www` | `88.99.123.45` | ☁️ Proxied | Auto |
| AAAA | `@` | `2a01:4f8:c012:abc::1` (IPv6) | ☁️ Proxied | Auto |

**Cloudflare Settings:**
- SSL/TLS: `Full (strict)`
- Always Use HTTPS: `On`
- Auto Minify: `On` (HTML, CSS, JS)
- Brotli: `On`

---

### 7.2. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Stop NGINX temporarily
docker compose stop nginx

# Obtain certificate
certbot certonly --standalone -d trustcheck.co.il -d www.trustcheck.co.il \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email

# Expected output:
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem
# Key is saved at: /etc/letsencrypt/live/trustcheck.co.il/privkey.pem

# Copy certificates to Docker volume
mkdir -p /opt/trustcheck/ssl
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /opt/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /opt/trustcheck/ssl/

# Restart NGINX
docker compose up -d nginx

# Test SSL
curl -I https://trustcheck.co.il
# Expected: HTTP/2 200
```

---

### 7.3. Auto-renewal (Cron Job)

```bash
# Test renewal (dry-run)
certbot renew --dry-run

# Add cron job for auto-renewal
crontab -e

# Add line (renew every day at 3 AM):
0 3 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/trustcheck.co.il/*.pem /opt/trustcheck/ssl/ && docker compose -f /opt/trustcheck/docker-compose.yml restart nginx"
```

---

## 8. Мониторинг и бэкапы

### 8.1. Server Monitoring (Hetzner Console)

**Metrics доступны:** https://console.hetzner.com/projects/12831241/servers

- CPU usage (%)
- RAM usage (%)
- Disk I/O (MB/s)
- Network traffic (GB)

**Alerts:**
- CPU >80% for 10 min
- RAM >90% for 5 min
- Disk >90% full

---

### 8.2. Application Logs

```bash
# Docker logs
docker compose logs -f app

# NGINX access logs
tail -f /var/log/nginx/access.log

# NGINX error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -f -u docker
```

---

### 8.3. Automated Backups

**Hetzner Backups (enabled):**
- Daily snapshots: 03:00 AM UTC
- Retention: 7 days
- Storage: Hetzner datacenter (same region)

**Manual Snapshot (перед важным update):**
```bash
# Via Hetzner Console:
Servers → trustcheck-prod-phase1 → Actions → Create Snapshot

# Snapshot cost: €0.011/GB/month
# 20GB server = €0.22/month
```

---

### 8.4. Database Backups (Supabase)

**Supabase автоматически:**
- Daily backups (free tier: 7 days retention)
- Point-in-time recovery (Pro plan: 30 days)

**Manual backup:**
```bash
# pg_dump через Supabase CLI
supabase db dump > backup-$(date +%Y%m%d).sql
```

---

## 9. Масштабирование (Upgrade)

### 9.1. Rescale Server (без переустановки!)

**Hetzner позволяет upgrade БЕЗ потери данных:**

```
Servers → trustcheck-prod-phase1 → Power Off
→ Actions → Rescale
→ Select new type (CPX11, CPX21, etc.)
→ Confirm

Downtime: ~2 minutes (automatic reboot)
```

**Доступные апгрейды:**

| From | To | vCPU | RAM | SSD | Price Δ |
|------|-----|------|-----|-----|---------|
| CX11 | CPX11 | 1→2 | 2GB→2GB | 20GB→40GB | +€1.20/month |
| CPX11 | CPX21 | 2→3 | 2GB→4GB | 40GB→80GB | +€4.00/month |
| CPX21 | CPX31 | 3→4 | 4GB→8GB | 80GB→160GB | +€8.50/month |

**ВАЖНО:** Downgrade тоже возможен (если SSD usage < новый лимит).

---

### 9.2. Horizontal Scaling (Load Balancer)

**Когда нужно:**
- >10,000 concurrent users
- Need zero-downtime deployments
- Geographic distribution

**Setup:**

1. **Create Load Balancer:**
   - Hetzner Console → Load Balancers → Create
   - Type: LB11 (€5.39/month)
   - Algorithm: Round Robin
   - Health Check: `/health` endpoint

2. **Add Target Servers:**
   - Web1: `trustcheck-prod-web1` (CPX21)
   - Web2: `trustcheck-prod-web2` (CPX21)

3. **DNS Update:**
   - Point `trustcheck.co.il` → Load Balancer IP

**Cost:** €5.39/month + (€8.99 × 2) = **€23.37/month**

---

## 10. Troubleshooting

### 10.1. Server не отвечает

**Проверка 1: Ping**
```powershell
ping 88.99.123.45
```
- ✅ Reply: Server alive
- ❌ Timeout: Server down OR firewall issue

**Проверка 2: SSH Connection**
```powershell
ssh -v root@88.99.123.45
```
- ❌ `Connection refused`: SSH service down
- ❌ `Connection timed out`: Firewall blocking port 22

**Решение:**
1. Hetzner Console → Servers → Power On (если off)
2. Hetzner Console → VNC Console (emergency access)

---

### 10.2. High CPU Usage

```bash
# Check top processes
htop

# Expected:
# node (Next.js app): 30-50%
# nginx: 5-10%
# docker: 10-20%

# If >80% sustained:
# → Upgrade to CPX11 (2 vCPU)
```

---

### 10.3. Out of Disk Space

```bash
# Check disk usage
df -h

# Expected:
# /dev/sda1       20G   12G   7.0G  64% /

# If >90%:
# 1. Clean Docker images
docker system prune -a --volumes

# 2. Rotate logs
truncate -s 0 /var/log/nginx/*.log

# 3. Delete old backups
rm -rf /opt/trustcheck/backups/*.sql
```

---

### 10.4. SSL Certificate Expired

```bash
# Check expiry date
openssl x509 -in /opt/trustcheck/ssl/fullchain.pem -noout -enddate

# If expired:
certbot renew --force-renewal
cp /etc/letsencrypt/live/trustcheck.co.il/*.pem /opt/trustcheck/ssl/
docker compose restart nginx
```

---

## 📊 Чеклист: Готовность к Production

### Phase 1 (MVP) Checklist:

- [ ] ✅ Hetzner server created (CX11, Nuremberg)
- [ ] ✅ Ubuntu 24.04 installed + updated
- [ ] ✅ Firewall configured (UFW + Hetzner Firewall)
- [ ] ✅ Fail2Ban enabled (SSH brute-force protection)
- [ ] ✅ Docker + Docker Compose installed
- [ ] ✅ Application deployed (Next.js + NGINX)
- [ ] ✅ SSL certificate installed (Let's Encrypt)
- [ ] ✅ Domain pointing to server (Cloudflare DNS)
- [ ] ✅ Backups enabled (daily automated)
- [ ] ✅ Monitoring setup (Hetzner Console + Sentry)
- [ ] ✅ Environment variables secured (.env.production)
- [ ] ✅ Health check endpoint working (`/health`)
- [ ] ✅ Rate limiting configured (10 req/sec)
- [ ] ✅ Logs rotation setup (max 10GB)
- [ ] ✅ Auto-renewal cron job (SSL certificates)

**Если все ✅ → ГОТОВО К ЗАПУСКУ!** 🚀

---

## 💰 Итоговая стоимость владения (TCO)

### Year 1 Cost Projection:

| Period | Server | Backup | IPv4 | Total/month | Duration | Subtotal |
|--------|--------|--------|------|-------------|----------|----------|
| **Phase 1** | CX11 (€3.79) | €0.76 | €0.59 | **€5.14** | 3 months | €15.42 |
| **Phase 2** | CPX11 (€4.99) | €1.00 | €0.59 | **€6.58** | 2 months | €13.16 |
| **Phase 3** | CPX21 (€8.99) | €1.80 | €0.59 | **€11.38** | 7 months | €79.66 |

**Total Year 1:** €108.24 (~₪398)

**Сравнение с альтернативами:**

| Provider | Config | Year 1 Cost | Difference |
|----------|--------|-------------|------------|
| **Hetzner** | CX11→CPX21 | **€108** (~₪398) | Baseline |
| Vercel Pro | 1 project | €240 (~₪883) | +122% 🔴 |
| AWS t3.small | 1 EC2 | ~$300 (~₪1,100) | +177% 🔴 |
| DigitalOcean | 2GB Droplet | $144 (~₪530) | +33% 🟡 |

**Вердикт:** Hetzner — **самый дешёвый** для европейской инфраструктуры с GDPR compliance.

---

## 📚 Полезные ссылки

- **Hetzner Console:** https://console.hetzner.com/
- **Hetzner Docs:** https://docs.hetzner.com/cloud/
- **Hetzner API:** https://docs.hetzner.cloud/
- **Hetzner Status:** https://status.hetzner.com/
- **Community Forum:** https://community.hetzner.com/
- **Support:** https://www.hetzner.com/support/

---

**Prepared by:** TrustCheck DevOps Team  
**Date:** 22 декабря 2025  
**Version:** 1.0 (Production Ready)  
**Based on:** Hetzner Cloud официальная документация + best practices
