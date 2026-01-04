# Quick Start: AI Database Deployment

**Estimated Time:** 20 minutes  
**Downtime:** 15-20 minutes  
**Risk:** Low (full backup + rollback plan)

---

## 🚀 Pre-Flight Checklist

- [ ] Read `AI_DATABASE_DEPLOYMENT_GUIDE.md` (5 min)
- [ ] Review `AI_DATABASE_SCHEMA_DIAGRAM.md` (optional)
- [ ] Schedule maintenance window (20 min)
- [ ] Notify beta users (if any)

---

## 📋 Deployment Steps

### Step 1: Backup Current Database (5 min)
```bash
# SSH to server
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Create backup directory
mkdir -p /root/backups

# Backup database
docker exec trustcheck-postgres pg_dump \
  -U trustcheck_admin \
  -d trustcheck_gov_data \
  | gzip > /root/backups/pre_ai_schema_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup
ls -lh /root/backups/
# Should see: pre_ai_schema_YYYYMMDD_HHMMSS.sql.gz (~50-100 MB)
```

### Step 2: Upload Schema Files (2 min)
```bash
# From local machine (PowerShell)
scp -i C:\Users\zakon\.ssh\trustcheck_hetzner `
    E:\SBF\scripts\db\init_ai_optimized.sql `
    E:\SBF\scripts\db\migrate_to_ai_schema.sql `
    root@46.224.147.252:/root/trustcheck/scripts/db/
```

### Step 3: Create New Schema (2 min)
```bash
# On server
docker exec -i trustcheck-postgres psql \
  -U trustcheck_admin \
  -d trustcheck_gov_data \
  < /root/trustcheck/scripts/db/init_ai_optimized.sql

# Expected output:
# CREATE EXTENSION
# DROP TABLE (if exists)
# CREATE TABLE ai_business_profiles
# CREATE TABLE ai_risk_indicators
# ...
# ✅ AI-Optimized Database Schema v4 created successfully!
```

### Step 4: Migrate Data (10 min)
```bash
# On server
docker exec -i trustcheck-postgres psql \
  -U trustcheck_admin \
  -d trustcheck_gov_data \
  < /root/trustcheck/scripts/db/migrate_to_ai_schema.sql

# Expected output:
# INSERT 0 716714  (migrated businesses)
# INSERT 0 716714  (risk indicators)
# NOTICE: ✅ Migrated VAT dealers
# REFRESH MATERIALIZED VIEW
# 
# Migration Report:
# Total Businesses Migrated: 716714
# Active Businesses: 685342 (95.6%)
# High Risk Businesses: 31372 (4.4%)
# Average Data Completeness: 58.3/100
# 
# ✅ Migration completed successfully!
```

### Step 5: Verify Data (2 min)
```bash
# On server
docker exec -it trustcheck-postgres psql \
  -U trustcheck_admin \
  -d trustcheck_gov_data

# Check counts
SELECT COUNT(*) FROM ai_business_profiles;
-- Should return: 716714

SELECT COUNT(*) FROM ai_risk_indicators;
-- Should return: 716714

SELECT COUNT(*) FROM ai_business_summary;
-- Should return: 716714

# Test single business query
SELECT * FROM ai_business_summary WHERE business_id = 515044532;
-- Should return: 1 row with all data

# Test JSON export
SELECT get_ai_business_profile(515044532);
-- Should return: JSON object with business, risk, financial, etc.

\q
```

### Step 6: Update Application Code (Local, 5 min)

**File:** `lib/unified_data.ts`

```typescript
// BEFORE (old schema)
import { searchLocalCompany } from '@/lib/db/postgres';

export async function getBusinessData(hpNumber: string) {
  const company = await searchLocalCompany(hpNumber);
  // ... complex transformation logic
}

// AFTER (new schema)
import { getBusinessSummary, getCachedAnalysis } from '@/lib/db/postgres_ai';

export async function getBusinessData(hpNumber: string) {
  // 1. Get consolidated summary (20ms, includes all data)
  const summary = await getBusinessSummary(parseInt(hpNumber));
  if (!summary) return null;
  
  // 2. Check cache first
  const cached = await getCachedAnalysis(parseInt(hpNumber));
  if (cached && !cached.isStale) {
    return { ...summary, cachedAnalysis: cached };
  }
  
  return summary;
}
```

**Commit and push:**
```bash
git add lib/unified_data.ts lib/db/postgres_ai.ts
git commit -m "feat: integrate AI-optimized database schema v4"
git push origin main
```

### Step 7: Deploy Updated App (5 min)
```bash
# On server
cd /root/trustcheck

# Pull latest code
git pull origin main

# Rebuild app with new code
docker compose down app
docker compose build --no-cache app
docker compose up -d app

# Verify logs
docker logs trustcheck-app --tail 50

# Should see:
# ✓ Ready in 87ms
# ○ Compiling / ...
# ✓ Compiled / in 2.3s
```

### Step 8: Test Production Site (2 min)
```bash
# Test HTTPS
curl -I https://trustcheck.co.il
# Expected: HTTP/2 200

# Test API endpoint with cached business
curl "https://trustcheck.co.il/api/report?hp=515044532" | jq .

# Expected response (< 2 seconds):
# {
#   "business": {
#     "businessId": 515044532,
#     "businessName": "קייטרינג אירועים משה מזרחי",
#     "isActive": true,
#     "overallRiskScore": 30
#   },
#   "analysis": {
#     "trustScore": 3.0,
#     "strengths": [...],
#     "risks": [...]
#   }
# }
```

---

## ✅ Success Criteria

After deployment, verify:

- [x] All 716K records migrated (check counts)
- [x] No errors in app logs
- [x] Site loads in < 3 seconds
- [x] Search returns results in < 1 second
- [x] Reports generate in < 3 seconds
- [x] Test H.P. 515044532 works
- [x] Database queries < 50ms

---

## 🔄 Post-Deployment Tasks

### Setup Cron Jobs (5 min)
```bash
# On server
crontab -e

# Add these lines:
# Refresh materialized view every 6 hours
0 */6 * * * docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT refresh_business_summary();" >> /root/trustcheck/logs/db_refresh.log 2>&1

# Clean stale cache weekly (Sunday 3 AM)
0 3 * * 0 docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "DELETE FROM ai_analysis_cache WHERE is_stale = true;" >> /root/trustcheck/logs/cache_cleanup.log 2>&1

# Database backup daily (3 AM)
0 3 * * * docker exec trustcheck-postgres pg_dump -U trustcheck_admin trustcheck_gov_data | gzip > /root/backups/trustcheck_$(date +\%Y\%m\%d).sql.gz && ls -t /root/backups/trustcheck_*.sql.gz | tail -n +8 | xargs rm -f
```

---

## 🐛 Troubleshooting

### Issue: Migration fails with "hp_number not found"
```bash
# Check if old table exists
docker exec -it trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT COUNT(*) FROM companies_registry;"

# If error, restore from backup
gunzip < /root/backups/pre_ai_schema_*.sql.gz | docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data
```

### Issue: App can't connect to database
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs trustcheck-postgres --tail 50

# Verify connection
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT 1;"
```

### Issue: Queries still slow (> 100ms)
```bash
# Refresh materialized view manually
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "SELECT refresh_business_summary();"

# Check indexes
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data -c "\d+ ai_business_summary"
```

---

## 🎯 Rollback Plan (if needed)

### Option 1: Restore from Backup (10 min)
```bash
# On server
docker exec trustcheck-postgres psql -U trustcheck_admin -c "DROP DATABASE trustcheck_gov_data;"
docker exec trustcheck-postgres psql -U trustcheck_admin -c "CREATE DATABASE trustcheck_gov_data;"

gunzip < /root/backups/pre_ai_schema_*.sql.gz | docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data

# Revert app code
cd /root/trustcheck
git revert HEAD
docker compose build --no-cache app
docker compose up -d app
```

### Option 2: Keep Both Schemas (0 downtime)
```bash
# Old schema still exists (companies_registry, vat_dealers)
# New schema added (ai_business_profiles, etc.)
# Just revert app code to use old schema
```

---

## 📊 Performance Monitoring

### Check Query Performance
```bash
# On server
docker exec trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data

# Enable timing
\timing

# Test materialized view query
SELECT * FROM ai_business_summary WHERE business_id = 515044532;
-- Should show: Time: 15-25 ms

# Test old schema query (for comparison)
SELECT * FROM companies_registry WHERE hp_number = 515044532;
-- Should show: Time: 5-10 ms (single table, no JOINs)

# Test complex JOIN (old way)
SELECT c.*, COUNT(l.id) as cases 
FROM companies_registry c 
LEFT JOIN legal_cases l ON c.hp_number = l.company_hp_number 
WHERE c.hp_number = 515044532 
GROUP BY c.id;
-- Should show: Time: 150-200 ms (with JOINs)
```

### Monitor Cache Hit Rate
```sql
-- Get cache statistics
SELECT 
  COUNT(*) as total_cached,
  COUNT(*) FILTER (WHERE is_stale = false) as fresh_cache,
  ROUND(AVG(view_count), 1) as avg_views,
  ROUND(COUNT(*) FILTER (WHERE is_stale = false) * 100.0 / COUNT(*), 1) as fresh_percentage
FROM ai_analysis_cache;

-- Expected: 
-- total_cached: grows over time
-- fresh_cache: ~80% of total
-- avg_views: 2-5
```

---

## 📞 Support

**Issues?** Check `AI_DATABASE_DEPLOYMENT_GUIDE.md` (full troubleshooting)  
**Questions?** See `AI_DATABASE_SCHEMA_DIAGRAM.md` (visual diagrams)  
**Need help?** Create GitHub issue on `Zasada1980/trustcheck-israel`

---

**Last Updated:** 27.12.2025  
**Status:** ✅ Ready for Production  
**Estimated Total Time:** 20 minutes
