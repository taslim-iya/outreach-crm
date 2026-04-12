-- ============================================================
-- Cambridge ETA — profile row backfill
--
-- Run this ONCE in your Supabase SQL editor if you signed up before
-- the main migration was applied and now see:
--   "Your account is missing a profile row."
--
-- It is idempotent — safe to re-run.
-- ============================================================

-- 1. Create missing profile rows for every auth.users entry that
--    does not already have one. Everyone is created as a Member
--    with default permissions; the next step promotes the first
--    user to Owner if nobody is currently an Owner.
INSERT INTO public.eta_users (id, email, name, role, permissions)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'Member',
  ARRAY['dashboard','tasks','notes']::text[]
FROM auth.users u
LEFT JOIN public.eta_users e ON e.id = u.id
WHERE e.id IS NULL;

-- 2. If no Owner exists yet, promote the earliest-created profile
--    to Owner with full permissions.
UPDATE public.eta_users
SET role = 'Owner',
    permissions = ARRAY['*']::text[]
WHERE id = (
  SELECT id FROM public.eta_users
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.eta_users WHERE role = 'Owner'
);

-- 3. Allow authenticated users to insert their OWN profile row.
--    This is the client-side self-heal fallback: if the signup
--    trigger ever fails, the browser can create the missing row
--    itself on first load (constrained to the caller's own uid).
DROP POLICY IF EXISTS eta_users_insert_self ON public.eta_users;
CREATE POLICY eta_users_insert_self ON public.eta_users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Verify the result
SELECT id, email, name, role, permissions, created_at
FROM public.eta_users
ORDER BY created_at;
