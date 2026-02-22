-- Follow-up sequences table
CREATE TABLE public.follow_up_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investor_deal_id UUID REFERENCES public.investor_deals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  interval_days INTEGER NOT NULL DEFAULT 3,
  follow_up_number INTEGER NOT NULL DEFAULT 1,
  max_follow_ups INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active',
  next_send_at TIMESTAMP WITH TIME ZONE,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences" ON public.follow_up_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sequences" ON public.follow_up_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sequences" ON public.follow_up_sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sequences" ON public.follow_up_sequences FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_follow_up_sequences_updated_at BEFORE UPDATE ON public.follow_up_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();