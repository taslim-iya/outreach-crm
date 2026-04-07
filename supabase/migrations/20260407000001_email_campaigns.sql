-- Email Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  from_name TEXT,
  from_email TEXT,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  send_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'],
  send_start_hour INTEGER DEFAULT 9,
  send_end_hour INTEGER DEFAULT 17,
  timezone TEXT DEFAULT 'America/New_York',
  daily_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Steps (for multi-step sequences)
CREATE TABLE IF NOT EXISTS public.campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  step_type TEXT NOT NULL DEFAULT 'email' CHECK (step_type IN ('email', 'delay', 'condition')),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  delay_days INTEGER DEFAULT 3,
  variant_key TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'replied', 'bounced', 'unsubscribed', 'failed')),
  current_step INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  variant_key TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Analytics snapshots
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own campaign steps" ON public.campaign_steps FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own campaign recipients" ON public.campaign_recipients FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own campaign analytics" ON public.campaign_analytics FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_steps_campaign_id ON public.campaign_steps(campaign_id);
CREATE INDEX idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON public.campaign_recipients(status);
CREATE INDEX idx_campaign_analytics_campaign_id ON public.campaign_analytics(campaign_id);
