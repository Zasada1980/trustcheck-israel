// Google Analytics 4 Setup Instructions
// File: lib/analytics-setup.md

# Google Analytics 4 Configuration

## 1. Create GA4 Property

1. Go to https://analytics.google.com
2. Click **Admin** (gear icon)
3. Click **Create Property**
4. Fill in:
   - **Property name:** TrustCheck Israel
   - **Reporting time zone:** (GMT+02:00) Jerusalem
   - **Currency:** Israeli New Shekel (₪)
5. Click **Next**
6. **Industry category:** Online Communities
7. **Business size:** Small (1-10 employees)
8. Click **Create**

## 2. Get Measurement ID

1. In Admin → Data Streams
2. Click **Add stream** → **Web**
3. Fill in:
   - **Website URL:** https://trustcheck.co.il
   - **Stream name:** TrustCheck Production
4. Click **Create stream**
5. **Copy Measurement ID** (format: G-XXXXXXXXXX)

## 3. Add to Environment

**Local (.env.local):**
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Production (Hetzner server):**
```bash
ssh root@46.224.147.252
nano /root/trustcheck/.env

# Add:
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Restart app
docker-compose restart app
```

## 4. Verify Installation

**Check 1: Browser Console**
```javascript
// Open https://trustcheck.co.il
// Open DevTools Console (F12)
// Run:
gtag

// Should return: function gtag() { ... }
```

**Check 2: GA4 Realtime Report**
1. GA4 → Reports → Realtime
2. Open your site in another tab
3. Should see 1 active user

**Check 3: Event Tracking**
```typescript
// Test search event
import * as analytics from '@/lib/analytics';

analytics.trackSearch('Test Company', 'name_hebrew');
// Should appear in GA4 → Reports → Engagement → Events
```

## 5. Custom Events (Already Configured)

**lib/analytics.ts implements:**

| Event | Trigger | Parameters |
|-------|---------|------------|
| `search_business` | User searches company | `label`: input type |
| `view_report` | User views report | `label`: company name, `value`: trust score |
| `user_rating` | User rates report | `value`: rating (1-5) |
| `download_pdf` | User downloads PDF | `label`: company name |
| `error_occurred` | System error | `label`: error type + message |

## 6. Enhanced Measurement (Enable in GA4)

1. GA4 → Admin → Data Streams → trustcheck.co.il
2. **Enhanced measurement** → Click gear icon
3. Enable:
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search (configure: query parameter = `q`)
   - ✅ Video engagement (if adding videos)
   - ✅ File downloads (PDFs)

## 7. Goals & Conversions

**Mark these events as conversions:**

1. GA4 → Admin → Events
2. Find event → Toggle **Mark as conversion**
   - ✅ `view_report` (key action)
   - ✅ `user_rating` (engagement)
   - ✅ `download_pdf` (conversion)

## 8. Privacy & GDPR Compliance

**Cookie Consent (Phase 2):**
```typescript
// components/CookieConsent.tsx
// TODO: Implement cookie banner
// Libraries: react-cookie-consent, @cookie3/analytics
```

**IP Anonymization (Already enabled by default in GA4)**

**Data Retention:**
- GA4 → Admin → Data Settings → Data Retention
- Set to **14 months** (default)

## 9. Troubleshooting

**Issue: No data in GA4**
- Check `NEXT_PUBLIC_GA_ID` is set
- Verify Measurement ID format (G-XXXXXXXXXX)
- Check browser console for errors
- Disable ad blockers (test only)

**Issue: Events not tracking**
- Check `lib/analytics.ts` imports
- Verify `gtag` function exists (console: `typeof gtag`)
- Check GA4 Realtime → Events (may take 24h for reports)

**Issue: CORS errors**
- GA4 scripts load from `googletagmanager.com`
- Check CSP headers in `next.config.js`

## 10. Next.js App Router Gotchas

**✅ Correct setup (app/layout.tsx):**
```tsx
{process.env.NEXT_PUBLIC_GA_ID && (
  <>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
    <script dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
          page_path: window.location.pathname,
        });
      `
    }} />
  </>
)}
```

**❌ Wrong: Client Component**
- Don't use `'use client'` for GA4 scripts
- Must be in server-side layout

## 11. Dashboard Recommendations

**Create custom dashboard:**
1. GA4 → Reports → Library → Create new report
2. Add cards:
   - **Total searches** (event: search_business)
   - **Reports viewed** (event: view_report)
   - **Average trust score** (event parameter: value)
   - **User ratings** (event: user_rating)
   - **Conversion rate** (view_report / search_business)

**Export to Looker Studio:**
- GA4 → Admin → Product Links → Looker Studio
- Create TrustCheck Dashboard

## 12. Testing Checklist

- [ ] Measurement ID added to .env
- [ ] GA4 shows 1 active user (Realtime)
- [ ] Search event tracked
- [ ] Report view event tracked
- [ ] User rating event tracked
- [ ] Error events tracked
- [ ] Page views tracked automatically
- [ ] Mobile tested (responsive)
- [ ] Events marked as conversions

**Time to setup:** 30 minutes  
**Status after setup:** ✅ Production analytics ready
