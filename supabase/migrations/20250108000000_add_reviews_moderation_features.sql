-- Add moderation fields to reviews table
ALTER TABLE public.reviews
ADD COLUMN reply_text TEXT,
ADD COLUMN reply_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN is_unread BOOLEAN DEFAULT TRUE,
ADD COLUMN rejection_reason TEXT;

-- Create index for unread reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_unread ON public.reviews(is_unread) WHERE is_unread = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_by ON public.reviews(moderated_by);

-- Update RLS policies for reviews - Allow moderators to update/delete
DROP POLICY IF EXISTS "Admins and moderators can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Admins and moderators can update reviews"
ON public.reviews
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id AND status != 'approved');

CREATE POLICY "Admins and moderators can delete reviews"
ON public.reviews
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create RPC function to get filtered reviews with pagination
CREATE OR REPLACE FUNCTION public.get_filtered_reviews(
  p_status TEXT DEFAULT NULL,
  p_min_rating INTEGER DEFAULT NULL,
  p_max_rating INTEGER DEFAULT NULL,
  p_product_id BIGINT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_order_by TEXT DEFAULT 'created_at',
  p_order_dir TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  product_id BIGINT,
  user_id UUID,
  rating INTEGER,
  comment TEXT,
  status TEXT,
  reply_text TEXT,
  reply_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID,
  is_unread BOOLEAN,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  product_name_en TEXT,
  product_name_ru TEXT,
  user_email TEXT,
  user_username TEXT,
  moderator_email TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sql_query TEXT;
  count_query TEXT;
  total_rows BIGINT;
BEGIN
  -- Check if user has moderator or admin role
  IF NOT (public.has_role(auth.uid(), 'moderator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: requires moderator or admin role';
  END IF;

  -- Build count query
  count_query := 'SELECT COUNT(*) FROM public.reviews r WHERE 1=1';
  
  IF p_status IS NOT NULL THEN
    count_query := count_query || ' AND r.status = ' || quote_literal(p_status);
  END IF;
  
  IF p_min_rating IS NOT NULL THEN
    count_query := count_query || ' AND r.rating >= ' || p_min_rating;
  END IF;
  
  IF p_max_rating IS NOT NULL THEN
    count_query := count_query || ' AND r.rating <= ' || p_max_rating;
  END IF;
  
  IF p_product_id IS NOT NULL THEN
    count_query := count_query || ' AND r.product_id = ' || p_product_id;
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    count_query := count_query || ' AND (r.comment ILIKE ' || quote_literal('%' || p_search || '%') || 
                   ' OR EXISTS (SELECT 1 FROM public.profiles prof WHERE prof.user_id = r.user_id AND ' ||
                   '(prof.email ILIKE ' || quote_literal('%' || p_search || '%') || 
                   ' OR prof.username ILIKE ' || quote_literal('%' || p_search || '%') || ')))';
  END IF;
  
  -- Execute count query
  EXECUTE count_query INTO total_rows;

  -- Build main query
  sql_query := 'SELECT 
    r.id,
    r.product_id,
    r.user_id,
    r.rating,
    r.comment,
    r.status,
    r.reply_text,
    r.reply_at,
    r.moderated_by,
    r.is_unread,
    r.rejection_reason,
    r.created_at,
    r.updated_at,
    p.name_en as product_name_en,
    p.name_ru as product_name_ru,
    prof.email as user_email,
    prof.username as user_username,
    mod_prof.email as moderator_email,
    ' || total_rows || '::BIGINT as total_count
  FROM public.reviews r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN public.profiles prof ON prof.user_id = r.user_id
  LEFT JOIN public.profiles mod_prof ON mod_prof.user_id = r.moderated_by
  WHERE 1=1';
  
  IF p_status IS NOT NULL THEN
    sql_query := sql_query || ' AND r.status = ' || quote_literal(p_status);
  END IF;
  
  IF p_min_rating IS NOT NULL THEN
    sql_query := sql_query || ' AND r.rating >= ' || p_min_rating;
  END IF;
  
  IF p_max_rating IS NOT NULL THEN
    sql_query := sql_query || ' AND r.rating <= ' || p_max_rating;
  END IF;
  
  IF p_product_id IS NOT NULL THEN
    sql_query := sql_query || ' AND r.product_id = ' || p_product_id;
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    sql_query := sql_query || ' AND (r.comment ILIKE ' || quote_literal('%' || p_search || '%') || 
                 ' OR prof.email ILIKE ' || quote_literal('%' || p_search || '%') || 
                 ' OR prof.username ILIKE ' || quote_literal('%' || p_search || '%') || ')';
  END IF;
  
  -- Add ordering
  IF p_order_by = 'created_at' THEN
    sql_query := sql_query || ' ORDER BY r.created_at ' || p_order_dir;
  ELSIF p_order_by = 'rating' THEN
    sql_query := sql_query || ' ORDER BY r.rating ' || p_order_dir;
  ELSIF p_order_by = 'status' THEN
    sql_query := sql_query || ' ORDER BY r.status ' || p_order_dir;
  ELSE
    sql_query := sql_query || ' ORDER BY r.created_at DESC';
  END IF;
  
  -- Add pagination
  sql_query := sql_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;
  
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- Create function to get unread reviews count
CREATE OR REPLACE FUNCTION public.get_unread_reviews_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reviews
  WHERE is_unread = TRUE
    AND status = 'pending';
$$;

-- Add audit trigger for reviews table
DROP TRIGGER IF EXISTS audit_reviews_changes ON public.reviews;

CREATE TRIGGER audit_reviews_changes
AFTER UPDATE ON public.reviews
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status 
      OR OLD.reply_text IS DISTINCT FROM NEW.reply_text
      OR OLD.moderated_by IS DISTINCT FROM NEW.moderated_by)
EXECUTE FUNCTION public.audit_log_trigger();
