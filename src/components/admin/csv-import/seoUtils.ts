import { ProductImportData } from './types';

/**
 * Generates SEO fields (meta_title and meta_description) from product data
 * Uses a priority system: description > name
 * Truncates to optimal lengths: 60 chars for title, 160 chars for description
 */
export function generateSeoFields(product: Partial<ProductImportData>): {
  meta_title: string;
  meta_description: string;
} {
  // Generate meta_title (60 chars max)
  let meta_title = '';
  
  if (product.meta_title) {
    meta_title = product.meta_title;
  } else if (product.name_en) {
    meta_title = truncateText(product.name_en, 60);
  } else if (product.name_ru) {
    meta_title = truncateText(product.name_ru, 60);
  } else if (product.description_en) {
    meta_title = truncateText(product.description_en, 60);
  } else if (product.description_ru) {
    meta_title = truncateText(product.description_ru, 60);
  }

  // Generate meta_description (160 chars max)
  let meta_description = '';
  
  if (product.meta_description) {
    meta_description = product.meta_description;
  } else if (product.description_en) {
    meta_description = truncateText(product.description_en, 160);
  } else if (product.description_ru) {
    meta_description = truncateText(product.description_ru, 160);
  } else if (product.name_en) {
    meta_description = truncateText(product.name_en, 160);
  } else if (product.name_ru) {
    meta_description = truncateText(product.name_ru, 160);
  }

  return {
    meta_title,
    meta_description,
  };
}

/**
 * Truncates text to specified length without breaking words
 * Adds ellipsis if truncated
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  // Truncate at maxLength
  let truncated = text.substring(0, maxLength);

  // Find last space to avoid breaking words
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    // Only break at word boundary if we're not losing too much text (> 80%)
    truncated = truncated.substring(0, lastSpace);
  }

  // Remove trailing punctuation and add ellipsis
  truncated = truncated.replace(/[.,;:!?-]\s*$/, '');
  
  return truncated.trim() + (truncated.length < text.length ? '...' : '');
}
