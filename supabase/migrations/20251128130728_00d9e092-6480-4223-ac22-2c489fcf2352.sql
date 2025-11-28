-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS invoice_id TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_username TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Add missing columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reply_text TEXT,
ADD COLUMN IF NOT EXISTS reply_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderated_by UUID,
ADD COLUMN IF NOT EXISTS is_unread BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create user_stats view for admin users management
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  p.user_id,
  p.email,
  p.username,
  p.avatar_url,
  p.is_blocked,
  p.created_at,
  p.role,
  COALESCE(ur.role, 'user'::app_role) as app_role,
  (SELECT COUNT(*) FROM public.orders o WHERE o.user_id = p.user_id) as order_count,
  (SELECT COALESCE(SUM(o.amount), 0) FROM public.orders o WHERE o.user_id = p.user_id AND o.status = 'completed') as total_spent,
  (SELECT COUNT(*) FROM public.reviews r WHERE r.user_id = p.user_id) as review_count
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id;

-- Grant select on user_stats view to authenticated users (admins will be filtered by RLS on underlying tables)
GRANT SELECT ON public.user_stats TO authenticated;

-- Create trigger to update updated_at on orders
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();