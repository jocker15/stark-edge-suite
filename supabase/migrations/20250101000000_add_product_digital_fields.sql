-- Add SKU, status, currency and digital product fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku text UNIQUE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'RUB')),
ADD COLUMN IF NOT EXISTS is_digital boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS download_limit integer,
ADD COLUMN IF NOT EXISTS state text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_state ON public.products(state);

-- Create product_files table for storing multiple files per product
CREATE TABLE IF NOT EXISTS public.product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for product_files
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON public.product_files(product_id);

-- Enable RLS on product_files
ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;

-- Policies for product_files
CREATE POLICY "Public can view product files"
ON public.product_files FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product files"
ON public.product_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update product files"
ON public.product_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete product files"
ON public.product_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create storage bucket for digital products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  false, -- Private bucket, only authenticated users can download
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed', 
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for digital-products bucket
CREATE POLICY "Admins can upload digital product files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update digital product files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete digital product files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'digital-products' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Authenticated users can download purchased product files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'digital-products' AND
  (
    -- Admins can view all files
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Users who purchased the product can view
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.profiles p ON p.user_id = o.user_id
      WHERE p.user_id = auth.uid()
      AND o.status = 'completed'
      AND o.order_details::jsonb->'items' @> jsonb_build_array(
        jsonb_build_object('id', (
          SELECT product_id::text 
          FROM public.product_files 
          WHERE file_path = storage.objects.name
          LIMIT 1
        ))
      )
    )
  )
);
