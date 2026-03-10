import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Kanban, CalendarCheck, BarChart3, Settings,
  MessageSquare, History, X, Moon, Sun, Building2, Bed, TrendingUp,
  Map, Sparkles, Receipt, Globe, UserCircle, Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRBAC } from '@/contexts/RBACContext';
import { useAuth } from '@/contexts/AuthContext';

const salesItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/visits', icon: CalendarCheck, label: 'Visits' },
  { to: '/conversations', icon: MessageSquare, label: 'Messages' },
  { to: '/bookings', icon: Receipt, label: 'Bookings' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/historical', icon: History, label: 'Historical' },
];

const supplyItems = [
  { to: '/owners', icon: Building2, label: 'Owners' },
  { to: '/inventory', icon: Bed, label: 'Inventory' },
  { to: '/availability', icon: Map, label: 'Availability' },
  { to: '/effort', icon: TrendingUp, label: 'Effort' },
  { to: '/matching', icon: Sparkles, label: 'Matching' },
  { to: '/zones', icon: Globe, label: 'Zones' },
];

const portalItems = [
  { to: '/owner-portal', icon: UserCircle, label: 'Owner Portal' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  manager: 'bg-purple-500/20 text-purple-400',
  agent: 'bg-blue-500/20 text-blue-400',
  owner: 'bg-green-500/20 text-green-400',
};

const AppSidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const location = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const { roles, isAdmin, isManager } = useRBAC();
  const { user } = useAuth();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  const primaryRole = roles[0];
  const initials = user?.email?.charAt(0).toUpperCase() || 'U';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const renderGroup = (label: string, items: typeof salesItems) => (
    <>
      <p className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--sidebar-fg))' }}>{label}</p>
      {items.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink key={item.to} to={item.to} onClick={onClose} className={`sidebar-link ${isActive ? 'active' : ''}`}>
            <item.icon size={15} strokeWidth={isActive ? 2 : 1.6} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-foreground/20 glass lg:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[232px] flex flex-col border-r transition-transform duration-200 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'hsl(var(--sidebar-bg))', borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xs">G</span>
            </div>
            <div>
              <h1 className="font-semibold text-[13px] tracking-tight" style={{ color: 'hsl(var(--sidebar-active-fg))' }}>Gharpayy</h1>
              <p className="text-[9px] -mt-0.5" style={{ color: 'hsl(var(--sidebar-fg))' }}>Booking OS v2</p>
            </div>
          </div>
          <button className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors" onClick={onClose}>
            <X size={16} style={{ color: 'hsl(var(--sidebar-fg))' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
          {renderGroup('Demand', salesItems)}
          {(isAdmin || isManager) && renderGroup('Supply', supplyItems)}
          {renderGroup('Portals', portalItems)}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t space-y-0.5" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <button onClick={() => setDark(!dark)} className="sidebar-link w-full">
            {dark ? <Sun size={15} strokeWidth={1.6} /> : <Moon size={15} strokeWidth={1.6} />}
            <span>{dark ? 'Light' : 'Dark'}</span>
          </button>
          <NavLink to="/settings" onClick={onClose} className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={15} strokeWidth={1.6} />
            <span>Settings</span>
          </NavLink>

          <div className="mt-2 mx-0.5 p-2.5 rounded-lg" style={{ background: 'hsl(var(--sidebar-hover))' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-accent">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate" style={{ color: 'hsl(var(--sidebar-active-fg))' }}>{displayName}</p>
                <p className="text-[9px] truncate" style={{ color: 'hsl(var(--sidebar-fg))' }}>{user?.email}</p>
              </div>
            </div>
            {primaryRole && (
              <div className="mt-2 flex items-center gap-1.5">
                <Shield size={9} className="shrink-0" style={{ color: 'hsl(var(--sidebar-fg))' }} />
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium capitalize ${ROLE_COLORS[primaryRole] || 'bg-secondary text-muted-foreground'}`}>
                  {primaryRole}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
