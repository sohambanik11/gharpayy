import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import CsvImport from '@/components/CsvImport';
import { useLeads } from '@/hooks/useCrmData';
import { History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SOURCE_LABELS } from '@/types/crm';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

const Historical = () => {
  const { data: leads } = useLeads();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  // Sort oldest first for historical view
  const sorted = [...(leads || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const filtered = sorted.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    (l.preferred_location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Historical Leads" subtitle="Import and re-engage past leads">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CSV Import */}
        <motion.div
          className="kpi-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <h3 className="font-display font-semibold text-xs mb-4 flex items-center gap-2">
            <History size={14} className="text-accent" /> CSV Import
          </h3>
          <CsvImport onComplete={() => qc.invalidateQueries({ queryKey: ['leads'] })} />
        </motion.div>

        {/* Lead Database */}
        <motion.div
          className="lg:col-span-2 kpi-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-xs">All Leads ({filtered.length})</h3>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5 w-56">
              <Search size={13} className="text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, phone, location..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Location</th>
                  <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{l.phone}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[9px]">{SOURCE_LABELS[l.source as keyof typeof SOURCE_LABELS]}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="secondary" className="text-[9px] capitalize">{l.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{l.preferred_location || '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{format(new Date(l.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No leads found</p>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Historical;
