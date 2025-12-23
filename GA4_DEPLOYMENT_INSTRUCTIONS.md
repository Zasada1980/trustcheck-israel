# GA4 Deployment Instructions

**Measurement ID:** G-D7CJVWP2X3  
**Date:** 23.12.2025

---

## 🚀 Quick Deploy (5 minutes)

### Step 1: Create .env on Server
```bash
# SSH to server
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# Navigate to project
cd /root/trustcheck

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://46.224.147.252
NEXT_PUBLIC_APP_NAME=TrustCheck Israel

GOOGLE_API_KEY=AIzaSyBVI2c5f0YvpDjWLyl25DjfPuNQ4UfBrjw
GOOGLE_GEMINI_MODEL=gemini-2.0-flash
GOOGLE_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=trustcheck_gov_data
POSTGRES_USER=trustcheck_admin
POSTGRES_PASSWORD=TrustCheck2025SecurePass!

NEXT_PUBLIC_GA_ID=G-D7CJVWP2X3
EOF

# Verify
cat .env | grep NEXT_PUBLIC_GA_ID
# Should output: NEXT_PUBLIC_GA_ID=G-D7CJVWP2X3
```

### Step 2: Rebuild Docker Container
```bash
# Still on server
docker compose down
docker compose up -d --build

# Wait for build (~30 seconds)
docker compose logs -f app
# Wait for: "✓ Ready in XXXms"
# Press Ctrl+C to exit logs
```

### Step 3: Verify GA4 is Working
```bash
# Test from local machine
curl -s http://46.224.147.252/ | grep "gtag.js"

# Expected output:
# <script async src="https://www.googletagmanager.com/gtag/js?id=G-D7CJVWP2X3"></script>
```

---

## ✅ Verification Checklist

### 1. Check Environment Variable
```bash
# On server
docker compose exec app printenv | grep NEXT_PUBLIC_GA_ID

# Expected output:
# NEXT_PUBLIC_GA_ID=G-D7CJVWP2X3
```

### 2. Check Browser Network Tab
1. Open http://46.224.147.252/ in browser
2. Open DevTools (F12) → Network tab
3. Filter by "google"
4. You should see:
   - ✅ Request to `gtag/js?id=G-D7CJVWP2X3` (Status: 200)
   - ✅ Request to `collect?v=2&...` (Status: 200)

### 3. Check GA4 Real-Time Reports
1. Go to https://analytics.google.com/
2. Select property "TrustCheck Israel"
3. Click Reports → Realtime
4. Open http://46.224.147.252/ in another tab
5. Within 30 seconds, you should see:
   - ✅ **1 active user** in dashboard
   - ✅ Event: `page_view`
   - ✅ Page: `/`

---

## 🎯 What Gets Tracked

### Automatic Events
- **page_view** — Every page load
- **session_start** — New user session
- **first_visit** — First time visitor
- **user_engagement** — Active users

### Custom Events (Implemented)
```typescript
// lib/analytics.ts provides:

1. trackSearch(businessName, inputType)
   - Event: search_business
   - Parameters: event_label (hp_number/phone/name)

2. trackReportView(businessName, trustScore)
   - Event: view_report
   - Parameters: event_label (business name), value (0-100)

3. trackRating(rating)
   - Event: user_rating
   - Parameters: event_label (rating_1 to rating_5), value (1-5)

4. trackError(errorType, errorMessage)
   - Event: error
   - Parameters: event_category (technical), event_label (error details)
```

---

## 🐛 Troubleshooting

### Problem: No GA4 scripts in HTML
**Check:**
```bash
# Verify env var is set
docker compose exec app printenv | grep NEXT_PUBLIC_GA_ID

# If empty or missing:
# 1. Check .env file exists on server
# 2. Rebuild: docker compose down && docker compose up -d --build
```

### Problem: Scripts present but no data in GA4
**Wait 24-48 hours** — New GA4 properties can take time to start collecting data

### Problem: "Could not find the property" error in GA4
**Check Measurement ID:**
- ✅ Should be: `G-D7CJVWP2X3`
- ❌ NOT: `UA-XXXXXXX` (old Universal Analytics format)

### Problem: Data coming from localhost instead of IP
**Update .env on server:**
```bash
# Change this line:
NEXT_PUBLIC_APP_URL=http://46.224.147.252
```

---

## 📊 Expected Results (7 Days)

After 1 week with GA4 tracking:

| Metric | Where to Check | Expected |
|--------|----------------|----------|
| Active Users | Reports → Realtime | Real-time visitors |
| Page Views | Reports → Engagement → Pages | All page loads |
| Search Events | Reports → Engagement → Events → search_business | User searches |
| Report Views | Reports → Engagement → Events → view_report | Generated reports |
| Avg Trust Score | Explore → Custom report (value parameter) | 60-80 range |
| Error Rate | Events → error | <5% of sessions |

---

## 🔍 Testing Events

### Test Search Tracking
1. Open http://46.224.147.252/
2. Enter "גן ילדים השרון" in search box
3. Click search button
4. **Check GA4:** Reports → Realtime → Event: `search_business`

### Test Report View Tracking
1. Wait for trust report to generate
2. **Check GA4:** Event: `view_report`
3. **Parameters:**
   - `event_label`: Business name
   - `value`: Trust score (0-100)

### Test Error Tracking
1. Enter invalid input: "abc"
2. Try to search
3. **Check GA4:** Event: `error`
4. **Parameters:**
   - `event_category`: technical
   - `event_label`: validation error details

---

## 📈 Next Steps

### Week 1: Monitor Basic Metrics
- Daily check: Active users, Page views
- Goal: Establish baseline traffic

### Week 2: Analyze User Behavior
- Top search queries (event_label in search_business)
- Most viewed businesses (event_label in view_report)
- Average trust scores (value parameter)

### Week 3: Optimize Based on Data
- High bounce rate pages → Improve content
- Low conversion → Adjust CTA buttons
- Errors → Fix validation/API issues

### Month 1: Create Custom Reports
- Search-to-Report conversion rate
- Trust score distribution
- Geographic data (if available)
- Device breakdown (mobile vs desktop)

---

## 🔗 Resources

- **GA4 Dashboard:** https://analytics.google.com/
- **Property ID:** TrustCheck Israel
- **Measurement ID:** G-D7CJVWP2X3
- **Stream:** TrustCheck Production (http://46.224.147.252)

---

**Deployment Date:** 23.12.2025  
**Status:** ✅ Ready to deploy  
**Estimated Setup Time:** 5 minutes
