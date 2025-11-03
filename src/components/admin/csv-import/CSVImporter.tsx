import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { ValidationStep } from './ValidationStep';
import { ImportProgressStep } from './ImportProgressStep';
import {
  CSVRow,
  ColumnMapping,
  ParsedProduct,
  ProductImportData,
  ImportProgress,
  PRODUCT_FIELDS,
} from './types';
import { validateProduct, checkExistingSkus } from './validation';

interface CSVImporterProps {
  onClose: () => void;
}

type Step = 'upload' | 'mapping' | 'validation' | 'import';

export function CSVImporter({ onClose }: CSVImporterProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    stage: 'idle',
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();
  const { lang } = useLanguage();

  const translations = {
    en: {
      title: 'CSV Product Importer',
      steps: {
        upload: 'Upload',
        mapping: 'Mapping',
        validation: 'Validation',
        import: 'Import',
      },
      buttons: {
        back: 'Back',
        next: 'Next',
        startImport: 'Start Import',
        close: 'Close',
        cancel: 'Cancel',
      },
      errors: {
        invalidCSV: 'Invalid CSV file',
        parsingError: 'Error parsing CSV file',
        noData: 'CSV file is empty',
        mappingIncomplete: 'Please map all required fields',
        importError: 'Error importing products',
      },
      success: {
        importComplete: 'Import completed successfully!',
      },
    },
    ru: {
      title: 'Импорт товаров из CSV',
      steps: {
        upload: 'Загрузка',
        mapping: 'Сопоставление',
        validation: 'Валидация',
        import: 'Импорт',
      },
      buttons: {
        back: 'Назад',
        next: 'Далее',
        startImport: 'Начать импорт',
        close: 'Закрыть',
        cancel: 'Отмена',
      },
      errors: {
        invalidCSV: 'Неверный CSV файл',
        parsingError: 'Ошибка парсинга CSV файла',
        noData: 'CSV файл пустой',
        mappingIncomplete: 'Пожалуйста, сопоставьте все обязательные поля',
        importError: 'Ошибка импорта товаров',
      },
      success: {
        importComplete: 'Импорт завершен успешно!',
      },
    },
  };

  const t = translations[lang];

  // Auto-detect and create initial mapping
  const createInitialMapping = useCallback((headers: string[]): ColumnMapping[] => {
    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      
      // Try to auto-map based on common column names
      let productField: keyof ProductImportData | null = null;
      
      if (normalized === 'sku' || normalized === 'артикул') productField = 'sku';
      else if (normalized === 'name_en' || normalized === 'name (en)' || normalized === 'product name') productField = 'name_en';
      else if (normalized === 'name_ru' || normalized === 'name (ru)' || normalized === 'название') productField = 'name_ru';
      else if (normalized === 'description_en' || normalized === 'description (en)') productField = 'description_en';
      else if (normalized === 'description_ru' || normalized === 'description (ru)' || normalized === 'описание') productField = 'description_ru';
      else if (normalized === 'price' || normalized === 'цена') productField = 'price';
      else if (normalized === 'stock' || normalized === 'количество') productField = 'stock';
      else if (normalized === 'category' || normalized === 'категория') productField = 'category';
      else if (normalized === 'document_type' || normalized === 'type of document' || normalized === 'тип документа') productField = 'document_type';
      else if (normalized === 'country' || normalized === 'страна') productField = 'country';
      else if (normalized === 'state' || normalized === 'штат' || normalized === 'регион') productField = 'state';
      else if (normalized === 'preview_link' || normalized === 'link' || normalized === 'ссылка') productField = 'preview_link';
      else if (normalized === 'file_url' || normalized === 'file url') productField = 'file_url';
      else if (normalized === 'external_url' || normalized === 'external url') productField = 'external_url';
      else if (normalized === 'status' || normalized === 'статус') productField = 'status';
      else if (normalized === 'currency' || normalized === 'валюта') productField = 'currency';
      else if (normalized === 'meta_title' || normalized === 'meta title') productField = 'meta_title';
      else if (normalized === 'meta_description' || normalized === 'meta description') productField = 'meta_description';

      const field = PRODUCT_FIELDS.find(f => f.key === productField);
      
      return {
        csvColumn: header,
        productField,
        required: field?.required || false,
      };
    });
  }, []);

  // Parse CSV file
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setProgress(prev => ({ ...prev, stage: 'parsing' }));

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      chunk: (results) => {
        // Process chunks for large files
        setCsvData(prev => [...prev, ...results.data]);
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          toast({
            title: t.errors.parsingError,
            description: results.errors[0]?.message,
            variant: 'destructive',
          });
          return;
        }

        if (results.data.length === 0) {
          toast({
            title: t.errors.noData,
            variant: 'destructive',
          });
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setMapping(createInitialMapping(headers));
        setProgress(prev => ({ ...prev, total: results.data.length, stage: 'idle' }));
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: t.errors.parsingError,
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  }, [createInitialMapping, t, toast]);

  // Validate data based on mapping
  const handleValidation = useCallback(async () => {
    setIsValidating(true);
    setProgress(prev => ({ ...prev, stage: 'validating' }));

    try {
      // Check for required field mappings
      const requiredFields = PRODUCT_FIELDS.filter(f => f.required);
      const mappedFields = mapping.filter(m => m.productField !== null).map(m => m.productField);
      
      const missingRequired = requiredFields.filter(f => !mappedFields.includes(f.key));
      if (missingRequired.length > 0) {
        toast({
          title: t.errors.mappingIncomplete,
          description: `Missing: ${missingRequired.map(f => lang === 'en' ? f.label_en : f.label_ru).join(', ')}`,
          variant: 'destructive',
        });
        setIsValidating(false);
        return;
      }

      // Get all SKUs from CSV to check for duplicates
      const csvSkus = csvData
        .map(row => {
          const skuMapping = mapping.find(m => m.productField === 'sku');
          return skuMapping ? String(row[skuMapping.csvColumn] || '') : '';
        })
        .filter(Boolean);

      const existingSkus = await checkExistingSkus(csvSkus);

      // Parse and validate each row
      const products: ParsedProduct[] = [];
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const productData: Partial<ProductImportData> = {};

        // Map CSV columns to product fields
        mapping.forEach(m => {
          if (m.productField) {
            let value = row[m.csvColumn];
            
            // Type conversion
            const field = PRODUCT_FIELDS.find(f => f.key === m.productField);
            if (field?.type === 'number') {
              value = parseFloat(String(value || '0')) || 0;
            } else if (field?.key === 'is_digital') {
              value = value === 'true' || value === '1' || value === 'yes';
            }
            
            productData[m.productField] = value;
          }
        });

        // Set defaults
        if (!productData.status) productData.status = 'published';
        if (!productData.currency) productData.currency = 'USD';
        if (!productData.stock) productData.stock = 1000;
        if (!productData.name_ru) productData.name_ru = productData.name_en;
        if (!productData.description_ru) productData.description_ru = productData.description_en;
        if (productData.is_digital === undefined) productData.is_digital = true;

        const errors = validateProduct(productData, i + 2, existingSkus);

        products.push({
          row: i + 2,
          data: productData as ProductImportData,
          errors,
        });
      }

      setParsedProducts(products);
      setIsValidating(false);
      setProgress(prev => ({ ...prev, stage: 'idle' }));
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: t.errors.parsingError,
        variant: 'destructive',
      });
      setIsValidating(false);
    }
  }, [csvData, mapping, lang, t, toast]);

  // Import products
  const handleImport = useCallback(async () => {
    const validProducts = parsedProducts.filter(p => p.errors.length === 0);
    
    if (validProducts.length === 0) {
      toast({
        title: t.errors.noData,
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setProgress({
      total: validProducts.length,
      processed: 0,
      successful: 0,
      failed: 0,
      stage: 'uploading',
    });

    const batchSize = 50;
    let successful = 0;
    let failed = 0;

    try {
      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize);
        const productsToInsert = batch.map(p => {
          const { is_digital, ...rest } = p.data;
          return rest;
        });

        const { data, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          failed += batch.length;
        } else {
          successful += batch.length;
        }

        setProgress(prev => ({
          ...prev,
          processed: Math.min(i + batchSize, validProducts.length),
          successful,
          failed,
        }));

        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(prev => ({ ...prev, stage: 'complete' }));
      
      toast({
        title: t.success.importComplete,
        description: `${successful} products imported${failed > 0 ? `, ${failed} failed` : ''}`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: t.errors.importError,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  }, [parsedProducts, t, toast]);

  // Navigation handlers
  const canGoNext = () => {
    if (step === 'upload') return file !== null && csvHeaders.length > 0;
    if (step === 'mapping') {
      const requiredFields = PRODUCT_FIELDS.filter(f => f.required);
      const mappedFields = mapping.filter(m => m.productField !== null).map(m => m.productField);
      return requiredFields.every(f => mappedFields.includes(f.key));
    }
    if (step === 'validation') {
      return parsedProducts.length > 0 && parsedProducts.some(p => p.errors.length === 0);
    }
    return false;
  };

  const handleNext = () => {
    if (step === 'upload') setStep('mapping');
    else if (step === 'mapping') {
      setStep('validation');
      handleValidation();
    }
    else if (step === 'validation') {
      setStep('import');
      handleImport();
    }
  };

  const handleBack = () => {
    if (step === 'mapping') setStep('upload');
    else if (step === 'validation') setStep('mapping');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle>{t.title}</CardTitle>
            <div className="flex gap-2 mt-4">
              {(['upload', 'mapping', 'validation', 'import'] as const).map((s, idx) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    s === step
                      ? 'bg-primary'
                      : idx < (['upload', 'mapping', 'validation', 'import'] as const).indexOf(step)
                      ? 'bg-primary/50'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t.steps[step]}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isImporting}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px]">
            {step === 'upload' && (
              <FileUploadStep onFileSelect={handleFileSelect} selectedFile={file} />
            )}
            {step === 'mapping' && (
              <ColumnMappingStep
                csvHeaders={csvHeaders}
                previewData={csvData.slice(0, 5)}
                mapping={mapping}
                onMappingChange={setMapping}
              />
            )}
            {step === 'validation' && (
              <ValidationStep
                products={parsedProducts}
                onValidate={handleValidation}
                isValidating={isValidating}
              />
            )}
            {step === 'import' && <ImportProgressStep progress={progress} />}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 'upload' || step === 'import' || isImporting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t.buttons.back}
            </Button>
            <div className="flex gap-2">
              {step === 'import' && progress.stage === 'complete' ? (
                <Button onClick={onClose}>{t.buttons.close}</Button>
              ) : step !== 'import' ? (
                <Button onClick={handleNext} disabled={!canGoNext() || isValidating}>
                  {step === 'validation' ? t.buttons.startImport : t.buttons.next}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
