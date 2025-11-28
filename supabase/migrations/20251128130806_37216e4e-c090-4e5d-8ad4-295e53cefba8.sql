-- Add missing columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.user_stats;

-- Create regular view (not security definer) - RLS on underlying tables controls access
CREATE VIEW public.user_stats AS
SELECT 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.username,
  p.avatar_url,
  p.is_blocked,
  p.created_at,
  p.role,
  p.phone,
  COALESCE(
    (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = p.user_id LIMIT 1),
    'user'::app_role
  ) as app_role,
  COALESCE((SELECT COUNT(*) FROM public.orders o WHERE o.user_id = p.user_id), 0) as order_count,
  COALESCE((SELECT SUM(o.amount) FROM public.orders o WHERE o.user_id = p.user_id AND o.status = 'completed'), 0) as total_spent,
  COALESCE((SELECT COUNT(*) FROM public.reviews r WHERE r.user_id = p.user_id), 0) as review_count,
  p.last_login
FROM public.profiles p;