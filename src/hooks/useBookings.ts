import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useBookings() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        qc.invalidateQueries({ queryKey: ['bookings'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, leads(id, name, phone, email), properties(id, name, area), rooms(id, room_number), beds(id, bed_number), agents:booked_by(id, name), visits(id, scheduled_at)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useBookingsByLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'lead', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, properties(name), rooms(room_number), beds(bed_number)')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      lead_id: string; property_id?: string; room_id?: string; bed_id?: string;
      visit_id?: string; monthly_rent?: number; security_deposit?: number;
      move_in_date?: string; move_out_date?: string; notes?: string; booked_by?: string;
    }) => {
      const { data, error } = await supabase.from('bookings').insert(booking as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['beds'] });
      toast.success('Booking created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from('bookings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['beds'] });
      qc.invalidateQueries({ queryKey: ['soft_locks'] });
      toast.success('Booking updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: ['booking-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('booking_status, monthly_rent, payment_status');
      if (error) throw error;
      const total = data.length;
      const pending = data.filter(b => b.booking_status === 'pending').length;
      const confirmed = data.filter(b => b.booking_status === 'confirmed').length;
      const checkedIn = data.filter(b => b.booking_status === 'checked_in').length;
      const cancelled = data.filter(b => b.booking_status === 'cancelled').length;
      const revenue = data.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'checked_in')
        .reduce((sum, b) => sum + (Number(b.monthly_rent) || 0), 0);
      const pendingRevenue = data.filter(b => b.booking_status === 'pending')
        .reduce((sum, b) => sum + (Number(b.monthly_rent) || 0), 0);
      return { total, pending, confirmed, checkedIn, cancelled, revenue, pendingRevenue };
    },
  });
}
