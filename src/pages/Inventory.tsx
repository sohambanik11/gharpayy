import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAllRoomsWithDetails, useCreateRoom, useConfirmRoomStatus, useUpdateRoom } from '@/hooks/useInventoryData';
import { usePropertiesWithOwners } from '@/hooks/useInventoryData';
import { Plus, Search, Bed, Lock, Unlock, CheckCircle2, AlertTriangle, Home, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  vacant: { label: 'Vacant', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  vacating: { label: 'Vacating', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertTriangle },
  occupied: { label: 'Occupied', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', icon: Home },
  blocked: { label: 'Blocked', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: Lock },
};

const Inventory = () => {
  const { data: rooms, isLoading } = useAllRoomsWithDetails();
  const { data: properties } = usePropertiesWithOwners();
  const createRoom = useCreateRoom();
  const confirmStatus = useConfirmRoomStatus();
  const updateRoom = useUpdateRoom();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lockedFilter, setLockedFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ property_id: '', room_number: '', floor: '', bed_count: '1', room_type: '', expected_rent: '', actual_rent: '', notes: '' });
  const [confirmForm, setConfirmForm] = useState({ status: 'vacant', notes: '' });

  const filtered = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((r: any) => {
      const matchSearch = r.room_number.toLowerCase().includes(search.toLowerCase()) ||
        r.properties?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.properties?.owners?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchLocked = lockedFilter === 'all' ||
        (lockedFilter === 'locked' && r.auto_locked) ||
        (lockedFilter === 'unlocked' && !r.auto_locked);
      return matchSearch && matchStatus && matchLocked;
    });
  }, [rooms, search, statusFilter, lockedFilter]);

  const stats = useMemo(() => {
    if (!rooms) return { total: 0, vacant: 0, vacating: 0, occupied: 0, blocked: 0, locked: 0 };
    return {
      total: rooms.length,
      vacant: rooms.filter((r: any) => r.status === 'vacant' && !r.auto_locked).length,
      vacating: rooms.filter((r: any) => r.status === 'vacating').length,
      occupied: rooms.filter((r: any) => r.status === 'occupied').length,
      blocked: rooms.filter((r: any) => r.status === 'blocked').length,
      locked: rooms.filter((r: any) => r.auto_locked).length,
    };
  }, [rooms]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id || !form.room_number.trim()) { toast.error('Property and room number required'); return; }
    await createRoom.mutateAsync({
      property_id: form.property_id,
      room_number: form.room_number.trim(),
      floor: form.floor.trim() || null,
      bed_count: parseInt(form.bed_count) || 1,
      room_type: form.room_type.trim() || null,
      expected_rent: form.expected_rent ? parseFloat(form.expected_rent) : null,
      actual_rent: form.actual_rent ? parseFloat(form.actual_rent) : null,
      notes: form.notes.trim() || null,
    });
    setAddOpen(false);
    setForm({ property_id: '', room_number: '', floor: '', bed_count: '1', room_type: '', expected_rent: '', actual_rent: '', notes: '' });
  };

  const handleConfirm = async (roomId: string) => {
    await confirmStatus.mutateAsync({
      room_id: roomId,
      status: confirmForm.status,
      notes: confirmForm.notes.trim() || null,
    });
    setConfirmOpen(null);
    setConfirmForm({ status: 'vacant', notes: '' });
  };

  return (
    <AppLayout title="Room Inventory" subtitle="Real-time room availability">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus size={14} /> Add Room</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader><DialogTitle className="font-display">Add Room</DialogTitle></DialogHeader>
              <form onSubmit={handleAddRoom} className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Property *</Label>
                  <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} {p.area ? `— ${p.area}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Room # *</Label><Input placeholder="101" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Floor</Label><Input placeholder="1st" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Beds</Label><Input type="number" min={1} value={form.bed_count} onChange={e => setForm(f => ({ ...f, bed_count: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Room Type</Label><Input placeholder="Single / Double / Triple" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Expected Rent ₹</Label><Input type="number" placeholder="8000" value={form.expected_rent} onChange={e => setForm(f => ({ ...f, expected_rent: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={createRoom.isPending}>{createRoom.isPending ? 'Adding...' : 'Add Room'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Rooms', value: stats.total, color: 'text-foreground' },
            { label: 'Vacant (Available)', value: stats.vacant, color: 'text-emerald-600' },
            { label: 'Vacating Soon', value: stats.vacating, color: 'text-amber-600' },
            { label: 'Occupied', value: stats.occupied, color: 'text-sky-600' },
            { label: 'Blocked', value: stats.blocked, color: 'text-destructive' },
            { label: 'Auto-Locked ⚠', value: stats.locked, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border bg-card text-center">
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search rooms, properties, owners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9"><Filter size={13} className="mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="vacating">Vacating</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lockedFilter} onValueChange={setLockedFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locks</SelectItem>
              <SelectItem value="locked">Auto-Locked</SelectItem>
              <SelectItem value="unlocked">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Grid */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading inventory...</div>
        ) : !filtered.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bed size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No rooms found</p>
            <p className="text-xs mt-1">Add rooms to start tracking inventory</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((room: any) => {
              const sc = STATUS_CONFIG[room.status] || STATUS_CONFIG.vacant;
              const StatusIcon = sc.icon;
              const lastConfirmed = room.last_confirmed_at ? formatDistanceToNow(new Date(room.last_confirmed_at), { addSuffix: true }) : 'Never';

              return (
                <div key={room.id} className={`p-4 rounded-xl border bg-card hover:shadow-md transition-shadow ${room.auto_locked ? 'border-orange-400/50 bg-orange-50/30 dark:bg-orange-950/10' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Room {room.room_number}</h3>
                        {room.auto_locked && <Lock size={12} className="text-orange-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{room.properties?.name || 'Unknown'}</p>
                      {room.properties?.owners?.name && (
                        <p className="text-[10px] text-muted-foreground">Owner: {room.properties.owners.name}</p>
                      )}
                    </div>
                    <Badge className={`text-[10px] border ${sc.color}`}>
                      <StatusIcon size={10} className="mr-1" />
                      {sc.label}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Beds:</span> {room.bed_count}</div>
                    {room.room_type && <div><span className="text-muted-foreground">Type:</span> {room.room_type}</div>}
                    {room.expected_rent && <div><span className="text-muted-foreground">Ask:</span> ₹{Number(room.expected_rent).toLocaleString()}</div>}
                    {room.actual_rent && <div><span className="text-muted-foreground">Last:</span> ₹{Number(room.actual_rent).toLocaleString()}</div>}
                    {room.vacating_date && <div className="col-span-2"><span className="text-muted-foreground">Vacating:</span> {room.vacating_date}</div>}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Confirmed {lastConfirmed}</p>
                    <Dialog open={confirmOpen === room.id} onOpenChange={v => setConfirmOpen(v ? room.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                          <CheckCircle2 size={11} /> Confirm
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[340px]">
                        <DialogHeader><DialogTitle className="text-sm font-display">Confirm Room {room.room_number}</DialogTitle></DialogHeader>
                        <div className="space-y-3 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Current Status</Label>
                            <Select value={confirmForm.status} onValueChange={v => setConfirmForm(f => ({ ...f, status: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vacant">Vacant</SelectItem>
                                <SelectItem value="vacating">Vacating</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input placeholder="Any notes..." value={confirmForm.notes} onChange={e => setConfirmForm(f => ({ ...f, notes: e.target.value }))} />
                          </div>
                          <Button className="w-full" size="sm" onClick={() => handleConfirm(room.id)} disabled={confirmStatus.isPending}>
                            {confirmStatus.isPending ? 'Confirming...' : 'Confirm Status'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Inventory;
