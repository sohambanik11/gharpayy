import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CalendarCheck,
  BarChart3,
  MessageSquare,
  History,
  Settings,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useLeads } from '@/hooks/useCrmData';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pages = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Pipeline', path: '/pipeline', icon: Kanban },
  { name: 'Visits', path: '/visits', icon: CalendarCheck },
  { name: 'Conversations', path: '/conversations', icon: MessageSquare },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Historical', path: '/historical', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { data: leads } = useLeads();

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const triggerQuickAdd = () => {
    onOpenChange(false);
    // Dispatch a custom event that QuickAddLead listens to
    window.dispatchEvent(new CustomEvent('open-quick-add'));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search leads, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={triggerQuickAdd}>
            <Plus size={14} className="mr-2 text-accent" />
            Add New Lead
            <span className="ml-auto text-[10px] text-muted-foreground">Quick-add</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/visits')}>
            <CalendarCheck size={14} className="mr-2 text-accent" />
            Schedule Visit
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {pages.map(page => (
            <CommandItem key={page.path} onSelect={() => go(page.path)}>
              <page.icon size={14} className="mr-2 text-muted-foreground" />
              {page.name}
              <ArrowRight size={12} className="ml-auto text-muted-foreground/50" />
            </CommandItem>
          ))}
        </CommandGroup>

        {leads && leads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Leads">
              {leads.slice(0, 6).map(lead => (
                <CommandItem key={lead.id} onSelect={() => go('/leads')}>
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mr-2">
                    <span className="text-[9px] font-bold text-accent">{lead.name.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">{lead.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lead.phone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
