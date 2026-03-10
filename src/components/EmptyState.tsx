import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-display font-bold text-sm text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    {action && (
      <Button size="sm" className="mt-4 rounded-xl gap-1.5" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
