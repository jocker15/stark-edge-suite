-- Fix RLS policies for product image uploads and product_files table
-- This migration updates storage policies and product_files policies to use the new RBAC system
-- Also adds missing public SELECT policy for products table

-- Add public SELECT policy for products (required for storefront)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (status = 'active');

-- Update storage policies for product-images bucket
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Create new policies using has_role_hierarchy
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

-- Update storage policies for digital-products bucket
DROP POLICY IF EXISTS "Admins can upload digital product files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update digital product files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete digital product files" ON storage.objects;

CREATE POLICY "Admins can upload digital product files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'digital-products' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update digital product files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'digital-products' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete digital product files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'digital-products' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

-- Update product_files table policies
DROP POLICY IF EXISTS "Admins can insert product files" ON public.product_files;
DROP POLICY IF EXISTS "Admins can update product files" ON public.product_files;
DROP POLICY IF EXISTS "Admins can delete product files" ON public.product_files;

CREATE POLICY "Admins can insert product files"
ON public.product_files FOR INSERT
WITH CHECK (
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update product files"
ON public.product_files FOR UPDATE
USING (
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete product files"
ON public.product_files FOR DELETE
USING (
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);

-- Update storage policies for branding-assets bucket (consistency with RBAC system)
DROP POLICY IF EXISTS "Super admins can upload branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete branding assets" ON storage.objects;

CREATE POLICY "Super admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding-assets' AND
  public.has_role_hierarchy(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding-assets' AND
  public.has_role_hierarchy(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding-assets' AND
  public.has_role_hierarchy(auth.uid(), 'super_admin'::app_role)
);

-- Add comments for documentation
COMMENT ON POLICY "Admins can upload product images" ON storage.objects IS 'Allows admins and super_admins to upload product images to product-images bucket';
COMMENT ON POLICY "Admins can upload digital product files" ON storage.objects IS 'Allows admins and super_admins to upload digital product files to digital-products bucket';
COMMENT ON POLICY "Admins can insert product files" ON public.product_files IS 'Allows admins and super_admins to insert product file records';
COMMENT ON POLICY "Super admins can upload branding assets" ON storage.objects IS 'Allows super_admins to upload branding assets (logo, favicon) to branding-assets bucket';
