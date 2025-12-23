// Stripe Payments Integration — Implementation Guide
// For TrustCheck Israel Premium Reports

# Stripe Integration Roadmap

## Phase 1: Setup (30 minutes)

### 1.1. Create Stripe Account

1. Go to https://stripe.com/en-il
2. Sign up with business email
3. Complete verification:
   - Business name: TrustCheck Israel
   - Business type: Software/SaaS
   - Country: Israel
   - Currency: ILS (₪)

### 1.2. Get API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy keys:
   ```env
   # .env.local (development)
   STRIPE_SECRET_KEY=sk_test_51...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
   
   # .env (production)
   STRIPE_SECRET_KEY=sk_live_51...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...
   ```

### 1.3. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

**Already installed:** ✅ (check package.json)

## Phase 2: Backend Implementation (3 hours)

### 2.1. Create Checkout Session API

**File:** `app/api/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const { companyName, hpNumber } = await req.json();

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ils',
            product_data: {
              name: 'Premium Business Report',
              description: `Full report for ${companyName}`,
              images: ['https://trustcheck.co.il/report-icon.png'],
            },
            unit_amount: 499, // ₪4.99 in agorot
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/report/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      metadata: {
        companyName,
        hpNumber,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 2.2. Webhook Handler (Payment Confirmation)

**File:** `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Save payment to database
      await handleSuccessfulPayment(session);
      break;

    case 'payment_intent.payment_failed':
      console.error('Payment failed:', event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { companyName, hpNumber } = session.metadata!;
  
  // TODO: Save to database (Phase 2)
  console.log('Payment successful:', {
    sessionId: session.id,
    amount: session.amount_total! / 100,
    companyName,
    hpNumber,
  });

  // TODO: Generate AI report and send email
}
```

### 2.3. Configure Webhook Endpoint

**Local testing (Stripe CLI):**
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook secret to .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Production (Hetzner):**
```bash
# Stripe Dashboard → Developers → Webhooks
# Add endpoint: https://trustcheck.co.il/api/webhooks/stripe
# Select events:
#   - checkout.session.completed
#   - payment_intent.payment_failed

# Copy Signing secret to production .env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Phase 3: Frontend Integration (2 hours)

### 3.1. Checkout Button Component

**File:** `components/CheckoutButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutButtonProps {
  companyName: string;
  hpNumber: string;
}

export default function CheckoutButton({ companyName, hpNumber }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // Create Checkout Session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, hpNumber }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert('תשלום נכשל. אנא נסה שוב.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('שגיאה בתהליך התשלום');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400"
    >
      {loading ? 'טוען...' : 'לדוח מלא — ₪4.99'}
    </button>
  );
}
```

### 3.2. Success Page

**File:** `app/report/success/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    redirect('/');
  }

  // Retrieve session details
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    redirect('/');
  }

  const { companyName, hpNumber } = session.metadata!;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          התשלום בוצע בהצלחה!
        </h1>
        <p className="text-gray-600 mb-6">
          הדוח המלא עבור <strong>{companyName}</strong> נשלח למייל שלך
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700">
            <strong>מספר אישור:</strong> {sessionId}
          </p>
          <p className="text-sm text-gray-700">
            <strong>סכום:</strong> ₪{(session.amount_total! / 100).toFixed(2)}
          </p>
        </div>

        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          חזרה לדף הבית
        </a>
      </div>
    </main>
  );
}
```

## Phase 4: Testing (1 hour)

### 4.1. Test Cards (Stripe Test Mode)

```
✅ Success: 4242 4242 4242 4242 (any CVC, future date)
❌ Decline: 4000 0000 0000 0002
⚠️  Requires authentication: 4000 0025 0000 3155
```

### 4.2. Test Checklist

- [ ] Checkout session creates successfully
- [ ] Stripe Checkout UI loads (Hebrew support)
- [ ] Test card payment succeeds
- [ ] Webhook receives `checkout.session.completed`
- [ ] Success page shows payment details
- [ ] Email sent (Phase 2)
- [ ] Database record created (Phase 2)
- [ ] Decline card shows error message
- [ ] Cancel returns to homepage

### 4.3. Production Testing

```bash
# Use real card (small amount)
# Test with ₪1.00 first

# Check Stripe Dashboard:
# - Payments tab shows transaction
# - Webhooks tab shows successful delivery
# - Logs tab shows no errors
```

## Phase 5: Security & Compliance (30 minutes)

### 5.1. PCI Compliance

✅ **Stripe handles card data** — no PCI compliance needed  
✅ **Never store card numbers** — Stripe Checkout manages this  
✅ **HTTPS required** — already configured (Certbot SSL)

### 5.2. Tax Compliance (Israel)

**VAT (מע"מ) — 17%:**
- Stripe can auto-calculate VAT
- Dashboard → Settings → Tax rates
- Add: Israel VAT (17%)

**Invoices:**
- Stripe automatically generates receipts
- Email sent to customer after payment

### 5.3. Refund Policy

**Implement in Stripe Dashboard:**
1. Settings → Customer emails
2. Enable "Payment receipts"
3. Add refund policy link: https://trustcheck.co.il/refund-policy

**Manual refunds (Phase 2):**
```typescript
// app/api/refund/route.ts
const refund = await stripe.refunds.create({
  payment_intent: 'pi_...',
  reason: 'requested_by_customer',
});
```

## Phase 6: Monitoring (15 minutes)

### 6.1. Stripe Dashboard Metrics

**Track:**
- Total revenue (daily/weekly/monthly)
- Successful vs failed payments
- Average transaction value
- Refund rate

### 6.2. Alerts

**Set up email alerts:**
- Dashboard → Settings → Notifications
- Enable:
  - ✅ Successful payments
  - ✅ Failed payments
  - ✅ Disputes
  - ✅ Refunds

## Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Setup Stripe account | 30 min | ⏳ TODO |
| 2 | Backend API routes | 3 hours | ⏳ TODO |
| 3 | Frontend components | 2 hours | ⏳ TODO |
| 4 | Testing | 1 hour | ⏳ TODO |
| 5 | Security | 30 min | ⏳ TODO |
| 6 | Monitoring | 15 min | ⏳ TODO |

**Total:** 7 hours development time

## Cost Analysis

**Stripe Fees (Israel):**
- **Per transaction:** 2.9% + ₪1.20
- **For ₪4.99 report:** ₪0.26 fee → **₪4.73 net revenue**
- **For 1,000 reports/month:** ₪260 fees, ₪4,730 revenue

**Revenue projection (Month 1):**
- 1,000 checks × 5% conversion = 50 paid reports
- 50 × ₪4.73 = **₪236.50 net revenue**
- Stripe fees: ₪13.00

**Break-even:** 3 paid reports cover Hetzner hosting (€2.99)

## Next Steps

1. ✅ Create Stripe account (30 min)
2. ✅ Implement backend APIs (3 hours)
3. ✅ Add CheckoutButton to SearchForm (1 hour)
4. ✅ Test with test cards (30 min)
5. ✅ Go live with real payments (Week 2)

**Priority:** HIGH (required for monetization)  
**Blocker:** NO (can launch without paywall, add later)
