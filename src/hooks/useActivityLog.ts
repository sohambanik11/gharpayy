import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useActivityLog = (leadId: string | undefined) =>
  useQuery({
    queryKey: ['activity-log', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, agents(id, name)')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
