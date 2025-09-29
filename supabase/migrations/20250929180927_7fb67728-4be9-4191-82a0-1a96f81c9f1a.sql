-- Add payment_details column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_details jsonb;