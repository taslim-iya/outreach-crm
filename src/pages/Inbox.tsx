import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useEmails, useMarkEmailAsRead, Email } from '@/hooks/useEmails';
import { useSendEmail } from '@/hooks/useSendEmail';
import { useSyncIntegration } from '@/hooks/useSyncIntegration';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Search,
  Star,
  Reply,
  Forward,
  Archive,
  Send,
  RefreshCw,
  Inbox as InboxIcon,
  Clock,
  MailOpen,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AIMessageGenerator } from '@/components/ai/AIMessageGenerator';
import { AIFollowupIntelligence } from '@/components/ai/AIFollowupIntelligence';
import { AIMeetingScheduler } from '@/components/ai/AIMeetingScheduler';

type FilterTab = 'all' | 'unread' | 'sent' | 'starred';

// Deterministic color for avatar based on email string
const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(email: Email): string {
  if (email.direction === 'outbound') {
    const to = email.to_emails?.[0] || 'U';
    return to.charAt(0).toUpperCase();
  }
  const name = email.from_name || email.from_email || 'U';
  const parts = name.split(/[\s@.]+/);
  if (parts.length >= 2 && email.from_name) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function getSenderDisplay(email: Email): string {
  if (email.direction === 'outbound') {
    const to = email.to_emails?.[0] || 'Unknown';
    return `To: ${to}`;
  }
  return email.from_name || email.from_email?.split('@')[0] || 'Unknown';
}

function formatEmailTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return mins <= 1 ? 'Just now' : `${mins}m ago`;
  }
  if (diffHours < 24 && isToday(date)) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (isYesterday(date)) return 'Yesterday';
  if (isThisYear(date)) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}

function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE, MMMM d, yyyy \'at\' h:mm a');
}

export default function Inbox() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('inbox-starred');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [replyText, setReplyText] = useState('');
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const { user } = useAuth();
  const { data: emails, isLoading } = useEmails(200);
  const { syncEmails, isSyncing } = useSyncIntegration();
  const markAsRead = useMarkEmailAsRead();
  const sendEmail = useSendEmail();

  // Persist starred
  useEffect(() => {
    localStorage.setItem('inbox-starred', JSON.stringify([...starredIds]));
  }, [starredIds]);

  const toggleStar = useCallback((emailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  }, []);

  // Filter logic
  const filteredEmails = useMemo(() => {
    let list = emails || [];

    // Tab filters
    switch (activeTab) {
      case 'unread':
        list = list.filter(e => !e.is_read && e.direction !== 'outbound');
        break;
      case 'sent':
        list = list.filter(e => e.direction === 'outbound');
        break;
      case 'starred':
        list = list.filter(e => starredIds.has(e.id));
        break;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from_email || '').toLowerCase().includes(q) ||
        (e.from_name || '').toLowerCase().includes(q) ||
        (e.body_preview || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [emails, activeTab, searchQuery, starredIds]);

  // Counts for tab badges
  const counts = useMemo(() => {
    const all = emails || [];
    return {
      all: all.length,
      unread: all.filter(e => !e.is_read && e.direction !== 'outbound').length,
      sent: all.filter(e => e.direction === 'outbound').length,
      starred: all.filter(e => starredIds.has(e.id)).length,
    };
  }, [emails, starredIds]);

  const selectedEmail = useMemo(
    () => filteredEmails.find(e => e.id === selectedEmailId) || null,
    [filteredEmails, selectedEmailId]
  );

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmailId(email.id);
    setShowReplyComposer(false);
    setReplyText('');
    if (!email.is_read && email.direction !== 'outbound') {
      markAsRead.mutate(email.id);
    }
  }, [markAsRead]);

  const handleSendReply = useCallback(async () => {
    if (!selectedEmail || !replyText.trim()) return;
    const toAddress = selectedEmail.direction === 'outbound'
      ? selectedEmail.to_emails?.[0]
      : selectedEmail.from_email;

    if (!toAddress) {
      toast.error('No recipient address found');
      return;
    }

    try {
      await sendEmail.mutateAsync({
        to: toAddress,
        subject: `Re: ${selectedEmail.subject || '(no subject)'}`,
        body: replyText,
      });
      setReplyText('');
      setShowReplyComposer(false);
      toast.success('Reply sent successfully');
    } catch {
      // Error toast is handled by the hook
    }
  }, [selectedEmail, replyText, sendEmail]);

  const handleSync = useCallback(() => {
    syncEmails();
  }, [syncEmails]);

  // --- Filter sidebar tabs ---
  const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: 'All', icon: <InboxIcon className="w-4 h-4" />, count: counts.all },
    { key: 'unread', label: 'Unread', icon: <Mail className="w-4 h-4" />, count: counts.unread },
    { key: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" />, count: counts.sent },
    { key: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" />, count: counts.starred },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="animate-fade-in h-[calc(100vh-4rem)] flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* ============ LEFT SIDEBAR - Filter Tabs ============ */}
          <ResizablePanel defaultSize={14} minSize={10} maxSize={20}>
            <div className="h-full flex flex-col bg-muted/30 border-r border-border">
              {/* Sync button */}
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                  <span className="truncate">{isSyncing ? 'Syncing...' : 'Sync Mail'}</span>
                </Button>
              </div>

              <Separator />

              {/* Filter tabs */}
              <nav className="flex-1 p-2 space-y-1">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      activeTab === tab.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {tab.icon}
                    <span className="flex-1 text-left truncate">{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge
                        variant={activeTab === tab.key ? 'default' : 'secondary'}
                        className="h-5 min-w-[20px] px-1.5 text-xs"
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* ============ MIDDLE PANEL - Email List ============ */}
          <ResizablePanel defaultSize={32} minSize={24} maxSize={45}>
            <div className="h-full flex flex-col bg-card">
              {/* Search bar */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Email list */}
              <ScrollArea className="flex-1">
                {isLoading ? (
                  // Skeleton loaders
                  <div className="divide-y divide-border/50">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="px-4 py-3 flex items-start gap-3">
                        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-12 ml-auto" />
                          </div>
                          <Skeleton className="h-3.5 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      {activeTab === 'starred' ? (
                        <Star className="w-8 h-8 text-muted-foreground/50" />
                      ) : activeTab === 'unread' ? (
                        <MailOpen className="w-8 h-8 text-muted-foreground/50" />
                      ) : (
                        <InboxIcon className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      {searchQuery
                        ? 'No results found'
                        : activeTab === 'starred'
                        ? 'No starred emails'
                        : activeTab === 'unread'
                        ? 'All caught up!'
                        : 'No emails yet'}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : activeTab === 'starred'
                        ? 'Star emails to find them quickly later'
                        : activeTab === 'unread'
                        ? 'You have no unread messages'
                        : 'Sync your email account or compose a new message'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredEmails.map(email => {
                      const isSelected = selectedEmailId === email.id;
                      const isUnread = !email.is_read && email.direction !== 'outbound';
                      const isStarred = starredIds.has(email.id);
                      const senderStr = email.from_email || email.from_name || '';
                      const avatarColor = getAvatarColor(senderStr);

                      return (
                        <button
                          key={email.id}
                          onClick={() => handleSelectEmail(email)}
                          className={cn(
                            'w-full text-left px-4 py-3 flex items-start gap-3 transition-all group',
                            isSelected
                              ? 'bg-primary/[0.08] border-l-2 border-l-primary'
                              : 'border-l-2 border-l-transparent hover:bg-accent/40',
                            isUnread && !isSelected && 'bg-background'
                          )}
                        >
                          {/* Unread indicator dot */}
                          <div className="w-2 flex items-center pt-4">
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>

                          {/* Avatar */}
                          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                            <AvatarFallback
                              className={cn(
                                'text-xs font-semibold text-white',
                                avatarColor
                              )}
                            >
                              {getInitials(email)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-sm truncate flex-1',
                                  isUnread ? 'font-semibold text-foreground' : 'text-foreground'
                                )}
                              >
                                {getSenderDisplay(email)}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {email.direction === 'outbound' && email.open_count > 0 && (
                                  <Eye className="w-3 h-3 text-green-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {email.received_at && formatEmailTimestamp(email.received_at)}
                                </span>
                              </div>
                            </div>
                            <p
                              className={cn(
                                'text-sm truncate mt-0.5',
                                isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {email.subject || '(no subject)'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                              {email.body_preview || ''}
                            </p>
                          </div>

                          {/* Star button */}
                          <button
                            onClick={e => toggleStar(email.id, e)}
                            className={cn(
                              'shrink-0 mt-1 p-0.5 rounded transition-opacity',
                              isStarred
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            )}
                          >
                            <Star
                              className={cn(
                                'w-3.5 h-3.5 transition-colors',
                                isStarred
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground hover:text-amber-400'
                              )}
                            />
                          </button>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Count footer */}
              {!isLoading && filteredEmails.length > 0 && (
                <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
                  {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* ============ RIGHT PANEL - Email Detail ============ */}
          <ResizablePanel defaultSize={54} minSize={35}>
            <div className="h-full flex flex-col bg-background">
              {selectedEmail ? (
                <>
                  {/* Detail header with actions */}
                  <div className="px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8"
                        onClick={() => setSelectedEmailId(null)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <h2 className="text-lg font-semibold flex-1 truncate">
                        {selectedEmail.subject || '(no subject)'}
                      </h2>
                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleStar(selectedEmail.id)}
                            >
                              <Star
                                className={cn(
                                  'w-4 h-4',
                                  starredIds.has(selectedEmail.id)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {starredIds.has(selectedEmail.id) ? 'Unstar' : 'Star'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Archive className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Archive</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Forward className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Forward</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setShowReplyComposer(true)}
                            >
                              <Reply className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reply</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Sender info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback
                          className={cn(
                            'text-sm font-semibold text-white',
                            getAvatarColor(selectedEmail.from_email || selectedEmail.from_name || '')
                          )}
                        >
                          {getInitials(selectedEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {selectedEmail.from_name || selectedEmail.from_email || 'Unknown'}
                          </span>
                          {selectedEmail.direction === 'outbound' && selectedEmail.open_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded">
                              <Eye className="w-3 h-3" />
                              Opened {selectedEmail.open_count}x
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {selectedEmail.direction === 'outbound' ? (
                            <span>to {selectedEmail.to_emails?.join(', ')}</span>
                          ) : (
                            <>
                              {selectedEmail.from_email && selectedEmail.from_name && (
                                <span>&lt;{selectedEmail.from_email}&gt;</span>
                              )}
                              {selectedEmail.to_emails && selectedEmail.to_emails.length > 0 && (
                                <span className="ml-1">to {selectedEmail.to_emails.join(', ')}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>
                          {selectedEmail.received_at && formatFullDate(selectedEmail.received_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email body */}
                  <ScrollArea className="flex-1">
                    <div className="px-6 py-5">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
                          [&_img]:max-w-full [&_a]:text-primary [&_a]:underline
                          [&_table]:border-collapse [&_td]:p-1 [&_th]:p-1"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedEmail.body_html ||
                            selectedEmail.body_preview?.replace(/\n/g, '<br>') ||
                            '<p class="text-muted-foreground italic">No content available</p>',
                        }}
                      />
                      {selectedEmail.direction !== 'outbound' && (
                        <div className="mt-4 pt-4 border-t">
                          <AIFollowupIntelligence
                            emailBody={selectedEmail.body_preview || selectedEmail.body_html || ''}
                            emailSubject={selectedEmail.subject || undefined}
                            contactName={selectedEmail.from_name || undefined}
                            onActionTaken={(action) => {
                              toast.success(`Action noted: ${action}`);
                            }}
                          />
                          <div className="mt-3">
                            <AIMeetingScheduler
                              emailBody={selectedEmail.body_preview || selectedEmail.body_html || ''}
                              contactName={selectedEmail.from_name || selectedEmail.from_email || 'Unknown'}
                              contactEmail={selectedEmail.from_email || undefined}
                              contactId={selectedEmail.contact_id || undefined}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Reply composer */}
                  <div className="border-t border-border shrink-0">
                    {showReplyComposer ? (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Reply className="w-4 h-4" />
                          <span>
                            Replying to{' '}
                            <span className="font-medium text-foreground">
                              {selectedEmail.direction === 'outbound'
                                ? selectedEmail.to_emails?.[0]
                                : selectedEmail.from_email}
                            </span>
                          </span>
                        </div>
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          className="min-h-[100px] resize-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <AIMessageGenerator
                            onInsert={(text) => setReplyText(text)}
                            contactName={selectedEmail?.from_name || undefined}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowReplyComposer(false);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || sendEmail.isPending}
                            className="gap-2"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sendEmail.isPending ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <button
                          onClick={() => setShowReplyComposer(true)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border
                            text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20
                            transition-colors cursor-text bg-muted/30"
                        >
                          <Reply className="w-4 h-4 shrink-0" />
                          Click here to reply...
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // No email selected - empty state
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                      <Mail className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-1">
                      Select an email to read
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                      Choose a conversation from the list to view its contents and reply
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
