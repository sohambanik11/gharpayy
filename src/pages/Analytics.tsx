import AppLayout from '@/components/AppLayout';
import { useAgentStats, useLeads, useVisits } from '@/hooks/useCrmData';
import { PIPELINE_STAGES, SOURCE_LABELS } from '@/types/crm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Trophy, TrendingDown } from 'lucide-react';

const Analytics = () => {
  const { data: agentStats, isLoading: agentsLoading } = useAgentStats();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: visits } = useVisits();

  if (agentsLoading || leadsLoading) {
    return (
      <AppLayout title="Analytics" subtitle="Performance metrics and insights">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[300px] rounded-2xl" />)}
        </div>
      </AppLayout>
    );
  }

  // 1. Conversion Funnel
  const funnelData = PIPELINE_STAGES.filter(s => s.key !== 'lost').map((stage, i, arr) => {
    const count = leads?.filter(l => l.status === stage.key).length || 0;
    const prevCount = i > 0 ? (leads?.filter(l => l.status === arr[i - 1].key).length || 0) : count;
    const dropOff = i > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
    return { name: stage.label, count, dropOff };
  });

  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  // 2. Source ROI
  const sourceROI = Object.entries(SOURCE_LABELS).map(([key, label]) => {
    const srcLeads = leads?.filter(l => l.source === key) || [];
    return {
      source: label,
      leads: srcLeads.length,
      bookings: srcLeads.filter(l => l.status === 'booked').length,
    };
  }).filter(s => s.leads > 0);

  // 3. Agent Leaderboard
  const leaderboard = [...(agentStats || [])].sort((a, b) => {
    const rateA = a.totalLeads ? a.conversions / a.totalLeads : 0;
    const rateB = b.totalLeads ? b.conversions / b.totalLeads : 0;
    return rateB - rateA;
  });

  // 4. Weekly Trends
  const weekMap: Record<string, { leads: number; bookings: number }> = {};
  (leads || []).forEach(l => {
    const d = new Date(l.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weekMap[key]) weekMap[key] = { leads: 0, bookings: 0 };
    weekMap[key].leads++;
    if (l.status === 'booked') weekMap[key].bookings++;
  });
  const weeklyTrends = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...data,
    }));

  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.32, 0.72, 0, 1] as const },
  });

  const chartTooltipStyle = {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    fontSize: '11px',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <AppLayout title="Analytics" subtitle="Performance metrics and insights">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Conversion Funnel */}
        <motion.div className="kpi-card" {...anim(0)}>
          <h3 className="font-display font-semibold text-xs text-foreground mb-5">Conversion Funnel</h3>
          <div className="space-y-2.5">
            {funnelData.map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-28 truncate text-right">{stage.name}</span>
                <div className="flex-1 h-7 bg-secondary rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full bg-accent rounded-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                  />
                  <span className="absolute inset-0 flex items-center px-2.5 text-[10px] font-medium text-foreground">
                    {stage.count}
                  </span>
                </div>
                {stage.dropOff > 0 && (
                  <span className="text-[9px] text-destructive flex items-center gap-0.5 w-12 shrink-0">
                    <TrendingDown size={9} /> {stage.dropOff}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Source ROI */}
        <motion.div className="kpi-card" {...anim(0.1)}>
          <h3 className="font-display font-semibold text-xs text-foreground mb-5">Lead Source ROI</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sourceROI}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="source" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="leads" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} name="Total Leads" />
              <Bar dataKey="bookings" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Leaderboard */}
        <motion.div className="kpi-card" {...anim(0.15)}>
          <h3 className="font-display font-semibold text-xs text-foreground mb-5 flex items-center gap-2">
            <Trophy size={14} className="text-accent" /> Agent Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.map((agent, i) => {
              const rate = agent.totalLeads ? Math.round((agent.conversions / agent.totalLeads) * 100) : 0;
              return (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{agent.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{agent.activeLeads} active</span>
                      <span className="text-[10px] text-muted-foreground">{agent.avgResponseTime}m avg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-bold text-foreground">{rate}%</p>
                    <p className="text-[9px] text-muted-foreground">{agent.conversions}/{agent.totalLeads}</p>
                  </div>
                </div>
              );
            })}
            {leaderboard.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No agent data</p>}
          </div>
        </motion.div>

        {/* Weekly Trends */}
        <motion.div className="kpi-card" {...anim(0.2)}>
          <h3 className="font-display font-semibold text-xs text-foreground mb-5">Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
              <Line type="monotone" dataKey="bookings" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
