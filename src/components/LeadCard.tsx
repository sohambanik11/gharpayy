import { Lead, PIPELINE_STAGES, SOURCE_LABELS } from '@/types/crm';
import { Phone, Clock, MapPin, IndianRupee, PhoneCall, MessageCircle, AlertCircle } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  compact?: boolean;
  stale?: boolean;
}

const sourceColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  website: 'bg-info/10 text-info',
  instagram: 'bg-pink-500/10 text-pink-600',
  facebook: 'bg-indigo-500/10 text-indigo-600',
  phone: 'bg-warning/10 text-warning',
  landing_page: 'bg-purple-500/10 text-purple-600',
};

const LeadCard = ({ lead, compact, stale }: LeadCardProps) => {
  return (
    <div className="pipeline-card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {stale && (
            <span className="flex items-center gap-0.5 text-[9px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
              <AlertCircle size={8} /> Stale
            </span>
          )}
          <div>
            <p className="font-medium text-xs text-foreground">{lead.name}</p>
            <p className="text-2xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {lead.phone}
            </p>
          </div>
        </div>
        <span className={`badge-pipeline text-[10px] ${sourceColors[lead.source] || 'bg-secondary text-secondary-foreground'}`}>
          {SOURCE_LABELS[lead.source]}
        </span>
      </div>

      {!compact && (
        <div className="space-y-1.5 mt-3">
          {lead.preferredLocation && (
            <p className="text-2xs text-muted-foreground flex items-center gap-1.5">
              <MapPin size={10} /> {lead.preferredLocation}
            </p>
          )}
          {lead.budget && (
            <p className="text-2xs text-muted-foreground flex items-center gap-1.5">
              <IndianRupee size={10} /> {lead.budget}
            </p>
          )}
          {lead.firstResponseTime !== undefined && (
            <p className="text-2xs flex items-center gap-1.5">
              <Clock size={10} className={lead.firstResponseTime <= 5 ? 'text-success' : 'text-destructive'} />
              <span className={lead.firstResponseTime <= 5 ? 'text-success' : 'text-destructive'}>
                {lead.firstResponseTime} min response
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-[9px] font-bold text-accent">{lead.assignedAgent.charAt(0)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{lead.assignedAgent.split(' ')[0]}</span>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <PhoneCall size={11} className="text-muted-foreground" />
          </a>
          <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <MessageCircle size={11} className="text-success" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
