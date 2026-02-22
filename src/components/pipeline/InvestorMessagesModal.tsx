import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvestorEmails } from '@/hooks/useFollowUpSequences';
import { Mail, Send, Inbox, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface InvestorMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorName: string;
  contactId?: string | null;
  investorDealId?: string;
}

export function InvestorMessagesModal({
  open,
  onOpenChange,
  investorName,
  contactId,
  investorDealId,
}: InvestorMessagesModalProps) {
  const { data: emails = [], isLoading } = useInvestorEmails(investorDealId, contactId || undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Messages — {investorName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send your first email to {investorName} to start tracking communication.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3">
              {emails.map((email: any) => (
                <div key={email.id} className="rounded-lg border border-border p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {email.direction === 'outbound' ? (
                        <Send className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <Badge variant={email.direction === 'outbound' ? 'default' : 'secondary'} className="text-[10px]">
                        {email.direction === 'outbound' ? 'Sent' : 'Received'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {email.send_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(email.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {email.subject || '(No subject)'}
                  </p>
                  {email.body_preview && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.body_preview}</p>
                  )}
                  {email.to_emails && email.to_emails.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                      To: {email.to_emails.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
