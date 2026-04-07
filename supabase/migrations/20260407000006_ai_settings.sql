-- AI Settings per user
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  api_key_encrypted TEXT,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  enabled BOOLEAN DEFAULT true,
  -- Feature toggles
  ai_message_generator BOOLEAN DEFAULT true,
  ai_followup_intelligence BOOLEAN DEFAULT true,
  ai_auto_responder BOOLEAN DEFAULT false,
  ai_lead_qualification BOOLEAN DEFAULT true,
  ai_meeting_scheduler BOOLEAN DEFAULT true,
  ai_sequence_optimizer BOOLEAN DEFAULT true,
  ai_stage_manager BOOLEAN DEFAULT true,
  ai_subject_tester BOOLEAN DEFAULT true,
  ai_daily_briefing BOOLEAN DEFAULT true,
  ai_task_suggestions BOOLEAN DEFAULT true,
  -- Auto-responder settings
  auto_response_tone TEXT DEFAULT 'professional' CHECK (auto_response_tone IN ('professional', 'friendly', 'concise')),
  auto_response_send_mode TEXT DEFAULT 'review' CHECK (auto_response_send_mode IN ('auto', 'review')),
  blackout_start_hour INTEGER DEFAULT 22,
  blackout_end_hour INTEGER DEFAULT 7,
  -- Language
  response_language TEXT DEFAULT 'English',
  -- Working hours for meeting scheduler
  working_hours_start INTEGER DEFAULT 9,
  working_hours_end INTEGER DEFAULT 17,
  working_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'],
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI action log (track AI suggestions and actions)
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  suggestion TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_executed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ai settings" ON public.ai_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ai actions" ON public.ai_actions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_ai_settings_user ON public.ai_settings(user_id);
CREATE INDEX idx_ai_actions_user ON public.ai_actions(user_id);
CREATE INDEX idx_ai_actions_type ON public.ai_actions(action_type);
CREATE INDEX idx_ai_actions_status ON public.ai_actions(status);
