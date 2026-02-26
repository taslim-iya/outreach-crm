import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  is_read: boolean;
  created_at: string;
}

export default function Support() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['support_messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('support-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['support_messages'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('support_messages')
        .insert({ user_id: user.id, message, is_admin_reply: false });
      if (error) throw error;
      // Send email notification (fire-and-forget)
      supabase.functions.invoke('notify-support', {
        body: { message, userEmail: user.email },
      }).catch(console.error);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['support_messages'] });
    },
    onError: (err) => toast.error('Failed to send: ' + err.message),
  });

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 md:p-6 flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <PageHeader
        title="Support"
        description="Send us a message — we'll get back to you as soon as possible"
      />

      <div className="mt-4 mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        <span>You can also reach us at <a href="mailto:taslim@mungerlongview.com" className="text-primary underline underline-offset-2">taslim@mungerlongview.com</a></span>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Start a conversation with our team</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.is_admin_reply ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.is_admin_reply
                      ? 'bg-muted text-foreground rounded-bl-md'
                      : 'bg-primary text-primary-foreground rounded-br-md'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    msg.is_admin_reply ? 'text-muted-foreground' : 'text-primary-foreground/70'
                  )}>
                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-3 flex gap-2 items-end">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="shrink-0 h-[44px] w-[44px]"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
