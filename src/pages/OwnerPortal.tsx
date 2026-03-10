import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Building2, Bed, CheckCircle2, Clock, TrendingUp, Users,
  LogOut, RefreshCw, AlertTriangle, IndianRupee, BarChart3, Home,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook: Fetch owner by user_id
function useOwnerByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['owner-by-user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// Hook: Properties with rooms/beds for an owner
function useOwnerProperties(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['owner-properties', ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, rooms(*, beds(*))')
        .eq('owner_id', ownerId!)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// Hook: Bookings for owner properties
function useOwnerBookings(propertyIds: string[]) {
  return useQuery({
    queryKey: ['owner-bookings', propertyIds],
    enabled: propertyIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, leads(name, phone), rooms(room_number), beds(bed_number), properties(name)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Hook: Effort data for a property
function usePropertyEffort(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-effort', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_property_effort', {
        p_property_id: propertyId!,
      });
      if (error) throw error;
      return data as any;
    },
  });
}

// Hook: Confirm room status
function useConfirmRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { room_id: string; status: string; confirmed_by?: string; notes?: string }) => {
      const { data, error } = await supabase.from('room_status_log').insert({
        room_id: params.room_id,
        status: params.status as any,
        confirmed_by: params.confirmed_by || null,
        notes: params.notes || null,
        rent_updated: false,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-properties'] });
      toast.success('Room status confirmed');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

const STATUS_COLORS: Record<string, string> = {
  vacant: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-info/10 text-info border-info/20',
  vacating: 'bg-warning/10 text-warning border-warning/20',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
};

const BOOKING_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  checked_in: 'bg-info/10 text-info',
  checked_out: 'bg-muted text-muted-foreground',
};

export default function OwnerPortal() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: owner, isLoading: ownerLoading, error: ownerError } = useOwnerByUser(user?.id);
  const { data: properties } = useOwnerProperties(owner?.id);
  const propertyIds = properties?.map((p: any) => p.id) || [];
  const { data: bookings } = useOwnerBookings(propertyIds);
  const confirmRoom = useConfirmRoom();

  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [confirmStatus, setConfirmStatus] = useState('vacant');
  const [confirmNotes, setConfirmNotes] = useState('');

  // If not logged in, redirect to auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/owner-portal');
    }
  }, [authLoading, user, navigate]);

  if (authLoading || ownerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading owner portal...</div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle size={40} className="mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2">No Owner Account Found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account is not linked to any property owner profile. Please contact the Gharpayy team to set up your owner account.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
              <Button onClick={() => signOut()}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats
  const filteredProps = selectedProperty === 'all'
    ? properties || []
    : properties?.filter((p: any) => p.id === selectedProperty) || [];

  const totalRooms = filteredProps.reduce((s: number, p: any) => s + (p.rooms?.length || 0), 0);
  const totalBeds = filteredProps.reduce((s: number, p: any) =>
    s + (p.rooms || []).reduce((rs: number, r: any) => rs + (r.beds?.length || 0), 0), 0);
  const vacantBeds = filteredProps.reduce((s: number, p: any) =>
    s + (p.rooms || []).reduce((rs: number, r: any) =>
      rs + (r.beds || []).filter((b: any) => b.status === 'vacant').length, 0), 0);
  const occupiedBeds = filteredProps.reduce((s: number, p: any) =>
    s + (p.rooms || []).reduce((rs: number, r: any) =>
      rs + (r.beds || []).filter((b: any) => b.status === 'occupied').length, 0), 0);

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    await confirmRoom.mutateAsync({
      room_id: confirmDialog.id,
      status: confirmStatus,
      confirmed_by: owner.id,
      notes: confirmNotes || undefined,
    });
    setConfirmDialog(null);
    setConfirmNotes('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">G</span>
              </div>
              <div>
                <span className="font-semibold text-base tracking-tight text-foreground">Gharpayy</span>
                <span className="text-xs text-muted-foreground ml-2">Owner Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">Welcome, {owner.name}</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Home size={16} className="mr-1" /> Home
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut size={14} className="mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + Property Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Property Dashboard</h1>
            <p className="text-sm text-muted-foreground">{owner.name}{owner.company_name ? ` · ${owner.company_name}` : ''}</p>
          </div>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-64">
              <Building2 size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties ({properties?.length || 0})</SelectItem>
              {properties?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Properties', value: filteredProps.length, icon: Building2, color: 'text-accent' },
            { label: 'Total Beds', value: totalBeds, icon: Bed, color: 'text-info' },
            { label: 'Vacant Beds', value: vacantBeds, icon: CheckCircle2, color: 'text-success' },
            { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-warning' },
          ].map((kpi) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon size={16} className={kpi.color} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-semibold">{kpi.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="rooms">Rooms & Status</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="effort">Effort Report</TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            {filteredProps.map((property: any) => (
              <Card key={property.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{property.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{property.area}, {property.city}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(property.rooms || []).map((room: any) => {
                      const vacant = (room.beds || []).filter((b: any) => b.status === 'vacant').length;
                      const stale = room.last_confirmed_at
                        ? new Date().getTime() - new Date(room.last_confirmed_at).getTime() > 24 * 60 * 60 * 1000
                        : true;
                      return (
                        <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Room {room.room_number}</span>
                                {room.room_type && <Badge variant="outline" className="text-2xs">{room.room_type}</Badge>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{room.bed_count} beds</span>
                                <span className="text-success">{vacant} vacant</span>
                                {room.rent_per_bed && <span>₹{room.rent_per_bed.toLocaleString()}/bed</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-2xs border ${STATUS_COLORS[room.status] || 'bg-muted'}`}>
                              {room.status}
                            </Badge>
                            {stale && (
                              <Badge variant="outline" className="text-2xs text-warning border-warning/30 gap-1">
                                <Clock size={10} /> Needs confirmation
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => {
                                setConfirmDialog(room);
                                setConfirmStatus(room.status);
                              }}
                            >
                              <RefreshCw size={12} /> Confirm
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProps.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 size={40} className="mx-auto mb-3 opacity-40" />
                <p>No properties found</p>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings?.length ? (
                  <div className="space-y-3">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium text-sm">{(b.leads as any)?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {(b.properties as any)?.name} · Room {(b.rooms as any)?.room_number} · Bed {(b.beds as any)?.bed_number}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {b.move_in_date && `Move-in: ${b.move_in_date}`}
                            {b.monthly_rent && ` · ₹${b.monthly_rent.toLocaleString()}/mo`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-2xs ${BOOKING_COLORS[b.booking_status] || ''}`}>
                            {b.booking_status}
                          </Badge>
                          <Badge variant="outline" className="text-2xs">
                            {b.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No bookings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Effort Tab */}
          <TabsContent value="effort">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProps.map((property: any) => (
                <EffortCard key={property.id} property={property} />
              ))}
            </div>
            {filteredProps.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
                <p>No properties to show effort for</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Room Status Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(o) => !o && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Room Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Room {confirmDialog?.room_number} · {confirmDialog?.bed_count} beds
            </p>
            <div>
              <Label className="text-xs">Current Status</Label>
              <Select value={confirmStatus} onValueChange={setConfirmStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacating">Vacating</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                placeholder="Any updates..."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={confirmRoom.isPending}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {confirmRoom.isPending ? 'Confirming...' : 'Confirm Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for effort per property
function EffortCard({ property }: { property: any }) {
  const { data: effort } = usePropertyEffort(property.id);

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-1">{property.name}</h3>
        <p className="text-xs text-muted-foreground mb-4">{property.area}</p>
        {effort ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Leads', value: (effort as any).total_leads, color: 'text-foreground' },
              { label: 'Total Visits', value: (effort as any).total_visits, color: 'text-info' },
              { label: 'Booked', value: (effort as any).booked, color: 'text-success' },
              { label: 'Not Interested', value: (effort as any).not_interested, color: 'text-destructive' },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-secondary/50">
                <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-2xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">Loading effort data...</div>
        )}
      </CardContent>
    </Card>
  );
}
