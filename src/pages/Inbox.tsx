import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  Eye,
  Search,
  Star,
  Archive,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';

type InboxTab = 'all' | 'inbox' | 'sent';

export default function Inbox() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const { data: emails, isLoading } = useEmails(200);
  const { syncEmails, isSyncing } = useSyncIntegration();
  const markAsRead = useMarkEmailAsRead();

  const filteredEmails = useMemo(() => {
    let list = emails || [];
    if (activeTab === 'inbox') list = list.filter(e => e.direction !== 'outbound');
    if (activeTab === 'sent') list = list.filter(e => e.direction === 'outbound');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from_name || '').toLowerCase().includes(q) ||
        (e.from_email || '').toLowerCase().includes(q) ||
        (e.body_preview || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, activeTab, searchQuery]);

  const unreadCount = useMemo(
    () => (emails || []).filter(e => !e.is_read && e.direction !== 'outbound').length,
    [emails]
  );

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) markAsRead.mutate(email.id);
  };

  const formatEmailDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    if (isThisYear(date)) return format(date, 'MMM d');
    return format(date, 'MMM d, yyyy');
  };

  const getSender = (email: Email) => {
    if (email.direction === 'outbound') {
      const to = email.to_emails?.[0] || 'Unknown';
      // Show just the name portion or email
      return `To: ${to}`;
    }
    return email.from_name || email.from_email?.split('@')[0] || 'Unknown';
  };

  const getSenderInitial = (email: Email) => {
    if (email.direction === 'outbound') {
      const to = email.to_emails?.[0] || 'U';
      return to.charAt(0).toUpperCase();
    }
    const name = email.from_name || email.from_email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)] flex flex-col">
      {/* Gmail-style top bar */}
      <div className="px-4 py-2 flex items-center gap-3 border-b border-border">
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncEmails()}
            disabled={isSyncing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')} />
            Sync
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Email List Panel */}
        <div
          className={cn(
            'w-full md:w-[420px] lg:w-[480px] border-r border-border flex flex-col bg-card',
            selectedEmail && 'hidden md:flex'
          )}
        >
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {(['all', 'inbox', 'sent'] as InboxTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative',
                  activeTab === tab
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'all' ? 'All Mail' : tab === 'inbox' ? `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'Sent'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : !filteredEmails.length ? (
              <div className="p-8 text-center text-muted-foreground">
                <InboxIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">
                  {searchQuery ? 'No results found' : 'No emails yet'}
                </p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search' : 'Sync from Gmail or compose a new email'}
                </p>
              </div>
            ) : (
              <div>
                {filteredEmails.map((email) => {
                  const isSelected = selectedEmail?.id === email.id;
                  const isUnread = !email.is_read && email.direction !== 'outbound';
                  return (
                    <button
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-b border-border/50',
                        isSelected ? 'bg-primary/[0.06]' : 'hover:bg-accent/40',
                        isUnread && !isSelected && 'bg-card'
                      )}
                    >
                      {/* Avatar circle */}
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5',
                        email.direction === 'outbound'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent text-accent-foreground'
                      )}>
                        {getSenderInitial(email)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm truncate flex-1',
                            isUnread ? 'font-semibold text-foreground' : 'text-foreground'
                          )}>
                            {getSender(email)}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            {email.direction === 'outbound' && email.open_count > 0 && (
                              <Eye className="w-3 h-3 text-success" />
                            )}
                            {email.received_at && formatEmailDate(email.received_at)}
                          </span>
                        </div>
                        <p className={cn(
                          'text-sm truncate',
                          isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}>
                          {email.subject || '(no subject)'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                          {email.body_preview || ''}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Detail Panel */}
        <div className={cn('flex-1 flex flex-col bg-background', !selectedEmail && 'hidden md:flex')}>
          {selectedEmail ? (
            <>
              {/* Detail header */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-semibold flex-1 truncate">
                    {selectedEmail.subject || '(no subject)'}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                    selectedEmail.direction === 'outbound'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent text-accent-foreground'
                  )}>
                    {getSenderInitial(selectedEmail)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {selectedEmail.direction === 'outbound'
                          ? selectedEmail.from_name || selectedEmail.from_email
                          : selectedEmail.from_name || selectedEmail.from_email}
                      </span>
                      {selectedEmail.direction === 'outbound' && selectedEmail.open_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                          <Eye className="w-3 h-3" />
                          Opened {selectedEmail.open_count}×
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedEmail.direction === 'outbound'
                        ? `to ${selectedEmail.to_emails?.join(', ')}`
                        : selectedEmail.from_email && selectedEmail.from_name
                          ? `<${selectedEmail.from_email}>`
                          : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {selectedEmail.received_at &&
                      format(new Date(selectedEmail.received_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>

              {/* Email body */}
              <ScrollArea className="flex-1 p-6">
                <div
                  className="prose prose-sm max-w-none text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: selectedEmail.body_preview || '',
                  }}
                />
              </ScrollArea>

              {/* Reply bar */}
              {selectedEmail.direction !== 'outbound' && selectedEmail.from_email && (
                <div className="px-6 py-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setComposeOpen(true)}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select an email to read</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeEmailModal open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
