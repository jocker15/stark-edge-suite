# User Management Suite Documentation

## Overview

The User Management Suite is a comprehensive admin interface for managing users, roles, permissions, and user activities in the Dokument.shop platform. It provides a feature-rich data table, detailed user profiles, bulk operations, and email communication capabilities.

## Features

### 1. Users Data Table

**Location**: `src/components/admin/users/UsersDataTable.tsx`

The main data table displays all users with the following features:

#### Columns
- **ID**: Profile ID (numeric)
- **Email**: User's email address
- **Name**: Username
- **Role**: User roles (admin, moderator, user)
- **Status**: Active or Blocked
- **Registered**: Registration date (relative time)
- **Order Count**: Total number of orders
- **Total Spent**: Total amount spent across all orders
- **Last Login**: Last login timestamp (relative time)
- **Actions**: Quick access to view profile

#### Filtering & Search
- **Search**: By email or username
- **Status Filter**: All, Active, Blocked
- **Role Filter**: All, Admin, Moderator, User
- **Date Range**: Filter by registration date (from/to)
- **Column Visibility**: Show/hide columns as needed

#### Sorting
- Sort by email, registration date, order count, total spent
- Ascending/descending order

#### Pagination
- Client-side pagination
- Configurable page size
- Navigation controls

#### Bulk Actions
- **Block**: Block multiple users at once
- **Unblock**: Unblock multiple users
- **Export CSV**: Export selected users to CSV
- **Send Email**: Send bulk emails to selected users

### 2. User Profile Drawer

**Location**: `src/components/admin/users/UserProfileDrawer.tsx`

A comprehensive side drawer that displays detailed user information across 5 tabs:

#### Basic Info Tab
- User ID (UUID)
- Email address
- Username
- Phone number
- Role badges (admin, moderator, user)
- Status badge (active/blocked)
- Registration date
- Last login timestamp
- Total order count
- Total amount spent

#### Orders Tab
- List of all user orders
- Order ID, amount, status, date
- Click to jump to order detail page
- Empty state when no orders

#### Wishlist Tab
- Products in user's wishlist
- Product image, name (EN/RU), price
- Date added
- Empty state when wishlist is empty

#### Reviews Tab
- All reviews written by user
- Product name, rating (stars), comment
- Review status and date
- Empty state when no reviews

#### Support Tickets Tab
- Chat sessions associated with user
- Chat ID, status, visitor info
- Created and updated timestamps
- Empty state when no tickets

### 3. Admin Actions

#### Edit User
**Component**: `EditUserDialog.tsx`

- Edit username, email, phone
- Assign/remove roles (admin, moderator, user)
- Multi-role support
- Validation and error handling
- Audit log creation

#### Block/Unblock User
**Component**: `BlockUserDialog.tsx`

- Confirmation dialog
- Updates `is_blocked` flag
- Audit log creation
- Success/error notifications

#### Delete User
**Component**: `DeleteUserDialog.tsx`

- Warning about existing orders
- Requires typing "DELETE" to confirm
- Shows order count as safeguard
- Soft delete (preserves orders)
- Audit log creation

#### Send Email
**Component**: `SendEmailDialog.tsx`

- Template selection:
  - Custom
  - Welcome email
  - Password reset
  - Order update
- Subject and message editor
- HTML support in message body
- Single or bulk email sending
- Integration with Resend API
- Success/failure notifications

### 4. Database Schema

#### New Tables

**login_history**
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- login_at: TIMESTAMP
- ip_address: TEXT
- user_agent: TEXT
- created_at: TIMESTAMP
```

**profiles (enhanced)**
```sql
- phone: TEXT (new field)
```

#### Views

**user_stats**
```sql
SELECT
  p.user_id,
  p.id as profile_id,
  p.email,
  p.username,
  p.phone,
  p.avatar_url,
  p.role,
  p.is_blocked,
  p.created_at,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.amount) as total_spent,
  (SELECT login_at FROM login_history 
   WHERE user_id = p.user_id 
   ORDER BY login_at DESC LIMIT 1) as last_login
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.user_id
GROUP BY p.user_id, p.id, ...
```

#### RPC Functions

**get_user_orders_summary(target_user_id UUID)**
- Returns: order_id, amount, status, created_at, order_details, payment_details
- Security: Requires admin role or self-access
- Ordered by created_at DESC

**get_user_wishlist(target_user_id UUID)**
- Returns: wishlist_id, product_id, product names, price, image_urls, created_at
- Security: Requires admin role or self-access
- Ordered by created_at DESC

**get_user_reviews(target_user_id UUID)**
- Returns: review_id, product_id, product names, rating, comment, status, created_at
- Security: Requires admin role or self-access
- Ordered by created_at DESC

### 5. Edge Functions

**send-user-email**

**Location**: `supabase/functions/send-user-email/index.ts`

Handles email sending via Resend API:

```typescript
// Request body
{
  to: string[],        // Array of recipient emails
  subject: string,     // Email subject
  html: string,        // Email body (HTML)
  from?: string,       // Sender email (optional)
  template?: string    // Template type (optional)
}
```

**Features**:
- Admin authentication check
- Batch email sending
- Error handling per recipient
- Audit log creation
- Success/failure tracking

**Environment Variables**:
- `RESEND_API_KEY`: Resend API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key

### 6. RLS Policies

All admin operations require the `admin` role:

```sql
-- Profiles
- Admins can view all profiles
- Admins can update all profiles
- Admins can delete profiles

-- User Roles
- Admins can view all user roles
- Admins can insert user roles
- Admins can update user roles
- Admins can delete user roles

-- Orders, Wishlist, Reviews, Chat Sessions
- Admins can view all records

-- Login History
- Users can view their own history
- Admins can view all history
```

### 7. Translations

**Location**: `src/lib/translations/user-manager.ts`

Full EN/RU translations for:
- Table headers and columns
- Filter labels and options
- Action buttons
- Dialog titles and messages
- Form fields and validation
- Success/error notifications
- Empty states

**Usage**:
```typescript
import { getUserManagerTranslation } from "@/lib/translations/user-manager";
const t = (key: string) => getUserManagerTranslation(lang, key);
```

### 8. Bulk Operations

#### CSV Export
- Exports selected users to CSV file
- Includes all user data and statistics
- Filename includes timestamp
- Downloads automatically

**CSV Columns**:
- ID, User ID, Email, Username, Phone
- Role, Status, Registered, Last Login
- Order Count, Total Spent

#### Bulk Email
- Send same email to multiple users
- Template support
- HTML message support
- Progress tracking
- Success/failure reporting

#### Bulk Block/Unblock
- Confirmation dialog
- Updates multiple users at once
- Audit log for bulk operation
- Success notification with count

## Usage

### Integration with Admin Panel

In `src/pages/Admin.tsx`:

```typescript
import { AdminUsersNew } from "@/components/admin/users";

// In the component
<TabsContent value="users">
  <AdminUsersNew />
</TabsContent>
```

### Accessing User Management

1. Navigate to `/admin`
2. Must have `admin` role in `user_roles` table
3. Click on "Users" tab
4. View, search, filter, and manage users

### Creating a New User Action

1. Create dialog component in `src/components/admin/users/`
2. Add action to `UserProfileDrawer` actions section
3. Implement handler with Supabase call
4. Add audit log entry
5. Show toast notification
6. Refresh user data

## Security Considerations

### Authentication
- All operations require authenticated user
- Admin role check on every action
- Service role used in Edge Functions only

### Authorization
- RLS policies enforce admin-only access
- RPC functions validate requester role
- User can only view their own data (unless admin)

### Audit Logging
- All user modifications logged to `audit_logs`
- Includes: user_id, action_type, entity_id, details
- Bulk operations tracked separately

### Data Privacy
- Phone numbers stored securely
- Email addresses visible to admins only
- Login history protected by RLS
- User deletion preserves orders

## Responsive Design

- Mobile-first approach
- Drawer width: 100% on mobile, max-w-2xl on desktop
- Table: horizontal scroll on small screens
- Action buttons: wrap on smaller screens
- Filters: stack vertically on mobile

## Performance Optimization

### Data Loading
- View `user_stats` pre-aggregates statistics
- RPC functions use SECURITY DEFINER for performance
- Pagination reduces initial load

### Component Optimization
- React.memo for expensive components
- useCallback for stable function references
- Lazy loading of profile drawer

### Database Optimization
- Indexes on frequently queried columns
- Materialized view option for user_stats (if needed)
- Efficient JOINs in RPC functions

## Future Enhancements

- [ ] Advanced search (by ID, phone, order count range)
- [ ] User activity timeline
- [ ] Export user data (GDPR compliance)
- [ ] Bulk role assignment
- [ ] User suspension (temporary block with expiry)
- [ ] Email templates management UI
- [ ] Login history viewer in profile
- [ ] User merge/deduplication
- [ ] Custom fields for user profiles
- [ ] User groups/segments

## Troubleshooting

### Users not loading
- Check admin role in user_roles table
- Verify RLS policies are enabled
- Check browser console for errors

### Email not sending
- Verify RESEND_API_KEY in .env
- Check Edge Function logs
- Ensure valid email addresses

### Profile drawer not opening
- Check if user data exists in user_stats view
- Verify RPC functions are created
- Check for JavaScript errors

### Bulk actions failing
- Check network requests
- Verify admin permissions
- Check audit_logs table for errors

## Migration Guide

### From Old AdminUsers

The old `AdminUsers.tsx` component is replaced by the new suite. To migrate:

1. Database migration runs automatically
2. Import `AdminUsersNew` instead of `AdminUsers`
3. Update Admin.tsx to use new component
4. Test all user operations
5. Verify audit logs are being created

### Database Migration

Run the migration:
```sql
-- File: supabase/migrations/20250104000000_add_user_management_features.sql
-- This includes:
-- 1. Add phone field to profiles
-- 2. Create login_history table
-- 3. Create RLS policies for admin access
-- 4. Create user_stats view
-- 5. Create RPC functions for user data access
```

## Testing Checklist

- [ ] View users in data table
- [ ] Search and filter users
- [ ] Sort by different columns
- [ ] Toggle column visibility
- [ ] Select users (single and multiple)
- [ ] View user profile drawer
- [ ] Navigate through profile tabs
- [ ] Edit user information
- [ ] Assign/remove roles
- [ ] Block/unblock user
- [ ] Delete user (with confirmation)
- [ ] Send email (single user)
- [ ] Send bulk email (multiple users)
- [ ] Export users to CSV
- [ ] Bulk block/unblock users
- [ ] View orders from profile
- [ ] Jump to order detail
- [ ] Test responsive layout
- [ ] Verify translations (EN/RU)
- [ ] Check audit logs

## Support

For issues or questions about the User Management Suite:
1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Review database logs
5. Contact development team
