import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useOwners, useCreateOwner } from '@/hooks/useInventoryData';
import { usePropertiesWithOwners } from '@/hooks/useInventoryData';
import { Plus, Building2, Phone, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';

const Owners = () => {
  const { data: owners, isLoading } = useOwners();
  const { data: properties } = usePropertiesWithOwners();
  const createOwner = useCreateOwner();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company_name: '', notes: '' });

  const filtered = owners?.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search) ||
    (o.email && o.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getOwnerProperties = (ownerId: string) =>
    properties?.filter((p: any) => p.owner_id === ownerId) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone required'); return; }
    await createOwner.mutateAsync({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      company_name: form.company_name.trim() || null,
      notes: form.notes.trim() || null,
    });
    setOpen(false);
    setForm({ name: '', phone: '', email: '', company_name: '', notes: '' });
  };

  return (
    <AppLayout title="Owners" subtitle="Manage property owners and their portfolios">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus size={14} /> Add Owner</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader><DialogTitle className="font-display">Add Owner</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Name *</Label><Input placeholder="Owner name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Phone *</Label><Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Company</Label><Input placeholder="Company name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={createOwner.isPending}>{createOwner.isPending ? 'Creating...' : 'Add Owner'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search owners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !filtered?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No owners yet</p>
            <p className="text-xs mt-1">Add your first property owner to get started</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(owner => {
              const ownerProps = getOwnerProperties(owner.id);
              return (
                <div key={owner.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{owner.name}</h3>
                      {owner.company_name && <p className="text-xs text-muted-foreground">{owner.company_name}</p>}
                    </div>
                    <Badge variant={owner.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {owner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone size={12} /> {owner.phone}
                    </div>
                    {owner.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail size={12} /> {owner.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 size={12} /> {ownerProps.length} {ownerProps.length === 1 ? 'property' : 'properties'}
                    </div>
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

export default Owners;
