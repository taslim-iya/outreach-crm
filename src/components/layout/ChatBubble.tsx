import { useState } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('notify-support', {
        body: { message: message.trim() },
      });
      if (error) throw error;
      toast.success('Message sent! We\'ll get back to you soon.');
      setMessage('');
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-border bg-background shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Chat with us</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Send us a message and we'll reply to your email.
            </p>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-full"
              size="sm"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Message
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}
