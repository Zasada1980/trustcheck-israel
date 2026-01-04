# Integration Roadmap - TrustCheck Israel UI/UX

**Date:** 28 December 2025  
**Version:** 1.0  
**Based On:** UI_FUNCTIONALITY_AUDIT.md findings

---

## Executive Summary

**Goal:** Transform TrustCheck from MVP to production-ready platform with full UI/UX functionality

**Timeline:** 4 phases over 8 weeks (320-450 development hours)

**Key Deliverables:**
1. **Phase 0 (Week 1):** Legal compliance + payment gateway ✅
2. **Phase 1 (Week 2):** Authentication system (registration/login) ✅
3. **Phase 2 (Week 3-4):** User dashboard + analytics enhancements ✅
4. **Phase 3 (Month 2):** Advanced features (subscriptions, invoices, live chat) ✅

**Critical Path Issues:**
- 🔴 **7 non-functional buttons/links** (47% of interactive elements)
- 🔴 **5 missing pages** (contact, terms, privacy, cookies, disclaimer)
- 🔴 **No payment gateway** (blocking revenue)
- 🔴 **No authentication** (blocking user accounts)

---

## Phase 0: Critical Pre-Launch Fixes (Week 1)

**Duration:** 5-7 days  
**Effort:** 35-55 hours  
**Priority:** P0 (Blocking launch)  
**Goal:** Minimum legal compliance + revenue generation capability

---

### Task 0.1: Legal Pages Implementation

**Duration:** 2 days (8-12 hours)  
**Developer:** Full-stack developer + legal consultant  
**Priority:** P0

#### Subtasks:

**0.1.1 Create Terms of Service Page** (3-4 hours)
- [ ] Create `app/terms/page.tsx`
- [ ] Content sections:
  - Service description
  - User obligations
  - Payment terms (7-day refund policy per Israeli law)
  - Liability limitations
  - Dispute resolution (Israeli courts)
  - Data usage
- [ ] Hebrew primary, English translation
- [ ] Last updated timestamp
- [ ] "I agree" checkbox for registration flow

**Files to Create:**
```
app/terms/page.tsx (200-300 lines)
app/terms/layout.tsx (optional, for print styling)
```

**0.1.2 Create Privacy Policy Page** (2-3 hours)
- [ ] Create `app/privacy/page.tsx`
- [ ] Content sections:
  - Data collection (email, phone, search queries)
  - Data usage (AI analysis, Google Analytics)
  - Third-party services disclosure:
    - Google Gemini AI
    - PostgreSQL hosting (Hetzner)
    - Google Analytics
  - User rights (GDPR: access, deletion, export)
  - Cookie usage
  - Data retention (90 days for searches)
  - Contact for privacy requests

**Files to Create:**
```
app/privacy/page.tsx (250-350 lines)
```

**0.1.3 Create Cookie Policy Page** (1-2 hours)
- [ ] Create `app/cookies/page.tsx`
- [ ] Content:
  - Essential cookies (session management)
  - Analytics cookies (Google Analytics)
  - Cookie management instructions
  - Browser settings guide

**Files to Create:**
```
app/cookies/page.tsx (150-200 lines)
```

**0.1.4 Create Disclaimer Page** (1-2 hours)
- [ ] Create `app/disclaimer/page.tsx`
- [ ] Content:
  - Data accuracy limitations
  - Not legal/financial advice
  - Third-party data sources (government databases)
  - No liability for business decisions
  - Service interruptions disclaimer

**Files to Create:**
```
app/disclaimer/page.tsx (150-200 lines)
```

**0.1.5 Legal Review** (1 hour)
- [ ] External legal consultant review
- [ ] Verify Israeli consumer protection compliance
- [ ] GDPR compliance check
- [ ] Sign-off document

**Testing:**
- [ ] All footer links work (no 404s)
- [ ] Mobile responsive
- [ ] Print-friendly styling
- [ ] RTL Hebrew layout

---

### Task 0.2: Payment Gateway Integration

**Duration:** 3-5 days (24-40 hours)  
**Developer:** Full-stack developer with payment experience  
**Priority:** P0  
**Technology Choice:** Tranzilla (Israeli market recommended)

#### Subtasks:

**0.2.1 Provider Setup** (2-4 hours)
- [ ] Register Tranzilla account (or Stripe)
- [ ] Get API credentials (sandbox + production)
- [ ] Configure webhook endpoint
- [ ] Test credentials

**Files to Create:**
```
.env.local:
TRANZILLA_TERMINAL_ID=your_terminal
TRANZILLA_API_KEY=your_key
TRANZILLA_WEBHOOK_SECRET=your_secret
TRANZILLA_SANDBOX=true (for testing)
```

**0.2.2 Database Schema** (2-3 hours)
- [ ] Create `transactions` table
- [ ] Create `subscriptions` table
- [ ] Migration script

**Files to Create:**
```sql
-- scripts/db/migration_002_payments.sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255), -- Until auth system ready
  plan_type VARCHAR(50) NOT NULL, -- 'full_report' or 'monthly'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_provider VARCHAR(50) NOT NULL, -- 'tranzilla'
  transaction_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255), -- Until auth system ready
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'expired'
  started_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_email ON transactions(user_email);
CREATE INDEX idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX idx_transactions_status ON transactions(status);
```

**0.2.3 Backend API Endpoints** (8-12 hours)
- [ ] `/api/payment/create-session` - Create Tranzilla payment
- [ ] `/api/payment/webhook` - Handle payment confirmations
- [ ] `/api/payment/status/:id` - Check payment status

**Files to Create:**
```typescript
// app/api/payment/create-session/route.ts (150-200 lines)
import { NextRequest, NextResponse } from 'next/server';
import Tranzilla from '@/lib/tranzilla'; // SDK wrapper

export async function POST(request: NextRequest) {
  // 1. Validate input
  const { plan, email } = await request.json();
  
  // 2. Calculate amount
  const amount = plan === 'full_report' ? 29 : 99;
  
  // 3. Create Tranzilla payment link
  const payment = await Tranzilla.createPayment({
    amount,
    currency: 'ILS',
    description: `TrustCheck - ${plan}`,
    customer_email: email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
  });
  
  // 4. Store transaction (pending)
  await db.transactions.create({
    user_email: email,
    plan_type: plan,
    amount,
    status: 'pending',
    payment_provider: 'tranzilla',
    transaction_id: payment.id,
  });
  
  // 5. Return payment URL
  return NextResponse.json({
    success: true,
    payment_url: payment.url,
    transaction_id: payment.id,
  });
}

// app/api/payment/webhook/route.ts (200-250 lines)
export async function POST(request: NextRequest) {
  // 1. Verify webhook signature
  const signature = request.headers.get('x-tranzilla-signature');
  if (!Tranzilla.verifyWebhook(signature, await request.text())) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // 2. Parse webhook data
  const data = await request.json();
  
  // 3. Update transaction status
  await db.transactions.update({
    where: { transaction_id: data.transaction_id },
    data: {
      status: data.status === 'success' ? 'completed' : 'failed',
      updated_at: new Date(),
    },
  });
  
  // 4. If subscription, create subscription record
  if (data.plan_type === 'monthly' && data.status === 'success') {
    await db.subscriptions.create({
      user_email: data.customer_email,
      plan_type: 'monthly',
      status: 'active',
      started_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    });
  }
  
  // 5. Send confirmation email
  await sendEmail({
    to: data.customer_email,
    subject: 'תשלום התקבל - TrustCheck Israel',
    template: 'payment_confirmation',
    data: { amount: data.amount, plan: data.plan_type },
  });
  
  return NextResponse.json({ success: true });
}

// app/api/payment/status/[id]/route.ts (50-80 lines)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const transaction = await db.transactions.findUnique({
    where: { transaction_id: params.id },
  });
  
  return NextResponse.json(transaction);
}
```

**0.2.4 Checkout Page** (6-8 hours)
- [ ] Create `app/checkout/page.tsx`
- [ ] Form: email, plan selection
- [ ] Tranzilla redirect button
- [ ] Loading states
- [ ] Error handling

**Files to Create:**
```typescript
// app/checkout/page.tsx (200-300 lines)
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'full_report'; // or 'monthly'
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const planDetails = {
    full_report: { name: 'דוח מלא', price: 29 },
    monthly: { name: 'מנוי חודשי', price: 99 },
  };
  
  const handleCheckout = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('נא להזין אימייל תקין');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה ביצירת תשלום');
      }
      
      // Redirect to Tranzilla payment page
      window.location.href = data.payment_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">השלמת תשלום</h1>
        
        {/* Plan Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700">חבילה: {planDetails[plan].name}</p>
          <p className="text-3xl font-bold text-blue-600">
            ₪{planDetails[plan].price}
          </p>
        </div>
        
        {/* Email Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3 border rounded-lg"
            dir="ltr"
          />
        </div>
        
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg disabled:bg-gray-400"
        >
          {loading ? 'מעביר לעמוד תשלום...' : 'המשך לתשלום מאובטח'}
        </button>
        
        {/* Security Badges */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
          <span>🔒 SSL מאובטח</span>
          <span>💳 Tranzilla</span>
          <span>✓ הצפנה מלאה</span>
        </div>
      </div>
    </div>
  );
}
```

**0.2.5 Success/Cancel Pages** (2-3 hours)
- [ ] Create `app/payment/success/page.tsx`
- [ ] Create `app/payment/cancel/page.tsx`

**0.2.6 Update Pricing Page Links** (1 hour)
- [ ] Change `plan.link = '/'` to `plan.link = '/checkout?plan=full_report'`
- [ ] Update CTA button links

**Files to Modify:**
```typescript
// app/pricing/page.tsx (lines 30-35)
const plans = [
  // ... Free plan keeps link: '/'
  {
    name: 'דוח מלא',
    // ...
    link: '/checkout?plan=full_report', // CHANGED
  },
  {
    name: 'מנוי חודשי',
    // ...
    link: '/checkout?plan=monthly', // CHANGED
  },
];
```

**Testing:**
- [ ] Sandbox payment flow (full_report)
- [ ] Sandbox payment flow (monthly)
- [ ] Webhook delivery
- [ ] Transaction status updates
- [ ] Email confirmation
- [ ] Error handling (declined card, timeout)

---

### Task 0.3: Contact Page

**Duration:** 1 day (6-8 hours)  
**Developer:** Full-stack developer  
**Priority:** P0

#### Subtasks:

**0.3.1 Create Contact Form** (4-5 hours)
- [ ] Create `app/contact/page.tsx`
- [ ] Form fields: name, email, phone (optional), subject, message
- [ ] reCAPTCHA integration (spam protection)
- [ ] Frontend validation

**Files to Create:**
```typescript
// app/contact/page.tsx (250-300 lines)
'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || formData.name.length < 2) {
      setError('נא להזין שם (לפחות 2 תווים)');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('נא להזין אימייל תקין');
      return;
    }
    if (formData.message.length < 10) {
      setError('נא להזין הודעה (לפחות 10 תווים)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת ההודעה');
      }
      
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: 'general', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="py-16 px-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">צור קשר</h1>
          <p className="text-gray-600 mb-8">
            נשמח לשמוע ממך - מענה תוך 24 שעות
          </p>
          
          {success ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <p className="text-green-800 font-semibold">✅ ההודעה נשלחה בהצלחה!</p>
              <p className="text-green-700 mt-2">נחזור אליך בהקדם האפשרי.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">אימייל *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  dir="ltr"
                  required
                />
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">טלפון (אופציונלי)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05X-XXXXXXX"
                  className="w-full px-4 py-3 border rounded-lg"
                  dir="ltr"
                />
              </div>
              
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">נושא *</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="general">כללי</option>
                  <option value="support">תמיכה טכנית</option>
                  <option value="bug">דיווח על באג</option>
                  <option value="partnership">שיתוף פעולה</option>
                </select>
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">הודעה *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>
              
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}
              
              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg disabled:bg-gray-400"
              >
                {loading ? 'שולח...' : 'שלח הודעה'}
              </button>
            </form>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
```

**0.3.2 Backend Endpoint** (2-3 hours)
- [ ] Create `/api/contact` route
- [ ] Email sending (Nodemailer or SendGrid)
- [ ] Store message in database (optional)

**Files to Create:**
```typescript
// app/api/contact/route.ts (100-150 lines)
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  const { name, email, phone, subject, message } = await request.json();
  
  // Validation
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'חסרים שדות חובה' },
      { status: 400 }
    );
  }
  
  // Email configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  // Send email
  try {
    await transporter.sendMail({
      from: 'support@trustcheck.co.il',
      to: 'dan@trustcheck.co.il', // Admin email
      replyTo: email,
      subject: `[צור קשר] ${subject} - ${name}`,
      html: `
        <h2>הודעה חדשה מטופס צור קשר</h2>
        <p><strong>שם:</strong> ${name}</p>
        <p><strong>אימייל:</strong> ${email}</p>
        <p><strong>טלפון:</strong> ${phone || 'לא צוין'}</p>
        <p><strong>נושא:</strong> ${subject}</p>
        <hr>
        <p><strong>הודעה:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return NextResponse.json(
      { error: 'שגיאה בשליחת ההודעה' },
      { status: 500 }
    );
  }
}
```

**Environment Variables:**
```
SMTP_HOST=smtp.gmail.com (or SendGrid SMTP)
SMTP_PORT=587
SMTP_USER=support@trustcheck.co.il
SMTP_PASS=your_app_password
```

**Testing:**
- [ ] Form validation (empty fields, invalid email)
- [ ] Email delivery to admin
- [ ] Mobile responsive
- [ ] Success message display

---

### Task 0.4: Quick Fixes

**Duration:** 3-4 hours  
**Developer:** Any developer  
**Priority:** P0

#### Subtasks:

**0.4.1 Update WhatsApp Link** (15 minutes)
- [ ] Get real business WhatsApp number
- [ ] Update `app/faq/page.tsx` line 49

**Before:**
```tsx
<a href="https://wa.me/972501234567">WhatsApp</a>
```

**After:**
```tsx
<a href="https://wa.me/972501234567">WhatsApp</a> <!-- Real number -->
```

**0.4.2 Verify Support Email** (30 minutes)
- [ ] Test `support@trustcheck.co.il` (send/receive)
- [ ] Configure DNS MX records if needed
- [ ] Document email credentials in password manager

**0.4.3 Update Social Media Links** (1-2 hours)
- **Option A:** Create real social pages
  - [ ] Facebook Business Page
  - [ ] Twitter/X account
  - [ ] LinkedIn Company Page
  - [ ] Update Footer.tsx with real URLs

- **Option B:** Remove social links (if not ready)
  - [ ] Comment out social icons section in Footer.tsx

**Recommended:** Option A for brand presence

**0.4.4 Analytics Tracking Enhancements** (1-2 hours)
- [ ] Add CTA click tracking
- [ ] Add navigation click tracking
- [ ] Add pricing view tracking

**Files to Modify:**
```typescript
// components/CTA.tsx (add onClick handlers)
<Link
  href="/"
  onClick={() => analytics.trackCTA('check_now', 'cta_section')}
  className="..."
>
  בדוק עכשיו חינם
</Link>

// components/Header.tsx (add navigation tracking)
<Link
  href="/about"
  onClick={() => analytics.trackNavigation('about')}
  className="..."
>
  אודות
</Link>
```

---

### Phase 0 Deliverables Checklist

**Legal Compliance:**
- [ ] Terms of Service page live (/terms)
- [ ] Privacy Policy page live (/privacy)
- [ ] Cookie Policy page live (/cookies)
- [ ] Disclaimer page live (/disclaimer)
- [ ] Legal consultant sign-off

**Payment System:**
- [ ] Tranzilla account configured
- [ ] Checkout page functional (/checkout)
- [ ] Payment webhook working
- [ ] Transactions stored in database
- [ ] Email confirmations sent
- [ ] Pricing page links updated
- [ ] Sandbox testing passed

**Contact System:**
- [ ] Contact page functional (/contact)
- [ ] Contact form email delivery
- [ ] WhatsApp link updated (real number)
- [ ] Support email verified

**Analytics:**
- [ ] CTA tracking added
- [ ] Navigation tracking added
- [ ] Pricing view tracking added

**Testing:**
- [ ] All footer links work (no 404s)
- [ ] Mobile responsive (all new pages)
- [ ] E2E payment test (sandbox)
- [ ] Contact form submission test

---

## Phase 1: Authentication System (Week 2)

**Duration:** 3-4 days  
**Effort:** 20-30 hours  
**Priority:** P1  
**Goal:** User accounts, registration, login

**Detailed tasks in next section...**

---

## Conclusion

**Phase 0 Total Effort:** 35-55 hours (5-7 working days)

**Critical Path Dependencies:**
1. Legal pages → Payment gateway setup (legal terms must exist first)
2. Payment gateway → Pricing page update (backend must work first)
3. Contact form → Email configuration (SMTP must be set up)

**Recommended Start Order:**
1. **Day 1-2:** Legal pages (no dependencies)
2. **Day 3-5:** Payment gateway (depends on legal)
3. **Day 5:** Contact page + quick fixes (parallel work)

**Success Criteria:**
- ✅ No 404 errors on any footer link
- ✅ Payment flow completes in sandbox
- ✅ Contact form delivers emails
- ✅ All legal pages accessible

**Next Phase Preview:**
Phase 1 will focus on authentication (NextAuth.js), enabling the "הירשם עכשיו" button and user dashboard functionality.

---

**Document Version:** 1.0  
**Last Updated:** 28 December 2025, 21:00 UTC+3  
**Author:** GitHub Copilot (Claude Sonnet 4.5)  
**Status:** Ready for stakeholder review
