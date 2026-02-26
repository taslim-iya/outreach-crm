
-- Support messages table for in-app chat
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support messages"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_admin_reply = false);

CREATE POLICY "Users can update their own messages read status"
  ON public.support_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
