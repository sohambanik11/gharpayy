-- Create enum types
CREATE TYPE public.lead_source AS ENUM ('whatsapp', 'website', 'instagram', 'facebook', 'phone', 'landing_page');
CREATE TYPE public.pipeline_stage AS ENUM ('new', 'contacted', 'requirement_collected', 'property_suggested', 'visit_scheduled', 'visit_completed', 'booked', 'lost');
CREATE TYPE public.visit_outcome AS ENUM ('booked', 'considering', 'not_interested');

-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  area TEXT,
  price_range TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source lead_source NOT NULL DEFAULT 'website',
  status pipeline_stage NOT NULL DEFAULT 'new',
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  budget TEXT,
  preferred_location TEXT,
  notes TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  first_response_time_min INTEGER,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  outcome visit_outcome,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_up_reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read/write all CRM data
CREATE POLICY "Auth users read agents" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage agents" ON public.agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update agents" ON public.agents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete agents" ON public.agents FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users read properties" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update properties" ON public.properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete properties" ON public.properties FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users read visits" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update visits" ON public.visits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users delete visits" ON public.visits FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users read conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users read reminders" ON public.follow_up_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users manage reminders" ON public.follow_up_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update reminders" ON public.follow_up_reminders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_agent ON public.leads(assigned_agent_id);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX idx_visits_lead ON public.visits(lead_id);
CREATE INDEX idx_visits_scheduled ON public.visits(scheduled_at);
CREATE INDEX idx_conversations_lead ON public.conversations(lead_id);
CREATE INDEX idx_reminders_lead ON public.follow_up_reminders(lead_id);
CREATE INDEX idx_reminders_date ON public.follow_up_reminders(reminder_date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();