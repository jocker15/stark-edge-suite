-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create hierarchical role check function
CREATE OR REPLACE FUNCTION public.has_role_hierarchy(_user_id UUID, _required_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_roles app_role[];
  role_hierarchy CONSTANT jsonb := '{"super_admin": 4, "admin": 3, "moderator": 2, "user": 1}'::jsonb;
  required_level int;
  user_level int;
BEGIN
  -- Get all roles for the user
  SELECT ARRAY_AGG(role) INTO user_roles
  FROM public.user_roles
  WHERE user_id = _user_id;

  -- If user has no roles, return false
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get required role level
  required_level := (role_hierarchy->>_required_role::text)::int;

  -- Check if user has a role with sufficient level
  FOR i IN 1..array_length(user_roles, 1) LOOP
    user_level := (role_hierarchy->>user_roles[i]::text)::int;
    IF user_level >= required_level THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$;

-- Update has_role function to use hierarchy
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_hierarchy(_user_id, _role)
$$;

-- Create login_events table (enhanced version of login_history)
CREATE TABLE IF NOT EXISTS public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_status ON public.login_events(status);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at DESC);

-- Enable RLS on login_events
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for login_events
CREATE POLICY "Users can view their own login events"
ON public.login_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login events"
ON public.login_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert login events"
ON public.login_events
FOR INSERT
WITH CHECK (true);

-- Function to log login events
CREATE OR REPLACE FUNCTION public.log_login_event(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.login_events (user_id, ip_address, user_agent, status, failure_reason)
  VALUES (p_user_id, p_ip_address, p_user_agent, p_status, p_failure_reason)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Enhanced audit_logs with automatic triggers
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      TG_TABLE_NAME || '_created',
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, NEW.user_id::text),
      jsonb_build_object('new', to_jsonb(NEW)),
      current_setting('request.headers', true)::jsonb->>'x-real-ip',
      current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      TG_TABLE_NAME || '_updated',
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, NEW.user_id::text),
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
      current_setting('request.headers', true)::jsonb->>'x-real-ip',
      current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      TG_TABLE_NAME || '_deleted',
      TG_TABLE_NAME,
      COALESCE(OLD.id::text, OLD.user_id::text),
      jsonb_build_object('old', to_jsonb(OLD)),
      current_setting('request.headers', true)::jsonb->>'x-real-ip',
      current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Add audit triggers to key tables
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- RPC to get login events with filters
CREATE OR REPLACE FUNCTION public.get_login_events(
  p_user_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  WITH filtered_events AS (
    SELECT
      le.id,
      le.user_id,
      p.email as user_email,
      p.username as user_username,
      le.ip_address,
      le.user_agent,
      le.status,
      le.failure_reason,
      le.created_at
    FROM public.login_events le
    LEFT JOIN public.profiles p ON p.user_id = le.user_id
    WHERE
      (p_user_id IS NULL OR le.user_id = p_user_id)
      AND (p_status IS NULL OR le.status = p_status)
      AND (p_date_from IS NULL OR le.created_at >= p_date_from)
      AND (p_date_to IS NULL OR le.created_at <= p_date_to)
  ),
  counted AS (
    SELECT COUNT(*) as total FROM filtered_events
  )
  SELECT
    fe.*,
    c.total
  FROM filtered_events fe
  CROSS JOIN counted c
  ORDER BY fe.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- RPC to get audit logs with filters
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  p_user_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_action_type TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_username TEXT,
  action_type TEXT,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  WITH filtered_logs AS (
    SELECT
      al.id,
      al.user_id,
      p.email as user_email,
      p.username as user_username,
      al.action_type,
      al.entity_type,
      al.entity_id,
      al.details,
      al.ip_address,
      al.user_agent,
      al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.profiles p ON p.user_id = al.user_id
    WHERE
      (p_user_id IS NULL OR al.user_id = p_user_id)
      AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
      AND (p_action_type IS NULL OR al.action_type = p_action_type)
      AND (p_date_from IS NULL OR al.created_at >= p_date_from)
      AND (p_date_to IS NULL OR al.created_at <= p_date_to)
      AND (p_search IS NULL OR 
        al.entity_id ILIKE '%' || p_search || '%' OR
        al.action_type ILIKE '%' || p_search || '%' OR
        al.entity_type ILIKE '%' || p_search || '%' OR
        p.email ILIKE '%' || p_search || '%')
  ),
  counted AS (
    SELECT COUNT(*) as total FROM filtered_logs
  )
  SELECT
    fl.*,
    c.total
  FROM filtered_logs fl
  CROSS JOIN counted c
  ORDER BY fl.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_role_hierarchy TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_login_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs TO authenticated;

-- Update RLS policies for better role hierarchy support

-- Products: only admins can manage
DROP POLICY IF EXISTS "Moderators can view products" ON public.products;
CREATE POLICY "Moderators can view products"
ON public.products
FOR SELECT
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- Orders: only admins can manage
DROP POLICY IF EXISTS "Moderators can view orders" ON public.orders;
CREATE POLICY "Moderators can view orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- Reviews: moderators can manage
CREATE POLICY "Moderators can insert reviews"
ON public.reviews
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can delete reviews"
ON public.reviews
FOR DELETE
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- User roles: only super admins can manage roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Audit logs: only super admins can view audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Login events: admins can view
-- (already created above)

-- Add comments for documentation
COMMENT ON FUNCTION public.has_role_hierarchy IS 'Check if user has required role or higher in hierarchy (super_admin > admin > moderator > user)';
COMMENT ON FUNCTION public.log_login_event IS 'Log a user login event with status and metadata';
COMMENT ON FUNCTION public.get_login_events IS 'Get filtered login events with pagination (admin only)';
COMMENT ON FUNCTION public.get_audit_logs IS 'Get filtered audit logs with pagination (admin only)';
COMMENT ON TABLE public.login_events IS 'Tracks all user login attempts with success/failure status';
