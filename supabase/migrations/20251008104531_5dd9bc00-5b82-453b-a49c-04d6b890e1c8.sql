-- Fix critical security issues (corrected)

-- 1. Remove temp_password field from profiles table (security risk)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temp_password;

-- 2. Add SELECT policy for chat_sessions (currently publicly readable)
DROP POLICY IF EXISTS "Only admins can view chat sessions" ON public.chat_sessions;
CREATE POLICY "Only admins can view chat sessions"
ON public.chat_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix profiles RLS - create separate policies for different fields
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can update non-sensitive fields
CREATE POLICY "Users can update their own profile non-sensitive fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not admin and role is being changed, reject
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to prevent role escalation
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 4. Fix audit_logs policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 5. Create function to sanitize payment details (remove sensitive data)
CREATE OR REPLACE FUNCTION public.sanitize_payment_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove any potentially sensitive fields from payment_details
  IF NEW.payment_details IS NOT NULL THEN
    NEW.payment_details = jsonb_strip_nulls(
      jsonb_build_object(
        'order_id', NEW.payment_details->>'order_id',
        'status', NEW.payment_details->>'status',
        'amount', NEW.payment_details->>'amount',
        'currency', NEW.payment_details->>'currency',
        'timestamp', NEW.payment_details->>'timestamp',
        'invoice_id', NEW.payment_details->>'invoice_id'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Add trigger to sanitize payment details on insert/update
DROP TRIGGER IF EXISTS sanitize_payment_details_trigger ON public.orders;
CREATE TRIGGER sanitize_payment_details_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_payment_details();