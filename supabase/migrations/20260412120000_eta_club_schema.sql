-- ============================================================
-- Cambridge ETA Club Management Platform
-- Schema, RLS and signup trigger
-- Run once in your Supabase SQL editor (or `supabase db push`)
-- ============================================================

-- ---------- TABLES ----------

CREATE TABLE IF NOT EXISTS public.eta_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Member',
  permissions text[] NOT NULL DEFAULT ARRAY['dashboard','tasks','notes']::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eta_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  event_time text,
  venue text,
  description text,
  capacity int DEFAULT 50,
  attendees int DEFAULT 0,
  status text DEFAULT 'Open',
  created_by uuid REFERENCES public.eta_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eta_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'Medium',
  assignee_id uuid REFERENCES public.eta_users(id) ON DELETE SET NULL,
  project text,
  done boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.eta_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eta_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  role text,
  chapter text,
  tier text NOT NULL DEFAULT 'Silver',
  status text NOT NULL DEFAULT 'Active',
  joined date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES public.eta_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eta_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.eta_users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.eta_users(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'private',  -- 'private' | 'public' | 'direct'
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- HELPER FUNCTIONS ----------

CREATE OR REPLACE FUNCTION public.eta_is_owner()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eta_users
    WHERE id = auth.uid() AND role = 'Owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.eta_has_perm(perm text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eta_users
    WHERE id = auth.uid()
      AND (role = 'Owner' OR '*' = ANY(permissions) OR perm = ANY(permissions))
  );
$$;

-- ---------- SIGNUP TRIGGER ----------
-- First signup becomes the Owner; everyone after starts as a basic Member.

CREATE OR REPLACE FUNCTION public.eta_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.eta_users;
  IF existing_count = 0 THEN
    INSERT INTO public.eta_users (id, email, name, role, permissions)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
      'Owner',
      ARRAY['*']
    );
  ELSE
    INSERT INTO public.eta_users (id, email, name, role, permissions)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
      'Member',
      ARRAY['dashboard','tasks','notes']
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_eta ON auth.users;
CREATE TRIGGER on_auth_user_created_eta
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.eta_handle_new_user();

-- ---------- ROW LEVEL SECURITY ----------

ALTER TABLE public.eta_users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_notes   ENABLE ROW LEVEL SECURITY;

-- eta_users: any authenticated user can read the user directory
-- (needed to show assignee names, the team panel, and note authors).
-- Only the Owner can modify role / permissions / other profiles.
-- Each user can update their own name.
DROP POLICY IF EXISTS eta_users_select        ON public.eta_users;
DROP POLICY IF EXISTS eta_users_update_self   ON public.eta_users;
DROP POLICY IF EXISTS eta_users_update_owner  ON public.eta_users;
DROP POLICY IF EXISTS eta_users_delete_owner  ON public.eta_users;

CREATE POLICY eta_users_select       ON public.eta_users FOR SELECT TO authenticated USING (true);
CREATE POLICY eta_users_update_self  ON public.eta_users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY eta_users_update_owner ON public.eta_users FOR UPDATE TO authenticated USING (public.eta_is_owner()) WITH CHECK (public.eta_is_owner());
CREATE POLICY eta_users_delete_owner ON public.eta_users FOR DELETE TO authenticated USING (public.eta_is_owner());

-- eta_events
DROP POLICY IF EXISTS eta_events_select ON public.eta_events;
DROP POLICY IF EXISTS eta_events_insert ON public.eta_events;
DROP POLICY IF EXISTS eta_events_update ON public.eta_events;
DROP POLICY IF EXISTS eta_events_delete ON public.eta_events;

CREATE POLICY eta_events_select ON public.eta_events
  FOR SELECT TO authenticated
  USING (public.eta_has_perm('events') OR public.eta_has_perm('dashboard'));

CREATE POLICY eta_events_insert ON public.eta_events
  FOR INSERT TO authenticated
  WITH CHECK (public.eta_has_perm('events'));

CREATE POLICY eta_events_update ON public.eta_events
  FOR UPDATE TO authenticated
  USING (public.eta_has_perm('events'));

CREATE POLICY eta_events_delete ON public.eta_events
  FOR DELETE TO authenticated
  USING (public.eta_has_perm('events'));

-- eta_tasks: Owner sees all; everyone else only sees tasks assigned to them
-- (unless they have the 'tasks' blanket permission).
DROP POLICY IF EXISTS eta_tasks_select ON public.eta_tasks;
DROP POLICY IF EXISTS eta_tasks_insert ON public.eta_tasks;
DROP POLICY IF EXISTS eta_tasks_update ON public.eta_tasks;
DROP POLICY IF EXISTS eta_tasks_delete ON public.eta_tasks;

CREATE POLICY eta_tasks_select ON public.eta_tasks
  FOR SELECT TO authenticated
  USING (
    public.eta_is_owner()
    OR assignee_id = auth.uid()
    OR public.eta_has_perm('tasks_all')
  );

CREATE POLICY eta_tasks_insert ON public.eta_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.eta_has_perm('tasks') OR public.eta_is_owner());

CREATE POLICY eta_tasks_update ON public.eta_tasks
  FOR UPDATE TO authenticated
  USING (public.eta_is_owner() OR assignee_id = auth.uid());

CREATE POLICY eta_tasks_delete ON public.eta_tasks
  FOR DELETE TO authenticated
  USING (public.eta_is_owner());

-- eta_members (club directory)
DROP POLICY IF EXISTS eta_members_select ON public.eta_members;
DROP POLICY IF EXISTS eta_members_insert ON public.eta_members;
DROP POLICY IF EXISTS eta_members_update ON public.eta_members;
DROP POLICY IF EXISTS eta_members_delete ON public.eta_members;

CREATE POLICY eta_members_select ON public.eta_members FOR SELECT TO authenticated USING (public.eta_has_perm('crm'));
CREATE POLICY eta_members_insert ON public.eta_members FOR INSERT TO authenticated WITH CHECK (public.eta_has_perm('crm'));
CREATE POLICY eta_members_update ON public.eta_members FOR UPDATE TO authenticated USING (public.eta_has_perm('crm'));
CREATE POLICY eta_members_delete ON public.eta_members FOR DELETE TO authenticated USING (public.eta_has_perm('crm'));

-- eta_notes: see your own, notes addressed to you, public notes, or everything if Owner
DROP POLICY IF EXISTS eta_notes_select ON public.eta_notes;
DROP POLICY IF EXISTS eta_notes_insert ON public.eta_notes;
DROP POLICY IF EXISTS eta_notes_update ON public.eta_notes;
DROP POLICY IF EXISTS eta_notes_delete ON public.eta_notes;

CREATE POLICY eta_notes_select ON public.eta_notes
  FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR target_user_id = auth.uid()
    OR visibility = 'public'
    OR public.eta_is_owner()
  );

CREATE POLICY eta_notes_insert ON public.eta_notes
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.eta_has_perm('notes'));

CREATE POLICY eta_notes_update ON public.eta_notes
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY eta_notes_delete ON public.eta_notes
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.eta_is_owner());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS eta_tasks_assignee_idx ON public.eta_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS eta_tasks_due_idx      ON public.eta_tasks (due_date);
CREATE INDEX IF NOT EXISTS eta_events_date_idx    ON public.eta_events (event_date);
CREATE INDEX IF NOT EXISTS eta_notes_target_idx   ON public.eta_notes (target_user_id);
CREATE INDEX IF NOT EXISTS eta_notes_author_idx   ON public.eta_notes (author_id);
