import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAgents, useLeads } from '@/hooks/useCrmData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarCheck, MapPin, User, Phone, Video, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleVisitDialogProps {
  open: boolean;
  onClose: () => void;
  prefilledLeadId?: string;
  prefilledPropertyId?: string;
  prefilledPhone?: string;
  prefilledName?: string;
}

const ScheduleVisitDialog = ({
  open,
  onClose,
  prefilledLeadId,
  prefilledPropertyId,
  prefilledPhone,
  prefilledName,
}: ScheduleVisitDialogProps) => {
  const { data: agents } = useAgents();
  const { data: leads } = useLeads();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    lead_id: prefilledLeadId || '',
    property_id: prefilledPropertyId || '',
    scheduled_at: '',
    scheduled_time: '',
    agent_id: '',
    visit_type: 'in_person' as 'in_person' | 'virtual',
    customer_phone: prefilledPhone || '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.lead_id || !form.scheduled_at || !form.scheduled_time) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);

    try {
      const scheduledAt = new Date(`${form.scheduled_at}T${form.scheduled_time}`).toISOString();

      // 1. Create visit record
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          lead_id: form.lead_id,
          property_id: form.property_id || null,
          scheduled_at: scheduledAt,
          assigned_agent_id: form.agent_id || null,
          visit_type: form.visit_type,
          customer_phone: form.customer_phone || null,
          notes: form.notes || null,
          confirmed: false,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // 2. Update lead status to visit_scheduled
      await supabase
        .from('leads')
        .update({
          status: 'visit_scheduled',
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', form.lead_id);

      // 3. Create notification for assigned agent
      if (form.agent_id) {
        const agent = agents?.find(a => a.id === form.agent_id);
        if (agent?.user_id) {
          await supabase.from('notifications').insert({
            user_id: agent.user_id,
            title: 'Visit Scheduled',
            body: `New visit at ${format(new Date(scheduledAt), 'MMM d, h:mm a')}`,
            type: 'visit',
            action_url: '/visits',
          });
        }
      }

      // 4. Log activity
      await supabase.from('activity_log').insert({
        lead_id: form.lead_id,
        agent_id: form.agent_id || null,
        action: 'visit_scheduled',
        metadata: {
          visit_id: visit.id,
          scheduled_at: scheduledAt,
          visit_type: form.visit_type,
        },
      });

      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['leads'] });

      toast.success('Visit scheduled successfully!');
      onClose();

      // Reset form
      setForm({
        lead_id: prefilledLeadId || '',
        property_id: prefilledPropertyId || '',
        scheduled_at: '',
        scheduled_time: '',
        agent_id: '',
        visit_type: 'in_person',
        customer_phone: prefilledPhone || '',
        notes: '',
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck size={15} className="text-accent" />
            Schedule a Visit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Visit Type */}
          <div className="grid grid-cols-2 gap-2">
            {(['in_person', 'virtual'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => set('visit_type', type)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  form.visit_type === type
                    ? 'border-accent bg-accent/8 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/40'
                }`}
              >
                {type === 'in_person' ? <MapPin size={13} /> : <Video size={13} />}
                {type === 'in_person' ? 'In Person' : 'Virtual Tour'}
              </button>
            ))}
          </div>

          {/* Lead Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Lead *</Label>
            {prefilledLeadId ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 text-xs text-foreground">
                <User size={12} className="text-muted-foreground" />
                {leads?.find(l => l.id === prefilledLeadId)?.name || prefilledName || 'Selected Lead'}
              </div>
            ) : (
              <Select value={form.lead_id} onValueChange={v => set('lead_id', v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads?.filter(l => l.status !== 'booked' && l.status !== 'lost').map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} · {l.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                min={minDate}
                value={form.scheduled_at}
                onChange={e => set('scheduled_at', e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time *</Label>
              <Input
                type="time"
                value={form.scheduled_time}
                onChange={e => set('scheduled_time', e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Agent */}
          <div className="space-y-1.5">
            <Label className="text-xs">Assign Agent</Label>
            <Select value={form.agent_id} onValueChange={v => set('agent_id', v)}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Auto-assign or select..." />
              </SelectTrigger>
              <SelectContent>
                {agents?.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              <Phone size={11} className="inline mr-1" />
              Customer Phone
            </Label>
            <Input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={form.customer_phone}
              onChange={e => set('customer_phone', e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Any special instructions or context..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="min-h-[64px] text-xs rounded-xl resize-none"
            />
          </div>

          <Button
            className="w-full rounded-xl gap-2 text-xs"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CalendarCheck size={13} />}
            {loading ? 'Scheduling...' : 'Schedule Visit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitDialog;
