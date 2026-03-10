import { ReactNode, useState } from 'react';
import AppSidebar from './AppSidebar';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';
import QuickAddLead from './QuickAddLead';
import { Menu, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const AppLayout = ({ children, title, subtitle, actions }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[232px]">
        {/* Top bar — clean, minimal */}
        <header className="sticky top-0 z-30 bg-background/80 glass border-b border-border px-6 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm text-foreground truncate tracking-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-muted-foreground truncate -mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <NotificationBell />
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[12px] text-muted-foreground bg-secondary/80 rounded-lg hover:bg-secondary transition-colors border border-border/50"
            >
              <Search size={13} />
              <span>Search</span>
              <kbd className="ml-1.5 px-1.5 py-0.5 bg-background rounded text-[10px] font-mono border border-border">⌘K</kbd>
            </button>
            <button onClick={() => setCmdOpen(true)} className="md:hidden p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
              <Search size={15} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Content — 32px page margin */}
        <motion.main
          className="p-6 md:p-8"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        >
          {children}
        </motion.main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <QuickAddLead />
    </div>
  );
};

export default AppLayout;
