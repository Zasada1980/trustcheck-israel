# GitHub Copilot Instructions for TrustCheck Israel

## Project Overview

**TrustCheck Israel** (formerly SBF) - B2C platform for verifying Israeli business reliability. Targeted at parents checking private businesses (daycare, tutors) before making payments.

**Phase:** MVP "Validator" (4 weeks development)  
**Stack:** Next.js 14 + PostgreSQL + Google Gemini AI + Docker  
**Working Directory:** `E:\SBF\`  
**Repository:** `Zasada1980/trustcheck-israel`

**Target Business Types:**
- עוסק פטור (exempt business)
- עוסק מורשה (registered business)
- חברות בע"מ (Israeli LLC)

---

## Architecture: Hybrid Data Strategy

**CRITICAL:** System uses 3-tier fallback for data fetching (`lib/unified_data.ts`):

```typescript
// Priority chain:
1. PostgreSQL cache (data.gov.il datasets) → Fast, cached
2. Real-time scraping (ica.justice.gov.il, court.gov.il) → Accurate
3. Mock data (lib/checkid.ts) → Development fallback
```

**Key Files:**
- `lib/unified_data.ts` - Orchestrates data sources, returns `UnifiedBusinessData`
- `lib/db/postgres.ts` - 6 tables: companies_registry, legal_cases, execution_proceedings, etc.
- `lib/gemini.ts` - Generates Hebrew trust reports using Gemini 2.0 Flash (retry logic: 3 attempts, 2s backoff)
- `app/api/report/route.ts` - Main API endpoint, converts unified data → CheckID format for Gemini

**Data Flow Example:**
```
User searches "ח.פ. 515044532" → /api/report 
→ unified_data.getBusinessData() 
→ postgres.searchLocalCompany() OR scraping OR mock 
→ gemini.generateBusinessReport() 
→ Hebrew trust report displayed
```

---

## Development Workflows

### Local Development
```powershell
# Start development server (port 3000)
npm run dev

# Type checking (run before commit)
npm run type-check

# Start PostgreSQL + app stack
docker compose up -d
docker compose logs -f app
```

### Database Operations
```powershell
# Load government data from data.gov.il (716K companies)
pwsh scripts/download_government_data.ps1

# Init schema v2 (29 columns from companies registry)
docker exec -i trustcheck-postgres psql -U trustcheck_admin -d trustcheck_gov_data < scripts/db/init_v2.sql
```

**Schema Quirks:**
- `hp_number` is BIGINT (9 digits, e.g., 515044532)
- Dates use Israeli format `DD/MM/YYYY` (text field)
- 3 status codes: active/inactive/violating

### Production Deployment
```powershell
# 1. Test locally first
docker compose build
docker compose up

# 2. Deploy to Hetzner CX23 (46.224.147.252)
ssh -i C:\Users\zakon\.ssh\trustcheck_hetzner root@46.224.147.252
cd /root/trustcheck
git pull origin main
docker-compose down && docker-compose up -d --build

# 3. Check health
curl https://trustcheck.co.il/api/health
```

**NGINX Config:** Uses `nginx.conf` (HTTPS + SSL) in production, `nginx.dev.conf` (HTTP) locally.

---

## Environment Variables

**Required for Build:**
```env
# PostgreSQL (Government Data Cache)
POSTGRES_HOST=localhost          # 'postgres' in Docker
POSTGRES_PORT=5432
POSTGRES_DB=trustcheck_gov_data
POSTGRES_USER=trustcheck_admin
POSTGRES_PASSWORD=<secure-password>

# Google Gemini AI
GOOGLE_API_KEY=<your-api-key>
GOOGLE_GEMINI_MODEL=gemini-2.0-flash

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://trustcheck.co.il
NEXT_PUBLIC_APP_NAME=TrustCheck Israel

# Future: CheckID API (Phase 2)
CHECKID_API_URL=https://api.checkid.co.il
CHECKID_API_KEY=<not-yet-configured>
```

**Generate secure password:** `openssl rand -base64 32`

---

## Code Patterns & Conventions

### 1. Input Validation (SearchForm.tsx)
```typescript
// ALWAYS validate user input by type:
function validateInput(query: string): { 
  type: 'hp_number' | 'phone' | 'name_hebrew' | 'name_english' | 'invalid'; 
  isValid: boolean 
}

// Examples:
"515044532" → hp_number (9 digits)
"0523456789" → phone (10 digits, starts with 05)
"גן ילדים" → name_hebrew (Hebrew chars)
```

### 2. Error Handling with Retries
```typescript
// lib/gemini.ts pattern - exponential backoff for API calls
async function retryGemini<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 2000
): Promise<T> {
  // Don't retry on quota errors
  if (errorMessage.includes('quota')) throw error;
  
  // Exponential: 2s, 4s, 8s
  await setTimeout(delay * Math.pow(2, i));
}
```

### 3. Analytics Tracking
```typescript
// Track ALL user interactions via lib/analytics.ts
import * as analytics from '@/lib/analytics';

analytics.trackSearch(businessName, 'hp_number');
analytics.trackReportView(name, trustScore);
analytics.trackError('report_generation', errorMessage);
```

### 4. RTL Support (Hebrew)
```tsx
// Use Tailwind RTL utilities for Hebrew text
<p className="text-right">בדוק את העסק</p>
<div className="max-w-2xl mx-auto" dir="rtl">
  {/* Hebrew content */}
</div>
```

---

## Testing & Debugging

### Mock Data Toggle
```typescript
// lib/unified_data.ts forces mock in development
const businessData = await getBusinessData(hpNumber, {
  includeLegal: true,
  forceRefresh: false, // Use cache if available
});

// Test with known H.P. numbers:
// 515044532 - "Gan Yeladim Hasharon" (mock)
// 520012345 - Real company (requires PostgreSQL data)
```

### Health Check Endpoint
```bash
curl http://localhost:3000/api/health

# Returns:
{
  "status": "healthy",
  "timestamp": "2025-12-23T10:00:00Z",
  "environment": "development",
  "services": {
    "gemini": true,  # GOOGLE_API_KEY set
    "postgres": true # Database connection OK
  }
}
```

---

## Research Guidelines

### Market Research Protocol
When conducting competitive analysis:

1. **Language:** Search in **Hebrew** for Israeli platforms
2. **Exclusions:** Skip government portals (רשם החברות, מע"מ, נט המשפט)
3. **Criteria:** Platform must cover ≥3 of 4 features:
   - Owner identification
   - Tax/financial reports
   - Legal cases search
   - Credit rating

4. **Output Format:**
```markdown
# Report: Israeli Business Intelligence Platforms
Date: YYYY-MM-DD

## Executive Summary
TOP-10 ranked platforms...

## Detailed Analysis: TOP-5
1. Platform Name
   - Features: [list]
   - API: Yes/No
   - Cost: ₪X/month
   - Source: [URL]
```

5. **Save to:** `research/reports/YYYY-MM-DD_topic_report.md`

---

## Key Performance Targets

**Phase 1 Success Metrics (Month 1):**
- 500 unique users
- 1,000 business checks
- 5% premium conversion (50 paid checks)
- ₪250 revenue
- <3s page load time (Lighthouse)

**Critical Files for Optimization:**
- `app/page.tsx` - Landing page (current: 60 lines)
- `components/SearchForm.tsx` - Main UX (304 lines)
- `lib/unified_data.ts` - Data layer (362 lines)

---

## Known Issues & Gotchas

1. **CheckID API not yet integrated** - Using mock data in `lib/checkid.ts` (Phase 2 target)
2. **Date format inconsistency** - Government data uses `DD/MM/YYYY` (text), convert when needed
3. **Gemini quota limits** - 1500 requests/day on free tier, implement caching
4. **Hebrew character encoding** - Always use UTF-8, test with `עברית` strings
5. **Docker standalone mode** - `next.config.js` has `output: 'standalone'` for production

---

**Last Updated:** 23.12.2025  
**Documentation:** See `PHASE_1_SPECIFICATION.md` (1240 lines) for full requirements
