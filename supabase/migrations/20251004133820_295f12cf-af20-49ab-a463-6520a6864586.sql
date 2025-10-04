-- Add is_blocked column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Update RLS policies to block blocked users from accessing data
-- Note: Admins should still be able to see blocked users

-- Create a function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;