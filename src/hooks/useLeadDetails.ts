import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export const useConversations = (leadId?: string) =>
  useQuery({
    queryKey: ['conversations', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

export const useFollowUps = (leadId?: string) =>
  useQuery({
    queryKey: ['follow-ups', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select('*')
        .eq('lead_id', leadId!)
        .order('reminder_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

export const useCreateFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['follow_up_reminders']['Insert']) => {
      const { data: result, error } = await supabase.from('follow_up_reminders').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['follow-ups', vars.lead_id] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useCompleteFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('follow_up_reminders').update({ is_completed: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

export const useAllReminders = () =>
  useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select('*, leads(id, name, phone), agents:agent_id(id, name)')
        .eq('is_completed', false)
        .order('reminder_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useBulkUpdateLeads = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Database['public']['Tables']['leads']['Update'] }) => {
      const { error } = await supabase.from('leads').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};

export const useDeleteLeads = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('leads').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};
