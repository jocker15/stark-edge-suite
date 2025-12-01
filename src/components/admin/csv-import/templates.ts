import { PRODUCT_FIELDS } from './types';

export function generateCSVTemplate(lang: 'en' | 'ru'): string {
  const headers = PRODUCT_FIELDS.map(field => 
    lang === 'en' ? field.label_en : field.label_ru
  );
  
  const exampleRow = PRODUCT_FIELDS.map(field => {
    switch (field.key) {
      case 'sku':
        return 'PROD-001';
      case 'name_en':
        return 'Example Product Name';
      case 'name_ru':
        return 'Пример названия товара';
      case 'description_en':
        return 'Product description in English';
      case 'description_ru':
        return 'Описание товара на русском';
      case 'price':
        return '25.00';
      case 'stock':
        return '100';
      case 'category':
        return 'Digital Template';
      case 'document_type':
        return 'Passport';
      case 'country':
        return 'USA';
      case 'state':
        return 'California';
      case 'preview_link':
        return 'https://example.com/preview';
      case 'file_url':
        return 'https://example.com/file.pdf';
      case 'external_url':
        return '';
      case 'status':
        return 'active';
      case 'currency':
        return 'USD';
      case 'is_digital':
        return 'true';
      case 'meta_title':
        return '';
      case 'meta_description':
        return '';
      default:
        return '';
    }
  });

  const csvContent = [
    headers.join(','),
    exampleRow.map(escapeCSV).join(','),
  ].join('\n');

  return csvContent;
}

export function downloadCSVTemplate(lang: 'en' | 'ru'): void {
  const csvContent = generateCSVTemplate(lang);
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `product_import_template_${lang}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFailedRows(
  failedRows: Array<{ row: number; data: Record<string, unknown>; errors: Array<{ field: string; message: string }> }>,
  lang: 'en' | 'ru'
): void {
  if (failedRows.length === 0) return;

  const headers = PRODUCT_FIELDS.map(field => 
    lang === 'en' ? field.label_en : field.label_ru
  );
  headers.push(lang === 'en' ? 'Errors' : 'Ошибки');

  const csvRows = failedRows.map(({ data, errors }) => {
    const row = PRODUCT_FIELDS.map(field => {
      const value = data[field.key];
      return value !== undefined && value !== null ? String(value) : '';
    });
    
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    row.push(errorMessages);
    
    return row.map(escapeCSV).join(',');
  });

  const csvContent = [
    headers.join(','),
    ...csvRows,
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `failed_rows_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string | number): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
