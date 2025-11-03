# Security RBAC Center - Testing Guide

This document provides a comprehensive guide for testing the Security RBAC Center implementation.

## Overview

The Security RBAC Center implements a hierarchical role-based access control system with the following features:

- **Role Hierarchy**: super_admin > admin > moderator > user
- **Login Activity Monitoring**: Track all user login attempts
- **Audit Logs**: Comprehensive audit trail for all admin actions
- **Role Management**: Assign/revoke roles with safeguards

## Database Changes

### Migrations Applied

1. **20250107000000_add_security_rbac_enhancements.sql**
   - Extended `app_role` enum with `super_admin`
   - Created `has_role_hierarchy()` function for hierarchical role checks
   - Updated `has_role()` to use hierarchy
   - Created `login_events` table for login tracking
   - Created `audit_log_trigger()` for automatic change tracking
   - Added triggers on products, orders, profiles, user_roles
   - Created RPCs: `get_login_events`, `get_audit_logs`, `log_login_event`
   - Updated RLS policies for role-based access

2. **20250107000001_seed_super_admin.sql**
   - Seeds initial super admin from first admin user

### Role Hierarchy

```
super_admin (Level 4)
  ├── Full system access
  ├── Manage all roles
  ├── View audit logs
  └── Access security center
  
admin (Level 3)
  ├── Manage products
  ├── Manage orders
  ├── Manage users
  ├── View login events
  └── Access dashboard
  
moderator (Level 2)
  ├── Moderate reviews
  └── View approved reviews
  
user (Level 1)
  └── Standard user access
```

### Permissions Matrix

| Permission | super_admin | admin | moderator | user |
|------------|-------------|-------|-----------|------|
| Manage Products | ✓ | ✓ | ✗ | ✗ |
| Manage Orders | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✗ | ✗ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ | ✗ |
| View Login Events | ✓ | ✓ | ✗ | ✗ |
| Moderate Reviews | ✓ | ✓ | ✓ | ✗ |
| Access Dashboard | ✓ | ✓ | ✗ | ✗ |
| Access Security Center | ✓ | ✓ | ✗ | ✗ |

## Testing Procedures

### 1. Database Setup

#### Apply Migrations

```bash
# Run Supabase migrations
supabase migration up
```

#### Verify Role Hierarchy

```sql
-- Check app_role enum
SELECT unnest(enum_range(NULL::app_role));

-- Expected output:
-- super_admin
-- admin
-- moderator
-- user

-- Test role hierarchy function
SELECT has_role_hierarchy('USER_ID_HERE', 'admin'::app_role);
```

#### Create Test Users

```sql
-- Create users with different roles
INSERT INTO public.user_roles (user_id, role) VALUES
  ('SUPER_ADMIN_USER_ID', 'super_admin'),
  ('ADMIN_USER_ID', 'admin'),
  ('MODERATOR_USER_ID', 'moderator');
```

### 2. Frontend Testing

#### Login Activity Monitoring

1. Navigate to `/admin/security` (requires admin role)
2. Select "Login Activity" tab
3. Verify:
   - Login events are displayed
   - Filters work (status, date range)
   - Export CSV functionality
   - Pagination works correctly

**Test Filters:**
- Status: Filter by success/failed/blocked
- Date Range: Filter by date range
- Search: Search by email

**Expected Behavior:**
- Only admins and super admins can view
- Shows user email, IP address, status, timestamp
- Can export to CSV
- Supports pagination

#### Audit Logs

1. Navigate to `/admin/security`
2. Select "Audit Logs" tab
3. Verify:
   - Audit logs are displayed
   - Filters work (entity type, action type, search)
   - Details dialog shows full change information
   - Export CSV functionality

**Test Filters:**
- Entity Type: product, order, user, profile, user_roles, review
- Action Type: created, updated, deleted
- Search: Search by entity ID, action type, or user email
- Date Range: Filter by date

**Expected Behavior:**
- Only super admins can view audit logs
- Shows user, action, entity, timestamp
- View details dialog shows full JSON diff
- Can export to CSV

#### Role Management

1. Navigate to `/admin/security`
2. Select "Role Management" tab (super admin only)
3. Verify:
   - Role hierarchy is displayed
   - User list with current roles
   - Manage roles dialog
   - Confirmation dialog for changes

**Test Cases:**

**A. Assign Roles:**
1. Click "Manage Roles" on a user
2. Select one or more roles
3. Click "Save Changes"
4. Confirm in dialog
5. Verify roles are updated in database

**B. Remove Roles:**
1. Click "Manage Roles" on a user with roles
2. Deselect roles
3. Click "Save Changes"
4. Confirm in dialog
5. Verify roles are removed from database

**C. Access Control:**
1. Log in as admin (not super admin)
2. Navigate to `/admin/security`
3. Verify "Role Management" tab is not visible
4. Attempt to access Role Management
5. Verify access is denied

**D. Safeguards:**
1. Try to assign super_admin role as admin
2. Verify request is denied (RLS policy)
3. Check confirmation dialog shows changes
4. Verify audit log records role changes

### 3. Role-Based Navigation

#### Admin Panel Access

Test navigation visibility for different roles:

**Super Admin:**
- Dashboard: ✓ Visible
- Products: ✓ Visible
- Reviews: ✓ Visible
- Orders: ✓ Visible
- Users: ✓ Visible
- Security: ✓ Visible

**Admin:**
- Dashboard: ✓ Visible
- Products: ✓ Visible
- Reviews: ✓ Visible
- Orders: ✓ Visible
- Users: ✓ Visible
- Security: ✓ Visible (limited)

**Moderator:**
- Dashboard: ✗ Hidden
- Products: ✗ Hidden
- Reviews: ✓ Visible (only tab)
- Orders: ✗ Hidden
- Users: ✗ Hidden
- Security: ✗ Hidden

**Test Procedure:**
1. Log in with each role
2. Navigate to `/admin`
3. Verify only allowed tabs are visible
4. Try to manually navigate to restricted pages
5. Verify access is denied with redirect

### 4. Audit Logging Integration

#### Test Automatic Triggers

**Product Changes:**
```sql
-- Create a product
INSERT INTO products (name_en, name_ru, price) 
VALUES ('Test Product', 'Тестовый продукт', 100);

-- Check audit log
SELECT * FROM audit_logs 
WHERE entity_type = 'products' 
  AND action_type = 'products_created';

-- Update the product
UPDATE products SET price = 150 WHERE id = LAST_INSERT_ID;

-- Check audit log
SELECT * FROM audit_logs 
WHERE entity_type = 'products' 
  AND action_type = 'products_updated';
```

**Order Changes:**
```sql
-- Check audit logs for order updates
SELECT * FROM audit_logs 
WHERE entity_type = 'orders' 
ORDER BY created_at DESC 
LIMIT 10;
```

**User Role Changes:**
```sql
-- Assign a role
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID', 'moderator');

-- Check audit log
SELECT * FROM audit_logs 
WHERE entity_type = 'user_roles' 
  AND action_type = 'user_roles_created';
```

#### Test Manual Audit Logging

**From Frontend:**
1. Block/unblock a user
2. Check audit_logs table for entry
3. Verify details include user info
4. Check timestamp and actor

**From API:**
```typescript
// Test audit logger
import { auditLogger } from '@/lib/auditLogger';

// Log user action
await auditLogger.user.blocked('USER_ID', {
  reason: 'Test reason',
  admin_notes: 'Testing audit logging'
});

// Verify in database
SELECT * FROM audit_logs 
WHERE entity_type = 'user' 
  AND action_type = 'user_blocked';
```

### 5. RLS Policy Testing

#### Products Table

```sql
-- As super admin: Can do everything
SELECT * FROM products; -- ✓ Works
INSERT INTO products (...) VALUES (...); -- ✓ Works
UPDATE products SET ... WHERE ...; -- ✓ Works
DELETE FROM products WHERE ...; -- ✓ Works

-- As admin: Can do everything
SELECT * FROM products; -- ✓ Works
INSERT INTO products (...) VALUES (...); -- ✓ Works
UPDATE products SET ... WHERE ...; -- ✓ Works
DELETE FROM products WHERE ...; -- ✓ Works

-- As moderator: Can only view
SELECT * FROM products; -- ✓ Works
INSERT INTO products (...) VALUES (...); -- ✗ Denied
UPDATE products SET ... WHERE ...; -- ✗ Denied
DELETE FROM products WHERE ...; -- ✗ Denied
```

#### Audit Logs Table

```sql
-- As super admin
SELECT * FROM audit_logs; -- ✓ Works

-- As admin
SELECT * FROM audit_logs; -- ✗ Denied

-- As moderator
SELECT * FROM audit_logs; -- ✗ Denied
```

#### User Roles Table

```sql
-- As super admin
SELECT * FROM user_roles; -- ✓ Works
INSERT INTO user_roles (...) VALUES (...); -- ✓ Works
UPDATE user_roles SET ... WHERE ...; -- ✓ Works
DELETE FROM user_roles WHERE ...; -- ✓ Works

-- As admin
SELECT * FROM user_roles; -- ✓ Works (view only)
INSERT INTO user_roles (...) VALUES (...); -- ✗ Denied
UPDATE user_roles SET ... WHERE ...; -- ✗ Denied
DELETE FROM user_roles WHERE ...; -- ✗ Denied
```

### 6. useRoles Hook Testing

```typescript
// In a component
import { useRoles } from '@/hooks/useRoles';

function TestComponent() {
  const { 
    roles, 
    permissions, 
    isSuperAdmin, 
    isAdmin, 
    isModerator 
  } = useRoles();

  console.log('Roles:', roles);
  console.log('Permissions:', permissions);
  console.log('Is Super Admin:', isSuperAdmin);
  console.log('Is Admin:', isAdmin);
  console.log('Is Moderator:', isModerator);

  return (
    <div>
      {permissions.canManageProducts && <button>Manage Products</button>}
      {permissions.canManageRoles && <button>Manage Roles</button>}
      {permissions.canViewAuditLogs && <button>View Audit Logs</button>}
    </div>
  );
}
```

### 7. Login Events Testing

#### Manual Login Event Creation

```sql
-- Log a successful login
SELECT log_login_event(
  'USER_ID'::uuid,
  '192.168.1.1',
  'Mozilla/5.0...',
  'success',
  NULL
);

-- Log a failed login
SELECT log_login_event(
  'USER_ID'::uuid,
  '192.168.1.1',
  'Mozilla/5.0...',
  'failed',
  'Invalid credentials'
);

-- Query login events
SELECT * FROM get_login_events(
  NULL, -- user_id (null = all)
  NULL, -- status (null = all)
  NOW() - INTERVAL '7 days', -- date_from
  NOW(), -- date_to
  50, -- limit
  0 -- offset
);
```

## Manual Test Scenarios

### Scenario 1: Super Admin Workflow

1. Log in as super admin
2. Navigate to Admin Panel
3. Verify all tabs are visible
4. Navigate to Security Center
5. View login activity
6. View audit logs
7. Manage user roles
8. Assign moderator role to a user
9. Verify audit log entry is created
10. Check that user can now access reviews tab

### Scenario 2: Admin Workflow

1. Log in as admin
2. Navigate to Admin Panel
3. Verify Dashboard, Products, Orders, Users tabs are visible
4. Navigate to Security Center
5. View login activity (allowed)
6. Try to view audit logs (denied - tab hidden)
7. Try to manage roles (denied - tab hidden)
8. Manage products, orders, users
9. Verify audit logs are created (check as super admin)

### Scenario 3: Moderator Workflow

1. Log in as moderator
2. Navigate to Admin Panel
3. Verify only Reviews tab is visible
4. Try to access `/admin/dashboard` directly (denied, redirected)
5. Try to access `/admin/security` directly (denied, redirected)
6. Moderate reviews (approve/reject)
7. Verify audit logs are created

### Scenario 4: Role Escalation Prevention

1. Log in as admin
2. Try to assign super_admin role to self via API
3. Verify request is denied by RLS
4. Try to modify user_roles table directly
5. Verify RLS policy blocks the action
6. Log in as super admin
7. Assign super_admin role to the admin user
8. Verify role is successfully assigned
9. Verify audit log entry is created

## Acceptance Criteria

- [x] Role hierarchy implemented (super_admin > admin > moderator > user)
- [x] has_role function supports hierarchy
- [x] Login events table created and populated
- [x] Audit logs table with automatic triggers
- [x] Security Center UI at /admin/security
- [x] Login activity monitoring with filters and export
- [x] Audit logs viewer with detailed change tracking
- [x] Role management UI with safeguards
- [x] RLS policies enforce role restrictions
- [x] Frontend auth guards hide unauthorized UI elements
- [x] All admin actions create audit log entries
- [x] Permissions checked via useRoles hook
- [x] Navigation conditionally rendered based on roles
- [x] Super admin can manage all roles
- [x] Admins cannot assign super_admin role
- [x] Moderators can only access reviews
- [x] Audit logging utility integrated throughout admin

## Known Limitations

1. Login events are currently manually logged (no automatic trigger on auth.users)
   - Recommendation: Implement auth webhook to automatically log logins
   
2. IP address capture requires backend implementation
   - Currently relies on request headers being passed through
   
3. Audit logs for bulk operations log a single entry
   - Could be enhanced to log individual items

## Future Enhancements

1. **Two-Factor Authentication**: Add 2FA requirement for super admins
2. **Session Management**: Track active sessions and allow remote logout
3. **IP Whitelisting**: Allow super admins to whitelist IP ranges
4. **Advanced Audit Search**: Full-text search on audit log details
5. **Role Permissions Editor**: UI to customize permissions per role
6. **Audit Log Retention**: Automatic archival of old logs
7. **Real-time Alerts**: Notify super admins of suspicious activities
8. **Login Attempt Throttling**: Rate limiting on failed login attempts

## Troubleshooting

### Issue: Cannot view Security Center
**Solution**: Verify user has admin or super_admin role in user_roles table

### Issue: Role Management tab not visible
**Solution**: Only super admins can see this tab. Verify super_admin role is assigned.

### Issue: Audit logs not appearing
**Solution**: Check that triggers are created on the relevant tables

### Issue: Permission denied on role assignment
**Solution**: Only super admins can assign/revoke roles. Check RLS policies.

### Issue: Login events not recording
**Solution**: Ensure log_login_event() is called on authentication events

## Support

For issues or questions, contact the development team or refer to:
- Database schema: `supabase/migrations/20250107000000_add_security_rbac_enhancements.sql`
- Frontend components: `src/components/admin/security/`
- Translations: `src/lib/translations/security-center.ts`
- Audit logger: `src/lib/auditLogger.ts`
- Roles hook: `src/hooks/useRoles.ts`
