# Migration Notes: Extended Products Schema

## Migration: 20250115000000_extend_products_schema.sql

### Summary
This migration extends the products schema with comprehensive e-commerce fields, creates supporting tables for multi-file uploads and future localization, and includes data backfill for existing products.

### New Columns Added to `products` Table

#### Required Fields
- `sku` (text, unique, NOT NULL) - Stock Keeping Unit identifier
- `status` (enum: draft|published|archived, NOT NULL) - Product visibility status
- `updated_at` (timestamptz) - Auto-updated timestamp

#### Optional Fields
- `slug` (text, unique) - URL-friendly identifier
- `old_price` (numeric) - Original price for discount display
- `currency` (text, default: 'USD') - Product currency
- `state` (text) - State/region information
- `tags` (text[]) - Array of tags for categorization
- `main_image_url` (text) - Primary product image
- `gallery_urls` (jsonb) - Additional product images
- `category_id` (integer) - FK to future product_categories table

#### Digital Product Fields
- `digital_delivery_type` (enum: storage|external) - Delivery method
- `digital_external_url` (text) - External delivery URL
- `digital_link_expires_in_hours` (integer) - Download link expiration
- `digital_max_downloads` (integer) - Maximum download count

### New Tables Created

#### `product_files`
Multi-file attachment support for products.

Columns:
- `id` (uuid, primary key)
- `product_id` (integer, FK to products)
- `file_name` (text)
- `file_path` (text)
- `storage_path` (text)
- `file_size` (integer)
- `file_type` (text)
- `checksum` (text)
- `is_primary` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `product_localizations`
Placeholder table for future multi-language support.

Columns:
- `id` (uuid, primary key)
- `product_id` (integer, FK to products)
- `locale` (text, check: 'en' or 'ru')
- `name` (text)
- `description` (text)
- `meta_title` (text)
- `meta_description` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- UNIQUE constraint on (product_id, locale)

### Data Backfill

The migration automatically:
1. **Generates SKUs** for existing products using format: `PROD-{id}`
2. **Creates slugs** from product names using slugification function
3. **Migrates status** from old values (active → published)
4. **Sets main_image_url** from first image in image_urls
5. **Copies image_urls** to gallery_urls
6. **Migrates digital fields** from old to new columns
7. **Sets updated_at** to created_at for existing products

### Functions Added

#### `slugify(text_to_slug text)`
Converts text to URL-friendly slug:
- Converts to lowercase
- Replaces special characters with hyphens
- Removes leading/trailing hyphens
- Handles uniqueness with numeric suffixes

#### `update_updated_at_column()`
Trigger function that auto-updates `updated_at` timestamp on row updates.

### RLS Policies Updated

**Products Table:**
- Public read access for `published` products only
- Admins see all products regardless of status
- Admins have full CRUD access

**Product Files & Localizations:**
- Public read access
- Admin-only write access

### Indexes Created

- `idx_products_slug` - Unique index on slug
- `idx_products_status` - Index on status for filtering
- `idx_products_tags` - GIN index for array operations
- `idx_products_category_id` - Index for future category FK
- `idx_product_files_product_id` - Foreign key index
- `idx_product_localizations_product_id` - Foreign key index
- `idx_product_localizations_locale` - Locale filtering

### Breaking Changes

⚠️ **Status Enum Values Changed:**
- Old: `active`, `draft`, `archived`
- New: `draft`, `published`, `archived`
- Migration auto-converts: `active` → `published`

### Frontend Changes Required

✅ **Already Updated:**
- TypeScript types in `src/integrations/supabase/types.ts`
- CSV importer status values
- Edge function interfaces

⚠️ **TODO for Future Tickets:**
- Implement slug generation in product creation forms
- Add UI for managing tags
- Implement image gallery upload/management
- Add old_price display in product cards
- Category mapping when categories module is ready
- Digital delivery type selection in admin panel
- Download link expiration and tracking

### Edge Functions Updated

**`import-products-batch`:**
- Added new field support in ProductImport interface
- Added TODO comments for future implementation

**`import-csv-products`:**
- Added TODO comments for future field mapping

### Testing Checklist

- [ ] Migration runs cleanly on fresh database
- [ ] Existing products visible on storefront
- [ ] New products can be created with SKU auto-generation
- [ ] Product editing preserves all fields
- [ ] RLS policies enforce published-only visibility
- [ ] Admin can see draft/archived products
- [ ] CSV import still works
- [ ] TypeScript compilation succeeds
- [ ] Existing queries return expected results

### Rollback Plan

If rollback is needed:
1. Drop new columns from products table
2. Drop product_localizations table
3. Remove new columns from product_files
4. Restore old status enum values
5. Restore old TypeScript types

### Future Enhancements

The following features are prepared but not yet implemented:
1. Category hierarchy and FK constraint
2. Product localization UI
3. Advanced tag management
4. Image gallery upload widget
5. Digital delivery tracking
6. Download link expiration handling
7. Product variants/options
8. Inventory management improvements

### Notes

- All existing products set to `published` status
- Legacy columns (`file_url`, `external_url`, etc.) retained for backward compatibility
- Data migrated to new columns where applicable
- `image_urls` column still used alongside new `gallery_urls`
- `name_en`/`name_ru` fields still primary (localizations table for future expansion)
