import { useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { usePropertiesWithOwners } from '@/hooks/useInventoryData';
import { useAllRoomsWithDetails } from '@/hooks/useInventoryData';
import { Building2, Bed, TrendingUp, Eye, CalendarCheck, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const EffortDashboard = () => {
  const { data: properties, isLoading: propsLoading } = usePropertiesWithOwners();
  const { data: rooms } = useAllRoomsWithDetails();

  // Get visits per property
  const { data: visits } = useQuery({
    queryKey: ['visits-by-property'],
    queryFn: async () => {
      const { data, error } = await supabase.from('visits').select('property_id, outcome, lead_id');
      if (error) throw error;
      return data;
    },
  });

  // Get leads per property
  const { data: leads } = useQuery({
    queryKey: ['leads-by-property'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('property_id, status');
      if (error) throw error;
      return data;
    },
  });

  const propertyEffort = useMemo(() => {
    if (!properties) return [];
    return properties.map((p: any) => {
      const pRooms = rooms?.filter((r: any) => r.property_id === p.id) || [];
      const pVisits = visits?.filter((v: any) => v.property_id === p.id) || [];
      const pLeads = leads?.filter((l: any) => l.property_id === p.id) || [];

      return {
        ...p,
        roomCount: pRooms.length,
        vacantRooms: pRooms.filter((r: any) => r.status === 'vacant' && !r.auto_locked).length,
        lockedRooms: pRooms.filter((r: any) => r.auto_locked).length,
        totalLeads: pLeads.length,
        totalVisits: pVisits.length,
        booked: pVisits.filter((v: any) => v.outcome === 'booked').length,
        considering: pVisits.filter((v: any) => v.outcome === 'considering').length,
        notInterested: pVisits.filter((v: any) => v.outcome === 'not_interested').length,
      };
    });
  }, [properties, rooms, visits, leads]);

  return (
    <AppLayout title="Effort Visibility" subtitle="Transparent effort metrics per property">
      <div className="space-y-6">

        {propsLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !propertyEffort.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No properties yet</p>
            <p className="text-xs mt-1">Add properties and rooms to see effort metrics</p>
          </div>
        ) : (
          <div className="space-y-4">
            {propertyEffort.map((p: any) => (
              <div key={p.id} className="p-5 rounded-xl border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-accent" />
                      <h2 className="font-semibold">{p.name}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.area && `${p.area}, `}{p.city || ''}
                      {p.owners?.name && ` · Owner: ${p.owners.name}`}
                    </p>
                  </div>
                  {p.lockedRooms > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {p.lockedRooms} auto-locked
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <MetricCard icon={Bed} label="Total Rooms" value={p.roomCount} />
                  <MetricCard icon={Bed} label="Available" value={p.vacantRooms} color="text-emerald-600" />
                  <MetricCard icon={Eye} label="Leads Pitched" value={p.totalLeads} color="text-sky-600" />
                  <MetricCard icon={CalendarCheck} label="Visits Done" value={p.totalVisits} color="text-violet-600" />
                  <MetricCard icon={ThumbsUp} label="Booked" value={p.booked} color="text-emerald-600" />
                  <MetricCard icon={Minus} label="Considering" value={p.considering} color="text-amber-600" />
                  <MetricCard icon={ThumbsDown} label="Not Interested" value={p.notInterested} color="text-destructive" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const MetricCard = ({ icon: Icon, label, value, color = 'text-foreground' }: { icon: any; label: string; value: number; color?: string }) => (
  <div className="text-center p-2 rounded-lg bg-muted/50">
    <Icon size={14} className={`mx-auto mb-1 ${color}`} />
    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
    <p className="text-[9px] text-muted-foreground">{label}</p>
  </div>
);

export default EffortDashboard;
