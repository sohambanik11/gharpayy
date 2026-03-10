import { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Star, Bed, Shield, X, Map as MapIcon, LayoutGrid, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicProperties, useAvailableCities, useAvailableAreas, useLandmarks, type PropertyFilters } from '@/hooks/usePublicData';
import { motion, AnimatePresence } from 'framer-motion';

const PropertyMap = lazy(() => import('@/components/PropertyMap'));

const SHARING_TYPES = ['Private', '2 Sharing', '3 Sharing', '4 Sharing'];
const GENDER_OPTIONS = [
  { value: 'any', label: 'Any Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];
const AREA_TAGS = ['Marathahalli', 'Whitefield', 'Koramangala', 'BTM Layout', 'HSR Layout', 'Electronic City', 'Bellandur', 'Indiranagar', 'Sarjapur Road', 'JP Nagar'];

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialArea = searchParams.get('area') || '';

  const [filters, setFilters] = useState<PropertyFilters>({ city: 'Bangalore', area: initialArea || undefined });
  const [searchQuery, setSearchQuery] = useState(initialArea);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSharing, setSelectedSharing] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('grid');

  const { data: cities } = useAvailableCities();
  const { data: areas } = useAvailableAreas(filters.city);
  const { data: properties, isLoading } = usePublicProperties({ ...filters, sharingTypes: selectedSharing.length ? selectedSharing : undefined });
  const { data: landmarks } = useLandmarks(filters.city);

  const getAvailableBeds = (property: any) => {
    if (!property.rooms) return 0;
    return property.rooms.reduce((sum: number, room: any) => {
      if (!room.beds) return sum;
      return sum + room.beds.filter((b: any) => b.status === 'vacant').length;
    }, 0);
  };

  const getRentRange = (property: any) => {
    if (!property.rooms?.length) return property.price_range || '—';
    const rents = property.rooms.map((r: any) => r.rent_per_bed || r.expected_rent).filter(Boolean);
    if (!rents.length) return '—';
    const min = Math.min(...rents);
    const max = Math.max(...rents);
    return min === max ? `₹${min.toLocaleString()}` : `₹${min.toLocaleString()}–${max.toLocaleString()}`;
  };

  const getAvailabilityColor = (beds: number) => {
    if (beds === 0) return 'bg-destructive/10 text-destructive';
    if (beds <= 3) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  const mapProperties = useMemo(() =>
    (properties || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      latitude: p.latitude,
      longitude: p.longitude,
      photos: p.photos,
      rating: p.rating,
      vacantBeds: getAvailableBeds(p),
      rentRange: getRentRange(p),
    })),
    [properties]
  );

  // Tech park discovery
  const techParks = landmarks?.filter(l => l.type === 'tech_park') || [];

  const PropertyCard = ({ property, i }: { property: any; i: number }) => {
    const beds = getAvailableBeds(property);
    const rentRange = getRentRange(property);
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="group cursor-pointer"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20">
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {property.photos?.length > 0 ? (
              <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Bed size={40} className="text-muted-foreground/30" /></div>
            )}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium ${getAvailabilityColor(beds)}`}>
              {beds === 0 ? 'Full' : `${beds} beds available`}
            </div>
            {property.is_verified && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-[11px] font-medium flex items-center gap-1">
                <Shield size={11} className="text-success" /> Verified
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">{property.name}</h3>
              {property.rating && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={12} className="fill-accent text-accent" />
                  <span className="text-[11px] font-medium">{property.rating}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">{[property.area, property.city].filter(Boolean).join(', ')}</p>
            {property.amenities?.length > 0 && (
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {property.amenities.slice(0, 3).map((a: string) => (
                  <span key={a} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{a}</span>
                ))}
                {property.amenities.length > 3 && <span className="text-[10px] text-muted-foreground">+{property.amenities.length - 3}</span>}
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-foreground">{rentRange}</span>
              <span className="text-[11px] text-muted-foreground">/month</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xs">G</span>
              </div>
              <span className="font-semibold text-base tracking-tight text-foreground">Gharpayy</span>
            </button>
            <div className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
              <button className="text-foreground font-medium">Explore PGs</button>
              <button onClick={() => navigate('/owner-portal')} className="hover:text-foreground transition-colors">For Owners</button>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>Login</Button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="border-b border-border bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by area, tech park, or property name..."
                className="pl-10 h-11 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFilters(f => ({ ...f, area: e.target.value || undefined }));
                }}
              />
            </div>
            <Select value={filters.city || ''} onValueChange={(v) => setFilters(f => ({ ...f, city: v }))}>
              <SelectTrigger className="w-full sm:w-44 h-11">
                <MapPin size={14} className="mr-1 text-muted-foreground" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {(cities || ['Bangalore']).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} />
              Filters
              {showFilters && <X size={13} />}
            </Button>
            <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-muted'}`}>
                <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-foreground' : 'text-muted-foreground'} />
              </button>
              <button onClick={() => setViewMode('map')} className={`p-2.5 transition-colors ${viewMode === 'map' ? 'bg-secondary' : 'hover:bg-muted'}`}>
                <MapIcon size={16} className={viewMode === 'map' ? 'text-foreground' : 'text-muted-foreground'} />
              </button>
              <button onClick={() => setViewMode('split')} className={`p-2.5 transition-colors ${viewMode === 'split' ? 'bg-secondary' : 'hover:bg-muted'}`}>
                <div className="flex gap-0.5">
                  <div className="w-2 h-4 bg-current rounded-sm opacity-70" />
                  <div className="w-2.5 h-4 bg-current rounded-sm" />
                </div>
              </button>
            </div>
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                  <Select value={filters.gender || 'any'} onValueChange={(v) => setFilters(f => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(v) => setFilters(f => ({ ...f, area: v }))}>
                    <SelectTrigger><SelectValue placeholder="Area" /></SelectTrigger>
                    <SelectContent>
                      {(areas || []).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Max budget (₹)" className="h-10" onChange={(e) => setFilters(f => ({ ...f, budgetMax: Number(e.target.value) || undefined }))} />
                  <Input type="date" placeholder="Move-in date" className="h-10" />
                </div>
                <div className="flex gap-2 pt-3 flex-wrap">
                  <span className="text-[11px] text-muted-foreground self-center mr-1">Sharing:</span>
                  {SHARING_TYPES.map(type => (
                    <Badge
                      key={type}
                      variant={selectedSharing.includes(type) ? 'default' : 'outline'}
                      className="cursor-pointer text-[11px]"
                      onClick={() => setSelectedSharing(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Area tags + tech parks */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
        {AREA_TAGS.map(area => (
          <Badge
            key={area}
            variant={filters.area === area ? 'default' : 'secondary'}
            className="cursor-pointer whitespace-nowrap shrink-0 text-[11px]"
            onClick={() => {
              setFilters(f => ({ ...f, area: f.area === area ? undefined : area }));
              setSearchQuery(filters.area === area ? '' : area);
            }}
          >
            <MapPin size={11} className="mr-1" /> {area}
          </Badge>
        ))}
        {techParks.length > 0 && (
          <>
            <div className="w-px bg-border shrink-0 mx-1" />
            {techParks.slice(0, 4).map(tp => (
              <Badge
                key={tp.id}
                variant="secondary"
                className="cursor-pointer whitespace-nowrap shrink-0 text-[11px] gap-1"
                onClick={() => {
                  setSearchQuery(tp.area || tp.name);
                  setFilters(f => ({ ...f, area: tp.area || undefined }));
                }}
              >
                <Building2 size={11} /> {tp.name}
              </Badge>
            ))}
          </>
        )}
      </section>

      {/* Content */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${properties?.length || 0} properties found`}
            {filters.city && ` in ${filters.city}`}
            {filters.area && ` · ${filters.area}`}
          </p>
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties?.map((property: any, i: number) => (
              <PropertyCard key={property.id} property={property} i={i} />
            ))}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: 'calc(100vh - 200px)' }}>
            <Suspense fallback={<div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">Loading map...</div>}>
              <PropertyMap properties={mapProperties} onPropertyClick={(id) => navigate(`/property/${id}`)} />
            </Suspense>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="flex gap-5" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="w-1/2 overflow-y-auto space-y-4 pr-2">
              {properties?.map((property: any, i: number) => (
                <PropertyCard key={property.id} property={property} i={i} />
              ))}
            </div>
            <div className="w-1/2 rounded-xl overflow-hidden border border-border sticky top-0">
              <Suspense fallback={<div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">Loading map...</div>}>
                <PropertyMap properties={mapProperties} onPropertyClick={(id) => navigate(`/property/${id}`)} />
              </Suspense>
            </div>
          </div>
        )}

        {properties?.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <Bed size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No properties found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search in a different area.</p>
          </div>
        )}

        {/* PGs near tech parks */}
        {techParks.length > 0 && !filters.area && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-6">PGs near tech parks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {techParks.slice(0, 6).map(tp => (
                <button
                  key={tp.id}
                  onClick={() => {
                    setSearchQuery(tp.area || tp.name);
                    setFilters(f => ({ ...f, area: tp.area || undefined }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent/30 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{tp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{tp.area || tp.city} · Browse PGs nearby</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
