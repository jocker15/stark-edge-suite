-- Dashboard Analytics Views and Functions

-- RPC: Get dashboard statistics
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

-- RPC: Get sales by day for chart
CREATE OR REPLACE FUNCTION get_sales_by_day(
  days_count integer DEFAULT 30
)
RETURNS TABLE(
  date date,
  sales_count bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(o.created_at) as date,
    COUNT(*) as sales_count,
    COALESCE(SUM(o.amount), 0) as revenue
  FROM orders o
  WHERE o.status = 'completed'
    AND o.created_at >= (now() - (days_count || ' days')::interval)
  GROUP BY DATE(o.created_at)
  ORDER BY DATE(o.created_at) ASC;
END;
$$;

-- RPC: Get top products by sales
CREATE OR REPLACE FUNCTION get_top_products(
  limit_count integer DEFAULT 5,
  days_count integer DEFAULT 30
)
RETURNS TABLE(
  product_id integer,
  product_name text,
  sales_count bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH order_items AS (
    SELECT
      o.id as order_id,
      o.created_at,
      o.status,
      jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(o.order_details->'items') = 'array' 
          THEN o.order_details->'items'
          ELSE '[]'::jsonb
        END
      ) as item
    FROM orders o
    WHERE o.status = 'completed'
      AND o.created_at >= (now() - (days_count || ' days')::interval)
  )
  SELECT
    (item->>'product_id')::integer as product_id,
    COALESCE(
      p.name_en,
      p.name_ru,
      item->>'name'::text,
      'Unknown Product'
    ) as product_name,
    COUNT(*) as sales_count,
    COALESCE(SUM((item->>'price')::numeric * COALESCE((item->>'quantity')::integer, 1)), 0) as revenue
  FROM order_items oi
  LEFT JOIN products p ON p.id = (oi.item->>'product_id')::integer
  WHERE (oi.item->>'product_id') IS NOT NULL
  GROUP BY (oi.item->>'product_id')::integer, p.name_en, p.name_ru, item->>'name'
  ORDER BY sales_count DESC
  LIMIT limit_count;
END;
$$;

-- RPC: Get order geography distribution
CREATE OR REPLACE FUNCTION get_orders_by_geography(
  days_count integer DEFAULT 30
)
RETURNS TABLE(
  country text,
  state text,
  order_count bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH order_items AS (
    SELECT
      o.id as order_id,
      o.amount,
      o.created_at,
      o.status,
      jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(o.order_details->'items') = 'array' 
          THEN o.order_details->'items'
          ELSE '[]'::jsonb
        END
      ) as item
    FROM orders o
    WHERE o.status = 'completed'
      AND o.created_at >= (now() - (days_count || ' days')::interval)
  )
  SELECT
    COALESCE(p.country, 'Unknown') as country,
    COALESCE(p.state, 'N/A') as state,
    COUNT(DISTINCT oi.order_id) as order_count,
    COALESCE(SUM(o.amount), 0) as revenue
  FROM order_items oi
  LEFT JOIN products p ON p.id = (oi.item->>'product_id')::integer
  LEFT JOIN orders o ON o.id = oi.order_id
  WHERE (oi.item->>'product_id') IS NOT NULL
  GROUP BY p.country, p.state
  ORDER BY order_count DESC;
END;
$$;

-- RPC: Get recent orders requiring attention
CREATE OR REPLACE FUNCTION get_orders_requiring_attention(
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id integer,
  user_id text,
  amount numeric,
  status text,
  created_at timestamp with time zone,
  user_email text,
  user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id::integer,
    o.user_id::text,
    o.amount::numeric,
    o.status::text,
    o.created_at,
    p.email::text as user_email,
    p.username::text as user_name
  FROM orders o
  LEFT JOIN profiles p ON p.user_id = o.user_id
  WHERE o.status IN ('pending', 'failed')
  ORDER BY 
    CASE o.status 
      WHEN 'failed' THEN 1
      WHEN 'pending' THEN 2
      ELSE 3
    END,
    o.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_by_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_by_geography TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_requiring_attention TO authenticated;
