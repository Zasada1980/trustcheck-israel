# Google Analytics 4 - Quick Setup Guide

**Status:** ✅ Code implemented, waiting for GA_ID

---

## ⚡ 5-Minute Setup

### Step 1: Create GA4 Property (3 min)

1. Go to **https://analytics.google.com/**
2. Click **Admin** (gear icon, bottom left)
3. Click **Create Property**
4. Fill in:
   - **Property name:** TrustCheck Israel
   - **Reporting time zone:** (GMT+02:00) Jerusalem
   - **Currency:** New Israeli Shekel (₪)
5. Click **Next** → Select industry: **Business Services**
6. Click **Create** → Accept Terms of Service

### Step 2: Get Measurement ID (1 min)

1. After creation, you'll see **Data Streams** page
2. Click **Add stream** → Choose **Web**
3. Fill in:
   - **Website URL:** http://46.224.147.252
   - **Stream name:** TrustCheck Production
4. Click **Create stream**
5. **COPY the Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Configure .env (1 min)

Open `.env` file and add your Measurement ID:

```bash
# Find this line at the bottom of .env:
NEXT_PUBLIC_GA_ID=

# Paste your ID (example):
NEXT_PUBLIC_GA_ID=G-ABC123XYZ
```

**Save the file!**

---

## 🚀 Deploy to Production

### Local Testing (Optional)
```bash
# Restart dev server to apply changes
npm run dev

# Visit http://localhost:3000
# Open browser DevTools → Network tab
# Search for "google-analytics.com" - you should see requests
```

### Production Deployment
```bash
# 1. Commit changes
git add .env
git commit -m "feat: Add Google Analytics 4 tracking ID"
git push origin main

# 2. Deploy to Hetzner server
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252

# 3. Update and rebuild
cd /root/trustcheck
git pull origin main
docker compose down
docker compose up -d --build

# 4. Wait for build to complete (~30 seconds)
docker compose logs -f app
# Wait for: "✓ Ready in XXXms"
```

---

## ✅ Verification (2 min)

### 1. Check Browser Network Tab
1. Open http://46.224.147.252/ in browser
2. Open **DevTools** (F12) → **Network** tab
3. Filter by "google"
4. You should see:
   - ✅ `gtag/js?id=G-XXXXXXXXXX` (200 OK)
   - ✅ `collect?v=2&...` (200 OK)

### 2. Check GA4 Real-Time Reports
1. Go to https://analytics.google.com/
2. Click **Reports** → **Realtime**
3. Open http://46.224.147.252/ in another tab
4. Within 30 seconds, you should see:
   - **1 active user** in Real-Time report
   - Event: `page_view`

---

## 📊 Events Being Tracked

Our implementation tracks these custom events:

### 1. Page Views (Automatic)
```typescript
// Triggered on every route change
gtag('config', 'G-XXXXXXXXXX', {
  page_path: window.location.pathname
});
```

### 2. Business Search
```typescript
// When user searches for a business
trackSearch(businessName, inputType);
// inputType: 'hp_number' | 'phone' | 'name_hebrew' | 'name_english'
```

### 3. Report View
```typescript
// When trust report is generated
trackReportView(businessName, trustScore);
// trustScore: 0-100
```

### 4. User Rating
```typescript
// When user rates a business
trackRating(rating);
// rating: 1-5 stars
```

### 5. Errors
```typescript
// When error occurs
trackError(errorType, errorMessage);
// errorType: 'gemini_api' | 'postgres' | 'validation' | 'network'
```

---

## 🔍 Testing Event Tracking

After deployment, test each event:

### Test 1: Search Event
1. Go to http://46.224.147.252/
2. Enter "גן ילדים השרון" in search box
3. Click search button
4. **Check GA4:** Reports → Realtime → Event name: `search_business`

### Test 2: Report View
1. Wait for report to load
2. **Check GA4:** Event name: `view_report`
3. **Check parameters:**
   - `event_label`: Business name
   - `value`: Trust score (0-100)

### Test 3: Error Tracking
1. Enter invalid H.P. number: `123`
2. Click search
3. **Check GA4:** Event name: `error`
4. **Check parameters:**
   - `event_category`: technical
   - `event_label`: validation: Invalid HP number

---

## 📈 Custom Reports (Optional - Week 2)

Create custom reports in GA4 to track:

### Top Searches by Input Type
1. Go to **Explore** → **Blank**
2. Add dimension: `event_label` (input_type)
3. Add metric: `Event count`
4. Filter: `event_name = search_business`

### Trust Score Distribution
1. Add dimension: `value` (trust_score)
2. Add metric: `Event count`
3. Filter: `event_name = view_report`
4. Visualization: **Bar chart**

### Error Rate by Type
1. Add dimension: `event_label` (error_type)
2. Add metric: `Event count`
3. Filter: `event_name = error`
4. Visualization: **Pie chart**

---

## 🐛 Troubleshooting

### Problem: No requests to google-analytics.com
**Check:**
```bash
# 1. Verify NEXT_PUBLIC_GA_ID is set
docker compose exec app printenv | grep NEXT_PUBLIC_GA_ID
# Should output: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 2. If empty, rebuild:
docker compose down
docker compose up -d --build
```

### Problem: Events not showing in GA4
**Wait 24 hours** — new properties take time to activate

### Problem: 404 on gtag.js
**Check Measurement ID format:**
- ✅ Correct: `G-ABC123XYZ` (starts with G-)
- ❌ Wrong: `UA-123456-1` (old Universal Analytics)

---

## 📊 Expected Results (Phase 1 - Month 1)

After 30 days with GA4 tracking:

| Metric | Target | GA4 Report |
|--------|--------|------------|
| Unique Users | 500 | Acquisition → User acquisition |
| Page Views | 2,000+ | Reports → Pages and screens |
| Searches | 1,000 | Events → search_business |
| Report Views | 800 | Events → view_report |
| Avg. Trust Score | 65-75 | Custom report (value parameter) |
| Error Rate | <5% | Events → error |

---

## 🔗 Useful Links

- **GA4 Home:** https://analytics.google.com/
- **GA4 Setup Guide:** https://support.google.com/analytics/answer/9304153
- **Event Reference:** https://developers.google.com/analytics/devguides/collection/ga4/events
- **Measurement Protocol:** https://developers.google.com/analytics/devguides/collection/protocol/ga4

---

**Last Updated:** 23.12.2025  
**Status:** ✅ Ready to configure (just add GA_ID)
