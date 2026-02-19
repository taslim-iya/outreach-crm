import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEmails, useMarkEmailAsRead, Email } from '@/hooks/useEmails';
import { useSyncIntegration } from '@/hooks/useSyncIntegration';
import { ComposeEmailModal } from '@/components/email/ComposeEmailModal';
import {
  Plus,
  RefreshCw,
  Mail,
  Send as SendIcon,
  ArrowLeft,
  Inbox as InboxIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Inbox() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { data: emails, isLoading } = useEmails(100);
  const { syncEmails, isSyncing } = useSyncIntegration();
  const markAsRead = useMarkEmailAsRead();

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      markAsRead.mutate(email.id);
    }
  };

  const getDirection = (email: Email): string => {
    // Use the direction column if available via raw data, otherwise infer
    return (email as any).direction || 'inbound';
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title="Inbox"
        description="Send and receive emails"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncEmails()}
              disabled={isSyncing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')} />
              Sync
            </Button>
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Compose
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex border border-border rounded-xl overflow-hidden goldman-card mt-4">
        {/* Email List */}
        <div
          className={cn(
            'w-full md:w-[380px] border-r border-border flex flex-col',
            selectedEmail && 'hidden md:flex'
          )}
        >
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading emails...</div>
            ) : !emails?.length ? (
              <div className="p-8 text-center text-muted-foreground">
                <InboxIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No emails yet</p>
                <p className="text-sm mt-1">Sync from Gmail or compose a new email</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {emails.map((email) => {
                  const dir = getDirection(email);
                  const isSelected = selectedEmail?.id === email.id;
                  return (
                    <button
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-accent/50',
                        isSelected && 'bg-accent',
                        !email.is_read && 'bg-primary/[0.03]'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {dir === 'outbound' ? (
                          <SendIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-sm truncate flex-1',
                            !email.is_read && 'font-semibold'
                          )}
                        >
                          {dir === 'outbound'
                            ? `To: ${email.to_emails?.[0] || 'Unknown'}`
                            : email.from_name || email.from_email || 'Unknown'}
                        </span>
                        {email.received_at && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(new Date(email.received_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-sm truncate',
                          !email.is_read ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {email.subject || '(no subject)'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {email.body_preview || ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Detail */}
        <div
          className={cn(
            'flex-1 flex flex-col',
            !selectedEmail && 'hidden md:flex'
          )}
        >
          {selectedEmail ? (
            <>
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedEmail(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedEmail.subject || '(no subject)'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getDirection(selectedEmail) === 'outbound' ? (
                      <>To: {selectedEmail.to_emails?.join(', ')}</>
                    ) : (
                      <>
                        From: {selectedEmail.from_name || selectedEmail.from_email}
                        {selectedEmail.from_name && (
                          <span className="ml-1 text-xs">
                            &lt;{selectedEmail.from_email}&gt;
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {getDirection(selectedEmail) === 'outbound' ? 'Sent' : 'Received'}
                </Badge>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: selectedEmail.body_preview || '',
                  }}
                />
              </ScrollArea>
              {getDirection(selectedEmail) === 'inbound' && selectedEmail.from_email && (
                <div className="px-6 py-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setComposeOpen(true);
                    }}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeEmailModal open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
