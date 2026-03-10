import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LEAD_FIELDS = [
  { key: 'skip', label: '— Skip —' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'source', label: 'Source' },
  { key: 'budget', label: 'Budget' },
  { key: 'preferred_location', label: 'Location' },
  { key: 'notes', label: 'Notes' },
];

const CsvImport = ({ onComplete }: { onComplete?: () => void }) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      if (lines.length < 2) { toast.error('CSV must have a header row and at least one data row'); return; }
      setHeaders(lines[0]);
      setRows(lines.slice(1).filter(r => r.some(c => c)));
      // Auto-map by name matching
      const autoMap: Record<number, string> = {};
      lines[0].forEach((h, i) => {
        const lower = h.toLowerCase();
        const match = LEAD_FIELDS.find(f => f.key !== 'skip' && (lower.includes(f.key) || lower.includes(f.label.toLowerCase())));
        if (match) autoMap[i] = match.key;
      });
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    const nameIdx = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
    const phoneIdx = Object.entries(mapping).find(([, v]) => v === 'phone')?.[0];
    if (nameIdx === undefined || phoneIdx === undefined) {
      toast.error('Name and Phone columns must be mapped');
      return;
    }

    setImporting(true);
    try {
      const leads = rows.map(row => {
        const lead: Record<string, any> = { status: 'new', source: 'website' };
        Object.entries(mapping).forEach(([idx, field]) => {
          if (field !== 'skip' && row[Number(idx)]) {
            lead[field] = row[Number(idx)];
          }
        });
        return lead;
      }).filter(l => l.name && l.phone);

      const batchSize = 50;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        const { error } = await supabase.from('leads').insert(batch as any);
        if (error) throw error;
      }

      toast.success(`${leads.length} leads imported successfully!`);
      setStep('done');
      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (step === 'upload' || step === 'done') {
    return (
      <div className="text-center py-8">
        {step === 'done' && (
          <div className="mb-4 flex items-center justify-center gap-2 text-success text-xs font-medium">
            <Check size={14} /> Import complete!
          </div>
        )}
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet size={24} className="text-accent" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">Upload a CSV file with lead data</p>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="default" size="sm" className="gap-1.5" asChild>
            <span><Upload size={13} /> {step === 'done' ? 'Import More' : 'Choose CSV File'}</span>
          </Button>
        </label>
      </div>
    );
  }

  if (step === 'map') {
    return (
      <div className="space-y-4">
        <h4 className="font-display font-semibold text-xs">Map Columns</h4>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-32 truncate">{h}</span>
              <span className="text-muted-foreground text-xs">→</span>
              <Select value={mapping[i] || 'skip'} onValueChange={v => setMapping(m => ({ ...m, [i]: v }))}>
                <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_FIELDS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => setStep('preview')} className="text-xs">Preview Import</Button>
      </div>
    );
  }

  // Preview
  return (
    <div className="space-y-4">
      <h4 className="font-display font-semibold text-xs">Preview ({rows.length} rows)</h4>
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary">
              {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([idx, field]) => (
                <th key={idx} className="px-3 py-2 text-left font-medium text-muted-foreground capitalize">{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, ri) => (
              <tr key={ri} className="border-t border-border">
                {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([idx]) => (
                  <td key={idx} className="px-3 py-2 text-foreground">{row[Number(idx)]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && <p className="text-[10px] text-muted-foreground">...and {rows.length - 5} more rows</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setStep('map')} className="text-xs">Back</Button>
        <Button size="sm" onClick={handleImport} disabled={importing} className="text-xs">
          {importing ? 'Importing...' : `Import ${rows.length} Leads`}
        </Button>
      </div>
    </div>
  );
};

export default CsvImport;
