import { useAgents, useLeads, useProperties } from '@/hooks/useCrmData';
import { Users, Building2, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OnboardingCard = () => {
  const { data: agents } = useAgents();
  const { data: leads } = useLeads();
  const { data: properties } = useProperties();
  const navigate = useNavigate();

  const steps = [
    { label: 'Add your first agent', done: (agents?.length || 0) > 0, icon: Users, path: '/settings' },
    { label: 'Add a property', done: (properties?.length || 0) > 0, icon: Building2, path: '/settings' },
    { label: 'Create your first lead', done: (leads?.length || 0) > 0, icon: UserPlus, path: '/leads' },
  ];

  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  const completed = steps.filter(s => s.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="kpi-card mb-6 bg-gradient-to-br from-accent/5 to-accent/[0.02] border-accent/15"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-sm text-foreground">Welcome! Let's set up your CRM</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{completed}/3 steps completed</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <span className="text-sm font-bold text-accent font-display">{completed}/3</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completed / 3) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => !step.done && navigate(step.path)}
            disabled={step.done}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${
              step.done
                ? 'bg-success/5 border border-success/15'
                : 'bg-card border border-border hover:border-accent/30 hover:bg-accent/5 cursor-pointer'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.done ? 'bg-success/10' : 'bg-accent/10'
            }`}>
              {step.done ? (
                <CheckCircle size={15} className="text-success" />
              ) : (
                <step.icon size={15} className="text-accent" />
              )}
            </div>
            <span className={`text-xs font-medium flex-1 text-left ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {step.label}
            </span>
            {!step.done && <ArrowRight size={13} className="text-muted-foreground" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default OnboardingCard;
