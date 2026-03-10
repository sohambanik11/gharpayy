import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLeads } from '@/hooks/useCrmData';
import { useDbMatchBeds } from '@/hooks/useZones';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, IndianRupee, Bed, Check, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function parseBudget(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.toLowerCase().replace(/[₹,\s]/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|l|lakh|cr)?/);
  if (!match) return 0;
  let val = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === 'k') val *= 1000;
  else if (suffix === 'l' || suffix === 'lakh') val *= 100000;
  else if (suffix === 'cr') val *= 10000000;
  return val;
}

const Matching = () => {
  const { data: leads } = useLeads();
  const dbMatch = useDbMatchBeds();
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);

  const activeLeads = (leads || []).filter(l => l.status !== 'booked' && l.status !== 'lost');
  const lead = activeLeads.find(l => l.id === selectedLead);

  const handleMatch = async () => {
    if (!lead) return;
    const budget = parseBudget(lead.budget || '');
    const result = await dbMatch.mutateAsync({
      location: lead.preferred_location || '',
      budget: budget || 10000,
      roomType: undefined,
    });
    setMatches(result || []);
  };

  const handleSelectLead = (id: string) => {
    setSelectedLead(id);
    setMatches([]);
  };

  return (
    <AppLayout title="Lead ↔ Room Matching" subtitle="Database-powered inventory matching engine">
      <div className="space-y-6">
        {/* Lead selector */}
        <div className="flex items-end gap-3 max-w-lg">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select a lead to match</label>
            <Select value={selectedLead} onValueChange={handleSelectLead}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choose a lead..." /></SelectTrigger>
              <SelectContent>
                {activeLeads.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {l.preferred_location || 'No location'} · {l.budget || 'No budget'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleMatch} disabled={!lead || dbMatch.isPending} className="gap-1.5 text-xs h-10 rounded-xl">
            {dbMatch.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Match
          </Button>
        </div>

        {/* Lead summary */}
        {lead && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border bg-card">
            <h3 className="text-sm font-semibold text-foreground">{lead.name}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {lead.preferred_location && <span className="flex items-center gap-1"><MapPin size={12} /> {lead.preferred_location}</span>}
              {lead.budget && <span className="flex items-center gap-1"><IndianRupee size={12} /> {lead.budget}</span>}
              {lead.notes && <span className="flex items-center gap-1"><Bed size={12} /> {lead.notes}</span>}
            </div>
          </motion.div>
        )}

        {/* Matches from DB */}
        {matches.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Sparkles size={14} className="text-accent" />
              Top Matches
              <Badge variant="secondary" className="text-[10px]">{matches.length} found</Badge>
            </h2>
            <div className="grid gap-2">
              {matches.map((m: any, i: number) => (
                <motion.div
                  key={m.bed_id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-border bg-card hover:border-accent/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-5 text-center">{i + 1}.</span>
                        <h3 className="text-sm font-semibold text-foreground">{m.property_name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{m.property_area}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                        Room {m.room_number} · Bed {m.bed_number}
                        {m.room_type && ` · ${m.room_type}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">₹{Number(m.rent_per_bed || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 ml-7">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                      {m.match_score}% match
                    </span>
                    {m.match_score >= 70 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-success/10 text-success border border-success/20">
                        <Check size={9} /> Strong match
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {lead && matches.length === 0 && !dbMatch.isPending && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click "Match" to find best inventory for this lead</p>
            <p className="text-xs mt-1">Uses database-level scoring: location, budget, room type, availability</p>
          </div>
        )}

        {!lead && (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a lead above to see matched inventory</p>
            <p className="text-xs mt-1">Powered by server-side matching engine</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Matching;
