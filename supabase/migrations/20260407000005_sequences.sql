-- Email Sequences (multi-step automated flows)
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'new_contact', 'stage_change', 'tag_added')),
  trigger_config JSONB DEFAULT '{}',
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence Steps
CREATE TABLE IF NOT EXISTS public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  step_type TEXT NOT NULL CHECK (step_type IN ('email', 'delay', 'condition', 'task', 'webhook')),
  -- Email step fields
  subject TEXT,
  body_html TEXT,
  -- Delay step fields
  delay_amount INTEGER DEFAULT 1,
  delay_unit TEXT DEFAULT 'days' CHECK (delay_unit IN ('hours', 'days', 'weeks')),
  -- Condition step fields
  condition_type TEXT CHECK (condition_type IN ('opened', 'replied', 'clicked', 'not_opened', 'not_replied')),
  condition_branch_yes UUID,
  condition_branch_no UUID,
  -- Task step fields
  task_title TEXT,
  task_description TEXT,
  -- General
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence Enrollments (contacts in a sequence)
CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'replied', 'bounced', 'unsubscribed', 'paused')),
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_action_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sequences" ON public.sequences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sequence steps" ON public.sequence_steps FOR ALL USING (sequence_id IN (SELECT id FROM public.sequences WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own enrollments" ON public.sequence_enrollments FOR ALL USING (sequence_id IN (SELECT id FROM public.sequences WHERE user_id = auth.uid()));

CREATE INDEX idx_sequences_user_id ON public.sequences(user_id);
CREATE INDEX idx_sequences_status ON public.sequences(status);
CREATE INDEX idx_sequence_steps_sequence_id ON public.sequence_steps(sequence_id);
CREATE INDEX idx_sequence_enrollments_sequence_id ON public.sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_status ON public.sequence_enrollments(status);
