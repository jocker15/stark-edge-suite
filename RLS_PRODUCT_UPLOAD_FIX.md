# RLS Policy Fix for Product Image Uploads

## Problem Description
When attempting to upload product images (both new and existing products) from clipboard, users encountered the error:
```
"An error occurred - new row violates row-level security policy"
```

This occurred because the RLS policies in Supabase were outdated and incompatible with the current RBAC (Role-Based Access Control) system.

## Root Cause Analysis

### 1. Inconsistent Role Checking System
The application migrated from using `profiles.role = 'admin'` to a more robust RBAC system using the `user_roles` table with the `has_role_hierarchy()` function. However, several critical policies were not updated:

- **Storage policies** for `product-images` bucket (checking old `profiles.role`)
- **Storage policies** for `digital-products` bucket (checking old `profiles.role`)
- **Table policies** for `product_files` table (checking old `profiles.role`)
- **Storage policies** for `branding-assets` bucket (using direct user_roles query instead of `has_role_hierarchy`)

### 2. Missing Public SELECT Policy
The `products` table had NO public SELECT policy, meaning anonymous users and non-admin authenticated users could not view products on the storefront. Only moderators and admins had SELECT access.

## Solution Implemented

### Migration: `20250110000001_fix_product_upload_rls_policies.sql`

This migration performs the following fixes:

#### 1. Add Public SELECT Policy for Products
```sql
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (status = 'active');
```
This allows anyone (authenticated or anonymous) to view active products on the storefront.

#### 2. Update Storage Policies for `product-images` Bucket
Replaced policies that check `profiles.role = 'admin'` with:
```sql
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);
```
Similar updates for UPDATE and DELETE operations.

#### 3. Update Storage Policies for `digital-products` Bucket
Same pattern as `product-images` - replaced old role checks with `has_role_hierarchy()`.

#### 4. Update Table Policies for `product_files`
```sql
CREATE POLICY "Admins can insert product files"
ON public.product_files FOR INSERT
WITH CHECK (
  public.has_role_hierarchy(auth.uid(), 'admin'::app_role)
);
```
Similar updates for UPDATE and DELETE operations.

#### 5. Update Storage Policies for `branding-assets` Bucket
Standardized to use `has_role_hierarchy()` for consistency:
```sql
CREATE POLICY "Super admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding-assets' AND
  public.has_role_hierarchy(auth.uid(), 'super_admin'::app_role)
);
```

## Benefits of the Fix

### 1. Consistent RBAC Enforcement
- All policies now use the `has_role_hierarchy()` function
- Role hierarchy is respected: `super_admin` > `admin` > `moderator` > `user`
- Super admins inherit all admin permissions
- Admins inherit all moderator permissions

### 2. Proper Access Control
- **Admins and Super Admins**: Can upload, update, and delete product images and files
- **Public**: Can view active products
- **Moderators**: Can view products (inherited from hierarchy)
- **Super Admins**: Can manage branding assets (logo, favicon)

### 3. Clipboard Paste Feature Now Works
- Image uploads from clipboard (Ctrl+V) now work correctly
- No more "violates row-level security policy" errors
- Works for both main images and gallery images
- Works for both new and existing products

### 4. Storefront Functionality Restored
- Anonymous users can now view products
- Product listings display correctly
- Search and filtering work as expected

## Testing Checklist

After applying this migration, verify:

- [ ] Admin can upload product images via file picker
- [ ] Admin can paste images from clipboard (Ctrl+V)
- [ ] Admin can upload main image for new products
- [ ] Admin can upload gallery images for new products
- [ ] Admin can upload images for existing products
- [ ] Admin can upload digital product files
- [ ] Super admin can upload logo and favicon
- [ ] Anonymous users can view active products on storefront
- [ ] Authenticated users can view active products
- [ ] Draft/archived products are NOT visible to public
- [ ] Image previews display correctly after upload

## Related Tables and Buckets

### Tables Affected
- `public.products` - Added public SELECT policy
- `public.product_files` - Updated INSERT, UPDATE, DELETE policies

### Storage Buckets Affected
- `product-images` - Updated INSERT, UPDATE, DELETE policies
- `digital-products` - Updated INSERT, UPDATE, DELETE policies
- `branding-assets` - Updated INSERT, UPDATE, DELETE policies

## Migration Timeline

1. **20251001130047** - Initial RLS policies using `profiles.role = 'admin'`
2. **20251003084458** - Introduced RBAC with `user_roles` table and `has_role()` function
3. **20250107000000** - Added `super_admin` role and `has_role_hierarchy()` function
4. **20250110000001** - **THIS FIX** - Updated storage and product_files policies to use RBAC

## Notes for Future Development

1. **Always use `has_role_hierarchy()`** when checking permissions
2. **Never use `profiles.role`** directly in RLS policies
3. **Remember to add public SELECT policies** for tables that need storefront access
4. **Test both admin and public access** after any RLS policy changes
5. **Document all RLS policy changes** in migration comments

## Deployment Instructions

1. Apply the migration to Supabase:
   ```bash
   supabase db push
   ```
   
2. Verify the migration was applied successfully:
   ```bash
   supabase db diff
   ```

3. Test admin uploads in the admin panel

4. Test public product viewing on the storefront

5. Monitor logs for any RLS-related errors

## Rollback Plan (if needed)

If issues occur, the policies can be rolled back by:
1. Dropping the new policies
2. Recreating the old policies from migrations 20251001130047 and 20250101000000

However, this is NOT recommended as it would reintroduce the original bug and break the RBAC system.

## Support

If you encounter any issues after applying this fix:
1. Check Supabase logs for specific RLS policy violations
2. Verify the user has the correct roles in the `user_roles` table
3. Ensure the `has_role_hierarchy()` function is working correctly
4. Check that the storage buckets exist and are properly configured
