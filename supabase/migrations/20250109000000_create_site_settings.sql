-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE INDEX idx_site_settings_is_public ON site_settings(is_public);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage all settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Everyone can read public settings
CREATE POLICY "Anyone can read public settings"
  ON site_settings
  FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

-- Create updated_at trigger
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding assets
CREATE POLICY "Super admins can upload branding assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'branding-assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update branding assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'branding-assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete branding assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'branding-assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can view branding assets"
  ON storage.objects
  FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'branding-assets');

-- Seed default settings
INSERT INTO site_settings (key, value, category, is_public) VALUES
  ('general', '{
    "site_name_en": "Digital Store",
    "site_name_ru": "Цифровой магазин",
    "contact_email": "",
    "contact_phone": "",
    "social_links": {
      "facebook": "",
      "twitter": "",
      "instagram": "",
      "telegram": "",
      "vk": ""
    }
  }', 'general', true),
  
  ('branding', '{
    "logo_url": "",
    "favicon_url": "",
    "primary_color": "#000000",
    "secondary_color": "#ffffff"
  }', 'branding', true),
  
  ('payments', '{
    "cryptocloud_shop_id": "",
    "cryptocloud_api_key": "",
    "mode": "test",
    "default_currency": "USD",
    "enabled": false
  }', 'payments', false),
  
  ('email', '{
    "resend_api_key": "",
    "sender_email": "",
    "sender_name": "",
    "template_ids": {
      "welcome": "",
      "password_reset": "",
      "order_confirmation": "",
      "order_shipped": ""
    }
  }', 'email', false),
  
  ('language', '{
    "active_locales": ["en", "ru"],
    "default_language": "en"
  }', 'language', true)
ON CONFLICT (key) DO NOTHING;

-- Create RPC function to get all settings (filtered by permissions)
CREATE OR REPLACE FUNCTION get_site_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_super_admin boolean;
  result jsonb;
BEGIN
  -- Check if user is super admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  ) INTO is_super_admin;

  -- Return all settings for super admins, only public for others
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM site_settings
  WHERE is_super_admin OR is_public = true;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Create RPC function to update settings (super admin only)
CREATE OR REPLACE FUNCTION update_site_setting(
  _key text,
  _value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Update the setting
  UPDATE site_settings
  SET 
    value = _value,
    updated_by = auth.uid(),
    updated_at = now()
  WHERE key = _key
  RETURNING value INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Setting not found: %', _key;
  END IF;

  -- Log the action
  INSERT INTO audit_logs (
    user_id,
    entity_type,
    entity_id,
    action_type,
    details
  ) VALUES (
    auth.uid(),
    'settings',
    _key,
    'updated',
    jsonb_build_object(
      'key', _key,
      'updated_at', now()
    )
  );

  RETURN result;
END;
$$;

-- Create RPC function to get public settings (for storefront)
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM site_settings
  WHERE is_public = true;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
