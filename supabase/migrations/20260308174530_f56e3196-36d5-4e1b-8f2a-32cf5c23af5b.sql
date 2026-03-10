
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_lead_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 0;
  v_lead leads%ROWTYPE;
  v_visit_count integer;
  v_conv_count integer;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  CASE v_lead.status
    WHEN 'new' THEN v_score := 10;
    WHEN 'contacted' THEN v_score := 20;
    WHEN 'requirement_collected' THEN v_score := 35;
    WHEN 'property_suggested' THEN v_score := 50;
    WHEN 'visit_scheduled' THEN v_score := 65;
    WHEN 'visit_completed' THEN v_score := 80;
    WHEN 'booked' THEN v_score := 100;
    WHEN 'lost' THEN v_score := 5;
    ELSE v_score := 10;
  END CASE;

  IF v_lead.first_response_time_min IS NOT NULL AND v_lead.first_response_time_min <= 5 THEN
    v_score := v_score + 10;
  END IF;

  IF v_lead.budget IS NOT NULL AND v_lead.budget != '' THEN
    v_score := v_score + 5;
  END IF;

  IF v_lead.email IS NOT NULL AND v_lead.email != '' THEN
    v_score := v_score + 5;
  END IF;

  SELECT COUNT(*) INTO v_visit_count FROM visits WHERE lead_id = p_lead_id;
  v_score := v_score + LEAST(v_visit_count * 5, 15);

  SELECT COUNT(*) INTO v_conv_count FROM conversations WHERE lead_id = p_lead_id;
  v_score := v_score + LEAST(v_conv_count * 2, 10);

  IF v_lead.last_activity_at < now() - interval '7 days' THEN
    v_score := GREATEST(v_score - 15, 0);
  END IF;

  v_score := LEAST(v_score, 100);
  UPDATE leads SET lead_score = v_score WHERE id = p_lead_id;
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_all_lead_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  FOR v_lead_id IN SELECT id FROM leads LOOP
    PERFORM calculate_lead_score(v_lead_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_score_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_auto_score ON public.leads;
CREATE TRIGGER lead_auto_score
  AFTER INSERT OR UPDATE OF status, first_response_time_min, budget, email, last_activity_at ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.auto_score_lead();

ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_up_reminders;
