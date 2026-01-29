import { Contact } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Calendar, Building2, User, Briefcase, Star, MoreHorizontal, Pencil, Trash2, Compass } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type ContactType = Database['public']['Enums']['contact_type'];
type WarmthLevel = Database['public']['Enums']['warmth_level'];

interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
}

const typeIcons: Record<ContactType, React.ElementType> = {
  investor: Star,
  owner: Building2,
  intermediary: Briefcase,
  advisor: User,
  river_guide: Compass,
};

const typeLabels: Record<ContactType, string> = {
  investor: 'Investor',
  owner: 'Company Owner',
  intermediary: 'Intermediary',
  advisor: 'Advisor',
  river_guide: 'River Guide',
};

const warmthColors: Record<WarmthLevel, string> = {
  cold: 'bg-stage-cold',
  warm: 'bg-stage-warm',
  hot: 'bg-stage-hot',
};

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const TypeIcon = typeIcons[contact.contact_type];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-card-hover transition-all duration-200 group animate-fade-in shadow-card">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
            {getInitials(contact.name)}
          </div>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card',
              warmthColors[contact.warmth || 'cold']
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
              <p className="text-sm text-muted-foreground">{contact.role || 'No role'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                <TypeIcon className="w-3 h-3" />
                {typeLabels[contact.contact_type]}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {contact.organization && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{contact.organization}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.geography && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{contact.geography}</span>
              </div>
            )}
          </div>

          {contact.tags && contact.tags.length > 0 && (
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

          {contact.last_interaction_at && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Last contact:{' '}
                {new Date(contact.last_interaction_at).toLocaleDateString('en-US', {
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
