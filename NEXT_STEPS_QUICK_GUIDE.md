# Next Steps - Quick Action Guide

**Current Status:** ✅ Production deployed on http://46.224.147.252/  
**Date:** 23.12.2025

---

## 🎯 Immediate Actions (This Week)

### 1️⃣ Google Analytics 4 Setup ⏱️ 5 min
**Why:** Track users, searches, and trust scores

**Steps:**
1. Go to https://analytics.google.com/ → Create account
2. Create property: "TrustCheck Israel"
3. Add Web data stream: http://46.224.147.252
4. Copy Measurement ID (G-XXXXXXXXXX)
5. Edit `.env` file:
   ```bash
   # Add this line:
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
6. Deploy:
   ```bash
   git add .env
   git commit -m "feat: Add GA4 tracking ID"
   git push
   
   # On server:
   cd /root/trustcheck
   git pull
   docker compose up -d --build
   ```

**Verify:** Open http://46.224.147.252/ → DevTools → Network → filter "google-analytics"

📖 **Full Guide:** `GA4_QUICK_SETUP.md`

---

### 2️⃣ Load Government Data ⏱️ 30 min
**Why:** Replace mock data with real 716K companies

**Steps:**
```powershell
# 1. Download data (local machine)
cd E:\SBF
pwsh scripts/download_government_data.ps1

# 2. Upload to server
scp -i C:\Users\zakon\.ssh\trustcheck_hetzner `
  data/government/companies_registry.csv `
  root@46.224.147.252:/root/trustcheck/data/government/

# 3. Load into PostgreSQL
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252
cd /root/trustcheck
docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data < scripts/db/init_v2.sql

# 4. Verify
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT COUNT(*) FROM companies_registry;"
# Expected: 716714
```

---

### 3️⃣ Run Lighthouse Audit ⏱️ 15 min
**Why:** Verify performance targets

**Steps:**
```bash
# Install CLI
npm install -g lighthouse

# Run audit
lighthouse http://46.224.147.252/ --view --output=html --output-path=lighthouse-report.html

# Target scores:
# ✅ Performance: >90
# ✅ Accessibility: >95
# ✅ Best Practices: >90
# ✅ SEO: >90
```

**Fix issues if score <90**

📖 **Fix Guide:** `LIGHTHOUSE_AUDIT_GUIDE.md`

---

### 4️⃣ Setup Uptime Monitoring ⏱️ 10 min
**Why:** Get alerts if site goes down

**Option A: UptimeRobot (Free)**
1. Go to https://uptimerobot.com/
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: http://46.224.147.252/
   - Name: TrustCheck Israel
   - Interval: 5 minutes
3. Add alert contacts (email/Telegram)

**Option B: Pingdom (Paid)**
- More detailed reports
- 1-minute checks
- Global locations

---

## 📋 This Week Checklist

- [ ] GA4 configured (5 min)
- [ ] Government data loaded (30 min)
- [ ] Lighthouse audit >90 (15 min)
- [ ] Uptime monitoring (10 min)
- [ ] Test all 11 UI components (20 min)
- [ ] Test search functionality (10 min)
- [ ] Test Gemini AI report generation (10 min)
- [ ] Mobile testing (iPhone/Android) (20 min)

**Total time:** ~2 hours

---

## 🚀 Phase 2 (Optional - Month 2)

### Domain + HTTPS (if needed later)
```bash
# 1. Configure DNS at registrar
trustcheck.co.il → A → 46.224.147.252

# 2. Wait 24h for DNS propagation

# 3. Install Let's Encrypt
ssh root@46.224.147.252
apt install certbot python3-certbot-nginx
certbot --nginx -d trustcheck.co.il -d www.trustcheck.co.il

# 4. Update docker-compose.yml
sed -i 's/nginx.dev.conf/nginx.conf/g' docker-compose.yml
docker compose restart nginx
```

---

## 📊 Success Metrics (30 Days)

After completing setup, track:

| Metric | Target | Check in GA4 |
|--------|--------|--------------|
| Unique Users | 500 | Acquisition → Overview |
| Searches | 1,000 | Events → search_business |
| Trust Reports | 800 | Events → view_report |
| Avg Session | 2-3 min | Engagement → Overview |
| Bounce Rate | <60% | Engagement → Pages |

---

## 🆘 Quick Troubleshooting

### Site not loading?
```bash
# Check containers
docker ps

# If app missing:
docker compose logs app

# Restart
docker compose restart app
```

### Database empty?
```bash
# Check row count
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT COUNT(*) FROM companies_registry;"

# If 0, reload data (see step 2)
```

### GA4 not tracking?
```bash
# Check env variable
docker compose exec app printenv | grep NEXT_PUBLIC_GA_ID

# If empty, rebuild:
docker compose down
docker compose up -d --build
```

---

## 📞 Support Resources

- **Production Logs:** `docker compose logs -f app`
- **Database Access:** `docker exec -it trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data`
- **Server SSH:** `ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252`
- **Health Check:** http://46.224.147.252/api/health

---

**Last Updated:** 23.12.2025  
**Status:** ✅ Ready for GA4 + Data Loading
