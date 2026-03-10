
-- Add reservation_hold to lock_type enum
ALTER TYPE public.lock_type ADD VALUE IF NOT EXISTS 'reservation_hold';

-- Create landmarks table for smart discovery
CREATE TABLE public.landmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'tech_park', -- tech_park, university, metro_station, mall
  city text NOT NULL DEFAULT 'Bangalore',
  area text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read landmarks" ON public.landmarks FOR SELECT USING (true);
CREATE POLICY "Auth manage landmarks" ON public.landmarks FOR INSERT TO authenticated WITH CHECK (true);

-- Add lat/lng to properties for map discovery
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create public reservations table (customer-facing bookings)
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  property_id uuid REFERENCES public.properties(id) NOT NULL,
  room_id uuid REFERENCES public.rooms(id),
  bed_id uuid REFERENCES public.beds(id),
  move_in_date date NOT NULL,
  room_type text,
  monthly_rent numeric,
  reservation_fee numeric DEFAULT 1000,
  reservation_status text NOT NULL DEFAULT 'pending', -- pending, paid, confirmed, cancelled, expired
  payment_reference text,
  lead_id uuid REFERENCES public.leads(id),
  soft_lock_id uuid REFERENCES public.soft_locks(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Anyone insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone update reservations" ON public.reservations FOR UPDATE USING (true) WITH CHECK (true);

-- Indexes for public platform performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_area ON public.properties(area);
CREATE INDEX IF NOT EXISTS idx_properties_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_zone ON public.properties(zone_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(reservation_status);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON public.reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_landmarks_city ON public.landmarks(city);
CREATE INDEX IF NOT EXISTS idx_landmarks_type ON public.landmarks(type);

-- Enable realtime for reservations
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- Function to create reservation with soft lock
CREATE OR REPLACE FUNCTION public.create_reservation_lock(
  p_property_id uuid,
  p_bed_id uuid,
  p_room_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text DEFAULT NULL,
  p_move_in_date date DEFAULT NULL,
  p_room_type text DEFAULT NULL,
  p_monthly_rent numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_id uuid;
  v_reservation_id uuid;
  v_expires_at timestamptz;
BEGIN
  v_expires_at := now() + interval '10 minutes';

  -- Check bed is available
  IF NOT EXISTS (SELECT 1 FROM beds WHERE id = p_bed_id AND status = 'vacant') THEN
    RETURN jsonb_build_object('error', 'Bed is no longer available');
  END IF;

  -- Check no active lock exists
  IF EXISTS (SELECT 1 FROM soft_locks WHERE bed_id = p_bed_id AND is_active = true AND expires_at > now()) THEN
    RETURN jsonb_build_object('error', 'Bed is temporarily reserved by another user');
  END IF;

  -- Create soft lock
  INSERT INTO soft_locks (room_id, bed_id, lock_type, expires_at, notes)
  VALUES (p_room_id, p_bed_id, 'reservation_hold', v_expires_at, 'Customer reservation hold')
  RETURNING id INTO v_lock_id;

  -- Update bed status to reserved
  UPDATE beds SET status = 'reserved' WHERE id = p_bed_id;

  -- Create reservation
  INSERT INTO reservations (customer_name, customer_phone, customer_email, property_id, room_id, bed_id, move_in_date, room_type, monthly_rent, soft_lock_id, expires_at)
  VALUES (p_customer_name, p_customer_phone, p_customer_email, p_property_id, p_room_id, p_bed_id, COALESCE(p_move_in_date, CURRENT_DATE + 7), p_room_type, p_monthly_rent, v_lock_id, v_expires_at)
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object('reservation_id', v_reservation_id, 'lock_id', v_lock_id, 'expires_at', v_expires_at);
END;
$$;

-- Function to confirm reservation after payment
CREATE OR REPLACE FUNCTION public.confirm_reservation(
  p_reservation_id uuid,
  p_payment_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res reservations%ROWTYPE;
  v_lead_id uuid;
BEGIN
  SELECT * INTO v_res FROM reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Reservation not found'); END IF;
  IF v_res.reservation_status != 'pending' THEN RETURN jsonb_build_object('error', 'Reservation already processed'); END IF;

  -- Update reservation
  UPDATE reservations SET reservation_status = 'paid', payment_reference = p_payment_reference, updated_at = now() WHERE id = p_reservation_id;

  -- Create CRM lead
  INSERT INTO leads (name, phone, email, source, status, property_id, preferred_location, notes)
  VALUES (v_res.customer_name, v_res.customer_phone, v_res.customer_email, 'website', 'booked', v_res.property_id,
    (SELECT area FROM properties WHERE id = v_res.property_id),
    'Online reservation #' || p_reservation_id::text || ' | Payment: ' || p_payment_reference)
  RETURNING id INTO v_lead_id;

  -- Update reservation with lead
  UPDATE reservations SET lead_id = v_lead_id WHERE id = p_reservation_id;

  -- Create booking
  INSERT INTO bookings (lead_id, property_id, room_id, bed_id, booking_status, monthly_rent, move_in_date, payment_status, notes)
  VALUES (v_lead_id, v_res.property_id, v_res.room_id, v_res.bed_id, 'confirmed', v_res.monthly_rent, v_res.move_in_date, 'partial', 'Online reservation fee paid');

  -- Update bed to booked
  IF v_res.bed_id IS NOT NULL THEN
    UPDATE beds SET status = 'booked' WHERE id = v_res.bed_id;
  END IF;

  -- Deactivate soft lock
  IF v_res.soft_lock_id IS NOT NULL THEN
    UPDATE soft_locks SET is_active = false WHERE id = v_res.soft_lock_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'lead_id', v_lead_id, 'reservation_id', p_reservation_id);
END;
$$;
