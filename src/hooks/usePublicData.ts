import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyFilters {
  city?: string;
  area?: string;
  budgetMin?: number;
  budgetMax?: number;
  roomType?: string;
  gender?: string;
  amenity?: string;
  sharingTypes?: string[];
  nearLandmark?: string;
  page?: number;
  limit?: number;
}

export function usePublicProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['public-properties', filters],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('*, owners:owner_id(name), rooms(id, room_number, room_type, bed_count, rent_per_bed, expected_rent, status, floor, furnishing, bathroom_type, amenities, beds(id, bed_number, status, current_rent))')
        .eq('is_active', true)
        .order('rating', { ascending: false, nullsFirst: false });

      if (filters.city) q = q.ilike('city', `%${filters.city}%`);
      if (filters.area) q = q.ilike('area', `%${filters.area}%`);
      if (filters.gender && filters.gender !== 'any') q = q.eq('gender_allowed', filters.gender);

      const page = filters.page || 0;
      const limit = filters.limit || 50;
      q = q.range(page * limit, (page + 1) * limit - 1);

      const { data, error } = await q;
      if (error) throw error;

      // Client-side filtering for budget and sharing type
      let results = data || [];
      if (filters.budgetMax) {
        results = results.filter((p: any) => {
          const rents = (p.rooms || []).map((r: any) => r.rent_per_bed || r.expected_rent).filter(Boolean);
          if (!rents.length) return true;
          return Math.min(...rents) <= filters.budgetMax!;
        });
      }
      if (filters.sharingTypes?.length) {
        const sharingMap: Record<string, number> = { 'Private': 1, '2 Sharing': 2, '3 Sharing': 3, '4 Sharing': 4 };
        const bedCounts = filters.sharingTypes.map(s => sharingMap[s]).filter(Boolean);
        results = results.filter((p: any) =>
          (p.rooms || []).some((r: any) => bedCounts.includes(r.bed_count))
        );
      }
      return results;
    },
  });
}

export function usePublicProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['public-property', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, owners:owner_id(name, phone), rooms(*, beds(*))')
        .eq('id', propertyId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSimilarProperties(area?: string | null, city?: string | null, excludeId?: string) {
  return useQuery({
    queryKey: ['similar-properties', area, city, excludeId],
    enabled: !!(area || city),
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('id, name, area, city, photos, rating, price_range, is_verified, rooms(id, rent_per_bed, expected_rent, beds(id, status))')
        .eq('is_active', true)
        .limit(6);

      if (area) q = q.ilike('area', `%${area}%`);
      else if (city) q = q.ilike('city', `%${city}%`);
      if (excludeId) q = q.neq('id', excludeId);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAvailableCities() {
  return useQuery({
    queryKey: ['available-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('city')
        .eq('is_active', true);
      if (error) throw error;
      return [...new Set(data.map(p => p.city).filter(Boolean))] as string[];
    },
  });
}

export function useAvailableAreas(city?: string) {
  return useQuery({
    queryKey: ['available-areas', city],
    queryFn: async () => {
      let q = supabase.from('properties').select('area').eq('is_active', true);
      if (city) q = q.ilike('city', `%${city}%`);
      const { data, error } = await q;
      if (error) throw error;
      return [...new Set(data.map(p => p.area).filter(Boolean))] as string[];
    },
  });
}

export function useLandmarks(city?: string) {
  return useQuery({
    queryKey: ['landmarks', city],
    queryFn: async () => {
      let q = supabase.from('landmarks').select('*');
      if (city) q = q.ilike('city', `%${city}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReservation() {
  return useMutation({
    mutationFn: async (params: {
      property_id: string; bed_id: string; room_id: string;
      customer_name: string; customer_phone: string; customer_email?: string;
      move_in_date?: string; room_type?: string; monthly_rent?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_reservation_lock', {
        p_property_id: params.property_id,
        p_bed_id: params.bed_id,
        p_room_id: params.room_id,
        p_customer_name: params.customer_name,
        p_customer_phone: params.customer_phone,
        p_customer_email: params.customer_email || null,
        p_move_in_date: params.move_in_date || null,
        p_room_type: params.room_type || null,
        p_monthly_rent: params.monthly_rent || null,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
  });
}

export function useConfirmReservation() {
  return useMutation({
    mutationFn: async (params: { reservation_id: string; payment_reference: string }) => {
      const { data, error } = await supabase.rpc('confirm_reservation', {
        p_reservation_id: params.reservation_id,
        p_payment_reference: params.payment_reference,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
  });
}
