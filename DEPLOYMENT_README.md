# TrustCheck Israel - Deployment Guide

[![Production](https://img.shields.io/badge/status-production-green.svg)](https://trustcheck.co.il)
[![Server](https://img.shields.io/badge/server-Hetzner%20CX23-blue.svg)](https://www.hetzner.com/cloud)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-29.1.3-blue.svg)](https://www.docker.com/)

## 📋 Overview

TrustCheck Israel is a B2C platform for verifying Israeli businesses. Parents and individuals can check the reliability of businesses before engaging with them.

**Tech Stack:**
- Frontend: Next.js 14 + TailwindCSS
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL
- AI: Google Gemini 2.0 Flash
- Hosting: Hetzner Cloud (CX23)
- Reverse Proxy: NGINX
- SSL: Let's Encrypt (Certbot)

---

## 🚀 Quick Deploy (Production)

### Prerequisites

- ✅ Hetzner Cloud server (CX23 recommended)
- ✅ Domain configured (trustcheck.co.il → server IP)
- ✅ SSH access to server
- ✅ API keys (CheckID, Google Gemini, Stripe, Supabase)

### Step 1: Server Setup

```bash
# SSH into your server
ssh -i ~/.ssh/trustcheck_hetzner root@46.224.147.252

# Server should have:
# - Ubuntu 24.04 LTS
# - Docker 29.1.3+
# - Docker Compose v5.0.0+
# - Node.js 20 LTS
# - NGINX 1.24.0+
# - Certbot 2.9.0+
```

### Step 2: Clone Repository

```bash
# Navigate to application directory
cd /opt/trustcheck

# Clone from Git (replace with your repo URL)
git clone https://github.com/your-org/trustcheck-israel.git .

# Or upload via SCP from local machine:
# scp -i ~/.ssh/trustcheck_hetzner -r ./app/* root@46.224.147.252:/opt/trustcheck/
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env

# Required variables:
# - CHECKID_API_KEY (from CheckID.co.il)
# - GOOGLE_API_KEY (from https://aistudio.google.com/apikey)
# - STRIPE_SECRET_KEY (from Stripe Dashboard)
# - DATABASE_URL (from Supabase)
```

### Step 4: Obtain SSL Certificate

```bash
# Stop NGINX if running
systemctl stop nginx

# Get Let's Encrypt certificate
certbot certonly --standalone \
  -d trustcheck.co.il \
  -d www.trustcheck.co.il \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Copy certificates to Docker volume
mkdir -p /opt/trustcheck/ssl
cp /etc/letsencrypt/live/trustcheck.co.il/fullchain.pem /opt/trustcheck/ssl/
cp /etc/letsencrypt/live/trustcheck.co.il/privkey.pem /opt/trustcheck/ssl/

# Set up auto-renewal (cron job)
crontab -e
# Add line:
# 0 3 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/trustcheck.co.il/*.pem /opt/trustcheck/ssl/ && docker compose -f /opt/trustcheck/docker-compose.yml restart nginx"
```

### Step 5: Build and Deploy

```bash
# Build Docker images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f app

# Expected output:
# ✓ Ready in 2.3s
# ✓ Local: http://0.0.0.0:3000
```

### Step 6: Verify Deployment

```bash
# Test NGINX health check
curl http://localhost/health
# Expected: OK

# Test Next.js API
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Test HTTPS (from external)
curl -I https://trustcheck.co.il
# Expected: HTTP/2 200
```

---

## 🔧 Configuration Files

### Dockerfile

Multi-stage build for optimal image size (~150MB):
- Stage 1: Dependencies installation
- Stage 2: Next.js build
- Stage 3: Production runtime (minimal image)

### docker-compose.yml

Two services:
- **app:** Next.js container (port 3000)
- **nginx:** Reverse proxy (ports 80, 443)

### lib/gemini.ts

Google Gemini AI integration for business report generation:
- **generateBusinessReport():** Main function for creating detailed reports in Hebrew
- **extractKeyFacts():** Analyzes report text, extracts trust score (1-5 stars), risks, strengths
- **checkGeminiHealth():** Tests API availability
- **Free tier:** 1,500 requests/day (enough for MVP)
- **Cost savings:** ~₪7,200/year vs OpenAI GPT-4 (at 1,000 checks/month)

Health checks enabled for both services.

### nginx.conf

Features:
- HTTP → HTTPS redirect
- Rate limiting (10 req/s for API, 50 req/s general)
- Static assets caching (1 year)
- Security headers (HSTS, CSP, X-Frame-Options)
- Gzip compression
- SSL TLS 1.2/1.3

---

## 📊 Server Specifications (CX23)

| Resource | Specification |
|----------|--------------|
| **CPU** | 2 vCPU (AMD Shared) |
| **RAM** | 4 GB DDR4 |
| **Storage** | 40 GB NVMe SSD |
| **Network** | 20 TB traffic/month |
| **IPv4** | 46.224.147.252 |
| **IPv6** | 2a01:4f8:1c1f:bacd::/64 |
| **Location** | Nuremberg, Germany |
| **Price** | €2.99/month (~₪11) |

---

## 🔒 Security Checklist

- [x] ✅ UFW firewall enabled (ports 22, 80, 443)
- [x] ✅ Fail2Ban active (SSH brute-force protection)
- [x] ✅ SSL certificates (Let's Encrypt)
- [x] ✅ HTTPS enforced (HTTP redirect)
- [x] ✅ Security headers (HSTS, CSP)
- [x] ✅ Rate limiting (NGINX)
- [x] ✅ Environment variables secured (.env not in Git)
- [x] ✅ Docker containers as non-root user
- [x] ✅ Automated backups enabled (daily)

---

## 🤖 Google Gemini API Setup

### API Key Acquisition

1. Visit https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Get API Key"
4. Copy generated key (format: `AIza...`)
5. Add to `.env` file: `GOOGLE_API_KEY=AIzaSy...`

### Free Tier Limits

- **Requests:** 1,500 per day
- **Tokens:** 1M tokens per request (context window)
- **Cost:** FREE for first year
- **Hebrew support:** Native multilingual capabilities
- **Speed:** ~1 second per report (vs GPT-4 ~3 seconds)

### Cost Comparison (1,000 checks/month)

| Model | Cost per Report | Monthly Cost | Annual Cost |
|-------|-----------------|--------------|-------------|
| Google Gemini 2.0 Flash | ₪0 (free) | ₪0 | ₪0 |
| OpenAI GPT-4 | ₪0.20 | ₪200 | ₪2,400 |
| OpenAI GPT-4 Turbo | ₪0.60 | ₪600 | ₪7,200 |

**Annual savings:** ₪7,200 (using Gemini vs GPT-4 Turbo)

### Usage Monitoring

Check quota: https://aistudio.google.com/app/apikey

```bash
# Test API health
curl http://localhost:3000/api/health
# Response includes Gemini status: "connected" or "error"
```

### Error Handling

- **429 Rate Limit:** Implement queue system (Phase 2)
- **API Key Invalid:** Check `.env` file, regenerate key
- **Network Error:** Retry with exponential backoff (implemented in `lib/gemini.ts`)

---

## 📈 Monitoring

### Docker Logs

```bash
# Application logs
docker compose logs -f app

# NGINX logs
docker compose logs -f nginx

# All services
docker compose logs -f
```

### System Resources

```bash
# CPU/RAM usage
htop

# Disk space
df -h

# Docker stats
docker stats
```

### Hetzner Console

Monitor server metrics:
- CPU usage
- RAM usage
- Network traffic
- Disk I/O

Dashboard: https://console.hetzner.com/projects/12831241/servers

---

## 🔄 Maintenance

### Update Application

```bash
# Pull latest code
cd /opt/trustcheck
git pull origin main

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d
```

### Update System Packages

```bash
# Update Ubuntu packages
apt update && apt upgrade -y

# Reboot if kernel updated
reboot
```

### Create Backup

```bash
# Manual snapshot in Hetzner Console
# Servers → ubuntu-4gb-nbg1-1 → Create Snapshot

# Or automated daily backups (already enabled)
# Cost: €0.60/month (20% of server price)
```

---

## 🚨 Troubleshooting

### Application Not Starting

```bash
# Check Docker logs
docker compose logs app

# Common issues:
# - Missing environment variables (check .env)
# - Port 3000 already in use (check: lsof -i :3000)
# - Build errors (rebuild: docker compose build --no-cache)
```

### SSL Certificate Expired

```bash
# Renew certificate
certbot renew --force-renewal

# Copy to Docker volume
cp /etc/letsencrypt/live/trustcheck.co.il/*.pem /opt/trustcheck/ssl/

# Restart NGINX
docker compose restart nginx
```

### High CPU Usage

```bash
# Check processes
htop

# If sustained >80%:
# Upgrade to CPX11 (2 vCPU, €4.99/month)
# Hetzner Console → Servers → Rescale
```

### Out of Disk Space

```bash
# Clean Docker images
docker system prune -a --volumes

# Rotate logs
truncate -s 0 /var/log/nginx/*.log
docker compose logs --tail=0 -f > /dev/null
```

---

## 📞 Support

**Server Issues:**
- Hetzner Support: https://www.hetzner.com/support

**Application Issues:**
- GitHub Issues: https://github.com/your-org/trustcheck-israel/issues

**Emergency Access:**
- Hetzner Console: https://console.hetzner.com/ (VNC access)

---

## 📝 Changelog

### v1.0.0 (December 2025)
- Initial production deployment
- CX23 server (Hetzner Cloud)
- Next.js 14 + Docker + NGINX
- Let's Encrypt SSL
- Google Gemini 2.0 Flash AI integration
- CheckID API integration (mock data for MVP)

---

## 📄 License

Proprietary - TrustCheck Israel © 2025

---

## 🙏 Credits

- **Hosting:** Hetzner Cloud
- **SSL:** Let's Encrypt
- **Framework:** Next.js by Vercel
- **Database:** Supabase
- **Payment:** Stripe
- **AI:** Google Gemini 2.0 Flash
- **Data:** CheckID API
