import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const [open, setOpen] = useState(false);

  const unread = notifications?.filter(n => !n.is_read).length || 0;

  const grouped = (() => {
    if (!notifications) return { today: [], yesterday: [], earlier: [] };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    return {
      today: notifications.filter(n => new Date(n.created_at) >= todayStart),
      yesterday: notifications.filter(n => { const d = new Date(n.created_at); return d >= yesterdayStart && d < todayStart; }),
      earlier: notifications.filter(n => new Date(n.created_at) < new Date(todayStart.getTime() - 86400000)),
    };
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl bg-secondary hover:bg-muted transition-colors">
          <Bell size={16} className="text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-display font-semibold text-xs">Notifications</h4>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => markAllRead.mutate()}>
              <Check size={10} className="mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {!notifications?.length && (
          <p className="text-xs text-muted-foreground text-center py-8">No notifications yet</p>
        )}

        {grouped.today.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground px-3 pt-3 pb-1">Today</p>
            {grouped.today.map(n => (
              <NotifItem key={n.id} n={n} onRead={() => markRead.mutate(n.id)} />
            ))}
          </div>
        )}
        {grouped.yesterday.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground px-3 pt-3 pb-1">Yesterday</p>
            {grouped.yesterday.map(n => (
              <NotifItem key={n.id} n={n} onRead={() => markRead.mutate(n.id)} />
            ))}
          </div>
        )}
        {grouped.earlier.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground px-3 pt-3 pb-1">Earlier</p>
            {grouped.earlier.map(n => (
              <NotifItem key={n.id} n={n} onRead={() => markRead.mutate(n.id)} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

function NotifItem({ n, onRead }: { n: any; onRead: () => void }) {
  return (
    <button
      onClick={() => { if (!n.is_read) onRead(); }}
      className={`w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors flex gap-2.5 ${!n.is_read ? 'bg-accent/5' : ''}`}
    >
      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
      <div className={!n.is_read ? '' : 'ml-4'}>
        <p className="text-xs font-medium text-foreground">{n.title}</p>
        {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-[9px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
      </div>
    </button>
  );
}

export default NotificationBell;
