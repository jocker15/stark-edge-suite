-- Create product_categories table with hierarchical support
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_category_slug UNIQUE (slug),
  CONSTRAINT unique_category_name_en UNIQUE (name_en),
  CONSTRAINT unique_category_name_ru UNIQUE (name_ru)
);

-- Create index on parent_id for faster hierarchical queries
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);

-- Create index on sort_order for faster ordering
CREATE INDEX idx_product_categories_sort_order ON product_categories(sort_order);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to categories"
  ON product_categories FOR SELECT
  TO public
  USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins to manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_product_categories_updated_at();

-- Create audit trigger for categories
CREATE TRIGGER audit_product_categories
  AFTER INSERT OR UPDATE OR DELETE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_trigger();

-- Add category_id to products table (nullable for backward compatibility)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Create index on category_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create view to get product counts per category
CREATE OR REPLACE VIEW category_product_counts AS
SELECT 
  pc.id,
  pc.name_en,
  pc.name_ru,
  pc.slug,
  pc.description,
  pc.parent_id,
  pc.sort_order,
  pc.created_at,
  pc.updated_at,
  COUNT(p.id) FILTER (WHERE p.status = 'active') AS active_products_count,
  COUNT(p.id) AS total_products_count
FROM product_categories pc
LEFT JOIN products p ON p.category_id = pc.id
GROUP BY pc.id, pc.name_en, pc.name_ru, pc.slug, pc.description, pc.parent_id, pc.sort_order, pc.created_at, pc.updated_at;

-- Create RPC to get categories with product counts
CREATE OR REPLACE FUNCTION get_categories_with_counts()
RETURNS TABLE (
  id UUID,
  name_en TEXT,
  name_ru TEXT,
  slug TEXT,
  description TEXT,
  parent_id UUID,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  active_products_count BIGINT,
  total_products_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM category_product_counts
  ORDER BY sort_order ASC, name_en ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC to update category sort orders in bulk
CREATE OR REPLACE FUNCTION update_category_sort_orders(category_orders JSONB)
RETURNS VOID AS $$
DECLARE
  category_record JSONB;
BEGIN
  FOR category_record IN SELECT * FROM jsonb_array_elements(category_orders)
  LOOP
    UPDATE product_categories
    SET sort_order = (category_record->>'sort_order')::INTEGER
    WHERE id = (category_record->>'id')::UUID;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC to check if category can be deleted (has no products)
CREATE OR REPLACE FUNCTION can_delete_category(category_id_param UUID)
RETURNS TABLE (
  can_delete BOOLEAN,
  product_count BIGINT,
  child_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (COUNT(p.id) = 0 AND COUNT(pc.id) = 0) AS can_delete,
    COUNT(p.id) AS product_count,
    COUNT(pc.id) AS child_count
  FROM product_categories main_cat
  LEFT JOIN products p ON p.category_id = main_cat.id
  LEFT JOIN product_categories pc ON pc.parent_id = main_cat.id
  WHERE main_cat.id = category_id_param
  GROUP BY main_cat.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC to reassign products to another category
CREATE OR REPLACE FUNCTION reassign_products_category(
  from_category_id UUID,
  to_category_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE products
  SET category_id = to_category_id
  WHERE category_id = from_category_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default categories
INSERT INTO product_categories (name_en, name_ru, slug, description, sort_order) VALUES
  ('Game Accounts', 'Игровые аккаунты', 'game-accounts', 'Verified game accounts for popular games', 1),
  ('Digital Templates', 'Цифровые шаблоны', 'digital-templates', 'Professional digital document templates', 2),
  ('Verifications', 'Верификации', 'verifications', 'Identity and document verification services', 3),
  ('Software Licenses', 'Лицензии ПО', 'software-licenses', 'Software and application licenses', 4),
  ('Educational', 'Образовательные', 'educational', 'Educational materials and courses', 5),
  ('Other', 'Другое', 'other', 'Other digital products and services', 6)
ON CONFLICT DO NOTHING;

-- Update existing products to use category_id based on old category field
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'Digital Template' AND pc.slug = 'digital-templates';

UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'game-accounts' AND pc.slug = 'game-accounts';

UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'verifications' AND pc.slug = 'verifications';

UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'software-licenses' AND pc.slug = 'software-licenses';

UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'educational' AND pc.slug = 'educational';

UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = 'other' AND pc.slug = 'other';
