-- Add unique constraint for emails to enable upsert on external_id
ALTER TABLE public.emails 
ADD CONSTRAINT emails_user_id_external_id_key UNIQUE (user_id, external_id);

-- Add unique constraint for calendar_events to enable upsert on external_id
ALTER TABLE public.calendar_events 
ADD CONSTRAINT calendar_events_user_id_external_id_key UNIQUE (user_id, external_id);