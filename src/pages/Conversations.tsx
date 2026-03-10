import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ConversationChat from '@/components/ConversationChat';
import EmptyState from '@/components/EmptyState';
import { useConversationThreads } from '@/hooks/useConversationThreads';
import { MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const Conversations = () => {
  const { data: threads, isLoading } = useConversationThreads();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedThread = threads?.find(t => t.leadId === selectedLeadId);

  const filtered = threads?.filter(t =>
    t.leadName.toLowerCase().includes(search.toLowerCase()) ||
    t.leadPhone.includes(search)
  ) || [];

  if (isLoading) {
    return (
      <AppLayout title="Conversations" subtitle="WhatsApp & messaging hub">
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          <Skeleton className="w-full md:w-[320px] h-full rounded-2xl" />
          <Skeleton className="hidden md:block flex-1 h-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // Mobile: show chat view when a thread is selected
  const showChatMobile = selectedLeadId !== null;

  return (
    <AppLayout title="Conversations" subtitle="WhatsApp & messaging hub">
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        {/* Thread list — hidden on mobile when chat is open */}
        <motion.div
          className={`w-full md:w-[320px] md:shrink-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden ${
            showChatMobile ? 'hidden md:flex' : 'flex'
          }`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <Search size={13} className="text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <EmptyState
                icon={<MessageCircle size={22} className="text-accent" />}
                title="No conversations"
                description="Start a conversation with a lead to see it here"
              />
            )}
            {filtered.map(t => (
              <button
                key={t.leadId}
                onClick={() => setSelectedLeadId(t.leadId)}
                className={`w-full text-left px-4 py-3.5 border-b border-border hover:bg-secondary/50 transition-colors ${
                  selectedLeadId === t.leadId ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{t.leadName}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{t.lastMessage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(t.lastMessageAt), { addSuffix: true })}</p>
                    <Badge variant="outline" className="text-[8px] mt-1">{t.channel}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chat view — full width on mobile when selected */}
        <motion.div
          className={`flex-1 bg-card border border-border rounded-2xl overflow-hidden ${
            showChatMobile ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Mobile back button */}
          {showChatMobile && (
            <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border">
              <button onClick={() => setSelectedLeadId(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <ArrowLeft size={16} className="text-foreground" />
              </button>
              <span className="text-xs font-medium text-foreground">{selectedThread?.leadName}</span>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <ConversationChat leadId={selectedLeadId} leadName={selectedThread?.leadName || ''} leadBudget={selectedThread?.leadBudget} leadLocation={selectedThread?.leadLocation} leadStatus={selectedThread?.leadStatus} />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Conversations;
