import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOURCE_LABELS } from '@/types/crm';

const LeadCapture = () => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'website', budget: '', preferred_location: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setErrorMsg('Name and phone are required');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/receive-lead`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Something went wrong');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle size={28} className="text-success" />
              </motion.div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Thank you!</h2>
              <p className="text-sm text-muted-foreground">We've received your details. Our team will reach out shortly.</p>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0 }}>
              <div className="mb-8 text-center">
                <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Get in Touch</h1>
                <p className="text-sm text-muted-foreground mt-2">Share your details and we'll connect with the perfect property for you.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name *</Label>
                    <Input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone *</Label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-11 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Budget</Label>
                    <Input placeholder="₹ Your range" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preferred Area</Label>
                    <Input placeholder="Locality" value={form.preferred_location} onChange={e => setForm(f => ({ ...f, preferred_location: e.target.value }))} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">How did you hear about us?</Label>
                  <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Any requirements?</Label>
                  <Textarea placeholder="Tell us what you're looking for..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="rounded-xl" />
                </div>

                {status === 'error' && errorMsg && (
                  <p className="text-xs text-destructive bg-destructive/5 rounded-xl p-3">{errorMsg}</p>
                )}

                <Button type="submit" className="w-full h-12 rounded-xl text-sm font-semibold gap-2" disabled={status === 'loading'}>
                  {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <>Submit <ArrowRight size={14} /></>}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LeadCapture;
