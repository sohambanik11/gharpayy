import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConversationThreads } from '@/hooks/useConversationThreads';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Bot, User, Loader2, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationChatProps {
  leadId: string;
  leadName?: string;
  leadPhone?: string;
}

const ConversationChat = ({ leadId, leadName, leadPhone }: ConversationChatProps) => {
  const { user } = useAuth();
  const { data: threads, isLoading, refetch } = useConversationThreads(leadId);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'internal' | 'whatsapp' | 'sms' | 'email'>('internal');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [threads]);

  useEffect(() => {
    const sub = supabase
      .channel(`conversations-lead-${leadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `lead_id=eq.${leadId}` }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [leadId, refetch]);

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const text = message.trim();
    setMessage('');
    try {
      const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single();
      const { error } = await supabase.from('conversations').insert({
        lead_id: leadId,
        message: text,
        direction: 'outbound',
        channel,
        agent_id: agent?.id || null,
        is_read: true,
        read_at: new Date().toISOString(),
      });
      if (error) throw error;
      await supabase.from('leads').update({ last_activity_at: new Date().toISOString() }).eq('id', leadId);
      if (channel === 'whatsapp' && leadPhone) {
        window.open(`https://wa.me/${leadPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (err: any) { toast.error(err.message); setMessage(text); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-xs font-semibold text-foreground">{leadName || 'Conversation'}</h3>
          {leadPhone && <p className="text-[10px] text-muted-foreground">{leadPhone}</p>}
        </div>
        <div className="flex items-center gap-1">
          {(['internal', 'whatsapp', 'sms', 'email'] as const).map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${channel === ch ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {ch === 'whatsapp' ? 'WA' : ch === 'internal' ? 'Note' : ch.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : !threads || threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center"><MessageSquare size={20} className="text-muted-foreground" /></div>
            <p className="text-xs font-medium text-foreground">No messages yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {threads.map((msg: any) => {
              const isOutbound = msg.direction === 'outbound';
              const isNote = msg.channel === 'internal';
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] space-y-1 flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1.5 ${isOutbound ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOutbound ? 'bg-accent/20' : 'bg-secondary'}`}>
                        {isOutbound ? <User size={10} className="text-accent" /> : <Bot size={10} className="text-muted-foreground" />}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{isOutbound ? (msg.agents?.name || 'You') : leadName}</span>
                      <span className="text-[9px] text-muted-foreground/50">{format(new Date(msg.created_at), 'h:mm a')}</span>
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${isNote ? 'bg-warning/10 border border-warning/20 italic' : isOutbound ? 'bg-accent text-accent-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                      {isNote && <span className="text-[9px] font-semibold mr-1">NOTE:</span>}
                      {msg.message}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border">
        {channel === 'whatsapp' && <p className="text-[10px] text-green-500 mb-2">Will open WhatsApp with pre-filled message</p>}
        <div className="flex gap-2">
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={channel === 'internal' ? 'Add internal note...' : `Send via ${channel}...`}
            className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
            disabled={sending} />
          <button onClick={sendMessage} disabled={!message.trim() || sending}
            className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-40">
            {sending ? <Loader2 size={13} className="animate-spin text-accent-foreground" /> : <Send size={13} className="text-accent-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationChat;
