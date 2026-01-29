import { Contact } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Calendar, Building2, User, Briefcase, Star } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

const typeIcons = {
  investor: Star,
  company_owner: Building2,
  intermediary: Briefcase,
  advisor: User,
};

const typeLabels = {
  investor: 'Investor',
  company_owner: 'Company Owner',
  intermediary: 'Intermediary',
  advisor: 'Advisor',
};

const warmthColors = {
  cold: 'bg-stage-cold',
  warm: 'bg-stage-warm',
  hot: 'bg-stage-hot',
};

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const TypeIcon = typeIcons[contact.type];

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all duration-200 cursor-pointer group hover:shadow-glow animate-fade-in"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
            {contact.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card',
              warmthColors[contact.warmth]
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {contact.name}
              </h3>
              <p className="text-sm text-muted-foreground">{contact.role}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              <TypeIcon className="w-3 h-3" />
              {typeLabels[contact.type]}
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{contact.organization}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{contact.emails[0]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{contact.geography}</span>
            </div>
          </div>

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {contact.lastInteraction && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Last contact:{' '}
                {new Date(contact.lastInteraction).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
