-- Fix RLS policies for user_roles table
-- This migration adds a critical policy that allows users to read their own roles
-- Without this policy, users cannot authenticate as admins in production

-- Drop existing conflicting policies if they exist (from previous migrations)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Add policy for users to view their own roles
-- This is CRITICAL for the admin panel to work
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure all other user_roles policies still exist and work correctly
-- These should already exist from previous migrations, but we verify/update them

-- Drop and recreate admin policies to ensure consistency
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Super admins can insert roles (updated from migration 20250107000000)
-- This should already exist, but we ensure it's correct
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update roles (updated from migration 20250107000000)
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete roles (updated from migration 20250107000000)
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.user_roles IS 'User role assignments with RLS policies allowing users to view their own roles and super admins to manage all roles';
