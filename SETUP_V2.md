# Gharpayy v2 — Production Setup Guide

## What's New in v2

### 🔐 Security (Critical Fixes)
- **RBAC (Role-Based Access Control)** — `user_roles` table with `has_role()` DB function
- **Fixed RLS Policies** — No more `WITH CHECK (true)`. Leads/visits/bookings now restricted by role
- **Owner Auth** — Dedicated `/owner-auth` signup/login flow for property owners
- **Reservation Security** — Anonymous inserts limited to `pending` status only

### 🏗️ Infrastructure
- **Error Boundary** — Global React error boundary at app root; no more white-screen crashes
- **pg_cron Jobs** — Stale lock cleanup, lead score refresh, visit reminders (see SQL migration)
- **Performance Indexes** — 11 new DB indexes for leads, visits, conversations, beds
- **QueryClient Config** — Proper staleTime, retry, refetchOnWindowFocus settings

### 🎯 Feature Fixes
- **Visit Scheduling** — Now persists to `visits` table + updates lead status + notifies agent
- **Conversations** — Real-time persistence to Supabase + multi-channel (WA/SMS/Email/Note)
- **Image Upload** — Supabase Storage bucket `property-images` with drag-drop component
- **Payment Gateway** — Razorpay + UPI integration with transaction tracking

---

## 1. Environment Variables

Create `.env.local` at project root:

```bash
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Razorpay (for payments)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx

# UPI (for direct UPI payments)
VITE_UPI_ID=gharpayy@axisbank
```

---

## 2. Run Database Migration

Open Supabase Dashboard → SQL Editor → New Query

Paste contents of:
```
supabase/migrations/20260310_v2_production.sql
```

Run it. This creates:
- `user_roles` table + `has_role()` function
- `payment_transactions` table
- Fixed RLS policies on all tables
- Storage bucket for property images
- Performance indexes
- pg_cron job templates (uncomment to enable)

---

## 3. Create Your First Admin User

1. Sign up at `/auth` with your email
2. Get your `user_id` from Supabase → Auth → Users
3. Run in SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<YOUR_USER_UUID>', 'admin');
```

4. You now have full admin access to the CRM

---

## 4. Assign Roles to Team Members

```sql
-- Assign manager
INSERT INTO public.user_roles (user_id, role) VALUES ('<uuid>', 'manager');

-- Assign agent
INSERT INTO public.user_roles (user_id, role) VALUES ('<uuid>', 'agent');
```

Or build a UI in Settings page using:
```tsx
import { useRBAC, RoleGate } from '@/contexts/RBACContext';
const { isAdmin } = useRBAC();
```

---

## 5. Enable pg_cron (Supabase)

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron`
3. Uncomment the `SELECT cron.schedule(...)` blocks in the migration SQL
4. Run them

This automates:
- Stale soft lock cleanup (every 15 min)
- Lead score recalculation (every hour)
- Visit reminder notifications (every 30 min)

---

## 6. Set Up Razorpay

1. Create account at razorpay.com
2. Get API keys from Dashboard → Settings → API Keys
3. Add `VITE_RAZORPAY_KEY_ID` to `.env.local`
4. For production, you'll need a backend endpoint to create `order_id`
   - Use Supabase Edge Function `create-razorpay-order`
   - See `supabase/functions/create-razorpay-order/` (create this)

---

## 7. Owner Portal Flow

Owners go to `/owner-auth` to sign up. This:
1. Creates Supabase Auth user with `role: 'owner'` metadata
2. DB trigger assigns `owner` role in `user_roles`
3. Creates `owners` record with their details
4. Redirects to `/owner-portal`

---

## 8. Image Upload Setup

Storage bucket is created via migration. Verify in:
Supabase → Storage → Buckets → `property-images` (should be public)

Use the component:
```tsx
import { ImageUpload } from '@/components/ImageUpload';

<ImageUpload
  value={photos}
  onChange={setPhotos}
  folder="properties"
  maxImages={10}
/>
```

---

## 9. New Routes

| Route | Purpose |
|-------|---------|
| `/owner-auth` | Owner signup/login |
| `/owner-portal` | Owner dashboard (unchanged) |

---

## 10. Scaling Notes

For 30 team members + 100 owners + 10k daily visitors:

**Supabase Plan**: Pro plan minimum ($25/mo)
- 8GB DB, 100GB bandwidth, 5GB storage

**Connection Pooling**: Enable PgBouncer in Supabase
- Transaction mode for API routes
- Session mode for realtime

**CDN**: Cloudflare in front of Supabase Storage for property images

**Realtime**: The app uses Supabase Realtime for:
- Dashboard lead updates
- Conversation new messages
Keep channels scoped (not broadcast all tables)

---

## 11. Security Checklist Before Going Live

- [ ] Run v2 migration SQL
- [ ] Create admin user + assign role
- [ ] Verify RLS policies: test with agent user can't delete leads
- [ ] Set `VITE_RAZORPAY_KEY_ID` to live key
- [ ] Enable Row Level Security on ALL tables (verify in Supabase)
- [ ] Disable "Enable email signups" in Supabase if you want invite-only team
- [ ] Enable 2FA for Supabase dashboard account
- [ ] Set up monitoring alerts in Supabase

---

## Component Usage Reference

### PaymentButton
```tsx
import { PaymentButton } from '@/components/PaymentButton';

<PaymentButton
  amount={5000}
  reservationId={reservation.id}
  customerName={lead.name}
  customerPhone={lead.phone}
  description="PG Booking - Room 101"
  onSuccess={(paymentId) => console.log('Paid:', paymentId)}
/>
```

### ScheduleVisitDialog
```tsx
import ScheduleVisitDialog from '@/components/ScheduleVisitDialog';

<ScheduleVisitDialog
  open={open}
  onClose={() => setOpen(false)}
  prefilledLeadId={lead.id}
  prefilledPropertyId={property.id}
/>
```

### ImageUpload
```tsx
import { ImageUpload } from '@/components/ImageUpload';

<ImageUpload
  value={urls}
  onChange={setUrls}
  folder="properties/room-photos"
  maxImages={8}
/>
```

### RoleGate
```tsx
import { RoleGate } from '@/contexts/RBACContext';

<RoleGate roles={['admin', 'manager']}>
  <DeleteButton />
</RoleGate>
```
