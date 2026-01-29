-- Add fundraising_goal column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN fundraising_goal numeric DEFAULT 1000000;