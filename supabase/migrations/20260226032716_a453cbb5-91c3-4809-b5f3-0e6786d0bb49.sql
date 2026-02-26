
-- Create scheduled communications table
CREATE TABLE public.scheduled_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'follow_up', -- 'follow_up', 'monthly_update', 'quarterly_update', 'investor_update', 'custom'
  title TEXT NOT NULL,
  content TEXT,
  recipient_type TEXT NOT NULL DEFAULT 'investor_deal', -- 'investor_deal', 'contact'
  recipient_ids UUID[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  recurrence TEXT DEFAULT 'none', -- 'none', 'weekly', 'monthly', 'quarterly'
  auto_send BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- 'pending', 'ready_to_review', 'sent', 'cancelled'
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled communications"
ON public.scheduled_communications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled communications"
ON public.scheduled_communications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled communications"
ON public.scheduled_communications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled communications"
ON public.scheduled_communications FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_communications_updated_at
BEFORE UPDATE ON public.scheduled_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
