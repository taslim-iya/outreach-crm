-- Contact engagement tracking for scoring
CREATE TABLE IF NOT EXISTS public.contact_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_sent', 'email_opened', 'email_replied', 'email_clicked', 'meeting_scheduled', 'meeting_completed', 'note_added', 'task_completed', 'deal_created', 'call_made')),
  points INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Smart send time preferences
CREATE TABLE IF NOT EXISTS public.smart_send_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  open_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contact_id, day_of_week, hour_of_day)
);

ALTER TABLE public.contact_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_send_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own engagement" ON public.contact_engagement FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own send times" ON public.smart_send_times FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_contact_engagement_contact ON public.contact_engagement(contact_id);
CREATE INDEX idx_contact_engagement_user ON public.contact_engagement(user_id);
CREATE INDEX idx_smart_send_times_user ON public.smart_send_times(user_id);
CREATE INDEX idx_smart_send_times_contact ON public.smart_send_times(contact_id);

-- Add score column to contacts if not exists
DO $$ BEGIN
  ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
  ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
