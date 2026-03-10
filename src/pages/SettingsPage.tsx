import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgents, useProperties } from '@/hooks/useCrmData';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, UserCog, Building2, User, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
  const user = { id: 'admin', email: 'admin@gharpayy.com', user_metadata: { full_name: 'Admin' } };
  const { data: agents } = useAgents();
  const { data: properties } = useProperties();
  const qc = useQueryClient();

  return (
    <AppLayout title="Settings" subtitle="System configuration">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger value="team" className="text-xs gap-1.5"><UserCog size={13} /> Team</TabsTrigger>
            <TabsTrigger value="properties" className="text-xs gap-1.5"><Building2 size={13} /> Properties</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1.5"><User size={13} /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamTab agents={agents || []} qc={qc} />
          </TabsContent>
          <TabsContent value="properties">
            <PropertiesTab properties={properties || []} qc={qc} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab user={user} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

function TeamTab({ agents, qc }: { agents: any[]; qc: any }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setAdding(true);
    try {
      const { error } = await supabase.from('agents').insert({ name: form.name, email: form.email || null, phone: form.phone || null });
      if (error) throw error;
      toast.success('Agent added');
      setForm({ name: '', email: '', phone: '' });
      qc.invalidateQueries({ queryKey: ['agents'] });
    } catch (err: any) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('agents').update({ is_active: !isActive }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(isActive ? 'Agent deactivated' : 'Agent activated'); qc.invalidateQueries({ queryKey: ['agents'] }); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Agent removed'); qc.invalidateQueries({ queryKey: ['agents'] }); }
  };

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Add Agent</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Name *</Label>
            <Input placeholder="Agent name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Email</Label>
            <Input placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Phone</Label>
            <Input placeholder="+91..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={adding} className="mt-3 gap-1.5 text-xs">
          <Plus size={12} /> {adding ? 'Adding...' : 'Add Agent'}
        </Button>
      </div>

      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Team Members</h3>
        <div className="space-y-2">
          {agents.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-accent">{a.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.email || a.phone || 'No contact info'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => handleToggle(a.id, a.is_active)}>
                  {a.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
          {agents.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No agents yet</p>}
        </div>
      </div>
    </div>
  );
}

function PropertiesTab({ properties, qc }: { properties: any[]; qc: any }) {
  const [form, setForm] = useState({ name: '', city: '', area: '', price_range: '', address: '' });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setAdding(true);
    try {
      const { error } = await supabase.from('properties').insert({
        name: form.name,
        city: form.city || null,
        area: form.area || null,
        price_range: form.price_range || null,
        address: form.address || null,
      });
      if (error) throw error;
      toast.success('Property added');
      setForm({ name: '', city: '', area: '', price_range: '', address: '' });
      qc.invalidateQueries({ queryKey: ['properties'] });
    } catch (err: any) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Property removed'); qc.invalidateQueries({ queryKey: ['properties'] }); }
  };

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Add Property</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Name *</Label>
            <Input placeholder="Property name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">City</Label>
            <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Area</Label>
            <Input placeholder="Area" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Price Range</Label>
            <Input placeholder="₹50L - 80L" value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={adding} className="mt-3 gap-1.5 text-xs">
          <Plus size={12} /> {adding ? 'Adding...' : 'Add Property'}
        </Button>
      </div>

      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Properties</h3>
        <div className="space-y-2">
          {properties.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div>
                <p className="text-xs font-medium text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{[p.area, p.city].filter(Boolean).join(', ')} {p.price_range ? `· ${p.price_range}` : ''}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
          {properties.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No properties yet</p>}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {};
      if (name) updates.data = { full_name: name };
      if (password) updates.password = password;
      if (Object.keys(updates).length === 0) { toast.error('Nothing to update'); setSaving(false); return; }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      if (name) {
        await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
      }
      toast.success('Profile updated');
      setPassword('');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="kpi-card max-w-md">
      <h3 className="font-display font-semibold text-xs mb-4">Your Profile</h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px]">Email</Label>
          <Input value={user?.email || ''} disabled className="text-xs bg-secondary" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Full Name</Label>
          <Input placeholder="Update your name" value={name} onChange={e => setName(e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">New Password</Label>
          <Input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} className="text-xs" />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
          <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;
