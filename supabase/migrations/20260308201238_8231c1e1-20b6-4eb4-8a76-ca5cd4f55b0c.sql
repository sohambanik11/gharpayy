-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "System insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read activity_log" ON public.activity_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert activity_log" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anon read activity_log" ON public.activity_log
  FOR SELECT TO anon USING (true);

-- Create message_templates table
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read templates" ON public.message_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert templates" ON public.message_templates
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update templates" ON public.message_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete templates" ON public.message_templates
  FOR DELETE TO authenticated USING (true);

-- Trigger function: log lead status change
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (lead_id, agent_id, action, metadata)
    VALUES (NEW.id, NEW.assigned_agent_id, 'status_change', jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_status_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_status_change();

-- Trigger function: log lead agent reassignment
CREATE OR REPLACE FUNCTION public.log_lead_agent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
    INSERT INTO public.activity_log (lead_id, agent_id, action, metadata)
    VALUES (NEW.id, NEW.assigned_agent_id, 'agent_reassigned', jsonb_build_object('from_agent', OLD.assigned_agent_id, 'to_agent', NEW.assigned_agent_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_agent_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_agent_change();

-- Trigger function: log visit changes
CREATE OR REPLACE FUNCTION public.log_visit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (lead_id, agent_id, action, metadata)
    VALUES (NEW.lead_id, NEW.assigned_staff_id, 'visit_scheduled', jsonb_build_object('visit_id', NEW.id, 'property_id', NEW.property_id, 'scheduled_at', NEW.scheduled_at));
  ELSIF TG_OP = 'UPDATE' AND OLD.outcome IS DISTINCT FROM NEW.outcome AND NEW.outcome IS NOT NULL THEN
    INSERT INTO public.activity_log (lead_id, agent_id, action, metadata)
    VALUES (NEW.lead_id, NEW.assigned_staff_id, 'visit_outcome', jsonb_build_object('visit_id', NEW.id, 'outcome', NEW.outcome));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visit_change
  AFTER INSERT OR UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.log_visit_change();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;