-- Add phone field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create login_history table for tracking user logins
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON public.login_history(login_at DESC);

-- RLS policies for login_history
CREATE POLICY "Users can view their own login history"
ON public.login_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history"
ON public.login_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for admins to manage profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for admins to manage user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Create view for user stats (order count and total spent)
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  p.user_id,
  p.id as profile_id,
  p.email,
  p.username,
  p.phone,
  p.avatar_url,
  p.role,
  p.is_blocked,
  p.created_at,
  COALESCE(COUNT(DISTINCT o.id), 0) as order_count,
  COALESCE(SUM(o.amount), 0) as total_spent,
  (
    SELECT lh.login_at
    FROM public.login_history lh
    WHERE lh.user_id::text = p.user_id
    ORDER BY lh.login_at DESC
    LIMIT 1
  ) as last_login
FROM
  public.profiles p
  LEFT JOIN public.orders o ON o.user_id = p.user_id
GROUP BY
  p.user_id, p.id, p.email, p.username, p.phone, p.avatar_url, p.role, p.is_blocked, p.created_at;

-- Grant access to user_stats view
GRANT SELECT ON public.user_stats TO authenticated;
GRANT SELECT ON public.user_stats TO service_role;

-- RLS policy for user_stats view
ALTER VIEW public.user_stats SET (security_invoker = on);

-- Create function to get user order summary
CREATE OR REPLACE FUNCTION public.get_user_orders_summary(target_user_id UUID)
RETURNS TABLE (
  order_id INT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  order_details JSONB,
  payment_details JSONB
) AS $$
BEGIN
  -- Check if caller is admin or the user themselves
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    ) OR auth.uid()::text = target_user_id::text
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.amount,
    o.status,
    o.created_at,
    o.order_details::jsonb,
    o.payment_details::jsonb
  FROM public.orders o
  WHERE o.user_id::text = target_user_id::text
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user wishlist
CREATE OR REPLACE FUNCTION public.get_user_wishlist(target_user_id UUID)
RETURNS TABLE (
  wishlist_id UUID,
  product_id INT,
  product_name_en TEXT,
  product_name_ru TEXT,
  price NUMERIC,
  image_urls JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if caller is admin or the user themselves
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    ) OR auth.uid()::text = target_user_id::text
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.product_id,
    p.name_en,
    p.name_ru,
    p.price,
    p.image_urls::jsonb,
    w.created_at
  FROM public.wishlist w
  JOIN public.products p ON p.id = w.product_id
  WHERE w.user_id::text = target_user_id::text
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user reviews
CREATE OR REPLACE FUNCTION public.get_user_reviews(target_user_id UUID)
RETURNS TABLE (
  review_id UUID,
  product_id INT,
  product_name_en TEXT,
  product_name_ru TEXT,
  rating INT,
  comment TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if caller is admin or the user themselves
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    ) OR auth.uid()::text = target_user_id::text
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.product_id,
    p.name_en,
    p.name_ru,
    r.rating,
    r.comment,
    r.status,
    r.created_at
  FROM public.reviews r
  JOIN public.products p ON p.id = r.product_id
  WHERE r.user_id::text = target_user_id::text
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for admins to view all wishlists
CREATE POLICY "Admins can view all wishlists"
ON public.wishlist
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for admins to view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS policies for admins to view all chat_sessions
CREATE POLICY "Admins can view all chat sessions"
ON public.chat_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
