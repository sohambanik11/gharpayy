
-- ═══════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_preferred_location ON public.leads(preferred_location);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_beds_room ON public.beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);
CREATE INDEX IF NOT EXISTS idx_visits_lead ON public.visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_visits_property ON public.visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON public.visits(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_lead ON public.activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_soft_locks_active ON public.soft_locks(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_lead ON public.bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON public.follow_up_reminders(reminder_date) WHERE is_completed = false;

-- ═══════════════════════════════════════════════════════
-- ZONES TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT 'Bangalore',
  areas text[] NOT NULL DEFAULT '{}',
  manager_id uuid REFERENCES public.agents(id),
  color text DEFAULT '#6366f1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Auth manage zones" ON public.zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update zones" ON public.zones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete zones" ON public.zones FOR DELETE USING (true);

-- Add zone_id to properties and agents
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.zones(id);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.zones(id);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'agent';

CREATE INDEX IF NOT EXISTS idx_properties_zone ON public.properties(zone_id);
CREATE INDEX IF NOT EXISTS idx_agents_zone ON public.agents(zone_id);

-- ═══════════════════════════════════════════════════════
-- TEAM QUEUES
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.team_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  owner_agent_id uuid REFERENCES public.agents(id),
  member_ids uuid[] NOT NULL DEFAULT '{}',
  dispatch_rule text NOT NULL DEFAULT 'round_robin',
  last_assigned_idx integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read team_queues" ON public.team_queues FOR SELECT USING (true);
CREATE POLICY "Auth manage team_queues" ON public.team_queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update team_queues" ON public.team_queues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete team_queues" ON public.team_queues FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════
-- HANDOFFS
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_agent_id uuid REFERENCES public.agents(id),
  to_agent_id uuid REFERENCES public.agents(id),
  zone_id uuid REFERENCES public.zones(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read handoffs" ON public.handoffs FOR SELECT USING (true);
CREATE POLICY "Auth insert handoffs" ON public.handoffs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_handoffs_lead ON public.handoffs(lead_id);

-- ═══════════════════════════════════════════════════════
-- ESCALATIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general',
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  zone_id uuid REFERENCES public.zones(id),
  raised_by uuid REFERENCES public.agents(id),
  assigned_to uuid REFERENCES public.agents(id),
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  description text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read escalations" ON public.escalations FOR SELECT USING (true);
CREATE POLICY "Auth manage escalations" ON public.escalations FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update escalations" ON public.escalations FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_escalations_status ON public.escalations(status) WHERE status = 'open';

-- ═══════════════════════════════════════════════════════
-- CONVERSATION CONTEXT (chat channels)
-- ═══════════════════════════════════════════════════════
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS context_type text DEFAULT 'lead';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS context_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context_type, context_id);

-- ═══════════════════════════════════════════════════════
-- ZONE ROUTING FUNCTION
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.route_lead_to_zone(p_location text)
RETURNS TABLE(zone_id uuid, zone_name text, queue_id uuid, assigned_agent_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_zone zones%ROWTYPE;
  v_queue team_queues%ROWTYPE;
  v_agent_id uuid;
  v_next_idx integer;
BEGIN
  -- Find matching zone by area overlap
  SELECT z.* INTO v_zone
  FROM zones z
  WHERE z.is_active = true
    AND EXISTS (
      SELECT 1 FROM unnest(z.areas) a
      WHERE lower(p_location) LIKE '%' || lower(a) || '%'
    )
  LIMIT 1;

  IF v_zone.id IS NULL THEN
    -- No zone match, return nulls
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  -- Find active queue for zone
  SELECT tq.* INTO v_queue
  FROM team_queues tq
  WHERE tq.zone_id = v_zone.id AND tq.is_active = true
  LIMIT 1;

  IF v_queue.id IS NOT NULL AND array_length(v_queue.member_ids, 1) > 0 THEN
    -- Round-robin assignment
    v_next_idx := (v_queue.last_assigned_idx % array_length(v_queue.member_ids, 1)) + 1;
    v_agent_id := v_queue.member_ids[v_next_idx];
    UPDATE team_queues SET last_assigned_idx = v_next_idx WHERE id = v_queue.id;
  ELSE
    v_agent_id := v_zone.manager_id;
  END IF;

  RETURN QUERY SELECT v_zone.id, v_zone.name, v_queue.id, v_agent_id;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- DB-LEVEL MATCHING FUNCTION
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.match_beds_for_lead(
  p_location text,
  p_budget numeric,
  p_room_type text DEFAULT NULL
)
RETURNS TABLE(
  bed_id uuid,
  bed_number text,
  room_id uuid,
  room_number text,
  room_type text,
  rent_per_bed numeric,
  property_id uuid,
  property_name text,
  property_area text,
  match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bed_id,
    b.bed_number,
    r.id AS room_id,
    r.room_number,
    r.room_type,
    r.rent_per_bed,
    p.id AS property_id,
    p.name AS property_name,
    p.area AS property_area,
    (
      -- Location match (40 pts)
      CASE WHEN lower(p.area) = lower(p_location) THEN 40
           WHEN lower(p.area) LIKE '%' || lower(p_location) || '%' THEN 25
           WHEN lower(p.city) = lower(p_location) THEN 10
           ELSE 0 END
      +
      -- Budget match (35 pts)
      CASE WHEN r.rent_per_bed IS NOT NULL AND p_budget > 0 THEN
        CASE WHEN r.rent_per_bed <= p_budget THEN 35
             WHEN r.rent_per_bed <= p_budget * 1.15 THEN 20
             WHEN r.rent_per_bed <= p_budget * 1.3 THEN 10
             ELSE 0 END
      ELSE 15 END
      +
      -- Room type match (15 pts)
      CASE WHEN p_room_type IS NOT NULL AND r.room_type = p_room_type THEN 15
           WHEN p_room_type IS NULL THEN 8
           ELSE 0 END
      +
      -- Availability bonus (10 pts)
      CASE WHEN b.status = 'vacant' THEN 10
           WHEN b.status = 'vacating_soon' THEN 5
           ELSE 0 END
    )::integer AS match_score
  FROM beds b
  JOIN rooms r ON r.id = b.room_id
  JOIN properties p ON p.id = r.property_id
  WHERE b.status IN ('vacant', 'vacating_soon')
    AND r.auto_locked = false
    AND p.is_active = true
  ORDER BY match_score DESC
  LIMIT 10;
END;
$$;

-- ═══════════════════════════════════════════════════════
-- OVERDUE FOLLOW-UP NOTIFICATION FUNCTION
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_overdue_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT f.id, f.lead_id, f.agent_id, l.name as lead_name
    FROM follow_up_reminders f
    JOIN leads l ON l.id = f.lead_id
    WHERE f.is_completed = false
      AND f.reminder_date < now()
      AND f.agent_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.link = '/leads'
          AND n.title LIKE '%' || l.name || '%overdue%'
          AND n.created_at > now() - interval '4 hours'
      )
  LOOP
    INSERT INTO notifications (user_id, title, body, type, link)
    SELECT r.agent_id, 'Follow-up overdue: ' || r.lead_name,
           'A follow-up for ' || r.lead_name || ' is past due. Please take action.',
           'warning', '/leads'
    WHERE EXISTS (SELECT 1 FROM agents WHERE id = r.agent_id AND user_id IS NOT NULL);
  END LOOP;
END;
$$;

-- Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handoffs;
