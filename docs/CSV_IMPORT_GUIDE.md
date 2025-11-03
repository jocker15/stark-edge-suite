# CSV Product Import Guide

## Overview

The CSV Product Importer is a comprehensive tool for bulk uploading products to your store. It features drag-and-drop upload, intelligent column mapping, validation, progress tracking, and error handling.

## Features

### 1. Intuitive Upload Experience
- **Drag-and-Drop**: Simply drag your CSV file into the upload area
- **File Validation**: Automatic validation ensures only CSV files are accepted
- **Template Downloads**: Download pre-formatted CSV templates in English or Russian

### 2. Intelligent Column Mapping
- **Auto-Detection**: The system automatically detects and maps common column names
- **Manual Override**: Easily adjust mappings if auto-detection isn't perfect
- **Live Preview**: See sample data from each column before importing
- **Required Field Indicators**: Clear visual indicators show which fields are mandatory

### 3. Comprehensive Validation
The importer validates:
- **Required Fields**: Ensures name_en and price are present
- **Data Types**: Validates that numbers are numeric, URLs are valid
- **SKU Uniqueness**: Checks against existing products and within the import file
- **Price Format**: Ensures prices are positive numbers
- **Stock Quantities**: Validates non-negative integers
- **Status Values**: Verifies status is one of: active, draft, archived
- **Currency Values**: Ensures currency is one of: USD, EUR, RUB

### 4. Error Handling
- **Row-Level Errors**: See exactly which rows have problems and why
- **Export Failed Rows**: Download failed rows as CSV for easy correction
- **Partial Success**: Successfully import valid rows even if some fail
- **Detailed Error Messages**: Clear, actionable error descriptions

### 5. Progress Tracking
- **Real-Time Updates**: Watch your import progress in real-time
- **Batch Processing**: Products are imported in manageable batches
- **Success/Failure Counts**: Track how many products succeeded or failed
- **Stage Indicators**: Know exactly what stage of import you're at

### 6. Multilingual Support
- Full English and Russian localization
- Templates available in both languages
- Localized field names and error messages

## CSV Template Structure

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Name (EN) | Text | Product name in English | "Digital Passport Template" |
| Price | Number | Product price (positive number) | 25.00 |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| SKU | Text | Unique product identifier | "PROD-001" |
| Name (RU) | Text | Product name in Russian | "Шаблон цифрового паспорта" |
| Description (EN) | Text | Product description in English | "High quality template..." |
| Description (RU) | Text | Product description in Russian | "Высококачественный шаблон..." |
| Stock | Integer | Available quantity | 100 |
| Category | Text | Product category | "Digital Template" |
| Document Type | Text | Type of document | "Passport" |
| Country | Text | Country name | "USA" |
| State | Text | State or region | "California" |
| Preview Link | URL | Link to preview | "https://example.com/preview" |
| File URL | URL | Link to downloadable file | "https://example.com/file.pdf" |
| External URL | URL | External reference | "https://example.com" |
| Status | Select | Product status | "active" (active/draft/archived) |
| Currency | Select | Price currency | "USD" (USD/EUR/RUB) |
| Digital Product | Boolean | Is digital product | "true" (true/false) |
| Meta Title | Text | SEO meta title | "Best Digital Templates" |
| Meta Description | Text | SEO meta description | "High quality digital..." |

## Default Values

If not specified, the system applies these defaults:

- **Name (RU)**: Copies from Name (EN)
- **Description (RU)**: Copies from Description (EN)
- **Stock**: 1000
- **Status**: active
- **Currency**: USD
- **Digital Product**: true

## Step-by-Step Guide

### Step 1: Prepare Your CSV File

1. Open your spreadsheet application (Excel, Google Sheets, etc.)
2. Add column headers matching the field names above
3. Fill in your product data
4. Save as CSV (UTF-8 encoding)

**Excel Instructions:**
- File → Save As → CSV UTF-8 (Comma delimited)

**Google Sheets Instructions:**
- File → Download → Comma-separated values (.csv)

### Step 2: Upload CSV

1. Click "Import CSV" button in Admin Products page
2. Either:
   - Drag and drop your CSV file into the upload area
   - Click "Browse Files" to select your file
3. Wait for the file to be parsed

### Step 3: Review Column Mapping

1. Review the auto-detected column mappings
2. Adjust any incorrect mappings using the dropdown selects
3. Ensure all required fields are mapped
4. Review the preview data to confirm correct mapping
5. Click "Next" to proceed

### Step 4: Validate Data

1. The system automatically validates all rows
2. Review the validation summary:
   - Total rows
   - Valid rows
   - Invalid rows
3. If there are errors:
   - Review the error details table
   - Click "Export Failed Rows" to download errors
   - Fix the issues in your CSV
   - Start over from Step 2
4. If all rows are valid, click "Start Import"

### Step 5: Monitor Import Progress

1. Watch the real-time progress bar
2. Monitor success/failure counts
3. Wait for import to complete

### Step 6: Review Results

1. Review the final import summary
2. Note any failures
3. Click "Close" to return to products list

## Common Issues and Solutions

### Issue: CSV File Not Recognized

**Solution**: Ensure your file:
- Has .csv extension
- Is saved with UTF-8 encoding
- Has column headers in the first row
- Uses comma (,) as delimiter

### Issue: Required Fields Not Mapped

**Solution**: 
- Ensure your CSV has columns for Name (EN) and Price
- Manually map these fields if auto-detection failed
- Check for spelling variations in column names

### Issue: SKU Uniqueness Errors

**Solution**:
- Check your CSV for duplicate SKUs
- Verify SKUs don't already exist in the database
- Remove or change duplicate SKUs

### Issue: Invalid Price Format

**Solution**:
- Ensure prices are positive numbers
- Remove currency symbols ($, €, ₽)
- Use period (.) as decimal separator, not comma
- Example: 25.00 (not $25 or 25,00)

### Issue: Invalid URLs

**Solution**:
- Ensure URLs start with http:// or https://
- Check for typos in URLs
- Remove spaces from URLs

### Issue: Partial Import Success

**Solution**:
- The system imports all valid rows
- Export failed rows to see what went wrong
- Fix issues and import failed rows separately
- No need to re-import successful products

## Best Practices

1. **Start Small**: Test with a small file (10-20 products) first
2. **Use Templates**: Download and use provided templates
3. **Validate Externally**: Check your data in spreadsheet before importing
4. **Unique SKUs**: Always use unique SKUs for tracking
5. **Backup Data**: Keep original CSV files as backup
6. **UTF-8 Encoding**: Always save CSV files with UTF-8 encoding
7. **Test URLs**: Verify URLs work before importing
8. **Consistent Categories**: Use consistent category names
9. **Batch Imports**: For very large files, split into smaller batches
10. **Regular Backups**: Export existing products before large imports

## Technical Details

### Processing
- Files are processed client-side using PapaParse
- Chunked parsing for large files prevents browser freezing
- Batches of 50 products sent to database at a time
- Retry logic handles temporary network issues

### Validation
- Validation happens before any database inserts
- No partial inserts - either a batch succeeds or fails
- Existing SKUs checked against database
- All validations run in parallel for speed

### Security
- Admin authentication required
- Role-based access control
- SQL injection prevention
- Rate limiting on API endpoints

### Storage
- Digital product files can be stored in Supabase Storage
- Private bucket with authenticated access
- 100MB file size limit
- Support for common file types (PDF, ZIP, Office, Images)

## Troubleshooting

### Build/Deployment Issues

If you encounter build errors:
```bash
npm run build
```

Check for TypeScript errors:
```bash
npx tsc --noEmit
```

### Database Migration Issues

Ensure migrations are applied:
```bash
supabase db reset  # Development only
supabase db push   # Production
```

### Permission Issues

Verify your user has admin role:
```sql
SELECT role FROM profiles WHERE user_id = 'your-user-id';
```

## API Reference

### Import Products Batch Endpoint

**Endpoint**: `/functions/v1/import-products-batch`

**Method**: POST

**Headers**:
- `Authorization`: Bearer {access_token}
- `Content-Type`: application/json

**Request Body**:
```json
{
  "products": [
    {
      "sku": "PROD-001",
      "name_en": "Product Name",
      "price": 25.00,
      // ... other fields
    }
  ],
  "batchId": "optional-batch-identifier"
}
```

**Response**:
```json
{
  "success": true,
  "inserted": 100,
  "failed": 0,
  "errors": []
}
```

## Support

For issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Export and examine failed rows
4. Contact system administrator

## Version History

### v2.0 (Current)
- Complete rebuild of CSV importer
- Added drag-and-drop upload
- Intelligent column mapping
- Comprehensive validation
- Progress tracking
- Error handling and export
- Multilingual support (EN/RU)
- Template downloads
- Batch processing
- Retry logic
- New database schema support (SKU, status, currency, etc.)

### v1.0 (Legacy)
- Basic CSV import
- Fixed column format
- Limited error handling
