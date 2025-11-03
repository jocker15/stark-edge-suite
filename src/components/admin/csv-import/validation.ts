import { ProductImportData, ValidationError } from './types';

export function validateProduct(
  product: Partial<ProductImportData>,
  rowNumber: number,
  existingSkus: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field validation
  if (!product.name_en || product.name_en.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'name_en',
      value: product.name_en,
      message: 'Name (EN) is required',
    });
  }

  // Price validation
  if (product.price === undefined || product.price === null) {
    errors.push({
      row: rowNumber,
      field: 'price',
      value: product.price,
      message: 'Price is required',
    });
  } else if (typeof product.price === 'number' && (product.price < 0 || isNaN(product.price))) {
    errors.push({
      row: rowNumber,
      field: 'price',
      value: product.price,
      message: 'Price must be a valid positive number',
    });
  }

  // SKU uniqueness validation
  if (product.sku) {
    if (existingSkus.has(product.sku)) {
      errors.push({
        row: rowNumber,
        field: 'sku',
        value: product.sku,
        message: 'SKU already exists in database or import file',
      });
    } else {
      existingSkus.add(product.sku);
    }
  }

  // URL format validation
  const urlFields: Array<keyof ProductImportData> = ['preview_link', 'file_url', 'external_url'];
  urlFields.forEach(field => {
    const value = product[field];
    if (value && typeof value === 'string' && value.trim() !== '') {
      if (!isValidUrl(value)) {
        errors.push({
          row: rowNumber,
          field,
          value,
          message: `${field} must be a valid URL`,
        });
      }
    }
  });

  // Stock validation
  if (product.stock !== undefined && product.stock !== null) {
    const stock = Number(product.stock);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.push({
        row: rowNumber,
        field: 'stock',
        value: product.stock,
        message: 'Stock must be a valid non-negative integer',
      });
    }
  }

  // Status validation
  if (product.status && !['active', 'draft', 'archived'].includes(product.status)) {
    errors.push({
      row: rowNumber,
      field: 'status',
      value: product.status,
      message: 'Status must be one of: active, draft, archived',
    });
  }

  // Currency validation
  if (product.currency && !['USD', 'EUR', 'RUB'].includes(product.currency)) {
    errors.push({
      row: rowNumber,
      field: 'currency',
      value: product.currency,
      message: 'Currency must be one of: USD, EUR, RUB',
    });
  }

  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function checkExistingSkus(skus: string[]): Promise<Set<string>> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('products')
      .select('sku')
      .in('sku', skus.filter(Boolean));

    if (error) {
      console.error('Error checking SKUs:', error);
      return new Set();
    }

    return new Set(data?.map(p => p.sku).filter(Boolean) || []);
  } catch (error) {
    console.error('Error checking SKUs:', error);
    return new Set();
  }
}
