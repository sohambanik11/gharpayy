import { MapPin, Building2, GraduationCap, TrainFront } from 'lucide-react';
import { useLandmarks } from '@/hooks/usePublicData';

const ICON_MAP: Record<string, any> = {
  tech_park: Building2,
  university: GraduationCap,
  metro: TrainFront,
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

export default function NearbyLandmarks({ latitude, longitude, city }: Props) {
  const { data: landmarks } = useLandmarks(city);

  if (!latitude || !longitude || !landmarks?.length) return null;

  const nearby = landmarks
    .filter(l => l.latitude && l.longitude)
    .map(l => ({
      ...l,
      distance: haversineKm(latitude, longitude, l.latitude!, l.longitude!),
    }))
    .filter(l => l.distance <= 15)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  if (!nearby.length) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Nearby landmarks</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nearby.map(l => {
          const Icon = ICON_MAP[l.type] || MapPin;
          return (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                <p className="text-[11px] text-muted-foreground">{l.distance.toFixed(1)} km away · {Math.round(l.distance * 3)} min drive</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
