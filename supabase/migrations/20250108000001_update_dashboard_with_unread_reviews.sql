-- Update dashboard stats to include unread reviews count
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  start_date timestamp with time zone DEFAULT NULL,
  end_date timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  today_start timestamp with time zone;
  week_start timestamp with time zone;
  month_start timestamp with time zone;
BEGIN
  today_start := date_trunc('day', now());
  week_start := date_trunc('week', now());
  month_start := date_trunc('month', now());

  SELECT json_build_object(
    'sales_today', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= today_start
    ),
    'sales_week', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= week_start
    ),
    'sales_month', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= month_start
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(amount), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= today_start
    ),
    'revenue_week', (
      SELECT COALESCE(SUM(amount), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= week_start
    ),
    'revenue_month', (
      SELECT COALESCE(SUM(amount), 0)
      FROM orders
      WHERE status = 'completed'
        AND created_at >= month_start
    ),
    'new_users_today', (
      SELECT COALESCE(COUNT(*), 0)
      FROM profiles
      WHERE created_at >= today_start
    ),
    'new_users_week', (
      SELECT COALESCE(COUNT(*), 0)
      FROM profiles
      WHERE created_at >= week_start
    ),
    'new_users_month', (
      SELECT COALESCE(COUNT(*), 0)
      FROM profiles
      WHERE created_at >= month_start
    ),
    'active_products', (
      SELECT COALESCE(COUNT(*), 0)
      FROM products
      WHERE status = 'active'
    ),
    'pending_reviews', (
      SELECT COALESCE(COUNT(*), 0)
      FROM reviews
      WHERE status = 'pending'
    ),
    'unread_reviews', (
      SELECT COALESCE(COUNT(*), 0)
      FROM reviews
      WHERE is_unread = TRUE AND status = 'pending'
    ),
    'pending_orders', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'pending'
    ),
    'failed_orders', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'failed'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM orders
      WHERE status = 'completed'
    ),
    'total_orders', (
      SELECT COALESCE(COUNT(*), 0)
      FROM orders
      WHERE status = 'completed'
    ),
    'total_users', (
      SELECT COALESCE(COUNT(*), 0)
      FROM profiles
    )
  ) INTO result;

  RETURN result;
END;
$$;
