-- Add document_type and country columns to products table
ALTER TABLE public.products 
ADD COLUMN document_type text,
ADD COLUMN country text;

-- Create indexes for better performance
CREATE INDEX idx_products_document_type ON public.products(document_type);
CREATE INDEX idx_products_country ON public.products(country);
CREATE INDEX idx_products_category_document_type_country ON public.products(category, document_type, country);