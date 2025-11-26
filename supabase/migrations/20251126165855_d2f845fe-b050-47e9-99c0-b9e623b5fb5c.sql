
-- =====================================================
-- Migration: Fix RLS policies and add missing product fields
-- =====================================================

-- 1. Add missing fields to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS is_digital boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS old_price numeric,
  ADD COLUMN IF NOT EXISTS download_limit integer,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS external_url text;

-- 2. Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 3. Create has_role_hierarchy function for role inheritance
-- admin > moderator > user
CREATE OR REPLACE FUNCTION public.has_role_hierarchy(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        -- Admin has all permissions
        (role = 'admin'::app_role) OR
        -- If checking for moderator, allow admin and moderator
        (_min_role = 'moderator'::app_role AND role IN ('admin'::app_role, 'moderator'::app_role)) OR
        -- If checking for user, allow all roles
        (_min_role = 'user'::app_role AND role IN ('admin'::app_role, 'moderator'::app_role, 'user'::app_role))
      )
  )
$$;

-- 4. Fix storage policies for product-images bucket
-- Drop old policies that use profiles.role
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create new policies using has_role()
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Add comment for documentation
COMMENT ON FUNCTION public.has_role_hierarchy IS 'Check if user has specified role or higher in hierarchy: admin > moderator > user';
COMMENT ON COLUMN public.products.status IS 'Product status: active, draft, archived';
COMMENT ON COLUMN public.products.is_digital IS 'True if product is digital download';
COMMENT ON COLUMN public.products.slug IS 'URL-friendly product identifier';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique product code';
