import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParsedProduct } from './types';
import { exportFailedRows } from './templates';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationStepProps {
  products: ParsedProduct[];
  onValidate: () => void;
  isValidating: boolean;
}

export function ValidationStep({ products, onValidate, isValidating }: ValidationStepProps) {
  const { lang } = useLanguage();

  const validProducts = products.filter(p => p.errors.length === 0);
  const invalidProducts = products.filter(p => p.errors.length > 0);

  const translations = {
    en: {
      title: 'Validation Results',
      total: 'Total Rows',
      valid: 'Valid',
      invalid: 'Invalid',
      exportFailed: 'Export Failed Rows',
      errorDetails: 'Error Details',
      row: 'Row',
      field: 'Field',
      value: 'Value',
      error: 'Error',
      validating: 'Validating...',
      validate: 'Validate Data',
      noErrors: 'All rows are valid! You can proceed with import.',
      hasErrors: 'Some rows have validation errors. Fix them or export and correct the CSV.',
    },
    ru: {
      title: 'Результаты валидации',
      total: 'Всего строк',
      valid: 'Валидных',
      invalid: 'Невалидных',
      exportFailed: 'Экспортировать ошибки',
      errorDetails: 'Детали ошибок',
      row: 'Строка',
      field: 'Поле',
      value: 'Значение',
      error: 'Ошибка',
      validating: 'Валидация...',
      validate: 'Проверить данные',
      noErrors: 'Все строки валидны! Можете продолжить импорт.',
      hasErrors: 'Некоторые строки содержат ошибки. Исправьте их или экспортируйте и поправьте CSV.',
    },
  };

  const t = translations[lang];

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Button onClick={onValidate} disabled={isValidating}>
          {isValidating ? t.validating : t.validate}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.total}</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">{t.valid}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {validProducts.length}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{t.invalid}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {invalidProducts.length}
            </p>
          </div>
        </div>

        {invalidProducts.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">{t.noErrors}</p>
          </div>
        ) : (
          <>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{t.hasErrors}</p>
            </div>

            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportFailedRows(invalidProducts as unknown as { row: number; data: Record<string, unknown>; errors: { field: string; message: string }[] }[], lang)}
              >
                <Download className="mr-2 h-4 w-4" />
                {t.exportFailed}
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold text-sm border-b">
                {t.errorDetails}
              </div>
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {invalidProducts.map((product, idx) => (
                    <div key={idx} className="p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">
                          {t.row} {product.row}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.data.name_en || 'Unnamed product'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {product.errors.map((error, errorIdx) => (
                          <div
                            key={errorIdx}
                            className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded"
                          >
                            <span className="font-medium">{error.field}:</span>{' '}
                            <span className="text-red-700 dark:text-red-300">
                              {error.message}
                            </span>
                            {error.value && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {' '}(value: {String(error.value)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
