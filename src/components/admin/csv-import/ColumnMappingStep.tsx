import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PRODUCT_FIELDS, ColumnMapping, CSVRow } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface ColumnMappingStepProps {
  csvHeaders: string[];
  previewData: CSVRow[];
  mapping: ColumnMapping[];
  onMappingChange: (mapping: ColumnMapping[]) => void;
}

export function ColumnMappingStep({
  csvHeaders,
  previewData,
  mapping,
  onMappingChange,
}: ColumnMappingStepProps) {
  const { lang } = useLanguage();

  const handleMappingChange = (csvColumn: string, productField: string) => {
    const newMapping = mapping.map(m =>
      m.csvColumn === csvColumn
        ? { ...m, productField: productField === 'none' ? null : productField as keyof import('./types').ProductImportData }
        : m
    );
    onMappingChange(newMapping);
  };

  const translations = {
    en: {
      title: 'Column Mapping',
      description: 'Map your CSV columns to product fields. Required fields are marked with a badge.',
      csvColumn: 'CSV Column',
      mapsTo: 'Maps to',
      preview: 'Preview',
      none: 'Do not import',
      required: 'Required',
      autoMapped: 'Auto-mapped',
    },
    ru: {
      title: 'Сопоставление колонок',
      description: 'Сопоставьте колонки CSV с полями товара. Обязательные поля помечены значком.',
      csvColumn: 'Колонка CSV',
      mapsTo: 'Соответствует',
      preview: 'Предпросмотр',
      none: 'Не импортировать',
      required: 'Обязательно',
      autoMapped: 'Авто-сопоставлено',
    },
  };

  const t = translations[lang];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t.description}</p>
      </div>

      <div className="space-y-4">
        {mapping.map((columnMap) => {
          const field = PRODUCT_FIELDS.find(f => f.key === columnMap.productField);
          const isRequired = field?.required || columnMap.required;
          
          return (
            <div key={columnMap.csvColumn} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="font-medium">{t.csvColumn}:</Label>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {columnMap.csvColumn}
                </code>
                {isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    {t.required}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`mapping-${columnMap.csvColumn}`}>{t.mapsTo}</Label>
                <Select
                  value={columnMap.productField || 'none'}
                  onValueChange={(value) => handleMappingChange(columnMap.csvColumn, value)}
                >
                  <SelectTrigger id={`mapping-${columnMap.csvColumn}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">{t.none}</SelectItem>
                    {PRODUCT_FIELDS.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {lang === 'en' ? field.label_en : field.label_ru}
                        {field.required && ' *'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">{t.preview} (first 3 rows):</Label>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 space-y-1">
                  {previewData.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="text-xs font-mono">
                      {String(row[columnMap.csvColumn] || '—')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {lang === 'en' 
            ? 'Make sure all required fields are mapped before proceeding to validation.'
            : 'Убедитесь, что все обязательные поля сопоставлены перед переходом к валидации.'}
        </p>
      </div>
    </div>
  );
}
