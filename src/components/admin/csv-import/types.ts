export interface CSVRow {
  [key: string]: string | number | null;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string | number | boolean | null | undefined;
  message: string;
}

export interface ParsedProduct {
  row: number;
  data: ProductImportData;
  errors: ValidationError[];
}

export interface ProductImportData {
  sku?: string;
  name_en: string;
  name_ru?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  stock?: number;
  category?: string;
  document_type?: string;
  country?: string;
  state?: string;
  preview_link?: string;
  file_url?: string;
  external_url?: string;
  status?: 'active' | 'draft' | 'archived';
  currency?: 'USD' | 'EUR' | 'RUB';
  is_digital?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface ColumnMapping {
  csvColumn: string;
  productField: keyof ProductImportData | null;
  required: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  stage: 'idle' | 'parsing' | 'validating' | 'uploading' | 'complete';
}

export const PRODUCT_FIELDS: Array<{
  key: keyof ProductImportData;
  label_en: string;
  label_ru: string;
  required: boolean;
  type: 'text' | 'number' | 'url' | 'select';
  options?: string[];
}> = [
  { key: 'sku', label_en: 'SKU', label_ru: 'Артикул', required: false, type: 'text' },
  { key: 'name_en', label_en: 'Name (EN)', label_ru: 'Название (EN)', required: true, type: 'text' },
  { key: 'name_ru', label_en: 'Name (RU)', label_ru: 'Название (RU)', required: false, type: 'text' },
  { key: 'description_en', label_en: 'Description (EN)', label_ru: 'Описание (EN)', required: false, type: 'text' },
  { key: 'description_ru', label_en: 'Description (RU)', label_ru: 'Описание (RU)', required: false, type: 'text' },
  { key: 'price', label_en: 'Price', label_ru: 'Цена', required: true, type: 'number' },
  { key: 'stock', label_en: 'Stock', label_ru: 'Количество', required: false, type: 'number' },
  { key: 'category', label_en: 'Category', label_ru: 'Категория', required: false, type: 'text' },
  { key: 'document_type', label_en: 'Document Type', label_ru: 'Тип документа', required: false, type: 'text' },
  { key: 'country', label_en: 'Country', label_ru: 'Страна', required: false, type: 'text' },
  { key: 'state', label_en: 'State', label_ru: 'Штат/Регион', required: false, type: 'text' },
  { key: 'preview_link', label_en: 'Preview Link', label_ru: 'Ссылка на просмотр', required: false, type: 'url' },
  { key: 'file_url', label_en: 'File URL', label_ru: 'URL файла', required: false, type: 'url' },
  { key: 'external_url', label_en: 'External URL', label_ru: 'Внешняя ссылка', required: false, type: 'url' },
  { key: 'status', label_en: 'Status', label_ru: 'Статус', required: false, type: 'select', options: ['active', 'draft', 'archived'] },
  { key: 'currency', label_en: 'Currency', label_ru: 'Валюта', required: false, type: 'select', options: ['USD', 'EUR', 'RUB'] },
  { key: 'is_digital', label_en: 'Digital Product', label_ru: 'Цифровой товар', required: false, type: 'select', options: ['true', 'false'] },
  { key: 'meta_title', label_en: 'Meta Title', label_ru: 'Meta заголовок', required: false, type: 'text' },
  { key: 'meta_description', label_en: 'Meta Description', label_ru: 'Meta описание', required: false, type: 'text' },
];
