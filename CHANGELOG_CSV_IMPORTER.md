# CSV Importer Changelog

## [2.0.0] - 2024-01-01

### Added
- **New CSV Importer Component** (`src/components/admin/csv-import/`)
  - Multi-step import wizard with progress indicators
  - Drag-and-drop file upload interface
  - Live CSV parsing with chunked processing
  - Intelligent column mapping with auto-detection
  - Comprehensive data validation
  - Per-row error reporting
  - Failed rows export functionality
  - Real-time import progress tracking
  - Multilingual support (EN/RU)

- **CSV Templates**
  - Downloadable templates in English and Russian
  - Example data included
  - All supported fields documented

- **Database Schema Enhancements**
  - Added `sku` column with unique constraint
  - Added `status` column (active/draft/archived)
  - Added `currency` column (USD/EUR/RUB)
  - Added `is_digital` boolean flag
  - Added `file_url` for digital downloads
  - Added `external_url` for external links
  - Added `state` column for regions
  - Created `product_files` table for multiple file attachments
  - Created `digital-products` storage bucket

- **Validation Features**
  - Required field validation (name_en, price)
  - Price format validation (positive numbers)
  - URL format validation
  - SKU uniqueness check (database + CSV)
  - Stock quantity validation (non-negative integers)
  - Status value validation
  - Currency value validation
  - Type-specific field validation

- **Error Handling**
  - Batch processing with retry logic
  - Graceful failure handling
  - Detailed error messages
  - Export failed rows as CSV
  - Partial import support (valid rows succeed even if some fail)

- **Edge Function** (`supabase/functions/import-products-batch/`)
  - Secure batch import endpoint
  - Admin authentication required
  - Duplicate SKU prevention
  - Retry mechanism (3 attempts per batch)
  - Individual product fallback on batch failure
  - Multi-status response (207) for partial success

- **File Upload Utilities** (`src/components/admin/csv-import/fileUpload.ts`)
  - Storage upload helpers
  - File path generation
  - Public URL generation
  - File deletion utilities

- **Type Definitions** (`src/components/admin/csv-import/types.ts`)
  - Comprehensive TypeScript types
  - Product import data structure
  - Validation error structure
  - Column mapping structure
  - Import progress tracking

- **Documentation**
  - Comprehensive CSV import guide (`docs/CSV_IMPORT_GUIDE.md`)
  - Component README (`src/components/admin/csv-import/README.md`)
  - Field descriptions and examples
  - Best practices guide
  - Troubleshooting section

### Changed
- **AdminProducts Component**
  - Updated to use new `CSVImporter` component
  - Removed dependency on old `CSVImport` component
  - Maintained backward compatibility with existing imports

- **Database Migrations**
  - Migration `20250101000000_add_product_digital_fields.sql` - New product fields
  - Migration `20250101000001_add_product_files_trigger.sql` - Trigger for updated_at

### Deprecated
- Old `CSVImport.tsx` component (renamed to `CSVImport.tsx.old`)
  - Replaced by new modular CSV import system
  - Kept as backup for reference

### Performance Improvements
- Chunked CSV parsing prevents browser freezing on large files
- Batch inserts (50 products per batch) optimize database operations
- Client-side validation reduces server load
- Progress tracking doesn't block UI

### Security Enhancements
- Admin-only access to import functionality
- Role-based authentication on Edge Function
- SQL injection prevention through parameterized queries
- Private storage bucket for digital products
- Authenticated download access

### User Experience
- Step-by-step wizard guides users through import
- Visual progress indicators show import stages
- Clear error messages with actionable suggestions
- Export failed rows for easy correction
- Localized interface (English and Russian)

### Technical Details
- Uses PapaParse for robust CSV parsing
- React hooks for state management
- TypeScript for type safety
- Supabase client for database operations
- Edge Functions for server-side processing
- Storage API for file management

### Breaking Changes
None - The new importer is a drop-in replacement for the old one.

### Migration Guide

#### For Developers
1. Build the application: `npm run build`
2. Apply database migrations:
   ```bash
   supabase db push
   ```
3. Deploy Edge Function:
   ```bash
   supabase functions deploy import-products-batch
   ```

#### For Users
No action required. The new importer will be available in the Admin Products page.

### Known Issues
None

### Future Enhancements
- [ ] Resume interrupted imports
- [ ] File upload during CSV import (attach product files)
- [ ] Category validation against categories table
- [ ] Advanced field transformations
- [ ] Import history tracking
- [ ] Rollback functionality for failed imports
- [ ] Scheduled imports
- [ ] Import from external URLs
- [ ] Import templates library

### Credits
- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui components
- CSV parsing by PapaParse
- Database by Supabase

---

## [1.0.0] - Previous Version

### Features
- Basic CSV import functionality
- Fixed column format support
- Manual category selection
- Batch processing (100 products)
- Basic error logging

### Limitations
- No column mapping
- Limited validation
- No error export
- Fixed format only
- No progress tracking
