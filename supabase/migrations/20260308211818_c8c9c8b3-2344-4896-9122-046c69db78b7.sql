
-- Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out');

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partial', 'paid');

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id),
  room_id uuid REFERENCES public.rooms(id),
  bed_id uuid REFERENCES public.beds(id),
  visit_id uuid REFERENCES public.visits(id),
  booking_status public.booking_status NOT NULL DEFAULT 'pending',
  monthly_rent numeric,
  security_deposit numeric,
  move_in_date date,
  move_out_date date,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  notes text,
  booked_by uuid REFERENCES public.agents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Auth users insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users update bookings" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete bookings" ON public.bookings FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Trigger: visit outcome 'booked' → auto-create booking + soft lock
CREATE OR REPLACE FUNCTION public.on_visit_booked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.outcome IS DISTINCT FROM NEW.outcome AND NEW.outcome = 'booked' THEN
    -- Create pending booking
    INSERT INTO public.bookings (lead_id, property_id, room_id, bed_id, visit_id, booking_status, booked_by)
    VALUES (NEW.lead_id, NEW.property_id, NEW.room_id, NEW.bed_id, NEW.id, 'pending', NEW.assigned_staff_id);

    -- Create pre_booking soft lock (24h) if bed is specified
    IF NEW.bed_id IS NOT NULL THEN
      INSERT INTO public.soft_locks (room_id, bed_id, lead_id, lock_type, locked_by, expires_at, notes)
      VALUES (NEW.room_id, NEW.bed_id, NEW.lead_id, 'pre_booking', NEW.assigned_staff_id, now() + interval '24 hours', 'Auto-locked from visit booking');
    END IF;

    -- Update lead status to booked
    UPDATE public.leads SET status = 'booked' WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visit_booked AFTER UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.on_visit_booked();

-- Trigger: booking confirmed → bed status 'booked'
CREATE OR REPLACE FUNCTION public.on_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status AND NEW.booking_status = 'confirmed' THEN
    IF NEW.bed_id IS NOT NULL THEN
      UPDATE public.beds SET status = 'booked' WHERE id = NEW.bed_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_confirmed AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_confirmed();

-- Trigger: booking cancelled → release locks + revert bed
CREATE OR REPLACE FUNCTION public.on_booking_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status AND NEW.booking_status = 'cancelled' THEN
    -- Release soft locks for this lead+room
    UPDATE public.soft_locks SET is_active = false
    WHERE lead_id = NEW.lead_id AND room_id = NEW.room_id AND is_active = true;

    -- Revert bed to vacant if it was booked
    IF NEW.bed_id IS NOT NULL THEN
      UPDATE public.beds SET status = 'vacant' WHERE id = NEW.bed_id AND status = 'booked';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_cancelled AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_cancelled();

-- Also attach the missing triggers from earlier
CREATE TRIGGER trg_auto_score_lead AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.auto_score_lead();

CREATE TRIGGER trg_log_lead_status AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();

CREATE TRIGGER trg_log_lead_agent AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_agent_change();

CREATE TRIGGER trg_log_visit AFTER INSERT OR UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.log_visit_change();

CREATE TRIGGER trg_auto_create_beds AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_beds();

CREATE TRIGGER trg_log_bed_status AFTER UPDATE ON public.beds
  FOR EACH ROW EXECUTE FUNCTION public.log_bed_status_change();

CREATE TRIGGER trg_room_status_confirm AFTER INSERT ON public.room_status_log
  FOR EACH ROW EXECUTE FUNCTION public.on_room_status_confirm();
