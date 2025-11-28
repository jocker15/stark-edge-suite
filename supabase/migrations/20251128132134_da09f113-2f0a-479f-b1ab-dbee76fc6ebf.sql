-- Create site_settings table with JSONB fields for each category
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  general jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  payments jsonb NOT NULL DEFAULT '{}'::jsonb,
  email jsonb NOT NULL DEFAULT '{}'::jsonb,
  language jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO public.site_settings (general, branding, payments, email, language)
VALUES (
  '{"site_name_en": "My Store", "site_name_ru": "Мой магазин", "contact_email": "", "contact_phone": "", "social_links": {"facebook": "", "twitter": "", "instagram": "", "telegram": "", "vk": ""}}'::jsonb,
  '{"logo_url": "", "favicon_url": "", "primary_color": "#000000", "secondary_color": "#ffffff"}'::jsonb,
  '{"cryptocloud_shop_id": "", "cryptocloud_api_key": "", "mode": "test", "default_currency": "USD", "enabled": false}'::jsonb,
  '{"resend_api_key": "", "sender_email": "", "sender_name": "", "template_ids": {"welcome": "", "password_reset": "", "order_confirmation": "", "order_shipped": ""}}'::jsonb,
  '{"active_locales": ["en", "ru"], "default_language": "en"}'::jsonb
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (we'll filter sensitive data via RPC)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create RPC to get public settings (excludes payments and email with API keys)
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'general', general,
    'branding', branding,
    'language', language
  )
  FROM public.site_settings
  LIMIT 1;
$$;

-- Grant execute to all
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;