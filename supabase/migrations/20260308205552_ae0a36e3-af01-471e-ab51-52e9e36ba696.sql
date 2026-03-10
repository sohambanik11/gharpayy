
-- 1. Room status enum
CREATE TYPE public.room_status AS ENUM ('occupied', 'vacating', 'vacant', 'blocked');

-- 2. Owners table
CREATE TABLE public.owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  company_name text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read owners" ON public.owners FOR SELECT USING (true);
CREATE POLICY "Auth users manage owners" ON public.owners FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users update owners" ON public.owners FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete owners" ON public.owners FOR DELETE USING (true);

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Add owner_id to properties
ALTER TABLE public.properties ADD COLUMN owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL;

-- 4. Rooms table (the atomic unit: Room × Status)
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  floor text,
  bed_count integer NOT NULL DEFAULT 1,
  status public.room_status NOT NULL DEFAULT 'vacant',
  vacating_date date,
  actual_rent numeric,
  expected_rent numeric,
  min_acceptable_rent numeric,
  amenities text[],
  room_type text,
  last_confirmed_at timestamptz DEFAULT now(),
  auto_locked boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Auth users manage rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users update rooms" ON public.rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete rooms" ON public.rooms FOR DELETE USING (true);

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Room status log (daily confirmation ritual)
CREATE TABLE public.room_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  status public.room_status NOT NULL,
  confirmed_by uuid REFERENCES public.owners(id),
  rent_updated boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read room_status_log" ON public.room_status_log FOR SELECT USING (true);
CREATE POLICY "Auth users manage room_status_log" ON public.room_status_log FOR INSERT WITH CHECK (true);

-- 6. Soft locks (visit-room binding)
CREATE TYPE public.lock_type AS ENUM ('visit_scheduled', 'pre_booking', 'virtual_tour');

CREATE TABLE public.soft_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  lock_type public.lock_type NOT NULL,
  locked_by uuid REFERENCES public.agents(id),
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.soft_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read soft_locks" ON public.soft_locks FOR SELECT USING (true);
CREATE POLICY "Auth users manage soft_locks" ON public.soft_locks FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users update soft_locks" ON public.soft_locks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete soft_locks" ON public.soft_locks FOR DELETE USING (true);

-- 7. Auto-lock function: rooms not confirmed in 24h get auto_locked = true
CREATE OR REPLACE FUNCTION public.auto_lock_stale_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rooms
  SET auto_locked = true
  WHERE last_confirmed_at < now() - interval '24 hours'
    AND auto_locked = false
    AND status != 'occupied';
END;
$$;

-- 8. Trigger: when room status is confirmed, update last_confirmed_at and unlock
CREATE OR REPLACE FUNCTION public.on_room_status_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rooms
  SET last_confirmed_at = now(),
      auto_locked = false,
      status = NEW.status
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER room_status_confirm_trigger
  AFTER INSERT ON public.room_status_log
  FOR EACH ROW EXECUTE FUNCTION on_room_status_confirm();

-- 9. Effort tracking view: leads/visits/tours per property (as a function for flexibility)
CREATE OR REPLACE FUNCTION public.get_property_effort(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_leads', (SELECT COUNT(*) FROM leads WHERE property_id = p_property_id),
    'total_visits', (SELECT COUNT(*) FROM visits WHERE property_id = p_property_id),
    'completed_visits', (SELECT COUNT(*) FROM visits WHERE property_id = p_property_id AND outcome IS NOT NULL),
    'booked', (SELECT COUNT(*) FROM visits WHERE property_id = p_property_id AND outcome = 'booked'),
    'considering', (SELECT COUNT(*) FROM visits WHERE property_id = p_property_id AND outcome = 'considering'),
    'not_interested', (SELECT COUNT(*) FROM visits WHERE property_id = p_property_id AND outcome = 'not_interested')
  ) INTO result;
  RETURN result;
END;
$$;

-- 10. Enable realtime for rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.soft_locks;
