import { useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAllBeds } from '@/hooks/useInventoryData';
import { usePropertiesWithOwners } from '@/hooks/useInventoryData';
import { Badge } from '@/components/ui/badge';
import { Bed, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Availability = () => {
  const { data: beds, isLoading: bedsLoading } = useAllBeds();
  const { data: properties } = usePropertiesWithOwners();

  // Group by area → property with vacancy counts
  const areaData = useMemo(() => {
    if (!beds || !properties) return [];

    const propMap: Record<string, { name: string; area: string; vacantBeds: number; totalBeds: number; avgRent: number; nextVacancy: string | null }> = {};

    for (const bed of beds as any[]) {
      const propId = bed.rooms?.property_id;
      if (!propId) continue;
      const prop = properties.find((p: any) => p.id === propId);
      if (!prop) continue;

      if (!propMap[propId]) {
        propMap[propId] = { name: prop.name, area: (prop as any).area || 'Unknown', vacantBeds: 0, totalBeds: 0, avgRent: 0, nextVacancy: null };
      }
      propMap[propId].totalBeds++;
      if (bed.status === 'vacant') propMap[propId].vacantBeds++;
      if (bed.status === 'vacating_soon' && bed.move_out_date) {
        if (!propMap[propId].nextVacancy || bed.move_out_date < propMap[propId].nextVacancy!) {
          propMap[propId].nextVacancy = bed.move_out_date;
        }
      }
      const rent = Number(bed.rooms?.rent_per_bed || bed.rooms?.expected_rent || 0);
      if (rent > 0) propMap[propId].avgRent = rent;
    }

    // Group by area
    const areaMap: Record<string, typeof propMap[string][]> = {};
    for (const p of Object.values(propMap)) {
      if (!areaMap[p.area]) areaMap[p.area] = [];
      areaMap[p.area].push(p);
    }

    return Object.entries(areaMap)
      .map(([area, props]) => ({
        area,
        totalVacant: props.reduce((s, p) => s + p.vacantBeds, 0),
        totalBeds: props.reduce((s, p) => s + p.totalBeds, 0),
        properties: props.sort((a, b) => b.vacantBeds - a.vacantBeds),
      }))
      .sort((a, b) => b.totalVacant - a.totalVacant);
  }, [beds, properties]);

  return (
    <AppLayout title="Availability" subtitle="Sales intelligence — what to pitch right now">
      <div className="space-y-6">
        {/* Heatmap */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Inventory Heatmap</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {bedsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />
              ))
            ) : areaData.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No inventory data yet</p>
              </div>
            ) : (
              areaData.map((area, i) => {
                const pct = area.totalBeds > 0 ? (area.totalVacant / area.totalBeds) * 100 : 0;
                const hue = pct > 40 ? 'status-good-bg' : pct > 15 ? 'status-warn-bg' : 'status-bad-bg';
                const textColor = pct > 40 ? 'status-good' : pct > 15 ? 'status-warn' : 'status-bad';
                return (
                  <motion.div
                    key={area.area}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-4 rounded-xl border ${hue} text-center`}
                  >
                    <p className="text-[11px] font-medium text-foreground truncate">{area.area}</p>
                    <p className={`text-2xl font-bold mt-1 ${textColor}`}>{area.totalVacant}</p>
                    <p className="text-[10px] text-muted-foreground">vacant of {area.totalBeds}</p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Area-wise availability table */}
        {areaData.map((area) => (
          <div key={area.area} className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-accent" />
              <h2 className="text-sm font-semibold">{area.area}</h2>
              <Badge variant="secondary" className="text-[10px]">{area.totalVacant} vacant</Badge>
            </div>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground">
                    <th className="text-left py-2.5 px-4 font-medium">Property</th>
                    <th className="text-center py-2.5 px-3 font-medium">Vacant Beds</th>
                    <th className="text-center py-2.5 px-3 font-medium">Rent/bed</th>
                    <th className="text-center py-2.5 px-3 font-medium">Next Vacancy</th>
                  </tr>
                </thead>
                <tbody>
                  {area.properties.map((p, i) => (
                    <tr key={i} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground">{p.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-semibold ${p.vacantBeds > 0 ? 'status-good' : 'status-bad'}`}>
                          {p.vacantBeds}
                        </span>
                        <span className="text-muted-foreground"> / {p.totalBeds}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-foreground">
                        {p.avgRent > 0 ? `₹${p.avgRent.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-muted-foreground">
                        {p.nextVacancy || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Availability;
