# Deployment Guide for Stark Edge Suite

## Critical Fix for Admin Panel Access on Production

### Issue
The admin panel was returning 404 errors in production due to a missing RLS (Row Level Security) policy on the `user_roles` table. Users couldn't view their own roles, which prevented the authentication flow from working correctly.

### Solution
A new migration has been created: `20250110000000_fix_user_roles_rls_policy.sql`

This migration adds a critical RLS policy:
```sql
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);
```

## Deployment Steps for Vercel

### 1. Database Migration
Before deploying the frontend, ensure the database migration is applied:

```bash
# If using Supabase CLI locally
npx supabase db push

# Or apply the migration directly in Supabase Dashboard:
# Go to SQL Editor and run the contents of:
# supabase/migrations/20250110000000_fix_user_roles_rls_policy.sql
```

### 2. Environment Variables on Vercel

Ensure the following environment variables are set in your Vercel project settings:

**Required Frontend Variables:**
- `VITE_SUPABASE_URL` = `https://kpuqqqaqiwxbjpbmmcfz.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXFxcWFxaXd4YmpwYm1tY2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NzMyODUsImV4cCI6MjA3NDU0OTI4NX0.Rz_doNu-rxhq_-ixaTcSW_hZGeAhh4zWBqwfrmKErVc`

**Optional Backend Variables (if using server.ts endpoints):**
- `SUPABASE_URL` = `https://kpuqqqaqiwxbjpbmmcfz.supabase.co`
- `SUPABASE_SERVICE_KEY` = Your service role key (from Supabase dashboard)
- `CRYPTOCLOUD_SECRET` = Your CryptoCloud secret
- `RESEND_API_KEY` = Your Resend API key

### 3. Vercel Build Settings

In your Vercel project settings, ensure:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy

Push your changes to the main branch:

```bash
git add .
git commit -m "Fix admin panel access with user_roles RLS policy"
git push origin main
```

Vercel will automatically deploy the changes.

## Testing Admin Access

1. Visit your production URL: https://stark-edge-suite.vercel.app
2. Sign in with your admin account
3. Navigate to `/admin` - you should now see the admin panel
4. Verify all admin features work:
   - Products management
   - Orders management
   - Users management
   - Reviews moderation
   - Dashboard analytics
   - Security center
   - Settings (super admin only)

## Troubleshooting

### Admin panel still returns 404
- Check browser console for errors
- Verify environment variables are set correctly in Vercel
- Check that the migration was applied in Supabase
- Verify the user has an entry in the `user_roles` table with role `admin` or `super_admin`

### User can't see admin panel
Check the user's roles in Supabase:
```sql
SELECT * FROM public.user_roles WHERE user_id = 'your-user-id';
```

If no roles exist, add them:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

### Environment variables not loading
- Ensure variables start with `VITE_` for frontend access
- Redeploy after adding variables
- Check Vercel deployment logs for environment variable issues

## Key Changes Made

1. **Fixed Supabase client configuration** (`src/integrations/supabase/client.ts`):
   - Now reads from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables
   - Includes fallback values for development

2. **Added critical RLS policy** (`supabase/migrations/20250110000000_fix_user_roles_rls_policy.sql`):
   - Users can now view their own roles
   - Maintains security by only allowing role management by super admins

3. **Updated documentation**:
   - Created this deployment guide
   - Documented environment variables requirements

## Security Notes

- The `user_roles` table RLS policies are now properly configured:
  - Users can view their own roles (SELECT)
  - Only super admins can manage roles (INSERT, UPDATE, DELETE)
  - Admins can view all roles
- Never expose the `SUPABASE_SERVICE_KEY` in frontend code
- Keep API keys and secrets in Vercel environment variables, not in the codebase

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Check Supabase logs for backend errors
4. Verify all environment variables are set correctly
