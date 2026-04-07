-- Email Warmup tracking
CREATE TABLE IF NOT EXISTS public.email_warmup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_account TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  warmup_enabled BOOLEAN DEFAULT false,
  daily_rampup INTEGER DEFAULT 5,
  max_daily_sends INTEGER DEFAULT 50,
  current_daily_limit INTEGER DEFAULT 5,
  warmup_started_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 100,
  reputation TEXT DEFAULT 'good' CHECK (reputation IN ('excellent', 'good', 'fair', 'poor', 'critical')),
  total_sent INTEGER DEFAULT 0,
  total_landed_inbox INTEGER DEFAULT 0,
  total_landed_spam INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily warmup stats
CREATE TABLE IF NOT EXISTS public.email_warmup_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warmup_id UUID NOT NULL REFERENCES public.email_warmup(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent INTEGER DEFAULT 0,
  received INTEGER DEFAULT 0,
  landed_inbox INTEGER DEFAULT 0,
  landed_spam INTEGER DEFAULT 0,
  bounced INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(warmup_id, date)
);

ALTER TABLE public.email_warmup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_warmup_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own warmup" ON public.email_warmup FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own warmup daily" ON public.email_warmup_daily FOR ALL USING (warmup_id IN (SELECT id FROM public.email_warmup WHERE user_id = auth.uid()));

CREATE INDEX idx_email_warmup_user_id ON public.email_warmup(user_id);
CREATE INDEX idx_email_warmup_daily_warmup_id ON public.email_warmup_daily(warmup_id);
