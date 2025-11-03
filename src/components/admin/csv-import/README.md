# CSV Product Importer

A comprehensive CSV import system for bulk product uploads with validation, error handling, and progress tracking.

## Features

### 1. Drag-and-Drop Upload
- Intuitive drag-and-drop interface
- File validation (CSV only)
- File size display
- Download CSV templates (EN/RU)

### 2. Column Mapping
- Auto-detection of common column names
- Manual column-to-field mapping
- Preview of data for each column
- Required field indicators
- Support for both English and Russian headers

### 3. Validation
- Real-time validation of all rows
- Checks for:
  - Required fields (name_en, price)
  - Price format (positive numbers)
  - URL format validation
  - SKU uniqueness (both in CSV and database)
  - Stock quantity (non-negative integers)
  - Status values (active, draft, archived)
  - Currency values (USD, EUR, RUB)
- Display of validation errors by row
- Export failed rows to CSV for corrections

### 4. Chunked Import
- Batch processing (50 products per batch)
- Progress bar showing:
  - Total rows
  - Processed rows
  - Successful imports
  - Failed imports
- Non-blocking UI during import
- Retry mechanism on failures

### 5. Localization
- Full EN/RU support
- Localized field names
- Localized error messages
- Localized templates

## CSV Template Fields

### Required Fields
- **Name (EN)** - Product name in English
- **Price** - Product price (positive number)

### Optional Fields
- **SKU** - Unique product identifier
- **Name (RU)** - Product name in Russian (defaults to Name EN)
- **Description (EN)** - Product description in English
- **Description (RU)** - Product description in Russian (defaults to Description EN)
- **Stock** - Quantity available (defaults to 1000)
- **Category** - Product category
- **Document Type** - Type of document (for digital templates)
- **Country** - Country name
- **State** - State/Region name
- **Preview Link** - URL for preview
- **File URL** - URL to downloadable file
- **External URL** - External reference link
- **Status** - Product status (active, draft, archived - defaults to active)
- **Currency** - Price currency (USD, EUR, RUB - defaults to USD)
- **Digital Product** - Whether product is digital (true/false - defaults to true)
- **Meta Title** - SEO meta title
- **Meta Description** - SEO meta description

## Usage

1. Click "Import CSV" button in Admin Products page
2. Upload CSV file or drag-and-drop
3. Review auto-mapped columns and adjust if needed
4. Click "Next" to validate data
5. Review validation results
6. Export failed rows if needed or proceed with import
7. Monitor import progress
8. Review final results

## Database Schema

The importer works with the following tables:

### products
- All product fields as defined in the template
- Includes new digital product fields (status, currency, sku, etc.)

### product_files (future)
- For storing multiple files per product
- Linked to products table via foreign key

## Storage

The `digital-products` bucket is created for storing digital product files:
- Private bucket (authenticated access only)
- 100MB file size limit
- Supports: PDF, ZIP, Office documents, Images
- Role-based access control

## Error Handling

- CSV parsing errors are caught and displayed
- Row-level validation errors are collected
- Failed imports are tracked and reported
- Duplicate SKUs are prevented
- Malformed data is rejected before database insert

## Performance

- Chunked parsing for large files
- Batch inserts (50 products per batch)
- Progress tracking
- Non-blocking UI
- Optimized for files with 1000+ rows

## Future Enhancements

- Resume interrupted imports
- File upload integration (attach files during import)
- Category validation against categories table
- Advanced field transformations
- Import history tracking
- Rollback functionality
