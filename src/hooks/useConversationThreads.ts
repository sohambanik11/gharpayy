import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationThread {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadBudget?: string;
  leadLocation?: string;
  leadStatus?: string;
  lastMessage: string;
  lastMessageAt: string;
  channel: string;
  messageCount: number;
}

export const useConversationThreads = () =>
  useQuery({
    queryKey: ['conversation-threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, leads(id, name, phone, budget, preferred_location, status)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Group by lead_id
      const grouped: Record<string, ConversationThread> = {};
      for (const c of data || []) {
        const lid = c.lead_id;
        if (!grouped[lid]) {
          grouped[lid] = {
            leadId: lid,
            leadName: (c as any).leads?.name || 'Unknown',
            leadPhone: (c as any).leads?.phone || '',
            leadBudget: (c as any).leads?.budget || '',
            leadLocation: (c as any).leads?.preferred_location || '',
            leadStatus: (c as any).leads?.status || 'new',
            lastMessage: c.message,
            lastMessageAt: c.created_at,
            channel: c.channel,
            messageCount: 0,
          };
        }
        grouped[lid].messageCount++;
      }
      return Object.values(grouped).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },
  });

export const useConversationMessages = (leadId: string | null) =>
  useQuery({
    queryKey: ['conversation-messages', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, agents(id, name)')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { lead_id: string; message: string; channel?: string; agent_id?: string }) => {
      const { data, error } = await supabase.from('conversations').insert({
        lead_id: msg.lead_id,
        message: msg.message,
        direction: 'outbound',
        channel: msg.channel || 'whatsapp',
        agent_id: msg.agent_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-threads'] });
      qc.invalidateQueries({ queryKey: ['conversation-messages'] });
    },
  });
};

export const useMessageTemplates = () =>
  useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('message_templates').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
