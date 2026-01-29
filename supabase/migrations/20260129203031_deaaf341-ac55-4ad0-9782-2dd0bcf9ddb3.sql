-- Add currency column to profiles table
ALTER TABLE public.profiles
ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.currency IS 'User preferred currency code (e.g., USD, EUR, GBP)';