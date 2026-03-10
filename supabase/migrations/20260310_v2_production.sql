-- ============================================================
-- Gharpayy v2 Production Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ┌─────────────────────────────────┐
-- │  1. ROLE-BASED ACCESS CONTROL   │
-- └─────────────────────────────────┘

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'agent', 'owner');

CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Helper function: check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Grant public (authenticated) access to check their own roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ┌─────────────────────────────────┐
-- │  2. PAYMENT TRANSACTIONS        │
-- └─────────────────────────────────┘

CREATE TABLE public.payment_transactions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id         uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  booking_id             uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  lead_id                uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  amount                 numeric(10,2) NOT NULL,
  currency               text DEFAULT 'INR',
  gateway                text DEFAULT 'razorpay', -- 'razorpay' | 'upi' | 'manual'
  gateway_order_id       text,
  gateway_payment_id     text,
  gateway_signature      text,
  status                 text DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'refunded'
  failure_reason         text,
  metadata               jsonb DEFAULT '{}',
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents and above can view transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Admins can manage transactions"
  ON public.payment_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous inserts for reservation payments (but limit columns)
CREATE POLICY "Anyone can insert pending transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (status = 'pending');

-- ┌─────────────────────────────────┐
-- │  3. FIX PERMISSIVE RLS POLICIES │
-- └─────────────────────────────────┘

-- Leads: only agents/managers/admins can modify
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

CREATE POLICY "leads_select_all_auth"
  ON public.leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "leads_insert_agents"
  ON public.leads FOR INSERT
  WITH CHECK (
    auth.role() = 'anon' -- Allow public lead capture
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leads_update_agents"
  ON public.leads FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "leads_delete_managers"
  ON public.leads FOR DELETE
  USING (
    public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Visits: all authenticated agents can manage
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_select"
  ON public.visits FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "visits_insert"
  ON public.visits FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "visits_update"
  ON public.visits FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin')
  );

-- Conversations: all authenticated users
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_all_auth"
  ON public.conversations FOR ALL
  USING (auth.role() = 'authenticated');

-- Bookings: agents and above
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select"
  ON public.bookings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "bookings_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin')
  );

-- Reservations: allow anon for online flow, but restrict updates
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_insert_anon"
  ON public.reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "reservations_select_auth"
  ON public.reservations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "reservations_update_agents"
  ON public.reservations FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin')
  );

-- ┌─────────────────────────────────┐
-- │  4. OWNER AUTH SUPPORT          │
-- └─────────────────────────────────┘

-- Link owners table to auth.users
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS bank_ifsc text;
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS pan_number text;

-- Owner portal RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_own"
  ON public.owners FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "owners_update_own"
  ON public.owners FOR UPDATE
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- When owner signs up, auto-assign owner role
CREATE OR REPLACE FUNCTION public.handle_owner_signup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- If signing up via owner portal (metadata has role='owner')
  IF (NEW.raw_user_meta_data->>'role') = 'owner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_owner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_owner_signup();

-- ┌─────────────────────────────────┐
-- │  5. IMAGE STORAGE BUCKET        │
-- └─────────────────────────────────┘

-- Run this from Supabase dashboard > Storage > Create bucket
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owners and admins can delete property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'owner')
    )
  );

-- ┌─────────────────────────────────┐
-- │  6. NOTIFICATION IMPROVEMENTS   │
-- └─────────────────────────────────┘

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ┌─────────────────────────────────┐
-- │  7. VISIT SCHEDULING BACKEND    │
-- └─────────────────────────────────┘

-- Add columns for richer visit tracking
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS visit_type text DEFAULT 'in_person', -- 'in_person' | 'virtual'
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- ┌─────────────────────────────────┐
-- │  8. CONVERSATION IMPROVEMENTS   │
-- └─────────────────────────────────┘

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'internal', -- 'whatsapp' | 'sms' | 'email' | 'internal'
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- ┌─────────────────────────────────┐
-- │  9. PG_CRON AUTOMATION JOBS     │
-- └─────────────────────────────────┘

-- Enable pg_cron extension (if not already enabled in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cleanup stale soft locks (run every 15 minutes)
-- SELECT cron.schedule(
--   'cleanup-stale-locks',
--   '*/15 * * * *',
--   $$
--     UPDATE public.soft_locks
--     SET is_active = false
--     WHERE is_active = true
--     AND expires_at < now();
--
--     UPDATE public.beds b
--     SET status = 'vacant'
--     FROM public.soft_locks sl
--     WHERE sl.bed_id = b.id
--     AND sl.is_active = false
--     AND b.status = 'reserved';
--   $$
-- );

-- Recalculate lead scores (run every hour)
-- SELECT cron.schedule(
--   'recalculate-lead-scores',
--   '0 * * * *',
--   $$
--     UPDATE public.leads l
--     SET lead_score = LEAST(100, GREATEST(0,
--       CASE
--         WHEN l.status = 'new' THEN 10
--         WHEN l.status = 'contacted' THEN 20
--         WHEN l.status = 'requirement_collected' THEN 35
--         WHEN l.status = 'property_suggested' THEN 50
--         WHEN l.status = 'visit_scheduled' THEN 65
--         WHEN l.status = 'visit_completed' THEN 80
--         WHEN l.status = 'booked' THEN 100
--         ELSE 5
--       END
--       - EXTRACT(EPOCH FROM (now() - l.last_activity_at)) / 86400 * 2
--     ))
--     WHERE status NOT IN ('booked', 'lost');
--   $$
-- );

-- Send visit reminders (run every 30 minutes)
-- SELECT cron.schedule(
--   'visit-reminders',
--   '*/30 * * * *',
--   $$
--     INSERT INTO public.notifications (user_id, title, body, type, action_url)
--     SELECT
--       a.user_id,
--       'Visit Reminder: ' || l.name,
--       'Visit at ' || p.name || ' in 2 hours',
--       'reminder',
--       '/visits'
--     FROM public.visits v
--     JOIN public.leads l ON l.id = v.lead_id
--     JOIN public.properties p ON p.id = v.property_id
--     JOIN public.agents a ON a.id = v.assigned_agent_id
--     WHERE v.scheduled_at BETWEEN now() + interval '1.5 hours' AND now() + interval '2.5 hours'
--     AND v.reminder_sent_at IS NULL
--     AND v.outcome IS NULL;
--
--     UPDATE public.visits
--     SET reminder_sent_at = now()
--     WHERE scheduled_at BETWEEN now() + interval '1.5 hours' AND now() + interval '2.5 hours'
--     AND reminder_sent_at IS NULL;
--   $$
-- );

-- ┌─────────────────────────────────┐
-- │  10. INDEXES FOR PERFORMANCE    │
-- └─────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON public.leads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_at ON public.visits(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visits_lead_id ON public.visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- ┌─────────────────────────────────┐
-- │  11. SEED FIRST ADMIN USER      │
-- └─────────────────────────────────┘
-- Run after creating your first user in Supabase Auth:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<YOUR_USER_UUID>', 'admin');

-- ============================================================
-- END OF MIGRATION
-- ============================================================
