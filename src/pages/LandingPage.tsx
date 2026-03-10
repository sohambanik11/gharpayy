import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Shield, ArrowRight, Bed, Building2, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePublicProperties } from '@/hooks/usePublicData';
import { motion } from 'framer-motion';
import { useState } from 'react';

const CITIES = [
  { name: 'Bangalore', tagline: '300+ PGs', active: true },
  { name: 'Hyderabad', tagline: 'Coming Soon', active: false },
  { name: 'Pune', tagline: 'Coming Soon', active: false },
  { name: 'Delhi NCR', tagline: 'Coming Soon', active: false },
  { name: 'Chennai', tagline: 'Coming Soon', active: false },
];

const POPULAR_AREAS = ['Marathahalli', 'Whitefield', 'Koramangala', 'BTM Layout', 'HSR Layout', 'Electronic City', 'Bellandur', 'Indiranagar', 'Sarjapur Road'];

const STATS = [
  { value: '300+', label: 'Verified Properties' },
  { value: '5,000+', label: 'Happy Residents' },
  { value: '12', label: 'Bangalore Areas' },
  { value: '4.6', label: 'Average Rating' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: featured } = usePublicProperties({ city: 'Bangalore', limit: 6 });

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
    if (!rents.length) return property.price_range || '—';
    const min = Math.min(...rents);
    return `₹${min.toLocaleString()}`;
  };

  const handleSearch = () => {
    navigate(`/explore${searchQuery ? `?area=${searchQuery}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-lg tracking-tight text-foreground">Gharpayy</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/explore')} className="hover:text-foreground transition-colors font-medium">Explore PGs</button>
              <button onClick={() => navigate('/owner-portal')} className="hover:text-foreground transition-colors">For Owners</button>
              <button onClick={() => navigate('/explore')} className="hover:text-foreground transition-colors">About</button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Login</Button>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/explore')}>
                Find a PG
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-6 text-xs px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block mr-2" />
                Now live in Bangalore · 300+ properties
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-5">
                Your next home,<br />
                <span className="text-accent">found in minutes.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                Discover verified PG accommodations across Bangalore. Transparent pricing, instant booking, zero brokerage.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    placeholder="Search by area or tech park..."
                    className="pl-11 h-13 text-base rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="h-13 px-8 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-base">
                  Search <ArrowRight size={18} className="ml-1" />
                </Button>
              </div>

              {/* Quick areas */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-2xs text-muted-foreground self-center mr-1">Popular:</span>
                {POPULAR_AREAS.slice(0, 6).map(area => (
                  <button
                    key={area}
                    onClick={() => navigate(`/explore?area=${area}`)}
                    className="text-2xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Gradient decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-2xs text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Featured properties</h2>
            <p className="text-sm text-muted-foreground mt-1">Hand-picked PGs in top Bangalore neighborhoods</p>
          </div>
          <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate('/explore')}>
            View all <ChevronRight size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured?.slice(0, 6).map((property: any, i: number) => {
            const beds = getAvailableBeds(property);
            const startingRent = getRentRange(property);
            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-muted-foreground/20">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {property.photos?.length > 0 ? (
                      <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Bed size={40} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {(property as any).is_verified && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-2xs font-medium flex items-center gap-1">
                        <Shield size={11} className="text-success" /> Verified
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-2xs font-medium">
                      {beds > 0 ? `${beds} beds available` : 'Full'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">{property.name}</h3>
                      {(property as any).rating && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star size={12} className="fill-accent text-accent" />
                          <span className="text-2xs font-medium">{(property as any).rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-2xs text-muted-foreground mb-2">{[property.area, property.city].filter(Boolean).join(', ')}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-semibold text-foreground">From {startingRent}</span>
                      <span className="text-2xs text-muted-foreground">/month</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Cities */}
      <section className="bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">Explore by city</h2>
          <p className="text-sm text-muted-foreground mb-8">Starting with Bangalore, expanding across India</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CITIES.map(city => (
              <button
                key={city.name}
                onClick={() => city.active && navigate('/explore')}
                disabled={!city.active}
                className={`p-5 rounded-xl border text-left transition-all ${
                  city.active
                    ? 'bg-card border-border hover:border-accent/50 hover:shadow-sm cursor-pointer'
                    : 'bg-muted/50 border-border/50 cursor-not-allowed opacity-60'
                }`}
              >
                <MapPin size={20} className={city.active ? 'text-accent mb-2' : 'text-muted-foreground mb-2'} />
                <h3 className="font-semibold text-sm">{city.name}</h3>
                <p className="text-2xs text-muted-foreground">{city.tagline}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-center mb-12">How Gharpayy works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Search & Discover', desc: 'Browse verified PGs by area, budget, and preferences. Every listing is real and up-to-date.' },
            { step: '02', title: 'Tour & Compare', desc: 'Schedule visits or take virtual tours. Compare rooms, amenities, and prices side by side.' },
            { step: '03', title: 'Book Instantly', desc: 'Reserve your bed with just ₹1,000. Zero brokerage, transparent pricing, instant confirmation.' },
          ].map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-accent font-semibold text-sm">{item.step}</span>
              </div>
              <h3 className="font-semibold text-base mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-accent/5 border border-accent/10 p-10 sm:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">Ready to find your new home?</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">Join 5,000+ residents who found their perfect PG through Gharpayy.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/explore')} className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground text-base rounded-xl">
              Explore PGs <ArrowRight size={18} className="ml-1" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/capture')} className="h-12 px-8 text-base rounded-xl">
              List Your Property
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-2xs">G</span>
              </div>
              <span className="font-semibold text-sm">Gharpayy</span>
              <span className="text-2xs text-muted-foreground">· India's smartest PG platform</span>
            </div>
            <p className="text-2xs text-muted-foreground">© 2026 Gharpayy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
