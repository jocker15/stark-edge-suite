-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.user_stats;

-- Recreate the view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.user_stats 
WITH (security_invoker = true)
AS
SELECT 
    p.id AS profile_id,
    p.user_id,
    p.email,
    p.username,
    p.avatar_url,
    p.is_blocked,
    p.created_at,
    p.role,
    p.phone,
    COALESCE(
        (SELECT ur.role FROM user_roles ur WHERE ur.user_id = p.user_id LIMIT 1), 
        'user'::app_role
    ) AS app_role,
    COALESCE(
        (SELECT count(*) FROM orders o WHERE o.user_id = p.user_id), 
        0::bigint
    ) AS order_count,
    COALESCE(
        (SELECT sum(o.amount) FROM orders o WHERE o.user_id = p.user_id AND o.status = 'completed'), 
        0::numeric
    ) AS total_spent,
    COALESCE(
        (SELECT count(*) FROM reviews r WHERE r.user_id = p.user_id), 
        0::bigint
    ) AS review_count,
    p.last_login
FROM profiles p;