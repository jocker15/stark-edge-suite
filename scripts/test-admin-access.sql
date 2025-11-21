-- Test script to verify admin access fix
-- Run this in Supabase SQL Editor to test the RLS policies

-- 1. Check if the "Users can view own roles" policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- 2. Test user role query (simulate what useRoles hook does)
-- Replace 'your-user-uuid' with actual user UUID
-- SELECT role FROM public.user_roles WHERE user_id = 'your-user-uuid';

-- 3. Test has_role function (simulate what Admin.tsx does)
-- Replace 'your-user-uuid' with actual user UUID
-- SELECT public.has_role('your-user-uuid'::uuid, 'admin'::app_role);

-- 4. Check all users with admin roles
SELECT 
  ur.user_id,
  p.email,
  p.username,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;

-- 5. Verify RLS is enabled on user_roles
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_roles';

-- Expected results:
-- 1. Should see "Users can view own roles" policy with cmd='SELECT'
-- 2. Users should be able to query their own roles
-- 3. has_role should return true for admin users
-- 4. List of all admin users should be visible
-- 5. rowsecurity should be 'true'
