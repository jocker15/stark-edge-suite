-- =========================================================================
-- Migration: Extend Products Schema
-- Description: Add comprehensive product fields, supporting tables, and backfill existing data
-- =========================================================================

-- Create enums for product status and digital delivery type
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE digital_delivery_type AS ENUM ('storage', 'external');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =========================================================================
-- Step 1: Extend products table with new columns
-- =========================================================================

-- Add slug column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add old_price column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS old_price numeric(10, 2);

-- Add tags column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add main_image_url column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS main_image_url text;

-- Add gallery_urls column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb;

-- Add digital delivery columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS digital_delivery_type digital_delivery_type;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS digital_external_url text;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS digital_link_expires_in_hours integer;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS digital_max_downloads integer;

-- Add updated_at column with trigger
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add category_id for future product_categories FK (nullable for now)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id integer;

-- =========================================================================
-- Step 2: Modify existing columns
-- =========================================================================

-- Drop the old status check constraint if it exists
DO $$ 
BEGIN
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Add new status column with enum type (temporary column)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status_new product_status DEFAULT 'published';

-- Migrate data from old status to new status
UPDATE public.products 
SET status_new = CASE 
  WHEN status = 'active' THEN 'published'::product_status
  WHEN status = 'draft' THEN 'draft'::product_status
  WHEN status = 'archived' THEN 'archived'::product_status
  ELSE 'published'::product_status
END
WHERE status_new IS NULL OR status IS NOT NULL;

-- Drop old status column and rename new one
ALTER TABLE public.products DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE public.products RENAME COLUMN status_new TO status;

-- Ensure status has default and not null
ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'published'::product_status;
ALTER TABLE public.products ALTER COLUMN status SET NOT NULL;

-- =========================================================================
-- Step 3: Create slugify function for generating slugs
-- =========================================================================

CREATE OR REPLACE FUNCTION slugify(text_to_slug text) 
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Convert to lowercase
  result := lower(text_to_slug);
  
  -- Replace spaces and special characters with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  
  -- Ensure slug is not empty
  IF result = '' THEN
    result := 'product';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================================================
-- Step 4: Backfill existing data
-- =========================================================================

-- Generate SKU for products without one
UPDATE public.products 
SET sku = 'PROD-' || id::text
WHERE sku IS NULL OR sku = '';

-- Generate slug from name_en (with uniqueness handling)
DO $$
DECLARE
  product_record RECORD;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR product_record IN SELECT id, name_en FROM public.products WHERE slug IS NULL LOOP
    base_slug := slugify(COALESCE(product_record.name_en, 'product-' || product_record.id));
    final_slug := base_slug;
    counter := 1;
    
    -- Ensure uniqueness by appending counter if needed
    WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = final_slug AND id != product_record.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE public.products SET slug = final_slug WHERE id = product_record.id;
  END LOOP;
END $$;

-- Set main_image_url from first image in image_urls if available
UPDATE public.products
SET main_image_url = (image_urls->0)::text
WHERE main_image_url IS NULL 
  AND image_urls IS NOT NULL 
  AND jsonb_array_length(image_urls) > 0;

-- Migrate image_urls to gallery_urls
UPDATE public.products
SET gallery_urls = image_urls
WHERE gallery_urls = '[]'::jsonb
  AND image_urls IS NOT NULL 
  AND image_urls != 'null'::jsonb;

-- Set digital_delivery_type based on existing file_url/external_url
UPDATE public.products
SET digital_delivery_type = CASE
  WHEN file_url IS NOT NULL AND file_url != '' THEN 'storage'::digital_delivery_type
  WHEN external_url IS NOT NULL AND external_url != '' THEN 'external'::digital_delivery_type
  ELSE NULL
END
WHERE digital_delivery_type IS NULL;

-- Migrate external_url to digital_external_url
UPDATE public.products
SET digital_external_url = external_url
WHERE digital_external_url IS NULL 
  AND external_url IS NOT NULL 
  AND external_url != '';

-- Migrate download_limit to digital_max_downloads
UPDATE public.products
SET digital_max_downloads = download_limit
WHERE digital_max_downloads IS NULL 
  AND download_limit IS NOT NULL;

-- Set updated_at to created_at for existing products
UPDATE public.products
SET updated_at = created_at
WHERE updated_at IS NULL;

-- =========================================================================
-- Step 5: Add constraints after backfill
-- =========================================================================

-- Make sku NOT NULL and ensure uniqueness
ALTER TABLE public.products 
ALTER COLUMN sku SET NOT NULL;

-- Add index for slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Add index for status
DROP INDEX IF EXISTS idx_products_status;
CREATE INDEX idx_products_status ON public.products(status);

-- Add index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);

-- Add index for category_id (for future FK)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- =========================================================================
-- Step 6: Create/Update product_files table
-- =========================================================================

-- Add missing columns to product_files if they don't exist
ALTER TABLE public.product_files 
ADD COLUMN IF NOT EXISTS storage_path text;

ALTER TABLE public.product_files 
ADD COLUMN IF NOT EXISTS checksum text;

-- Backfill storage_path from file_path if needed
UPDATE public.product_files
SET storage_path = file_path
WHERE storage_path IS NULL AND file_path IS NOT NULL;

-- =========================================================================
-- Step 7: Create product_localizations table (placeholder for future)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.product_localizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en', 'ru')),
  name text,
  description text,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, locale)
);

-- Add indexes for product_localizations
CREATE INDEX IF NOT EXISTS idx_product_localizations_product_id ON public.product_localizations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_localizations_locale ON public.product_localizations(locale);

-- Enable RLS on product_localizations
ALTER TABLE public.product_localizations ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_localizations (same as products - public read, admin write)
CREATE POLICY "Public can view product localizations"
ON public.product_localizations FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product localizations"
ON public.product_localizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update product localizations"
ON public.product_localizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete product localizations"
ON public.product_localizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =========================================================================
-- Step 8: Create updated_at trigger
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to products table
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to product_localizations table
DROP TRIGGER IF EXISTS update_product_localizations_updated_at ON public.product_localizations;
CREATE TRIGGER update_product_localizations_updated_at
  BEFORE UPDATE ON public.product_localizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to product_files table
ALTER TABLE public.product_files 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS update_product_files_updated_at ON public.product_files;
CREATE TRIGGER update_product_files_updated_at
  BEFORE UPDATE ON public.product_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Step 9: Update RLS policies for products table
-- =========================================================================

-- Drop existing policies and recreate with new column access
DROP POLICY IF EXISTS "Public users can view published products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Public read access (only published products for non-admins)
CREATE POLICY "Public can view published products"
ON public.products FOR SELECT
USING (
  status = 'published'::product_status 
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin write access
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =========================================================================
-- Step 10: Add comments for documentation
-- =========================================================================

COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN public.products.slug IS 'URL-friendly identifier generated from product name';
COMMENT ON COLUMN public.products.status IS 'Product visibility status: draft, published, or archived';
COMMENT ON COLUMN public.products.old_price IS 'Original price for displaying discounts';
COMMENT ON COLUMN public.products.tags IS 'Array of tags for product categorization and search';
COMMENT ON COLUMN public.products.main_image_url IS 'Primary product image URL';
COMMENT ON COLUMN public.products.gallery_urls IS 'JSON array of additional product images';
COMMENT ON COLUMN public.products.digital_delivery_type IS 'How digital product is delivered: storage or external link';
COMMENT ON COLUMN public.products.digital_external_url IS 'External URL for digital product delivery';
COMMENT ON COLUMN public.products.digital_link_expires_in_hours IS 'Hours until download link expires';
COMMENT ON COLUMN public.products.digital_max_downloads IS 'Maximum number of downloads allowed per purchase';
COMMENT ON COLUMN public.products.category_id IS 'Foreign key to product_categories (to be implemented)';
COMMENT ON COLUMN public.products.updated_at IS 'Timestamp of last update, automatically maintained';

COMMENT ON TABLE public.product_files IS 'Stores multiple file attachments per product';
COMMENT ON TABLE public.product_localizations IS 'Future: stores product translations for multiple languages';

-- =========================================================================
-- Migration Complete
-- =========================================================================
