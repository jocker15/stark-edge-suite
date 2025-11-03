# Settings Center Feature

## Overview

The Settings Center is a comprehensive admin interface for managing site configuration. It provides a centralized location for super administrators to configure all aspects of the digital storefront, from branding to payment gateways.

## Access Control

- **Permission Required**: Super Admin only (`canManageSettings`)
- **Route**: `/admin/settings`
- **Navigation**: Settings tab appears in admin panel for super admins only

## Features

### 1. General Settings
Configure basic site information:
- Site name (English and Russian)
- Contact email and phone
- Social media links (Facebook, Twitter, Instagram, Telegram, VK)

### 2. Branding Settings
Customize visual identity:
- Logo upload (recommended: 200x50px, PNG/SVG)
- Favicon upload (recommended: 32x32px, PNG/ICO)
- Primary and secondary colors with color pickers
- Real-time preview of uploaded assets
- Delete and re-upload functionality

### 3. Payment Settings
Configure payment gateway integration:
- CryptoCloud Shop ID and API Key
- Mode selection (Test/Production)
- Default currency (USD, EUR, RUB, UAH)
- Enable/disable payments toggle
- **Test Connection** feature to verify credentials

### 4. Email Settings
Configure email service integration:
- Resend API key
- Sender email and name
- Email template IDs (welcome, password reset, order confirmation, order shipped)
- **Send Test Email** feature to verify configuration

### 5. Language Settings
Configure available languages:
- Select active languages (English, Russian)
- Set default language
- Validation ensures default language is in active list

## Database Schema

### site_settings Table
```sql
CREATE TABLE site_settings (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz,
  updated_at timestamptz
);
```

### Categories and Keys
- **general** (public): site_name_en, site_name_ru, contact_email, contact_phone, social_links
- **branding** (public): logo_url, favicon_url, primary_color, secondary_color
- **payments** (private): cryptocloud_shop_id, cryptocloud_api_key, mode, default_currency, enabled
- **email** (private): resend_api_key, sender_email, sender_name, template_ids
- **language** (public): active_locales, default_language

### Storage
- **Bucket**: `branding-assets` (public)
- **Permissions**: Super admins can upload/delete, everyone can read
- **Files**: Logo and favicon images

## API & Functions

### RPC Functions

#### `get_site_settings()`
Returns all settings filtered by user permissions:
- Super admins: All settings
- Others: Only public settings

#### `update_site_setting(_key, _value)`
Updates a specific setting:
- Validates super admin permission
- Logs audit trail
- Returns updated value

#### `get_public_settings()`
Returns only public settings for storefront use:
- general, branding, language categories
- No authentication required

### Client-Side Helpers (`src/lib/settings.ts`)

```typescript
// Fetch all settings (permission-based)
await getAllSettings(): Promise<SiteSettings | null>

// Fetch public settings only
await getPublicSettings(): Promise<PublicSettings | null>

// Update a setting
await updateSetting(key, value): Promise<boolean>

// Upload logo or favicon
await uploadBrandingAsset(file, type): Promise<string | null>

// Delete branding asset
await deleteBrandingAsset(url): Promise<boolean>

// Test payment gateway connection
await testPaymentConnection(shopId, apiKey): Promise<{success, message?}>

// Send test email
await sendTestEmail(apiKey, senderEmail, senderName, testEmail): Promise<{success, message?}>
```

### Server-Side Integration (`server.ts`)

```typescript
// Fetch all settings
await getSettings(): Promise<Record<string, unknown> | null>

// Fetch single setting by key
await getSetting(key: string): Promise<unknown | null>

// Send email using configured settings
await sendEmailWithSettings(to, subject, html): Promise<void>
```

All email endpoints now use `sendEmailWithSettings()` which automatically fetches and applies the current email configuration from the settings table.

## Storefront Integration

### Settings Context (`src/contexts/SettingsContext.tsx`)

Provides public settings to the entire application:

```typescript
import { useSettings } from "@/contexts/SettingsContext";

function MyComponent() {
  const { settings, loading, refreshSettings } = useSettings();
  
  // Access public settings
  const siteName = settings?.general?.site_name_en;
  const logo = settings?.branding?.logo_url;
  const defaultLang = settings?.language?.default_language;
}
```

### Automatic Updates
- Document title updates based on site name
- Favicon updates when changed
- Settings cached and refreshed on updates

## Security Features

1. **Role-Based Access**: Only super admins can access settings
2. **Secret Masking**: API keys displayed as password fields with show/hide toggle
3. **RLS Policies**: Database-level security on settings table
4. **Audit Logging**: All setting updates logged with user, timestamp, and changes
5. **Public/Private Split**: Sensitive settings (payments, email) never exposed to public

## Validation

All forms use Zod schemas for validation:
- Email format validation
- URL format validation for social links
- Required fields enforcement
- Custom error messages in EN/RU

## Test Features

### Payment Connection Test
1. Enter CryptoCloud credentials
2. Click "Test Connection"
3. System verifies credentials against CryptoCloud API
4. Shows success/failure with details

### Email Test
1. Configure email settings
2. Click "Send Test Email"
3. Enter recipient address
4. System sends test email using configured settings
5. Shows success/failure with details

## Localization

Full EN/RU translations in `src/lib/translations/settings-center.ts`:
- All UI labels
- Form placeholders
- Validation messages
- Success/error messages

## Usage Flow

1. Super admin navigates to `/admin/settings`
2. Selects appropriate tab (General, Branding, Payments, Email, Language)
3. Updates desired settings in the form
4. Can test payment/email configurations before saving
5. Clicks "Save Changes"
6. Settings updated in database
7. Public settings automatically refresh on storefront
8. Email/payment systems use new configuration

## Default Values

Default settings are seeded during migration:
- Site name: "Digital Store" / "Цифровой магазин"
- Mode: Test
- Currency: USD
- Active locales: EN, RU
- Default language: EN

## File Upload Specifications

### Logo
- Recommended: 200x50px
- Formats: PNG, SVG, JPG
- Max size: 5MB
- Displays in header/footer

### Favicon
- Recommended: 32x32px
- Formats: PNG, ICO
- Max size: 5MB
- Displays in browser tab

## Integration Points

### Webhook Handler
Payment webhooks automatically use configured email settings for order confirmations.

### Order Management
Digital goods resend uses configured sender information.

### User Management
User emails use configured sender and template settings.

## Migration

Migration file: `supabase/migrations/20250109000000_create_site_settings.sql`

Includes:
- Table creation with indexes
- RLS policies
- Storage bucket creation
- Storage policies
- Default settings seed
- RPC functions
- Audit trigger

## Future Enhancements

Potential additions:
- Advanced branding: fonts, custom CSS
- More payment gateways
- Email template editor
- Import/export settings
- Settings history/versioning
- Maintenance mode toggle
- SEO settings
- Analytics integration
