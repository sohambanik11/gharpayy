import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Agent = Database['public']['Tables']['agents']['Row'];
type Visit = Database['public']['Tables']['visits']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];

// Type for lead with joined agent and property
export type LeadWithRelations = Lead & {
  agents: Pick<Agent, 'id' | 'name'> | null;
  properties: Pick<Property, 'id' | 'name'> | null;
};

export type VisitWithRelations = Visit & {
  leads: Pick<Lead, 'id' | 'name'> | null;
  properties: Pick<Property, 'id' | 'name'> | null;
  agents: Pick<Agent, 'id' | 'name'> | null;
};

// Leads (all — used by Dashboard, Pipeline, etc.)
export const useLeads = () =>
  useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, agents(id, name), properties(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeadWithRelations[];
    },
  });

// Leads (paginated — used by Leads list page)
export const useLeadsPaginated = (page = 0, pageSize = 50) =>
  useQuery({
    queryKey: ['leads-paginated', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('leads')
        .select('*, agents(id, name), properties(id, name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { leads: data as LeadWithRelations[], total: count || 0 };
    },
  });

export const useLeadsByStatus = (status: string) =>
  useQuery({
    queryKey: ['leads', 'status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, agents(id, name), properties(id, name)')
        .eq('status', status as any)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeadWithRelations[];
    },
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Database['public']['Tables']['leads']['Insert']) => {
      const { data, error } = await supabase.from('leads').insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Database['public']['Tables']['leads']['Update']) => {
      const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};

// Agents
export const useAgents = () =>
  useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agents').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

// Properties
export const useProperties = () =>
  useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

// Visits
export const useVisits = () =>
  useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*, leads(id, name), properties(id, name), agents:assigned_staff_id(id, name)')
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as VisitWithRelations[];
    },
  });

export const useCreateVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: Database['public']['Tables']['visits']['Insert']) => {
      const { data, error } = await supabase.from('visits').insert(visit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  });
};

// Dashboard stats
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [leadsRes, visitsRes] = await Promise.all([
        supabase.from('leads').select('id, status, first_response_time_min, source, created_at'),
        supabase.from('visits').select('id, outcome, scheduled_at'),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (visitsRes.error) throw visitsRes.error;

      const leads = leadsRes.data;
      const visits = visitsRes.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalLeads = leads.length;
      const newToday = leads.filter(l => new Date(l.created_at) >= today).length;
      const responseTimes = leads.filter(l => l.first_response_time_min !== null).map(l => l.first_response_time_min!);
      const avgResponseTime = responseTimes.length ? +(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : 0;
      const withinSLA = responseTimes.filter(t => t <= 5).length;
      const slaCompliance = responseTimes.length ? Math.round((withinSLA / responseTimes.length) * 100) : 0;
      const slaBreaches = responseTimes.filter(t => t > 5).length;
      const bookedLeads = leads.filter(l => l.status === 'booked').length;
      const conversionRate = totalLeads ? +((bookedLeads / totalLeads) * 100).toFixed(1) : 0;
      const upcomingVisits = visits.filter(v => new Date(v.scheduled_at) >= today && !v.outcome).length;
      const completedVisits = visits.filter(v => v.outcome !== null).length;

      return {
        totalLeads,
        newToday,
        avgResponseTime,
        slaCompliance,
        slaBreaches,
        conversionRate,
        visitsScheduled: upcomingVisits,
        visitsCompleted: completedVisits,
        bookingsClosed: bookedLeads,
      };
    },
  });

// Agent performance stats
export const useAgentStats = () =>
  useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const [agentsRes, leadsRes] = await Promise.all([
        supabase.from('agents').select('*').eq('is_active', true),
        supabase.from('leads').select('id, status, assigned_agent_id, first_response_time_min'),
      ]);
      if (agentsRes.error) throw agentsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      return agentsRes.data.map(agent => {
        const agentLeads = leadsRes.data.filter(l => l.assigned_agent_id === agent.id);
        const responseTimes = agentLeads.filter(l => l.first_response_time_min !== null).map(l => l.first_response_time_min!);
        const avgResponse = responseTimes.length ? +(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : 0;
        const conversions = agentLeads.filter(l => l.status === 'booked').length;
        const active = agentLeads.filter(l => !['booked', 'lost'].includes(l.status)).length;

        return {
          ...agent,
          totalLeads: agentLeads.length,
          activeLeads: active,
          avgResponseTime: avgResponse,
          conversions,
        };
      });
    },
  });
