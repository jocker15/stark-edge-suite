-- Seed initial super admin
-- This migration will promote the first admin user to super_admin
-- If no admin exists, it will be handled during application setup

DO $$
DECLARE
  first_admin_id UUID;
BEGIN
  -- Find the first user with admin role
  SELECT user_id INTO first_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  -- If an admin exists, add super_admin role
  IF first_admin_id IS NOT NULL THEN
    -- Insert super_admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_admin_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Super admin role granted to user: %', first_admin_id;
  ELSE
    RAISE NOTICE 'No admin users found. Super admin will need to be assigned manually.';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TYPE public.app_role IS 'User roles with hierarchy: super_admin > admin > moderator > user. Super admins have full system access and can manage all roles.';
