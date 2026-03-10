
-- 1. Bed status enum
CREATE TYPE public.bed_status AS ENUM ('vacant', 'occupied', 'vacating_soon', 'blocked', 'reserved', 'booked');

-- 2. Enhance properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_manager text,
  ADD COLUMN IF NOT EXISTS total_rooms integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_beds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_allowed text DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS virtual_tour_link text;

-- 3. Enhance rooms table
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS room_code text,
  ADD COLUMN IF NOT EXISTS bathroom_type text,
  ADD COLUMN IF NOT EXISTS furnishing text,
  ADD COLUMN IF NOT EXISTS rent_per_bed numeric;

-- 4. Beds table
CREATE TABLE public.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  status public.bed_status NOT NULL DEFAULT 'vacant',
  current_tenant_name text,
  current_rent numeric,
  move_in_date date,
  move_out_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read beds" ON public.beds FOR SELECT USING (true);
CREATE POLICY "Auth users manage beds" ON public.beds FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users update beds" ON public.beds FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete beds" ON public.beds FOR DELETE USING (true);

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add bed_id to visits
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id),
  ADD COLUMN IF NOT EXISTS bed_id uuid REFERENCES public.beds(id);

-- 6. Add bed_id to soft_locks
ALTER TABLE public.soft_locks
  ADD COLUMN IF NOT EXISTS bed_id uuid REFERENCES public.beds(id);

-- 7. Enable realtime for beds
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;

-- 8. Bed status log for tracking changes
CREATE TABLE public.bed_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id uuid NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
  old_status public.bed_status,
  new_status public.bed_status NOT NULL,
  changed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bed_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon read bed_status_log" ON public.bed_status_log FOR SELECT USING (true);
CREATE POLICY "Auth users manage bed_status_log" ON public.bed_status_log FOR INSERT WITH CHECK (true);

-- 9. Trigger: log bed status changes
CREATE OR REPLACE FUNCTION public.log_bed_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO bed_status_log (bed_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bed_status_change_trigger
  AFTER UPDATE ON public.beds
  FOR EACH ROW EXECUTE FUNCTION log_bed_status_change();

-- 10. Function: auto-generate beds when room is created
CREATE OR REPLACE FUNCTION public.auto_create_beds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..NEW.bed_count LOOP
    INSERT INTO beds (room_id, bed_number) VALUES (NEW.id, 'B' || i);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_beds_trigger
  AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION auto_create_beds();
