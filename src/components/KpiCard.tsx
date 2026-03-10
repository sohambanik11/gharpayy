import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  suffix?: string;
  color?: string;
}

const KpiCard = ({ title, value, change, icon, suffix, color }: KpiCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: color ? `${color}12` : 'hsl(var(--secondary))' }}>
          <div style={{ color: color || 'hsl(var(--accent))' }}>{icon}</div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-2xs font-medium ${isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isPositive ? <ArrowUp size={11} /> : isNegative ? <ArrowDown size={11} /> : null}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-xl font-display font-bold text-foreground tracking-tight">
        {value}{suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
      </div>
      <p className="text-2xs text-muted-foreground mt-1.5">{title}</p>
    </motion.div>
  );
};

export default KpiCard;
