-- Add delivery_status and updated_at to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'delivered', 'failed')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_orders_timestamp ON public.orders;
CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();

-- RPC to get order details with products and files
CREATE OR REPLACE FUNCTION public.get_order_details(order_id_param bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  SELECT json_build_object(
    'order', row_to_json(o.*),
    'profile', row_to_json(p.*),
    'payment_transactions', COALESCE(
      (SELECT json_agg(row_to_json(pt.*))
       FROM payment_transactions pt
       WHERE pt.order_id = order_id_param
       ORDER BY pt.created_at DESC), '[]'::json
    ),
    'products', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'product_id', prod.id,
          'name_en', prod.name_en,
          'name_ru', prod.name_ru,
          'price', prod.price,
          'is_digital', prod.is_digital,
          'files', (
            SELECT json_agg(
              json_build_object(
                'id', pf.id,
                'file_name', pf.file_name,
                'file_path', pf.file_path,
                'file_size', pf.file_size,
                'file_type', pf.file_type
              )
            )
            FROM product_files pf
            WHERE pf.product_id = prod.id
          )
        )
      )
      FROM products prod
      WHERE prod.id = ANY(
        SELECT CAST(item->>'id' AS integer)
        FROM jsonb_array_elements(COALESCE(o.order_details->'items', '[]'::jsonb)) AS item
      )), '[]'::json
    ),
    'audit_logs', COALESCE(
      (SELECT json_agg(row_to_json(al.*))
       FROM audit_logs al
       WHERE al.entity_type = 'order' 
         AND al.entity_id = order_id_param::text
       ORDER BY al.created_at DESC), '[]'::json
    )
  ) INTO result
  FROM orders o
  LEFT JOIN profiles p ON p.user_id = o.user_id
  WHERE o.id = order_id_param;

  RETURN result;
END;
$$;

-- RPC to get orders with filters
CREATE OR REPLACE FUNCTION public.get_filtered_orders(
  search_param text DEFAULT NULL,
  status_filter text DEFAULT NULL,
  payment_status_filter text DEFAULT NULL,
  delivery_status_filter text DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  min_amount numeric DEFAULT NULL,
  max_amount numeric DEFAULT NULL,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  user_id text,
  amount numeric,
  status text,
  delivery_status text,
  order_details jsonb,
  payment_details jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  customer_email text,
  customer_username text,
  payment_status text,
  invoice_id text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  WITH filtered_orders AS (
    SELECT 
      o.id,
      o.user_id,
      o.amount,
      o.status,
      o.delivery_status,
      o.order_details,
      o.payment_details,
      o.created_at,
      o.updated_at,
      p.email as customer_email,
      p.username as customer_username,
      pt.payment_status,
      pt.invoice_id
    FROM orders o
    LEFT JOIN profiles p ON p.user_id = o.user_id
    LEFT JOIN LATERAL (
      SELECT payment_status, invoice_id
      FROM payment_transactions
      WHERE order_id = o.id
      ORDER BY created_at DESC
      LIMIT 1
    ) pt ON true
    WHERE
      (search_param IS NULL OR 
        o.id::text ILIKE '%' || search_param || '%' OR
        p.email ILIKE '%' || search_param || '%' OR
        p.username ILIKE '%' || search_param || '%' OR
        o.user_id ILIKE '%' || search_param || '%')
      AND (status_filter IS NULL OR o.status = status_filter)
      AND (payment_status_filter IS NULL OR pt.payment_status = payment_status_filter)
      AND (delivery_status_filter IS NULL OR o.delivery_status = delivery_status_filter)
      AND (date_from IS NULL OR o.created_at >= date_from)
      AND (date_to IS NULL OR o.created_at <= date_to)
      AND (min_amount IS NULL OR o.amount >= min_amount)
      AND (max_amount IS NULL OR o.amount <= max_amount)
  ),
  counted AS (
    SELECT COUNT(*) as total FROM filtered_orders
  )
  SELECT 
    fo.*,
    c.total
  FROM filtered_orders fo
  CROSS JOIN counted c
  ORDER BY fo.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_order_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_filtered_orders TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.delivery_status IS 'Digital goods delivery status: pending, processing, delivered, failed';
COMMENT ON FUNCTION public.get_order_details IS 'Get complete order details including products, files, payments, and audit logs';
COMMENT ON FUNCTION public.get_filtered_orders IS 'Get filtered orders with customer and payment information';
